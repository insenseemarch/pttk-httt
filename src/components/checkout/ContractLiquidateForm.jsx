import React from 'react';

export default function ContractLiquidateForm({ 
  selectedItem, 
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

  return (
    <form onSubmit={onSubmit} className="form-card" style={{ width: '100%', padding: '32px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', boxSizing: 'border-box' }}>

      {/* Header */}
      <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '20px', marginBottom: '24px' }}>
        <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>
              {isDatCoc ? 'Thanh lý phiếu đặt cọc và giải phóng chỗ' : 'Ký biên bản thanh lý và bàn giao phòng ngủ'}
            </h2>
            <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: '#64748b', fontWeight: '500' }}>
              Quản lý chi nhánh xác nhận thu hồi tài sản, ký số biên bản thanh lý và cập nhật phòng trống
            </p>
          </div>
        </div>
      </div>

      {/* Thông tin hợp đồng */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', fontSize: '14px', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#64748b', fontWeight: '500' }}>{isDatCoc ? 'Mã phiếu cọc:' : 'Mã hợp đồng:'}</span>
          <strong style={{ color: 'var(--primary-color)' }}>{selectedItem.maSo}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#64748b', fontWeight: '500' }}>Phòng và chi nhánh:</span>
          <strong style={{ color: '#334155' }}>{selectedItem.phongCoSo}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#64748b', fontWeight: '500' }}>Khách hàng:</span>
          <strong style={{ color: '#334155' }}>{selectedItem.tenKhachHang}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#64748b', fontWeight: '500' }}>Số điện thoại liên hệ:</span>
          <strong style={{ color: '#334155' }}>{selectedItem.soDienThoai}</strong>
        </div>
      </div>

      {/* Tóm tắt tài chính */}
      <div style={{ background: khachDuocHoan ? '#f0fdf4' : '#fef2f2', border: `1px solid ${khachDuocHoan ? '#86efac' : '#fca5a5'}`, padding: '16px 20px', borderRadius: '12px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.01)' }}>
        <div style={{ fontSize: '13.5px', color: khachDuocHoan ? '#166534' : '#991b1b', fontWeight: '700' }}>
          {khachDuocHoan ? 'Kết quả đối soát tài chính: Ký túc xá hoàn trả cọc cho khách' : 'Kết quả đối soát tài chính: Khách hàng cần đóng thêm chênh lệch'}
        </div>
        <strong style={{ fontSize: '18px', color: khachDuocHoan ? '#16a34a' : '#dc2626', fontWeight: '800' }}>
          {Math.abs(soTienQuyetToan).toLocaleString('vi-VN')} đồng
        </strong>
      </div>

      {/* Checklist xác nhận bàn giao */}
      <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
        <h4 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '16px', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
          {isDatCoc ? 'Xác nhận hủy cọc giữ chỗ và giải phóng giường:' : 'Xác nhận thu hồi bàn giao phòng ngủ / giường ngủ:'}
        </h4>
        
        {isDatCoc ? (
          <ul style={{ paddingLeft: '0', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '14px', listStyle: 'none', margin: 0 }}>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontWeight: '600', color: '#334155' }}>
              <span style={{ color: 'var(--primary-color)', fontWeight: '800' }}>•</span>
              Khách hàng đồng ý hủy bỏ đăng ký quyền giữ chỗ và rút lại 80% số tiền đặt cọc theo quy định.
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontWeight: '600', color: '#334155' }}>
              <span style={{ color: 'var(--primary-color)', fontWeight: '800' }}>•</span>
              Chi nhánh xác nhận chưa bàn giao chìa khóa phòng, khóa tủ và thẻ từ ra vào.
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontWeight: '600', color: '#334155' }}>
              <span style={{ color: 'var(--primary-color)', fontWeight: '800' }}>•</span>
              Ghi nhận không phát sinh bàn giao tài sản thiết bị, không có hư hỏng hay hao mòn vật chất.
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontWeight: '600', color: '#334155' }}>
              <span style={{ color: 'var(--primary-color)', fontWeight: '800' }}>•</span>
              Giải phóng vị trí giường ngủ về trạng thái "TRỐNG" trên hệ thống để sẵn sàng cho khách tiếp theo.
            </li>
          </ul>
        ) : (
          <ul style={{ paddingLeft: '0', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '14px', listStyle: 'none', margin: 0 }}>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontWeight: '600', color: '#334155' }}>
              <span style={{ color: 'var(--primary-color)', fontWeight: '800' }}>•</span>
              Khách thuê đã dọn sạch toàn bộ đồ đạc cá nhân ra khỏi phòng và chi nhánh ký túc xá.
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontWeight: '600', color: '#334155' }}>
              <span style={{ color: 'var(--primary-color)', fontWeight: '800' }}>•</span>
              Đã thu hồi đầy đủ chìa khóa phòng, khóa tủ và thẻ từ ra vào (không thiếu hụt).
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontWeight: '600', color: '#334155' }}>
              <span style={{ color: 'var(--primary-color)', fontWeight: '800' }}>•</span>
              Đã xác nhận biên bản kiểm kê tài sản bàn giao, không phát sinh tranh chấp hư hại khác.
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontWeight: '600', color: '#334155' }}>
              <span style={{ color: 'var(--primary-color)', fontWeight: '800' }}>•</span>
              Cập nhật trạng thái phòng/giường ngủ về trạng thái "TRỐNG" trên hệ thống để tiếp tục cho thuê.
            </li>
          </ul>
        )}
      </div>

      <div style={{ background: '#eff6ff', border: '1px dashed #93c5fd', padding: '14px 18px', borderRadius: '10px', fontSize: '13.5px', color: '#1e40af', marginBottom: '28px', fontWeight: '500', lineHeight: '1.5' }}>
        Lưu ý: Sau khi hoàn tất ký biên bản thanh lý và thu hồi, hệ thống sẽ tự động chuyển hồ sơ sang bộ phận kế toán để thực hiện chi tiền hoàn cọc hoặc ghi nhận phiếu đã thu tiền thanh toán phát sinh từ khách hàng.
      </div>

      <div style={{ display: 'flex', gap: '16px' }}>
        <button type="submit" className="submit-btn"
          style={{ flex: '2', backgroundColor: 'var(--primary-color)', borderColor: 'var(--primary-color)', boxShadow: '0 4px 12px rgba(242,106,33,0.15)', height: '48px', fontSize: '15px', fontWeight: '700', borderRadius: '8px' }}>
          {isDatCoc ? 'Hoàn tất thủ tục hủy cọc và giải phóng chỗ' : 'Hoàn tất ký biên bản thanh lý và thu hồi phòng'}
        </button>
        <button type="button" className="btn-detail-outline" onClick={onCancel}
          style={{ flex: '1', borderRadius: '8px', height: '48px', fontSize: '14.5px', fontWeight: '700' }}>
          Hủy bỏ
        </button>
      </div>
    </form>
  );
}
