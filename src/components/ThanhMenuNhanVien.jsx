import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { MENU_NHAN_VIEN, ROUTES, layMenuNhanVienTheoVaiTro } from '../config/routes';
import { chuanHoaVaiTroNhanVien } from '../utils/nhanVienSession';

export default function ThanhMenuNhanVien({ nguoiDung, dangXuat, themMenu }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [depositNotifications, setDepositNotifications] = useState([]);
  const [transientNotifications, setTransientNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const rawRole = (nguoiDung?.vaiTro || '').toLowerCase();
  const vaiTroChuan = chuanHoaVaiTroNhanVien(nguoiDung?.vaiTro);
  const apiRole = rawRole.includes('kế toán') || rawRole.includes('ke toan') || rawRole === 'ketoan'
    ? 'KE_TOAN'
    : rawRole.includes('quản lý') || rawRole.includes('quan ly') || rawRole === 'quanly'
      ? 'QUAN_LY'
      : rawRole.includes('phụ trách') || rawRole.includes('phu trach') || rawRole === 'phutrach'
        ? 'PHU_TRACH'
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

      setTransientNotifications(prev => [{
        MaThongBao: 'temp_' + Date.now(),
        NoiDung: data.noiDung,
        TaoLuc: new Date().toISOString(),
        DaDoc: false,
        MaDatCoc: data.loaiSuKien === 'ban_giao_phong' ? null : (data.phieuId || null),
        LoaiSuKien: data.loaiSuKien || null,
        PhieuId: data.phieuId || null,
      }, ...prev]);
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
      if (String(item.MaThongBao).startsWith('temp_')) {
        setTransientNotifications((current) => current.map((notification) => (
          notification.MaThongBao === item.MaThongBao
            ? { ...notification, DaDoc: true }
            : notification
        )));
      } else {
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
    }
    setShowNotifications(false);
    await taiThongBaoDatCoc();

    if (item.LoaiSuKien === 'ban_giao_phong') {
      navigate(item.PhieuId ? `${ROUTES.banGiao}/${item.PhieuId}` : ROUTES.banGiao);
    } else if (item.MaDatCoc) {
      navigate(`${ROUTES.deposit}?phieu=${item.MaDatCoc}`);
    } else {
      navigate(ROUTES.checkout);
    }
  };
  
  let menu = [];
  if (rawRole.includes('sale') || rawRole.includes('kinh doanh')) {
    menu = [
      { key: 'dashboard', label: 'Tổng quan', path: ROUTES.dashboard },
      { key: 'tiepNhanDangKyThue', label: 'Tiếp nhận thuê', path: ROUTES.tiepNhanDangKyThue },
      { key: 'phongGiuong', label: 'Tra cứu phòng/giường', path: ROUTES.phongGiuong },
      { key: 'soDoPhong', label: 'Sơ đồ phòng', path: ROUTES.soDoPhong },
      { key: 'lichHen', label: 'Lịch hẹn', path: ROUTES.lichHen },
      { key: 'thongBao', label: 'Thông báo', path: ROUTES.thongBao },
    ];
  } else if (rawRole.includes('quản lý') || rawRole.includes('quan ly') || rawRole === 'quanly') {
    menu = [
      { key: 'dashboard', label: 'Tổng quan', path: ROUTES.dashboard },
      { key: 'phongGiuong', label: 'Tra cứu phòng/giường', path: ROUTES.phongGiuong },
      { key: 'soDoPhong', label: 'Sơ đồ phòng', path: ROUTES.soDoPhong },
      { key: 'kiemTraLuuTru', label: 'Kiểm tra ĐK lưu trú', path: ROUTES.kiemTraLuuTru },
      { key: 'banGiao', label: 'Bàn giao phòng', path: ROUTES.banGiao },
      { key: 'thongBao', label: 'Thông báo', path: ROUTES.thongBao },
    ];
  } else if (rawRole.includes('kế toán') || rawRole.includes('ke toan') || rawRole === 'ketoan') {
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
      { key: 'kiemTraLuuTru', label: 'Kiểm tra ĐK lưu trú', path: ROUTES.kiemTraLuuTru },
      { key: 'checkout', label: 'Kiểm tra trả phòng', path: ROUTES.checkout },
      { key: 'thongBao', label: 'Thông báo', path: ROUTES.thongBao }
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
  } else if (rawRole.includes('phụ trách') || rawRole.includes('phu trach') || rawRole === 'phutrach') {
    menu = [
      { key: 'dashboard', label: 'Dashboard', path: ROUTES.dashboard },
      { key: 'lapHopDong', label: 'Lập hợp đồng', path: ROUTES.lapHopDong },
      { key: 'phongGiuong', label: 'Phòng/Giường', path: ROUTES.phongGiuong },
      { key: 'khachHang', label: 'Khách hàng', path: ROUTES.khachHang },
      { key: 'hopDong', label: 'Hợp đồng', path: ROUTES.hopDong },
      { key: 'thongBao', label: 'Thông báo', path: ROUTES.thongBao },
    ];
  } else {
    // Sale role
    menu = [
      { key: 'dashboard', label: 'Tổng quan', path: ROUTES.dashboard },
      { key: 'phongGiuong', label: 'Sơ đồ phòng', path: ROUTES.phongGiuong },
      { key: 'deposit', label: 'Đặt cọc', path: ROUTES.deposit },
      { key: 'hopDong', label: 'Hợp đồng', path: ROUTES.hopDong },
      { key: 'thongBao', label: 'Thông báo', path: ROUTES.thongBao }
    ];
  }

  menu = layMenuNhanVienTheoVaiTro(vaiTroChuan);

  if (themMenu) menu.push(...themMenu);

  const laActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const allUnreadNotifications = [...transientNotifications, ...depositNotifications].filter((n) => !n.DaDoc);

  return (
    <>
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
        {rawRole.includes('admin') && !menu.some((item) => item.key === 'quanLyTaiKhoan') && (
          <li className={laActive(ROUTES.quanLyTaiKhoan) ? 'active' : ''}>
            <Link to={ROUTES.quanLyTaiKhoan}>Tài khoản</Link>
          </li>
        )}
      </ul>

      <div className="nav-actions">
        <button type="button" className="notification-btn deposit-bell" title="Thông báo" onClick={handleToggleNotifications}>
          <span className="material-symbols-outlined">notifications</span>
          {allUnreadNotifications.length > 0 && <span className="deposit-bell-count">{allUnreadNotifications.length}</span>}
        </button>
        {showNotifications && (
          <div className="deposit-notification-popover">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9', marginBottom: '8px' }}>
              <strong style={{ fontSize: '13px', color: '#1e293b' }}>Thông báo</strong>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {allUnreadNotifications.length > 0 && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        setTransientNotifications(current => current.map(n => ({ ...n, DaDoc: true })));
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
            
            {/* Combine both lists for display */}
            {(() => {
              const allNotifications = [...transientNotifications, ...depositNotifications].filter((n) => !n.DaDoc);
              if (!allNotifications.length) {
                return <p style={{ padding: '12px 0', textAlign: 'center', color: '#64748b' }}>Không có thông báo mới.</p>;
              }
              return allNotifications.slice(0, 6).map((item) => (
                <button type="button" key={item.MaThongBao} className="unread" onClick={() => moThongBao(item)}>
                  <span>{item.NoiDung}</span><small>{new Date(item.TaoLuc).toLocaleString('vi-VN')}</small>
                </button>
              ));
            })()}
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
    </>
  );
}
