import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { initSocket, getIO } from './config/ketNoiSocket.js';
import { supabase } from './config/supabase.js';
import stayCheckRoutes from './routes/stayCheck.routes.js';
import nhanPhongRoutes from './routes/nhanPhong.routes.js';
import contractRoutes from './routes/contract.routes.js';
import handoverRoutes from './routes/handover.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import liquidationRoutes from './routes/liquidation.routes.js';
import datCocRoutes, { huyDatCocQuaHan, TRANG_THAI_COC } from './routes/datCoc.routes.js';
import { ganRouteAuthDashboard } from './routes/authDashboard.js';
import { ganRouteQuanTri } from './routes/quanTri.js';
import { syncPhongGiuong } from './syncPhongGiuong.js';
import { dinhDangCCCD } from './utils/dinhDang.js';
import {
  layMaDatCocTuPds,
  mapDatCocRaDTO,
  mapHopDongRaDTO,
  taoMetaDatCoc,
  tinhSoTienQuyetToan,
  tinhTyLeHoanCoc,
  locKhauTruThat,
} from './checkoutHelpers.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Helper function to calculate end date from lease duration
function tinhNgayKetThuc(ngayVaoStr, soThangStr) {
  const ngayVao = new Date(ngayVaoStr);
  const soThang = parseInt(soThangStr) || 6;
  ngayVao.setMonth(ngayVao.getMonth() + soThang);
  return ngayVao.toISOString().split('T')[0];
}

function tachNgayGioLocal(value) {
  const raw = String(value || '').trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return null;
  const [, nam, thang, ngay, gio, phut, giay = '00'] = match;
  return {
    nam: Number(nam),
    thang: Number(thang),
    ngay: Number(ngay),
    gio: Number(gio),
    phut: Number(phut),
    giay: Number(giay),
  };
}

function taoDateLocal(value) {
  const parts = tachNgayGioLocal(value);
  if (!parts) return new Date(value);
  return new Date(parts.nam, parts.thang - 1, parts.ngay, parts.gio, parts.phut, parts.giay);
}

