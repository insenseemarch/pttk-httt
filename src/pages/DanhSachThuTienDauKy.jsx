import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import KhungNhanVien from '../components/KhungNhanVien';
import { ROUTES } from '../config/routes';

export default function DanhSachThuTienDauKy({ nguoiDung, dangXuat }) {
  const navigate = useNavigate();
  const [danhSach, setDanhSach] = useState([]);
  const [dangTai, setDangTai] = useState(true);

  useEffect(() => {
    (async () => {
      setDangTai(true);
      try {
        const res = await fetch('/api/ke-toan/cho-thu').then((r) => r.json());
        if (res.ok) setDanhSach(res.danhSach || []);
      } catch (err) {
        console.error('Lỗi tải danh sách hợp đồng:', err);
      } finally {
        setDangTai(false);
      }
    })();
  }, []);

  return (
    <KhungNhanVien nguoiDung={nguoiDung} dangXuat={dangXuat}>
      <div className="payment-page">
        <div className="payment-breadcrumb">
          <span>Kế toán</span>
          <span className="payment-breadcrumb-sep">›</span>
          <span className="payment-breadcrumb-current">Thu tiền kỳ đầu</span>
        </div>

        <div className="qt-page-header" style={{ marginBottom: '24px' }}>
          <div>
            <h1 className="page-title" style={{ margin: 0 }}>Thu tiền kỳ đầu</h1>
            <p className="page-subtitle" style={{ margin: '4px 0 0 0' }}>
              Thu tiền thuê tháng đầu và phí cố định (nước, internet, gửi xe). Tiền điện thu theo kWh các kỳ sau.
            </p>
          </div>
        </div>

        <div className="qt-table-wrap">
          {dangTai ? (
            <div className="qt-loading">Đang tải...</div>
          ) : danhSach.length === 0 ? (
            <div className="qt-empty">
              <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#94a3b8' }}>payments</span>
              <p>Không có hợp đồng nào đang chờ thu tiền kỳ đầu.</p>
            </div>
          ) : (
            <table className="qt-table">
              <thead>
                <tr>
                  <th>Mã HĐ</th>
                  <th>Khách hàng</th>
                  <th>Phòng</th>
                  <th>Ngày bắt đầu</th>
                  <th>Tổng cần thu</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {danhSach.map((hd) => (
                  <tr
                    key={hd.maHopDong}
                    className="qt-table-row--interactive"
                    onClick={() => navigate(`${ROUTES.thuTienDauKy}/${hd.maHopDong}`)}
                  >
                    <td><strong className="qt-table-id">{hd.maHD}</strong></td>
                    <td>
                      <div>{hd.hoTen}</div>
                      <span className="sub">{hd.cccd && hd.cccd !== '—' ? `CCCD: ${hd.cccd}` : hd.sdt}</span>
                    </td>
                    <td>{hd.phong}</td>
                    <td>{hd.ngayBatDau}</td>
                    <td><strong>{hd.tongCanThu || hd.giaThue}</strong></td>
                    <td>
                      <div
                        className="np-tooltip-wrap np-tooltip-wrap--below"
                        data-tip="Mở phiếu thu: tiền thuê + nước (× người), internet, gửi xe (chỉnh số xe). Tiền điện thu sau."
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="qt-btn-primary qt-btn-sm"
                          onClick={() => navigate(`${ROUTES.thuTienDauKy}/${hd.maHopDong}`)}
                        >
                          Thu tiền
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </KhungNhanVien>
  );
}
