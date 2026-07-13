export function dinhDangTien(soTien) {
  return `${Number(soTien || 0).toLocaleString('vi-VN')}đ`;
}

export function dinhDangCCCD(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.length < 12 ? digits.padStart(12, '0') : digits;
}

export function dinhDangNgay(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  const ngay = String(d.getDate()).padStart(2, '0');
  const thang = String(d.getMonth() + 1).padStart(2, '0');
  const nam = d.getFullYear();
  return `${ngay}/${thang}/${nam}`;
}

export function dinhDangNgayGio(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return isoStr;
  const gio = String(d.getHours()).padStart(2, '0');
  const phut = String(d.getMinutes()).padStart(2, '0');
  return `${gio}:${phut} - ${dinhDangNgay(isoStr)}`;
}

export function tinhThoiGianTu(isoStr) {
  if (!isoStr) return '';
  const diff = Date.now() - new Date(isoStr).getTime();
  const phut = Math.floor(diff / 60000);
  if (phut < 1) return 'Vừa xong';
  if (phut < 60) return `${phut} phút trước`;
  const gio = Math.floor(phut / 60);
  if (gio < 24) return `${gio} giờ trước`;
  const ngay = Math.floor(gio / 24);
  if (ngay === 1) return 'Hôm qua';
  return `${ngay} ngày trước`;
}
