import express from 'express';
import {
  layDanhSachChoNhanPhong,
  layChiTietNhanPhong,
  luuNhapNhanPhong,
  xacNhanGhiNhanNhanPhong,
  xoaThanhVienNhom,
} from '../services/nhanPhong.js';

const router = express.Router();

function traLoiLoi(res, error, nhan) {
  console.error(`Lỗi ${nhan}:`, error);
  res.status(500).json({ ok: false, error: error.message });
}

// GET /api/nhan-phong — danh sách hồ sơ chờ ghi nhận nhận phòng
router.get('/', async (req, res) => {
  try {
    const ketQua = await layDanhSachChoNhanPhong(req.query);
    res.json({ ok: true, ...ketQua });
  } catch (error) {
    traLoiLoi(res, error, 'lấy danh sách nhận phòng');
  }
});

// GET /api/nhan-phong/:maDatCoc — chi tiết hồ sơ
router.get('/:maDatCoc', async (req, res) => {
  try {
    const maDatCoc = Number(req.params.maDatCoc);
    if (!maDatCoc) {
      return res.status(400).json({ ok: false, error: 'Mã đặt cọc không hợp lệ' });
    }
    const data = await layChiTietNhanPhong(maDatCoc);
    if (!data) {
      return res.status(404).json({ ok: false, error: 'Không tìm thấy hồ sơ đặt cọc' });
    }
    res.json({ ok: true, data });
  } catch (error) {
    traLoiLoi(res, error, 'lấy chi tiết nhận phòng');
  }
});

// PUT /api/nhan-phong/:maDatCoc/luu-nhap — lưu nháp thông tin
router.put('/:maDatCoc/luu-nhap', async (req, res) => {
  try {
    const maDatCoc = Number(req.params.maDatCoc);
    const data = await luuNhapNhanPhong(maDatCoc, req.body);
    res.json({ ok: true, data, message: 'Đã lưu nháp thông tin nhận phòng' });
  } catch (error) {
    traLoiLoi(res, error, 'lưu nháp nhận phòng');
  }
});

// POST /api/nhan-phong/:maDatCoc/xac-nhan — xác nhận ghi nhận
router.post('/:maDatCoc/xac-nhan', async (req, res) => {
  try {
    const maDatCoc = Number(req.params.maDatCoc);
    const ketQua = await xacNhanGhiNhanNhanPhong(maDatCoc, req.body, req.body?.maNV || null);
    if (!ketQua.ok) {
      return res.status(400).json({ ok: false, loi: ketQua.loi });
    }
    res.json({ ok: true, ...ketQua });
  } catch (error) {
    traLoiLoi(res, error, 'xác nhận ghi nhận nhận phòng');
  }
});

// DELETE /api/nhan-phong/:maDatCoc/thanh-vien/:cccd
router.delete('/:maDatCoc/thanh-vien/:cccd', async (req, res) => {
  try {
    const maDatCoc = Number(req.params.maDatCoc);
    const data = await xoaThanhVienNhom(maDatCoc, req.params.cccd);
    res.json({ ok: true, data, message: 'Đã xóa thành viên khỏi danh sách' });
  } catch (error) {
    traLoiLoi(res, error, 'xóa thành viên nhóm');
  }
});

export default router;
