import express from 'express';
import { supabase } from '../config/supabase.js';
import { getIO } from '../config/ketNoiSocket.js';
import { dinhDangCCCD } from '../utils/dinhDang.js';

const router = express.Router();

export const TRANG_THAI_COC = Object.freeze({
  MOI: 'Mới tạo',
  CHO_KIEM_TRA_PHONG: 'Chờ duyệt phòng',
  HET_CHO: 'Hết chỗ',
  CON_TRONG_CHO_GUI_KE_TOAN: 'Còn trống',
  CHO_TINH_COC: 'Chờ tính tiền cọc',
  CHO_THANH_TOAN: 'Chờ khách chuyển khoản',
  QUA_HAN_TU_DONG_HUY: 'Đã quá hạn thanh toán',
  CHO_XAC_NHAN_THANH_TOAN: 'Chờ duyệt cọc',
  DA_XAC_NHAN: 'Đặt cọc thành công',
  TU_CHOI_CHUNG_TU: 'Chứng từ bị từ chối',
});

const CUSTOMER_EDITABLE_STATES = [
  TRANG_THAI_COC.MOI,
  TRANG_THAI_COC.HET_CHO,
  TRANG_THAI_COC.CON_TRONG_CHO_GUI_KE_TOAN,
  TRANG_THAI_COC.CHO_THANH_TOAN,
  TRANG_THAI_COC.TU_CHOI_CHUNG_TU,
];

const ACTIVE_LOCK_STATES = [
  TRANG_THAI_COC.MOI,
  TRANG_THAI_COC.CHO_KIEM_TRA_PHONG,
  TRANG_THAI_COC.CON_TRONG_CHO_GUI_KE_TOAN,
  TRANG_THAI_COC.CHO_TINH_COC,
  TRANG_THAI_COC.CHO_THANH_TOAN,
  TRANG_THAI_COC.CHO_XAC_NHAN_THANH_TOAN,
  TRANG_THAI_COC.TU_CHOI_CHUNG_TU,
  TRANG_THAI_COC.DA_XAC_NHAN,
];

const BANG_THONG_BAO = 'ThongBao';

function chuanHoaVaiTro(value) {
  const role = String(value || '').toLowerCase();
  if (role === 'ke_toan' || role.includes('kế toán') || role.includes('ke toan') || role.includes('ketoan')) return 'KE_TOAN';
  if (role === 'quan_ly' || role.includes('quản lý') || role.includes('quan ly') || role.includes('quanly')) return 'QUAN_LY';
  if (role === 'phu_trach' || role.includes('phụ trách') || role.includes('phu trach') || role.includes('phutrach')) return 'PHU_TRACH';
  return 'SALE';
}

function nguoiDung(req) {
  return {
    maNV: Number(req.get('x-user-id')) || null,
    vaiTro: chuanHoaVaiTro(req.get('x-user-role')),
  };
}

function vaiTroDatabase(role) {
  if (role === 'QUAN_LY') return 'Quản lý';
  if (role === 'KE_TOAN') return 'Kế toán';
  if (role === 'PHU_TRACH') return 'Phụ trách';
  if (role === 'HE_THONG') return 'Hệ thống';
  return 'Nhân viên Sale';
}

async function layTenNhanVien(maNV) {
  if (!maNV) return 'Nhân viên Sale';
  const { data, error } = await supabase.from('NhanVien').select('HoTen').eq('MaNV', maNV).maybeSingle();
  if (error) throw error;
  return data?.HoTen || `Nhân viên #${maNV}`;
}

function taoMaPhieuThu(maDatCoc) {
  const now = new Date();
  return `PT-${now.getFullYear()}-${maDatCoc}-${String(now.getTime()).slice(-6)}`;
}

function loi(res, status, message) {
  return res.status(status).json({ ok: false, error: message });
}

function chuanHoaThongTinTuyChon(value) {
  const normalized = String(value ?? '').trim();
  return normalized || null;
}

function thongBaoLoiDuLieu(error) {
  const raw = `${error?.message || ''} ${error?.details || ''} ${error?.constraint || ''}`;
  if (error?.code === '23505' || raw.includes('duplicate key value')) {
    if (raw.includes('KhachHang_SDT_key')) {
      return 'Số điện thoại này đã được sử dụng cho một khách hàng khác. Vui lòng kiểm tra lại số điện thoại.';
    }
    if (raw.includes('KhachHang_Email_key')) {
      return 'Email này đã được sử dụng cho một khách hàng khác. Vui lòng kiểm tra lại email.';
    }
    if (raw.includes('KhachHang_pkey')) {
      return 'Số căn cước công dân đã tồn tại trên hệ thống.';
    }
    return 'Thông tin vừa nhập đã tồn tại trên hệ thống. Vui lòng kiểm tra lại.';
  }
  return error?.message || 'Không thể xử lý yêu cầu. Vui lòng thử lại.';
}

function camTruyCap(message) {
  const error = new Error(message);
  error.status = 403;
  throw error;
}

