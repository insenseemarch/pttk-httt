import { useState, useEffect } from 'react';

// Trang BÀN GIAO TÀI SẢN (ASSET HANDOVER)
// Quản lý kiểm kê tài sản, ký biên bản và bàn giao phòng cho khách nhận chính thức.
export default function AssetHandover({ maGiaoDich = 'PAY-2024-0892', hienThongBao, onQuayLai }) {
  const [khachHang, setKhachHang] = useState(null);
  const [danhMucTaiSan, setDanhMucTaiSan] = useState([]);
  const [chuKy, setChuKy] = useState({ quanLy: false, khach: false });
  const [maHopDong, setMaHopDong] = useState('');
  const [dangTai, setDangTai] = useState(false);
  const [dangXuLy, setDangXuLy] = useState(false);

  const taiDuLieuBanGiao = async (maCanTai = maGiaoDich) => {
    setDangTai(true);
    try {
      const res = await fetch(`/api/ban-giao/${encodeURIComponent(maCanTai)}`);
      const json = await res.json();
      if (json.ok) {
        setKhachHang(json.data.khachHang);
        setDanhMucTaiSan(
          json.data.danhMucTaiSan.map(item => ({
            ...item,
            daKiem: false,
            ghiChu: ''
          }))
        );
        setMaHopDong(json.data.maHopDong || '');
        setChuKy({ quanLy: false, khach: false });
      } else {
        hienThongBao('error', json.error || 'Không tải được dữ liệu bàn giao');
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu bàn giao:', err);
      hienThongBao('error', 'Lỗi kết nối API bàn giao');
    } finally {
      setDangTai(false);
    }
  };

  useEffect(() => {
    taiDuLieuBanGiao();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maGiaoDich]);

  const capNhatKiem = (id) => {
    setDanhMucTaiSan(prev => prev.map(item =>
      item.id === id ? { ...item, daKiem: !item.daKiem } : item
    ));
  };

  const capNhatGhiChu = (id, value) => {
    setDanhMucTaiSan(prev => prev.map(item =>
      item.id === id ? { ...item, ghiChu: value } : item
    ));
  };

  const hoanTatBanGiao = async () => {
    const daKiemDu = danhMucTaiSan.length > 0 && danhMucTaiSan.every(item => item.daKiem);
    if (!daKiemDu || !chuKy.quanLy || !chuKy.khach) {
      hienThongBao('error', 'Vui lòng hoàn thành checklist và ký tên đầy đủ trước khi xác nhận.');
      return;
    }
    setDangXuLy(true);
    try {
      const res = await fetch('/api/ban-giao/hoan-tat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maGiaoDich,
          ketQuaTaiSan: danhMucTaiSan.map(item => ({
            id: item.id,
            ten: item.ten,
            daKiem: item.daKiem,
            ghiChu: item.ghiChu
          })),
          chuKy,
          maQuanLy: 'MANAGER-01'
        })
      });
      const json = await res.json();
      if (json.ok) {
        hienThongBao('success', `${json.data.message} (Mã biên bản: ${json.data.maBienBan})`);
      } else {
        throw new Error(json.error || 'Lỗi hệ thống');
      }
    } catch (err) {
      console.error('Lỗi khi hoàn tất bàn giao:', err);
      hienThongBao('error', `Lỗi: ${err.message}`);
    } finally {
      setDangXuLy(false);
    }
  };

  const soMucDaKiem = danhMucTaiSan.filter(i => i.daKiem).length;
  const tongMuc = danhMucTaiSan.length;
  const tienDoPercent = tongMuc > 0 ? Math.round((soMucDaKiem / tongMuc) * 100) : 0;

  const nhomTaiSan = {
    FURNITURE: { label: 'Đồ nội thất', items: [] },
    ACCESS: { label: 'Chìa khóa & Thẻ từ', items: [] },
    SERVICE: { label: 'Dịch vụ', items: [] }
  };
  danhMucTaiSan.forEach(item => {
    const nhom = nhomTaiSan[item.nhom] || nhomTaiSan.FURNITURE;
    nhom.items.push(item);
  });

  return (
    <div className="handover-page">

      {/* BREADCRUMB */}
      <div className="handover-breadcrumb">
        <span>Hợp đồng</span>
        <span className="handover-breadcrumb-sep">›</span>
        <span>{khachHang?.phongGiuong || 'Phòng'}</span>
        <span className="handover-breadcrumb-sep">›</span>
        <span className="handover-breadcrumb-current">Bàn giao</span>
      </div>

      {/* PAGE HEADER */}
      <div className="handover-header">
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>Bước cuối: Bàn giao phòng cho khách</h1>
          <p className="page-subtitle" style={{ margin: '4px 0 0 0' }}>
            Kiểm tra và xác nhận tình trạng tài sản trước khi khách hàng nhận phòng chính thức.
          </p>
        </div>

        {/* Thanh tiến độ tổng */}
        {!dangTai && tongMuc > 0 && (
          <div className="handover-progress-wrap">
            <div className="handover-progress-label">
              <span>Tiến độ kiểm kê</span>
              <strong style={{ color: tienDoPercent === 100 ? 'var(--success-color)' : 'var(--primary-color)' }}>
                {soMucDaKiem}/{tongMuc} mục
              </strong>
            </div>
            <div className="handover-progress-bar">
              <div
                className="handover-progress-fill"
                style={{ width: `${tienDoPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {dangTai ? (
        <div className="stay-check-loading">Đang tải dữ liệu bàn giao...</div>
      ) : (
        <div className="handover-grid">

          {/* ─── CỘT TRÁI: THÔNG TIN KHÁCH & LƯU Ý ─── */}
          <div className="handover-left">

            {/* Thông tin khách hàng */}
            <div className="stay-check-card handover-guest-card">
              <div className="stay-check-card-head">
                <h2 className="stay-check-card-title" style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Thông tin khách hàng
                </h2>
              </div>

              <div className="handover-guest-profile">
                <span className="handover-guest-avatar">
                  {(khachHang?.hoTen || '?').split(' ').map(w => w[0]).join('').slice(-2).toUpperCase()}
                </span>
                <div>
                  <strong className="stay-check-value">{khachHang?.hoTen || '—'}</strong>
                  <span className="client-phone">ID: {khachHang?.maKH || '—'}</span>
                </div>
              </div>

              <div className="handover-info-list">
                <div className="handover-info-row">
                  <span className="handover-info-label">Phòng:</span>
                  <span className="handover-info-value">{khachHang?.phongGiuong || '—'}</span>
                </div>
                <div className="handover-info-row">
                  <span className="handover-info-label">Ngày nhận:</span>
                  <span className="handover-info-value">{khachHang?.ngayNhan || '—'}</span>
                </div>
                <div className="handover-info-row">
                  <span className="handover-info-label">Thời hạn:</span>
                  <span className="handover-info-value">{khachHang?.thoiHanThue || '—'}</span>
                </div>
                <div className="handover-info-row">
                  <span className="handover-info-label">Mã hợp đồng:</span>
                  <span className="handover-info-value">{maHopDong || '—'}</span>
                </div>
              </div>
            </div>

            {/* Lưu ý quan trọng */}
            <div className="handover-notice">
              <div className="handover-notice-head">Lưu ý quan trọng</div>
              <p className="handover-notice-text">
                Phòng <strong>CHỈ</strong> chuyển trạng thái <strong>ĐANG THUÊ</strong> sau khi
                bấm nút ký biên bản bàn giao. Mọi dữ liệu tiền điện, nước sẽ bắt đầu
                được tính từ thời điểm này.
              </p>
            </div>

            {/* Tóm tắt trạng thái ký */}
            <div className="handover-sign-status-card">
              <div className="handover-sign-status-row">
                <span>Quản lý ký</span>
                <span className={`handover-sign-status-pill ${chuKy.quanLy ? 'signed' : 'unsigned'}`}>
                  {chuKy.quanLy ? 'Đã ký' : 'Chưa ký'}
                </span>
              </div>
              <div className="handover-sign-status-row">
                <span>Khách hàng ký</span>
                <span className={`handover-sign-status-pill ${chuKy.khach ? 'signed' : 'unsigned'}`}>
                  {chuKy.khach ? 'Đã ký' : 'Chưa ký'}
                </span>
              </div>
            </div>

          </div>

          {/* ─── CỘT PHẢI: DANH MỤC TÀI SẢN & CHỮ KÝ ─── */}
          <div className="handover-right">
            <div className="table-card">

              <div className="stay-check-members-head">
                <h2 className="stay-check-card-title">Danh mục bàn giao tài sản</h2>
                <span className="stay-check-members-count">
                  {soMucDaKiem === tongMuc && tongMuc > 0
                    ? <span style={{ color: 'var(--success-color)' }}>Hoàn tất {tongMuc}/{tongMuc}</span>
                    : `${soMucDaKiem}/${tongMuc} đã kiểm`}
                </span>
              </div>

              {/* Checklist danh mục */}
              <div className="handover-inventory">
                {danhMucTaiSan.map((item) => (
                  <div key={item.id} className={`handover-item ${item.daKiem ? 'checked' : ''}`}>
                    <label className="handover-item-check">
                      <input
                        type="checkbox"
                        className="stay-check-checkbox"
                        checked={item.daKiem}
                        onChange={() => capNhatKiem(item.id)}
                      />
                      <span className="handover-item-name">{item.ten}</span>
                    </label>
                    <div className="handover-item-note-wrap">
                      <input
                        type="text"
                        className="handover-item-note"
                        placeholder={item.goiY || 'Ghi chú tình trạng...'}
                        value={item.ghiChu}
                        onChange={(e) => capNhatGhiChu(item.id, e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Chữ ký số */}
              <div className="handover-signatures">
                {/* Quản lý ký */}
                <div className="handover-sign-col">
                  <span className="handover-sign-title">Đại diện Quản lý</span>
                  <div
                    className={`handover-sign-box ${chuKy.quanLy ? 'signed' : ''}`}
                    onClick={() => setChuKy(prev => ({ ...prev, quanLy: true }))}
                    role="button"
                    title="Nhấp để ký"
                  >
                    {chuKy.quanLy ? (
                      <div className="handover-sign-done">
                        <span className="handover-sign-name">Trần Anh</span>
                        <span className="handover-sign-verified">Đã xác thực chữ ký số</span>
                      </div>
                    ) : (
                      <span className="handover-sign-placeholder">Vùng ký tên quản lý</span>
                    )}
                  </div>
                  <span className="handover-sign-footer-name">Trần Anh</span>
                </div>

                {/* Khách hàng ký */}
                <div className="handover-sign-col">
                  <span className="handover-sign-title">Khách hàng</span>
                  <div
                    className={`handover-sign-box ${chuKy.khach ? 'signed' : ''}`}
                    onClick={() => setChuKy(prev => ({ ...prev, khach: true }))}
                    role="button"
                    title="Nhấp để ký"
                  >
                    {chuKy.khach ? (
                      <div className="handover-sign-done">
                        <span className="handover-sign-name">{khachHang?.hoTen || 'Khách hàng'}</span>
                        <span className="handover-sign-verified">Đã xác thực chữ ký số</span>
                      </div>
                    ) : (
                      <span className="handover-sign-placeholder">Vùng khách hàng ký tên</span>
                    )}
                  </div>
                  <span className="handover-sign-footer-name">{khachHang?.hoTen || 'Khách hàng'}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="handover-actions">
                <button
                  type="button"
                  className="btn-book-filled handover-confirm-btn"
                  disabled={dangXuLy}
                  onClick={hoanTatBanGiao}
                >
                  {dangXuLy ? 'Đang xử lý...' : 'Ký biên bản bàn giao — Chính thức nhận phòng'}
                </button>
                <p className="handover-legal-note">Biên bản điện tử có giá trị pháp lý tương đương văn bản giấy</p>
                <button
                  type="button"
                  className="btn-detail-outline"
                  onClick={onQuayLai}
                >
                  Quay lại
                </button>
              </div>

            </div>
          </div>

        </div>
      )}

    </div>
  );
}
