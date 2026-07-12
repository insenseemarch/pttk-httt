import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

export const TRANG_THAI_COC = Object.freeze({
  MOI: 'MOI',
  CHO_KIEM_TRA_PHONG: 'CHO_KIEM_TRA_PHONG',
  HET_CHO: 'HET_CHO',
  CON_TRONG_CHO_GUI_KE_TOAN: 'CON_TRONG_CHO_GUI_KE_TOAN',
  CHO_TINH_COC: 'CHO_TINH_COC',
  CHO_THANH_TOAN: 'CHO_THANH_TOAN',
  QUA_HAN_TU_DONG_HUY: 'QUA_HAN_TU_DONG_HUY',
  CHO_XAC_NHAN_THANH_TOAN: 'CHO_XAC_NHAN_THANH_TOAN',
  DA_XAC_NHAN: 'DA_XAC_NHAN',
  TU_CHOI_CHUNG_TU: 'TU_CHOI_CHUNG_TU',
});

const ACTIVE_LOCK_STATES = [
  TRANG_THAI_COC.CHO_KIEM_TRA_PHONG,
  TRANG_THAI_COC.CON_TRONG_CHO_GUI_KE_TOAN,
  TRANG_THAI_COC.CHO_TINH_COC,
  TRANG_THAI_COC.CHO_THANH_TOAN,
  TRANG_THAI_COC.CHO_XAC_NHAN_THANH_TOAN,
  TRANG_THAI_COC.TU_CHOI_CHUNG_TU,
];

function chuanHoaVaiTro(value) {
  const role = String(value || '').toLowerCase();
  if (role.includes('kế toán') || role.includes('ke toan') || role.includes('ketoan')) return 'KE_TOAN';
  if (role.includes('quản lý') || role.includes('quan ly') || role.includes('quanly')) return 'QUAN_LY';
  return 'SALE';
}

function nguoiDung(req) {
  return {
    maNV: Number(req.get('x-user-id')) || null,
    vaiTro: chuanHoaVaiTro(req.get('x-user-role')),
  };
}

function loi(res, status, message) {
  return res.status(status).json({ ok: false, error: message });
}

async function layPhieu(maDatCoc) {
  const { data, error } = await supabase
    .from('DatCoc')
    .select(`
      *,
      KhachHang (*),
      GiuongDatCoc (MaGiuong, SoGiuongCoc, Giuong (MaGiuong, MaPhong, GiaThue, TinhTrang, Phong (MaPhong, LoaiPhong, SucChua, GiaThue, MaCN)))
    `)
    .eq('MaDatCoc', Number(maDatCoc))
    .single();
  if (error) throw error;
  const { data: chiNhanh } = data.MaCN
    ? await supabase.from('ChiNhanh').select('MaCN, TenCN, DiaChi').eq('MaCN', data.MaCN).maybeSingle()
    : { data: null };
  return { ...data, ChiNhanh: chiNhanh || null };
}

async function ghiLichSu(phieu, trangThaiMoi, user, ghiChu = null) {
  const { error } = await supabase.from('LichSuDatCoc').insert({
    MaDatCoc: phieu.MaDatCoc,
    TrangThaiCu: phieu.TrangThai,
    TrangThaiMoi: trangThaiMoi,
    NguoiThucHien: user.maNV,
    VaiTroThucHien: user.vaiTro,
    GhiChu: ghiChu,
  });
  if (error) throw error;
}

async function guiThongBao(phieu, trangThaiMoi, noiDung) {
  let payload = null;
  if ([TRANG_THAI_COC.CHO_KIEM_TRA_PHONG, TRANG_THAI_COC.CHO_XAC_NHAN_THANH_TOAN].includes(trangThaiMoi)) {
    payload = { VaiTroNhan: 'QUAN_LY' };
  } else if (trangThaiMoi === TRANG_THAI_COC.CHO_TINH_COC) {
    payload = { VaiTroNhan: 'KE_TOAN' };
  } else if ([TRANG_THAI_COC.HET_CHO, TRANG_THAI_COC.CON_TRONG_CHO_GUI_KE_TOAN, TRANG_THAI_COC.CHO_THANH_TOAN, TRANG_THAI_COC.DA_XAC_NHAN, TRANG_THAI_COC.TU_CHOI_CHUNG_TU].includes(trangThaiMoi)) {
    payload = { NguoiNhan: phieu.NVSale };
  }
  if (!payload) return;
  const { error } = await supabase.from('ThongBaoDatCoc').insert({
    ...payload,
    MaDatCoc: phieu.MaDatCoc,
    NoiDung: noiDung,
  });
  if (error) throw error;
}

