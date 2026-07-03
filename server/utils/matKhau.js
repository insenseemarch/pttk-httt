import crypto from 'crypto';

const SALT = 'homestay_dorm_2026';

export function bamMatKhau(matKhau) {
  return crypto.createHash('sha256').update(`${matKhau}${SALT}`).digest('hex');
}

export function kiemTraMatKhau(matKhau, matKhauDaBam) {
  return bamMatKhau(matKhau) === matKhauDaBam;
}
