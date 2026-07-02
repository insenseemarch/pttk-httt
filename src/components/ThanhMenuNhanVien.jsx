import { Link, useLocation } from 'react-router-dom';
import { MENU_NHAN_VIEN, ROUTES } from '../config/routes';

export default function ThanhMenuNhanVien({ nguoiDung, dangXuat, themMenu }) {
  const location = useLocation();

  const menu = [...MENU_NHAN_VIEN];
  if (themMenu) menu.push(...themMenu);

  const laActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="logo-container" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Link to={ROUTES.dashboard} className="logo">
          HomeStay Dorm
        </Link>
      </div>

      <ul className="nav-links">
        {menu.map((item) => (
          <li key={item.key} className={laActive(item.path) ? 'active' : ''}>
            <Link to={item.path}>{item.label}</Link>
          </li>
        ))}
        {(nguoiDung?.vaiTro || '').toLowerCase().includes('admin') && (
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
