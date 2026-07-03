import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import KhungNhanVien from '../components/KhungNhanVien';
import { ROUTES } from '../config/routes';

const DANH_MUC = [
  { key: 'tat-ca', label: 'Tất cả' },
  { key: 'khan-cap', label: 'Khẩn cấp' },
  { key: 'hop-dong-moi', label: 'Hợp đồng mới' },
  { key: 'thanh-toan', label: 'Thanh toán' },
  { key: 'he-thong', label: 'Hệ thống' },
];

export default function ThongBaoViecCanXuLy({ nguoiDung, dangXuat }) {
  const [thongKe, setThongKe] = useState({ tatCa: 0, khanCap: 0, hopDongMoi: 0, thanhToan: 0, heThong: 0 });
  const [danhSach, setDanhSach] = useState([]);
  const [kpi, setKpi] = useState({ daXuLy: 0, mucTieu: 24, phanTram: 0 });
  const [loai, setLoai] = useState('tat-ca');
  const [dangTai, setDangTai] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    taiThongKe();
  }, []);

  useEffect(() => {
    taiDanhSach();
  }, [loai, page]);

  const taiThongKe = async () => {
    const res = await fetch('/api/thong-bao/thong-ke').then((r) => r.json());
    if (res.ok) setThongKe(res.data);
  };

  const taiDanhSach = async () => {
    setDangTai(true);
    try {
      const res = await fetch(`/api/thong-bao?loai=${loai}&page=${page}&limit=10`).then((r) => r.json());
      if (res.ok) {
        setDanhSach(res.danhSach);
        if (res.thongKe) setKpi(res.thongKe);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDangTai(false);
    }
  };

  const demTheoLoai = (key) => {
    if (key === 'tat-ca') return thongKe.tatCa;
    if (key === 'khan-cap') return thongKe.khanCap;
    if (key === 'hop-dong-moi') return thongKe.hopDongMoi + (thongKe.lichHen || 0);
    if (key === 'thanh-toan') return thongKe.thanhToan;
    if (key === 'he-thong') return thongKe.heThong;
    return 0;
  };

  return (
    <KhungNhanVien nguoiDung={nguoiDung} dangXuat={dangXuat}>
      <div className="qt-page-header">
        <div>
          <h1>Thông báo &amp; Việc cần làm</h1>
          <p>Tổng hợp công việc ưu tiên từ đặt cọc, hợp đồng và lịch hẹn.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button type="button" className="qt-btn-outline">Lọc dữ liệu</button>
          <button type="button" className="qt-btn-outline">Đánh dấu đã đọc tất cả</button>
        </div>
      </div>

      <div className="qt-notif-layout">
        <aside className="qt-notif-sidebar">
          <p style={{ margin: '0 0 12px', fontWeight: 600, fontSize: 14 }}>Phân loại</p>
          {DANH_MUC.map((dm) => (
            <button
              key={dm.key}
              type="button"
              className={`qt-notif-cat ${loai === dm.key ? 'active' : ''}`}
              onClick={() => { setLoai(dm.key); setPage(1); }}
            >
              <span>{dm.label}</span>
              {demTheoLoai(dm.key) > 0 && (
                <span className="qt-notif-badge">{demTheoLoai(dm.key)}</span>
              )}
            </button>
          ))}
          <div className="qt-kpi-widget">
            <p style={{ margin: '0 0 8px', fontSize: 13, opacity: 0.9 }}>Mục tiêu chốt phòng</p>
            <strong style={{ fontSize: 24 }}>{kpi.daXuLy}/{kpi.mucTieu}</strong>
            <div className="qt-progress" style={{ marginTop: 12, background: 'rgba(255,255,255,0.3)' }}>
              <div className="qt-progress-bar" style={{ width: `${kpi.phanTram}%`, background: '#fff' }} />
            </div>
          </div>
        </aside>

        <section>
          {dangTai ? (
            <div className="qt-loading">Đang tải thông báo...</div>
          ) : danhSach.length === 0 ? (
            <div className="qt-empty">Không có thông báo trong danh mục này.</div>
          ) : (
            danhSach.map((tb) => (
              <div key={tb.id} className={`qt-task-card qt-task-card--${tb.mau}`}>
                <div className="qt-task-meta">
                  <span style={{ fontWeight: 700, color: tb.mau === 'urgent' ? '#dc2626' : '#584237' }}>{tb.uuTien}</span>
                  <span>{tb.thoiGian}</span>
                </div>
                <h3>{tb.tieuDe}</h3>
                <p>{tb.noiDung}</p>
                {tb.demNguoc && (
                  <p className="qt-countdown">⏱ Còn lại: {tb.demNguoc}</p>
                )}
                <div className="qt-task-actions">
                  <button type="button" className="qt-btn-primary">{tb.hanhDongChinh}</button>
                  {tb.hanhDongPhu && <button type="button" className="qt-btn-outline">{tb.hanhDongPhu}</button>}
                  {tb.loai === 'khan-cap' && (
                    <Link to={ROUTES.dashboard} className="qt-btn-outline" style={{ textDecoration: 'none' }}>Xem cọc chờ duyệt</Link>
                  )}
                  {tb.loai === 'hop-dong-moi' && tb.tieuDe.includes('HĐ') && (
                    <Link to={ROUTES.hopDong} className="qt-btn-outline" style={{ textDecoration: 'none' }}>Xem hợp đồng</Link>
                  )}
                </div>
              </div>
            ))
          )}
          {!dangTai && danhSach.length > 0 && (
            <button type="button" className="qt-btn-outline" style={{ width: '100%' }} onClick={() => setPage((p) => p + 1)}>
              Xem thêm các thông báo cũ hơn
            </button>
          )}
        </section>
      </div>
    </KhungNhanVien>
  );
}