async function capNhatTrangThai(phieu, trangThaiMoi, user, ghiChu, fields = {}) {
  const { data, error } = await supabase
    .from('DatCoc')
    .update({ ...fields, TrangThai: trangThaiMoi, LyDoXuLy: ghiChu || null, CapNhatLuc: new Date().toISOString() })
    .eq('MaDatCoc', phieu.MaDatCoc)
    .eq('TrangThai', phieu.TrangThai)
    .select()
    .single();
  if (error) throw error;
  await ghiLichSu(phieu, trangThaiMoi, user, ghiChu);
  return data;
}

async function giaiPhongKhoa(maDatCoc) {
  const { error } = await supabase.from('KhoaGiuongDatCoc').delete().eq('MaDatCoc', maDatCoc);
  if (error) throw error;
}

async function khoaGiuong(maDatCoc, maGiuongs) {
  await giaiPhongKhoa(maDatCoc);
  if (!maGiuongs.length) throw new Error('Phải chọn ít nhất một giường');
  const { error } = await supabase.from('KhoaGiuongDatCoc').insert(
    maGiuongs.map((MaGiuong) => ({ MaGiuong, MaDatCoc })),
  );
  if (error?.code === '23505') throw new Error('Một hoặc nhiều giường vừa được phiếu khác giữ chỗ');
  if (error) throw error;
}

function kiemTraQuyen(user, expected) {
  if (user.vaiTro !== expected) throw new Error(`Chức năng này chỉ dành cho ${expected}`);
}

router.get('/phong-giuong-trong', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('Phong')
      .select('MaPhong, LoaiPhong, SucChua, GiaThue, MaCN, ChiNhanh(TenCN), Giuong(MaGiuong, GiaThue, GioiTinhYeuCau, TinhTrang)')
      .order('MaPhong');
    if (error) throw error;
    const { data: locks, error: lockError } = await supabase.from('KhoaGiuongDatCoc').select('MaGiuong, MaDatCoc');
    if (lockError) throw lockError;
    const locked = new Set((locks || []).map((item) => item.MaGiuong));
    res.json({
      ok: true,
      data: (data || []).map((phong) => ({
        ...phong,
        Giuong: (phong.Giuong || []).map((giuong) => ({ ...giuong, dangKhoa: locked.has(giuong.MaGiuong) })),
      })),
    });
  } catch (error) {
    loi(res, 500, error.message);
  }
});

router.get('/phieu', async (req, res) => {
  try {
    const user = nguoiDung(req);
    let query = supabase
      .from('DatCoc')
      .select('MaDatCoc, ThoiDiemTao, CapNhatLuc, SoTienCoc, HanThanhToan, TrangThai, CCCD, MaPhong, MaCN, NVSale, LoaiThue, SoGiuongThue, LyDoXuLy, KhachHang(HoTen, SDT)', { count: 'exact' })
      .order('CapNhatLuc', { ascending: false });
    if (user.vaiTro === 'SALE' && user.maNV) query = query.eq('NVSale', user.maNV);
    if (req.query.trangThai) query = query.eq('TrangThai', req.query.trangThai);
    const { data, error, count } = await query;
    if (error) throw error;
    const branchIds = [...new Set((data || []).map((item) => item.MaCN).filter(Boolean))];
    const branches = branchIds.length
      ? await supabase.from('ChiNhanh').select('MaCN, TenCN').in('MaCN', branchIds)
      : { data: [] };
    if (branches.error) throw branches.error;
    const branchMap = new Map((branches.data || []).map((item) => [item.MaCN, item]));
    res.json({ ok: true, data: (data || []).map((item) => ({ ...item, ChiNhanh: branchMap.get(item.MaCN) || null })), total: count || 0 });
  } catch (error) {
    loi(res, 500, error.message);
  }
});

