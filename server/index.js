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
import datCocRoutes, { huyDatCocQuaHan } from './routes/datCoc.routes.js';
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

function chuanHoaTimKiem(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
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
  const yeuCauChuanHoa = chuanHoaTimKiem(yeuCau);
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

function phongConTrongHoanToan(phong, giuongTheoPhong) {
  const danhSachGiuong = giuongTheoPhong.get(Number(phong.MaPhong)) || [];
  if (danhSachGiuong.length === 0) return phong.TinhTrang === true;
  return phong.TinhTrang === true && danhSachGiuong.every((giuong) => giuong.TinhTrang === true);
}

function laGiaTriTatCa(value) {
  const raw = String(value || '').trim().toLowerCase();
  const normalized = chuanHoaTimKiem(raw);
  return !raw || normalized.includes('tat ca') || raw.includes('tất cả') || raw.includes('táº¥t');
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

function tachTienIch(tienIch) {
  return String(tienIch || '')
    .split(/[;,|\/\u00b7]+/)
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
  return {
    value: tenKhuVuc,
    label: `${tenKhuVuc}, TP.HCM`,
  };
}

function layDanhSachKhuVucTuText(text) {
  const normalized = chuanHoaTimKiem(text);
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
  if (khach.SDT) thongTin.push(`SĐT ${khach.SDT}`);
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
    throw taoLoiNghiepVu(409, `CCCD ${cccd} đã tồn tại${moTaKhachTrung(trungCCCD[0])}. Vui lòng kiểm tra lại khách hàng cũ.`);
  }

  const { data: trungSDT, error: loiSDT } = await supabase
    .from('KhachHang')
    .select('CCCD, HoTen, SDT')
    .eq('SDT', sdt)
    .limit(1);

  if (loiSDT) throw loiSDT;
  if (trungSDT && trungSDT.length > 0) {
    throw taoLoiNghiepVu(409, `Số điện thoại ${sdt} đã tồn tại${moTaKhachTrung(trungSDT[0])}. Vui lòng kiểm tra lại khách hàng cũ.`);
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

  if (!cccd) throw taoLoiNghiepVu(400, 'CCCD không hợp lệ.');
  if (!sdt) throw taoLoiNghiepVu(400, 'Số điện thoại không hợp lệ.');
  if (!ngaySinh) throw taoLoiNghiepVu(400, 'Ngày sinh khách hàng là bắt buộc.');
  if (!gioiTinh) throw taoLoiNghiepVu(400, 'Giới tính khách hàng là bắt buộc.');

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
      KhaNangTaiChinh: Number(kh.khaNangTaiChinh) || null,
      ThoaDK: true
    })
    .select()
    .single();

  if (error) throw error;
  return data ? { ...data, CCCD: dinhDangCCCD(data.CCCD) } : null;
}

