import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import KhungNhanVien from '../components/KhungNhanVien';

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
  const [searchParams] = useSearchParams();
  const phongQuery = searchParams.get('phong') || '';
  const [thongKe, setThongKe] = useState({ tongPhong: 0, phongTrong: 0, dangDatCoc: 0, tyLeLapDay: 0 });
  const [danhSach, setDanhSach] = useState([]);
  const [chiNhanh, setChiNhanh] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [boLoc, setBoLoc] = useState({ maCN: '', trangThai: '', loaiPhong: '', timKiem: '', page: 1, limit: 1000 });

  // State cho modal chi tiết phòng
  const [showModalChiTiet, setShowModalChiTiet] = useState(false);
  const [phongDangXem, setPhongDangXem] = useState(null);

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

  const xuLyXemChiTiet = (phong) => {
    setPhongDangXem(phong);
    setShowModalChiTiet(true);
  };

  const danhSachHienThi = useMemo(() => {
    if (!phongQuery) return danhSach;
    return [...danhSach].sort((a, b) => {
      const aDangDuocChon = String(a.maPhong) === phongQuery;
      const bDangDuocChon = String(b.maPhong) === phongQuery;
      return Number(bDangDuocChon) - Number(aDangDuocChon);
    });
  }, [danhSach, phongQuery]);

  return (
    <KhungNhanVien nguoiDung={nguoiDung} dangXuat={dangXuat}>
      <div className="qt-page-header">
        <div>
          <h1>Quản lý Phòng &amp; Giường</h1>
          <p>Theo dõi hiện trạng, đặt cọc và lập hợp đồng theo từng phòng.</p>
          <p className="qt-room-auto-note">
            <span className="material-symbols-outlined">sync</span>
            Trạng thái được hệ thống tự động đồng bộ từ đặt cọc và hợp đồng.
          </p>
        </div>
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
          {danhSachHienThi.map((p) => {
            const dangDuocChon = String(p.maPhong) === phongQuery;
            return (
              <div key={p.maPhong} className={`qt-room-card${dangDuocChon ? ' qt-room-card--focused' : ''}`}>
                <div className="qt-room-card-header">
                  <div>
                    <p className="qt-room-meta">{p.loaiPhong}</p>
                    <h3>P.{p.maPhong}</h3>
                  </div>
                  <div className="qt-room-card-badges">
                    {dangDuocChon && <span className="qt-focus-badge">Phòng đang xem</span>}
                    <span className={`qt-chip qt-chip--${layChipTrangThai(p.trangThai)}`}>{p.trangThai}</span>
                  </div>
                </div>
                <p className="qt-room-meta">{p.chiNhanh} · Phòng {p.gioiTinhYeuCau} · Sức chứa {p.sucChua}</p>
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
                <div className="qt-room-actions" style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" className="qt-btn-outline" style={{ flex: 1 }} onClick={() => xuLyXemChiTiet(p)}>Chi tiết</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Chi tiết phòng */}
      {showModalChiTiet && phongDangXem && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff', borderRadius: '24px', width: '500px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
            padding: '32px', border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Phòng P.{phongDangXem.maPhong}</h3>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>{phongDangXem.chiNhanh} · Phòng {phongDangXem.gioiTinhYeuCau} · {phongDangXem.loaiPhong}</p>
              </div>
              <button type="button" onClick={() => { setShowModalChiTiet(false); setPhongDangXem(null); }} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', color: '#64748b', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '28px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: '#f8fafc', padding: '16px', borderRadius: '16px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>Tình trạng phòng</span>
                  <span style={{
                    fontSize: '13.5px', fontWeight: '800',
                    color: phongDangXem.trangThai === 'Trống' ? '#16a34a' : (phongDangXem.trangThai === 'Đang thuê' ? '#dc2626' : '#d97706')
                  }}>{phongDangXem.trangThai}</span>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>Giới tính yêu cầu</span>
                  <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>{phongDangXem.gioiTinhYeuCau}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>Giá thuê gốc</span>
                  <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>
                    {phongDangXem.soGiuong > 1 
                      ? `${(phongDangXem.giaThueSo / phongDangXem.soGiuong).toLocaleString('vi-VN')}đ/giường/tháng` 
                      : `${phongDangXem.giaThueSo.toLocaleString('vi-VN')}đ/tháng`}
                  </strong>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>Hiện trạng chỗ</span>
                  <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>{phongDangXem.hienTrang} (Giường)</strong>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>Tỷ lệ lấp đầy</span>
                  <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>{phongDangXem.tyLe}%</strong>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Chi tiết danh sách giường</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(phongDangXem.danhSachGiuong || []).map((giuong) => {
                    const trangThaiGiuong = giuong.trangThai;
                    return (
                      <div key={giuong.maGiuong} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '12px 16px', borderRadius: '12px', border: '1px solid #f1f5f9',
                        background: '#ffffff'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span className="material-symbols-outlined" style={{ color: '#94a3b8', fontSize: '20px' }}>single_bed</span>
                          <strong style={{ fontSize: '14px', color: '#334155' }}>Giường {giuong.maGiuong}</strong>
                        </div>
                        <span style={{
                          fontSize: '12px', fontWeight: '700', padding: '4px 8px', borderRadius: '6px',
                          background: trangThaiGiuong === 'Trống' ? '#f0fdf4' : (trangThaiGiuong === 'Đang thuê' ? '#fef2f2' : (trangThaiGiuong === 'Đã đặt cọc' ? '#fffbeb' : '#f1f5f9')),
                          color: trangThaiGiuong === 'Trống' ? '#15803d' : (trangThaiGiuong === 'Đang thuê' ? '#b91c1c' : (trangThaiGiuong === 'Đã đặt cọc' ? '#b45309' : '#475569'))
                        }}>{trangThaiGiuong}</span>
                      </div>
                    );
                  })}
                  {(phongDangXem.danhSachGiuong || []).length === 0 && (
                    <p className="qt-room-meta">Phòng này chưa có dữ liệu giường.</p>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
              <button type="button" onClick={() => { setShowModalChiTiet(false); setPhongDangXem(null); }} className="qt-btn-primary" style={{ padding: '10px 24px', borderRadius: '10px', fontWeight: '700' }}>Đóng lại</button>
            </div>
          </div>
        </div>
      )}

      {false && phongDangXem && (
        <div className="qt-modal-overlay" onClick={() => setPhongDangXem(null)}>
          <div className="qt-room-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="qt-room-detail-head">
              <div>
                <h2>Phòng P.{phongDangXem.maPhong}</h2>
                <p>{phongDangXem.chiNhanh} · Phòng · {phongDangXem.loaiPhong}</p>
              </div>
              <button type="button" className="qt-room-detail-close" onClick={() => setPhongDangXem(null)} aria-label="Đóng">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="qt-room-detail-summary">
              <div>
                <span>Tình trạng phòng</span>
                <strong className={`qt-room-state qt-room-state--${layChipTrangThai(phongDangXem.trangThai)}`}>
                  {phongDangXem.trangThai}
                </strong>
              </div>
              <div>
                <span>Giá thuê gốc</span>
                <strong>{phongDangXem.giaThue}{phongDangXem.loaiPhong?.includes('Giường') ? '/giường/tháng' : '/tháng'}</strong>
              </div>
              <div>
                <span>Hiện trạng chỗ</span>
                <strong>{phongDangXem.hienTrang} (Giường)</strong>
              </div>
              <div>
                <span>Tỷ lệ lấp đầy</span>
                <strong>{phongDangXem.tyLe}%</strong>
              </div>
            </div>

            <div className="qt-room-detail-section">
              <h3>Chi tiết danh sách giường</h3>
              {Number(phongDangXem.soGiuong || 0) > 0 ? (
                <div className="qt-bed-summary">
                  <span>Tổng giường: {phongDangXem.soGiuong}</span>
                  <span>Giường trống: {phongDangXem.soGiuongTrong}</span>
                  {phongDangXem.hetHanCoc && <span>Hết hạn cọc: {phongDangXem.hetHanCoc}</span>}
                </div>
              ) : (
                <p>Phòng này chưa có dữ liệu giường.</p>
              )}
            </div>

            <div className="qt-room-detail-footer">
              <button type="button" className="qt-btn-primary" onClick={() => setPhongDangXem(null)}>Đóng lại</button>
            </div>
          </div>
        </div>
      )}
    </KhungNhanVien>
  );
}
