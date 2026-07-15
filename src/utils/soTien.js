export function chiLayChuSo(value) {
  return String(value ?? '').replace(/\D/g, '');
}

export function dinhDangTienInput(value) {
  const digits = chiLayChuSo(value);
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function laySoTienNumber(value) {
  const digits = chiLayChuSo(value);
  return digits ? Number(digits) : null;
}