async function layPhieu(maDatCoc) {
  const { data, error } = await supabase
    .from('DatCoc')
    .select(`
      *,
      KhachHang (*),
      GiuongDatCoc (MaGiuong, SoGiuongCoc, Giuong (MaGiuong, MaPhong, GiaThue, TinhTrang, Phong (MaPhong, LoaiPhong, SucChuaConLai, SucChuaToiDa, GiaThue, MaCN)))
    `)
    .eq('MaDatCoc', Number(maDatCoc))
    .single();
  if (error) throw error;
  const { data: chiNhanh } = data.MaCN
    ? await supabase.from('ChiNhanh').select('MaCN, TenCN, DiaChi').eq('MaCN', data.MaCN).maybeSingle()
    : { data: null };
  const { data: nhanVienSale } = data.NVSale
    ? await supabase.from('NhanVien').select('HoTen').eq('MaNV', data.NVSale).maybeSingle()
    : { data: null };
  return {
    ...data,
    CCCD: dinhDangCCCD(data.CCCD),
    KhachHang: data.KhachHang
      ? { ...data.KhachHang, CCCD: dinhDangCCCD(data.KhachHang.CCCD ?? data.CCCD) }
      : data.KhachHang,
    ChiNhanh: chiNhanh || null,
    NhanVienSale: nhanVienSale || null,
  };
}

async function ghiLichSu(phieu, trangThaiMoi, user, ghiChu = null) {
  const { error } = await supabase.from('LichSuDatCoc').insert({
    MaDatCoc: phieu.MaDatCoc,
    TrangThaiCu: phieu.TrangThai,
    TrangThaiMoi: trangThaiMoi,
    NguoiThucHien: user.maNV,
    VaiTroThucHien: vaiTroDatabase(user.vaiTro),
    GhiChu: ghiChu,
  });
  if (error) throw error;
}

async function guiThongBao(phieu, trangThaiMoi, noiDung) {
  let payload = null;
  if ([TRANG_THAI_COC.CHO_KIEM_TRA_PHONG, TRANG_THAI_COC.CHO_XAC_NHAN_THANH_TOAN].includes(trangThaiMoi)) {
    payload = { VaiTroNhan: 'Quản lý' };
  } else if (trangThaiMoi === TRANG_THAI_COC.CHO_TINH_COC) {
    payload = { VaiTroNhan: 'Kế toán' };
  } else if ([TRANG_THAI_COC.HET_CHO, TRANG_THAI_COC.CON_TRONG_CHO_GUI_KE_TOAN, TRANG_THAI_COC.CHO_THANH_TOAN, TRANG_THAI_COC.DA_XAC_NHAN, TRANG_THAI_COC.TU_CHOI_CHUNG_TU, TRANG_THAI_COC.QUA_HAN_TU_DONG_HUY].includes(trangThaiMoi)) {
    payload = { NguoiNhan: phieu.NVSale };
  }
  if (!payload) return;
  const { error } = await supabase.from(BANG_THONG_BAO).insert({
    ...payload,
    MaDatCoc: phieu.MaDatCoc,
    NoiDung: noiDung,
    LoaiThongBao: 'dat_coc',
  });
  if (error) throw error;

  const io = getIO();
  if (io) {
    const socketRole = payload.VaiTroNhan === 'Quản lý' ? 'QUAN_LY' : payload.VaiTroNhan === 'Kế toán' ? 'KE_TOAN' : payload.VaiTroNhan;
    const room = payload.VaiTroNhan ? `role:${socketRole}` : `sale:${payload.NguoiNhan}`;
    io.to(room).emit('thong_bao_moi', {
      phieuId: phieu.MaDatCoc,
      noiDung: noiDung,
      loaiSuKien: trangThaiMoi
    });
    console.log(`[Socket] Broadcasted thong_bao_moi to room: ${room}`);
  }
}

