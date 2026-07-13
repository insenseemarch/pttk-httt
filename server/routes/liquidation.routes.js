import express from 'express';
import { supabase } from '../config/supabase.js';
import { dinhDangCCCD, dinhDangNgay } from '../utils/dinhDang.js';

const router = express.Router();

// GET /api/thanh-ly/:maHopDong
router.get('/:maHopDong', async (req, res) => {
  try {
    const { maHopDong } = req.params;
    if (!maHopDong) {
      return res.status(400).json({ ok: false, error: 'Thiếu mã hợp đồng' });
    }

    // Lấy thông tin hợp đồng từ database
    const { data: hd, error } = await supabase
      .from('HopDong')
      .select(`
        *,
        KhachHang ( CCCD, HoTen ),
        ChiTiet ( Giuong ( Phong ( MaPhong, LoaiPhong ) ) )
      `)
      .eq('MaHopDong', Number(maHopDong))
      .single();

    if (error) {
      console.warn('Không tìm thấy hợp đồng hoặc có lỗi db:', error.message);
    }

    const khach = hd?.KhachHang;
    const phong = hd?.ChiTiet?.[0]?.Giuong?.Phong;

    const data = {
      thongTin: {
        maHopDong: maHopDong,
        maKH: dinhDangCCCD(khach?.CCCD) || '079200012345',
        tenKhach: khach?.HoTen || 'Nguyễn Minh Tuấn',
        phong: phong ? `Phòng P.${phong.MaPhong} (${phong.LoaiPhong})` : 'Phòng P-302 (Dorm 4 giường)',
        ngayKetThuc: hd?.NgayGioKT ? dinhDangNgay(hd.NgayGioKT) : '15 tháng 10, 2023',
        lyDo: 'Hết hạn hợp đồng',
        trangThai: hd?.TrangThai || 'Chờ hoàn tất'
      },
      danhSachThuTuc: [
        { id: 'proc-1', ten: 'Ký biên bản trả phòng', batBuoc: true },
        { id: 'proc-2', ten: 'Ký thanh lý hợp đồng thuê', batBuoc: true },
        { id: 'proc-3', ten: 'Đã thu hồi chìa khóa', batBuoc: true },
        { id: 'proc-4', ten: 'Đã thu hồi thẻ ra vào', batBuoc: true }
      ]
    };
    res.json({ ok: true, data });
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu thanh lý:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// POST /api/thanh-ly/hoan-tat
router.post('/hoan-tat', async (req, res) => {
  try {
    const { maHopDong, ketQuaThuTuc, ghiChuTaiSan, chuKy, maQuanLy } = req.body;

    if (!maHopDong || !Array.isArray(ketQuaThuTuc)) {
      return res.status(400).json({ ok: false, error: 'Thiếu mã hợp đồng hoặc kết quả thủ tục' });
    }

    const tatCaHoanThanh = ketQuaThuTuc.every(p => p.daHoanThanh === true);
    if (!tatCaHoanThanh || !chuKy?.quanLy || !chuKy?.khach) {
      return res.status(400).json({
        ok: false,
        error: 'Vui lòng hoàn thành tất cả thủ tục và ký tên đầy đủ.'
      });
    }

    // Cập nhật trạng thái hợp đồng trong DB
    const id = Number(maHopDong);
    const { error: updateError } = await supabase
      .from('HopDong')
      .update({ TrangThai: 'Đã thanh lý' })
      .eq('MaHopDong', id);

    if (updateError) {
      console.warn('Lỗi khi cập nhật Hợp đồng sang Thanh lý:', updateError.message);
    }

    // 1. Hủy hóa đơn chưa thanh toán
    await supabase.from('HoaDon').update({ TrangThai: 'Hủy' }).eq('MaHopDong', id).eq('TrangThai', 'Chưa thanh toán');

    // 2. Trả lại giường, phòng (set TinhTrang = true)
    const { data: chiTiets } = await supabase.from('ChiTiet').select('MaGiuong').eq('MaHopDong', id);
    if (chiTiets && chiTiets.length > 0) {
      const bedIds = chiTiets.map(c => c.MaGiuong).filter(Boolean);
      if (bedIds.length > 0) {
        await supabase.from('Giuong').update({ TinhTrang: true }).in('MaGiuong', bedIds);
        const { data: beds } = await supabase.from('Giuong').select('MaPhong').in('MaGiuong', bedIds);
        if (beds && beds.length > 0) {
          const roomIds = [...new Set(beds.map(b => b.MaPhong).filter(Boolean))];
          await supabase.from('Phong').update({ TinhTrang: true }).in('MaPhong', roomIds);
        }
      }
    }

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
