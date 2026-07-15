import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import KhungNhanVien from '../components/KhungNhanVien';
import { ROUTES } from '../config/routes';

function layChipTrangThai(trangThai) {
  const map = {
    'Đặt cọc thành công': 'green',
    'Đã cọc': 'green',
    'Đã thanh toán': 'blue',
  };
  return map[trangThai] || 'orange';
}

// Loại thuê nào cần khai báo thành viên nhóm
// - Thuê nguyên phòng: luôn cần (laThuNhom = true)
// - Thuê giường lẻ + SoGiuongThue > 1: cần (nhóm nhiều giường)
// - Thuê giường lẻ + SoGiuongThue = 1: KHÔNG cần (cá nhân đơn)
const LOAI_THUE_OPTIONS = [
  { value: '', label: 'Tất cả loại thuê' },
  { value: 'Thuê giường lẻ', label: 'Thuê giường lẻ' },
  { value: 'Thuê nguyên phòng', label: 'Thuê nguyên phòng' },
];

export default function DanhSachNhanPhong({ nguoiDung, dangXuat }) {
  const navigate = useNavigate();
  const [danhSach, setDanhSach] = useState([]);
  const [chiNhanh, setChiNhanh] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [tong, setTong] = useState(0);
  const [loiTai, setLoiTai] = useState('');
  const [boLoc, setBoLoc] = useState({ timKiem: '', maCN: '', loaiThue: '', page: 1, limit: 20 });

  useEffect(() => {
    fetch('/api/chi-nhanh').then((r) => r.json()).then((res) => {
      if (res.ok) setChiNhanh(res.data);
    });
  }, []);

  useEffect(() => {
    taiDanhSach();
  }, [boLoc]);

  const taiDanhSach = async () => {
    setDangTai(true);
    setLoiTai('');
    try {
      const qs = new URLSearchParams(
        Object.fromEntries(Object.entries(boLoc).filter(([, v]) => v !== '')),
      );
      const res = await fetch(`/api/nhan-phong?${qs}`);
      const json = await res.json();
      if (res.ok && json.ok) {
        setDanhSach(json.danhSach);
        setTong(json.tong);
      } else {
        setDanhSach([]);
        setTong(0);
        setLoiTai(json.error || `Không tải được dữ liệu (HTTP ${res.status}). Hãy restart server: npm run dev`);
      }
    } catch (err) {
      console.error(err);
      setDanhSach([]);
      setLoiTai('Không kết nối được API backend. Chạy lại: npm run dev');
    } finally {
      setDangTai(false);
    }
  };

  return (
    <KhungNhanVien nguoiDung={nguoiDung} dangXuat={dangXuat}>
      <div className="qt-page-header">
        <div>
          <h1>Ghi nhận nhận phòng</h1>
          <p>Danh sách khách đã đặt cọc, chờ Sale kiểm tra hồ sơ và thu thập thông tin cư trú.</p>
        </div>
      </div>

      <div className="qt-filter-card">
        <div className="qt-field" style={{ gridColumn: 'span 2' }}>
          <label>Tìm kiếm</label>
          <div className="qt-search-wrap">
            <span className="material-symbols-outlined">search</span>
            <input
              placeholder="Tên, SĐT, CCCD, mã phiếu cọc..."
              value={boLoc.timKiem}
              onChange={(e) => setBoLoc((p) => ({ ...p, timKiem: e.target.value, page: 1 }))}
            />
          </div>
        </div>
        <div className="qt-field">
          <label>Chi nhánh</label>
          <select value={boLoc.maCN} onChange={(e) => setBoLoc((p) => ({ ...p, maCN: e.target.value, page: 1 }))}>
            <option value="">Tất cả</option>
            {chiNhanh.map((cn) => (
              <option key={cn.MaCN} value={cn.MaCN}>{cn.TenCN}</option>
            ))}
          </select>
        </div>
        <div className="qt-field" data-tip="Lọc theo loại hình thuê. Thuê nguyên phòng và nhóm nhiều giường sẽ yêu cầu khai báo thành viên.">
          <label>Loại thuê</label>
          <select value={boLoc.loaiThue} onChange={(e) => setBoLoc((p) => ({ ...p, loaiThue: e.target.value, page: 1 }))}>
            {LOAI_THUE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <button type="button" className="qt-btn-outline" onClick={taiDanhSach}>Làm mới</button>
      </div>

      <div className="qt-table-wrap">
        {loiTai && (
          <div className="qt-alert" style={{ margin: '0 0 16px', borderRadius: 8 }}>
            <span className="material-symbols-outlined">error</span>
            {loiTai}
          </div>
        )}
        {dangTai ? (
          <div className="qt-loading">Đang tải...</div>
        ) : danhSach.length === 0 ? (
          <div className="qt-empty">
            <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#94a3b8' }}>event_busy</span>
            <p>Không có hồ sơ nào chờ ghi nhận nhận phòng.</p>
          </div>
        ) : (
          <>
            <table className="qt-table">
              <thead>
                <tr>
                  <th style={{ whiteSpace: 'nowrap' }} data-tip="Mã định danh phiếu đặt cọc trong hệ thống">Mã phiếu cọc</th>
                  <th>Khách hàng</th>
                  <th style={{ whiteSpace: 'nowrap' }} data-tip="Phòng / giường đã được đặt cọc">Phòng / Giường</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Chi nhánh</th>
                  <th style={{ whiteSpace: 'nowrap' }} data-tip="Ngày/giờ khách dự kiến vào ở">Lịch nhận phòng</th>
                  <th style={{ whiteSpace: 'nowrap' }} data-tip="Thuê giường lẻ (cá nhân) hoặc Thuê nguyên phòng. Nhóm cần khai báo thành viên">Loại thuê</th>
                  <th style={{ whiteSpace: 'nowrap' }} data-tip="Số giường đã cọc">Số giường</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Tiền cọc</th>
                  <th style={{ whiteSpace: 'nowrap' }} data-tip="Trạng thái phiếu đặt cọc">Trạng thái</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {danhSach.map((item) => (
                  <tr
                    key={item.maDatCoc}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`${ROUTES.nhanPhong}/${item.maDatCoc}`)}
                  >
                    <td><strong style={{ color: 'var(--primary-color)' }}>{item.maPhieu}</strong></td>
                    <td>
                      <div>{item.hoTen}</div>
                      <span style={{ fontSize: 12, color: '#64748b' }}>{item.sdt}</span>
                    </td>
                    <td>{item.phong}</td>
                    <td>{item.chiNhanh}</td>
                    <td>{item.ngayHenNhanPhong || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                        <span
                          className={`qt-chip ${item.loaiThue === 'Thuê nguyên phòng' ? 'qt-chip--blue' : 'qt-chip--gray'}`}
                          style={{ fontSize: 11, whiteSpace: 'nowrap' }}
                        >
                          {item.loaiThue || 'Thuê giường lẻ'}
                        </span>
                        {item.laThuNhom && (
                          <span
                            className="qt-chip qt-chip--blue"
                            style={{ fontSize: 10, whiteSpace: 'nowrap' }}
                            title="Thuê theo nhóm — cần khai báo danh sách thành viên"
                          >
                            Nhóm
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{item.soGiuongThue}</td>
                    <td>{item.soTienCocFmt}</td>
                    <td>
                      <span className={`qt-chip qt-chip--${layChipTrangThai(item.trangThai)}`}>
                        {item.trangThai}
                      </span>
                    </td>
                    <td>
                      <div
                        className="np-tooltip-wrap"
                        data-tip={item.laThuNhom
                          ? 'Mở hồ sơ để ghi nhận thông tin nhận phòng. Cần khai báo đầy đủ thành viên nhóm.'
                          : 'Mở hồ sơ để ghi nhận thông tin nhận phòng và đối chiếu giấy tờ tùy thân.'}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="qt-btn-outline"
                          style={{ padding: '6px 14px', fontSize: 12, whiteSpace: 'nowrap' }}
                          onClick={() => navigate(`${ROUTES.nhanPhong}/${item.maDatCoc}`)}
                        >
                          Ghi nhận
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="qt-pagination">
              <span>Hiển thị {danhSach.length} / {tong} hồ sơ</span>
            </div>
          </>
        )}
      </div>
    </KhungNhanVien>
  );
}