async function danhDauYeuCauThueDaTaoDatCoc(cccd, maNV) {
  const targetCCCD = Number(cccd);
  if (!Number.isFinite(targetCCCD)) return null;

  const { data: yeuCauGanNhat, error: searchError } = await supabase
    .from('YeuCauThue')
    .select('MaYC, MaNV')
    .eq('CCCD', targetCCCD)
    .order('NgayTao', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (searchError) throw searchError;
  if (!yeuCauGanNhat) return null;

  const updates = { TrangThai: true };
  if (maNV && !yeuCauGanNhat.MaNV) updates.MaNV = Number(maNV);

  const { error: updateError } = await supabase
    .from('YeuCauThue')
    .update(updates)
    .eq('MaYC', yeuCauGanNhat.MaYC);
  if (updateError) throw updateError;
  return yeuCauGanNhat.MaYC;
}

function ganCoPhongChotVaoGhiChu(ghiChu) {
  const noiDung = String(ghiChu || '').trim();
  return noiDung.startsWith('[PHONG_CHOT]') ? noiDung : `[PHONG_CHOT]${noiDung ? ` ${noiDung}` : ''}`;
}

async function khoaLichHenSauKhiDatCoc(maYC, maPhong) {
  const maYCSo = Number(maYC);
  const maPhongSo = Number(maPhong);
  if (!maYCSo || !maPhongSo) return;

  const { data: lichGanNhat, error: errLich } = await supabase
    .from('LichXemPhong')
    .select('MaLich, GhiChu')
    .eq('MaYC', maYCSo)
    .order('NgayGioHen', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (errLich) throw errLich;
  if (!lichGanNhat) return;

  const { error: errCapNhat } = await supabase
    .from('LichXemPhong')
    .update({
      MaPhong: maPhongSo,
      KetQua: 'Đã xem',
      GhiChu: ganCoPhongChotVaoGhiChu(lichGanNhat.GhiChu),
    })
    .eq('MaLich', lichGanNhat.MaLich);
  if (errCapNhat) throw errCapNhat;
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
    maGiuongs.map((MaGiuong) => ({ MaGiuong, MaDatCoc: maDatCoc })),
  );
  if (error?.code === '23505') throw new Error('Một hoặc nhiều giường vừa được phiếu khác giữ chỗ');
  if (error) throw error;
}

async function kiemTraLuaChonGiuong({ maDatCoc = null, maPhong, maGiuongs, loaiThue, gioiTinh }) {
  const bedIds = [...new Set((maGiuongs || []).map(Number).filter(Number.isFinite))];
  if (!maPhong || !bedIds.length) throw new Error('Phải chọn phòng và ít nhất một giường');

  const { data: phong, error: roomError } = await supabase
    .from('Phong')
    .select('MaPhong, MaCN, SucChuaToiDa, GioiTinhYeuCau, Giuong(MaGiuong, MaPhong, TinhTrang, GiaThue)')
    .eq('MaPhong', Number(maPhong))
    .single();
  if (roomError) throw roomError;

  const allBeds = phong.Giuong || [];
  const selectedBeds = allBeds.filter((bed) => bedIds.includes(Number(bed.MaGiuong)));
  if (selectedBeds.length !== bedIds.length) throw new Error('Có giường không thuộc phòng đã chọn');
  if (selectedBeds.some((bed) => !bed.TinhTrang)) throw new Error('Có giường đã được thuê hoặc đặt cọc');
  if (gioiTinh && String(phong.GioiTinhYeuCau || '').trim() !== String(gioiTinh).trim()) {
    throw new Error(`Khách ${gioiTinh} chỉ được chọn phòng ${gioiTinh}`);
  }

  const { data: locks, error: lockError } = await supabase
    .from('KhoaGiuongDatCoc')
    .select('MaGiuong, MaDatCoc')
    .in('MaGiuong', bedIds);
  if (lockError) throw lockError;
  if ((locks || []).some((lock) => Number(lock.MaDatCoc) !== Number(maDatCoc))) {
    throw new Error('Có giường đang được phiếu khác giữ chỗ');
  }

  const { data: phieuDangGiu, error: phieuDangGiuError } = await supabase
    .from('DatCoc')
    .select('MaDatCoc')
    .in('TrangThai', ACTIVE_LOCK_STATES);
  if (phieuDangGiuError) throw phieuDangGiuError;
  const maDatCocDangGiu = (phieuDangGiu || []).map((item) => Number(item.MaDatCoc)).filter(Number.isFinite);
  let datCocLocks = [];
  if (maDatCocDangGiu.length) {
    const { data, error } = await supabase
      .from('GiuongDatCoc')
      .select('MaGiuong, MaDatCoc')
      .in('MaGiuong', bedIds)
      .in('MaDatCoc', maDatCocDangGiu);
    if (error) throw error;
    datCocLocks = data || [];
  }
  if ((datCocLocks || []).some((lock) => Number(lock.MaDatCoc) !== Number(maDatCoc))) {
    throw new Error('Có giường đã được phiếu đặt cọc khác chọn');
  }

  if (loaiThue === 'Thuê nguyên phòng') {
    const maxCapacity = Number(phong.SucChuaToiDa || allBeds.length);
    const availableBeds = allBeds.filter((bed) => bed.TinhTrang);
    if (allBeds.length !== maxCapacity || availableBeds.length !== maxCapacity || bedIds.length !== maxCapacity) {
      throw new Error('Thuê nguyên phòng yêu cầu toàn bộ giường trong phòng đều còn trống');
    }
  }

  return { phong, selectedBeds };
}

function kiemTraQuyen(user, expected) {
  if (user.vaiTro !== expected) throw new Error(`Chức năng này chỉ dành cho ${expected}`);
}

function kiemTraQuyenXemPhieu(user, phieu) {
  if (user.vaiTro === 'SALE' && Number(phieu.NVSale) !== Number(user.maNV)) {
    camTruyCap('Bạn không phụ trách phiếu đặt cọc này');
  }
  if (user.vaiTro === 'QUAN_LY' && ![
    TRANG_THAI_COC.CHO_KIEM_TRA_PHONG,
    TRANG_THAI_COC.CHO_XAC_NHAN_THANH_TOAN,
    TRANG_THAI_COC.DA_XAC_NHAN,
    TRANG_THAI_COC.QUA_HAN_TU_DONG_HUY
  ].includes(phieu.TrangThai)) {
    camTruyCap('Phiếu không thuộc phạm vi xử lý hoặc theo dõi của Quản lý');
  }
  if (user.vaiTro === 'KE_TOAN' && ![
    TRANG_THAI_COC.CHO_TINH_COC,
    TRANG_THAI_COC.DA_XAC_NHAN,
    TRANG_THAI_COC.QUA_HAN_TU_DONG_HUY
  ].includes(phieu.TrangThai)) {
    camTruyCap('Phiếu không thuộc phạm vi xử lý hoặc theo dõi của Kế toán');
  }
}

router.get('/phong-giuong-trong', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('Phong')
      .select('MaPhong, LoaiPhong, SucChuaConLai, SucChuaToiDa, GioiTinhYeuCau, GiaThue, MaCN, ChiNhanh(TenCN), Giuong(MaGiuong, GiaThue, TinhTrang)')
      .order('MaPhong');
    if (error) throw error;
    const [khoaTamRes, phieuDangGiuRes] = await Promise.all([
      supabase.from('KhoaGiuongDatCoc').select('MaGiuong, MaDatCoc'),
      supabase.from('DatCoc').select('MaDatCoc').in('TrangThai', ACTIVE_LOCK_STATES),
    ]);
    if (khoaTamRes.error) throw khoaTamRes.error;
    if (phieuDangGiuRes.error) throw phieuDangGiuRes.error;
    const maDatCocDangGiu = (phieuDangGiuRes.data || []).map((item) => Number(item.MaDatCoc)).filter(Number.isFinite);
    let giuongTrongPhieu = [];
    if (maDatCocDangGiu.length) {
      const { data: datCocBeds, error: datCocBedsError } = await supabase
        .from('GiuongDatCoc')
        .select('MaGiuong, MaDatCoc')
        .in('MaDatCoc', maDatCocDangGiu);
      if (datCocBedsError) throw datCocBedsError;
      giuongTrongPhieu = datCocBeds || [];
    }
    const locked = new Set([
      ...(khoaTamRes.data || []).map((item) => item.MaGiuong),
      ...giuongTrongPhieu.map((item) => item.MaGiuong),
    ]);
    res.json({
      ok: true,
      data: (data || []).map((phong) => ({
        ...phong,
        Giuong: (phong.Giuong || []).map((giuong) => ({ ...giuong, dangKhoa: locked.has(giuong.MaGiuong) })),
      })),
    });
  } catch (error) {
    loi(res, error.status || 500, error.message);
  }
});

