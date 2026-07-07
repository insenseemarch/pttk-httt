import crypto from 'crypto';
import { supabase } from '../config/supabase.js';
import { bamMatKhau } from '../utils/matKhau.js';

const RESET_SECRET = process.env.RESET_TOKEN_SECRET || 'homestay_dorm_reset_2026';
const THOI_HAN_TOKEN_MS = 60 * 60 * 1000;

function chuanHoaTenDangNhap(tenDangNhap) {
  const input = tenDangNhap.trim();
  return input.includes('@') ? input.toLowerCase() : input;
}

function chuanHoaNguoiDungTuRpc(duLieu) {
  if (!duLieu) return null;
  const nhanVien = Array.isArray(duLieu) ? duLieu[0] : duLieu;

  return {
    maNV: nhanVien.MaNV ?? nhanVien.ma_nv ?? nhanVien.manv ?? null,
    hoTen: nhanVien.HoTen ?? nhanVien.ho_ten ?? nhanVien.hoTen ?? '',
    email: nhanVien.Email ?? nhanVien.email ?? '',
    sdt: nhanVien.SDT ?? nhanVien.sdt ?? '',
    vaiTro: nhanVien.VaiTro ?? nhanVien.vai_tro ?? nhanVien.vaiTro ?? '',
    maCN: nhanVien.MaCN ?? nhanVien.ma_cn ?? nhanVien.maCN ?? null,
    trangThai: nhanVien.TrangThai ?? nhanVien.trang_thai ?? nhanVien.trangThai ?? '',
    tenDangNhap: nhanVien.Email ?? nhanVien.email ?? nhanVien.SDT ?? nhanVien.sdt ?? '',
  };
}

async function goiRpcDangNhap(tenDangNhap, matKhau) {
  const input = chuanHoaTenDangNhap(tenDangNhap);
  const rpcParamSets = [
    { tenDangNhap: input, matKhau },
    { ten_dang_nhap: input, mat_khau: matKhau },
    { emailOrSdt: input, matKhau },
    { email_or_sdt: input, mat_khau: matKhau },
    { email_sdt: input, mat_khau: matKhau },
    { p_tenDangNhap: input, p_matKhau: matKhau },
    { p_ten_dang_nhap: input, p_mat_khau: matKhau },
    { p_email_or_sdt: input, p_mat_khau: matKhau },
    { p_email_sdt: input, p_mat_khau: matKhau },
    { username: input, password: matKhau },
    { email: input, password: matKhau },
    { phone: input, password: matKhau },
  ];

  let lastError = null;

  for (const params of rpcParamSets) {
    const { data, error } = await supabase.rpc('dang_nhap_nhan_vien', params);

    if (!error) {
      const nhanVien = chuanHoaNguoiDungTuRpc(data);
      if (nhanVien) {
        return nhanVien;
      }
    }

    lastError = error;
    const thongBao = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`.toLowerCase();
    const canThuLai =
      thongBao.includes('could not find the function') ||
      thongBao.includes('unknown') ||
      thongBao.includes('missing') ||
      thongBao.includes('argument') ||
      thongBao.includes('parameter');

    if (!canThuLai) {
      throw error;
    }
  }

  throw lastError || new Error('Không gọi được RPC dang_nhap_nhan_vien.');
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
    maNV: nhanVien.MaNV ?? nhanVien.maNV ?? nhanVien.ma_nv ?? null,
    hoTen: nhanVien.HoTen ?? nhanVien.hoTen ?? nhanVien.ho_ten ?? '',
    email: nhanVien.Email ?? nhanVien.email ?? '',
    sdt: nhanVien.SDT ?? nhanVien.sdt ?? '',
    vaiTro: nhanVien.VaiTro ?? nhanVien.vaiTro ?? nhanVien.vai_tro ?? '',
    maCN: nhanVien.MaCN ?? nhanVien.maCN ?? nhanVien.ma_cn ?? null,
    tenDangNhap: nhanVien.Email ?? nhanVien.email ?? nhanVien.SDT ?? nhanVien.sdt ?? '',
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
  const nhanVien = await goiRpcDangNhap(tenDangNhap, matKhau);

  if (!nhanVien || (nhanVien.trangThai && nhanVien.trangThai !== 'Đang làm việc')) {
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
