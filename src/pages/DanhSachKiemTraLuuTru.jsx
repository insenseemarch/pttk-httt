import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import KhungNhanVien from '../components/KhungNhanVien';
import { ROUTES } from '../config/routes';

export default function DanhSachKiemTraLuuTru({ nguoiDung, dangXuat }) {
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
      const res = await fetch(`/api/kiem-tra-luu-tru?${qs}`);
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
          <h1>Kiểm tra điều kiện lưu trú</h1>
          <p>Danh sách hồ sơ Sale đã ghi nhận, chờ Quản lý kiểm tra điều kiện lưu trú trước khi lập hợp đồng.</p>
        </div>
      </div>

      <div className="qt-filter-card">
        <div className="qt-field qt-search-wrap" style={{ gridColumn: 'span 2' }}>
          <label>Tìm kiếm</label>
          <span className="material-symbols-outlined">search</span>
          <input
            placeholder="Tên, SĐT, CCCD, mã phiếu cọc..."
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
            <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#94a3b8' }}>fact_check</span>
            <p>Không có hồ sơ nào chờ kiểm tra điều kiện lưu trú.</p>
          </div>
        ) : (
          <>
            <table className="qt-table">
              <thead>
                <tr>
                  <th>Mã phiếu cọc</th>
                  <th>Khách hàng</th>
                  <th>Phòng / Giường</th>
                  <th>Chi nhánh</th>
                  <th>Ngày chuyển kiểm tra</th>
                  <th>Số giường</th>
                  <th>Tiền cọc</th>
                  <th>Trạng thái</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {danhSach.map((item) => (
                  <tr
                    key={item.maDatCoc}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`${ROUTES.kiemTraLuuTru}/${item.maDatCoc}`)}
                  >
                    <td><strong style={{ color: 'var(--primary-color)' }}>{item.maPhieu}</strong></td>
                    <td>
                      <div>{item.hoTen}</div>
                      <span style={{ fontSize: 12, color: '#64748b' }}>{item.sdt}</span>
                    </td>
                    <td>{item.phong}</td>
                    <td>{item.chiNhanh}</td>
                    <td>{item.ngayChuyenKiemTra || '—'}</td>
                    <td>
                      {item.soGiuongThue}
                      {item.laThuNhom && (
                        <span className="qt-chip qt-chip--blue" style={{ marginLeft: 6, fontSize: 10 }}>Nhóm</span>
                      )}
                    </td>
                    <td>{item.soTienCocFmt}</td>
                    <td>
                      <span className="qt-chip qt-chip--orange">{item.trangThai}</span>
                    </td>
                    <td>
                      <Link
                        to={`${ROUTES.kiemTraLuuTru}/${item.maDatCoc}`}
                        className="qt-btn-outline"
                        style={{ padding: '6px 12px', fontSize: 12, textDecoration: 'none' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        Kiểm tra
                      </Link>
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
