import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import KhungNhanVien from '../components/KhungNhanVien';
import { ROUTES } from '../config/routes';

function layChipTrangThai(trangThai) {
  const map = {
    'Trống': 'green',
    'Đang thuê': 'red',
    'Đã đặt cọc': 'orange',
    'Đóng cửa': 'gray',
  };
  return map[trangThai] || 'gray';
}

export default function DanhSachPhongGiuong({ nguoiDung, dangXuat }) {
  const [thongKe, setThongKe] = useState({ tongPhong: 0, phongTrong: 0, dangDatCoc: 0, tyLeLapDay: 0 });
  const [danhSach, setDanhSach] = useState([]);
  const [chiNhanh, setChiNhanh] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [boLoc, setBoLoc] = useState({ maCN: '', trangThai: '', loaiPhong: '', timKiem: '', page: 1 });
  const [tong, setTong] = useState(0);

  useEffect(() => {
    taiChiNhanh();
  }, []);

  useEffect(() => {
    taiDuLieu();
  }, [boLoc]);

  const taiChiNhanh = async () => {
    const res = await fetch('/api/chi-nhanh').then((r) => r.json());
    if (res.ok) setChiNhanh(res.data);
  };

  const taiDuLieu = async () => {
    setDangTai(true);
    try {
      const qs = new URLSearchParams(
        Object.fromEntries(Object.entries(boLoc).filter(([, v]) => v !== '')),
      );
      const [resTK, resDS] = await Promise.all([
        fetch('/api/phong-giuong/thong-ke').then((r) => r.json()),
        fetch(`/api/phong-giuong?${qs}`).then((r) => r.json()),
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

  const capNhatBoLoc = (key, value) => {
    setBoLoc((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  return (
    <KhungNhanVien nguoiDung={nguoiDung} dangXuat={dangXuat}>
      <div className="qt-page-header">
        <div>
          <h1>Quản lý Phòng &amp; Giường</h1>
          <p>Theo dõi hiện trạng, đặt cọc và lập hợp đồng theo từng phòng.</p>
        </div>
        <button type="button" className="qt-btn-primary">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          Thêm phòng mới
        </button>
      </div>

      <div className="qt-stats">
        <div className="qt-stat-card"><p>Tổng phòng</p><strong>{thongKe.tongPhong}</strong></div>
        <div className="qt-stat-card"><p>Phòng trống</p><strong>{thongKe.phongTrong}</strong></div>
        <div className="qt-stat-card"><p>Đang đặt cọc</p><strong>{thongKe.dangDatCoc}</strong></div>
        <div className="qt-stat-card"><p>Tỷ lệ lấp đầy</p><strong>{thongKe.tyLeLapDay}%</strong></div>
      </div>

      <div className="qt-filter-card">
        <div className="qt-field">
          <label>Chi nhánh</label>
          <select value={boLoc.maCN} onChange={(e) => capNhatBoLoc('maCN', e.target.value)}>
            <option value="">Tất cả</option>
            {chiNhanh.map((cn) => (
              <option key={cn.MaCN} value={cn.MaCN}>{cn.TenCN}</option>
            ))}
          </select>
        </div>
        <div className="qt-field">
          <label>Tình trạng</label>
          <select value={boLoc.trangThai} onChange={(e) => capNhatBoLoc('trangThai', e.target.value)}>
            <option value="">Tất cả</option>
            <option value="Trống">Trống</option>
            <option value="Đang thuê">Đang thuê</option>
            <option value="Đã đặt cọc">Đã đặt cọc</option>
          </select>
        </div>
        <div className="qt-field">
          <label>Loại phòng</label>
          <select value={boLoc.loaiPhong} onChange={(e) => capNhatBoLoc('loaiPhong', e.target.value)}>
            <option value="">Tất cả</option>
            <option value="Nguyên">Nguyên căn</option>
            <option value="Giường">Giường ghép</option>
          </select>
        </div>
        <div className="qt-field qt-search-wrap">
          <label>Tìm kiếm</label>
          <span className="material-symbols-outlined">search</span>
          <input
            placeholder="Tìm số phòng..."
            value={boLoc.timKiem}
            onChange={(e) => capNhatBoLoc('timKiem', e.target.value)}
          />
        </div>
      </div>

      {dangTai ? (
        <div className="qt-loading">Đang tải dữ liệu...</div>
      ) : danhSach.length === 0 ? (
        <div className="qt-empty">Không có phòng phù hợp bộ lọc.</div>
      ) : (
        <div className="qt-room-grid">
          {danhSach.map((p) => (
            <div key={p.maPhong} className="qt-room-card">
              <div className="qt-room-card-header">
                <div>
                  <p className="qt-room-meta">{p.loaiPhong}</p>
                  <h3>P.{p.maPhong}</h3>
                </div>
                <span className={`qt-chip qt-chip--${layChipTrangThai(p.trangThai)}`}>{p.trangThai}</span>
              </div>
              <p className="qt-room-meta">{p.chiNhanh} · Sức chứa {p.sucChua}</p>
              <p className="qt-room-meta"><strong>{p.giaThue}</strong>{p.loaiPhong?.includes('Giường') ? '/giường' : '/tháng'}</p>
              {p.hetHanCoc && <p className="qt-room-meta">Hết hạn cọc: {p.hetHanCoc}</p>}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span>Hiện trạng {p.hienTrang}</span>
                  <span>{p.tyLe}%</span>
                </div>
                <div className="qt-progress">
                  <div className="qt-progress-bar" style={{ width: `${p.tyLe}%` }} />
                </div>
              </div>
              <div className="qt-room-actions">
                <button type="button" className="qt-btn-outline">Chi tiết</button>
                {p.trangThai === 'Trống' && <button type="button" className="qt-btn-primary">Đặt phòng</button>}
                {p.trangThai === 'Đã đặt cọc' && (
                  <Link to={ROUTES.hopDong} className="qt-btn-primary" style={{ textAlign: 'center', textDecoration: 'none' }}>Lập HĐ</Link>
                )}
                {p.trangThai === 'Đang thuê' && <button type="button" className="qt-btn-primary">Quản lý</button>}
              </div>
            </div>
          ))}
          <button type="button" className="qt-room-card qt-room-card--add">
            <span className="material-symbols-outlined" style={{ fontSize: 32 }}>add_circle</span>
            <span>Thêm phòng mới</span>
          </button>
        </div>
      )}

      {!dangTai && tong > boLoc.page * 12 && (
        <div className="qt-pagination" style={{ marginTop: 24, background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb' }}>
          <span>Hiển thị {danhSach.length} / {tong} phòng</span>
          <div className="qt-pagination-btns">
            <button type="button" disabled={boLoc.page <= 1} onClick={() => setBoLoc((p) => ({ ...p, page: p.page - 1 }))}>Trước</button>
            <button type="button" onClick={() => setBoLoc((p) => ({ ...p, page: p.page + 1 }))}>Sau</button>
          </div>
        </div>
      )}
    </KhungNhanVien>
  );
}
