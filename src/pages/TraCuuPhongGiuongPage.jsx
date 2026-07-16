import { useEffect, useState } from 'react';
import { layDanhSachTienIchHienThi } from '../utils/tienIchPhong';
import { dinhDangTienInput } from '../utils/soTien';

export default function TraCuuPhongGiuongPage({
  trangHienTai,
  cheDoNhanVien,
  vaiTroNhanVien,
  guiYeuCauTimKiemVacant,
  boLocTraCuu,
  tuyChonTraCuuPhong = { khuVuc: [], tienIch: [] },
  xuLyThayDoiBoLoc,
  xuLyToggleTienIchTraCuu,
  xuLyLuuTienIchTraCuu,
  dangTaiPhongTrong,
  danhSachTatCaPhongTrong,
  trangTraCuuHienTai,
  SO_LUONG_MOI_TRANG,
  setTrangTraCuuHienTai,
  setPhongDaChon,
  setTrangHienTai,
  layAnhMinhHoaPhong,
  setHenXemPhongModal,
  chuyenTrang,
  chiTietPhongModal,
  setChiTietPhongModal,
  henXemPhongModal,
  guiYeuCauDatLichHen,
  formHenXem,
  xuLyThayDoiHenXem,
  dangXuLy,
  xuLyDatPhong,
  moChiTietPhong,
  nguonTraCuuPhong = 'tab',
  diDenDatLichHenTuTraCuu,
  quayLaiTiepNhanTuTraCuu,
}) {
  const dangTraCuuTuTiepNhan = cheDoNhanVien && nguonTraCuuPhong === 'tiep-nhan';
  const dangChonPhongChoLichHen = cheDoNhanVien && nguonTraCuuPhong === 'chon-lich-hen';
  const dangTraCuuDeDatLich = dangTraCuuTuTiepNhan || dangChonPhongChoLichHen;
  const choPhepHenCongKhai = !cheDoNhanVien;
  const danhSachTienIchDaChon = Array.isArray(boLocTraCuu.yeuCauList) && boLocTraCuu.yeuCauList.length
    ? boLocTraCuu.yeuCauList
    : (boLocTraCuu.tienIch && boLocTraCuu.tienIch !== 'Tất cả' ? [boLocTraCuu.tienIch] : []);
  const nhanTienIchDaChon = danhSachTienIchDaChon.length
    ? `Đã chọn ${danhSachTienIchDaChon.length} tiện ích`
    : 'Tất cả tiện ích';
  const [moModalTienIch, setMoModalTienIch] = useState(false);
  const [draftTienIch, setDraftTienIch] = useState([]);
  const danhSachTienIchOption = Array.isArray(tuyChonTraCuuPhong.tienIch) ? tuyChonTraCuuPhong.tienIch : [];
  const danhSachTienIchModal = [
    ...danhSachTienIchOption,
    ...danhSachTienIchDaChon
      .filter((value) => !danhSachTienIchOption.some((option) => option.value === value))
      .map((value) => ({ value, label: value })),
  ];
  const layGioiTinhCuThe = (value) => {
    const raw = String(value || '').trim();
    const lower = raw.toLowerCase();
    if (lower === 'nam') return 'Nam';
    if (lower === 'nữ' || lower === 'nu') return 'Nữ';
    return '';
  };
  const layNhanKieuCho = (item) => {
    const gioiTinh = layGioiTinhCuThe(item?.gioiTinh);
    if (item?.kieu === 'Phong') return gioiTinh ? `Nguyên căn (${gioiTinh})` : 'Nguyên căn';
    return gioiTinh ? `Ghép (${gioiTinh})` : 'Ghép';
  };
  const layNhanSucChuaGioiTinh = (item) => {
    const gioiTinh = layGioiTinhCuThe(item?.gioiTinh);
    if (item?.kieu === 'Phong') return `${item.sucChua} Người${gioiTinh ? ` (${gioiTinh})` : ''}`;
    return `1 Giường${gioiTinh ? ` (${gioiTinh})` : ''}`;
  };
  const layNhanGioiTinhYeuCau = (value) => layGioiTinhCuThe(value) || 'Tất cả';

  useEffect(() => {
    if (moModalTienIch) {
      setDraftTienIch([...danhSachTienIchDaChon]);
    }
  }, [moModalTienIch, danhSachTienIchDaChon.join('|')]);

  const toggleDraftTienIch = (value) => {
    setDraftTienIch((prev) => (
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    ));
  };

  const luuLuaChonTienIch = () => {
    if (xuLyLuuTienIchTraCuu) {
      xuLyLuuTienIchTraCuu(draftTienIch);
    } else {
      draftTienIch.forEach((value) => {
        if (!danhSachTienIchDaChon.includes(value)) xuLyToggleTienIchTraCuu?.(value);
      });
      danhSachTienIchDaChon.forEach((value) => {
        if (!draftTienIch.includes(value)) xuLyToggleTienIchTraCuu?.(value);
      });
    }
    setMoModalTienIch(false);
  };

  const ActionTraCuuTuTiepNhan = ({ viTri = 'top' }) => {
    if (!dangTraCuuDeDatLich) return null;
    return (
      <div className={`search-context-actions search-context-actions-${viTri}`}>
        {dangTraCuuTuTiepNhan && (
        <button type="button" className="btn-detail-outline" onClick={quayLaiTiepNhanTuTraCuu}>
          Quay lại tiếp nhận đăng ký thuê
        </button>
        )}
        <button type="button" className="btn-book-filled" onClick={diDenDatLichHenTuTraCuu}>
          Đi đến đặt lịch hẹn
        </button>
      </div>
    );
  };

  return (
    <>
      {trangHienTai === 'search_vacancy' && (
        <div className="vacancy-search-page fade-in-up">

          {cheDoNhanVien && (
            <div className="staff-room-page-header">
              <div>
                <p className="payment-breadcrumb">Phòng/Giường &nbsp;&gt;&nbsp; <span>Tra cứu phòng/giường</span></p>
              </div>
            </div>
          )}

          {/* Cover Hero + Filters Container */}
          <header className="vacancy-hero" style={{ backgroundImage: `url('/hero_cover.png')` }}>
            <div className="vacancy-hero-overlay"></div>
            <div className="vacancy-hero-container">

              <div className="vacancy-hero-left">
                <span className="hero-tagline">{cheDoNhanVien ? 'Tra cứu nội bộ' : 'Buy, Rent, & Sell Property'}</span>
                <h2>{cheDoNhanVien ? 'Tra cứu phòng/giường' : 'Homestay Dorm'}</h2>
                <p>{cheDoNhanVien ? 'Lọc phòng và giường còn trống để tư vấn cho khách hoặc phục vụ quản lý vận hành.' : 'Giải pháp quản lý và tìm kiếm nơi lưu trú hiện đại, tiện nghi bậc nhất cho thế hệ trẻ năng động.'}</p>
              </div>

              <form className="search-filters-card" onSubmit={guiYeuCauTimKiemVacant}>
                <h3>{cheDoNhanVien ? 'Bộ lọc tra cứu' : 'Find your Best Property'} <span>{cheDoNhanVien ? 'phòng/giường khả dụng' : 'what do you want!'}</span></h3>

                <div className="filters-grid">

                  <div className="filter-group">
                    <label htmlFor="filter-khuVuc">Khu vực</label>
                    <select id="filter-khuVuc" name="khuVuc" value={boLocTraCuu.khuVuc} onChange={xuLyThayDoiBoLoc}>
                      <option value="Tất cả">Tất cả chi nhánh</option>
                      {tuyChonTraCuuPhong.khuVuc.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="filter-group">
                    <label htmlFor="filter-loaiPhong">Loại phòng</label>
                    <select id="filter-loaiPhong" name="loaiPhong" value={boLocTraCuu.loaiPhong} onChange={xuLyThayDoiBoLoc}>
                      <option value="Tất cả">Tất cả loại phòng</option>
                      <option value="Phòng đơn">Nguyên phòng</option>
                      <option value="Giường dorm">Giường dorm (Ghép)</option>
                    </select>
                  </div>

                  <div className="filter-group">
                    <label htmlFor="filter-mucGiaTu">Giá từ (VNĐ)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      id="filter-mucGiaTu"
                      name="mucGiaTu"
                      placeholder="Ví dụ: 1.500.000"
                      value={dinhDangTienInput(boLocTraCuu.mucGiaTu)}
                      onChange={xuLyThayDoiBoLoc}
                    />
                  </div>

                  <div className="filter-group">
                    <label htmlFor="filter-mucGiaDen">Giá đến (VNĐ)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      id="filter-mucGiaDen"
                      name="mucGiaDen"
                      placeholder="Ví dụ: 3.000.000"
                      value={dinhDangTienInput(boLocTraCuu.mucGiaDen)}
                      onChange={xuLyThayDoiBoLoc}
                    />
                  </div>

                  <div className="filter-group">
                    <label htmlFor="filter-gioiTinh">Giới tính</label>
                    <select
                      id="filter-gioiTinh"
                      name="gioiTinh"
                      value={boLocTraCuu.gioiTinh}
                      onChange={xuLyThayDoiBoLoc}
                      disabled={dangTraCuuDeDatLich}
                      title={dangTraCuuDeDatLich ? 'Giới tính được lấy theo thông tin khách hàng' : undefined}
                    >
                      <option value="Tất cả">Tất cả giới tính</option>
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                    </select>
                    {dangTraCuuDeDatLich && (
                      <small className="input-helper-text">Theo giới tính khách hàng</small>
                    )}
                  </div>

                  <div className="filter-group">
                    <label htmlFor="filter-soNguoi">Sức chứa (Số người)</label>
                    <input type="number" id="filter-soNguoi" name="soNguoi" placeholder="Số người tối thiểu" value={boLocTraCuu.soNguoi} onChange={xuLyThayDoiBoLoc} />
                  </div>

                  <div className="filter-group amenity-filter-group">
                    <label>Tiện ích</label>
                    <div className="amenity-picker-summary">
                      <div className="amenity-picked-state">
                        <strong>{nhanTienIchDaChon}</strong>
                        <span>{danhSachTienIchDaChon.length ? danhSachTienIchDaChon.slice(0, 2).join(', ') : 'Mặc định không lọc theo tiện ích'}</span>
                      </div>
                      <button type="button" className="btn-amenity-edit" onClick={() => setMoModalTienIch(true)}>
                        Chỉnh sửa
                      </button>
                    </div>
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
            </div>

            {danhSachTatCaPhongTrong.length > 0 ? (
              <div className="vacancy-grid-layout">
                {danhSachTatCaPhongTrong.slice((trangTraCuuHienTai - 1) * SO_LUONG_MOI_TRANG, trangTraCuuHienTai * SO_LUONG_MOI_TRANG).map((item) => (
                  <article key={`${item.kieu}-${item.maId}`} className="vacancy-room-card">
                    <div className="vacancy-card-img-wrapper" onClick={() => moChiTietPhong(item, 'search_vacancy')} style={{ cursor: 'pointer' }}>
                      <img src={layAnhMinhHoaPhong(item)} alt={item.ten} className="vacancy-card-img" />
                      <div className="vacancy-card-badges">
                        <span className={`badge-type ${item.kieu === 'Phong' ? 'badge-phong-loai' : 'badge-giuong-loai'}`}>
                          {layNhanKieuCho(item)}
                        </span>
                        <span className="badge-status-empty">Trống</span>
                      </div>
                    </div>

                    <div className="vacancy-card-body">
                      <div className="vacancy-card-title-row">
                        <h4 className="vacancy-card-title" onClick={() => moChiTietPhong(item, 'search_vacancy')} style={{ cursor: 'pointer' }}>{item.ten}</h4>
                        <span className="vacancy-card-price">{Number(item.giaThue).toLocaleString('vi-VN')}đ<span>/tháng</span></span>
                      </div>

                      <div className="vacancy-card-address">
                        📍 {item.chiNhanh} • {item.diaChi}
                      </div>

                      <div className="vacancy-card-details">
                        <span>👤 {layNhanSucChuaGioiTinh(item)}</span>
                        <div className="card-utils-mini">
                          {layDanhSachTienIchHienThi(item.tienIch, 3).length > 0 ? (
                            layDanhSachTienIchHienThi(item.tienIch, 3).map((u) => (
                              <span key={u.key} className="mini-tag" title={u.label}>
                                <span className="material-symbols-outlined util-icon">{u.icon}</span>
                                {u.label}
                              </span>
                            ))
                          ) : <span className="mini-tag">Cơ bản</span>}
                        </div>
                      </div>

                      <div className="vacancy-card-actions">
                        <button type="button" className="btn-detail-outline" onClick={() => moChiTietPhong(item, 'search_vacancy')}>
                          Xem chi tiết
                        </button>
                        {choPhepHenCongKhai ? (
                          <button type="button" className="btn-book-filled" onClick={() => setHenXemPhongModal(item)}>
                            Chọn để hẹn
                          </button>
                        ) : null}
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

            <ActionTraCuuTuTiepNhan viTri="bottom" />

          </main>

          {/* Footer */}
          {!cheDoNhanVien && <footer className="footer-dark">
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
          </footer>}

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
                      <span>{chiTietPhongModal.kieu === 'Phong' ? 'Nguyên phòng' : 'Giường Dorm (Ở ghép)'}</span>
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
                      <span>{layNhanGioiTinhYeuCau(chiTietPhongModal.gioiTinh)}</span>
                    </div>
                    <div className="modal-detail-row" style={{ flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
                      <strong>Tiện ích đi kèm:</strong>
                      <div className="room-utils-container">
                        {layDanhSachTienIchHienThi(chiTietPhongModal.tienIch).length > 0 ? (
                          layDanhSachTienIchHienThi(chiTietPhongModal.tienIch).map((u) => (
                            <span key={u.key} className="room-util-tag">
                              <span className="material-symbols-outlined util-icon">{u.icon}</span>
                              {u.label}
                            </span>
                          ))
                        ) : <span className="room-util-tag">Cơ bản</span>}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-detail-outline" onClick={() => setChiTietPhongModal(null)}>Đóng</button>
                  {choPhepHenCongKhai && (
                    <button type="button" className="btn-book-filled" onClick={() => { setHenXemPhongModal(chiTietPhongModal); setChiTietPhongModal(null); }}>Hẹn xem phòng</button>
                  )}
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

          {moModalTienIch && (
            <div className="modal-backdrop" onClick={() => setMoModalTienIch(false)}>
              <div className="modal-content amenity-picker-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Chọn tiện ích ưu tiên</h3>
                  <button className="close-modal-btn" onClick={() => setMoModalTienIch(false)} aria-label="Đóng">×</button>
                </div>
                <div className="modal-body">
                  <div className="amenity-modal-summary">
                    <strong>{draftTienIch.length ? `Đang chọn ${draftTienIch.length} tiện ích` : 'Tất cả tiện ích'}</strong>
                    <button type="button" className="btn-clear-amenities" onClick={() => setDraftTienIch([])}>
                      Bỏ chọn tất cả
                    </button>
                  </div>
                  {danhSachTienIchModal.length > 0 ? (
                    <div className="amenity-modal-grid">
                      {danhSachTienIchModal.map((option) => (
                        <label key={option.value} className={`amenity-modal-option ${draftTienIch.includes(option.value) ? 'selected' : ''}`}>
                          <input
                            type="checkbox"
                            checked={draftTienIch.includes(option.value)}
                            onChange={() => toggleDraftTienIch(option.value)}
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="amenity-modal-empty">Chưa có tiện ích trong DB.</div>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-detail-outline" onClick={() => setMoModalTienIch(false)}>Hủy</button>
                  <button type="button" className="btn-book-filled" onClick={luuLuaChonTienIch}>Lưu tiện ích</button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ==========================================
          TRANG CHI TIẾT PHÒNG/GIƯỜNG (ROOM DETAILS)
          ========================================== */}
    </>
  );
}
