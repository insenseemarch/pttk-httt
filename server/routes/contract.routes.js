import express from 'express';
import { supabase } from '../config/supabase.js';
import { getIO } from '../config/ketNoiSocket.js';
import { dinhDangNgay, dinhDangTien } from '../utils/dinhDang.js';
import {
  QUY_DINH_HOAN_COC,
  NOI_QUY_MAC_DINH,
  DIEU_KHOAN_VI_PHAM,
  nhanLoaiThue,
  dongGoiQuyDinhHopDong,
  chuanHoaKyThanhToan,
  KY_THANH_TOAN_MAC_DINH,
} from '../utils/hopDongQuyDinh.js';

const router = express.Router();

const TRANG_THAI_CHO_LAP = [
  'Chờ lập hợp đồng',
  'Chờ lập hợp đồng (điều chỉnh)',
  'Chờ xác nhận', // legacy — giữ tương thích hồ sơ cũ
];
const TRANG_THAI_SAU_KY = 'Chờ thanh toán'; // đã ký HĐ, chờ kế toán thu tiền kỳ đầu
const LOAI_THONG_BAO_THU_DAU_KY = 'Thu tiền kỳ đầu';

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
      NhomThue ( MaNhom, SoThanhVienDuDieuKien, SoThanhVienDangKy ),
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

function demGiuongTuGiuongDatCoc(giuongDatCoc = []) {
  if (!giuongDatCoc.length) return 0;
  return giuongDatCoc.reduce((sum, g) => sum + Number(g.SoGiuongCoc || 1), 0);
}

function tenLoaiPhong(lp) {
  if (!lp) return '—';
  if (typeof lp === 'object') return lp.TenLoaiPhong || '—';
  return String(lp);
}

function layThongTinPhong(dc) {
  const phong = dc.Phong || dc.GiuongDatCoc?.[0]?.Giuong?.Phong;
  return {
    maPhong: phong?.MaPhong || null,
    loaiPhong: tenLoaiPhong(phong?.LoaiPhong),
    giaPhong: Number(phong?.GiaThue || 0),
    sucChuaToiDa: Number(phong?.SucChuaToiDa || 0),
    tenCN: phong?.ChiNhanh?.TenCN || dc.ChiNhanh?.TenCN || '—',
  };
}

function tinhSoGiuongThueHopDong(dc, phong) {
  if (dc.LoaiThue === 'Thuê nguyên phòng') {
    return phong.sucChuaToiDa || Number(dc.SoGiuongThue || 0) || demGiuongTuGiuongDatCoc(dc.GiuongDatCoc) || 1;
  }
  // Thuê theo giường: ưu tiên giường còn giữ (GiuongDatCoc), đối chiếu số thành viên đạt ĐK sau điều chỉnh
  const tuGiuongDatCoc = demGiuongTuGiuongDatCoc(dc.GiuongDatCoc);
  const tuNhom = Number(dc.NhomThue?.SoThanhVienDuDieuKien || 0);
  const tuDatCoc = Number(dc.SoGiuongThue || 0);

  if (tuGiuongDatCoc > 0 && tuNhom > 0) {
    return Math.min(tuGiuongDatCoc, tuNhom);
  }
  if (tuGiuongDatCoc > 0) return tuGiuongDatCoc;
  if (tuNhom > 0) return tuNhom;
  return tuDatCoc || 1;
}

function tinhGiaThueCoBan(dc, phong, soGiuongThue = null) {
  if (dc.LoaiThue === 'Thuê nguyên phòng') {
    return phong.giaPhong;
  }
  const soGiuong = soGiuongThue ?? tinhSoGiuongThueHopDong(dc, phong);
  const giuong = dc.GiuongDatCoc || [];
  let conLai = soGiuong;
  let tongGiuong = 0;
  for (const g of giuong) {
    if (conLai <= 0) break;
    const sl = Number(g.SoGiuongCoc || 1);
    const dung = Math.min(sl, conLai);
    tongGiuong += Number(g.Giuong?.GiaThue || 0) * dung;
    conLai -= dung;
  }
  if (tongGiuong > 0) return tongGiuong;
  return phong.giaPhong || 0;
}

function chuanHoaBieuPhiDichVu(raw = []) {
  return (raw || []).map((p) => ({
    id: String(p.id || ''),
    ten: String(p.ten || ''),
    donVi: String(p.donVi || ''),
    gia: Number(p.gia || 0),
  }));
}