router.get('/phieu/:id', async (req, res) => {
  try {
    const phieu = await layPhieu(req.params.id);
    const [chungTu, lichSu] = await Promise.all([
      supabase.from('ChungTuDatCoc').select('*').eq('MaDatCoc', phieu.MaDatCoc).order('TaiLenLuc', { ascending: false }),
      supabase.from('LichSuDatCoc').select('*').eq('MaDatCoc', phieu.MaDatCoc).order('ThoiDiem', { ascending: false }),
    ]);
    if (chungTu.error) throw chungTu.error;
    if (lichSu.error) throw lichSu.error;
    res.json({ ok: true, data: { ...phieu, chungTu: chungTu.data || [], lichSu: lichSu.data || [] } });
  } catch (error) {
    loi(res, 500, error.message);
  }
});

router.post('/phieu', async (req, res) => {
  try {
    const user = nguoiDung(req);
    kiemTraQuyen(user, 'SALE');
    const { cccd, loaiThue = 'GIUONG_LE', maPhong, maCN, maGiuongs = [] } = req.body;
    if (!cccd || !maPhong || !maGiuongs.length) return loi(res, 400, 'Thiếu khách hàng hoặc lựa chọn phòng/giường');
    const { data, error } = await supabase.from('DatCoc').insert({
      CCCD: Number(cccd),
      ThoiDiemTao: new Date().toISOString(),
      TrangThai: TRANG_THAI_COC.MOI,
      LoaiThue: loaiThue,
      MaPhong: Number(maPhong),
      MaCN: Number(maCN),
      NVSale: user.maNV,
      SoGiuongThue: maGiuongs.length,
      SoTienCoc: 0,
    }).select().single();
    if (error) throw error;
    const rows = maGiuongs.map((MaGiuong) => ({ MaGiuong: Number(MaGiuong), MaDatCoc: data.MaDatCoc, SoGiuongCoc: 1 }));
    const { error: bedError } = await supabase.from('GiuongDatCoc').insert(rows);
    if (bedError) throw bedError;
    await ghiLichSu({ ...data, TrangThai: null }, TRANG_THAI_COC.MOI, user, 'Sale tạo phiếu đặt cọc');
    res.status(201).json({ ok: true, data });
  } catch (error) {
    loi(res, 400, error.message);
  }
});

