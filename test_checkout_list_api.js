import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);

async function run() {
  const { data: contracts, error: errC } = await supabase
    .from('HopDong')
    .select(`
      *,
      KhachHang (*),
      ChiTiet (
        MaGiuong,
        Giuong (
          Phong (
            MaPhong,
            ChiNhanh (TenCN)
          )
        )
      ),
      PhieuDoiSoat (*),
      BienBanBanGiao (*)
    `);
  
  if (errC) {
    console.error('Error fetching contracts:', errC);
    return;
  }

  console.log('--- CONTRACTS ---');
  contracts.forEach(c => {
    const pds = c.PhieuDoiSoat?.length ? c.PhieuDoiSoat[0] : null;
    const trangThai = pds?.TrangThai || c.TrangThai || 'Hiệu lực';
    console.log(`Contract MaHopDong: ${c.MaHopDong}, DB TrangThai: ${c.TrangThai}, PDS TrangThai: ${pds?.TrangThai}, Resolved TrangThai: ${trangThai}`);
  });
}
run();
