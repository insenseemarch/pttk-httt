import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import KhungNhanVien from './KhungNhanVien';

// Trang THANH TOÁN ĐẦU KỲ (INITIAL PAYMENT)
// Kế toán xem danh sách và lập phiếu thu tiền thuê kỳ đầu.
export default function InitialPayment({ maHopDong = null, hienThongBao, onQuayLai, onXacNhanThanhCong, nguoiDung, dangXuat }) {
  const navigate = useNavigate();
  const [selectedMaHopDong, setSelectedMaHopDong] = useState(maHopDong);
  const [danhSachHopDong, setDanhSachHopDong] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  // States cho Toast thông báo nội bộ (khi chạy độc lập không qua prop hienThongBao)
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // States cho chi tiết thanh toán của hợp đồng đang chọn
  const [dangTai, setDangTai] = useState(false);
  const [dangXuLy, setDangXuLy] = useState(false);
  const [maGiaoDich, setMaGiaoDich] = useState('');
  const [khachHang, setKhachHang] = useState(null);
  const [danhSachKhoanThu, setDanhSachKhoanThu] = useState([]);
  const [tongTienPhaiThu, setTongTienPhaiThu] = useState(0);
  const [ghiChuQuanLy, setGhiChuQuanLy] = useState('');
  const [phuongThuc, setPhuongThuc] = useState('tien-mat');
  const [soTienThucThu, setSoTienThucThu] = useState('');

  // Hàm hiển thị thông báo hợp nhất
  const thongBao = (kieu, noiDung) => {
    if (hienThongBao) {
      hienThongBao(kieu, noiDung);
    } else {
      setToastMessage(noiDung);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  // 1. Tải danh sách hợp đồng chờ thu tiền kỳ đầu
  const taiDanhSachHopDong = async () => {
    setLoadingList(true);
    try {
      const res = await fetch('/api/ke-toan/cho-thu').then(r => r.json());
      if (res.ok) {
        setDanhSachHopDong(res.danhSach || []);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách hợp đồng:', err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (selectedMaHopDong === null) {
      taiDanhSachHopDong();
    }
  }, [selectedMaHopDong]);

  // 2. Tải chi tiết thanh toán của hợp đồng được chọn
  const taiChiTietThanhToan = async (maHD) => {
    setDangTai(true);
    try {
      const res = await fetch(`/api/ke-toan/chi-tiet-thanh-toan/${encodeURIComponent(maHD)}`);
      const json = await res.json();
      if (json.ok) {
        setMaGiaoDich(json.data.maGiaoDich || '');
        setKhachHang(json.data.khachHang);
        setDanhSachKhoanThu(json.data.danhSachKhoanThu || []);
        setTongTienPhaiThu(json.data.tongTienPhaiThu || 0);
        setGhiChuQuanLy(json.data.ghiChuQuanLy || '');
        setSoTienThucThu(String(json.data.tongTienPhaiThu || ''));
      } else {
        thongBao('error', json.error || 'Không tải được dữ liệu thanh toán');
      }
    } catch (err) {
      console.error('Lỗi khi tải chi tiết thanh toán:', err);
      thongBao('error', 'Lỗi kết nối API thanh toán');
    } finally {
      setDangTai(false);
    }
  };

  useEffect(() => {
    if (selectedMaHopDong !== null) {
      taiChiTietThanhToan(selectedMaHopDong);
    }
  }, [selectedMaHopDong]);

  const soTienThucThuNum = Number(String(soTienThucThu).replace(/\D/g, '')) || 0;
  const chenhLech = soTienThucThuNum - tongTienPhaiThu;
  const duThu = soTienThucThuNum >= tongTienPhaiThu;

  const xacNhanDaThu = async () => {
    if (!soTienThucThu || soTienThucThuNum <= 0) {
      thongBao('error', 'Vui lòng nhập số tiền thực thu!');
      return;
    }
    if (!duThu) {
      thongBao('error', `Số tiền thu chưa đủ. Còn thiếu: ${(tongTienPhaiThu - soTienThucThuNum).toLocaleString('vi-VN')}đ`);
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
          maKeToan: nguoiDung?.maNV || null,
          maHopDong: selectedMaHopDong
        })
      });
      const json = await res.json();
      if (json.ok) {
        thongBao('success', `${json.data.message} (Mã phiếu thu: ${json.data.maPhieuThu})`);
        
        // Cập nhật trạng thái trong danh sách local
        setDanhSachHopDong(prev => prev.map(hd => hd.maHopDong === selectedMaHopDong ? { ...hd, daThanhToanDauKy: true } : hd));
        
        if (onXacNhanThanhCong) {
          onXacNhanThanhCong(json.data);
        } else {
          // Quay lại danh sách
          setSelectedMaHopDong(null);
        }
      } else {
        throw new Error(json.error || 'Lỗi hệ thống');
      }
    } catch (err) {
      console.error('Lỗi khi xác nhận thu tiền:', err);
      thongBao('error', `Lỗi: ${err.message}`);
    } finally {
      setDangXuLy(false);
    }
  };

  const xuLyNhapSoTien = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    setSoTienThucThu(raw);
  };

  const formatTien = (so) => Number(so).toLocaleString('vi-VN');

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

  const renderMainContent = () => {
    // NẾU CHƯA CHỌN HỢP ĐỒNG -> HIỂN THỊ DANH SÁCH HỢP ĐỒNG CHỜ TIẾP NHẬN THANH TOÁN
    if (selectedMaHopDong === null) {
      return (
        <div className="payment-page" style={{ padding: '24px', background: '#f8fafc', minHeight: '80vh' }}>
          <div className="payment-breadcrumb" style={{ marginBottom: '16px', fontSize: '13px', color: '#64748b' }}>
            <span>Kế toán</span>
            <span className="payment-breadcrumb-sep" style={{ margin: '0 8px' }}>›</span>
            <span className="payment-breadcrumb-current" style={{ fontWeight: '600', color: '#0f172a' }}>Danh sách thu tiền đầu kỳ</span>
          </div>

          <div className="qt-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Tiếp nhận thanh toán đầu kỳ</h1>
              <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14.5px' }}>
                Danh sách các hợp đồng mới ký cần thu phí thuê phòng và cọc đợt đầu.
              </p>
            </div>
          </div>

          <div className="qt-table-wrap" style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            {loadingList ? (
              <div style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>Đang tải danh sách hợp đồng...</div>
            ) : danhSachHopDong.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>Không có hợp đồng nào đang chờ.</div>
            ) : (
              <table className="qt-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14.5px' }}>
                <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '16px', fontWeight: '700', color: '#475569' }}>Mã HĐ</th>
                    <th style={{ textAlign: 'left', padding: '16px', fontWeight: '700', color: '#475569' }}>Tên khách hàng</th>
                    <th style={{ textAlign: 'left', padding: '16px', fontWeight: '700', color: '#475569' }}>Phòng</th>
                    <th style={{ textAlign: 'left', padding: '16px', fontWeight: '700', color: '#475569' }}>Ngày bắt đầu</th>
                    <th style={{ textAlign: 'right', padding: '16px', fontWeight: '700', color: '#475569' }}>Tiền phòng tháng đầu</th>
                    <th style={{ textAlign: 'center', padding: '16px', fontWeight: '700', color: '#475569' }}>Trạng thái thu</th>
                    <th style={{ textAlign: 'center', padding: '16px', fontWeight: '700', color: '#475569' }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {danhSachHopDong.map((hd) => {
                    const daThu = hd.daThanhToanDauKy || false;
                    return (
                      <tr key={hd.maHopDong} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                        <td style={{ padding: '16px' }}><strong>{hd.maHD}</strong></td>
                        <td style={{ padding: '16px' }}>
                          <div>{hd.hoTen}</div>
                          <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>{hd.sdt}</div>
                        </td>
                        <td style={{ padding: '16px' }}>{hd.phong}</td>
                        <td style={{ padding: '16px' }}>{hd.ngayBatDau}</td>
                        <td style={{ padding: '16px', textAlign: 'right' }}><strong>{hd.giaThue}</strong></td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <span className={`qt-chip qt-chip--${daThu ? 'green' : 'orange'}`}>
                            {daThu ? 'Đã thu tiền' : 'Chờ thu tiền'}
                          </span>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          {daThu ? (
                            <button type="button" className="qt-btn-outline" style={{ opacity: 0.6, cursor: 'not-allowed', padding: '6px 12px', fontSize: '13px' }} disabled>
                              Đã hoàn thành
                            </button>
                          ) : (
                            <button type="button" className="qt-btn-primary" style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', background: '#10b981', color: '#fff', border: 'none', fontWeight: '700' }} onClick={() => setSelectedMaHopDong(hd.maHopDong)}>
                              <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '4px', verticalAlign: 'middle' }}>account_balance_wallet</span>
                              Thu tiền
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      );
    }

    // NẾU ĐÃ CHỌN HỢP ĐỒNG -> HIỂN THỊ PHIẾU THU TIỀN CHI TIẾT
    return (
      <div className="payment-page">
        {/* BREADCRUMB */}
        <div className="payment-breadcrumb">
          <span style={{ cursor: 'pointer' }} onClick={() => setSelectedMaHopDong(null)}>Thanh toán</span>
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

        <div className="payment-grid">
          {/* CỘT TRÁI: THÔNG TIN & CHI TIẾT KHOẢN THU */}
          <div className="payment-left">
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
                      <tr key={idx}>
                        <td style={{ textAlign: 'left' }}>
                          <div className="item-name">{item.ten}</div>
                          <div className="item-period">{item.kyTinh}</div>
                        </td>
                        <td style={{ textAlign: 'right' }} className="item-price">
                          {formatTien(item.soTien)}đ
                        </td>
                      </tr>
                    ))}
                    <tr className="payment-total-row">
                      <td style={{ textAlign: 'left' }}>Tổng số tiền cần thu</td>
                      <td style={{ textAlign: 'right' }} className="total-amount">
                        {formatTien(tongTienPhaiThu)}đ
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: PHƯƠNG THỨC & HOÀN TẤT PHIẾU THU */}
          <div className="payment-right">
            <div className="stay-check-card payment-action-card">
              <div className="stay-check-card-head">
                <h2 className="stay-check-card-title">Thông tin giao dịch</h2>
              </div>
              <div className="payment-action-body">
                <div className="payment-input-group">
                  <label className="payment-input-label">Phương thức thanh toán</label>
                  <div className="payment-method-selector">
                    {[
                      { value: 'tien-mat', label: 'Tiền mặt' },
                      { value: 'chuyen-khoan', label: 'Chuyển khoản' }
                    ].map((opt) => (
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

            <button
              type="button"
              className="btn-detail-outline"
              style={{ width: '100%', padding: '12px', borderRadius: '10px', textAlign: 'center' }}
              onClick={() => setSelectedMaHopDong(null)}
            >
              Quay lại danh sách
            </button>
          </div>
        </div>
      </div>
    );
  };

  const mainContent = (
    <>
      {renderMainContent()}
      
      {/* Toast popup thông báo nội bộ */}
      {showToast && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px',
          background: '#0f172a', color: '#ffffff',
          padding: '16px 24px', borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
          display: 'flex', alignItems: 'center', gap: '12px',
          zIndex: 2000
        }}>
          <span className="material-symbols-outlined" style={{ color: '#22c55e', fontSize: '22px' }}>check_circle</span>
          <span style={{ fontSize: '14.5px', fontWeight: '600' }}>{toastMessage}</span>
        </div>
      )}
    </>
  );

  // Nếu chạy trong luồng mô phỏng landing page (có onQuayLai), không render KhungNhanVien tránh bị lặp header
  if (onQuayLai) {
    return mainContent;
  }

  // Nếu chạy trang độc lập trong router hệ thống, bọc trong KhungNhanVien để có Sidebar + Header đồng bộ
  return (
    <KhungNhanVien nguoiDung={nguoiDung} dangXuat={dangXuat}>
      {mainContent}
    </KhungNhanVien>
  );
}
