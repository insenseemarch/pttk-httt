import { useEffect, useState } from 'react';
import KhungNhanVien from '../components/KhungNhanVien';

function layChipHD(trangThai) {
  const map = { 'Đang thuê': 'green', 'Sắp hết hạn': 'orange', 'Đã thanh lý': 'gray' };
  return map[trangThai] || 'gray';
}

function layChuCaiDau(ten) {
  if (!ten) return '?';
  const parts = ten.trim().split(' ');
  return (parts[parts.length - 1][0] || '?').toUpperCase();
}

export default function DanhSachKhachHang({ nguoiDung, dangXuat }) {
  const [danhSach, setDanhSach] = useState([]);
  const [chiNhanh, setChiNhanh] = useState([]);
  const [chiTiet, setChiTiet] = useState(null);
  const [tabDrawer, setTabDrawer] = useState('thanh-toan');
  const [dangTai, setDangTai] = useState(true);
  const [tong, setTong] = useState(0);
  const [boLoc, setBoLoc] = useState({ timKiem: '', maCN: '', trangThai: '', page: 1, limit: 10 });

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
    try {
      const qs = new URLSearchParams(
        Object.fromEntries(Object.entries(boLoc).filter(([, v]) => v !== '')),
      );
      const res = await fetch(`/api/khach-hang?${qs}`).then((r) => r.json());
      if (res.ok) {
        setDanhSach(res.danhSach);
        setTong(res.tong);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDangTai(false);
    }
  };

  const moChiTiet = async (cccd) => {
    const res = await fetch(`/api/khach-hang/${cccd}`).then((r) => r.json());
    if (res.ok) {
      setChiTiet(res.data);
      setTabDrawer('thanh-toan');
    }
  };

  const dongDrawer = () => setChiTiet(null);

  return (
    <KhungNhanVien nguoiDung={nguoiDung} dangXuat={dangXuat}>
      <div className="qt-page-header">
        <div>
          <h1>Quản lý khách hàng</h1>
          <p>Tra cứu, lọc và xem hồ sơ khách hàng đang thuê.</p>
        </div>
        <button type="button" className="qt-btn-primary">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>person_add</span>
          Thêm khách hàng
        </button>
      </div>

      <div className="qt-filter-card">
        <div className="qt-field qt-search-wrap" style={{ gridColumn: 'span 2' }}>
          <label>Tìm kiếm</label>
          <span className="material-symbols-outlined">search</span>
          <input
            placeholder="Tên, SĐT, CCCD, phòng..."
            value={boLoc.timKiem}
            onChange={(e) => setBoLoc((p) => ({ ...p, timKiem: e.target.value, page: 1 }))}
          />
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
        <div className="qt-field">
          <label>Trạng thái HĐ</label>
          <select value={boLoc.trangThai} onChange={(e) => setBoLoc((p) => ({ ...p, trangThai: e.target.value, page: 1 }))}>
            <option value="">Tất cả</option>
            <option value="Đang thuê">Đang thuê</option>
            <option value="Sắp hết hạn">Sắp hết hạn</option>
            <option value="Đã thanh lý">Đã thanh lý</option>
          </select>
        </div>
        <button type="button" className="qt-btn-outline" onClick={taiDanhSach}>Lọc nâng cao</button>
      </div>

      <div className="qt-table-wrap">
        {dangTai ? (
          <div className="qt-loading">Đang tải...</div>
        ) : (
          <>
            <table className="qt-table">
              <thead>
                <tr>
                  <th>Tên khách hàng</th>
                  <th>SĐT</th>
                  <th>CCCD</th>
                  <th>Phòng</th>
                  <th>Chi nhánh</th>
                  <th>Thời gian thuê</th>
                  <th>Trạng thái HĐ</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {danhSach.map((kh) => (
                  <tr key={kh.cccd} onClick={() => moChiTiet(kh.cccd)}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span className="qt-avatar-initial">{layChuCaiDau(kh.hoTen)}</span>
                        <span>{kh.hoTen}</span>
                      </div>
                    </td>
                    <td>{kh.sdt}</td>
                    <td>{kh.cccd}</td>
                    <td>{kh.phong}</td>
                    <td>{kh.chiNhanh}</td>
                    <td>{kh.thoiGianThue}</td>
                    <td>
                      <span className={`qt-chip qt-chip--${layChipHD(kh.trangThaiHD)}`}>{kh.trangThaiHD}</span>
                    </td>
                    <td>
                      <button type="button" className="qt-btn-icon" onClick={(e) => { e.stopPropagation(); moChiTiet(kh.cccd); }}>
                        <span className="material-symbols-outlined">more_vert</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="qt-pagination">
              <span>{danhSach.length} / {tong} khách hàng</span>
              <div className="qt-pagination-btns">
                <button type="button" disabled={boLoc.page <= 1} onClick={() => setBoLoc((p) => ({ ...p, page: p.page - 1 }))}>Trước</button>
                <button type="button" disabled={boLoc.page * boLoc.limit >= tong} onClick={() => setBoLoc((p) => ({ ...p, page: p.page + 1 }))}>Sau</button>
              </div>
            </div>
          </>
        )}
      </div>

      {chiTiet && (
        <>
          <div className="qt-drawer-overlay" onClick={dongDrawer} role="presentation" />
          <div className="qt-drawer">
            <div className="qt-drawer-header">
              <div>
                <p style={{ margin: 0, fontSize: 12, color: '#8c7164' }}>Mã KH: KH-{chiTiet.cccd}</p>
                <h2 style={{ margin: '4px 0 0' }}>{chiTiet.hoTen}</h2>
              </div>
              <button type="button" className="qt-btn-icon" onClick={dongDrawer}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="qt-drawer-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <span className="qt-avatar-initial" style={{ width: 56, height: 56, fontSize: 22 }}>{layChuCaiDau(chiTiet.hoTen)}</span>
                <div>
                  <span className={`qt-chip qt-chip--${layChipHD(chiTiet.trangThaiHD)}`}>{chiTiet.trangThaiHD}</span>
                  <p style={{ margin: '8px 0 0', fontSize: 13, color: '#584237' }}>Phòng hiện tại: {chiTiet.phong}</p>
                </div>
              </div>
              <div className="qt-info-grid">
                <div className="qt-info-item"><label>SĐT</label><span>{chiTiet.sdt}</span></div>
                <div className="qt-info-item"><label>CCCD</label><span>{chiTiet.cccd}</span></div>
                <div className="qt-info-item"><label>Ngày sinh</label><span>{chiTiet.ngaySinh}</span></div>
                <div className="qt-info-item"><label>Chi nhánh</label><span>{chiTiet.chiNhanh}</span></div>
              </div>
              <div className="qt-tabs">
                <button type="button" className={tabDrawer === 'thanh-toan' ? 'active' : ''} onClick={() => setTabDrawer('thanh-toan')}>Lịch sử thanh toán</button>
                <button type="button" className={tabDrawer === 'hop-dong' ? 'active' : ''} onClick={() => setTabDrawer('hop-dong')}>Hợp đồng &amp; Hồ sơ</button>
                <button type="button" className={tabDrawer === 'ghi-chu' ? 'active' : ''} onClick={() => setTabDrawer('ghi-chu')}>Ghi chú</button>
              </div>
              {tabDrawer === 'thanh-toan' && (
                <div>
                  {chiTiet.lichSuThanhToan?.length ? chiTiet.lichSuThanhToan.map((tt) => (
                    <div key={tt.maHD} style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <strong>{tt.moTa}</strong>
                        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#8c7164' }}>{tt.ngay} · {tt.phuongThuc}</p>
                      </div>
                      <strong style={{ color: '#16a34a' }}>+{tt.soTien.toLocaleString('vi-VN')}đ</strong>
                    </div>
                  )) : <p className="qt-empty">Chưa có lịch sử thanh toán.</p>}
                </div>
              )}
              {tabDrawer === 'hop-dong' && (
                <p style={{ color: '#584237' }}>Hợp đồng {chiTiet.maHopDong ? `#${chiTiet.maHopDong}` : 'chưa có'} — địa chỉ: {chiTiet.diaChi}</p>
              )}
              {tabDrawer === 'ghi-chu' && <p className="qt-empty">Chưa có ghi chú.</p>}
            </div>
            <div className="qt-drawer-footer">
              <button type="button" className="qt-btn-outline">Gọi điện</button>
              <button type="button" className="qt-btn-outline">Gửi tin nhắn</button>
              <button type="button" className="qt-btn-primary" style={{ marginLeft: 'auto' }}>Cập nhật hồ sơ</button>
            </div>
          </div>
        </>
      )}
    </KhungNhanVien>
  );
}