router.post('/phieu/:id/hanh-dong', async (req, res) => {
  try {
    const user = nguoiDung(req);
    const phieu = await layPhieu(req.params.id);
    const { hanhDong, ghiChu, maGiuongs = [], maPhong, maCN, loaiThue, khachHang, maGiaoDich, hinhAnhDataUrl, soTienCoc } = req.body;
    let next = null;
    let fields = {};
    let notification = '';

    if (hanhDong === 'GUI_KIEM_TRA') {
      kiemTraQuyen(user, 'SALE');
      if (![TRANG_THAI_COC.MOI, TRANG_THAI_COC.HET_CHO].includes(phieu.TrangThai)) throw new Error('Phiếu không ở trạng thái có thể gửi kiểm tra');
      const beds = maGiuongs.length ? maGiuongs.map(Number) : phieu.GiuongDatCoc.map((item) => item.MaGiuong);
      await khoaGiuong(phieu.MaDatCoc, beds);
      if (maGiuongs.length) {
        await supabase.from('GiuongDatCoc').delete().eq('MaDatCoc', phieu.MaDatCoc);
        const { error } = await supabase.from('GiuongDatCoc').insert(beds.map((MaGiuong) => ({ MaGiuong, MaDatCoc: phieu.MaDatCoc, SoGiuongCoc: 1 })));
        if (error) throw error;
        fields.SoGiuongThue = beds.length;
        if (maPhong) fields.MaPhong = Number(maPhong);
        if (maCN) fields.MaCN = Number(maCN);
        if (loaiThue) fields.LoaiThue = loaiThue;
      }
      if (khachHang) {
        const allowed = ['HoTen', 'GioiTinh', 'QuocTich', 'DiaChi', 'SDT', 'Email', 'KhaNangTaiChinh', 'ThoaDK'];
        const updates = Object.fromEntries(Object.entries(khachHang).filter(([key]) => allowed.includes(key)));
        updates.KhaNangTaiChinh = updates.KhaNangTaiChinh === '' || updates.KhaNangTaiChinh == null
          ? null
          : Number(updates.KhaNangTaiChinh);
        const { error } = await supabase.from('KhachHang').update(updates).eq('CCCD', phieu.CCCD);
        if (error) throw error;
      }
      next = TRANG_THAI_COC.CHO_KIEM_TRA_PHONG;
      notification = `Phiếu #${phieu.MaDatCoc} đang chờ kiểm tra phòng/giường.`;
    } else if (hanhDong === 'XAC_NHAN_CON_TRONG') {
      kiemTraQuyen(user, 'QUAN_LY');
      if (phieu.TrangThai !== TRANG_THAI_COC.CHO_KIEM_TRA_PHONG) throw new Error('Phiếu không chờ kiểm tra phòng');
      next = TRANG_THAI_COC.CON_TRONG_CHO_GUI_KE_TOAN;
      notification = `Phòng/giường của phiếu #${phieu.MaDatCoc} còn trống.`;
    } else if (hanhDong === 'BAO_HET_CHO') {
      kiemTraQuyen(user, 'QUAN_LY');
      if (phieu.TrangThai !== TRANG_THAI_COC.CHO_KIEM_TRA_PHONG) throw new Error('Phiếu không chờ kiểm tra phòng');
      if (!ghiChu?.trim()) throw new Error('Cần nhập lý do hết chỗ');
      await giaiPhongKhoa(phieu.MaDatCoc);
      next = TRANG_THAI_COC.HET_CHO;
      notification = `Phiếu #${phieu.MaDatCoc} hết chỗ: ${ghiChu}`;
    } else if (hanhDong === 'GUI_KE_TOAN') {
      kiemTraQuyen(user, 'SALE');
      if (phieu.TrangThai !== TRANG_THAI_COC.CON_TRONG_CHO_GUI_KE_TOAN) throw new Error('Phiếu chưa được Quản lý xác nhận còn trống');
      next = TRANG_THAI_COC.CHO_TINH_COC;
      notification = `Phiếu #${phieu.MaDatCoc} đang chờ tính tiền cọc.`;
    } else if (hanhDong === 'TINH_COC') {
      kiemTraQuyen(user, 'KE_TOAN');
      if (phieu.TrangThai !== TRANG_THAI_COC.CHO_TINH_COC) throw new Error('Phiếu không chờ tính cọc');
      const beds = phieu.GiuongDatCoc || [];
      const room = beds[0]?.Giuong?.Phong;
      const count = phieu.LoaiThue === 'NGUYEN_PHONG' ? Number(room?.SucChua || beds.length) : beds.length;
      const monthly = phieu.LoaiThue === 'NGUYEN_PHONG'
        ? Number(room?.GiaThue || beds[0]?.Giuong?.GiaThue || 0)
        : Number(beds[0]?.Giuong?.GiaThue || room?.GiaThue || 0);
      const suggested = monthly * 2 * count;
      const finalAmount = Number(soTienCoc ?? suggested);
      if (!Number.isFinite(finalAmount) || finalAmount <= 0) throw new Error('Số tiền cọc không hợp lệ');
      const start = new Date();
      fields = {
        SoTienCoc: finalAmount,
        SoGiuongThue: count,
        NVKT: user.maNV,
        BatDauThanhToan: start.toISOString(),
        HanThanhToan: new Date(start.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      };
      next = TRANG_THAI_COC.CHO_THANH_TOAN;
      notification = `Tiền cọc phiếu #${phieu.MaDatCoc} là ${finalAmount.toLocaleString('vi-VN')}đ. Hạn thanh toán 24 giờ.`;
    } else if (hanhDong === 'XAC_NHAN_THANH_TOAN') {
      kiemTraQuyen(user, 'SALE');
      if (![TRANG_THAI_COC.CHO_THANH_TOAN, TRANG_THAI_COC.TU_CHOI_CHUNG_TU].includes(phieu.TrangThai)) throw new Error('Phiếu không thể gửi chứng từ lúc này');
      if (!maGiaoDich?.trim() && !hinhAnhDataUrl?.trim()) throw new Error('Cần nhập mã giao dịch hoặc tải ảnh chứng từ');
      if (phieu.HanThanhToan && new Date(phieu.HanThanhToan) <= new Date()) throw new Error('Yêu cầu thanh toán đã quá hạn');
      const { error } = await supabase.from('ChungTuDatCoc').insert({
        MaDatCoc: phieu.MaDatCoc,
        MaGiaoDich: maGiaoDich?.trim() || null,
        HinhAnhDataUrl: hinhAnhDataUrl || null,
        NguoiTaiLen: user.maNV,
      });
      if (error) throw error;
      next = TRANG_THAI_COC.CHO_XAC_NHAN_THANH_TOAN;
      notification = `Phiếu #${phieu.MaDatCoc} có chứng từ thanh toán cần xác nhận.`;
    } else if (hanhDong === 'XAC_NHAN_CHUNG_TU') {
      kiemTraQuyen(user, 'QUAN_LY');
      if (phieu.TrangThai !== TRANG_THAI_COC.CHO_XAC_NHAN_THANH_TOAN) throw new Error('Phiếu không chờ xác nhận chứng từ');
      const bedIds = phieu.GiuongDatCoc.map((item) => item.MaGiuong);
      const { error } = await supabase.from('Giuong').update({ TinhTrang: false }).in('MaGiuong', bedIds);
      if (error) throw error;
      await giaiPhongKhoa(phieu.MaDatCoc);
      fields = { NVQL: user.maNV, DatCocThanhCong: new Date().toISOString() };
      next = TRANG_THAI_COC.DA_XAC_NHAN;
      notification = `Đặt cọc phiếu #${phieu.MaDatCoc} đã được xác nhận thành công.`;
    } else if (hanhDong === 'TU_CHOI_CHUNG_TU') {
      kiemTraQuyen(user, 'QUAN_LY');
      if (phieu.TrangThai !== TRANG_THAI_COC.CHO_XAC_NHAN_THANH_TOAN) throw new Error('Phiếu không chờ xác nhận chứng từ');
      if (!ghiChu?.trim()) throw new Error('Cần nhập lý do từ chối chứng từ');
      next = TRANG_THAI_COC.TU_CHOI_CHUNG_TU;
      notification = `Chứng từ phiếu #${phieu.MaDatCoc} bị từ chối: ${ghiChu}`;
    } else {
      return loi(res, 400, 'Hành động không hợp lệ');
    }

    const updated = await capNhatTrangThai(phieu, next, user, ghiChu, fields);
    await guiThongBao({ ...phieu, ...updated }, next, notification);
    res.json({ ok: true, data: updated });
  } catch (error) {
    loi(res, 400, error.message);
  }
});

router.get('/notifications', async (req, res) => {
  try {
    const user = nguoiDung(req);
    let query = supabase.from('ThongBaoDatCoc').select('*').order('TaoLuc', { ascending: false }).limit(50);
    query = user.vaiTro === 'SALE'
      ? query.eq('NguoiNhan', user.maNV)
      : query.eq('VaiTroNhan', user.vaiTro);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ ok: true, data: data || [], unread: (data || []).filter((item) => !item.DaDoc).length });
  } catch (error) {
    loi(res, 500, error.message);
  }
});

