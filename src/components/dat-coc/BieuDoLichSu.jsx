import React from 'react';

const LABELS = {
  MOI: 'Mới tạo',
  CHO_KIEM_TRA_PHONG: 'Chờ duyệt phòng',
  HET_CHO: 'Hết chỗ',
  CON_TRONG_CHO_GUI_KE_TOAN: 'Còn trống',
  CHO_TINH_COC: 'Chờ tính tiền cọc',
  CHO_THANH_TOAN: 'Chờ khách chuyển khoản',
  QUA_HAN_TU_DONG_HUY: 'Đã quá hạn thanh toán',
  CHO_XAC_NHAN_THANH_TOAN: 'Chờ duyệt cọc',
  DA_XAC_NHAN: 'Đặt cọc thành công',
  TU_CHOI_CHUNG_TU: 'Chứng từ bị từ chối',
};

export default function BieuDoLichSu({ history, dateTime }) {
  if (!history || history.length === 0) return null;
  return (
    <section className="d-section-card d-card-history">
      <h3>Lịch sử xử lý phiếu</h3>
      <div className="d-history">
        {history.map((item, idx) => (
          <div key={item.MaLichSu} className={`d-history-item ${idx === 0 ? 'active' : ''}`}>
            <p>
              <strong>{LABELS[item.TrangThaiMoi] || item.TrangThaiMoi}</strong>
              <small>
                Thực hiện: {item.VaiTroThucHien === 'QUAN_LY' ? 'QUANLY' : item.VaiTroThucHien === 'KE_TOAN' ? 'KETOAN' : item.VaiTroThucHien} · {dateTime(item.ThoiDiem)}
                {item.GhiChu ? ` · "${item.GhiChu}"` : ''}
              </small>
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
