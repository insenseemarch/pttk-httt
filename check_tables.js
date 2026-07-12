import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // Let's run a query to information_schema using an RPC if possible, or just print table structures we know about.
  // Wait, let's try querying standard tables to see if they exist.
  const tables = [
    'DatCoc', 'KhachHang', 'NhanVien', 'Phong', 'Giuong', 'HopDong',
    'PhieuDoiSoat', 'LichXemPhong', 'GiaoDichThanhToan', 'BienBanBanGiao',
    'ChiTiet', 'GiuongDatCoc', 'ChiNhanh', 'YeuCauThue', 'ThanhVien', 'ThanhVienNhom'
  ];

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (!error) {
      const keys = data.length > 0 ? Object.keys(data[0]).join(', ') : 'No data';
      console.log(`[EXIST] ${table}: ${keys}`);
    } else {
      if (!error.message.includes('Could not find the table')) {
        console.log(`[EXIST BUT ERROR] ${table}: ${error.message}`);
      } else {
        console.log(`[NOT EXIST] ${table}`);
      }
    }
  }
}
run();
