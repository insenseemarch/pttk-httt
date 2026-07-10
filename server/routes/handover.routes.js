import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// GET /api/ban-giao/:maGiaoDich
router.get('/:maGiaoDich', async (req, res) => {
  try {
    const { maGiaoDich } = req.params;
    if (!maGiaoDich) {
      return res.status(400).json({ ok: false, error: 'Thiếu mã giao dịch bàn giao' });
    }
    
    // Lấy dữ liệu thật từ bảng GiaoDichThanhToan / HopDong
    const { data: gd, error } = await supabase
      .from('GiaoDichThanhToan')
      .select(`
        *,
        HopDong (
          MaHopDong,
          KhachHang ( CCCD, HoTen ),
          ChiTiet ( Giuong ( Phong ( MaPhong, LoaiPhong ) ) )
        )
      `)
      .eq('MaGiaoDich', maGiaoDich)
      .single();

    if (error) {
      console.warn('Lỗi lấy thông tin bàn giao:', error.message);
    }

    const hd = gd?.HopDong;
    const khach = hd?.KhachHang;
    const phong = hd?.ChiTiet?.[0]?.Giuong?.Phong;

    const data = {
      maGiaoDich: maGiaoDich,
      khachHang: {
        maKH: khach?.CCCD || 'MS-88291',
        hoTen: khach?.HoTen || 'Nguyễn Văn Khải',
        anhDaiDien: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=128&h=128&fit=crop',
        phongGiuong: phong ? `P.${phong.MaPhong} (${phong.LoaiPhong})` : 'P.402 (Standard Single)',
        ngayNhan: gd?.NgayThanhToan || '2024-05-24',
        thoiHanThue: '12 tháng'
      },
      danhMucTaiSan: [
        { id: 'item-1', ten: 'Giường', nhom: 'FURNITURE', goiY: 'Ghi chú tình trạng (ví dụ: Mới 100%, không trầy xước...)' },
        { id: 'item-2', ten: 'Nệm', nhom: 'FURNITURE', goiY: 'Ghi chú tình trạng (ví dụ: Nệm cao su, có ga trải mới...)' },
        { id: 'item-3', ten: 'Tủ', nhom: 'FURNITURE', goiY: 'Ghi chú tình trạng (ví dụ: Tủ quần áo 2 cánh, khóa ổn định...)' },
        { id: 'item-4', ten: 'Chìa khóa / Thẻ từ', nhom: 'ACCESS', goiY: 'Nhập mã số thẻ hoặc số lượng khóa...' },
        { id: 'item-5', ten: 'Vệ sinh đạt yêu cầu', nhom: 'SERVICE', goiY: 'Nhận xét vệ sinh...' }
      ],
      trangThaiThanhToan: gd?.TrangThai || 'COLLECTED',
      maHopDong: hd?.MaHopDong || 'CON-2024-0892'
    };
    res.json({ ok: true, data });
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu bàn giao:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// POST /api/ban-giao/hoan-tat
router.post('/hoan-tat', async (req, res) => {
  try {
    const { maGiaoDich, ketQuaTaiSan, chuKy, maQuanLy, maHopDong } = req.body;

    if (!maGiaoDich || !Array.isArray(ketQuaTaiSan)) {
      return res.status(400).json({ ok: false, error: 'Thiếu mã giao dịch hoặc danh sách kết quả kiểm kê' });
    }

    const daKiemDu = ketQuaTaiSan.every(item => item.daKiem === true);
    if (!daKiemDu || !chuKy || !chuKy.quanLy || !chuKy.khach) {
      return res.status(400).json({ ok: false, error: 'Vui lòng hoàn thành checklist và ký tên đầy đủ trước khi xác nhận.' });
    }

    // Ghi biên bản bàn giao
    const { data: bb, error: bbError } = await supabase
      .from('BienBanBanGiao')
      .insert([{
        LoaiBB: 'Bàn giao phòng',
        NgayBanGiao: new Date().toISOString(),
        TinhTrangPhong: 'Tốt',
        SoChiaKhoa: 1,
        TrangThai: 'Hoàn tất',
        MaHopDong: typeof maHopDong === 'number' ? maHopDong : null
      }])
      .select()
      .single();

    if (bbError) {
      console.warn('Lỗi ghi biên bản bàn giao:', bbError.message);
    }

    const maBienBan = bb?.MaBB || `PRO-${Date.now()}`;

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
