import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import KhungNhanVien from '../components/KhungNhanVien';
import { ROUTES } from '../config/routes';

export default function Dashboard({ nguoiDung, dangXuat }) {
  const [thongKe, setThongKe] = useState({
    phongTrong: 0,
    daDatCoc: 0,
    dangThue: 0,
    traPhongChoXuLy: 0,
    soCocChoDuyet: 0,
  });
  const [cocChoDuyet, setCocChoDuyet] = useState([]);
  const [lichTraPhong, setLichTraPhong] = useState([]);
  const [dangTai, setDangTai] = useState(true);

  useEffect(() => {
    taiDuLieuDashboard();
  }, []);

  const taiDuLieuDashboard = async () => {
    setDangTai(true);
    try {
      const [resTK, resCoc, resLich] = await Promise.all([
        fetch('/api/dashboard/thong-ke').then((r) => r.json()),
        fetch('/api/dashboard/coc-cho-duyet?limit=4').then((r) => r.json()),
        fetch('/api/dashboard/lich-tra-phong?limit=3').then((r) => r.json()),
      ]);

      if (resTK.ok) setThongKe(resTK.data);
      if (resCoc.ok) setCocChoDuyet(resCoc.data);
      if (resLich.ok) setLichTraPhong(resLich.data);
    } catch (err) {
      console.error('Lỗi tải dashboard:', err);
    } finally {
      setDangTai(false);
    }
  };

  const layLoiChao = () => {
    const gio = new Date().getHours();
    if (gio < 12) return 'Chào buổi sáng';
    if (gio < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  const stats = [
    { label: 'Phòng trống', value: thongKe.phongTrong, icon: 'meeting_room', color: 'green' },
    { label: 'Đã đặt cọc', value: thongKe.daDatCoc, icon: 'payments', color: 'orange' },
    { label: 'Đang thuê', value: thongKe.dangThue, icon: 'person_pin_circle', color: 'red' },
    { label: 'Trả phòng chờ xử lý', value: thongKe.traPhongChoXuLy, icon: 'pending_actions', color: 'blue' },
  ];

  return (
    <KhungNhanVien nguoiDung={nguoiDung} dangXuat={dangXuat}>
      <div className="dashboard-main" style={{ padding: 0, maxWidth: 'none' }}>
        <section className="dashboard-welcome">
          <h1>Tổng quan quản lý</h1>
          <p>
            {layLoiChao()}, {nguoiDung?.hoTen?.split(' ').slice(-1)[0] || 'bạn'}. Hệ thống đang hoạt động ổn định.
          </p>
        </section>

        {dangTai ? (
          <div className="dashboard-loading">Đang tải dữ liệu...</div>
        ) : (
          <>
            <div className="dashboard-stats">
              {stats.map((s) => (
                <div key={s.label} className="dashboard-stat-card">
                  <div className={`dashboard-stat-icon ${s.color}`}>
                    <span className="material-symbols-outlined">{s.icon}</span>
                  </div>
                  <div>
                    <p className="dashboard-stat-label">{s.label}</p>
                    <p className={`dashboard-stat-value ${s.color}`}>{s.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="dashboard-grid">
              <div className="dashboard-panel">
                <div className="dashboard-panel-header">
                  <h2>Cọc chờ duyệt</h2>
                  {thongKe.soCocChoDuyet > 0 && (
                    <span className="dashboard-badge">{thongKe.soCocChoDuyet} Yêu cầu mới</span>
                  )}
                </div>

                {cocChoDuyet.length === 0 ? (
                  <div className="dashboard-empty">Không có yêu cầu đặt cọc chờ duyệt.</div>
                ) : (
                  <div className="dashboard-table-wrap">
                    <table className="dashboard-table">
                      <thead>
                        <tr>
                          <th>Khách hàng</th>
                          <th>Phòng</th>
                          <th>Số tiền</th>
                          <th>Thời gian</th>
                          <th style={{ textAlign: 'right' }}>Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cocChoDuyet.map((coc) => (
                          <tr key={coc.maDatCoc}>
                            <td>
                              <div>{coc.hoTen}</div>
                              <div className="sub">{coc.sdt}</div>
                            </td>
                            <td>{coc.phong}</td>
                            <td className="money">{coc.soTien}</td>
                            <td style={{ color: '#584237' }}>{coc.thoiGian}</td>
                            <td style={{ textAlign: 'right' }}>
                              <button type="button" className="dashboard-btn-sm">Xem &amp; Duyệt</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="dashboard-panel-footer">
                  <Link to={ROUTES.thongBao}>Xem tất cả yêu cầu</Link>
                </div>
              </div>

              <div className="dashboard-panel" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="dashboard-panel-header">
                  <h2>Lịch trả phòng sắp tới</h2>
                  <span className="material-symbols-outlined" style={{ color: '#584237', cursor: 'pointer' }}>calendar_month</span>
                </div>

                {lichTraPhong.length === 0 ? (
                  <div className="dashboard-empty">Chưa có lịch trả phòng sắp tới.</div>
                ) : (
                  <div className="dashboard-checkout-list">
                    {lichTraPhong.map((item, idx) => (
                      <div key={item.maPhieu} className="dashboard-checkout-item">
                        <div className={`dashboard-date-box ${idx >= 2 ? 'muted' : ''}`}>
                          <span>Ngày</span>
                          <span>{item.ngay}</span>
                        </div>
                        <div className="dashboard-checkout-content">
                          <div className="dashboard-checkout-top">
                            <h3>{item.hoTen}</h3>
                            <span className={`dashboard-tag ${item.nhan === 'Tuần sau' ? 'gray' : 'blue'}`}>
                              {item.nhan}
                            </span>
                          </div>
                          <p className="dashboard-checkout-meta">{item.phong}</p>
                          <div className="dashboard-checkout-time">
                            <span className="material-symbols-outlined">schedule</span>
                            <span>{item.gio}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="dashboard-panel-action">
                  <button type="button" className="dashboard-btn-outline-full">
                    Tạo biên bản thanh lý phòng
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </KhungNhanVien>
  );
}
