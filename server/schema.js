import { supabase } from './config/supabase.js';

async function run() {
  const tbls = [
    'BienBanBanGiao', 'ChiNhanh', 'ChiTiet', 'ChiTietDichVu', 'ChungTuDatCoc',
    'DatCoc', 'Giuong', 'GiuongDatCoc', 'HoaDon', 'HopDong', 'KhachHang',
    'KhoaGiuongDatCoc', 'LichSuDatCoc', 'LichXemPhong', 'LoaiPhong', 'NhanVien',
    'NhomThue', 'PhieuDoiSoat', 'Phong', 'ThanhVienNhom', 'ThongBao', 'VatDung',
    'VatDungTrongPhong', 'YeuCauThue',
  ];
  for (const t of tbls) {
    const { data, error } = await supabase.from(t).select('*').limit(1);
    console.log(`Table ${t}:`, error ? error.message : Object.keys(data?.[0] || {}).join(', '));
  }
}
run();
