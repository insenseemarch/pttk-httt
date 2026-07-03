import express from 'express';

const router = express.Router();

// --- BÀN GIAO TÀI SẢN (ASSET HANDOVER) ---
// Lấy thông tin khách và danh mục tài sản mặc định để bàn giao phòng
function layDuLieuBanGiao(maGiaoDich) {
  return {
    maGiaoDich: maGiaoDich,
    khachHang: {
      maKH: 'MS-88291',
      hoTen: 'Nguyễn Văn Khải',
      anhDaiDien: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=128&h=128&fit=crop',
      phongGiuong: 'P.402 (Standard Single)',
      ngayNhan: '2024-05-24',
      thoiHanThue: '12 tháng'
    },
    danhMucTaiSan: [
      { id: 'item-1', ten: 'Giường', nhom: 'FURNITURE', goiY: 'Ghi chú tình trạng (ví dụ: Mới 100%, không trầy xước...)' },
      { id: 'item-2', ten: 'Nệm', nhom: 'FURNITURE', goiY: 'Ghi chú tình trạng (ví dụ: Nệm cao su, có ga trải mới...)' },
      { id: 'item-3', ten: 'Tủ', nhom: 'FURNITURE', goiY: 'Ghi chú tình trạng (ví dụ: Tủ quần áo 2 cánh, khóa ổn định...)' },
      { id: 'item-4', ten: 'Chìa khóa / Thẻ từ', nhom: 'ACCESS', goiY: 'Nhập mã số thẻ hoặc số lượng khóa...' },
      { id: 'item-5', ten: 'Vệ sinh đạt yêu cầu', nhom: 'SERVICE', goiY: 'Nhận xét vệ sinh...' }
    ],
    trangThaiThanhToan: 'COLLECTED',
    maHopDong: 'CON-2024-0892'
  };
}

// GET /api/ban-giao/:maGiaoDich
// Lấy dữ liệu khách và checklist tài sản cho màn hình bàn giao
router.get('/:maGiaoDich', async (req, res) => {
  try {
    const { maGiaoDich } = req.params;
    if (!maGiaoDich) {
      return res.status(400).json({ ok: false, error: 'Thiếu mã giao dịch bàn giao' });
    }
    const data = layDuLieuBanGiao(maGiaoDich);
    res.json({ ok: true, data });
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu bàn giao:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// POST /api/ban-giao/hoan-tat
// Xác nhận checklist tài sản và ký biên bản bàn giao
router.post('/hoan-tat', async (req, res) => {
  try {
    const { maGiaoDich, ketQuaTaiSan, chuKy, maQuanLy } = req.body;

    if (!maGiaoDich || !Array.isArray(ketQuaTaiSan)) {
      return res.status(400).json({ ok: false, error: 'Thiếu mã giao dịch hoặc danh sách kết quả kiểm kê' });
    }

    // Validate: tất cả tài sản phải được kiểm và cả hai bên phải ký
    const daKiemDu = ketQuaTaiSan.every(item => item.daKiem === true);
    if (!daKiemDu || !chuKy || !chuKy.quanLy || !chuKy.khach) {
      return res.status(400).json({ ok: false, error: 'Vui lòng hoàn thành checklist và ký tên đầy đủ trước khi xác nhận.' });
    }

    // Trong môi trường thật:
    // - Cập nhật Phòng sang ĐANG THUÊ
    // - Ghi thời điểm bắt đầu thuê chính thức
    // - Sinh biên bản bàn giao điện tử (trigger PDF)
    const maBienBan = `PRO-${Date.now()}`;

    res.json({
      ok: true,
      data: {
        maBienBan: maBienBan,
        maQuanLy: maQuanLy || null,
        message: 'Bàn giao hoàn tất. Phòng đã được chuyển sang trạng thái ĐANG THUÊ.',
        buocTiepTheo: '/management/dashboard'
      }
    });
  } catch (error) {
    console.error('Lỗi khi hoàn tất bàn giao:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;
