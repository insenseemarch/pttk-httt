import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '../.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey || supabaseAnonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run() {
  const tbls = ['KhachHang', 'Phong', 'Giuong', 'HopDong', 'ChiTiet', 'PhieuDoiSoat', 'TaiKhoan', 'ThongBao', 'HoSoDatCoc', 'GiaoDichThanhToan', 'BienBanBanGiao'];
  for (const t of tbls) {
    const { data, error } = await supabase.from(t).select('*').limit(1);
    console.log(`Table ${t}:`, error ? error.message : Object.keys(data?.[0] || {}).join(', '));
  }
}
run();
