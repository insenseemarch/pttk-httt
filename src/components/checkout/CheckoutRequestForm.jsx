import { tinhTyLeHoanCoc } from '../../utils/tinhTyLeHoanCoc';
import { KHOA_NGUOI_DUNG } from '../../config/routes';

function docNguoiDungDangNhap() {
  try {
    const raw = localStorage.getItem(KHOA_NGUOI_DUNG);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function CheckoutRequestForm({ 
  selectedItem, 
  formValues, 
  onChange, 
  onSubmit, 
  onCancel,
  nguoiDung: nguoiDungProp = null,
}) {
  const nguoiDung = nguoiDungProp || docNguoiDungDangNhap();
  const tenNguoiTiepNhan = nguoiDung?.hoTen || nguoiDung?.tenNV || 'Nhân viên';
  const vaiTroNguoiTiepNhan = nguoiDung?.vaiTro || 'Staff';
  const nhanNguoiTiepNhan = `${tenNguoiTiepNhan} (${vaiTroNguoiTiepNhan})`;

  const isDatCoc = selectedItem?.loai === 'dat_coc';
  
  const ngayBatDauStr = selectedItem?.ngayBatDau;
  const ngayKetThucStr = selectedItem?.ngayKetThuc;
  const homNay = new Date();
  
  // Tính lộ trình hợp đồng
  let timelineInfo = null;
  if (ngayBatDauStr && ngayKetThucStr && !isDatCoc) {
    const start = new Date(ngayBatDauStr);
    const end = new Date(ngayKetThucStr);
    
    const totalMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    
    let diffSpent = homNay - start;
    if (diffSpent < 0) diffSpent = 0;
    const spentDaysTotal = Math.floor(diffSpent / (1000 * 60 * 60 * 24));
    const spentMonths = Math.floor(spentDaysTotal / 30);
    const spentDays = spentDaysTotal % 30;
    
    let diffLeft = end - homNay;
    if (diffLeft < 0) diffLeft = 0;
    const leftDaysTotal = Math.floor(diffLeft / (1000 * 60 * 60 * 24));
    const leftMonths = Math.floor(leftDaysTotal / 30);
    const leftDays = leftDaysTotal % 30;

    const totalDays = Math.max(1, Math.floor((end - start) / (1000 * 60 * 60 * 24)));
    const progressPercent = Math.min(100, Math.max(0, Math.floor((spentDaysTotal / totalDays) * 100)));

    timelineInfo = {
      totalMonths,
      spentStr: `${spentMonths} tháng ${spentDays} ngày`,
      leftStr: `${leftMonths} tháng ${leftDays} ngày`,
      progressPercent
    };
  }

  // Tỷ lệ hoàn cọc theo đề bài 3.1.4 — 3 trường hợp hợp đồng + hủy cọc
  const selectedLoaiHinh = formValues.loaiHinhTraPhong;
  const soThangDaO = timelineInfo
    ? Math.floor((homNay - new Date(ngayBatDauStr)) / (1000 * 60 * 60 * 24 * 30))
    : 0;

  const tiLeHoan = tinhTyLeHoanCoc({
    ...selectedItem,
    loaiHinhTraPhong: selectedLoaiHinh,
    ngayTraDuKien: formValues.ngayTraDuKien,
  });

  let textCanhBao = '';
  let colorCanhBaoBg = '#fffbeb';
  let colorCanhBaoBorder = '#fde68a';
  let colorCanhBaoText = '#b45309';
  const tienHoan = (Number(selectedItem.tienCoc || 0) * tiLeHoan / 100).toLocaleString('vi-VN');

  if (isDatCoc || selectedLoaiHinh === 'huy_thue') {
    textCanhBao = `ĐẶT CỌC CHƯA KÝ HỢP ĐỒNG — Hoàn ${tiLeHoan}% tiền cọc (tương đương ${tienHoan} đồng).`;
  } else if (selectedLoaiHinh === 'dung_han') {
    textCanhBao = `HẾT HẠN THUÊ THEO HỢP ĐỒNG — Hoàn 100% tiền cọc (tương đương ${tienHoan} đồng).`;
    colorCanhBaoBg = '#f0fdf4';
    colorCanhBaoBorder = '#a7f3d0';
    colorCanhBaoText = '#15803d';
  } else if (
    selectedLoaiHinh === 'truoc_han_duoi_6'
    || (selectedLoaiHinh === 'truoc_han' && soThangDaO < 6)
    || tiLeHoan === 50
  ) {
    textCanhBao = `ĐÃ KÝ HỢP ĐỒNG, CHƯA HẾT HẠN, LƯU TRÚ DƯỚI 6 THÁNG — Hoàn 50% tiền cọc (tương đương ${tienHoan} đồng).`;
    colorCanhBaoBg = '#fef2f2';
    colorCanhBaoBorder = '#fca5a5';
    colorCanhBaoText = '#b91c1c';
  } else {
    textCanhBao = `ĐÃ KÝ HỢP ĐỒNG, CHƯA HẾT HẠN, LƯU TRÚ TRÊN 6 THÁNG — Hoàn 70% tiền cọc (tương đương ${tienHoan} đồng).`;
    colorCanhBaoBg = '#fff7ed';
    colorCanhBaoBorder = '#fed7aa';
    colorCanhBaoText = '#c2410c';
  }

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

        {/* Right card: Lộ trình hợp đồng (Only show for contracts) */}
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

      {/* Form Card: Phiếu thông tin trả phòng */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '32px', boxShadow: '0 6px 18px rgba(0,0,0,0.03)' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: '0 0 24px 0', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
          Phiếu đăng ký thông tin trả phòng
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>Ngày trả phòng dự kiến <span style={{ color: '#dc2626' }}>*</span></label>
            <input 
              type="date" 
              name="ngayTraDuKien" 
              value={formValues.ngayTraDuKien} 
              onChange={onChange} 
              required 
              style={{ border: '1px solid #cbd5e1', padding: '10px 14px', borderRadius: '8px', fontSize: '14px', outline: 'none', color: '#334155', fontWeight: '600' }} 
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>Loại hình trả phòng</label>
            <select 
              name="loaiHinhTraPhong" 
              value={formValues.loaiHinhTraPhong} 
              onChange={onChange} 
              style={{ border: '1px solid #cbd5e1', padding: '10px 14px', borderRadius: '8px', fontSize: '14px', outline: 'none', color: '#334155', fontWeight: '600', backgroundColor: '#ffffff' }}
            >
              {isDatCoc ? (
                <option value="huy_thue">Hủy đăng ký thuê và rút cọc — hoàn 80%</option>
              ) : (
                <>
                  <option value="dung_han">
                    Hết hạn thuê theo hợp đồng — hoàn 100% tiền cọc
                  </option>
                  <option value="truoc_han_duoi_6">
                    Chưa hết hạn, lưu trú dưới 6 tháng — hoàn 50% tiền cọc
                  </option>
                  <option value="truoc_han_tren_6">
                    Chưa hết hạn, lưu trú trên 6 tháng — hoàn 70% tiền cọc
                  </option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* Warning banner */}
        <div style={{ background: colorCanhBaoBg, borderLeft: `5px solid ${colorCanhBaoText}`, borderTop: `1px solid ${colorCanhBaoBorder}`, borderRight: `1px solid ${colorCanhBaoBorder}`, borderBottom: `1px solid ${colorCanhBaoBorder}`, padding: '16px 20px', borderRadius: '10px', marginBottom: '24px', fontSize: '14px', color: '#334155', fontWeight: '600', lineHeight: '1.5' }}>
          {textCanhBao}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
          <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>Lý do trả phòng chi tiết</label>
          <textarea 
            rows="3" 
            name="lyDo" 
            value={formValues.lyDo} 
            onChange={onChange} 
            placeholder="Nhập lý do chi tiết của khách hàng (không bắt buộc)..." 
            style={{ border: '1px solid #cbd5e1', padding: '12px 14px', borderRadius: '8px', fontSize: '14px', outline: 'none', fontFamily: 'inherit', resize: 'vertical' }} 
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#64748b' }}>Người tiếp nhận</label>
            <input 
              type="text" 
              value={nhanNguoiTiepNhan} 
              readOnly 
              style={{ border: '1px solid #cbd5e1', padding: '10px 14px', borderRadius: '8px', fontSize: '14px', backgroundColor: '#f1f5f9', color: '#64748b', fontWeight: '600' }} 
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>Phương thức hoàn tiền (nếu có)</label>
            <div style={{ display: 'flex', gap: '24px', paddingTop: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#334155' }}>
                <input 
                  type="radio" 
                  name="phuongThucHoanTien" 
                  value="chuyen_khoan" 
                  checked={formValues.phuongThucHoanTien === 'chuyen_khoan'} 
                  onChange={onChange} 
                  style={{ accentColor: 'var(--primary-color)', width: '16px', height: '16px' }}
                />
                Chuyển khoản
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#334155' }}>
                <input 
                  type="radio" 
                  name="phuongThucHoanTien" 
                  value="tien_mat" 
                  checked={formValues.phuongThucHoanTien === 'tien_mat'} 
                  onChange={onChange} 
                  style={{ accentColor: 'var(--primary-color)', width: '16px', height: '16px' }}
                />
                Tiền mặt
              </label>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
          <button type="button" className="btn-detail-outline" onClick={onCancel} style={{ flex: '1', height: '48px', fontSize: '14.5px', fontWeight: '700', borderRadius: '10px' }}>
            Hủy bỏ
          </button>
          <button type="submit" className="submit-btn" style={{ flex: '2', height: '48px', fontSize: '14.5px', fontWeight: '700', borderRadius: '10px', backgroundColor: 'var(--primary-color)', borderColor: 'var(--primary-color)', boxShadow: '0 4px 12px rgba(242,106,33,0.15)' }}>
            Xác nhận tạo yêu cầu trả phòng
          </button>
        </div>
      </div>

    </form>
  );
}
