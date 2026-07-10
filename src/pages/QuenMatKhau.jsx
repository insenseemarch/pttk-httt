import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ROUTES } from '../config/routes';

export default function QuenMatKhau({ quayLaiDangNhap }) {
  const [searchParams] = useSearchParams();
  const tokenTuUrl = searchParams.get('token') || '';

  const [buoc, setBuoc] = useState(tokenTuUrl ? 'dat-lai' : 'gui-email');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState(tokenTuUrl);
  const [matKhauMoi, setMatKhauMoi] = useState('');
  const [xacNhanMatKhau, setXacNhanMatKhau] = useState('');
  const [dangXuLy, setDangXuLy] = useState(false);
  const [thongBao, setThongBao] = useState('');
  const [loi, setLoi] = useState('');
  const [linkDev, setLinkDev] = useState('');

  useEffect(() => {
    if (tokenTuUrl) {
      setToken(tokenTuUrl);
      setBuoc('dat-lai');
    }
  }, [tokenTuUrl]);

  const guiYeuCauReset = async (e) => {
    e.preventDefault();
    setDangXuLy(true);
    setLoi('');

    try {
      const res = await fetch('/api/quen-mat-khau', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Không thể gửi yêu cầu khôi phục');
      }

      setThongBao(data.message);
      if (data.tokenKhoiPhuc) {
        setToken(data.tokenKhoiPhuc);
        setLinkDev(data.linkKhoiPhuc || '');
      }
      setBuoc('cho-xac-nhan');
    } catch (err) {
      setLoi(err.message || 'Không thể kết nối máy chủ. Vui lòng thử lại sau.');
    } finally {
      setDangXuLy(false);
    }
  };

  const xuLyDatLaiMatKhau = async (e) => {
    e.preventDefault();
    setLoi('');

    if (matKhauMoi !== xacNhanMatKhau) {
      setLoi('Mật khẩu xác nhận không khớp');
      return;
    }

    setDangXuLy(true);
    try {
      const res = await fetch('/api/dat-lai-mat-khau', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, matKhauMoi }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Không thể đặt lại mật khẩu');
      }

      setThongBao(data.message);
      setBuoc('thanh-cong');
    } catch (err) {
      setLoi(err.message || 'Đặt lại mật khẩu thất bại');
    } finally {
      setDangXuLy(false);
    }
  };

  return (
    <div className="auth-shell auth-shell--reset">
      <div className="auth-bg-blur" />

      <main className="auth-card auth-card--reset">
        <div className="auth-reset-header">
          <div className="auth-brand-icon" style={{ marginBottom: 24, boxShadow: '0 10px 15px -3px rgba(249,115,22,0.2)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 32 }}>key</span>
          </div>
        </div>

        <div className="auth-reset-body">
          <button type="button" className="auth-back-link" onClick={quayLaiDangNhap}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
            Quay lại Đăng nhập
          </button>

          {buoc === 'gui-email' && (
            <div>
              <div className="auth-heading" style={{ textAlign: 'left', marginBottom: 32 }}>
                <h2 style={{ textAlign: 'left' }}>Khôi phục mật khẩu</h2>
                <p style={{ textAlign: 'left' }}>Nhập email nhân viên để nhận liên kết đặt lại mật khẩu</p>
              </div>

              <form className="auth-form" onSubmit={guiYeuCauReset}>
                <div className="auth-field">
                  <label htmlFor="email" style={{ textTransform: 'none', fontSize: 16, fontWeight: 600 }}>
                    Địa chỉ email
                  </label>
                  <div className="auth-input-wrap">
                    <span className="material-symbols-outlined" style={{ left: 16 }}>mail</span>
                    <input
                      id="email"
                      className="auth-input auth-input--tall"
                      type="email"
                      placeholder="email@congty.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {loi && <div className="auth-error"><span>{loi}</span></div>}

                <button type="submit" className="auth-btn-primary auth-btn-primary--tall" disabled={dangXuLy}>
                  {dangXuLy ? 'Đang gửi...' : 'Gửi yêu cầu khôi phục'}
                </button>
              </form>
            </div>
          )}

          {buoc === 'cho-xac-nhan' && (
            <div className="auth-success">
              <div className="auth-success-icon">
                <span className="material-symbols-outlined">check_circle</span>
              </div>
              <h3>Yêu cầu đã được ghi nhận</h3>
              <p>{thongBao}</p>
              {linkDev && (
                <div className="auth-resend-box" style={{ wordBreak: 'break-all', textAlign: 'left' }}>
                  <strong>Dev:</strong> <a className="auth-link" href={linkDev}>{linkDev}</a>
                </div>
              )}
              <button type="button" className="auth-btn-primary auth-btn-primary--tall" onClick={() => setBuoc('dat-lai')}>
                Đặt lại mật khẩu
              </button>
            </div>
          )}

          {buoc === 'dat-lai' && (
            <div>
              <div className="auth-heading" style={{ textAlign: 'left', marginBottom: 32 }}>
                <h2 style={{ textAlign: 'left' }}>Đặt mật khẩu mới</h2>
                <p style={{ textAlign: 'left' }}>Nhập mật khẩu mới cho tài khoản của bạn</p>
              </div>

              <form className="auth-form" onSubmit={xuLyDatLaiMatKhau}>
                {!tokenTuUrl && (
                  <div className="auth-field">
                    <label htmlFor="token" style={{ textTransform: 'none', fontSize: 16, fontWeight: 600 }}>
                      Mã / liên kết khôi phục
                    </label>
                    <input
                      id="token"
                      className="auth-input auth-input--tall"
                      type="text"
                      placeholder="Dán token từ email hoặc link khôi phục"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div className="auth-field">
                  <label htmlFor="matKhauMoi" style={{ textTransform: 'none', fontSize: 16, fontWeight: 600 }}>
                    Mật khẩu mới
                  </label>
                  <input
                    id="matKhauMoi"
                    className="auth-input auth-input--tall"
                    type="password"
                    placeholder="Ít nhất 6 ký tự"
                    value={matKhauMoi}
                    onChange={(e) => setMatKhauMoi(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                <div className="auth-field">
                  <label htmlFor="xacNhanMatKhau" style={{ textTransform: 'none', fontSize: 16, fontWeight: 600 }}>
                    Xác nhận mật khẩu
                  </label>
                  <input
                    id="xacNhanMatKhau"
                    className="auth-input auth-input--tall"
                    type="password"
                    placeholder="Nhập lại mật khẩu mới"
                    value={xacNhanMatKhau}
                    onChange={(e) => setXacNhanMatKhau(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                {loi && <div className="auth-error"><span>{loi}</span></div>}

                <button type="submit" className="auth-btn-primary auth-btn-primary--tall" disabled={dangXuLy}>
                  {dangXuLy ? 'Đang lưu...' : 'Lưu mật khẩu mới'}
                </button>
              </form>
            </div>
          )}

          {buoc === 'thanh-cong' && (
            <div className="auth-success">
              <div className="auth-success-icon">
                <span className="material-symbols-outlined">check_circle</span>
              </div>
              <h3>Đổi mật khẩu thành công</h3>
              <p>{thongBao}</p>
              <button type="button" className="auth-btn-outline" onClick={quayLaiDangNhap}>
                Đăng nhập ngay
              </button>
            </div>
          )}
        </div>

        <div className="auth-help-footer">
          Bạn cần hỗ trợ thêm? <span className="auth-link" style={{ fontWeight: 700 }}>Liên hệ CSKH</span>
        </div>
      </main>
    </div>
  );
}
