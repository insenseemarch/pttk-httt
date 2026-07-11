import { supabase } from './config/supabase.js';

export async function syncPhongGiuong() {
  console.log('Bắt đầu đồng bộ trạng thái Phòng/Giường...');
  
  // Lấy tất cả Giường
  const { data: giuongs, error: err1 } = await supabase.from('Giuong').select('MaGiuong, MaPhong');
  if (err1) throw err1;

  // Lấy các hợp đồng đang hoạt động (không phải Đã thanh lý, Hủy)
  const { data: ctHopDong, error: err2 } = await supabase
    .from('ChiTiet')
    .select('MaGiuong, HopDong!inner(TrangThai)');
  if (err2) throw err2;
  const activeHopDongStates = ['Đang hiệu lực', 'Chờ kiểm tra', 'Chờ xác nhận đối soát', 'Khách đồng ý đối soát (Chờ TT)', 'Chờ thanh toán', 'Chờ thanh toán thêm', 'Chờ thanh lý', 'Chờ hoàn cọc', 'Chờ đối soát'];
  const giuongThue = new Set(
    ctHopDong
      .filter(ct => activeHopDongStates.includes(ct.HopDong.TrangThai))
      .map(ct => ct.MaGiuong)
  );

  // Lấy các đặt cọc đang hoạt động
  const { data: ctDatCoc, error: err3 } = await supabase
    .from('GiuongDatCoc')
    .select('MaGiuong, DatCoc!inner(TrangThai)');
  if (err3) throw err3;
  const activeDatCocStates = ['Chờ duyệt', 'Chờ xác nhận', 'Chờ thanh toán', 'Đã cọc', 'Đã thanh toán', 'Chờ hoàn cọc', 'Chờ thanh lý', 'Chờ đối soát'];
  const giuongCoc = new Set(
    ctDatCoc
      .filter(ct => activeDatCocStates.includes(ct.DatCoc.TrangThai))
      .map(ct => ct.MaGiuong)
  );

  const updatesGiuong = [];
  const phongMap = new Map(); // MaPhong -> { tongGiuong: 0, giuongThue: 0 }

  for (const g of giuongs) {
    const isRented = giuongThue.has(g.MaGiuong) || giuongCoc.has(g.MaGiuong);
    const expectedTinhTrang = !isRented;
    
    updatesGiuong.push({ MaGiuong: g.MaGiuong, TinhTrang: expectedTinhTrang });

    if (g.MaPhong) {
      if (!phongMap.has(g.MaPhong)) {
        phongMap.set(g.MaPhong, { tongGiuong: 0, giuongThue: 0 });
      }
      const p = phongMap.get(g.MaPhong);
      p.tongGiuong += 1;
      if (isRented) p.giuongThue += 1;
    }
  }

  // Update Giuong
  for (const u of updatesGiuong) {
    await supabase.from('Giuong').update({ TinhTrang: u.TinhTrang }).eq('MaGiuong', u.MaGiuong);
  }

  // Update Phong
  for (const [maPhong, info] of phongMap.entries()) {
    const sucChua = info.tongGiuong - info.giuongThue;
    const tinhTrang = sucChua > 0;
    await supabase.from('Phong').update({ SucChua: sucChua, TinhTrang: tinhTrang }).eq('MaPhong', maPhong);
  }

  console.log('Đồng bộ thành công!');
}

if (process.argv[1] && process.argv[1].includes('syncPhongGiuong.js')) {
  syncPhongGiuong().catch(console.error);
}
