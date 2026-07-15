import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

const TRANG_THAI_CHO_BAN_GIAO = 'Hiệu lực';
const TRANG_THAI_SAU_BAN_GIAO = 'Đang hiệu lực';
const LOAI_BB_BAN_GIAO = 'Bàn giao phòng';

function hopLeChuKy(chuKy) {
  if (!chuKy || typeof chuKy !== 'string') return false;
  return /^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/.test(chuKy.trim());
}

function trichSoChiaKhoa(ketQuaTaiSan = []) {
  const khoa = ketQuaTaiSan.find((item) => item.id === 'item-4' || /chìa khóa|thẻ từ/i.test(item.ten || ''));
  if (!khoa?.ghiChu) return 1;
  const m = String(khoa.ghiChu).match(/\d+/);
  return m ? Math.max(1, Number(m[0])) : 1;
}

function tomTatTinhTrangPhong(ketQuaTaiSan = []) {
  const vs = ketQuaTaiSan.find((item) => /vệ sinh/i.test(item.ten || ''));
  if (vs?.ghiChu) return vs.ghiChu.slice(0, 200);
  const daKiem = ketQuaTaiSan.filter((item) => item.daKiem).length;
  return `Đã kiểm ${daKiem}/${ketQuaTaiSan.length} mục tài sản — bàn giao đạt yêu cầu.`;
}

const DANH_MUC_TAI_SAN_MAC_DINH = [
  { id: 'item-1', ten: 'Giường', nhom: 'FURNITURE', goiY: 'Ghi chú tình trạng (ví dụ: Mới 100%, không trầy xước...)' },
  { id: 'item-2', ten: 'Nệm', nhom: 'FURNITURE', goiY: 'Ghi chú tình trạng (ví dụ: Nệm cao su, có ga trải mới...)' },
  { id: 'item-3', ten: 'Tủ', nhom: 'FURNITURE', goiY: 'Ghi chú tình trạng (ví dụ: Tủ quần áo 2 cánh, khóa ổn định...)' },
  { id: 'item-4', ten: 'Chìa khóa / Thẻ từ', nhom: 'ACCESS', goiY: 'Nhập mã số thẻ hoặc số lượng khóa...' },
  { id: 'item-5', ten: 'Vệ sinh đạt yêu cầu', nhom: 'SERVICE', goiY: 'Nhận xét vệ sinh...' },
];

function dinhDangTien(so) {
  return so != null && so !== '' ? `${new Intl.NumberFormat('vi-VN').format(Number(so))} đ` : '—';
}

function dinhDangNgay(ngay) {
  if (!ngay) return '—';
  return new Date(ngay).toLocaleDateString('vi-VN');
}

function tinhThoiHanThang(bd, kt) {
  if (!bd || !kt) return '—';
  const ms = new Date(kt) - new Date(bd);
  const thang = Math.round(ms / (1000 * 60 * 60 * 24 * 30));
  return `${thang} tháng`;
}

function mapPhongGiuong(chiTiet = []) {
  const danhSachGiuong = chiTiet.map((ct) => {
    const g = ct.Giuong;
    const p = g?.Phong;
    return {
      maGiuong: g?.MaGiuong,
      maPhong: p?.MaPhong,
      loaiPhong: p?.LoaiPhong,
      soLuong: ct.SoLuong || 1,
      label: p && g ? `P.${p.MaPhong} (${p.LoaiPhong || ''}) / G.${g.MaGiuong}` : null,
    };
  }).filter((g) => g.label);

  const dau = danhSachGiuong[0];
  const phong = chiTiet[0]?.Giuong?.Phong;
  const chiNhanh = phong?.ChiNhanh;

  let phongGiuong = '—';
  if (danhSachGiuong.length === 1) {
    phongGiuong = danhSachGiuong[0].label;
  } else if (danhSachGiuong.length > 1) {
    phongGiuong = `${dau?.label || '—'} (+${danhSachGiuong.length - 1} giường)`;
  }

  return {
    phongGiuong,
    chiNhanh: chiNhanh?.TenCN || '—',
    maPhong: phong?.MaPhong || null,
    loaiPhong: phong?.LoaiPhong || '—',
    danhSachGiuong: danhSachGiuong.map((g) => g.label),
  };
}

