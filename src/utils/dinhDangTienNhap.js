export function layChuSoTien(value) {
  return String(value ?? '').replace(/\D/g, '').replace(/^0+(?=\d)/, '');
}

export function dinhDangTienNhap(value) {
  const chuSo = layChuSoTien(value);
  return chuSo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
