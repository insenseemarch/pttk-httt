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
  // Phòng trường hợp dữ liệu bị lỗi encoding UTF-8
  const raw = String(trangThai);
  if (raw.includes('kiá»ƒm') || raw.includes('kiá»\u0083m')) return 'Chờ kiểm tra';
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

const KY_HAN_BUCKETS = [1, 3, 6, 12, 24];

/** Tính số tháng thuê từ ngày bắt đầu → kết thúc, rồi gắn bucket 1/3/6/12/24 gần nhất. */
export function tinhKyHanThang(ngayBD, ngayKT) {
  if (!ngayBD || !ngayKT) return null;
  const start = new Date(ngayBD);
  const end = new Date(ngayKT);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  const months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth()) +
    (end.getDate() >= start.getDate() ? 0 : -1);
  const raw = Math.max(0, months);
  let best = KY_HAN_BUCKETS[0];
  let bestDiff = Math.abs(raw - best);
  for (const b of KY_HAN_BUCKETS) {
    const d = Math.abs(raw - b);
    if (d < bestDiff) {
      best = b;
      bestDiff = d;
    }
  }
  return best;
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
  const {
    maCN = '',
    trangThai = '',
    thang = '',
    phong = '',
    kyHan = '',
    tuKhoa = '',
    page = 1,
    limit = 10,
  } = boLoc;
  const tu = (Number(page) - 1) * Number(limit);
  const den = tu + Number(limit) - 1;

  let query = supabase
    .from('HopDong')
    .select(
      `
      MaHopDong, NgayKy, NgayGioBD, NgayGioKT, TrangThai, GiaThue, KyThanhToan, MaDatCoc,
      KhachHang ( HoTen, SDT, CCCD, Email ),
      ChiTiet (
        Giuong (
          MaGiuong, MaPhong,
          Phong ( MaPhong, MaCN, LoaiPhong, ChiNhanh ( TenCN ) )
        )
      ),
      PhieuDoiSoat ( TyLeHoanTien, TrangThai, SoTienHoanThuc, NgayDKTraPhong, LoaiHinhTraPhong, LyDoTraPhong )
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
    const tenCN = hd.ChiTiet?.[0]?.Giuong?.Phong?.ChiNhanh?.TenCN || '—';
    const sapHetHan = laSapHetHan(hd.NgayGioKT);
    const kyHanThang = tinhKyHanThang(hd.NgayGioBD || hd.NgayKy, hd.NgayGioKT);

    const pdsInfo = phieu
      ? {
          soTienHoanThuc: Number(phieu.SoTienHoanThuc) || 0,
          ngayLap: phieu.NgayDKTraPhong,
          loaiHinhTraPhong: phieu.LoaiHinhTraPhong,
          lyDo: phieu.LyDoTraPhong,
          trangThaiPds: phieu.TrangThai,
        }
      : null;

    return {
      maHopDong: hd.MaHopDong,
      maHD: `HD-${String(hd.MaHopDong).padStart(5, '0')}`,
      maChungTu: `HĐ-${hd.MaHopDong}`,
      hoTen: hd.KhachHang?.HoTen || '—',
      sdt: hd.KhachHang?.SDT || '',
      email: hd.KhachHang?.Email || '',
      cccd: hd.KhachHang?.CCCD || '',
      phong: phongStr,
      maCN: maCNHop,
      tenCN,
      ngayBatDau: dinhDangNgay(hd.NgayGioBD || hd.NgayKy),
      ngayHetHan: dinhDangNgay(hd.NgayGioKT),
      ngayBatDauISO: hd.NgayGioBD || hd.NgayKy,
      ngayKetThucISO: hd.NgayGioKT,
      sapHetHan,
      kyHanThang,
      tyLeHoanCoc: tyLeHoan,
      trangThai: chuanHoaTrangThai(hd.TrangThai),
      trangThaiGoc: hd.TrangThai,
      giaThue: dinhDangTien(hd.GiaThue),
      giaThueSo: Number(hd.GiaThue) || 0,
      kyThanhToan: hd.KyThanhToan || '—',
      maDatCoc: hd.MaDatCoc,
      pdsInfo,
    };
  });

  const { data: datCocData } = await supabase
    .from('DatCoc')
    .select(`
      MaDatCoc, ThoiDiemTao, TrangThai, SoTienCoc,
      KhachHang ( HoTen, SDT, CCCD ),
      PhieuDoiSoat!inner ( TyLeHoanTien, TrangThai, SoTienHoanThuc, NgayDKTraPhong )
    `);

  const { data: giuongDatCocData } = await supabase
    .from('GiuongDatCoc')
    .select('MaDatCoc, Giuong ( Phong ( MaPhong, MaCN, ChiNhanh ( TenCN ) ) )');

  const gdcMap = {};
  (giuongDatCocData || []).forEach(g => {
    if (!gdcMap[g.MaDatCoc]) gdcMap[g.MaDatCoc] = [];
    gdcMap[g.MaDatCoc].push(g);
  });

  let danhSachDatCoc = (datCocData || []).map((d) => {
    const phieuFirst = Array.isArray(d.PhieuDoiSoat) ? d.PhieuDoiSoat[0] : d.PhieuDoiSoat;
    const tyLeHoan = phieuFirst?.TyLeHoanTien != null ? `${phieuFirst.TyLeHoanTien}%` : '—';
    const pdsInfo = phieuFirst ? {
      soTienHoanThuc: Number(phieuFirst.SoTienHoanThuc) || 0,
      ngayLap: phieuFirst.NgayDKTraPhong,
    } : null;

    const gdc = gdcMap[d.MaDatCoc] || [];
    const maCNPC = gdc[0]?.Giuong?.Phong?.MaCN || '';
    
    return {
      maHopDong: d.MaDatCoc,
      maHD: `PC-${d.MaDatCoc}`,
      hoTen: d.KhachHang?.HoTen || '—',
      sdt: d.KhachHang?.SDT || '',
      phong: 'Chưa gán phòng',
      maCN: maCNPC,
      ngayBatDau: dinhDangNgay(d.ThoiDiemTao),
      ngayHetHan: '—',
      sapHetHan: false,
      tyLeHoanCoc: tyLeHoan,
      trangThai: chuanHoaTrangThai(phieuFirst?.TrangThai || d.TrangThai),
      giaThue: dinhDangTien(d.SoTienCoc),
      pdsInfo
    };
  });

  if (trangThai) {
    const mapTrangThai = { 'Hiệu lực': 'Đang hiệu lực', 'Thanh lý': 'Đã thanh lý', 'Hủy': 'Đã hủy' };
    const t = mapTrangThai[trangThai] || trangThai;
    danhSachDatCoc = danhSachDatCoc.filter(d => d.trangThai === t);
  }

  danhSach = [...danhSach, ...danhSachDatCoc];

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
  if (kyHan) {
    const ky = Number(kyHan);
    danhSach = danhSach.filter((h) => h.kyHanThang === ky);
  }
  if (tuKhoa.trim()) {
    const q = tuKhoa.trim().toLowerCase();
    danhSach = danhSach.filter(
      (h) =>
        String(h.maHD).toLowerCase().includes(q) ||
        String(h.maHopDong).includes(q) ||
        String(h.hoTen).toLowerCase().includes(q) ||
        String(h.sdt).includes(q),
    );
  }

  return {
    danhSach,
    tong: count || 0,
    trang: Number(page),
    gioiHan: Number(limit),
  };
}

export async function layChiTietHopDong(maHopDong) {
  const id = Number(maHopDong);
  if (!Number.isFinite(id)) return null;

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
    .eq('MaHopDong', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    maHopDong: data.MaHopDong,
    maHD: `HD-${String(data.MaHopDong).padStart(5, '0')}`,
    maChungTu: `HĐ-${data.MaHopDong}`,
    hoTen: data.KhachHang?.HoTen,
    sdt: data.KhachHang?.SDT,
    email: data.KhachHang?.Email,
    cccd: data.KhachHang?.CCCD,
    phong: layPhongTuChiTiet(data.ChiTiet),
    tenCN: data.ChiTiet?.[0]?.Giuong?.Phong?.ChiNhanh?.TenCN || '—',
    loaiPhong: data.ChiTiet?.[0]?.Giuong?.Phong?.LoaiPhong || '—',
    maGiuong: data.ChiTiet?.[0]?.Giuong?.MaGiuong,
    ngayBatDau: dinhDangNgay(data.NgayGioBD || data.NgayKy),
    ngayHetHan: dinhDangNgay(data.NgayGioKT),
    ngayBatDauISO: data.NgayGioBD || data.NgayKy,
    ngayKetThucISO: data.NgayGioKT,
    kyHanThang: tinhKyHanThang(data.NgayGioBD || data.NgayKy, data.NgayGioKT),
    trangThai: chuanHoaTrangThai(data.TrangThai),
    trangThaiGoc: data.TrangThai,
    giaThue: dinhDangTien(data.GiaThue),
    giaThueSo: Number(data.GiaThue) || 0,
    kyThanhToan: data.KyThanhToan || '—',
    maDatCoc: data.MaDatCoc,
    phieuDoiSoat: data.PhieuDoiSoat || [],
  };
}
