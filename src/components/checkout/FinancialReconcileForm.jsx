import React, { useEffect, useState } from 'react';
import { tinhTyLeHoanCoc } from '../../utils/tinhTyLeHoanCoc';

export default function FinancialReconcileForm({ 
  selectedItem, 
  formValues, 
  onChange, 
  setFormCheckout,
  onSubmit, 
  onCancel 
}) {
  const isDatCoc = selectedItem?.loai === 'dat_coc';

  const tiLeKhuyenNghi = tinhTyLeHoanCoc({
    loai: selectedItem?.loai,
    loaiHinhTraPhong: selectedItem?.loaiHinhTraPhong || formValues.loaiHinhTraPhong,
    ngayBatDau: selectedItem?.ngayBatDau,
    ngayKetThuc: selectedItem?.ngayKetThuc,
    ngayTraDuKien: selectedItem?.ngayTraDuKien || formValues.ngayTraDuKien
  });

  const [extraDeductions, setExtraDeductions] = useState(
    selectedItem?.danhSachKhauTruKhac || []
  );

  const themKhauTruKhac = () => {
    setExtraDeductions([...extraDeductions, { id: Date.now(), name: 'Khấu trừ khác', desc: '', amount: 0 }]);
  };

  const xuLyThayDoiKhauTruKhac = (id, field, val) => {
    setExtraDeductions(extraDeductions.map(item => {
      if (item.id === id) {
        return { ...item, [field]: val };
      }
      return item;
    }));
  };

  const xoaKhauTruKhac = (id) => {
    setExtraDeductions(extraDeductions.filter(item => item.id !== id));
  };

  useEffect(() => {
    setExtraDeductions(selectedItem?.danhSachKhauTruKhac || []);
    if (isDatCoc) {
      setFormCheckout(prev => ({
        ...prev,
        tiLeHoanCoc: 80,
        noThue: 0,
        noDienNuoc: 0,
        chiPhiHuHong: 0
      }));
    } else if (!selectedItem?.tiLeHoanCoc) {
      setFormCheckout(prev => ({
        ...prev,
        tiLeHoanCoc: tiLeKhuyenNghi
      }));
    }
  }, [isDatCoc, selectedItem?.maSo]);

  // 4 mức tỉ lệ hoàn cọc theo đề bài
  const rates = [
    { rate: 80,  label: '80%',  desc: 'Đã cọc, chưa ký hợp đồng',         hint: 'Khách đặt cọc giữ chỗ nhưng chưa ký hợp đồng chính thức hoặc không đủ điều kiện ký' },
    { rate: 50,  label: '50%',  desc: 'Còn hạn, lưu trú dưới 6 tháng',     hint: 'Đã ký hợp đồng, chưa hết hạn, thời gian khách ở thực tế dưới 6 tháng' },
    { rate: 70,  label: '70%',  desc: 'Còn hạn, lưu trú trên 6 tháng',     hint: 'Đã ký hợp đồng, chưa hết hạn, thời gian khách ở thực tế từ 6 tháng trở lên' },
    { rate: 100, label: '100%', desc: 'Hết hạn hợp đồng đúng thời hạn',    hint: 'Khách trả phòng đúng ngày kết thúc hợp đồng đã ký' },
  ];

  const tienCocGoc = Number(selectedItem.tienCoc) || 0;
  const tiLeHoan = Number(formValues.tiLeHoanCoc ?? tiLeKhuyenNghi);
  const tienCocDuocHoan = tienCocGoc * (tiLeHoan / 100);

  const noThue = isDatCoc ? 0 : (Number(formValues.noThue) || 0);
  const noDienNuoc = isDatCoc ? 0 : (Number(formValues.noDienNuoc) || 0);
  const chiPhiHuHong = isDatCoc ? 0 : (Number(formValues.chiPhiHuHong) || 0);
  
  const tongExtra = extraDeductions.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const tongKhauTru = noThue + noDienNuoc + chiPhiHuHong + tongExtra;
  const soTienQuyetToan = tienCocDuocHoan - tongKhauTru;
  const khachDuocHoan = soTienQuyetToan >= 0;

  return (
    <form onSubmit={(e) => onSubmit(e, extraDeductions)} style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '28px' }}>
      
      {/* Cột trái: Tỷ lệ hoàn cọc & các khoản khấu trừ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Hộp cảnh báo phản hồi tranh chấp của khách nếu có */}
        {selectedItem?.yKienTranhChap && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '18px 24px', borderRadius: '12px', color: '#b91c1c', fontSize: '14px', lineHeight: '1.5', fontWeight: '500' }}>
            🔴 <strong>Ý kiến tranh chấp của khách hàng:</strong> "{selectedItem.yKienTranhChap}"
            <br />
            <span style={{ fontSize: '12.5px', color: '#7f1d1d', marginTop: '6px', display: 'block' }}>
              ℹ️ Vui lòng điều chỉnh lại các chỉ số điện nước, chi phí hư hỏng hoặc tỷ lệ hoàn cọc phù hợp theo thỏa thuận rồi gửi lại.
            </span>
          </div>
        )}

        {/* Card 1: Tỷ lệ hoàn cọc cơ bản */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '28px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>%</span> Tỷ lệ hoàn cọc cơ bản
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
            {rates.map(r => {
              const isActive = tiLeHoan === r.rate;
              const isDisable = isDatCoc && r.rate !== 80;

              return (
                <div
                  key={r.rate}
                  onClick={() => {
                    if (!isDisable) {
                      setFormCheckout(prev => ({ ...prev, tiLeHoanCoc: r.rate }));
                    }
                  }}
                  style={{
                    cursor: isDisable ? 'not-allowed' : 'pointer',
                    padding: '16px 12px',
                    borderRadius: '12px',
                    textAlign: 'center',
                    border: `2px solid ${isActive ? 'var(--primary-color)' : '#e2e8f0'}`,
                    background: isActive ? '#fff7ed' : '#ffffff',
                    opacity: isDisable ? 0.45 : 1,
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? '0 4px 12px rgba(242, 106, 33, 0.06)' : 'none'
                  }}
                >
                  <div style={{ fontSize: '24px', fontWeight: '900', color: isActive ? 'var(--primary-color)' : '#0f172a' }}>{r.label}</div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', marginTop: '6px' }}>{r.desc}</div>
                </div>
              );
            })}
          </div>

          <div style={{ background: '#f8fafc', borderLeft: '4px solid #cbd5e1', padding: '12px 16px', borderRadius: '6px', fontSize: '13px', color: '#475569', fontWeight: '500' }}>
            Ghi chú: Tiền cọc gốc <strong>{tienCocGoc.toLocaleString('vi-VN')} đồng</strong>. Tỷ lệ hoàn cọc áp dụng cho các trường hợp quyết toán theo quy định lưu trú.
          </div>
        </div>

        {/* Card 2: Các khoản thu và khấu trừ */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '28px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>💵</span> Các khoản thu và khấu trừ
          </h3>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px', marginBottom: '20px' }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid #cbd5e1', backgroundColor: '#f8fafc' }}>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#475569', fontWeight: '700' }}>Hạng mục</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#475569', fontWeight: '700' }}>Mô tả chi tiết</th>
                <th style={{ textAlign: 'right', padding: '10px 12px', color: '#475569', fontWeight: '700', width: '150px' }}>Số tiền (đồng)</th>
              </tr>
            </thead>
            <tbody>
              {/* Dư nợ tiền nhà */}
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px', fontWeight: '700', color: '#334155' }}>Dư nợ tiền nhà</td>
                <td style={{ padding: '12px' }}>
                  <input 
                    type="text" 
                    placeholder="Mô tả dư nợ tiền thuê..." 
                    value={isDatCoc ? "Không áp dụng cho đặt cọc" : "Nợ tiền thuê phòng tháng cuối"} 
                    readOnly
                    style={{ border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '6px', width: '100%', fontSize: '13px', backgroundColor: '#f1f5f9', color: '#64748b' }}
                  />
                </td>
                <td style={{ padding: '12px', textAlign: 'right' }}>
                  <input 
                    type="number" 
                    name="noThue" 
                    value={noThue} 
                    onChange={onChange} 
                    disabled={isDatCoc}
                    style={{ border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '6px', width: '120px', textAlign: 'right', fontSize: '13px', backgroundColor: isDatCoc ? '#f1f5f9' : '#ffffff' }}
                  />
                </td>
              </tr>

              {/* Tiền điện, nước, dịch vụ */}
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px', fontWeight: '700', color: '#334155' }}>Tiền điện, nước, dịch vụ</td>
                <td style={{ padding: '12px' }}>
                  <input 
                    type="text" 
                    placeholder="Mô tả chỉ số điện nước..." 
                    value={isDatCoc ? "Không áp dụng cho đặt cọc" : "Nợ điện nước và phí dịch vụ phát sinh"} 
                    readOnly
                    style={{ border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '6px', width: '100%', fontSize: '13px', backgroundColor: '#f1f5f9', color: '#64748b' }}
                  />
                </td>
                <td style={{ padding: '12px', textAlign: 'right' }}>
                  <input 
                    type="number" 
                    name="noDienNuoc" 
                    value={noDienNuoc} 
                    onChange={onChange} 
                    disabled={isDatCoc}
                    style={{ border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '6px', width: '120px', textAlign: 'right', fontSize: '13px', backgroundColor: isDatCoc ? '#f1f5f9' : '#ffffff' }}
                  />
                </td>
              </tr>

              {/* Bồi thường hư hại */}
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px', fontWeight: '700', color: '#334155' }}>Bồi thường hư hại</td>
                <td style={{ padding: '12px' }}>
                  <input 
                    type="text" 
                    name="moTaKhauTru"
                    placeholder="Linh kiện hỏng, vỡ thiết bị..." 
                    value={isDatCoc ? "Không áp dụng cho đặt cọc" : formValues.moTaKhauTru} 
                    onChange={onChange}
                    disabled={isDatCoc}
                    style={{ border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '6px', width: '100%', fontSize: '13px', backgroundColor: isDatCoc ? '#f1f5f9' : '#ffffff' }}
                  />
                </td>
                <td style={{ padding: '12px', textAlign: 'right' }}>
                  <input 
                    type="number" 
                    name="chiPhiHuHong" 
                    value={chiPhiHuHong} 
                    onChange={onChange} 
                    disabled={isDatCoc}
                    style={{ border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '6px', width: '120px', textAlign: 'right', fontSize: '13px', backgroundColor: isDatCoc ? '#f1f5f9' : '#ffffff' }}
                  />
                </td>
              </tr>



              {/* Các khoản khấu trừ bổ sung động */}
              {extraDeductions.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px', fontWeight: '700', color: '#334155' }}>
                    <input 
                      type="text" 
                      value={item.name} 
                      onChange={(e) => xuLyThayDoiKhauTruKhac(item.id, 'name', e.target.value)}
                      style={{ border: 'none', borderBottom: '1.5px solid #cbd5e1', fontSize: '13.5px', fontWeight: '700', color: '#334155', outline: 'none', width: '120px' }}
                    />
                  </td>
                  <td style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input 
                      type="text" 
                      placeholder="Mô tả lý do..." 
                      value={item.desc} 
                      onChange={(e) => xuLyThayDoiKhauTruKhac(item.id, 'desc', e.target.value)}
                      style={{ border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '6px', width: '100%', fontSize: '13px' }}
                    />
                    <button type="button" onClick={() => xoaKhauTruKhac(item.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px' }}>🗑️</button>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <input 
                      type="number" 
                      value={item.amount} 
                      onChange={(e) => xuLyThayDoiKhauTruKhac(item.id, 'amount', e.target.value)}
                      style={{ border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '6px', width: '120px', textAlign: 'right', fontSize: '13px' }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button 
            type="button" 
            onClick={themKhauTruKhac}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#b45309', fontWeight: '700', fontSize: '13.5px', cursor: 'pointer' }}
          >
            ➕ Thêm hạng mục khấu trừ khác
          </button>
        </div>
      </div>

      {/* Cột phải: Tóm tắt quyết toán */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Card: Tóm tắt quyết toán */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
          <h3 style={{ fontSize: '14.5px', fontWeight: '800', color: '#0f172a', margin: '0 0 20px 0', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
            Tóm tắt quyết toán
          </h3>

          <table style={{ width: '100%', fontSize: '13.5px', color: '#64748b', marginBottom: '24px' }}>
            <tbody>
              <tr>
                <td style={{ padding: '8px 0', fontWeight: '500' }}>Tổng tiền cọc:</td>
                <td style={{ textAlign: 'right', padding: '8px 0', fontWeight: '700', color: '#334155' }}>{tienCocGoc.toLocaleString('vi-VN')} đồng</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0', fontWeight: '500' }}>Tiền cọc được hoàn ({tiLeHoan}%):</td>
                <td style={{ textAlign: 'right', padding: '8px 0', fontWeight: '700', color: '#334155' }}>{tienCocDuocHoan.toLocaleString('vi-VN')} đồng</td>
              </tr>
              <tr style={{ color: '#dc2626' }}>
                <td style={{ padding: '8px 0', fontWeight: '500' }}>Tổng các khoản khấu trừ:</td>
                <td style={{ textAlign: 'right', padding: '8px 0', fontWeight: '700' }}>-{tongKhauTru.toLocaleString('vi-VN')} đồng</td>
              </tr>
            </tbody>
          </table>

          {/* Hộp lớn kết quả cọc */}
          <div style={{ 
            background: khachDuocHoan ? '#f0fdf4' : '#fef2f2', 
            border: `1.5px solid ${khachDuocHoan ? '#a7f3d0' : '#fca5a5'}`, 
            borderRadius: '12px', 
            padding: '20px', 
            textAlign: 'center', 
            marginBottom: '24px' 
          }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: khachDuocHoan ? '#047857' : '#b91c1c', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
              {khachDuocHoan ? 'KẾT QUẢ HOÀN CỌC' : 'KẾT QUẢ THU THÊM'}
            </span>
            <strong style={{ fontSize: '26px', fontWeight: '900', color: khachDuocHoan ? '#10b981' : '#ef4444', letterSpacing: '-0.02em' }}>
              {Math.abs(soTienQuyetToan).toLocaleString('vi-VN')} đồng
            </strong>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button 
              type="submit" 
              className="submit-btn" 
              style={{ width: '100%', height: '46px', fontSize: '14.5px', fontWeight: '700', borderRadius: '8px', backgroundColor: 'var(--primary-color)', borderColor: 'var(--primary-color)', boxShadow: '0 4px 12px rgba(242,106,33,0.15)', cursor: 'pointer' }}
            >
              Lưu và gửi phiếu đối soát cho Quản lý
            </button>
            <button 
              type="button" 
              onClick={onCancel}
              style={{ 
                width: '100%', 
                height: '46px', 
                fontSize: '14.5px', 
                fontWeight: '700', 
                borderRadius: '8px', 
                backgroundColor: '#ffffff', 
                border: '1px solid #cbd5e1',
                color: '#475569',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'block',
                boxSizing: 'border-box'
              }}
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = '#94a3b8'; }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
            >
              In bản nháp phiếu đối soát
            </button>
          </div>

        </div>
      </div>

    </form>
  );
}
