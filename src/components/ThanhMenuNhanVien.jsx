import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MENU_NHAN_VIEN, ROUTES } from '../config/routes';

export default function ThanhMenuNhanVien({ nguoiDung, dangXuat, themMenu }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [depositNotifications, setDepositNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const rawRole = (nguoiDung?.vaiTro || '').toLowerCase();

  const taiThongBaoDatCoc = async () => {
    try {
      const response = await fetch('/api/dat-coc/notifications', {
        headers: { 'x-user-id': String(nguoiDung?.maNV || ''), 'x-user-role': nguoiDung?.vaiTro || 'Sale' },
      });
      const json = await response.json();
      if (json.ok) setDepositNotifications(json.data || []);
    } catch {
      // Module may not be migrated yet; the rest of the navigation remains usable.
    }
  };

  useEffect(() => {
    taiThongBaoDatCoc();
    const timer = setInterval(taiThongBaoDatCoc, 30000);
    const onFocus = () => taiThongBaoDatCoc();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, [nguoiDung?.maNV, nguoiDung?.vaiTro]);

  const moThongBao = async (item) => {
    if (!item.DaDoc) {
      await fetch(`/api/dat-coc/notifications/${item.MaThongBao}/read`, {
        method: 'PATCH',
        headers: { 'x-user-id': String(nguoiDung?.maNV || ''), 'x-user-role': nguoiDung?.vaiTro || 'Sale' },
      });
    }
    setShowNotifications(false);
    taiThongBaoDatCoc();
    navigate(`${ROUTES.deposit}?phieu=${item.MaDatCoc}`);
  };
  
  let menu = [];
  if (rawRole.includes('kế toán') || rawRole.includes('ke toan') || rawRole === 'ketoan') {
    menu = [
      { key: 'dashboard', label: 'Tổng quan', path: ROUTES.dashboard },
      { key: 'phongGiuong', label: 'Phòng', path: ROUTES.phongGiuong },
      { key: 'hopDong', label: 'Hợp đồng', path: ROUTES.hopDong },
      { key: 'deposit', label: 'Đặt cọc', path: ROUTES.deposit },
      { key: 'staffPayment', label: 'Thu tiền đầu kỳ', path: '/staff-payment' },
      { key: 'checkout', label: 'Đối soát & Hoàn cọc', path: ROUTES.checkout },
      { key: 'thuChi', label: 'Thu chi', path: ROUTES.thuChi },
      { key: 'thongBao', label: 'Báo cáo', path: ROUTES.thongBao } // Giả lập Báo cáo = Thông báo tạm thời theo hình
    ];
  } else if (rawRole.includes('quản lý') || rawRole.includes('quan ly') || rawRole === 'quanly') {
    menu = [
      { key: 'dashboard', label: 'Dashboard', path: ROUTES.dashboard },
      { key: 'phongGiuong', label: 'Phòng/Giường', path: ROUTES.phongGiuong },
      { key: 'khachHang', label: 'Khách hàng', path: ROUTES.khachHang },
      { key: 'hopDong', label: 'Hợp đồng', path: ROUTES.hopDong },
      { key: 'deposit', label: 'Đặt cọc', path: ROUTES.deposit },
      { key: 'stayCheck', label: 'ĐK Lưu trú', path: ROUTES.stayCheck },
      { key: 'checkout', label: 'KT Trả phòng', path: ROUTES.checkout },
      { key: 'thongBao', label: 'Thông báo', path: ROUTES.thongBao }
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
        <button type="button" className="notification-btn deposit-bell" title="Thông báo" onClick={() => setShowNotifications((value) => !value)}>
          <span className="material-symbols-outlined">notifications</span>
          {depositNotifications.some((item) => !item.DaDoc) && <span className="deposit-bell-count">{depositNotifications.filter((item) => !item.DaDoc).length}</span>}
        </button>
        {showNotifications && (
          <div className="deposit-notification-popover">
            <div><strong>Thông báo đặt cọc</strong><button type="button" className="qt-btn-icon" onClick={() => setShowNotifications(false)}><span className="material-symbols-outlined">close</span></button></div>
            {!depositNotifications.length && <p>Không có thông báo mới.</p>}
            {depositNotifications.slice(0, 6).map((item) => (
              <button type="button" key={item.MaThongBao} className={item.DaDoc ? '' : 'unread'} onClick={() => moThongBao(item)}>
                <span>{item.NoiDung}</span><small>{new Date(item.TaoLuc).toLocaleString('vi-VN')}</small>
              </button>
            ))}
          </div>
        )}
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
