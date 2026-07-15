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

const MA_MAU_THEO_TRANG_THAI = {
  'Mới tạo': 'MOI',
  'Chờ duyệt phòng': 'CHO_KIEM_TRA_PHONG',
  'Hết chỗ': 'HET_CHO',
  'Còn trống': 'CON_TRONG_CHO_GUI_KE_TOAN',
  'Chờ tính tiền cọc': 'CHO_TINH_COC',
  'Chờ khách chuyển khoản': 'CHO_THANH_TOAN',
  'Đã quá hạn thanh toán': 'QUA_HAN_TU_DONG_HUY',
  'Chờ duyệt cọc': 'CHO_XAC_NHAN_THANH_TOAN',
  'Đặt cọc thành công': 'DA_XAC_NHAN',
  'Chứng từ bị từ chối': 'TU_CHOI_CHUNG_TU',
  'Chờ kiểm tra': 'CHO_KIEM_TRA',
  'Chờ lập hợp đồng': 'CHO_LAP_HOP_DONG',
  'Chờ lập hợp đồng (điều chỉnh)': 'CHO_LAP_HOP_DONG_DIEU_CHINH',
  'Chờ hoàn cọc': 'CHO_HOAN_COC',
  'Chờ thanh toán': 'CHO_THANH_TOAN_HOP_DONG',
  'Chờ thanh toán thêm': 'CHO_THANH_TOAN_THEM',
  'Chờ đối soát': 'CHO_DOI_SOAT',
  'Chờ xác nhận đối soát': 'CHO_XAC_NHAN_DOI_SOAT',
  'Chờ thanh lý': 'CHO_THANH_LY',
  'Đã thanh lý': 'DA_THANH_LY',
};

function maMauTrangThai(trangThai) {
  const giaTri = String(trangThai || '');
  if (LABELS[giaTri]) return giaTri;
  return MA_MAU_THEO_TRANG_THAI[giaTri] || 'KHAC';
}

export default function DanhSachPhieuDatCoc({
  filteredItems,
  loading,
  selected,
  taiChiTietPhieu,
  dateTime,
}) {
  return (
    <section className="d-sidebar-list" aria-label="Danh sách phiếu đặt cọc">
      {loading && <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8', fontSize: '14.5px', fontWeight: '700' }}>Đang tải danh sách...</div>}
      {!loading && !filteredItems.length && (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#94a3b8' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#cbd5e1', marginBottom: '12px' }}>inbox</span>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: '700' }}>Không tìm thấy phiếu đặt cọc phù hợp.</p>
        </div>
      )}
      {filteredItems.map((item) => {
        const maMau = maMauTrangThai(item.TrangThai);
        return (
          <span
            key={item.MaDatCoc}
            className="d-tooltip-wrap d-card-tooltip"
            data-tooltip="Nhấn vào để xem chi tiết"
          >
            <button
              type="button"
              className={`d-card-item status-${maMau} ${selected?.MaDatCoc === item.MaDatCoc ? 'active' : ''}`}
              aria-label={`Xem chi tiết phiếu ${item.MaDatCoc}`}
              onClick={() => taiChiTietPhieu(item.MaDatCoc)}
              style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '14px', width: '100%' }}
            >
              <span className={`d-card-dot d-card-dot-${maMau}`} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '8px' }}>
                  <strong style={{ fontSize: '15px', color: '#0f172a', fontWeight: '800' }}>
                    {item.KhachHang?.HoTen || `Khách hàng ${item.CCCD}`}
                  </strong>
                  <span className={`d-badge d-badge-${maMau}`} style={{ flexShrink: 0 }}>
                    {LABELS[item.TrangThai] || item.TrangThai}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '8px' }}>
                  <small style={{ fontSize: '12.5px', color: '#64748b', fontWeight: '500' }}>
                    Phiếu #{item.MaDatCoc} · Phòng {item.MaPhong || '—'} · {item.LoaiThue === 'Thuê nguyên phòng' ? 'Nguyên phòng' : 'Giường lẻ'}
                  </small>
                  <small style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: '600', flexShrink: 0 }}>
                    {dateTime(item.CapNhatLuc || item.ThoiDiemTao)}
                  </small>
                </div>
              </div>
            </button>
          </span>
        );
      })}
    </section>
  );
}
