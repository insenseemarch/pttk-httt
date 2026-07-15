import { KHOA_NGUOI_DUNG } from '../config/routes';

export function boDauTiengViet(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

export function chuanHoaVaiTroNhanVien(vaiTro) {
  const role = boDauTiengViet(vaiTro);
  if (!role) return null;
  if (role.includes('sale') || role.includes('kinh doanh')) return 'sale';
  if (role.includes('quan ly') || role.includes('manager')) return 'quanly';
  if (role.includes('ke toan') || role.includes('account')) return 'ketoan';
  if (role.includes('admin') || role.includes('quan tri')) return 'admin';
  if (role.includes('phu trach') || role === 'phutrach') return 'phutrach';
  if (role.includes('tiep nhan') || role.includes('hop dong') || role.includes('le tan')) return 'tiepnhan';
  return role.replace(/\s+/g, '');
}

export function docNguoiDungDangNhap() {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(KHOA_NGUOI_DUNG);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function luuNguoiDungDangNhap(nguoiDung) {
  localStorage.setItem(KHOA_NGUOI_DUNG, JSON.stringify(nguoiDung));
}

export function xoaNguoiDungDangNhap() {
  localStorage.removeItem(KHOA_NGUOI_DUNG);
}

export function layMaNhanVien(nguoiDung) {
  const maNV = Number(nguoiDung?.maNV ?? nguoiDung?.MaNV ?? nguoiDung?.ma_nv);
  return Number.isFinite(maNV) && maNV > 0 ? maNV : 101;
}
