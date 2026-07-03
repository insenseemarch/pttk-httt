import React from 'react';

export default function ViewRequestDetails({ 
  selectedItem, 
  onClose 
}) {
  const isDatCoc = selectedItem?.loai === 'dat_coc';
  const trangThai = selectedItem?.trangThai || '';

  // Kiểm tra tiến trình
  const daKiemPhong = ['Chờ đối soát', 'Chờ xác nhận đối soát', 'Chờ thanh lý', 'Chờ hoàn cọc', 'Chờ thanh toán', 'Đã thanh lý'].includes(trangThai);
  const daDoiSoat = ['Chờ xác nhận đối soát', 'Chờ thanh lý', 'Chờ hoàn cọc', 'Chờ thanh toán', 'Đã thanh lý'].includes(trangThai);
  const daTatToan = trangThai === 'Đã thanh lý';

  // Tính toán số tiền
  const tienCocGoc = Number(selectedItem?.tienCoc || 0);
  const tiLeHoan = Number(selectedItem?.tiLeHoanCoc ?? 100);
  const tienCocSauTiLe = (tienCocGoc * tiLeHoan) / 100;
  
  const noThue = Number(selectedItem?.noThue || 0);
  const noDienNuoc = Number(selectedItem?.noDienNuoc || 0);
  const chiPhiHuHong = Number(selectedItem?.chiPhiHuHong || 0);
  
  const danhSachKhauTruKhac = selectedItem?.danhSachKhauTruKhac || [];
  const tongKhauTruKhac = danhSachKhauTruKhac.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  // Tổng thực nhận
  const thucNhan = tienCocSauTiLe - noThue - noDienNuoc - chiPhiHuHong - tongKhauTruKhac;

  // Lấy badge trạng thái
  const getStatusBadge = () => {
    let color = '#d97706';
    let bg = '#fef3c7';
    switch (trangThai) {
      case 'Chờ kiểm tra': color = '#d97706'; bg = '#fef3c7'; break;
      case 'Chờ đối soát': color = '#7c3aed'; bg = '#f3e8ff'; break;
      case 'Chờ xác nhận đối soát': color = '#2563eb'; bg = '#dbeafe'; break;
      case 'Chờ thanh toán': color = '#db2777'; bg = '#fce7f3'; break;
      case 'Chờ thanh lý': color = '#0d9488'; bg = '#ccfbf1'; break;
      case 'Đã thanh lý': color = '#15803d'; bg = '#d1fae5'; break;
    }
    return (
      <span style={{ 
        fontSize: '12.5px', 
        fontWeight: '800', 
        color, 
        backgroundColor: bg, 
        padding: '6px 14px', 
        borderRadius: '8px',
        textTransform: 'uppercase',
        letterSpacing: '0.03em'
      }}>
        {trangThai}
      </span>
    );
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '28px', fontFamily: 'inherit' }}>
      
      {/* Header Hồ Sơ */}
      <div style={{ 
        background: '#ffffff', 
        border: '1px solid #e2e8f0', 
        borderRadius: '16px', 
        padding: '24px 32px', 
        boxShadow: '0 4px 20px rgba(0,0,0,0.02)', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderLeft: '5px solid var(--primary-color)'
      }}>
        <div>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '4px' }}>
            HỆ THỐNG QUẢN LÝ HOMESTAY
          </span>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '850', color: '#0f172a', letterSpacing: '-0.02em' }}>
            Hồ Sơ Quyết Toán và Thanh Lý Hợp Đồng
          </h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Trạng thái hồ sơ:</span>
          {getStatusBadge()}
        </div>
      </div>

      {/* THÔNG TIN CHUNG HỢP ĐỒNG */}
      <div style={{ 
        background: '#ffffff', 
        border: '1px solid #e2e8f0', 
        borderRadius: '16px', 
        padding: '32px', 
        boxShadow: '0 4px 20px rgba(0,0,0,0.02)' 
      }}>
        <h3 style={{ margin: '0 0 24px 0', fontSize: '14px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px' }}>👤</span> THÔNG TIN CHUNG CHỨNG TỪ
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px 48px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
              <span style={{ color: '#64748b', fontWeight: '600' }}>Khách hàng:</span>
              <strong style={{ color: '#0f172a' }}>{selectedItem?.tenKhachHang}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
              <span style={{ color: '#64748b', fontWeight: '600' }}>Số điện thoại:</span>
              <strong style={{ color: '#0f172a' }}>{selectedItem?.soDienThoai}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
              <span style={{ color: '#64748b', fontWeight: '600' }}>Email:</span>
              <strong style={{ color: '#0f172a' }}>{selectedItem?.email}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
              <span style={{ color: '#64748b', fontWeight: '600' }}>Mã chứng từ:</span>
              <strong style={{ color: 'var(--primary-color)' }}>{selectedItem?.maSo}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
              <span style={{ color: '#64748b', fontWeight: '600' }}>Phòng và Chi nhánh:</span>
              <strong style={{ color: '#0f172a' }}>{selectedItem?.phongCoSo}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
              <span style={{ color: '#64748b', fontWeight: '600' }}>Tiền cọc phòng gốc:</span>
              <strong style={{ color: '#059669', fontWeight: '800' }}>{tienCocGoc.toLocaleString('vi-VN')} đ</strong>
            </div>
          </div>
        </div>
      </div>

      {/* THÔNG TIN TIẾN TRÌNH NGHIỆP VỤ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        
        {/* PHẦN I: PHIẾU ĐĂNG KÝ TRẢ PHÒNG HOẶC HỦY ĐẶT CỌC */}
        <div style={{ 
          background: '#ffffff', 
          border: '1px solid #e2e8f0', 
          borderRadius: '16px', 
          padding: '32px', 
          boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
          borderLeft: '4px solid #2563eb'
        }}>
          <h4 style={{ margin: '0 0 20px 0', fontSize: '14.5px', fontWeight: '800', color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
            I. PHIẾU ĐĂNG KÝ TRẢ PHÒNG HOẶC HỦY ĐẶT CỌC
          </h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px 32px', fontSize: '14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>Ngày trả thực tế dự kiến:</span>
                <strong style={{ color: '#0f172a' }}>{selectedItem?.ngayTraDuKien || 'Chưa ghi nhận'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>Hình thức yêu cầu:</span>
                <strong style={{ color: '#0f172a' }}>
                  {isDatCoc ? 'Hủy quyền giữ chỗ và rút tiền cọc' : (selectedItem?.loaiHinhTraPhong === 'dung_han' ? 'Đúng hạn hợp đồng' : 'Chấm dứt trước hạn')}
                </strong>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>Phương thức hoàn cọc:</span>
                <strong style={{ color: '#0f172a' }}>
                  {selectedItem?.phuongThucHoanTien === 'chuyen_khoan' ? 'Chuyển khoản ngân hàng' : 'Tiền mặt'}
                </strong>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ color: '#64748b' }}>Lý do chi tiết:</span>
                <span style={{ color: '#334155', fontStyle: 'italic', fontWeight: '500' }}>
                  "{selectedItem?.lyDo || 'Không có ghi chú lý do'}"
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* PHẦN II: BIÊN BẢN NGHIỆM THU HIỆN TRẠNG PHÒNG */}
        {daKiemPhong && (
          <div style={{ 
            background: '#ffffff', 
            border: '1px solid #e2e8f0', 
            borderRadius: '16px', 
            padding: '32px', 
            boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
            borderLeft: '4px solid #16a34a'
          }}>
            <h4 style={{ margin: '0 0 20px 0', fontSize: '14.5px', fontWeight: '800', color: '#14532d', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
              II. BIÊN BẢN NGHIỆM THU HIỆN TRẠNG PHÒNG
            </h4>
            
            {isDatCoc ? (
              <div style={{ background: '#f0fdf4', border: '1px solid #b7f4cf', padding: '16px 20px', borderRadius: '12px', fontSize: '14px', color: '#15803d', fontWeight: '600' }}>
                ✓ Khách hàng đặt cọc giữ chỗ và chưa dọn vào ở. Không có bàn giao thiết bị phòng thực tế cần nghiệm thu.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Thiết bị kiểm phòng */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 18px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13.5px' }}>
                    <span style={{ color: '#475569', fontWeight: '500' }}>Giường ngủ:</span>
                    <strong style={{ color: chiPhiHuHong > 0 && selectedItem?.moTaHuHong?.toLowerCase().includes('giường') ? '#b91c1c' : '#16a34a', fontWeight: '700' }}>
                      {chiPhiHuHong > 0 && selectedItem?.moTaHuHong?.toLowerCase().includes('giường') ? 'Hao mòn nặng' : 'Bình thường'}
                    </strong>
                  </div>
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 18px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13.5px' }}>
                    <span style={{ color: '#475569', fontWeight: '500' }}>Nệm cao su:</span>
                    <strong style={{ color: chiPhiHuHong > 0 && selectedItem?.moTaHuHong?.toLowerCase().includes('nệm') ? '#b91c1c' : '#16a34a', fontWeight: '700' }}>
                      {chiPhiHuHong > 0 && selectedItem?.moTaHuHong?.toLowerCase().includes('nệm') ? 'Hao mòn nặng' : 'Bình thường'}
                    </strong>
                  </div>
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 18px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13.5px' }}>
                    <span style={{ color: '#475569', fontWeight: '500' }}>Tủ quần áo:</span>
                    <strong style={{ color: chiPhiHuHong > 0 && selectedItem?.moTaHuHong?.toLowerCase().includes('tủ') ? '#b91c1c' : '#16a34a', fontWeight: '700' }}>
                      {chiPhiHuHong > 0 && selectedItem?.moTaHuHong?.toLowerCase().includes('tủ') ? 'Hao mòn nặng' : 'Bình thường'}
                    </strong>
                  </div>
                </div>

                {/* Danh mục bàn giao */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', background: '#fbfcfd', border: '1px dashed #cbd5e1', padding: '20px', borderRadius: '12px', fontSize: '14px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#475569' }}>• Vệ sinh phòng ngủ:</span>
                      <strong style={{ color: '#0f172a' }}>✓ Đã dọn sạch</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#475569' }}>• Chìa khóa và Thẻ phòng:</span>
                      <strong style={{ color: '#0f172a' }}>✓ Đã thu hồi</strong>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#475569' }}>• Hiện trạng hao hại:</span>
                      <strong style={{ color: chiPhiHuHong > 0 ? '#b91c1c' : '#16a34a' }}>
                        {chiPhiHuHong > 0 ? 'Phát hiện hư hỏng' : 'Bình thường'}
                      </strong>
                    </div>
                    {chiPhiHuHong > 0 && (
                      <div style={{ fontSize: '13px', color: '#64748b', fontStyle: 'italic', borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
                        Chi tiết: "{selectedItem?.moTaHuHong}" (Chi phí bồi thường đền bù: {chiPhiHuHong.toLocaleString('vi-VN')} đ)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PHẦN III: BẢNG PHƯƠNG ÁN ĐỐI SOÁT & QUYẾT TOÁN TÀI CHÍNH */}
        {daDoiSoat && (
          <div style={{ 
            background: '#ffffff', 
            border: '1px solid #e2e8f0', 
            borderRadius: '16px', 
            padding: '32px', 
            boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
            borderLeft: '4px solid #db2777'
          }}>
            <h4 style={{ margin: '0 0 20px 0', fontSize: '14.5px', fontWeight: '800', color: '#500730', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
              III. BẢNG PHƯƠNG ÁN ĐỐI SOÁT VÀ QUYẾT TOÁN TÀI CHÍNH
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '4fr 3fr', gap: '48px' }}>
              
              {/* Bảng tính chi phí */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13.5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#475569', fontWeight: '500' }}>Tiền cọc phòng ban đầu:</span>
                  <strong style={{ color: '#0f172a' }}>{tienCocGoc.toLocaleString('vi-VN')} đ</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#475569', fontWeight: '500' }}>Tỉ lệ hoàn trả ({tiLeHoan}%):</span>
                  <strong style={{ color: '#0f172a' }}>{tienCocSauTiLe.toLocaleString('vi-VN')} đ</strong>
                </div>
                {noThue > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9', color: '#b91c1c' }}>
                    <span>Khấu trừ nợ tiền thuê phòng:</span>
                    <strong>- {noThue.toLocaleString('vi-VN')} đ</strong>
                  </div>
                )}
                {noDienNuoc > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9', color: '#b91c1c' }}>
                    <span>Khấu trừ nợ điện nước phát sinh:</span>
                    <strong>- {noDienNuoc.toLocaleString('vi-VN')} đ</strong>
                  </div>
                )}
                {chiPhiHuHong > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9', color: '#b91c1c' }}>
                    <span>Khấu trừ chi phí đền bù hư hỏng:</span>
                    <strong>- {chiPhiHuHong.toLocaleString('vi-VN')} đ</strong>
                  </div>
                )}
                {danhSachKhauTruKhac.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9', color: '#b91c1c' }}>
                    <span>Khấu trừ {item.name} ({item.desc || 'Không có mô tả'}):</span>
                    <strong>- {Number(item.amount).toLocaleString('vi-VN')} đ</strong>
                  </div>
                ))}
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '12px 18px', 
                  borderRadius: '10px', 
                  backgroundColor: thucNhan >= 0 ? '#f0fdf4' : '#fef2f2', 
                  fontSize: '15px', 
                  marginTop: '8px',
                  border: `1px solid ${thucNhan >= 0 ? '#b7f4cf' : '#fca5a5'}`
                }}>
                  <span style={{ color: thucNhan >= 0 ? '#15803d' : '#b91c1c', fontWeight: '800' }}>
                    {thucNhan >= 0 ? 'SỐ TIỀN HOÀN TRẢ KHÁCH HÀNG:' : 'SỐ TIỀN KHÁCH HÀNG THU THÊM:'}
                  </span>
                  <strong style={{ color: thucNhan >= 0 ? '#16a34a' : '#ef4444', fontSize: '18px', fontWeight: '900' }}>
                    {Math.abs(thucNhan).toLocaleString('vi-VN')} đ
                  </strong>
                </div>
              </div>

              {/* Thông tin chuyển khoản */}
              <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '32px', display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px' }}>
                <h5 style={{ margin: '0 0 8px 0', fontSize: '13px', textTransform: 'uppercase', color: '#475569', fontWeight: '800', letterSpacing: '0.04em' }}>
                  🏦 TÀI KHOẢN HOÀN TIỀN
                </h5>
                <div>Chủ tài khoản: <strong style={{ color: '#0f172a' }}>{selectedItem?.bankOwner || selectedItem?.tenKhachHang}</strong></div>
                <div>Số tài khoản: <strong style={{ color: '#0f172a', fontSize: '15px', fontWeight: '700' }}>{selectedItem?.bankAcc || '1903xxxxxxxx'}</strong></div>
                <div>Ngân hàng: <strong style={{ color: '#0f172a' }}>{selectedItem?.bankName || 'Vietcombank'}</strong></div>
              </div>

            </div>
          </div>
        )}

        {/* PHẦN IV: CHỨNG TỪ CHI TRẢ & TẤT TOÁN GIAO DỊCH */}
        {daTatToan && (
          <div style={{ 
            background: '#ffffff', 
            border: '1px solid #e2e8f0', 
            borderRadius: '16px', 
            padding: '32px', 
            boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
            borderLeft: '4px solid #0d9488'
          }}>
            <h4 style={{ margin: '0 0 20px 0', fontSize: '14.5px', fontWeight: '800', color: '#042f2e', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
              IV. CHỨNG TỪ CHI TRẢ VÀ TẤT TOÁN GIAO DỊCH
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', background: '#f0fdfa', border: '1px solid #b2f5ea', padding: '20px', borderRadius: '12px', fontSize: '14px', color: '#0f766e' }}>
              <div>
                • Trạng thái chi trả: <strong style={{ color: '#0d9488', fontWeight: '800' }}>✓ ĐÃ TẤT TOÁN GIAO DỊCH CHUYỂN KHOẢN</strong>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>• Mã số bút toán (Ref): <strong style={{ color: '#0f172a' }}>{selectedItem?.maGiaoDich}</strong></div>
                <div>• Ngày hạch toán thực tế: <strong style={{ color: '#0f172a' }}>{selectedItem?.giaoDichDate}</strong></div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Button quay lại */}
      <button 
        type="button" 
        className="submit-btn" 
        style={{ 
          background: '#64748b', 
          borderColor: '#64748b', 
          boxShadow: 'none', 
          width: '100%', 
          height: '48px', 
          fontWeight: '700', 
          borderRadius: '10px', 
          marginTop: '12px',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }} 
        onMouseOver={(e) => e.currentTarget.style.background = '#475569'}
        onMouseOut={(e) => e.currentTarget.style.background = '#64748b'}
        onClick={onClose}
      >
        Quay lại danh sách
      </button>
    </div>
  );
}
