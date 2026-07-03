import { useState, useEffect } from 'react';

// Trang THANH LÝ HỢP ĐỒNG & THU HỒI TÀI SẢN (CONTRACT LIQUIDATION)
// Quản lý hoàn tất quy trình trả phòng, thu hồi chìa khóa/thẻ từ và ký thanh lý hợp đồng.
export default function ContractLiquidation({ maHopDong = 'HD-2023-0892', hienThongBao, onQuayLai }) {
  const [dangTai, setDangTai] = useState(false);
  const [dangXuLy, setDangXuLy] = useState(false);

  // Dữ liệu thanh lý
  const [thongTinThanhLy, setThongTinThanhLy] = useState(null);
  const [danhSachThuTuc, setDanhSachThuTuc] = useState([]);
  const [ghiChuTaiSan, setGhiChuTaiSan] = useState('');
  const [chuKy, setChuKy] = useState({ quanLy: false, khach: false });

  const taiDuLieuThanhLy = async () => {
    setDangTai(true);
    try {
      const res = await fetch(`/api/thanh-ly/${encodeURIComponent(maHopDong)}`);
      const json = await res.json();
      if (json.ok) {
        setThongTinThanhLy(json.data.thongTin);
        setDanhSachThuTuc(
          json.data.danhSachThuTuc.map(p => ({ ...p, daHoanThanh: false }))
        );
        setChuKy({ quanLy: false, khach: false });
      } else {
        hienThongBao('error', json.error || 'Không tải được dữ liệu thanh lý');
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu thanh lý:', err);
      hienThongBao('error', 'Lỗi kết nối API thanh lý');
    } finally {
      setDangTai(false);
    }
  };

  useEffect(() => {
    taiDuLieuThanhLy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maHopDong]);

  const chuyenTrangThaiThuTuc = (id) => {
    setDanhSachThuTuc(prev => prev.map(p =>
      p.id === id ? { ...p, daHoanThanh: !p.daHoanThanh } : p
    ));
  };

  const hoanTatThanhLy = async () => {
    const tatCaHoanThanh = danhSachThuTuc.length > 0 && danhSachThuTuc.every(p => p.daHoanThanh);
    if (!tatCaHoanThanh || !chuKy.quanLy || !chuKy.khach) {
      hienThongBao('error', 'Vui lòng hoàn thành tất cả thủ tục và ký tên đầy đủ.');
      return;
    }
    setDangXuLy(true);
    try {
      const res = await fetch('/api/thanh-ly/hoan-tat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maHopDong,
          ketQuaThuTuc: danhSachThuTuc.map(p => ({ id: p.id, ten: p.ten, daHoanThanh: p.daHoanThanh })),
          ghiChuTaiSan,
          chuKy,
          maQuanLy: 'MANAGER-01'
        })
      });
      const json = await res.json();
      if (json.ok) {
        hienThongBao('success', `${json.data.message} (Mã thanh lý: ${json.data.maThanhLy})`);
      } else {
        throw new Error(json.error || 'Lỗi hệ thống');
      }
    } catch (err) {
      console.error('Lỗi khi hoàn tất thanh lý:', err);
      hienThongBao('error', `Lỗi: ${err.message}`);
    } finally {
      setDangXuLy(false);
    }
  };

  const soThuTucDone = danhSachThuTuc.filter(p => p.daHoanThanh).length;
  const tongThuTuc = danhSachThuTuc.length;

  return (
    <div className="liquidation-page">

      {/* BREADCRUMB */}
      <div className="liquidation-breadcrumb">
        <span>Quản lý phòng</span>
        <span className="liquidation-breadcrumb-sep">›</span>
        <span>{thongTinThanhLy?.phong || 'Phòng'}</span>
        <span className="liquidation-breadcrumb-sep">›</span>
        <span className="liquidation-breadcrumb-current">Thanh lý hợp đồng</span>
      </div>

      {/* PAGE HEADER */}
      <div className="liquidation-header">
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>Thanh lý HĐ &amp; Thu hồi tài sản</h1>
          <p className="page-subtitle" style={{ margin: '4px 0 0 0' }}>
            Hoàn tất quy trình trả phòng, thu hồi tài sản và ký biên bản thanh lý hợp đồng thuê.
          </p>
        </div>
        {thongTinThanhLy?.trangThai && (
          <span className="liquidation-status-badge">
            {thongTinThanhLy.trangThai}
          </span>
        )}
      </div>

      {dangTai ? (
        <div className="stay-check-loading">Đang tải dữ liệu thanh lý...</div>
      ) : (
        <>
          {/* THÔNG TIN THANH LÝ — Summary Card full width */}
          <div className="stay-check-card liquidation-summary-card">
            <div className="stay-check-card-head">
              <h2 className="stay-check-card-title">Thông tin thanh lý</h2>
            </div>
            <div className="liquidation-summary-grid">
              <div className="liquidation-summary-col">
                <span className="liquidation-summary-label">Khách thuê</span>
                <strong className="liquidation-summary-val">{thongTinThanhLy?.tenKhach || '—'}</strong>
                <span className="liquidation-summary-sub">ID: {thongTinThanhLy?.maKH || '—'}</span>
              </div>
              <div className="liquidation-summary-col">
                <span className="liquidation-summary-label">Phòng &amp; Loại hình</span>
                <strong className="liquidation-summary-val">{thongTinThanhLy?.phong || '—'}</strong>
                <span className="liquidation-summary-sub">Hợp đồng: {thongTinThanhLy?.maHopDong || maHopDong}</span>
              </div>
              <div className="liquidation-summary-col">
                <span className="liquidation-summary-label">Ngày kết thúc</span>
                <strong className="liquidation-summary-val">{thongTinThanhLy?.ngayKetThuc || '—'}</strong>
                <span className="liquidation-summary-sub">Lý do: {thongTinThanhLy?.lyDo || '—'}</span>
              </div>
            </div>
          </div>

          {/* LƯỚI 2 CỘT: Checklist & Chữ ký */}
          <div className="liquidation-grid">

            {/* CỘT TRÁI: Danh mục thủ tục + Ghi chú */}
            <div className="stay-check-card liquidation-checklist-card">
              <div className="stay-check-card-head">
                <h2 className="stay-check-card-title">Danh mục thủ tục</h2>
                <span className="stay-check-members-count">
                  {soThuTucDone === tongThuTuc && tongThuTuc > 0
                    ? <span style={{ color: 'var(--success-color)' }}>Hoàn tất</span>
                    : `${soThuTucDone}/${tongThuTuc} mục`}
                </span>
              </div>

              <div className="liquidation-procedures">
                {danhSachThuTuc.map((proc) => (
                  <div
                    key={proc.id}
                    className={`liquidation-proc-item ${proc.daHoanThanh ? 'done' : ''}`}
                    onClick={() => chuyenTrangThaiThuTuc(proc.id)}
                    role="button"
                  >
                    <span className={`liquidation-proc-box ${proc.daHoanThanh ? 'checked' : ''}`}>
                      {proc.daHoanThanh && 'V'}
                    </span>
                    <span className="liquidation-proc-name">{proc.ten}</span>
                    {proc.batBuoc && <span className="liquidation-proc-required">Bắt buộc</span>}
                  </div>
                ))}
              </div>

              <div className="liquidation-note-group">
                <label className="liquidation-note-label">Ghi chú thu hồi tài sản</label>
                <textarea
                  className="contract-terms-textarea"
                  placeholder="Mô tả tình trạng tài sản khi thu hồi (vết trầy xước, hỏng hóc nếu có)..."
                  value={ghiChuTaiSan}
                  onChange={(e) => setGhiChuTaiSan(e.target.value)}
                />
              </div>
            </div>

            {/* CỘT PHẢI: Chữ ký xác nhận */}
            <div className="stay-check-card liquidation-signature-card">
              <div className="stay-check-card-head">
                <h2 className="stay-check-card-title">Chữ ký xác nhận</h2>
              </div>

              <div className="liquidation-signatures">

                {/* Quản lý ký */}
                <div className="liquidation-sign-col">
                  <div className="liquidation-sign-col-head">
                    <span className="liquidation-sign-title">Đại diện Quản lý</span>
                    {chuKy.quanLy && (
                      <button
                        type="button"
                        className="liquidation-sign-reset"
                        onClick={() => setChuKy(prev => ({ ...prev, quanLy: false }))}
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                  <div
                    className={`handover-sign-box ${chuKy.quanLy ? 'signed' : ''}`}
                    onClick={() => !chuKy.quanLy && setChuKy(prev => ({ ...prev, quanLy: true }))}
                    role="button"
                    title="Nhấp để ký"
                  >
                    {chuKy.quanLy ? (
                      <div className="handover-sign-done">
                        <span className="handover-sign-name">Quản lý A</span>
                        <span className="handover-sign-verified">Đã xác thực chữ ký số</span>
                      </div>
                    ) : (
                      <span className="handover-sign-placeholder">Ký tên tại đây</span>
                    )}
                  </div>
                </div>

                {/* Khách thuê ký */}
                <div className="liquidation-sign-col">
                  <div className="liquidation-sign-col-head">
                    <span className="liquidation-sign-title">Khách thuê</span>
                    {chuKy.khach && (
                      <button
                        type="button"
                        className="liquidation-sign-reset"
                        onClick={() => setChuKy(prev => ({ ...prev, khach: false }))}
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                  <div
                    className={`handover-sign-box ${chuKy.khach ? 'signed' : ''}`}
                    onClick={() => !chuKy.khach && setChuKy(prev => ({ ...prev, khach: true }))}
                    role="button"
                    title="Nhấp để ký"
                  >
                    {chuKy.khach ? (
                      <div className="handover-sign-done">
                        <span className="handover-sign-name">{thongTinThanhLy?.tenKhach || 'Khách thuê'}</span>
                        <span className="handover-sign-verified">Đã xác thực chữ ký số</span>
                      </div>
                    ) : (
                      <span className="handover-sign-placeholder">Ký tên tại đây</span>
                    )}
                  </div>
                </div>

              </div>

              {/* Lưu ý pháp lý */}
              <div className="liquidation-legal-hint">
                <p>Bằng việc ký tên, cả hai bên xác nhận đã hoàn thành các nghĩa vụ tài chính và bàn giao tài sản đúng như hiện trạng mô tả.</p>
              </div>
            </div>

          </div>

          {/* ACTION ROW */}
          <div className="liquidation-actions">
            <button
              type="button"
              className="liquidation-confirm-btn"
              disabled={dangXuLy}
              onClick={hoanTatThanhLy}
            >
              {dangXuLy ? 'Đang xử lý...' : 'Hoàn tất trả phòng'}
            </button>

            <div className="liquidation-room-hint">
              <span>Lưu ý:</span>
              <span>Phòng sẽ được cập nhật trạng thái</span>
              <span className="liquidation-room-badge">TRỐNG</span>
              <span>sau khi hoàn tất</span>
            </div>

            <button
              type="button"
              className="btn-detail-outline"
              style={{ padding: '12px 32px', borderRadius: '10px' }}
              onClick={onQuayLai}
            >
              Quay lại
            </button>
          </div>

        </>
      )}

    </div>
  );
}
