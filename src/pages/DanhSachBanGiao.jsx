import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import KhungNhanVien from '../components/KhungNhanVien';
import { ROUTES } from '../config/routes';

export default function DanhSachBanGiao({ nguoiDung, dangXuat }) {
  const navigate = useNavigate();
  const [danhSach, setDanhSach] = useState([]);
  const [chiNhanh, setChiNhanh] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [tong, setTong] = useState(0);
  const [loiTai, setLoiTai] = useState('');
  const [boLoc, setBoLoc] = useState({ timKiem: '', maCN: '' });

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
      const res = await fetch(`/api/ban-giao/cho-ban-giao?${qs}`);
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
          <h1>Bàn giao phòng</h1>
          <p>Danh sách hợp đồng đã thu đủ tiền kỳ đầu, chờ quản lý thực hiện bàn giao phòng/giường và tài sản cho khách.</p>
        </div>
      </div>

      <div className="qt-filter-card">
        <div className="qt-field qt-search-wrap" style={{ gridColumn: 'span 2' }}>
          <label>Tìm kiếm</label>
          <span className="material-symbols-outlined">search</span>
          <input
            placeholder="Tên khách, SĐT, CCCD, mã hợp đồng..."
            value={boLoc.timKiem}
            onChange={(e) => setBoLoc((p) => ({ ...p, timKiem: e.target.value }))}
          />
        </div>
        <div className="qt-field">
          <label>Chi nhánh</label>
          <select value={boLoc.maCN} onChange={(e) => setBoLoc((p) => ({ ...p, maCN: e.target.value }))}>
            <option value="">Tất cả</option>
            {chiNhanh.map((cn) => (
              <option key={cn.MaCN} value={cn.MaCN}>{cn.TenCN}</option>
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
            <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#94a3b8' }}>door_front</span>
            <p>Không có hợp đồng nào chờ bàn giao phòng.</p>
          </div>
        ) : (
          <>
            <table className="qt-table">
              <thead>
                <tr>
                  <th>Mã hợp đồng</th>
                  <th>Khách hàng</th>
                  <th>Phòng / Giường</th>
                  <th>Chi nhánh</th>
                  <th>Ngày bắt đầu thuê</th>
                  <th>Số giường</th>
                  <th>Giá thuê</th>
                  <th>Trạng thái</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {danhSach.map((item) => (
                  <tr
                    key={item.maHopDong}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`${ROUTES.banGiao}/${item.maHopDong}`)}
                  >
                    <td><strong style={{ color: 'var(--primary-color)' }}>{item.maHopDongFmt}</strong></td>
                    <td>
                      <div>{item.hoTen}</div>
                      <span style={{ fontSize: 12, color: '#64748b' }}>{item.sdt}</span>
                    </td>
                    <td>{item.phong}</td>
                    <td>{item.chiNhanh}</td>
                    <td>{item.ngayBatDau || '—'}</td>
                    <td>{item.soGiuong}</td>
                    <td>{item.giaThue}</td>
                    <td>
                      <span className="qt-chip qt-chip--green">{item.trangThai}</span>
                    </td>
                    <td>
                      <Link
                        to={`${ROUTES.banGiao}/${item.maHopDong}`}
                        className="qt-btn-outline"
                        style={{ padding: '6px 12px', fontSize: 12, textDecoration: 'none' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        Bàn giao
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="qt-pagination">
              <span>Hiển thị {danhSach.length} / {tong} hợp đồng</span>
            </div>
          </>
        )}
      </div>
    </KhungNhanVien>
  );
}
