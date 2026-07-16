import { useState, useEffect } from 'react';
import StayConditionsCheck from './components/StayConditionsCheck';
import ContractDrafting from './components/ContractDrafting';
import AssetHandover from './components/AssetHandover';
import InitialPayment from './components/InitialPayment';
import ContractLiquidation from './components/ContractLiquidation';
import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTES, layMenuNhanVienTheoVaiTro } from './config/routes';
import CheckoutContainer from './components/checkout/CheckoutContainer';
import StaffHopDongPage from './components/contracts/StaffHopDongPage';
import { useRef } from 'react';
import {
  chuanHoaVaiTroNhanVien,
  docNguoiDungDangNhap,
  layMaNhanVien,
  xoaNguoiDungDangNhap,
} from './utils/nhanVienSession';
import TraCuuPhongGiuongPage from './pages/TraCuuPhongGiuongPage';
import TiepNhanDangKyThuePage from './pages/TiepNhanDangKyThuePage';
import {
  guiTiepNhanDangKyThue,
  kiemTraKhachHangTrung,
  kiemTraThongTinDangKyThue,
  layDanhSachTieuChiDangKyThue,
  mapYeuCauThueSangBoLoc,
  taoPayloadTiepNhanDangKyThue,
} from './components/tiepNhanDangKyThue/tiepNhanDangKyThue';
import { layDanhSachTienIchHienThi } from './utils/tienIchPhong';
import { chiLayChuSo, laySoTienNumber } from './utils/soTien';

function AnimatedCounter({ end, duration = 1500, suffix = "" }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const endNum = parseInt(end) || 0;
    if (endNum === 0) {
      setCount(0);
      return;
    }

    const totalSteps = 40;
    const stepTime = duration / totalSteps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / totalSteps;
      const currentVal = Math.floor(endNum * (progress * (2 - progress)));
      setCount(currentVal);

      if (currentStep >= totalSteps) {
        clearInterval(timer);
        setCount(endNum);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [end, duration]);

  return <>{count.toLocaleString('vi-VN')}{suffix}</>;
}

