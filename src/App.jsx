import { useState, useEffect } from 'react';

export default function App() {
  // Thống kê phòng trống bên phải
  const [thongKe, setThongKe] = useState({
    dormNuQ1: 0,
    phongDonBT: 0,
    dormNamQ3: 0
  });

  // Thông tin khách hàng
  const [khachHang, setKhachHang] = useState({
    cccd: '',
    hoTen: '',
    ngaySinh: '',
    gioiTinh: 'Nam',
    quocTich: 'Việt Nam',
    sdt: '',
    email: '',
    khaNangTaiChinh: ''
  });

  // Yêu cầu thuê
  const [yeuCauThue, setYeuCauThue] = useState({
    loaiPhong: 'Giường ghép', // 'Nguyên phòng' hoặc 'Giường ghép'
    khuVucMongMuon: 'Quận 1, Quận Bình Thạnh',
    mucGiaTu: '',
    mucGiaDen: '',
    soNguoi: 1,
    gioiTinh: 'Tất cả',
    thoiGianVao: new Date().toISOString().split('T')[0], // Mặc định ngày hôm nay
    thoiHanThue: '6' // Số tháng (dưới dạng chuỗi)
  });

  // Tiêu chí ưu tiên (danh sách checkboxes)
  const [tieuChiUuTien, setTieuChiUuTien] = useState({
    yenTinh: false,
    guiXe: false,
    dieuHoa: false,
    wifiRieng: false,
    gioGiacTuDo: false
  });

  // Danh sách phòng tìm kiếm được
  const [danhSachPhong, setDanhSachPhong] = useState([]);
  const [daTraCuu, setDaTraCuu] = useState(false);
  
  // Trạng thái loading
  const [dangTaiThongKe, setDangTaiThongKe] = useState(false);
  const [dangXuLy, setDangXuLy] = useState(false);
  
  // Thông báo (Toast)
  const [thongBao, setThongBao] = useState(null);

  // 1. Tải dữ liệu thống kê khi trang load
  const taiThongKePhongTrong = async () => {
    setDangTaiThongKe(true);
    try {
      const response = await fetch('/api/thong-ke-phong');
      const resData = await response.json();
      if (resData.ok) {
        setThongKe(resData.data);
      } else {
        console.error('Lỗi khi tải thống kê:', resData.error);
      }
    } catch (err) {
      console.error('Không thể kết nối API thống kê:', err);
    } finally {
      setDangTaiThongKe(false);
    }
  };

  useEffect(() => {
    taiThongKePhongTrong();
  }, []);

  // 2. Hàm hiển thị Toast thông báo
  const hienThongBao = (kieu, tinNhan) => {
    setThongBao({ kieu, tinNhan });
    setTimeout(() => {
      setThongBao(null);
    }, 4000);
  };

  // 3. Hàm xử lý thay đổi form khách hàng
  const xuLyThayDoiKhachHang = (e) => {
    const { name, value } = e.target;
    setKhachHang(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 4. Hàm xử lý thay đổi form yêu cầu thuê
  const xuLyThayDoiYeuCau = (e) => {
    const { name, value } = e.target;
    setYeuCauThue(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 5. Hàm xử lý click chọn hình thức thuê
  const xuLyChonLoaiPhong = (loai) => {
    setYeuCauThue(prev => ({
      ...prev,
      loaiPhong: loai
    }));
  };

  // 6. Hàm xử lý thay đổi checkbox tiêu chí ưu tiên
  const xuLyThayDoiTieuChi = (name) => {
    setTieuChiUuTien(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  // 7. Chuyển đổi checkbox sang mảng text tiếng Việt để gửi lên server
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

  // 8. Hàm gửi yêu cầu tiếp nhận & tra cứu
  const xuLyGuiYeuCau = async (e) => {
    e.preventDefault();
    
    // Kiểm tra CCCD hợp lệ (số)
    if (!/^\d+$/.test(khachHang.cccd) || khachHang.cccd.length < 9 || khachHang.cccd.length > 12) {
      hienThongBao('error', 'Số CCCD không hợp lệ! Vui lòng nhập từ 9-12 chữ số.');
      return;
    }

    if (!khachHang.hoTen.trim()) {
      hienThongBao('error', 'Vui lòng nhập Họ và tên khách hàng.');
      return;
    }

    if (!khachHang.sdt.trim()) {
      hienThongBao('error', 'Vui lòng nhập Số điện thoại.');
      return;
    }

    setDangXuLy(true);
    const danhSachTieuChi = layDanhSachTieuChiChuoi();

    try {
      // BƯỚC A: Gọi API Tiếp nhận thông tin (Lưu vào KhachHang và YeuCauThue)
      const resTiepNhan = await fetch('/api/tiep-nhan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          khachHang,
          yeuCauThue: {
            ...yeuCauThue,
            yeuCauList: danhSachTieuChi
          },
          maNV: 101 // Nhân viên đang đăng nhập mặc định
        })
      });

      const dataTiepNhan = await resTiepNhan.json();
      if (!resTiepNhan.ok) {
        throw new Error(dataTiepNhan.error || 'Lỗi lưu thông tin tiếp nhận');
      }

      // BƯỚC B: Gọi API Tra cứu phòng phù hợp
      const resTraCuu = await fetch('/api/tra-cuu-phong', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loaiPhong: yeuCauThue.loaiPhong,
          khuVucMongMuon: yeuCauThue.khuVucMongMuon,
          mucGiaTu: yeuCauThue.mucGiaTu,
          mucGiaDen: yeuCauThue.mucGiaDen,
          soNguoi: yeuCauThue.soNguoi,
          gioiTinh: yeuCauThue.gioiTinh,
          yeuCauList: danhSachTieuChi
        })
      });

      const dataTraCuu = await resTraCuu.json();
      if (!resTraCuu.ok) {
        throw new Error(dataTraCuu.error || 'Lỗi tra cứu phòng phù hợp');
      }

      setDanhSachPhong(dataTraCuu.data || []);
      setDaTraCuu(true);
      hienThongBao('success', 'Tiếp nhận thông tin khách hàng và truy vấn phòng trống thành công!');
      
      // Reload stats để cập nhật nếu có thay đổi
      taiThongKePhongTrong();

    } catch (err) {
      hienThongBao('error', `Lỗi hệ thống: ${err.message}`);
    } finally {
      setDangXuLy(false);
    }
  };

  // 9. Hàm đặt phòng mẫu khi nhấn nút Đặt phòng ở danh sách kết quả
  const xuLyDatPhong = (item) => {
    hienThongBao('success', `Đã ghi nhận yêu cầu đặt chỗ cho ${item.ten} thành công!`);
  };

  return (
    <div className="app-shell">
      {/* Navigation bar */}
      <nav className="navbar">
        <a href="#" className="logo">
          HomeStay Dorm
        </a>
        <ul className="nav-links">
          <li><a href="#">Dashboard</a></li>
          <li><a href="#">Phòng/Giường</a></li>
          <li className="active"><a href="#">Khách hàng</a></li>
          <li><a href="#">Hợp đồng</a></li>
          <li><a href="#">Thanh toán</a></li>
          <li><a href="#">Thông báo</a></li>
        </ul>
        <div className="nav-actions">
          <button className="notification-btn" aria-label="Thông báo">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z"/>
            </svg>
          </button>
          <div className="user-profile">
            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&width=100&auto=format&fit=crop" alt="User avatar" className="avatar" />
            <button className="logout-btn">Đăng xuất</button>
          </div>
        </div>
      </nav>

      {/* Main app container */}
      <main className="app-container">
        {/* Breadcrumbs */}
        <nav className="breadcrumbs" aria-label="breadcrumb">
          <span>Sale</span>
          <span className="separator">&gt;</span>
          <span className="current">Tiếp nhận thông tin</span>
        </nav>

        {/* Title */}
        <h1 className="page-title">Tiếp nhận thông tin &amp; yêu cầu thuê</h1>
        <p className="page-subtitle">Vui lòng nhập chính xác thông tin để tìm kiếm phòng phù hợp nhất.</p>

        {/* Form + Sidebar Grid */}
        <div className="content-grid">
          {/* Form tiếp nhận thông tin (Cột Trái) */}
          <form className="form-card" onSubmit={xuLyGuiYeuCau}>
            
            {/* PHẦN 1: THÔNG TIN KHÁCH HÀNG */}
            <section className="form-section">
              <div className="section-header">
                <span className="section-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
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
                    value={khachHang.hoTen}
                    onChange={xuLyThayDoiKhachHang}
                    required
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="cccd">Số CCCD</label>
                  <input
                    type="text"
                    id="cccd"
                    name="cccd"
                    placeholder="12 chữ số"
                    value={khachHang.cccd}
                    onChange={xuLyThayDoiKhachHang}
                    required
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
                    value={khachHang.sdt}
                    onChange={xuLyThayDoiKhachHang}
                    required
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="example@gmail.com"
                    value={khachHang.email}
                    onChange={xuLyThayDoiKhachHang}
                    required
                  />
                </div>
              </div>

              <div className="input-grid-2">
                <div className="input-group">
                  <label htmlFor="quocTich">Quốc tịch</label>
                  <select
                    id="quocTich"
                    name="quocTich"
                    value={khachHang.quocTich}
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
                    value={khachHang.ngaySinh}
                    onChange={xuLyThayDoiKhachHang}
                    required
                  />
                </div>
              </div>
            </section>

            <div className="divider"></div>

            {/* PHẦN 2: YÊU CẦU THUÊ */}
            <section className="form-section">
              <div className="section-header">
                <span className="section-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8.354 1.146a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 2 8h2v7a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1V9h2v6a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1V8h2a.5.5 0 0 0 .354-.854l-6-6z"/>
                  </svg>
                </span>
                <h2>Yêu cầu thuê</h2>
              </div>

              {/* Hình thức thuê (Toggle buttons) */}
              <div className="rental-type-container">
                <span className="rental-type-label">Hình thức thuê</span>
                <div className="toggle-group">
                  <button
                    type="button"
                    className={`toggle-btn ${yeuCauThue.loaiPhong === 'Nguyên phòng' ? 'active' : ''}`}
                    onClick={() => xuLyChonLoaiPhong('Nguyên phòng')}
                  >
                    <svg viewBox="0 0 24 24">
                      <path d="M12 3L2 12h3v8h14v-8h3L12 3zm0 4.5l5.5 5.5H16v6H8v-6H6.5L12 7.5z"/>
                    </svg>
                    Thuê nguyên phòng
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn ${yeuCauThue.loaiPhong === 'Giường ghép' ? 'active' : ''}`}
                    onClick={() => xuLyChonLoaiPhong('Giường ghép')}
                  >
                    <svg viewBox="0 0 24 24">
                      <path d="M2 10V5h2v5h16V5h2v15h-2v-3H4v3H2v-5H1v-2h1zm3-3h14v7H5V7zm3 2v3h8V9H8z"/>
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
                    value={yeuCauThue.khuVucMongMuon}
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
                      value={yeuCauThue.mucGiaTu}
                      onChange={xuLyThayDoiYeuCau}
                    />
                    <span>—</span>
                    <input
                      type="number"
                      name="mucGiaDen"
                      placeholder="Đến"
                      value={yeuCauThue.mucGiaDen}
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
                    value={yeuCauThue.soNguoi}
                    onChange={xuLyThayDoiYeuCau}
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="gioiTinh">Giới tính</label>
                  <select
                    id="gioiTinh"
                    name="gioiTinh"
                    value={yeuCauThue.gioiTinh}
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
                    value={yeuCauThue.thoiGianVao}
                    onChange={xuLyThayDoiYeuCau}
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="thoiHanThue">Thời hạn thuê</label>
                  <select
                    id="thoiHanThue"
                    name="thoiHanThue"
                    value={yeuCauThue.thoiHanThue}
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

            {/* PHẦN 3: TIÊU CHÍ ƯU TIÊN */}
            <section className="form-section">
              <div className="section-header">
                <span className="section-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M11.5 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L11 2.707V14.5a.5.5 0 0 0 .5.5zm-7-14a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L4 13.293V1.5a.5.5 0 0 1 .5-.5z"/>
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
                <path fillRule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"/>
              </svg>
            </button>

          </form>

          {/* Panel Thông tin & Thống kê (Cột Phải) */}
          <aside className="sidebar">
            
            {/* GỢI Ý NHANH CARD */}
            <article className="sidebar-card suggestion-card">
              <h3 className="suggestion-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                  <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217c-.004.133.1.232.23.232h.8c.123 0 .224-.092.238-.214l.003-.122c.038-.667.447-1.042 1.11-1.517.653-.466 1.258-1.077 1.258-2.184 0-1.578-1.377-2.302-2.794-2.302-1.496 0-2.738.755-2.88 2.302zM8 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
                </svg>
                Gợi ý nhanh
              </h3>
              <p className="suggestion-text">
                Dựa trên dữ liệu hệ thống, các khu vực Quận 1 và Bình Thạnh đang có tỷ lệ lấp đầy rất cao (95%). Hãy đặt phòng sớm để giữ chỗ.
              </p>
              <button className="market-report-link" onClick={() => hienThongBao('success', 'Đang mở Báo cáo thị trường...')}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M0 0h16v16H0V0zm1 1v14h14V1h-14zm1.5 5.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5zm4.5 0a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm-4.5 4a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5zm4.5 0a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z"/>
                </svg>
                Xem báo cáo thị trường
              </button>
            </article>

            {/* PHÒNG TRỐNG KHẢ DỤNG CARD */}
            <section className="sidebar-card stats-card">
              <h3>Phòng trống khả dụng</h3>
              <div className="stats-list">
                
                <div className="stats-item">
                  <div className="stats-item-left">
                    <span className="status-dot green"></span>
                    <span>Dorm Nữ - Quận 1</span>
                  </div>
                  <span className="stats-count">{dangTaiThongKe ? '...' : String(thongKe.dormNuQ1).padStart(2, '0')}</span>
                </div>

                <div className="stats-item">
                  <div className="stats-item-left">
                    <span className="status-dot green"></span>
                    <span>Phòng đơn - Bình Thạnh</span>
                  </div>
                  <span className="stats-count">{dangTaiThongKe ? '...' : String(thongKe.phongDonBT).padStart(2, '0')}</span>
                </div>

                <div className="stats-item">
                  <div className="stats-item-left">
                    <span className="status-dot yellow"></span>
                    <span>Dorm Nam - Quận 3</span>
                  </div>
                  <span className="stats-count">{dangTaiThongKe ? '...' : String(thongKe.dormNamQ3).padStart(2, '0')}</span>
                </div>

              </div>
            </section>

            {/* HÌNH ẢNH MINH HỌA */}
            <div className="sidebar-img-container">
              <img src="/dorm_room.png" alt="Không gian phòng ngủ Dorm hiện đại gỗ ấm áp" className="sidebar-img" />
            </div>

          </aside>

          {/* KẾT QUẢ TRA CỨU PHÒNG TRỐNG PHÙ HỢP */}
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
                      
                      <div className="room-branch">
                        {item.chiNhanh} • {item.diaChi}
                      </div>

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
                            )) : <span className="room-util-tag" style={{ background: '#fef2f2', color: '#991b1b' }}>Cơ bản</span>}
                          </div>
                        </div>
                      </div>

                      <div className="room-price-row">
                        <span className="room-price-label">Giá thuê</span>
                        <span className="room-price-val">{Number(item.giaThue).toLocaleString('vi-VN')} đ/tháng</span>
                      </div>

                      <button className="book-btn" onClick={() => xuLyDatPhong(item)}>
                        Đặt phòng ngay
                      </button>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="no-results">
                  <p>Không có phòng trống nào khớp hoàn toàn với yêu cầu hiện tại.</p>
                  <p style={{ fontSize: '13px', marginTop: '6px' }}>Vui lòng thay đổi khoảng giá, khu vực hoặc giảm bớt các tiêu chí ưu tiên và thử lại.</p>
                </div>
              )}
            </section>
          )}
        </div>
      </main>

      {/* Toast Alert Popup */}
      {thongBao && (
        <div className={`toast ${thongBao.kieu}`}>
          {thongBao.kieu === 'success' ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="#10b981" viewBox="0 0 16 16">
              <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="#ef4444" viewBox="0 0 16 16">
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
              <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
            </svg>
          )}
          <span>{thongBao.tinNhan}</span>
        </div>
      )}
    </div>
  );
}
