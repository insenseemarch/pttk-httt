import { supabase } from '../config/supabase.js';
import { dinhDangNgay, dinhDangNgayGio, dinhDangTien } from '../utils/dinhDang.js';
import { getIO } from '../config/ketNoiSocket.js';

const TRANG_THAI_CHO_GHI_NHAN = ['Đặt cọc thành công', 'Đã cọc', 'Đã thanh toán'];
const TRANG_THAI_SAU_GHI_NHAN = 'Chờ kiểm tra';

function chuanHoaGioiTinh(gioiTinh) {
  const s = String(gioiTinh || '').trim().toLowerCase();
  if (s === 'nam' || s === 'male' || s === 'm') return 'nam';
  if (s === 'nữ' || s === 'nu' || s === 'female' || s === 'f') return 'nu';
  return s;
}

function dinhDangPhongTuDatCoc(datCoc, giuongDatCoc) {
  const phong = datCoc?.Phong;
  if (phong) {
    return {
      maPhong: phong.MaPhong,
      tenPhong: `P.${phong.MaPhong} — ${phong.LoaiPhong}`,
      loaiPhong: phong.LoaiPhong,
      gioiTinhYeuCau: phong.GioiTinhYeuCau,
      sucChuaToiDa: phong.SucChuaToiDa || phong.SucChua || 1,
      tenChiNhanh: phong.ChiNhanh?.TenCN || datCoc?.ChiNhanh?.TenCN || '—',
      maCN: phong.MaCN || datCoc?.MaCN,
    };
  }
  const gd = giuongDatCoc?.[0];
  const p = gd?.Giuong?.Phong;
  if (p) {
    return {
      maPhong: p.MaPhong,
      tenPhong: `P.${p.MaPhong} — ${p.LoaiPhong}`,
      loaiPhong: p.LoaiPhong,
      gioiTinhYeuCau: p.GioiTinhYeuCau,
      sucChuaToiDa: p.SucChuaToiDa || p.SucChua || 1,
      tenChiNhanh: p.ChiNhanh?.TenCN || '—',
      maCN: p.MaCN,
    };
  }
  return {
    maPhong: null,
    tenPhong: 'Chưa xác định',
    loaiPhong: '—',
    gioiTinhYeuCau: null,
    sucChuaToiDa: 1,
    tenChiNhanh: datCoc?.ChiNhanh?.TenCN || '—',
    maCN: datCoc?.MaCN,
  };
}

function mapKhachHang(kh, extra = {}) {
  if (!kh) return null;
  return {
    cccd: String(kh.CCCD),
    hoTen: kh.HoTen || '',
    ngaySinh: kh.NgaySinh ? kh.NgaySinh.split('T')[0] : '',
    gioiTinh: kh.GioiTinh || '',
    quocTich: kh.QuocTich || 'Việt Nam',
    diaChi: kh.DiaChi || '',
    sdt: kh.SDT || '',
    email: kh.Email || '',
    khaNangTaiChinh: kh.KhaNangTaiChinh ?? null,
    ...extra,
  };
}

function mapThanhVien(tv, kh, cccdTruongNhom = null) {
  const laTruongNhom = cccdTruongNhom != null
    ? String(cccdTruongNhom) === String(tv.CCCD)
    : false;
  return {
    cccd: String(tv.CCCD),
    hoTen: kh?.HoTen || '',
    ngaySinh: kh?.NgaySinh ? kh.NgaySinh.split('T')[0] : '',
    gioiTinh: kh?.GioiTinh || '',
    quocTich: kh?.QuocTich || 'Việt Nam',
    diaChi: kh?.DiaChi || '',
    sdt: kh?.SDT || '',
    email: kh?.Email || '',
    laTruongNhom,
    daDoiChieuCCCD: tv.TrangThai === 'Đã đối chiếu CCCD',
    trangThai: tv.TrangThai || 'Đã ghi nhận',
  };
}

