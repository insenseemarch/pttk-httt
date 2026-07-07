import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../config/routes';

export default function DangNhap({ onDangNhapThanhCong, chuyenQuenMatKhau }) {
  const [tenDangNhap, setTenDangNhap] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [hienMatKhau, setHienMatKhau] = useState(false);
  const [loi, setLoi] = useState('');
  const [dangXuLy, setDangXuLy] = useState(false);
  const [lacThe, setLacThe] = useState(false);

  const xuLyDangNhap = async (e) => {
    e.preventDefault();
    setLoi('');
    setDangXuLy(true);

    try {
      const res = await fetch('/api/dang-nhap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenDangNhap, matKhau }),
      });
      const data = await res.json();

      if (res.ok && data.ok) {
        onDangNhapThanhCong(data.data, data.token);
        return;
      }

      setLoi(data.error || 'Tên đăng nhập hoặc mật khẩu không đúng');
      setLacThe(true);
      setTimeout(() => setLacThe(false), 500);
    } catch {
      setLoi('Không thể kết nối máy chủ. Vui lòng thử lại.');
      setLacThe(true);
      setTimeout(() => setLacThe(false), 500);
    } finally {
      setDangXuLy(false);
    }
  };

  return (
    <div className="auth-shell">
      <main className={`auth-card auth-card--login ${lacThe ? 'auth-card--shake' : ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
          <div className="auth-brand-icon">
            <span className="material-symbols-outlined">home_work</span>
          </div>
          <h1 className="auth-brand-title">HomeStay Dorm</h1>
        </div>

        <div className="auth-heading">
          <h2>Đăng nhập hệ thống</h2>
          <p>Vui lòng dùng email hoặc số điện thoại đã lưu trong Supabase cùng mật khẩu tương ứng</p>
        </div>

        <form className="auth-form" onSubmit={xuLyDangNhap}>
          <div className="auth-field">
            <label htmlFor="username">Email / SĐT</label>
            <div className="auth-input-wrap">
              <span className="material-symbols-outlined">person</span>
              <input
                id="username"
                className={`auth-input ${loi ? 'auth-input--error' : ''}`}
                type="text"
                placeholder="Email hoặc SĐT đã có trong Supabase"
                value={tenDangNhap}
                onChange={(e) => setTenDangNhap(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <div className="auth-field-row">
              <label htmlFor="password">Mật khẩu</label>
              <button type="button" className="auth-link" onClick={chuyenQuenMatKhau}>
                Quên mật khẩu?
              </button>
            </div>
            <div className="auth-input-wrap">
              <span className="material-symbols-outlined">lock</span>
              <input
                id="password"
                className={`auth-input ${loi ? 'auth-input--error' : ''}`}
                type={hienMatKhau ? 'text' : 'password'}
                placeholder="••••••••"
                value={matKhau}
                onChange={(e) => setMatKhau(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="auth-toggle-pw"
                onClick={() => setHienMatKhau(!hienMatKhau)}
                aria-label="Hiện/ẩn mật khẩu"
              >
                <span className="material-symbols-outlined">
                  {hienMatKhau ? 'visibility' : 'visibility_off'}
                </span>
              </button>
            </div>
          </div>

          {loi && (
            <div className="auth-error">
              <span className="material-symbols-outlined">error</span>
              <span>{loi}</span>
            </div>
          )}

          <button type="submit" className="auth-btn-primary" disabled={dangXuLy}>
            {dangXuLy ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <div className="auth-illustration">
          <img src="/dorm_room.png" alt="HomeStay Dorm interior" />
        </div>

        <div className="auth-footer">
          <Link to={ROUTES.trangChu} className="auth-link" style={{ display: 'inline-block', marginBottom: 12 }}>
            ← Về trang chủ
          </Link>
          <p>© 2026 HomeStay Dorm Management System</p>
          <p style={{ opacity: 0.6, fontStyle: 'italic' }}>Designed for professional property operations</p>
        </div>
      </main>
    </div>
  );
}
