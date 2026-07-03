import { dangNhap, datLaiMatKhau, guiLienKetKhoiPhucMatKhau } from '../services/xacThuc.js';
import {
  layThongKeDashboard,
  layCocChoDuyet,
  layLichTraPhongSapToi,
  demCocChoDuyet,
} from '../services/dashboard.js';

async function xuLyDangNhap(req, res) {
  try {
    const { tenDangNhap, matKhau } = req.body;
    if (!tenDangNhap || !matKhau) {
      return res.status(400).json({ ok: false, error: 'Vui lòng nhập tên đăng nhập và mật khẩu' });
    }
    const ketQua = await dangNhap(tenDangNhap, matKhau);
    if (!ketQua.thanhCong) {
      return res.status(401).json({ ok: false, error: ketQua.loi });
    }
    res.json({ ok: true, data: ketQua.nguoiDung, token: ketQua.token || null });
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
}

async function xuLyQuenMatKhau(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ ok: false, error: 'Vui lòng nhập email' });
    }
    const ketQua = await guiLienKetKhoiPhucMatKhau(email);
    res.json({
      ok: true,
      message: ketQua.thongBao,
      tokenKhoiPhuc: ketQua.tokenKhoiPhuc,
      linkKhoiPhuc: ketQua.linkKhoiPhuc,
    });
  } catch (error) {
    console.error('Lỗi quên mật khẩu:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
}

async function xuLyDatLaiMatKhau(req, res) {
  try {
    const { token, matKhauMoi } = req.body;
    if (!token || !matKhauMoi) {
      return res.status(400).json({ ok: false, error: 'Thiếu token hoặc mật khẩu mới' });
    }
    const ketQua = await datLaiMatKhau(token, matKhauMoi);
    if (!ketQua.thanhCong) {
      return res.status(400).json({ ok: false, error: ketQua.loi });
    }
    res.json({ ok: true, message: ketQua.thongBao });
  } catch (error) {
    console.error('Lỗi đặt lại mật khẩu:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
}

async function xuLyLayThongKeDashboard(req, res) {
  try {
    const thongKe = await layThongKeDashboard();
    const soCocCho = await demCocChoDuyet();
    res.json({ ok: true, data: { ...thongKe, soCocChoDuyet: soCocCho } });
  } catch (error) {
    console.error('Lỗi lấy thống kê dashboard:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
}

async function xuLyLayCocChoDuyet(req, res) {
  try {
    const danhSach = await layCocChoDuyet(Number(req.query.limit) || 10);
    res.json({ ok: true, data: danhSach });
  } catch (error) {
    console.error('Lỗi lấy cọc chờ duyệt:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
}

async function xuLyLayLichTraPhong(req, res) {
  try {
    const danhSach = await layLichTraPhongSapToi(Number(req.query.limit) || 5);
    res.json({ ok: true, data: danhSach });
  } catch (error) {
    console.error('Lỗi lấy lịch trả phòng:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
}

export function ganRouteAuthDashboard(app) {
  app.post('/api/dang-nhap', xuLyDangNhap);
  app.post('/api/quen-mat-khau', xuLyQuenMatKhau);
  app.post('/api/dat-lai-mat-khau', xuLyDatLaiMatKhau);
  app.get('/api/dashboard/thong-ke', xuLyLayThongKeDashboard);
  app.get('/api/dashboard/coc-cho-duyet', xuLyLayCocChoDuyet);
  app.get('/api/dashboard/lich-tra-phong', xuLyLayLichTraPhong);
}
