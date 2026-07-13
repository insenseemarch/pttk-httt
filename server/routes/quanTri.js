import {
  layDanhSachKhachHang,
  layChiTietKhachHang,
  themKhachHang,
  capNhatKhachHang,
} from '../services/khachHang.js';
import {
  layThongKePhongGiuong,
  layDanhSachPhong,
  layDanhSachChiNhanh,
} from '../services/phongGiuong.js';
import {
  layDanhSachHopDong,
  layChiTietHopDong,
  demHopDongSapHetHan,
} from '../services/hopDong.js';
import {
  layThongKeTaiKhoan,
  layDanhSachNhanVien,
  taoNhanVien,
  capNhatNhanVien,
} from '../services/nhanVienQuanLy.js';
import { layThongKeThongBao, layDanhSachThongBao } from '../services/thongBao.js';

function traLoiLoi(res, error, nhan) {
  console.error(`Lỗi ${nhan}:`, error);
  res.status(500).json({ ok: false, error: error.message });
}

export function ganRouteQuanTri(app) {
  // Khách hàng
  app.get('/api/khach-hang', async (req, res) => {
    try {
      const ketQua = await layDanhSachKhachHang(req.query);
      res.json({ ok: true, ...ketQua });
    } catch (error) {
      traLoiLoi(res, error, 'lấy danh sách khách hàng');
    }
  });

  app.get('/api/khach-hang/:cccd', async (req, res) => {
    try {
      const chiTiet = await layChiTietKhachHang(req.params.cccd);
      if (!chiTiet) return res.status(404).json({ ok: false, error: 'Không tìm thấy khách hàng' });
      res.json({ ok: true, data: chiTiet });
    } catch (error) {
      traLoiLoi(res, error, 'lấy chi tiết khách hàng');
    }
  });

  app.post('/api/khach-hang', async (req, res) => {
    try {
      const data = await themKhachHang(req.body);
      res.json({ ok: true, data });
    } catch (error) {
      traLoiLoi(res, error, 'thêm khách hàng');
    }
  });

  app.put('/api/khach-hang/:cccd', async (req, res) => {
    try {
      const data = await capNhatKhachHang(req.params.cccd, req.body);
      res.json({ ok: true, data });
    } catch (error) {
      traLoiLoi(res, error, 'cập nhật khách hàng');
    }
  });

  // Phòng & Giường
  app.get('/api/phong-giuong/thong-ke', async (req, res) => {
    try {
      const data = await layThongKePhongGiuong();
      res.json({ ok: true, data });
    } catch (error) {
      traLoiLoi(res, error, 'lấy thống kê phòng/giường');
    }
  });

  app.get('/api/phong-giuong', async (req, res) => {
    try {
      const ketQua = await layDanhSachPhong(req.query);
      res.json({ ok: true, ...ketQua });
    } catch (error) {
      traLoiLoi(res, error, 'lấy danh sách phòng/giường');
    }
  });

  app.get('/api/chi-nhanh', async (req, res) => {
    try {
      const data = await layDanhSachChiNhanh();
      res.json({ ok: true, data });
    } catch (error) {
      traLoiLoi(res, error, 'lấy chi nhánh');
    }
  });

  // Hợp đồng
  app.get('/api/hop-dong/can-bao', async (req, res) => {
    try {
      const soLuong = await demHopDongSapHetHan(Number(req.query.soNgay) || 30);
      res.json({ ok: true, data: { soLuong } });
    } catch (error) {
      traLoiLoi(res, error, 'đếm HĐ sắp hết hạn');
    }
  });

  app.get('/api/hop-dong', async (req, res) => {
    try {
      const ketQua = await layDanhSachHopDong(req.query);
      res.json({ ok: true, ...ketQua });
    } catch (error) {
      traLoiLoi(res, error, 'lấy danh sách hợp đồng');
    }
  });

  app.get('/api/hop-dong/:ma(\\d+)', async (req, res) => {
    try {
      const data = await layChiTietHopDong(req.params.ma);
      if (!data) return res.status(404).json({ ok: false, error: 'Không tìm thấy hợp đồng' });
      res.json({ ok: true, data });
    } catch (error) {
      traLoiLoi(res, error, 'lấy chi tiết hợp đồng');
    }
  });

  // Tài khoản nhân viên
  app.get('/api/tai-khoan/thong-ke', async (req, res) => {
    try {
      const data = await layThongKeTaiKhoan();
      res.json({ ok: true, data });
    } catch (error) {
      traLoiLoi(res, error, 'lấy thống kê tài khoản');
    }
  });

  app.get('/api/tai-khoan', async (req, res) => {
    try {
      const ketQua = await layDanhSachNhanVien(req.query);
      res.json({ ok: true, ...ketQua });
    } catch (error) {
      traLoiLoi(res, error, 'lấy danh sách tài khoản');
    }
  });

  app.post('/api/tai-khoan', async (req, res) => {
    try {
      const data = await taoNhanVien(req.body);
      res.json({ ok: true, data });
    } catch (error) {
      res.status(400).json({ ok: false, error: error.message });
    }
  });

  app.put('/api/tai-khoan/:maNV', async (req, res) => {
    try {
      const data = await capNhatNhanVien(req.params.maNV, req.body);
      res.json({ ok: true, data });
    } catch (error) {
      traLoiLoi(res, error, 'cập nhật tài khoản');
    }
  });

  // Thông báo
  app.get('/api/thong-bao/thong-ke', async (req, res) => {
    try {
      const data = await layThongKeThongBao();
      res.json({ ok: true, data });
    } catch (error) {
      traLoiLoi(res, error, 'lấy thống kê thông báo');
    }
  });

  app.get('/api/thong-bao', async (req, res) => {
    try {
      const ketQua = await layDanhSachThongBao(req.query);
      res.json({ ok: true, ...ketQua });
    } catch (error) {
      traLoiLoi(res, error, 'lấy danh sách thông báo');
    }
  });
}