router.get('/phieu', async (req, res) => {
  try {
    const user = nguoiDung(req);
    let query = supabase
      .from('DatCoc')
      .select('MaDatCoc, ThoiDiemTao, CapNhatLuc, SoTienCoc, HanThanhToan, TrangThai, CCCD, MaPhong, MaCN, NVSale, LoaiThue, SoGiuongThue, LyDoXuLy, KhachHang(HoTen, SDT)', { count: 'exact' })
      .order('ThoiDiemTao', { ascending: false });
    if (user.vaiTro === 'SALE' && user.maNV) {
      query = query.eq('NVSale', user.maNV);
    } else if (user.vaiTro === 'QUAN_LY') {
      query = query.in('TrangThai', [
        TRANG_THAI_COC.CHO_KIEM_TRA_PHONG,
        TRANG_THAI_COC.CHO_XAC_NHAN_THANH_TOAN,
        TRANG_THAI_COC.DA_XAC_NHAN,
        TRANG_THAI_COC.QUA_HAN_TU_DONG_HUY
      ]);
    } else if (user.vaiTro === 'KE_TOAN') {
      query = query.in('TrangThai', [
        TRANG_THAI_COC.CHO_TINH_COC,
        TRANG_THAI_COC.DA_XAC_NHAN,
        TRANG_THAI_COC.QUA_HAN_TU_DONG_HUY
      ]);
    }
    if (req.query.trangThai) query = query.eq('TrangThai', req.query.trangThai);
    const { data, error, count } = await query;
    if (error) throw error;
    const branchIds = [...new Set((data || []).map((item) => item.MaCN).filter(Boolean))];
    const branches = branchIds.length
      ? await supabase.from('ChiNhanh').select('MaCN, TenCN').in('MaCN', branchIds)
      : { data: [] };
    if (branches.error) throw branches.error;
    const branchMap = new Map((branches.data || []).map((item) => [item.MaCN, item]));
    res.json({
      ok: true,
      data: (data || []).map((item) => ({
        ...item,
        CCCD: dinhDangCCCD(item.CCCD),
        ChiNhanh: branchMap.get(item.MaCN) || null,
      })),
      total: count || 0,
    });
  } catch (error) {
    loi(res, 500, error.message);
  }
});

router.get('/phieu/:id', async (req, res) => {
  try {
    const user = nguoiDung(req);
    const phieu = await layPhieu(req.params.id);
    kiemTraQuyenXemPhieu(user, phieu);
    const [chungTu, lichSu] = await Promise.all([
      supabase.from('ChungTuDatCoc').select('*').eq('MaDatCoc', phieu.MaDatCoc).order('TaiLenLuc', { ascending: false }),
      supabase.from('LichSuDatCoc').select('*').eq('MaDatCoc', phieu.MaDatCoc).order('ThoiDiem', { ascending: false }),
    ]);
    if (chungTu.error) throw chungTu.error;
    if (lichSu.error) throw lichSu.error;
    res.json({ ok: true, data: { ...phieu, chungTu: chungTu.data || [], lichSu: lichSu.data || [] } });
  } catch (error) {
    loi(res, error.status || 500, error.message);
  }
});