export default function App({
  manHinhKhoiTao = 'guest_home',
  batDauCheDoNhanVien = false,
  nguoiDungDangNhap: nguoiDungDangNhapProp = null,
  dangXuatDangNhap = null,
} = {}) {
  // Quản lý chuyển màn hình: 'guest_home', 'staff_reception', 'search_vacancy', 'room_detail', 'staff_contracts', 'staff_stay_check', 'staff_contract_draft', 'staff_handover', 'staff_payment', 'staff_liquidation'
  const navigate = useNavigate();
  const location = useLocation();
  const nguoiDungKhoiTao = nguoiDungDangNhapProp || docNguoiDungDangNhap();
  const boQuaTaiTuDongPhongTrongRef = useRef(false);

  const chuyenDenKhuVucNhanVien = () => {
    try {
      const nguoiDung = docNguoiDungDangNhap();
      if (nguoiDung) {
        const role = chuanHoaVaiTroNhanVien(nguoiDung.vaiTro);
        navigate(role === 'sale' ? ROUTES.tiepNhanDangKyThue : ROUTES.dashboard);
      } else {
        navigate(ROUTES.dangNhap);
      }
    } catch {
      navigate(ROUTES.dangNhap);
    }
  };

  // Quản lý chuyển màn hình: 'guest_home', 'staff_reception', 'search_vacancy', 'room_detail', hoặc 'staff_checkout'
  const [trangHienTai, setTrangHienTai] = useState(manHinhKhoiTao);

  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    if (trangHienTai !== 'guest_home') {
      setActiveSection('');
      return;
    }

    const handleScroll = () => {
      const popular = document.getElementById('popular');
      const utilities = document.getElementById('utilities');
      const reviews = document.getElementById('reviews');
      const consult = document.getElementById('consult');

      // Thêm offset 1/3 màn hình để active đúng lúc
      const scrollPos = window.scrollY + window.innerHeight / 3;

      let current = 'home';
      if (consult && consult.offsetTop <= scrollPos) {
        current = 'consult';
      } else if (reviews && reviews.offsetTop <= scrollPos) {
        current = 'reviews';
      } else if (utilities && utilities.offsetTop <= scrollPos) {
        current = 'utilities';
      } else if (popular && popular.offsetTop <= scrollPos) {
        current = 'popular';
      }

      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // chạy 1 lần khi render
    return () => window.removeEventListener('scroll', handleScroll);
  }, [trangHienTai]);

  const [nguoiDungDangNhap, setNguoiDungDangNhap] = useState(nguoiDungKhoiTao);
  // Phân quyền nhân viên: null, 'sale', 'quanly', 'ketoan'
  const [vaiTroNhanVien, setVaiTroNhanVien] = useState(() => chuanHoaVaiTroNhanVien(nguoiDungKhoiTao?.vaiTro));
  const [showLoginModal, setShowLoginModal] = useState(false);
  // Quản lý chuyển màn hình: 'guest_home', 'staff_reception', 'search_vacancy', hoặc 'room_detail'
  // Các màn hình mới (luồng đặt cọc - vùng xanh lá trên flow):
  // 'review_info' (2.1 Sale rà soát), 'confirm_status' (2.2 Quản lý xác nhận),
  // 'payment_request' (2.3 Sale lập yêu cầu thanh toán), 'payment_receive' (2.4 Kế toán tiếp nhận),
  // 'deposit_approve' (2.5 Quản lý phê duyệt cọc)

  // --- STATE CHO 2.1 RÀ SOÁT THÔNG TIN THUÊ (SALE) ---
  const [checklistRaSoat, setChecklistRaSoat] = useState({
    gioiTinh: true,
    quocTich: true,
    giayTo: false,
    taiChinh: false
  });

  // --- STATE CHO 2.2 XÁC NHẬN TÌNH TRẠNG (QUẢN LÝ) ---
  const [ketQuaXacNhanTinhTrang, setKetQuaXacNhanTinhTrang] = useState(null);

  // --- STATE CHO 2.3 YÊU CẦU THANH TOÁN (SALE) ---
  const [thongTinThanhToanCoc, setThongTinThanhToanCoc] = useState({
    hinhThucThue: 'Nguyên phòng',
    soGiuong: 4,
    maPhong: 'P-402-A',
    ngayBatDau: new Date().toISOString().split('T')[0],
    ghiChu: ''
  });

  // --- STATE CHO 2.4 TIẾP NHẬN THANH TOÁN (KẾ TOÁN) ---
  const [formTiepNhanThanhToan, setFormTiepNhanThanhToan] = useState({
    hinhThuc: 'chuyen-khoan',
    soTienThucThu: '',
    thoiDiemThu: '',
    maGiaoDich: ''
  });
  const [chungTuThanhToanFile, setChungTuThanhToanFile] = useState(null);
  const [chungTuThanhToanPreview, setChungTuThanhToanPreview] = useState(null);

  // --- STATE CHO 2.5 PHÊ DUYỆT CỌC (QUẢN LÝ) ---
  const [trangThaiPheDuyetCoc, setTrangThaiPheDuyetCoc] = useState('cho-xac-nhan'); // cho-xac-nhan | da-duyet | da-tu-choi

  // --- ĐỒNG HỒ ĐẾM NGƯỢC (dùng chung cho 2.3 và 2.4) ---
  const [giayConLaiThanhToan, setGiayConLaiThanhToan] = useState(23 * 3600 + 45 * 60 + 10); // 2.3: 23:45:10
  const [giayConLaiTiepNhan, setGiayConLaiTiepNhan] = useState(14 * 60 + 56); // 2.4: 14:56

  // Chế độ người dùng: false = Guest, true = Nhân viên
  const [cheDoNhanVien, setCheDoNhanVien] = useState(() => batDauCheDoNhanVien || (Boolean(nguoiDungKhoiTao) && manHinhKhoiTao !== 'guest_home'));

  useEffect(() => {
    const nguoiDungMoi = nguoiDungDangNhapProp || docNguoiDungDangNhap();
    setNguoiDungDangNhap(nguoiDungMoi);
    setVaiTroNhanVien(chuanHoaVaiTroNhanVien(nguoiDungMoi?.vaiTro));
    if (batDauCheDoNhanVien && nguoiDungMoi) {
      setCheDoNhanVien(true);
    }
  }, [nguoiDungDangNhapProp, batDauCheDoNhanVien]);

  // Phòng đang chọn xem chi tiết
  const [phongDaChon, setPhongDaChon] = useState(null);

  // --- TRANG ĐẶT LỊCH HẸN NHÂN VIÊN (STAFF BOOKING) ---
  const SO_PHONG_GOI_Y_MOI_LAN = 6;
  const [danhSachPhongDatHen, setDanhSachPhongDatHen] = useState([]);
  const [danhSachPhongGoiYLichHen, setDanhSachPhongGoiYLichHen] = useState([]);
  const [ngayHen, setNgayHen] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [gioHen, setGioHen] = useState('09:00');
  const [tuKhoaKhachHangLichHen, setTuKhoaKhachHangLichHen] = useState('');
  const [danhSachGoiYKhachHang, setDanhSachGoiYKhachHang] = useState([]);
  const [dangTimKhachHang, setDangTimKhachHang] = useState(false);
  const [khachHangDaChon, setKhachHangDaChon] = useState(null);
  const [soPhongGoiYHienThi, setSoPhongGoiYHienThi] = useState(SO_PHONG_GOI_Y_MOI_LAN);
  const [bookingSuccessModal, setBookingSuccessModal] = useState(false);

  // --- TRANG DANH SÁCH LỊCH HẸN NHÂN VIÊN (STAFF CONTRACTS/APPOINTMENTS) ---
  const [danhSachLichHenDB, setDanhSachLichHenDB] = useState([]);
  const [boLocLichHen, setBoLocLichHen] = useState('tat-ca');
  const [tuKhoaLichHen, setTuKhoaLichHen] = useState('');
  const [trangHienHen, setTrangHienHen] = useState(1);
  const [lichHenDangSua, setLichHenDangSua] = useState(null);
  const [formSuaLichHen, setFormSuaLichHen] = useState({ ketQua: 'Chưa xem', ghiChu: '', maPhong: '' });
  const [trangTruocChiTietPhong, setTrangTruocChiTietPhong] = useState('search_vacancy');

  // Thống kê tổng hợp trang chủ (Khách, Đang thuê, Còn trống)
  const [thongKeTongHop, setThongKeTongHop] = useState({
    soKhachHang: 0,
    soPhongDangThue: 0,
    soPhongConTrong: 0
  });

  // Thống kê phòng trống bên phải của trang Tiếp nhận thông tin
  const [thongKePhongTrong, setThongKePhongTrong] = useState({
    dormNuQ1: 0,
    phongDonBT: 0,
    dormNamQ3: 0
  });

  // State form khách đăng ký tư vấn (Trang chủ Guest)
  const [formTuVan, setFormTuVan] = useState({
    hoTen: '',
    sdt: '',
    email: '',
    noiDung: ''
  });

  // State tìm kiếm nhanh trên trang chủ Guest
  const [timKiemNhanhKhuVuc, setTimKiemNhanhKhuVuc] = useState('Tất cả');
  const [timKiemNhanhLoai, setTimKiemNhanhLoai] = useState('Tất cả');
  const [timKiemNhanhGia, setTimKiemNhanhGia] = useState('5000000');

  // State form Tiếp nhận thông tin khách (Trang nhân viên)
  const [formKhachHang, setFormKhachHang] = useState({
    cccd: '',
    hoTen: '',
    ngaySinh: '',
    gioiTinh: 'Nam',
    quocTich: 'Việt Nam',
    sdt: '',
    email: '',
    diaChi: '',
    khaNangTaiChinh: ''
  });

  // State form Yêu cầu thuê (Trang nhân viên)
  const [formYeuCauThue, setFormYeuCauThue] = useState({
    loaiPhong: 'Giường ghép',
    loaiThue: 'Thuê giường lẻ',
    khuVucMongMuon: 'Tất cả',
    mucGiaTu: '',
    mucGiaDen: '',
    soNguoi: 1,
    gioiTinh: 'Tất cả',
    thoiGianVao: new Date().toISOString().split('T')[0],
    thoiHanThue: '6',
    yeuCauThem: ''
  });
  const [yeuCauThueDaLuu, setYeuCauThueDaLuu] = useState(null);

  // State tab cho Phòng/Giường nhân viên
  const [tabPhongGiuongNhanVien, setTabPhongGiuongNhanVien] = useState('danh-sach'); // 'danh-sach' hoặc 'xac-nhan'

  // State tab cho Hợp đồng nhân viên
  const [tabHopDongNhanVien, setTabHopDongNhanVien] = useState('danh-sach-hen'); // 'danh-sach-hen' hoặc 'phe-duyet'

  // Tiêu chí ưu tiên của nhân viên chọn
  const [tieuChiUuTien, setTieuChiUuTien] = useState({
    yenTinh: false,
    guiXe: false,
    dieuHoa: false,
    wifiRieng: false,
    gioGiacTuDo: false
  });

  // Kết quả tìm kiếm phòng
  const [danhSachPhong, setDanhSachPhong] = useState([]);
  const [daTraCuu, setDaTraCuu] = useState(false);

  // --- TRANG TRA CỨU PHÒNG TRỐNG (VACANCY SEARCH) ---
  const [danhSachTatCaPhongTrong, setDanhSachTatCaPhongTrong] = useState([]);
  const [trangTraCuuHienTai, setTrangTraCuuHienTai] = useState(1);
  const SO_LUONG_MOI_TRANG = 6;
  const SO_LICH_HEN_MOI_TRANG = 10;
  const [dangTaiPhongTrong, setDangTaiPhongTrong] = useState(false);
  const [boLocTraCuu, setBoLocTraCuu] = useState({
    khuVuc: 'Tất cả',
    loaiPhong: 'Tất cả', // 'Tất cả', 'Phòng đơn' (Nguyên phòng), 'Giường dorm' (Giường ghép)
    mucGiaTu: '',
    mucGiaDen: '',
    gioiTinh: 'Tất cả',
    soNguoi: '',
    tienIch: 'Tất cả',
    yeuCauList: []
  });
  const [tuyChonTraCuuPhong, setTuyChonTraCuuPhong] = useState({ khuVuc: [], tienIch: [] });
  const [gioiHanSucChua, setGioiHanSucChua] = useState({ nguyenPhong: 1, giuongGhep: 1 });
  const [nguonTraCuuPhong, setNguonTraCuuPhong] = useState('tab'); // tab | tiep-nhan | chon-lich-hen

  // Hộp thoại modal xem chi tiết
  const [chiTietPhongModal, setChiTietPhongModal] = useState(null);

  // Hộp thoại modal hẹn xem phòng
  const [henXemPhongModal, setHenXemPhongModal] = useState(null);
  const [formHenXem, setFormHenXem] = useState({
    hoTen: '',
    sdt: '',
    email: '',
    ngayGioHen: '',
    ghiChu: ''
  });

  // Trạng thái loading
  const [dangTaiStats, setDangTaiStats] = useState(false);
  const [dangXuLy, setDangXuLy] = useState(false);

  // Thông báo toast
  const [thongBao, setThongBao] = useState(null);

  // 1. Hàm hiển thị Toast thông báo
  const hienThongBao = (kieu, tinNhan) => {
    setThongBao({ kieu, tinNhan });
    setTimeout(() => {
      setThongBao(null);
    }, 4000);
  };

  const taoContextTiepNhanDangKyThue = (override = {}) => ({
    formKhachHang,
    formYeuCauThue,
    tieuChiUuTien,
    yeuCauThueDaLuu,
    khachHangDaChon,
    tuKhoaKhachHangLichHen,
    ...override,
  });

  const apDungContextTiepNhanDangKyThue = (context) => {
    if (!context) return;
    if (context.formKhachHang) setFormKhachHang(context.formKhachHang);
    if (context.formYeuCauThue) setFormYeuCauThue(context.formYeuCauThue);
    if (context.tieuChiUuTien) setTieuChiUuTien(context.tieuChiUuTien);
    if (Object.prototype.hasOwnProperty.call(context, 'yeuCauThueDaLuu')) {
      setYeuCauThueDaLuu(context.yeuCauThueDaLuu || null);
    }
    if (Object.prototype.hasOwnProperty.call(context, 'khachHangDaChon')) {
      setKhachHangDaChon(context.khachHangDaChon || null);
    }
    if (Object.prototype.hasOwnProperty.call(context, 'tuKhoaKhachHangLichHen')) {
      setTuKhoaKhachHangLichHen(context.tuKhoaKhachHangLichHen || '');
    }
  };

  const layNgayInputLocal = (date = new Date()) => {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().split('T')[0];
  };

  const layGioInputLocal = (date = new Date()) => (
    `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  );

  const taoFormKhachHangRong = () => ({
    cccd: '',
    hoTen: '',
    ngaySinh: '',
    gioiTinh: '',
    quocTich: '',
    sdt: '',
    email: '',
    diaChi: '',
    khaNangTaiChinh: ''
  });

  const taoFormYeuCauThueRong = () => ({
    loaiPhong: '',
    loaiThue: '',
    khuVucMongMuon: '',
    mucGiaTu: '',
    mucGiaDen: '',
    soNguoi: '',
    gioiTinh: '',
    thoiGianVao: '',
    thoiHanThue: '',
    yeuCauThem: ''
  });

  const taoTieuChiUuTienRong = () => ({
    yenTinh: false,
    guiXe: false,
    dieuHoa: false,
    wifiRieng: false,
    gioGiacTuDo: false
  });

  const taoBoLocTraCuuRong = () => ({
    khuVuc: 'Tất cả',
    loaiPhong: 'Tất cả',
    mucGiaTu: '',
    mucGiaDen: '',
    gioiTinh: 'Tất cả',
    soNguoi: '',
    tienIch: 'Tất cả',
    yeuCauList: []
  });

  const resetTiepNhanVaLichHenMoi = () => {
    sessionStorage.removeItem('bookingContext');
    sessionStorage.removeItem('tiepNhanDangKyThueContext');
    sessionStorage.removeItem('traCuuPhongContext');
    setFormKhachHang(taoFormKhachHangRong());
    setFormYeuCauThue(taoFormYeuCauThueRong());
    setTieuChiUuTien(taoTieuChiUuTienRong());
    setBoLocTraCuu(taoBoLocTraCuuRong());
    setYeuCauThueDaLuu(null);
    setKhachHangDaChon(null);
    setTuKhoaKhachHangLichHen('');
    setDanhSachGoiYKhachHang([]);
    setDanhSachPhongDatHen([]);
    setDanhSachPhongGoiYLichHen([]);
    setDanhSachPhong([]);
    setDaTraCuu(false);
    setNguonTraCuuPhong('tab');
    setPhongDaChon(null);
    setSoPhongGoiYHienThi(SO_PHONG_GOI_Y_MOI_LAN);
    setNgayHen(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
    setGioHen('09:00');
  };

  const batDauLichHenMoi = () => {
    resetTiepNhanVaLichHenMoi();
    setCheDoNhanVien(true);
    setTrangHienTai('staff_booking');
    navigate(ROUTES.lichHen, { state: { bookingContext: { manHinhKhoiTao: 'staff_booking' } } });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const batDauTiepNhanMoi = () => {
    resetTiepNhanVaLichHenMoi();
    setCheDoNhanVien(true);
    setTrangHienTai('staff_reception');
    navigate(ROUTES.tiepNhanDangKyThue, { state: { manHinhKhoiTao: 'staff_reception' } });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const xuLyDoiNgayHen = (value) => {
    const ngayHomNay = layNgayInputLocal();
    const ngayMoi = !value || value < ngayHomNay ? ngayHomNay : value;
    if (value && value < ngayHomNay) {
      hienThongBao('error', 'Ngày hẹn không được nằm trong quá khứ.');
    }
    setNgayHen(ngayMoi);
    if (ngayMoi === ngayHomNay && gioHen < layGioInputLocal()) {
      setGioHen(layGioInputLocal());
    }
  };

  const xuLyDoiGioHen = (value) => {
    const ngayHomNay = layNgayInputLocal();
    const gioHienTai = layGioInputLocal();
    if (ngayHen === ngayHomNay && value < gioHienTai) {
      hienThongBao('error', 'Giờ hẹn không được nằm trong quá khứ.');
      setGioHen(gioHienTai);
      return;
    }
    setGioHen(value);
  };

  useEffect(() => {
    if (trangHienTai !== 'staff_booking') return;

    const tuKhoa = tuKhoaKhachHangLichHen.trim();
    if (tuKhoa.length < 2) {
      setDanhSachGoiYKhachHang([]);
      return;
    }
    if (khachHangDaChon?.hoTen && tuKhoa.includes(khachHangDaChon.hoTen)) {
      setDanhSachGoiYKhachHang([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setDangTimKhachHang(true);
      try {
        const qs = new URLSearchParams({ timKiem: tuKhoa, limit: '8' });
        const res = await fetch(`/api/khach-hang?${qs.toString()}`, { signal: controller.signal });
        const json = await res.json().catch(() => ({}));
        if (json.ok) {
          setDanhSachGoiYKhachHang(json.danhSach || []);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Lỗi tìm khách hàng:', err);
        }
      } finally {
        if (!controller.signal.aborted) setDangTimKhachHang(false);
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [tuKhoaKhachHangLichHen, trangHienTai, khachHangDaChon]);

  useEffect(() => {
    setSoPhongGoiYHienThi(SO_PHONG_GOI_Y_MOI_LAN);
  }, [danhSachPhongGoiYLichHen.length]);

  const chonKhachHangChoLichHen = (khachHang) => {
    setKhachHangDaChon(khachHang);
    setYeuCauThueDaLuu(null);
    const gioiTinhKhach = khachHang.gioiTinh && khachHang.gioiTinh !== '—' ? khachHang.gioiTinh : 'Nam';
    setFormKhachHang(prev => ({
      ...prev,
      cccd: khachHang.cccd || '',
      hoTen: khachHang.hoTen || '',
      ngaySinh: khachHang.ngaySinhRaw || '',
      gioiTinh: gioiTinhKhach,
      sdt: khachHang.sdt || '',
      email: khachHang.email || '',
      diaChi: khachHang.diaChi && khachHang.diaChi !== '—' ? khachHang.diaChi : '',
    }));
    if (['Nam', 'Nữ'].includes(gioiTinhKhach)) {
      setFormYeuCauThue(prev => ({
        ...prev,
        gioiTinh: gioiTinhKhach,
      }));
    }
    setTuKhoaKhachHangLichHen(`${khachHang.hoTen || 'Khách hàng'}${khachHang.sdt ? ` - ${khachHang.sdt}` : ''}`);
    setDanhSachGoiYKhachHang([]);
  };

  const chuyenTiepNhanKhachHangMoi = () => {
    batDauTiepNhanMoi();
  };

  // 2. Tải thống kê tổng hợp cho trang chủ Guest
  const taiThongKeTongHop = async () => {
    setDangTaiStats(true);
    try {
      const response = await fetch('/api/thong-ke-tong-hop');
      const resData = await response.json();
      if (resData.ok) {
        setThongKeTongHop(resData.data);
      }
    } catch (err) {
      console.error('Lỗi kết nối API thống kê tổng hợp:', err);
    } finally {
      setDangTaiStats(false);
    }
  };

  // 3. Tải thống kê phòng trống cho panel nhân viên
  const taiThongKePhongTrong = async () => {
    try {
      const response = await fetch('/api/thong-ke-phong');
      const resData = await response.json();
      if (resData.ok) {
        setThongKePhongTrong(resData.data);
      }
    } catch (err) {
      console.error('Lỗi kết nối API thống kê phòng trống:', err);
    }
  };

  const taiTuyChonTraCuuPhong = async () => {
    try {
      const response = await fetch('/api/tuy-chon-tra-cuu-phong');
      const resData = await response.json();
      if (resData.ok) {
        setTuyChonTraCuuPhong({
          khuVuc: Array.isArray(resData.data?.khuVuc) ? resData.data.khuVuc : [],
          tienIch: Array.isArray(resData.data?.tienIch) ? resData.data.tienIch : [],
        });
        if (resData.data?.gioiHanSucChua) {
          setGioiHanSucChua({
            nguyenPhong: Number(resData.data.gioiHanSucChua.nguyenPhong) || 1,
            giuongGhep: Number(resData.data.gioiHanSucChua.giuongGhep) || 1,
          });
        }
      }
    } catch (err) {
      console.error('Lỗi kết nối API tùy chọn tra cứu phòng:', err);
    }
  };

  // Tải danh sách phòng trống thực tế cho trang Tra cứu phòng trống
  const taiTatCaPhongTrong = async (boLocHienTai = boLocTraCuu) => {
    setDangTaiPhongTrong(true);
    try {
      let paramLoaiPhong = 'Giường ghép';
      if (boLocHienTai.loaiPhong === 'Phòng đơn' || boLocHienTai.loaiPhong === 'Nguyên phòng') {
        paramLoaiPhong = 'Nguyên phòng';
      }

      const paramKhuVuc = boLocHienTai.khuVuc === 'Tất cả' ? '' : boLocHienTai.khuVuc;
      const paramYeuCauList = boLocHienTai.yeuCauList?.length
        ? boLocHienTai.yeuCauList
        : (boLocHienTai.tienIch === 'Tất cả' ? [] : [boLocHienTai.tienIch]);

      const goiApiTraCuuPhong = async (payload) => {
        const goiApi = async (body) => fetch('/api/tra-cuu-phong', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        }).then(r => r.json());

        return goiApi(payload);
      };

      let ketQuaGop = [];
      if (boLocHienTai.loaiPhong === 'Tất cả') {
        const [resPhong, resGiuong] = await Promise.all([
          goiApiTraCuuPhong({
            loaiPhong: 'Nguyên phòng',
            kieuThue: 'PHONG',
            khuVucMongMuon: paramKhuVuc,
            mucGiaTu: boLocHienTai.mucGiaTu,
            mucGiaDen: boLocHienTai.mucGiaDen,
            gioiTinh: boLocHienTai.gioiTinh,
            soNguoi: boLocHienTai.soNguoi,
            yeuCauList: paramYeuCauList
          }),
          goiApiTraCuuPhong({
            loaiPhong: 'Giường ghép',
            kieuThue: 'GIUONG',
            khuVucMongMuon: paramKhuVuc,
            mucGiaTu: boLocHienTai.mucGiaTu,
            mucGiaDen: boLocHienTai.mucGiaDen,
            gioiTinh: boLocHienTai.gioiTinh,
            soNguoi: boLocHienTai.soNguoi,
            yeuCauList: paramYeuCauList
          })
        ]);

        if (resPhong.ok) ketQuaGop = [...ketQuaGop, ...resPhong.data];
        if (resGiuong.ok) ketQuaGop = [...ketQuaGop, ...resGiuong.data];
      } else {
        const resData = await goiApiTraCuuPhong({
          loaiPhong: paramLoaiPhong,
          kieuThue: paramLoaiPhong === 'Nguyên phòng' ? 'PHONG' : 'GIUONG',
          khuVucMongMuon: paramKhuVuc,
          mucGiaTu: boLocHienTai.mucGiaTu,
          mucGiaDen: boLocHienTai.mucGiaDen,
          gioiTinh: boLocHienTai.gioiTinh,
          soNguoi: boLocHienTai.soNguoi,
          yeuCauList: paramYeuCauList
        });
        if (resData.ok) {
          ketQuaGop = resData.data;
        }
      }

      setDanhSachTatCaPhongTrong(ketQuaGop);
      if (nguonTraCuuPhong !== 'tab') {
        setDanhSachPhongGoiYLichHen(ketQuaGop);
      }
      setTrangTraCuuHienTai(1);
      return ketQuaGop;
    } catch (err) {
      console.error('Lỗi tải phòng trống:', err);
      hienThongBao('error', 'Không thể kết nối đến cơ sở dữ liệu tra cứu!');
      return [];
    } finally {
      setDangTaiPhongTrong(false);
    }
  };

  const xuLyThayDoiBoLoc = (e) => {
    const { name, value } = e.target;
    const giaTriMoi = ['mucGiaTu', 'mucGiaDen'].includes(name) ? chiLayChuSo(value) : value;
    setBoLocTraCuu(prev => ({
      ...prev,
      [name]: giaTriMoi,
      ...(name === 'tienIch' ? { yeuCauList: [] } : {})
    }));
    if (nguonTraCuuPhong === 'chon-lich-hen' && name === 'mucGiaDen') {
      setFormKhachHang(prev => ({
        ...prev,
        khaNangTaiChinh: giaTriMoi,
      }));
      setFormYeuCauThue(prev => ({
        ...prev,
        mucGiaDen: giaTriMoi,
      }));
    }
  };

  const xuLyToggleTienIchTraCuu = (value) => {
    setBoLocTraCuu(prev => {
      const danhSachHienTai = Array.isArray(prev.yeuCauList) ? prev.yeuCauList : [];
      const daChon = danhSachHienTai.includes(value);
      const yeuCauList = daChon
        ? danhSachHienTai.filter((item) => item !== value)
        : [...danhSachHienTai, value];
      return {
        ...prev,
        yeuCauList,
        tienIch: yeuCauList.length === 1 ? yeuCauList[0] : 'Tất cả',
      };
    });
  };

  const xuLyLuuTienIchTraCuu = (danhSachTienIch = []) => {
    const yeuCauList = [...new Set((Array.isArray(danhSachTienIch) ? danhSachTienIch : []).filter(Boolean))];
    setBoLocTraCuu(prev => ({
      ...prev,
      yeuCauList,
      tienIch: yeuCauList.length === 1 ? yeuCauList[0] : 'Tất cả',
    }));
  };

  const guiYeuCauTimKiemVacant = (e) => {
    if (e) e.preventDefault();
    taiTatCaPhongTrong(boLocTraCuu);
  };

  const xuLyThayDoiHenXem = (e) => {
    const { name, value } = e.target;
    setFormHenXem(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const guiYeuCauDatLichHen = async (e) => {
    if (e) e.preventDefault();
    if (!formHenXem.hoTen.trim() || !formHenXem.sdt.trim() || !formHenXem.ngayGioHen) {
      hienThongBao('error', 'Vui lòng điền các trường bắt buộc (Họ tên, Số điện thoại, Ngày giờ hẹn)!');
      return;
    }

    setDangXuLy(true);
    try {
      const response = await fetch('/api/dat-lich-hen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formHenXem,
          maPhong: henXemPhongModal.maPhong || henXemPhongModal.maId,
          loaiPhong: henXemPhongModal.kieu
        })
      });
      const data = await response.json();
      if (response.ok && data.ok) {
        hienThongBao('success', `Đăng ký lịch hẹn xem ${henXemPhongModal.ten} thành công! Mã lịch hẹn: ${data.data.lichXemPhong.MaLich}`);
        setHenXemPhongModal(null);
        setFormHenXem({ hoTen: '', sdt: '', email: '', ngayGioHen: '', ghiChu: '' });
      } else {
        throw new Error(data.error || 'Lỗi hệ thống');
      }
    } catch (err) {
      hienThongBao('error', `Lỗi: ${err.message}`);
    } finally {
      setDangXuLy(false);
    }
  };

  const dinhDangNgayGio = (dateStr) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const today = new Date();
    if (d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()) {
      return `Hôm nay, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.getDate() === yesterday.getDate() && d.getMonth() === yesterday.getMonth() && d.getFullYear() === yesterday.getFullYear()) {
      return `Hôm qua, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const layAnhMinhHoaPhong = (item) => {
    if (item.kieu === 'Phong') {
      if (item.maId % 2 === 0) return '/cozy_dorm_bed.png';
      return '/studio_loft.png';
    }
    return '/dorm_room.png';
  };

  const cuonMuonDenSection = (e, sectionId) => {
    e.preventDefault();
    if (trangHienTai !== 'guest_home') {
      setCheDoNhanVien(false);
      chuyenTrang('guest_home');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const chuyenSangTraCuuNhanhFromHero = () => {
    let mappedLoai = 'Tất cả';
    if (timKiemNhanhLoai === 'Phong') mappedLoai = 'Phòng đơn';
    if (timKiemNhanhLoai === 'Giuong') mappedLoai = 'Giường dorm';

    setBoLocTraCuu({
      khuVuc: timKiemNhanhKhuVuc,
      loaiPhong: mappedLoai,
      mucGiaTu: '',
      mucGiaDen: '',
      gioiTinh: 'Tất cả',
      soNguoi: '',
      tienIch: 'Tất cả',
      yeuCauList: []
    });

    setCheDoNhanVien(false);
    chuyenTrang('search_vacancy');
  };

  const layMaPhongDatHen = (room) => Number(room?.maPhong ?? room?.MaPhong ?? room?.maId ?? room?.MaId);
  const layMaGiuongDatHen = (room) => (room?.kieu === 'Giuong' ? Number(room?.maId ?? room?.MaGiuong) : null);
  const layTenPhongDatHen = (room) => {
    const maGiuong = layMaGiuongDatHen(room);
    const maPhong = layMaPhongDatHen(room);
    return maGiuong ? `Giường ${maGiuong} - Phòng ${maPhong}` : `Phòng ${maPhong}`;
  };
  const layDanhSachPhongTuKetQuaTraCuu = (danhSach = []) => {
    const phongMap = new Map();
    (Array.isArray(danhSach) ? danhSach : []).forEach((room) => {
      const maPhong = layMaPhongDatHen(room);
      if (!maPhong) return;
      const daCo = phongMap.get(maPhong);
      if (daCo) {
        if (room?.kieu === 'Giuong') {
          daCo.soGiuongTrong = Math.max(Number(daCo.soGiuongTrong) || 0, Number(room.soGiuongTrong) || 1);
        }
        return;
      }
      phongMap.set(maPhong, {
        ...room,
        kieu: 'Phong',
        maId: maPhong,
        maPhong,
        ten: `Phòng ${maPhong}`,
        tenPhongHienThi: `Phòng ${maPhong}${room?.chiNhanh ? ` (${room.chiNhanh})` : ''}`,
      });
    });
    return Array.from(phongMap.values()).sort((a, b) => Number(a.maPhong) - Number(b.maPhong));
  };
  const MA_GIUONG_GHI_CHU_REGEX = /^\[MA_GIUONG:(\d+)\]\s*/;
  const PHONG_CHOT_GHI_CHU_REGEX = /^\[PHONG_CHOT\]\s*/;
  const tachGhiChuLichHen = (ghiChu = '') => {
    let noiDung = String(ghiChu || '');
    const daChotPhong = PHONG_CHOT_GHI_CHU_REGEX.test(noiDung);
    noiDung = noiDung.replace(PHONG_CHOT_GHI_CHU_REGEX, '').trim();
    const match = noiDung.match(MA_GIUONG_GHI_CHU_REGEX);
    return {
      maGiuong: match ? Number(match[1]) : null,
      daChotPhong,
      ghiChuHienThi: match ? noiDung.replace(MA_GIUONG_GHI_CHU_REGEX, '').trim() : noiDung,
    };
  };
  const taoGhiChuLichHen = (ghiChu = '', maGiuong = null, daChotPhong = false) => {
    const noiDung = String(ghiChu || '').trim();
    const ghiChuGiuong = maGiuong ? `[MA_GIUONG:${maGiuong}]${noiDung ? ` ${noiDung}` : ''}` : noiDung;
    return daChotPhong ? `[PHONG_CHOT]${ghiChuGiuong ? ` ${ghiChuGiuong}` : ''}` : ghiChuGiuong;
  };

  const xuLyXoaPhongLichHen = (room) => {
    const maPhongCanXoa = layMaPhongDatHen(room);
    setDanhSachPhongDatHen(prev => prev.filter(r => layMaPhongDatHen(r) !== maPhongCanXoa));
    if (layMaPhongDatHen(phongDaChon) === maPhongCanXoa) {
      setPhongDaChon(null);
    }
  };

  const diDenManHinhDatLichHen = (phongDuocChon = danhSachPhongDatHen, danhSachGoiYOverride = null) => {
    const danhSachChon = Array.isArray(phongDuocChon) ? phongDuocChon : [phongDuocChon].filter(Boolean);
    const danhSachGoiYNguon = Array.isArray(danhSachGoiYOverride)
      ? danhSachGoiYOverride
      : (danhSachPhongGoiYLichHen.length ? danhSachPhongGoiYLichHen : danhSachTatCaPhongTrong);
    const danhSachGoiY = layDanhSachPhongTuKetQuaTraCuu(danhSachGoiYNguon);
    const bookingContext = {
      manHinhKhoiTao: 'staff_booking',
      tabHopDongNhanVien: 'danh-sach-hen',
      formKhachHang,
      formYeuCauThue,
      boLocTraCuu,
      tieuChiUuTien,
      yeuCauThueDaLuu,
      khachHangDaChon,
      tuKhoaKhachHangLichHen,
      danhSachPhongDatHen: danhSachChon,
      danhSachPhongGoiYLichHen: danhSachGoiY,
    };
    sessionStorage.setItem('bookingContext', JSON.stringify(bookingContext));
    setCheDoNhanVien(true);
    setTabHopDongNhanVien('danh-sach-hen');
    setTrangHienTai('staff_booking');
    navigate(ROUTES.lichHen, { state: { bookingContext } });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const diDenDatLichHenTuTraCuu = () => {
    const danhSachGoiY = layDanhSachPhongTuKetQuaTraCuu(
      danhSachTatCaPhongTrong.length ? danhSachTatCaPhongTrong : danhSachPhongGoiYLichHen
    );
    if (danhSachGoiY.length === 0) {
      hienThongBao('error', 'Chưa có phòng/giường phù hợp để đặt lịch hẹn.');
      return;
    }
    setDanhSachPhongDatHen([]);
    setDanhSachPhongGoiYLichHen(danhSachGoiY);
    setPhongDaChon(null);
    diDenManHinhDatLichHen([], danhSachGoiY);
  };

  const quayLaiTiepNhanTuTraCuu = () => {
    const context = taoContextTiepNhanDangKyThue();
    sessionStorage.setItem('tiepNhanDangKyThueContext', JSON.stringify(context));
    sessionStorage.removeItem('traCuuPhongContext');
    setNguonTraCuuPhong('tab');
    navigate(ROUTES.tiepNhanDangKyThue, { state: { manHinhKhoiTao: 'staff_reception', tiepNhanDangKyThueContext: context } });
    setTrangHienTai('staff_reception');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const xuLyThemPhongLichHen = () => {
    setPhongDaChon(null);
    setCheDoNhanVien(true);
    setTabPhongGiuongNhanVien('danh-sach');
    const danhSachTieuChi = layDanhSachTieuChiDangKyThue(tieuChiUuTien, tuyChonTraCuuPhong.tienIch);
    const gioiTinhKhachHang = ['Nam', 'Nữ'].includes(formKhachHang.gioiTinh) ? formKhachHang.gioiTinh : formYeuCauThue.gioiTinh;
    const yeuCauThueChoTraCuu = {
      ...formYeuCauThue,
      gioiTinh: gioiTinhKhachHang || 'Tất cả',
      loaiThue: formYeuCauThue.loaiPhong === 'Nguyên phòng' ? 'Thuê nguyên phòng' : 'Thuê giường lẻ',
    };
    const newFilters = mapYeuCauThueSangBoLoc(yeuCauThueChoTraCuu, danhSachTieuChi);
    setBoLocTraCuu(newFilters);
    setNguonTraCuuPhong('chon-lich-hen');
    const context = {
      nguonTraCuuPhong: 'chon-lich-hen',
      boLocTraCuu: newFilters,
      formKhachHang,
      formYeuCauThue: yeuCauThueChoTraCuu,
      tieuChiUuTien,
    };
    sessionStorage.setItem('traCuuPhongContext', JSON.stringify(context));
    navigate(ROUTES.phongGiuong, { state: { traCuuPhongContext: context } });
    hienThongBao('info', 'Lọc phòng/giường phù hợp rồi bấm "Đi đến đặt lịch hẹn".');
  };

  const guiLichHenNhanVien = async (e) => {
    if (e) e.preventDefault();

    const ngayGioHenCombined = `${ngayHen}T${gioHen}:00`;
    const thoiDiemHen = new Date(ngayGioHenCombined);
    if (Number.isNaN(thoiDiemHen.getTime()) || thoiDiemHen.getTime() < Date.now()) {
      hienThongBao('error', 'Thời điểm hẹn phải từ hiện tại trở đi.');
      return;
    }

    setDangXuLy(true);
    try {
      const customerName = formKhachHang.hoTen.trim();
      const customerPhone = formKhachHang.sdt.trim();
      const customerEmail = formKhachHang.email.trim();

      if (!customerName || !customerPhone) {
        throw new Error('Vui lòng nhập họ tên và số điện thoại thật của khách hàng.');
      }
      const danhSachGoiY = layDanhSachPhongTuKetQuaTraCuu(
        danhSachPhongGoiYLichHen.length
          ? danhSachPhongGoiYLichHen
          : (danhSachTatCaPhongTrong.length ? danhSachTatCaPhongTrong : danhSachPhongDatHen)
      );
      if (!danhSachGoiY.length) {
        throw new Error('Chưa có phòng phù hợp để tạo lịch hẹn. Vui lòng tra cứu phòng/giường trước.');
      }
      const yeuCauListLichHen = Array.isArray(boLocTraCuu.yeuCauList) && boLocTraCuu.yeuCauList.length
        ? boLocTraCuu.yeuCauList
        : layDanhSachTieuChiDangKyThue(tieuChiUuTien, tuyChonTraCuuPhong.tienIch);

      const response = await fetch('/api/dat-lich-hen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(yeuCauThueDaLuu?.MaYC ? { maYC: yeuCauThueDaLuu.MaYC } : {}),
          hoTen: customerName,
          sdt: customerPhone,
          email: customerEmail,
          cccd: formKhachHang.cccd || khachHangDaChon?.cccd || '',
          diaChi: formKhachHang.diaChi || '',
          ngaySinh: formKhachHang.ngaySinh || '',
          gioiTinh: formKhachHang.gioiTinh || '',
          khaNangTaiChinh: laySoTienNumber(formYeuCauThue.mucGiaDen || boLocTraCuu.mucGiaDen || formKhachHang.khaNangTaiChinh),
          maNV: layMaNhanVien(nguoiDungDangNhap),
          ngayGioHen: ngayGioHenCombined,
          maPhong: null,
          maGiuong: null,
          loaiPhong: formYeuCauThue.loaiPhong === 'Giường ghép' ? 'Giuong' : 'Phong',
            yeuCauThue: {
              ...formYeuCauThue,
              loaiThue: formYeuCauThue.loaiPhong === 'Nguyên phòng' ? 'Thuê nguyên phòng' : 'Thuê giường lẻ',
              yeuCauList: yeuCauListLichHen,
            },
          boLocTraCuu,
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) {
        if (response.status === 409) {
          throw new Error('CCCD/S\u0110T/Email \u0111\u00e3 t\u1ed3n t\u1ea1i. Vui l\u00f2ng nh\u1eadp l\u1ea1i th\u00f4ng tin.');
        }
        throw new Error(data.error || 'Không thể tạo lịch hẹn xem phòng.');
      }

      hienThongBao('success', `Đã đặt lịch hẹn xem phòng cho khách hàng ${customerName}!`);
      taiDanhSachLichHen();
      setBookingSuccessModal(true);
    } catch (err) {
      console.error('Lỗi khi nhân viên đặt lịch hẹn:', err);
      hienThongBao('error', err.message || 'Có lỗi xảy ra khi tạo lịch hẹn!');
    } finally {
      setDangXuLy(false);
    }
  };

  const layDanhSachLichHenGop = () => {
    const listDBMapped = danhSachLichHenDB.map((lich) => {
      const tenKhach = lich.YeuCauThue?.KhachHang?.HoTen || 'Khách Vãng Lai';
      const sdt = lich.YeuCauThue?.KhachHang?.SDT || 'Không có';
      const initials = tenKhach.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
      const thongTinGhiChu = tachGhiChuLichHen(lich.GhiChu);
      const phongGoiY = Array.isArray(lich.PhongGoiY) ? lich.PhongGoiY : [];
      const khoaPhongChot = Boolean(lich.KhoaPhongChot);
      const ketQuaChuanHoa = khoaPhongChot || lich.KetQua === 'Đã xem' ? 'Đã xem' : 'Chưa xem';
      const maPhongLich = Number(lich.MaPhong) || null;
      const daChotPhong = Boolean(maPhongLich && (thongTinGhiChu.daChotPhong || khoaPhongChot));
      const phongChotGoiY = phongGoiY.find((room) => layMaPhongDatHen(room) === maPhongLich);
      const nhanChiNhanhChot = phongChotGoiY?.chiNhanh ? ` - ${phongChotGoiY.chiNhanh}` : '';
      const tenPhongChot = daChotPhong && maPhongLich ? `Phòng ${maPhongLich}${nhanChiNhanhChot}` : '';
      return {
        MaLich: lich.MaLich,
        NgayGioHen: lich.NgayGioHen,
        KetQua: ketQuaChuanHoa,
        GhiChu: thongTinGhiChu.ghiChuHienThi,
        MaPhong: maPhongLich,
        MaGiuong: thongTinGhiChu.maGiuong,
        PhongGoiY: phongGoiY,
        KhoaPhongChot: khoaPhongChot,
        DaChotPhong: daChotPhong,
        TenPhongChot: tenPhongChot,
        TenKhach: tenKhach,
        SDT: sdt,
        AvatarName: initials,
        TenPhongGiuong: tenPhongChot || ''
      };
    });

    return listDBMapped.sort((a, b) => new Date(b.NgayGioHen).getTime() - new Date(a.NgayGioHen).getTime());
  };

  const locDanhSachLichHenTheoBoLoc = (danhSach) => {
    const tuKhoa = tuKhoaLichHen.trim().toLowerCase();
    return danhSach.filter((item) => {
      const matchSearch = !tuKhoa ||
        item.TenKhach.toLowerCase().includes(tuKhoa) ||
        String(item.SDT || '').includes(tuKhoa) ||
        String(item.MaPhong || '').includes(tuKhoa);
      if (!matchSearch) return false;

      if (boLocLichHen === 'hom-nay') {
        const d = new Date(item.NgayGioHen);
        const today = new Date();
        return d.getDate() === today.getDate() &&
          d.getMonth() === today.getMonth() &&
          d.getFullYear() === today.getFullYear();
      }
      if (boLocLichHen === 'tuan-nay') {
        const diffTime = Math.abs(new Date() - new Date(item.NgayGioHen));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
      }
      if (boLocLichHen === 'cho-xem') {
        return item.KetQua === 'Chưa xem';
      }
      if (boLocLichHen === 'da-xem') {
        return item.KetQua === 'Đã xem';
      }
      return true;
    });
  };

  const layTrangLichHen = () => {
    const danhSachSauLoc = locDanhSachLichHenTheoBoLoc(layDanhSachLichHenGop());
    const tongTrang = Math.max(1, Math.ceil(danhSachSauLoc.length / SO_LICH_HEN_MOI_TRANG));
    const trangAnToan = Math.min(Math.max(1, trangHienHen), tongTrang);
    const viTriDau = (trangAnToan - 1) * SO_LICH_HEN_MOI_TRANG;
    return {
      danhSachSauLoc,
      danhSachTrang: danhSachSauLoc.slice(viTriDau, viTriDau + SO_LICH_HEN_MOI_TRANG),
      tongTrang,
      trangAnToan,
      viTriDau,
    };
  };

  const layLuaChonPhongChotLichHen = (lichHen) => {
    const options = new Map();
    const themOption = (maPhong, label) => {
      const maPhongSo = Number(maPhong);
      if (!maPhongSo) return;
      if (options.has(maPhongSo)) {
        const labelHienTai = options.get(maPhongSo);
        if (label && !labelHienTai.includes(' - ') && label.includes(' - ')) {
          options.set(maPhongSo, label);
        }
        return;
      }
      options.set(maPhongSo, label || `Phòng ${maPhongSo}`);
    };

    if (lichHen.DaChotPhong || lichHen.KhoaPhongChot) {
      themOption(lichHen.MaPhong, lichHen.TenPhongChot || `Phòng ${lichHen.MaPhong}`);
    }
    const nguonGoiY = Array.isArray(lichHen.PhongGoiY) && lichHen.PhongGoiY.length
      ? lichHen.PhongGoiY
      : [...danhSachPhongGoiYLichHen, ...danhSachTatCaPhongTrong];

    nguonGoiY.forEach((room) => {
      const maPhong = layMaPhongDatHen(room);
      const nhanChiNhanh = room?.chiNhanh ? ` - ${room.chiNhanh}` : '';
      themOption(maPhong, `Phòng ${maPhong}${nhanChiNhanh}`);
    });

    return Array.from(options, ([value, label]) => ({ value, label }))
      .sort((a, b) => a.value - b.value);
  };

  const taiDanhSachLichHen = async () => {
    try {
      const res = await fetch('/api/danh-sach-lich-hen');
      const json = await res.json();
      if (json.ok) {
        setDanhSachLichHenDB(json.data || []);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách lịch hẹn:', err);
    }
  };

  const capNhatTrangThaiLichHen = async (maLich, trangThaiMoi, ghiChuMoi = '', maPhongChot = undefined) => {
    try {
      if (typeof maLich === 'number') {
        const coGuiPhongChot = maPhongChot !== undefined;
        const coChotPhongMoi = coGuiPhongChot && maPhongChot !== null && maPhongChot !== '';
        const daChotSauCapNhat = Boolean(
          lichHenDangSua?.KhoaPhongChot || (coGuiPhongChot ? coChotPhongMoi : lichHenDangSua?.DaChotPhong)
        );
        const ghiChuLuu = taoGhiChuLichHen(
          ghiChuMoi,
          null,
          daChotSauCapNhat
        );
        const body = {
          maLich,
          ketQua: lichHenDangSua?.KhoaPhongChot ? 'Đã xem' : trangThaiMoi,
          ghiChu: ghiChuLuu
        };
        if (coGuiPhongChot && !lichHenDangSua?.KhoaPhongChot) {
          body.maPhong = coChotPhongMoi ? Number(maPhongChot) : null;
        }
        const res = await fetch('/api/cap-nhat-trang-thai-hen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.ok) {
          throw new Error(json.error || 'Không thể cập nhật trạng thái lịch hẹn.');
        }
        if (json.ok) {
          hienThongBao('success', `Đã cập nhật trạng thái lịch hẹn sang: ${trangThaiMoi}`);
          taiDanhSachLichHen();
        }
      } else {
        hienThongBao('error', 'Vui lòng tải lại.');
      }
    } catch (err) {
      console.error('Lỗi khi cập nhật trạng thái lịch hẹn:', err);
      hienThongBao('error', err.message || 'Không thể cập nhật trạng thái lịch hẹn!');
    }
  };

  const capNhatPhongChotLichHen = async (lichHen, maPhongMoi) => {
    try {
      if (lichHen?.KhoaPhongChot) {
        hienThongBao('error', 'Khách đã có đặt cọc cho phòng này nên không thể đổi phòng chốt.');
        return;
      }
      const maPhong = Number(maPhongMoi);
      if (!lichHen?.MaLich) {
        hienThongBao('error', 'Vui lòng tải lại lịch hẹn.');
        return;
      }
      const coChotPhong = Number.isInteger(maPhong) && maPhong > 0;

      const res = await fetch('/api/cap-nhat-trang-thai-hen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maLich: lichHen.MaLich,
          maPhong: coChotPhong ? maPhong : null,
          ghiChu: taoGhiChuLichHen(lichHen.GhiChu || '', null, coChotPhong)
        })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'Không thể cập nhật phòng chốt.');
      }

      hienThongBao('success', coChotPhong ? `Đã cập nhật phòng chốt sang phòng ${maPhong}.` : 'Đã chuyển lịch hẹn về chưa chốt phòng.');
      taiDanhSachLichHen();
    } catch (err) {
      console.error('Lỗi khi cập nhật phòng chốt:', err);
      hienThongBao('error', err.message || 'Không thể cập nhật phòng chốt.');
    }
  };

  useEffect(() => {
    if (location.pathname === ROUTES.tiepNhanDangKyThue) {
      const rawContext = location.state?.tiepNhanDangKyThueContext || (() => {
        try {
          return JSON.parse(sessionStorage.getItem('tiepNhanDangKyThueContext') || 'null');
        } catch {
          return null;
        }
      })();

      setCheDoNhanVien(true);
      setTrangHienTai('staff_reception');
      if (rawContext) {
        apDungContextTiepNhanDangKyThue(rawContext);
      }
      return;
    }

    if (location.pathname === ROUTES.phongGiuong) {
      const rawContext = location.state?.traCuuPhongContext || (() => {
        try {
          return JSON.parse(sessionStorage.getItem('traCuuPhongContext') || 'null');
        } catch {
          return null;
        }
      })();

      if (rawContext?.boLocTraCuu) {
        setCheDoNhanVien(true);
        setNguonTraCuuPhong(rawContext.nguonTraCuuPhong || 'tab');
        setBoLocTraCuu(rawContext.boLocTraCuu);
        if (rawContext.formKhachHang) setFormKhachHang(rawContext.formKhachHang);
        if (rawContext.formYeuCauThue) setFormYeuCauThue(rawContext.formYeuCauThue);
        if (rawContext.tieuChiUuTien) setTieuChiUuTien(rawContext.tieuChiUuTien);
        boQuaTaiTuDongPhongTrongRef.current = true;
        taiTatCaPhongTrong(rawContext.boLocTraCuu).then((ketQua) => {
          setDanhSachPhong(ketQua);
          setDanhSachPhongGoiYLichHen(ketQua);
        });
        return;
      }

      setNguonTraCuuPhong('tab');
      setDanhSachPhongGoiYLichHen([]);
    }

    if (location.pathname === ROUTES.lichHen) {
      const rawBooking = location.state?.bookingContext || (() => {
        try {
          return JSON.parse(sessionStorage.getItem('bookingContext') || 'null');
        } catch {
          return null;
        }
      })();

      if (rawBooking) {
        setCheDoNhanVien(true);
        setTrangHienTai(rawBooking.manHinhKhoiTao || 'staff_booking');
        setTabHopDongNhanVien(rawBooking.tabHopDongNhanVien || 'danh-sach-hen');
        if (rawBooking.formKhachHang) setFormKhachHang(rawBooking.formKhachHang);
        if (rawBooking.formYeuCauThue) setFormYeuCauThue(rawBooking.formYeuCauThue);
        if (rawBooking.boLocTraCuu) setBoLocTraCuu(rawBooking.boLocTraCuu);
        if (rawBooking.tieuChiUuTien) setTieuChiUuTien(rawBooking.tieuChiUuTien);
        if (Object.prototype.hasOwnProperty.call(rawBooking, 'yeuCauThueDaLuu')) {
          setYeuCauThueDaLuu(rawBooking.yeuCauThueDaLuu || null);
        }
        if (Object.prototype.hasOwnProperty.call(rawBooking, 'khachHangDaChon')) {
          setKhachHangDaChon(rawBooking.khachHangDaChon || null);
        }
        if (Object.prototype.hasOwnProperty.call(rawBooking, 'tuKhoaKhachHangLichHen')) {
          setTuKhoaKhachHangLichHen(rawBooking.tuKhoaKhachHangLichHen || '');
        }
        if (Array.isArray(rawBooking.danhSachPhongDatHen)) setDanhSachPhongDatHen(rawBooking.danhSachPhongDatHen);
        if (Array.isArray(rawBooking.danhSachPhongGoiYLichHen)) setDanhSachPhongGoiYLichHen(rawBooking.danhSachPhongGoiYLichHen);
      } else {
        setCheDoNhanVien(true);
        setTrangHienTai('staff_contracts');
        setTabHopDongNhanVien('danh-sach-hen');
      }
    }
  }, [location.key]);

  useEffect(() => {
    setTrangHienHen(1);
  }, [boLocLichHen, tuKhoaLichHen, danhSachLichHenDB.length]);

  useEffect(() => {
    taiTuyChonTraCuuPhong();
  }, []);

  useEffect(() => {
    if (trangHienTai === 'guest_home') {
      taiThongKeTongHop();
    } else if (trangHienTai === 'staff_reception') {
      taiThongKePhongTrong();
    } else if (trangHienTai === 'search_vacancy' || (trangHienTai === 'confirm_status' && tabPhongGiuongNhanVien === 'danh-sach')) {
      if (boQuaTaiTuDongPhongTrongRef.current) {
        boQuaTaiTuDongPhongTrongRef.current = false;
        return;
      }
      taiTatCaPhongTrong();
    } else if (trangHienTai === 'staff_contracts') {
      taiDanhSachLichHen();
    }
  }, [trangHienTai, tabPhongGiuongNhanVien]);

  // Đếm ngược thời hạn thanh toán cọc (màn 2.3) — chạy mỗi giây khi đang ở màn hình này
  useEffect(() => {
    if (trangHienTai !== 'payment_request') return;
    const timer = setInterval(() => {
      setGiayConLaiThanhToan(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [trangHienTai]);

  // Đếm ngược thời gian còn lại để tiếp nhận thanh toán (màn 2.4)
  useEffect(() => {
    if (trangHienTai !== 'payment_receive') return;
    const timer = setInterval(() => {
      setGiayConLaiTiepNhan(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [trangHienTai]);

  const formatDemHoGioPhutGiay = (tongGiay) => {
    const h = Math.floor(tongGiay / 3600);
    const m = Math.floor((tongGiay % 3600) / 60);
    const s = tongGiay % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const formatDemPhutGiay = (tongGiay) => {
    const m = Math.floor(tongGiay / 60);
    const s = tongGiay % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // 4. Xử lý thay đổi form tư vấn (Guest)
  const xuLyThayDoiTuVan = (e) => {
    const { name, value } = e.target;
    setFormTuVan(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 5. Gửi yêu cầu tư vấn (Guest)
  const guiYeuCauTuVan = async (e) => {
    e.preventDefault();
    if (!formTuVan.hoTen.trim() || !formTuVan.sdt.trim()) {
      hienThongBao('error', 'Vui lòng điền đầy đủ Họ tên và Số điện thoại!');
      return;
    }

    setDangXuLy(true);
    try {
      const response = await fetch('/api/gui-tu-van', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formTuVan)
      });
      const data = await response.json();
      if (response.ok && data.ok) {
        hienThongBao('success', 'Gửi thông tin tư vấn thành công! Chúng tôi sẽ liên hệ lại sớm nhất.');
        setFormTuVan({ hoTen: '', sdt: '', email: '', noiDung: '' });
        // Tải lại thống kê vì vừa tạo thêm 1 khách hàng mới trong DB
        taiThongKeTongHop();
      } else {
        throw new Error(data.error || 'Có lỗi xảy ra khi gửi yêu cầu');
      }
    } catch (err) {
      hienThongBao('error', `Lỗi: ${err.message}`);
    } finally {
      setDangXuLy(false);
    }
  };

  // 6. Chuyển đổi trang màn hình
  const chuyenTrang = (trang) => {
    setTrangHienTai(trang === 'review_info' ? 'staff_reception' : trang);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const xuLyDangXuatNhanVien = () => {
    if (typeof dangXuatDangNhap === 'function') {
      dangXuatDangNhap();
      return;
    }

    xoaNguoiDungDangNhap();
    setNguoiDungDangNhap(null);
    setCheDoNhanVien(false);
    setVaiTroNhanVien(null);
    chuyenTrang('guest_home');
  };

  // --- LOGIC PHÍA NHÂN VIÊN (STAFF RECEPTION) ---
  const xuLyThayDoiKhachHang = (e) => {
    const { name, value } = e.target;
    setYeuCauThueDaLuu(null);
    setFormKhachHang(prev => ({
      ...prev,
      [name]: value
    }));
    if (name === 'gioiTinh') {
      setFormYeuCauThue(prev => ({
        ...prev,
        gioiTinh: ['Nam', 'Nữ'].includes(value) ? value : 'Tất cả',
      }));
    }
  };

  const layGioiHanSoNguoiTheoLoai = (loaiPhong = formYeuCauThue.loaiPhong) => (
    loaiPhong === 'Nguyên phòng'
      ? (Number(gioiHanSucChua.nguyenPhong) || 1)
      : (Number(gioiHanSucChua.giuongGhep) || 1)
  );

  const xuLyThayDoiYeuCau = (e) => {
    const { name, value } = e.target;
    let giaTriMoi = value;
    if (['mucGiaTu', 'mucGiaDen'].includes(name)) {
      giaTriMoi = chiLayChuSo(value);
    }
    if (name === 'soNguoi') {
      const gioiHan = layGioiHanSoNguoiTheoLoai(formYeuCauThue.loaiPhong);
      const soNguoi = Number(value);
      if (value && soNguoi > gioiHan) {
        giaTriMoi = String(gioiHan);
        hienThongBao('error', `Số người tối đa hiện có cho hình thức thuê này là ${gioiHan}.`);
      } else if (value && soNguoi < 1) {
        giaTriMoi = '1';
      }
    }
    setYeuCauThueDaLuu(null);
    setFormYeuCauThue(prev => ({
      ...prev,
      [name]: giaTriMoi
    }));
    if (name === 'mucGiaDen') {
      setFormKhachHang(prev => ({
        ...prev,
        khaNangTaiChinh: giaTriMoi,
      }));
    }
  };

  const xuLyChonLoaiPhong = (loai) => {
    const gioiHan = layGioiHanSoNguoiTheoLoai(loai);
    const loaiThue = loai === 'Nguyên phòng' ? 'Thuê nguyên phòng' : 'Thuê giường lẻ';
    setYeuCauThueDaLuu(null);
    setFormYeuCauThue(prev => ({
      ...prev,
      loaiPhong: loai,
      loaiThue,
      soNguoi: Math.min(Number(prev.soNguoi) || 1, gioiHan)
    }));
  };

  const xuLyThayDoiTieuChi = (name) => {
    setYeuCauThueDaLuu(null);
    setTieuChiUuTien(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const chuyenSangTraCuuTuNhanVien = async () => {
    const danhSachTieuChi = layDanhSachTieuChiDangKyThue(tieuChiUuTien, tuyChonTraCuuPhong.tienIch);
    const loiKiemTra = kiemTraThongTinDangKyThue(formKhachHang, formYeuCauThue);

    if (loiKiemTra) {
      hienThongBao('error', loiKiemTra);
      return;
    }

    const gioiHanSoNguoi = layGioiHanSoNguoiTheoLoai(formYeuCauThue.loaiPhong);
    if (Number(formYeuCauThue.soNguoi) > gioiHanSoNguoi) {
      hienThongBao('error', `Số người tối đa hiện có cho hình thức thuê này là ${gioiHanSoNguoi}.`);
      return;
    }

    const gioiTinhKhachHang = ['Nam', 'Nữ'].includes(formKhachHang.gioiTinh) ? formKhachHang.gioiTinh : 'Tất cả';
    const yeuCauThueChoTraCuu = {
      ...formYeuCauThue,
      gioiTinh: gioiTinhKhachHang,
      loaiThue: formYeuCauThue.loaiPhong === 'Nguyên phòng' ? 'Thuê nguyên phòng' : 'Thuê giường lẻ',
    };
    const newFilters = mapYeuCauThueSangBoLoc(yeuCauThueChoTraCuu, danhSachTieuChi);
    await kiemTraKhachHangTrung(formKhachHang);

    setBoLocTraCuu(newFilters);
    setCheDoNhanVien(true);
    setTabPhongGiuongNhanVien('danh-sach');
    setNguonTraCuuPhong('tiep-nhan');

    const ketQuaPhong = await taiTatCaPhongTrong(newFilters);
    setDanhSachPhong(ketQuaPhong);
    setDanhSachPhongGoiYLichHen(ketQuaPhong);
    setDaTraCuu(false);
    const context = {
      nguonTraCuuPhong: 'tiep-nhan',
      boLocTraCuu: newFilters,
      formKhachHang,
      formYeuCauThue: yeuCauThueChoTraCuu,
      tieuChiUuTien,
      yeuCauThueDaLuu,
    };
    const tiepNhanContext = taoContextTiepNhanDangKyThue({
      formYeuCauThue: yeuCauThueChoTraCuu,
      tieuChiUuTien,
      yeuCauThueDaLuu,
    });
    sessionStorage.setItem('traCuuPhongContext', JSON.stringify(context));
    sessionStorage.setItem('tiepNhanDangKyThueContext', JSON.stringify(tiepNhanContext));
    navigate(ROUTES.phongGiuong, { state: { traCuuPhongContext: context } });
    hienThongBao('success', `Đã chuyển sang Tra cứu phòng/giường với ${ketQuaPhong.length} kết quả phù hợp.`);
  };

  const xuLyGuiYeuCauNhanVien = async (e) => {
    if (e) e.preventDefault();
    setDangXuLy(true);
    try {
      await chuyenSangTraCuuTuNhanVien();
    } catch (err) {
      console.error('Lỗi tiếp nhận đăng ký thuê:', err);
      hienThongBao('error', err.message || 'Không thể tiếp nhận đăng ký thuê.');
    } finally {
      setDangXuLy(false);
    }
  };

  const moPopupChinhSuaLichHen = (lichHen) => {
    setLichHenDangSua(lichHen);
    setFormSuaLichHen({
      ketQua: lichHen.KhoaPhongChot ? 'Đã xem' : (lichHen.KetQua || 'Chưa xem'),
      ghiChu: lichHen.GhiChu || '',
      maPhong: (lichHen.DaChotPhong || lichHen.KhoaPhongChot) && lichHen.MaPhong ? String(lichHen.MaPhong) : '',
    });
  };

  const luuChinhSuaLichHen = async (e) => {
    if (e) e.preventDefault();
    if (!lichHenDangSua) return;
    await capNhatTrangThaiLichHen(
      lichHenDangSua.MaLich,
      formSuaLichHen.ketQua,
      formSuaLichHen.ghiChu,
      lichHenDangSua.KhoaPhongChot ? undefined : formSuaLichHen.maPhong
    );
    setLichHenDangSua(null);
  };

  const xuLyLuuThongTinDangKyThue = async () => {
    const danhSachTieuChi = layDanhSachTieuChiDangKyThue(tieuChiUuTien, tuyChonTraCuuPhong.tienIch);
    const loiKiemTra = kiemTraThongTinDangKyThue(formKhachHang, formYeuCauThue);

    if (loiKiemTra) {
      hienThongBao('error', loiKiemTra);
      chuyenTrang('staff_reception');
      return;
    }

    setDangXuLy(true);
    try {
      const payload = taoPayloadTiepNhanDangKyThue({
        formKhachHang,
        formYeuCauThue,
        danhSachTieuChi,
        nguoiDungDangNhap,
      });
      const data = await guiTiepNhanDangKyThue(payload);
      const yeuCauDaLuu = data.data?.yeuCauThue || null;
      setYeuCauThueDaLuu(yeuCauDaLuu);
      const maYC = yeuCauDaLuu?.MaYC ? ` #${yeuCauDaLuu.MaYC}` : '';

      if (phongDaChon) {
        setDanhSachPhongDatHen(prev => {
          if (prev.some(room => room.maId === phongDaChon.maId && room.kieu === phongDaChon.kieu)) return prev;
          return [...prev, phongDaChon];
        });
        hienThongBao('success', `Đã lưu thông tin đăng ký thuê${maYC}. Tiếp tục đặt lịch hẹn xem phòng.`);
        chuyenTrang('staff_booking');
      } else {
        hienThongBao('success', `Đã lưu thông tin đăng ký thuê${maYC}. Hãy tra cứu và chọn phòng để đặt lịch hẹn.`);
      }
    } catch (err) {
      console.error('Lỗi lưu thông tin đăng ký thuê:', err);
      hienThongBao('error', err.message || 'Không thể lưu thông tin đăng ký thuê.');
    } finally {
      setDangXuLy(false);
    }
  };

  const moChiTietPhong = (item, trangNguon = 'search_vacancy') => {
    setPhongDaChon(item);
    setTrangTruocChiTietPhong(trangNguon);
    setTrangHienTai('room_detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const xuLyDatPhong = (item) => {
    if (cheDoNhanVien) {
      if (vaiTroNhanVien !== 'sale') {
        setPhongDaChon(item);
        setTrangTruocChiTietPhong('search_vacancy');
        setTrangHienTai('room_detail');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const danhSachChon = [item];
      setPhongDaChon(item);
      setDanhSachPhongDatHen(danhSachChon);
      diDenManHinhDatLichHen(danhSachChon);
      hienThongBao('success', `Đã chọn ${item.ten}. Tiếp tục đặt lịch hẹn xem phòng.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setHenXemPhongModal(item);
  };

  // --- LOGIC 2.1 RÀ SOÁT THÔNG TIN THUÊ (SALE) ---
  const xuLyToggleChecklist = (key) => {
    setChecklistRaSoat(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const xuLyTuChoiRaSoat = () => {
    hienThongBao('error', 'Đã từ chối — khách không đủ điều kiện thuê.');
  };

  const xuLyGuiQuanLyKiemTra = () => {
    const soDieuKienDat = Object.values(checklistRaSoat).filter(Boolean).length;
    hienThongBao('success', `Đã gửi yêu cầu kiểm tra tình trạng phòng cho Quản lý (${soDieuKienDat}/4 điều kiện đạt).`);
  };

  // --- LOGIC 2.2 XÁC NHẬN TÌNH TRẠNG (QUẢN LÝ) ---
  const xuLyXacNhanConTrong = () => {
    setKetQuaXacNhanTinhTrang('con-trong');
    hienThongBao('success', 'Đã xác nhận giường còn trống. Cho phép Sale tiếp tục đặt cọc.');
  };

  const xuLyXacNhanDaGiuCho = () => {
    setKetQuaXacNhanTinhTrang('da-giu-cho');
    hienThongBao('error', 'Đã thông báo cho Sale phòng/giường này đã được giữ chỗ.');
  };

  // --- LOGIC 2.3 YÊU CẦU THANH TOÁN (SALE) ---
  const xuLyThayDoiThanhToanCoc = (e) => {
    const { name, value } = e.target;
    setThongTinThanhToanCoc(prev => ({ ...prev, [name]: value }));
  };

  const tinhTienCocDeXuat = () => {
    const giaThueThang = 2500000;
    const soGiuong = Number(thongTinThanhToanCoc.soGiuong) || 0;
    return giaThueThang * 2 * soGiuong;
  };

  const xuLyGuiYeuCauThanhToanChoKhach = () => {
    hienThongBao('success', `Đã gửi yêu cầu thanh toán cọc ${tinhTienCocDeXuat().toLocaleString('vi-VN')}đ cho khách hàng.`);
  };

  // --- LOGIC 2.4 TIẾP NHẬN THANH TOÁN (KẾ TOÁN) ---
  const inputChungTuRef = useRef(null);

  const xuLyChonFileChungTu = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setChungTuThanhToanFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setChungTuThanhToanPreview(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setChungTuThanhToanPreview(null);
    }
    hienThongBao('success', `Đã đính kèm file: ${file.name}`);
  };

  const xuLyThayDoiTiepNhanThanhToan = (e) => {
    const { name, value } = e.target;
    setFormTiepNhanThanhToan(prev => ({ ...prev, [name]: value }));
  };

  const xuLyXacNhanTiepNhanGuiQuanLy = () => {
    if (!formTiepNhanThanhToan.soTienThucThu) {
      hienThongBao('error', 'Vui lòng nhập số tiền thực thu trước khi xác nhận!');
      return;
    }
    hienThongBao('success', 'Đã xác nhận tiếp nhận thanh toán và gửi Quản lý duyệt.');
  };

  // --- LOGIC 2.5 PHÊ DUYỆT CỌC (QUẢN LÝ) ---
  const xuLyDuyetCoc = () => {
    setTrangThaiPheDuyetCoc('da-duyet');
    hienThongBao('success', 'Đã duyệt — Xác nhận đã nhận tiền cọc hợp lệ. Trạng thái phòng đã chuyển sang Đã đặt cọc.');
  };

  const xuLyTuChoiCoc = () => {
    setTrangThaiPheDuyetCoc('da-tu-choi');
    hienThongBao('error', 'Đã từ chối yêu cầu đặt cọc này.');
  };

  const menuNhanVienHienThi = layMenuNhanVienTheoVaiTro(vaiTroNhanVien);

  const xuLyChonMenuNhanVien = (e, item) => {
    e.preventDefault();
    setCheDoNhanVien(true);

    if (item.path === ROUTES.tiepNhanDangKyThue) {
      batDauTiepNhanMoi();
    } else if (item.path === ROUTES.phongGiuong) {
      sessionStorage.removeItem('traCuuPhongContext');
      setNguonTraCuuPhong('tab');
      setDanhSachPhongGoiYLichHen([]);
      setTabPhongGiuongNhanVien('danh-sach');
      chuyenTrang('search_vacancy');
    } else if (item.path === ROUTES.lichHen) {
      sessionStorage.removeItem('bookingContext');
      setTabHopDongNhanVien('danh-sach-hen');
      chuyenTrang('staff_contracts');
    } else if (item.path === ROUTES.hopDong) {
      chuyenTrang('staff_hop_dong');
    } else if (item.path === ROUTES.checkout) {
      chuyenTrang('staff_checkout');
    } else if (item.path === ROUTES.staffPayment) {
      chuyenTrang('staff_payment');
    }

    navigate(item.path);
  };

  const laMenuNhanVienDangHoatDong = (item) => {
    if (location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)) return true;
    if (item.path === ROUTES.tiepNhanDangKyThue) return trangHienTai === 'staff_reception';
    if (item.path === ROUTES.phongGiuong) {
      return trangHienTai === 'search_vacancy' || (trangHienTai === 'confirm_status' && tabPhongGiuongNhanVien === 'danh-sach');
    }
    if (item.path === ROUTES.lichHen) return trangHienTai === 'staff_contracts' && tabHopDongNhanVien === 'danh-sach-hen';
    if (item.path === ROUTES.hopDong) return trangHienTai === 'staff_hop_dong';
    if (item.path === ROUTES.checkout) return trangHienTai.startsWith('staff_checkout');
    if (item.path === ROUTES.staffPayment) return trangHienTai === 'staff_payment';
    return false;
  };

  // --- RENDER GIAO DIỆN ---
  return (
    <div className="app-shell">

      {/* HEADER NAVBAR (Chung cho toàn web) */}
      <nav className="navbar">
        <div className="logo-container" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <a href="#" className="logo" onClick={(e) => { e.preventDefault(); if (cheDoNhanVien) navigate(ROUTES.dashboard); else chuyenTrang('guest_home'); }}>
            HomeStay Dorm
          </a>
        </div>

        {cheDoNhanVien === false ? (
          // Menu dành cho Guest
          <ul className="nav-links">
            <li className={trangHienTai === 'guest_home' && activeSection === 'home' ? 'active' : ''}>
              <a href="#" onClick={(e) => { e.preventDefault(); setCheDoNhanVien(false); chuyenTrang('guest_home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Trang chủ</a>
            </li>
            <li className={trangHienTai === 'search_vacancy' || (trangHienTai === 'guest_home' && activeSection === 'popular') ? 'active' : ''}>
              <a href="#popular" onClick={(e) => {
                if (trangHienTai === 'guest_home') {
                  cuonMuonDenSection(e, 'popular');
                } else {
                  setCheDoNhanVien(false);
                  chuyenTrang('search_vacancy');
                }
              }}>Phòng/Giường</a>
            </li>
            <>
              <li className={activeSection === 'utilities' ? 'active' : ''}><a href="#utilities" onClick={(e) => cuonMuonDenSection(e, 'utilities')}>Tiện ích</a></li>
              <li className={activeSection === 'reviews' ? 'active' : ''}><a href="#reviews" onClick={(e) => cuonMuonDenSection(e, 'reviews')}>Đánh giá</a></li>
              <li className={activeSection === 'consult' ? 'active' : ''}><a href="#consult" onClick={(e) => cuonMuonDenSection(e, 'consult')}>Đăng ký tư vấn</a></li>
            </>
          </ul>
        ) : (
          // Menu dành cho Nhân viên (được phân quyền động)
          <ul className="nav-links">
            {menuNhanVienHienThi.map((item) => (
              <li key={item.key} className={laMenuNhanVienDangHoatDong(item) ? 'active' : ''}>
                <a href="#" onClick={(e) => xuLyChonMenuNhanVien(e, item)}>{item.label}</a>
              </li>
            ))}
          </ul>
        )}

        <div className="nav-actions">
          {cheDoNhanVien === false ? (
            <button className="submit-btn" style={{ height: '40px', width: 'auto', padding: '0 20px', fontSize: '13px' }} onClick={chuyenDenKhuVucNhanVien}>
              Dành cho Nhân viên
            </button>
          ) : (
            <div className="user-profile">
              <span className="mini-tag" style={{ background: vaiTroNhanVien === 'sale' ? 'var(--primary-color)' : vaiTroNhanVien === 'quanly' ? '#3B82F6' : vaiTroNhanVien === 'ketoan' ? '#10B981' : vaiTroNhanVien === 'admin' ? '#8B5CF6' : '#F59E0B', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', textTransform: 'capitalize' }}>
                {vaiTroNhanVien || 'staff'}
              </span>
              {nguoiDungDangNhap?.hoTen && <span className="qt-user-name">{nguoiDungDangNhap.hoTen}</span>}
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&width=100&auto=format&fit=crop" alt="Staff avatar" className="avatar" />
              <button className="logout-btn" onClick={xuLyDangXuatNhanVien}>Đăng xuất</button>
            </div>
          )}
        </div>
      </nav>

      {/* RENDER MÀN HÌNH TƯƠNG ỨNG */}
      {trangHienTai === 'guest_home' && (
        // ==========================================
        // GIAO DIỆN TRANG CHỦ KHÁCH HÀNG (GUEST HOME)
        // ==========================================
        <div className="guest-landing">

          {/* NEW MODERN HERO SECTION */}
          <section className="guest-hero-container">
            <div className="hero-left-col">
              <h1 className="hero-main-title">Tìm phòng ở TP.HCM?</h1>
              <p className="hero-subtitle">
                Giải pháp lưu trú hoàn hảo, hiện đại, an toàn và đầy đủ tiện nghi hàng đầu tại TP. Hồ Chí Minh dành cho học sinh, sinh viên và người đi làm năng động.
              </p>

              <div className="hero-actions-row">
                <a href="#consult" className="btn-get-started" onClick={(e) => cuonMuonDenSection(e, 'consult')}>Đăng ký tư vấn</a>
                <button type="button" className="btn-explore-now" onClick={() => { setCheDoNhanVien(false); chuyenTrang('search_vacancy'); }}>
                  Xem danh sách phòng
                </button>
              </div>

              {/* Animated Counters Row */}
              <div className="hero-stats-row">
                <div className="animated-stat-item">
                  <strong className="stat-number">
                    <AnimatedCounter end={2450} suffix="+" />
                  </strong>
                  <span className="stat-label">Khách hàng tin tưởng</span>
                </div>
                <div className="animated-stat-item">
                  <strong className="stat-number">
                    <AnimatedCounter end={128} suffix="+" />
                  </strong>
                  <span className="stat-label">Phòng đang cho thuê</span>
                </div>
                <div className="animated-stat-item">
                  <strong className="stat-number">
                    <AnimatedCounter end={52} suffix="+" />
                  </strong>
                  <span className="stat-label">Phòng còn trống</span>
                </div>
              </div>
            </div>

            <div className="hero-right-col">
              <div className="hero-collage-container">
                <img
                  src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&width=600&auto=format&fit=crop"
                  alt="Modern homestay building architecture"
                  className="collage-img img-main"
                />
                <img
                  src="/dorm_room.png"
                  alt="Cozy interior room"
                  className="collage-img img-sub-left"
                />
                <img
                  src="/cozy_dorm_bed.png"
                  alt="Lifestyle co-living"
                  className="collage-img img-sub-right"
                />
              </div>
            </div>

            {/* Overlapping Floating Search Box */}
            <div className="floating-search-bar">
              <h3 className="search-bar-title">Tìm kiếm nhanh phòng trống</h3>

              <div className="search-fields-row">
                <div className="search-field-group">
                  <label htmlFor="quick-khuvuc">Khu vực / Chi nhánh</label>
                  <div className="select-input-wrapper">
                    <span>📍</span>
                    <select
                      id="quick-khuvuc"
                      value={timKiemNhanhKhuVuc}
                      onChange={(e) => setTimKiemNhanhKhuVuc(e.target.value)}
                    >
                      <option value="Tất cả">Tất cả chi nhánh</option>
                      <option value="Quận 1">Quận 1</option>
                      <option value="Quận 3">Quận 3</option>
                      <option value="Bình Thạnh">Bình Thạnh</option>
                    </select>
                  </div>
                </div>

                <div className="search-field-group">
                  <label htmlFor="quick-loaiphong">Loại phòng</label>
                  <div className="select-input-wrapper">
                    <span>🏢</span>
                    <select
                      id="quick-loaiphong"
                      value={timKiemNhanhLoai}
                      onChange={(e) => setTimKiemNhanhLoai(e.target.value)}
                    >
                      <option value="Tất cả">Tất cả các loại</option>
                      <option value="Phong">Nguyên phòng</option>
                      <option value="Giuong">Giường ghép (Dorm)</option>
                    </select>
                  </div>
                </div>

                <div className="search-field-group">
                  <label htmlFor="quick-ngansach">Ngân sách tối đa</label>
                  <div className="select-input-wrapper">
                    <span>💵</span>
                    <select
                      id="quick-ngansach"
                      value={timKiemNhanhGia}
                      onChange={(e) => setTimKiemNhanhGia(e.target.value)}
                    >
                      <option value="5000000">Dưới 5 triệu / tháng</option>
                      <option value="3000000">Dưới 3 triệu / tháng</option>
                      <option value="2000000">Dưới 2 triệu / tháng</option>
                    </select>
                  </div>
                </div>

                <button type="button" className="btn-search-now" onClick={chuyenSangTraCuuNhanhFromHero}>
                  Tìm kiếm ngay
                </button>
              </div>
            </div>
          </section>

          {/* POPULAR HOMES SECTION */}
          <section className="popular-section" id="popular">
            <div className="popular-header">
              <div>
                <span className="popular-tagline">🔥 PHỔ BIẾN</span>
                <h2 className="popular-main-title">Phòng Nổi Bật Của Chúng Tôi</h2>
              </div>
              <button
                type="button"
                className="btn-explore-all"
                onClick={() => { setCheDoNhanVien(false); chuyenTrang('search_vacancy'); }}
              >
                Khám phá tất cả
              </button>
            </div>

            <div className="popular-grid">
              {/* Popular Card 1 */}
              <article className="popular-card">
                <img
                  src="/dorm_room.png"
                  alt="Dorm room 1"
                  className="popular-card-img"
                />
                <div className="popular-card-body">
                  <div className="popular-location">📍 Vinhomes Central Park, Bình Thạnh</div>
                  <h4 className="popular-title">Phòng Luxury 4 Giường - Tầng 4</h4>
                  <div className="popular-specs">
                    <span>🛌 4 Giường</span>
                    <span>•</span>
                    <span>❄️ Điều hòa</span>
                    <span>•</span>
                    <span>🧺 Máy giặt</span>
                  </div>
                  <div className="popular-footer">
                    <button
                      type="button"
                      className="btn-book-now"
                      onClick={() => {
                        setPhongDaChon({
                          maId: 101,
                          ten: 'Phòng Luxury 4 Giường - Tầng 4',
                          kieu: 'Giuong',
                          giaThue: 2500000,
                          chiNhanh: 'Bình Thạnh',
                          diaChi: 'Vinhomes Central Park, Bình Thạnh',
                          tienIch: 'Điều hòa, Wifi, Máy giặt, Tủ lạnh, An ninh'
                        });
                        setTrangHienTai('room_detail');
                      }}
                    >
                      Xem chi tiết
                    </button>
                    <span className="popular-price">2,500,000đ<span>/tháng</span></span>
                  </div>
                </div>
              </article>

              {/* Popular Card 2 */}
              <article className="popular-card">
                <img
                  src="/studio_loft.png"
                  alt="Studio Loft"
                  className="popular-card-img"
                />
                <div className="popular-card-body">
                  <div className="popular-location">📍 123 Nguyễn Trãi, Quận 1</div>
                  <h4 className="popular-title">Phòng Studio Loft Premium</h4>
                  <div className="popular-specs">
                    <span>🛌 Nguyên phòng</span>
                    <span>•</span>
                    <span>❄️ Điều hòa</span>
                    <span>•</span>
                    <span>🍳 Bếp riêng</span>
                  </div>
                  <div className="popular-footer">
                    <button
                      type="button"
                      className="btn-book-now"
                      onClick={() => {
                        setPhongDaChon({
                          maId: 202,
                          ten: 'Phòng Studio Loft Premium',
                          kieu: 'Phong',
                          giaThue: 4500000,
                          chiNhanh: 'Quận 1',
                          diaChi: '123 Nguyễn Trãi, Quận 1',
                          tienIch: 'Điều hòa, Wifi, Tủ lạnh, Bếp riêng, An ninh'
                        });
                        setTrangHienTai('room_detail');
                      }}
                    >
                      Xem chi tiết
                    </button>
                    <span className="popular-price">4,500,000đ<span>/tháng</span></span>
                  </div>
                </div>
              </article>

              {/* Popular Card 3 */}
              <article className="popular-card">
                <img
                  src="/cozy_dorm_bed.png"
                  alt="Dorm Bed"
                  className="popular-card-img"
                />
                <div className="popular-card-body">
                  <div className="popular-location">📍 456 Lê Văn Sỹ, Quận 3</div>
                  <h4 className="popular-title">Dorm Cao Cấp 6 Giường - Tầng 2</h4>
                  <div className="popular-specs">
                    <span>🛌 6 Giường</span>
                    <span>•</span>
                    <span>❄️ Điều hòa</span>
                    <span>•</span>
                    <span>🔒 Khóa từ</span>
                  </div>
                  <div className="popular-footer">
                    <button
                      type="button"
                      className="btn-book-now"
                      onClick={() => {
                        setPhongDaChon({
                          maId: 303,
                          ten: 'Dorm Cao Cấp 6 Giường - Tầng 2',
                          kieu: 'Giuong',
                          giaThue: 2000000,
                          chiNhanh: 'Quận 3',
                          diaChi: '456 Lê Văn Sỹ, Quận 3',
                          tienIch: 'Điều hòa, Wifi, Tủ lạnh, An ninh'
                        });
                        setTrangHienTai('room_detail');
                      }}
                    >
                      Xem chi tiết
                    </button>
                    <span className="popular-price">2,000,000đ<span>/tháng</span></span>
                  </div>
                </div>
              </article>
            </div>
          </section>

          {/* DỊCH VỤ & TIỆN ÍCH NỔI BẬT */}
          <section className="features-section" id="utilities">
            <h2 className="section-title-landing">Dịch vụ &amp; Tiện ích nổi bật</h2>
            <p className="section-subtitle-landing">Trải nghiệm sống tuyệt vời với không gian chung cao cấp và dịch vụ chu đáo</p>

            <div className="features-grid">
              <div className="feature-item-card">
                <div className="feature-icon-circle">📍</div>
                <h3>Vị trí đắc địa</h3>
                <p>Hệ thống chi nhánh tại các Quận trung tâm (Quận 1, Quận 3, Bình Thạnh) gần sát các trường Đại học lớn và các tuyến đường huyết mạch.</p>
              </div>
              <div className="feature-item-card">
                <div className="feature-icon-circle">🔒</div>
                <h3>An ninh tuyệt đối</h3>
                <p>Khóa thẻ từ/vân tay hiện đại, camera giám sát 24/7. Không gian yên tĩnh, lành mạnh phù hợp cho học tập và nghỉ ngơi.</p>
              </div>
              <div className="feature-item-card">
                <div className="feature-icon-circle">⚡</div>
                <h3>Đầy đủ tiện nghi</h3>
                <p>Trang bị sẵn Điều hòa nhiệt độ, Wifi tốc độ cao riêng cho từng phòng, bãi giữ xe an toàn, không gian giặt ủi và dọn phòng định kỳ.</p>
              </div>
            </div>
          </section>


          {/* ĐÁNH GIÁ CỦA KHÁCH HÀNG (REVIEWS) */}
          <section className="reviews-section" id="reviews">
            <h2 className="section-title-landing">Trải nghiệm thực tế từ cư dân</h2>
            <p className="section-subtitle-landing">Lắng nghe những chia sẻ chân thực từ các bạn học sinh, sinh viên và người đi làm đang sinh sống tại hệ thống</p>

            <div className="reviews-grid">
              <div className="review-card-item">
                <div className="review-rating">⭐⭐⭐⭐⭐</div>
                <p className="review-comment">"Không gian sạch sẽ, rất yên tĩnh để tự học tối. Điều hòa chạy êm và Wifi riêng ổn định không bị chập chờn. Các bạn ở ghép cùng phòng cũng rất có ý thức giữ gìn vệ sinh chung."</p>
                <div className="review-author">
                  <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&width=80&auto=format&fit=crop" alt="Lan Anh" />
                  <div>
                    <h4>Nguyễn Lan Anh</h4>
                    <span>Sinh viên Đại học KHXH&amp;NV</span>
                  </div>
                </div>
              </div>

              <div className="review-card-item">
                <div className="review-rating">⭐⭐⭐⭐⭐</div>
                <p className="review-comment">"Mình cực kỳ thích việc giờ giấc tự do tại HomeStay Dorm, đi làm ca tối về không lo bị khóa cửa. Bãi xe rộng, an ninh khóa vân tay nên rất yên tâm, chi phí điện nước rõ ràng."</p>
                <div className="review-author">
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&width=80&auto=format&fit=crop" alt="Minh Đức" />
                  <div>
                    <h4>Trần Minh Đức</h4>
                    <span>Lập trình viên Software</span>
                  </div>
                </div>
              </div>

              <div className="review-card-item">
                <div className="review-rating">⭐⭐⭐⭐⭐</div>
                <p className="review-comment">"Dịch vụ dọn vệ sinh định kỳ 2 lần/tuần giúp phòng lúc nào cũng thơm tho. Vị trí ngay Bình Thạnh đi làm sang Quận 1 chỉ mất 5 phút. Ban quản lý hỗ trợ rất nhiệt tình khi gặp sự cố."</p>
                <div className="review-author">
                  <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&width=80&auto=format&fit=crop" alt="Hương Giang" />
                  <div>
                    <h4>Vũ Hương Giang</h4>
                    <span>Nhân viên Văn phòng</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ĐĂNG KÝ TƯ VẤN SECTION (FORM) */}
          <section className="consult-section" id="consult">
            <div className="consult-container">
              <div className="consult-info">
                <h2>Bạn cần tìm phòng ngủ ưng ý?</h2>
                <p>Để lại thông tin liên hệ ngay dưới đây, đội ngũ chăm sóc khách hàng của HomeStay Dorm sẽ liên hệ và tư vấn chi nhánh phù hợp nhất cho nhu cầu của bạn!</p>
                <div className="consult-contact-details">
                  <div className="contact-line">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="var(--primary-color)" viewBox="0 0 16 16">
                      <path d="M1.885.511a1.745 1.745 0 0 1 2.61.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.678.678 0 0 0 .178.643l2.457 2.457a.678.678 0 0 0 .644.178l2.189-.547a1.745 1.745 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.634 18.634 0 0 1-7.01-4.42 18.634 18.634 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877L1.885.511z" />
                    </svg>
                    <strong>Hotline liên hệ:</strong> 090 999 8888
                  </div>
                  <div className="contact-line">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="var(--primary-color)" viewBox="0 0 16 16">
                      <path d="M8 0a5.53 5.53 0 0 0-5.4 5.5c0 3.7 4.9 9.8 5.1 10a.6.6 0 0 0 .6 0c.2-.2 5.1-6.3 5.1-10A5.53 5.53 0 0 0 8 0zm0 8a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
                    </svg>
                    <strong>Văn phòng trung tâm:</strong> 123 Nguyễn Trãi, Quận 1, TP. Hồ Chí Minh
                  </div>
                </div>
              </div>

              <form className="consult-form" onSubmit={guiYeuCauTuVan}>
                <h3>Nhận tư vấn miễn phí</h3>

                <div className="input-group">
                  <label htmlFor="form-hoTen">Họ và tên</label>
                  <input
                    type="text"
                    id="form-hoTen"
                    name="hoTen"
                    placeholder="Nguyễn Văn A"
                    value={formTuVan.hoTen}
                    onChange={xuLyThayDoiTuVan}
                    required
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="form-sdt">Số điện thoại</label>
                  <input
                    type="tel"
                    id="form-sdt"
                    name="sdt"
                    placeholder="09xx xxx xxx"
                    value={formTuVan.sdt}
                    onChange={xuLyThayDoiTuVan}
                    required
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="form-email">Email (Không bắt buộc)</label>
                  <input
                    type="email"
                    id="form-email"
                    name="email"
                    placeholder="example@gmail.com"
                    value={formTuVan.email}
                    onChange={xuLyThayDoiTuVan}
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="form-noiDung">Nội dung yêu cầu / Ghi chú</label>
                  <textarea
                    id="form-noiDung"
                    name="noiDung"
                    rows="3"
                    placeholder="Ví dụ: Em muốn tư vấn phòng đơn Quận Bình Thạnh dưới 4 triệu, dọn vào đầu tháng tới..."
                    value={formTuVan.noiDung}
                    onChange={xuLyThayDoiTuVan}
                    style={{
                      padding: '12px 16px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      backgroundColor: '#f8fafc',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  ></textarea>
                </div>

                <button type="submit" className="submit-btn" disabled={dangXuLy}>
                  {dangXuLy ? 'Đang gửi...' : 'Gửi yêu cầu tư vấn'}
                </button>
              </form>
            </div>
          </section>

          {/* FOOTER */}
          <footer className="footer-landing">
            <p>© 2026 Hệ thống Homestay &amp; Dormitory HomeStay Dorm. Tất cả các quyền được bảo lưu.</p>
            <p style={{ fontSize: '12px', marginTop: '6px', color: '#94a3b8' }}>Phát triển bởi Nhóm PTTK Hệ thống thông tin.</p>
          </footer>

        </div>
      )}

      {/* ==========================================
          TRANG TRA CỨU PHÒNG TRỐNG (VACANCY SEARCH)
          ========================================== */}
      <TraCuuPhongGiuongPage
        trangHienTai={trangHienTai}
        cheDoNhanVien={cheDoNhanVien}
        vaiTroNhanVien={vaiTroNhanVien}
        tabPhongGiuongNhanVien={tabPhongGiuongNhanVien}
        setTabPhongGiuongNhanVien={setTabPhongGiuongNhanVien}
        guiYeuCauTimKiemVacant={guiYeuCauTimKiemVacant}
        boLocTraCuu={boLocTraCuu}
        tuyChonTraCuuPhong={tuyChonTraCuuPhong}
        xuLyThayDoiBoLoc={xuLyThayDoiBoLoc}
        xuLyToggleTienIchTraCuu={xuLyToggleTienIchTraCuu}
        xuLyLuuTienIchTraCuu={xuLyLuuTienIchTraCuu}
        dangTaiPhongTrong={dangTaiPhongTrong}
        danhSachTatCaPhongTrong={danhSachTatCaPhongTrong}
        trangTraCuuHienTai={trangTraCuuHienTai}
        SO_LUONG_MOI_TRANG={SO_LUONG_MOI_TRANG}
        setTrangTraCuuHienTai={setTrangTraCuuHienTai}
        setPhongDaChon={setPhongDaChon}
        setTrangHienTai={setTrangHienTai}
        layAnhMinhHoaPhong={layAnhMinhHoaPhong}
        setHenXemPhongModal={setHenXemPhongModal}
        chuyenTrang={chuyenTrang}
        chiTietPhongModal={chiTietPhongModal}
        setChiTietPhongModal={setChiTietPhongModal}
        henXemPhongModal={henXemPhongModal}
        guiYeuCauDatLichHen={guiYeuCauDatLichHen}
        formHenXem={formHenXem}
        xuLyThayDoiHenXem={xuLyThayDoiHenXem}
        dangXuLy={dangXuLy}
        xuLyDatPhong={xuLyDatPhong}
        moChiTietPhong={moChiTietPhong}
        nguonTraCuuPhong={nguonTraCuuPhong}
        diDenDatLichHenTuTraCuu={diDenDatLichHenTuTraCuu}
        quayLaiTiepNhanTuTraCuu={quayLaiTiepNhanTuTraCuu}
      />
      {trangHienTai === 'room_detail' && phongDaChon && (
        <div className="room-detail-page">

          <div className="back-navigation">
            <button type="button" className="btn-back-link" onClick={() => { chuyenTrang(cheDoNhanVien ? trangTruocChiTietPhong : 'search_vacancy'); }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
                <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z" />
              </svg>
              Quay lại danh sách
            </button>
          </div>

          <div className="detail-top-grid">

            {/* Left Image Gallery */}
            <div className="detail-images-gallery">
              <div className="detail-main-img-wrapper">
                <img src={layAnhMinhHoaPhong(phongDaChon)} alt={phongDaChon.ten} className="detail-main-img" />
                <div className="detail-main-badges">
                  <span className={`badge-type ${phongDaChon.kieu === 'Phong' ? 'badge-phong-loai' : 'badge-giuong-loai'}`}>
                    {phongDaChon.kieu === 'Phong' ? 'NGUYÊN PHÒNG' : 'PHÒNG GHÉP'}
                  </span>
                  <span className="badge-status-empty">
                    {phongDaChon.kieu === 'Phong' ? 'Đang trống' : 'Đang Trống 2 Chỗ'}
                  </span>
                </div>
              </div>

              <div className="detail-thumbnails-row">
                <div className="thumb-wrapper active">
                  <img src={layAnhMinhHoaPhong(phongDaChon)} alt="Ảnh phòng 1" />
                </div>
                <div className="thumb-wrapper">
                  <img src="https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&width=200&auto=format&fit=crop" alt="Ảnh phòng 2" />
                </div>
                <div className="thumb-wrapper">
                  <img src="https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?q=80&width=200&auto=format&fit=crop" alt="Ảnh phòng 3" />
                </div>
                <div className="thumb-wrapper thumb-overlay-container">
                  <img src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&width=200&auto=format&fit=crop" alt="Ảnh phòng 4" />
                  <div className="thumb-overlay-text">+8 Ảnh</div>
                </div>
              </div>
            </div>

            {/* Right Information Panel */}
            <div className="detail-info-panel">

              <div className="detail-meta-header">
                <span className="badge-room-code">Mã phòng: SD-{phongDaChon.maId || 402}</span>
                <span className="rating-stars">⭐ 4.8 (24 Đánh giá)</span>
              </div>

              <h2>{phongDaChon.ten}</h2>

              <p className="detail-address">
                Chi nhánh: <strong>{phongDaChon.chiNhanh} • {phongDaChon.diaChi}</strong>
              </p>

              <div className="detail-price-box">
                <span className="price-num">{Number(phongDaChon.giaThue).toLocaleString('vi-VN')}đ</span>
                <span className="price-unit">/tháng / {phongDaChon.kieu === 'Phong' ? 'phòng' : 'giường'}</span>
              </div>

              {/* Specs Grid 2x2 */}
              <div className="info-specs-grid">
                <div className="spec-item">
                  <span className="spec-icon">👥</span>
                  <div>
                    <span className="spec-title">Sức chứa</span>
                    <span className="spec-val">{phongDaChon.kieu === 'Phong' ? `${phongDaChon.sucChua || 1} Khách` : '04 Giường'}</span>
                  </div>
                </div>
                <div className="spec-item">
                  <span className="spec-icon">🏢</span>
                  <div>
                    <span className="spec-title">Tầng</span>
                    <span className="spec-val">Tầng 0{Math.floor(phongDaChon.maId / 100) || 4}</span>
                  </div>
                </div>
                <div className="spec-item">
                  <span className="spec-icon">📍</span>
                  <div>
                    <span className="spec-title">Khu vực</span>
                    <span className="spec-val">{phongDaChon.chiNhanh}</span>
                  </div>
                </div>
                <div className="spec-item">
                  <span className="spec-icon">✔️</span>
                  <div>
                    <span className="spec-title">Tình trạng</span>
                    <span className="spec-val font-green">Còn trống</span>
                  </div>
                </div>
              </div>

              {/* Occupancy Rate progress bar */}
              <div className="occupancy-rate-section">
                <div className="occupancy-labels">
                  <span>Tỷ lệ lấp đầy</span>
                  <strong>{phongDaChon.kieu === 'Phong' ? '0 / 1 phòng' : '2 / 4 giường'}</strong>
                </div>
                <div className="progress-occupancy-bar">
                  <div className="progress-fill" style={{ width: phongDaChon.kieu === 'Phong' ? '0%' : '50%' }}></div>
                </div>
                <p className="occupancy-helper-text">
                  {phongDaChon.kieu === 'Phong' ? 'Phòng đơn trống sẵn sàng dọn vào ở ngay.' : 'Đang có 2 khách hàng nữ sinh viên thuê.'}
                </p>
              </div>

              {/* Utilities section */}
              <div className="detail-utils-section">
                <h4>Tiện ích bao gồm</h4>
                <div className="detail-utils-row">
                  {layDanhSachTienIchHienThi(phongDaChon.tienIch).length > 0 ? (
                    layDanhSachTienIchHienThi(phongDaChon.tienIch).map((u) => (
                      <span key={u.key} className="detail-util-tag">
                        <span className="material-symbols-outlined util-icon">{u.icon}</span>
                        {u.label}
                      </span>
                    ))
                  ) : (
                    <>
                      <span className="detail-util-tag"><span className="material-symbols-outlined util-icon">ac_unit</span>Điều hòa</span>
                      <span className="detail-util-tag"><span className="material-symbols-outlined util-icon">wifi</span>Wifi</span>
                      <span className="detail-util-tag"><span className="material-symbols-outlined util-icon">local_laundry_service</span>Máy giặt</span>
                      <span className="detail-util-tag"><span className="material-symbols-outlined util-icon">kitchen</span>Tủ lạnh</span>
                      <span className="detail-util-tag"><span className="material-symbols-outlined util-icon">security</span>An ninh 24/7</span>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="detail-action-buttons">
                {cheDoNhanVien ? (
                  <button
                    type="button"
                    className="btn-action-orange btn-choose-room"
                    onClick={() => chuyenTrang(trangTruocChiTietPhong)}
                  >
                    Quay lại danh sách phòng/giường
                  </button>
                ) : (
                  <>
                    <button type="button" className="btn-action-orange btn-choose-room" onClick={() => xuLyDatPhong(phongDaChon)}>
                      Chọn phòng này
                    </button>
                    <div className="btn-divider-pipe">|</div>
                    <button type="button" className="btn-action-orange btn-book-visit" onClick={() => setHenXemPhongModal(phongDaChon)}>
                      Đặt lịch hẹn
                    </button>
                  </>
                )}
              </div>

              {!cheDoNhanVien && (
                <div className="btn-action-outline-row">
                  <button type="button" className="btn-action-outline" onClick={() => hienThongBao('success', 'Đã sao chép liên kết chia sẻ!')}>
                    🔗 Chia sẻ
                  </button>
                  <button type="button" className="btn-action-outline" onClick={() => hienThongBao('success', 'Đã lưu tin phòng này vào danh sách yêu thích!')}>
                    ❤️ Lưu tin
                  </button>
                </div>
              )}

            </div>
          </div>

          {/* Bottom Columns Section */}
          <div className="detail-bottom-section">

            {/* Left: Detailed Description */}
            <div className="detail-description">
              <h3>Mô tả chi tiết</h3>
              <p>
                Phòng Premium Homestay Dorm được thiết kế dành riêng cho sinh viên và người đi làm trẻ với không gian hiện đại, yên tĩnh và đầy đủ tiện nghi. Giường tầng được làm từ gỗ tự nhiên chắc chắn, tích hợp rèm che đảm bảo sự riêng tư tuyệt đối.
              </p>
              <p>
                Hệ thống chiếu sáng thông minh và bàn làm việc cá nhân giúp tối ưu hiệu suất học tập và làm việc. Cư dân tại đây được sử dụng miễn phí các tiện ích chung như phòng gym, hồ bơi và khu vực làm việc chung (Co-working space) tại tầng 3.
              </p>
              <ul className="detail-bullet-points">
                <li>Dọn phòng 3 lần/tuần (Thứ 2, 4, 6)</li>
                <li>Thay ga giường 1 lần/tuần</li>
                <li>Nước sinh hoạt và điện chiếu sáng đã bao gồm trong giá thuê</li>
                <li>Sử dụng bếp chung đầy đủ lò vi sóng, bếp từ</li>
              </ul>
            </div>

            {/* Right: Map Location */}
            <div className="detail-location-map">
              <h3>Vị trí</h3>
              <div className="detail-map-mockup">
                {/* Pin Point Indicator */}
                <div className="map-pin-marker">
                  <div className="pin-pulse"></div>
                  <div className="pin-icon">📍</div>
                </div>

                {/* Address Card Overlay */}
                <div className="map-address-overlay">
                  <strong>Căn hộ Landmark 81</strong>
                  <p>208 Nguyễn Hữu Cảnh, Phường 22, Bình Thạnh</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ==========================================
          TRANG ĐẶT LỊCH HẸN NHÂN VIÊN (STAFF BOOKING)
          ========================================== */}
      {trangHienTai === 'staff_booking' && (
        <div className="staff-booking-page">

          {/* Breadcrumbs */}
          <nav className="breadcrumbs" aria-label="breadcrumb">
            <span style={{ cursor: 'pointer' }} onClick={() => { setCheDoNhanVien(true); chuyenTrang('staff_reception'); }}>Khách hàng</span>
            <span className="separator">&gt;</span>
            <span style={{ cursor: 'pointer' }} onClick={() => { setCheDoNhanVien(true); chuyenTrang('staff_reception'); }}>Chi tiết khách</span>
            <span className="separator">&gt;</span>
            <span className="current">Đặt lịch hẹn</span>
          </nav>

          <h1 className="page-title">Đặt lịch hẹn xem phòng</h1>
          <p className="page-subtitle">Vui lòng hoàn tất thông tin lịch hẹn xem phòng cho khách hàng.</p>

          <div className="booking-card">

            {/* 1. Guest Information Box */}
            <div className="booking-guest-box">
              <div className="guest-box-header">
                <h3>
                  <span className="icon-user">👤</span> Thông tin khách
                </h3>
                <button type="button" className="btn-edit-guest" onClick={chuyenTiepNhanKhachHangMoi}>
                  + Tiếp nhận khách mới
                </button>
              </div>
              <div className="booking-customer-picker">
                <label htmlFor="bookingCustomerSearch">Chọn khách hàng có sẵn</label>
                <input
                  id="bookingCustomerSearch"
                  type="text"
                  placeholder="Nhập tên, SĐT hoặc CCCD để tìm khách..."
                  value={tuKhoaKhachHangLichHen}
                  onChange={(e) => {
                    setTuKhoaKhachHangLichHen(e.target.value);
                    setKhachHangDaChon(null);
                  }}
                />
                {dangTimKhachHang && <span className="customer-search-hint">Đang tìm khách hàng...</span>}
                {danhSachGoiYKhachHang.length > 0 && (
                  <div className="customer-suggestion-list">
                    {danhSachGoiYKhachHang.map((khach) => (
                      <button
                        type="button"
                        key={khach.cccd}
                        className="customer-suggestion-item"
                        onClick={() => chonKhachHangChoLichHen(khach)}
                      >
                        <strong>{khach.hoTen}</strong>
                        <span>{khach.sdt || 'Chưa có SĐT'}{khach.email ? ` • ${khach.email}` : ''}</span>
                      </button>
                    ))}
                  </div>
                )}
                {!khachHangDaChon && tuKhoaKhachHangLichHen.trim().length >= 2 && !dangTimKhachHang && danhSachGoiYKhachHang.length === 0 && (
                  <button type="button" className="btn-new-customer-inline" onClick={chuyenTiepNhanKhachHangMoi}>
                    Không có khách phù hợp? Tiếp nhận đăng ký thuê cho khách hàng mới
                  </button>
                )}
              </div>
              <div className="guest-info-grid">
                <div className="guest-info-cell">
                  <span className="cell-label">Họ và tên</span>
                  <strong className="cell-value">{formKhachHang.hoTen || 'Chưa nhập'}</strong>
                </div>
                <div className="guest-info-cell">
                  <span className="cell-label">Số điện thoại</span>
                  <strong className="cell-value">{formKhachHang.sdt || 'Chưa nhập'}</strong>
                </div>
                <div className="guest-info-cell" style={{ gridColumn: 'span 2' }}>
                  <span className="cell-label">Email</span>
                  <strong className="cell-value">{formKhachHang.email || 'Chưa nhập'}</strong>
                </div>
              </div>
            </div>

            <form onSubmit={guiLichHenNhanVien}>
              <div className="booking-section booking-viewing-note">
                <h4>
                  <span className="icon-house">🏢</span> Lịch hẹn xem phòng
                </h4>
                <p>
                  Lịch hẹn chỉ ghi nhận thời điểm khách đến xem. Phòng chốt sẽ được chọn trong danh sách lịch hẹn sau khi khách xem xong.
                </p>
              </div>

              {(() => {
                const danhSachPhongGoiY = layDanhSachPhongTuKetQuaTraCuu(danhSachPhongGoiYLichHen);
                const danhSachHienThi = danhSachPhongGoiY.slice(0, soPhongGoiYHienThi);
                const soPhongConLai = Math.max(0, danhSachPhongGoiY.length - soPhongGoiYHienThi);
                const soPhongSeXemThem = Math.min(SO_PHONG_GOI_Y_MOI_LAN, soPhongConLai);
                const daMoRongDanhSach = soPhongGoiYHienThi > SO_PHONG_GOI_Y_MOI_LAN && danhSachPhongGoiY.length > SO_PHONG_GOI_Y_MOI_LAN;

                return (
                  <div className="booking-room-suggestions">
                    <div className="booking-room-suggestions-head">
                      <div>
                        <h4>Phòng phù hợp để xem</h4>
                        <p>
                          {danhSachPhongGoiY.length
                            ? `Có ${danhSachPhongGoiY.length} phòng thỏa tiêu chí. Chỉ hiển thị tên phòng để đặt lịch nhanh.`
                            : 'Chưa có danh sách phòng phù hợp. Hãy tra cứu phòng/giường trước khi đặt lịch.'}
                        </p>
                      </div>
                      <button type="button" className="btn-detail-outline btn-search-room-for-booking" onClick={xuLyThemPhongLichHen}>
                        Tra cứu phòng/giường
                      </button>
                    </div>

                    {danhSachHienThi.length > 0 ? (
                      <div className="booking-room-chip-list">
                        {danhSachHienThi.map((room) => (
                          <span key={room.maPhong} className="booking-room-chip">
                            {room.tenPhongHienThi || `Phòng ${room.maPhong}`}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="booking-room-empty">
                        Bấm “Tra cứu phòng/giường” để lọc danh sách phòng khách có thể đến xem.
                      </div>
                    )}

                    {(soPhongConLai > 0 || daMoRongDanhSach) && (
                      <div className="booking-room-more-actions">
                        {soPhongConLai > 0 && (
                          <button
                            type="button"
                            className="btn-show-more-rooms"
                            onClick={() => setSoPhongGoiYHienThi(prev => prev + SO_PHONG_GOI_Y_MOI_LAN)}
                          >
                            Xem thêm {soPhongSeXemThem} phòng nữa
                          </button>
                        )}
                        {daMoRongDanhSach && (
                          <button
                            type="button"
                            className="btn-collapse-rooms"
                            onClick={() => setSoPhongGoiYHienThi(SO_PHONG_GOI_Y_MOI_LAN)}
                          >
                            Thu gọn
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* 3. Date & Time Selection Section */}
              <div className="booking-datetime-row">
                <div className="input-group">
                  <label htmlFor="ngayHen">
                    <span className="icon-calendar">📅</span> Ngày hẹn
                  </label>
                  <input
                    type="date"
                    id="ngayHen"
                    value={ngayHen}
                    min={layNgayInputLocal()}
                    onChange={(e) => xuLyDoiNgayHen(e.target.value)}
                    required
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="gioHen">
                    <span className="icon-clock">🕒</span> Giờ hẹn
                  </label>
                  <input
                    type="time"
                    id="gioHen"
                    value={gioHen}
                    min={ngayHen === layNgayInputLocal() ? layGioInputLocal() : undefined}
                    onChange={(e) => xuLyDoiGioHen(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* 4. Form Actions */}
              <div className="booking-form-actions">
                <button type="button" className="btn-cancel-booking" onClick={() => {
                  if (phongDaChon) {
                    setTrangHienTai('room_detail');
                  } else {
                    setTrangHienTai('search_vacancy');
                    navigate(ROUTES.phongGiuong);
                  }
                }}>
                  Hủy
                </button>
                <button type="submit" className="btn-submit-booking" disabled={dangXuLy}>
                  {dangXuLy ? 'Đang đặt lịch...' : 'Đặt lịch hẹn'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      <TiepNhanDangKyThuePage
        trangHienTai={trangHienTai}
        chuyenTrang={chuyenTrang}
        xuLyGuiYeuCauNhanVien={xuLyGuiYeuCauNhanVien}
        xuLyLuuThongTinDangKyThue={xuLyLuuThongTinDangKyThue}
        formKhachHang={formKhachHang}
        xuLyThayDoiKhachHang={xuLyThayDoiKhachHang}
        formYeuCauThue={formYeuCauThue}
        xuLyChonLoaiPhong={xuLyChonLoaiPhong}
        xuLyThayDoiYeuCau={xuLyThayDoiYeuCau}
        tieuChiUuTien={tieuChiUuTien}
        xuLyThayDoiTieuChi={xuLyThayDoiTieuChi}
        dangXuLy={dangXuLy}
        hienThongBao={hienThongBao}
        thongKePhongTrong={thongKePhongTrong}
        daTraCuu={daTraCuu}
        danhSachPhong={danhSachPhong}
        xuLyDatPhong={xuLyDatPhong}
        moChiTietPhong={moChiTietPhong}
        tuyChonTraCuuPhong={tuyChonTraCuuPhong}
        gioiHanSoNguoi={layGioiHanSoNguoiTheoLoai()}
      />
      {trangHienTai === 'review_info' && (
        <div className="deposit-flow-page">
          <div className="deposit-page-header">
            <div>
              <p className="payment-breadcrumb">Khách hàng &nbsp;&gt;&nbsp; <span>Rà soát thông tin</span></p>
              <h1 className="page-title" style={{ margin: 0 }}>Quy trình đặt cọc &amp; xác nhận thuê</h1>
              <p className="page-subtitle" style={{ margin: '4px 0 0 0' }}>Khách hàng đã quyết định thuê — rà soát kỹ thông tin trước khi gửi Quản lý xác nhận.</p>
            </div>
          </div>

          <div className="payment-subtabs">
            <button type="button" className={`payment-subtab ${trangHienTai === 'staff_reception' ? 'active' : ''}`} onClick={() => chuyenTrang('staff_reception')}>Tiếp nhận thông tin</button>
            <button type="button" className={`payment-subtab ${trangHienTai === 'review_info' ? 'active' : ''}`} onClick={() => chuyenTrang('review_info')}>Rà soát thông tin</button>
          </div>

          <div className="review-banner">
            <span className="review-banner-icon">✨</span>
            <div>
              <strong>Khách hàng đã quyết định thuê</strong>
              <p>Vui lòng rà soát kỹ các điều kiện trước khi gửi yêu cầu xác nhận phòng cho Quản lý.</p>
            </div>
          </div>

          <div className="review-content-grid">
            {/* Cột trái: thông tin khách thuê */}
            <div className="review-card">
              <div className="review-card-head">
                <span className="review-card-icon">👤</span>
                <h3>Thông tin khách thuê</h3>
                <span className="review-update-tag">Cập nhật nếu có thay đổi</span>
              </div>

              <div className="review-form-grid">
                <div className="form-group">
                  <label>Họ và tên</label>
                  <input type="text" defaultValue="Nguyễn Hoàng Nam" className="form-control" />
                </div>
                <div className="form-group">
                  <label>Số điện thoại</label>
                  <input type="text" defaultValue="0988 123 456" className="form-control" />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" defaultValue="nam.nguyen@gmail.com" className="form-control" />
                </div>
                <div className="form-group">
                  <label>Số CCCD/Passport</label>
                  <input type="text" defaultValue="001203004567" className="form-control" />
                </div>
                <div className="form-group full-width">
                  <label>Địa chỉ thường trú</label>
                  <input type="text" defaultValue="45 Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM" className="form-control" />
                </div>
                <div className="form-group">
                  <label>Ngày bắt đầu thuê</label>
                  <input type="date" defaultValue="2023-01-11" className="form-control" />
                </div>
                <div className="form-group">
                  <label>Thời hạn thuê</label>
                  <select className="form-control" defaultValue="12">
                    <option value="6">6 tháng</option>
                    <option value="12">12 tháng</option>
                    <option value="24">24 tháng</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '8px' }}>
                <label>Ghi chú bổ sung (nếu có)</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Nhập yêu cầu đặc biệt hoặc ghi chú về khách hàng..."
                ></textarea>
              </div>
            </div>

            {/* Cột phải: thông tin phòng + checklist */}
            <div className="review-side-col">
              <div className="review-room-card">
                <div className="review-room-img-wrap">
                  <img src="/cozy_dorm_bed.png" alt="Phòng VIP A204" className="review-room-img" />
                  <span className="review-room-tag">Phòng VIP A204</span>
                </div>
                <div className="review-room-info">
                  <strong>Giường đơn - Cửa sổ lớn</strong>
                  <span className="review-room-price">3.500.000<small>đ/tháng</small></span>
                  <p className="review-room-addr">Khu vực: Quận 1, TP. Hồ Chí Minh</p>
                  <div className="review-room-amenities">
                    <span className="review-amenity-item">
                      <svg className="amenity-icon wifi-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
                      </svg>
                      Free WiFi
                    </span>
                    <span className="review-amenity-item">❄️ Điều hòa</span>
                    <span className="review-amenity-item">🧹 Vệ sinh 2 lần/tuần</span>
                  </div>
                </div>
              </div>

              <div className="review-card">
                <div className="review-card-head">
                  <span className="review-card-icon">📋</span>
                  <h3>Kiểm tra điều kiện khách thuê</h3>
                </div>
                <div className="checklist-list">
                  <label className="checklist-item">
                    <input type="checkbox" checked={checklistRaSoat.gioiTinh} onChange={() => xuLyToggleChecklist('gioiTinh')} />
                    <span>Giới tính phù hợp (Nam/Nữ theo quy định khu vực)</span>
                  </label>
                  <label className="checklist-item">
                    <input type="checkbox" checked={checklistRaSoat.quocTich} onChange={() => xuLyToggleChecklist('quocTich')} />
                    <span>Quốc tịch hợp lệ &amp; rõ ràng</span>
                  </label>
                  <label className="checklist-item">
                    <input type="checkbox" checked={checklistRaSoat.giayTo} onChange={() => xuLyToggleChecklist('giayTo')} />
                    <span>Giấy tờ định danh hợp pháp (CCCD/Passport)</span>
                  </label>
                  <label className="checklist-item">
                    <input type="checkbox" checked={checklistRaSoat.taiChinh} onChange={() => xuLyToggleChecklist('taiChinh')} />
                    <span>Khả năng tài chính ổn định</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="review-info-note">
            <span>ℹ️</span>
            <p>Phòng sẽ tạm chuyển trạng thái "Chờ xác nhận Quản lý" ngay khi bạn nhấn gửi. Hãy chắc chắn rằng thông tin là chính xác.</p>
          </div>

          <div className="deposit-action-bar">
            <button type="button" className="btn-detail-outline btn-reject-wide" onClick={xuLyTuChoiRaSoat}>
              Từ chối — Khách không đủ điều kiện
            </button>
            <button type="button" className="btn-book-filled btn-submit-wide" onClick={xuLyGuiQuanLyKiemTra}>
              Gửi Quản lý kiểm tra tình trạng phòng →
            </button>
          </div>
        </div>
      )}

      {/* ===========================================================
           2.2 XÁC NHẬN TÌNH TRẠNG (QUẢN LÝ)
      =========================================================== */}
      {trangHienTai === 'confirm_status' && tabPhongGiuongNhanVien === 'xac-nhan' && (
        <div className="deposit-flow-page">
          <div className="deposit-page-header">
            <div>
              <p className="payment-breadcrumb">Phòng/Giường &nbsp;&gt;&nbsp; <span>Xác nhận tình trạng</span></p>
              <h1 className="page-title" style={{ margin: 0 }}>Kiểm tra &amp; Xác nhận tình trạng</h1>
            </div>
            <div className="header-actions">
              <button type="button" className="btn-detail-outline btn-back-header" onClick={() => setTabPhongGiuongNhanVien('danh-sach')}>
                Quay lại
              </button>
            </div>
          </div>

          <div className="payment-subtabs">
            <button type="button" className="payment-subtab" onClick={() => setTabPhongGiuongNhanVien('danh-sach')}>Danh sách phòng/giường</button>
            <button type="button" className="payment-subtab active">Xác nhận tình trạng</button>
          </div>

          <div className="confirm-status-grid">
            <div className="confirm-side-col">
              <div className="confirm-request-card">
                <div className="confirm-request-head">
                  <span className="confirm-request-icon">!</span>
                  <strong>YÊU CẦU MỚI</strong>
                </div>
                <p className="confirm-request-from">Yêu cầu kiểm tra từ Sale Minh Tuấn</p>
                <p className="confirm-request-quote">
                  "Khách cần giữ chỗ gấp trong 24h để làm thủ tục đặt cọc. Vui lòng xác nhận giường 202-B còn trống thực tế."
                </p>
                <div className="confirm-request-meta">
                  <span>🕒 15 phút trước</span>
                  <span>👤 Khách: Trần Văn A</span>
                </div>
              </div>

              <div className="confirm-live-card">
                <div className="confirm-live-head">
                  <span>🛡️</span>
                  <strong>Kiểm tra xung đột Live</strong>
                  <span className="confirm-live-dot">• ĐANG THEO DÕI</span>
                </div>
                <div className="confirm-live-ok">
                  <span className="confirm-live-check">✅</span>
                  <div>
                    <strong>Không có yêu cầu song song</strong>
                    <p>Phòng này chưa có Sale nào khác đang mở tab đặt chỗ hoặc gửi yêu cầu giữ chỗ trong 30 phút qua.</p>
                  </div>
                </div>
                <div className="confirm-live-progress">
                  <span>Tỉ lệ giữ chỗ khu vực</span>
                  <strong>65%</strong>
                </div>
                <div className="confirm-progress-bar">
                  <div className="confirm-progress-fill" style={{ width: '65%' }}></div>
                </div>
              </div>
            </div>

            <div className="confirm-main-col">
              <div className="confirm-room-card">
                <div className="confirm-room-head">
                  <span className="confirm-room-icon">🛏️</span>
                  <div>
                    <div className="confirm-room-title-row">
                      <strong>Giường 202-B</strong>
                      <span className="status-pill-green">SẴN SÀNG</span>
                    </div>
                    <p>Phòng Superior - Tầng 2 - Cơ sở Quận 1</p>
                  </div>
                  <div className="confirm-room-price">
                    <span>GIÁ THUÊ NIÊM YẾT</span>
                    <strong>3.200.000đ<small>/tháng</small></strong>
                  </div>
                </div>

                <div className="confirm-room-stats">
                  <div>
                    <span>Diện tích thực</span>
                    <strong>24 m² (Phòng chung)</strong>
                  </div>
                  <div>
                    <span>Thiết bị kèm theo</span>
                    <strong>Nệm cao su, Tủ cá nhân, Rèm</strong>
                  </div>
                  <div>
                    <span>Số khách hiện tại</span>
                    <strong>3/4 giường đã có khách</strong>
                  </div>
                </div>

                <p className="confirm-question">Bạn đã kiểm tra thực tế tình trạng giường này?</p>

                <div className="confirm-decision-row">
                  <button
                    type="button"
                    className={`confirm-decision-btn confirm-green ${ketQuaXacNhanTinhTrang === 'con-trong' ? 'selected' : ''}`}
                    onClick={xuLyXacNhanConTrong}
                  >
                    <span className="confirm-decision-icon">✔️</span>
                    <strong>Xác nhận còn trống</strong>
                    <small>Cho phép Sale tiếp tục đặt cọc</small>
                  </button>
                  <button
                    type="button"
                    className={`confirm-decision-btn confirm-red ${ketQuaXacNhanTinhTrang === 'da-giu-cho' ? 'selected' : ''}`}
                    onClick={xuLyXacNhanDaGiuCho}
                  >
                    <span className="confirm-decision-icon">🚫</span>
                    <strong>Phòng đã được giữ chỗ</strong>
                    <small>Thông báo cho Sale tìm phòng khác</small>
                  </button>
                </div>
              </div>

              <div className="confirm-history-card">
                <div className="confirm-history-head">
                  <strong>Lịch sử yêu cầu gần đây cho phòng này</strong>
                  <a href="#" onClick={(e) => { e.preventDefault(); hienThongBao('info', 'Đang tải toàn bộ lịch sử...'); }}>↻ Xem tất cả</a>
                </div>
                <div className="table-responsive">
                  <table className="appointments-table confirm-history-table">
                    <thead>
                      <tr>
                        <th>THỜI GIAN</th>
                        <th>NHÂN VIÊN SALE</th>
                        <th>KHÁCH HÀNG</th>
                        <th>TRẠNG THÁI XỬ LÝ</th>
                        <th style={{ textAlign: 'right' }}>HÀNH ĐỘNG</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Hôm nay, 09:15</td>
                        <td>
                          <div className="table-client-cell">
                            <span className="client-initials-badge initials-color-2">MT</span>
                            <strong className="client-name">Minh Tuấn</strong>
                          </div>
                        </td>
                        <td>Trần Văn A</td>
                        <td><span className="status-badge-pill status-cho-xem">ĐANG CHỜ</span></td>
                        <td style={{ textAlign: 'right' }}>•••</td>
                      </tr>
                      <tr>
                        <td>12/10, 14:30</td>
                        <td>
                          <div className="table-client-cell">
                            <span className="client-initials-badge initials-color-3">KH</span>
                            <strong className="client-name">Khánh Huyền</strong>
                          </div>
                        </td>
                        <td>Lê Thị B</td>
                        <td><span className="status-badge-pill status-khong-thue">BỊ TỪ CHỐI</span></td>
                        <td style={{ textAlign: 'right' }}>•••</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TRANG DANH SÁCH LỊCH HẸN (CONTRACTS / APPOINTMENTS) VỚI TAB PHÊ DUYỆT CỌC
          ========================================== */}
      {trangHienTai === 'staff_contracts' && (
        <div className={tabHopDongNhanVien === 'danh-sach-hen' ? 'staff-contracts-page' : 'deposit-flow-page'}>
          {tabHopDongNhanVien === 'danh-sach-hen' ? (
            <>
              <div className="contracts-header-row">
                <div>
                  <p className="payment-breadcrumb">Lịch hẹn &nbsp;&gt;&nbsp; <span>Danh sách lịch hẹn</span></p>
                  <h1 className="page-title" style={{ margin: 0 }}>Lịch hẹn xem phòng</h1>
                  <p className="page-subtitle" style={{ margin: '4px 0 0 0' }}>
                    Quản lý và cập nhật trạng thái khách hàng đi xem phòng thực tế.
                  </p>
                </div>

                <div className="header-actions">
                  <div className="search-bar-wrapper">
                    <span className="search-icon">🔍</span>
                    <input
                      type="text"
                      placeholder="Tìm tên khách, số phòng..."
                      value={tuKhoaLichHen}
                      onChange={(e) => setTuKhoaLichHen(e.target.value)}
                      className="search-input-field"
                    />
                  </div>
                  <button
                    type="button"
                    className="btn-add-appointment"
                    onClick={batDauLichHenMoi}
                  >
                    + Thêm lịch hẹn
                  </button>
                </div>
              </div>

              <div className="payment-subtabs" style={{ marginBottom: '16px' }}>
                <button type="button" className={`payment-subtab ${tabHopDongNhanVien === 'danh-sach-hen' ? 'active' : ''}`} onClick={() => setTabHopDongNhanVien('danh-sach-hen')}>Danh sách lịch hẹn</button>
                {vaiTroNhanVien !== 'sale' && (
                  <button type="button" className={`payment-subtab ${tabHopDongNhanVien === 'phe-duyet' ? 'active' : ''}`} onClick={() => setTabHopDongNhanVien('phe-duyet')}>Phê duyệt cọc</button>
                )}
              </div>

              <div className="subtabs-filters-bar">
                <button type="button" className={`subtab-filter-btn ${boLocLichHen === 'tat-ca' ? 'active' : ''}`} onClick={() => setBoLocLichHen('tat-ca')}>Tất cả</button>
                <button type="button" className={`subtab-filter-btn ${boLocLichHen === 'hom-nay' ? 'active' : ''}`} onClick={() => setBoLocLichHen('hom-nay')}>Hôm nay</button>
                <button type="button" className={`subtab-filter-btn ${boLocLichHen === 'tuan-nay' ? 'active' : ''}`} onClick={() => setBoLocLichHen('tuan-nay')}>Tuần này</button>
                <button type="button" className={`subtab-filter-btn ${boLocLichHen === 'cho-xem' ? 'active' : ''}`} onClick={() => setBoLocLichHen('cho-xem')}>Chưa xem</button>
                <button type="button" className={`subtab-filter-btn ${boLocLichHen === 'da-xem' ? 'active' : ''}`} onClick={() => setBoLocLichHen('da-xem')}>Đã xem</button>
              </div>

              {/* Overview Counts Grid */}
              <div className="overview-counts-grid">
                <div className="count-card">
                  <span className="count-title">TỔNG LỊCH HẸN</span>
                  <strong className="count-num">{layDanhSachLichHenGop().length}</strong>
                </div>
                <div className="count-card count-blue">
                  <span className="count-title">CHƯA XEM</span>
                  <strong className="count-num">{layDanhSachLichHenGop().filter(item => item.KetQua === 'Chưa xem').length}</strong>
                </div>
                <div className="count-card count-orange">
                  <span className="count-title">ĐÃ XEM</span>
                  <strong className="count-num">{layDanhSachLichHenGop().filter(item => item.KetQua === 'Đã xem').length}</strong>
                </div>
                <div className="count-card count-green">
                  <span className="count-title">HẸN HÔM NAY</span>
                  <strong className="count-num">{layDanhSachLichHenGop().filter(item => {
                    const d = new Date(item.NgayGioHen);
                    const today = new Date();
                    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
                  }).length}</strong>
                </div>
              </div>

              {/* Main Appointments Table */}
              <div className="table-card">
                <div className="table-responsive">
                  <table className="appointments-table">
                    <thead>
                      <tr>
                        <th style={{ width: '60px' }}>STT</th>
                        <th>Tên khách</th>
                        <th>Phòng chốt</th>
                        <th>Ngày giờ</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                        <th>Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const { danhSachSauLoc, danhSachTrang, viTriDau } = layTrangLichHen();

                        if (danhSachSauLoc.length === 0) {
                          return (
                            <tr>
                              <td colSpan="7" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                                Không tìm thấy lịch hẹn nào khớp với bộ lọc hiện tại.
                              </td>
                            </tr>
                          );
                        }

                        return danhSachTrang.map((item, idx) => (
                          <tr key={item.MaLich}>
                            <td>{String(viTriDau + idx + 1).padStart(2, '0')}</td>
                            <td>
                              <div className="table-client-cell">
                                <span className={`client-initials-badge initials-color-${(idx % 4) + 1}`}>
                                  {item.AvatarName}
                                </span>
                                <div>
                                  <strong className="client-name">{item.TenKhach}</strong>
                                  <span className="client-phone">{item.SDT}</span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span
                                className={`room-final-text ${item.DaChotPhong ? 'has-room' : 'empty-room'}`}
                                title={item.DaChotPhong ? item.TenPhongChot : 'Chưa chốt phòng'}
                              >
                                {item.DaChotPhong ? item.TenPhongChot : '—'}
                              </span>
                              {item.KhoaPhongChot && (
                                <span className="room-lock-hint">Đã đặt cọc</span>
                              )}
                            </td>
                            <td>
                              <span className="datetime-cell-content">
                                📅 {dinhDangNgayGio(item.NgayGioHen)}
                              </span>
                            </td>
                            <td>
                              <span className={`status-badge-pill status-${item.KetQua === 'Đã xem' ? 'da-xem' : 'cho-xem'}`}>
                                {item.KetQua === 'Đã xem' ? '• Đã xem' : '• Chưa xem'}
                              </span>
                            </td>
                            <td>
                              <button type="button" className="btn-detail-outline btn-table-edit" onClick={() => moPopupChinhSuaLichHen(item)}>
                                Chỉnh sửa
                              </button>
                            </td>
                            <td>
                              <span className="appointment-note-cell">{item.GhiChu || '—'}</span>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer */}
                <div className="table-footer-row">
                  {(() => {
                    const { danhSachSauLoc, danhSachTrang, tongTrang, trangAnToan, viTriDau } = layTrangLichHen();
                    const tongLichHen = danhSachSauLoc.length;
                    const hienTu = tongLichHen === 0 ? 0 : viTriDau + 1;
                    const hienDen = Math.min(viTriDau + danhSachTrang.length, tongLichHen);
                    return (
                      <>
                        <span className="footer-entries-info">
                          Hiển thị {hienTu}-{hienDen} / {tongLichHen} lịch hẹn
                        </span>
                        {tongTrang > 1 && (
                          <div className="table-pagination">
                            <button
                              type="button"
                              className="pag-btn"
                              disabled={trangAnToan === 1}
                              onClick={() => setTrangHienHen((page) => Math.max(1, page - 1))}
                            >
                              ‹
                            </button>
                            {Array.from({ length: tongTrang }).map((_, index) => {
                              const page = index + 1;
                              return (
                                <button
                                  type="button"
                                  key={page}
                                  className={`pag-btn ${trangAnToan === page ? 'active' : ''}`}
                                  onClick={() => setTrangHienHen(page)}
                                >
                                  {page}
                                </button>
                              );
                            })}
                            <button
                              type="button"
                              className="pag-btn"
                              disabled={trangAnToan === tongTrang}
                              onClick={() => setTrangHienHen((page) => Math.min(tongTrang, page + 1))}
                            >
                              ›
                            </button>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>

              </div>
            </>
          ) : (
            <>
              <div className="deposit-page-header">
                <div>
                  <p className="payment-breadcrumb">Hợp đồng &nbsp;&gt;&nbsp; <span>Phê duyệt cọc</span></p>
                  <h1 className="page-title approve-subtitle" style={{ margin: 0 }}>Phê duyệt yêu cầu đặt cọc</h1>
                </div>
                <span className={`status-pill-${trangThaiPheDuyetCoc === 'da-duyet' ? 'green' : trangThaiPheDuyetCoc === 'da-tu-choi' ? 'red' : 'blue'}`}>
                  {trangThaiPheDuyetCoc === 'da-duyet' ? '● Đã duyệt' : trangThaiPheDuyetCoc === 'da-tu-choi' ? '● Đã từ chối' : '● Chờ xác nhận'}
                </span>
              </div>

              <div className="payment-subtabs">
                <button type="button" className={`payment-subtab ${tabHopDongNhanVien === 'danh-sach-hen' ? 'active' : ''}`} onClick={() => setTabHopDongNhanVien('danh-sach-hen')}>Danh sách lịch hẹn</button>
                <button type="button" className={`payment-subtab ${tabHopDongNhanVien === 'phe-duyet' ? 'active' : ''}`} onClick={() => setTabHopDongNhanVien('phe-duyet')}>Phê duyệt cọc</button>
              </div>

              <div className="approve-grid">
                <div className="approve-side-card">
                  <div className="approve-side-head">Tổng quan hồ sơ</div>
                  <div className="approve-side-row">
                    <span>Loại hợp đồng</span>
                    <strong>Dài hạn (12 tháng)</strong>
                  </div>
                  <div className="approve-side-row">
                    <span>Ngày tạo yêu cầu</span>
                    <strong>14:25 — 24/05/2024</strong>
                  </div>
                  <div className="approve-side-row">
                    <span>Nguồn khách</span>
                    <strong>Facebook Ads</strong>
                  </div>
                  <div className="approve-note-box">
                    <span>📝 Ghi chú từ khách hàng:</span>
                    <p>"Em đã chuyển tiền cọc tương đương 2 tháng tiền thuê, nhờ anh/chị giữ chỗ giúp em ạ. Em sẽ dọn vào cuối tuần này."</p>
                  </div>
                  <div className="approve-warning-box">
                    <span>⚠ Lưu ý nghiệp vụ</span>
                    <p>Xác nhận "Duyệt" sẽ ngay lập tức thay đổi trạng thái phòng trên bản đồ mặt bằng sang <strong>Đã đặt cọc 🔑</strong>.</p>
                  </div>
                </div>

                <div className="approve-evidence-card">
                  <div className="approve-evidence-head">
                    <span>Chứng từ thanh toán</span>
                    <div className="approve-evidence-tools">
                      <span title="Phóng to">🔍</span>
                      <span title="Tải xuống">⬇️</span>
                      <span title="In">🖨️</span>
                    </div>
                  </div>
                  <div className="approve-evidence-img-wrap">
                    <img src="https://images.unsplash.com/photo-1556742111-a301076d9d18?q=80&w=600&auto=format&fit=crop" alt="Chứng từ chuyển khoản" className="approve-evidence-img" />
                  </div>
                </div>

                <div className="approve-verify-card">
                  <div className="approve-verify-head">🛡️ Thông tin xác thực</div>
                  <div className="approve-verify-customer">
                    <img src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=200&auto=format&fit=crop" alt="Nguyễn Thu Hà" className="receive-avatar" />
                    <div>
                      <strong>Nguyễn Thu Hà</strong>
                      <p>0987 *** 456 • Khách hàng mới</p>
                    </div>
                  </div>

                  <div className="approve-verify-grid">
                    <div className="approve-verify-box">
                      <span>Mã phòng</span>
                      <strong>P.302-A</strong>
                    </div>
                    <div className="approve-verify-box">
                      <span>Cơ sở</span>
                      <strong>Dorm Q.1</strong>
                    </div>
                  </div>

                  <div className="approve-amount-box">
                    <span>SỐ TIỀN CỌC THỰC NHẬN</span>
                    <strong>5.000.000 VNĐ</strong>
                  </div>

                  <div className="approve-verify-row">
                    <span>Phương thức:</span>
                    <strong>Chuyển khoản (Techcombank)</strong>
                  </div>
                  <div className="approve-verify-row">
                    <span>Mã giao dịch:</span>
                    <strong>FT2414502834</strong>
                  </div>

                  <button
                    type="button"
                    className="approve-btn-confirm"
                    onClick={xuLyDuyetCoc}
                    disabled={trangThaiPheDuyetCoc !== 'cho-xac-nhan'}
                  >
                    ✓ DUYỆT — Xác nhận đã nhận tiền cọc hợp lệ
                  </button>
                  <button
                    type="button"
                    className="approve-btn-reject"
                    onClick={xuLyTuChoiCoc}
                    disabled={trangThaiPheDuyetCoc !== 'cho-xac-nhan'}
                  >
                    ✗ Từ chối
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ===========================================================
           2.3 YÊU CẦU THANH TOÁN CỌC (NHÂN VIÊN SALE)
      =========================================================== */}
      {trangHienTai === 'payment_request' && (
        <div className="deposit-flow-page">
          <div className="deposit-page-header">
            <div>
              <p className="payment-breadcrumb">Thanh toán &nbsp;&gt;&nbsp; <span>Lập yêu cầu thanh toán cọc</span></p>
              <h1 className="page-title" style={{ margin: 0 }}>Lập yêu cầu thanh toán cọc</h1>
              <p className="page-subtitle" style={{ margin: '4px 0 0 0' }}>Tính tiền cọc theo quy định và gửi yêu cầu thanh toán cho khách hàng.</p>
            </div>
            <div className="header-actions">
              <button type="button" className="btn-detail-outline" onClick={() => hienThongBao('info', 'Đã gia hạn thêm 24 giờ thanh toán.')}>Gia hạn thanh toán</button>
              <button type="button" className="btn-book-filled" onClick={xuLyGuiYeuCauThanhToanChoKhach}>Gửi yêu cầu thanh toán cho khách</button>
            </div>
          </div>

          <div className="payment-subtabs">
            <button type="button" className={`payment-subtab ${trangHienTai === 'payment_request' ? 'active' : ''}`} onClick={() => chuyenTrang('payment_request')}>Lập yêu cầu thanh toán cọc</button>
            <button type="button" className={`payment-subtab ${trangHienTai === 'payment_receive' ? 'active' : ''}`} onClick={() => chuyenTrang('payment_receive')}>Tiếp nhận thanh toán cọc</button>
          </div>

          <div className="payment-request-grid">
            <div className="review-card">
              <div className="review-card-head">
                <span className="review-card-icon">📄</span>
                <h3>Thông tin thanh toán</h3>
              </div>

              <div className="review-form-grid">
                <div className="form-group">
                  <label>Hình thức thuê</label>
                  <div className="toggle-pill-group">
                    <button
                      type="button"
                      className={`toggle-pill ${thongTinThanhToanCoc.hinhThucThue === 'Nguyên phòng' ? 'active' : ''}`}
                      onClick={() => setThongTinThanhToanCoc(prev => ({ ...prev, hinhThucThue: 'Nguyên phòng' }))}
                    >
                      Nguyên phòng
                    </button>
                    <button
                      type="button"
                      className={`toggle-pill ${thongTinThanhToanCoc.hinhThucThue === 'Ghép' ? 'active' : ''}`}
                      onClick={() => setThongTinThanhToanCoc(prev => ({ ...prev, hinhThucThue: 'Ghép' }))}
                    >
                      Ghép
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label>Số giường thuê</label>
                  <input
                    type="number"
                    name="soGiuong"
                    className="form-control"
                    value={thongTinThanhToanCoc.soGiuong}
                    onChange={xuLyThayDoiThanhToanCoc}
                    disabled={thongTinThanhToanCoc.hinhThucThue === 'Nguyên phòng'}
                  />
                  {thongTinThanhToanCoc.hinhThucThue === 'Nguyên phòng' && (
                    <small className="form-hint">Tự động khóa cho hình thức "Nguyên phòng"</small>
                  )}
                </div>
                <div className="form-group">
                  <label>Mã phòng</label>
                  <input type="text" name="maPhong" className="form-control" value={thongTinThanhToanCoc.maPhong} onChange={xuLyThayDoiThanhToanCoc} />
                </div>
                <div className="form-group">
                  <label>Ngày bắt đầu thuê</label>
                  <input type="date" name="ngayBatDau" className="form-control" value={thongTinThanhToanCoc.ngayBatDau} onChange={xuLyThayDoiThanhToanCoc} />
                </div>
              </div>

              <div className="formula-box">
                <div className="formula-box-head">
                  <span>Công thức tính cọc đề xuất</span>
                  <span className="formula-tag">Quy định 2023</span>
                </div>
                <code>Tiền cọc = (Tiền thuê 2 tháng) x (Số giường thuê)</code>
                <p className="formula-detail">Chi tiết: (2,500,000đ x 2) x {thongTinThanhToanCoc.soGiuong || 0}</p>
                <div className="formula-total">
                  <span>Tổng tiền cọc phải thu:</span>
                  <strong><AnimatedCounter end={tinhTienCocDeXuat()} suffix="đ" /></strong>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '8px' }}>
                <label>Ghi chú yêu cầu</label>
                <textarea
                  className="form-control"
                  rows="3"
                  name="ghiChu"
                  value={thongTinThanhToanCoc.ghiChu}
                  onChange={xuLyThayDoiThanhToanCoc}
                  placeholder="Nhập ghi chú gửi cho khách hàng (Ví dụ: Thời hạn giữ phòng là 24h từ lúc nhận thông báo này...)"
                ></textarea>
              </div>
            </div>

            <div className="review-side-col">
              <div className="pending-payment-card">
                <div className="pending-payment-head">
                  <strong>Chờ thanh toán</strong>
                  <span className="pending-payment-id">ID: #PAY-99281</span>
                </div>
                <p className="pending-payment-label">THỜI HẠN THANH TOÁN CÒN LẠI</p>
                <div className="pending-payment-timer">⏱ {formatDemHoGioPhutGiay(giayConLaiThanhToan)}</div>

                <div className="pending-payment-bank">
                  <div className="pending-bank-row">
                    <span>Ngân hàng</span>
                    <strong>MB BANK (Quân đội)</strong>
                  </div>
                  <div className="pending-bank-row">
                    <span>Số tài khoản</span>
                    <strong>0988776655 📋</strong>
                  </div>
                  <div className="pending-bank-row">
                    <span>Chủ tài khoản</span>
                    <strong>CÔNG TY HOMESTAY DORM</strong>
                  </div>
                  <div className="pending-bank-row">
                    <span>Nội dung chuyển khoản</span>
                  </div>
                  <div className="pending-bank-content">COC PHONG 402A - [TEN KHACH]</div>
                </div>

                <div className="pending-qr-box">
                  <div className="pending-qr-placeholder">▦</div>
                  <span>Quét mã để thanh toán nhanh qua Napas</span>
                </div>

                <div className="pending-history-box">
                  <div className="pending-history-head">🕒 Lịch sử yêu cầu</div>
                  <div className="pending-history-item">
                    <strong>Khởi tạo yêu cầu</strong>
                    <span>15:30 - 24/10/2023 | Sale: Nguyễn Văn A</span>
                  </div>
                  <div className="pending-history-item">
                    <strong>Cập nhật công thức tính</strong>
                    <span>15:45 - 24/10/2023 | Kế toán: Trần Thị B</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===========================================================
           2.4 TIẾP NHẬN THANH TOÁN CỌC (NHÂN VIÊN KẾ TOÁN)
      =========================================================== */}
      {trangHienTai === 'payment_receive' && (
        <div className="deposit-flow-page">
          <div className="deposit-page-header">
            <div>
              <p className="payment-breadcrumb">Thanh toán &nbsp;&gt;&nbsp; <span>Tiếp nhận thanh toán cọc</span></p>
              <h1 className="page-title" style={{ margin: 0 }}>Tiếp nhận thanh toán cọc</h1>
            </div>
          </div>

          <div className="payment-subtabs">
            <button type="button" className={`payment-subtab ${trangHienTai === 'payment_request' ? 'active' : ''}`} onClick={() => chuyenTrang('payment_request')}>Lập yêu cầu thanh toán cọc</button>
            <button type="button" className={`payment-subtab ${trangHienTai === 'payment_receive' ? 'active' : ''}`} onClick={() => chuyenTrang('payment_receive')}>Tiếp nhận thanh toán cọc</button>
          </div>

          <div className="payment-receive-grid">
            <div className="receive-info-card">
              <div className="receive-info-head">📋 Thông tin đặt phòng</div>

              <div className="receive-customer-row">
                <img src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200&auto=format&fit=crop" alt="Nguyễn Thành Trung" className="receive-avatar" />
                <div>
                  <strong>Nguyễn Thành Trung</strong>
                  <p>SĐT: 090 123 4567</p>
                </div>
              </div>

              <div className="receive-info-rows">
                <div className="receive-info-row">
                  <span>Phòng/Giường:</span>
                  <strong>P.402 - G02 (Dorm 4)</strong>
                </div>
                <div className="receive-info-row">
                  <span>Loại hợp đồng:</span>
                  <span className="status-pill-blue">DÀI HẠN</span>
                </div>
                <div className="receive-info-row">
                  <span>Tổng tiền cọc:</span>
                  <strong className="receive-total-deposit">20.000.000đ</strong>
                </div>
                <div className="receive-info-row">
                  <span>Thời gian còn lại</span>
                  <strong className="receive-time-left">{formatDemPhutGiay(giayConLaiTiepNhan)}</strong>
                </div>
              </div>
            </div>

            <div className="receive-form-card">
              <div className="receive-form-head">Chi tiết tiếp nhận thanh toán</div>

              <div className="form-group">
                <label>• 1. Hình thức thanh toán</label>
                <div className="payment-method-row">
                  <button
                    type="button"
                    className={`payment-method-btn ${formTiepNhanThanhToan.hinhThuc === 'chuyen-khoan' ? 'active' : ''}`}
                    onClick={() => setFormTiepNhanThanhToan(prev => ({ ...prev, hinhThuc: 'chuyen-khoan' }))}
                  >
                    <span>🏦</span>
                    Chuyển khoản
                    {formTiepNhanThanhToan.hinhThuc === 'chuyen-khoan' && <span className="payment-method-check">✓</span>}
                  </button>
                  <button
                    type="button"
                    className={`payment-method-btn ${formTiepNhanThanhToan.hinhThuc === 'tien-mat' ? 'active' : ''}`}
                    onClick={() => setFormTiepNhanThanhToan(prev => ({ ...prev, hinhThuc: 'tien-mat' }))}
                  >
                    <span>💵</span>
                    Tiền mặt
                    {formTiepNhanThanhToan.hinhThuc === 'tien-mat' && <span className="payment-method-check">✓</span>}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>• 2. Số tiền thực thu (VNĐ) <small className="form-hint-right">Nhập đúng 20,000,000đ</small></label>
                <input
                  type="text"
                  name="soTienThucThu"
                  className="form-control"
                  placeholder="0"
                  value={formTiepNhanThanhToan.soTienThucThu}
                  onChange={xuLyThayDoiTiepNhanThanhToan}
                />
                {formTiepNhanThanhToan.soTienThucThu && Number(formTiepNhanThanhToan.soTienThucThu.toString().replace(/\D/g, '')) !== 20000000 && (
                  <span className="form-error-text">⚠ Số tiền không khớp! Yêu cầu: 20,000,000đ</span>
                )}
              </div>

              <div className="receive-form-row-2">
                <div className="form-group">
                  <label>• 3. Thời điểm thu</label>
                  <input
                    type="datetime-local"
                    name="thoiDiemThu"
                    className="form-control"
                    value={formTiepNhanThanhToan.thoiDiemThu}
                    onChange={xuLyThayDoiTiepNhanThanhToan}
                  />
                </div>
                <div className="form-group">
                  <label>• 4. Mã giao dịch</label>
                  <input
                    type="text"
                    name="maGiaoDich"
                    className="form-control"
                    placeholder="Ví dụ: VCB-123456789"
                    value={formTiepNhanThanhToan.maGiaoDich}
                    onChange={xuLyThayDoiTiepNhanThanhToan}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>• Chứng từ thanh toán</label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  ref={inputChungTuRef}
                  onChange={xuLyChonFileChungTu}
                  style={{ display: 'none' }}
                />
                <div className="upload-box" onClick={() => inputChungTuRef.current && inputChungTuRef.current.click()}>
                  {chungTuThanhToanFile ? (
                    <>
                      {chungTuThanhToanPreview ? (
                        <img src={chungTuThanhToanPreview} alt="Chứng từ" className="upload-thumb-img" />
                      ) : (
                        <div className="upload-thumb">📄</div>
                      )}
                      <p>{chungTuThanhToanFile.name}</p>
                      <small>Bấm để chọn file khác</small>
                    </>
                  ) : (
                    <>
                      <span className="upload-icon">📎</span>
                      <p>Upload chứng từ / ảnh giao dịch</p>
                      <small>Hỗ trợ định dạng: JPG, PNG, PDF (Tối đa 5MB)</small>
                      <div className="upload-thumb">🧾</div>
                    </>
                  )}
                </div>
              </div>

              <div className="receive-action-row">
                <button type="button" className="btn-book-filled receive-confirm-btn" onClick={xuLyXacNhanTiepNhanGuiQuanLy}>
                  🔒 Xác nhận tiếp nhận → Gửi Quản lý duyệt
                </button>
                <button type="button" className="btn-detail-outline" onClick={() => hienThongBao('info', 'Đã hủy bỏ yêu cầu tiếp nhận thanh toán.')}>Hủy bỏ</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TRANG KIỂM TRA ĐIỀU KIỆN LƯU TRÚ (STAY CHECK)
          ========================================== */}
      {trangHienTai === 'staff_stay_check' && (
        <StayConditionsCheck
          hienThongBao={hienThongBao}
          onQuayLai={() => { setCheDoNhanVien(true); chuyenTrang('staff_contracts'); }}
          onXacNhanThanhCong={() => { hienThongBao('success', 'Kiểm tra đạt! Chuyển sang lập hợp đồng...'); setTimeout(() => chuyenTrang('staff_contract_draft'), 1500); }}
        />
      )}

      {/* ==========================================
          TRANG LẬP HỢP ĐỒNG THUÊ (CONTRACT DRAFTING)
          ========================================== */}
      {trangHienTai === 'staff_contract_draft' && (
        <ContractDrafting
          hienThongBao={hienThongBao}
          onQuayLai={() => { setCheDoNhanVien(true); chuyenTrang('staff_stay_check'); }}
          onXacNhanThanhCong={() => { hienThongBao('success', 'Lập hợp đồng xong! Chuyển sang thu tiền kỳ đầu...'); setTimeout(() => chuyenTrang('staff_payment'), 1500); }}
        />
      )}

      {/* ==========================================
          TRANG BÀN GIAO TÀI SẢN (ASSET HANDOVER)
          ========================================== */}
      {trangHienTai === 'staff_handover' && (
        <AssetHandover
          hienThongBao={hienThongBao}
          onQuayLai={() => { setCheDoNhanVien(true); chuyenTrang('staff_contract_draft'); }}
        />
      )}

      {/* ==========================================
          TRANG THANH TOÁN ĐẦU KỲ (INITIAL PAYMENT)
          ========================================== */}
      {trangHienTai === 'staff_payment' && (
        <InitialPayment
          hienThongBao={hienThongBao}
          onQuayLai={() => { setCheDoNhanVien(true); chuyenTrang('staff_handover'); }}
          onXacNhanThanhCong={() => { hienThongBao('success', 'Thu tiền xong! Chuyển sang bàn giao phòng...'); setTimeout(() => chuyenTrang('staff_handover'), 1500); }}
        />
      )}

      {/* ==========================================
          TRANG THANH LÝ HỢP ĐỒNG (CONTRACT LIQUIDATION)
          ========================================== */}
      {trangHienTai === 'staff_liquidation' && (
        <ContractLiquidation
          hienThongBao={hienThongBao}
          onQuayLai={() => { setCheDoNhanVien(true); chuyenTrang('staff_payment'); }}
        />
      )}

      {/* ==========================================
          TRANG QUẢN LÝ TRẢ PHÒNG & HOÀN CỌC (STAFF CHECKOUT)
          ========================================== */}
      {trangHienTai === 'staff_checkout' && (
        <CheckoutContainer
          hienThongBao={hienThongBao}
          setCheDoNhanVien={setCheDoNhanVien}
          chuyenTrang={chuyenTrang}
          loggedRole={vaiTroNhanVien}
        />
      )}

      {trangHienTai === 'staff_hop_dong' && vaiTroNhanVien === 'sale' && (
        <StaffHopDongPage
          hienThongBao={hienThongBao}
          vaiTro={vaiTroNhanVien}
        />
      )}

      {/* ===========================================================
           2.5 PHÊ DUYỆT YÊU CẦU ĐẶT CỌC (QUẢN LÝ)
      =========================================================== */}
      {lichHenDangSua && (
        <div className="modal-backdrop" onClick={() => setLichHenDangSua(null)}>
          <div className="modal-content appointment-edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chỉnh sửa lịch hẹn</h3>
              <button className="close-modal-btn" onClick={() => setLichHenDangSua(null)} aria-label="Đóng">×</button>
            </div>
            <form onSubmit={luuChinhSuaLichHen}>
              <div className="modal-body">
                <div className="appointment-edit-summary">
                  <strong>{lichHenDangSua.TenKhach}</strong>
                  <span>{lichHenDangSua.TenPhongChot || 'Chưa chốt phòng'} • {dinhDangNgayGio(lichHenDangSua.NgayGioHen)}</span>
                </div>
                <div className="input-group">
                  <label htmlFor="phongChotLichHen">Phòng chốt</label>
                  <select
                    id="phongChotLichHen"
                    value={formSuaLichHen.maPhong}
                    disabled={lichHenDangSua.KhoaPhongChot}
                    onChange={(e) => setFormSuaLichHen(prev => ({ ...prev, maPhong: e.target.value }))}
                  >
                    <option value="">Chưa chốt phòng</option>
                    {layLuaChonPhongChotLichHen(lichHenDangSua).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {lichHenDangSua.KhoaPhongChot && (
                    <small className="input-helper-text">Khách đã đặt cọc phòng này nên không thể đổi phòng chốt.</small>
                  )}
                </div>
                <div className="input-group">
                  <label htmlFor="trangThaiLichHen">Trạng thái</label>
                  <select
                    id="trangThaiLichHen"
                    value={formSuaLichHen.ketQua}
                    disabled={lichHenDangSua.KhoaPhongChot}
                    onChange={(e) => setFormSuaLichHen(prev => ({ ...prev, ketQua: e.target.value }))}
                  >
                    <option value="Chưa xem">Chưa xem</option>
                    <option value="Đã xem">Đã xem</option>
                  </select>
                  {lichHenDangSua.KhoaPhongChot && (
                    <small className="input-helper-text">Lịch đã có đặt cọc nên trạng thái được khóa ở Đã xem; bạn chỉ có thể sửa ghi chú.</small>
                  )}
                </div>
                <div className="input-group">
                  <label htmlFor="ghiChuSuaLichHen">Ghi chú</label>
                  <textarea
                    id="ghiChuSuaLichHen"
                    rows="4"
                    value={formSuaLichHen.ghiChu}
                    onChange={(e) => setFormSuaLichHen(prev => ({ ...prev, ghiChu: e.target.value }))}
                    placeholder="Nhập ghi chú cho lịch hẹn..."
                    className="booking-note-input"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-detail-outline" onClick={() => setLichHenDangSua(null)}>Hủy</button>
                <button type="submit" className="btn-book-filled">Lưu chỉnh sửa</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL HỎI ĐIỀU HƯỚNG SAU KHI ĐẶT LỊCH HẸN THÀNH CÔNG */}
      {bookingSuccessModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '450px', padding: '24px' }}>
            <div className="modal-header" style={{ padding: '0 0 12px 0', borderBottom: 'none' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', margin: 0 }}>🎉 Đặt lịch hẹn thành công!</h3>
            </div>
            <div className="modal-body" style={{ padding: '12px 0 0 0', textAlign: 'center' }}>
              <p style={{ fontSize: '14.5px', color: '#475569', lineHeight: '1.6', margin: '0 0 20px 0' }}>
                Hệ thống đã lưu thông tin lịch hẹn xem phòng. Bạn muốn đi đến đâu tiếp theo?
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  type="button"
                  className="btn-book-filled"
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', fontWeight: '700' }}
                  onClick={() => {
                    setBookingSuccessModal(false);
                    setCheDoNhanVien(true);
                    sessionStorage.removeItem('bookingContext');
                    setTabHopDongNhanVien('danh-sach-hen');
                    setTrangHienTai('staff_contracts');
                    navigate(ROUTES.lichHen, { state: { bookingContext: { manHinhKhoiTao: 'staff_contracts', tabHopDongNhanVien: 'danh-sach-hen' } } });
                  }}
                >
                  Đến Danh sách lịch hẹn 📅
                </button>

                <button
                  type="button"
                  className="btn-detail-outline"
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', color: 'var(--primary-color)', borderColor: 'var(--primary-color)', fontWeight: '700' }}
                  onClick={() => {
                    setBookingSuccessModal(false);
                    setCheDoNhanVien(true);
                    sessionStorage.removeItem('bookingContext');
                    navigate(ROUTES.dashboard);
                  }}
                >
                  Đi đến Dashboard 📊
                </button>

                <button
                  type="button"
                  className="btn-detail-outline"
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', fontSize: '13px' }}
                  onClick={() => {
                    setBookingSuccessModal(false);
                    batDauTiepNhanMoi();
                  }}
                >
                  Quay lại Tiếp nhận thông tin
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MÔ PHỎNG ĐĂNG NHẬP NHÂN VIÊN */}
      {showLoginModal && (
        <div className="modal-backdrop" onClick={() => setShowLoginModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', padding: '24px' }}>
            <div className="modal-header" style={{ padding: '0 0 12px 0', borderBottom: 'none' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', textAlign: 'center', width: '100%', margin: 0 }}>
                🔑 CỔNG ĐĂNG NHẬP HỆ THỐNG
              </h3>
              <p style={{ fontSize: '13.5px', color: '#64748b', textAlign: 'center', width: '100%', margin: '6px 0 0 0' }}>
                Vui lòng chọn tài khoản nhân viên để truy cập phân hệ tương ứng
              </p>
            </div>

            <div className="modal-body" style={{ padding: '16px 0 0 0' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* Account 1: Sale */}
                <div
                  className="role-login-card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1.5px solid #e2e8f0',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: 'white'
                  }}
                  onClick={() => {
                    setCheDoNhanVien(true);
                    setVaiTroNhanVien('sale');
                    setShowLoginModal(false);
                    chuyenTrang('staff_reception');
                    hienThongBao('success', 'Đăng nhập thành công với vai trò Chuyên viên Sale!');
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary-color)';
                    e.currentTarget.style.background = '#fff7ed';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.background = 'white';
                  }}
                >
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold' }}>
                    S
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>Nguyễn Văn Sale</h4>
                    <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>Phân hệ: Tiếp nhận khách hàng và yêu cầu trả phòng</p>
                  </div>
                </div>

                {/* Account 2: Manager */}
                <div
                  className="role-login-card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1.5px solid #e2e8f0',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: 'white'
                  }}
                  onClick={() => {
                    setShowLoginModal(false);
                    hienThongBao('success', 'Đăng nhập thành công với vai trò Quản lý chi nhánh!');
                    navigate(ROUTES.dashboard);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#3b82f6';
                    e.currentTarget.style.background = '#eff6ff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.background = 'white';
                  }}
                >
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold' }}>
                    Q
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>Trần Thị Quản Lý</h4>
                    <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>Phân hệ: Kiểm tra phòng, Duyệt đối soát và thanh lý hợp đồng</p>
                  </div>
                </div>

                {/* Account 3: Accountant */}
                <div
                  className="role-login-card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1.5px solid #e2e8f0',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: 'white'
                  }}
                  onClick={() => {
                    setCheDoNhanVien(true);
                    setVaiTroNhanVien('ketoan');
                    setShowLoginModal(false);
                    chuyenTrang('staff_checkout');
                    hienThongBao('success', 'Đăng nhập thành công với vai trò Kế toán trưởng!');
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#10b981';
                    e.currentTarget.style.background = '#ecfdf5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.background = 'white';
                  }}
                >
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold' }}>
                    K
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>Lê Thị Kế Toán</h4>
                    <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>Phân hệ: Lập phiếu đối soát, chi hoặc thu hoàn cọc</p>
                  </div>
                </div>

              </div>

              <button
                type="button"
                className="btn-detail-outline"
                style={{ width: '100%', padding: '12px', borderRadius: '10px', marginTop: '20px', fontWeight: '700' }}
                onClick={() => setShowLoginModal(false)}
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION POPUP */}
      {thongBao && (
        <div className={`toast ${thongBao.kieu}`}>
          {thongBao.kieu === 'success' ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="#10b981" viewBox="0 0 16 16">
              <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="#ef4444" viewBox="0 0 16 16">
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
              <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z" />
            </svg>
          )}
          <span>{thongBao.tinNhan}</span>
        </div>
      )}
    </div>
  );
}
