import React from 'react';
import BieuDoLichSu from './BieuDoLichSu';
import { moAnhTrongTabMoi } from '../../utils/moAnhTrongTabMoi';

export default function ThanhToanMinhChung({
  role,
  selected,
  room,
  selectedBeds,
  suggested,
  depositAmount,
  setDepositAmount,
  paymentMethod,
  setPaymentMethod,
  transaction,
  setTransaction,
  evidence,
  onEvidence,
  cashAmount,
  setCashAmount,
  cashConfirmed,
  setCashConfirmed,
  primaryAction,
  actionError,
  setActionError,
  busy,
  note,
  submitAction,
  money,
  dateTime,
}) {
  const latestProof = selected.chungTu?.[0];

  return (
    <>
      {/* Segment: Money and Formula */}
      {(selected.SoTienCoc > 0 || role === 'KE_TOAN') && (
        <section className="d-section-card d-card-money">
          <h3>Tính toán tiền cọc</h3>
          <div className="d-formula-box">
            <span>Công thức: Tiền thuê 2 tháng × {selected.LoaiThue === 'Thuê nguyên phòng' ? room?.SucChuaToiDa || selected.SoGiuongThue : selectedBeds.length} giường</span>
            <strong>Gợi ý: {money(suggested)}</strong>
          </div>

          {role === 'KE_TOAN' && selected.TrangThai === 'CHO_TINH_COC' ? (
            <label className="d-field-group">
              <span>SỐ TIỀN CỌC XÁC NHẬN (KẾ TOÁN CÓ THỂ ĐIỀU CHỈNH)</span>
              <input
                type="number"
                min="1"
                value={depositAmount || suggested}
                onChange={(event) => setDepositAmount(event.target.value)}
                style={{ fontWeight: 'bold', fontSize: '15px', color: '#f26a21' }}
              />
            </label>
          ) : (
            <div className="d-total-box">
              <span>Số tiền cọc thực tế cần đóng:</span>
              <strong>{money(selected.SoTienCoc)}</strong>
            </div>
          )}
        </section>
      )}

      {/* Segment: Proof Upload (Sales) */}
      {['CHO_THANH_TOAN', 'TU_CHOI_CHUNG_TU'].includes(selected.TrangThai) && role === 'SALE' && (
        <section className="d-section-card d-card-proof">
          <h3>Tải lên chứng từ thanh toán của khách</h3>
          <div className="d-payment-toggle-group">
            <button
              type="button"
              className={`d-payment-toggle-btn ${paymentMethod === 'Chuyển khoản' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('Chuyển khoản')}
            >
              <span className="material-symbols-outlined">account_balance</span> Chuyển khoản ngân hàng
            </button>
            <button
              type="button"
              className={`d-payment-toggle-btn ${paymentMethod === 'Tiền mặt' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('Tiền mặt')}
            >
              <span className="material-symbols-outlined">payments</span> Tiền mặt
            </button>
          </div>

          <div style={{ display: 'flex', gap: '9px', alignItems: 'center', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', padding: '10px 12px', borderRadius: '10px', fontSize: '12.5px', fontWeight: '700', marginBottom: '14px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>receipt_long</span>
            Khi gửi xác nhận, hệ thống cũng tự động lập và lưu mã phiếu thu cho giao dịch.
          </div>

          {paymentMethod === 'Tiền mặt' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '16px', borderRadius: '12px' }}>
              <label className="d-field-group">
                <span style={{ color: '#14532d' }}>Số tiền mặt thực tế đã nhận (VNĐ)</span>
                <input
                  type="number"
                  min="1"
                  step="1000"
                  value={cashAmount || selected.SoTienCoc}
                  onChange={(event) => setCashAmount(event.target.value)}
                  style={{ borderColor: '#86efac', background: '#ffffff', fontWeight: 'bold' }}
                />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginTop: '8px' }}>
                <input
                  type="checkbox"
                  checked={cashConfirmed}
                  onChange={(event) => setCashConfirmed(event.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#16a34a' }}
                />
                <span style={{ fontSize: '13px', fontWeight: '750', color: '#14532d' }}>Tôi xác nhận đã kiểm đếm và nhận đủ tiền mặt từ khách hàng</span>
              </label>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <label className="d-field-group">
                <span>MÃ GIAO DỊCH NGÂN HÀNG (MÃ FT HOẶC BILL CHUYỂN KHOẢN)</span>
                <input
                  type="text"
                  value={transaction}
                  onChange={(event) => setTransaction(event.target.value)}
                  placeholder="Ví dụ: FT2607128892"
                />
              </label>
              <div className="d-upload-box">
                <span className="material-symbols-outlined" style={{ fontSize: '36px' }}>cloud_upload</span>
                <strong>{evidence ? 'Đã chọn ảnh chứng từ thanh toán' : 'Kéo thả hoặc click để chọn ảnh giao dịch'}</strong>
                <small>Định dạng ảnh PNG, JPG (Tối đa 2 megabyte)</small>
                <input type="file" accept="image/*" onChange={(event) => onEvidence(event.target.files?.[0])} />
              </div>
              {evidence && (
                <div className="d-proof-preview">
                  <img src={evidence} alt="Xem trước chứng từ" />
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Display latest uploaded receipt proof */}
      {selected.chungTu?.length > 0 && !(role === 'QUAN_LY' && selected.TrangThai === 'CHO_XAC_NHAN_THANH_TOAN') && (
        <section className="d-section-card d-card-proof">
          <h3>Chứng từ gửi gần nhất</h3>
          <div style={{ display: 'grid', gridTemplateColumns: latestProof.HinhAnhDataUrl ? '1.2fr 1fr' : '1fr', gap: '20px', background: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <small style={{ fontSize: '10px', fontWeight: '850', color: '#94a3b8', letterSpacing: '0.5px' }}>MÃ PHIẾU THU</small>
              <strong style={{ fontSize: '15px' }}>{latestProof.MaPhieuThu || latestProof.MaGiaoDich || 'Chưa có'}</strong>
              {latestProof.LoaiThanhToan === 'Chuyển khoản' && latestProof.MaGiaoDich && (
                <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#475569', fontWeight: '650' }}>Mã giao dịch ngân hàng: {latestProof.MaGiaoDich}</p>
              )}
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
                Hình thức thanh toán: {['Tiền mặt', 'TIEN_MAT'].includes(latestProof.LoaiThanhToan) ? 'Tiền mặt' : 'Chuyển khoản ngân hàng'}
              </p>
              {latestProof.NguoiNhanTien && (
                <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
                  Thực nhận: {money(latestProof.SoTienThucNhan)} · Người nhận: {latestProof.NguoiNhanTien}
                </p>
              )}
              <small style={{ color: '#94a3b8', marginTop: '6px', fontWeight: '600' }}>Tải lên lúc: {dateTime(latestProof.TaiLenLuc)}</small>
            </div>
            {latestProof.HinhAnhDataUrl && (
              <a href={latestProof.HinhAnhDataUrl} target="_blank" rel="noreferrer" onClick={(event) => moAnhTrongTabMoi(event, latestProof.HinhAnhDataUrl)} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', display: 'block' }}>
                <img src={latestProof.HinhAnhDataUrl} alt="Chứng từ thanh toán" style={{ width: '100%', maxHeight: '110px', objectFit: 'contain', display: 'block' }} />
              </a>
            )}
          </div>
        </section>
      )}

      {/* Log list history (rendered before primary action buttons) */}
      <BieuDoLichSu history={selected.lichSu} dateTime={dateTime} />

      {/* Primary actions buttons */}
      {(primaryAction || (role === 'QUAN_LY' && ['CHO_KIEM_TRA_PHONG', 'CHO_XAC_NHAN_THANH_TOAN'].includes(selected.TrangThai))) && (
        <div className="d-action-area">
          {actionError && (
            <div className="d-inline-error" role="alert">
              <span className="material-symbols-outlined">error</span>
              <span>{actionError}</span>
            </div>
          )}
          <div className="d-btn-group">
            {role === 'QUAN_LY' && selected.TrangThai === 'CHO_KIEM_TRA_PHONG' && (
              <button
                type="button"
                className="d-btn-outline d-btn-danger"
                disabled={busy}
                onClick={() => {
                  if (!note.trim()) {
                    setActionError('Vui lòng nhập lý do báo hết chỗ vào ô ghi chú phía trên.');
                    return;
                  }
                  submitAction('BAO_HET_CHO');
                }}
              >
                Báo hết chỗ và Từ chối
              </button>
            )}
            {role === 'QUAN_LY' && selected.TrangThai === 'CHO_XAC_NHAN_THANH_TOAN' && (
              <button
                type="button"
                className="d-btn-outline d-btn-danger"
                disabled={busy}
                onClick={() => {
                  if (!note.trim()) {
                    setActionError('Vui lòng nhập lý do từ chối chứng từ vào ô ghi chú phía trên.');
                    return;
                  }
                  submitAction('TU_CHOI_CHUNG_TU');
                }}
              >
                Từ chối chứng từ
              </button>
            )}
            {primaryAction && !(selected.TrangThai === 'HET_CHO' && role === 'SALE') && (
              <button
                type="button"
                className="d-btn-primary"
                disabled={busy || (role === 'QUAN_LY' && selected.TrangThai === 'CHO_XAC_NHAN_THANH_TOAN' && !latestProof)}
                onClick={() => submitAction(primaryAction[0])}
              >
                {busy ? 'Đang xử lý...' : primaryAction[1]}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