router.post('/phieu', async (req, res) => {
  try {
    const user = nguoiDung(req);
    kiemTraQuyen(user, 'SALE');
    const {
      cccd,
      loaiThue = 'Thuê giường lẻ',
      maPhong,
      maCN,
      maGiuongs = [],
      hoTen,
      sdt,
      email,
      diaChi,
      gioiTinh,
      quocTich,
      khaNangTaiChinh,
      thoiHanThue = 6
    } = req.body;
    if (!cccd || !maPhong || !maGiuongs.length) return loi(res, 400, 'Thiếu khách hàng hoặc lựa chọn phòng/giường');
    const rentalMonths = Number(thoiHanThue);
    if (!Number.isInteger(rentalMonths) || rentalMonths < 6 || rentalMonths > 12) {
      return loi(res, 400, 'Thời hạn thuê phải từ 6 đến 12 tháng');
    }
    const targetCCCD = Number(cccd);
    if (Number.isNaN(targetCCCD) || !/^\d{6,12}$/.test(String(cccd).trim())) {
      return loi(res, 400, 'Số CCCD/Hộ chiếu phải chứa từ 6 đến 12 chữ số.');
    }
    if (!hoTen || !hoTen.trim()) return loi(res, 400, 'Vui lòng nhập họ và tên khách thuê');
    if (!sdt || !/^\d{9,11}$/.test(sdt.trim())) return loi(res, 400, 'Số điện thoại không hợp lệ (bắt buộc từ 9 đến 11 số)');
    if (!gioiTinh || !gioiTinh.trim()) return loi(res, 400, 'Vui lòng chọn giới tính');
    if (!['Nam', 'Nữ'].includes(gioiTinh.trim())) return loi(res, 400, 'Giới tính chỉ được chọn Nam hoặc Nữ');
    if (!quocTich || !quocTich.trim()) return loi(res, 400, 'Vui lòng nhập quốc tịch');
    
    // Check if customer profile exists
    const { data: customer, error: customerError } = await supabase
      .from('KhachHang')
      .select('CCCD')
      .eq('CCCD', targetCCCD)
      .maybeSingle();
    if (customerError) throw customerError;

    if (!customer) {
      const { error: customerCreateError } = await supabase
        .from('KhachHang')
        .insert({
          CCCD: targetCCCD,
          HoTen: hoTen || 'Chưa cập nhật họ tên',
          SDT: chuanHoaThongTinTuyChon(sdt),
          Email: chuanHoaThongTinTuyChon(email),
          DiaChi: diaChi || null,
          GioiTinh: gioiTinh || null,
          QuocTich: quocTich || 'Việt Nam',
          KhaNangTaiChinh: khaNangTaiChinh ? Number(khaNangTaiChinh) : null,
          ThoaDK: false,
        });
      if (customerCreateError) throw customerCreateError;
    } else {
      const updates = {};
      if (hoTen) updates.HoTen = hoTen;
      if (chuanHoaThongTinTuyChon(sdt)) updates.SDT = chuanHoaThongTinTuyChon(sdt);
      if (chuanHoaThongTinTuyChon(email)) updates.Email = chuanHoaThongTinTuyChon(email);
      if (diaChi) updates.DiaChi = diaChi;
      if (gioiTinh) updates.GioiTinh = gioiTinh;
      if (quocTich) updates.QuocTich = quocTich;
      if (khaNangTaiChinh) updates.KhaNangTaiChinh = Number(khaNangTaiChinh);
      
      if (Object.keys(updates).length > 0) {
        const { error: customerUpdateError } = await supabase
          .from('KhachHang')
          .update(updates)
          .eq('CCCD', targetCCCD);
        if (customerUpdateError) throw customerUpdateError;
      }
    }

    const selection = await kiemTraLuaChonGiuong({ maPhong, maGiuongs, loaiThue, gioiTinh });
    let insertResult = await supabase.from('DatCoc').insert({
      CCCD: targetCCCD,
      ThoiDiemTao: new Date().toISOString(),
      TrangThai: TRANG_THAI_COC.MOI,
      LoaiThue: loaiThue,
      MaPhong: Number(maPhong),
      MaCN: Number(selection.phong.MaCN || maCN),
      NVSale: user.maNV,
      SoGiuongThue: maGiuongs.length,
      SoTienCoc: 0,
      ThoiHanThue: rentalMonths,
    }).select().single();

    if (insertResult.error && insertResult.error.message.includes('column "ThoiHanThue" of relation "DatCoc" does not exist')) {
      // Fallback: Retry without ThoiHanThue column
      insertResult = await supabase.from('DatCoc').insert({
        CCCD: targetCCCD,
        ThoiDiemTao: new Date().toISOString(),
        TrangThai: TRANG_THAI_COC.MOI,
        LoaiThue: loaiThue,
        MaPhong: Number(maPhong),
        MaCN: Number(selection.phong.MaCN || maCN),
        NVSale: user.maNV,
        SoGiuongThue: maGiuongs.length,
        SoTienCoc: 0,
      }).select().single();
    }

    if (insertResult.error) throw insertResult.error;
    const data = insertResult.data;
    const rows = maGiuongs.map((MaGiuong) => ({ MaGiuong: Number(MaGiuong), MaDatCoc: data.MaDatCoc, SoGiuongCoc: 1 }));
    const { error: bedError } = await supabase.from('GiuongDatCoc').insert(rows);
    if (bedError) throw bedError;
    await ghiLichSu({ ...data, TrangThai: null }, TRANG_THAI_COC.MOI, user, null);
    const maYCDaTaoDatCoc = await danhDauYeuCauThueDaTaoDatCoc(targetCCCD, user.maNV);
    await khoaLichHenSauKhiDatCoc(maYCDaTaoDatCoc, maPhong);
    res.status(201).json({ ok: true, data: { ...data, CCCD: dinhDangCCCD(data.CCCD) } });
  } catch (error) {
    loi(res, 400, thongBaoLoiDuLieu(error));
  }
});

