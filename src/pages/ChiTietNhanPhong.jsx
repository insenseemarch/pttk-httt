import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import KhungNhanVien from '../components/KhungNhanVien';
import { ROUTES } from '../config/routes';

const KHACH_TRONG = {
  cccd: '',
  hoTen: '',
  ngaySinh: '',
  gioiTinh: 'Nam',
  quocTich: 'Việt Nam',
  diaChi: '',
  sdt: '',
  email: '',
  daDoiChieuCCCD: false,
};

function chuanHoaGioiTinh(gioiTinh) {
  const s = String(gioiTinh || '').trim().toLowerCase();
  if (s === 'nữ' || s === 'nu' || s === 'female') return 'nu';
  return 'nam';
}

export default function ChiTietNhanPhong({ nguoiDung, dangXuat }) {
  const { maDatCoc } = useParams();
  const navigate = useNavigate();

  const [hoSo, setHoSo] = useState(null);
  const [khachChinh, setKhachChinh] = useState({ ...KHACH_TRONG });
  const [thanhVien, setThanhVien] = useState([]);
  const [ghiChu, setGhiChu] = useState('');
  const [dangTai, setDangTai] = useState(true);
  const [dangXuLy, setDangXuLy] = useState(false);
  const [loi, setLoi] = useState([]);
  const [toast, setToast] = useState(null);

  const [showThemTV, setShowThemTV] = useState(false);
  const [tvMoi, setTvMoi] = useState({ ...KHACH_TRONG });

  const hienToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    taiHoSo();
  }, [maDatCoc]);

  const taiHoSo = async () => {
    setDangTai(true);
    try {
      const res = await fetch(`/api/nhan-phong/${maDatCoc}`).then((r) => r.json());
      if (res.ok) {
        setHoSo(res.data);
        setKhachChinh(res.data.khachChinh || { ...KHACH_TRONG });
        setThanhVien(res.data.thanhVien || []);
        setLoi([]);
      } else {
        hienToast(res.error || 'Không tải được hồ sơ', 'error');
      }
    } catch (err) {
      console.error(err);
      hienToast('Lỗi kết nối máy chủ', 'error');
    } finally {
      setDangTai(false);
    }
  };

  const canhBao = useMemo(() => {
    if (!hoSo) return [];
    const msgs = [];
    const tongNguoi = hoSo.laThuNhom ? 1 + thanhVien.length : 1;
    const gioiHan = hoSo.gioiHanNguoi || hoSo.soGiuongThue || 1;

    if (tongNguoi > gioiHan) {
      msgs.push(`Số người ở (${tongNguoi}) vượt quá số giường/phòng đã cọc (${gioiHan})`);
    }

    const gtPhong = hoSo.quyDinh?.gioiTinhYeuCau;
    if (gtPhong) {
      if (khachChinh.gioiTinh && chuanHoaGioiTinh(khachChinh.gioiTinh) !== chuanHoaGioiTinh(gtPhong)) {
        msgs.push(`Giới tính người thuê chính không phù hợp phòng (yêu cầu: ${gtPhong})`);
      }
      thanhVien.forEach((tv) => {
        if (tv.gioiTinh && chuanHoaGioiTinh(tv.gioiTinh) !== chuanHoaGioiTinh(gtPhong)) {
          msgs.push(`Thành viên ${tv.hoTen || tv.cccd}: giới tính không phù hợp phòng`);
        }
      });
    }

    if (!khachChinh.daDoiChieuCCCD) msgs.push('Chưa đối chiếu CCCD người thuê chính');
    thanhVien.forEach((tv) => {
      if (!tv.daDoiChieuCCCD) msgs.push(`Chưa đối chiếu CCCD: ${tv.hoTen || tv.cccd}`);
    });

    return msgs;
  }, [hoSo, khachChinh, thanhVien]);

  const capNhatKhachChinh = (field, value) => {
    setKhachChinh((prev) => ({ ...prev, [field]: value }));
  };

  const themThanhVien = () => {
    if (!tvMoi.cccd || !tvMoi.hoTen.trim()) {
      hienToast('Vui lòng nhập CCCD và họ tên thành viên', 'error');
      return;
    }
    if (String(tvMoi.cccd) === String(khachChinh.cccd)) {
      hienToast('CCCD trùng với người thuê chính', 'error');
      return;
    }
    if (thanhVien.some((tv) => String(tv.cccd) === String(tvMoi.cccd))) {
      hienToast('CCCD thành viên đã tồn tại trong danh sách', 'error');
      return;
    }
    setThanhVien((prev) => [...prev, { ...tvMoi }]);
    setTvMoi({ ...KHACH_TRONG });
    setShowThemTV(false);
  };

  const xoaThanhVien = async (cccd) => {
    if (!window.confirm('Xóa thành viên này khỏi danh sách?')) return;
    setThanhVien((prev) => prev.filter((tv) => String(tv.cccd) !== String(cccd)));
    try {
      await fetch(`/api/nhan-phong/${maDatCoc}/thanh-vien/${cccd}`, { method: 'DELETE' });
    } catch (err) {
      console.error(err);
    }
  };

  const capNhatThanhVien = (cccd, field, value) => {
    setThanhVien((prev) => prev.map((tv) =>
      String(tv.cccd) === String(cccd) ? { ...tv, [field]: value } : tv,
    ));
  };

  const taoPayload = () => ({
    khachChinh,
    thanhVien,
    laThuNhom: hoSo?.laThuNhom,
    ghiChu,
    maNV: nguoiDung?.maNV || null,
  });

  const luuNhap = async () => {
    setDangXuLy(true);
    try {
      const res = await fetch(`/api/nhan-phong/${maDatCoc}/luu-nhap`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taoPayload()),
      }).then((r) => r.json());
      if (res.ok) {
        hienToast('Đã lưu nháp thông tin nhận phòng');
        if (res.data) {
          setHoSo(res.data);
          setKhachChinh(res.data.khachChinh);
          setThanhVien(res.data.thanhVien || []);
        }
      } else {
        hienToast(res.error || 'Lưu nháp thất bại', 'error');
      }
    } catch (err) {
      hienToast('Lỗi kết nối máy chủ', 'error');
    } finally {
      setDangXuLy(false);
    }
  };

  const xacNhanGhiNhan = async () => {
    setDangXuLy(true);
    setLoi([]);
    try {
      const res = await fetch(`/api/nhan-phong/${maDatCoc}/xac-nhan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taoPayload()),
      }).then((r) => r.json());

      if (res.ok) {
        hienToast(res.message || 'Ghi nhận thành công!');
        setTimeout(() => navigate(ROUTES.nhanPhong), 1500);
      } else {
        setLoi(res.loi || [res.error || 'Xác nhận thất bại']);
        hienToast('Vui lòng kiểm tra lại thông tin', 'error');
      }
    } catch (err) {
      hienToast('Lỗi kết nối máy chủ', 'error');
    } finally {
      setDangXuLy(false);
    }
  };

  if (dangTai) {
    return (
      <KhungNhanVien nguoiDung={nguoiDung} dangXuat={dangXuat}>
        <div className="qt-loading" style={{ padding: 48 }}>Đang tải hồ sơ nhận phòng...</div>
      </KhungNhanVien>
    );
  }

  if (!hoSo) {
    return (
      <KhungNhanVien nguoiDung={nguoiDung} dangXuat={dangXuat}>
        <div className="qt-empty">
          <p>Không tìm thấy hồ sơ đặt cọc.</p>
          <Link to={ROUTES.nhanPhong} className="qt-btn-outline">Quay lại danh sách</Link>
        </div>
      </KhungNhanVien>
    );
  }

  const tongNguoi = hoSo.laThuNhom ? 1 + thanhVien.length : 1;

  return (
    <KhungNhanVien nguoiDung={nguoiDung} dangXuat={dangXuat}>
      {toast && (
        <div className={`np-toast np-toast--${toast.type}`}>{toast.message}</div>
      )}

      <div className="qt-page-header">
        <div>
          <div className="np-breadcrumb">
            <Link to={ROUTES.nhanPhong}>Nhận phòng</Link>
            <span>›</span>
            <span>{hoSo.maPhieu}</span>
          </div>
          <h1>Ghi nhận thông tin nhận phòng</h1>
          <p>Kiểm tra đặt cọc, đối chiếu CCCD và thu thập thông tin cư trú trước khi chuyển Quản lý kiểm tra.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="qt-btn-outline" disabled={dangXuLy} onClick={luuNhap}>
            Lưu nháp
          </button>
          <button type="button" className="qt-btn-primary" disabled={dangXuLy || !hoSo.coTheGhiNhan} onClick={xacNhanGhiNhan}>
            {dangXuLy ? 'Đang xử lý...' : 'Xác nhận ghi nhận →'}
          </button>
        </div>
      </div>

      {(canhBao.length > 0 || loi.length > 0) && (
        <div className="np-alert">
          <span className="material-symbols-outlined">warning</span>
          <ul>
            {[...new Set([...canhBao, ...loi])].map((msg) => <li key={msg}>{msg}</li>)}
          </ul>
        </div>
      )}

      <div className="np-grid">
        {/* Cột trái: Thông tin đặt cọc */}
        <aside className="np-sidebar">
          <div className="np-card">
            <div className="np-card-head">
              <h2>Thông tin đặt cọc</h2>
              <span className="qt-chip qt-chip--green">{hoSo.trangThai}</span>
            </div>
            <dl className="np-info-list">
              <div><dt>Mã phiếu cọc</dt><dd><strong>{hoSo.maPhieu}</strong></dd></div>
              <div><dt>Ngày đặt cọc</dt><dd>{hoSo.thongTinDatCoc.ngayDatCoc}</dd></div>
              <div><dt>Lịch nhận phòng</dt><dd>{hoSo.thongTinDatCoc.ngayHenNhanPhong || '—'}</dd></div>
              <div><dt>Thời hạn thuê</dt><dd>{hoSo.thongTinDatCoc.thoiHanThue} tháng</dd></div>
              <div><dt>Phòng / Giường</dt><dd><strong>{hoSo.phong.tenPhong}</strong></dd></div>
              <div><dt>Chi nhánh</dt><dd>{hoSo.phong.tenChiNhanh}</dd></div>
              <div><dt>Loại thuê</dt><dd>{hoSo.loaiThue}</dd></div>
              <div><dt>Số giường đã cọc</dt><dd>{hoSo.soGiuongThue}</dd></div>
              <div><dt>Số tiền cọc</dt><dd className="np-amount">{hoSo.thongTinDatCoc.soTienCocFmt}</dd></div>
            </dl>
          </div>

          <div className="np-card np-rules">
            <h3>Quy định phòng</h3>
            <ul>
              <li>
                <span>Giới tính yêu cầu</span>
                <strong>{hoSo.quyDinh.gioiTinhYeuCau || 'Không ràng buộc'}</strong>
              </li>
              <li>
                <span>Sức chứa tối đa</span>
                <strong>{hoSo.quyDinh.sucChuaToiDa} người</strong>
              </li>
              <li>
                <span>Khu vực / Chi nhánh</span>
                <strong>{hoSo.quyDinh.tenChiNhanh}</strong>
              </li>
            </ul>
            <div className="np-counter">
              <span>Số người đang khai báo</span>
              <strong className={tongNguoi > hoSo.gioiHanNguoi ? 'np-over' : 'np-ok'}>
                {tongNguoi} / {hoSo.gioiHanNguoi}
              </strong>
            </div>
          </div>
        </aside>

        {/* Cột phải: Form thông tin cư trú */}
        <div className="np-main">
          <div className="np-card">
            <div className="np-card-head">
              <h2>Người thuê chính {hoSo.laThuNhom && <span className="np-tag">Đại diện nhóm</span>}</h2>
            </div>

            <div className="np-form-grid">
              <div className="qt-field">
                <label>CCCD / CMND *</label>
                <input
                  value={khachChinh.cccd}
                  onChange={(e) => capNhatKhachChinh('cccd', e.target.value.replace(/\D/g, ''))}
                  placeholder="Nhập số CCCD"
                  maxLength={12}
                />
              </div>
              <div className="qt-field">
                <label>Họ và tên *</label>
                <input
                  value={khachChinh.hoTen}
                  onChange={(e) => capNhatKhachChinh('hoTen', e.target.value)}
                  placeholder="Họ tên đầy đủ"
                />
              </div>
              <div className="qt-field">
                <label>Ngày sinh</label>
                <input
                  type="date"
                  value={khachChinh.ngaySinh}
                  onChange={(e) => capNhatKhachChinh('ngaySinh', e.target.value)}
                />
              </div>
              <div className="qt-field">
                <label>Giới tính *</label>
                <select value={khachChinh.gioiTinh} onChange={(e) => capNhatKhachChinh('gioiTinh', e.target.value)}>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                </select>
              </div>
              <div className="qt-field">
                <label>Quốc tịch</label>
                <input
                  value={khachChinh.quocTich}
                  onChange={(e) => capNhatKhachChinh('quocTich', e.target.value)}
                />
              </div>
              <div className="qt-field">
                <label>Số điện thoại *</label>
                <input
                  value={khachChinh.sdt}
                  onChange={(e) => capNhatKhachChinh('sdt', e.target.value)}
                  placeholder="09xxxxxxxx"
                />
              </div>
              <div className="qt-field np-full">
                <label>Địa chỉ thường trú *</label>
                <input
                  value={khachChinh.diaChi}
                  onChange={(e) => capNhatKhachChinh('diaChi', e.target.value)}
                  placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
                />
              </div>
              <div className="qt-field">
                <label>Email</label>
                <input
                  type="email"
                  value={khachChinh.email}
                  onChange={(e) => capNhatKhachChinh('email', e.target.value)}
                />
              </div>
              <div className="qt-field np-verify">
                <label className="np-check-label">
                  <input
                    type="checkbox"
                    checked={khachChinh.daDoiChieuCCCD}
                    onChange={(e) => capNhatKhachChinh('daDoiChieuCCCD', e.target.checked)}
                  />
                  <span>Đã đối chiếu CCCD với giấy tờ gốc</span>
                </label>
              </div>
            </div>
          </div>

          {hoSo.laThuNhom && (
            <div className="np-card">
              <div className="np-card-head">
                <h2>Thành viên ở cùng ({thanhVien.length})</h2>
                <button type="button" className="qt-btn-outline" style={{ padding: '6px 14px', fontSize: 13 }} onClick={() => setShowThemTV(true)}>
                  + Thêm thành viên
                </button>
              </div>

              {showThemTV && (
                <div className="np-add-member">
                  <div className="np-form-grid">
                    <div className="qt-field">
                      <label>CCCD *</label>
                      <input value={tvMoi.cccd} onChange={(e) => setTvMoi((p) => ({ ...p, cccd: e.target.value.replace(/\D/g, '') }))} />
                    </div>
                    <div className="qt-field">
                      <label>Họ tên *</label>
                      <input value={tvMoi.hoTen} onChange={(e) => setTvMoi((p) => ({ ...p, hoTen: e.target.value }))} />
                    </div>
                    <div className="qt-field">
                      <label>Giới tính</label>
                      <select value={tvMoi.gioiTinh} onChange={(e) => setTvMoi((p) => ({ ...p, gioiTinh: e.target.value }))}>
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                      </select>
                    </div>
                    <div className="qt-field">
                      <label>SĐT</label>
                      <input value={tvMoi.sdt} onChange={(e) => setTvMoi((p) => ({ ...p, sdt: e.target.value }))} />
                    </div>
                    <div className="qt-field np-full">
                      <label>Địa chỉ thường trú</label>
                      <input value={tvMoi.diaChi} onChange={(e) => setTvMoi((p) => ({ ...p, diaChi: e.target.value }))} />
                    </div>
                    <div className="qt-field np-verify">
                      <label className="np-check-label">
                        <input
                          type="checkbox"
                          checked={tvMoi.daDoiChieuCCCD}
                          onChange={(e) => setTvMoi((p) => ({ ...p, daDoiChieuCCCD: e.target.checked }))}
                        />
                        <span>Đã đối chiếu CCCD</span>
                      </label>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button type="button" className="qt-btn-primary" style={{ padding: '8px 16px' }} onClick={themThanhVien}>Thêm</button>
                    <button type="button" className="qt-btn-outline" style={{ padding: '8px 16px' }} onClick={() => setShowThemTV(false)}>Hủy</button>
                  </div>
                </div>
              )}

              {thanhVien.length === 0 ? (
                <p className="np-empty-members">Chưa có thành viên nào. Bấm &quot;Thêm thành viên&quot; để khai báo người ở cùng.</p>
              ) : (
                <div className="table-responsive">
                  <table className="qt-table">
                    <thead>
                      <tr>
                        <th>Họ tên</th>
                        <th>CCCD</th>
                        <th>Giới tính</th>
                        <th>SĐT</th>
                        <th>Địa chỉ</th>
                        <th>CCCD</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {thanhVien.map((tv) => (
                        <tr key={tv.cccd}>
                          <td><input className="np-inline-input" value={tv.hoTen} onChange={(e) => capNhatThanhVien(tv.cccd, 'hoTen', e.target.value)} /></td>
                          <td className="np-mono">{tv.cccd}</td>
                          <td>
                            <select className="np-inline-select" value={tv.gioiTinh} onChange={(e) => capNhatThanhVien(tv.cccd, 'gioiTinh', e.target.value)}>
                              <option value="Nam">Nam</option>
                              <option value="Nữ">Nữ</option>
                            </select>
                          </td>
                          <td><input className="np-inline-input" value={tv.sdt} onChange={(e) => capNhatThanhVien(tv.cccd, 'sdt', e.target.value)} /></td>
                          <td><input className="np-inline-input" value={tv.diaChi} onChange={(e) => capNhatThanhVien(tv.cccd, 'diaChi', e.target.value)} /></td>
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={tv.daDoiChieuCCCD}
                              onChange={(e) => capNhatThanhVien(tv.cccd, 'daDoiChieuCCCD', e.target.checked)}
                            />
                          </td>
                          <td>
                            <button type="button" className="qt-btn-icon" onClick={() => xoaThanhVien(tv.cccd)} title="Xóa">
                              <span className="material-symbols-outlined">delete</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <div className="np-card">
            <div className="qt-field">
              <label>Ghi chú Sale</label>
              <textarea
                className="np-textarea"
                rows={3}
                value={ghiChu}
                onChange={(e) => setGhiChu(e.target.value)}
                placeholder="Ghi chú về giấy tờ, yêu cầu đặc biệt khi nhận phòng..."
              />
            </div>
          </div>

          <div className="np-actions">
            <Link to={ROUTES.nhanPhong} className="qt-btn-outline">← Quay lại danh sách</Link>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="qt-btn-outline" disabled={dangXuLy} onClick={luuNhap}>Lưu nháp</button>
              <button type="button" className="qt-btn-primary" disabled={dangXuLy || !hoSo.coTheGhiNhan} onClick={xacNhanGhiNhan}>
                {dangXuLy ? 'Đang xử lý...' : 'Xác nhận ghi nhận → Chuyển kiểm tra ĐK lưu trú'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </KhungNhanVien>
  );
}
