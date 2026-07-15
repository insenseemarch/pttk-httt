import { supabase } from './config/supabase.js';

const SAMPLES = [
  {
    cccd: '079203001234',
    hoTen: 'Nguyễn Thị Minh Anh',
    ngaySinh: '2003-04-18',
    gioiTinh: 'Nữ',
    diaChi: '18 Nguyễn Thị Minh Khai, Quận 1, Thành phố Hồ Chí Minh',
    sdt: '0912345678',
    email: 'minh.anh.datcoc@example.com',
    khaNangTaiChinh: 15000000,
    loaiThue: 'Thuê giường lẻ',
    soNguoiDuKien: 2,
    soThang: 6,
    nganSach: 9000000,
    yeuCau: 'Dữ liệu mẫu: thuê hai giường gần nhau, khu vực yên tĩnh.',
  },
  {
    cccd: '079198005678',
    hoTen: 'Trần Quốc Bảo',
    ngaySinh: '1998-09-12',
    gioiTinh: 'Nam',
    diaChi: '42 Lê Văn Sỹ, Quận 3, Thành phố Hồ Chí Minh',
    sdt: '0987654321',
    email: 'quoc.bao.datcoc@example.com',
    khaNangTaiChinh: 22000000,
    loaiThue: 'Thuê nguyên phòng',
    soNguoiDuKien: 1,
    soThang: 12,
    nganSach: 18000000,
    yeuCau: 'Dữ liệu mẫu: thuê nguyên phòng, ưu tiên phòng thoáng.',
  },
];

function layDuLieu(result, context) {
  if (result.error) throw new Error(`${context}: ${result.error.message}`);
  return result.data;
}

function themThang(date, months) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result.toISOString();
}

async function layPhongMau(sample) {
  const [roomResult, lockResult] = await Promise.all([
    supabase
      .from('Phong')
      .select('MaPhong, MaCN, LoaiPhong, SucChuaToiDa, GioiTinhYeuCau, Giuong(MaGiuong, TinhTrang)')
      .eq('GioiTinhYeuCau', sample.gioiTinh)
      .order('SucChuaToiDa'),
    supabase.from('KhoaGiuongDatCoc').select('MaGiuong'),
  ]);
  const rooms = layDuLieu(roomResult, `Đọc phòng ${sample.gioiTinh}`) || [];
  const locked = new Set((layDuLieu(lockResult, 'Đọc giường đang giữ chỗ') || []).map((item) => Number(item.MaGiuong)));
  const room = rooms.find((item) => {
    const beds = item.Giuong || [];
    const available = beds.filter((bed) => bed.TinhTrang && !locked.has(Number(bed.MaGiuong)));
    if (sample.loaiThue === 'Thuê nguyên phòng') {
      return beds.length === Number(item.SucChuaToiDa) && available.length === beds.length;
    }
    return available.length >= sample.soNguoiDuKien;
  });
  if (!room) throw new Error(`Không tìm thấy phòng trống phù hợp cho ${sample.hoTen}`);
  return room;
}

async function taoDuLieuMau(sample, room, maNV) {
  const numericCCCD = String(sample.cccd);
  layDuLieu(await supabase.from('KhachHang').upsert({
    CCCD: numericCCCD,
    HoTen: sample.hoTen,
    NgaySinh: sample.ngaySinh,
    GioiTinh: sample.gioiTinh,
    QuocTich: 'Việt Nam',
    DiaChi: sample.diaChi,
    SDT: sample.sdt,
    Email: sample.email,
    KhaNangTaiChinh: sample.khaNangTaiChinh,
    ThoaDK: true,
  }, { onConflict: 'CCCD' }), `Tạo khách hàng ${sample.hoTen}`);

  const existing = layDuLieu(await supabase
    .from('YeuCauThue')
    .select('MaYC')
    .eq('CCCD', numericCCCD)
    .eq('YeuCau', sample.yeuCau)
    .order('MaYC', { ascending: false })
    .limit(1)
    .maybeSingle(), `Tìm yêu cầu thuê của ${sample.hoTen}`);
  const start = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
  const requestData = {
    SoNguoiDuKien: sample.soNguoiDuKien,
    GioiTinh: sample.gioiTinh,
    KhuVucMongMuon: 'Thành phố Hồ Chí Minh',
    LoaiPhong: Number(room.LoaiPhong),
    LoaiThue: sample.loaiThue,
    NganSach: sample.nganSach,
    ThoiGianVao: start.toISOString(),
    ThoiGianThue: themThang(start, sample.soThang),
    YeuCau: sample.yeuCau,
    TrangThai: true,
    MaNV: maNV,
    CCCD: numericCCCD,
  };
  let yeuCau;
  if (existing?.MaYC) {
    yeuCau = layDuLieu(await supabase
      .from('YeuCauThue')
      .update(requestData)
      .eq('MaYC', existing.MaYC)
      .select('MaYC')
      .single(), `Cập nhật yêu cầu thuê của ${sample.hoTen}`);
  } else {
    yeuCau = layDuLieu(await supabase
      .from('YeuCauThue')
      .insert({ ...requestData, NgayTao: new Date().toISOString() })
      .select('MaYC')
      .single(), `Tạo yêu cầu thuê của ${sample.hoTen}`);
  }

  const appointment = layDuLieu(await supabase
    .from('LichXemPhong')
    .select('MaLich')
    .eq('MaYC', yeuCau.MaYC)
    .order('MaLich', { ascending: false })
    .limit(1)
    .maybeSingle(), `Tìm lịch xem phòng của ${sample.hoTen}`);
  const appointmentData = {
    NgayGioHen: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    KetQua: 'Đã chọn phòng',
    GhiChu: 'Khách đã xem và chọn phòng này để lập phiếu đặt cọc.',
    MaYC: yeuCau.MaYC,
    MaPhong: room.MaPhong,
  };
  if (appointment?.MaLich) {
    layDuLieu(await supabase.from('LichXemPhong').update(appointmentData).eq('MaLich', appointment.MaLich), `Cập nhật lịch của ${sample.hoTen}`);
  } else {
    layDuLieu(await supabase.from('LichXemPhong').insert(appointmentData), `Tạo lịch của ${sample.hoTen}`);
  }

  return { cccd: sample.cccd, khachHang: sample.hoTen, loaiThue: sample.loaiThue, maPhong: room.MaPhong };
}

async function run() {
  const sale = layDuLieu(await supabase
    .from('NhanVien')
    .select('MaNV')
    .ilike('VaiTro', '%Sale%')
    .order('MaNV')
    .limit(1)
    .maybeSingle(), 'Tìm nhân viên Sale');
  const results = [];
  for (const sample of SAMPLES) {
    const room = await layPhongMau(sample);
    results.push(await taoDuLieuMau(sample, room, sale?.MaNV || null));
  }
  console.table(results);
  console.log('Đã tạo dữ liệu mẫu yêu cầu thuê cho luồng đặt cọc. Có thể chạy lại an toàn.');
}

run().catch((error) => {
  console.error('Tạo dữ liệu mẫu thất bại:', error.message);
  process.exitCode = 1;
});