router.patch('/phieu/:id/khach-hang', async (req, res) => {
  try {
    const user = nguoiDung(req);
    kiemTraQuyen(user, 'SALE');
    const phieu = await layPhieu(req.params.id);
    if (Number(phieu.NVSale) !== Number(user.maNV)) camTruyCap('Bạn không phụ trách phiếu đặt cọc này');
    if (!CUSTOMER_EDITABLE_STATES.includes(phieu.TrangThai)) {
      throw new Error('Không thể sửa thông tin khách hàng ở trạng thái hiện tại');
    }

    const khachHang = req.body?.khachHang || {};
    const hoTen = String(khachHang.HoTen || '').trim().normalize('NFC');
    const sdt = chuanHoaThongTinTuyChon(khachHang.SDT);
    const email = chuanHoaThongTinTuyChon(khachHang.Email);
    const khaNangTaiChinh = khachHang.KhaNangTaiChinh === '' || khachHang.KhaNangTaiChinh == null
      ? null
      : Number(khachHang.KhaNangTaiChinh);
    const newCCCD = Number(khachHang.CCCD);

    if (!newCCCD || !/^\d{6,12}$/.test(String(khachHang.CCCD).trim())) {
      throw new Error('Số CCCD/Hộ chiếu phải chứa từ 6 đến 12 chữ số.');
    }
    if (!hoTen) throw new Error('Họ và tên khách thuê không được để trống');
    if (!sdt || !/^\d{9,11}$/.test(sdt)) throw new Error('Số điện thoại không hợp lệ (bắt buộc từ 9 đến 11 chữ số)');
    if (!khachHang.GioiTinh || !String(khachHang.GioiTinh).trim()) throw new Error('Vui lòng chọn giới tính');
    if (!['Nam', 'Nữ'].includes(String(khachHang.GioiTinh).trim())) throw new Error('Giới tính chỉ được chọn Nam hoặc Nữ');
    if (!khachHang.QuocTich || !String(khachHang.QuocTich).trim()) throw new Error('Vui lòng nhập quốc tịch');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Địa chỉ email không đúng định dạng');
    if (khaNangTaiChinh !== null && (!Number.isFinite(khaNangTaiChinh) || khaNangTaiChinh <= 0)) {
      throw new Error('Khả năng tài chính phải là một số dương');
    }

    const updates = {
      HoTen: hoTen,
      GioiTinh: chuanHoaThongTinTuyChon(khachHang.GioiTinh),
      QuocTich: chuanHoaThongTinTuyChon(khachHang.QuocTich),
      DiaChi: chuanHoaThongTinTuyChon(khachHang.DiaChi),
      SDT: sdt,
      Email: email,
      KhaNangTaiChinh: khaNangTaiChinh,
      ThoaDK: Boolean(khachHang.ThoaDK),
    };

    let savedData;
    const oldCCCD = Number(phieu.CCCD);

    if (newCCCD !== oldCCCD) {
      // Check if new CCCD already exists
      const { data: existingCustomer, error: searchError } = await supabase
        .from('KhachHang')
        .select('*')
        .eq('CCCD', newCCCD)
        .maybeSingle();
      if (searchError) throw searchError;

      if (!existingCustomer) {
        // Create new customer with the new CCCD and the updated details
        const { data: newCustomer, error: insertError } = await supabase
          .from('KhachHang')
          .insert({
            CCCD: newCCCD,
            ...updates,
          })
          .select('*')
          .single();
        if (insertError) throw insertError;
        savedData = newCustomer;
      } else {
        // Update the existing customer details with the updates
        const { data: updatedCustomer, error: updateError } = await supabase
          .from('KhachHang')
          .update(updates)
          .eq('CCCD', newCCCD)
          .select('*')
          .single();
        if (updateError) throw updateError;
        savedData = updatedCustomer;
      }

      // Update the ticket to point to the new CCCD
      const { error: ticketUpdateError } = await supabase
        .from('DatCoc')
        .update({ CCCD: newCCCD })
        .eq('MaDatCoc', phieu.MaDatCoc);
      if (ticketUpdateError) throw ticketUpdateError;
    } else {
      // Normal update for existing customer
      const { data: updatedCustomer, error: updateError } = await supabase
        .from('KhachHang')
        .update(updates)
        .eq('CCCD', oldCCCD)
        .select('*')
        .single();
      if (updateError) throw updateError;
      savedData = updatedCustomer;
    }

    res.json({ ok: true, data: { ...savedData, CCCD: dinhDangCCCD(savedData.CCCD) } });
  } catch (error) {
    loi(res, error.status || 400, thongBaoLoiDuLieu(error));
  }
});

