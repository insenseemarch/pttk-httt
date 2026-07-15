import React from 'react';

export default function CheckoutList({
  danhSachQuyetToan,
  checkoutSearch,
  setCheckoutSearch,
  checkoutRole,
  setCheckoutRole,
  onAction,
  taiDanhSachQuyetToan
}) {

  const StatusLabel = ({ color, bg, text }) => (
    <span style={{
      fontSize: '12px', fontWeight: '700',
      color, backgroundColor: bg,
      padding: '5px 11px', borderRadius: '5px', whiteSpace: 'nowrap'
    }}>
      {text}
    </span>
  );

  const layNutHanhDong = (item) => {
    const isItemDatCoc = item.loai === 'dat_coc';
    if (checkoutRole === 'sale') {
      if (item.trangThai === 'Hiệu lực') {
        return (
          <button
            type="button"
            className="btn-book-filled"
            style={{ padding: '6px 12px', fontSize: '12px', height: '34px', borderRadius: '6px', width: '100%', backgroundColor: 'var(--primary-color)', borderColor: 'var(--primary-color)' }}
            onClick={() => onAction(item.maSo, 'create')}
          >
            {isItemDatCoc ? 'Tiếp nhận hủy cọc' : 'Tiếp nhận trả phòng'}
          </button>
        );
      } else if (item.trangThai === 'Chờ kiểm tra') {
        return <StatusLabel color="#D97706" bg="#FEF3C7" text="Đang chờ kiểm tra" />;
      } else if (item.trangThai === 'Chờ đối soát') {
        return <StatusLabel color="#059669" bg="#D1FAE5" text="Đang chờ đối soát" />;
      } else if (item.trangThai === 'Chờ xác nhận đối soát') {
        return <StatusLabel color="#D97706" bg="#FEF3C7" text="Đang chờ duyệt đối soát" />;
      } else if (item.trangThai === 'Chờ thanh lý') {
        return <StatusLabel color="#2563EB" bg="#DBEAFE" text="Đang chờ thanh lý" />;
      } else if (item.trangThai === 'Chờ hoàn cọc' || item.trangThai === 'Chờ thanh toán') {
        return <StatusLabel color="#059669" bg="#D1FAE5" text="Đang chờ hoàn trả hoặc thu tiền" />;
      } else if (item.trangThai === 'Đã thanh lý') {
        return <StatusLabel color="#64748b" bg="#f1f5f9" text="Đã hoàn tất" />;
      }

    } else if (checkoutRole === 'quanly') {
      if (item.trangThai === 'Chờ kiểm tra') {
        return (
          <button
            type="button"
            className="btn-book-filled"
            style={{ padding: '6px 12px', fontSize: '12px', height: '34px', borderRadius: '6px', backgroundColor: 'var(--primary-color)', borderColor: 'var(--primary-color)', width: '100%' }}
            onClick={() => onAction(item.maSo, 'inspect')}
          >
            {isItemDatCoc ? 'Xác nhận hủy cọc' : 'Kiểm tra phòng'}
          </button>
        );
      } else if (item.trangThai === 'Chờ xác nhận đối soát') {
        return (
          <button
            type="button"
            className="btn-book-filled"
            style={{ padding: '6px 12px', fontSize: '12px', height: '34px', borderRadius: '6px', backgroundColor: 'var(--primary-color)', borderColor: 'var(--primary-color)', width: '100%' }}
            onClick={() => onAction(item.maSo, 'confirm')}
          >
            Xác nhận đối soát
          </button>
        );
      } else if (item.trangThai === 'Chờ thanh lý') {
        return (
          <button
            type="button"
            className="btn-book-filled"
            style={{ padding: '6px 12px', fontSize: '12px', height: '34px', borderRadius: '6px', backgroundColor: 'var(--primary-color)', borderColor: 'var(--primary-color)', width: '100%' }}
            onClick={() => onAction(item.maSo, 'liquidate')}
          >
            {isItemDatCoc ? 'Thanh lý phiếu cọc' : 'Thanh lý hợp đồng'}
          </button>
        );
      } else if (item.trangThai === 'Chờ đối soát') {
        return <StatusLabel color="#059669" bg="#D1FAE5" text="Chờ Kế toán đối soát" />;
      } else if (item.trangThai === 'Chờ hoàn cọc' || item.trangThai === 'Chờ thanh toán' || item.trangThai === 'Chờ thanh toán thêm') {
        return <StatusLabel color="#059669" bg="#D1FAE5" text={item.trangThai === 'Chờ hoàn cọc' ? 'Chờ Kế toán hoàn cọc' : 'Chờ Kế toán thu thêm'} />;
      } else if (item.trangThai === 'Đã thanh lý') {
        return <StatusLabel color="#64748b" bg="#f1f5f9" text="Đã hoàn tất" />;
      }

    } else if (checkoutRole === 'ketoan') {
      if (item.trangThai === 'Chờ đối soát') {
        const biTranhChap = !!item.yKienTranhChap;
        return (
          <button
            type="button"
            className="btn-book-filled"
            style={{ 
              padding: '6px 12px', 
              fontSize: '12px', 
              height: '34px', 
              borderRadius: '6px', 
              backgroundColor: biTranhChap ? '#ef4444' : 'var(--primary-color)', 
              borderColor: biTranhChap ? '#ef4444' : 'var(--primary-color)', 
              boxShadow: biTranhChap ? '0 4px 10px rgba(239, 68, 68, 0.2)' : 'none',
              width: '100%',
              color: '#ffffff',
              cursor: 'pointer'
            }}
            onClick={() => onAction(item.maSo, 'reconcile')}
          >
            {biTranhChap ? 'Kiểm tra lại đối soát' : 'Lập phiếu đối soát'}
          </button>
        );
      } else if (item.trangThai === 'Chờ hoàn cọc' || item.trangThai === 'Chờ thanh toán' || item.trangThai === 'Chờ thanh toán thêm') {
        const tienCocGoc = Number(item.tienCoc || 0);
        const tiLeHoan = Number(item.tiLeHoanCoc ?? 100);
        const tienCocDuocHoan = tienCocGoc * (tiLeHoan / 100);
        const noThue = Number(item.noThue || 0);
        const noDienNuoc = Number(item.noDienNuoc || 0);
        const chiPhiHuHong = Number(item.chiPhiHuHong || 0);
        const tongKhauTruKhac = (item.danhSachKhauTruKhac || []).reduce((sum, k) => sum + (Number(k.amount) || 0), 0);
        const soTienQuyetToan = tienCocDuocHoan - (noThue + noDienNuoc + chiPhiHuHong + tongKhauTruKhac);
        const khachPhaiDongThem = soTienQuyetToan < 0;

        let labelButton = '';
        if (isItemDatCoc) {
          labelButton = 'Hoàn trả tiền cọc';
        } else {
          labelButton = khachPhaiDongThem ? 'Thu tiền chênh lệch' : 'Hoàn trả tiền cọc';
        }

        return (
          <button
            type="button"
            className="btn-book-filled"
            style={{ padding: '6px 12px', fontSize: '12px', height: '34px', borderRadius: '6px', backgroundColor: 'var(--primary-color)', borderColor: 'var(--primary-color)', width: '100%' }}
            onClick={() => onAction(item.maSo, 'payout')}
          >
            {labelButton}
          </button>
        );
      } else if (item.trangThai === 'Chờ kiểm tra') {
        return <StatusLabel color="#D97706" bg="#FEF3C7" text="Chờ Quản lý kiểm tra" />;
      } else if (item.trangThai === 'Chờ xác nhận đối soát') {
        return <StatusLabel color="#D97706" bg="#FEF3C7" text="Chờ Quản lý xác nhận" />;
      } else if (item.trangThai === 'Chờ thanh lý') {
        return <StatusLabel color="#2563EB" bg="#DBEAFE" text="Chờ Quản lý thanh lý" />;
      } else if (item.trangThai === 'Đã thanh lý') {
        return <StatusLabel color="#64748b" bg="#f1f5f9" text="Đã hoàn tất" />;
      }
    }
    return null;
  };


  const [statusFilter, setStatusFilter] = React.useState('ALL');

  const allFiltered = danhSachQuyetToan.filter(h => {
    const matchSearch = h.maSo.toLowerCase().includes(checkoutSearch.toLowerCase()) ||
                        h.tenKhachHang.toLowerCase().includes(checkoutSearch.toLowerCase());
    let matchStatus = true;
    if (statusFilter === 'HIEU_LUC') matchStatus = h.trangThai === 'Hiệu lực';
    else if (statusFilter === 'CHO_KIEM_TRA') matchStatus = h.trangThai === 'Chờ kiểm tra';
    else if (statusFilter === 'CHO_DOI_SOAT') matchStatus = h.trangThai === 'Chờ đối soát' || h.trangThai === 'Chờ xác nhận đối soát';
    else if (statusFilter === 'CHO_THANH_LY') matchStatus = h.trangThai === 'Chờ thanh lý';
    else if (statusFilter === 'DA_THANH_LY') matchStatus = h.trangThai === 'Đã thanh lý';

    return matchSearch && matchStatus;
  });

  // Số hợp đồng role này có thể xử lý ngay
  const myActionStates = {
    sale: ['Hiệu lực'],
    quanly: ['Chờ kiểm tra', 'Chờ xác nhận đối soát', 'Chờ thanh lý'],
    ketoan: ['Chờ đối soát', 'Chờ hoàn cọc', 'Chờ thanh toán', 'Chờ thanh toán thêm'],
  };
  const myStates = myActionStates[checkoutRole] || [];
  const pendingCount = danhSachQuyetToan.filter(h => myStates.includes(h.trangThai)).length;

  const layVanBanChucVu = () => {
    return (
      <span>
        Bạn có <strong style={{ color: checkoutRole === 'sale' ? 'var(--primary-color)' : checkoutRole === 'quanly' ? '#2563eb' : '#059669', fontSize: '16px' }}>{pendingCount}</strong> hồ sơ chờ duyệt.
      </span>
    );
  };

  const statusColorMap = {
    'Hiệu lực': 'dat-coc',
    'Chờ kiểm tra': 'cho-xem',
    'Chờ đối soát': 'hen-them',
    'Chờ xác nhận đối soát': 'hen-them',
    'Chờ thanh lý': 'cho-xem',
    'Chờ hoàn cọc': 'cho-xem',
    'Chờ thanh toán': 'hen-them',
    'Đã thanh lý': 'khong-thue',
  };

  const getBorderStyle = (type) => ({
    cursor: 'pointer',
    border: statusFilter === type ? '2px solid var(--primary-color)' : '1px solid transparent',
    boxShadow: statusFilter === type ? '0 4px 12px rgba(249, 115, 22, 0.15)' : 'none',
    transform: statusFilter === type ? 'translateY(-2px)' : 'none',
    transition: 'all 0.2s ease'
  });

  const toggleFilter = (type) => setStatusFilter(prev => prev === type ? 'ALL' : type);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Role Greeting Panel */}
      <div style={{ 
        background: checkoutRole === 'sale' ? '#fff7ed' : checkoutRole === 'quanly' ? '#eff6ff' : '#f0fdf4', 
        border: `1px solid ${checkoutRole === 'sale' ? '#ffedd5' : checkoutRole === 'quanly' ? '#dbeafe' : '#dcfce7'}`, 
        borderRadius: '12px', 
        padding: '16px 24px', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
      }}>
        <span style={{ fontSize: '26px' }}>
          {checkoutRole === 'sale' ? '👤' : checkoutRole === 'quanly' ? '🏢' : '💼'}
        </span>
        <div style={{ fontSize: '14.5px', color: '#334155', lineHeight: '1.5', fontWeight: '500' }}>
          {layVanBanChucVu()}
        </div>
      </div>

      {/* Counts Grid */}
      <div className="overview-counts-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="count-card" style={getBorderStyle('HIEU_LUC')} onClick={() => toggleFilter('HIEU_LUC')}>
          <span className="count-title">ĐANG HIỆU LỰC</span>
          <strong className="count-num">{danhSachQuyetToan.filter(h => h.trangThai === 'Hiệu lực').length}</strong>
        </div>
        <div className="count-card count-blue" style={getBorderStyle('CHO_KIEM_TRA')} onClick={() => toggleFilter('CHO_KIEM_TRA')}>
          <span className="count-title">CHỜ KIỂM TRA PHÒNG</span>
          <strong className="count-num">{danhSachQuyetToan.filter(h => h.trangThai === 'Chờ kiểm tra').length}</strong>
        </div>
        <div className="count-card count-orange" style={getBorderStyle('CHO_DOI_SOAT')} onClick={() => toggleFilter('CHO_DOI_SOAT')}>
          <span className="count-title">CHỜ ĐỐI SOÁT VÀ DUYỆT</span>
          <strong className="count-num">{danhSachQuyetToan.filter(h => h.trangThai === 'Chờ đối soát' || h.trangThai === 'Chờ xác nhận đối soát').length}</strong>
        </div>
        <div className="count-card count-purple" style={getBorderStyle('CHO_THANH_LY')} onClick={() => toggleFilter('CHO_THANH_LY')}>
          <span className="count-title">CHỜ KÝ THANH LÝ</span>
          <strong className="count-num">{danhSachQuyetToan.filter(h => h.trangThai === 'Chờ thanh lý').length}</strong>
        </div>
        <div className="count-card count-green" style={getBorderStyle('DA_THANH_LY')} onClick={() => toggleFilter('DA_THANH_LY')}>
          <span className="count-title">ĐÃ THANH LÝ XONG</span>
          <strong className="count-num">{danhSachQuyetToan.filter(h => h.trangThai === 'Đã thanh lý').length}</strong>
        </div>
      </div>

      {/* Table card */}
      <div className="table-card" style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0' }}>
        {/* Search */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
          <div className="search-bar-wrapper" style={{ maxWidth: '380px' }}>
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Tìm mã hợp đồng, tên khách hàng..."
              value={checkoutSearch}
              onChange={(e) => setCheckoutSearch(e.target.value)}
              className="search-input-field"
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="appointments-table checkout-table">
            <thead>
              <tr>
                <th style={{ width: '12%', whiteSpace: 'nowrap' }}>Mã số chứng từ</th>
                <th style={{ width: '18%' }}>Khách hàng</th>
                <th style={{ width: '25%' }}>Phòng và chi nhánh</th>
                <th style={{ width: '15%', whiteSpace: 'nowrap' }}>Tiền đặt cọc</th>
                <th style={{ width: '15%', whiteSpace: 'nowrap' }}>Trạng thái xử lý</th>
                <th style={{ textAlign: 'right', paddingRight: '12px', width: '15%', whiteSpace: 'nowrap' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {allFiltered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                    Không tìm thấy hợp đồng trả phòng nào phù hợp.
                  </td>
                </tr>
              ) : (
                allFiltered.map(item => {
                  const canAct = myStates.includes(item.trangThai);
                  const scCls = statusColorMap[item.trangThai] || 'cho-xem';
                  return (
                    <tr key={item.maSo}>
                      <td style={{ whiteSpace: 'nowrap' }}><strong style={{ color: 'var(--primary-color)' }}>{item.maSo}</strong></td>
                      <td>
                        <strong className="client-name" style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{item.tenKhachHang}</strong>
                        <span className="client-phone" style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', display: 'block' }}>{item.soDienThoai}</span>
                      </td>
                      <td>
                        <span className="room-badge-table" style={{ display: 'inline-block', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', color: '#334155', fontWeight: '700', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', lineHeight: '1.4' }}>
                          🏢 {item.phongCoSo}
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}><strong style={{ color: '#0f172a' }}>{Number(item.tienCoc).toLocaleString('vi-VN')} đồng</strong></td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span className={`status-badge-pill status-${scCls}`} style={{ whiteSpace: 'nowrap', display: 'inline-block' }}>
                          • {item.trangThai}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: '12px', width: '15%', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end', width: '100%' }}>
                          {canAct && layNutHanhDong(item)}
                          <button
                            type="button"
                            className="btn-detail-outline"
                            style={{ padding: '6px 12px', fontSize: '12px', height: '34px', borderRadius: '6px', width: '100%' }}
                            onClick={() => onAction(item.maSo, item.trangThai === 'Hiệu lực' ? 'view_contract' : 'view_request')}
                          >
                            Xem phiếu
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer-row" style={{ backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', padding: '14px 24px' }}>
          <span className="footer-entries-info" style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
            {allFiltered.length} hồ sơ chứng từ — {pendingCount} cần xử lý ngay.
          </span>
        </div>
      </div>

    </div>
  );
}
