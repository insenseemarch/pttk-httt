import express from 'express';
import { supabase } from '../config/supabase.js';
import { getIO } from '../config/ketNoiSocket.js';
import { dinhDangNgay } from '../utils/dinhDang.js';

const router = express.Router();

const TRANG_THAI_CHO_THU = 'Chờ thanh toán';
const TRANG_THAI_SAU_THU = 'Hiệu lực';

// GET /api/ke-toan/cho-thu — danh sách HĐ đang chờ thu tiền kỳ đầu
router.get('/cho-thu', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('HopDong')
      .select(`
        MaHopDong,
        TrangThai,
        GiaThue,
        PhiDichVu,
        NgayGioBD,
        NgayGioKT,
        KyThanhToan,
        KhachHang ( HoTen, SDT ),
        ChiTiet (
          Giuong (
            Phong ( MaPhong, LoaiPhong, ChiNhanh ( TenCN ) )
          )
        )
      `)
      .eq('TrangThai', TRANG_THAI_CHO_THU)
      .order('MaHopDong', { ascending: false });

    if (error) throw error;

    const danhSach = (data || []).map((hd) => {
      const phong = hd.ChiTiet?.[0]?.Giuong?.Phong;
      return {
        maHopDong: hd.MaHopDong,
        maHD: `HD-${String(hd.MaHopDong).padStart(5, '0')}`,
        trangThai: hd.TrangThai,
        hoTen: hd.KhachHang?.HoTen || '—',
        sdt: hd.KhachHang?.SDT || '',
        phong: phong ? `P.${phong.MaPhong} — ${phong.LoaiPhong}` : '—',
        chiNhanh: phong?.ChiNhanh?.TenCN || '',
        ngayBatDau: hd.NgayGioBD ? dinhDangNgay(hd.NgayGioBD) : '—',
        giaThue: Number(hd.GiaThue || 0).toLocaleString('vi-VN') + 'đ',
        giaThueNum: Number(hd.GiaThue || 0),
        phiDichVu: Number(hd.PhiDichVu || 0),
      };
    });

    res.json({ ok: true, danhSach });
  } catch (error) {
    console.error('Lỗi lấy danh sách chờ thu:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// GET /api/ke-toan/chi-tiet-thanh-toan/:maHopDong
router.get('/chi-tiet-thanh-toan/:maHopDong', async (req, res) => {
  try {
    const { maHopDong } = req.params;
    if (!maHopDong) {
      return res.status(400).json({ ok: false, error: 'Thiếu mã hợp đồng' });
    }

    const { data: hd, error } = await supabase
      .from('HopDong')
      .select(`
        MaHopDong,
        GiaThue,
        PhiDichVu,
        NgayGioBD,
        KyThanhToan,
        TrangThai,
        KhachHang ( HoTen, SDT ),
        ChiTiet (
          SoLuong,
          Giuong ( Phong ( MaPhong, LoaiPhong ) )
        )
      `)
      .eq('MaHopDong', Number(maHopDong))
      .single();

    if (error || !hd) {
      return res.status(404).json({ ok: false, error: 'Không tìm thấy hợp đồng' });
    }

    const phong = hd.ChiTiet?.[0]?.Giuong?.Phong;
    const soNguoi = (hd.ChiTiet || []).reduce((s, ct) => s + Number(ct.SoLuong || 1), 0);
    const giaThue = Number(hd.GiaThue || 0);
    const phiDichVu = Number(hd.PhiDichVu || 0);
    const tongTien = giaThue + phiDichVu;

    const danhSachKhoanThu = [
      { ten: 'Tiền thuê kỳ đầu (1 tháng)', kyTinh: `${hd.KyThanhToan || 'Hàng tháng'}`, soTien: giaThue },
    ];
    if (phiDichVu > 0) {
      danhSachKhoanThu.push({ ten: 'Phí dịch vụ', kyTinh: 'Theo hợp đồng', soTien: phiDichVu });
    }

    res.json({
      ok: true,
      data: {
        maGiaoDich: `PAY-${new Date().getFullYear()}-${hd.MaHopDong}`,
        maHopDong: hd.MaHopDong,
        khachHang: {
          tenKhach: hd.KhachHang?.HoTen || '—',
          phong: phong ? `P.${phong.MaPhong} — ${phong.LoaiPhong}` : '—',
          soNguoi,
          ngayBatDau: hd.NgayGioBD ? dinhDangNgay(hd.NgayGioBD) : '—',
          kyThanhToan: `Kỳ đầu — ${new Date().toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}`,
        },
        danhSachKhoanThu,
        tongTienPhaiThu: tongTien,
        donViTien: 'VNĐ',
        ghiChuQuanLy: 'Khách đã ký hợp đồng. Kế toán thu đủ tiền kỳ đầu trước khi bàn giao phòng.',
      },
    });
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết thanh toán:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// POST /api/ke-toan/xac-nhan-thu-tien
router.post('/xac-nhan-thu-tien', async (req, res) => {
  try {
    const { maGiaoDich, phuongThuc, soTienThucThu, maKeToan, maHopDong } = req.body;

    if (!soTienThucThu || !maHopDong) {
      return res.status(400).json({ ok: false, error: 'Thiếu số tiền hoặc mã hợp đồng' });
    }

    // 1. Ghi hóa đơn thu tiền kỳ đầu
    const homNay = new Date().toISOString().split('T')[0];
    const { data: gd, error: gdError } = await supabase
      .from('HoaDon')
      .insert([{
        MaHopDong: Number(maHopDong),
        SoTien: Number(soTienThucThu),
        NgayLap: homNay,
        NgayThanhToan: homNay,
        HinhThucThanhToan: phuongThuc || 'Tiền mặt',
        TrangThai: 'Đã thanh toán',
        NVKT: maKeToan ? Number(maKeToan) : null,
      }])
      .select()
      .single();

    if (gdError) {
      console.warn('Lỗi ghi hóa đơn:', gdError.message);
    }

    // 2. Cập nhật trạng thái HĐ → Hiệu lực
    const { error: hdError } = await supabase
      .from('HopDong')
      .update({ TrangThai: TRANG_THAI_SAU_THU })
      .eq('MaHopDong', Number(maHopDong));

    if (hdError) {
      console.warn('Lỗi cập nhật trạng thái HĐ:', hdError.message);
    }

    // 3. Gửi thông báo cho Quản lý để bàn giao phòng
    const io = getIO();
    if (io) {
      io.to('role:QUAN_LY').emit('thong_bao_moi', {
        noiDung: `Kế toán đã thu đủ tiền kỳ đầu cho HĐ-${String(maHopDong).padStart(5, '0')}. Vui lòng tiến hành bàn giao phòng.`,
        loaiSuKien: 'ban_giao_phong',
        phieuId: maHopDong,
      });
    }

    const maPhieuThu = gd?.MaHD ? `HD-${String(gd.MaHD).padStart(5, '0')}` : `REC-${Date.now()}`;

    res.json({
      ok: true,
      data: {
        maPhieuThu,
        maGiaoDich,
        phuongThuc: phuongThuc || 'tien-mat',
        soTienThucThu: Number(soTienThucThu),
        message: 'Xác nhận thu tiền thành công. Đã thông báo Quản lý chuẩn bị bàn giao phòng.',
      },
    });
  } catch (error) {
    console.error('Lỗi khi xác nhận thu tiền:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;
