import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

const TRANG_THAI_CHO_BAN_GIAO = 'Hiệu lực';
const TRANG_THAI_SAU_BAN_GIAO = 'Đang hiệu lực';

// GET /api/ban-giao/cho-ban-giao — Danh sách HĐ chờ bàn giao
router.get('/cho-ban-giao', async (req, res) => {
  try {
    const { timKiem = '', maCN = '' } = req.query;

    const { data: hopDongs, error } = await supabase
      .from('HopDong')
      .select(`
        MaHopDong, NgayGioBD, NgayGioKT, GiaThue, TrangThai,
        KhachHang ( CCCD, HoTen, SDT ),
        ChiTiet ( MaGiuong, Giuong ( MaGiuong, Phong ( MaPhong, LoaiPhong, MaCN, ChiNhanh ( MaCN, TenCN ) ) ) ),
        BienBanBanGiao ( MaBB, LoaiBB )
      `)
      .eq('TrangThai', TRANG_THAI_CHO_BAN_GIAO)
      .order('MaHopDong', { ascending: false });

    if (error) return res.status(500).json({ ok: false, error: error.message });

    const chuaBanGiao = (hopDongs || []).filter(hd => {
      return !(hd.BienBanBanGiao || []).some(bb => bb.LoaiBB === 'Bàn giao phòng');
    });

    const dinhDangTien = (so) => so ? new Intl.NumberFormat('vi-VN').format(so) + ' đ' : '—';
    const dinhDangNgay = (ngay) => ngay ? new Date(ngay).toLocaleDateString('vi-VN') : '—';

    const ketQua = chuaBanGiao
      .filter(hd => {
        if (!timKiem) return true;
        const kw = timKiem.toLowerCase();
        const khach = hd.KhachHang;
        return (
          khach?.HoTen?.toLowerCase().includes(kw) ||
          khach?.SDT?.includes(kw) ||
          khach?.CCCD?.includes(kw) ||
          String(hd.MaHopDong).includes(kw)
        );
      })
      .filter(hd => {
        if (!maCN) return true;
        return (hd.ChiTiet || []).some(ct => String(ct.Giuong?.Phong?.ChiNhanh?.MaCN) === String(maCN));
      })
      .map(hd => {
        const khach = hd.KhachHang;
        const chiTiet = hd.ChiTiet || [];
        const giuong = chiTiet[0]?.Giuong;
        const phong = giuong?.Phong;
        const chiNhanh = phong?.ChiNhanh;
        const phongGiuong = phong && giuong
          ? `P.${phong.MaPhong} (${phong.LoaiPhong}) / G.${giuong.MaGiuong}`
          : '—';

        return {
          maHopDong: hd.MaHopDong,
          maHopDongFmt: `HĐ-${String(hd.MaHopDong).padStart(4, '0')}`,
          hoTen: khach?.HoTen || '—',
          sdt: khach?.SDT || '—',
          phong: phongGiuong,
          chiNhanh: chiNhanh?.TenCN || '—',
          soGiuong: chiTiet.length,
          giaThue: dinhDangTien(hd.GiaThue),
          ngayBatDau: dinhDangNgay(hd.NgayGioBD),
          trangThai: hd.TrangThai,
        };
      });

    res.json({ ok: true, danhSach: ketQua, tong: ketQua.length });
  } catch (err) {
    console.error('Lỗi danh sách chờ bàn giao:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/ban-giao/hop-dong/:maHopDong — Pre-fill dữ liệu bàn giao
router.get('/hop-dong/:maHopDong', async (req, res) => {
  try {
    const maHopDong = parseInt(req.params.maHopDong);
    if (!Number.isFinite(maHopDong)) {
      return res.status(400).json({ ok: false, error: 'Mã hợp đồng không hợp lệ' });
    }

    const { data: hd, error } = await supabase
      .from('HopDong')
      .select(`
        MaHopDong, NgayGioBD, NgayGioKT, GiaThue, TrangThai,
        KhachHang ( CCCD, HoTen ),
        ChiTiet ( MaGiuong, Giuong ( MaGiuong, Phong ( MaPhong, LoaiPhong ) ) )
      `)
      .eq('MaHopDong', maHopDong)
      .single();

    if (error || !hd) {
      return res.status(404).json({ ok: false, error: 'Không tìm thấy hợp đồng' });
    }

    const khach = hd.KhachHang;
    const chiTiet = hd.ChiTiet || [];
    const giuong = chiTiet[0]?.Giuong;
    const phong = giuong?.Phong;
    const phongGiuong = phong && giuong
      ? `P.${phong.MaPhong} (${phong.LoaiPhong || ''}) / G.${giuong.MaGiuong}`
      : '—';

    const tinhThoiHan = (bd, kt) => {
      if (!bd || !kt) return '—';
      const ms = new Date(kt) - new Date(bd);
      const thang = Math.round(ms / (1000 * 60 * 60 * 24 * 30));
      return `${thang} tháng`;
    };

    const data = {
      maHopDong: hd.MaHopDong,
      khachHang: {
        maKH: khach?.CCCD || '—',
        hoTen: khach?.HoTen || '—',
        phongGiuong,
        ngayNhan: hd.NgayGioBD ? new Date(hd.NgayGioBD).toLocaleDateString('vi-VN') : '—',
        thoiHanThue: tinhThoiHan(hd.NgayGioBD, hd.NgayGioKT),
      },
      danhMucTaiSan: [
        { id: 'item-1', ten: 'Giường', nhom: 'FURNITURE', goiY: 'Ghi chú tình trạng (ví dụ: Mới 100%, không trầy xước...)' },
        { id: 'item-2', ten: 'Nệm', nhom: 'FURNITURE', goiY: 'Ghi chú tình trạng (ví dụ: Nệm cao su, có ga trải mới...)' },
        { id: 'item-3', ten: 'Tủ', nhom: 'FURNITURE', goiY: 'Ghi chú tình trạng (ví dụ: Tủ quần áo 2 cánh, khóa ổn định...)' },
        { id: 'item-4', ten: 'Chìa khóa / Thẻ từ', nhom: 'ACCESS', goiY: 'Nhập mã số thẻ hoặc số lượng khóa...' },
        { id: 'item-5', ten: 'Vệ sinh đạt yêu cầu', nhom: 'SERVICE', goiY: 'Nhận xét vệ sinh...' },
      ],
      trangThai: hd.TrangThai,
    };

    res.json({ ok: true, data });
  } catch (err) {
    console.error('Lỗi lấy dữ liệu bàn giao:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/ban-giao/hoan-tat — Hoàn tất bàn giao, ghi BienBanBanGiao, cập nhật HopDong
router.post('/hoan-tat', async (req, res) => {
  try {
    const { maHopDong, ketQuaTaiSan, chuKy, maQuanLy } = req.body;

    if (!maHopDong || !Array.isArray(ketQuaTaiSan)) {
      return res.status(400).json({ ok: false, error: 'Thiếu mã hợp đồng hoặc danh sách kết quả kiểm kê' });
    }

    const daKiemDu = ketQuaTaiSan.every(item => item.daKiem === true);
    if (!daKiemDu || !chuKy?.quanLy || !chuKy?.khach) {
      return res.status(400).json({ ok: false, error: 'Vui lòng hoàn thành checklist và ký tên đầy đủ trước khi xác nhận.' });
    }

    const maHopDongNum = Number.isFinite(maHopDong) ? maHopDong : parseInt(maHopDong);

    const { data: bb, error: bbError } = await supabase
      .from('BienBanBanGiao')
      .insert([{
        LoaiBB: 'Bàn giao phòng',
        NgayBanGiao: new Date().toISOString(),
        TinhTrangPhong: 'Tốt',
        SoChiaKhoa: 1,
        TrangThai: 'Hoàn tất',
        MaHopDong: Number.isFinite(maHopDongNum) ? maHopDongNum : null,
      }])
      .select()
      .single();

    if (bbError) {
      console.warn('Lỗi ghi biên bản bàn giao:', bbError.message);
    }

    if (Number.isFinite(maHopDongNum)) {
      const { error: hdError } = await supabase
        .from('HopDong')
        .update({ TrangThai: TRANG_THAI_SAU_BAN_GIAO })
        .eq('MaHopDong', maHopDongNum);

      if (hdError) {
        console.warn('Lỗi cập nhật trạng thái hợp đồng:', hdError.message);
      }
    }

    res.json({
      ok: true,
      data: {
        maBienBan: bb?.MaBB || `BB-${Date.now()}`,
        maQuanLy: maQuanLy || null,
        message: 'Bàn giao hoàn tất. Khách hàng chính thức bắt đầu cư trú.',
      },
    });
  } catch (error) {
    console.error('Lỗi khi hoàn tất bàn giao:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;
