import React from 'react';

export default function ThongTinKhachHang({
  role,
  selected,
  customerForm,
  capNhatFormKhachHang,
  customerHasChanges,
  customerSaveError,
  customerSaveMessage,
  savingCustomer,
  saveCustomerInfo,
  money,
}) {
  return (
    <section className="d-section-card d-card-customer">
      <h3>Thông tin khách thuê</h3>
      {role === 'SALE' && ['Mới tạo', 'Hết chỗ', 'Còn trống', 'Chờ khách chuyển khoản', 'Chứng từ bị từ chối'].includes(selected.TrangThai) ? (
        <>
          <div className="d-grid-2">
            <label className="d-field-group">
              <span>Họ và tên</span>
              <input
                type="text"
                value={customerForm.HoTen || ''}
                onChange={(event) => capNhatFormKhachHang('HoTen', event.target.value)}
              />
            </label>
            <label className="d-field-group">
              <span>Số điện thoại <span style={{ color: 'red' }}>*</span></span>
              <input
                type="text"
                value={customerForm.SDT || ''}
                onChange={(event) => capNhatFormKhachHang('SDT', event.target.value.replace(/\D/g, ''))}
              />
            </label>
            <label className="d-field-group">
              <span>Số căn cước công dân (12 chữ số) <span style={{ color: 'red' }}>*</span></span>
              <input
                type="text"
                maxLength={12}
                value={customerForm.CCCD || ''}
                onChange={(event) => capNhatFormKhachHang('CCCD', event.target.value.replace(/\D/g, ''))}
              />
            </label>
            <label className="d-field-group">
              <span>Địa chỉ thường trú</span>
              <input
                type="text"
                value={customerForm.DiaChi || ''}
                onChange={(event) => capNhatFormKhachHang('DiaChi', event.target.value)}
              />
            </label>
            <label className="d-field-group">
              <span>Giới tính <span style={{ color: 'red' }}>*</span></span>
              <select
                value={customerForm.GioiTinh || ''}
                onChange={(event) => capNhatFormKhachHang('GioiTinh', event.target.value)}
              >
                <option value="">Chưa chọn</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
              </select>
            </label>
            <label className="d-field-group">
              <span>Quốc tịch <span style={{ color: 'red' }}>*</span></span>
              <input
                type="text"
                value={customerForm.QuocTich || ''}
                onChange={(event) => capNhatFormKhachHang('QuocTich', event.target.value)}
              />
            </label>
            <label className="d-field-group">
              <span>Email liên lạc</span>
              <input
                type="email"
                value={customerForm.Email || ''}
                onChange={(event) => capNhatFormKhachHang('Email', event.target.value)}
              />
            </label>
            <label className="d-field-group">
              <span>Khả năng tài chính định kỳ</span>
              <input
                type="number"
                placeholder="Ví dụ: 5000000"
                value={customerForm.KhaNangTaiChinh || ''}
                onChange={(event) => capNhatFormKhachHang('KhaNangTaiChinh', event.target.value)}
              />
            </label>

            {/* Rule Compliance check Box */}
            <label className={`d-consent-control${customerForm.ThoaDK ? ' is-checked' : ''}`}>
              <input
                className="d-consent-input"
                type="checkbox"
                checked={customerForm.ThoaDK || false}
                onChange={(event) => capNhatFormKhachHang('ThoaDK', event.target.checked)}
              />
              <span className="d-consent-box" aria-hidden="true">
                <span className="material-symbols-outlined">check</span>
              </span>
              <span className="d-consent-text">
                Khách thuê xác nhận đồng ý tuân thủ các điều kiện thuê và nội quy ký túc xá
              </span>
            </label>
          </div>
          {(customerHasChanges || customerSaveError || customerSaveMessage) && (
            <div className={`d-customer-save-bar${customerSaveError ? ' has-error' : ''}`}>
              <div className="d-customer-save-status" role={customerSaveError ? 'alert' : 'status'}>
                <span className="material-symbols-outlined">
                  {customerSaveError ? 'error' : customerSaveMessage ? 'check_circle' : 'edit_note'}
                </span>
                <span>{customerSaveError || customerSaveMessage || 'Lưu thông tin khách thuê'}</span>
              </div>
              {customerHasChanges && (
                <button type="button" className="d-btn-primary" disabled={savingCustomer} onClick={saveCustomerInfo}>
                  <span className="material-symbols-outlined">save</span>
                  {savingCustomer ? 'Đang lưu...' : 'Lưu'}
                </button>
              )}
            </div>
          )}
        </>
      ) : (
        <dl className="d-info-grid">
          <div className="d-info-block"><dt>Họ và tên</dt><dd>{selected.KhachHang?.HoTen || '—'}</dd></div>
          <div className="d-info-block"><dt>Số điện thoại</dt><dd>{selected.KhachHang?.SDT || '—'}</dd></div>
          <div className="d-info-block"><dt>Email liên lạc</dt><dd>{selected.KhachHang?.Email || '—'}</dd></div>
          <div className="d-info-block"><dt>Giới tính</dt><dd>{selected.KhachHang?.GioiTinh || '—'}</dd></div>
          <div className="d-info-block"><dt>Quốc tịch</dt><dd>{selected.KhachHang?.QuocTich || '—'}</dd></div>
          <div className="d-info-block"><dt>Số căn cước công dân</dt><dd>{selected.CCCD || '—'}</dd></div>
          <div className="d-info-block"><dt>Tài chính định kỳ</dt><dd>{selected.KhachHang?.KhaNangTaiChinh ? money(selected.KhachHang.KhaNangTaiChinh) : 'Chưa cập nhật'}</dd></div>
          <div className="d-info-block"><dt>Thời hạn thuê mong muốn</dt><dd>{selected.ThoiHanThue ? `${selected.ThoiHanThue} tháng` : '6 tháng'}</dd></div>
          <div className="d-info-block" style={{ gridColumn: 'span 2' }}>
            <dt>Địa chỉ thường trú</dt>
            <dd>{selected.KhachHang?.DiaChi || '—'}</dd>
          </div>
          <div className="d-info-block" style={{ gridColumn: 'span 2' }}>
            <dt>Nội quy ký túc xá</dt>
            <dd className={`d-consent-status${selected.KhachHang?.ThoaDK ? ' is-approved' : ''}`}>
              <span className="material-symbols-outlined" aria-hidden="true">
                {selected.KhachHang?.ThoaDK ? 'check_circle' : 'warning'}
              </span>
              <span>{selected.KhachHang?.ThoaDK ? 'Khách hàng đã đồng ý tuân thủ các quy định và nội quy lưu trú' : 'Chưa xác nhận đồng ý'}</span>
            </dd>
          </div>
        </dl>
      )}
    </section>
  );
}
