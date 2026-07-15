import { supabase } from '../config/supabase.js';
import { dinhDangNgay, dinhDangTien } from '../utils/dinhDang.js';

function chuanHoaChuoi(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

function layTenLoaiPhong(phong = {}) {
  return phong.LoaiPhongInfo?.TenLoaiPhong
    || phong.LoaiPhong?.TenLoaiPhong
    || (Number.isFinite(Number(phong.LoaiPhong)) ? `Loại phòng ${phong.LoaiPhong}` : String(phong.LoaiPhong || '—'));
}

async function layGiuongDangThue() {
  const { data, error } = await supabase
    .from('ChiTiet')
    .select('MaGiuong, HopDong!inner(TrangThai)')
    .in('HopDong.TrangThai', [
      'Đang hiệu lực', 'Chờ kiểm tra', 'Chờ xác nhận đối soát',
      'Khách đồng ý đối soát (Chờ TT)', 'Chờ thanh toán',
      'Chờ thanh toán thêm', 'Chờ thanh lý', 'Chờ hoàn cọc', 'Chờ đối soát',
    ]);

  if (error) throw error;
  return new Set((data || []).map((ct) => ct.MaGiuong));
}

async function layGiuongDatCoc() {
  const { data, error } = await supabase
    .from('GiuongDatCoc')
    .select('MaGiuong, MaDatCoc, NgayHetHan, DatCoc!inner(TrangThai)')
    .in('DatCoc.TrangThai', [
      'Đã cọc', 'Đã thanh toán', 'Đặt cọc thành công',
      // Tương thích dữ liệu cũ nếu migration chưa chạy hết.
      'DA_XAC_NHAN',
    ]);

  if (error) throw error;
  const map = new Map();
  (data || []).forEach((gd) => {
    map.set(gd.MaGiuong, { ngayHetHan: gd.NgayHetHan, maDatCoc: gd.MaDatCoc });
  });
  return map;
}

function xacDinhTrangThaiPhong(phong, giuongs, giuongThue, giuongCoc) {
  if (!giuongs.length) return 'Đóng cửa';
  const tong = giuongs.length;
  let thue = 0;
  let coc = 0;
  giuongs.forEach((g) => {
    if (giuongThue.has(g.MaGiuong)) thue += 1;
    else if (giuongCoc.has(g.MaGiuong)) coc += 1;
  });
  const trong = tong - thue - coc;
  if (thue === tong) return 'Đang thuê';
  if (coc > 0 && thue === 0 && trong === tong - coc) return 'Đã đặt cọc';
  if (trong === tong) return 'Trống';
  if (thue > 0) return 'Đang thuê';
  return 'Trống';
}

function xacDinhTrangThaiGiuong(giuong, giuongThue, giuongCoc) {
  if (giuongThue.has(giuong.MaGiuong)) return 'Đang thuê';
  if (giuongCoc.has(giuong.MaGiuong)) return 'Đã đặt cọc';
  return giuong.TinhTrang === false ? 'Đang sử dụng' : 'Trống';
}

export async function layThongKePhongGiuong() {
  const [{ count: tongPhong }, giuongThue, giuongCoc] = await Promise.all([
    supabase.from('Phong').select('MaPhong', { count: 'exact', head: true }),
    layGiuongDangThue(),
    layGiuongDatCoc(),
  ]);

  const { data: phongs, error } = await supabase.from('Phong').select('MaPhong, TinhTrang, Giuong(MaGiuong)');
  if (error) throw error;

  let phongTrong = 0;
  let dangDatCoc = 0;
  let tongSlot = 0;
  let daDung = 0;

  (phongs || []).forEach((p) => {
    const giuongs = p.Giuong || [];
    const tong = giuongs.length || 1;
    tongSlot += tong;
    const trangThai = xacDinhTrangThaiPhong(p, giuongs, giuongThue, giuongCoc);
    if (trangThai === 'Trống') phongTrong += 1;
    if (trangThai === 'Đã đặt cọc') dangDatCoc += 1;
    giuongs.forEach((g) => {
      if (giuongThue.has(g.MaGiuong) || giuongCoc.has(g.MaGiuong)) daDung += 1;
    });
  });

  const tyLeLapDay = tongSlot ? Math.round((daDung / tongSlot) * 100) : 0;

  return {
    tongPhong: tongPhong || 0,
    phongTrong,
    dangDatCoc,
    tyLeLapDay,
  };
}

export async function layDanhSachPhong(boLoc = {}) {
  const { maCN = '', trangThai = '', loaiPhong = '', timKiem = '', page = 1, limit = 12 } = boLoc;
  const tu = (Number(page) - 1) * Number(limit);
  const den = tu + Number(limit) - 1;

  let query = supabase
    .from('Phong')
    .select(
      `
      MaPhong, LoaiPhong, SucChuaConLai, SucChuaToiDa, GioiTinhYeuCau, GiaThue, TinhTrang, MaCN,
      LoaiPhongInfo:LoaiPhong(TenLoaiPhong),
      ChiNhanh ( TenCN ),
      Giuong ( MaGiuong, GioiTinhYeuCau, GiaThue, TinhTrang )
    `,
      { count: 'exact' },
    )
    .order('MaPhong', { ascending: true })
    .range(tu, den);

  if (maCN) query = query.eq('MaCN', Number(maCN));
  if (timKiem.trim()) {
    const q = timKiem.trim();
    if (/^\d+$/.test(q)) query = query.eq('MaPhong', Number(q));
  }

  const [giuongThue, giuongCoc, phongRes] = await Promise.all([
    layGiuongDangThue(),
    layGiuongDatCoc(),
    query,
  ]);

  if (phongRes.error) throw phongRes.error;

  const loaiPhongKey = chuanHoaChuoi(loaiPhong);
  let danhSach = (phongRes.data || [])
    .filter((p) => !loaiPhongKey || chuanHoaChuoi(layTenLoaiPhong(p)).includes(loaiPhongKey))
    .map((p) => {
    const giuongs = p.Giuong || [];
    const tong = giuongs.length || p.SucChuaToiDa || p.SucChuaConLai || p.SucChua || 1;
    let daDung = 0;
    let hetHanCoc = null;
    giuongs.forEach((g) => {
      if (giuongThue.has(g.MaGiuong)) daDung += 1;
      else if (giuongCoc.has(g.MaGiuong)) {
        daDung += 1;
        hetHanCoc = giuongCoc.get(g.MaGiuong)?.ngayHetHan;
      }
    });
    const trangThaiPhong = xacDinhTrangThaiPhong(p, giuongs, giuongThue, giuongCoc);
    const tyLe = Math.round((daDung / tong) * 100);

    return {
      maPhong: p.MaPhong,
      loaiPhong: layTenLoaiPhong(p),
      gioiTinhYeuCau: p.GioiTinhYeuCau || 'Chưa phân loại',
      sucChua: p.SucChuaToiDa || tong,
      giaThue: dinhDangTien(p.GiaThue),
      giaThueSo: Number(p.GiaThue || 0),
      chiNhanh: p.ChiNhanh?.TenCN || '—',
      maCN: p.MaCN,
      trangThai: trangThaiPhong,
      hienTrang: `${daDung}/${tong}`,
      tyLe,
      soGiuongTrong: tong - daDung,
      hetHanCoc: hetHanCoc ? dinhDangNgay(hetHanCoc) : null,
      soGiuong: giuongs.length,
      danhSachGiuong: giuongs
        .map((g) => ({
          maGiuong: g.MaGiuong,
          trangThai: xacDinhTrangThaiGiuong(g, giuongThue, giuongCoc),
        }))
        .sort((a, b) => Number(a.maGiuong) - Number(b.maGiuong)),
    };
  });

  if (trangThai) {
    danhSach = danhSach.filter((p) => p.trangThai === trangThai);
  }

  return {
    danhSach,
    tong: phongRes.count || 0,
    trang: Number(page),
    gioiHan: Number(limit),
  };
}

export async function layDanhSachChiNhanh() {
  const { data, error } = await supabase.from('ChiNhanh').select('MaCN, TenCN').order('TenCN');
  if (error) throw error;
  return data || [];
}