router.post('/phieu/:id/hanh-dong', async (req, res) => {
  try {
    const user = nguoiDung(req);
    const phieu = await layPhieu(req.params.id);
    const {
      hanhDong, ghiChu, maGiuongs = [], maPhong, maCN, loaiThue,
      hinhThucThanhToan = 'Chuyển khoản', maGiaoDich, hinhAnhDataUrl,
      soTienThucNhan, xacNhanDaNhanTien, soTienCoc,
    } = req.body;
    let next = null;
    let fields = {};
    let notification = '';

    if (hanhDong === 'GUI_KIEM_TRA') {
      kiemTraQuyen(user, 'SALE');
      if (![TRANG_THAI_COC.MOI, TRANG_THAI_COC.HET_CHO].includes(phieu.TrangThai)) throw new Error('Phiếu không ở trạng thái có thể gửi kiểm tra');
      const beds = maGiuongs.length ? maGiuongs.map(Number) : phieu.GiuongDatCoc.map((item) => item.MaGiuong);
      const targetRoom = Number(maPhong || phieu.MaPhong);
      const targetType = loaiThue || phieu.LoaiThue;
      const selection = await kiemTraLuaChonGiuong({
        maDatCoc: phieu.MaDatCoc,
        maPhong: targetRoom,
        maGiuongs: beds,
        loaiThue: targetType,
        gioiTinh: phieu.KhachHang?.GioiTinh,
      });
      await khoaGiuong(phieu.MaDatCoc, beds);
      if (maGiuongs.length) {
        await supabase.from('GiuongDatCoc').delete().eq('MaDatCoc', phieu.MaDatCoc);
        const { error } = await supabase.from('GiuongDatCoc').insert(beds.map((MaGiuong) => ({ MaGiuong, MaDatCoc: phieu.MaDatCoc, SoGiuongCoc: 1 })));
        if (error) throw error;
        fields.SoGiuongThue = beds.length;
        fields.MaPhong = targetRoom;
        fields.MaCN = Number(selection.phong.MaCN || maCN || phieu.MaCN);
        fields.LoaiThue = targetType;
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
      const count = phieu.LoaiThue === 'Thuê nguyên phòng' ? Number(room?.SucChuaToiDa || beds.length) : beds.length;
      
      let suggested = 0;
      if (phieu.LoaiThue === 'Thuê nguyên phòng') {
        const roomBeds = room?.Giuong || beds.map(b => b.Giuong).filter(Boolean);
        const isMissingBeds = roomBeds.length < Number(room?.SucChuaToiDa || 0);
        if (isMissingBeds) {
          const monthly = Number(beds[0]?.Giuong?.GiaThue || 0);
          suggested = monthly * 2 * Number(room?.SucChuaToiDa || beds.length);
        } else {
          suggested = roomBeds.reduce((sum, bed) => sum + Number(bed.GiaThue || 0) * 2, 0);
        }
      } else {
        suggested = beds.reduce((sum, item) => sum + Number(item.Giuong?.GiaThue || 0) * 2, 0);
      }

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
      const paymentType = ['Tiền mặt', 'TIEN_MAT'].includes(hinhThucThanhToan) ? 'Tiền mặt' : 'Chuyển khoản';
      if (paymentType === 'Tiền mặt') {
        if (!xacNhanDaNhanTien) throw new Error('Cần xác nhận đã nhận đủ tiền mặt');
      } else if (!maGiaoDich?.trim() && !hinhAnhDataUrl?.trim()) {
        throw new Error('Chuyển khoản cần mã giao dịch hoặc ảnh chứng từ');
      }
      if (phieu.HanThanhToan && new Date(phieu.HanThanhToan) <= new Date()) throw new Error('Yêu cầu thanh toán đã quá hạn');
      const receiptCode = taoMaPhieuThu(phieu.MaDatCoc);
      const receiverName = paymentType === 'Tiền mặt' ? await layTenNhanVien(user.maNV) : null;
      const { error } = await supabase.from('ChungTuDatCoc').insert({
        MaDatCoc: phieu.MaDatCoc,
        LoaiThanhToan: paymentType,
        MaPhieuThu: receiptCode,
        MaGiaoDich: paymentType === 'Tiền mặt' ? receiptCode : maGiaoDich?.trim() || null,
        HinhAnhDataUrl: paymentType === 'Chuyển khoản' ? hinhAnhDataUrl || null : null,
        NguoiNhanTien: receiverName,
        SoTienThucNhan: Number(soTienThucNhan || phieu.SoTienCoc),
        NguoiTaiLen: user.maNV,
        TrangThai: 'Chờ xác nhận',
      });
      if (error) throw error;
      fields.HinhThucThanhToan = paymentType;
      next = TRANG_THAI_COC.CHO_XAC_NHAN_THANH_TOAN;
      notification = `Phiếu #${phieu.MaDatCoc} có chứng từ thanh toán cần xác nhận.`;
    } else if (hanhDong === 'XAC_NHAN_CHUNG_TU') {
      kiemTraQuyen(user, 'QUAN_LY');
      if (phieu.TrangThai !== TRANG_THAI_COC.CHO_XAC_NHAN_THANH_TOAN) throw new Error('Phiếu không chờ xác nhận chứng từ');
      const { data: paymentProof, error: proofError } = await supabase
         .from('ChungTuDatCoc')
         .select('MaChungTu')
         .eq('MaDatCoc', phieu.MaDatCoc)
         .order('TaiLenLuc', { ascending: false })
         .limit(1)
         .maybeSingle();
      if (proofError) throw proofError;
      if (!paymentProof) throw new Error('Không thể xác nhận khi phiếu chưa có chứng từ thanh toán');
      const { error: proofUpdateError } = await supabase
        .from('ChungTuDatCoc')
        .update({ TrangThai: 'Đã xác nhận' })
        .eq('MaChungTu', paymentProof.MaChungTu);
      if (proofUpdateError) throw proofUpdateError;
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
      const { data: latestProofToReject, error: latestProofError } = await supabase
        .from('ChungTuDatCoc')
        .select('MaChungTu')
        .eq('MaDatCoc', phieu.MaDatCoc)
        .order('TaiLenLuc', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (latestProofError) throw latestProofError;
      if (!latestProofToReject) throw new Error('Không thể từ chối khi phiếu chưa có chứng từ thanh toán');
      const { error: rejectProofError } = await supabase
        .from('ChungTuDatCoc')
        .update({ TrangThai: 'Từ chối' })
        .eq('MaChungTu', latestProofToReject.MaChungTu);
      if (rejectProofError) throw rejectProofError;
      next = TRANG_THAI_COC.TU_CHOI_CHUNG_TU;
      notification = `Chứng từ phiếu #${phieu.MaDatCoc} bị từ chối: ${ghiChu}`;
    } else {
      return loi(res, 400, 'Hành động không hợp lệ');
    }

    const updated = await capNhatTrangThai(phieu, next, user, ghiChu, fields);
    await guiThongBao({ ...phieu, ...updated }, next, notification);
    res.json({ ok: true, data: updated });
  } catch (error) {
    loi(res, 400, thongBaoLoiDuLieu(error));
  }
});

router.get('/notifications', async (req, res) => {
  try {
    const user = nguoiDung(req);
    let query = supabase.from(BANG_THONG_BAO).select('*').order('TaoLuc', { ascending: false }).limit(50);
    query = user.vaiTro === 'SALE'
      ? query.eq('NguoiNhan', user.maNV)
      : query.eq('VaiTroNhan', vaiTroDatabase(user.vaiTro));
    const { data, error } = await query;
    if (error) throw error;
    res.json({ ok: true, data: data || [], unread: (data || []).filter((item) => !item.DaDoc).length });
  } catch (error) {
    loi(res, 500, error.message);
  }
});

router.patch('/notifications/mark-all-read', async (req, res) => {
  try {
    const user = nguoiDung(req);
    let query = supabase.from(BANG_THONG_BAO).update({ DaDoc: true });
    query = user.vaiTro === 'SALE'
      ? query.eq('NguoiNhan', user.maNV)
      : query.eq('VaiTroNhan', vaiTroDatabase(user.vaiTro));
    const { error } = await query;
    if (error) throw error;
    res.json({ ok: true });
  } catch (error) {
    loi(res, 500, error.message);
  }
});

router.patch('/notifications/:id/read', async (req, res) => {
  try {
    const user = nguoiDung(req);
    let query = supabase.from(BANG_THONG_BAO).update({ DaDoc: true }).eq('MaThongBao', Number(req.params.id));
    query = user.vaiTro === 'SALE'
      ? query.eq('NguoiNhan', user.maNV)
      : query.eq('VaiTroNhan', vaiTroDatabase(user.vaiTro));
    const { data, error } = await query.select('MaThongBao').maybeSingle();
    if (error) throw error;
    if (!data) return loi(res, 403, 'Bạn không có quyền đọc thông báo này');
    res.json({ ok: true });
  } catch (error) {
    loi(res, 500, error.message);
  }
});

export async function huyDatCocQuaHan() {
  const now = new Date().toISOString();
  const { data: dsQuaHan, error } = await supabase
    .from('DatCoc')
    .select('MaDatCoc, TrangThai, HanThanhToan, NVSale')
    .eq('TrangThai', TRANG_THAI_COC.CHO_THANH_TOAN)
    .lt('HanThanhToan', now);
  if (error) throw error;

  let soPhieuDaHuy = 0;
  for (const phieu of dsQuaHan || []) {
    const { data: updated, error: updateError } = await supabase
      .from('DatCoc')
      .update({
        TrangThai: TRANG_THAI_COC.QUA_HAN_TU_DONG_HUY,
        LyDoXuLy: 'Tu dong huy do qua han thanh toan coc',
        CapNhatLuc: now,
      })
      .eq('MaDatCoc', phieu.MaDatCoc)
      .eq('TrangThai', TRANG_THAI_COC.CHO_THANH_TOAN)
      .select('MaDatCoc, TrangThai, NVSale')
      .maybeSingle();
    if (updateError) throw updateError;
    if (!updated) continue;

    await giaiPhongKhoa(phieu.MaDatCoc);
    await ghiLichSu(
      phieu,
      TRANG_THAI_COC.QUA_HAN_TU_DONG_HUY,
      { maNV: phieu.NVSale || null, vaiTro: 'HE_THONG' },
      'Tu dong huy do qua han thanh toan coc',
    );
    await guiThongBao(
      { ...phieu, ...updated },
      TRANG_THAI_COC.QUA_HAN_TU_DONG_HUY,
      `Phieu #${phieu.MaDatCoc} da qua han thanh toan coc va duoc tu dong huy.`,
    );
    soPhieuDaHuy += 1;
  }

  return soPhieuDaHuy;
}

export { ACTIVE_LOCK_STATES };
export default router;
