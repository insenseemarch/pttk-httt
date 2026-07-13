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

const ROLE_TABS = {
  SALE: [
    { key: 'ALL', label: 'Tất cả phiếu' },
    { key: 'MOI', label: 'Chờ xử lý' },
    { key: 'CHO_THANH_TOAN', label: 'Chờ thanh toán' },
    { key: 'TU_CHOI_CHUNG_TU', label: 'Bị từ chối' },
    { key: 'KET_THUC', label: 'Phiếu đã hoàn tất' },
  ],
  KE_TOAN: [
    { key: 'ALL', label: 'Tất cả phiếu' },
    { key: 'CHO_TINH_COC', label: 'Chờ tính cọc' },
    { key: 'KET_THUC', label: 'Phiếu đã hoàn tất' },
  ],
  QUAN_LY: [
    { key: 'ALL', label: 'Tất cả phiếu' },
    { key: 'CHO_KIEM_TRA_PHONG', label: 'Chờ duyệt phòng' },
    { key: 'CHO_XAC_NHAN_THANH_TOAN', label: 'Chờ duyệt cọc' },
    { key: 'KET_THUC', label: 'Phiếu đã hoàn tất' },
  ],
};

export default function DanhSachPhieuDatCoc({
  filteredItems,
  loading,
  selected,
  role,
  selectedTab,
  setSelectedTab,
  searchQuery,
  setSearchQuery,
  fetchList,
  fetchDetail,
  dateTime,
}) {
  return (
    <>
      <div className="d-toolbar">
        <div className="d-tabs">
          {ROLE_TABS[role]?.map((tab) => (
            <button
              type="button"
              className={selectedTab === tab.key ? 'active' : ''}
              key={tab.key}
              onClick={() => {
                setSelectedTab(tab.key);
                setSearchQuery('');
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="d-search-bar" style={{ marginLeft: 'auto' }}>
          <span className="material-symbols-outlined">search</span>
          <input
            type="text"
            placeholder="Tìm khách thuê, số phòng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button type="button" className="d-refresh-btn" title="Tải lại danh sách" onClick={fetchList}>
          <span className="material-symbols-outlined">refresh</span>
        </button>
      </div>

      <section className="d-sidebar-list" aria-label="Danh sách phiếu đặt cọc">
        {loading && <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8', fontSize: '14.5px', fontWeight: '700' }}>Đang tải danh sách...</div>}
        {!loading && !filteredItems.length && (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#94a3b8' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#cbd5e1', marginBottom: '12px' }}>inbox</span>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: '700' }}>Không tìm thấy phiếu đặt cọc phù hợp.</p>
          </div>
        )}
        {filteredItems.map((item) => (
          <button
            type="button"
            key={item.MaDatCoc}
            className={`d-card-item status-${item.TrangThai} ${selected?.MaDatCoc === item.MaDatCoc ? 'active' : ''}`}
            onClick={() => fetchDetail(item.MaDatCoc)}
            style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '14px', width: '100%' }}
          >
            <span className={`d-card-dot d-card-dot-${item.TrangThai}`} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '8px' }}>
                <strong style={{ fontSize: '15px', color: '#0f172a', fontWeight: '800' }}>
                  {item.KhachHang?.HoTen || `Khách hàng ${item.CCCD}`}
                </strong>
                <span className={`d-badge d-badge-${item.TrangThai}`} style={{ flexShrink: 0 }}>
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
        ))}
      </section>
    </>
  );
}
