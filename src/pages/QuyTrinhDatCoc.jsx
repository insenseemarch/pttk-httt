import { useEffect, useMemo, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import KhungNhanVien from '../components/KhungNhanVien';
import { ROUTES } from '../config/routes';
import DanhSachPhieuDatCoc from '../components/dat-coc/DanhSachPhieuDatCoc';
import ThongTinKhachHang from '../components/dat-coc/ThongTinKhachHang';
import ThanhToanMinhChung from '../components/dat-coc/ThanhToanMinhChung';
import BieuDoLichSu from '../components/dat-coc/BieuDoLichSu';
import ModalLapPhieuDatCoc from '../components/dat-coc/ModalLapPhieuDatCoc';
import { moAnhTrongTabMoi } from '../utils/moAnhTrongTabMoi';

const API = '/api/dat-coc';

const LABELS = {
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
};

const STATUS_CODE_BY_LABEL = Object.freeze(
  Object.fromEntries(Object.entries(LABELS).map(([code, label]) => [label, code])),
);

const MA_MAU_THEO_TRANG_THAI = Object.freeze({
  ...STATUS_CODE_BY_LABEL,
  'Chờ kiểm tra': 'CHO_KIEM_TRA',
  'Chờ lập hợp đồng': 'CHO_LAP_HOP_DONG',
  'Chờ lập hợp đồng (điều chỉnh)': 'CHO_LAP_HOP_DONG_DIEU_CHINH',
  'Chờ hoàn cọc': 'CHO_HOAN_COC',
  'Chờ thanh toán': 'CHO_THANH_TOAN_HOP_DONG',
  'Chờ thanh toán thêm': 'CHO_THANH_TOAN_THEM',
  'Chờ đối soát': 'CHO_DOI_SOAT',
  'Chờ xác nhận đối soát': 'CHO_XAC_NHAN_DOI_SOAT',
  'Chờ thanh lý': 'CHO_THANH_LY',
  'Đã thanh lý': 'DA_THANH_LY',
});

function maTrangThai(value) {
  return STATUS_CODE_BY_LABEL[value] || value;
}

function maMauTrangThai(value) {
  const giaTri = String(value || '');
  if (LABELS[giaTri]) return giaTri;
  return MA_MAU_THEO_TRANG_THAI[giaTri] || 'KHAC';
}

function dinhDangCCCD(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  return digits;
}

function chuanHoaPhieuTuAPI(phieu) {
  if (!phieu) return phieu;
  return {
    ...phieu,
    CCCD: dinhDangCCCD(phieu.CCCD),
    KhachHang: phieu.KhachHang
      ? { ...phieu.KhachHang, CCCD: dinhDangCCCD(phieu.KhachHang.CCCD ?? phieu.CCCD) }
      : phieu.KhachHang,
    TrangThai: maTrangThai(phieu.TrangThai),
    lichSu: (phieu.lichSu || []).map((item) => ({
      ...item,
      TrangThaiCu: maTrangThai(item.TrangThaiCu),
      TrangThaiMoi: maTrangThai(item.TrangThaiMoi),
    })),
  };
}

const ROLE_TABS = {
  SALE: [
    { key: 'ALL', label: 'Tất cả phiếu' },
    { key: 'KHAO_SAT', label: 'Chờ duyệt phòng' },
    { key: 'THANH_TOAN', label: 'Chờ thanh toán cọc' },
    { key: 'KET_THUC', label: 'Phiếu đã hoàn tất' },
  ],
  QUAN_LY: [
    { key: 'ALL', label: 'Tất cả phiếu' },
    { key: 'KIEM_TRA_PHONG', label: 'Yêu cầu duyệt phòng' },
    { key: 'DUYET_TIEN', label: 'Yêu cầu duyệt thanh toán' },
    { key: 'KET_THUC', label: 'Phiếu đã hoàn tất' },
  ],
  KE_TOAN: [
    { key: 'ALL', label: 'Tất cả phiếu' },
    { key: 'TINH_COC', label: 'Yêu cầu tính tiền cọc' },
    { key: 'KET_THUC', label: 'Phiếu đã hoàn tất' },
  ],
};

const NEXT_STEP = {
  SALE: {
    MOI: ['task_alt', 'Hoàn tất thông tin khách thuê, xác nhận nội quy và gửi yêu cầu duyệt phòng.'],
    CHO_KIEM_TRA_PHONG: ['hourglass_top', 'Theo dõi kết quả duyệt phòng từ Quản lý.'],
    HET_CHO: ['bed', 'Chọn lại phòng hoặc giường còn trống và gửi duyệt lại.'],
    CON_TRONG_CHO_GUI_KE_TOAN: ['send', 'Gửi yêu cầu tính tiền cọc cho Kế toán.'],
    CHO_TINH_COC: ['hourglass_top', 'Theo dõi kết quả tính tiền cọc từ Kế toán.'],
    CHO_THANH_TOAN: ['payments', 'Ghi nhận hình thức thanh toán và tải chứng từ lên hệ thống.'],
    CHO_XAC_NHAN_THANH_TOAN: ['fact_check', 'Theo dõi kết quả duyệt thanh toán từ Quản lý.'],
    TU_CHOI_CHUNG_TU: ['upload_file', 'Bổ sung chứng từ hợp lệ và gửi duyệt lại.'],
    DA_XAC_NHAN: ['verified', 'Phiếu đã hoàn tất. Tiếp tục quy trình nhận phòng.'],
    QUA_HAN_TU_DONG_HUY: ['event_busy', 'Phiếu đã bị hủy do quá hạn thanh toán.'],
  },
  QUAN_LY: {
    CHO_KIEM_TRA_PHONG: ['meeting_room', 'Đối chiếu tình trạng phòng hoặc giường và xác nhận kết quả.'],
    CHO_XAC_NHAN_THANH_TOAN: ['receipt_long', 'Đối chiếu chứng từ và xác nhận kết quả thanh toán.'],
  },
  KE_TOAN: {
    CHO_TINH_COC: ['calculate', 'Kiểm tra số tiền cọc và gửi yêu cầu thanh toán.'],
  },
};

function tenHopLe(value) {
  const normalized = String(value || '').trim().normalize('NFC');
  return /[\p{L}]/u.test(normalized) && /^[\p{L}\p{M} .'-]+$/u.test(normalized);
}

function chuanHoaFormKhachHang(form = {}) {
  return {
    CCCD: String(form.CCCD || '').trim(),
    HoTen: String(form.HoTen || '').trim().normalize('NFC'),
    GioiTinh: String(form.GioiTinh || '').trim(),
    QuocTich: String(form.QuocTich || '').trim(),
    SDT: String(form.SDT || '').trim(),
    Email: String(form.Email || '').trim(),
    DiaChi: String(form.DiaChi || '').trim(),
    KhaNangTaiChinh: String(form.KhaNangTaiChinh || '').trim(),
    ThoaDK: Boolean(form.ThoaDK),
  };
}

function loiFormKhachHang(form) {
  const data = chuanHoaFormKhachHang(form);
  if (!/^\d{6,12}$/.test(data.CCCD)) return 'Số CCCD/Hộ chiếu phải chứa từ 6 đến 12 chữ số.';
  if (!data.HoTen) return 'Họ và tên khách thuê không được để trống.';
  if (!tenHopLe(data.HoTen)) return 'Họ và tên không hợp lệ (không chứa số hoặc ký tự đặc biệt).';
  if (data.Email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.Email)) return 'Địa chỉ email không đúng định dạng.';
  if (!data.SDT || !/^\d{9,11}$/.test(data.SDT)) return 'Số điện thoại không hợp lệ (bắt buộc từ 9 đến 11 chữ số).';
  if (!data.GioiTinh || !data.GioiTinh.trim()) return 'Vui lòng chọn giới tính.';
  if (!data.QuocTich || !data.QuocTich.trim()) return 'Vui lòng nhập quốc tịch.';
  if (data.KhaNangTaiChinh && (Number(data.KhaNangTaiChinh) <= 0 || Number.isNaN(Number(data.KhaNangTaiChinh)))) {
    return 'Khả năng tài chính phải là một số dương.';
  }
  return '';
}

function layVaiTro(user) {
  const value = String(user?.vaiTro || '').toLowerCase();
  if (value.includes('kế toán') || value.includes('ke toan') || value.includes('ketoan')) return 'KE_TOAN';
  if (value.includes('quản lý') || value.includes('quan ly') || value.includes('quanly')) return 'QUAN_LY';
  return 'SALE';
}

function taoHeaderAPI(user) {
  return {
    'Content-Type': 'application/json',
    'x-user-id': String(user?.maNV || ''),
    'x-user-role': layVaiTro(user),
  };
}

function dinhDangTien(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`;
}

function phongPhuHopGioiTinh(room, gender) {
  return !gender || String(room?.GioiTinhYeuCau || '').trim() === String(gender).trim();
}

function taoFormTaoPhieuMacDinh(cccd = '') {
  return {
    cccd,
    maYC: '',
    loaiThue: '',
    maLoaiPhong: '',
    tenLoaiPhong: '',
    soNguoiDuKien: 0,
    maPhong: '',
    maGiuongs: [],
    hoTen: '',
    sdt: '',
    email: '',
    diaChi: '',
    gioiTinh: '',
    quocTich: '',
    khaNangTaiChinh: '',
    thoiHanThue: 6,
  };
}

function chuyenThanhNgay(value) {
  if (!value) return null;
  if (typeof value === 'string' && !value.endsWith('Z') && !/\+\d{2}:?\d{2}$/.test(value) && !/\-\d{2}:?\d{2}$/.test(value)) {
    return new Date(value + 'Z');
  }
  return new Date(value);
}

function dinhDangNgayGio(value) {
  if (!value) return '—';
  const parsed = chuyenThanhNgay(value);
  if (!parsed || Number.isNaN(parsed.getTime())) return '—';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(parsed);
}

function tinhThoiGianConLai(deadline, now) {
  const parsed = chuyenThanhNgay(deadline);
  if (!parsed) return '00:00:00';
  const diff = parsed.getTime() - now;
  if (diff <= 0) return '00:00:00';
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return [hours, minutes, seconds].map((item) => String(item).padStart(2, '0')).join(':');
}

function layHanhDongChoVaiTro(role, status) {
  const actions = {
    SALE: {
      MOI: ['GUI_KIEM_TRA', 'Gửi Quản lý kiểm tra'],
      HET_CHO: ['GUI_KIEM_TRA', 'Chọn lại và gửi kiểm tra'],
      CON_TRONG_CHO_GUI_KE_TOAN: ['GUI_KE_TOAN', 'Gửi Kế toán tính cọc'],
      CHO_THANH_TOAN: ['XAC_NHAN_THANH_TOAN', 'Gửi chứng từ thanh toán'],
      TU_CHOI_CHUNG_TU: ['XAC_NHAN_THANH_TOAN', 'Gửi lại chứng từ'],
    },
    QUAN_LY: {
      CHO_KIEM_TRA_PHONG: ['XAC_NHAN_CON_TRONG', 'Xác nhận còn trống'],
      CHO_XAC_NHAN_THANH_TOAN: ['XAC_NHAN_CHUNG_TU', 'Xác nhận hợp lệ'],
    },
    KE_TOAN: {
      CHO_TINH_COC: ['TINH_COC', 'Gửi yêu cầu thanh toán'],
    },
  };
  return actions[role]?.[status] || null;
}

function locTheoTab(item, tab, role) {
  if (tab === 'ALL') return true;
  if (tab === 'KET_THUC') return ['DA_XAC_NHAN', 'QUA_HAN_TU_DONG_HUY'].includes(item.TrangThai);
  
  if (role === 'SALE') {
    if (tab === 'KHAO_SAT') return ['MOI', 'CHO_KIEM_TRA_PHONG', 'HET_CHO', 'CON_TRONG_CHO_GUI_KE_TOAN'].includes(item.TrangThai);
    if (tab === 'THANH_TOAN') return ['CHO_TINH_COC', 'CHO_THANH_TOAN', 'CHO_XAC_NHAN_THANH_TOAN', 'TU_CHOI_CHUNG_TU'].includes(item.TrangThai);
  }
  if (role === 'QUAN_LY') {
    if (tab === 'KIEM_TRA_PHONG') return ['CHO_KIEM_TRA_PHONG', 'HET_CHO', 'CON_TRONG_CHO_GUI_KE_TOAN'].includes(item.TrangThai);
    if (tab === 'DUYET_TIEN') return ['CHO_XAC_NHAN_THANH_TOAN', 'TU_CHOI_CHUNG_TU'].includes(item.TrangThai);
  }
  if (role === 'KE_TOAN') {
    if (tab === 'TINH_COC') return ['CHO_TINH_COC', 'CHO_THANH_TOAN', 'CHO_XAC_NHAN_THANH_TOAN', 'TU_CHOI_CHUNG_TU'].includes(item.TrangThai);
  }
  return true;
}

function layTabTheoTrangThai(role, trangThai) {
  if (['DA_XAC_NHAN', 'QUA_HAN_TU_DONG_HUY'].includes(trangThai)) return 'KET_THUC';
  if (role === 'SALE') {
    if (['MOI', 'CHO_KIEM_TRA_PHONG', 'HET_CHO', 'CON_TRONG_CHO_GUI_KE_TOAN'].includes(trangThai)) return 'KHAO_SAT';
    if (['CHO_TINH_COC', 'CHO_THANH_TOAN', 'CHO_XAC_NHAN_THANH_TOAN', 'TU_CHOI_CHUNG_TU'].includes(trangThai)) return 'THANH_TOAN';
  }
  if (role === 'QUAN_LY') {
    if (['CHO_KIEM_TRA_PHONG', 'HET_CHO', 'CON_TRONG_CHO_GUI_KE_TOAN'].includes(trangThai)) return 'KIEM_TRA_PHONG';
    if (['CHO_XAC_NHAN_THANH_TOAN', 'TU_CHOI_CHUNG_TU'].includes(trangThai)) return 'DUYET_TIEN';
  }
  if (role === 'KE_TOAN') return 'TINH_COC';
  return 'ALL';
}

export default function QuyTrinhDatCoc({ nguoiDung, dangXuat }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const phieuTuUrl = searchParams.get('phieu');
  const role = layVaiTro(nguoiDung);
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const selectedRef = useRef(selected);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  const [selectedTab, setSelectedTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [createError, setCreateError] = useState('');
  const [note, setNote] = useState('');
  const [transaction, setTransaction] = useState('');
  const [evidence, setEvidence] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Chuyển khoản');
  const [cashAmount, setCashAmount] = useState('');
  const [cashConfirmed, setCashConfirmed] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [now, setNow] = useState(Date.now());
  const [showCreate, setShowCreate] = useState(false);
  const [editingSelection, setEditingSelection] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [overviewRoomLimit, setOverviewRoomLimit] = useState(10);
  const [createForm, setCreateForm] = useState(() => taoFormTaoPhieuMacDinh());
  const [dangTaiHoSoTaoPhieu, setDangTaiHoSoTaoPhieu] = useState(false);
  const [customerForm, setCustomerForm] = useState({});
  const [savedCustomerForm, setSavedCustomerForm] = useState({});
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [customerSaveError, setCustomerSaveError] = useState('');
  const [customerSaveMessage, setCustomerSaveMessage] = useState('');

  const taiDanhSachPhieu = async (silent = false) => {
    if (!silent) setLoading(true);
    if (!silent) setError('');
    try {
      const response = await fetch(`${API}/phieu`, { headers: taoHeaderAPI(nguoiDung) });
      const json = await response.json();
      if (!json.ok) throw new Error(json.error);
      const normalizedItems = (json.data || []).map(chuanHoaPhieuTuAPI);
      setItems(normalizedItems);
      setSelected((current) => current && !normalizedItems.some((item) => item.MaDatCoc === current.MaDatCoc) ? null : current);
    } catch (err) {
      if (!silent) setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const taiChiTietPhieu = async (id, silent = false) => {
    if (!silent) setError('');
    try {
      let response;
      let json;
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          response = await fetch(`${API}/phieu/${id}`, { headers: taoHeaderAPI(nguoiDung) });
          json = await response.json();
        } catch (requestError) {
          if (attempt === 0) {
            await new Promise((resolve) => setTimeout(resolve, 350));
            continue;
          }
          throw new Error('Không thể kết nối máy chủ để tải chi tiết phiếu. Vui lòng thử lại.');
        }
        if (!json?.ok && /fetch failed/i.test(String(json?.error || '')) && attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 350));
          continue;
        }
        break;
      }
      if (!json.ok) {
        if (response.status === 403) {
          setSelected(null);
          setSearchParams({}, { replace: true });
          if (!silent) setError('');
          return;
        }
        throw new Error(json.error);
      }
      const normalizedData = chuanHoaPhieuTuAPI(json.data);
      setSelected(normalizedData);
      if (!silent) {
        setSearchParams({ phieu: String(normalizedData.MaDatCoc) }, { replace: true });
        setActionError('');
        const formKhachHang = {
          CCCD: normalizedData.CCCD || '',
          HoTen: normalizedData.KhachHang?.HoTen || '',
          GioiTinh: normalizedData.KhachHang?.GioiTinh || '',
          QuocTich: normalizedData.KhachHang?.QuocTich || '',
          SDT: normalizedData.KhachHang?.SDT || '',
          Email: normalizedData.KhachHang?.Email || '',
          DiaChi: normalizedData.KhachHang?.DiaChi || '',
          KhaNangTaiChinh: normalizedData.KhachHang?.KhaNangTaiChinh || '',
          ThoaDK: Boolean(normalizedData.KhachHang?.ThoaDK),
        };
        setCustomerForm(formKhachHang);
        setSavedCustomerForm(formKhachHang);
        setCustomerSaveError('');
        setCustomerSaveMessage('');
        setDepositAmount(normalizedData.SoTienCoc || '');
        setNote('');
        setTransaction('');
        setEvidence('');
        setPaymentMethod(normalizedData.HinhThucThanhToan === 'Tiền mặt' ? 'Tiền mặt' : 'Chuyển khoản');
        setCashAmount(normalizedData.SoTienCoc || '');
        setCashConfirmed(false);
      }
    } catch (err) {
      if (!silent) setError(err.message);
    }
  };

  useEffect(() => {
    taiDanhSachPhieu();
    if (/^\d+$/.test(String(phieuTuUrl || ''))) {
      taiChiTietPhieu(Number(phieuTuUrl));
    }

    // Connect socket
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001');

    socket.on('connect', () => {
      console.log('[Socket] Connected to server from workflow');
      socket.emit('join_room', `role:${role}`);
      if (nguoiDung?.maNV) {
        socket.emit('join_room', `sale:${nguoiDung.maNV}`);
      }
      // Reconnect-sync
      taiDanhSachPhieu(true);
      const currentSelected = selectedRef.current;
      if (currentSelected) taiChiTietPhieu(currentSelected.MaDatCoc, true);
    });

    socket.on('dat_coc_cap_nhat', (data) => {
      console.log('[Socket] Received deposit workflow update:', data);
      taiDanhSachPhieu(true);
      const currentSelected = selectedRef.current;
      if (currentSelected && Number(currentSelected.MaDatCoc) === Number(data.phieuId)) {
        taiChiTietPhieu(currentSelected.MaDatCoc, true);
      }
    });

    const interval = setInterval(() => {
      taiDanhSachPhieu(true);
      const currentSelected = selectedRef.current;
      if (currentSelected) taiChiTietPhieu(currentSelected.MaDatCoc, true);
    }, 30000);

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, [nguoiDung?.maNV, role]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const selectedBeds = selected?.GiuongDatCoc || [];
  const room = selectedBeds[0]?.Giuong?.Phong;

  const suggested = useMemo(() => {
    if (!selected || !selectedBeds.length) return 0;
    if (selected.LoaiThue === 'Thuê nguyên phòng') {
      const roomBeds = room?.Giuong || selectedBeds.map(b => b.Giuong).filter(Boolean);
      const isMissingBeds = roomBeds.length < Number(room?.SucChuaToiDa || 0);
      if (isMissingBeds) {
        const monthly = Number(selectedBeds[0]?.Giuong?.GiaThue || 0);
        return monthly * 2 * Number(room?.SucChuaToiDa || selectedBeds.length);
      }
      return roomBeds.reduce((sum, bed) => sum + Number(bed.GiaThue || 0) * 2, 0);
    }
    return selectedBeds.reduce((sum, item) => sum + Number(item.Giuong?.GiaThue || 0) * 2, 0);
  }, [selected, selectedBeds, room]);

  const customerHasChanges = useMemo(() => (
    JSON.stringify(chuanHoaFormKhachHang(customerForm)) !== JSON.stringify(chuanHoaFormKhachHang(savedCustomerForm))
  ), [customerForm, savedCustomerForm]);

  const capNhatFormKhachHang = (key, value) => {
    setCustomerForm((current) => ({ ...current, [key]: value }));
    setCustomerSaveError('');
    setCustomerSaveMessage('');
  };

  const luuThongTinKhachHang = async () => {
    if (!selected || !customerHasChanges) return;
    setCustomerSaveError('');
    setCustomerSaveMessage('');
    const validationError = loiFormKhachHang(customerForm);
    if (validationError) {
      setCustomerSaveError(validationError);
      return;
    }

    setSavingCustomer(true);
    try {
      const response = await fetch(`${API}/phieu/${selected.MaDatCoc}/khach-hang`, {
        method: 'PATCH',
        headers: taoHeaderAPI(nguoiDung),
        body: JSON.stringify({ khachHang: chuanHoaFormKhachHang(customerForm) }),
      });
      const json = await response.json();
      if (!json.ok) throw new Error(json.error);
      const savedForm = { ...customerForm, ...json.data, CCCD: selected.CCCD };
      setCustomerForm(savedForm);
      setSavedCustomerForm(savedForm);
      setCustomerSaveMessage('Đã lưu thông tin khách hàng.');
      setSelected((current) => current ? { ...current, KhachHang: { ...current.KhachHang, ...json.data } } : current);
    } catch (err) {
      setCustomerSaveError(err.message);
    } finally {
      setSavingCustomer(false);
    }
  };

  const guiYeuCauXuLy = async (action, extra = {}) => {
    if (!selected) return;
    setActionError('');
    if (role === 'SALE' && customerHasChanges) {
      setActionError('Thông tin khách hàng đã thay đổi. Vui lòng bấm “Lưu thay đổi” trước khi tiếp tục.');
      return;
    }
    if (role === 'SALE' && !savedCustomerForm.ThoaDK) {
      setActionError('Lưu ý: Khách thuê bắt buộc phải đồng ý tuân thủ điều kiện thuê và nội quy ký túc xá.');
      return;
    }
    if (action === 'XAC_NHAN_THANH_TOAN') {
      if (paymentMethod === 'Chuyển khoản') {
        if (!transaction || !transaction.trim()) {
          setActionError('Vui lòng nhập mã giao dịch.');
          return;
        }
      } else {
        if (!cashConfirmed) {
          setActionError('Vui lòng xác nhận đã đếm và nhận đủ tiền mặt.');
          return;
        }
        if (cashAmount && (Number(cashAmount) <= 0 || Number.isNaN(Number(cashAmount)))) {
          setActionError('Số tiền thực nhận phải là một số dương.');
          return;
        }
      }
    }
    setBusy(true);
    try {
      const response = await fetch(`${API}/phieu/${selected.MaDatCoc}/hanh-dong`, {
        method: 'POST',
        headers: taoHeaderAPI(nguoiDung),
        body: JSON.stringify({
          hanhDong: action,
          ghiChu: note,
          maGiaoDich: transaction,
          hinhAnhDataUrl: evidence,
          hinhThucThanhToan: paymentMethod,
          soTienThucNhan: cashAmount || selected.SoTienCoc,
          xacNhanDaNhanTien: cashConfirmed,
          soTienCoc: depositAmount || suggested,
          ...extra,
        }),
      });
      const json = await response.json();
      if (!json.ok) throw new Error(json.error);
      const trangThaiMoi = maTrangThai(json.data?.TrangThai);
      setSelectedTab(layTabTheoTrangThai(role, trangThaiMoi));
      await taiDanhSachPhieu();
      await taiChiTietPhieu(selected.MaDatCoc);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const taiDanhSachPhongGiuong = () => {
    setRooms([]);
    setOverviewRoomLimit(10);
    setEditingSelection(false);
    setDangTaiHoSoTaoPhieu(false);
    setCreateError('');
    setCreateForm(taoFormTaoPhieuMacDinh());
    setShowCreate(true);
  };

  const thayDoiCCCDTaoPhieu = (value) => {
    const cccd = String(value || '').replace(/\D/g, '').slice(0, 12);
    setRooms([]);
    setCreateError('');
    setCreateForm(taoFormTaoPhieuMacDinh(cccd));
  };

  const suaLuaChonPhongGiuong = async () => {
    try {
      const response = await fetch(`${API}/phong-giuong-trong`, { headers: taoHeaderAPI(nguoiDung) });
      const json = await response.json();
      if (!json.ok) throw new Error(json.error);
      setRooms(json.data);
      setOverviewRoomLimit(10);
      setCreateForm({
        cccd: String(selected.CCCD),
        maYC: '',
        loaiThue: selected.LoaiThue,
        maLoaiPhong: '',
        tenLoaiPhong: '',
        soNguoiDuKien: 1,
        maPhong: '',
        maGiuongs: [],
        hoTen: selected.KhachHang?.HoTen || '',
        sdt: selected.KhachHang?.SDT || '',
        email: selected.KhachHang?.Email || '',
        diaChi: selected.KhachHang?.DiaChi || '',
        gioiTinh: selected.KhachHang?.GioiTinh || '',
        quocTich: selected.KhachHang?.QuocTich || 'Việt Nam',
        khaNangTaiChinh: selected.KhachHang?.KhaNangTaiChinh || '',
        thoiHanThue: selected.ThoiHanThue || 6
      });
      setEditingSelection(true);
      setCreateError('');
      setShowCreate(true);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (!showCreate || editingSelection) return undefined;
    if (!/^\d{6,12}$/.test(createForm.cccd)) {
      setDangTaiHoSoTaoPhieu(false);
      return undefined;
    }

    const controller = new AbortController();
    setDangTaiHoSoTaoPhieu(true);
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`${API}/ho-so-tao-phieu/${createForm.cccd}`, {
          headers: taoHeaderAPI(nguoiDung),
          signal: controller.signal,
        });
        const json = await response.json();
        if (!json.ok) throw new Error(json.error);
        const { khachHang, yeuCauThue, phong, maGiuongsMacDinh } = json.data;
        const thongTinLoaiPhong = yeuCauThue.ThongTinLoaiPhong || phong.ThongTinLoaiPhong || {};
        setRooms([phong]);
        setCreateForm((current) => ({
          ...current,
          cccd: dinhDangCCCD(khachHang.CCCD),
          maYC: yeuCauThue.MaYC,
          loaiThue: yeuCauThue.LoaiThue,
          maLoaiPhong: yeuCauThue.LoaiPhong,
          tenLoaiPhong: thongTinLoaiPhong.TenLoaiPhong || `Loại phòng #${yeuCauThue.LoaiPhong}`,
          soNguoiDuKien: Number(yeuCauThue.SoNguoiDuKien || 1),
          maPhong: String(phong.MaPhong),
          maGiuongs: (maGiuongsMacDinh || []).map(Number),
          hoTen: khachHang.HoTen || '',
          sdt: khachHang.SDT || '',
          email: khachHang.Email || '',
          diaChi: khachHang.DiaChi || '',
          gioiTinh: khachHang.GioiTinh || '',
          quocTich: khachHang.QuocTich || '',
          khaNangTaiChinh: khachHang.KhaNangTaiChinh ?? '',
          thoiHanThue: Number(yeuCauThue.ThoiHanThue || 6),
        }));
        setCreateError('');
      } catch (err) {
        if (err.name === 'AbortError') return;
        setRooms([]);
        setCreateForm((current) => taoFormTaoPhieuMacDinh(current.cccd));
        setCreateError(err.message || 'Không thể tải thông tin khách hàng');
      } finally {
        if (!controller.signal.aborted) setDangTaiHoSoTaoPhieu(false);
      }
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [showCreate, editingSelection, createForm.cccd, nguoiDung?.maNV, role]);

  const genderCompatibleRooms = useMemo(() => rooms
    .map((roomItem) => {
      if (!phongPhuHopGioiTinh(roomItem, createForm.gioiTinh)) return null;
      const wholeRoomAvailable = roomItem.Giuong.length === Number(roomItem.SucChuaToiDa || roomItem.Giuong.length)
        && roomItem.Giuong.every((bed) => bed.TinhTrang && !bed.dangKhoa);
      if (createForm.loaiThue === 'Thuê nguyên phòng' && !wholeRoomAvailable) return null;
      return roomItem;
    })
    .filter((roomItem) => roomItem && roomItem.Giuong.some((bed) => bed.TinhTrang && !bed.dangKhoa)), [rooms, createForm.gioiTinh, createForm.loaiThue]);
  const selectedCreateRoom = genderCompatibleRooms.find((item) => String(item.MaPhong) === String(createForm.maPhong));
  const overviewRooms = useMemo(() => {
    const selectedRoomId = String(createForm.maPhong || '');
    const sortedRooms = [...genderCompatibleRooms].sort((left, right) => {
      const leftAvailable = left.Giuong.filter((bed) => bed.TinhTrang && !bed.dangKhoa).length;
      const rightAvailable = right.Giuong.filter((bed) => bed.TinhTrang && !bed.dangKhoa).length;
      if (Boolean(rightAvailable) !== Boolean(leftAvailable)) return rightAvailable ? 1 : -1;
      if (rightAvailable !== leftAvailable) return rightAvailable - leftAvailable;
      return Number(left.MaPhong) - Number(right.MaPhong);
    });
    const selectedRoom = sortedRooms.find((item) => String(item.MaPhong) === selectedRoomId);
    const remainingRooms = selectedRoom
      ? sortedRooms.filter((item) => String(item.MaPhong) !== selectedRoomId)
      : sortedRooms;
    return (selectedRoom ? [selectedRoom, ...remainingRooms] : remainingRooms).slice(0, overviewRoomLimit);
  }, [genderCompatibleRooms, createForm.maPhong, overviewRoomLimit]);

  const taoPhieuDatCoc = async () => {
    const roomData = selectedCreateRoom;
    setCreateError('');
    if (!/^\d{6,12}$/.test(createForm.cccd)) {
      return setCreateError('Số CCCD/Hộ chiếu phải chứa từ 6 đến 12 chữ số.');
    }
    if (!createForm.maYC || !roomData) return setCreateError('Chưa tải đủ yêu cầu thuê và phòng đã chọn của khách hàng.');
    if (!createForm.maGiuongs.length) return setCreateError('Phiếu phải có ít nhất một giường.');
    if (createForm.loaiThue === 'Thuê giường lẻ' && createForm.maGiuongs.length < Number(createForm.soNguoiDuKien || 1)) {
      return setCreateError(`Vui lòng chọn ít nhất ${createForm.soNguoiDuKien} giường theo số người dự kiến.`);
    }
    setBusy(true);
    try {
      const response = await fetch(`${API}/phieu`, {
        method: 'POST',
        headers: taoHeaderAPI(nguoiDung),
        body: JSON.stringify({
          cccd: createForm.cccd,
          maYC: createForm.maYC,
          maGiuongs: createForm.maGiuongs,
        }),
      });
      const json = await response.json();
      if (!json.ok) throw new Error(json.error);
      setShowCreate(false);
      setSelectedTab('KHAO_SAT');
      setRooms([]);
      setCreateForm(taoFormTaoPhieuMacDinh());
      await taiDanhSachPhieu();
      await taiChiTietPhieu(json.data.MaDatCoc);
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const luuLuaChonPhongGiuongMoi = async () => {
    if (!selectedCreateRoom || !createForm.maGiuongs.length) return setCreateError('Vui lòng chọn phòng và giường mới');
    setShowCreate(false);
    await guiYeuCauXuLy('GUI_KIEM_TRA', {
      maGiuongs: createForm.maGiuongs,
      maPhong: Number(createForm.maPhong),
      maCN: selectedCreateRoom.MaCN,
    });
  };

  const xuLyAnhChungTu = (file) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return setActionError('Ảnh chứng từ tối đa 2 megabyte');
    const reader = new FileReader();
    reader.onload = () => setEvidence(String(reader.result));
    reader.readAsDataURL(file);
  };
  const guiChungTuThanhToan = () => guiYeuCauXuLy('XAC_NHAN_THANH_TOAN');
  const money = dinhDangTien;
  const dateTime = dinhDangNgayGio;
  const remaining = tinhThoiGianConLai;
  const loadRooms = taiDanhSachPhongGiuong;
  const editSelection = suaLuaChonPhongGiuong;
  const createDeposit = taoPhieuDatCoc;
  const saveNewSelection = luuLuaChonPhongGiuongMoi;
  const saveCustomerInfo = luuThongTinKhachHang;

  const primaryAction = selected ? layHanhDongChoVaiTro(role, selected.TrangThai) : null;
  const nextStep = selected ? NEXT_STEP[role]?.[selected.TrangThai] : null;
  const latestProof = selected?.chungTu?.[0] || null;

  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        if (!locTheoTab(item, selectedTab, role)) return false;
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim();
          const hoTen = (item.KhachHang?.HoTen || '').toLowerCase();
          const cccd = String(item.CCCD || '');
          const phone = (item.KhachHang?.SDT || '');
          const maPhong = String(item.MaPhong || '');
          return hoTen.includes(query) || cccd.includes(query) || phone.includes(query) || maPhong.includes(query);
        }
        return true;
      })
      .sort((itemA, itemB) => {
        const ngayTaoA = chuyenThanhNgay(itemA.ThoiDiemTao)?.getTime() || 0;
        const ngayTaoB = chuyenThanhNgay(itemB.ThoiDiemTao)?.getTime() || 0;
        if (ngayTaoA !== ngayTaoB) return ngayTaoB - ngayTaoA;
        return Number(itemB.MaDatCoc || 0) - Number(itemA.MaDatCoc || 0);
      });
  }, [items, selectedTab, role, searchQuery]);

  return (
    <KhungNhanVien nguoiDung={nguoiDung} dangXuat={dangXuat}>
      <style>{`
        .d-workflow-page {
          max-width: 1440px;
          margin: 0 auto;
          padding: 32px 24px;
          font-family: inherit;
          color: #1e293b;
          background: #f8fafc;
          min-height: 100vh;
        }

        .d-workflow-page button,
        .d-workflow-page input,
        .d-workflow-page select,
        .d-workflow-page textarea {
          font-family: inherit;
        }
        
        .d-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
          background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
          padding: 28px 36px;
          border-radius: 20px;
          border: 1px solid #fed7aa;
          box-shadow: 0 10px 25px -5px rgba(242, 106, 33, 0.08);
        }
        .d-header-title h1 {
          font-size: 28px;
          font-weight: 850;
          color: #0f172a;
          margin: 0;
          letter-spacing: -0.8px;
        }
        
        .d-toolbar {
          display: flex;
          gap: 20px;
          align-items: center;
          margin-bottom: 24px;
          background: #ffffff;
          padding: 16px 24px;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 15px -3px rgba(15, 23, 42, 0.03);
        }
        
        .d-tabs {
          display: flex;
          background: #f1f5f9;
          padding: 6px;
          border-radius: 12px;
          gap: 6px;
        }
        .d-tabs button {
          border: none;
          padding: 10px 20px;
          border-radius: 10px;
          font-size: 13.5px;
          font-weight: 700;
          color: #64748b;
          background: transparent;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .d-tabs button.active {
          background: #ffffff;
          color: #f26a21;
          box-shadow: 0 4px 10px rgba(242, 106, 33, 0.08), 0 1px 3px rgba(0, 0, 0, 0.03);
        }
        .d-tabs button:hover:not(.active) {
          color: #0f172a;
          background: rgba(226, 232, 240, 0.5);
        }
        
        .d-search-bar {
          display: flex;
          align-items: center;
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          padding: 0 16px;
          height: 44px;
          width: 320px;
          transition: all 0.2s;
        }
        .d-search-bar:focus-within {
          border-color: #f26a21;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(242, 106, 33, 0.15);
        }
        .d-search-bar span {
          color: #94a3b8;
          margin-right: 10px;
          font-size: 22px;
        }
        .d-search-bar input {
          border: none;
          outline: none;
          font-size: 14px;
          width: 100%;
          color: #1e293b;
          background: transparent;
        }
        
        .d-tooltip-wrap {
          position: relative;
          display: inline-flex;
          flex: 0 0 auto;
        }
        .d-tooltip-wrap::after {
          position: absolute;
          left: 50%;
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          z-index: 1000;
          transition: opacity 0.15s ease, transform 0.15s ease, visibility 0.15s ease;
        }
        .d-tooltip-wrap::after {
          content: attr(data-tooltip);
          top: calc(100% + 7px);
          padding: 5px 8px;
          border: 1px solid #dbe4ee;
          border-radius: 6px;
          background: #ffffff;
          color: #475569;
          box-shadow: 0 3px 10px rgba(15, 23, 42, 0.1);
          font-size: 11.5px;
          font-weight: 600;
          line-height: 1.3;
          white-space: nowrap;
          transform: translate(-50%, -2px);
        }
        .d-tooltip-wrap:hover::after,
        .d-tooltip-wrap:focus-within::after {
          opacity: 1;
          visibility: visible;
          transform: translate(-50%, 0);
        }
        .d-card-tooltip {
          display: block;
          width: 100%;
          z-index: 1;
        }
        .d-card-tooltip:hover,
        .d-card-tooltip:focus-within {
          z-index: 5;
        }
        .d-card-tooltip::after {
          top: auto;
          bottom: calc(100% + 5px);
        }
        .d-card-tooltip:first-of-type::after {
          top: calc(100% + 5px);
          bottom: auto;
        }

        .d-refresh-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          width: 44px;
          height: 44px;
          cursor: pointer;
          color: #64748b;
          transition: all 0.2s;
        }
        .d-refresh-btn:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #f26a21;
          transform: rotate(45deg);
        }
        
        .d-main-layout {
          display: grid;
          grid-template-columns: 460px 1fr;
          gap: 28px;
          align-items: start;
        }
        
        .d-sidebar-list {
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 16px 16px 52px;
          max-height: 850px;
          overflow-y: auto;
          box-shadow: inset 0 2px 4px rgba(15, 23, 42, 0.03);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .d-card-item {
          --status-color: #64748b;
          --status-background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%);
          --status-shadow: rgba(100, 116, 139, 0.18);
          width: 100%;
          display: flex;
          align-items: center;
          padding: 18px 20px;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          background: var(--status-background);
          text-align: left;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          outline: none;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.01), 0 2px 4px -1px rgba(0, 0, 0, 0.01);
        }
        .d-card-item::before {
          content: '';
          position: absolute;
          left: 0;
          top: 16px;
          bottom: 16px;
          width: 4px;
          background: var(--status-color);
          border-radius: 0 6px 6px 0;
        }
        .d-card-item:hover {
          border-color: var(--status-color);
          background: var(--status-background);
          transform: translateY(-2px);
          box-shadow: 0 10px 18px -5px var(--status-shadow);
        }
        .d-card-item.active {
          border-color: var(--status-color);
          background: var(--status-background);
          transform: translateX(4px) scale(1.01);
          filter: saturate(1.08);
          box-shadow: 0 0 0 3px var(--status-shadow), 0 14px 28px -8px var(--status-shadow);
          z-index: 2;
        }
        .d-card-item.active:hover {
          transform: translateX(4px) scale(1.01);
        }
        .d-card-item.active::before {
          top: 12px;
          bottom: 12px;
          width: 5px;
        }
        
        .d-card-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          margin-right: 16px;
          flex-shrink: 0;
          background: var(--status-color);
          box-shadow: 0 0 0 4px rgba(226, 232, 240, 0.5);
        }
        .d-card-item.active .d-card-dot {
          box-shadow: 0 0 0 4px var(--status-shadow);
        }

        .d-card-item.status-MOI { --status-color: #dc2626; --status-background: linear-gradient(135deg, #fff7f7 0%, #fee2e2 100%); --status-shadow: rgba(220, 38, 38, 0.20); }
        .d-card-item.status-CHO_KIEM_TRA_PHONG { --status-color: #c2410c; --status-background: linear-gradient(135deg, #fffaf5 0%, #ffedd5 100%); --status-shadow: rgba(194, 65, 12, 0.20); }
        .d-card-item.status-HET_CHO { --status-color: #be123c; --status-background: linear-gradient(135deg, #fff7f8 0%, #ffe4e6 100%); --status-shadow: rgba(190, 18, 60, 0.20); }
        .d-card-item.status-CON_TRONG_CHO_GUI_KE_TOAN { --status-color: #1d4ed8; --status-background: linear-gradient(135deg, #f8fbff 0%, #dbeafe 100%); --status-shadow: rgba(29, 78, 216, 0.20); }
        .d-card-item.status-CHO_TINH_COC { --status-color: #7e22ce; --status-background: linear-gradient(135deg, #fdfaff 0%, #f3e8ff 100%); --status-shadow: rgba(126, 34, 206, 0.20); }
        .d-card-item.status-CHO_THANH_TOAN { --status-color: #0284c7; --status-background: linear-gradient(135deg, #f7fcff 0%, #e0f2fe 100%); --status-shadow: rgba(2, 132, 199, 0.20); }
        .d-card-item.status-QUA_HAN_TU_DONG_HUY { --status-color: #9f1239; --status-background: linear-gradient(135deg, #fff8fa 0%, #ffe4e6 100%); --status-shadow: rgba(159, 18, 57, 0.20); }
        .d-card-item.status-CHO_XAC_NHAN_THANH_TOAN { --status-color: #be185d; --status-background: linear-gradient(135deg, #fff8fc 0%, #fce7f3 100%); --status-shadow: rgba(190, 24, 93, 0.20); }
        .d-card-item.status-DA_XAC_NHAN { --status-color: #047857; --status-background: linear-gradient(135deg, #f7fffb 0%, #d1fae5 100%); --status-shadow: rgba(4, 120, 87, 0.20); }
        .d-card-item.status-TU_CHOI_CHUNG_TU { --status-color: #b45309; --status-background: linear-gradient(135deg, #fffdf7 0%, #fef3c7 100%); --status-shadow: rgba(180, 83, 9, 0.20); }
        .d-card-item.status-CHO_KIEM_TRA { --status-color: #0f766e; --status-background: linear-gradient(135deg, #f7fffd 0%, #ccfbf1 100%); --status-shadow: rgba(15, 118, 110, 0.20); }
        .d-card-item.status-CHO_LAP_HOP_DONG { --status-color: #4338ca; --status-background: linear-gradient(135deg, #fafaff 0%, #e0e7ff 100%); --status-shadow: rgba(67, 56, 202, 0.20); }
        .d-card-item.status-CHO_LAP_HOP_DONG_DIEU_CHINH { --status-color: #7c3aed; --status-background: linear-gradient(135deg, #fdfaff 0%, #ede9fe 100%); --status-shadow: rgba(124, 58, 237, 0.20); }
        .d-card-item.status-CHO_HOAN_COC { --status-color: #b45309; --status-background: linear-gradient(135deg, #fffdf7 0%, #fef3c7 100%); --status-shadow: rgba(180, 83, 9, 0.20); }
        .d-card-item.status-CHO_THANH_TOAN_HOP_DONG { --status-color: #0891b2; --status-background: linear-gradient(135deg, #f7feff 0%, #cffafe 100%); --status-shadow: rgba(8, 145, 178, 0.20); }
        .d-card-item.status-CHO_THANH_TOAN_THEM { --status-color: #c026d3; --status-background: linear-gradient(135deg, #fff9ff 0%, #fae8ff 100%); --status-shadow: rgba(192, 38, 211, 0.20); }
        .d-card-item.status-CHO_DOI_SOAT { --status-color: #475569; --status-background: linear-gradient(135deg, #fbfcfd 0%, #e2e8f0 100%); --status-shadow: rgba(71, 85, 105, 0.20); }
        .d-card-item.status-CHO_XAC_NHAN_DOI_SOAT { --status-color: #4f46e5; --status-background: linear-gradient(135deg, #fafaff 0%, #e0e7ff 100%); --status-shadow: rgba(79, 70, 229, 0.20); }
        .d-card-item.status-CHO_THANH_LY { --status-color: #92400e; --status-background: linear-gradient(135deg, #fffdf8 0%, #ffedd5 100%); --status-shadow: rgba(146, 64, 14, 0.20); }
        .d-card-item.status-DA_THANH_LY { --status-color: #166534; --status-background: linear-gradient(135deg, #f8fff9 0%, #dcfce7 100%); --status-shadow: rgba(22, 101, 52, 0.20); }
        .d-card-item.status-KHAC { --status-color: #64748b; --status-background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%); --status-shadow: rgba(100, 116, 139, 0.20); }
        
        .d-badge {
          font-size: 11px;
          font-weight: 850;
          padding: 6px 12px;
          border-radius: 30px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .d-badge-MOI { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
        .d-badge-CHO_KIEM_TRA_PHONG { background: #fff7ed; color: #c2410c; border: 1px solid #ffedd5; }
        .d-badge-HET_CHO { background: #fef2f2; color: #dc2626; border: 1px solid #fee2e2; }
        .d-badge-CON_TRONG_CHO_GUI_KE_TOAN { background: #eff6ff; color: #1d4ed8; border: 1px solid #dbeafe; }
        .d-badge-CHO_TINH_COC { background: #faf5ff; color: #7e22ce; border: 1px solid #f3e8ff; }
        .d-badge-CHO_THANH_TOAN { background: #f0f9ff; color: #0369a1; border: 1px solid #bae6fd; }
        .d-badge-QUA_HAN_TU_DONG_HUY { background: #fff1f2; color: #9f1239; border: 1px solid #fecdd3; }
        .d-badge-CHO_XAC_NHAN_THANH_TOAN { background: #fdf2f8; color: #be185d; border: 1px solid #fce7f3; }
        .d-badge-DA_XAC_NHAN { background: #ecfdf5; color: #047857; border: 1px solid #d1fae5; }
        .d-badge-TU_CHOI_CHUNG_TU { background: #fffbeb; color: #b45309; border: 1px solid #fef3c7; }
        .d-badge-CHO_KIEM_TRA { background: #f0fdfa; color: #0f766e; border: 1px solid #99f6e4; }
        .d-badge-CHO_LAP_HOP_DONG { background: #eef2ff; color: #4338ca; border: 1px solid #c7d2fe; }
        .d-badge-CHO_LAP_HOP_DONG_DIEU_CHINH { background: #f5f3ff; color: #7c3aed; border: 1px solid #ddd6fe; }
        .d-badge-CHO_HOAN_COC { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; }
        .d-badge-CHO_THANH_TOAN_HOP_DONG { background: #ecfeff; color: #0e7490; border: 1px solid #a5f3fc; }
        .d-badge-CHO_THANH_TOAN_THEM { background: #fdf4ff; color: #a21caf; border: 1px solid #f5d0fe; }
        .d-badge-CHO_DOI_SOAT { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
        .d-badge-CHO_XAC_NHAN_DOI_SOAT { background: #eef2ff; color: #4f46e5; border: 1px solid #c7d2fe; }
        .d-badge-CHO_THANH_LY { background: #fff7ed; color: #92400e; border: 1px solid #fed7aa; }
        .d-badge-DA_THANH_LY { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
        .d-badge-KHAC { background: #f8fafc; color: #64748b; border: 1px solid #cbd5e1; }

        .d-card-dot-MOI { background: #dc2626; }
        .d-card-dot-CHO_KIEM_TRA_PHONG { background: #c2410c; }
        .d-card-dot-HET_CHO { background: #dc2626; }
        .d-card-dot-CON_TRONG_CHO_GUI_KE_TOAN { background: #1d4ed8; }
        .d-card-dot-CHO_TINH_COC { background: #7e22ce; }
        .d-card-dot-CHO_THANH_TOAN { background: #0284c7; }
        .d-card-dot-QUA_HAN_TU_DONG_HUY { background: #9f1239; }
        .d-card-dot-CHO_XAC_NHAN_THANH_TOAN { background: #be185d; }
        .d-card-dot-DA_XAC_NHAN { background: #047857; }
        .d-card-dot-TU_CHOI_CHUNG_TU { background: #b45309; }
        .d-card-dot-CHO_KIEM_TRA { background: #0f766e; }
        .d-card-dot-CHO_LAP_HOP_DONG { background: #4338ca; }
        .d-card-dot-CHO_LAP_HOP_DONG_DIEU_CHINH { background: #7c3aed; }
        .d-card-dot-CHO_HOAN_COC { background: #b45309; }
        .d-card-dot-CHO_THANH_TOAN_HOP_DONG { background: #0891b2; }
        .d-card-dot-CHO_THANH_TOAN_THEM { background: #c026d3; }
        .d-card-dot-CHO_DOI_SOAT { background: #475569; }
        .d-card-dot-CHO_XAC_NHAN_DOI_SOAT { background: #4f46e5; }
        .d-card-dot-CHO_THANH_LY { background: #92400e; }
        .d-card-dot-DA_THANH_LY { background: #166534; }
        .d-card-dot-KHAC { background: #64748b; }

        .d-detail-panel {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 32px;
          min-height: 500px;
          box-shadow: 0 4px 15px -3px rgba(15, 23, 42, 0.03);
        }
        
        .d-detail-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 100px 40px;
          color: #94a3b8;
        }
        .d-detail-empty span {
          font-size: 64px;
          color: #e2e8f0;
          margin-bottom: 20px;
          background: #f8fafc;
          padding: 24px;
          border-radius: 50%;
          border: 1px solid #f1f5f9;
        }
        .d-detail-empty h3 {
          font-size: 18px;
          color: #475569;
          font-weight: 800;
          margin: 0 0 8px 0;
        }
        .d-detail-empty p {
          margin: 0;
          font-size: 14.5px;
          color: #94a3b8;
          max-width: 320px;
        }
        
        .d-detail-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 20px;
          margin-bottom: 24px;
        }
        .d-detail-header small {
          font-size: 11px;
          font-weight: 850;
          color: #94a3b8;
          letter-spacing: 1px;
          display: block;
          margin-bottom: 6px;
        }
        .d-detail-header h2 {
          font-size: 22px;
          font-weight: 850;
          color: #0f172a;
          margin: 0;
        }
        
        .d-section-card {
          border: 1px solid #e2e8f0;
          border-left: 4px solid #cbd5e1;
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
          background: #ffffff;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.01);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .d-section-card:hover {
          border-left-color: #f26a21;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.02);
        }
        
        .d-section-card h3 {
          font-size: 15px;
          font-weight: 850;
          margin: 0 0 18px 0;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          border-bottom: 1px solid #f8fafc;
          padding-bottom: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #334155;
          transition: color 0.2s;
        }
        .d-section-card:hover h3 {
          color: #f26a21;
        }
        
        .d-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .d-field-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .d-field-group span {
          font-size: 13px;
          font-weight: 750;
          color: #475569;
        }
        .d-field-group input, .d-field-group select {
          height: 44px;
          border: 1.5px solid #cbd5e1;
          border-radius: 10px;
          padding: 0 14px;
          font-size: 14px;
          color: #1e293b;
          outline: none;
          transition: all 0.2s;
          background: #ffffff;
        }
        .d-field-group input:focus, .d-field-group select:focus {
          border-color: #f26a21;
          box-shadow: 0 0 0 4px rgba(242, 106, 33, 0.15);
        }
        .d-field-group input::placeholder {
          color: #94a3b8;
        }
        .d-field-group input[readonly] {
          background: #f8fafc;
          color: #334155;
          cursor: default;
        }
        .d-field-group input[readonly]:focus {
          border-color: #cbd5e1;
          box-shadow: none;
        }
        
        .d-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 18px;
        }
        .d-info-block dt {
          font-size: 12px;
          color: #94a3b8;
          margin-bottom: 6px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .d-info-block dd {
          font-size: 14px;
          color: #1e293b;
          font-weight: 700;
          margin: 0;
        }
        
        .d-action-block {
          background: #fff8f5;
          border: 1.5px solid #ffedd5;
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 4px 10px rgba(242, 106, 33, 0.04);
        }
        .d-action-icon {
          font-size: 32px;
          color: #f26a21;
          background: #ffedd5;
          width: 56px;
          height: 56px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(242, 106, 33, 0.1);
        }
        .d-action-content {
          flex: 1;
        }
        .d-action-content small {
          font-size: 11px;
          font-weight: 850;
          color: #ea580c;
          letter-spacing: 0.8px;
          display: block;
        }
        .d-action-content strong {
          font-size: 14.5px;
          color: #451a03;
          display: block;
          margin-top: 4px;
          line-height: 1.4;
          font-weight: 700;
        }
        
        .d-countdown-card {
          background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
          border: none;
          color: #ffffff;
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 10px 20px rgba(239, 68, 68, 0.15);
          animation: pulseRed 2s infinite alternate;
        }
        @keyframes pulseRed {
          0% { box-shadow: 0 10px 20px rgba(239, 68, 68, 0.15); }
          100% { box-shadow: 0 10px 20px rgba(239, 68, 68, 0.3); }
        }
        .d-countdown-card span {
          font-size: 32px;
          color: #fca5a5;
        }
        .d-countdown-card div {
          display: flex;
          flex-direction: column;
        }
        .d-countdown-card small {
          font-size: 11px;
          text-transform: uppercase;
          font-weight: 800;
          letter-spacing: 0.5px;
          color: #fee2e2;
        }
        .d-countdown-card strong {
          font-size: 24px;
          font-family: monospace;
          font-weight: 900;
          letter-spacing: 0.5px;
        }

        .d-success-confirmed-card {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border: none;
          color: #ffffff;
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 10px 20px rgba(16, 115, 81, 0.15);
        }
        .d-success-confirmed-card span {
          font-size: 32px;
          color: #a7f3d0;
        }
        .d-success-confirmed-card div {
          display: flex;
          flex-direction: column;
        }
        .d-success-confirmed-card small {
          font-size: 11px;
          text-transform: uppercase;
          font-weight: 800;
          color: #d1fae5;
          letter-spacing: 0.5px;
        }
        .d-success-confirmed-card strong {
          font-size: 15.5px;
          font-weight: 800;
        }

        .d-btn-primary {
          background: linear-gradient(135deg, #ff7e40 0%, #f26a21 100%);
          color: #ffffff;
          border: none;
          font-size: 14px;
          font-weight: 800;
          padding: 12px 24px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          display: inline-flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 12px rgba(242, 106, 33, 0.2);
        }
        .d-btn-primary:hover {
          background: linear-gradient(135deg, #f26a21 0%, #e05613 100%);
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(242, 106, 33, 0.3);
        }
        .d-btn-primary:disabled {
          background: #cbd5e1;
          color: #94a3b8;
          cursor: not-allowed;
          box-shadow: none;
          transform: none;
        }
        .d-btn-outline {
          background: #ffffff;
          color: #64748b;
          border: 1.5px solid #cbd5e1;
          font-size: 14px;
          font-weight: 800;
          padding: 11px 22px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .d-btn-outline:hover {
          background: #f8fafc;
          border-color: #94a3b8;
          color: #0f172a;
        }
        .d-btn-danger {
          border-color: #fca5a5;
          color: #dc2626;
        }
        .d-btn-danger:hover {
          background: #fef2f2;
          border-color: #ef4444;
        }

        .d-btn-group {
          display: flex;
          gap: 16px;
          justify-content: flex-end;
          margin-top: 24px;
          border-top: 1px solid #f1f5f9;
          padding-top: 24px;
        }
        
        .d-formula-box {
          background: #fff7ed;
          border: 1px solid #ffedd5;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .d-formula-box span {
          font-size: 13.5px;
          color: #ea580c;
          font-weight: 700;
        }
        .d-formula-box strong {
          font-size: 17px;
          color: #c2410c;
          font-weight: 800;
        }

        .d-total-box {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 0 0 0;
          border-top: 1px dashed #e2e8f0;
        }
        .d-total-box span {
          font-size: 14.5px;
          font-weight: 800;
          color: #475569;
        }
        .d-total-box strong {
          font-size: 22px;
          color: #f26a21;
          font-weight: 900;
        }

        .d-history {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-top: 14px;
        }
        .d-history-item {
          display: flex;
          align-items: flex-start;
          position: relative;
          padding-left: 24px;
        }
        .d-history-item::before {
          content: '';
          position: absolute;
          left: 0;
          top: 6px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #cbd5e1;
          border: 2px solid #ffffff;
          box-shadow: 0 0 0 2px #cbd5e1;
          z-index: 2;
        }
        .d-history-item.active::before {
          background: #f26a21;
          box-shadow: 0 0 0 2px #f26a21;
        }
        .d-history-item:not(:last-child)::after {
          content: '';
          position: absolute;
          left: 5px;
          top: 16px;
          bottom: -16px;
          width: 2px;
          background: #e2e8f0;
          z-index: 1;
        }
        .d-history-item p {
          margin: 0;
          font-size: 13.5px;
          line-height: 1.5;
          font-weight: 700;
          color: #334155;
        }
        .d-history-item small {
          display: block;
          font-size: 11.5px;
          color: #94a3b8;
          margin-top: 4px;
          font-weight: 600;
        }

        .d-payment-toggle-group {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
        }
        .d-payment-toggle-btn {
          flex: 1;
          height: 48px;
          border-radius: 12px;
          border: 1.5px solid #e2e8f0;
          background: #ffffff;
          color: #64748b;
          font-weight: 800;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
        }
        .d-payment-toggle-btn.active {
          border-color: #f26a21;
          background: #fff8f5;
          color: #f26a21;
          box-shadow: 0 4px 12px rgba(242, 106, 33, 0.05);
        }

        .d-upload-box {
          border: 2px dashed #cbd5e1;
          border-radius: 12px;
          padding: 24px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          color: #64748b;
          position: relative;
          background: #f8fafc;
        }
        .d-upload-box:hover {
          border-color: #f26a21;
          background: #fff8f5;
          color: #f26a21;
        }
        .d-upload-box input {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
        }
        .d-proof-preview {
          margin-top: 16px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
          position: relative;
        }
        .d-proof-preview img {
          max-width: 100%;
          max-height: 220px;
          display: block;
          object-fit: contain;
          margin: 0 auto;
        }
        
        .d-room-card {
          display: flex;
          align-items: center;
          gap: 16px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 16px 20px;
          border-radius: 12px;
        }
        .d-room-card span {
          font-size: 32px;
          color: #64748b;
        }
        .d-room-card strong {
          font-size: 15px;
          color: #0f172a;
          font-weight: 800;
        }
        .d-room-card p {
          margin: 4px 0 0 0;
          font-size: 13px;
          color: #64748b;
          font-weight: 500;
        }
      `}</style>

      <div className="d-workflow-page">
        <header className="d-header">
          <div className="d-header-title">
            <p style={{ margin: 0, fontSize: '11px', fontWeight: 'bold', letterSpacing: '1.2px', textTransform: 'uppercase', color: '#f26a21' }}>QUY TRÌNH THUÊ DORM</p>
            <h1>Quản lý phiếu đặt cọc</h1>
          </div>
          {role === 'SALE' && (
            <button type="button" className="d-btn-primary" onClick={loadRooms}>
              <span className="material-symbols-outlined">add</span>Tạo phiếu đặt cọc mới
            </button>
          )}
        </header>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '16px 20px', borderRadius: '12px', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', fontSize: '14px', fontWeight: '700' }}>
            <span className="material-symbols-outlined">error</span>
            {error}
          </div>
        )}

        <div className="d-toolbar">
          <div className="d-tabs">
            {ROLE_TABS[role].map((tab) => (
              <button
                type="button"
                className={selectedTab === tab.key ? 'active' : ''}
                key={tab.key}
                onClick={() => {
                  setSelectedTab(tab.key);
                  setSearchQuery('');
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="d-search-bar" style={{ marginLeft: 'auto' }}>
            <span className="material-symbols-outlined">search</span>
            <input
              type="text"
              placeholder="Tìm khách thuê, số phòng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <span className="d-tooltip-wrap" data-tooltip="Làm mới">
            <button type="button" className="d-refresh-btn" aria-label="Làm mới" onClick={taiDanhSachPhieu}>
              <span className="material-symbols-outlined">refresh</span>
            </button>
          </span>
        </div>

        <div className="d-main-layout">
          <DanhSachPhieuDatCoc
            filteredItems={filteredItems}
            loading={loading}
            selected={selected}
            taiChiTietPhieu={taiChiTietPhieu}
            dateTime={dateTime}
          />

          <aside className="d-detail-panel">
            {!selected ? (
              <div className="d-detail-empty">
                <span className="material-symbols-outlined">assignment</span>
                <h3>Chưa chọn phiếu đặt cọc</h3>
                <p>Vui lòng click chọn một phiếu trong danh sách bên trái để xem đầy đủ chi tiết và thực hiện xử lý bước tiếp theo.</p>
              </div>
            ) : (
              <>
                <div className="d-detail-header">
                  <div>
                    <small>QUY TRÌNH XỬ LÝ PHIẾU ĐẶT CỌC</small>
                    <h2>Khách hàng: {selected.KhachHang?.HoTen || 'Chưa cập nhật họ tên'}</h2>
                  </div>
                  <span className={`d-badge d-badge-${maMauTrangThai(selected.TrangThai)}`} style={{ fontSize: '12px', padding: '8px 16px' }}>
                    {LABELS[selected.TrangThai] || selected.TrangThai}
                  </span>
                </div>

                {/* Top Info Banner containing General Metadata */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mã phiếu đặt cọc</span>
                    <strong style={{ fontSize: '15px', color: '#0f172a', fontWeight: '800' }}>#{selected.MaDatCoc}</strong>
                  </div>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nhân viên Sale phụ trách</span>
                    <strong style={{ fontSize: '15px', color: '#0f172a', fontWeight: '800' }}>{selected.NhanVienSale?.HoTen || `Nhân viên #${selected.NVSale || '—'}`}</strong>
                  </div>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Chi nhánh homestay</span>
                    <strong style={{ fontSize: '15px', color: '#0f172a', fontWeight: '800' }}>{selected.ChiNhanh?.TenCN || 'Chưa cập nhật'}</strong>
                  </div>
                </div>

                {/* Countdown if waiting for payment */}
                {selected.TrangThai === 'CHO_THANH_TOAN' && (
                  <div className="d-countdown-card">
                    <span className="material-symbols-outlined">timer</span>
                    <div>
                      <small>Thời hạn thanh toán còn lại (Tối đa 24 giờ)</small>
                      <strong>{remaining(selected.HanThanhToan, now)}</strong>
                    </div>
                  </div>
                )}

                {/* Success Details confirmed */}
                {selected.TrangThai === 'DA_XAC_NHAN' && selected.DatCocThanhCong && (
                  <div className="d-success-confirmed-card">
                    <span className="material-symbols-outlined">verified</span>
                    <div>
                      <small>Đã nhận thanh toán và Xác nhận giữ chỗ thành công</small>
                      <strong>Thời điểm đặt cọc thành công: {dateTime(selected.DatCocThanhCong)}</strong>
                    </div>
                  </div>
                )}

                {/* Next steps prompt */}
                {nextStep && (
                  <div className="d-action-block" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', gap: '6px', background: '#fff7ed', borderLeft: '4px solid #ea580c', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
                    <small style={{ fontSize: '11px', fontWeight: '850', color: '#c2410c', textTransform: 'uppercase', letterSpacing: '0.5px' }}>THAO TÁC TIẾP THEO</small>
                    <strong style={{ fontSize: '14.5px', color: '#7c2d12', fontWeight: '750', lineHeight: '1.4' }}>{nextStep[1]}</strong>
                  </div>
                )}

                {/* Manager text input notes */}
                {role === 'QUAN_LY' && ['CHO_KIEM_TRA_PHONG', 'CHO_XAC_NHAN_THANH_TOAN'].includes(selected.TrangThai) && (
                  <div className="d-section-card" style={{ background: '#f8fafc', borderLeftColor: '#f26a21' }}>
                    <div className="d-field-group">
                      <span style={{ fontWeight: 'bold', color: '#f26a21' }}>LÝ DO HOẶC GHI CHÚ XỬ LÝ (BẮT BUỘC KHI TỪ CHỐI HOẶC BÁO HẾT CHỖ)</span>
                      <textarea
                        rows="2"
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        placeholder="Nhập lý do chi tiết..."
                        style={{ border: '1.5px solid #cbd5e1', borderRadius: '10px', padding: '12px', fontSize: '14px', outline: 'none', resize: 'vertical', width: '100%', minHeight: '60px' }}
                      />
                    </div>
                  </div>
                )}

                {/* Manager Verification of receipts */}
                {role === 'QUAN_LY' && selected.TrangThai === 'CHO_XAC_NHAN_THANH_TOAN' && (
                  <div className="d-section-card d-card-proof">
                    <h3>Đối chiếu chứng từ thanh toán</h3>
                    {!latestProof ? (
                      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#b45309', padding: '14px', borderRadius: '12px', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700' }}>
                        <span className="material-symbols-outlined">warning</span> Không tìm thấy chứng từ giao dịch được gửi lên.
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: latestProof.HinhAnhDataUrl ? '1.2fr 1fr' : '1fr', gap: '20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Hình thức thanh toán:</span>
                            <strong style={{ fontSize: '14px', fontWeight: '700' }}>{['Tiền mặt', 'TIEN_MAT'].includes(latestProof.LoaiThanhToan) ? 'Tiền mặt' : 'Chuyển khoản ngân hàng'}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Mã phiếu thu:</span>
                            <strong style={{ fontSize: '14px', color: '#0f172a', fontWeight: '750' }}>{latestProof.MaPhieuThu || 'Chưa có mã'}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Mã giao dịch ngân hàng:</span>
                            <strong style={{ fontSize: '14px', color: '#0f172a', fontWeight: '750' }}>{latestProof.MaGiaoDich || 'Không có mã'}</strong>
                          </div>
                          {['Tiền mặt', 'TIEN_MAT'].includes(latestProof.LoaiThanhToan) && (
                            <>
                              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Số tiền thực nhận:</span>
                                <strong style={{ fontSize: '15px', color: '#16a34a', fontWeight: '800' }}>{money(latestProof.SoTienThucNhan)}</strong>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Người nhận tiền mặt:</span>
                                <strong style={{ fontSize: '14px', fontWeight: '700' }}>{latestProof.NguoiNhanTien || 'Nhân viên Sale'}</strong>
                              </div>
                            </>
                          )}
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
                            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Thời gian gửi chứng từ:</span>
                            <strong style={{ fontSize: '13px', fontWeight: '700' }}>{dateTime(latestProof.TaiLenLuc)}</strong>
                          </div>
                        </div>
                        {latestProof.HinhAnhDataUrl && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <span style={{ fontSize: '13px', fontWeight: '800', color: '#64748b' }}>Ảnh chứng từ chuyển khoản:</span>
                            <a href={latestProof.HinhAnhDataUrl} target="_blank" rel="noreferrer" onClick={(event) => moAnhTrongTabMoi(event, latestProof.HinhAnhDataUrl)} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', display: 'block', textDecoration: 'none', transition: 'all 0.2s' }}>
                              <img src={latestProof.HinhAnhDataUrl} alt="Ảnh chứng từ chuyển khoản" style={{ width: '100%', maxHeight: '160px', objectFit: 'contain', display: 'block' }} />
                              <div style={{ background: '#f8fafc', padding: '8px', textAlign: 'center', fontSize: '11px', color: '#f26a21', fontWeight: '800', borderTop: '1px solid #e2e8f0' }}>
                                Nhấp để mở ảnh lớn trong tab mới
                              </div>
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}



                {/* Reason detail log */}
                {selected.LyDoXuLy && (
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#b45309', padding: '14px 18px', borderRadius: '12px', marginBottom: '24px', fontSize: '13.5px', fontWeight: '500' }}>
                    <strong>Ghi chú từ bộ phận xử lý trước:</strong>
                    <p style={{ margin: '6px 0 0 0', fontStyle: 'italic', color: '#78350f' }}>"{selected.LyDoXuLy}"</p>
                  </div>
                )}

                <ThongTinKhachHang
                  role={role}
                  selected={selected}
                  customerForm={customerForm}
                  capNhatFormKhachHang={capNhatFormKhachHang}
                  customerHasChanges={customerHasChanges}
                  customerSaveError={customerSaveError}
                  customerSaveMessage={customerSaveMessage}
                  savingCustomer={savingCustomer}
                  saveCustomerInfo={saveCustomerInfo}
                  money={money}
                />

                {/* Segment: Room Details */}
                <section className="d-section-card d-card-room">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, border: 'none', padding: 0 }}>Phòng và Giường</h3>
                    <a href={`${ROUTES.soDoPhong}?phong=${selected.MaPhong}&nguon=dat-coc&phieu=${selected.MaDatCoc}`} target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: '#f26a21', fontWeight: '800', textDecoration: 'none' }}>
                      Xem sơ đồ trực quan ↗
                    </a>
                    {role === 'SALE' && selected.TrangThai === 'HET_CHO' && (
                      <button type="button" style={{ border: 'none', background: 'transparent', fontSize: '13px', color: '#f26a21', fontWeight: '800', cursor: 'pointer' }} onClick={editSelection}>
                        Đổi phòng và giường giữ chỗ
                      </button>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div className="d-room-card" style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
                      <span className="material-symbols-outlined" style={{ color: '#2563eb', fontSize: '32px' }}>single_bed</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <strong style={{ fontSize: '15px', color: '#1e3a8a' }}>Phòng {selected.MaPhong} · {selected.LoaiThue}</strong>
                        <p style={{ margin: 0, fontSize: '13px', color: '#3b82f6', fontWeight: '700' }}>
                          Giường đã chọn: {selectedBeds.map((item) => `Giường ${item.MaGiuong}`).join(', ') || 'Chưa chọn giường'}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <div>
                        <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase' }}>Địa chỉ chi nhánh</span>
                        <strong style={{ display: 'block', fontSize: '13.5px', color: '#334155', marginTop: '4px' }}>{selected.ChiNhanh?.DiaChi || '—'}</strong>
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase' }}>Loại phòng &amp; Sức chứa</span>
                        <strong style={{ display: 'block', fontSize: '13.5px', color: '#334155', marginTop: '4px' }}>
                          {selectedBeds[0]?.Giuong?.Phong?.ThongTinLoaiPhong?.TenLoaiPhong || 'Chưa rõ loại'} · {selectedBeds[0]?.Giuong?.Phong?.SucChuaToiDa || '—'} giường tối đa
                        </strong>
                      </div>
                    </div>
                  </div>

                  {role === 'KE_TOAN' && (
                    <div style={{ marginTop: '16px', overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                            <th style={{ padding: '10px', fontWeight: '800', color: '#475569' }}>Mã Giường</th>
                            <th style={{ padding: '10px', fontWeight: '800', color: '#475569' }}>Mã Phòng</th>
                            <th style={{ padding: '10px', fontWeight: '800', color: '#475569' }}>Đơn giá mỗi tháng</th>
                            <th style={{ padding: '10px', textAlign: 'right', fontWeight: '800', color: '#475569' }}>Tiền cọc (2 tháng)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedBeds.map((item) => (
                            <tr key={item.MaGiuong} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '10px', fontWeight: 'bold' }}>Giường {item.MaGiuong}</td>
                              <td style={{ padding: '10px' }}>Phòng {item.Giuong?.MaPhong || selected.MaPhong}</td>
                              <td style={{ padding: '10px' }}>{money(item.Giuong?.GiaThue)}</td>
                              <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#f26a21' }}>{money(Number(item.Giuong?.GiaThue || 0) * 2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

                <ThanhToanMinhChung
                  role={role}
                  selected={selected}
                  suggested={suggested}
                  depositAmount={depositAmount}
                  setDepositAmount={setDepositAmount}
                  paymentMethod={paymentMethod}
                  setPaymentMethod={setPaymentMethod}
                  transaction={transaction}
                  setTransaction={setTransaction}
                  evidence={evidence}
                  xuLyAnhChungTu={xuLyAnhChungTu}
                  cashAmount={cashAmount}
                  setCashAmount={setCashAmount}
                  cashConfirmed={cashConfirmed}
                  setCashConfirmed={setCashConfirmed}
                  primaryAction={primaryAction}
                  actionError={actionError}
                  setActionError={setActionError}
                  busy={busy}
                  note={note}
                  guiYeuCauXuLy={guiYeuCauXuLy}
                  guiChungTuThanhToan={guiChungTuThanhToan}
                  money={money}
                  dateTime={dateTime}
                />

              </>
            )}
          </aside>
        </div>
      </div>

      {/* Modal Booking Form (Create booking) */}
      <ModalLapPhieuDatCoc
        showCreate={showCreate}
        editingSelection={editingSelection}
        createForm={createForm}
        setCreateForm={setCreateForm}
        rooms={rooms}
        genderCompatibleRooms={genderCompatibleRooms}
        overviewRooms={overviewRooms}
        overviewRoomLimit={overviewRoomLimit}
        setOverviewRoomLimit={setOverviewRoomLimit}
        selectedCreateRoom={selectedCreateRoom}
        createError={createError}
        setCreateError={setCreateError}
        dangTaiHoSoTaoPhieu={dangTaiHoSoTaoPhieu}
        thayDoiCCCDTaoPhieu={thayDoiCCCDTaoPhieu}
        busy={busy}
        saveNewSelection={saveNewSelection}
        createDeposit={createDeposit}
        setShowCreate={setShowCreate}
        money={money}
      />
    </KhungNhanVien>
  );
}
