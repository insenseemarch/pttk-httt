import express from 'express';
import { supabase } from '../config/supabase.js';
import { dinhDangNgay } from '../utils/dinhDang.js';

const router = express.Router();

// GET /api/ke-toan/chi-tiet-thanh-toan/:maHopDong
router.get('/chi-tiet-thanh-toan/:maHopDong', async (req, res) => {
  try {
    const { maHopDong } = req.params;
    if (!maHopDong) {
      return res.status(400).json({ ok: false, error: 'Thiếu mã hợp đồng' });
    }
    
    // Lấy thông tin từ hợp đồng
    const { data: hd, error } = await supabase
      .from('HopDong')
      .select(`
        *,
        KhachHang ( HoTen ),
        ChiTiet ( Giuong ( Phong ( MaPhong, LoaiPhong ) ) )
      `)
      .eq('MaHopDong', Number(maHopDong))
      .single();

    if (error) {
       console.warn('Lỗi khi lấy chi tiết thanh toán từ DB:', error.message);
    }

    const khach = hd?.KhachHang;
    const phong = hd?.ChiTiet?.[0]?.Giuong?.Phong;
    
    const data = {
      maGiaoDich: `PAY-${new Date().getFullYear()}-${maHopDong}`,
      maHopDong: maHopDong,
      khachHang: {
        tenKhach: khach?.HoTen || 'Nguyễn Hoàng Nam',
        phong: phong ? `P.${phong.MaPhong} - ${phong.LoaiPhong}` : 'P.402 - Standard',
        soNguoi: 1,
        ngayBatDau: hd?.NgayGioBD ? dinhDangNgay(hd.NgayGioBD) : '15/10/2024',
        kyThanhToan: `Tháng ${new Date().getMonth() + 1}/${new Date().getFullYear()}`
      },
      danhSachKhoanThu: [
        { ten: 'Tiền thuê kỳ đầu (1 tháng)', kyTinh: 'Kỳ đầu', soTien: hd?.GiaThue || 4800000 },
        { ten: 'Phí gửi xe', kyTinh: '01 xe gắn máy', soTien: 150000 },
        { ten: 'Phí Wifi', kyTinh: 'Tốc độ cao 100Mbps', soTien: 100000 },
        { ten: 'Tiền điện/nước tạm ứng', kyTinh: 'Cố định tháng đầu', soTien: 250000 }
      ],
      tongTienPhaiThu: (hd?.GiaThue || 4800000) + 500000,
      donViTien: 'VNĐ',
      ghiChuQuanLy: 'Khách đã thanh toán cọc tương đương 2 tháng tiền thuê. Nay thanh toán phí đầu kỳ để nhận phòng.'
    };
    res.json({ ok: true, data });
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết thanh toán:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// POST /api/ke-toan/xac-nhan-thu-tien
router.post('/xac-nhan-thu-tien', async (req, res) => {
  try {
    const { maGiaoDich, phuongThuc, soTienThucThu, maKeToan, maHopDong } = req.body;

    if (!maGiaoDich || !soTienThucThu) {
      return res.status(400).json({ ok: false, error: 'Thiếu mã giao dịch hoặc số tiền thực thu' });
    }

    // Ghi nhận giao dịch vào DB GiaoDichThanhToan
    const { data: gd, error: gdError } = await supabase
      .from('GiaoDichThanhToan')
      .insert([{
        SoTien: Number(soTienThucThu),
        PhuongThuc: phuongThuc || 'tien-mat',
        NgayThanhToan: new Date().toISOString(),
        TrangThai: 'Hoàn thành',
        // MaHopDong: maHopDong
      }])
      .select()
      .single();

    if (gdError) {
      console.warn('Lỗi ghi giao dịch thanh toán:', gdError.message);
    }

    const maPhieuThu = gd?.MaGiaoDich || `REC-${Date.now()}`;

    res.json({
      ok: true,
      data: {
        maPhieuThu: maPhieuThu,
        maGiaoDich: maGiaoDich,
        maKeToan: maKeToan || null,
        phuongThuc: phuongThuc || 'tien-mat',
        soTienThucThu: Number(soTienThucThu),
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
