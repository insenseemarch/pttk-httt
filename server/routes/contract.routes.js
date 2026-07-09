import express from 'express';

const router = express.Router();

// --- LẬP HỢP ĐỒNG THUÊ (CONTRACT DRAFTING) ---
// Lấy dữ liệu pre-fill (thông tin khách, thuê, biểu phí) để khởi tạo bản nháp hợp đồng
function layDuLieuLapHopDong(maHoSo) {
  return {
    maHoSo: maHoSo,
    khachHang: {
      maKH: 'KH-2023-8821',
      hoTen: 'Nguyễn Văn An',
      cccd: '001092003841'
    },
    thongTinThue: {
      phongGiuong: 'Phòng 402 - Giường A',
      maPhong: 'P.402-A',
      chiNhanh: 'Bình Thạnh',
      ngayBatDau: '2023-10-15',
      thoiHanThue: 12,
      soGiuong: 1,
      giaThueCoBan: 2500000,
      soTienCoc: 2500000,
      ngayDatCoc: '2023-10-01',
      kyThanhToan: 'MONTHLY'
    },
    bieuPhiDichVu: [
      { id: 'elec', ten: 'Tiền điện', donVi: 'VNĐ/kWh', gia: 3500 },
      { id: 'water', ten: 'Tiền nước', donVi: 'VNĐ/Người', gia: 100000 },
      { id: 'wifi', ten: 'Internet / Wifi', donVi: 'VNĐ/Phòng', gia: 50000 },
      { id: 'parking', ten: 'Gửi xe', donVi: 'VNĐ/Xe', gia: 120000 }
    ],
    quyDinhCoc: [
      { moTa: 'Đúng thời hạn hợp đồng', mucHoan: '100%' },
      { moTa: 'Báo trước 30 ngày (trước hạn)', mucHoan: '80%' },
      { moTa: 'Báo trước 15 ngày (trước hạn)', mucHoan: '70%' },
      { moTa: 'Chấm dứt đột xuất (<15 ngày)', mucHoan: '50%' }
    ]
  };
}

// GET /api/hop-dong/pre-fill/:maHoSo
// Lấy dữ liệu khởi tạo bản nháp hợp đồng từ hồ sơ đặt cọc
router.get('/pre-fill/:maHoSo', async (req, res) => {
  try {
    const { maHoSo } = req.params;
    if (!maHoSo) {
      return res.status(400).json({ ok: false, error: 'Thiếu mã hồ sơ đặt cọc' });
    }
    const data = layDuLieuLapHopDong(maHoSo);
    res.json({ ok: true, data });
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu lập hợp đồng:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// POST /api/hop-dong/tao-moi
// Tạo hợp đồng điện tử từ thông tin đã nhập
router.post('/tao-moi', async (req, res) => {
  try {
    const { khachHang, thongTinThue, bieuPhiDichVu, dieuKhoanBoSung } = req.body;

    if (!khachHang || !khachHang.maKH || !thongTinThue || !thongTinThue.maPhong) {
      return res.status(400).json({ ok: false, error: 'Thiếu thông tin bắt buộc của hợp đồng (mã khách hàng, mã phòng)' });
    }

    // Trong môi trường thật: sinh PDF, lưu bản ghi Hợp đồng và liên kết với hồ sơ đặt cọc
    const maHopDong = `CON-${Date.now()}`;

    res.status(201).json({
      ok: true,
      data: {
        maHopDong: maHopDong,
        message: 'Lập hợp đồng thành công. Sẵn sàng cho bước ký kết.',
        buocTiepTheo: '/accounting/initial-payment',
        bieuPhiDichVu: bieuPhiDichVu || [],
        dieuKhoanBoSung: dieuKhoanBoSung || ''
      }
    });
  } catch (error) {
    console.error('Lỗi khi tạo hợp đồng:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;
