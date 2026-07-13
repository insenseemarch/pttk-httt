import express from 'express';
import { supabase } from '../config/supabase.js';
import { dinhDangNgay, dinhDangTien } from '../utils/dinhDang.js';

const router = express.Router();

const TRANG_THAI_CHO_LAP = 'Chờ xác nhận'; // đạt kiểm tra ĐK lưu trú, chờ lập & ký hợp đồng
const TRANG_THAI_SAU_KY = 'Chờ thanh toán'; // đã ký HĐ, chờ kế toán thu tiền kỳ đầu

const PHI_DICH_VU_MAC_DINH = [
  { id: 'elec', ten: 'Tiền điện', donVi: 'VNĐ/kWh', gia: 3500 },
  { id: 'water', ten: 'Tiền nước', donVi: 'VNĐ/Người', gia: 100000 },
  { id: 'wifi', ten: 'Internet / Wifi', donVi: 'VNĐ/Phòng', gia: 50000 },
  { id: 'parking', ten: 'Gửi xe', donVi: 'VNĐ/Xe', gia: 120000 },
];

function parseMaDatCoc(maHoSo) {
  if (maHoSo == null) return null;
  const raw = String(maHoSo).trim();
  if (raw.startsWith('PC-')) return Number(raw.replace('PC-', ''));
  if (/^\d+$/.test(raw)) return Number(raw);
  return null;
}

async function layDatCocDayDu(maDatCoc) {
  const { data, error } = await supabase
    .from('DatCoc')
    .select(`
      *,
      KhachHang ( CCCD, HoTen, SDT, Email, DiaChi ),
      Phong ( MaPhong, LoaiPhong, GiaThue, SucChuaToiDa, ChiNhanh ( TenCN ) ),
      ChiNhanh ( TenCN ),
      GiuongDatCoc (
        MaGiuong, SoGiuongCoc, NgayBatDau,
        Giuong ( MaGiuong, GiaThue, MaPhong, Phong ( MaPhong, LoaiPhong, GiaThue, ChiNhanh ( TenCN ) ) )
      )
    `)
    .eq('MaDatCoc', maDatCoc)
    .maybeSingle();

  if (error) throw error;
  return data;
}

function layThongTinPhong(dc) {
  const phong = dc.Phong || dc.GiuongDatCoc?.[0]?.Giuong?.Phong;
  return {
    maPhong: phong?.MaPhong || null,
    loaiPhong: phong?.LoaiPhong || '—',
    giaPhong: Number(phong?.GiaThue || 0),
    tenCN: phong?.ChiNhanh?.TenCN || dc.ChiNhanh?.TenCN || '—',
  };
}

function tinhGiaThueCoBan(dc) {
  const phong = layThongTinPhong(dc);
  if (dc.LoaiThue === 'Thuê nguyên phòng') {
    return phong.giaPhong;
  }
  const giuong = dc.GiuongDatCoc || [];
  const tongGiuong = giuong.reduce((sum, g) => sum + Number(g.Giuong?.GiaThue || 0), 0);
  if (tongGiuong > 0) return tongGiuong;
  return phong.giaPhong || 0;
}

