import { supabase } from '../config/supabase.js';

function dinhDangPhong(giuongDatCoc) {
  if (!giuongDatCoc?.length) return 'Chưa xác định';
  const gd = giuongDatCoc[0];
  const phong = gd.Giuong?.MaPhong;
  const maGiuong = gd.MaGiuong;
  if (phong && maGiuong) return `P.${phong} - Giường #${maGiuong}`;
  if (phong) return `P.${phong}`;
  return 'Chưa xác định';
}

function dinhDangThoiGian(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return isoStr;
  const gio = String(d.getHours()).padStart(2, '0');
  const phut = String(d.getMinutes()).padStart(2, '0');
  const ngay = String(d.getDate()).padStart(2, '0');
  const thang = String(d.getMonth() + 1).padStart(2, '0');
  return `${gio}:${phut} - ${ngay}/${thang}`;
}

function dinhDangTien(soTien) {
  return `${Number(soTien || 0).toLocaleString('vi-VN')}đ`;
}

export async function layThongKeDashboard() {
  const [
    { count: phongTrong, error: errPhong },
    { count: giuongTrong, error: errGiuong },
    { count: datCoc, error: errCoc },
    { count: dangThue, error: errThue },
    { count: traPhongCho, error: errTra },
  ] = await Promise.all([
    supabase.from('Phong').select('MaPhong', { count: 'exact', head: true }).eq('TinhTrang', true),
    supabase.from('Giuong').select('MaGiuong', { count: 'exact', head: true }).eq('TinhTrang', true),
    supabase.from('DatCoc').select('MaDatCoc', { count: 'exact', head: true }).in('TrangThai', ['Đã cọc', 'Đã thanh toán', 'Hoàn tất', 'Đặt cọc thành công']),
    supabase.from('HopDong').select('MaHopDong', { count: 'exact', head: true }).eq('TrangThai', 'Đang hiệu lực'),
    supabase.from('PhieuDoiSoat').select('MaPhieu', { count: 'exact', head: true }).eq('TrangThai', 'Chờ xử lý'),
  ]);

  if (errPhong) throw errPhong;
  if (errGiuong) throw errGiuong;
  if (errCoc) throw errCoc;
  if (errThue) throw errThue;
  if (errTra) throw errTra;

  return {
    phongTrong: (phongTrong || 0) + (giuongTrong || 0),
    daDatCoc: datCoc || 0,
    dangThue: dangThue || 0,
    traPhongChoXuLy: traPhongCho || 0,
  };
}

export async function layCocChoDuyet(gioiHan = 10) {
  const { data, error } = await supabase
    .from('DatCoc')
    .select(`
      MaDatCoc,
      ThoiDiemTao,
      SoTienCoc,
      TrangThai,
      KhachHang ( HoTen, SDT ),
      GiuongDatCoc (
        MaGiuong,
        Giuong ( MaPhong )
      )
    `)
    .in('TrangThai', ['Chờ duyệt', 'Chờ xác nhận', 'Chờ thanh toán', 'Chờ duyệt phòng', 'Chờ tính tiền cọc', 'Chờ khách chuyển khoản', 'Chờ duyệt cọc', 'Chứng từ bị từ chối'])
    .order('ThoiDiemTao', { ascending: false })
    .limit(gioiHan);

  if (error) throw error;

  return (data || []).map((coc) => ({
    maDatCoc: coc.MaDatCoc,
    hoTen: coc.KhachHang?.HoTen || 'Khách hàng',
    sdt: coc.KhachHang?.SDT || '',
    phong: dinhDangPhong(coc.GiuongDatCoc),
    soTien: dinhDangTien(coc.SoTienCoc),
    thoiGian: dinhDangThoiGian(coc.ThoiDiemTao),
    trangThai: coc.TrangThai,
  }));
}

export async function layLichTraPhongSapToi(gioiHan = 5) {
  const homNay = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('PhieuDoiSoat')
    .select(`
      MaPhieu,
      NgayDKTraPhong,
      TrangThai,
      HopDong (
        MaHopDong,
        KhachHang ( HoTen ),
        ChiTiet (
          Giuong ( MaPhong, MaGiuong )
        )
      )
    `)
    .gte('NgayDKTraPhong', homNay)
    .in('TrangThai', ['Chờ xử lý', 'Đã đăng ký', 'Sắp tới'])
    .order('NgayDKTraPhong', { ascending: true })
    .limit(gioiHan);

  if (error) throw error;

  const homNayDate = new Date();
  homNayDate.setHours(0, 0, 0, 0);
  const tuanSau = new Date(homNayDate);
  tuanSau.setDate(tuanSau.getDate() + 7);

  return (data || []).map((phieu) => {
    const ngay = new Date(phieu.NgayDKTraPhong);
    const ngayNum = ngay.getDate();
    const khach = phieu.HopDong?.KhachHang?.HoTen || 'Khách hàng';
    const chiTiet = phieu.HopDong?.ChiTiet?.[0];
    const phongStr = chiTiet?.Giuong
      ? `Phòng ${chiTiet.Giuong.MaPhong} - Giường #${chiTiet.Giuong.MaGiuong}`
      : 'Kết thúc hợp đồng';

    let nhan = 'Sắp tới';
    if (ngay <= tuanSau) nhan = 'Sắp tới';
    else nhan = 'Tuần sau';

    return {
      maPhieu: phieu.MaPhieu,
      ngay: ngayNum,
      hoTen: khach,
      phong: phongStr,
      gio: '12:00 PM',
      nhan,
    };
  });
}

export async function demCocChoDuyet() {
  const { count, error } = await supabase
    .from('DatCoc')
    .select('MaDatCoc', { count: 'exact', head: true })
    .in('TrangThai', ['Chờ duyệt', 'Chờ xác nhận', 'Chờ thanh toán', 'Chờ duyệt phòng', 'Chờ tính tiền cọc', 'Chờ khách chuyển khoản', 'Chờ duyệt cọc', 'Chứng từ bị từ chối']);

  if (error) throw error;
  return count || 0;
}