function hopLeChuKyKhach(chuKy) {
  if (!chuKy || typeof chuKy !== 'string') return false;
  return /^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/.test(chuKy.trim());
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
        Phong ( MaPhong, LoaiPhong, SucChuaToiDa, ChiNhanh ( TenCN ) ),
        ChiNhanh ( TenCN ),
        NhomThue ( SoThanhVienDuDieuKien ),
        GiuongDatCoc ( MaGiuong, SoGiuongCoc, Giuong ( Phong ( MaPhong, LoaiPhong, ChiNhanh ( TenCN ) ) ) )
      `, { count: 'exact' })
      .in('TrangThai', TRANG_THAI_CHO_LAP)
      .order('CapNhatLuc', { ascending: false, nullsFirst: false });

    if (maCN) query = query.eq('MaCN', Number(maCN));

    const { data, error, count } = await query;
    if (error) throw error;

    let ketQua = (data || []).map((dc) => {
      const phongRaw = layThongTinPhong(dc);
      const phong = dc.Phong || dc.GiuongDatCoc?.[0]?.Giuong?.Phong;
      const tenCN = phongRaw.tenCN;
      const soGiuongThue = tinhSoGiuongThueHopDong(dc, phongRaw);
      return {
        maDatCoc: dc.MaDatCoc,
        maPhieu: `PC-${dc.MaDatCoc}`,
        hoTen: dc.KhachHang?.HoTen || '—',
        sdt: dc.KhachHang?.SDT || '—',
        cccd: dc.CCCD ? String(dc.CCCD) : '—',
        phong: phongRaw.maPhong ? `P.${phongRaw.maPhong} — ${phongRaw.loaiPhong}` : 'Chưa xác định',
        chiNhanh: tenCN,
        soGiuongThue,
        loaiThue: dc.LoaiThue || 'Thuê giường lẻ',
        soTienCocFmt: dinhDangTien(dc.SoTienCoc),
        trangThai: dc.TrangThai,
        ngayChuyenLap: dinhDangNgay(dc.CapNhatLuc || dc.ThoiDiemTao),
        laThuNhom: Boolean(dc.MaNhom) || soGiuongThue > 1 || dc.LoaiThue === 'Thuê nguyên phòng',
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
    const loaiThue = dc.LoaiThue || 'Thuê giường lẻ';
    const soGiuong = tinhSoGiuongThueHopDong(dc, phong);
    const ngayBatDau = dc.GiuongDatCoc?.[0]?.NgayBatDau
      || (dc.DatCocThanhCong ? dc.DatCocThanhCong.split('T')[0] : new Date().toISOString().split('T')[0]);

    const data = {
      maHoSo: `PC-${maDatCoc}`,
      maDatCoc,
      loaiThue,
      loaiThueLabel: nhanLoaiThue(loaiThue),
      khachHang: {
        maKH: dc.KhachHang?.CCCD || dc.CCCD,
        hoTen: dc.KhachHang?.HoTen || 'Khách hàng',
        cccd: String(dc.KhachHang?.CCCD || dc.CCCD || ''),
        sdt: dc.KhachHang?.SDT || '',
        email: dc.KhachHang?.Email || '',
        diaChi: dc.KhachHang?.DiaChi || '',
      },
      thongTinThue: {
        phongGiuong: phong.maPhong ? `P.${phong.maPhong} — ${phong.loaiPhong}` : 'Chưa xác định',
        maPhong: phong.maPhong,
        chiNhanh: phong.tenCN,
        loaiThue,
        loaiThueLabel: nhanLoaiThue(loaiThue),
        ngayBatDau,
        thoiHanThue: dc.ThoiHanThue || 6,
        soGiuong,
        giaThueCoBan: tinhGiaThueCoBan(dc, phong, soGiuong),
        kyThanhToan: KY_THANH_TOAN_MAC_DINH,
        soTienCoc: Number(dc.SoTienCoc || 0),
        ngayDatCoc: dinhDangNgay(dc.DatCocThanhCong || dc.ThoiDiemTao),
        trangThaiDatCoc: dc.TrangThai || '',
      },
      bieuPhiDichVu: PHI_DICH_VU_MAC_DINH,
      quyDinhHoanCoc: QUY_DINH_HOAN_COC,
      noiQuy: NOI_QUY_MAC_DINH,
      dieuKhoanViPham: DIEU_KHOAN_VI_PHAM,
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
      chuKyKhach = null,
      khachDaKy = false, choKy = true, nguoiThucHien = null,
    } = req.body;

    const maDatCoc = parseMaDatCoc(maHoSo ?? req.body.maDatCoc);
    if (!maDatCoc) {
      return res.status(400).json({ ok: false, error: 'Thiếu mã hồ sơ đặt cọc' });
    }
    if (choKy && !khachDaKy) {
      return res.status(400).json({ ok: false, error: 'Khách hàng chưa ký xác nhận hợp đồng' });
    }
    if (choKy && !hopLeChuKyKhach(chuKyKhach)) {
      return res.status(400).json({ ok: false, error: 'Chữ ký khách hàng không hợp lệ. Vui lòng ký lại trên ô chữ ký.' });
    }

    const dc = await layDatCocDayDu(maDatCoc);
    if (!dc) {
      return res.status(404).json({ ok: false, error: 'Không tìm thấy hồ sơ đặt cọc' });
    }
    if (choKy && !TRANG_THAI_CHO_LAP.includes(dc.TrangThai)) {
      return res.status(400).json({ ok: false, error: `Hồ sơ không ở trạng thái chờ lập hợp đồng (hiện: ${dc.TrangThai}).` });
    }

    const ngayBD = new Date(thongTinThue?.ngayBatDau || Date.now());
    const ngayKT = new Date(ngayBD);
    ngayKT.setMonth(ngayKT.getMonth() + Number(thongTinThue?.thoiHanThue || 6));

    const bieuPhiSnapshot = chuanHoaBieuPhiDichVu(bieuPhiDichVu);
    const phiDichVu = bieuPhiSnapshot.reduce((sum, p) => sum + Number(p.gia || 0), 0);
    const phong = layThongTinPhong(dc);
    const loaiThue = dc.LoaiThue || 'Thuê giường lẻ';
    const soGiuongThue = tinhSoGiuongThueHopDong(dc, phong);
    const giaThueCoBan = tinhGiaThueCoBan(dc, phong, soGiuongThue);
    const quyDinhDayDu = [
      dongGoiQuyDinhHopDong(),
      '',
      '=== THÔNG TIN THUÊ GHI NHẬN TRÊN HỢP ĐỒNG ===',
      `- Loại thuê: ${nhanLoaiThue(loaiThue)}`,
      `- Phòng/giường: ${thongTinThue?.phongGiuong || (phong.maPhong ? `P.${phong.maPhong}` : '—')}`,
      `- Số giường thuê: ${soGiuongThue}`,
      `- CCCD người thuê: ${String(khachHang?.cccd || dc.CCCD || '')}`,
    ].join('\n');

    const { data: newHopDong, error: errHD } = await supabase
      .from('HopDong')
      .insert([{
        CCCD: String(khachHang?.cccd || dc.CCCD || ''),
        MaNhom: dc.MaNhom || null,
        MaDatCoc: dc.MaDatCoc,
        NVQL: dc.NVQL || null,
        NVSale: dc.NVSale || null,
        NgayKy: new Date().toISOString().split('T')[0],
        NgayGioBD: ngayBD.toISOString(),
        NgayGioKT: ngayKT.toISOString(),
        KyThanhToan: chuanHoaKyThanhToan(thongTinThue?.kyThanhToan),
        GiaThue: giaThueCoBan || Number(thongTinThue?.giaThueCoBan || 0),
        DaXacNhanNoiQuy: true,
        PhiDichVu: phiDichVu,
        QuyDinh: quyDinhDayDu,
        TrangThai: choKy ? TRANG_THAI_SAU_KY : 'Nháp',
        LoaiThue: loaiThue,
        SoGiuongThue: soGiuongThue,
        MaPhong: phong.maPhong || null,
        BieuPhiDichVu: bieuPhiSnapshot,
        ChuKyKhach: choKy ? chuKyKhach : null,
        NVPhuTrach: nguoiThucHien || null,
      }])
      .select()
      .single();

    if (errHD) throw errHD;

    // Ghi chi tiết giường thuê vào hợp đồng (chỉ giường còn giữ sau điều chỉnh)
    const giuongList = dc.GiuongDatCoc || [];
    if (giuongList.length && newHopDong?.MaHopDong) {
      let conLai = soGiuongThue;
      const chiTiet = [];
      for (const g of giuongList) {
        if (conLai <= 0) break;
        const sl = Number(g.SoGiuongCoc || 1);
        const dung = Math.min(sl, conLai);
        chiTiet.push({
          MaGiuong: g.MaGiuong,
          MaHopDong: newHopDong.MaHopDong,
          SoLuong: dung,
          GiaThucTe: Number(g.Giuong?.GiaThue || giaThueCoBan || 0),
        });
        conLai -= dung;
      }
      if (chiTiet.length) {
        const { error: errCT } = await supabase.from('ChiTiet').insert(chiTiet);
        if (errCT) console.warn('Cảnh báo insert ChiTiet:', errCT.message);
      }
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
        VaiTroThucHien: 'Phụ trách',
        GhiChu: `Đã lập & khách ký hợp đồng (Mã HĐ: ${newHopDong.MaHopDong}) — chuyển kế toán thu tiền kỳ đầu.`,
      });

      const noiDungKeToan = `[PC-${maDatCoc}] ${dc.KhachHang?.HoTen || 'Khách hàng'} đã ký hợp đồng (Mã HĐ: ${newHopDong.MaHopDong}). Vui lòng thu tiền kỳ đầu.`;

      await supabase.from('ThongBao').insert({
        MaDatCoc: maDatCoc,
        NguoiNhan: dc.NVKT || null,
        VaiTroNhan: 'Kế toán',
        NoiDung: noiDungKeToan,
        DaDoc: false,
        LoaiThongBao: LOAI_THONG_BAO_THU_DAU_KY,
      });

      const io = getIO();
      if (io) {
        io.to('role:KE_TOAN').emit('thong_bao_moi', {
          noiDung: noiDungKeToan,
          loaiSuKien: LOAI_THONG_BAO_THU_DAU_KY,
          phieuId: newHopDong.MaHopDong,
        });
      }
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