// GET /api/hop-dong/cho-lap — danh sách hồ sơ đã đạt kiểm tra ĐK, chờ lập hợp đồng
router.get('/cho-lap', async (req, res) => {
  try {
    const { timKiem = '', maCN = '' } = req.query;

    let query = supabase
      .from('DatCoc')
      .select(`
        MaDatCoc, ThoiDiemTao, CapNhatLuc, SoTienCoc, TrangThai,
        LoaiThue, SoGiuongThue, MaCN, CCCD, MaNhom,
        KhachHang ( CCCD, HoTen, SDT ),
        Phong ( MaPhong, LoaiPhong, ChiNhanh ( TenCN ) ),
        ChiNhanh ( TenCN ),
        GiuongDatCoc ( MaGiuong, Giuong ( Phong ( MaPhong, LoaiPhong, ChiNhanh ( TenCN ) ) ) )
      `, { count: 'exact' })
      .eq('TrangThai', TRANG_THAI_CHO_LAP)
      .order('CapNhatLuc', { ascending: false, nullsFirst: false });

    if (maCN) query = query.eq('MaCN', Number(maCN));

    const { data, error, count } = await query;
    if (error) throw error;

    let ketQua = (data || []).map((dc) => {
      const phong = dc.Phong || dc.GiuongDatCoc?.[0]?.Giuong?.Phong;
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
        ngayChuyenLap: dinhDangNgay(dc.CapNhatLuc || dc.ThoiDiemTao),
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
    console.error('Lỗi khi lấy danh sách chờ lập hợp đồng:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// GET /api/hop-dong/pre-fill/:maHoSo — dữ liệu điền sẵn từ hồ sơ đặt cọc thật
router.get('/pre-fill/:maHoSo', async (req, res) => {
  try {
    const maDatCoc = parseMaDatCoc(req.params.maHoSo);
    if (!maDatCoc) {
      return res.status(400).json({ ok: false, error: 'Mã hồ sơ không hợp lệ (dùng PC-{maDatCoc})' });
    }

    const dc = await layDatCocDayDu(maDatCoc);
    if (!dc) {
      return res.status(404).json({ ok: false, error: 'Không tìm thấy hồ sơ đặt cọc' });
    }

    const phong = layThongTinPhong(dc);
    const soGiuong = dc.SoGiuongThue || 1;
    const ngayBatDau = dc.GiuongDatCoc?.[0]?.NgayBatDau
      || (dc.DatCocThanhCong ? dc.DatCocThanhCong.split('T')[0] : new Date().toISOString().split('T')[0]);

    const data = {
      maHoSo: `PC-${maDatCoc}`,
      maDatCoc,
      loaiThue: dc.LoaiThue || 'Thuê giường lẻ',
      khachHang: {
        maKH: dc.KhachHang?.CCCD || dc.CCCD,
        hoTen: dc.KhachHang?.HoTen || 'Khách hàng',
        cccd: String(dc.KhachHang?.CCCD || dc.CCCD || ''),
        sdt: dc.KhachHang?.SDT || '',
        email: dc.KhachHang?.Email || '',
      },
      thongTinThue: {
        phongGiuong: phong.maPhong ? `P.${phong.maPhong} — ${phong.loaiPhong}` : 'Chưa xác định',
        maPhong: phong.maPhong,
        chiNhanh: phong.tenCN,
        ngayBatDau,
        thoiHanThue: dc.ThoiHanThue || 6,
        soGiuong,
        giaThueCoBan: tinhGiaThueCoBan(dc),
        kyThanhToan: dc.HinhThucThanhToan || 'MONTHLY',
        soTienCoc: Number(dc.SoTienCoc || 0),
        ngayDatCoc: dinhDangNgay(dc.DatCocThanhCong || dc.ThoiDiemTao),
      },
      bieuPhiDichVu: PHI_DICH_VU_MAC_DINH,
    };

    res.json({ ok: true, data });
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu lập hợp đồng:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// POST /api/hop-dong/tao-moi — lập hợp đồng thật từ hồ sơ đặt cọc
router.post('/tao-moi', async (req, res) => {
  try {
    const {
      maHoSo, khachHang, thongTinThue, bieuPhiDichVu = [],
      dieuKhoanBoSung = '', khachDaKy = false, choKy = true, nguoiThucHien = null,
    } = req.body;

    const maDatCoc = parseMaDatCoc(maHoSo ?? req.body.maDatCoc);
    if (!maDatCoc) {
      return res.status(400).json({ ok: false, error: 'Thiếu mã hồ sơ đặt cọc' });
    }
    if (choKy && !khachDaKy) {
      return res.status(400).json({ ok: false, error: 'Khách hàng chưa ký xác nhận hợp đồng' });
    }

    const dc = await layDatCocDayDu(maDatCoc);
    if (!dc) {
      return res.status(404).json({ ok: false, error: 'Không tìm thấy hồ sơ đặt cọc' });
    }
    if (choKy && dc.TrangThai !== TRANG_THAI_CHO_LAP) {
      return res.status(400).json({ ok: false, error: `Hồ sơ không ở trạng thái "${TRANG_THAI_CHO_LAP}" (hiện: ${dc.TrangThai}).` });
    }

    const ngayBD = new Date(thongTinThue?.ngayBatDau || Date.now());
    const ngayKT = new Date(ngayBD);
    ngayKT.setMonth(ngayKT.getMonth() + Number(thongTinThue?.thoiHanThue || 6));

    const phiDichVu = (bieuPhiDichVu || []).reduce((sum, p) => sum + Number(p.gia || 0), 0);

    const { data: newHopDong, error: errHD } = await supabase
      .from('HopDong')
      .insert([{
        CCCD: dc.CCCD,
        MaNhom: dc.MaNhom || null,
        MaDatCoc: dc.MaDatCoc,
        NVQL: dc.NVQL || null,
        NVSale: dc.NVSale || null,
        NgayKy: new Date().toISOString().split('T')[0],
        NgayGioBD: ngayBD.toISOString(),
        NgayGioKT: ngayKT.toISOString(),
        KyThanhToan: thongTinThue?.kyThanhToan || 'MONTHLY',
        GiaThue: Number(thongTinThue?.giaThueCoBan || 0),
        DaXacNhanNoiQuy: true,
        PhiDichVu: phiDichVu,
        QuyDinh: dieuKhoanBoSung || null,
        TrangThai: choKy ? TRANG_THAI_SAU_KY : 'Nháp',
      }])
      .select()
      .single();

    if (errHD) throw errHD;

    // Ghi chi tiết giường thuê vào hợp đồng
    const giuongList = dc.GiuongDatCoc || [];
    if (giuongList.length && newHopDong?.MaHopDong) {
      const chiTiet = giuongList.map((g) => ({
        MaGiuong: g.MaGiuong,
        MaHopDong: newHopDong.MaHopDong,
        SoLuong: g.SoGiuongCoc || 1,
        GiaThucTe: Number(g.Giuong?.GiaThue || thongTinThue?.giaThueCoBan || 0),
      }));
      const { error: errCT } = await supabase.from('ChiTiet').insert(chiTiet);
      if (errCT) console.warn('Cảnh báo insert ChiTiet:', errCT.message);
    }

    if (choKy) {
      await supabase
        .from('DatCoc')
        .update({ TrangThai: TRANG_THAI_SAU_KY, CapNhatLuc: new Date().toISOString() })
        .eq('MaDatCoc', maDatCoc);

      await supabase.from('LichSuDatCoc').insert({
        MaDatCoc: maDatCoc,
        TrangThaiCu: dc.TrangThai,
        TrangThaiMoi: TRANG_THAI_SAU_KY,
        NguoiThucHien: nguoiThucHien,
        VaiTroThucHien: 'Sale',
        GhiChu: `Đã lập & khách ký hợp đồng (Mã HĐ: ${newHopDong.MaHopDong}) — chuyển kế toán thu tiền kỳ đầu.`,
      });

      await supabase.from('ThongBaoDatCoc').insert({
        MaDatCoc: maDatCoc,
        NguoiNhan: dc.NVKT || null,
        VaiTroNhan: 'Kế toán',
        NoiDung: `[PC-${maDatCoc}] ${dc.KhachHang?.HoTen || 'Khách hàng'} đã ký hợp đồng (Mã HĐ: ${newHopDong.MaHopDong}). Vui lòng tính & thu các khoản kỳ đầu.`,
        DaDoc: false,
      });
    }

    res.status(201).json({
      ok: true,
      data: {
        maHopDong: newHopDong.MaHopDong,
        maDatCoc,
        message: choKy
          ? 'Lập hợp đồng thành công. Đã gửi kế toán tính khoản thu kỳ đầu.'
          : 'Đã lưu bản nháp hợp đồng.',
        buocTiepTheo: '/lap-hop-dong',
      },
    });
  } catch (error) {
    console.error('Lỗi khi tạo hợp đồng:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;
