import { supabase } from '../config/supabase.js';
import { dinhDangNgay, dinhDangTien } from '../utils/dinhDang.js';

function layPhongTuChiTiet(chiTiets) {
  const ct = chiTiets?.[0];
  const giuong = ct?.Giuong;
  if (!giuong) return '—';
  const phong = giuong.Phong;
  if (phong) return `P.${phong.MaPhong}`;
  return `Giường #${giuong.MaGiuong}`;
}

function chuanHoaTrangThai(trangThai) {
  if (!trangThai) return '—';
  if (trangThai === 'Đang hiệu lực') return 'Hiệu lực';
  if (trangThai === 'Đã thanh lý' || trangThai === 'Thanh lý') return 'Thanh lý';
  if (trangThai === 'Đã hủy' || trangThai === 'Hủy') return 'Hủy';
  return trangThai;
}

function laSapHetHan(ngayKT, soNgay = 30) {
  if (!ngayKT) return false;
  const diff = (new Date(ngayKT) - Date.now()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= soNgay;
}

export async function demHopDongSapHetHan(soNgay = 30) {
  const homNay = new Date();
  const han = new Date();
  han.setDate(han.getDate() + soNgay);

  const { data, error } = await supabase
    .from('HopDong')
    .select('MaHopDong, NgayGioKT')
    .eq('TrangThai', 'Đang hiệu lực')
    .gte('NgayGioKT', homNay.toISOString())
    .lte('NgayGioKT', han.toISOString());

  if (error) throw error;
  return data?.length || 0;
}

export async function layDanhSachHopDong(boLoc = {}) {
  const { maCN = '', trangThai = '', thang = '', phong = '', page = 1, limit = 10 } = boLoc;
  const tu = (Number(page) - 1) * Number(limit);
  const den = tu + Number(limit) - 1;

  let query = supabase
    .from('HopDong')
    .select(
      `
      MaHopDong, NgayKy, NgayGioBD, NgayGioKT, TrangThai, GiaThue,
      KhachHang ( HoTen, SDT, CCCD ),
      ChiTiet (
        Giuong (
          MaGiuong, MaPhong,
          Phong ( MaPhong, MaCN, ChiNhanh ( TenCN ) )
        )
      ),
      PhieuDoiSoat ( TyLeHoanTien, TrangThai, SoTienHoanThuc, NgayDKTraPhong )
    `,
      { count: 'exact' },
    )
    .order('NgayKy', { ascending: false })
    .range(tu, den);

  if (trangThai) {
    const mapTrangThai = {
      'Hiệu lực': 'Đang hiệu lực',
      'Thanh lý': 'Đã thanh lý',
      'Hủy': 'Đã hủy',
    };
    query = query.eq('TrangThai', mapTrangThai[trangThai] || trangThai);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  let danhSach = (data || []).map((hd) => {
    const phieu = hd.PhieuDoiSoat?.[0];
    const tyLeHoan = phieu?.TyLeHoanTien != null ? `${phieu.TyLeHoanTien}%` : '—';
    const phongStr = layPhongTuChiTiet(hd.ChiTiet);
    const maCNHop = hd.ChiTiet?.[0]?.Giuong?.Phong?.MaCN;
    const sapHetHan = laSapHetHan(hd.NgayGioKT);

    const pdsInfo = phieu ? {
      soTienHoanThuc: Number(phieu.SoTienHoanThuc) || 0,
      ngayLap: phieu.NgayDKTraPhong,
    } : null;

    return {
      maHopDong: hd.MaHopDong,
      maHD: `HD-${String(hd.MaHopDong).padStart(5, '0')}`,
      hoTen: hd.KhachHang?.HoTen || '—',
      sdt: hd.KhachHang?.SDT || '',
      phong: phongStr,
      maCN: maCNHop,
      ngayBatDau: dinhDangNgay(hd.NgayGioBD || hd.NgayKy),
      ngayHetHan: dinhDangNgay(hd.NgayGioKT),
      sapHetHan,
      tyLeHoanCoc: tyLeHoan,
      trangThai: chuanHoaTrangThai(hd.TrangThai),
      giaThue: dinhDangTien(hd.GiaThue),
      pdsInfo
    };
  });

  if (maCN) danhSach = danhSach.filter((h) => String(h.maCN) === String(maCN));
  if (phong.trim()) {
    const q = phong.trim().toLowerCase();
    danhSach = danhSach.filter((h) => h.phong.toLowerCase().includes(q));
  }
  if (thang) {
    danhSach = danhSach.filter((h) => {
      const d = h.ngayHetHan.split('/').reverse().join('-');
      return d.startsWith(thang);
    });
  }

  return {
    danhSach,
    tong: count || 0,
    trang: Number(page),
    gioiHan: Number(limit),
  };
}

export async function layChiTietHopDong(maHopDong) {
  const { data, error } = await supabase
    .from('HopDong')
    .select(
      `
      *,
      KhachHang ( HoTen, SDT, Email, CCCD ),
      ChiTiet (
        SoLuong, GiaThucTe,
        Giuong ( MaGiuong, MaPhong, Phong ( LoaiPhong, ChiNhanh ( TenCN ) ) )
      ),
      PhieuDoiSoat ( * )
    `,
    )
    .eq('MaHopDong', Number(maHopDong))
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    maHopDong: data.MaHopDong,
    maHD: `HD-${String(data.MaHopDong).padStart(5, '0')}`,
    hoTen: data.KhachHang?.HoTen,
    sdt: data.KhachHang?.SDT,
    email: data.KhachHang?.Email,
    phong: layPhongTuChiTiet(data.ChiTiet),
    ngayBatDau: dinhDangNgay(data.NgayGioBD || data.NgayKy),
    ngayHetHan: dinhDangNgay(data.NgayGioKT),
    trangThai: chuanHoaTrangThai(data.TrangThai),
    giaThue: dinhDangTien(data.GiaThue),
    kyThanhToan: data.KyThanhToan || '—',
    phieuDoiSoat: data.PhieuDoiSoat || [],
  };
}
