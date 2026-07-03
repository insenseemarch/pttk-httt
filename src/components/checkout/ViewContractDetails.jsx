import React from 'react';

export default function ViewContractDetails({ 
  selectedItem, 
  onClose 
}) {
  const isDatCoc = selectedItem?.loai === 'dat_coc';

  return (
    <div className="form-card" style={{ width: '100%', padding: '32px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', boxSizing: 'border-box' }}>
      <div className="form-section" style={{ marginBottom: '24px' }}>
        <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>
            {isDatCoc ? 'Chi tiết phiếu đặt cọc giữ chỗ Dorm' : 'Chi tiết hợp đồng thuê phòng ngủ Dorm'}
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
          
          <div>
            <h3 style={{ fontSize: '13px', textTransform: 'uppercase', color: '#64748b', marginBottom: '14px', fontWeight: '800', letterSpacing: '0.05em' }}>
              Thông tin khách hàng
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: '#334155' }}>
              <div>Họ và tên: <strong style={{ color: '#0f172a' }}>{selectedItem.tenKhachHang}</strong></div>
              <div>Số điện thoại: <strong style={{ color: '#0f172a' }}>{selectedItem.soDienThoai}</strong></div>
              <div>Email: <strong style={{ color: '#0f172a' }}>{selectedItem.email}</strong></div>
              <div>Phòng ngủ đã chọn: <strong style={{ color: '#0f172a' }}>{selectedItem.phongCoSo}</strong></div>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '13px', textTransform: 'uppercase', color: '#64748b', marginBottom: '14px', fontWeight: '800', letterSpacing: '0.05em' }}>
              Chi tiết chứng từ
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: '#334155' }}>
              <div>{isDatCoc ? 'Mã phiếu cọc:' : 'Mã hợp đồng:'} <strong style={{ color: 'var(--primary-color)' }}>{selectedItem.maSo}</strong></div>
              <div>{isDatCoc ? 'Ngày đặt cọc:' : 'Ngày bắt đầu:'} <strong style={{ color: '#0f172a' }}>{selectedItem.ngayBatDau}</strong></div>
              <div>{isDatCoc ? 'Trạng thái pháp lý:' : 'Ngày kết thúc:'} <strong style={{ color: '#0f172a' }}>{isDatCoc ? 'Chưa ký hợp đồng' : selectedItem.ngayKetThuc}</strong></div>
              {!isDatCoc && (
                <div>Giá thuê mỗi tháng: <strong style={{ color: '#0f172a' }}>{Number(selectedItem.giaThue).toLocaleString('vi-VN')} đồng/tháng</strong></div>
              )}
              <div>Số tiền đặt cọc: <strong style={{ color: '#059669', fontWeight: '800' }}>{Number(selectedItem.tienCoc).toLocaleString('vi-VN')} đồng</strong></div>
            </div>
          </div>

        </div>
      </div>

      <button 
        type="button" 
        className="submit-btn" 
        style={{ background: '#64748b', borderColor: '#64748b', boxShadow: 'none', width: '100%', height: '44px', fontWeight: '700', borderRadius: '8px', marginTop: '12px' }} 
        onClick={onClose}
      >
        Quay lại danh sách
      </button>
    </div>
  );
}
