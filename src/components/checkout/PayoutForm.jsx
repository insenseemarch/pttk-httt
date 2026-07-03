import React from 'react';

export default function PayoutForm({ 
  selectedItem, 
  formValues, 
  onChange, 
  onSubmit, 
  onCancel 
}) {
  const isDatCoc = selectedItem?.loai === 'dat_coc';
  const tienCocGoc = selectedItem.tienCoc || 0;
  const tiLeHoan = selectedItem.tiLeHoanCoc || 100;
  const tienCocDuocHoan = tienCocGoc * (tiLeHoan / 100);
  
  const noThue = isDatCoc ? 0 : (selectedItem.noThue || 0);
  const noDienNuoc = isDatCoc ? 0 : (selectedItem.noDienNuoc || 0);
  const chiPhiHuHong = isDatCoc ? 0 : (selectedItem.chiPhiHuHong || 0);
  
  const danhSachKhauTruKhac = selectedItem.danhSachKhauTruKhac || [];
  const tongKhauTruKhac = danhSachKhauTruKhac.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const tongKhauTru = noThue + noDienNuoc + chiPhiHuHong + tongKhauTruKhac;
  const soTienQuyetToan = tienCocDuocHoan - tongKhauTru;
  const khachDuocHoan = soTienQuyetToan >= 0;

  const phuongThucDangKy = selectedItem.phuongThucHoanTien === 'chuyen_khoan' ? 'Chuyển khoản ngân hàng' : 'Tiền mặt tại văn phòng';

  return (
    <form onSubmit={onSubmit} className="form-card" style={{ width: '100%', padding: '32px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', boxSizing: 'border-box' }}>

      {/* Header */}
      <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '20px', marginBottom: '28px' }}>
        <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>
              {khachDuocHoan ? 'Thực hiện chi hoàn cọc cho khách hàng' : 'Ghi nhận thu tiền phát sinh chênh lệch'}
            </h2>
            <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: '#64748b', fontWeight: '500' }}>
              Kế toán thực hiện giao dịch tài chính cuối cùng, cập nhật chứng từ và đóng hồ sơ quyết toán
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>

        {/* Left: Tóm tắt quyết toán */}
        <div style={{ borderRight: '1px solid #e2e8f0', paddingRight: '16px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.05em' }}>
            Tổng hợp thông tin quyết toán:
          </h3>

          {/* Thông tin khách */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '16px 20px', borderRadius: '12px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b', fontWeight: '500' }}>{isDatCoc ? 'Mã phiếu cọc:' : 'Mã hợp đồng:'}</span>
              <strong style={{ color: 'var(--primary-color)' }}>{selectedItem.maSo}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b', fontWeight: '500' }}>Khách hàng:</span>
              <strong style={{ color: '#334155' }}>{selectedItem.tenKhachHang}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b', fontWeight: '500' }}>Phòng ngủ:</span>
              <strong style={{ color: '#334155' }}>{selectedItem.phongCoSo}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b', fontWeight: '500' }}>Phương thức khách đăng ký:</span>
              <strong style={{ color: '#334155' }}>{phuongThucDangKy}</strong>
            </div>
          </div>

          {/* Bảng tính toán */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed #e2e8f0' }}>
              <span style={{ color: '#475569' }}>Số tiền cọc gốc:</span>
              <strong style={{ color: '#334155' }}>{tienCocGoc.toLocaleString('vi-VN')} đồng</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed #e2e8f0' }}>
              <span style={{ color: '#475569' }}>Cọc được hoàn ({tiLeHoan}%):</span>
              <strong style={{ color: '#059669' }}>{tienCocDuocHoan.toLocaleString('vi-VN')} đồng</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed #e2e8f0', color: '#dc2626' }}>
              <span>Tổng khấu trừ phát sinh:</span>
              <strong>-{tongKhauTru.toLocaleString('vi-VN')} đồng</strong>
            </div>
          </div>

          {khachDuocHoan ? (
            <div style={{ background: '#d1fae5', border: '2px solid #10b981', borderRadius: '12px', padding: '20px', textAlign: 'center', boxShadow: '0 4px 12px rgba(16,185,129,0.06)' }}>
              <div style={{ fontSize: '11.5px', fontWeight: '800', textTransform: 'uppercase', color: '#065f46', marginBottom: '8px', letterSpacing: '0.05em' }}>
                Thực chi hoàn trả cho khách thuê:
              </div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: '#059669', letterSpacing: '-0.02em' }}>
                {soTienQuyetToan.toLocaleString('vi-VN')} đồng
              </div>
            </div>
          ) : (
            <div style={{ background: '#fef2f2', border: '2px solid #ef4444', borderRadius: '12px', padding: '20px', textAlign: 'center', boxShadow: '0 4px 12px rgba(239,68,68,0.06)' }}>
              <div style={{ fontSize: '11.5px', fontWeight: '800', textTransform: 'uppercase', color: '#991b1b', marginBottom: '8px', letterSpacing: '0.05em' }}>
                Thực thu thêm của khách thuê:
              </div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: '#dc2626', letterSpacing: '-0.02em' }}>
                {Math.abs(soTienQuyetToan).toLocaleString('vi-VN')} đồng
              </div>
            </div>
          )}
        </div>

        {/* Right: Form ghi nhận giao dịch */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '0', letterSpacing: '0.05em' }}>
            Ghi nhận chi tiết giao dịch:
          </h3>

          <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>Hình thức thanh toán</label>
            <select name="inputMode" value={formValues.inputMode} onChange={onChange} style={{ border: '1px solid #cbd5e1', padding: '10px 12px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', color: '#334155', backgroundColor: '#ffffff', outline: 'none' }}>
              <option value="chuyen_khoan">Chuyển khoản ngân hàng</option>
              <option value="tien_mat">Tiền mặt tại quầy giao dịch</option>
            </select>
          </div>

          {khachDuocHoan ? (
            /* ================= TRƯỜNG HỢP HOÀN TRẢ TIỀN CỌC ================= */
            formValues.inputMode === 'chuyen_khoan' && (
              <>
                <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                    Ngân hàng nhận của khách
                  </label>
                  <select name="bankName" value={formValues.bankName} onChange={onChange} style={{ border: '1px solid #cbd5e1', padding: '10px 12px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', color: '#334155', backgroundColor: '#ffffff', outline: 'none' }}>
                    <option value="Vietcombank">Vietcombank</option>
                    <option value="Techcombank">Techcombank</option>
                    <option value="BIDV">BIDV</option>
                    <option value="Vietinbank">Vietinbank</option>
                    <option value="ACB">ACB</option>
                    <option value="MBBank">MBBank</option>
                    <option value="TPBank">TPBank</option>
                  </select>
                </div>
                <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>Số tài khoản nhận</label>
                  <input
                    type="text"
                    name="bankAcc"
                    value={formValues.bankAcc}
                    onChange={onChange}
                    placeholder="Nhập số tài khoản ngân hàng của khách"
                    required
                    style={{ border: '1px solid #cbd5e1', padding: '10px 12px', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                  />
                </div>
                <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>Tên người nhận</label>
                  <input
                    type="text"
                    name="bankOwner"
                    value={formValues.bankOwner}
                    onChange={onChange}
                    placeholder="Ví dụ: PHAN TUAN KIET"
                    style={{ border: '1px solid #cbd5e1', padding: '10px 12px', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                  />
                </div>
                <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>Mã giao dịch ngân hàng</label>
                  <input
                    type="text"
                    name="maGiaoDich"
                    value={formValues.maGiaoDich}
                    onChange={onChange}
                    placeholder="Nhập mã giao dịch chuyển khoản thành công"
                    required
                    style={{ border: '1px solid #cbd5e1', padding: '10px 12px', borderRadius: '8px', fontSize: '14px', outline: 'none', fontWeight: '600' }}
                  />
                </div>
              </>
            )
          ) : (
            /* ================= TRƯỜNG HỢP THU THÊM TIỀN CHÊNH LỆCH ================= */
            <>
              {formValues.inputMode === 'chuyen_khoan' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                        Tài khoản ngân hàng công ty
                      </label>
                      <select style={{ border: '1px solid #cbd5e1', padding: '10px 12px', borderRadius: '8px', fontSize: '13.5px', fontWeight: '600', color: '#334155', backgroundColor: '#f8fafc', outline: 'none' }} disabled>
                        <option>Vietcombank - 0071000999999</option>
                      </select>
                    </div>
                    <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                        Mã giao dịch ngân hàng
                      </label>
                      <input
                        type="text"
                        name="maGiaoDich"
                        value={formValues.maGiaoDich}
                        onChange={onChange}
                        placeholder="Nhập mã Ref đối chiếu giao dịch"
                        required
                        style={{ border: '1px solid #cbd5e1', padding: '10px 12px', borderRadius: '8px', fontSize: '14px', outline: 'none', fontWeight: '600' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', boxSizing: 'border-box' }}>
                    <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '800', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Mã QR thanh toán nhanh</span>
                    <img 
                      src={`https://img.vietqr.io/image/vietcombank-0071000999999-compact.png?amount=${Math.abs(soTienQuyetToan)}&addInfo=${encodeURIComponent('THU CHENH LECH HOP DONG ' + selectedItem.maSo)}&accountName=CONG%20TY%20HOMESTAY%20VIET%20NAM`}
                      alt="VietQR"
                      style={{ width: '120px', height: '120px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#ffffff', padding: '4px' }}
                    />
                    <span style={{ fontSize: '9.5px', color: '#94a3b8', marginTop: '6px', textAlign: 'center', fontWeight: '500' }}>Tự động điền số tài khoản, số tiền và nội dung</span>
                  </div>
                </div>
              ) : (
                <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                    Số biên lai thu tiền mặt
                  </label>
                  <input
                    type="text"
                    name="maGiaoDich"
                    value={formValues.maGiaoDich}
                    onChange={onChange}
                    placeholder="Ví dụ: BL-0099..."
                    required
                    style={{ border: '1px solid #cbd5e1', padding: '10px 12px', borderRadius: '8px', fontSize: '14px', outline: 'none', fontWeight: '600' }}
                  />
                </div>
              )}
            </>
          )}

          <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
              Ngày hạch toán
            </label>
            <input
              type="date"
              name="giaoDichDate"
              value={formValues.giaoDichDate}
              onChange={onChange}
              required
              style={{ border: '1px solid #cbd5e1', padding: '10px 12px', borderRadius: '8px', fontSize: '14px', outline: 'none', color: '#334155', fontWeight: '600' }}
            />
          </div>

          <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
              Diễn giải
            </label>
            <input
              type="text"
              name="note"
              value={formValues.note || ''}
              onChange={onChange}
              placeholder={khachDuocHoan ? `Ví dụ: HOAN TRA TIEN COC HOP DONG ${selectedItem.maSo}` : `Ví dụ: THU CHENH LECH QUYET TOAN HOP DONG ${selectedItem.maSo}`}
              style={{ border: '1px solid #cbd5e1', padding: '10px 12px', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
            />
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '24px', marginTop: '28px', display: 'flex', gap: '16px' }}>
        <button type="submit" className="submit-btn"
          style={{ flex: '2', backgroundColor: 'var(--primary-color)', borderColor: 'var(--primary-color)', boxShadow: '0 4px 12px rgba(242,106,33,0.15)', height: '48px', fontSize: '15px', fontWeight: '700', borderRadius: '8px', cursor: 'pointer' }}>
          {khachDuocHoan ? 'Xác nhận đã hoàn trả tiền cọc cho khách' : 'Xác nhận đã thu đủ tiền chênh lệch từ khách'}
        </button>
        <button type="button" className="btn-detail-outline" onClick={onCancel}
          style={{ flex: '1', borderRadius: '8px', height: '48px', fontSize: '14.5px', fontWeight: '700' }}>
          Hủy bỏ
        </button>
      </div>
    </form>
  );
}
