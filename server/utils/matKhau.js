import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const SALT = 'homestay_dorm_2026';
const BCRYPT_ROUNDS = 6;

export function bamMatKhau(matKhau) {
  return bcrypt.hashSync(String(matKhau), BCRYPT_ROUNDS);
}

export function kiemTraMatKhau(matKhau, matKhauDaBam) {
  const matKhauChuan = String(matKhauDaBam || '');

  if (matKhauChuan.startsWith('$2a$') || matKhauChuan.startsWith('$2b$') || matKhauChuan.startsWith('$2y$')) {
    return bcrypt.compareSync(String(matKhau), matKhauChuan);
  }

  return crypto.createHash('sha256').update(`${matKhau}${SALT}`).digest('hex') === matKhauChuan || String(matKhau) === matKhauChuan;
}
