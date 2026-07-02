import { useEffect, useState } from 'react';
import KhungNhanVien from '../components/KhungNhanVien';

function layRoleClass(vaiTro) {
  const v = (vaiTro || '').toLowerCase();
  if (v.includes('admin')) return 'admin';
  if (v.includes('quản lý') || v.includes('manager')) return 'manager';
  if (v.includes('sale')) return 'sale';
  return 'account';
}

const FORM_RONG = {
  tenDangNhap: '',
  hoTen: '',
  email: '',
  sdt: '',
  vaiTro: 'Nhân viên',
  matKhau: '',
  xacNhanMatKhau: '',
  maCN: '',
};

export default function QuanLyTaiKhoan({ nguoiDung, dangXuat }) {
  const [thongKe, setThongKe] = useState({ tong: 0, admin: 0, dangHoatDong: 0, biKhoa: 0 });
  const [danhSach, setDanhSach] = useState([]);
  const [chiNhanh, setChiNhanh] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [moModal, setMoModal] = useState(false);
  const [form, setForm] = useState(FORM_RONG);
  const [loi, setLoi] = useState('');
  const [dangLuu, setDangLuu] = useState(false);
  const [page, setPage] = useState(1);
  const [tong, setTong] = useState(0);

  useEffect(() => {
    fetch('/api/chi-nhanh').then((r) => r.json()).then((res) => {
      if (res.ok) setChiNhanh(res.data);
    });
  }, []);

  useEffect(() => {
    taiDuLieu();
  }, [page]);

  const taiDuLieu = async () => {
    setDangTai(true);
    try {
      const [resTK, resDS] = await Promise.all([
        fetch('/api/tai-khoan/thong-ke').then((r) => r.json()),
        fetch(`/api/tai-khoan?page=${page}&limit=10`).then((r) => r.json()),
      ]);
      if (resTK.ok) setThongKe(resTK.data);
      if (resDS.ok) {
        setDanhSach(resDS.danhSach);
        setTong(resDS.tong);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDangTai(false);
    }
  };

  const luuTaiKhoan = async (e) => {
    e.preventDefault();
    setLoi('');
    setDangLuu(true);
    try {
      const res = await fetch('/api/tai-khoan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email || form.tenDangNhap,
          hoTen: form.hoTen,
          sdt: form.sdt,
          vaiTro: form.vaiTro,
          matKhau: form.matKhau,
          xacNhanMatKhau: form.xacNhanMatKhau,
          maCN: form.maCN || null,
        }),
      }).then((r) => r.json());

      if (!res.ok) throw new Error(res.error);
      setMoModal(false);
      setForm(FORM_RONG);
      taiDuLieu();
    } catch (err) {
      setLoi(err.message || 'Không thể lưu tài khoản');
    } finally {
      setDangLuu(false);
    }
  };

  return (
    <KhungNhanVien nguoiDung={nguoiDung} dangXuat={dangXuat}>
      <div className="qt-page-header">
        <div>
          <h1>Quản lý tài khoản</h1>
          <p>Phân quyền và quản lý tài khoản nhân viên hệ thống.</p>
        </div>
        <button type="button" className="qt-btn-primary" onClick={() => setMoModal(true)}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>person_add</span>
          Thêm tài khoản mới
        </button>
      </div>

      <div className="qt-stats">
        <div className="qt-stat-card"><p>Tổng tài khoản</p><strong>{thongKe.tong}</strong></div>
        <div className="qt-stat-card"><p>Admin</p><strong>{thongKe.admin}</strong></div>
        <div className="qt-stat-card"><p>Đang hoạt động</p><strong>{thongKe.dangHoatDong}</strong></div>
        <div className="qt-stat-card"><p>Bị khóa</p><strong>{thongKe.biKhoa}</strong></div>
      </div>

      <div className="qt-table-wrap">
        {dangTai ? (
          <div className="qt-loading">Đang tải...</div>
        ) : (
          <>
            <table className="qt-table">
              <thead>
                <tr>
                  <th>Tên đăng nhập</th>
                  <th>Họ tên</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Trạng thái</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {danhSach.map((nv) => (
                  <tr key={nv.maNV}>
                    <td>{nv.tenDangNhap}</td>
                    <td>{nv.hoTen}</td>
                    <td>{nv.email}</td>
                    <td>
                      <span className={`qt-role-badge qt-role-badge--${layRoleClass(nv.vaiTro)}`}>{nv.vaiTro}</span>
                    </td>
                    <td>
                      <span className={`qt-status-dot qt-status-dot--${nv.trangThai === 'Hoạt động' ? 'active' : 'locked'}`}>
                        {nv.trangThai}
                      </span>
                    </td>
                    <td>
                      <button type="button" className="qt-btn-icon">
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="qt-pagination">
              <span>{danhSach.length} / {tong} tài khoản</span>
              <div className="qt-pagination-btns">
                <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Trước</button>
                <button type="button" disabled={page * 10 >= tong} onClick={() => setPage((p) => p + 1)}>Sau</button>
              </div>
            </div>
          </>
        )}
      </div>

      {moModal && (
        <div className="qt-modal-overlay" onClick={() => setMoModal(false)} role="presentation">
          <div className="qt-modal" onClick={(e) => e.stopPropagation()} role="dialog">
            <div className="qt-modal-header">
              <h2>Thêm tài khoản mới</h2>
            </div>
            <form onSubmit={luuTaiKhoan}>
              <div className="qt-modal-body">
                <div className="qt-field">
                  <label>Tên đăng nhập (email) *</label>
                  <input required value={form.tenDangNhap} onChange={(e) => setForm((p) => ({ ...p, tenDangNhap: e.target.value, email: e.target.value }))} />
                </div>
                <div className="qt-field">
                  <label>Role hệ thống *</label>
                  <select required value={form.vaiTro} onChange={(e) => setForm((p) => ({ ...p, vaiTro: e.target.value }))}>
                    <option value="Admin">Admin</option>
                    <option value="Quản lý">Quản lý</option>
                    <option value="Sale">Sale</option>
                    <option value="Kế toán">Kế toán</option>
                    <option value="Nhân viên">Nhân viên</option>
                  </select>
                </div>
                <div className="qt-field">
                  <label>Mật khẩu *</label>
                  <input type="password" required minLength={6} value={form.matKhau} onChange={(e) => setForm((p) => ({ ...p, matKhau: e.target.value }))} />
                </div>
                <div className="qt-field">
                  <label>Xác nhận mật khẩu *</label>
                  <input type="password" required value={form.xacNhanMatKhau} onChange={(e) => setForm((p) => ({ ...p, xacNhanMatKhau: e.target.value }))} />
                </div>
                <div className="qt-field">
                  <label>Họ và tên *</label>
                  <input required value={form.hoTen} onChange={(e) => setForm((p) => ({ ...p, hoTen: e.target.value }))} />
                </div>
                <div className="qt-field">
                  <label>Số điện thoại</label>
                  <input value={form.sdt} onChange={(e) => setForm((p) => ({ ...p, sdt: e.target.value }))} />
                </div>
                <div className="qt-field qt-field--full">
                  <label>Chi nhánh</label>
                  <select value={form.maCN} onChange={(e) => setForm((p) => ({ ...p, maCN: e.target.value }))}>
                    <option value="">— Chọn chi nhánh —</option>
                    {chiNhanh.map((cn) => (
                      <option key={cn.MaCN} value={cn.MaCN}>{cn.TenCN}</option>
                    ))}
                  </select>
                </div>
                {loi && <p className="qt-field--full" style={{ color: '#dc2626', margin: 0 }}>{loi}</p>}
              </div>
              <div className="qt-modal-footer">
                <button type="button" className="qt-btn-outline" onClick={() => setMoModal(false)}>Hủy bỏ</button>
                <button type="submit" className="qt-btn-primary" disabled={dangLuu}>
                  {dangLuu ? 'Đang lưu...' : 'Lưu tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </KhungNhanVien>
  );
}
