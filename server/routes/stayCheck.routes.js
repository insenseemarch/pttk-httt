import express from 'express';
import { supabase } from '../config/supabase.js';
import { dinhDangNgay, dinhDangTien } from '../utils/dinhDang.js';
import { getIO } from '../config/ketNoiSocket.js';

const router = express.Router();

const TRANG_THAI_CHO_KIEM_TRA = 'Chờ kiểm tra';

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
      Phong ( MaPhong, LoaiPhong, GioiTinhYeuCau, SucChuaToiDa ),
      NhomThue (
        MaNhom, CCCD, SoThanhVienDangKy, SoThanhVienDuDieuKien,
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

function laThueNhom(dc) {
  return Boolean(dc.MaNhom) || (dc.SoGiuongThue || 1) > 1 || dc.LoaiThue === 'Thuê nguyên phòng';
}

function tinhGioiHanNguoi(dc) {
  if (dc.LoaiThue === 'Thuê nguyên phòng') {
    return dc.Phong?.SucChuaToiDa || dc.SoGiuongThue || 1;
  }
  return dc.SoGiuongThue || 1;
}

async function ghiNhanKetQuaThanhVien(dc, ketQua) {
  if (!dc.MaNhom) return;
  for (const tv of ketQua) {
    if (!tv.cccd) continue;
    await supabase
      .from('ThanhVienNhom')
      .update({
        ThoaDieuKien: Boolean(tv.dieuKien),
        LyDoKhongDat: tv.dieuKien ? null : (tv.lyDo || 'Không đáp ứng điều kiện lưu trú'),
        TrangThai: tv.dieuKien ? 'Đạt điều kiện' : 'Không đạt điều kiện',
      })
      .eq('MaNhom', dc.MaNhom)
      .eq('CCCD', Number(tv.cccd));
  }
}

async function capNhatSoThanhVienDuDieuKien(dc, soDat) {
  if (!dc.MaNhom) return;
  await supabase
    .from('NhomThue')
    .update({ SoThanhVienDuDieuKien: soDat })
    .eq('MaNhom', dc.MaNhom);
}

async function chuyenTrangThaiDatCoc(dc, trangThaiMoi, nguoiThucHien, ghiChu) {
  await supabase
    .from('DatCoc')
    .update({ TrangThai: trangThaiMoi, CapNhatLuc: new Date().toISOString() })
    .eq('MaDatCoc', dc.MaDatCoc);

  await supabase.from('LichSuDatCoc').insert({
    MaDatCoc: dc.MaDatCoc,
    TrangThaiCu: dc.TrangThai,
    TrangThaiMoi: trangThaiMoi,
    NguoiThucHien: nguoiThucHien || null,
    VaiTroThucHien: 'Quản lý',
    GhiChu: ghiChu,
  });
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

// GET /api/kiem-tra-luu-tru — danh sách hồ sơ chờ Quản lý kiểm tra ĐK lưu trú
router.get('/', async (req, res) => {
  try {
    const { timKiem = '', maCN = '' } = req.query;

    let query = supabase
      .from('DatCoc')
      .select(`
        MaDatCoc, ThoiDiemTao, DatCocThanhCong, CapNhatLuc, SoTienCoc, TrangThai,
        LoaiThue, SoGiuongThue, MaCN, CCCD, MaNhom,
        KhachHang ( CCCD, HoTen, SDT ),
        Phong ( MaPhong, LoaiPhong, ChiNhanh ( TenCN ) ),
        ChiNhanh ( TenCN ),
        GiuongDatCoc ( MaGiuong, Giuong ( Phong ( MaPhong, LoaiPhong, ChiNhanh ( TenCN ) ) ) )
      `, { count: 'exact' })
      .eq('TrangThai', TRANG_THAI_CHO_KIEM_TRA)
      .order('CapNhatLuc', { ascending: false, nullsFirst: false });

    if (maCN) query = query.eq('MaCN', Number(maCN));

    const { data, error, count } = await query;
    if (error) throw error;

    let ketQua = (data || []).map((dc) => {
      const phongTrucTiep = dc.Phong;
      const phongTuGiuong = dc.GiuongDatCoc?.[0]?.Giuong?.Phong;
      const phong = phongTrucTiep || phongTuGiuong;
      const tenCN = phong?.ChiNhanh?.TenCN || dc.ChiNhanh?.TenCN || '—';
      return {
        maDatCoc: dc.MaDatCoc,
        maPhieu: `PC-${dc.MaDatCoc}`,
        hoTen: dc.KhachHang?.HoTen || '—',
        sdt: dc.KhachHang?.SDT || '—',
        cccd: dc.CCCD ? String(dc.CCCD) : '—',
        phong: phong ? `P.${phong.MaPhong} — ${phong.LoaiPhong}` : 'Chưa xác định',
        chiNhanh: tenCN,
        soGiuongThue: dc.SoGiuongThue || 1,
        loaiThue: dc.LoaiThue || 'Thuê giường lẻ',
        soTienCocFmt: dinhDangTien(dc.SoTienCoc),
        trangThai: dc.TrangThai,
        ngayChuyenKiemTra: dinhDangNgay(dc.CapNhatLuc || dc.DatCocThanhCong || dc.ThoiDiemTao),
        laThuNhom: Boolean(dc.MaNhom) || (dc.SoGiuongThue || 1) > 1 || dc.LoaiThue === 'Thuê nguyên phòng',
      };
    });

    if (timKiem.trim()) {
      const q = timKiem.trim().toLowerCase();
      ketQua = ketQua.filter((item) =>
        item.hoTen.toLowerCase().includes(q)
        || item.sdt.includes(q)
        || item.cccd.includes(q)
        || item.maPhieu.toLowerCase().includes(q)
        || item.phong.toLowerCase().includes(q),
      );
    }

    res.json({ ok: true, danhSach: ketQua, tong: count || ketQua.length });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách kiểm tra lưu trú:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

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

const TRANG_THAI_DAT_KIEM_TRA = 'Chờ xác nhận'; // đạt kiểm tra ĐK → chờ nhân viên lập & ký hợp đồng
const TRANG_THAI_DUNG_THUE = 'Chờ hoàn cọc';

async function thongBaoNhanVienLapHopDong(dc, soThanhVien) {
  const noiDung = [
    `[PC-${dc.MaDatCoc}]`,
    dc.KhachHang?.HoTen || 'Khách hàng',
    `đã đạt kiểm tra điều kiện lưu trú (${soThanhVien} người).`,
    'Vui lòng lập hợp đồng và hướng dẫn khách ký.',
  ].join(' ');

  const { error } = await supabase.from('ThongBao').insert({
    MaDatCoc: dc.MaDatCoc,
    NguoiNhan: null,
    VaiTroNhan: 'Phụ trách',
    NoiDung: noiDung,
    DaDoc: false,
  });
  if (error) throw error;

  const io = getIO();
  if (io) {
    io.to('role:PHU_TRACH').emit('thong_bao_moi', {
      phieuId: dc.MaDatCoc,
      noiDung,
      loaiSuKien: 'Chờ xác nhận',
    });
    console.log('[Socket] Broadcasted thong_bao_moi to room: role:PHU_TRACH');
  }
}

// POST /api/kiem-tra-luu-tru/xac-nhan
// Bước 1 (không có luaChon): đánh giá kết quả kiểm tra.
// Bước 2 (có luaChon): áp dụng quyết định của nhóm.
router.post('/xac-nhan', async (req, res) => {
  try {
    const { maHoSo, ketQua, luaChon = null, nguoiThucHien = null } = req.body;
    const maDatCoc = parseMaDatCoc(maHoSo);
    if (!maDatCoc || !Array.isArray(ketQua)) {
      return res.status(400).json({ ok: false, error: 'Thiếu mã hồ sơ hoặc danh sách kết quả kiểm tra' });
    }

    const dc = await layHoSoKiemTra(maDatCoc);
    if (!dc) {
      return res.status(404).json({ ok: false, error: 'Không tìm thấy hồ sơ đặt cọc' });
    }
    if (dc.TrangThai !== TRANG_THAI_CHO_KIEM_TRA) {
      return res.status(400).json({ ok: false, error: `Hồ sơ không ở trạng thái "${TRANG_THAI_CHO_KIEM_TRA}" (hiện: ${dc.TrangThai}).` });
    }

    const laNhom = laThueNhom(dc);
    const gioiHan = tinhGioiHanNguoi(dc);
    const dsKhongDat = ketQua.filter((tv) => !tv.dieuKien);
    const dsDat = ketQua.filter((tv) => tv.dieuKien);

    // ─── Bước 2: áp dụng quyết định ───
    if (luaChon === 'CONTINUE_PARTIAL') {
      if (!laNhom) {
        return res.status(400).json({ ok: false, error: 'Chỉ áp dụng cho hồ sơ thuê nhóm.' });
      }
      if (dsDat.length < 1) {
        return res.status(400).json({ ok: false, error: 'Không còn thành viên nào đủ điều kiện để tiếp tục.' });
      }
      if (dsDat.length > gioiHan) {
        return res.status(400).json({ ok: false, error: `Số người còn lại (${dsDat.length}) vẫn vượt số giường/phòng đã đặt (${gioiHan}).` });
      }

      await ghiNhanKetQuaThanhVien(dc, ketQua);
      await capNhatSoThanhVienDuDieuKien(dc, dsDat.length);
      await chuyenTrangThaiDatCoc(
        dc,
        TRANG_THAI_DAT_KIEM_TRA,
        nguoiThucHien,
        `Kiểm tra ĐK lưu trú: loại ${dsKhongDat.length} thành viên không đạt, tiếp tục ký HĐ với ${dsDat.length} thành viên còn lại.`,
      );
      await thongBaoNhanVienLapHopDong(dc, dsDat.length);

      return res.json({
        ok: true,
        data: {
          trangThai: 'CONTINUE_PARTIAL',
          message: `Đã ghi nhận. Tiếp tục lập hợp đồng với ${dsDat.length} thành viên đủ điều kiện.`,
          buocTiepTheo: '/lap-hop-dong',
          maDatCoc,
        },
      });
    }

    if (luaChon === 'TERMINATE_REFUND') {
      await ghiNhanKetQuaThanhVien(dc, ketQua);
      await capNhatSoThanhVienDuDieuKien(dc, dsDat.length);
      await chuyenTrangThaiDatCoc(
        dc,
        TRANG_THAI_DUNG_THUE,
        nguoiThucHien,
        laNhom
          ? `Kiểm tra ĐK lưu trú: nhóm dừng thủ tục thuê do ${dsKhongDat.length} thành viên không đạt — chuyển hoàn cọc 80%.`
          : 'Kiểm tra ĐK lưu trú: khách không đạt điều kiện — từ chối ký hợp đồng, chuyển hoàn cọc 80%.',
      );

      return res.json({
        ok: true,
        data: {
          trangThai: 'TERMINATED',
          message: 'Đã dừng thủ tục thuê. Hồ sơ chuyển sang hoàn cọc (80%).',
          buocTiepTheo: '/nhan-phong',
          maDatCoc,
        },
      });
    }

    // ─── Bước 1: đánh giá ───
    if (dsKhongDat.length === 0) {
      await ghiNhanKetQuaThanhVien(dc, ketQua);
      await capNhatSoThanhVienDuDieuKien(dc, dsDat.length);
      await chuyenTrangThaiDatCoc(
        dc,
        TRANG_THAI_DAT_KIEM_TRA,
        nguoiThucHien,
        'Kiểm tra ĐK lưu trú: tất cả thành viên đạt — chuyển lập hợp đồng.',
      );
      await thongBaoNhanVienLapHopDong(dc, dsDat.length);

      return res.json({
        ok: true,
        data: {
          trangThai: 'SUCCESS',
          message: 'Tất cả thành viên đã đạt điều kiện. Chuyển sang lập hợp đồng.',
          buocTiepTheo: '/lap-hop-dong',
          maDatCoc,
        },
      });
    }

    // Có thành viên không đạt
    if (!laNhom) {
      // Thuê cá nhân → từ chối ký hợp đồng
      return res.json({
        ok: true,
        data: {
          trangThai: 'INDIVIDUAL_REJECT',
          message: 'Khách thuê cá nhân không đáp ứng điều kiện lưu trú. Quản lý từ chối ký hợp đồng.',
          thanhVienKhongDat: dsKhongDat.map((tv) => tv.hoTen),
          luaChonXuLy: [
            { loai: 'TERMINATE_REFUND', nhan: 'Dừng thủ tục thuê — Hoàn cọc 80%' },
          ],
        },
      });
    }

    // Thuê nhóm → cho nhóm chọn hướng xử lý
    const choPhepTiepTuc = dsDat.length >= 1 && dsDat.length <= gioiHan;
    return res.json({
      ok: true,
      data: {
        trangThai: 'COMPLIANCE_EXCEPTION',
        message: 'Một số thành viên chưa đáp ứng điều kiện lưu trú.',
        thanhVienKhongDat: dsKhongDat.map((tv) => tv.hoTen),
        soThanhVienConLai: dsDat.length,
        soGiuongThue: gioiHan,
        choPhepTiepTuc,
        lyDoKhongChoTiepTuc: choPhepTiepTuc
          ? null
          : (dsDat.length < 1
            ? 'Không còn thành viên nào đủ điều kiện.'
            : `Số người còn lại (${dsDat.length}) vẫn vượt số giường/phòng đã đặt (${gioiHan}).`),
        luaChonXuLy: [
          ...(choPhepTiepTuc
            ? [{ loai: 'CONTINUE_PARTIAL', nhan: `Tiếp tục ký HĐ với ${dsDat.length} thành viên còn lại` }]
            : []),
          { loai: 'TERMINATE_REFUND', nhan: 'Dừng thủ tục thuê — Hoàn cọc 80%' },
        ],
      },
    });
  } catch (error) {
    console.error('Lỗi khi xác nhận kiểm tra lưu trú:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;
