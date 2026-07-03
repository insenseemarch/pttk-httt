import { supabase } from '../config/supabase.js';
import { bamMatKhau } from '../utils/matKhau.js';

export async function layThongKeTaiKhoan() {
  const { data, error } = await supabase
    .from('NhanVien')
    .select('MaNV, VaiTro, TrangThai');

  if (error) throw error;
  const ds = data || [];
  return {
    tong: ds.length,
    admin: ds.filter((nv) => (nv.VaiTro || '').toLowerCase().includes('admin')).length,
    dangHoatDong: ds.filter((nv) => nv.TrangThai === 'Đang làm việc').length,
    biKhoa: ds.filter((nv) => nv.TrangThai && nv.TrangThai !== 'Đang làm việc').length,
  };
}

export async function layDanhSachNhanVien(boLoc = {}) {
  const { page = 1, limit = 10 } = boLoc;
  const tu = (Number(page) - 1) * Number(limit);
  const den = tu + Number(limit) - 1;

  const { data, error, count } = await supabase
    .from('NhanVien')
    .select('MaNV, HoTen, SDT, Email, VaiTro, TrangThai, MaCN, ChiNhanh(TenCN)', { count: 'exact' })
    .order('MaNV', { ascending: true })
    .range(tu, den);

  if (error) throw error;

  return {
    danhSach: (data || []).map((nv) => ({
      maNV: nv.MaNV,
      tenDangNhap: nv.Email || nv.SDT,
      hoTen: nv.HoTen,
      email: nv.Email || '',
      sdt: nv.SDT || '',
      vaiTro: nv.VaiTro || 'Nhân viên',
      trangThai: nv.TrangThai === 'Đang làm việc' ? 'Hoạt động' : 'Đã khóa',
      chiNhanh: nv.ChiNhanh?.TenCN || '—',
      maCN: nv.MaCN,
    })),
    tong: count || 0,
    trang: Number(page),
    gioiHan: Number(limit),
  };
}

export async function taoNhanVien(duLieu) {
  if (!duLieu.email || !duLieu.matKhau || !duLieu.hoTen) {
    throw new Error('Thiếu thông tin bắt buộc');
  }
  if (duLieu.matKhau !== duLieu.xacNhanMatKhau) {
    throw new Error('Mật khẩu xác nhận không khớp');
  }

  const { data, error } = await supabase
    .from('NhanVien')
    .insert({
      HoTen: duLieu.hoTen,
      Email: duLieu.email.trim().toLowerCase(),
      SDT: duLieu.sdt || null,
      VaiTro: duLieu.vaiTro || 'Nhân viên',
      TrangThai: 'Đang làm việc',
      MaCN: duLieu.maCN ? Number(duLieu.maCN) : null,
      MatKhau: bamMatKhau(duLieu.matKhau),
    })
    .select('MaNV, HoTen, Email, VaiTro')
    .single();

  if (error) throw error;
  return data;
}

export async function capNhatNhanVien(maNV, duLieu) {
  const capNhat = {
    HoTen: duLieu.hoTen,
    Email: duLieu.email,
    SDT: duLieu.sdt,
    VaiTro: duLieu.vaiTro,
  };
  if (duLieu.trangThai) {
    capNhat.TrangThai = duLieu.trangThai === 'Hoạt động' ? 'Đang làm việc' : 'Đã nghỉ';
  }
  if (duLieu.matKhauMoi) {
    capNhat.MatKhau = bamMatKhau(duLieu.matKhauMoi);
  }

  const { data, error } = await supabase
    .from('NhanVien')
    .update(capNhat)
    .eq('MaNV', Number(maNV))
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}
