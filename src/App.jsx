import { useState, useEffect } from 'react';

export default function App() {
  // Quản lý chuyển màn hình: 'guest_home', 'staff_reception', 'search_vacancy', hoặc 'room_detail'
  const [trangHienTai, setTrangHienTai] = useState('guest_home');

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
  const [dangTaiPhongTrong, setDangTaiPhongTrong] = useState(false);
  const [boLocTraCuu, setBoLocTraCuu] = useState({
    khuVuc: 'Tất cả',
    loaiPhong: 'Tất cả', // 'Tất cả', 'Phòng đơn' (Nguyên phòng), 'Giường dorm' (Giường ghép)
    mucGiaTu: '',
    gioiTinh: 'Tất cả',
    soNguoi: '',
    tienIch: 'Tất cả'
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
      const paramYeuCauList = boLocHienTai.tienIch === 'Tất cả' ? [] : [boLocHienTai.tienIch];

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
      hienThongBao('error', 'Vui lòng điền các trường bắt buộc (Họ tên, SĐT, Ngày giờ hẹn)!');
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

  const layAnhMinhHoaPhong = (item) => {
    if (item.kieu === 'Phong') {
      if (item.maId % 2 === 0) return '/cozy_dorm_bed.png';
      return '/studio_loft.png';
    }
    return '/dorm_room.png';
  };

  const xuLyXoaPhongLichHen = (room) => {
    setDanhSachPhongDatHen(prev => prev.filter(r => r.maId !== room.maId));
  };

  const xuLyThemPhongLichHen = () => {
    const demoRoom = {
      maId: 405,
      ten: 'Phòng Premium G-405',
      kieu: 'Phong',
      giaThue: 3500000,
      chiNhanh: 'Vinhomes Central Park',
      diaChi: 'Bình Thạnh, TP.HCM'
    };
    setDanhSachPhongDatHen(prev => {
      if (prev.some(r => r.maId === demoRoom.maId)) return prev;
      return [...prev, demoRoom];
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
      const customerName = formKhachHang.hoTen.trim() || 'Lê Thị Minh Anh';
      const customerPhone = formKhachHang.sdt.trim() || '0901234567';
      const customerEmail = formKhachHang.email.trim() || 'minhanh.le@example.com';
      
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
      setTrangHienTai('staff_reception');
    } catch (err) {
      console.error('Lỗi khi nhân viên đặt lịch hẹn:', err);
      hienThongBao('error', 'Có lỗi xảy ra khi tạo lịch hẹn!');
    } finally {
      setDangXuLy(false);
    }
  };

  useEffect(() => {
    if (trangHienTai === 'guest_home') {
      taiThongKeTongHop();
    } else if (trangHienTai === 'staff_reception') {
      taiThongKePhongTrong();
    } else if (trangHienTai === 'search_vacancy') {
      taiTatCaPhongTrong();
    }
  }, [trangHienTai]);

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
    // 1. Map filters
    let mappedKhuVuc = 'Tất cả';
    const kv = (formYeuCauThue.khuVucMongMuon || '').toLowerCase();
    if (kv.includes('quận 1') || kv.includes('q1')) mappedKhuVuc = 'Quận 1';
    else if (kv.includes('bình thạnh') || kv.includes('bt')) mappedKhuVuc = 'Bình Thạnh';
    else if (kv.includes('quận 3') || kv.includes('q3')) mappedKhuVuc = 'Quận 3';

    let mappedLoaiPhong = 'Tất cả';
    if (formYeuCauThue.loaiPhong === 'Nguyên phòng') mappedLoaiPhong = 'Phòng đơn';
    else if (formYeuCauThue.loaiPhong === 'Giường ghép') mappedLoaiPhong = 'Giường dorm';

    const danhSachTieuChi = layDanhSachTieuChiChuoi();
    const mappedTienIch = danhSachTieuChi.length > 0 ? danhSachTieuChi[0] : 'Tất cả';

    const newFilters = {
      khuVuc: mappedKhuVuc,
      loaiPhong: mappedLoaiPhong,
      mucGiaTu: formYeuCauThue.mucGiaTu || '',
      gioiTinh: formYeuCauThue.gioiTinh || 'Tất cả',
      soNguoi: formYeuCauThue.soNguoi || '',
      tienIch: mappedTienIch
    };

    setBoLocTraCuu(newFilters);

    // 2. Try to save the lead in the background if data is valid
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
        hienThongBao('success', 'Đã lưu thông tin tiếp nhận và đang chuyển sang trang tra cứu...');
      } catch (err) {
        console.error('Lỗi lưu thông tin tiếp nhận:', err);
      }
    } else {
      hienThongBao('success', 'Đang chuyển sang trang tra cứu phòng trống...');
    }

    // 3. Navigate to search vacancy screen
    setCheDoNhanVien(true);
    setTrangHienTai('search_vacancy');
    
    // 4. Trigger search with new filters
    taiTatCaPhongTrong(newFilters);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const xuLyGuiYeuCauNhanVien = async (e) => {
    if (e) e.preventDefault();
    await chuyenSangTraCuuTuNhanVien();
  };

  const xuLyDatPhong = (item) => {
    hienThongBao('success', `Đã tạo yêu cầu giữ chỗ cho ${item.ten} thành công!`);
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
            <li className={trangHienTai === 'guest_home' ? 'active' : ''}>
              <a href="#" onClick={() => { setCheDoNhanVien(false); chuyenTrang('guest_home'); }}>Trang chủ</a>
            </li>
            <li className={trangHienTai === 'search_vacancy' ? 'active' : ''}>
              <a href="#" onClick={() => { setCheDoNhanVien(false); chuyenTrang('search_vacancy'); }}>Phòng/Giường</a>
            </li>
            {trangHienTai === 'guest_home' && (
              <>
                <li><a href="#utilities">Tiện ích</a></li>
                <li><a href="#reviews">Đánh giá</a></li>
                <li><a href="#consult">Đăng ký tư vấn</a></li>
              </>
            )}
          </ul>
        ) : (
          // Menu dành cho Nhân viên
          <ul className="nav-links">
            <li><a href="#" onClick={() => { setCheDoNhanVien(false); chuyenTrang('guest_home'); }}>Trang chủ Guest</a></li>
            <li><a href="#">Dashboard</a></li>
            <li className={trangHienTai === 'search_vacancy' ? 'active' : ''}>
              <a href="#" onClick={() => { setCheDoNhanVien(true); chuyenTrang('search_vacancy'); }}>Phòng/Giường</a>
            </li>
            <li className={trangHienTai === 'staff_reception' ? 'active' : ''}>
              <a href="#" onClick={() => { setCheDoNhanVien(true); chuyenTrang('staff_reception'); }}>Khách hàng</a>
            </li>
            <li><a href="#">Hợp đồng</a></li>
            <li><a href="#">Thanh toán</a></li>
          </ul>
        )}

        <div className="nav-actions">
          {cheDoNhanVien === false ? (
            <button className="submit-btn" style={{ height: '40px', width: 'auto', padding: '0 20px', fontSize: '13px' }} onClick={() => { setCheDoNhanVien(true); chuyenTrang('staff_reception'); }}>
              Dành cho Nhân viên
            </button>
          ) : (
            <div className="user-profile">
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&width=100&auto=format&fit=crop" alt="Staff avatar" className="avatar" />
              <button className="logout-btn" onClick={() => { setCheDoNhanVien(false); chuyenTrang('guest_home'); }}>Đăng xuất</button>
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

          {/* HERO SECTION */}
          <section className="hero-section">
            <div className="hero-content">
              <h1>Hệ thống HomeStay Dorm cao cấp</h1>
              <p>Giải pháp lưu trú hoàn hảo, hiện đại, an toàn và đầy đủ tiện nghi hàng đầu tại TP. Hồ Chí Minh dành cho học sinh, sinh viên và người đi làm.</p>
              <div className="hero-buttons">
                <a href="#consult" className="hero-btn primary-btn">Đăng ký tư vấn ngay</a>
                <button className="hero-btn secondary-btn" onClick={() => { setCheDoNhanVien(false); chuyenTrang('search_vacancy'); }}>Tra cứu phòng trống</button>
              </div>
            </div>
          </section>

          {/* STATISTICS SECTION */}
          <section className="stats-section">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{dangTaiStats ? '...' : thongKeTongHop.soKhachHang}</div>
                <div className="stat-label">Khách hàng tin tưởng</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{dangTaiStats ? '...' : thongKeTongHop.soPhongDangThue}</div>
                <div className="stat-label">Phòng/Giường đang thuê</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{dangTaiStats ? '...' : thongKeTongHop.soPhongConTrong}</div>
                <div className="stat-label">Phòng/Giường trống sẵn sàng</div>
              </div>
            </div>
          </section>

          {/* TIỆN ÍCH NỔI BẬT (UTILITIES) */}
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
      {trangHienTai === 'search_vacancy' && (
        <div className="vacancy-search-page">
          
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
                    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
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
                {danhSachTatCaPhongTrong.map((item) => (
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
                        <button type="button" className="btn-book-filled" onClick={() => setHenXemPhongModal(item)}>
                          Chọn để hẹn
                        </button>
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

            {/* Pagination Mockup */}
            {danhSachTatCaPhongTrong.length > 0 && (
              <nav className="pagination-nav" aria-label="Pagination">
                <button className="pag-btn">&lt;</button>
                <button className="pag-btn active">1</button>
                <button className="pag-btn">2</button>
                <button className="pag-btn">3</button>
                <span className="pag-dots">...</span>
                <button className="pag-btn">8</button>
                <button className="pag-btn">&gt;</button>
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
            <button type="button" className="btn-back-link" onClick={() => chuyenTrang('search_vacancy')}>
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
                  Chọn phòng này ➔
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
                  <strong className="cell-value">{formKhachHang.hoTen || 'Lê Thị Minh Anh'}</strong>
                </div>
                <div className="guest-info-cell">
                  <span className="cell-label">Số điện thoại</span>
                  <strong className="cell-value">{formKhachHang.sdt || '090 1234 567'}</strong>
                </div>
                <div className="guest-info-cell" style={{ gridColumn: 'span 2' }}>
                  <span className="cell-label">Email</span>
                  <strong className="cell-value">{formKhachHang.email || 'minhanh.le@example.com'}</strong>
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
                        Phòng {room.maId || room.maPhong} - {room.kieu === 'Phong' ? 'Toàn phòng' : `Giường ${room.maId % 2 === 0 ? 'A' : 'B'}`}
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
          <nav className="breadcrumbs" aria-label="breadcrumb">
            <span style={{ cursor: 'pointer' }} onClick={() => chuyenTrang('guest_home')}>Trang chủ</span>
            <span className="separator">&gt;</span>
            <span className="current">Tiếp nhận thông tin</span>
          </nav>

          <h1 className="page-title">Tiếp nhận thông tin &amp; yêu cầu thuê</h1>
          <p className="page-subtitle">Vui lòng nhập chính xác thông tin để tìm kiếm phòng phù hợp nhất cho khách hàng.</p>

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
                    <label htmlFor="cccd">Số CCCD</label>
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
