import express from 'express';

const router = express.Router();

// --- THANH TOÁN ĐẦU KỲ (INITIAL PAYMENT) ---
// Lấy chi tiết các khoản thu đầu kỳ để kế toán xác nhận
function layChiTietThanhToan(maHopDong) {
  return {
    maGiaoDich: 'PAY-2024-0892',
    maHopDong: maHopDong,
    khachHang: {
      tenKhach: 'Nguyễn Hoàng Nam',
      phong: 'P.402 - Standard',
      soNguoi: 1,
      ngayBatDau: '15/10/2024',
      kyThanhToan: 'Tháng 10/2024'
    },
    danhSachKhoanThu: [
      { ten: 'Tiền thuê kỳ đầu (1 tháng)', kyTinh: '15/10/2024 – 15/11/2024', soTien: 4800000 },
      { ten: 'Phí gửi xe', kyTinh: '01 xe gắn máy', soTien: 150000 },
      { ten: 'Phí Wifi', kyTinh: 'Tốc độ cao 100Mbps', soTien: 100000 },
      { ten: 'Tiền điện/nước tạm ứng', kyTinh: 'Cố định tháng đầu', soTien: 250000 }
    ],
    tongTienPhaiThu: 5300000,
    donViTien: 'VNĐ',
    ghiChuQuanLy: 'Khách thanh toán cọc 1 tháng trước đó. Nay thanh toán phí đầu kỳ để nhận phòng.'
  };
}

// GET /api/ke-toan/chi-tiet-thanh-toan/:maHopDong
// Lấy chi tiết khoản thu đầu kỳ cho kế toán xác nhận
router.get('/chi-tiet-thanh-toan/:maHopDong', async (req, res) => {
  try {
    const { maHopDong } = req.params;
    if (!maHopDong) {
      return res.status(400).json({ ok: false, error: 'Thiếu mã hợp đồng' });
    }
    const data = layChiTietThanhToan(maHopDong);
    res.json({ ok: true, data });
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết thanh toán:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// POST /api/ke-toan/xac-nhan-thu-tien
// Xác nhận đã thu đủ tiền và kích hoạt quy trình bàn giao
router.post('/xac-nhan-thu-tien', async (req, res) => {
  try {
    const { maGiaoDich, phuongThuc, soTienThucThu, maKeToan } = req.body;

    if (!maGiaoDich || !soTienThucThu) {
      return res.status(400).json({ ok: false, error: 'Thiếu mã giao dịch hoặc số tiền thực thu' });
    }

    // Kiểm tra số tiền thu có đủ không
    const tongTienPhaiThu = 5300000; // Trong môi trường thật: lấy từ DB theo maGiaoDich
    const soTienThucThuNum = Number(soTienThucThu);

    if (soTienThucThuNum < tongTienPhaiThu) {
      return res.status(400).json({
        ok: false,
        error: `Số tiền thu chưa đủ. Còn thiếu: ${(tongTienPhaiThu - soTienThucThuNum).toLocaleString('vi-VN')}đ`
      });
    }

    // Trong môi trường thật:
    // - Cập nhật trạng thái thanh toán → COLLECTED
    // - Ghi nhận thời điểm thu tiền và kế toán xác nhận
    // - Gửi thông báo Quản lý: sẵn sàng bàn giao phòng
    const maPhieuThu = `REC-${Date.now()}`;

    res.json({
      ok: true,
      data: {
        maPhieuThu: maPhieuThu,
        maGiaoDich: maGiaoDich,
        maKeToan: maKeToan || null,
        phuongThuc: phuongThuc || 'tien-mat',
        soTienThucThu: soTienThucThuNum,
        message: 'Xác nhận thu tiền thành công. Hệ thống đã thông báo Quản lý chuẩn bị bàn giao phòng.',
        buocTiepTheo: '/management/handover'
      }
    });
  } catch (error) {
    console.error('Lỗi khi xác nhận thu tiền:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;
