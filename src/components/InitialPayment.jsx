import { useState, useEffect } from 'react';

// Trang THANH TOÁN ĐẦU KỲ (INITIAL PAYMENT)
// Kế toán xác nhận thu tiền thuê kỳ đầu trước khi bàn giao phòng.
export default function InitialPayment({ maHopDong = 'CON-2023-1102', hienThongBao, onQuayLai, onXacNhanThanhCong }) {
  const [dangTai, setDangTai] = useState(false);
  const [dangXuLy, setDangXuLy] = useState(false);

  // Dữ liệu hợp đồng & khoản thu
  const [maGiaoDich, setMaGiaoDich] = useState('');
  const [khachHang, setKhachHang] = useState(null);
  const [danhSachKhoanThu, setDanhSachKhoanThu] = useState([]);
  const [tongTienPhaiThu, setTongTienPhaiThu] = useState(0);
  const [ghiChuQuanLy, setGhiChuQuanLy] = useState('');

  // Nhập liệu thanh toán
  const [phuongThuc, setPhuongThuc] = useState('tien-mat');
  const [soTienThucThu, setSoTienThucThu] = useState('');

  // Tải dữ liệu chi tiết thanh toán
  const taiChiTietThanhToan = async () => {
    setDangTai(true);
    try {
      const res = await fetch(`/api/ke-toan/chi-tiet-thanh-toan/${encodeURIComponent(maHopDong)}`);
      const json = await res.json();
      if (json.ok) {
        setMaGiaoDich(json.data.maGiaoDich || '');
        setKhachHang(json.data.khachHang);
        setDanhSachKhoanThu(json.data.danhSachKhoanThu || []);
        setTongTienPhaiThu(json.data.tongTienPhaiThu || 0);
        setGhiChuQuanLy(json.data.ghiChuQuanLy || '');
        setSoTienThucThu(String(json.data.tongTienPhaiThu || ''));
      } else {
        hienThongBao('error', json.error || 'Không tải được dữ liệu thanh toán');
      }
    } catch (err) {
      console.error('Lỗi khi tải chi tiết thanh toán:', err);
      hienThongBao('error', 'Lỗi kết nối API thanh toán');
    } finally {
      setDangTai(false);
    }
  };

  useEffect(() => {
    taiChiTietThanhToan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maHopDong]);

  const soTienThucThuNum = Number(String(soTienThucThu).replace(/\D/g, '')) || 0;
  const chenhLech = soTienThucThuNum - tongTienPhaiThu;
  const duThu = soTienThucThuNum >= tongTienPhaiThu;

  const xacNhanDaThu = async () => {
    if (!soTienThucThu || soTienThucThuNum <= 0) {
      hienThongBao('error', 'Vui lòng nhập số tiền thực thu!');
      return;
    }
    if (!duThu) {
      hienThongBao('error', `Số tiền thu chưa đủ. Còn thiếu: ${(tongTienPhaiThu - soTienThucThuNum).toLocaleString('vi-VN')}đ`);
      return;
    }
    setDangXuLy(true);
    try {
      const res = await fetch('/api/ke-toan/xac-nhan-thu-tien', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maGiaoDich,
          phuongThuc,
          soTienThucThu: soTienThucThuNum,
          maKeToan: 'KT-01'
        })
      });
      const json = await res.json();
      if (json.ok) {
        hienThongBao('success', `${json.data.message} (Mã phiếu thu: ${json.data.maPhieuThu})`);
        if (onXacNhanThanhCong) onXacNhanThanhCong(json.data);
      } else {
        throw new Error(json.error || 'Lỗi hệ thống');
      }
    } catch (err) {
      console.error('Lỗi khi xác nhận thu tiền:', err);
      hienThongBao('error', `Lỗi: ${err.message}`);
    } finally {
      setDangXuLy(false);
    }
  };

  // Format số tiền nhập vào (hiển thị dấu phẩy)
  const xuLyNhapSoTien = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    setSoTienThucThu(raw);
  };

  const formatTien = (so) => Number(so).toLocaleString('vi-VN');

  // Đọc số thành chữ (đơn giản hóa)
  const docSoThanh = (so) => {
    if (!so || so === 0) return '';
    const trieu = Math.floor(so / 1000000);
    const ngan = Math.floor((so % 1000000) / 1000);
    const donVi = so % 1000;
    let chuoi = '';
    if (trieu > 0) chuoi += `${trieu} triệu `;
    if (ngan > 0) chuoi += `${ngan} nghìn `;
    if (donVi > 0) chuoi += `${donVi} `;
    return chuoi.trim() + ' đồng chẵn.';
  };

  return (
    <div className="payment-page">

      {/* BREADCRUMB */}
      <div className="payment-breadcrumb">
        <span>Thanh toán</span>
        <span className="payment-breadcrumb-sep">›</span>
        <span className="payment-breadcrumb-current">Tạo mới phiếu thu</span>
      </div>

      {/* PAGE HEADER */}
      <div className="payment-header">
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>Thanh toán đầu kỳ</h1>
          <p className="page-subtitle" style={{ margin: '4px 0 0 0' }}>
            Xác nhận thu tiền kỳ đầu để kế toán lên phiếu và thông báo bàn giao phòng.
          </p>
        </div>
        {maGiaoDich && (
          <div className="payment-transaction-badge">
            <span className="payment-transaction-label">Mã giao dịch</span>
            <strong className="payment-transaction-id">{maGiaoDich}</strong>
          </div>
        )}
      </div>

      {dangTai ? (
        <div className="stay-check-loading">Đang tải dữ liệu thanh toán...</div>
      ) : (
        <div className="payment-grid">

          {/* ─── CỘT TRÁI: THÔNG TIN & CHI TIẾT KHOẢN THU ─── */}
          <div className="payment-left">

            {/* Thông tin hợp đồng */}
            <div className="stay-check-card payment-contract-card">
              <div className="stay-check-card-head">
                <h2 className="stay-check-card-title">Thông tin hợp đồng</h2>
              </div>

              <div className="payment-contract-grid">
                <div className="payment-contract-field">
                  <span className="payment-field-label">Tên khách hàng</span>
                  <strong className="payment-field-value payment-field-lg">{khachHang?.tenKhach || '—'}</strong>
                </div>
                <div className="payment-contract-pair">
                  <div className="payment-contract-field">
                    <span className="payment-field-label">Số phòng</span>
                    <strong className="payment-field-value payment-field-lg">{khachHang?.phong || '—'}</strong>
                  </div>
                  <div className="payment-contract-field">
                    <span className="payment-field-label">Số người ở</span>
                    <strong className="payment-field-value payment-field-lg">
                      {String(khachHang?.soNguoi || 0).padStart(2, '0')}
                    </strong>
                  </div>
                </div>
                <div className="payment-contract-field">
                  <span className="payment-field-label">Ngày bắt đầu hợp đồng</span>
                  <span className="payment-field-value">{khachHang?.ngayBatDau || '—'}</span>
                </div>
                {ghiChuQuanLy && (
                  <div className="payment-contract-field payment-contract-full">
                    <span className="payment-field-label">Ghi chú từ Quản lý</span>
                    <div className="payment-manager-note">
                      "{ghiChuQuanLy}"
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bảng chi tiết khoản thu */}
            <div className="stay-check-card payment-items-card">
              <div className="stay-check-card-head">
                <h2 className="stay-check-card-title">Chi tiết các khoản thu</h2>
                <span className="stay-check-members-count">
                  {khachHang?.kyThanhToan || 'Tháng đầu'}
                </span>
              </div>

              <div className="table-responsive">
                <table className="appointments-table payment-items-table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left' }}>Hạng mục</th>
                      <th style={{ textAlign: 'right' }}>Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {danhSachKhoanThu.map((item, idx) => (
                      <tr key={idx} className="payment-item-row">
                        <td>
                          <span className="payment-item-name">{item.ten}</span>
                          <span className="payment-item-period">{item.kyTinh}</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="payment-item-amount">{formatTien(item.soTien)}đ</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="payment-total-row">
                      <td>
                        <strong className="payment-total-label">Tổng cộng</strong>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div>
                          <span className="payment-total-amount">{formatTien(tongTienPhaiThu)}đ</span>
                          <span className="payment-total-text">{docSoThanh(tongTienPhaiThu)}</span>
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

          </div>

          {/* ─── CỘT PHẢI: NHẬP LIỆU THANH TOÁN ─── */}
          <div className="payment-right">

            {/* Panel nhập liệu */}
            <div className="stay-check-card payment-input-card">
              <div className="stay-check-card-head">
                <h2 className="stay-check-card-title">Nhập liệu thanh toán</h2>
              </div>

              <div className="payment-input-body">

                {/* Phương thức thanh toán */}
                <div className="payment-input-group">
                  <label className="payment-input-label">Phương thức thanh toán</label>
                  <div className="payment-method-list">
                    {[
                      { value: 'tien-mat', label: 'Tiền mặt' },
                      { value: 'chuyen-khoan', label: 'Chuyển khoản' }
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`payment-method-btn ${phuongThuc === opt.value ? 'active' : ''}`}
                        onClick={() => setPhuongThuc(opt.value)}
                      >
                        <span className={`payment-radio-dot ${phuongThuc === opt.value ? 'active' : ''}`} />
                        <span className="payment-method-label">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Số tiền thực thu */}
                <div className="payment-input-group">
                  <label className="payment-input-label">Số tiền thực thu</label>
                  <div className="payment-amount-wrap">
                    <input
                      type="text"
                      className={`payment-amount-input ${!duThu && soTienThucThuNum > 0 ? 'input-error' : duThu && soTienThucThuNum > 0 ? 'input-success' : ''}`}
                      value={soTienThucThuNum > 0 ? formatTien(soTienThucThuNum) : ''}
                      onChange={xuLyNhapSoTien}
                      placeholder={formatTien(tongTienPhaiThu)}
                    />
                    <span className="payment-amount-suffix">đ</span>
                  </div>

                  {/* Chênh lệch */}
                  {soTienThucThuNum > 0 && (
                    <div className={`payment-diff-row ${duThu ? 'surplus' : 'deficit'}`}>
                      <span>{duThu ? 'Đủ tiền' : 'Còn thiếu'}</span>
                      <strong>
                        {duThu
                          ? chenhLech > 0 ? `Dư: ${formatTien(chenhLech)}đ` : 'Đúng số'
                          : `Thiếu: ${formatTien(tongTienPhaiThu - soTienThucThuNum)}đ`}
                      </strong>
                    </div>
                  )}
                </div>

                {/* Nút xác nhận */}
                <button
                  type="button"
                  className={`payment-confirm-btn ${dangXuLy ? 'loading' : ''}`}
                  disabled={dangXuLy}
                  onClick={xacNhanDaThu}
                >
                  {dangXuLy ? 'Đang xử lý...' : 'XÁC NHẬN ĐÃ THU ĐỦ'}
                </button>

                <div className="payment-notify-hint">
                  Hệ thống sẽ tự động thông báo Quản lý vận hành để bàn giao phòng sau khi bạn xác nhận.
                </div>

              </div>
            </div>

            {/* Hướng dẫn kế toán */}
            <div className="payment-guide-card">
              <div className="payment-guide-head">Hướng dẫn kế toán</div>
              <ul className="payment-guide-list">
                {[
                  'Kiểm tra thông tin chuyển khoản trùng khớp với cú pháp quy định.',
                  'Chỉ xác nhận khi tiền đã thực nổi trong tài khoản.',
                  'Sau xác nhận, hệ thống sẽ tạo phiếu thu và thông báo bàn giao tự động.'
                ].map((text, idx) => (
                  <li key={idx} className="payment-guide-item">
                    <span className="payment-guide-dot">•</span>
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Nút quay lại */}
            <button
              type="button"
              className="btn-detail-outline"
              style={{ width: '100%', padding: '12px', borderRadius: '10px', textAlign: 'center' }}
              onClick={onQuayLai}
            >
              Quay lại
            </button>

          </div>

        </div>
      )}

    </div>
  );
}