async function layDuLieuHopDongBanGiao(maHopDongNum) {
  const { data: hd, error } = await supabase
    .from('HopDong')
    .select(`
      MaHopDong, MaDatCoc, NgayKy, NgayGioBD, NgayGioKT, GiaThue, TrangThai,
      LoaiThue, SoGiuongThue, KyThanhToan, NVQL,
      KhachHang ( CCCD, HoTen, SDT, Email, DiaChi, GioiTinh, NgaySinh ),
      ChiTiet ( SoLuong, MaGiuong, Giuong ( MaGiuong, Phong ( MaPhong, LoaiPhong, ChiNhanh ( MaCN, TenCN ) ) ) )
    `)
    .eq('MaHopDong', maHopDongNum)
    .single();

  if (error || !hd) return null;

  const khach = hd.KhachHang;
  const phongInfo = mapPhongGiuong(hd.ChiTiet || []);
  const soGiuong = hd.SoGiuongThue || (hd.ChiTiet || []).reduce((s, ct) => s + Number(ct.SoLuong || 1), 0);

  const { data: hoaDon } = await supabase
    .from('HoaDon')
    .select('MaHD, SoTien, NgayThanhToan')
    .eq('MaHopDong', maHopDongNum)
    .eq('LoaiHoaDon', 'Thu dau ky')
    .maybeSingle();

  let tenQuanLy = null;
  if (hd.NVQL) {
    const { data: nv } = await supabase.from('NhanVien').select('HoTen').eq('MaNV', hd.NVQL).maybeSingle();
    tenQuanLy = nv?.HoTen || null;
  }

  return {
    maHopDong: hd.MaHopDong,
    trangThai: hd.TrangThai,
    khachHang: {
      cccd: khach?.CCCD ? String(khach.CCCD) : '—',
      hoTen: khach?.HoTen || '—',
      sdt: khach?.SDT || '—',
      email: khach?.Email || '—',
      diaChi: khach?.DiaChi || '—',
      gioiTinh: khach?.GioiTinh || '—',
      ngaySinh: khach?.NgaySinh ? dinhDangNgay(khach.NgaySinh) : '—',
    },
    hopDong: {
      maHopDongFmt: `HĐ-${String(hd.MaHopDong).padStart(4, '0')}`,
      maPhieuCoc: hd.MaDatCoc ? `PC-${hd.MaDatCoc}` : '—',
      loaiThue: hd.LoaiThue || '—',
      soGiuong,
      giaThueFmt: dinhDangTien(hd.GiaThue),
      giaThue: Number(hd.GiaThue || 0),
      kyThanhToan: hd.KyThanhToan || '—',
      ngayKy: dinhDangNgay(hd.NgayKy),
      ngayBatDau: dinhDangNgay(hd.NgayGioBD),
      ngayKetThuc: dinhDangNgay(hd.NgayGioKT),
      thoiHanThue: tinhThoiHanThang(hd.NgayGioBD, hd.NgayGioKT),
      trangThai: hd.TrangThai,
    },
    phong: phongInfo,
    thuTienKyDau: hoaDon ? {
      maPhieuThu: `PT-${String(hoaDon.MaHD).padStart(5, '0')}`,
      soTienFmt: dinhDangTien(hoaDon.SoTien),
      ngayThanhToan: dinhDangNgay(hoaDon.NgayThanhToan),
    } : null,
    tenQuanLyNVQL: tenQuanLy,
    danhMucTaiSan: DANH_MUC_TAI_SAN_MAC_DINH,
  };
}

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

    const data = await layDuLieuHopDongBanGiao(maHopDong);
    if (!data) {
      return res.status(404).json({ ok: false, error: 'Không tìm thấy hợp đồng' });
    }

    res.json({ ok: true, data });
  } catch (err) {
    console.error('Lỗi lấy dữ liệu bàn giao:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/ban-giao/bien-ban/:maBB — Dữ liệu in lại biên bản
router.get('/bien-ban/:maBB', async (req, res) => {
  try {
    const maBB = Number(req.params.maBB);
    if (!Number.isFinite(maBB)) {
      return res.status(400).json({ ok: false, error: 'Mã biên bản không hợp lệ' });
    }

    const { data: bb, error } = await supabase
      .from('BienBanBanGiao')
      .select(`
        MaBB, LoaiBB, NgayBanGiao, ThoiDiemKy, ChiTiet,
        ChuKyQuanLy, ChuKyKhach, NVQuanLy,
        HopDong ( MaHopDong )
      `)
      .eq('MaBB', maBB)
      .eq('LoaiBB', LOAI_BB_BAN_GIAO)
      .maybeSingle();

    if (error || !bb) {
      return res.status(404).json({ ok: false, error: 'Không tìm thấy biên bản bàn giao' });
    }

    const hopDongData = await layDuLieuHopDongBanGiao(bb.HopDong?.MaHopDong);
    let tenQuanLy = hopDongData?.tenQuanLyNVQL || null;
    if (bb.NVQuanLy) {
      const { data: nv } = await supabase.from('NhanVien').select('HoTen').eq('MaNV', bb.NVQuanLy).maybeSingle();
      tenQuanLy = nv?.HoTen || tenQuanLy;
    }

    const ketQuaTaiSan = bb.ChiTiet?.ketQuaTaiSan
      || (Array.isArray(bb.ChiTiet) ? bb.ChiTiet : []);

    res.json({
      ok: true,
      data: {
        maBienBan: bb.MaBB,
        maHopDong: bb.HopDong?.MaHopDong,
        ngayBanGiao: bb.NgayBanGiao,
        thoiDiemKy: bb.ThoiDiemKy,
        khachHang: hopDongData?.khachHang,
        hopDong: hopDongData?.hopDong,
        phong: hopDongData?.phong,
        thuTienKyDau: hopDongData?.thuTienKyDau,
        ketQuaTaiSan,
        chuKyQuanLy: bb.ChuKyQuanLy || bb.ChiTiet?.chuKyQuanLy,
        chuKyKhach: bb.ChuKyKhach || bb.ChiTiet?.chuKyKhach,
        tenQuanLy,
      },
    });
  } catch (err) {
    console.error('Lỗi lấy biên bản in:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/ban-giao/hoan-tat — Hoàn tất bàn giao, ghi BienBanBanGiao, cập nhật HopDong
router.post('/hoan-tat', async (req, res) => {
  try {
    const { maHopDong, ketQuaTaiSan, chuKyQuanLy, chuKyKhach, maQuanLy } = req.body;

    if (!maHopDong || !Array.isArray(ketQuaTaiSan)) {
      return res.status(400).json({ ok: false, error: 'Thiếu mã hợp đồng hoặc danh sách kết quả kiểm kê' });
    }

    const maHopDongNum = Number(maHopDong);
    if (!Number.isFinite(maHopDongNum)) {
      return res.status(400).json({ ok: false, error: 'Mã hợp đồng không hợp lệ' });
    }

    const daKiemDu = ketQuaTaiSan.length > 0 && ketQuaTaiSan.every((item) => item.daKiem === true);
    if (!daKiemDu) {
      return res.status(400).json({ ok: false, error: 'Vui lòng hoàn thành checklist kiểm kê tài sản.' });
    }
    if (!hopLeChuKy(chuKyQuanLy) || !hopLeChuKy(chuKyKhach)) {
      return res.status(400).json({ ok: false, error: 'Chữ ký quản lý hoặc khách hàng không hợp lệ. Vui lòng ký lại.' });
    }

    const { data: hd, error: errHD } = await supabase
      .from('HopDong')
      .select(`
        MaHopDong,
        TrangThai,
        BienBanBanGiao ( MaBB, LoaiBB )
      `)
      .eq('MaHopDong', maHopDongNum)
      .single();

    if (errHD || !hd) {
      return res.status(404).json({ ok: false, error: 'Không tìm thấy hợp đồng' });
    }

    if (hd.TrangThai !== TRANG_THAI_CHO_BAN_GIAO) {
      return res.status(409).json({
        ok: false,
        error: `Hợp đồng không ở trạng thái "${TRANG_THAI_CHO_BAN_GIAO}" (hiện tại: ${hd.TrangThai || '—'})`,
      });
    }

    const daBanGiao = (hd.BienBanBanGiao || []).some((bb) => bb.LoaiBB === LOAI_BB_BAN_GIAO);
    if (daBanGiao) {
      return res.status(409).json({ ok: false, error: 'Hợp đồng này đã có biên bản bàn giao phòng.' });
    }

    const thoiDiemKy = new Date().toISOString();
    const nvQuanLy = maQuanLy ? Number(maQuanLy) : null;

    const { data: bb, error: bbError } = await supabase
      .from('BienBanBanGiao')
      .insert([{
        LoaiBB: LOAI_BB_BAN_GIAO,
        NgayBanGiao: thoiDiemKy.split('T')[0],
        TinhTrangPhong: tomTatTinhTrangPhong(ketQuaTaiSan),
        SoChiaKhoa: trichSoChiaKhoa(ketQuaTaiSan),
        TrangThai: 'Hoàn tất',
        MaHopDong: maHopDongNum,
        ChiTiet: { ketQuaTaiSan },
        ChuKyQuanLy: chuKyQuanLy,
        ChuKyKhach: chuKyKhach,
        NVQuanLy: nvQuanLy,
        ThoiDiemKy: thoiDiemKy,
      }])
      .select()
      .single();

    if (bbError || !bb) {
      console.error('Lỗi ghi biên bản bàn giao:', bbError?.message);
      return res.status(500).json({
        ok: false,
        error: bbError?.message || 'Không ghi được biên bản bàn giao',
      });
    }

    const { data: hdUpdated, error: hdError } = await supabase
      .from('HopDong')
      .update({ TrangThai: TRANG_THAI_SAU_BAN_GIAO })
      .eq('MaHopDong', maHopDongNum)
      .eq('TrangThai', TRANG_THAI_CHO_BAN_GIAO)
      .select('MaHopDong')
      .maybeSingle();

    if (hdError || !hdUpdated) {
      await supabase.from('BienBanBanGiao').delete().eq('MaBB', bb.MaBB);
      return res.status(409).json({
        ok: false,
        error: 'Không cập nhật được trạng thái hợp đồng. Đã huỷ biên bản vừa tạo.',
      });
    }

    let tenQuanLy = null;
    if (nvQuanLy) {
      const { data: nv } = await supabase.from('NhanVien').select('HoTen').eq('MaNV', nvQuanLy).maybeSingle();
      tenQuanLy = nv?.HoTen || null;
    }

    const hopDongIn = await layDuLieuHopDongBanGiao(maHopDongNum);

    res.json({
      ok: true,
      data: {
        maBienBan: bb.MaBB,
        maHopDong: maHopDongNum,
        ngayBanGiao: bb.NgayBanGiao,
        thoiDiemKy,
        maQuanLy: nvQuanLy,
        tenQuanLy,
        message: 'Bàn giao hoàn tất. Khách hàng chính thức bắt đầu cư trú.',
        inBienBan: {
          maBienBan: bb.MaBB,
          maHopDong: maHopDongNum,
          ngayBanGiao: bb.NgayBanGiao,
          thoiDiemKy,
          khachHang: hopDongIn?.khachHang,
          hopDong: hopDongIn?.hopDong,
          phong: hopDongIn?.phong,
          thuTienKyDau: hopDongIn?.thuTienKyDau,
          ketQuaTaiSan,
          chuKyQuanLy,
          chuKyKhach,
          tenQuanLy,
        },
      },
    });
  } catch (error) {
    console.error('Lỗi khi hoàn tất bàn giao:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;