router.patch('/notifications/:id/read', async (req, res) => {
  try {
    const { error } = await supabase.from('ThongBaoDatCoc').update({ DaDoc: true }).eq('MaThongBao', Number(req.params.id));
    if (error) throw error;
    res.json({ ok: true });
  } catch (error) {
    loi(res, 500, error.message);
  }
});

export async function huyDatCocQuaHan() {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('DatCoc')
    .select('*')
    .eq('TrangThai', TRANG_THAI_COC.CHO_THANH_TOAN)
    .lt('HanThanhToan', now);
  if (error) throw error;
  for (const phieu of data || []) {
    await giaiPhongKhoa(phieu.MaDatCoc);
    await capNhatTrangThai(phieu, TRANG_THAI_COC.QUA_HAN_TU_DONG_HUY, { maNV: null, vaiTro: 'HE_THONG' }, 'Quá hạn thanh toán 24 giờ');
    await supabase.from('ThongBaoDatCoc').insert([
      { MaDatCoc: phieu.MaDatCoc, NguoiNhan: phieu.NVSale, NoiDung: `Phiếu #${phieu.MaDatCoc} đã tự động hủy do quá hạn thanh toán.` },
      { MaDatCoc: phieu.MaDatCoc, VaiTroNhan: 'QUAN_LY', NoiDung: `Phiếu #${phieu.MaDatCoc} quá hạn; phòng/giường đã được giải phóng.` },
    ]);
  }
  return (data || []).length;
}

export { ACTIVE_LOCK_STATES };
export default router;
