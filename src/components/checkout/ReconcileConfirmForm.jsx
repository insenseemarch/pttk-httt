import React from 'react';

export default function ReconcileConfirmForm({ 
  selectedItem, 
  onConfirm,
  onCancel
}) {
  const [showDisputeModal, setShowDisputeModal] = React.useState(false);
  const [disputeReason, setDisputeReason] = React.useState('');

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

  const loaiHinh = isDatCoc 
    ? 'Hủy đăng ký cọc giữ chỗ' 
    : (selectedItem.loaiHinhTraPhong === 'truoc_han' ? 'Chấm dứt hợp đồng thuê trước hạn' : 'Hết hạn hợp đồng thuê');
  
  const phuongThuc = selectedItem.phuongThucHoanTien === 'chuyen_khoan' ? 'Chuyển khoản ngân hàng' : 'Tiền mặt tại văn phòng';

  return (
    <div className="form-card" style={{ width: '100%', padding: '32px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', boxSizing: 'border-box' }}>

      {/* Header */}
      <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '20px', marginBottom: '24px' }}>
        <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>
              Xác nhận kết quả đối soát quyết toán
            </h2>
            <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: '#64748b', fontWeight: '500' }}>
              Quản lý chi nhánh làm việc trực tiếp, thông báo bảng đối soát và ghi nhận phản hồi từ khách thuê
            </p>
          </div>
        </div>
      </div>

      {/* Thông tin hợp đồng */}
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '14px', letterSpacing: '0.05em' }}>
          {isDatCoc ? 'Thông tin phiếu đặt cọc:' : 'Thông tin hợp đồng thuê:'}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', fontSize: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b', fontWeight: '500' }}>{isDatCoc ? 'Mã phiếu cọc:' : 'Mã hợp đồng:'}</span>
            <strong style={{ color: 'var(--primary-color)' }}>{selectedItem.maSo}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b', fontWeight: '500' }}>Phòng ngủ:</span>
            <strong style={{ color: '#334155' }}>{selectedItem.phongCoSo}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b', fontWeight: '500' }}>Khách hàng:</span>
            <strong style={{ color: '#334155' }}>{selectedItem.tenKhachHang} ({selectedItem.soDienThoai})</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b', fontWeight: '500' }}>Hình thức quyết toán:</span>
            <strong style={{ color: '#334155' }}>{loaiHinh}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b', fontWeight: '500' }}>Lý do trả phòng:</span>
            <strong style={{ color: '#334155' }}>{selectedItem.lyDo || 'Không có ghi chú'}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b', fontWeight: '500' }}>Phương thức hoàn cọc:</span>
            <strong style={{ color: '#334155' }}>{phuongThuc}</strong>
          </div>
        </div>
      </div>

      {/* Chi tiết phiếu đối soát */}
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '24px', borderRadius: '12px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '16px', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
          Bảng đối soát quyết toán tài chính từ kế toán:
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed #e2e8f0' }}>
            <span style={{ color: '#475569' }}>Tiền đặt cọc gốc ban đầu:</span>
            <strong style={{ color: '#334155' }}>{tienCocGoc.toLocaleString('vi-VN')} đồng</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed #e2e8f0' }}>
            <span style={{ color: '#475569' }}>Tiền đặt cọc được hoàn ({tiLeHoan}%):</span>
            <strong style={{ color: '#059669' }}>{tienCocDuocHoan.toLocaleString('vi-VN')} đồng</strong>
          </div>
          {noThue > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#dc2626', borderBottom: '1px dashed #e2e8f0' }}>
              <span>Khấu trừ nợ tiền thuê phòng:</span>
              <strong>-{noThue.toLocaleString('vi-VN')} đồng</strong>
            </div>
          )}
          {noDienNuoc > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#dc2626', borderBottom: '1px dashed #e2e8f0' }}>
              <span>Khấu trừ nợ điện, nước và dịch vụ:</span>
              <strong>-{noDienNuoc.toLocaleString('vi-VN')} đồng</strong>
            </div>
          )}
          {chiPhiHuHong > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#dc2626', borderBottom: '1px dashed #e2e8f0' }}>
              <span>Khấu trừ chi phí bồi thường hư hại ({selectedItem.moTaHuHong || ''}):</span>
              <strong>-{chiPhiHuHong.toLocaleString('vi-VN')} đồng</strong>
            </div>
          )}

          {danhSachKhauTruKhac.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#dc2626', borderBottom: '1px dashed #e2e8f0' }}>
              <span>Khấu trừ {item.name} ({item.desc || 'Không có mô tả'}):</span>
              <strong>-{Number(item.amount).toLocaleString('vi-VN')} đồng</strong>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '20px' }}>
          {khachDuocHoan ? (
            <div style={{ background: '#d1fae5', border: '2px solid #10b981', borderRadius: '10px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 12px rgba(16,185,129,0.06)' }}>
              <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#065f46' }}>Số tiền cọc hoàn trả lại cho khách:</div>
              <strong style={{ fontSize: '20px', color: '#059669', fontWeight: '900' }}>{soTienQuyetToan.toLocaleString('vi-VN')} đồng</strong>
            </div>
          ) : (
            <div style={{ background: '#fef2f2', border: '2px solid #ef4444', borderRadius: '10px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 12px rgba(239,68,68,0.06)' }}>
              <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#991b1b' }}>Số tiền khách cần thanh toán thêm:</div>
              <strong style={{ fontSize: '20px', color: '#dc2626', fontWeight: '900' }}>{Math.abs(soTienQuyetToan).toLocaleString('vi-VN')} đồng</strong>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px' }}>
        <button
          type="button"
          className="submit-btn"
          style={{ flex: '2', backgroundColor: 'var(--primary-color)', borderColor: 'var(--primary-color)', boxShadow: '0 4px 12px rgba(242,106,33,0.15)', height: '48px', fontSize: '15px', fontWeight: '700', borderRadius: '8px', cursor: 'pointer' }}
          onClick={() => onConfirm('dong_y')}
        >
          Xác nhận khách hàng đồng ý và chuyển sang bước tiếp theo
        </button>
        <button
          type="button"
          style={{ 
            flex: '1', 
            backgroundColor: '#ffffff', 
            border: '1.5px solid var(--primary-color)', 
            color: 'var(--primary-color)', 
            boxShadow: 'none', 
            height: '48px', 
            fontSize: '14.5px', 
            fontWeight: '700', 
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#fff7ed'; }}
          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; }}
          onClick={() => setShowDisputeModal(true)}
        >
          Ghi nhận ý kiến tranh chấp của khách hàng
        </button>
      </div>

      {onCancel && (
        <button type="button" className="btn-detail-outline" onClick={onCancel}
          style={{ width: '100%', marginTop: '14px', borderRadius: '8px', height: '44px', fontSize: '14px', fontWeight: '700' }}>
          Quay lại danh sách
        </button>
      )}

      {/* MODAL GHI NHẬN Ý KIẾN TRANH CHẤP CỦA KHÁCH HÀNG */}
      {showDisputeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '32px',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid #e2e8f0',
            boxSizing: 'border-box'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '850', color: '#0f172a' }}>
              Ghi nhận phản hồi tranh chấp
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '13.5px', color: '#64748b', lineHeight: '1.5', fontWeight: '500' }}>
              Vui lòng nhập chi tiết các ý kiến phản hồi hoặc lý do khách hàng không đồng ý với phương án đối soát tài chính hiện tại để chuyển trả về cho bộ phận Kế toán điều chỉnh.
            </p>
            <textarea
              rows="4"
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="Ví dụ: Khách hàng không đồng ý mức khấu trừ tiền điện vì tháng này ở ít, yêu cầu đối chiếu lại chỉ số công tơ..."
              style={{
                width: '100%',
                border: '1.5px solid #cbd5e1',
                borderRadius: '8px',
                padding: '12px 14px',
                fontSize: '14px',
                outline: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                resize: 'none',
                height: '120px',
                marginBottom: '24px'
              }}
            />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => {
                  if (!disputeReason.trim()) {
                    alert('Vui lòng nhập lý do tranh chấp.');
                    return;
                  }
                  onConfirm('tranh_chap', disputeReason);
                  setShowDisputeModal(false);
                }}
                style={{
                  flex: '2',
                  backgroundColor: 'var(--primary-color)',
                  borderColor: 'var(--primary-color)',
                  color: '#ffffff',
                  height: '44px',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '14px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Gửi phản hồi cho Kế toán
              </button>
              <button
                type="button"
                onClick={() => setShowDisputeModal(false)}
                style={{
                  flex: '1',
                  backgroundColor: '#f1f5f9',
                  border: 'none',
                  color: '#475569',
                  height: '44px',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
