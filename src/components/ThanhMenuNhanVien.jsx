import { Link, useLocation } from 'react-router-dom';
import { MENU_NHAN_VIEN, ROUTES } from '../config/routes';

export default function ThanhMenuNhanVien({ nguoiDung, dangXuat, themMenu }) {
  const location = useLocation();

  const rawRole = (nguoiDung?.vaiTro || '').toLowerCase();
  
  let menu = [];
  if (rawRole.includes('kế toán') || rawRole.includes('ke toan') || rawRole === 'ketoan') {
    menu = [
      { key: 'dashboard', label: 'Tổng quan', path: ROUTES.dashboard },
      { key: 'phongGiuong', label: 'Phòng', path: ROUTES.phongGiuong },
      { key: 'hopDong', label: 'Hợp đồng', path: ROUTES.hopDong },
      { key: 'thuChi', label: 'Thu chi', path: ROUTES.thuChi },
      { key: 'thongBao', label: 'Báo cáo', path: ROUTES.thongBao }
    ];
  } else if (
    rawRole.includes('sale')
    || rawRole.includes('kinh doanh')
    || rawRole.includes('nhân viên sale')
  ) {
    menu = [
      { key: 'dashboard', label: 'Dashboard', path: ROUTES.dashboard },
      { key: 'nhanPhong', label: 'Nhận phòng', path: ROUTES.nhanPhong },
      { key: 'phongGiuong', label: 'Phòng/Giường', path: ROUTES.phongGiuong },
      { key: 'khachHang', label: 'Khách hàng', path: ROUTES.khachHang },
      { key: 'hopDong', label: 'Hợp đồng', path: ROUTES.hopDong },
      { key: 'thongBao', label: 'Thông báo', path: ROUTES.thongBao },
    ];
  } else if (
    rawRole.includes('quản lý')
    || rawRole.includes('quan ly')
    || rawRole === 'quanly'
    || rawRole.includes('manager')
  ) {
    menu = [
      { key: 'dashboard', label: 'Dashboard', path: ROUTES.dashboard },
      { key: 'kiemTraLuuTru', label: 'Kiểm tra ĐK lưu trú', path: ROUTES.kiemTraLuuTru },
      { key: 'phongGiuong', label: 'Phòng/Giường', path: ROUTES.phongGiuong },
      { key: 'khachHang', label: 'Khách hàng', path: ROUTES.khachHang },
      { key: 'hopDong', label: 'Hợp đồng', path: ROUTES.hopDong },
      { key: 'thongBao', label: 'Thông báo', path: ROUTES.thongBao },
    ];
  } else {
    menu = [...MENU_NHAN_VIEN];
  }

  if (themMenu) menu.push(...themMenu);

  const laActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <nav className="navbar">
      <div className="logo-container" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Link to={ROUTES.dashboard} className="logo">
          HomeStay
        </Link>
      </div>

      <ul className="nav-links">
        {menu.map((item) => (
          <li key={item.key} className={laActive(item.path) ? 'active' : ''}>
            <Link to={item.path}>{item.label}</Link>
          </li>
        ))}
        {rawRole.includes('admin') && (
          <li className={laActive(ROUTES.quanLyTaiKhoan) ? 'active' : ''}>
            <Link to={ROUTES.quanLyTaiKhoan}>Tài khoản</Link>
          </li>
        )}
      </ul>

      <div className="nav-actions">
        <Link to={ROUTES.thongBao} className="notification-btn" title="Thông báo">
          <span className="material-symbols-outlined">notifications</span>
        </Link>
        <div className="user-profile">
          <div className="qt-user-text">
            <span className="qt-user-name">{nguoiDung?.hoTen || 'Nhân viên'}</span>
            <span className="qt-user-role">{nguoiDung?.vaiTro || 'Staff'}</span>
          </div>
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop"
            alt="Staff avatar"
            className="avatar"
          />
          <button type="button" className="logout-btn" onClick={dangXuat}>
            Đăng xuất
          </button>
        </div>
      </div>
    </nav>
  );
}
