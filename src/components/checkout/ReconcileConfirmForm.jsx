import React from 'react';

export default function ReconcileConfirmForm({
  selectedItem,
  onConfirm,
  onCancel
}) {
  const [showDisputeModal, setShowDisputeModal] = React.useState(false);
  const [disputeReason, setDisputeReason] = React.useState('');

  const isDatCoc = selectedItem?.loai === 'dat_coc';
  
  const isHoanMotPhan = selectedItem?.loaiDoiSoat === 'HOAN_COC_THANH_VIEN_KHONG_DAT';
  const soThanhVienKhongDat = Number((selectedItem.danhSachKhauTruKhac || []).find(item => item.name === 'SoThanhVienKhongDat')?.desc || (selectedItem.danhSachKhauTruKhac || []).filter(item => item.name === 'ThanhVienKhongDat').length || 0);

  const tienCocGocToanBo = Number(selectedItem.tienCoc) || 0;
  let tienCocGoc = tienCocGocToanBo;
  if (isHoanMotPhan && selectedItem?.soThanhVienDangKy) {
    tienCocGoc = (tienCocGocToanBo / Math.max(1, selectedItem.soThanhVienDangKy)) * soThanhVienKhongDat;
  }

  const tiLeHoan = selectedItem.tiLeHoanCoc || 100;
  const tienCocDuocHoan = tienCocGoc * (tiLeHoan / 100);

  const noThue = isDatCoc ? 0 : (selectedItem.noThue || 0);
  const noDienNuoc = isDatCoc ? 0 : (selectedItem.noDienNuoc || 0);
  const chiPhiHuHong = isDatCoc ? 0 : (selectedItem.chiPhiHuHong || 0);

  const danhSachKhauTruKhac = (selectedItem.danhSachKhauTruKhac || []).filter(item => 
    !['LoaiDoiSoat', 'HinhThuc', 'MaDatCoc', 'ThanhVienKhongDat'].includes(item.name) && 
    item.id !== '_meta'
  );
  const tongKhauTruKhac = danhSachKhauTruKhac.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const tongKhauTru = noThue + noDienNuoc + chiPhiHuHong + tongKhauTruKhac;
  const soTienQuyetToan = tienCocDuocHoan - tongKhauTru;
  const khachDuocHoan = soTienQuyetToan >= 0;

  const loaiHinh = isDatCoc
    ? 'Hủy đăng ký cọc giữ chỗ'
    : (selectedItem.loaiHinhTraPhong === 'truoc_han' ? 'Chấm dứt hợp đồng thuê trước hạn' : 'Hết hạn hợp đồng thuê');

  const phuongThuc = selectedItem.phuongThucHoanTien === 'chuyen_khoan' ? 'Chuyển khoản ngân hàng' : 'Tiền mặt tại văn phòng';

  return (
    <div style={{
      width: '100%',
      display: 'flex',
      flexDirection: 'row',
      gap: '24px',
      backgroundColor: '#f8fafc',
      padding: '24px',
      borderRadius: '12px',
      fontFamily: 'Inter, system-ui, sans-serif',
      position: 'relative'
    }}>
      
      {onCancel && (
        <button 
          type="button" 
          onClick={onCancel}
          style={{ 
            position: 'absolute', top: '12px', right: '12px',
            background: '#e2e8f0', border: 'none', cursor: 'pointer',
            color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '6px', borderRadius: '50%', transition: 'all 0.2s', zIndex: 10
          }}
          title="Đóng"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
        </button>
      )}

      {/* LEFT PANE */}
      <div style={{ flex: '1.5', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>

        {/* Header Left */}
        <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '22px', fontWeight: '700', color: '#0f172a' }}>
              Chi tiết đối soát tất toán
            </h2>
            <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
              {selectedItem.phongCoSo} — Khách hàng: {selectedItem.tenKhachHang}
            </p>
            {isDatCoc && selectedItem.lyDo && (
              <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: '#b45309', fontWeight: '500' }}>
                Lý do hoàn: {selectedItem.lyDo}
              </p>
            )}
          </div>
          <div style={{ background: '#e2e8f0', color: '#64748b', fontSize: '13px', fontWeight: '600', padding: '6px 12px', borderRadius: '20px', whiteSpace: 'nowrap' }}>
            Đang đối soát
          </div>
        </div>

        {/* Các khoản hoàn lại */}
        <div style={{ padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#16a34a' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px', fontWeight: 'bold' }}>account_balance_wallet</span>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>Các khoản hoàn lại</h3>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ textAlign: 'left', padding: '10px 16px', color: '#64748b', fontWeight: '600', fontSize: '13px' }}>Hạng mục</th>
                <th style={{ textAlign: 'right', padding: '10px 16px', color: '#64748b', fontWeight: '600', fontSize: '13px' }}>Số tiền</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', color: '#334155' }}>Tiền cọc phòng</td>
                <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontWeight: '600', color: '#0f172a' }}>
                  {tienCocGoc.toLocaleString('vi-VN')} đ
                </td>
              </tr>
              {tienCocDuocHoan !== tienCocGoc && (
                <tr>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', color: '#334155' }}>Khấu trừ tỷ lệ ({100 - tiLeHoan}%)</td>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontWeight: '600', color: '#0f172a' }}>
                    -{(tienCocGoc - tienCocDuocHoan).toLocaleString('vi-VN')} đ
                  </td>
                </tr>
              )}
              <tr style={{ background: '#ecfdf5' }}>
                <td style={{ padding: '12px 16px', fontWeight: '700', color: '#059669' }}>Tổng cộng hoàn</td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '700', color: '#059669', fontSize: '16px' }}>
                  {tienCocDuocHoan.toLocaleString('vi-VN')} đ
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Các khoản khấu trừ */}
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#dc2626' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px', fontWeight: 'bold' }}>receipt_long</span>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>Các khoản khấu trừ & phí phát sinh</h3>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ textAlign: 'left', padding: '10px 16px', color: '#64748b', fontWeight: '600', fontSize: '13px' }}>Hạng mục</th>
                <th style={{ textAlign: 'right', padding: '10px 16px', color: '#64748b', fontWeight: '600', fontSize: '13px' }}>Số tiền</th>
              </tr>
            </thead>
            <tbody>
              {noThue > 0 && (
                <tr>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', color: '#334155' }}>Nợ tiền thuê</td>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontWeight: '600', color: '#0f172a' }}>
                    {noThue.toLocaleString('vi-VN')} đ
                  </td>
                </tr>
              )}
              {noDienNuoc > 0 && (
                <tr>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', color: '#334155' }}>Nợ điện nước / Dịch vụ</td>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontWeight: '600', color: '#0f172a' }}>
                    {noDienNuoc.toLocaleString('vi-VN')} đ
                  </td>
                </tr>
              )}
              {chiPhiHuHong > 0 && (
                <tr>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', color: '#334155' }}>Khấu trừ hư hỏng ({selectedItem.moTaHuHong || 'Có'})</td>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontWeight: '600', color: '#0f172a' }}>
                    {chiPhiHuHong.toLocaleString('vi-VN')} đ
                  </td>
                </tr>
              )}
              {danhSachKhauTruKhac.map(item => (
                <tr key={item.id}>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', color: '#334155' }}>{item.name} ({item.desc})</td>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontWeight: '600', color: '#0f172a' }}>
                    {Number(item.amount).toLocaleString('vi-VN')} đ
                  </td>
                </tr>
              ))}

              <tr style={{ background: '#fef2f2' }}>
                <td style={{ padding: '12px 16px', fontWeight: '700', color: '#dc2626' }}>Tổng cộng trừ</td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '700', color: '#dc2626', fontSize: '16px' }}>
                  {tongKhauTru.toLocaleString('vi-VN')} đ
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* RIGHT PANE */}
      <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Kết quả tất toán */}
        <div style={{
          background: khachDuocHoan ? '#16a34a' : '#dc2626',
          borderRadius: '12px',
          padding: '24px',
          color: '#ffffff',
          textAlign: 'center',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600', marginBottom: '8px', opacity: 0.9 }}>
            Kết quả tất toán
          </div>
          <h2 style={{ fontSize: '24px', margin: '0 0 16px 0', fontWeight: '800' }}>
            {khachDuocHoan ? 'KHÁCH ĐƯỢC HOÀN' : 'KHÁCH CẦN TRẢ THÊM'}
            <br />
            <span style={{ fontSize: '36px', display: 'block', marginTop: '8px' }}>
              {Math.abs(soTienQuyetToan).toLocaleString('vi-VN')} đ
            </span>
          </h2>
          <p style={{ fontSize: '13px', margin: 0, fontStyle: 'italic', opacity: 0.85, lineHeight: '1.5' }}>
            {khachDuocHoan ? '*Số tiền này sẽ được chuyển vào số tài khoản đã đăng ký của khách sau khi xác nhận.*' : '*Khách hàng cần thanh toán số tiền chênh lệch này để hoàn tất.*'}
          </p>
        </div>

        {/* Hành động */}
        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
            Xác nhận phản hồi từ khách
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              type="button"
              onClick={() => onConfirm('dong_y')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                width: '100%', height: '56px', borderRadius: '8px', border: 'none',
                background: '#16a34a', color: '#ffffff', fontWeight: '700', fontSize: '15px',
                cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              <span className="material-symbols-outlined">check_circle</span>
              Khách hàng đồng ý
            </button>

            <button
              type="button"
              onClick={() => setShowDisputeModal(true)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                width: '100%', height: '56px', borderRadius: '8px',
                border: '1.5px solid #dc2626', background: '#ffffff', color: '#dc2626',
                fontWeight: '700', fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              <span className="material-symbols-outlined">cancel</span>
              Khách không đồng ý
            </button>

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                style={{
                  width: '100%', height: '40px', borderRadius: '8px', marginTop: '8px',
                  border: 'none', background: 'transparent', color: '#64748b',
                  fontWeight: '600', fontSize: '14px', cursor: 'pointer', textDecoration: 'underline'
                }}
              >
                Quay lại danh sách
              </button>
            )}
          </div>
        </div>

        {/* Lưu ý */}
        <div style={{ background: '#f1f5f9', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', marginBottom: '12px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>info</span>
            <span style={{ fontWeight: '700', fontSize: '14px' }}>Lưu ý quan trọng</span>
          </div>
          <ul style={{ paddingLeft: '20px', margin: 0, color: '#475569', fontSize: '13px', lineHeight: '1.6' }}>
            <li style={{ marginBottom: '6px' }}>Kiểm tra lại kỹ các chỉ số điện nước trước khi nhấn xác nhận.</li>
            <li>Mọi thay đổi sau khi nhấn "Tiến hành hoàn/thu tiền" sẽ không thể đảo ngược tự động.</li>
          </ul>
        </div>
      </div>

      {/* MODAL GHI NHẬN TRANH CHẤP */}
      {showDisputeModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px'
        }}>
          <div style={{
            background: '#ffffff', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '520px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0', boxSizing: 'border-box'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>Ghi nhận phản hồi tranh chấp</h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '13.5px', color: '#64748b', lineHeight: '1.5', fontWeight: '500' }}>
              Vui lòng nhập chi tiết các ý kiến phản hồi hoặc lý do khách hàng không đồng ý với phương án đối soát tài chính hiện tại để chuyển trả về cho bộ phận Kế toán điều chỉnh.
            </p>
            <textarea
              rows="4"
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="Ví dụ: Khách hàng không đồng ý mức khấu trừ..."
              style={{
                width: '100%', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '12px 14px',
                fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', resize: 'none',
                height: '120px', marginBottom: '24px'
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
                  flex: '2', backgroundColor: 'var(--primary-color)', color: '#ffffff', height: '44px', borderRadius: '8px', fontWeight: '700', fontSize: '14px', border: 'none', cursor: 'pointer'
                }}
              >
                Gửi phản hồi cho Kế toán
              </button>
              <button
                type="button"
                onClick={() => setShowDisputeModal(false)}
                style={{
                  flex: '1', backgroundColor: '#f1f5f9', border: 'none', color: '#475569', height: '44px', borderRadius: '8px', fontWeight: '700', fontSize: '14px', cursor: 'pointer'
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
