import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { MENU_NHAN_VIEN, ROUTES } from '../config/routes';

export default function ThanhMenuNhanVien({ nguoiDung, dangXuat, themMenu }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [depositNotifications, setDepositNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const rawRole = (nguoiDung?.vaiTro || '').toLowerCase();
  const apiRole = rawRole.includes('kế toán') || rawRole.includes('ke toan') || rawRole === 'ketoan'
    ? 'KE_TOAN'
    : rawRole.includes('quản lý') || rawRole.includes('quan ly') || rawRole === 'quanly'
      ? 'QUAN_LY'
      : 'SALE';

  const taiThongBaoDatCoc = async () => {
    try {
      const response = await fetch('/api/dat-coc/notifications', {
        headers: { 'x-user-id': String(nguoiDung?.maNV || ''), 'x-user-role': apiRole },
      });
      const json = await response.json();
      if (json.ok) setDepositNotifications(json.data || []);
    } catch {
      // Module may not be migrated yet; the rest of the navigation remains usable.
    }
  };

  useEffect(() => {
    // Connect to Socket.io
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001');

    socket.on('connect', () => {
      console.log('[Socket] Connected to server from menu');
      socket.emit('join_room', `role:${apiRole}`);
      if (nguoiDung?.maNV) {
        socket.emit('join_room', `sale:${nguoiDung.maNV}`);
      }
      // Reconnect-Sync: update immediately on connection
      taiThongBaoDatCoc();
    });

    socket.on('thong_bao_moi', (data) => {
      console.log('[Socket] Received new notification in menu:', data);
      taiThongBaoDatCoc();
    });

    const onFocus = () => taiThongBaoDatCoc();
    window.addEventListener('focus', onFocus);

    return () => {
      socket.disconnect();
      window.removeEventListener('focus', onFocus);
    };
  }, [nguoiDung?.maNV, apiRole]);

  const handleToggleNotifications = () => {
    setShowNotifications((current) => !current);
  };

  const moThongBao = async (item) => {
    if (!item.DaDoc) {
      setDepositNotifications((current) => current.map((notification) => (
        notification.MaThongBao === item.MaThongBao
          ? { ...notification, DaDoc: true }
          : notification
      )));
      try {
        await fetch(`/api/dat-coc/notifications/${item.MaThongBao}/read`, {
          method: 'PATCH',
          headers: { 'x-user-id': String(nguoiDung?.maNV || ''), 'x-user-role': apiRole },
        });
      } catch (err) {
        console.error(err);
      }
    }
    setShowNotifications(false);
    await taiThongBaoDatCoc();
    navigate(`${ROUTES.deposit}?phieu=${item.MaDatCoc}`);
  };
  
  let menu = [];
  if (rawRole.includes('kế toán') || rawRole.includes('ke toan') || rawRole === 'ketoan') {
    menu = [
      { key: 'dashboard', label: 'Tổng quan', path: ROUTES.dashboard },
      { key: 'phongGiuong', label: 'Phòng và Giường', path: ROUTES.phongGiuong },
      { key: 'deposit', label: 'Đặt cọc', path: ROUTES.deposit },
      { key: 'staffPayment', label: 'Thu tiền đầu kỳ', path: '/staff-payment' },
      { key: 'checkout', label: 'Đối soát và Hoàn cọc', path: ROUTES.checkout },
      { key: 'thuChi', label: 'Thu chi', path: ROUTES.thuChi },
      { key: 'thongBao', label: 'Báo cáo', path: ROUTES.thongBao }
    ];
  } else if (rawRole.includes('quản lý') || rawRole.includes('quan ly') || rawRole === 'quanly') {
    menu = [
      { key: 'dashboard', label: 'Tổng quan', path: ROUTES.dashboard },
      { key: 'phongGiuong', label: 'Sơ đồ phòng', path: ROUTES.phongGiuong },
      { key: 'deposit', label: 'Đặt cọc', path: ROUTES.deposit },
      { key: 'stayCheck', label: 'Đăng ký lưu trú', path: ROUTES.stayCheck },
      { key: 'checkout', label: 'Kiểm tra trả phòng', path: ROUTES.checkout },
      { key: 'thongBao', label: 'Thông báo', path: ROUTES.thongBao }
    ];
  } else {
    // Sale role
    menu = [
      { key: 'dashboard', label: 'Tổng quan', path: ROUTES.dashboard },
      { key: 'phongGiuong', label: 'Sơ đồ phòng', path: ROUTES.phongGiuong },
      { key: 'deposit', label: 'Đặt cọc', path: ROUTES.deposit },
      { key: 'thongBao', label: 'Thông báo', path: ROUTES.thongBao }
    ];
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
        <button type="button" className="notification-btn deposit-bell" title="Thông báo" onClick={handleToggleNotifications}>
          <span className="material-symbols-outlined">notifications</span>
          {depositNotifications.some((item) => !item.DaDoc) && <span className="deposit-bell-count">{depositNotifications.filter((item) => !item.DaDoc).length}</span>}
        </button>
        {showNotifications && (
          <div className="deposit-notification-popover">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9', marginBottom: '8px' }}>
              <strong style={{ fontSize: '13px', color: '#1e293b' }}>Thông báo đặt cọc</strong>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {depositNotifications.some((n) => !n.DaDoc) && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await fetch('/api/dat-coc/notifications/mark-all-read', {
                          method: 'PATCH',
                          headers: { 'x-user-id': String(nguoiDung?.maNV || ''), 'x-user-role': apiRole },
                        });
                        await taiThongBaoDatCoc();
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                    style={{ background: 'none', border: 'none', color: '#f26a21', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', padding: '2px 6px', borderRadius: '4px', transition: 'background 0.2s' }}
                    onMouseOver={(e) => e.target.style.background = '#fff8f5'}
                    onMouseOut={(e) => e.target.style.background = 'none'}
                  >
                    Đọc tất cả
                  </button>
                )}
                <button type="button" className="qt-btn-icon" onClick={() => setShowNotifications(false)} style={{ padding: '2px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                </button>
              </div>
            </div>
            {!depositNotifications.filter((n) => !n.DaDoc).length && <p style={{ padding: '12px 0', textAlign: 'center', color: '#64748b' }}>Không có thông báo mới.</p>}
            {depositNotifications.filter((n) => !n.DaDoc).slice(0, 6).map((item) => (
              <button type="button" key={item.MaThongBao} className="unread" onClick={() => moThongBao(item)}>
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