async function layYeuCauThueGanNhat(cccd) {
  const { data } = await supabase
    .from('YeuCauThue')
    .select('MaYC, ThoiGianVao, SoNguoiDuKien, GioiTinh, KhuVucMongMuon')
    .eq('CCCD', Number(cccd))
    .order('NgayTao', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

async function layDatCocDayDu(maDatCoc) {
  const { data, error } = await supabase
    .from('DatCoc')
    .select(`
      *,
      KhachHang ( CCCD, HoTen, NgaySinh, GioiTinh, QuocTich, DiaChi, SDT, Email, KhaNangTaiChinh ),
      Phong ( MaPhong, LoaiPhong, SucChua, SucChuaToiDa, GioiTinhYeuCau, MaCN, ChiNhanh ( TenCN, DiaChi ) ),
      ChiNhanh ( MaCN, TenCN, DiaChi ),
      NhomThue (
        MaNhom, SoThanhVienDangKy, SoThanhVienDuDieuKien, HinhThucThue, CCCD,
        ThanhVienNhom (
          CCCD, ThoaDieuKien, LyDoKhongDat, TrangThai,
          KhachHang ( CCCD, HoTen, NgaySinh, GioiTinh, QuocTich, DiaChi, SDT, Email )
        )
      ),
      GiuongDatCoc (
        MaGiuong, SoGiuongCoc,
        Giuong ( MaGiuong, GioiTinhYeuCau, MaPhong, Phong ( MaPhong, LoaiPhong, GioiTinhYeuCau, SucChuaToiDa, MaCN, ChiNhanh ( TenCN ) ) )
      )
    `)
    .eq('MaDatCoc', maDatCoc)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function layDanhSachChoNhanPhong(boLoc = {}) {
  const { timKiem = '', maCN = '', loaiThue = '', page = 1, limit = 20 } = boLoc;
  const tu = (Number(page) - 1) * Number(limit);
  const den = tu + Number(limit) - 1;

  let query = supabase
    .from('DatCoc')
    .select(`
      MaDatCoc, ThoiDiemTao, DatCocThanhCong, SoTienCoc, TrangThai, LoaiThue, SoGiuongThue, MaCN, CCCD, MaNhom,
      KhachHang ( CCCD, HoTen, SDT ),
      Phong ( MaPhong, LoaiPhong, ChiNhanh ( TenCN ) ),
      ChiNhanh ( TenCN ),
      GiuongDatCoc ( MaGiuong, Giuong ( Phong ( MaPhong, LoaiPhong, ChiNhanh ( TenCN ) ) ) )
    `, { count: 'exact' })
    .in('TrangThai', TRANG_THAI_CHO_GHI_NHAN)
    .order('DatCocThanhCong', { ascending: false, nullsFirst: false })
    .range(tu, den);

  if (maCN) query = query.eq('MaCN', Number(maCN));
  if (loaiThue) query = query.eq('LoaiThue', loaiThue);

  const { data, error, count } = await query;
  if (error) throw error;

  let ketQua = await Promise.all((data || []).map(async (dc) => {
    const phong = dinhDangPhongTuDatCoc(dc, dc.GiuongDatCoc);
    const yc = await layYeuCauThueGanNhat(dc.CCCD);
    return {
      maDatCoc: dc.MaDatCoc,
      maPhieu: `PC-${dc.MaDatCoc}`,
      hoTen: dc.KhachHang?.HoTen || '—',
      sdt: dc.KhachHang?.SDT || '—',
      cccd: dc.CCCD ? String(dc.CCCD) : '—',
      phong: phong.tenPhong,
      chiNhanh: phong.tenChiNhanh,
      maCN: dc.MaCN,
      soGiuongThue: dc.SoGiuongThue || 1,
      loaiThue: dc.LoaiThue || 'Thuê giường lẻ',
      soTienCoc: Number(dc.SoTienCoc || 0),
      soTienCocFmt: dinhDangTien(dc.SoTienCoc),
      trangThai: dc.TrangThai,
      ngayDatCoc: dinhDangNgay(dc.DatCocThanhCong || dc.ThoiDiemTao),
      ngayHenNhanPhong: yc?.ThoiGianVao ? dinhDangNgayGio(yc.ThoiGianVao) : dinhDangNgay(dc.DatCocThanhCong),
      laThuNhom: Boolean(dc.MaNhom) || (dc.SoGiuongThue || 1) > 1 || dc.LoaiThue === 'Thuê nguyên phòng',
    };
  }));

  if (timKiem.trim()) {
    const q = timKiem.trim().toLowerCase();
    ketQua = ketQua.filter((item) =>
      item.hoTen.toLowerCase().includes(q)
      || item.sdt.includes(q)
      || item.cccd.includes(q)
      || item.maPhieu.toLowerCase().includes(q)
      || item.phong.toLowerCase().includes(q),
    );
  }

  return {
    danhSach: ketQua,
    tong: count || ketQua.length,
    trang: Number(page),
    gioiHan: Number(limit),
  };
}

export async function layChiTietNhanPhong(maDatCoc) {
  const dc = await layDatCocDayDu(maDatCoc);
  if (!dc) return null;

  const phong = dinhDangPhongTuDatCoc(dc, dc.GiuongDatCoc);
  const yc = await layYeuCauThueGanNhat(dc.CCCD);
  const nhom = dc.NhomThue;
  const thanhVien = (nhom?.ThanhVienNhom || [])
    .filter((tv) => String(tv.CCCD) !== String(dc.CCCD))
    .map((tv) => mapThanhVien(tv, tv.KhachHang, nhom?.CCCD || dc.CCCD));

  const soGiuongThue = dc.SoGiuongThue || 1;
  const laThuNhom = Boolean(dc.MaNhom) || soGiuongThue > 1 || dc.LoaiThue === 'Thuê nguyên phòng';
  const gioiHanNguoi = dc.LoaiThue === 'Thuê nguyên phòng'
    ? (phong.sucChuaToiDa || soGiuongThue)
    : soGiuongThue;

  return {
    maDatCoc: dc.MaDatCoc,
    maPhieu: `PC-${dc.MaDatCoc}`,
    trangThai: dc.TrangThai,
    loaiThue: dc.LoaiThue || 'Thuê giường lẻ',
    soGiuongThue,
    gioiHanNguoi,
    laThuNhom,
    maNhom: dc.MaNhom,
    thongTinDatCoc: {
      soTienCoc: Number(dc.SoTienCoc || 0),
      soTienCocFmt: dinhDangTien(dc.SoTienCoc),
      ngayDatCoc: dinhDangNgay(dc.DatCocThanhCong || dc.ThoiDiemTao),
      ngayHenNhanPhong: yc?.ThoiGianVao ? dinhDangNgayGio(yc.ThoiGianVao) : dinhDangNgay(dc.DatCocThanhCong),
      thoiHanThue: dc.ThoiHanThue || 6,
      hinhThucThanhToan: dc.HinhThucThanhToan || '—',
    },
    phong,
    khachChinh: mapKhachHang(dc.KhachHang, {
      laTruongNhom: laThuNhom,
      daDoiChieuCCCD: String(dc.LyDoXuLy || '').includes('[CCCD_OK]'),
    }),
    thanhVien,
    quyDinh: {
      gioiTinhYeuCau: phong.gioiTinhYeuCau,
      sucChuaToiDa: phong.sucChuaToiDa,
      tenChiNhanh: phong.tenChiNhanh,
      khuVucMongMuon: yc?.KhuVucMongMuon || phong.tenChiNhanh,
    },
    coTheGhiNhan: TRANG_THAI_CHO_GHI_NHAN.includes(dc.TrangThai),
  };
}

async function upsertKhachHang(kh) {
  if (!kh?.cccd || !kh?.hoTen) {
    throw new Error('Thiếu CCCD hoặc họ tên khách hàng');
  }

  const payload = {
    CCCD: Number(kh.cccd),
    HoTen: kh.hoTen.trim(),
    NgaySinh: kh.ngaySinh || null,
    GioiTinh: kh.gioiTinh || null,
    QuocTich: kh.quocTich || 'Việt Nam',
    DiaChi: kh.diaChi || null,
    SDT: kh.sdt || null,
    Email: kh.email || null,
    ThoaDK: true,
  };

  const { data: existing } = await supabase
    .from('KhachHang')
    .select('CCCD')
    .eq('CCCD', Number(kh.cccd))
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from('KhachHang').update(payload).eq('CCCD', Number(kh.cccd));
    if (error) throw error;
  } else {
    const { error } = await supabase.from('KhachHang').insert(payload);
    if (error) throw error;
  }

  return payload;
}

async function damBaoNhomThue(dc, soThanhVien) {
  if (dc.MaNhom) return dc.MaNhom;

  const { data: nhomMoi, error } = await supabase
    .from('NhomThue')
    .insert({
      SoThanhVienDangKy: soThanhVien,
      HinhThucThue: dc.LoaiThue || 'Thuê giường lẻ',
      CCCD: dc.CCCD,
    })
    .select('MaNhom')
    .single();

  if (error) throw error;

  await supabase
    .from('DatCoc')
    .update({ MaNhom: nhomMoi.MaNhom })
    .eq('MaDatCoc', dc.MaDatCoc);

  return nhomMoi.MaNhom;
}

function kiemTraDuLieuNhanPhong(dc, phong, payload) {
  const loi = [];
  const { khachChinh, thanhVien = [], laThuNhom } = payload;

  if (!khachChinh?.cccd) loi.push('Thiếu CCCD người thuê chính');
  if (!khachChinh?.hoTen?.trim()) loi.push('Thiếu họ tên người thuê chính');
  if (!khachChinh?.daDoiChieuCCCD) loi.push('Chưa đối chiếu CCCD người thuê chính');
  if (!khachChinh?.diaChi?.trim()) loi.push('Thiếu địa chỉ thường trú người thuê chính');
  if (!khachChinh?.sdt?.trim()) loi.push('Thiếu SĐT liên hệ người thuê chính');

  const gioiTinhPhong = phong.gioiTinhYeuCau;
  if (gioiTinhPhong && khachChinh?.gioiTinh) {
    if (chuanHoaGioiTinh(khachChinh.gioiTinh) !== chuanHoaGioiTinh(gioiTinhPhong)) {
      loi.push(`Giới tính người thuê chính không phù hợp phòng (yêu cầu: ${gioiTinhPhong})`);
    }
  }

  const danhSach = laThuNhom ? thanhVien : [];
  const tongNguoi = laThuNhom ? 1 + danhSach.length : 1;
  const gioiHan = dc.LoaiThue === 'Thuê nguyên phòng'
    ? (phong.sucChuaToiDa || dc.SoGiuongThue || 1)
    : (dc.SoGiuongThue || 1);

  if (tongNguoi > gioiHan) {
    loi.push(`Số người ở (${tongNguoi}) vượt quá số giường/phòng đã cọc (${gioiHan})`);
  }
  if (laThuNhom && tongNguoi < 1) {
    loi.push('Thuê nhóm cần ít nhất 1 thành viên trong danh sách');
  }

  danhSach.forEach((tv, idx) => {
    if (!tv.cccd) loi.push(`Thành viên #${idx + 1}: thiếu CCCD`);
    if (!tv.hoTen?.trim()) loi.push(`Thành viên #${idx + 1}: thiếu họ tên`);
    if (!tv.daDoiChieuCCCD) loi.push(`Thành viên ${tv.hoTen || `#${idx + 1}`}: chưa đối chiếu CCCD`);
    if (gioiTinhPhong && tv.gioiTinh && chuanHoaGioiTinh(tv.gioiTinh) !== chuanHoaGioiTinh(gioiTinhPhong)) {
      loi.push(`Thành viên ${tv.hoTen}: giới tính không phù hợp phòng (yêu cầu: ${gioiTinhPhong})`);
    }
  });

  const cccdSet = new Set();
  if (khachChinh?.cccd) cccdSet.add(String(khachChinh.cccd));
  danhSach.forEach((tv) => {
    const key = String(tv.cccd);
    if (cccdSet.has(key)) loi.push(`CCCD ${key} bị trùng trong danh sách`);
    cccdSet.add(key);
  });

  if (dc.MaCN && phong.maCN && Number(dc.MaCN) !== Number(phong.maCN)) {
    loi.push('Phòng đặt cọc không thuộc chi nhánh của hồ sơ cọc');
  }

  return loi;
}

async function layMaQuanLyNhanThongBao(dc) {
  if (dc.NVQL) return dc.NVQL;

  if (!dc.MaCN) return null;

  const { data } = await supabase
    .from('NhanVien')
    .select('MaNV')
    .eq('MaCN', dc.MaCN)
    .ilike('VaiTro', '%Quản lý%')
    .limit(1)
    .maybeSingle();

  return data?.MaNV || null;
}

async function taoThongBaoChuyenKiemTraDKLuuTru(dc, phong, hoTenKhach) {
  const nguoiNhan = await layMaQuanLyNhanThongBao(dc);
  const noiDung = [
    `[PC-${dc.MaDatCoc}]`,
    hoTenKhach || 'Khách hàng',
    `đã hoàn tất ghi nhận nhận phòng tại ${phong.tenPhong}.`,
    'Vui lòng kiểm tra điều kiện lưu trú.',
  ].join(' ');

  const { error } = await supabase.from('ThongBaoDatCoc').insert({
    MaDatCoc: dc.MaDatCoc,
    NguoiNhan: nguoiNhan,
    VaiTroNhan: 'Quản lý',
    NoiDung: noiDung,
    DaDoc: false,
  });

  if (error) throw error;

  // Emit socket real-time cho Quản lý
  const io = getIO();
  if (io) {
    io.to('role:QUAN_LY').emit('thong_bao_moi', {
      noiDung,
      loaiSuKien: 'kiem_tra_luu_tru',
      phieuId: dc.MaDatCoc,
    });
  }
}

export async function luuNhapNhanPhong(maDatCoc, payload) {
  const dc = await layDatCocDayDu(maDatCoc);
  if (!dc) throw new Error('Không tìm thấy hồ sơ đặt cọc');
  if (!TRANG_THAI_CHO_GHI_NHAN.includes(dc.TrangThai)) {
    throw new Error('Hồ sơ không ở trạng thái cho phép ghi nhận nhận phòng');
  }

  const phong = dinhDangPhongTuDatCoc(dc, dc.GiuongDatCoc);
  const { khachChinh, thanhVien = [], laThuNhom, ghiChu } = payload;

  await upsertKhachHang(khachChinh);

  const lyDoXuLy = [
    ghiChu || '',
    khachChinh?.daDoiChieuCCCD ? '[CCCD_OK]' : '',
  ].filter(Boolean).join(' ').trim() || null;

  await supabase
    .from('DatCoc')
    .update({ CCCD: Number(khachChinh.cccd), LyDoXuLy: lyDoXuLy })
    .eq('MaDatCoc', maDatCoc);

  if (laThuNhom) {
    const tatCaThanhVien = [khachChinh, ...thanhVien];
    const maNhom = await damBaoNhomThue(dc, tatCaThanhVien.length);

    for (const tv of tatCaThanhVien) {
      await upsertKhachHang(tv);
      const trangThaiTV = tv.daDoiChieuCCCD ? 'Đã đối chiếu CCCD' : 'Đã ghi nhận';
      await supabase
        .from('ThanhVienNhom')
        .upsert({
          CCCD: Number(tv.cccd),
          MaNhom: maNhom,
          TrangThai: trangThaiTV,
          ThoaDieuKien: null,
          LyDoKhongDat: null,
        }, { onConflict: 'CCCD,MaNhom' });
    }

    await supabase
      .from('NhomThue')
      .update({ SoThanhVienDangKy: tatCaThanhVien.length, CCCD: Number(khachChinh.cccd) })
      .eq('MaNhom', maNhom);
  }

  return layChiTietNhanPhong(maDatCoc);
}

export async function xacNhanGhiNhanNhanPhong(maDatCoc, payload, nguoiThucHien = null) {
  const dc = await layDatCocDayDu(maDatCoc);
  if (!dc) throw new Error('Không tìm thấy hồ sơ đặt cọc');
  if (!TRANG_THAI_CHO_GHI_NHAN.includes(dc.TrangThai)) {
    throw new Error('Hồ sơ không ở trạng thái cho phép ghi nhận nhận phòng');
  }

  const phong = dinhDangPhongTuDatCoc(dc, dc.GiuongDatCoc);
  const loi = kiemTraDuLieuNhanPhong(dc, phong, payload);
  if (loi.length) {
    return { ok: false, loi };
  }

  await luuNhapNhanPhong(maDatCoc, payload);

  const { error: errCapNhat } = await supabase
    .from('DatCoc')
    .update({ TrangThai: TRANG_THAI_SAU_GHI_NHAN, CapNhatLuc: new Date().toISOString() })
    .eq('MaDatCoc', maDatCoc);

  if (errCapNhat) throw errCapNhat;

  await supabase.from('LichSuDatCoc').insert({
    MaDatCoc: maDatCoc,
    TrangThaiCu: dc.TrangThai,
    TrangThaiMoi: TRANG_THAI_SAU_GHI_NHAN,
    NguoiThucHien: nguoiThucHien,
    VaiTroThucHien: 'Sale',
    GhiChu: 'Sale đã ghi nhận thông tin nhận phòng — chuyển kiểm tra điều kiện lưu trú',
  });

  const hoTenKhach = payload.khachChinh?.hoTen?.trim() || dc.KhachHang?.HoTen || 'Khách hàng';
  await taoThongBaoChuyenKiemTraDKLuuTru(dc, phong, hoTenKhach);

  return {
    ok: true,
    message: 'Ghi nhận nhận phòng thành công. Đã gửi thông báo cho Quản lý kiểm tra điều kiện lưu trú.',
    trangThaiMoi: TRANG_THAI_SAU_GHI_NHAN,
    buocTiepTheo: '/kiem-tra-luu-tru',
  };
}

export async function xoaThanhVienNhom(maDatCoc, cccd) {
  const dc = await layDatCocDayDu(maDatCoc);
  if (!dc?.MaNhom) throw new Error('Hồ sơ không có nhóm thuê');

  const { error } = await supabase
    .from('ThanhVienNhom')
    .delete()
    .eq('MaNhom', dc.MaNhom)
    .eq('CCCD', Number(cccd));

  if (error) throw error;

  const { count } = await supabase
    .from('ThanhVienNhom')
    .select('*', { count: 'exact', head: true })
    .eq('MaNhom', dc.MaNhom);

  await supabase
    .from('NhomThue')
    .update({ SoThanhVienDangKy: count || 0 })
    .eq('MaNhom', dc.MaNhom);

  return layChiTietNhanPhong(maDatCoc);
}
