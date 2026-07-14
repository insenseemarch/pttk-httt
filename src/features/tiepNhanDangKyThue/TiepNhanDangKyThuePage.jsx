import { layDanhSachTienIchHienThi } from '../../utils/tienIchPhong';

export default function TiepNhanDangKyThuePage({
  trangHienTai,
  chuyenTrang,
  xuLyGuiYeuCauNhanVien,
  xuLyLuuThongTinDangKyThue,
  formKhachHang,
  xuLyThayDoiKhachHang,
  formYeuCauThue,
  xuLyChonLoaiPhong,
  xuLyThayDoiYeuCau,
  tieuChiUuTien,
  xuLyThayDoiTieuChi,
  dangXuLy,
  hienThongBao,
  thongKePhongTrong,
  daTraCuu,
  danhSachPhong,
  xuLyDatPhong,
  moChiTietPhong,
  tuyChonTraCuuPhong = { khuVuc: [], tienIch: [] },
}) {
  const khuVucOptions = Array.isArray(tuyChonTraCuuPhong.khuVuc) ? tuyChonTraCuuPhong.khuVuc : [];
  const tieuChiFallback = [
    { value: 'Yên tĩnh', label: 'Yên tĩnh', icon: 'volume_mute' },
    { value: 'Gửi xe', label: 'Gửi xe', icon: 'local_parking' },
    { value: 'Điều hòa', label: 'Điều hòa', icon: 'ac_unit' },
    { value: 'Wifi', label: 'Wifi', icon: 'wifi' },
  ];
  const tieuChiOptions = (Array.isArray(tuyChonTraCuuPhong.tienIch) && tuyChonTraCuuPhong.tienIch.length > 0
    ? tuyChonTraCuuPhong.tienIch
    : tieuChiFallback
  ).reduce((danhSach, option) => {
    const hienThi = layDanhSachTienIchHienThi(option.value || option.label || '', 1)[0];
    const key = hienThi?.key || option.value || option.label;
    if (!key || danhSach.some((item) => item.key === key)) return danhSach;
    danhSach.push({
      key,
      value: hienThi?.label || option.value || option.label,
      label: hienThi?.label || option.label || option.value,
      icon: hienThi?.icon || option.icon || 'check_circle',
    });
    return danhSach;
  }, []);

  return (
    <>
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
                    <label htmlFor="gioiTinhKhachHang">Giới tính khách hàng</label>
                    <select
                      id="gioiTinhKhachHang"
                      name="gioiTinh"
                      value={formKhachHang.gioiTinh}
                      onChange={xuLyThayDoiKhachHang}
                      required
                    >
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác</option>
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
                      required
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label htmlFor="diaChi">Địa chỉ cá nhân</label>
                  <input
                    type="text"
                    id="diaChi"
                    name="diaChi"
                    placeholder="Ví dụ: 12 Lê Lợi, Quận 1, TP.HCM"
                    value={formKhachHang.diaChi}
                    onChange={xuLyThayDoiKhachHang}
                  />
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
                    <select
                      id="khuVucMongMuon"
                      name="khuVucMongMuon"
                      value={formYeuCauThue.khuVucMongMuon}
                      onChange={xuLyThayDoiYeuCau}
                    >
                      <option value="Tất cả">Tất cả chi nhánh</option>
                      {khuVucOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
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

                <div className="input-grid-2">
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
                  {tieuChiOptions.map((tieuChi, index) => {
                    const inputId = `cb-tieuchi-${index}`;
                    return (
                      <div className="checkbox-item" key={tieuChi.key}>
                        <input
                          type="checkbox"
                          id={inputId}
                          checked={Boolean(tieuChiUuTien[tieuChi.value])}
                          onChange={() => xuLyThayDoiTieuChi(tieuChi.value)}
                        />
                        <label htmlFor={inputId} className="checkbox-label">
                          <span className="custom-checkbox-dot"></span>
                          <span className="material-symbols-outlined util-icon">{tieuChi.icon}</span>
                          {tieuChi.label}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </section>

              <div className="deposit-action-bar" style={{ marginTop: '20px' }}>
                <button type="submit" className="submit-btn btn-submit-wide" disabled={dangXuLy}>
                  {dangXuLy ? 'Đang xử lý...' : 'Tra cứu phòng phù hợp'}
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path fillRule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z" />
                  </svg>
                </button>
              </div>

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

            {false && daTraCuu && (
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
                              {layDanhSachTienIchHienThi(item.tienIch, 3).length > 0 ? (
                                layDanhSachTienIchHienThi(item.tienIch, 3).map((u) => (
                                  <span key={u.key} className="room-util-tag">
                                    <span className="material-symbols-outlined util-icon">{u.icon}</span>
                                    {u.label}
                                  </span>
                                ))
                              ) : <span className="room-util-tag">Cơ bản</span>}
                            </div>
                          </div>
                        </div>
                        <div className="room-price-row">
                          <span className="room-price-label">Giá thuê</span>
                          <span className="room-price-val">{Number(item.giaThue).toLocaleString('vi-VN')} đ/tháng</span>
                        </div>
                        <div className="room-card-actions">
                          <button type="button" className="btn-detail-outline" onClick={() => moChiTietPhong(item, 'staff_reception')}>Xem chi tiết</button>
                          {item.kieu === 'Phong' && (
                            <button type="button" className="book-btn" onClick={() => xuLyDatPhong(item)}>Đặt lịch hẹn ngay</button>
                          )}
                        </div>
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
    </>
  );
}
