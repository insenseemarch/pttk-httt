import express from 'express';

const router = express.Router();

// --- THANH LÝ HỢP ĐỒNG & THU HỒI TÀI SẢN (CONTRACT LIQUIDATION) ---

function layDuLieuThanhLy(maHopDong) {
  return {
    thongTin: {
      maHopDong: maHopDong,
      maKH: '079200012345',
      tenKhach: 'Nguyễn Minh Tuấn',
      phong: 'Phòng P-302 (Dorm 4 giường)',
      ngayKetThuc: '15 tháng 10, 2023',
      lyDo: 'Hết hạn hợp đồng',
      trangThai: 'Chờ hoàn tất'
    },
    danhSachThuTuc: [
      { id: 'proc-1', ten: 'Ký biên bản trả phòng', batBuoc: true },
      { id: 'proc-2', ten: 'Ký thanh lý hợp đồng thuê', batBuoc: true },
      { id: 'proc-3', ten: 'Đã thu hồi chìa khóa', batBuoc: true },
      { id: 'proc-4', ten: 'Đã thu hồi thẻ ra vào', batBuoc: true }
    ]
  };
}

// GET /api/thanh-ly/:maHopDong
// Lấy thông tin thanh lý và danh sách thủ tục
router.get('/:maHopDong', async (req, res) => {
  try {
    const { maHopDong } = req.params;
    if (!maHopDong) {
      return res.status(400).json({ ok: false, error: 'Thiếu mã hợp đồng' });
    }
    const data = layDuLieuThanhLy(maHopDong);
    res.json({ ok: true, data });
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu thanh lý:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// POST /api/thanh-ly/hoan-tat
// Hoàn tất thanh lý: cập nhật phòng sang TRỐNG, đánh dấu hợp đồng đã thanh lý
router.post('/hoan-tat', async (req, res) => {
  try {
    const { maHopDong, ketQuaThuTuc, ghiChuTaiSan, chuKy, maQuanLy } = req.body;

    if (!maHopDong || !Array.isArray(ketQuaThuTuc)) {
      return res.status(400).json({ ok: false, error: 'Thiếu mã hợp đồng hoặc kết quả thủ tục' });
    }

    // Validate: tất cả thủ tục phải hoàn thành và cả hai bên đã ký
    const tatCaHoanThanh = ketQuaThuTuc.every(p => p.daHoanThanh === true);
    if (!tatCaHoanThanh || !chuKy?.quanLy || !chuKy?.khach) {
      return res.status(400).json({
        ok: false,
        error: 'Vui lòng hoàn thành tất cả thủ tục và ký tên đầy đủ.'
      });
    }

    // Trong môi trường thật:
    // - Cập nhật Phòng sang TRỐNG (TinhTrang = true)
    // - Đánh dấu hợp đồng là LIQUIDATED
    // - Kích hoạt quy trình hoàn cọc cho kế toán
    const maThanhLy = `LIQ-${Date.now()}`;

    res.json({
      ok: true,
      data: {
        maThanhLy: maThanhLy,
        maHopDong: maHopDong,
        maQuanLy: maQuanLy || null,
        message: 'Thanh lý hợp đồng thành công. Trạng thái phòng đã được cập nhật sang TRỐNG.',
        buocTiepTheo: '/accounting/refund-process'
      }
    });
  } catch (error) {
    console.error('Lỗi khi hoàn tất thanh lý:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;