function chuanHoaNgayGioHenDB(value) {
  const parts = tachNgayGioLocal(value);
  const pad = (n) => String(n).padStart(2, '0');
  if (parts) {
    return `${parts.nam}-${pad(parts.thang)}-${pad(parts.ngay)}T${pad(parts.gio)}:${pad(parts.phut)}:${pad(parts.giay)}`;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function suaLoiFontUtf8(value) {
  const raw = String(value || '');
  if (!/(Ã|Â|Ä|áº|Áº|á»|Á»)/.test(raw)) return raw;
  try {
    const fixed = Buffer.from(raw, 'latin1').toString('utf8');
    return fixed.includes('�') ? raw : fixed;
  } catch {
    return raw;
  }
}

function chuanHoaHienThi(value) {
  return suaLoiFontUtf8(value).normalize('NFC');
}

function chuanHoaTimKiem(value) {
  return chuanHoaHienThi(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

function laySoTienNumber(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  return digits ? Number(digits) : null;
}

const TU_KHOA_TIEN_ICH = {
  'yen tinh': ['yen tinh', 'quiet', 'rieng tu'],
  'gui xe': ['gui xe', 'giu xe', 'de xe', 'bai xe'],
  'dieu hoa': ['dieu hoa', 'may lanh', 'air conditioner'],
  'wifi rieng': ['wifi rieng', 'wifi', 'internet'],
  'gio giac tu do': ['gio giac tu do', 'tu do', 'ra vao'],
};

function coTienIchPhuHop(tienIch, yeuCau) {
  const noiDung = chuanHoaTimKiem(tienIch);
  const yeuCauChuanHoa = chuanHoaTimKiem(yeuCau).replace(/^co\s+/, '');
  const tuKhoa = TU_KHOA_TIEN_ICH[yeuCauChuanHoa] || [yeuCauChuanHoa];

  return tuKhoa.some((keyword) => noiDung.includes(keyword));
}

function locTheoTienIchUuTien(danhSach, layTienIch, yeuCauList) {
  const danhSachYeuCau = (yeuCauList || []).filter(Boolean);
  if (danhSachYeuCau.length === 0) return danhSach;

  const ketQuaLoc = danhSach.filter((item) =>
    danhSachYeuCau.every((yeuCau) => coTienIchPhuHop(layTienIch(item), yeuCau))
  );

  return ketQuaLoc;
}

function nhomGiuongTheoPhong(danhSachGiuong = []) {
  return danhSachGiuong.reduce((map, giuong) => {
    const maPhong = Number(giuong.MaPhong);
    if (!map.has(maPhong)) map.set(maPhong, []);
    map.get(maPhong).push(giuong);
    return map;
  }, new Map());
}

function laySucChuaKhaDungPhong(phong, danhSachGiuong = null, giuongDangKhoaSet = new Set()) {
  const giuongs = Array.isArray(danhSachGiuong)
    ? danhSachGiuong
    : (Array.isArray(phong?.Giuong) ? phong.Giuong : []);
  const tongGiuong = Math.max(
    giuongs.length,
    Number(phong?.SucChuaToiDa) || 0,
    Number(phong?.SucChuaConLai) || Number(phong?.SucChua) || 0,
    1,
  );
  const soGiuongTrongTheoDong = giuongs.filter((giuong) => giuong.TinhTrang === true && !giuongDangKhoaSet.has(Number(giuong.MaGiuong))).length;
  const phongDangTrong = phong?.TinhTrang === true;
  const tatCaGiuongDangTrong = giuongs.length === 0 || soGiuongTrongTheoDong === giuongs.length;
  const soGiuongTrong = phongDangTrong && tatCaGiuongDangTrong
    ? Math.max(soGiuongTrongTheoDong, tongGiuong)
    : soGiuongTrongTheoDong;

  return {
    tongGiuong,
    soGiuongTrong,
  };
}

function phongConTrongHoanToan(phong, giuongTheoPhong, giuongDangKhoaSet = new Set()) {
  const danhSachGiuong = giuongTheoPhong.get(Number(phong.MaPhong)) || [];
  if (danhSachGiuong.length === 0) return phong.TinhTrang === true;
  return phong.TinhTrang === true && danhSachGiuong.every((giuong) => giuong.TinhTrang === true && !giuongDangKhoaSet.has(Number(giuong.MaGiuong)));
}

async function layGiuongDangKhoaSet(maGiuongList = []) {
  const ids = [...new Set(maGiuongList.map(Number).filter(Number.isFinite))];
  if (ids.length === 0) return new Set();
  const khoaTamRes = await supabase
    .from('KhoaGiuongDatCoc')
    .select('MaGiuong')
    .in('MaGiuong', ids);
  if (khoaTamRes.error) {
    if (khoaTamRes.error.code !== '42P01') throw khoaTamRes.error;
  }
  const { data: phieuDangGiu, error: errPhieuDangGiu } = await supabase
    .from('DatCoc')
    .select('MaDatCoc')
    .in('TrangThai', TRANG_THAI_KHOA_PHONG_CHOT);
  if (errPhieuDangGiu) {
    if (errPhieuDangGiu.code !== '42P01') throw errPhieuDangGiu;
  }
  const maDatCocDangGiu = (phieuDangGiu || []).map((item) => Number(item.MaDatCoc)).filter(Number.isFinite);
  let giuongTrongPhieu = [];
  if (maDatCocDangGiu.length) {
    const { data, error } = await supabase
      .from('GiuongDatCoc')
      .select('MaGiuong')
      .in('MaGiuong', ids)
      .in('MaDatCoc', maDatCocDangGiu);
    if (error) {
      if (error.code !== '42P01') throw error;
    } else {
      giuongTrongPhieu = data || [];
    }
  }
  return new Set([
    ...(khoaTamRes.data || []).map((item) => Number(item.MaGiuong)),
    ...giuongTrongPhieu.map((item) => Number(item.MaGiuong)),
  ]);
}

function laGiaTriTatCa(value) {
  const raw = String(value || '').trim().toLowerCase();
  const normalized = chuanHoaTimKiem(raw);
  return !raw || normalized.includes('tat ca') || raw.includes('tất cả');
}

function laTraCuuNguyenPhong(tc) {
  if (String(tc.kieuThue || '').toUpperCase() === 'PHONG') return true;
  if (String(tc.kieuThue || '').toUpperCase() === 'GIUONG') return false;
  const loaiPhongRaw = String(tc.loaiPhong || '').toLowerCase();
  const loaiPhong = chuanHoaTimKiem(tc.loaiPhong);
  if (loaiPhongRaw.includes('nguy')) return true;
  return (
    loaiPhong.includes('nguyen') ||
    (loaiPhong.includes('phong') && !loaiPhong.includes('giuong') && !loaiPhong.includes('dorm'))
  );
}

function gioiTinhGiuongPhuHop(gioiTinhGiuong, gioiTinhKhach) {
  const khach = chuanHoaTimKiem(gioiTinhKhach);
  if (!khach || khach.includes('tat ca')) return true;

  const giuong = chuanHoaTimKiem(gioiTinhGiuong);
  if (
    !giuong ||
    giuong.includes('tat ca') ||
    giuong.includes('khong yeu cau') ||
    giuong.includes('chung')
  ) {
    return true;
  }

  if (giuong.includes('nam') && giuong.includes('nu')) return true;
  if (khach.includes('nam')) return giuong.includes('nam');
  if (khach.includes('nu')) return giuong.includes('nu');
  return giuong === khach;
}

function chuanHoaLoaiThue(value, fallback = 'Thuê giường lẻ') {
  const raw = String(value || '').trim();
  if (!raw) return fallback;
  const key = chuanHoaTimKiem(raw);
  if (key.includes('giuong') || key.includes('ghep') || key.includes('dorm') || key.includes('le')) {
    return 'Thuê giường lẻ';
  }
  if (key.includes('nguyen') || key === 'phong' || (key.includes('phong') && !key.includes('giuong'))) {
    return 'Thuê nguyên phòng';
  }
  return fallback;
}

function layMaLoaiPhongYeuCau(yc = {}) {
  const raw = yc.maLoaiPhong ?? yc.MaLoaiPhong ?? yc.loaiPhongId ?? yc.LoaiPhong;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function layTenLoaiPhong(phong = {}) {
  return phong.LoaiPhongInfo?.TenLoaiPhong
    || phong.LoaiPhong?.TenLoaiPhong
    || (Number.isFinite(Number(phong.LoaiPhong)) ? `Loại phòng ${phong.LoaiPhong}` : String(phong.LoaiPhong || 'Chưa phân loại'));
}

const NOI_DUNG_HEN_XEM_PHONG = '\u0110\u0103ng k\u00fd h\u1eb9n xem ph\u00f2ng';

function laNoiDungHeThongHenXemPhong(value) {
  const key = chuanHoaTimKiem(value);
  return key.includes('hen') && key.includes('xem') && key.includes('phong');
}

function chuanHoaNoiDungYeuCauMacDinh(value) {
  const raw = String(value || '');
  if (laNoiDungHeThongHenXemPhong(raw)) {
    const maPhong = raw.match(/\d+\s*$/)?.[0]?.trim();
    return maPhong ? `${NOI_DUNG_HEN_XEM_PHONG} ${maPhong}` : NOI_DUNG_HEN_XEM_PHONG;
  }
  return chuanHoaHienThi(raw);
}

function taoNoiDungYeuCauThue(yc = {}, fallback = '') {
  const noiDungThem = String(yc.yeuCauThem ?? yc.YeuCauThem ?? yc.ghiChuYeuCau ?? '').trim();

  const danhSachTienIch = Array.isArray(yc.yeuCauList)
    ? yc.yeuCauList.map((item) => String(item || '').trim()).filter(Boolean)
    : [];

  const parts = [];
  if (noiDungThem) parts.push(noiDungThem);
  if (danhSachTienIch.length) {
    parts.push(`Tiêu chí ưu tiên: ${danhSachTienIch.join(', ')}`);
  }

  return parts.join(' | ') || null;
}

function tachTienIch(tienIch) {
  const raw = tienIch == null ? '' : String(tienIch);
  let noiDung = raw;
  if (/^\s*[\[{]/.test(raw)) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) noiDung = parsed.join(',');
      else if (parsed && typeof parsed === 'object') noiDung = Object.values(parsed).join(',');
    } catch {
      noiDung = raw;
    }
  }

  return noiDung
    .split(/[;,|\/\u00b7\r\n]+/)
    .map((item) => item.trim())
    .map((item) => {
      const key = chuanHoaTimKiem(item);
      if (!key.includes('mau dat coc')) return item;
      if (key.includes('gui xe') || key.includes('giu xe') || key.includes('de xe')) return 'Gửi xe';
      return '';
    })
    .filter(Boolean);
}

function dinhDangNhanTienIch(tienIch) {
  const raw = String(tienIch || '').trim();
  if (!raw) return '';
  const boTienToCo = raw.replace(/^có\s+/i, '').trim();
  const key = chuanHoaTimKiem(boTienToCo);
  let noiDung = boTienToCo.toLocaleLowerCase('vi-VN');
  if (key.includes('wifi')) noiDung = 'Wifi';
  else if (key.includes('internet')) noiDung = 'Internet';
  else if (key.includes('tu lanh')) noiDung = 'tủ lạnh';
  else if (key.includes('may giat')) noiDung = 'máy giặt';
  else if (key.includes('dieu hoa') || key.includes('may lanh')) noiDung = 'điều hòa';
  else if (key.includes('gui xe') || key.includes('giu xe') || key.includes('de xe')) noiDung = 'gửi xe';
  return `Có ${noiDung}`;
}

const CAC_QUAN_HUYEN_HCM = [
  'Quận 1',
  'Quận 3',
  'Quận 4',
  'Quận 5',
  'Quận 6',
  'Quận 7',
  'Quận 8',
  'Quận 10',
  'Quận 11',
  'Quận 12',
  'Bình Thạnh',
  'Bình Tân',
  'Gò Vấp',
  'Phú Nhuận',
  'Tân Bình',
  'Tân Phú',
  'Thủ Đức',
  'Bình Chánh',
  'Cần Giờ',
  'Củ Chi',
  'Hóc Môn',
  'Nhà Bè',
];

function taoKhuVucOption(tenKhuVuc) {
  const tenChuan = chuanHoaHienThi(tenKhuVuc);
  return {
    value: tenChuan,
    label: `${tenChuan}, TP.HCM`,
  };
}

function layDanhSachKhuVucTuText(text) {
  const textChuan = chuanHoaHienThi(text);
  const normalized = chuanHoaTimKiem(textChuan);
  const khuVucMap = new Map();

  for (const match of normalized.matchAll(/\b(?:q|quan)\.?\s*(\d{1,2})\b/g)) {
    const quan = `Quận ${Number(match[1])}`;
    khuVucMap.set(chuanHoaTimKiem(quan), taoKhuVucOption(quan));
  }

  CAC_QUAN_HUYEN_HCM.forEach((ten) => {
    if (normalized.includes(chuanHoaTimKiem(ten))) {
      khuVucMap.set(chuanHoaTimKiem(ten), taoKhuVucOption(ten));
    }
  });

  return Array.from(khuVucMap.values());
}

function themKhuVucVaoMap(khuVucMap, text) {
  layDanhSachKhuVucTuText(text).forEach((khuVuc) => {
    const key = chuanHoaTimKiem(khuVuc.value);
    if (!key || khuVucMap.has(key)) return;
    khuVucMap.set(key, khuVuc);
  });
}

function layKhuVucTuChiNhanh(chiNhanh) {
  return layDanhSachKhuVucTuText(`${chiNhanh?.TenCN || ''} ${chiNhanh?.DiaChi || ''}`)[0] || null;
}

// Database helper functions
function taoLoiNghiepVu(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function moTaKhachTrung(khach) {
  if (!khach) return '';
  const thongTin = [];
  if (khach.HoTen) thongTin.push(khach.HoTen);
  if (khach.SDT) thongTin.push(`SÄT ${khach.SDT}`);
  return thongTin.length > 0 ? ` (${thongTin.join(' - ')})` : '';
}

async function kiemTraKhachHangDaTonTai(cccd, sdt) {
  const { data: trungCCCD, error: loiCCCD } = await supabase
    .from('KhachHang')
    .select('CCCD, HoTen, SDT')
    .eq('CCCD', cccd)
    .limit(1);

  if (loiCCCD) throw loiCCCD;
  if (trungCCCD && trungCCCD.length > 0) {
    throw taoLoiNghiepVu(409, `CCCD ${cccd} Ä‘Ã£ tá»“n táº¡i${moTaKhachTrung(trungCCCD[0])}. Vui lÃ²ng kiá»ƒm tra láº¡i khÃ¡ch hÃ ng cÅ©.`);
  }

  const { data: trungSDT, error: loiSDT } = await supabase
    .from('KhachHang')
    .select('CCCD, HoTen, SDT')
    .eq('SDT', sdt)
    .limit(1);

  if (loiSDT) throw loiSDT;
  if (trungSDT && trungSDT.length > 0) {
    throw taoLoiNghiepVu(409, `Sá»‘ Ä‘iá»‡n thoáº¡i ${sdt} Ä‘Ã£ tá»“n táº¡i${moTaKhachTrung(trungSDT[0])}. Vui lÃ²ng kiá»ƒm tra láº¡i khÃ¡ch hÃ ng cÅ©.`);
  }
}

async function luuThongTinKhachHang(kh) {
  const cccd = Number(String(kh.cccd || '').replace(/\D/g, ''));
  const sdt = String(kh.sdt || '').replace(/\D/g, '');
  const diaChi = String(kh.diaChi ?? kh.DiaChi ?? '').trim();
  const ngaySinh = String(kh.ngaySinh ?? kh.NgaySinh ?? '').trim();
  const gioiTinh = String(kh.gioiTinh ?? kh.GioiTinh ?? kh.gioiTinhKhachHang ?? '').trim();
  const quocTich = String(kh.quocTich ?? kh.QuocTich ?? '').trim();
  const email = String(kh.email ?? kh.Email ?? '').trim();

  if (!cccd) throw taoLoiNghiepVu(400, 'CCCD khÃ´ng há»£p lá»‡.');
  if (!sdt) throw taoLoiNghiepVu(400, 'Sá»‘ Ä‘iá»‡n thoáº¡i khÃ´ng há»£p lá»‡.');
  if (!ngaySinh) throw taoLoiNghiepVu(400, 'NgÃ y sinh khÃ¡ch hÃ ng lÃ  báº¯t buá»™c.');
  if (!gioiTinh) throw taoLoiNghiepVu(400, 'Giá»›i tÃ­nh khÃ¡ch hÃ ng lÃ  báº¯t buá»™c.');

  await kiemTraKhachHangDaTonTai(cccd, sdt);

  const { data, error } = await supabase
    .from('KhachHang')
    .insert({
      CCCD: cccd,
      HoTen: kh.hoTen,
      NgaySinh: ngaySinh || null,
      GioiTinh: gioiTinh || null,
      QuocTich: quocTich || 'Việt Nam',
      DiaChi: diaChi || null,
      SDT: sdt,
      Email: email || null,
      KhaNangTaiChinh: laySoTienNumber(kh.khaNangTaiChinh),
      ThoaDK: true
    })
    .select()
    .single();

  if (error) throw error;
  return data ? { ...data, CCCD: dinhDangCCCD(data.CCCD) } : null;
}

async function taoYeuCauThue(yc, cccd, maNV = 101) {
  const thoiGianThueDate = tinhNgayKetThuc(yc.thoiGianVao, yc.thoiHanThue);
  const loaiThue = chuanHoaLoaiThue(yc.loaiThue || yc.loaiPhong);

  const { data, error } = await supabase
    .from('YeuCauThue')
    .insert({
      SoNguoiDuKien: Number(yc.soNguoi),
      GioiTinh: yc.gioiTinh,
      KhuVucMongMuon: yc.khuVucMongMuon,
      LoaiPhong: layMaLoaiPhongYeuCau(yc),
      LoaiThue: loaiThue,
      NganSach: laySoTienNumber(yc.mucGiaDen), // default to max budget
      ThoiGianVao: new Date(yc.thoiGianVao).toISOString(),
      ThoiGianThue: thoiGianThueDate,
      YeuCau: taoNoiDungYeuCauThue(yc),
      TrangThai: true,
      NgayTao: new Date().toISOString(),
      MaNV: maNV,
      CCCD: Number(cccd)
    })
    .select();

  if (error) throw error;
  return data && data.length > 0
    ? { ...data[0], CCCD: dinhDangCCCD(data[0].CCCD) }
    : null;
}

async function layThongKePhongTrong() {
  // Query single rooms (NguyÃªn phÃ²ng) in BÃ¬nh Tháº¡nh (MaCN = 2)
  const { data: phongs, error: errorPhong } = await supabase
    .from('Phong')
    .select('MaPhong')
    .eq('TinhTrang', true)
    .eq('MaCN', 2);
    
  if (errorPhong) throw errorPhong;
  
  // Query dorm beds (GiÆ°á»ng) that are vacant (TinhTrang = true)
  const { data: giuongs, error: errorGiuong } = await supabase
    .from('Giuong')
    .select('MaGiuong, GioiTinhYeuCau, Phong!inner(MaCN, LoaiPhong)')
    .eq('TinhTrang', true);
    
  if (errorGiuong) throw errorGiuong;
  
  const countDormNuQ1 = giuongs.filter(g => g.GioiTinhYeuCau === 'Ná»¯' && g.Phong.MaCN === 1).length;
  const countDormNamQ3 = giuongs.filter(g => g.GioiTinhYeuCau === 'Nam' && g.Phong.MaCN === 3).length;
  const countPhongDonBT = phongs.length;
  
  return {
    dormNuQ1: countDormNuQ1,
    phongDonBT: countPhongDonBT,
    dormNamQ3: countDormNamQ3
  };
}

async function traCuuPhongPhuHop(tc) {
  // Fetch branches
  const { data: chiNhanhs, error: errCN } = await supabase.from('ChiNhanh').select('*');
  if (errCN) throw errCN;

  // Filter branches by search text
  let selectedCNIds = chiNhanhs.map(c => c.MaCN);
  if (tc.khuVucMongMuon) {
    const kvLower = chuanHoaTimKiem(tc.khuVucMongMuon);
    selectedCNIds = chiNhanhs
      .filter(c => chuanHoaTimKiem(`${c.TenCN || ''} ${c.DiaChi || ''}`).includes(kvLower))
      .map(c => c.MaCN);
  }

  if (laTraCuuNguyenPhong(tc)) {
    let query = supabase
      .from('Phong')
      .select('*, ChiNhanh(TenCN, DiaChi), LoaiPhongInfo:LoaiPhong(MaLoaiPhong, TenLoaiPhong)')
      .eq('TinhTrang', true)
      .in('MaCN', selectedCNIds);

    if (tc.mucGiaTu) {
      query = query.gte('GiaThue', Number(tc.mucGiaTu));
    }
    if (tc.mucGiaDen) {
      query = query.lte('GiaThue', Number(tc.mucGiaDen));
    }
    const { data: results, error: errPhong } = await query;
    if (errPhong) throw errPhong;

    const maPhongList = (results || []).map((phong) => phong.MaPhong);
    let giuongTheoPhong = new Map();
    let giuongDangKhoaSet = new Set();

    if (maPhongList.length > 0) {
      const { data: giuongs, error: errGiuongTheoPhong } = await supabase
        .from('Giuong')
        .select('MaGiuong, MaPhong, TinhTrang')
        .in('MaPhong', maPhongList);

      if (errGiuongTheoPhong) throw errGiuongTheoPhong;
      giuongDangKhoaSet = await layGiuongDangKhoaSet((giuongs || []).map((giuong) => giuong.MaGiuong));
      giuongTheoPhong = nhomGiuongTheoPhong(giuongs || []);
    }

    const soNguoiCanThue = Number(tc.soNguoi) || 0;
    let filtered = (results || []).filter((room) => {
      if (!phongConTrongHoanToan(room, giuongTheoPhong, giuongDangKhoaSet)) return false;
      if (!soNguoiCanThue) return true;
      const { tongGiuong } = laySucChuaKhaDungPhong(room, giuongTheoPhong.get(Number(room.MaPhong)) || [], giuongDangKhoaSet);
      return tongGiuong >= soNguoiCanThue;
    });
    if (tc.yeuCauList && tc.yeuCauList.length > 0) {
      filtered = locTheoTienIchUuTien(filtered, room => room.TienIch, tc.yeuCauList);
    }

    return filtered.map(r => ({
      kieu: 'Phong',
      maId: r.MaPhong,
      maPhong: r.MaPhong,
      ten: `Phòng ${r.MaPhong}`,
      loaiPhong: layTenLoaiPhong(r),
      giaThue: r.GiaThue,
      sucChua: laySucChuaKhaDungPhong(r, giuongTheoPhong.get(Number(r.MaPhong)) || [], giuongDangKhoaSet).tongGiuong,
      soGiuongTrong: laySucChuaKhaDungPhong(r, giuongTheoPhong.get(Number(r.MaPhong)) || [], giuongDangKhoaSet).soGiuongTrong,
      tienIch: r.TienIch,
      chiNhanh: r.ChiNhanh?.TenCN || 'Chưa rõ',
      diaChi: r.ChiNhanh?.DiaChi || '',
      gioiTinh: 'Táº¥t cáº£'
    }));
  } else {
    // Dorm search
    let query = supabase
      .from('Giuong')
      .select('*, Phong!inner(*, ChiNhanh(TenCN, DiaChi), LoaiPhongInfo:LoaiPhong(MaLoaiPhong, TenLoaiPhong))')
      .eq('TinhTrang', true)
      .in('Phong.MaCN', selectedCNIds);

    if (tc.mucGiaTu) {
      query = query.gte('GiaThue', Number(tc.mucGiaTu));
    }
    if (tc.mucGiaDen) {
      query = query.lte('GiaThue', Number(tc.mucGiaDen));
    }

    const { data: results, error: errGiuong } = await query;
    if (errGiuong) throw errGiuong;

    const giuongDangKhoaSet = await layGiuongDangKhoaSet((results || []).map((giuong) => giuong.MaGiuong));
    let filtered = (results || []).filter((giuong) => (
      !giuongDangKhoaSet.has(Number(giuong.MaGiuong)) &&
      gioiTinhGiuongPhuHop(giuong.GioiTinhYeuCau, tc.gioiTinh)
    ));
    if (tc.yeuCauList && tc.yeuCauList.length > 0) {
      filtered = locTheoTienIchUuTien(filtered, giuong => giuong.Phong?.TienIch, tc.yeuCauList);
    }
    const soGiuongCanThue = Number(tc.soNguoi) || 0;
    if (soGiuongCanThue > 0) {
      const soGiuongTrongTheoPhong = filtered.reduce((map, giuong) => {
        const maPhong = Number(giuong.Phong?.MaPhong);
        map.set(maPhong, (map.get(maPhong) || 0) + 1);
        return map;
      }, new Map());
      filtered = filtered.filter((giuong) => {
        const maPhong = Number(giuong.Phong?.MaPhong);
        return (soGiuongTrongTheoPhong.get(maPhong) || 0) >= soGiuongCanThue;
      });
    }

    return filtered.map(g => ({
      kieu: 'Giuong',
      maId: g.MaGiuong,
      maPhong: g.Phong.MaPhong,
      ten: `Giường #${g.MaGiuong} (Phòng ${g.Phong.MaPhong})`,
      loaiPhong: layTenLoaiPhong(g.Phong) || `Dorm ${g.GioiTinhYeuCau}`,
      giaThue: g.GiaThue,
      sucChua: 1,
      soGiuongTrong: filtered.filter((item) => Number(item.Phong?.MaPhong) === Number(g.Phong.MaPhong)).length,
      tienIch: g.Phong.TienIch,
      chiNhanh: g.Phong.ChiNhanh?.TenCN || 'Chưa rõ',
      diaChi: g.Phong.ChiNhanh?.DiaChi || '',
      gioiTinh: g.GioiTinhYeuCau
    }));
  }
}

const TRANG_THAI_KHOA_PHONG_CHOT = [
  TRANG_THAI_COC.MOI,
  TRANG_THAI_COC.CHO_KIEM_TRA_PHONG,
  TRANG_THAI_COC.CON_TRONG_CHO_GUI_KE_TOAN,
  TRANG_THAI_COC.CHO_TINH_COC,
  TRANG_THAI_COC.CHO_THANH_TOAN,
  TRANG_THAI_COC.CHO_XAC_NHAN_THANH_TOAN,
  TRANG_THAI_COC.DA_XAC_NHAN,
  TRANG_THAI_COC.TU_CHOI_CHUNG_TU,
];

function tachYeuCauListTuText(value) {
  const raw = String(value || '');
  const cacPhan = raw.split('|').map((item) => item.trim()).filter(Boolean);
  const phanTieuChi = cacPhan.find((item) => chuanHoaTimKiem(item).includes('tieu chi uu tien'));
  if (!phanTieuChi) return [];
  const nguonTach = phanTieuChi.replace(/^.*?:\s*/, '');

  return nguonTach
    .split(/[;,|]+/)
    .map((item) => item.trim())
    .map((item) => item.replace(/^.*tiÃªu chÃ­ Æ°u tiÃªn\s*:\s*/i, '').trim())
    .filter((item) => {
      if (!item) return false;
      const key = chuanHoaTimKiem(item);
      return !laNoiDungHeThongHenXemPhong(item) && !key.includes('phong #');
    });
}

function taoTieuChiTraCuuTuYeuCau(yeuCauThue) {
  const loaiThue = chuanHoaLoaiThue(yeuCauThue?.LoaiThue || yeuCauThue?.loaiThue || '', '');
  const laNguyenPhong = loaiThue === 'Thuê nguyên phòng';
  const khuVuc = String(yeuCauThue?.KhuVucMongMuon || '').trim();
  const mucGia = Number(yeuCauThue?.NganSach) || '';

  return {
    kieuThue: laNguyenPhong ? 'PHONG' : 'GIUONG',
    loaiPhong: laNguyenPhong ? 'Nguyên phòng' : 'Giường ghép',
    khuVucMongMuon: laGiaTriTatCa(khuVuc) ? '' : khuVuc,
    mucGiaTu: '',
    mucGiaDen: mucGia,
    gioiTinh: yeuCauThue?.GioiTinh || 'Tất cả',
    soNguoi: Number(yeuCauThue?.SoNguoiDuKien) || 1,
    yeuCauList: tachYeuCauListTuText(yeuCauThue?.YeuCau),
  };
}

function gomKetQuaThanhPhongGoiY(danhSach = []) {
  const phongMap = new Map();
  danhSach.forEach((item) => {
    const maPhong = Number(item?.maPhong || item?.maId);
    if (!maPhong) return;
    const daCo = phongMap.get(maPhong);
    if (daCo) {
      if (item.kieu === 'Giuong' && item.maId) {
        daCo.maGiuongGoiY = Array.from(new Set([...(daCo.maGiuongGoiY || []), Number(item.maId)]));
        daCo.soGiuongTrong = Math.max(Number(daCo.soGiuongTrong) || 0, Number(item.soGiuongTrong) || 1);
      }
      return;
    }
    phongMap.set(maPhong, {
      ...item,
      kieu: 'Phong',
      maId: maPhong,
      maPhong,
      ten: `Phòng ${maPhong}`,
      maGiuongGoiY: item.kieu === 'Giuong' && item.maId ? [Number(item.maId)] : [],
    });
  });
  return Array.from(phongMap.values()).sort((a, b) => Number(a.maPhong) - Number(b.maPhong));
}

async function layPhongGoiYMacDinh() {
  const [phongNguyen, giuongLe] = await Promise.all([
    traCuuPhongPhuHop({ kieuThue: 'PHONG', loaiPhong: 'Nguyên phòng', soNguoi: 1 }),
    traCuuPhongPhuHop({ kieuThue: 'GIUONG', loaiPhong: 'Giường ghép', soNguoi: 1 }),
  ]);
  return gomKetQuaThanhPhongGoiY([...(phongNguyen || []), ...(giuongLe || [])]);
}

async function layPhongGoiYTheoYeuCauThue(yeuCauThue) {
  if (!yeuCauThue) return layPhongGoiYMacDinh();
  const tieuChi = taoTieuChiTraCuuTuYeuCau(yeuCauThue);
  const danhSach = await traCuuPhongPhuHop(tieuChi);
  const coTieuChiCuThe = Boolean(
    tieuChi.khuVucMongMuon ||
    tieuChi.mucGiaTu ||
    tieuChi.mucGiaDen ||
    (Array.isArray(tieuChi.yeuCauList) && tieuChi.yeuCauList.length) ||
    (Number(tieuChi.soNguoi) || 0) > 1 ||
    !laGiaTriTatCa(tieuChi.gioiTinh)
  );
  if (!danhSach.length && !coTieuChiCuThe) {
    return layPhongGoiYMacDinh();
  }
  return gomKetQuaThanhPhongGoiY(danhSach);
}

function giaNamTrongKhoang(giaTri, giaTu, giaDen) {
  const gia = Number(giaTri) || 0;
  const tu = Number(giaTu) || 0;
  const den = Number(giaDen) || 0;
  if (tu && gia < tu) return false;
  if (den && gia > den) return false;
  return true;
}

async function phongConKhaDungChoYeuCau(maPhong, yeuCauThue) {
  const maPhongSo = Number(maPhong);
  if (!maPhongSo) return false;

  const tieuChi = taoTieuChiTraCuuTuYeuCau(yeuCauThue);
  const { data: phong, error } = await supabase
    .from('Phong')
    .select('*, ChiNhanh(TenCN, DiaChi), LoaiPhongInfo:LoaiPhong(MaLoaiPhong, TenLoaiPhong), Giuong(MaGiuong, TinhTrang, GioiTinhYeuCau, GiaThue)')
    .eq('MaPhong', maPhongSo)
    .maybeSingle();
  if (error) throw error;
  if (!phong) return false;

  const khuVuc = String(tieuChi.khuVucMongMuon || '').trim();
  if (khuVuc) {
    const khuVucPhong = chuanHoaTimKiem(`${phong.ChiNhanh?.TenCN || ''} ${phong.ChiNhanh?.DiaChi || ''}`);
    if (!khuVucPhong.includes(chuanHoaTimKiem(khuVuc))) return false;
  }

  if (tieuChi.yeuCauList?.length && !locTheoTienIchUuTien([phong], item => item.TienIch, tieuChi.yeuCauList).length) {
    return false;
  }

  const danhSachGiuong = Array.isArray(phong.Giuong) ? phong.Giuong : [];
  const giuongDangKhoaSet = await layGiuongDangKhoaSet(danhSachGiuong.map((giuong) => giuong.MaGiuong));
  const soNguoiCanThue = Number(tieuChi.soNguoi) || 1;

  if (tieuChi.kieuThue === 'PHONG') {
    if (phong.TinhTrang !== true) return false;
    if (!giaNamTrongKhoang(phong.GiaThue, tieuChi.mucGiaTu, tieuChi.mucGiaDen)) return false;
    const giuongTheoPhong = new Map([
      [maPhongSo, danhSachGiuong.map((giuong) => ({ ...giuong, MaPhong: maPhongSo }))],
    ]);
    if (!phongConTrongHoanToan(phong, giuongTheoPhong, giuongDangKhoaSet)) return false;
    const { tongGiuong } = laySucChuaKhaDungPhong(phong, danhSachGiuong, giuongDangKhoaSet);
    return tongGiuong >= soNguoiCanThue;
  }

  const giuongConTrongPhuHop = danhSachGiuong.filter((giuong) => (
    giuong.TinhTrang === true &&
    !giuongDangKhoaSet.has(Number(giuong.MaGiuong)) &&
    gioiTinhGiuongPhuHop(giuong.GioiTinhYeuCau, tieuChi.gioiTinh) &&
    giaNamTrongKhoang(giuong.GiaThue, tieuChi.mucGiaTu, tieuChi.mucGiaDen)
  ));

  return giuongConTrongPhuHop.length >= soNguoiCanThue;
}

async function khachDaDatCocPhong(cccd, maPhong) {
  const cccdSo = Number(String(cccd || '').replace(/\D/g, ''));
  const maPhongSo = Number(maPhong);
  if (!cccdSo || !maPhongSo) return false;
  const { data, error } = await supabase
    .from('DatCoc')
    .select('MaDatCoc')
    .eq('CCCD', cccdSo)
    .eq('MaPhong', maPhongSo)
    .in('TrangThai', TRANG_THAI_KHOA_PHONG_CHOT)
    .limit(1);
  if (error) throw error;
  return Array.isArray(data) && data.length > 0;
}

// Route handlers
async function xuLyLayThongKe(req, res) {
  try {
    const stats = await layThongKePhongTrong();
    res.json({ ok: true, data: stats });
  } catch (error) {
    console.error('Lá»—i láº¥y thá»‘ng kÃª:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
}

async function xuLyLayTuyChonTraCuuPhong(req, res) {
  try {
    const [chiNhanhRes, phongRes] = await Promise.all([
      supabase.from('ChiNhanh').select('MaCN, TenCN, DiaChi').order('MaCN', { ascending: true }),
      supabase.from('Phong').select('MaPhong, MaCN, TienIch, TinhTrang, SucChuaConLai, SucChuaToiDa, Giuong(MaGiuong, TinhTrang)'),
    ]);

    if (chiNhanhRes.error) throw chiNhanhRes.error;
    if (phongRes.error) throw phongRes.error;
    const giuongDangKhoaSet = await layGiuongDangKhoaSet(
      (phongRes.data || []).flatMap((phong) => (Array.isArray(phong.Giuong) ? phong.Giuong : []).map((giuong) => giuong.MaGiuong)),
    );

    const maChiNhanhCoPhong = new Set((phongRes.data || []).map((phong) => phong.MaCN).filter(Boolean));
    const khuVucMap = new Map();
    (chiNhanhRes.data || []).forEach((chiNhanh) => {
      if (!maChiNhanhCoPhong.has(chiNhanh.MaCN)) return;
      themKhuVucVaoMap(khuVucMap, `${chiNhanh.TenCN || ''} ${chiNhanh.DiaChi || ''}`);
    });

    const tienIchMap = new Map();
    (phongRes.data || []).forEach((phong) => {
      tachTienIch(phong.TienIch).forEach((tienIch) => {
        const label = dinhDangNhanTienIch(tienIch);
        const key = chuanHoaTimKiem(label);
        if (!key || tienIchMap.has(key)) return;
        tienIchMap.set(key, {
          value: tienIch,
          label,
        });
      });
    });

    const gioiHanSucChua = (phongRes.data || []).reduce((gioiHan, phong) => {
      const giuongs = Array.isArray(phong.Giuong) ? phong.Giuong : [];
      const { tongGiuong, soGiuongTrong } = laySucChuaKhaDungPhong(phong, giuongs, giuongDangKhoaSet);
      const phongTrongHoanToan = phong.TinhTrang === true && (giuongs.length === 0 || giuongs.every((giuong) => giuong.TinhTrang === true && !giuongDangKhoaSet.has(Number(giuong.MaGiuong))));
      if (phongTrongHoanToan) {
        gioiHan.nguyenPhong = Math.max(gioiHan.nguyenPhong, tongGiuong);
      }
      if (soGiuongTrong > 0) {
        gioiHan.giuongGhep = Math.max(gioiHan.giuongGhep, soGiuongTrong);
      }
      return gioiHan;
    }, { nguyenPhong: 1, giuongGhep: 1 });

    res.json({
      ok: true,
      data: {
        khuVuc: Array.from(khuVucMap.values()).sort((a, b) => a.label.localeCompare(b.label, 'vi')),
        tienIch: Array.from(tienIchMap.values()).sort((a, b) => a.label.localeCompare(b.label, 'vi')),
        gioiHanSucChua,
      },
    });
  } catch (error) {
    console.error('Lá»—i láº¥y tÃ¹y chá»n tra cá»©u phÃ²ng:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
}

async function xuLyTiepNhanThongTin(req, res) {
  try {
    const { khachHang, yeuCauThue, maNV } = req.body;
    
    if (!khachHang || !khachHang.cccd || !khachHang.hoTen || !khachHang.sdt) {
      return res.status(400).json({ ok: false, error: 'Thiáº¿u thÃ´ng tin khÃ¡ch hÃ ng báº¯t buá»™c (CCCD, Há» tÃªn, SÄT)' });
    }

    // Save customer details
    const savedKhachHang = await luuThongTinKhachHang(khachHang);

    // Save rental request details
    const savedYeuCau = await taoYeuCauThue(yeuCauThue, khachHang.cccd, maNV || 101);

    res.json({
      ok: true,
      message: 'Tiáº¿p nháº­n thÃ´ng tin thÃ nh cÃ´ng!',
      data: {
        khachHang: savedKhachHang,
        yeuCauThue: savedYeuCau
      }
    });
  } catch (error) {
    console.error('Lá»—i tiáº¿p nháº­n thÃ´ng tin:', error);
    const laLoiTrungDuLieu = error.code === '23505';
    const statusCode = error.statusCode || (laLoiTrungDuLieu ? 409 : 500);
    const message = laLoiTrungDuLieu
      ? 'ThÃ´ng tin khÃ¡ch hÃ ng Ä‘Ã£ tá»“n táº¡i trong há»‡ thá»‘ng. Vui lÃ²ng kiá»ƒm tra láº¡i CCCD hoáº·c sá»‘ Ä‘iá»‡n thoáº¡i.'
      : error.message;
    res.status(statusCode).json({ ok: false, error: message });
  }
}

async function xuLyTraCuuPhong(req, res) {
  try {
    const tieuChi = req.body;
    const ketQua = await traCuuPhongPhuHop(tieuChi);
    res.json({ ok: true, data: ketQua });
  } catch (error) {
    console.error('Lá»—i tra cá»©u phÃ²ng:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
}

async function layThongKeTongHop() {
  const { count: totalCustomers, error: errCust } = await supabase
    .from('KhachHang')
    .select('CCCD', { count: 'exact', head: true });
  if (errCust) throw errCust;

  const { count: vacantRooms, error: errVacRooms } = await supabase
    .from('Phong')
    .select('MaPhong', { count: 'exact', head: true })
    .eq('TinhTrang', true);
  if (errVacRooms) throw errVacRooms;

  const { count: vacantBeds, error: errVacBeds } = await supabase
    .from('Giuong')
    .select('MaGiuong', { count: 'exact', head: true })
    .eq('TinhTrang', true);
  if (errVacBeds) throw errVacBeds;

  const { count: rentedRooms, error: errRentRooms } = await supabase
    .from('Phong')
    .select('MaPhong', { count: 'exact', head: true })
    .eq('TinhTrang', false);
  if (errRentRooms) throw errRentRooms;

  const { count: rentedBeds, error: errRentBeds } = await supabase
    .from('Giuong')
    .select('MaGiuong', { count: 'exact', head: true })
    .eq('TinhTrang', false);
  if (errRentBeds) throw errRentBeds;

  return {
    soKhachHang: totalCustomers || 0,
    soPhongDangThue: (rentedRooms || 0) + (rentedBeds || 0),
    soPhongConTrong: (vacantRooms || 0) + (vacantBeds || 0)
  };
}

async function luuYeuCauTuVan(yc) {
  const { hoTen, sdt, email, noiDung } = yc;
  const numericCCCD = Number(sdt.replace(/\D/g, '')) || Math.floor(Math.random() * 9000000000) + 1000000000;

  const { data: savedCust, error: errCust } = await supabase
    .from('KhachHang')
    .upsert({
      CCCD: numericCCCD,
      HoTen: hoTen,
      SDT: sdt,
      Email: email,
      QuocTich: 'Việt Nam',
      ThoaDK: true
    }, { onConflict: 'CCCD' })
    .select();
  if (errCust) throw errCust;

  const thoiGianThueDate = tinhNgayKetThuc(new Date().toISOString().split('T')[0], 6);

  const { data: savedReq, error: errReq } = await supabase
    .from('YeuCauThue')
    .insert({
      SoNguoiDuKien: 1,
      GioiTinh: 'Táº¥t cáº£',
      KhuVucMongMuon: 'Táº¥t cáº£',
      LoaiPhong: null,
      LoaiThue: 'Chưa xác định',
      NganSach: null,
      ThoiGianVao: new Date().toISOString(),
      ThoiGianThue: thoiGianThueDate,
      YeuCau: `KhÃ¡ch Ä‘Äƒng kÃ½ nháº­n tÆ° váº¥n: ${noiDung || 'Cáº§n tÆ° váº¥n thÃ´ng tin homestay/dorm'}`,
      TrangThai: false, // unprocessed
      NgayTao: new Date().toISOString(),
      CCCD: numericCCCD,
      MaNV: null
    })
    .select();
  if (errReq) throw errReq;

  return {
    khachHang: savedCust && savedCust.length > 0 ? savedCust[0] : null,
    yeuCauThue: savedReq && savedReq.length > 0 ? savedReq[0] : null
  };
}

async function xuLyLayThongKeTongHop(req, res) {
  try {
    const stats = await layThongKeTongHop();
    res.json({ ok: true, data: stats });
  } catch (error) {
    console.error('Lá»—i láº¥y thá»‘ng kÃª tá»•ng há»£p:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
}

async function xuLyGuiYeuCauTuVan(req, res) {
  try {
    const dataTuVan = req.body;
    if (!dataTuVan.hoTen || !dataTuVan.sdt) {
      return res.status(400).json({ ok: false, error: 'Thiáº¿u thÃ´ng tin báº¯t buá»™c (Há» tÃªn, Sá»‘ Ä‘iá»‡n thoáº¡i)' });
    }
    const ketQua = await luuYeuCauTuVan(dataTuVan);
    res.json({ ok: true, message: 'Gá»­i yÃªu cáº§u tÆ° váº¥n thÃ nh cÃ´ng!', data: ketQua });
  } catch (error) {
    console.error('Lá»—i gá»­i yÃªu cáº§u tÆ° váº¥n:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
}

async function datLichXemPhong(yc) {
  const { hoTen, sdt, email, ngayGioHen, ghiChu, maPhong, loaiPhong, maYC, cccd, diaChi, ngaySinh, gioiTinh, maGiuong } = yc;
  const maNVThucHien = Number(yc.maNV ?? yc.MaNV ?? yc.nvSale ?? yc.NVSale) || null;
  const diaChiKhachHang = String(diaChi ?? yc.DiaChi ?? '').trim();
  const ngaySinhKhachHang = String(ngaySinh ?? yc.NgaySinh ?? '').trim();
  const gioiTinhKhachHang = String(gioiTinh ?? yc.GioiTinh ?? '').trim();
  const khaNangTaiChinhKhachHang = laySoTienNumber(
    yc.khaNangTaiChinh ?? yc.KhaNangTaiChinh ?? yc.yeuCauThue?.mucGiaDen ?? yc.boLocTraCuu?.mucGiaDen
  );
  const maGiuongHen = Number(maGiuong ?? yc.MaGiuong) || null;
  const maPhongLichHen = Number(maPhong ?? yc.MaPhong) || null;
  const ghiChuLichHen = maGiuongHen
    ? `[MA_GIUONG:${maGiuongHen}]${ghiChu?.trim() ? ` ${ghiChu.trim()}` : ''}`
    : (ghiChu?.trim() || null);
  const numericCCCD = Number(String(cccd || '').replace(/\D/g, '')) || Number(sdt.replace(/\D/g, '')) || Math.floor(Math.random() * 9000000000) + 1000000000;
  let savedCust = null;
  let savedReq = null;
  let maYCHen = Number(maYC) || null;

  if (maYCHen) {
    const { data: yeuCauDaCo, error: errYeuCauDaCo } = await supabase
      .from('YeuCauThue')
      .select('*')
      .eq('MaYC', maYCHen)
      .maybeSingle();
    if (errYeuCauDaCo) throw errYeuCauDaCo;
    savedReq = yeuCauDaCo ? [yeuCauDaCo] : [];
    if (yeuCauDaCo && maNVThucHien && !yeuCauDaCo.MaNV) {
      const { data: yeuCauCapNhat, error: errCapNhatYeuCau } = await supabase
        .from('YeuCauThue')
        .update({ MaNV: maNVThucHien })
        .eq('MaYC', maYCHen)
        .select();
      if (errCapNhatYeuCau) throw errCapNhatYeuCau;
      savedReq = yeuCauCapNhat;
    }
    if (yeuCauDaCo?.CCCD) {
      const thongTinCapNhatKhach = {};
      if (diaChiKhachHang) thongTinCapNhatKhach.DiaChi = diaChiKhachHang;
      if (ngaySinhKhachHang) thongTinCapNhatKhach.NgaySinh = ngaySinhKhachHang;
      if (gioiTinhKhachHang) thongTinCapNhatKhach.GioiTinh = gioiTinhKhachHang;
      if (khaNangTaiChinhKhachHang) thongTinCapNhatKhach.KhaNangTaiChinh = khaNangTaiChinhKhachHang;
      if (email) thongTinCapNhatKhach.Email = email;
      if (sdt) thongTinCapNhatKhach.SDT = String(sdt).replace(/\D/g, '');
      if (Object.keys(thongTinCapNhatKhach).length > 0) {
        const { error: errCapNhatKhach } = await supabase
          .from('KhachHang')
          .update(thongTinCapNhatKhach)
          .eq('CCCD', yeuCauDaCo.CCCD);
        if (errCapNhatKhach) throw errCapNhatKhach;
      }
    }
  } else {

    // 1. Upsert customer
    const payloadKhachHangHen = {
      CCCD: numericCCCD,
      HoTen: hoTen,
      SDT: sdt,
      QuocTich: 'Việt Nam',
      ThoaDK: true
    };
    if (email) payloadKhachHangHen.Email = email;
    if (diaChiKhachHang) payloadKhachHangHen.DiaChi = diaChiKhachHang;
    if (ngaySinhKhachHang) payloadKhachHangHen.NgaySinh = ngaySinhKhachHang;
    if (gioiTinhKhachHang) payloadKhachHangHen.GioiTinh = gioiTinhKhachHang;
    if (khaNangTaiChinhKhachHang) payloadKhachHangHen.KhaNangTaiChinh = khaNangTaiChinhKhachHang;

    const { data: upsertedCustomer, error: errCust } = await supabase
      .from('KhachHang')
      .upsert(payloadKhachHangHen, { onConflict: 'CCCD' })
      .select();
    if (errCust) throw errCust;
    savedCust = upsertedCustomer;

    // 2. Create YeuCauThue
    const thoiGianThueDate = tinhNgayKetThuc(new Date().toISOString().split('T')[0], 6);
    const yeuCauHen = yc.yeuCauThue || {};
    const boLocHen = yc.boLocTraCuu || {};
    const loaiPhongBoLoc = chuanHoaTimKiem(boLocHen.loaiPhong || '');
    const loaiPhongYeuCau = yeuCauHen.loaiPhong
      || (loaiPhongBoLoc.includes('phong') && !loaiPhongBoLoc.includes('giuong') ? 'Nguyên phòng' : '')
      || (loaiPhong === 'Giuong' ? 'Giường ghép' : 'Nguyên phòng');
    const loaiThueYeuCau = chuanHoaLoaiThue(yeuCauHen.loaiThue || loaiPhongYeuCau || loaiPhong);
    const yeuCauListHen = Array.isArray(yeuCauHen.yeuCauList) && yeuCauHen.yeuCauList.length
      ? yeuCauHen.yeuCauList
      : (Array.isArray(boLocHen.yeuCauList) ? boLocHen.yeuCauList : []);
    const { data: insertedReq, error: errReq } = await supabase
      .from('YeuCauThue')
      .insert({
        SoNguoiDuKien: Number(yeuCauHen.soNguoi || boLocHen.soNguoi) || 1,
        NganSach: laySoTienNumber(yeuCauHen.mucGiaDen ?? boLocHen.mucGiaDen),
        GioiTinh: yeuCauHen.gioiTinh || boLocHen.gioiTinh || 'Táº¥t cáº£',
        KhuVucMongMuon: yeuCauHen.khuVucMongMuon || boLocHen.khuVuc || 'Táº¥t cáº£',
        LoaiPhong: layMaLoaiPhongYeuCau(yeuCauHen),
        LoaiThue: loaiThueYeuCau,
        ThoiGianVao: new Date().toISOString(),
        ThoiGianThue: thoiGianThueDate,
        TrangThai: false,
        YeuCau: taoNoiDungYeuCauThue(
          { ...yeuCauHen, yeuCauList: yeuCauListHen },
          maPhongLichHen ? `ÄÄƒng kÃ½ háº¹n xem phÃ²ng ${maPhongLichHen}` : 'ÄÄƒng kÃ½ háº¹n xem phÃ²ng'
        ),
        NgayTao: new Date().toISOString(),
        CCCD: numericCCCD,
        MaNV: maNVThucHien
      })
      .select();
    if (errReq) throw errReq;
    savedReq = insertedReq;
    maYCHen = savedReq[0].MaYC;
  }

  // 3. Create LichXemPhong
  const { data: savedLich, error: errLich } = await supabase
    .from('LichXemPhong')
    .insert({
      NgayGioHen: chuanHoaNgayGioHenDB(ngayGioHen),
      GhiChu: ghiChuLichHen,
      MaPhong: maPhongLichHen,
      MaYC: maYCHen,
      KetQua: 'Chưa xem'
    })
    .select();
  if (errLich) throw errLich;

  return {
    khachHang: savedCust && savedCust.length > 0 ? savedCust[0] : null,
    yeuCauThue: savedReq && savedReq.length > 0 ? savedReq[0] : null,
    lichXemPhong: savedLich && savedLich.length > 0 ? savedLich[0] : null
  };
}

async function xuLyDatLichXemPhong(req, res) {
  try {
    const dataLich = req.body;
    if (!dataLich.hoTen || !dataLich.sdt || !dataLich.ngayGioHen) {
      return res.status(400).json({ ok: false, error: 'Thiếu thông tin bắt buộc (Họ tên, Số điện thoại, Ngày giờ hẹn)' });
    }
    const thoiDiemHen = taoDateLocal(dataLich.ngayGioHen);
    if (Number.isNaN(thoiDiemHen.getTime()) || thoiDiemHen.getTime() < Date.now()) {
      return res.status(400).json({ ok: false, error: 'Thời điểm hẹn phải từ hiện tại trở đi.' });
    }
    const ketQua = await datLichXemPhong(dataLich);
    res.json({ ok: true, message: 'ÄÄƒng kÃ½ lá»‹ch háº¹n xem phÃ²ng thÃ nh cÃ´ng!', data: ketQua });
  } catch (error) {
    console.error('Lỗi đặt lịch hẹn xem phòng:', error);
    res.status(error.statusCode || 500).json({ ok: false, error: error.message });
  }
}

async function xuLyLayDanhSachLichHen(req, res) {
  try {
    const { data, error } = await supabase
      .from('LichXemPhong')
      .select(`
        MaLich,
        NgayGioHen,
        KetQua,
        GhiChu,
        MaPhong,
        YeuCauThue (
          MaYC,
          CCCD,
          SoNguoiDuKien,
          GioiTinh,
          KhuVucMongMuon,
          LoaiPhong,
          LoaiThue,
          NganSach,
          YeuCau,
          KhachHang (
            CCCD,
            HoTen,
            SDT,
            Email
          )
        )
      `)
      .order('NgayGioHen', { ascending: false });

    if (error) throw error;
    const dataCoGoiY = await Promise.all((data || []).map(async (lich) => {
      const [phongGoiYRaw, khoaPhongChot] = await Promise.all([
        layPhongGoiYTheoYeuCauThue(lich.YeuCauThue).catch((err) => {
          console.error('Loi lay phong goi y lich hen:', err);
          return [];
        }),
        khachDaDatCocPhong(lich.YeuCauThue?.CCCD, lich.MaPhong),
      ]);
      const phongGoiY = Array.isArray(phongGoiYRaw) ? [...phongGoiYRaw] : [];
      const maPhongChot = Number(lich.MaPhong) || null;
      if (maPhongChot && !phongGoiY.some((room) => Number(room?.maPhong || room?.maId) === maPhongChot)) {
        const { data: phongChot, error: errPhongChot } = await supabase
          .from('Phong')
          .select('MaPhong, ChiNhanh(TenCN)')
          .eq('MaPhong', maPhongChot)
          .maybeSingle();
        if (errPhongChot) throw errPhongChot;
        if (phongChot) {
          phongGoiY.push({
            maId: Number(phongChot.MaPhong),
            maPhong: Number(phongChot.MaPhong),
            ten: `Phòng ${phongChot.MaPhong}`,
            chiNhanh: phongChot.ChiNhanh?.TenCN || '',
          });
        }
      }

      return {
        ...lich,
        PhongGoiY: phongGoiY,
        KhoaPhongChot: khoaPhongChot,
      };
    }));

    res.json({ ok: true, data: dataCoGoiY });
  } catch (error) {
    console.error('Lá»—i khi láº¥y danh sÃ¡ch lá»‹ch háº¹n:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
}

async function xuLyCapNhatTrangThaiHen(req, res) {
  try {
    const { maLich, ketQua, ghiChu, maPhong } = req.body;
    const coKetQua = Object.prototype.hasOwnProperty.call(req.body, 'ketQua');
    const coGhiChu = Object.prototype.hasOwnProperty.call(req.body, 'ghiChu');
    const coMaPhong = Object.prototype.hasOwnProperty.call(req.body, 'maPhong');
    if (!maLich || (!coKetQua && !coGhiChu && !coMaPhong)) {
      return res.status(400).json({ ok: false, error: 'Thiáº¿u thÃ´ng tin maLich hoáº·c ketQua' });
    }
    const duLieuCapNhat = {};
    if (coKetQua) {
      const trangThaiHopLe = ['Chưa xem', 'Đã xem'];
      if (!trangThaiHopLe.includes(ketQua)) {
        return res.status(400).json({ ok: false, error: 'Tráº¡ng thÃ¡i lá»‹ch háº¹n khÃ´ng há»£p lá»‡' });
      }
      duLieuCapNhat.KetQua = ketQua;
    }
    if (coGhiChu) {
      duLieuCapNhat.GhiChu = ghiChu?.trim() || null;
    }
    if (coMaPhong) {
      const maPhongMoi = maPhong === null || maPhong === '' ? null : Number(maPhong);
      if (maPhongMoi !== null && (!Number.isInteger(maPhongMoi) || maPhongMoi <= 0)) {
        return res.status(400).json({ ok: false, error: 'MÃ£ phÃ²ng chá»‘t khÃ´ng há»£p lá»‡' });
      }
      const { data: lichHienTai, error: errLichHienTai } = await supabase
        .from('LichXemPhong')
        .select('MaPhong, YeuCauThue(*)')
        .eq('MaLich', Number(maLich))
        .maybeSingle();
      if (errLichHienTai) throw errLichHienTai;
      if (!lichHienTai) {
        return res.status(404).json({ ok: false, error: 'Không tìm thấy lịch hẹn' });
      }
      const maPhongHienTai = Number(lichHienTai.MaPhong) || null;
      const daKhoaPhongChot = await khachDaDatCocPhong(lichHienTai?.YeuCauThue?.CCCD, lichHienTai?.MaPhong);
      if (daKhoaPhongChot && maPhongMoi !== maPhongHienTai) {
        return res.status(409).json({ ok: false, error: 'Khach hang da co dat coc cho phong nay, khong the doi phong chot.' });
      }
      if (maPhongMoi !== null && maPhongMoi !== maPhongHienTai) {
        const phongGoiY = await layPhongGoiYTheoYeuCauThue(lichHienTai.YeuCauThue);
        let phongConHopLe = phongGoiY.some((room) => Number(room?.maPhong || room?.maId) === maPhongMoi);
        if (!phongConHopLe) {
          phongConHopLe = await phongConKhaDungChoYeuCau(maPhongMoi, lichHienTai.YeuCauThue);
        }
        if (!phongConHopLe) {
          return res.status(409).json({ ok: false, error: 'Phòng này không còn phù hợp hoặc đã được đặt cọc.' });
        }
      }
      duLieuCapNhat.MaPhong = maPhongMoi;
    }
    const { data, error } = await supabase
      .from('LichXemPhong')
      .update(duLieuCapNhat)
      .eq('MaLich', Number(maLich))
      .select();

    if (error) throw error;
    res.json({ ok: true, data });
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái hẹn:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
}

// REST API Endpoints
app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Server is running' });
});

app.get('/api/thong-ke-phong', xuLyLayThongKe);
app.get('/api/thong-ke-tong-hop', xuLyLayThongKeTongHop);
app.get('/api/tuy-chon-tra-cuu-phong', xuLyLayTuyChonTraCuuPhong);
app.post('/api/tiep-nhan', xuLyTiepNhanThongTin);
app.post('/api/tra-cuu-phong', xuLyTraCuuPhong);
app.post('/api/gui-tu-van', xuLyGuiYeuCauTuVan);
app.post('/api/dat-lich-hen', xuLyDatLichXemPhong);
app.get('/api/danh-sach-lich-hen', xuLyLayDanhSachLichHen);
app.post('/api/cap-nhat-trang-thai-hen', xuLyCapNhatTrangThaiHen);
app.use('/api/kiem-tra-luu-tru', stayCheckRoutes);
app.use('/api/nhan-phong', nhanPhongRoutes);
app.use('/api/hop-dong', contractRoutes);
app.use('/api/ban-giao', handoverRoutes);
app.use('/api/ke-toan', paymentRoutes);
app.use('/api/thanh-ly', liquidationRoutes);
app.use('/api/dat-coc', datCocRoutes);

ganRouteAuthDashboard(app);
ganRouteQuanTri(app);

app.get('/api/supabase-test', async (req, res) => {
  try {
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });

    if (error) {
      return res.status(500).json({ ok: false, error: error.message });
    }

    res.json({
      ok: true,
      message: 'Connected to Supabase successfully',
      usersCount: data?.users?.length ?? 0,
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});


async function taiPhieuDoiSoatDatCoc(maDatCoc) {
  const { data, error } = await supabase
    .from('PhieuDoiSoat')
    .select('*')
    .eq('MaDatCoc', maDatCoc)
    .order('MaPhieu', { ascending: false })
    .limit(1);
  if (error) console.error('Lá»—i taiPhieuDoiSoatDatCoc:', error);
  return data && data.length > 0 ? data[0] : null;
}

async function luuPhieuDoiSoatDatCoc(maDatCoc, fields) {
  const existing = await taiPhieuDoiSoatDatCoc(maDatCoc);
  const khauTruKhac = locKhauTruThat(fields.DanhSachKhauTru || []);
  const payload = {
    ...fields,
    DanhSachKhauTru: [...taoMetaDatCoc(maDatCoc), ...khauTruKhac],
  };

  if (existing?.MaPhieu) {
    const { error } = await supabase.from('PhieuDoiSoat').update(payload).eq('MaPhieu', existing.MaPhieu);
    if (error) {
      console.error('Lá»–I UPDATE PHIáº¾U Äá»I SOÃT Cá»ŒC:', error);
      throw error;
    }
    return;
  }

  const insertPayload = { ...payload, MaDatCoc: maDatCoc };
  const { error } = await supabase.from('PhieuDoiSoat').insert(insertPayload);
  if (error) throw error;
}

async function layDatCocMap() {
  const { data } = await supabase.from('DatCoc').select('*');
  const map = {};
  (data || []).forEach(d => { map[d.MaDatCoc] = d; });
  return map;
}

async function layGiuongDatCocMap() {
  const { data } = await supabase
    .from('GiuongDatCoc')
    .select(`
      MaGiuong,
      MaDatCoc,
      Giuong (
        Phong (
          MaPhong,
          ChiNhanh (TenCN)
        )
      )
    `);
  const map = {};
  (data || []).forEach(g => {
    if (!map[g.MaDatCoc]) map[g.MaDatCoc] = [];
    map[g.MaDatCoc].push(g);
  });
  return map;
}

async function layHopDongDayDu(maHopDong) {
  const { data, error } = await supabase
    .from('HopDong')
    .select(`
      *,
      KhachHang (*),
      ChiTiet (
        MaGiuong,
        Giuong (
          Phong (
            MaPhong,
            ChiNhanh (TenCN)
          )
        )
      ),
      PhieuDoiSoat (*),
      BienBanBanGiao (*)
    `)
    .eq('MaHopDong', maHopDong)
    .single();
  if (error || !data) return null;
  return data;
}

async function layItemQuyetToanTuMaSo(maSo) {
  const datCocMap = await layDatCocMap();
  if (maSo.startsWith('HÄ-')) {
    const id = Number(maSo.replace('HÄ-', ''));
    const h = await layHopDongDayDu(id);
    if (!h) return null;
    return mapHopDongRaDTO(h, datCocMap);
  }
  const id = Number(maSo.replace('PC-', ''));
  const { data: d, error } = await supabase
    .from('DatCoc')
    .select('*, KhachHang (*)')
    .eq('MaDatCoc', id)
    .single();
  if (error || !d) return null;
  const giuongMap = await layGiuongDatCocMap();
  const pds = await taiPhieuDoiSoatDatCoc(id);
  return mapDatCocRaDTO(d, pds, giuongMap[id] || []);
}

function ensureCheckoutSupabase(res) {
  if (!isUsingSupabaseForCheckout) {
    res.status(503).json({
      ok: false,
      error: 'Checkout Ä‘ang yÃªu cáº§u Supabase nhÆ°ng chÆ°a káº¿t ná»‘i Ä‘Æ°á»£c. HÃ£y cáº¥u hÃ¬nh SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY vÃ  Ä‘áº£m báº£o cÃ¡c báº£ng checkout Ä‘Ã£ tá»“n táº¡i.'
    });
    return false;
  }

  return true;
}

// Database fallback check
let isUsingSupabaseForCheckout = false;

async function checkSupabaseTable() {
  try {
    const { data, error } = await supabase.from('HopDong').select('MaHopDong').limit(1);
    if (!error) {
      isUsingSupabaseForCheckout = true;
      console.log('âœ… [Supabase] Connection established successfully! Database schema is ready.');
    } else {
      console.error('âŒ [Supabase] Table verification failed. Please check table existence.', error.message);
    }
  } catch (err) {
    console.error('âŒ [Supabase] Database connection failed. Please check environment variables.', err.message);
  }
}

// Check database table after startup
setTimeout(checkSupabaseTable, 1000);

app.post('/api/checkout/reset', async (req, res) => {
  if (!ensureCheckoutSupabase(res)) {
    return;
  }

  try {
    await supabase.from('PhieuDoiSoat').delete().neq('MaPhieu', 0);
    await supabase.from('BienBanBanGiao').delete().neq('MaBB', 0);
    await supabase.from('HopDong').delete().neq('MaHopDong', 0);
    await supabase.from('DatCoc').delete().neq('MaDatCoc', 0);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 1. GET /api/checkout/list
app.get('/api/checkout/list', async (req, res) => {
  if (!ensureCheckoutSupabase(res)) {
    return;
  }

  try {
    const datCocMap = await layDatCocMap();
    const giuongDatCocMap = await layGiuongDatCocMap();

    const { data: pdsList, error: errPDS } = await supabase
      .from('PhieuDoiSoat')
      .select(`
        *,
        HopDong (
          *,
          KhachHang (*),
          ChiTiet (
            MaGiuong,
            Giuong (
              Phong (
                MaPhong,
                ChiNhanh (TenCN)
              )
            )
          ),
          BienBanBanGiao (*)
        ),
        DatCoc (
          *,
          KhachHang (*)
        )
      `);
    if (errPDS) throw errPDS;

    const mappedList = [];
    
    for (const pds of (pdsList || [])) {
      if (pds.MaHopDong && pds.HopDong) {
        // We need to pass the HopDong with its embedded PhieuDoiSoat array 
        // because mapHopDongRaDTO expects `h.PhieuDoiSoat` to be an array
        const h = { ...pds.HopDong, PhieuDoiSoat: [pds] };
        mappedList.push(mapHopDongRaDTO(h, datCocMap));
      } else if (pds.MaDatCoc && pds.DatCoc) {
        const d = pds.DatCoc;
        const giuongCoc = giuongDatCocMap[d.MaDatCoc] || [];
        mappedList.push(mapDatCocRaDTO(d, pds, giuongCoc));
      }
    }

    res.json({ ok: true, data: mappedList });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 2. GET /api/checkout/detail?id=...
app.get('/api/checkout/detail', async (req, res) => {
  const maSo = req.query.id;
  if (!ensureCheckoutSupabase(res)) {
    return;
  }

  try {
    const item = await layItemQuyetToanTuMaSo(maSo);
    if (!item) {
      return res.status(404).json({ ok: false, error: 'KhÃ´ng tÃ¬m tháº¥y há»“ sÆ¡ quyáº¿t toÃ¡n!' });
    }
    res.json({ ok: true, data: item });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 3. POST /api/checkout/request â€” Sale tiáº¿p nháº­n yÃªu cáº§u tráº£ phÃ²ng / há»§y cá»c
app.post('/api/checkout/request', async (req, res) => {
  const { maSoChungTu, loaiHinhTraPhong, ngayTraDuKien, lyDo, phuongThucHoanTien } = req.body;
  if (!ensureCheckoutSupabase(res)) {
    return;
  }

  try {
    const nextTrangThai = 'Chá» kiá»ƒm tra';
    if (!maSoChungTu) {
      return res.status(400).json({ ok: false, error: 'Thiáº¿u mÃ£ chá»©ng tá»«' });
    }

    const maSo = String(maSoChungTu).trim();
    const isDatCoc = /^PC-/i.test(maSo);
    const idTuMa = Number(String(maSo.split('-').pop() || '').replace(/\D/g, ''));
    const isHopDong = !isDatCoc && Number.isFinite(idTuMa) && idTuMa > 0;

    console.log('[checkout/request]', { maSo, isDatCoc, isHopDong, idTuMa, loaiHinhTraPhong });

    if (isHopDong) {
      const id = idTuMa;

      const { data: updatedRows, error: errHd } = await supabase
        .from('HopDong')
        .update({ TrangThai: nextTrangThai })
        .eq('MaHopDong', id)
        .select('MaHopDong, TrangThai');
      if (errHd) throw errHd;
      if (!updatedRows?.length) {
        return res.status(404).json({ ok: false, error: `Không cập nhật được hợp đồng MaHopDong=${id}` });
      }
      console.log('[checkout/request] HopDong updated:', updatedRows[0]);

      const hopDong = await layHopDongDayDu(id);
      const datCocMap = await layDatCocMap();
      const dto = hopDong ? mapHopDongRaDTO(hopDong, datCocMap) : null;
      const tyLeHoan = tinhTyLeHoanCoc({
        loai: 'hop_dong',
        loaiHinhTraPhong,
        ngayBatDau: dto?.ngayBatDau,
        ngayKetThuc: dto?.ngayKetThuc,
        ngayTraDuKien
      });

      const { data: existing } = await supabase.from('PhieuDoiSoat').select('MaPhieu').eq('MaHopDong', id).maybeSingle();
      const pdsPayload = {
        NgayDKTraPhong: ngayTraDuKien,
        LoaiHinhTraPhong: loaiHinhTraPhong,
        LyDoTraPhong: lyDo,
        HinhThucHoan: phuongThucHoanTien,
        TrangThai: nextTrangThai,
        TyLeHoanTien: tyLeHoan
      };

      if (existing) {
        await supabase.from('PhieuDoiSoat').update(pdsPayload).eq('MaHopDong', id);
      } else {
        await supabase.from('PhieuDoiSoat').insert({ ...pdsPayload, MaHopDong: id });
      }
    } else if (isDatCoc) {
      const id = idTuMa;
      if (!Number.isFinite(id) || id <= 0) {
        return res.status(400).json({ ok: false, error: 'Mã đặt cọc không hợp lệ' });
      }
      const { error: errDc } = await supabase.from('DatCoc').update({ TrangThai: nextTrangThai }).eq('MaDatCoc', id);
      if (errDc) throw errDc;
      await luuPhieuDoiSoatDatCoc(id, {
        NgayDKTraPhong: ngayTraDuKien,
        LoaiHinhTraPhong: loaiHinhTraPhong || 'huy_thue',
        LyDoTraPhong: lyDo,
        HinhThucHoan: phuongThucHoanTien,
        TrangThai: nextTrangThai,
        TyLeHoanTien: 80
      });
    } else {
      return res.status(400).json({ ok: false, error: `Mã chứng từ không hợp lệ: ${maSo}` });
    }
    res.json({ ok: true, trangThai: nextTrangThai });
  } catch (err) {
    console.error('[checkout/request] error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 4. POST /api/checkout/inspect â€” Quáº£n lÃ½ kiá»ƒm phÃ²ng / xÃ¡c nháº­n há»§y cá»c
app.post('/api/checkout/inspect', async (req, res) => {
  const {
    maChungTu,
    chiPhiHuHong,
    moTaHuHong,
    checklistSach,
    checklistTaiSan,
    checklistChiaKhoa
  } = req.body;
  if (!ensureCheckoutSupabase(res)) {
    return;
  }

  try {
    const nextTrangThai = 'Chá» Ä‘á»‘i soÃ¡t';

    if (maChungTu.startsWith('HÄ-')) {
      const id = Number(maChungTu.replace('HÄ-', ''));

      await supabase.from('HopDong').update({ TrangThai: nextTrangThai }).eq('MaHopDong', id);
      await supabase.from('PhieuDoiSoat').update({
        KhauTruSuaChua: Number(chiPhiHuHong) || 0,
        TrangThai: nextTrangThai
      }).eq('MaHopDong', id);

      const bbPayload = {
        TinhTrangPhong: 'Nghiá»‡m thu thu há»“i',
        MoTaHuHong: moTaHuHong || '',
        NgayBanGiao: new Date().toISOString().split('T')[0],
        TrangThai: 'ÄÃ£ nghiá»‡m thu'
      };

      const { data: existingBB } = await supabase.from('BienBanBanGiao').select('MaBB').eq('MaHopDong', id).maybeSingle();
      if (existingBB) {
        await supabase.from('BienBanBanGiao').update(bbPayload).eq('MaHopDong', id);
      } else {
        await supabase.from('BienBanBanGiao').insert({
          ...bbPayload,
          LoaiBB: 'Thu Há»“i',
          MaHopDong: id
        });
      }
    } else {
      const id = Number(maChungTu.replace('PC-', ''));
      await supabase.from('DatCoc').update({ TrangThai: nextTrangThai }).eq('MaDatCoc', id);
      await luuPhieuDoiSoatDatCoc(id, {
        TrangThai: nextTrangThai
      });

      const { data: giuongCoc } = await supabase.from('GiuongDatCoc').select('MaGiuong').eq('MaDatCoc', id);
      if (giuongCoc?.length) {
        const bedIds = giuongCoc.map(g => g.MaGiuong);
        await supabase.from('Giuong').update({ TinhTrang: true }).in('MaGiuong', bedIds);
      }
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 5. POST /api/checkout/reconcile â€” Káº¿ toÃ¡n láº­p phiáº¿u Ä‘á»‘i soÃ¡t
app.post('/api/checkout/reconcile', async (req, res) => {
  const { maChungTu, tiLeHoanCoc, noThue, noDienNuoc, chiPhiHuHong, moTaKhauTru, danhSachKhauTruKhac } = req.body;
  if (!ensureCheckoutSupabase(res)) {
    return;
  }

  try {
    const nextTrangThai = 'Chá» xÃ¡c nháº­n Ä‘á»‘i soÃ¡t';

    if (maChungTu.startsWith('HÄ-')) {
      const id = Number(maChungTu.replace('HÄ-', ''));

      const h = await layHopDongDayDu(id);
      let soTienHoan = 0;
      if (h) {
        const item = mapHopDongRaDTO(h, await layDatCocMap());
        item.tiLeHoanCoc = Number(tiLeHoanCoc) || 100;
        item.noThue = Number(noThue) || 0;
        item.noDienNuoc = Number(noDienNuoc) || 0;
        item.chiPhiHuHong = Number(chiPhiHuHong) || 0;
        item.danhSachKhauTruKhac = danhSachKhauTruKhac || [];
        soTienHoan = tinhSoTienQuyetToan(item);
      }

      await supabase.from('HopDong').update({ TrangThai: nextTrangThai }).eq('MaHopDong', id);
      await supabase.from('PhieuDoiSoat').update({
        TyLeHoanTien: Number(tiLeHoanCoc) || 100,
        KhauTruTienThue: Number(noThue) || 0,
        KhauTruTienDichVu: Number(noDienNuoc) || 0,
        KhauTruSuaChua: Number(chiPhiHuHong) || 0,
        DanhSachKhauTru: danhSachKhauTruKhac || [],
        TrangThai: nextTrangThai,
        SoTienHoanTamTinh: soTienHoan,
        SoTienHoanThuc: soTienHoan
      }).eq('MaHopDong', id);

      const { data: existingBB } = await supabase.from('BienBanBanGiao').select('MaBB').eq('MaHopDong', id).maybeSingle();
      if (existingBB) {
        await supabase.from('BienBanBanGiao').update({ MoTaHuHong: moTaKhauTru || '' }).eq('MaHopDong', id);
      }
    } else {
      const id = Number(maChungTu.replace('PC-', ''));
      const { data: d } = await supabase.from('DatCoc').select('SoTienCoc').eq('MaDatCoc', id).single();
      const tienCocGoc = Number(d?.SoTienCoc || 0);
      const tiLe = Number(tiLeHoanCoc) || 80;
      const soTienHoan = tienCocGoc * (tiLe / 100);

      await supabase.from('DatCoc').update({ TrangThai: nextTrangThai }).eq('MaDatCoc', id);
      await luuPhieuDoiSoatDatCoc(id, {
        TyLeHoanTien: tiLe,
        KhauTruTienThue: 0,
        KhauTruTienDichVu: 0,
        KhauTruSuaChua: 0,
        DanhSachKhauTru: danhSachKhauTruKhac || [],
        SoTienHoanTamTinh: soTienHoan,
        SoTienHoanThuc: soTienHoan,
        TrangThai: nextTrangThai
      });
    }

    const io = getIO();
    if (io) {
      // Notify manager and sale that there is a new reconciliation to confirm with customer
      io.to('role:QUAN_LY').emit('thong_bao_moi', {
        noiDung: `CÃ³ phiáº¿u Ä‘á»‘i soÃ¡t má»›i cáº§n khÃ¡ch hÃ ng xÃ¡c nháº­n cho ${maChungTu}.`,
        loaiSuKien: 'Chá» xÃ¡c nháº­n Ä‘á»‘i soÃ¡t'
      });
      // Currently sale role might also need this, let's emit to QUAN_LY for now as they handle checkout confirmation
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 6. POST /api/checkout/confirm â€” Quáº£n lÃ½ xÃ¡c nháº­n Ä‘á»‘i soÃ¡t vá»›i khÃ¡ch
app.post('/api/checkout/confirm', async (req, res) => {
  console.log('--- POST /api/checkout/confirm CALLED ---', req.body);
  const { maChungTu, phanHoiKhach, yKienTranhChap } = req.body;
  if (!ensureCheckoutSupabase(res)) {
    return;
  }

  try {
    const isDongY = phanHoiKhach === 'dong_y';
    let nextTrangThai = 'Chá» Ä‘á»‘i soÃ¡t';

    if (maChungTu.startsWith('HÄ-')) {
      const id = Number(maChungTu.replace('HÄ-', ''));

      if (isDongY) {
        const item = await layItemQuyetToanTuMaSo(`HÄ-${id}`);
        if (item) {
          const soTien = tinhSoTienQuyetToan(item);
          nextTrangThai = soTien < 0 ? 'Chá» thanh toÃ¡n thÃªm' : 'Chá» hoÃ n cá»c';
        } else {
          nextTrangThai = 'Chá» hoÃ n cá»c';
        }
      }

      await supabase.from('HopDong').update({ TrangThai: nextTrangThai }).eq('MaHopDong', id);
      await supabase.from('PhieuDoiSoat').update({
        TrangThai: nextTrangThai,
        YKienTranhChap: isDongY ? '' : (yKienTranhChap || 'KhÃ¡ch hÃ ng khiáº¿u náº¡i.')
      }).eq('MaHopDong', id);
    } else {
      const id = Number(maChungTu.replace('PC-', ''));

      if (isDongY) {
        const item = await layItemQuyetToanTuMaSo(`PC-${id}`);
        if (item) {
          const soTien = tinhSoTienQuyetToan(item);
          nextTrangThai = soTien < 0 ? 'Chá» thanh toÃ¡n thÃªm' : 'Chá» hoÃ n cá»c';
        } else {
          nextTrangThai = 'Chá» hoÃ n cá»c';
        }
      }

      await supabase.from('DatCoc').update({ TrangThai: nextTrangThai }).eq('MaDatCoc', id);
      await luuPhieuDoiSoatDatCoc(id, { TrangThai: nextTrangThai, YKienTranhChap: isDongY ? '' : (yKienTranhChap || 'KhÃ¡ch hÃ ng khiáº¿u náº¡i.') });
    }

    const io = getIO();
    if (io) {
      if (isDongY) {
        io.to('role:KE_TOAN').emit('thong_bao_moi', {
          noiDung: `KhÃ¡ch hÃ ng Ä‘Ã£ Ä‘á»“ng Ã½ Ä‘á»‘i soÃ¡t cho ${maChungTu}. Vui lÃ²ng tiáº¿n hÃ nh hoÃ n cá»c hoáº·c thu thÃªm.`,
          loaiSuKien: nextTrangThai
        });
      } else {
        io.to('role:KE_TOAN').emit('thong_bao_moi', {
          noiDung: `KhÃ¡ch hÃ ng khiáº¿u náº¡i Ä‘á»‘i soÃ¡t cho ${maChungTu}. Vui lÃ²ng kiá»ƒm tra láº¡i.`,
          loaiSuKien: nextTrangThai
        });
      }
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ThÃªm API má»›i Ä‘á»ƒ cáº­p nháº­t tráº¡ng thÃ¡i há»£p Ä‘á»“ng vÃ  phiáº¿u Ä‘á»‘i soÃ¡t
app.post('/api/phieu-doi-soat/xac-nhan-khach', async (req, res) => {
  const { maHD, trangThai } = req.body;
  if (!ensureCheckoutSupabase(res)) return;

  try {
    const isDatCoc = maHD.startsWith('PC');
    const id = parseInt(maHD.replace(/\D/g, ''), 10);
    
    if (isDatCoc) {
      // Cáº­p nháº­t phiáº¿u Ä‘á»‘i soÃ¡t (mÃ£ Ä‘áº·t cá»c)
      const { error: errPDS } = await supabase.from('PhieuDoiSoat').update({ TrangThai: trangThai }).eq('MaDatCoc', id);
      if (errPDS) throw errPDS;

      // Cáº­p nháº­t Äáº·t Cá»c
      const { error: errDC } = await supabase.from('DatCoc').update({ TrangThai: trangThai }).eq('MaDatCoc', id);
      if (errDC) throw errDC;
    } else {
      // Cáº­p nháº­t phiáº¿u Ä‘á»‘i soÃ¡t (mÃ£ há»£p Ä‘á»“ng)
      const { error: errPDS } = await supabase.from('PhieuDoiSoat').update({ TrangThai: trangThai }).eq('MaHopDong', id);
      if (errPDS) throw errPDS;

      // Cáº­p nháº­t Há»£p Ä‘á»“ng
      const { error: errHD } = await supabase.from('HopDong').update({ TrangThai: trangThai }).eq('MaHopDong', id);
      if (errHD) throw errHD;
    }

    const io = getIO();
    if (io) {
      if (trangThai === 'Chá» hoÃ n cá»c' || trangThai === 'Chá» thanh toÃ¡n thÃªm') {
        io.to('role:KE_TOAN').emit('thong_bao_moi', {
          noiDung: `KhÃ¡ch hÃ ng Ä‘Ã£ Ä‘á»“ng Ã½ Ä‘á»‘i soÃ¡t cho ${maHD}. Vui lÃ²ng tiáº¿n hÃ nh hoÃ n cá»c hoáº·c thu thÃªm.`,
          loaiSuKien: trangThai
        });
      }
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Error updating PDS status:', error);
    res.status(500).json({ ok: false, message: 'Lá»—i server: ' + error.message });
  }
});

// ThÃªm API má»›i Ä‘á»ƒ hoÃ n táº¥t tráº£ phÃ²ng / thanh lÃ½
app.post('/api/phieu-doi-soat/hoan-tat-tra-phong', async (req, res) => {
  const { maHD, trangThai } = req.body;
  if (!ensureCheckoutSupabase(res)) return;

  try {
    const isDatCoc = maHD.startsWith('PC');
    const id = parseInt(maHD.replace(/\D/g, ''), 10);
    const newStatus = trangThai || 'ÄÃ£ tráº£ phÃ²ng';
    
    if (isDatCoc) {
      // Cáº­p nháº­t phiáº¿u Ä‘á»‘i soÃ¡t (mÃ£ Ä‘áº·t cá»c)
      const { error: errPDS } = await supabase.from('PhieuDoiSoat').update({ TrangThai: newStatus }).eq('MaDatCoc', id);
      if (errPDS) throw errPDS;

      // Cáº­p nháº­t Äáº·t Cá»c
      const { error: errDC } = await supabase.from('DatCoc').update({ TrangThai: newStatus }).eq('MaDatCoc', id);
      if (errDC) throw errDC;
    } else {
      // Cáº­p nháº­t phiáº¿u Ä‘á»‘i soÃ¡t (mÃ£ há»£p Ä‘á»“ng)
      const { error: errPDS } = await supabase.from('PhieuDoiSoat').update({ TrangThai: newStatus }).eq('MaHopDong', id);
      if (errPDS) throw errPDS;

      // Cáº­p nháº­t Há»£p Ä‘á»“ng
      const { error: errHD } = await supabase.from('HopDong').update({ TrangThai: newStatus }).eq('MaHopDong', id);
      if (errHD) throw errHD;
    }

    const io = getIO();
    if (io) {
      io.to('role:KE_TOAN').emit('thong_bao_moi', {
        noiDung: `Quáº£n lÃ½ Ä‘Ã£ hoÃ n táº¥t thanh lÃ½ phÃ²ng cho ${maHD}. Há»£p Ä‘á»“ng Ä‘Ã£ Ä‘Ã³ng.`,
        loaiSuKien: newStatus
      });
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Error updating to ÄÃ£ tráº£ phÃ²ng:', error);
    res.status(500).json({ ok: false, message: 'Lá»—i server: ' + error.message });
  }
});

// 7. POST /api/checkout/liquidate â€” KÃ½ biÃªn báº£n thanh lÃ½ há»£p Ä‘á»“ng / phiáº¿u cá»c
app.post('/api/checkout/liquidate', async (req, res) => {
  const { maChungTu } = req.body;
  if (!ensureCheckoutSupabase(res)) {
    return;
  }

  try {
    if (maChungTu.startsWith('HÄ-')) {
      const id = Number(maChungTu.replace('HÄ-', ''));
      const item = await layItemQuyetToanTuMaSo(`HÄ-${id}`);

      let nextTrangThai = 'ÄÃ£ thanh lÃ½';
      if (item) {
        const soTien = tinhSoTienQuyetToan(item);
        nextTrangThai = 'ÄÃ£ thanh lÃ½';
      }

      await supabase.from('HopDong').update({ TrangThai: nextTrangThai }).eq('MaHopDong', id);
      await supabase.from('PhieuDoiSoat').update({ TrangThai: nextTrangThai }).eq('MaHopDong', id);
      await supabase.from('BienBanBanGiao').update({ TrangThai: 'HoÃ n táº¥t thanh lÃ½' }).eq('MaHopDong', id);

      const { data: details } = await supabase.from('ChiTiet').select('MaGiuong').eq('MaHopDong', id);
      if (details?.length) {
        const bedIds = details.map(d => d.MaGiuong);
        await supabase.from('Giuong').update({ TinhTrang: true }).in('MaGiuong', bedIds);

        const { data: beds } = await supabase.from('Giuong').select('MaPhong').in('MaGiuong', bedIds);
        if (beds?.length) {
          const roomIds = [...new Set(beds.map(b => b.MaPhong).filter(Boolean))];
          await supabase.from('Phong').update({ TinhTrang: true }).in('MaPhong', roomIds);
        }
      }
    } else {
      const id = Number(maChungTu.replace('PC-', ''));
      const item = await layItemQuyetToanTuMaSo(`PC-${id}`);

      let nextTrangThai = 'ÄÃ£ thanh lÃ½';
      if (item) {
        const soTien = tinhSoTienQuyetToan(item);
        nextTrangThai = 'ÄÃ£ thanh lÃ½';
      }

      await supabase.from('DatCoc').update({ TrangThai: nextTrangThai }).eq('MaDatCoc', id);
      await luuPhieuDoiSoatDatCoc(id, { TrangThai: nextTrangThai });

      const { data: giuongCoc } = await supabase.from('GiuongDatCoc').select('MaGiuong').eq('MaDatCoc', id);
      if (giuongCoc?.length) {
        const bedIds = giuongCoc.map(g => g.MaGiuong);
        await supabase.from('Giuong').update({ TinhTrang: true }).in('MaGiuong', bedIds);
      }
    }
    await syncPhongGiuong();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 8. POST /api/checkout/payment â€” Káº¿ toÃ¡n hoÃ n cá»c / thu chÃªnh lá»‡ch
app.post('/api/checkout/payment', async (req, res) => {
  const { maChungTu, maGiaoDich, soTaiKhoan, tenNguoiNhan, nganHang } = req.body;
  if (!ensureCheckoutSupabase(res)) {
    return;
  }

  try {
    if (maChungTu.startsWith('HÄ-')) {
      const id = Number(maChungTu.replace('HÄ-', ''));

      const { data: pds } = await supabase.from('PhieuDoiSoat').select('TrangThai').eq('MaHopDong', id).maybeSingle();
      const isThuThem = pds?.TrangThai === 'Chá» thanh toÃ¡n' || pds?.TrangThai === 'Chá» thanh toÃ¡n thÃªm';
      const nextTrangThai = 'Chá» thanh lÃ½';

      await supabase.from('HopDong').update({ TrangThai: nextTrangThai }).eq('MaHopDong', id);
      await supabase.from('PhieuDoiSoat').update({
        TrangThai: nextTrangThai,
        MaGiaoDich: maGiaoDich
      }).eq('MaHopDong', id);

      const io = getIO();
      if (io) {
        io.to('role:QUAN_LY').emit('thong_bao_moi', {
          noiDung: `Káº¿ toÃ¡n Ä‘Ã£ hoÃ n táº¥t Ä‘á»‘i soÃ¡t cho HÄ-${id}. Há»£p Ä‘á»“ng Ä‘ang chá» thanh lÃ½ phÃ²ng.`,
          loaiSuKien: 'Chá» thanh lÃ½'
        });
      }

    } else {
      const id = Number(maChungTu.replace('PC-', ''));
      const pds = await taiPhieuDoiSoatDatCoc(id);
      const trangThaiHienTai = pds?.TrangThai || (await supabase.from('DatCoc').select('TrangThai').eq('MaDatCoc', id).single()).data?.TrangThai;
      const isThuThem = trangThaiHienTai === 'Chá» thanh toÃ¡n' || trangThaiHienTai === 'Chá» thanh toÃ¡n thÃªm';
      const nextTrangThai = 'Chá» thanh lÃ½';

      await supabase.from('DatCoc').update({ TrangThai: nextTrangThai }).eq('MaDatCoc', id);
      await luuPhieuDoiSoatDatCoc(id, {
        TrangThai: nextTrangThai,
        MaGiaoDich: maGiaoDich
      });

    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

const httpServer = createServer(app);
initSocket(httpServer);

httpServer.listen(port, () => {
  console.log(`Express server running at http://localhost:${port}`);
});

if (process.env.ENABLE_DEPOSIT_EXPIRY_JOB !== 'false') {
  const depositExpiryJob = setInterval(() => {
    huyDatCocQuaHan().catch((error) => console.error('Lá»—i job há»§y cá»c quÃ¡ háº¡n:', error.message));
  }, 60 * 1000);
  depositExpiryJob.unref();
  huyDatCocQuaHan().catch((error) => console.warn('ChÆ°a cháº¡y Ä‘Æ°á»£c job Ä‘áº·t cá»c:', error.message));
}
