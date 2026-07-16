import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';

export default function ContractLiquidateForm({ 
  selectedItem, 
  onSubmit, 
  onCancel 
}) {
  const isDatCoc = selectedItem?.loai === 'dat_coc';
  const sigPadAdmin = useRef(null);
  const sigPadKhach = useRef(null);

  const [checklist, setChecklist] = useState({
    kyBienBan: false,
    kyThanhLy: false,
    thuChiaKhoa: false,
    thuTheTu: false,
  });
  const [ghiChu, setGhiChu] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggle = (key) => setChecklist(prev => ({ ...prev, [key]: !prev[key] }));

  const clearAdmin = () => sigPadAdmin.current?.clear();
  const clearKhach = () => sigPadKhach.current?.clear();

  const handleFinish = async (e) => {
    e.preventDefault();
    if (sigPadAdmin.current?.isEmpty() || sigPadKhach.current?.isEmpty()) {
      alert("Vui lòng yêu cầu cả Đại diện Quản lý và Khách thuê ký tên đầy đủ!");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onSubmit(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ width: '100%', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Header section like in screenshot */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', margin: 0 }}>Thanh lý HĐ & Thu hồi tài sản</h2>
          {onCancel && (
            <button 
              type="button" 
              onClick={onCancel}
              style={{ 
                background: '#f1f5f9', border: 'none', cursor: 'pointer',
                color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '8px', borderRadius: '50%', transition: 'all 0.2s'
              }}
              title="Đóng"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
            </button>
          )}
        </div>
        <div style={{ 
          background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px',
          display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: '20px', position: 'relative'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#b91c1c' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>description</span>
              <span style={{ fontWeight: '700', fontSize: '14px', textTransform: 'uppercase' }}>Thông tin thanh lý</span>
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600', marginBottom: '4px' }}>Khách thuê</div>
            <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: '500' }}>{selectedItem.tenKhachHang}</div>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>SĐT: {selectedItem.soDienThoai}</div>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', visibility: 'hidden' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>description</span>
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600', marginBottom: '4px' }}>Phòng & Loại hình</div>
            <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: '500' }}>{selectedItem.phongCoSo}</div>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>{isDatCoc ? 'Phiếu đặt cọc: ' : 'Hợp đồng: '}{selectedItem?.maSo ? selectedItem.maSo.split('~')[0] : ''}</div>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', visibility: 'hidden' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>description</span>
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600', marginBottom: '4px' }}>Ngày kết thúc</div>
            <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: '500' }}>
              {new Date().toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>Lý do: {selectedItem.lyDo || 'Đã kết thúc đối soát'}</div>
          </div>

          <div style={{ position: 'absolute', top: '24px', right: '24px', background: '#fee2e2', color: '#dc2626', padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: '600' }}>
            Chờ hoàn tất
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        
        {/* Left Pane - Danh mục thủ tục */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: '#b45309' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>checklist</span>
            <span style={{ fontWeight: '700', fontSize: '15px' }}>Danh mục thủ tục</span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            {/* Checkbox item */}
            {[{ key: 'kyBienBan', label: isDatCoc ? 'Ký biên bản hủy cọc giữ chỗ' : 'Ký biên bản trả phòng' },
              { key: 'kyThanhLy', label: isDatCoc ? 'Thanh lý giấy tờ liên quan' : 'Ký thanh lý hợp đồng thuê' },
              { key: 'thuChiaKhoa', label: 'Đã thu hồi chìa khóa' },
              { key: 'thuTheTu', label: 'Đã thu hồi thẻ ra vào' }
            ].map(item => (
              <div 
                key={item.key} 
                onClick={() => handleToggle(item.key)}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', 
                  padding: '14px 16px', cursor: 'pointer', background: checklist[item.key] ? '#f8fafc' : '#ffffff', transition: 'all 0.2s'
                }}
              >
                <div style={{ 
                  width: '20px', height: '20px', borderRadius: '4px', border: `2px solid ${checklist[item.key] ? '#10b981' : '#cbd5e1'}`,
                  background: checklist[item.key] ? '#10b981' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {checklist[item.key] && <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>check</span>}
                </div>
                <span style={{ fontSize: '14px', color: '#334155', fontWeight: checklist[item.key] ? '600' : '500' }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          <div>
            <div style={{ fontSize: '13px', color: '#475569', fontWeight: '600', marginBottom: '8px' }}>Ghi chú thu hồi tài sản</div>
            <textarea
              value={ghiChu}
              onChange={(e) => setGhiChu(e.target.value)}
              placeholder="Mô tả tình trạng tài sản khi thu hồi (vết trầy xước, hỏng hóc nếu có)..."
              style={{
                width: '100%', height: '100px', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1',
                background: '#f8fafc', fontSize: '14px', outline: 'none', resize: 'none', boxSizing: 'border-box',
                fontFamily: 'inherit'
              }}
            />
          </div>
        </div>

        {/* Right Pane - Chữ ký */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: '#b45309' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>draw</span>
            <span style={{ fontWeight: '700', fontSize: '15px' }}>Chữ ký xác nhận</span>
          </div>

          {/* Admin Signature */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Đại diện quản lý</div>
              <button type="button" onClick={clearAdmin} style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Xóa</button>
            </div>
            <div style={{ border: '2px dashed #e2e8f0', borderRadius: '8px', background: '#f8fafc', position: 'relative' }}>
              <SignatureCanvas 
                ref={sigPadAdmin} 
                penColor="black" 
                canvasProps={{width: 500, height: 120, className: 'sigCanvas', style: { width: '100%', height: '120px' }}} 
              />
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#cbd5e1', fontSize: '14px', pointerEvents: 'none', zIndex: 0 }}>
                Ký tên tại đây
              </div>
            </div>
          </div>

          {/* Customer Signature */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Khách thuê</div>
              <button type="button" onClick={clearKhach} style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Xóa</button>
            </div>
            <div style={{ border: '2px dashed #e2e8f0', borderRadius: '8px', background: '#f8fafc', position: 'relative' }}>
              <SignatureCanvas 
                ref={sigPadKhach} 
                penColor="blue" 
                canvasProps={{width: 500, height: 120, className: 'sigCanvas', style: { width: '100%', height: '120px' }}} 
              />
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#cbd5e1', fontSize: '14px', pointerEvents: 'none', zIndex: 0 }}>
                Ký tên tại đây
              </div>
            </div>
          </div>

          <div style={{ background: '#eff6ff', borderRadius: '8px', padding: '16px', border: '1px solid #bfdbfe', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <span className="material-symbols-outlined" style={{ color: '#3b82f6', fontSize: '20px' }}>info</span>
            <span style={{ fontSize: '13px', color: '#1e3a8a', lineHeight: '1.5', fontWeight: '500' }}>
              Bằng việc ký tên, cả hai bên xác nhận đã hoàn thành các nghĩa vụ tài chính và bàn giao tài sản đúng như hiện trạng mô tả.
            </span>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <button 
          onClick={handleFinish}
          disabled={isSubmitting}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', 
            background: isSubmitting ? '#94a3b8' : '#10b981', color: '#fff', border: 'none', borderRadius: '10px', height: '56px',
            fontSize: '16px', fontWeight: '700', cursor: isSubmitting ? 'not-allowed' : 'pointer', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)',
            transition: 'background 0.2s'
          }}
        >
          {isSubmitting ? (
            <>
              <span className="material-symbols-outlined" style={{ fontSize: '24px', animation: 'spin 1s linear infinite' }}>sync</span>
              Vui lòng chờ hệ thống cập nhật trạng thái...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>check_circle</span>
              HOÀN TẤT {isDatCoc ? 'HỦY CỌC' : 'TRẢ PHÒNG'}
            </>
          )}
        </button>
        <p style={{ marginTop: '16px', fontSize: '13.5px', color: '#64748b' }}>
          <strong style={{ color: '#b45309' }}>Lưu ý:</strong> Phòng sẽ được cập nhật trạng thái <strong style={{ color: '#0f172a', background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>TRỐNG</strong> sau khi hoàn tất
        </p>
      </div>

    </div>
  );
}
