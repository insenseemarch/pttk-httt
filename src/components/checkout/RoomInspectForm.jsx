import React, { useState } from 'react';

export default function RoomInspectForm(props) {
  try {
    return <RoomInspectFormInner {...props} />;
  } catch (error) {
    return (
      <div style={{ padding: '32px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '16px', color: '#b91c1c', maxWidth: '700px', margin: '40px auto', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '800' }}>Lỗi hiển thị biểu mẫu kiểm phòng</h3>
        <p style={{ margin: '0 0 20px 0', fontSize: '14.5px', lineHeight: '1.6' }}>
          Đã xảy ra sự cố trong quá trình tính toán hoặc kết xuất giao diện nghiệm thu.
          <br />
          <strong style={{ color: '#ef4444' }}>Chi tiết lỗi: {error.stack || error.message}</strong>
        </p>
        <button 
          type="button" 
          className="btn-detail-outline" 
          onClick={props.onCancel}
          style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }
}

function RoomInspectFormInner({ 
  selectedItem, 
  formValues, 
  onChange, 
  onCheckboxChange, 
  onSubmit, 
  onCancel 
}) {
  const isDatCoc = selectedItem?.loai === 'dat_coc';
  
  const ngayBatDauStr = selectedItem?.ngayBatDau;
  const ngayKetThucStr = selectedItem?.ngayKetThuc;
  const homNay = new Date();
  
  // Tính lộ trình hợp đồng cho Quản lý xem giống bên Sale (an toàn tuyệt đối)
  let timelineInfo = null;
  if (ngayBatDauStr && ngayKetThucStr && !isDatCoc) {
    const start = new Date(ngayBatDauStr);
    const end = new Date(ngayKetThucStr);
    
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      const totalMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      
      let diffSpent = homNay - start;
      if (diffSpent < 0) diffSpent = 0;
      const spentDaysTotal = Math.floor(diffSpent / (1000 * 60 * 60 * 24 * 30));
      const spentMonths = Math.floor(spentDaysTotal);
      const spentDays = Math.floor((diffSpent % (1000 * 60 * 60 * 24 * 30)) / (1000 * 60 * 60 * 24));
      
      let diffLeft = end - homNay;
      if (diffLeft < 0) diffLeft = 0;
      const leftDaysTotal = Math.floor(diffLeft / (1000 * 60 * 60 * 24 * 30));
      const leftMonths = Math.floor(leftDaysTotal);
      const leftDays = Math.floor((diffLeft % (1000 * 60 * 60 * 24 * 30)) / (1000 * 60 * 60 * 24));

      const totalDays = Math.max(1, Math.floor((end - start) / (1000 * 60 * 60 * 24)));
      const spentDaysActual = Math.floor(diffSpent / (1000 * 60 * 60 * 24));
      const progressPercent = Math.min(100, Math.max(0, Math.floor((spentDaysActual / totalDays) * 100)));

      timelineInfo = {
        totalMonths,
        spentStr: `${spentMonths} tháng ${spentDays} ngày`,
        leftStr: `${leftMonths} tháng ${leftDays} ngày`,
        progressPercent
      };
    }
  }

  // Trạng thái các tài sản kiểm tra (Giường ngủ, Nệm cao su, Tủ quần áo)
  const [trangThaiGiuong, setTrangThaiGiuong] = useState('binh_thuong');
  const [trangThaiNem, setTrangThaiNem] = useState('binh_thuong');
  const [trangThaiTu, setTrangThaiTu] = useState('binh_thuong');
  
  // Trạng thái ảnh minh chứng giả lập
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const xuLyThayDoiAnh = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedPhoto(URL.createObjectURL(file));
    }
  };

  const hasHuHong = trangThaiGiuong === 'hu_hong' || trangThaiNem === 'hu_hong' || trangThaiTu === 'hu_hong';
  const isAllNormal = !hasHuHong;

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 2-Column layout for contract details & timeline */}
      <div style={{ display: 'grid', gridTemplateColumns: isDatCoc ? '1fr' : '380px 1fr', gap: '24px' }}>
        
        {/* Left card: Thông tin hợp đồng */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', background: isDatCoc ? '#fef3c7' : '#d1fae5', color: isDatCoc ? '#d97706' : '#065f46', padding: '4px 10px', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {isDatCoc ? 'Phiếu đặt cọc' : 'Đang hiệu lực'}
            </span>
          </div>
          
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--primary-color)', margin: '0 0 20px 0', letterSpacing: '-0.02em' }}>
            {selectedItem.maSo}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>
                  {isDatCoc ? 'Khách đặt cọc' : 'Khách thuê'}
                </span>
                <strong style={{ fontSize: '14.5px', color: '#0f172a' }}>{selectedItem.tenKhachHang}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>Phòng và chi nhánh</span>
                <strong style={{ fontSize: '14.5px', color: '#0f172a' }}>{selectedItem.phongCoSo}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>
                  {isDatCoc ? 'Tiền đặt cọc ban đầu' : 'Giá thuê phòng'}
                </span>
                <strong style={{ fontSize: '14.5px', color: '#0f172a' }}>
                  {isDatCoc
                    ? `${Number(selectedItem.tienCoc).toLocaleString('vi-VN')} đồng`
                    : `${Number(selectedItem.giaThue || 0).toLocaleString('vi-VN')} đồng/tháng`
                  }
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Right card: Lộ trình hợp đồng */}
        {!isDatCoc && timelineInfo && (
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                Lộ trình hợp đồng thuê
              </h3>
              
              {/* Progress bar */}
              <div style={{ position: 'relative', height: '8px', background: '#e2e8f0', borderRadius: '4px', margin: '24px 0 16px 0' }}>
                <div style={{ width: `${timelineInfo.progressPercent}%`, height: '100%', background: 'var(--primary-color)', borderRadius: '4px' }} />
                {/* Pins */}
                <div style={{ position: 'absolute', left: 0, top: '-4px', width: '16px', height: '16px', borderRadius: '50%', background: '#ffffff', border: '3px solid var(--primary-color)' }} />
                <div style={{ position: 'absolute', left: `${timelineInfo.progressPercent}%`, top: '-4px', width: '16px', height: '16px', borderRadius: '50%', background: '#ffffff', border: '3px solid var(--primary-color)', transform: 'translateX(-50%)' }} />
                <div style={{ position: 'absolute', right: 0, top: '-4px', width: '16px', height: '16px', borderRadius: '50%', background: '#ffffff', border: '3px solid #cbd5e1' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', fontWeight: '700', marginBottom: '20px' }}>
                <div>Ngày bắt đầu<br /><span style={{ color: '#0f172a', fontSize: '13px' }}>{selectedItem.ngayBatDau}</span></div>
                <div style={{ textAlign: 'center' }}>Hôm nay<br /><span style={{ color: 'var(--primary-color)', fontSize: '13px' }}>{homNay.toLocaleDateString('vi-VN')}</span></div>
                <div style={{ textAlign: 'right' }}>Ngày kết thúc<br /><span style={{ color: '#0f172a', fontSize: '13px' }}>{selectedItem.ngayKetThuc}</span></div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>Tổng thời hạn</span>
                <strong style={{ fontSize: '15px', color: '#0f172a' }}>{timelineInfo.totalMonths} tháng</strong>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>Thời gian đã ở</span>
                <strong style={{ fontSize: '15px', color: '#0f172a' }}>{timelineInfo.spentStr}</strong>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>Thời gian còn lại</span>
                <strong style={{ fontSize: '15px', color: '#0f172a' }}>{timelineInfo.leftStr}</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main card: Phiếu nghiệm thu phòng */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '32px', boxShadow: '0 6px 18px rgba(0,0,0,0.03)' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: '0 0 24px 0', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
          Phiếu kiểm nghiệm thực tế tài sản phòng ngủ
        </h3>

        {isDatCoc ? (
          <div style={{ background: '#f0fdf4', border: '1px solid #b7f4cf', padding: '18px 24px', borderRadius: '12px', fontSize: '14.5px', color: '#15803d', fontWeight: '600', marginBottom: '24px' }}>
            Khách hàng mới chỉ đặt cọc giữ chỗ và chưa dọn vào ở. Không có tài sản bàn giao thực tế cần nghiệm thu.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', marginBottom: '28px' }}>
            
            {/* Section 1: Kiểm tra hiện trạng đồ dùng */}
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#334155', margin: '0 0 16px 0' }}>
                Hạng mục kiểm tra hiện trạng thiết bị:
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                
                {/* Giường ngủ Card */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', background: '#f8fafc', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '140px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '14.5px', color: '#1e293b' }}>Giường ngủ</strong>
                    <span style={{ fontSize: '10.5px', color: '#64748b', background: '#e2e8f0', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>Bàn giao: Mới 100%</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                    <label style={{ flex: '1', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', padding: '9px 0', border: `1.5px solid ${trangThaiGiuong === 'binh_thuong' ? '#64748b' : '#cbd5e1'}`, borderRadius: '8px', cursor: 'pointer', background: trangThaiGiuong === 'binh_thuong' ? '#f1f5f9' : '#ffffff', color: trangThaiGiuong === 'binh_thuong' ? '#1e293b' : '#64748b', transition: 'all 0.15s ease' }}>
                      <input type="radio" name="giuong" value="binh_thuong" checked={trangThaiGiuong === 'binh_thuong'} onChange={() => setTrangThaiGiuong('binh_thuong')} style={{ display: 'none' }} />
                      Bình thường
                    </label>
                    <label style={{ flex: '1', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', padding: '9px 0', border: `1.5px solid ${trangThaiGiuong === 'hu_hong' ? '#ef4444' : '#cbd5e1'}`, borderRadius: '8px', cursor: 'pointer', background: trangThaiGiuong === 'hu_hong' ? '#fef2f2' : '#ffffff', color: trangThaiGiuong === 'hu_hong' ? '#b91c1c' : '#64748b', transition: 'all 0.15s ease' }}>
                      <input type="radio" name="giuong" value="hu_hong" checked={trangThaiGiuong === 'hu_hong'} onChange={() => setTrangThaiGiuong('hu_hong')} style={{ display: 'none' }} />
                      Hư hỏng
                    </label>
                  </div>
                </div>

                {/* Nệm cao su Card */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', background: '#f8fafc', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '140px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '14.5px', color: '#1e293b' }}>Nệm cao su</strong>
                    <span style={{ fontSize: '10.5px', color: '#64748b', background: '#e2e8f0', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>Bàn giao: Mới 95%</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                    <label style={{ flex: '1', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', padding: '9px 0', border: `1.5px solid ${trangThaiNem === 'binh_thuong' ? '#64748b' : '#cbd5e1'}`, borderRadius: '8px', cursor: 'pointer', background: trangThaiNem === 'binh_thuong' ? '#f1f5f9' : '#ffffff', color: trangThaiNem === 'binh_thuong' ? '#1e293b' : '#64748b', transition: 'all 0.15s ease' }}>
                      <input type="radio" name="nem" value="binh_thuong" checked={trangThaiNem === 'binh_thuong'} onChange={() => setTrangThaiNem('binh_thuong')} style={{ display: 'none' }} />
                      Bình thường
                    </label>
                    <label style={{ flex: '1', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', padding: '9px 0', border: `1.5px solid ${trangThaiNem === 'hu_hong' ? '#ef4444' : '#cbd5e1'}`, borderRadius: '8px', cursor: 'pointer', background: trangThaiNem === 'hu_hong' ? '#fef2f2' : '#ffffff', color: trangThaiNem === 'hu_hong' ? '#b91c1c' : '#64748b', transition: 'all 0.15s ease' }}>
                      <input type="radio" name="nem" value="hu_hong" checked={trangThaiNem === 'hu_hong'} onChange={() => setTrangThaiNem('hu_hong')} style={{ display: 'none' }} />
                      Hư hỏng
                    </label>
                  </div>
                </div>

                {/* Tủ quần áo Card */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', background: '#f8fafc', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '140px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '14.5px', color: '#1e293b' }}>Tủ quần áo</strong>
                    <span style={{ fontSize: '10.5px', color: '#64748b', background: '#e2e8f0', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>Bàn giao: Mới 100%</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                    <label style={{ flex: '1', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', padding: '9px 0', border: `1.5px solid ${trangThaiTu === 'binh_thuong' ? '#64748b' : '#cbd5e1'}`, borderRadius: '8px', cursor: 'pointer', background: trangThaiTu === 'binh_thuong' ? '#f1f5f9' : '#ffffff', color: trangThaiTu === 'binh_thuong' ? '#1e293b' : '#64748b', transition: 'all 0.15s ease' }}>
                      <input type="radio" name="tu" value="binh_thuong" checked={trangThaiTu === 'binh_thuong'} onChange={() => setTrangThaiTu('binh_thuong')} style={{ display: 'none' }} />
                      Bình thường
                    </label>
                    <label style={{ flex: '1', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', padding: '9px 0', border: `1.5px solid ${trangThaiTu === 'hu_hong' ? '#ef4444' : '#cbd5e1'}`, borderRadius: '8px', cursor: 'pointer', background: trangThaiTu === 'hu_hong' ? '#fef2f2' : '#ffffff', color: trangThaiTu === 'hu_hong' ? '#b91c1c' : '#64748b', transition: 'all 0.15s ease' }}>
                      <input type="radio" name="tu" value="hu_hong" checked={trangThaiTu === 'hu_hong'} onChange={() => setTrangThaiTu('hu_hong')} style={{ display: 'none' }} />
                      Hư hỏng
                    </label>
                  </div>
                </div>

              </div>
            </div>

            {/* Section 2: Ghi nhận hao mòn và bồi thường */}
            {hasHuHong && (
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '24px', transition: 'all 0.3s ease' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#b45309', margin: '0 0 16px 0' }}>
                  Khai báo chi tiết hư hại tài sản
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                  
                  {/* Cột mô tả */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '700', color: '#b45309' }}>Mô tả chi tiết tình trạng hư hỏng</label>
                    <textarea 
                      rows="3" 
                      name="moTaHuHong" 
                      value={formValues.moTaHuHong || ''} 
                      onChange={onChange} 
                      placeholder="Mô tả chi tiết linh kiện bị hỏng, trầy xước, nứt vỡ..." 
                      style={{ border: '1px solid #fcd34d', padding: '12px 14px', borderRadius: '8px', fontSize: '13.5px', outline: 'none', fontFamily: 'inherit', height: '112px', resize: 'none' }}
                    />
                  </div>

                  {/* Cột chi phí & ảnh */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: '700', color: '#b45309' }}>Chi phí đền bù dự kiến (đồng)</label>
                      <input 
                        type="number" 
                        name="chiPhiHuHong" 
                        value={formValues.chiPhiHuHong || 0} 
                        onChange={onChange} 
                        min="0"
                        style={{ border: '1px solid #fcd34d', padding: '10px 12px', borderRadius: '8px', fontSize: '13.5px', outline: 'none', color: '#78350f', fontWeight: '600' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: '700', color: '#b45309' }}>Hình ảnh minh chứng thực tế</label>
                      <div 
                        style={{ 
                          border: '1.5px dashed #fcd34d', 
                          borderRadius: '8px', 
                          padding: '10px', 
                          textAlign: 'center', 
                          backgroundColor: '#fffdf5',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: '42px',
                          boxSizing: 'border-box'
                        }}
                        onClick={() => document.getElementById('photo-upload-inspect').click()}
                      >
                        <input type="file" id="photo-upload-inspect" accept="image/*" onChange={xuLyThayDoiAnh} style={{ display: 'none' }} />
                        <span style={{ fontSize: '12.5px', color: '#b45309', fontWeight: '700' }}>
                          {selectedPhoto ? 'Đã tải ảnh' : 'Tải ảnh thực tế'}
                        </span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>
        )}

        {/* Khung checklist điều kiện nghiệm thu */}
        {!isDatCoc && (
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '32px' }}>
            <h4 style={{ fontSize: '13.5px', fontWeight: '800', color: '#475569', margin: '0 0 14px 0', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
              Các hạng mục kiểm tra bắt buộc khi bàn giao
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: '#334155', fontWeight: '600', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  name="checklistSach" 
                  checked={formValues.checklistSach || false} 
                  onChange={onCheckboxChange} 
                  style={{ accentColor: 'var(--primary-color)', width: '16px', height: '16px' }}
                />
                Đã dọn dẹp vệ sinh phòng ngủ sạch sẽ
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: '#334155', fontWeight: '600', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  name="checklistChiaKhoa" 
                  checked={formValues.checklistChiaKhoa || false} 
                  onChange={onCheckboxChange} 
                  style={{ accentColor: 'var(--primary-color)', width: '16px', height: '16px' }}
                />
                Đã thu hồi chìa khóa và thẻ ra vào
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: '#334155', fontWeight: '600', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  name="checklistTaiSan" 
                  checked={formValues.checklistTaiSan || false} 
                  onChange={onCheckboxChange} 
                  style={{ accentColor: 'var(--primary-color)', width: '16px', height: '16px' }}
                />
                Tài sản phòng ngủ bình thường
              </label>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
          <button type="button" className="btn-detail-outline" onClick={onCancel} style={{ flex: '1', height: '48px', fontSize: '14.5px', fontWeight: '700', borderRadius: '10px' }}>
            Hủy bỏ
          </button>
          <button type="submit" className="submit-btn" style={{ flex: '2', height: '48px', fontSize: '14.5px', fontWeight: '700', borderRadius: '10px', backgroundColor: 'var(--primary-color)', borderColor: 'var(--primary-color)', boxShadow: '0 4px 12px rgba(242,106,33,0.15)' }}>
            Hoàn tất kiểm tra phòng và chuyển Kế toán
          </button>
        </div>
      </div>

    </form>
  );
}
