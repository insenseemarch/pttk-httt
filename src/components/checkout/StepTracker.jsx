import React from 'react';

export default function StepTracker({ currentStatus, currentStep, loai, selectedItem }) {
  const isDatCoc = loai === 'dat_coc';

  // Tính toán số tiền quyết toán để xác định nhãn của bước 6
  let khachPhaiDongThem = false;
  if (selectedItem) {
    const tienCocGoc = Number(selectedItem.tienCoc || 0);
    const tiLeHoan = Number(selectedItem.tiLeHoanCoc ?? 100);
    const tienCocDuocHoan = tienCocGoc * (tiLeHoan / 100);
    const noThue = Number(selectedItem.noThue || 0);
    const noDienNuoc = Number(selectedItem.noDienNuoc || 0);
    const chiPhiHuHong = Number(selectedItem.chiPhiHuHong || 0);
    const tongKhauTruKhac = (selectedItem.danhSachKhauTruKhac || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const tongKhauTru = noThue + noDienNuoc + chiPhiHuHong + tongKhauTruKhac;
    const soTienQuyetToan = tienCocDuocHoan - tongKhauTru;
    khachPhaiDongThem = soTienQuyetToan < 0;
  }

  const steps = isDatCoc ? [
    { s: 'create',     l: 'Tiếp nhận yêu cầu hủy cọc' },
    { s: 'inspect',    l: 'Xác nhận điều kiện hủy cọc' },
    { s: 'reconcile',  l: 'Lập phiếu đối soát hoàn cọc' },
    { s: 'confirm',    l: 'Quản lý xác nhận với khách' },
    { s: 'payout',     l: 'Kế toán hoàn trả tiền cọc' },
    { s: 'liquidate',  l: 'Ký biên bản thanh lý cọc' }
  ] : [
    { s: 'create',     l: 'Tiếp nhận yêu cầu trả phòng' },
    { s: 'inspect',    l: 'Quản lý kiểm tra phòng ngủ' },
    { s: 'reconcile',  l: 'Kế toán lập phiếu đối soát' },
    { s: 'confirm',    l: 'Quản lý xác nhận với khách' },
    { s: 'liquidate',  l: 'Ký biên bản thanh lý hợp đồng' },
    { s: 'payout',     l: khachPhaiDongThem ? 'Kế toán thu tiền chênh lệch' : 'Kế toán hoàn trả tiền cọc' }
  ];

  const stepOrder = [
    'Hiệu lực', 
    'Chờ kiểm tra', 
    'Chờ đối soát', 
    'Chờ xác nhận đối soát', 
    'Chờ thanh lý', 
    'Chờ hoàn cọc', 
    'Chờ thanh toán', 
    'Đã thanh lý'
  ];
  
  const currentStatusIdx = stepOrder.indexOf(currentStatus);

  return (
    <div className="checkout-steptracker" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '24px 32px', borderRadius: '16px', marginBottom: '32px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)', gap: '16px', overflowX: 'auto' }}>
      {steps.map((step, idx) => {
        let isCompleted = false;
        let isActive = currentStep === step.s;

        if (isDatCoc) {
          if (idx === 0 && currentStatusIdx >= 1) isCompleted = true;
          if (idx === 1 && currentStatusIdx >= 2) isCompleted = true;
          if (idx === 2 && currentStatusIdx >= 3) isCompleted = true;
          if (idx === 3 && (currentStatusIdx >= 5 || currentStatus === 'Chờ thanh toán' || currentStatus === 'Đã thanh lý')) isCompleted = true;
          if (idx === 4 && currentStatus === 'Đã thanh lý') isCompleted = true;
          if (idx === 5 && currentStatus === 'Đã thanh lý') isCompleted = true;
        } else {
          if (idx === 0 && currentStatusIdx >= 1) isCompleted = true;
          if (idx === 1 && currentStatusIdx >= 2) isCompleted = true;
          if (idx === 2 && currentStatusIdx >= 3) isCompleted = true;
          if (idx === 3 && currentStatusIdx >= 4) isCompleted = true;
          if (idx === 4 && (currentStatusIdx >= 5 || currentStatus === 'Chờ thanh toán')) isCompleted = true;
          if (idx === 5 && currentStatus === 'Đã thanh lý') isCompleted = true;
        }

        // Đảm bảo nguyên tắc: nếu đang ở bước N, các bước trước đó (N-1, N-2...) BẮT BUỘC phải màu xanh (đã hoàn thành)
        const activeStepIndex = steps.findIndex(s => s.s === currentStep);
        if (activeStepIndex !== -1 && idx < activeStepIndex) {
          isCompleted = true;
        }

        return (
          <div key={step.s} className={`checkout-step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', flex: 1, minWidth: '100px' }}>
            
            {/* Step Number Circle */}
            <div className="step-number-circle" style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: isCompleted ? '#e6f4ea' : isActive ? 'var(--primary-color)' : '#ffffff',
              border: `2px solid ${isCompleted ? '#10b981' : isActive ? 'var(--primary-color)' : '#cbd5e1'}`,
              color: isCompleted ? '#10b981' : isActive ? '#ffffff' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '800',
              fontSize: '14px',
              transition: 'all 0.3s ease',
              boxShadow: isActive ? '0 0 12px rgba(242, 106, 33, 0.3)' : 'none',
              zIndex: 2
            }}>
              {idx + 1}
            </div>
            
            {/* Step Label Text */}
            <span className="step-label-text" style={{
              fontSize: '11.5px',
              fontWeight: '700',
              color: isCompleted ? '#10b981' : isActive ? 'var(--primary-color)' : '#64748b',
              marginTop: '10px',
              whiteSpace: 'normal',
              maxWidth: '120px',
              lineHeight: '1.4',
              textTransform: 'none',
              display: 'block'
            }}>
              {step.l}
            </span>

            {/* Connection Line */}
            {idx < steps.length - 1 && (
              <div style={{
                position: 'absolute',
                top: '18px',
                left: 'calc(50% + 24px)',
                right: 'calc(-50% + 24px)',
                height: '2px',
                backgroundColor: isCompleted ? '#10b981' : '#e2e8f0',
                zIndex: 1,
                transition: 'background-color 0.3s ease'
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
