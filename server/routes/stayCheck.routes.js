import express from 'express';
import { supabase } from '../config/supabase.js';
import { dinhDangNgay } from '../utils/dinhDang.js';

const router = express.Router();

function parseMaDatCoc(maHoSo) {
  if (!maHoSo) return null;
  const raw = String(maHoSo).trim();
  if (raw.startsWith('PC-')) return Number(raw.replace('PC-', ''));
  if (/^\d+$/.test(raw)) return Number(raw);
  return null;
}

async function layHoSoKiemTra(maDatCoc) {
  const { data: dc, error } = await supabase
    .from('DatCoc')
    .select(`
      *,
      KhachHang ( CCCD, HoTen, GioiTinh ),
      Phong ( MaPhong, LoaiPhong, GioiTinhYeuCau ),
      NhomThue (
        MaNhom, CCCD,
        ThanhVienNhom (
          CCCD, ThoaDieuKien, TrangThai,
          KhachHang ( CCCD, HoTen, GioiTinh )
        )
      )
    `)
    .eq('MaDatCoc', maDatCoc)
    .maybeSingle();

  if (error) throw error;
  return dc;
}

function mapThanhVienKiemTra(dc, idx, kh, extra = {}) {
  return {
    id: String(idx + 1).padStart(2, '0'),
    hoTen: kh?.HoTen || '',
    truongNhom: String(kh?.CCCD) === String(dc.NhomThue?.CCCD || dc.CCCD),
    cccd: String(kh?.CCCD || ''),
    gioiTinh: kh?.GioiTinh || '—',
    daDoiChieuCCCD: extra.trangThai === 'Đã đối chiếu CCCD',
    ...extra,
  };
}

// GET /api/kiem-tra-luu-tru/:maHoSo
router.get('/:maHoSo', async (req, res) => {
  try {
    const maDatCoc = parseMaDatCoc(req.params.maHoSo);
    if (!maDatCoc) {
      return res.status(400).json({ ok: false, error: 'Mã hồ sơ không hợp lệ (dùng PC-{maDatCoc})' });
    }

    const hoSo = await layHoSoKiemTra(maDatCoc);
    if (!hoSo) {
      return res.status(404).json({ ok: false, error: 'Không tìm thấy hồ sơ đặt cọc' });
    }

    let danhSachThanhVien = [];
    const nhom = hoSo.NhomThue;

    if (nhom?.ThanhVienNhom?.length) {
      danhSachThanhVien = nhom.ThanhVienNhom.map((tv, idx) =>
        mapThanhVienKiemTra(hoSo, idx, tv.KhachHang, { trangThai: tv.TrangThai }),
      );
    } else if (hoSo.KhachHang) {
      danhSachThanhVien = [
        mapThanhVienKiemTra(hoSo, 0, hoSo.KhachHang, {
          trangThai: String(hoSo.LyDoXuLy || '').includes('[CCCD_OK]') ? 'Đã đối chiếu CCCD' : 'Đã ghi nhận',
        }),
      ];
    }

    const data = {
      thongTinDatCoc: {
        maHoSo: `PC-${maDatCoc}`,
        maDatCoc,
        trangThai: hoSo.TrangThai || 'Chờ kiểm tra',
        ngayNhanPhong: dinhDangNgay(hoSo.DatCocThanhCong || hoSo.ThoiDiemTao),
        thoiHanThue: hoSo.ThoiHanThue || 6,
        phongDuKien: hoSo.Phong
          ? `P.${hoSo.Phong.MaPhong} - ${hoSo.Phong.LoaiPhong}`
          : 'Chưa xác định',
        soTienDaCoc: Number(hoSo.SoTienCoc || 0),
        donViTien: 'VNĐ',
        ghiChuSales: hoSo.LyDoXuLy || 'Không có ghi chú.',
        soGiuongThue: hoSo.SoGiuongThue || 1,
        gioiTinhYeuCau: hoSo.Phong?.GioiTinhYeuCau || null,
      },
      danhSachThanhVien,
    };

    res.json({ ok: true, data });
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu kiểm tra lưu trú:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// POST /api/kiem-tra-luu-tru/xac-nhan
router.post('/xac-nhan', async (req, res) => {
  try {
    const { maHoSo, ketQua } = req.body;
    const maDatCoc = parseMaDatCoc(maHoSo);
    if (!maDatCoc || !Array.isArray(ketQua)) {
      return res.status(400).json({ ok: false, error: 'Thiếu mã hồ sơ hoặc danh sách kết quả kiểm tra' });
    }

    const thanhVienKhongDat = ketQua.filter((tv) => !tv.dieuKien);

    if (thanhVienKhongDat.length > 0) {
      return res.json({
        ok: true,
        data: {
          trangThai: 'COMPLIANCE_EXCEPTION',
          message: 'Một số thành viên chưa đáp ứng điều kiện lưu trú.',
          thanhVienKhongDat: thanhVienKhongDat.map((tv) => tv.hoTen),
          soThanhVienConLai: ketQua.length - thanhVienKhongDat.length,
          luaChonXuLy: [
            { loai: 'CONTINUE_PARTIAL', nhan: 'Tiếp tục ký HĐ với các thành viên còn lại' },
            { loai: 'TERMINATE_REFUND', nhan: 'Dừng thủ tục thuê — Hoàn cọc 80%' },
          ],
        },
      });
    }

    res.json({
      ok: true,
      data: {
        trangThai: 'SUCCESS',
        message: 'Tất cả thành viên đã đạt điều kiện. Chuyển sang lập hợp đồng.',
        buocTiepTheo: '/hop-dong',
        maHopDong: `CON-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
        maDatCoc,
      },
    });
  } catch (error) {
    console.error('Lỗi khi xác nhận kiểm tra lưu trú:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;
