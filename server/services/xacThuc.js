import crypto from 'crypto';
import { supabase } from '../config/supabase.js';
import { bamMatKhau, kiemTraMatKhau } from '../utils/matKhau.js';

const RESET_SECRET = process.env.RESET_TOKEN_SECRET || 'homestay_dorm_reset_2026';
const THOI_HAN_TOKEN_MS = 60 * 60 * 1000;

async function timNhanVienTheoTenDangNhap(tenDangNhap) {
  const input = tenDangNhap.trim();
  const cot = input.includes('@') ? 'Email' : 'SDT';

  const { data, error } = await supabase
    .from('NhanVien')
    .select('MaNV, HoTen, SDT, Email, VaiTro, TrangThai, MaCN, MatKhau')
    .eq(cot, input)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function timNhanVienTheoEmail(email) {
  const emailChuan = email.trim().toLowerCase();
  const { data, error } = await supabase
    .from('NhanVien')
    .select('MaNV, HoTen, Email, TrangThai, MatKhau')
    .eq('Email', emailChuan)
    .maybeSingle();

  if (error) throw error;
  return data;
}

function taoThongTinNguoiDung(nhanVien) {
  return {
    maNV: nhanVien.MaNV,
    hoTen: nhanVien.HoTen,
    email: nhanVien.Email,
    sdt: nhanVien.SDT,
    vaiTro: nhanVien.VaiTro,
    maCN: nhanVien.MaCN,
    tenDangNhap: nhanVien.Email || nhanVien.SDT,
  };
}

function taoTokenKhoiPhuc(nhanVien) {
  const payload = {
    maNV: nhanVien.MaNV,
    email: nhanVien.Email,
    exp: Date.now() + THOI_HAN_TOKEN_MS,
  };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const chuKy = crypto.createHmac('sha256', RESET_SECRET).update(data).digest('base64url');
  return `${data}.${chuKy}`;
}

function xacMinhTokenKhoiPhuc(token) {
  if (!token || !token.includes('.')) return null;

  const [data, chuKy] = token.split('.');
  const chuKyMongDoi = crypto.createHmac('sha256', RESET_SECRET).update(data).digest('base64url');
  if (chuKy !== chuKyMongDoi) return null;

  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString());
    if (!payload.maNV || !payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function dangNhap(tenDangNhap, matKhau) {
  const nhanVien = await timNhanVienTheoTenDangNhap(tenDangNhap);

  if (!nhanVien || nhanVien.TrangThai !== 'Đang làm việc') {
    return { thanhCong: false, loi: 'Tên đăng nhập hoặc mật khẩu không đúng' };
  }

  if (!nhanVien.MatKhau) {
    return {
      thanhCong: false,
      loi: 'Tài khoản chưa có mật khẩu. Vui lòng dùng chức năng quên mật khẩu hoặc liên hệ quản trị.',
    };
  }

  if (!kiemTraMatKhau(matKhau, nhanVien.MatKhau)) {
    return { thanhCong: false, loi: 'Tên đăng nhập hoặc mật khẩu không đúng' };
  }

  return {
    thanhCong: true,
    nguoiDung: taoThongTinNguoiDung(nhanVien),
  };
}

export async function guiLienKetKhoiPhucMatKhau(email) {
  const nhanVien = await timNhanVienTheoEmail(email);

  if (!nhanVien || nhanVien.TrangThai !== 'Đang làm việc') {
    return {
      thanhCong: true,
      thongBao: 'Nếu email tồn tại trong hệ thống, hướng dẫn khôi phục sẽ được gửi.',
    };
  }

  const tokenKhoiPhuc = taoTokenKhoiPhuc(nhanVien);
  const baseUrl = process.env.VITE_APP_URL || 'http://localhost:5173';
  const linkKhoiPhuc = `${baseUrl}/quen-mat-khau?token=${encodeURIComponent(tokenKhoiPhuc)}`;

  console.info(`[khoi-phuc-mat-khau] ${nhanVien.Email} -> ${linkKhoiPhuc}`);

  return {
    thanhCong: true,
    thongBao: 'Yêu cầu khôi phục đã được ghi nhận. Vui lòng kiểm tra email hoặc liên hệ quản trị để nhận liên kết đặt lại mật khẩu.',
    tokenKhoiPhuc: process.env.NODE_ENV === 'development' ? tokenKhoiPhuc : undefined,
    linkKhoiPhuc: process.env.NODE_ENV === 'development' ? linkKhoiPhuc : undefined,
  };
}

export async function datLaiMatKhau(token, matKhauMoi) {
  const payload = xacMinhTokenKhoiPhuc(token);
  if (!payload) {
    return { thanhCong: false, loi: 'Liên kết khôi phục không hợp lệ hoặc đã hết hạn' };
  }

  if (!matKhauMoi || matKhauMoi.length < 6) {
    return { thanhCong: false, loi: 'Mật khẩu mới phải có ít nhất 6 ký tự' };
  }

  const { data, error } = await supabase
    .from('NhanVien')
    .update({ MatKhau: bamMatKhau(matKhauMoi) })
    .eq('MaNV', payload.maNV)
    .select('MaNV')
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    return { thanhCong: false, loi: 'Không tìm thấy tài khoản nhân viên' };
  }

  return {
    thanhCong: true,
    thongBao: 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập ngay.',
  };
}