async function taoYeuCauThue(yc, cccd, maNV = 101) {
  const thoiGianThueDate = tinhNgayKetThuc(yc.thoiGianVao, yc.thoiHanThue);

  const { data, error } = await supabase
    .from('YeuCauThue')
    .insert({
      SoNguoiDuKien: Number(yc.soNguoi),
      GioiTinh: yc.gioiTinh,
      KhuVucMongMuon: yc.khuVucMongMuon,
      LoaiPhong: yc.loaiPhong,
      MucGia: Number(yc.mucGiaDen) || null, // default to max budget
      ThoiGianVao: new Date(yc.thoiGianVao).toISOString(),
      ThoiGianThue: thoiGianThueDate,
      YeuCau: yc.yeuCauList ? yc.yeuCauList.join(', ') : '',
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
  // Query single rooms (Nguyên phòng) in Bình Thạnh (MaCN = 2)
  const { data: phongs, error: errorPhong } = await supabase
    .from('Phong')
    .select('MaPhong')
    .eq('LoaiPhong', 'Nguyên phòng')
    .eq('TinhTrang', true)
    .eq('MaCN', 2);
    
  if (errorPhong) throw errorPhong;
  
  // Query dorm beds (Giường) that are vacant (TinhTrang = true)
  const { data: giuongs, error: errorGiuong } = await supabase
    .from('Giuong')
    .select('MaGiuong, GioiTinhYeuCau, Phong!inner(MaCN, LoaiPhong)')
    .eq('TinhTrang', true);
    
  if (errorGiuong) throw errorGiuong;
  
  const countDormNuQ1 = giuongs.filter(g => g.GioiTinhYeuCau === 'Nữ' && g.Phong.MaCN === 1).length;
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
    const kvLower = tc.khuVucMongMuon.toLowerCase();
    selectedCNIds = chiNhanhs
      .filter(c => c.TenCN.toLowerCase().includes(kvLower) || c.DiaChi.toLowerCase().includes(kvLower))
      .map(c => c.MaCN);
  }

  if (laTraCuuNguyenPhong(tc)) {
    let query = supabase
      .from('Phong')
      .select('*, ChiNhanh(TenCN, DiaChi)')
      .eq('TinhTrang', true)
      .in('MaCN', selectedCNIds);

    if (tc.mucGiaTu) {
      query = query.gte('GiaThue', Number(tc.mucGiaTu));
    }
    if (tc.mucGiaDen) {
      query = query.lte('GiaThue', Number(tc.mucGiaDen));
    }
    if (tc.soNguoi) {
      query = query.gte('SucChua', Number(tc.soNguoi));
    }

    const { data: results, error: errPhong } = await query;
    if (errPhong) throw errPhong;

    const maPhongList = (results || []).map((phong) => phong.MaPhong);
    let giuongTheoPhong = new Map();

    if (maPhongList.length > 0) {
      const { data: giuongs, error: errGiuongTheoPhong } = await supabase
        .from('Giuong')
        .select('MaPhong, TinhTrang')
        .in('MaPhong', maPhongList);

      if (errGiuongTheoPhong) throw errGiuongTheoPhong;
      giuongTheoPhong = nhomGiuongTheoPhong(giuongs || []);
    }

    let filtered = (results || []).filter((room) => phongConTrongHoanToan(room, giuongTheoPhong));
    if (tc.yeuCauList && tc.yeuCauList.length > 0) {
      filtered = locTheoTienIchUuTien(filtered, room => room.TienIch, tc.yeuCauList);
    }

    return filtered.map(r => ({
      kieu: 'Phong',
      maId: r.MaPhong,
      maPhong: r.MaPhong,
      ten: `Phòng ${r.MaPhong}`,
      loaiPhong: r.LoaiPhong,
      giaThue: r.GiaThue,
      sucChua: r.SucChua,
      tienIch: r.TienIch,
      chiNhanh: r.ChiNhanh?.TenCN || 'Chưa rõ',
      diaChi: r.ChiNhanh?.DiaChi || '',
      gioiTinh: 'Tất cả'
    }));
  } else {
    // Dorm search
    let query = supabase
      .from('Giuong')
      .select('*, Phong!inner(*, ChiNhanh(TenCN, DiaChi))')
      .eq('TinhTrang', true)
      .in('Phong.MaCN', selectedCNIds);

    if (tc.gioiTinh && !laGiaTriTatCa(tc.gioiTinh)) {
      query = query.eq('GioiTinhYeuCau', tc.gioiTinh);
    }
    if (tc.mucGiaTu) {
      query = query.gte('GiaThue', Number(tc.mucGiaTu));
    }
    if (tc.mucGiaDen) {
      query = query.lte('GiaThue', Number(tc.mucGiaDen));
    }

    const { data: results, error: errGiuong } = await query;
    if (errGiuong) throw errGiuong;

    let filtered = results;
    if (tc.yeuCauList && tc.yeuCauList.length > 0) {
      filtered = locTheoTienIchUuTien(results, giuong => giuong.Phong?.TienIch, tc.yeuCauList);
    }

    return filtered.map(g => ({
      kieu: 'Giuong',
      maId: g.MaGiuong,
      maPhong: g.Phong.MaPhong,
      ten: `Giường #${g.MaGiuong} (Phòng ${g.Phong.MaPhong})`,
      loaiPhong: `Dorm ${g.GioiTinhYeuCau}`,
      giaThue: g.GiaThue,
      sucChua: 1,
      tienIch: g.Phong.TienIch,
      chiNhanh: g.Phong.ChiNhanh?.TenCN || 'Chưa rõ',
      diaChi: g.Phong.ChiNhanh?.DiaChi || '',
      gioiTinh: g.GioiTinhYeuCau
    }));
  }
}

// Route handlers
async function xuLyLayThongKe(req, res) {
  try {
    const stats = await layThongKePhongTrong();
    res.json({ ok: true, data: stats });
  } catch (error) {
    console.error('Lỗi lấy thống kê:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
}

async function xuLyLayTuyChonTraCuuPhong(req, res) {
  try {
    const [chiNhanhRes, phongRes] = await Promise.all([
      supabase.from('ChiNhanh').select('MaCN, TenCN, DiaChi').order('MaCN', { ascending: true }),
      supabase.from('Phong').select('MaCN, TienIch'),
    ]);

    if (chiNhanhRes.error) throw chiNhanhRes.error;
    if (phongRes.error) throw phongRes.error;

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

    res.json({
      ok: true,
      data: {
        khuVuc: Array.from(khuVucMap.values()).sort((a, b) => a.label.localeCompare(b.label, 'vi')),
        tienIch: Array.from(tienIchMap.values()).sort((a, b) => a.label.localeCompare(b.label, 'vi')),
      },
    });
  } catch (error) {
    console.error('Lỗi lấy tùy chọn tra cứu phòng:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
}

async function xuLyTiepNhanThongTin(req, res) {
  try {
    const { khachHang, yeuCauThue, maNV } = req.body;
    
    if (!khachHang || !khachHang.cccd || !khachHang.hoTen || !khachHang.sdt) {
      return res.status(400).json({ ok: false, error: 'Thiếu thông tin khách hàng bắt buộc (CCCD, Họ tên, SĐT)' });
    }

    // Save customer details
    const savedKhachHang = await luuThongTinKhachHang(khachHang);

    // Save rental request details
    const savedYeuCau = await taoYeuCauThue(yeuCauThue, khachHang.cccd, maNV || 101);

    res.json({
      ok: true,
      message: 'Tiếp nhận thông tin thành công!',
      data: {
        khachHang: savedKhachHang,
        yeuCauThue: savedYeuCau
      }
    });
  } catch (error) {
    console.error('Lỗi tiếp nhận thông tin:', error);
    const laLoiTrungDuLieu = error.code === '23505';
    const statusCode = error.statusCode || (laLoiTrungDuLieu ? 409 : 500);
    const message = laLoiTrungDuLieu
      ? 'Thông tin khách hàng đã tồn tại trong hệ thống. Vui lòng kiểm tra lại CCCD hoặc số điện thoại.'
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
    console.error('Lỗi tra cứu phòng:', error);
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
    .eq('LoaiPhong', 'Nguyên phòng')
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
    .eq('LoaiPhong', 'Nguyên phòng')
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
      GioiTinh: 'Tất cả',
      KhuVucMongMuon: 'Tất cả',
      LoaiPhong: 'Chưa xác định',
      MucGia: null,
      ThoiGianVao: new Date().toISOString(),
      ThoiGianThue: thoiGianThueDate,
      YeuCau: `Khách đăng ký nhận tư vấn: ${noiDung || 'Cần tư vấn thông tin homestay/dorm'}`,
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
    console.error('Lỗi lấy thống kê tổng hợp:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
}

async function xuLyGuiYeuCauTuVan(req, res) {
  try {
    const dataTuVan = req.body;
    if (!dataTuVan.hoTen || !dataTuVan.sdt) {
      return res.status(400).json({ ok: false, error: 'Thiếu thông tin bắt buộc (Họ tên, Số điện thoại)' });
    }
    const ketQua = await luuYeuCauTuVan(dataTuVan);
    res.json({ ok: true, message: 'Gửi yêu cầu tư vấn thành công!', data: ketQua });
  } catch (error) {
    console.error('Lỗi gửi yêu cầu tư vấn:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
}

async function datLichXemPhong(yc) {
  const { hoTen, sdt, email, ngayGioHen, ghiChu, maPhong, loaiPhong, maYC, cccd, diaChi, ngaySinh, gioiTinh, maGiuong } = yc;
  const diaChiKhachHang = String(diaChi ?? yc.DiaChi ?? '').trim();
  const ngaySinhKhachHang = String(ngaySinh ?? yc.NgaySinh ?? '').trim();
  const gioiTinhKhachHang = String(gioiTinh ?? yc.GioiTinh ?? '').trim();
  const maGiuongHen = Number(maGiuong ?? yc.MaGiuong) || null;
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
    if (yeuCauDaCo?.CCCD) {
      const thongTinCapNhatKhach = {};
      if (diaChiKhachHang) thongTinCapNhatKhach.DiaChi = diaChiKhachHang;
      if (ngaySinhKhachHang) thongTinCapNhatKhach.NgaySinh = ngaySinhKhachHang;
      if (gioiTinhKhachHang) thongTinCapNhatKhach.GioiTinh = gioiTinhKhachHang;
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
    if (!ngaySinhKhachHang || !gioiTinhKhachHang) {
      throw taoLoiNghiepVu(400, 'Vui lòng bổ sung ngày sinh và giới tính khách hàng trước khi đặt lịch hẹn.');
    }

    // 1. Upsert customer
    const { data: upsertedCustomer, error: errCust } = await supabase
      .from('KhachHang')
      .upsert({
        CCCD: numericCCCD,
        HoTen: hoTen,
        SDT: sdt,
        Email: email,
        DiaChi: diaChiKhachHang || null,
        NgaySinh: ngaySinhKhachHang || null,
        GioiTinh: gioiTinhKhachHang || null,
        QuocTich: 'Việt Nam',
        ThoaDK: true
      }, { onConflict: 'CCCD' })
      .select();
    if (errCust) throw errCust;
    savedCust = upsertedCustomer;

    // 2. Create YeuCauThue
    const thoiGianThueDate = tinhNgayKetThuc(new Date().toISOString().split('T')[0], 6);
    const { data: insertedReq, error: errReq } = await supabase
      .from('YeuCauThue')
      .insert({
        SoNguoiDuKien: 1,
        GioiTinh: 'Tất cả',
        KhuVucMongMuon: 'Chưa xác định',
        LoaiPhong: loaiPhong === 'Giuong' ? 'Giường ghép' : 'Nguyên phòng',
        MucGia: null,
        ThoiGianVao: new Date().toISOString(),
        ThoiGianThue: thoiGianThueDate,
        YeuCau: `Đăng ký hẹn xem phòng #${maPhong} qua website`,
        TrangThai: false,
        NgayTao: new Date().toISOString(),
        CCCD: numericCCCD,
        MaNV: null
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
      MaPhong: Number(maPhong),
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
    if (!dataLich.hoTen || !dataLich.sdt || !dataLich.ngayGioHen || !dataLich.maPhong) {
      return res.status(400).json({ ok: false, error: 'Thiếu thông tin bắt buộc (Họ tên, Số điện thoại, Ngày giờ hẹn, Mã phòng)' });
    }
    const thoiDiemHen = taoDateLocal(dataLich.ngayGioHen);
    if (Number.isNaN(thoiDiemHen.getTime()) || thoiDiemHen.getTime() < Date.now()) {
      return res.status(400).json({ ok: false, error: 'Thời điểm hẹn phải từ hiện tại trở đi.' });
    }
    const ketQua = await datLichXemPhong(dataLich);
    res.json({ ok: true, message: 'Đăng ký lịch hẹn xem phòng thành công!', data: ketQua });
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
    res.json({ ok: true, data });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách lịch hẹn:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
}

async function xuLyCapNhatTrangThaiHen(req, res) {
  try {
    const { maLich, ketQua, ghiChu } = req.body;
    if (!maLich || !ketQua) {
      return res.status(400).json({ ok: false, error: 'Thiếu thông tin maLich hoặc ketQua' });
    }
    const trangThaiHopLe = ['Chưa xem', 'Đã xem'];
    if (!trangThaiHopLe.includes(ketQua)) {
      return res.status(400).json({ ok: false, error: 'Trạng thái lịch hẹn không hợp lệ' });
    }
    const duLieuCapNhat = { KetQua: ketQua };
    if (Object.prototype.hasOwnProperty.call(req.body, 'ghiChu')) {
      duLieuCapNhat.GhiChu = ghiChu?.trim() || null;
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
  if (error) console.error('Lỗi taiPhieuDoiSoatDatCoc:', error);
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
      console.error('LỖI UPDATE PHIẾU ĐỐI SOÁT CỌC:', error);
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
  if (maSo.startsWith('HĐ-')) {
    const id = Number(maSo.replace('HĐ-', ''));
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
      error: 'Checkout đang yêu cầu Supabase nhưng chưa kết nối được. Hãy cấu hình SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY và đảm bảo các bảng checkout đã tồn tại.'
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
      console.log('✅ [Supabase] Connection established successfully! Database schema is ready.');
    } else {
      console.error('❌ [Supabase] Table verification failed. Please check table existence.', error.message);
    }
  } catch (err) {
    console.error('❌ [Supabase] Database connection failed. Please check environment variables.', err.message);
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
      return res.status(404).json({ ok: false, error: 'Không tìm thấy hồ sơ quyết toán!' });
    }
    res.json({ ok: true, data: item });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 3. POST /api/checkout/request — Sale tiếp nhận yêu cầu trả phòng / hủy cọc
app.post('/api/checkout/request', async (req, res) => {
  const { maSoChungTu, loaiHinhTraPhong, ngayTraDuKien, lyDo, phuongThucHoanTien } = req.body;
  if (!ensureCheckoutSupabase(res)) {
    return;
  }

  try {
    const nextTrangThai = 'Chờ kiểm tra';
    if (!maSoChungTu) {
      return res.status(400).json({ ok: false, error: 'Thiếu mã chứng từ' });
    }

    // Chấp nhận HĐ-12 hoặc HD-00012
    const isHopDong =
      String(maSoChungTu).startsWith('HĐ-') ||
      /^HD-/i.test(String(maSoChungTu));

    if (isHopDong) {
      const id = Number(String(maSoChungTu).replace(/^(HĐ-|HD-)/i, ''));
      if (!Number.isFinite(id) || id <= 0) {
        return res.status(400).json({ ok: false, error: 'Mã hợp đồng không hợp lệ' });
      }

      await supabase.from('HopDong').update({ TrangThai: nextTrangThai }).eq('MaHopDong', id);

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
    } else {
      const id = Number(maSoChungTu.replace('PC-', ''));
      await supabase.from('DatCoc').update({ TrangThai: nextTrangThai }).eq('MaDatCoc', id);
      await luuPhieuDoiSoatDatCoc(id, {
        NgayDKTraPhong: ngayTraDuKien,
        LoaiHinhTraPhong: loaiHinhTraPhong || 'huy_thue',
        LyDoTraPhong: lyDo,
        HinhThucHoan: phuongThucHoanTien,
        TrangThai: nextTrangThai,
        TyLeHoanTien: 80
      });
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 4. POST /api/checkout/inspect — Quản lý kiểm phòng / xác nhận hủy cọc
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
    const nextTrangThai = 'Chờ đối soát';

    if (maChungTu.startsWith('HĐ-')) {
      const id = Number(maChungTu.replace('HĐ-', ''));

      await supabase.from('HopDong').update({ TrangThai: nextTrangThai }).eq('MaHopDong', id);
      await supabase.from('PhieuDoiSoat').update({
        KhauTruSuaChua: Number(chiPhiHuHong) || 0,
        TrangThai: nextTrangThai
      }).eq('MaHopDong', id);

      const bbPayload = {
        TinhTrangPhong: 'Nghiệm thu thu hồi',
        MoTaHuHong: moTaHuHong || '',
        NgayBanGiao: new Date().toISOString().split('T')[0],
        TrangThai: 'Đã nghiệm thu'
      };

      const { data: existingBB } = await supabase.from('BienBanBanGiao').select('MaBB').eq('MaHopDong', id).maybeSingle();
      if (existingBB) {
        await supabase.from('BienBanBanGiao').update(bbPayload).eq('MaHopDong', id);
      } else {
        await supabase.from('BienBanBanGiao').insert({
          ...bbPayload,
          LoaiBB: 'Thu Hồi',
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

// 5. POST /api/checkout/reconcile — Kế toán lập phiếu đối soát
app.post('/api/checkout/reconcile', async (req, res) => {
  const { maChungTu, tiLeHoanCoc, noThue, noDienNuoc, chiPhiHuHong, moTaKhauTru, danhSachKhauTruKhac } = req.body;
  if (!ensureCheckoutSupabase(res)) {
    return;
  }

  try {
    const nextTrangThai = 'Chờ xác nhận đối soát';

    if (maChungTu.startsWith('HĐ-')) {
      const id = Number(maChungTu.replace('HĐ-', ''));

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
        noiDung: `Có phiếu đối soát mới cần khách hàng xác nhận cho ${maChungTu}.`,
        loaiSuKien: 'Chờ xác nhận đối soát'
      });
      // Currently sale role might also need this, let's emit to QUAN_LY for now as they handle checkout confirmation
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 6. POST /api/checkout/confirm — Quản lý xác nhận đối soát với khách
app.post('/api/checkout/confirm', async (req, res) => {
  console.log('--- POST /api/checkout/confirm CALLED ---', req.body);
  const { maChungTu, phanHoiKhach, yKienTranhChap } = req.body;
  if (!ensureCheckoutSupabase(res)) {
    return;
  }

  try {
    const isDongY = phanHoiKhach === 'dong_y';
    let nextTrangThai = 'Chờ đối soát';

    if (maChungTu.startsWith('HĐ-')) {
      const id = Number(maChungTu.replace('HĐ-', ''));

      if (isDongY) {
        const item = await layItemQuyetToanTuMaSo(`HĐ-${id}`);
        if (item) {
          const soTien = tinhSoTienQuyetToan(item);
          nextTrangThai = soTien < 0 ? 'Chờ thanh toán thêm' : 'Chờ hoàn cọc';
        } else {
          nextTrangThai = 'Chờ hoàn cọc';
        }
      }

      await supabase.from('HopDong').update({ TrangThai: nextTrangThai }).eq('MaHopDong', id);
      await supabase.from('PhieuDoiSoat').update({
        TrangThai: nextTrangThai,
        YKienTranhChap: isDongY ? '' : (yKienTranhChap || 'Khách hàng khiếu nại.')
      }).eq('MaHopDong', id);
    } else {
      const id = Number(maChungTu.replace('PC-', ''));

      if (isDongY) {
        const item = await layItemQuyetToanTuMaSo(`PC-${id}`);
        if (item) {
          const soTien = tinhSoTienQuyetToan(item);
          nextTrangThai = soTien < 0 ? 'Chờ thanh toán thêm' : 'Chờ hoàn cọc';
        } else {
          nextTrangThai = 'Chờ hoàn cọc';
        }
      }

      await supabase.from('DatCoc').update({ TrangThai: nextTrangThai }).eq('MaDatCoc', id);
      await luuPhieuDoiSoatDatCoc(id, { TrangThai: nextTrangThai, YKienTranhChap: isDongY ? '' : (yKienTranhChap || 'Khách hàng khiếu nại.') });
    }

    const io = getIO();
    if (io) {
      if (isDongY) {
        io.to('role:KE_TOAN').emit('thong_bao_moi', {
          noiDung: `Khách hàng đã đồng ý đối soát cho ${maChungTu}. Vui lòng tiến hành hoàn cọc hoặc thu thêm.`,
          loaiSuKien: nextTrangThai
        });
      } else {
        io.to('role:KE_TOAN').emit('thong_bao_moi', {
          noiDung: `Khách hàng khiếu nại đối soát cho ${maChungTu}. Vui lòng kiểm tra lại.`,
          loaiSuKien: nextTrangThai
        });
      }
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Thêm API mới để cập nhật trạng thái hợp đồng và phiếu đối soát
app.post('/api/phieu-doi-soat/xac-nhan-khach', async (req, res) => {
  const { maHD, trangThai } = req.body;
  if (!ensureCheckoutSupabase(res)) return;

  try {
    const isDatCoc = maHD.startsWith('PC');
    const id = parseInt(maHD.replace(/\D/g, ''), 10);
    
    if (isDatCoc) {
      // Cập nhật phiếu đối soát (mã đặt cọc)
      const { error: errPDS } = await supabase.from('PhieuDoiSoat').update({ TrangThai: trangThai }).eq('MaDatCoc', id);
      if (errPDS) throw errPDS;

      // Cập nhật Đặt Cọc
      const { error: errDC } = await supabase.from('DatCoc').update({ TrangThai: trangThai }).eq('MaDatCoc', id);
      if (errDC) throw errDC;
    } else {
      // Cập nhật phiếu đối soát (mã hợp đồng)
      const { error: errPDS } = await supabase.from('PhieuDoiSoat').update({ TrangThai: trangThai }).eq('MaHopDong', id);
      if (errPDS) throw errPDS;

      // Cập nhật Hợp đồng
      const { error: errHD } = await supabase.from('HopDong').update({ TrangThai: trangThai }).eq('MaHopDong', id);
      if (errHD) throw errHD;
    }

    const io = getIO();
    if (io) {
      if (trangThai === 'Chờ hoàn cọc' || trangThai === 'Chờ thanh toán thêm') {
        io.to('role:KE_TOAN').emit('thong_bao_moi', {
          noiDung: `Khách hàng đã đồng ý đối soát cho ${maHD}. Vui lòng tiến hành hoàn cọc hoặc thu thêm.`,
          loaiSuKien: trangThai
        });
      }
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Error updating PDS status:', error);
    res.status(500).json({ ok: false, message: 'Lỗi server: ' + error.message });
  }
});

// Thêm API mới để hoàn tất trả phòng / thanh lý
app.post('/api/phieu-doi-soat/hoan-tat-tra-phong', async (req, res) => {
  const { maHD, trangThai } = req.body;
  if (!ensureCheckoutSupabase(res)) return;

  try {
    const isDatCoc = maHD.startsWith('PC');
    const id = parseInt(maHD.replace(/\D/g, ''), 10);
    const newStatus = trangThai || 'Đã trả phòng';
    
    if (isDatCoc) {
      // Cập nhật phiếu đối soát (mã đặt cọc)
      const { error: errPDS } = await supabase.from('PhieuDoiSoat').update({ TrangThai: newStatus }).eq('MaDatCoc', id);
      if (errPDS) throw errPDS;

      // Cập nhật Đặt Cọc
      const { error: errDC } = await supabase.from('DatCoc').update({ TrangThai: newStatus }).eq('MaDatCoc', id);
      if (errDC) throw errDC;
    } else {
      // Cập nhật phiếu đối soát (mã hợp đồng)
      const { error: errPDS } = await supabase.from('PhieuDoiSoat').update({ TrangThai: newStatus }).eq('MaHopDong', id);
      if (errPDS) throw errPDS;

      // Cập nhật Hợp đồng
      const { error: errHD } = await supabase.from('HopDong').update({ TrangThai: newStatus }).eq('MaHopDong', id);
      if (errHD) throw errHD;
    }

    const io = getIO();
    if (io) {
      io.to('role:KE_TOAN').emit('thong_bao_moi', {
        noiDung: `Quản lý đã hoàn tất thanh lý phòng cho ${maHD}. Hợp đồng đã đóng.`,
        loaiSuKien: newStatus
      });
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Error updating to Đã trả phòng:', error);
    res.status(500).json({ ok: false, message: 'Lỗi server: ' + error.message });
  }
});

// 7. POST /api/checkout/liquidate — Ký biên bản thanh lý hợp đồng / phiếu cọc
app.post('/api/checkout/liquidate', async (req, res) => {
  const { maChungTu } = req.body;
  if (!ensureCheckoutSupabase(res)) {
    return;
  }

  try {
    if (maChungTu.startsWith('HĐ-')) {
      const id = Number(maChungTu.replace('HĐ-', ''));
      const item = await layItemQuyetToanTuMaSo(`HĐ-${id}`);

      let nextTrangThai = 'Đã thanh lý';
      if (item) {
        const soTien = tinhSoTienQuyetToan(item);
        nextTrangThai = 'Đã thanh lý';
      }

      await supabase.from('HopDong').update({ TrangThai: nextTrangThai }).eq('MaHopDong', id);
      await supabase.from('PhieuDoiSoat').update({ TrangThai: nextTrangThai }).eq('MaHopDong', id);
      await supabase.from('BienBanBanGiao').update({ TrangThai: 'Hoàn tất thanh lý' }).eq('MaHopDong', id);

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

      let nextTrangThai = 'Đã thanh lý';
      if (item) {
        const soTien = tinhSoTienQuyetToan(item);
        nextTrangThai = 'Đã thanh lý';
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

// 8. POST /api/checkout/payment — Kế toán hoàn cọc / thu chênh lệch
app.post('/api/checkout/payment', async (req, res) => {
  const { maChungTu, maGiaoDich, soTaiKhoan, tenNguoiNhan, nganHang } = req.body;
  if (!ensureCheckoutSupabase(res)) {
    return;
  }

  try {
    if (maChungTu.startsWith('HĐ-')) {
      const id = Number(maChungTu.replace('HĐ-', ''));

      const { data: pds } = await supabase.from('PhieuDoiSoat').select('TrangThai').eq('MaHopDong', id).maybeSingle();
      const isThuThem = pds?.TrangThai === 'Chờ thanh toán' || pds?.TrangThai === 'Chờ thanh toán thêm';
      const nextTrangThai = 'Chờ thanh lý';

      await supabase.from('HopDong').update({ TrangThai: nextTrangThai }).eq('MaHopDong', id);
      await supabase.from('PhieuDoiSoat').update({
        TrangThai: nextTrangThai,
        MaGiaoDich: maGiaoDich
      }).eq('MaHopDong', id);

      const io = getIO();
      if (io) {
        io.to('role:QUAN_LY').emit('thong_bao_moi', {
          noiDung: `Kế toán đã hoàn tất đối soát cho HĐ-${id}. Hợp đồng đang chờ thanh lý phòng.`,
          loaiSuKien: 'Chờ thanh lý'
        });
      }

    } else {
      const id = Number(maChungTu.replace('PC-', ''));
      const pds = await taiPhieuDoiSoatDatCoc(id);
      const trangThaiHienTai = pds?.TrangThai || (await supabase.from('DatCoc').select('TrangThai').eq('MaDatCoc', id).single()).data?.TrangThai;
      const isThuThem = trangThaiHienTai === 'Chờ thanh toán' || trangThaiHienTai === 'Chờ thanh toán thêm';
      const nextTrangThai = 'Chờ thanh lý';

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
    huyDatCocQuaHan().catch((error) => console.error('Lỗi job hủy cọc quá hạn:', error.message));
  }, 60 * 1000);
  depositExpiryJob.unref();
  huyDatCocQuaHan().catch((error) => console.warn('Chưa chạy được job đặt cọc:', error.message));
}
