import { useState, useEffect } from 'react';
import StayConditionsCheck from './components/StayConditionsCheck';
import ContractDrafting from './components/ContractDrafting';
import AssetHandover from './components/AssetHandover';
import InitialPayment from './components/InitialPayment';
import ContractLiquidation from './components/ContractLiquidation';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from './config/routes';
import CheckoutContainer from './components/checkout/CheckoutContainer';
import { useRef } from 'react';

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

export default function App() {
  // Quản lý chuyển màn hình: 'guest_home', 'staff_reception', 'search_vacancy', 'room_detail', 'staff_contracts', 'staff_stay_check', 'staff_contract_draft', 'staff_handover', 'staff_payment', 'staff_liquidation'
  const navigate = useNavigate();

  const chuyenDenKhuVucNhanVien = () => {
    try {
      if (localStorage.getItem('homestay_nguoiDung')) {
        navigate(ROUTES.dashboard);
      } else {
        navigate(ROUTES.dangNhap);
      }
    } catch {
      navigate(ROUTES.dangNhap);
    }
  };

  // Quản lý chuyển màn hình: 'guest_home', 'staff_reception', 'search_vacancy', 'room_detail', hoặc 'staff_checkout'
  const [trangHienTai, setTrangHienTai] = useState('guest_home');

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

  // Phân quyền nhân viên: null, 'sale', 'quanly', 'ketoan'
  const [vaiTroNhanVien, setVaiTroNhanVien] = useState(null);
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
  const [cheDoNhanVien, setCheDoNhanVien] = useState(false);

  // Phòng đang chọn xem chi tiết
  const [phongDaChon, setPhongDaChon] = useState(null);

  // --- TRANG ĐẶT LỊCH HẸN NHÂN VIÊN (STAFF BOOKING) ---
  const [danhSachPhongDatHen, setDanhSachPhongDatHen] = useState([]);
  const [ngayHen, setNgayHen] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [gioHen, setGioHen] = useState('09:00');
  const [hinhThucThongBao, setHinhThucThongBao] = useState('email');
  const [ghiChuLichHen, setGhiChuLichHen] = useState('');
  const [bookingSuccessModal, setBookingSuccessModal] = useState(false);

  // --- TRANG DANH SÁCH LỊCH HẸN NHÂN VIÊN (STAFF CONTRACTS/APPOINTMENTS) ---
  const [danhSachLichHenDB, setDanhSachLichHenDB] = useState([]);
  const [boLocLichHen, setBoLocLichHen] = useState('tat-ca');
  const [tuKhoaLichHen, setTuKhoaLichHen] = useState('');
  const [trangHienHen, setTrangHienHen] = useState(1);

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
    khaNangTaiChinh: ''
  });

  // State form Yêu cầu thuê (Trang nhân viên)
  const [formYeuCauThue, setFormYeuCauThue] = useState({
    loaiPhong: 'Giường ghép',
    khuVucMongMuon: 'Quận 1, Quận Bình Thạnh',
    mucGiaTu: '',
    mucGiaDen: '',
    soNguoi: 1,
    gioiTinh: 'Tất cả',
    thoiGianVao: new Date().toISOString().split('T')[0],
    thoiHanThue: '6'
  });

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
  const [dangTaiPhongTrong, setDangTaiPhongTrong] = useState(false);
  const [boLocTraCuu, setBoLocTraCuu] = useState({
    khuVuc: 'Tất cả',
    loaiPhong: 'Tất cả', // 'Tất cả', 'Phòng đơn' (Nguyên phòng), 'Giường dorm' (Giường ghép)
    mucGiaTu: '',
    gioiTinh: 'Tất cả',
    soNguoi: '',
    tienIch: 'Tất cả',
    yeuCauList: []
  });

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

  // Tải danh sách phòng trống thực tế cho trang Tra cứu phòng trống
  const taiTatCaPhongTrong = async (boLocHienTai = boLocTraCuu) => {
    setDangTaiPhongTrong(true);
    try {
      let paramLoaiPhong = 'Giường ghép';
      if (boLocHienTai.loaiPhong === 'Phòng đơn') {
        paramLoaiPhong = 'Nguyên phòng';
      }

      const paramKhuVuc = boLocHienTai.khuVuc === 'Tất cả' ? '' : boLocHienTai.khuVuc;
      const paramYeuCauList = boLocHienTai.yeuCauList?.length
        ? boLocHienTai.yeuCauList
        : (boLocHienTai.tienIch === 'Tất cả' ? [] : [boLocHienTai.tienIch]);

      let ketQuaGop = [];
      if (boLocHienTai.loaiPhong === 'Tất cả') {
        const [resPhong, resGiuong] = await Promise.all([
          fetch('/api/tra-cuu-phong', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              loaiPhong: 'Nguyên phòng',
              khuVucMongMuon: paramKhuVuc,
              mucGiaTu: boLocHienTai.mucGiaTu,
              soNguoi: boLocHienTai.soNguoi,
              yeuCauList: paramYeuCauList
            })
          }).then(r => r.json()),
          fetch('/api/tra-cuu-phong', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              loaiPhong: 'Giường ghép',
              khuVucMongMuon: paramKhuVuc,
              mucGiaTu: boLocHienTai.mucGiaTu,
              gioiTinh: boLocHienTai.gioiTinh,
              yeuCauList: paramYeuCauList
            })
          }).then(r => r.json())
        ]);

        if (resPhong.ok) ketQuaGop = [...ketQuaGop, ...resPhong.data];
        if (resGiuong.ok) ketQuaGop = [...ketQuaGop, ...resGiuong.data];
      } else {
        const response = await fetch('/api/tra-cuu-phong', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            loaiPhong: paramLoaiPhong,
            khuVucMongMuon: paramKhuVuc,
            mucGiaTu: boLocHienTai.mucGiaTu,
            gioiTinh: boLocHienTai.gioiTinh,
            soNguoi: boLocHienTai.soNguoi,
            yeuCauList: paramYeuCauList
          })
        });
        const resData = await response.json();
        if (resData.ok) {
          ketQuaGop = resData.data;
        }
      }

      setDanhSachTatCaPhongTrong(ketQuaGop);
      setTrangTraCuuHienTai(1);
    } catch (err) {
      console.error('Lỗi tải phòng trống:', err);
      hienThongBao('error', 'Không thể kết nối đến cơ sở dữ liệu tra cứu!');
    } finally {
      setDangTaiPhongTrong(false);
    }
  };

  const xuLyThayDoiBoLoc = (e) => {
    const { name, value } = e.target;
    setBoLocTraCuu(prev => ({
      ...prev,
      [name]: value
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
          maPhong: henXemPhongModal.maId,
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
      gioiTinh: 'Tất cả',
      soNguoi: '',
      tienIch: 'Tất cả'
    });

    setCheDoNhanVien(false);
    chuyenTrang('search_vacancy');
  };

  const xuLyXoaPhongLichHen = (room) => {
    setDanhSachPhongDatHen(prev => prev.filter(r => r.maId !== room.maId));
  };

  const xuLyThemPhongLichHen = () => {
    if (!phongDaChon) {
      hienThongBao('error', 'Vui lòng chọn một phòng/giường trước khi thêm.');
      return;
    }

    const phongDaChonDatHen = {
      maId: phongDaChon.maId,
      ten: phongDaChon.ten,
      kieu: phongDaChon.kieu,
      giaThue: phongDaChon.giaThue,
      chiNhanh: phongDaChon.chiNhanh,
      diaChi: phongDaChon.diaChi
    };
    setDanhSachPhongDatHen(prev => {
      if (prev.some(r => r.maId === phongDaChonDatHen.maId)) return prev;
      return [...prev, phongDaChonDatHen];
    });
  };

  const guiLichHenNhanVien = async (e) => {
    if (e) e.preventDefault();
    if (danhSachPhongDatHen.length === 0) {
      hienThongBao('error', 'Vui lòng chọn ít nhất một phòng/giường để đặt hẹn!');
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

      for (const room of danhSachPhongDatHen) {
        const ngayGioHenCombined = `${ngayHen}T${gioHen}:00`;

        await fetch('/api/dat-lich-hen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hoTen: customerName,
            sdt: customerPhone,
            email: customerEmail,
            ngayGioHen: ngayGioHenCombined,
            ghiChu: `[Nhân viên đặt lịch - Thông báo qua ${hinhThucThongBao}] ${ghiChuLichHen}`,
            maPhong: room.maId || room.maPhong,
            loaiPhong: room.kieu
          })
        });
      }

      hienThongBao('success', `Đã gửi thông báo lịch hẹn thành công đến khách hàng ${customerName}!`);
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
      return {
        MaLich: lich.MaLich,
        NgayGioHen: lich.NgayGioHen,
        KetQua: lich.KetQua || 'Chờ xem',
        GhiChu: lich.GhiChu || '',
        MaPhong: lich.MaPhong,
        TenKhach: tenKhach,
        SDT: sdt,
        AvatarName: initials,
        TenPhongGiuong: `P.${lich.MaPhong} (${lich.MaPhong % 2 === 0 ? 'Dorm A' : 'Dorm B'})`
      };
    });

    return listDBMapped;
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

  const capNhatTrangThaiLichHen = async (maLich, trangThaiMoi) => {
    try {
      hienThongBao('success', `Đã cập nhật trạng thái lịch hẹn sang: ${trangThaiMoi}`);

      if (typeof maLich === 'number') {
        const res = await fetch('/api/cap-nhat-trang-thai-hen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ maLich, ketQua: trangThaiMoi })
        });
        const json = await res.json();
        if (json.ok) {
          taiDanhSachLichHen();
        }
      } else {
        hienThongBao('error', 'Vui lòng tải lại.');
      }
    } catch (err) {
      console.error('Lỗi khi cập nhật trạng thái lịch hẹn:', err);
      hienThongBao('error', 'Không thể cập nhật trạng thái lịch hẹn!');
    }
  };
  useEffect(() => {
    if (trangHienTai === 'guest_home') {
      taiThongKeTongHop();
    } else if (trangHienTai === 'staff_reception') {
      taiThongKePhongTrong();
    } else if (trangHienTai === 'search_vacancy' || (trangHienTai === 'confirm_status' && tabPhongGiuongNhanVien === 'danh-sach')) {
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
    setTrangHienTai(trang);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- LOGIC PHÍA NHÂN VIÊN (STAFF RECEPTION) ---
  const xuLyThayDoiKhachHang = (e) => {
    const { name, value } = e.target;
    setFormKhachHang(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const xuLyThayDoiYeuCau = (e) => {
    const { name, value } = e.target;
    setFormYeuCauThue(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const xuLyChonLoaiPhong = (loai) => {
    setFormYeuCauThue(prev => ({
      ...prev,
      loaiPhong: loai
    }));
  };

  const xuLyThayDoiTieuChi = (name) => {
    setTieuChiUuTien(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const layDanhSachTieuChiChuoi = () => {
    const mapTieuChi = {
      yenTinh: 'Yên tĩnh',
      guiXe: 'Gửi xe',
      dieuHoa: 'Điều hòa',
      wifiRieng: 'Wifi riêng',
      gioGiacTuDo: 'Giờ giấc tự do'
    };
    return Object.keys(tieuChiUuTien)
      .filter(key => tieuChiUuTien[key])
      .map(key => mapTieuChi[key]);
  };

  const chuyenSangTraCuuTuNhanVien = async () => {
    const danhSachTieuChi = layDanhSachTieuChiChuoi();

    if (danhSachTieuChi.length === 0) {
      hienThongBao('error', 'Vui lòng chọn ít nhất một tiêu chí ưu tiên trước khi tra cứu!');
      return;
    }

    // 1. Map bộ lọc từ form yêu cầu thuê + tiêu chí ưu tiên
    let mappedKhuVuc = 'Tất cả';
    const kv = (formYeuCauThue.khuVucMongMuon || '').toLowerCase();
    if (kv.includes('quận 1') || kv.includes('q1')) mappedKhuVuc = 'Quận 1';
    else if (kv.includes('bình thạnh') || kv.includes('bt')) mappedKhuVuc = 'Bình Thạnh';
    else if (kv.includes('quận 3') || kv.includes('q3')) mappedKhuVuc = 'Quận 3';

    let mappedLoaiPhong = 'Tất cả';
    if (formYeuCauThue.loaiPhong === 'Nguyên phòng') mappedLoaiPhong = 'Phòng đơn';
    else if (formYeuCauThue.loaiPhong === 'Giường ghép') mappedLoaiPhong = 'Giường dorm';

    const newFilters = {
      khuVuc: mappedKhuVuc,
      loaiPhong: mappedLoaiPhong,
      mucGiaTu: formYeuCauThue.mucGiaTu || '',
      gioiTinh: formYeuCauThue.gioiTinh || 'Tất cả',
      soNguoi: formYeuCauThue.soNguoi || '',
      tienIch: danhSachTieuChi.length === 1 ? danhSachTieuChi[0] : 'Tất cả',
      yeuCauList: danhSachTieuChi
    };

    setBoLocTraCuu(newFilters);

    // 2. Lưu thông tin tiếp nhận nếu đủ dữ liệu khách hàng
    const cccdHopLe = /^\d+$/.test(formKhachHang.cccd) && formKhachHang.cccd.length >= 9 && formKhachHang.cccd.length <= 12;
    const coHoTen = formKhachHang.hoTen && formKhachHang.hoTen.trim() !== '';

    if (cccdHopLe && coHoTen) {
      try {
        await fetch('/api/tiep-nhan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            khachHang: formKhachHang,
            yeuCauThue: {
              ...formYeuCauThue,
              yeuCauList: danhSachTieuChi
            },
            maNV: 101
          })
        });
      } catch (err) {
        console.error('Lỗi lưu thông tin tiếp nhận:', err);
      }
    }

    // 3. Chuyển sang tab Danh sách phòng/giường (nhân viên)
    setCheDoNhanVien(true);
    setTabPhongGiuongNhanVien('danh-sach');
    chuyenTrang('confirm_status');

    // 4. Tra cứu phòng theo tiêu chí đã chọn
    await taiTatCaPhongTrong(newFilters);
    hienThongBao('success', `Đang hiển thị phòng phù hợp với ${danhSachTieuChi.length} tiêu chí đã chọn.`);
  };

  const xuLyGuiYeuCauNhanVien = async (e) => {
    if (e) e.preventDefault();
    setDangXuLy(true);
    try {
      await chuyenSangTraCuuTuNhanVien();
    } finally {
      setDangXuLy(false);
    }
  };

  const xuLyDatPhong = (item) => {
    hienThongBao('success', `Đã tạo yêu cầu giữ chỗ cho ${item.ten} thành công!`);
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

  // --- RENDER GIAO DIỆN ---
  return (
    <div className="app-shell">

      {/* HEADER NAVBAR (Chung cho toàn web) */}
      <nav className="navbar">
        <div className="logo-container" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <a href="#" className="logo" onClick={() => chuyenTrang('guest_home')}>
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
            {/* 1. Menu cho SALE */}
            {vaiTroNhanVien === 'sale' && (
              <>
                <li className={['staff_reception', 'review_info'].includes(trangHienTai) ? 'active' : ''}>
                  <a href="#" onClick={(e) => { e.preventDefault(); setCheDoNhanVien(true); chuyenTrang('staff_reception'); }}>Tiếp nhận khách</a>
                </li>
                <li className={trangHienTai === 'search_vacancy' ? 'active' : ''}>
                  <a href="#" onClick={(e) => { e.preventDefault(); setCheDoNhanVien(true); chuyenTrang('search_vacancy'); }}>Phòng/Giường</a>
                </li>
                <li className={trangHienTai === 'staff_contracts' ? 'active' : ''}>
                  <a href="#" onClick={(e) => { e.preventDefault(); setCheDoNhanVien(true); chuyenTrang('staff_contracts'); }}>Lịch hẹn</a>
                </li>
                <li className={trangHienTai === 'payment_request' ? 'active' : ''}>
                  <a href="#" onClick={(e) => { e.preventDefault(); setCheDoNhanVien(true); chuyenTrang('payment_request'); }}>Y/c Thu cọc</a>
                </li>
                <li className={trangHienTai.startsWith('staff_checkout') ? 'active' : ''}>
                  <a href="#" onClick={(e) => { e.preventDefault(); setCheDoNhanVien(true); chuyenTrang('staff_checkout'); }}>Báo trả phòng</a>
                </li>
              </>
            )}

            {/* 2. Menu cho QUẢN LÝ */}
            {vaiTroNhanVien === 'quanly' && (
              <>
                <li><a href="#" onClick={(e) => { e.preventDefault(); navigate(ROUTES.dashboard); }}>Dashboard</a></li>
                <li className={trangHienTai === 'confirm_status' || trangHienTai === 'search_vacancy' ? 'active' : ''}>
                  <a href="#" onClick={(e) => { e.preventDefault(); setCheDoNhanVien(true); setTabPhongGiuongNhanVien('danh-sach'); chuyenTrang('confirm_status'); }}>Xác nhận phòng</a>
                </li>
                <li className={trangHienTai === 'deposit_approve' ? 'active' : ''}>
                  <a href="#" onClick={(e) => { e.preventDefault(); setCheDoNhanVien(true); setTabHopDongNhanVien('phe-duyet'); chuyenTrang('deposit_approve'); }}>Duyệt cọc</a>
                </li>
                <li className={trangHienTai === 'staff_stay_check' ? 'active' : ''}>
                  <a href="#" onClick={(e) => { e.preventDefault(); setCheDoNhanVien(true); chuyenTrang('staff_stay_check'); }}>ĐK Lưu trú</a>
                </li>
                <li className={trangHienTai === 'staff_handover' ? 'active' : ''}>
                  <a href="#" onClick={(e) => { e.preventDefault(); setCheDoNhanVien(true); chuyenTrang('staff_handover'); }}>Bàn giao</a>
                </li>
                <li className={trangHienTai.startsWith('staff_checkout') ? 'active' : ''}>
                  <a href="#" onClick={(e) => { e.preventDefault(); setCheDoNhanVien(true); chuyenTrang('staff_checkout'); }}>KT Trả phòng</a>
                </li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); navigate(ROUTES.phongGiuong); }}>Danh mục</a></li>
              </>
            )}

            {/* 3. Menu cho KẾ TOÁN */}
            {vaiTroNhanVien === 'ketoan' && (
              <>
                <li className={trangHienTai === 'payment_receive' ? 'active' : ''}>
                  <a href="#" onClick={(e) => { e.preventDefault(); setCheDoNhanVien(true); chuyenTrang('payment_receive'); }}>Tiếp nhận cọc</a>
                </li>
                <li className={trangHienTai === 'staff_payment' ? 'active' : ''}>
                  <a href="#" onClick={(e) => { e.preventDefault(); setCheDoNhanVien(true); chuyenTrang('staff_payment'); }}>Thu tiền đầu kỳ</a>
                </li>
                <li className={trangHienTai.startsWith('staff_checkout') ? 'active' : ''}>
                  <a href="#" onClick={(e) => { e.preventDefault(); setCheDoNhanVien(true); chuyenTrang('staff_checkout'); }}>Đối soát & Hoàn cọc</a>
                </li>
              </>
            )}

            {/* 4. Menu cho TIẾP NHẬN / PHỤ TRÁCH */}
            {vaiTroNhanVien === 'tiepnhan' && (
              <>
                <li className={trangHienTai === 'staff_contract_draft' ? 'active' : ''}>
                  <a href="#" onClick={(e) => { e.preventDefault(); setCheDoNhanVien(true); chuyenTrang('staff_contract_draft'); }}>Lập Hợp đồng</a>
                </li>
              </>
            )}

            {/* 5. Menu cho ADMIN */}
            {vaiTroNhanVien === 'admin' && (
              <>
                <li><a href="#" onClick={(e) => { e.preventDefault(); navigate(ROUTES.dashboard); }}>Quản trị hệ thống</a></li>
              </>
            )}

            {/* Chung */}
            <li><a href="#" onClick={(e) => { e.preventDefault(); navigate(ROUTES.thongBao); }}>Thông báo</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); setCheDoNhanVien(false); chuyenTrang('guest_home'); }}>Về Guest</a></li>
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
                {vaiTroNhanVien}
              </span>
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&width=100&auto=format&fit=crop" alt="Staff avatar" className="avatar" />
              <button className="logout-btn" onClick={() => { setCheDoNhanVien(false); setVaiTroNhanVien(null); chuyenTrang('guest_home'); }}>Đăng xuất</button>
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
              <h1 className="hero-main-title">Tìm Phòng / Giường Phù Hợp Với Bạn</h1>
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
                    <AnimatedCounter end={thongKeTongHop.soKhachHang || 2450} suffix="+" />
                  </strong>
                  <span className="stat-label">Khách hàng tin tưởng</span>
                </div>
                <div className="animated-stat-item">
                  <strong className="stat-number">
                    <AnimatedCounter end={thongKeTongHop.soPhongDangThue || 128} suffix="+" />
                  </strong>
                  <span className="stat-label">Phòng đang cho thuê</span>
                </div>
                <div className="animated-stat-item">
                  <strong className="stat-number">
                    <AnimatedCounter end={thongKeTongHop.soPhongConTrong || 15} suffix="+" />
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
      {((trangHienTai === 'search_vacancy' && !cheDoNhanVien) || (trangHienTai === 'confirm_status' && tabPhongGiuongNhanVien === 'danh-sach')) && (
        <div className="vacancy-search-page fade-in-up">

          {cheDoNhanVien && (
            <div className="staff-room-page-header">
              <p className="payment-breadcrumb">Phòng/Giường &nbsp;&gt;&nbsp; <span>Danh sách phòng/giường</span></p>
              <div className="payment-subtabs staff-room-subtabs">
                <button type="button" className="payment-subtab active" onClick={() => setTabPhongGiuongNhanVien('danh-sach')}>Danh sách phòng/giường</button>
                <button type="button" className="payment-subtab" onClick={() => setTabPhongGiuongNhanVien('xac-nhan')}>Xác nhận tình trạng</button>
              </div>
            </div>
          )}

          {/* Cover Hero + Filters Container */}
          <header className="vacancy-hero" style={{ backgroundImage: `url('/hero_cover.png')` }}>
            <div className="vacancy-hero-overlay"></div>
            <div className="vacancy-hero-container">

              <div className="vacancy-hero-left">
                <span className="hero-tagline">Buy, Rent, &amp; Sell Property</span>
                <h2>Homestay Dorm</h2>
                <p>Giải pháp quản lý và tìm kiếm nơi lưu trú hiện đại, tiện nghi bậc nhất cho thế hệ trẻ năng động.</p>
              </div>

              <form className="search-filters-card" onSubmit={guiYeuCauTimKiemVacant}>
                <h3>Find your Best Property <span>what do you want!</span></h3>

                <div className="filters-grid">

                  <div className="filter-group">
                    <label htmlFor="filter-khuVuc">Khu vực</label>
                    <select id="filter-khuVuc" name="khuVuc" value={boLocTraCuu.khuVuc} onChange={xuLyThayDoiBoLoc}>
                      <option value="Tất cả">Tất cả chi nhánh</option>
                      <option value="Quận 1">Quận 1, TP.HCM</option>
                      <option value="Bình Thạnh">Bình Thạnh, TP.HCM</option>
                      <option value="Quận 3">Quận 3, TP.HCM</option>
                    </select>
                  </div>

                  <div className="filter-group">
                    <label htmlFor="filter-loaiPhong">Loại phòng</label>
                    <select id="filter-loaiPhong" name="loaiPhong" value={boLocTraCuu.loaiPhong} onChange={xuLyThayDoiBoLoc}>
                      <option value="Tất cả">Tất cả loại phòng</option>
                      <option value="Phòng đơn">Phòng đơn (Nguyên căn)</option>
                      <option value="Giường dorm">Giường dorm (Ghép)</option>
                    </select>
                  </div>

                  <div className="filter-group">
                    <label htmlFor="filter-mucGiaTu">Giá từ (VNĐ)</label>
                    <input type="number" id="filter-mucGiaTu" name="mucGiaTu" placeholder="Ví dụ: 1,500,000" value={boLocTraCuu.mucGiaTu} onChange={xuLyThayDoiBoLoc} />
                  </div>

                  <div className="filter-group">
                    <label htmlFor="filter-gioiTinh">Giới tính</label>
                    <select id="filter-gioiTinh" name="gioiTinh" value={boLocTraCuu.gioiTinh} onChange={xuLyThayDoiBoLoc}>
                      <option value="Tất cả">Tất cả giới tính</option>
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                    </select>
                  </div>

                  <div className="filter-group">
                    <label htmlFor="filter-soNguoi">Sức chứa (Số người)</label>
                    <input type="number" id="filter-soNguoi" name="soNguoi" placeholder="Số người tối thiểu" value={boLocTraCuu.soNguoi} onChange={xuLyThayDoiBoLoc} />
                  </div>

                  <div className="filter-group">
                    <label htmlFor="filter-tienIch">Tiện ích</label>
                    <select id="filter-tienIch" name="tienIch" value={boLocTraCuu.tienIch} onChange={xuLyThayDoiBoLoc}>
                      <option value="Tất cả">Tất cả tiện ích</option>
                      <option value="Điều hòa">Có điều hòa</option>
                      <option value="Gửi xe">Có chỗ gửi xe</option>
                      <option value="Wifi riêng">Có Wifi riêng</option>
                      <option value="Yên tĩnh">Không gian yên tĩnh</option>
                      <option value="Giờ giấc tự do">Giờ giấc tự do</option>
                    </select>
                  </div>

                </div>

                <button type="submit" className="submit-btn" style={{ marginTop: '10px' }} disabled={dangTaiPhongTrong}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '6px' }}>
                    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
                  </svg>
                  {dangTaiPhongTrong ? 'Đang tra cứu...' : 'Tìm kiếm'}
                </button>
              </form>

            </div>
          </header>

          {/* Warning Banner */}
          <div className="warning-banner-container">
            <div className="warning-banner-bar">
              <span className="warning-banner-icon">⚠️</span>
              <p>Chỉ hiển thị phòng/giường còn <strong>Trống</strong> và <strong>Chưa đặt cọc</strong></p>
            </div>
          </div>

          {/* Main list */}
          <main className="vacancy-list-section">
            <div className="list-title-bar">
              <div>
                <h2>Danh sách phòng khả dụng</h2>
                <p>Tìm thấy {danhSachTatCaPhongTrong.length} kết quả phù hợp với tiêu chí của bạn</p>
              </div>
              <div className="layout-buttons">
                <button className="layout-toggle active" aria-label="Grid view">Grid</button>
                <button className="layout-toggle" aria-label="List view">List</button>
              </div>
            </div>

            {danhSachTatCaPhongTrong.length > 0 ? (
              <div className="vacancy-grid-layout">
                {danhSachTatCaPhongTrong.slice((trangTraCuuHienTai - 1) * SO_LUONG_MOI_TRANG, trangTraCuuHienTai * SO_LUONG_MOI_TRANG).map((item) => (
                  <article key={`${item.kieu}-${item.maId}`} className="vacancy-room-card">
                    <div className="vacancy-card-img-wrapper" onClick={() => { setPhongDaChon(item); setTrangHienTai('room_detail'); }} style={{ cursor: 'pointer' }}>
                      <img src={layAnhMinhHoaPhong(item)} alt={item.ten} className="vacancy-card-img" />
                      <div className="vacancy-card-badges">
                        <span className={`badge-type ${item.kieu === 'Phong' ? 'badge-phong-loai' : 'badge-giuong-loai'}`}>
                          {item.kieu === 'Phong' ? 'Nguyên căn' : 'Ghép'}
                        </span>
                        <span className="badge-status-empty">Trống</span>
                      </div>
                    </div>

                    <div className="vacancy-card-body">
                      <div className="vacancy-card-title-row">
                        <h4 className="vacancy-card-title" onClick={() => { setPhongDaChon(item); setTrangHienTai('room_detail'); }} style={{ cursor: 'pointer' }}>{item.ten}</h4>
                        <span className="vacancy-card-price">{Number(item.giaThue).toLocaleString('vi-VN')}đ<span>/tháng</span></span>
                      </div>

                      <div className="vacancy-card-address">
                        📍 {item.chiNhanh} • {item.diaChi}
                      </div>

                      <div className="vacancy-card-details">
                        <span>👤 {item.kieu === 'Phong' ? `${item.sucChua} Người` : `1 Giường (${item.gioiTinh})`}</span>
                        <div className="card-utils-mini">
                          {item.tienIch ? item.tienIch.split(',').slice(0, 3).map((u, i) => (
                            <span key={i} className="mini-tag" title={u.trim()}>{u.trim()}</span>
                          )) : <span className="mini-tag">Cơ bản</span>}
                        </div>
                      </div>

                      <div className="vacancy-card-actions">
                        <button type="button" className="btn-detail-outline" onClick={() => { setPhongDaChon(item); setTrangHienTai('room_detail'); }}>
                          Xem chi tiết
                        </button>
                        {cheDoNhanVien ? (
                          <button type="button" className="btn-book-filled" onClick={() => setTabPhongGiuongNhanVien('xac-nhan')}>
                            Xác nhận yêu cầu
                          </button>
                        ) : (
                          <button type="button" className="btn-book-filled" onClick={() => setHenXemPhongModal(item)}>
                            Chọn để hẹn
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="no-results-vacant">
                <p>Không tìm thấy phòng hoặc giường nào trống khớp với các tiêu chí tìm kiếm hiện tại.</p>
                <p style={{ fontSize: '13px', marginTop: '6px', color: 'var(--text-muted)' }}>Vui lòng mở rộng khoảng lọc hoặc chọn "Tất cả chi nhánh" để tìm kiếm lại.</p>
              </div>
            )}

            {/* Pagination Component */}
            {danhSachTatCaPhongTrong.length > 0 && (
              <nav className="pagination-nav" aria-label="Pagination">
                <button 
                  className="pag-btn" 
                  onClick={() => { setTrangTraCuuHienTai(Math.max(1, trangTraCuuHienTai - 1)); window.scrollTo({ top: 500, behavior: 'smooth' }); }}
                  disabled={trangTraCuuHienTai === 1}
                >&lt;</button>
                
                {Array.from({ length: Math.ceil(danhSachTatCaPhongTrong.length / SO_LUONG_MOI_TRANG) }).map((_, i) => (
                  <button 
                    key={i + 1} 
                    className={`pag-btn ${trangTraCuuHienTai === i + 1 ? 'active' : ''}`}
                    onClick={() => { setTrangTraCuuHienTai(i + 1); window.scrollTo({ top: 500, behavior: 'smooth' }); }}
                  >
                    {i + 1}
                  </button>
                ))}
                
                <button 
                  className="pag-btn" 
                  onClick={() => { setTrangTraCuuHienTai(Math.min(Math.ceil(danhSachTatCaPhongTrong.length / SO_LUONG_MOI_TRANG), trangTraCuuHienTai + 1)); window.scrollTo({ top: 500, behavior: 'smooth' }); }}
                  disabled={trangTraCuuHienTai === Math.ceil(danhSachTatCaPhongTrong.length / SO_LUONG_MOI_TRANG)}
                >&gt;</button>
              </nav>
            )}

          </main>

          {/* Footer */}
          <footer className="footer-dark">
            <div className="footer-dark-top">
              <div className="footer-brand">
                <h3>HomeStay Dorm</h3>
                <p>Hệ thống quản lý ký túc xá và homestay chuyên nghiệp, mang lại trải nghiệm sống tốt nhất cho cư dân.</p>
              </div>
              <div className="footer-links-col">
                <h4>Khám phá</h4>
                <ul>
                  <li><a href="#" onClick={() => chuyenTrang('guest_home')}>Về chúng tôi</a></li>
                  <li><a href="#" onClick={() => chuyenTrang('search_vacancy')}>Tìm phòng nhanh</a></li>
                  <li><a href="#">Chính sách bảo mật</a></li>
                </ul>
              </div>
              <div className="footer-links-col">
                <h4>Hỗ trợ</h4>
                <ul>
                  <li><a href="#">Trung tâm trợ giúp</a></li>
                  <li><a href="#">Liên hệ Sale</a></li>
                  <li><a href="#">Báo cáo sự cố</a></li>
                </ul>
              </div>
              <div className="footer-subscribe">
                <h4>Đăng ký bản tin</h4>
                <div className="subscribe-input-row">
                  <input type="email" placeholder="Email của bạn" aria-label="Email của bạn" />
                  <button type="button" aria-label="Gửi">Gửi</button>
                </div>
              </div>
            </div>
            <div className="footer-dark-bottom">
              <p>© 2026 HomeStay Dorm. All Rights Reserved. Professional Real Estate Solutions.</p>
            </div>
          </footer>

          {/* Modal 1: Details */}
          {chiTietPhongModal && (
            <div className="modal-backdrop" onClick={() => setChiTietPhongModal(null)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Chi tiết {chiTietPhongModal.ten}</h3>
                  <button className="close-modal-btn" onClick={() => setChiTietPhongModal(null)} aria-label="Đóng">×</button>
                </div>
                <div className="modal-body-detail">
                  <img src={layAnhMinhHoaPhong(chiTietPhongModal)} alt={chiTietPhongModal.ten} className="modal-img" />
                  <div className="modal-details-grid">
                    <div className="modal-detail-row">
                      <strong>Loại chỗ ở:</strong>
                      <span>{chiTietPhongModal.kieu === 'Phong' ? 'Phòng đơn (Nguyên căn)' : 'Giường Dorm (Ở ghép)'}</span>
                    </div>
                    <div className="modal-detail-row">
                      <strong>Giá thuê:</strong>
                      <span className="text-orange">{Number(chiTietPhongModal.giaThue).toLocaleString('vi-VN')} đ/tháng</span>
                    </div>
                    <div className="modal-detail-row">
                      <strong>Địa chỉ chi nhánh:</strong>
                      <span>{chiTietPhongModal.chiNhanh} • {chiTietPhongModal.diaChi}</span>
                    </div>
                    <div className="modal-detail-row">
                      <strong>Giới tính yêu cầu:</strong>
                      <span>{chiTietPhongModal.kieu === 'Phong' ? 'Tất cả' : chiTietPhongModal.gioiTinh}</span>
                    </div>
                    <div className="modal-detail-row" style={{ flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
                      <strong>Tiện ích đi kèm:</strong>
                      <div className="room-utils-container">
                        {chiTietPhongModal.tienIch ? chiTietPhongModal.tienIch.split(',').map((u, i) => (
                          <span key={i} className="room-util-tag">{u.trim()}</span>
                        )) : <span className="room-util-tag">Cơ bản</span>}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-detail-outline" onClick={() => setChiTietPhongModal(null)}>Đóng</button>
                  <button type="button" className="btn-book-filled" onClick={() => { setHenXemPhongModal(chiTietPhongModal); setChiTietPhongModal(null); }}>Hẹn xem phòng</button>
                </div>
              </div>
            </div>
          )}

          {/* Modal 2: Appointment Booking */}
          {henXemPhongModal && (
            <div className="modal-backdrop" onClick={() => setHenXemPhongModal(null)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Đăng ký xem {henXemPhongModal.ten}</h3>
                  <button className="close-modal-btn" onClick={() => setHenXemPhongModal(null)} aria-label="Đóng">×</button>
                </div>
                <form onSubmit={guiYeuCauDatLichHen}>
                  <div className="modal-body">
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>Bạn đang đăng ký lịch xem phòng tại: <strong>{henXemPhongModal.chiNhanh} • {henXemPhongModal.diaChi}</strong></p>

                    <div className="input-group">
                      <label htmlFor="hen-hoTen">Họ và tên khách hàng</label>
                      <input type="text" id="hen-hoTen" name="hoTen" placeholder="Nguyễn Văn A" value={formHenXem.hoTen} onChange={xuLyThayDoiHenXem} required />
                    </div>

                    <div className="input-group">
                      <label htmlFor="hen-sdt">Số điện thoại liên hệ</label>
                      <input type="tel" id="hen-sdt" name="sdt" placeholder="09xx xxx xxx" value={formHenXem.sdt} onChange={xuLyThayDoiHenXem} required />
                    </div>

                    <div className="input-group">
                      <label htmlFor="hen-email">Email (Không bắt buộc)</label>
                      <input type="email" id="hen-email" name="email" placeholder="example@gmail.com" value={formHenXem.email} onChange={xuLyThayDoiHenXem} />
                    </div>

                    <div className="input-group">
                      <label htmlFor="hen-ngayGioHen">Ngày giờ muốn xem phòng</label>
                      <input type="datetime-local" id="hen-ngayGioHen" name="ngayGioHen" value={formHenXem.ngayGioHen} onChange={xuLyThayDoiHenXem} required />
                    </div>

                    <div className="input-group">
                      <label htmlFor="hen-ghiChu">Ghi chú thêm</label>
                      <textarea id="hen-ghiChu" name="ghiChu" rows="2" placeholder="Ví dụ: Em muốn xem phòng buổi sáng, gọi trước cho em 15 phút..." value={formHenXem.ghiChu} onChange={xuLyThayDoiHenXem} style={{ padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: '#f8fafc', fontSize: '13.5px', fontFamily: 'inherit', resize: 'vertical' }}></textarea>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn-detail-outline" onClick={() => setHenXemPhongModal(null)}>Hủy bỏ</button>
                    <button type="submit" className="btn-book-filled" disabled={dangXuLy}>
                      {dangXuLy ? 'Đang đăng ký...' : 'Xác nhận đặt lịch'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ==========================================
          TRANG CHI TIẾT PHÒNG/GIƯỜNG (ROOM DETAILS)
          ========================================== */}
      {trangHienTai === 'room_detail' && phongDaChon && (
        <div className="room-detail-page">

          <div className="back-navigation">
            <button type="button" className="btn-back-link" onClick={() => { if (cheDoNhanVien) setTabPhongGiuongNhanVien('danh-sach'); chuyenTrang(cheDoNhanVien ? 'confirm_status' : 'search_vacancy'); }}>
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
                    {phongDaChon.kieu === 'Phong' ? 'PHÒNG ĐƠN' : 'PHÒNG GHÉP'}
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
                  {phongDaChon.tienIch ? phongDaChon.tienIch.split(',').map((u, i) => (
                    <span key={i} className="detail-util-tag">
                      {u.trim().includes('Điều hòa') && '❄️ '}
                      {u.trim().includes('Wifi') && '📶 '}
                      {u.trim().includes('giặt') && '🧺 '}
                      {u.trim().includes('Tủ lạnh') && '🧊 '}
                      {u.trim().includes('ninh') && '🔒 '}
                      {u.trim()}
                    </span>
                  )) : (
                    <>
                      <span className="detail-util-tag">❄️ Điều hòa</span>
                      <span className="detail-util-tag">📶 Wi-Fi</span>
                      <span className="detail-util-tag">🧺 Máy giặt</span>
                      <span className="detail-util-tag">🧊 Tủ lạnh</span>
                      <span className="detail-util-tag">🔒 An ninh 24/7</span>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="detail-action-buttons">
                <button type="button" className="btn-action-orange btn-choose-room" onClick={() => xuLyDatPhong(phongDaChon)}>
                  Chọn phòng này
                </button>
                <div className="btn-divider-pipe">|</div>
                <button type="button" className="btn-action-orange btn-book-visit" onClick={() => {
                  if (cheDoNhanVien) {
                    setDanhSachPhongDatHen([phongDaChon]);
                    setTrangHienTai('staff_booking');
                  } else {
                    setHenXemPhongModal(phongDaChon);
                  }
                }}>
                  Đặt lịch hẹn
                </button>
              </div>

              <div className="btn-action-outline-row">
                <button type="button" className="btn-action-outline" onClick={() => hienThongBao('success', 'Đã sao chép liên kết chia sẻ!')}>
                  🔗 Chia sẻ
                </button>
                <button type="button" className="btn-action-outline" onClick={() => hienThongBao('success', 'Đã lưu tin phòng này vào danh sách yêu thích!')}>
                  ❤️ Lưu tin
                </button>
              </div>

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
          <p className="page-subtitle">Vui lòng hoàn tất thông tin lịch hẹn để gửi thông báo cho khách hàng.</p>

          <div className="booking-card">

            {/* 1. Guest Information Box */}
            <div className="booking-guest-box">
              <div className="guest-box-header">
                <h3>
                  <span className="icon-user">👤</span> Thông tin khách
                </h3>
                <button type="button" className="btn-edit-guest" onClick={() => { setCheDoNhanVien(true); chuyenTrang('staff_reception'); }}>
                  ✏️ Chỉnh sửa
                </button>
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

              {/* 2. Selected Rooms Section */}
              <div className="booking-section">
                <h4>
                  <span className="icon-house">🏢</span> Phòng/giường được chọn
                </h4>
                <div className="selected-rooms-container">
                  {danhSachPhongDatHen.length > 0 ? (
                    danhSachPhongDatHen.map((room, idx) => (
                      <span key={idx} className="room-tag-badge">
                        Phòng {room.maId || room.maPhong} - {room.kieu === 'Phong' ? 'Toàn phòng' : 'Giường dorm'}
                        <button type="button" className="btn-remove-tag" onClick={() => xuLyXoaPhongLichHen(room)} aria-label="Xóa">×</button>
                      </span>
                    ))
                  ) : (
                    <span className="no-rooms-selected-warning">Chưa có phòng nào được chọn. Vui lòng bấm thêm phòng.</span>
                  )}

                  <button type="button" className="btn-add-room" onClick={xuLyThemPhongLichHen}>
                    + Thêm phòng
                  </button>
                </div>
              </div>

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
                    onChange={(e) => setNgayHen(e.target.value)}
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
                    onChange={(e) => setGioHen(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* 4. Notification channel selection */}
              <div className="booking-section">
                <h4>
                  <span className="icon-bell">📢</span> Hình thức thông báo
                </h4>
                <div className="radio-group-row">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="hinhThucThongBao"
                      value="email"
                      checked={hinhThucThongBao === 'email'}
                      onChange={() => setHinhThucThongBao('email')}
                    />
                    Email
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="hinhThucThongBao"
                      value="sms"
                      checked={hinhThucThongBao === 'sms'}
                      onChange={() => setHinhThucThongBao('sms')}
                    />
                    SMS
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="hinhThucThongBao"
                      value="both"
                      checked={hinhThucThongBao === 'both'}
                      onChange={() => setHinhThucThongBao('both')}
                    />
                    Cả hai (Email &amp; SMS)
                  </label>
                </div>
              </div>

              {/* 5. Notes for guest */}
              <div className="input-group" style={{ marginTop: '20px' }}>
                <label htmlFor="ghiChuLichHen">
                  <span className="icon-note">📝</span> Ghi chú cho khách
                </label>
                <textarea
                  id="ghiChuLichHen"
                  rows="3"
                  placeholder="Nhập lời nhắn hoặc hướng dẫn tìm đường cho khách..."
                  value={ghiChuLichHen}
                  onChange={(e) => setGhiChuLichHen(e.target.value)}
                  style={{
                    padding: '12px 16px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    backgroundColor: '#ffffff',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    width: '100%'
                  }}
                ></textarea>
              </div>

              {/* 6. Form Actions */}
              <div className="booking-form-actions">
                <button type="button" className="btn-cancel-booking" onClick={() => {
                  if (phongDaChon) {
                    setTrangHienTai('room_detail');
                  } else {
                    setTrangHienTai('search_vacancy');
                  }
                }}>
                  Hủy
                </button>
                <button type="submit" className="btn-submit-booking" disabled={dangXuLy}>
                  {dangXuLy ? 'Đang gửi...' : 'Gửi thông báo lịch hẹn ✉️'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {trangHienTai === 'staff_reception' && (
        // ==========================================
        // GIAO DIỆN TRANG TIẾP NHẬN CỦA NHÂN VIÊN
        // ==========================================
        <div className="app-container">
          <div className="deposit-page-header" style={{ marginBottom: 0 }}>
            <div>
              <p className="payment-breadcrumb">Khách hàng &nbsp;&gt;&nbsp; <span>Tiếp nhận thông tin</span></p>
              <h1 className="page-title" style={{ margin: 0 }}>Tiếp nhận thông tin &amp; yêu cầu thuê</h1>
              <p className="page-subtitle" style={{ margin: '4px 0 0 0' }}>Vui lòng nhập chính xác thông tin để tìm kiếm phòng phù hợp nhất cho khách hàng.</p>
            </div>
          </div>

          <div className="payment-subtabs" style={{ marginTop: '16px', marginBottom: '24px' }}>
            <button type="button" className={`payment-subtab ${trangHienTai === 'staff_reception' ? 'active' : ''}`} onClick={() => chuyenTrang('staff_reception')}>Tiếp nhận thông tin</button>
            <button type="button" className={`payment-subtab ${trangHienTai === 'review_info' ? 'active' : ''}`} onClick={() => chuyenTrang('review_info')}>Rà soát thông tin</button>
          </div>

          <div className="content-grid">
            <form className="form-card" onSubmit={xuLyGuiYeuCauNhanVien}>

              <section className="form-section">
                <div className="section-header">
                  <span className="section-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
                    </svg>
                  </span>
                  <h2>Thông tin khách hàng</h2>
                </div>

                <div className="input-grid-2">
                  <div className="input-group">
                    <label htmlFor="hoTen">Họ và tên</label>
                    <input
                      type="text"
                      id="hoTen"
                      name="hoTen"
                      placeholder="Nguyễn Văn A"
                      value={formKhachHang.hoTen}
                      onChange={xuLyThayDoiKhachHang}
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="cccd">Số Căn cước công dân</label>
                    <input
                      type="text"
                      id="cccd"
                      name="cccd"
                      placeholder="12 chữ số"
                      value={formKhachHang.cccd}
                      onChange={xuLyThayDoiKhachHang}
                    />
                  </div>
                </div>

                <div className="input-grid-2">
                  <div className="input-group">
                    <label htmlFor="sdt">Số điện thoại</label>
                    <input
                      type="tel"
                      id="sdt"
                      name="sdt"
                      placeholder="090 000 0000"
                      value={formKhachHang.sdt}
                      onChange={xuLyThayDoiKhachHang}
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="example@gmail.com"
                      value={formKhachHang.email}
                      onChange={xuLyThayDoiKhachHang}
                    />
                  </div>
                </div>

                <div className="input-grid-2">
                  <div className="input-group">
                    <label htmlFor="quocTich">Quốc tịch</label>
                    <select
                      id="quocTich"
                      name="quocTich"
                      value={formKhachHang.quocTich}
                      onChange={xuLyThayDoiKhachHang}
                    >
                      <option value="Việt Nam">Việt Nam</option>
                      <option value="Hàn Quốc">Hàn Quốc</option>
                      <option value="Nhật Bản">Nhật Bản</option>
                      <option value="Mỹ">Mỹ</option>
                      <option value="Anh">Anh</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label htmlFor="ngaySinh">Ngày sinh</label>
                    <input
                      type="date"
                      id="ngaySinh"
                      name="ngaySinh"
                      value={formKhachHang.ngaySinh}
                      onChange={xuLyThayDoiKhachHang}
                    />
                  </div>
                </div>
              </section>

              <div className="divider"></div>

              <section className="form-section">
                <div className="section-header">
                  <span className="section-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M8.354 1.146a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 2 8h2v7a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1V9h2v6a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1V8h2a.5.5 0 0 0 .354-.854l-6-6z" />
                    </svg>
                  </span>
                  <h2>Yêu cầu thuê</h2>
                </div>

                <div className="rental-type-container">
                  <span className="rental-type-label">Hình thức thuê</span>
                  <div className="toggle-group">
                    <button
                      type="button"
                      className={`toggle-btn ${formYeuCauThue.loaiPhong === 'Nguyên phòng' ? 'active' : ''}`}
                      onClick={() => xuLyChonLoaiPhong('Nguyên phòng')}
                    >
                      <svg viewBox="0 0 24 24">
                        <path d="M12 3L2 12h3v8h14v-8h3L12 3zm0 4.5l5.5 5.5H16v6H8v-6H6.5L12 7.5z" />
                      </svg>
                      Thuê nguyên phòng
                    </button>
                    <button
                      type="button"
                      className={`toggle-btn ${formYeuCauThue.loaiPhong === 'Giường ghép' ? 'active' : ''}`}
                      onClick={() => xuLyChonLoaiPhong('Giường ghép')}
                    >
                      <svg viewBox="0 0 24 24">
                        <path d="M2 10V5h2v5h16V5h2v15h-2v-3H4v3H2v-5H1v-2h1zm3-3h14v7H5V7zm3 2v3h8V9H8z" />
                      </svg>
                      Thuê giường ở ghép
                    </button>
                  </div>
                </div>

                <div className="input-grid-2">
                  <div className="input-group">
                    <label htmlFor="khuVucMongMuon">Khu vực ưu tiên</label>
                    <input
                      type="text"
                      id="khuVucMongMuon"
                      name="khuVucMongMuon"
                      placeholder="Quận 1, Quận Bình Thạnh..."
                      value={formYeuCauThue.khuVucMongMuon}
                      onChange={xuLyThayDoiYeuCau}
                    />
                  </div>
                  <div className="input-group">
                    <label>Khoảng giá (VNĐ)</label>
                    <div className="range-inputs">
                      <input
                        type="number"
                        name="mucGiaTu"
                        placeholder="Từ"
                        value={formYeuCauThue.mucGiaTu}
                        onChange={xuLyThayDoiYeuCau}
                      />
                      <span>—</span>
                      <input
                        type="number"
                        name="mucGiaDen"
                        placeholder="Đến"
                        value={formYeuCauThue.mucGiaDen}
                        onChange={xuLyThayDoiYeuCau}
                      />
                    </div>
                  </div>
                </div>

                <div className="input-grid-4">
                  <div className="input-group">
                    <label htmlFor="soNguoi">Số người</label>
                    <input
                      type="number"
                      id="soNguoi"
                      name="soNguoi"
                      min="1"
                      value={formYeuCauThue.soNguoi}
                      onChange={xuLyThayDoiYeuCau}
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="gioiTinh">Giới tính</label>
                    <select
                      id="gioiTinh"
                      name="gioiTinh"
                      value={formYeuCauThue.gioiTinh}
                      onChange={xuLyThayDoiYeuCau}
                    >
                      <option value="Tất cả">Tất cả</option>
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label htmlFor="thoiGianVao">Ngày dọn vào</label>
                    <input
                      type="date"
                      id="thoiGianVao"
                      name="thoiGianVao"
                      value={formYeuCauThue.thoiGianVao}
                      onChange={xuLyThayDoiYeuCau}
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="thoiHanThue">Thời hạn thuê</label>
                    <select
                      id="thoiHanThue"
                      name="thoiHanThue"
                      value={formYeuCauThue.thoiHanThue}
                      onChange={xuLyThayDoiYeuCau}
                    >
                      <option value="1">1 Tháng</option>
                      <option value="3">3 Tháng</option>
                      <option value="6">6 Tháng</option>
                      <option value="12">12 Tháng</option>
                    </select>
                  </div>
                </div>
              </section>

              <div className="divider"></div>

              <section className="form-section">
                <div className="section-header">
                  <span className="section-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M11.5 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L11 2.707V14.5a.5.5 0 0 0 .5.5zm-7-14a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L4 13.293V1.5a.5.5 0 0 1 .5-.5z" />
                    </svg>
                  </span>
                  <h2>Tiêu chí ưu tiên</h2>
                </div>

                <div className="checkbox-row">
                  <div className="checkbox-item">
                    <input
                      type="checkbox"
                      id="cb-yentinh"
                      checked={tieuChiUuTien.yenTinh}
                      onChange={() => xuLyThayDoiTieuChi('yenTinh')}
                    />
                    <label htmlFor="cb-yentinh" className="checkbox-label">
                      <span className="custom-checkbox-dot"></span>
                      Yên tĩnh
                    </label>
                  </div>
                  <div className="checkbox-item">
                    <input
                      type="checkbox"
                      id="cb-guixe"
                      checked={tieuChiUuTien.guiXe}
                      onChange={() => xuLyThayDoiTieuChi('guiXe')}
                    />
                    <label htmlFor="cb-guixe" className="checkbox-label">
                      <span className="custom-checkbox-dot"></span>
                      Gửi xe
                    </label>
                  </div>
                  <div className="checkbox-item">
                    <input
                      type="checkbox"
                      id="cb-dieuhoa"
                      checked={tieuChiUuTien.dieuHoa}
                      onChange={() => xuLyThayDoiTieuChi('dieuHoa')}
                    />
                    <label htmlFor="cb-dieuhoa" className="checkbox-label">
                      <span className="custom-checkbox-dot"></span>
                      Điều hòa
                    </label>
                  </div>
                  <div className="checkbox-item">
                    <input
                      type="checkbox"
                      id="cb-wifirieng"
                      checked={tieuChiUuTien.wifiRieng}
                      onChange={() => xuLyThayDoiTieuChi('wifiRieng')}
                    />
                    <label htmlFor="cb-wifirieng" className="checkbox-label">
                      <span className="custom-checkbox-dot"></span>
                      Wifi riêng
                    </label>
                  </div>
                  <div className="checkbox-item">
                    <input
                      type="checkbox"
                      id="cb-giogiactudo"
                      checked={tieuChiUuTien.gioGiacTuDo}
                      onChange={() => xuLyThayDoiTieuChi('gioGiacTuDo')}
                    />
                    <label htmlFor="cb-giogiactudo" className="checkbox-label">
                      <span className="custom-checkbox-dot"></span>
                      Giờ giấc tự do
                    </label>
                  </div>
                </div>
              </section>

              <button type="submit" className="submit-btn" disabled={dangXuLy}>
                {dangXuLy ? 'Đang xử lý...' : 'Tra cứu phòng phù hợp'}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path fillRule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z" />
                </svg>
              </button>

            </form>

            <aside className="sidebar">

              <article className="sidebar-card suggestion-card">
                <h3 className="suggestion-title">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                    <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217c-.004.133.1.232.23.232h.8c.123 0 .224-.092.238-.214l.003-.122c.038-.667.447-1.042 1.11-1.517.653-.466 1.258-1.077 1.258-2.184 0-1.578-1.377-2.302-2.794-2.302-1.496 0-2.738.755-2.88 2.302zM8 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
                  </svg>
                  Gợi ý nhanh
                </h3>
                <p className="suggestion-text">
                  Dựa trên dữ liệu hệ thống, các khu vực Quận 1 và Bình Thạnh đang có tỷ lệ lấp đầy rất cao (95%).
                </p>
                <button className="market-report-link" onClick={() => hienThongBao('success', 'Đang mở Báo cáo thị trường...')}>
                  Xem báo cáo thị trường
                </button>
              </article>

              <section className="sidebar-card stats-card">
                <h3>Phòng trống khả dụng</h3>
                <div className="stats-list">
                  <div className="stats-item">
                    <div className="stats-item-left">
                      <span className="status-dot green"></span>
                      <span>Dorm Nữ - Quận 1</span>
                    </div>
                    <span className="stats-count">{String(thongKePhongTrong.dormNuQ1).padStart(2, '0')}</span>
                  </div>
                  <div className="stats-item">
                    <div className="stats-item-left">
                      <span className="status-dot green"></span>
                      <span>Phòng đơn - Bình Thạnh</span>
                    </div>
                    <span className="stats-count">{String(thongKePhongTrong.phongDonBT).padStart(2, '0')}</span>
                  </div>
                  <div className="stats-item">
                    <div className="stats-item-left">
                      <span className="status-dot yellow"></span>
                      <span>Dorm Nam - Quận 3</span>
                    </div>
                    <span className="stats-count">{String(thongKePhongTrong.dormNamQ3).padStart(2, '0')}</span>
                  </div>
                </div>
              </section>

              <div className="sidebar-img-container">
                <img src="/dorm_room.png" alt="Dorm room mockup" className="sidebar-img" />
              </div>

            </aside>

            {daTraCuu && (
              <section className="results-section">
                <div className="results-header">
                  <h3>Phòng trống phù hợp tìm thấy</h3>
                  <span className="results-count">Tìm thấy {danhSachPhong.length} kết quả phù hợp</span>
                </div>

                {danhSachPhong.length > 0 ? (
                  <div className="rooms-list">
                    {danhSachPhong.map((item) => (
                      <article key={`${item.kieu}-${item.maId}`} className="room-card">
                        <div className="room-header">
                          <h4 className="room-title">{item.ten}</h4>
                          <span className={`room-badge ${item.kieu === 'Phong' ? 'badge-phong' : 'badge-giuong'}`}>
                            {item.kieu === 'Phong' ? 'Nguyên phòng' : 'Giường Dorm'}
                          </span>
                        </div>
                        <div className="room-branch">{item.chiNhanh} • {item.diaChi}</div>
                        <div className="room-details">
                          <div className="room-detail-item">
                            <span className="room-detail-label">Loại phòng</span>
                            <span className="room-detail-val">{item.loaiPhong}</span>
                          </div>
                          <div className="room-detail-item">
                            <span className="room-detail-label">Sức chứa/Giới tính</span>
                            <span className="room-detail-val">
                              {item.kieu === 'Phong' ? `${item.sucChua} người` : `Dành cho ${item.gioiTinh}`}
                            </span>
                          </div>
                          <div className="room-detail-item" style={{ flexDirection: 'column', gap: '4px' }}>
                            <span className="room-detail-label">Tiện ích bao gồm:</span>
                            <div className="room-utils-container">
                              {item.tienIch ? item.tienIch.split(',').map((tag, idx) => (
                                <span key={idx} className="room-util-tag">{tag.trim()}</span>
                              )) : <span className="room-util-tag">Cơ bản</span>}
                            </div>
                          </div>
                        </div>
                        <div className="room-price-row">
                          <span className="room-price-label">Giá thuê</span>
                          <span className="room-price-val">{Number(item.giaThue).toLocaleString('vi-VN')} đ/tháng</span>
                        </div>
                        <button className="book-btn" onClick={() => xuLyDatPhong(item)}>Đặt phòng ngay</button>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="no-results">
                    <p>Không có phòng trống nào khớp hoàn toàn với yêu cầu hiện tại.</p>
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      )}
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
                  <p className="payment-breadcrumb">Hợp đồng &nbsp;&gt;&nbsp; <span>Danh sách lịch hẹn</span></p>
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
                    onClick={() => hienThongBao('info', 'Chức năng Tạo lịch hẹn mới ngay tại bảng đang được phát triển.')}
                  >
                    + Thêm lịch hẹn
                  </button>
                </div>
              </div>

              <div className="payment-subtabs" style={{ marginBottom: '16px' }}>
                <button type="button" className={`payment-subtab ${tabHopDongNhanVien === 'danh-sach-hen' ? 'active' : ''}`} onClick={() => setTabHopDongNhanVien('danh-sach-hen')}>Danh sách lịch hẹn</button>
                <button type="button" className={`payment-subtab ${tabHopDongNhanVien === 'phe-duyet' ? 'active' : ''}`} onClick={() => setTabHopDongNhanVien('phe-duyet')}>Phê duyệt cọc</button>
              </div>

              <div className="subtabs-filters-bar">
                <button type="button" className="subtab-filter-btn active" onClick={() => setBoLocLichHen('tat-ca')}>Tất cả</button>
                <button type="button" className="subtab-filter-btn" onClick={() => setBoLocLichHen('hom-nay')}>Hôm nay</button>
                <button type="button" className="subtab-filter-btn" onClick={() => setBoLocLichHen('tuan-nay')}>Tuần này</button>
                <button type="button" className="subtab-filter-btn" onClick={() => setBoLocLichHen('cho-xem')}>Chờ xem</button>
                <button type="button" className="subtab-filter-btn" onClick={() => setBoLocLichHen('da-xem')}>Đã xem</button>
              </div>

          {/* Overview Counts Grid */}
          <div className="overview-counts-grid">
            <div className="count-card">
              <span className="count-title">TỔNG LỊCH HẸN</span>
              <strong className="count-num">128</strong>
            </div>
            <div className="count-card count-blue">
              <span className="count-title">CHỜ XEM HÔM NAY</span>
              <strong className="count-num">12</strong>
            </div>
            <div className="count-card count-orange">
              <span className="count-title">HẸN THÊM</span>
              <strong className="count-num">05</strong>
            </div>
            <div className="count-card count-green">
              <span className="count-title">ĐÃ CHỐT (CỌC)</span>
              <strong className="count-num">42</strong>
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
                    <th>Phòng hẹn</th>
                    <th>Ngày giờ</th>
                    <th>Trạng thái</th>
                    <th style={{ textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const merged = layDanhSachLichHenGop();
                    const filtered = merged.filter(item => {
                      const matchSearch = item.TenKhach.toLowerCase().includes(tuKhoaLichHen.toLowerCase()) ||
                        String(item.MaPhong).includes(tuKhoaLichHen);
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
                        return item.KetQua === 'Chờ xem';
                      }
                      if (boLocLichHen === 'da-xem') {
                        return item.KetQua !== 'Chờ xem';
                      }
                      return true;
                    });

                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                            Không tìm thấy lịch hẹn nào khớp với bộ lọc hiện tại.
                          </td>
                        </tr>
                      );
                    }

                    return filtered.map((item, idx) => (
                      <tr key={item.MaLich}>
                        <td>{String(idx + 1).padStart(2, '0')}</td>
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
                          <span className="room-badge-table">
                            {item.TenPhongGiuong}
                          </span>
                        </td>
                        <td>
                          <span className="datetime-cell-content">
                            📅 {dinhDangNgayGio(item.NgayGioHen)}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge-pill status-${item.KetQua === 'Chờ xem' ? 'cho-xem' :
                              item.KetQua === 'Đặt cọc' ? 'dat-coc' :
                                item.KetQua === 'Hẹn thêm' ? 'hen-them' : 'khong-thue'
                            }`}>
                            {item.KetQua === 'Chờ xem' && '• Chờ xem'}
                            {item.KetQua === 'Đặt cọc' && '• Đặt cọc'}
                            {item.KetQua === 'Hẹn thêm' && '• Hẹn thêm'}
                            {item.KetQua === 'Không thuê' && '• Không thuê'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {item.KetQua === 'Chờ xem' || item.KetQua === 'Hẹn thêm' ? (
                            <div className="table-select-wrapper">
                              <select
                                value=""
                                onChange={(e) => capNhatTrangThaiLichHen(item.MaLich, e.target.value)}
                                className="select-action-table"
                              >
                                <option value="" disabled>Cập nhật kết quả</option>
                                <option value="Đặt cọc">Đặt cọc</option>
                                <option value="Hẹn thêm">Hẹn thêm</option>
                                <option value="Không thuê">Không thuê</option>
                              </select>
                            </div>
                          ) : item.KetQua === 'Đặt cọc' ? (
                            <a href="#" className="table-action-link" onClick={(e) => { e.preventDefault(); hienThongBao('info', 'Đang tải hợp đồng đặt cọc...'); }}>
                              Xem hợp đồng cọc
                            </a>
                          ) : (
                            <span className="table-reason-text">Lý do: {item.GhiChu || 'Tài chính không đủ'}</span>
                          )}
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>

            {/* Table Footer / Pagination */}
            <div className="table-footer-row">
              <span className="footer-entries-info">
                Hiển thị 4 trên 128 lịch hẹn
              </span>
              <div className="table-pagination">
                <button type="button" className="pag-btn" onClick={() => hienThongBao('info', 'Trang trước')}>&lt;</button>
                <button type="button" className="pag-btn active">1</button>
                <button type="button" className="pag-btn" onClick={() => hienThongBao('info', 'Đến trang 2')}>2</button>
                <button type="button" className="pag-btn" onClick={() => hienThongBao('info', 'Đến trang 3')}>3</button>
                <button type="button" className="pag-btn" onClick={() => hienThongBao('info', 'Trang sau')}>&gt;</button>
              </div>
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
                    <p>"Em đã chuyển cọc trước 1 tháng, nhờ anh/chị giữ chỗ giúp em ạ. Em sẽ dọn vào cuối tuần này."</p>
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
          onXacNhanThanhCong={() => { hienThongBao('success', 'Lập hợp đồng xong! Chuyển sang thanh toán đầu kỳ...'); setTimeout(() => chuyenTrang('staff_payment'), 1500); }}
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

      {/* ===========================================================
           2.5 PHÊ DUYỆT YÊU CẦU ĐẶT CỌC (QUẢN LÝ)
      =========================================================== */}
      {/* MODAL HỎI ĐIỀU HƯỚNG SAU KHI ĐẶT LỊCH HẸN THÀNH CÔNG */}
      {bookingSuccessModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '450px', padding: '24px' }}>
            <div className="modal-header" style={{ padding: '0 0 12px 0', borderBottom: 'none' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', margin: 0 }}>🎉 Đặt lịch hẹn thành công!</h3>
            </div>
            <div className="modal-body" style={{ padding: '12px 0 0 0', textAlign: 'center' }}>
              <p style={{ fontSize: '14.5px', color: '#475569', lineHeight: '1.6', margin: '0 0 20px 0' }}>
                Hệ thống đã lưu thông tin lịch hẹn và gửi thông báo xác nhận đến khách hàng. Bạn muốn đi đến đâu tiếp theo?
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  type="button"
                  className="btn-book-filled"
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', fontWeight: '700' }}
                  onClick={() => {
                    setBookingSuccessModal(false);
                    setCheDoNhanVien(true);
                    setVaiTroNhanVien('sale');
                    chuyenTrang('staff_contracts');
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
                    navigate(ROUTES.dashboard);
                    hienThongBao('info', 'Trang Dashboard đang được phát triển. Bạn sẽ được chuyển hướng sau.');
                    setCheDoNhanVien(true);
                    setVaiTroNhanVien('sale');
                    chuyenTrang('staff_reception');
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
                    setCheDoNhanVien(true);
                    setVaiTroNhanVien('sale');
                    chuyenTrang('staff_reception');
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
                    setCheDoNhanVien(true);
                    setVaiTroNhanVien('quanly');
                    setShowLoginModal(false);
                    chuyenTrang('staff_checkout');
                    hienThongBao('success', 'Đăng nhập thành công với vai trò Quản lý chi nhánh!');
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