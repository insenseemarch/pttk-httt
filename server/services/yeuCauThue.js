import { supabase } from '../config/supabase.js';

export function chuanHoaLoaiThue(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return null;
  if (normalized.includes('nguyên phòng') || normalized.includes('nguyen phong')) {
    return 'Thuê nguyên phòng';
  }
  if (normalized.includes('giường') || normalized.includes('giuong')) {
    return 'Thuê giường lẻ';
  }
  return null;
}

function chuanHoaKhoaCCCD(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  return digits ? digits.padStart(12, '0') : '';
}

function layBienTheCCCD(value) {
  const key = chuanHoaKhoaCCCD(value);
  if (!key) return [];
  const khongSoKhongDau = key.replace(/^0+(?=\d)/, '');
  return [...new Set([key, khongSoKhongDau])];
}

export async function layYeuCauThueGanNhat(cccd) {
  const bienTheCCCD = layBienTheCCCD(cccd);
  if (!bienTheCCCD.length) return null;
  const { data, error } = await supabase
    .from('YeuCauThue')
    .select('MaYC, CCCD, SoNguoiDuKien, GioiTinh, KhuVucMongMuon, LoaiPhong, LoaiThue, NganSach, ThoiGianVao, ThoiGianThue, YeuCau, TrangThai, NgayTao')
    .in('CCCD', bienTheCCCD)
    .order('NgayTao', { ascending: false, nullsFirst: false })
    .order('MaYC', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? { ...data, LoaiThue: chuanHoaLoaiThue(data.LoaiThue) } : null;
}

export async function ganYeuCauThueGanNhat(danhSachDatCoc = []) {
  const cccds = [...new Set(danhSachDatCoc.flatMap((item) => layBienTheCCCD(item.CCCD)))];
  if (!cccds.length) return danhSachDatCoc.map((item) => ({ ...item, LoaiThue: null, YeuCauThue: null }));
  const { data, error } = await supabase
    .from('YeuCauThue')
    .select('MaYC, CCCD, SoNguoiDuKien, LoaiPhong, LoaiThue, ThoiGianVao, ThoiGianThue, NgayTao')
    .in('CCCD', cccds)
    .order('NgayTao', { ascending: false, nullsFirst: false })
    .order('MaYC', { ascending: false });
  if (error) throw error;

  const requestByCustomer = new Map();
  for (const request of data || []) {
    const key = chuanHoaKhoaCCCD(request.CCCD);
    if (!requestByCustomer.has(key)) {
      requestByCustomer.set(key, { ...request, LoaiThue: chuanHoaLoaiThue(request.LoaiThue) });
    }
  }
  return danhSachDatCoc.map((item) => {
    const request = requestByCustomer.get(chuanHoaKhoaCCCD(item.CCCD)) || null;
    return { ...item, LoaiThue: request?.LoaiThue || null, YeuCauThue: request };
  });
}
