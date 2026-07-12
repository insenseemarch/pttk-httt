import { useState, useEffect } from 'react';

// Trang KIỂM TRA ĐIỀU KIỆN LƯU TRÚ (STAY CHECK)
// Quản lý đối chiếu định danh và kiểm tra điều kiện lưu trú trước khi lập hợp đồng.
export default function StayConditionsCheck({ maHoSo: propMaHoSo, hienThongBao, onQuayLai, onXacNhanThanhCong }) {
  const [danhSachHoSo, setDanhSachHoSo] = useState([]);
  const [selectedHoSo, setSelectedHoSo] = useState('');
  const [thongTinDatCoc, setThongTinDatCoc] = useState(null);
  const [danhSachThanhVienLuuTru, setDanhSachThanhVienLuuTru] = useState([]);
  const [dangTaiLuuTru, setDangTaiLuuTru] = useState(false);
  const [dangTaiDanhSach, setDangTaiDanhSach] = useState(false);
  const [dangXuLy, setDangXuLy] = useState(false);
  
  // State xử lý ngoại lệ khi có thành viên không đạt
  const [exceptionData, setExceptionData] = useState(null);

  // 1. Tải danh sách hồ sơ đặt cọc đang chờ kiểm tra (Đã thanh toán)
  const taiDanhSachHoSo = async () => {
    setDangTaiDanhSach(true);
    try {
      const res = await fetch('/api/kiem-tra-luu-tru/danh-sach');
      const json = await res.json();
      if (json.ok) {
        setDanhSachHoSo(json.data);
        if (json.data.length > 0) {
          // Mặc định chọn hồ sơ đầu tiên hoặc hồ sơ truyền từ prop
          const defaultHoSo = propMaHoSo && json.data.some(h => h.maHoSo === propMaHoSo)
            ? propMaHoSo
            : json.data[0].maHoSo;
          setSelectedHoSo(defaultHoSo);
        } else {
          hienThongBao('info', 'Không có hồ sơ đặt cọc nào đang ở trạng thái Chờ kiểm tra lưu trú.');
        }
      } else {
        hienThongBao('error', json.error || 'Không tải được danh sách hồ sơ');
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách cọc:', err);
      hienThongBao('error', 'Lỗi kết nối máy chủ');
    } finally {
      setDangTaiDanhSach(false);
    }
  };

  // 2. Tải dữ liệu chi tiết của hồ sơ đang chọn
  const taiDuLieuKiemTraLuuTru = async (maHoSoCanTai) => {
    if (!maHoSoCanTai) return;
    setDangTaiLuuTru(true);
    setExceptionData(null); // Reset exception state
    try {
      const res = await fetch(`/api/kiem-tra-luu-tru/${encodeURIComponent(maHoSoCanTai)}`);
      const json = await res.json();
      if (json.ok) {
        setThongTinDatCoc(json.data.thongTinDatCoc);
        setDanhSachThanhVienLuuTru(json.data.danhSachThanhVien);
      } else {
        hienThongBao('error', json.error || 'Không tải được dữ liệu kiểm tra lưu trú');
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu kiểm tra lưu trú:', err);
      hienThongBao('error', 'Lỗi kết nối API kiểm tra lưu trú');
    } finally {
      setDangTaiLuuTru(false);
    }
  };

  useEffect(() => {
    taiDanhSachHoSo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propMaHoSo]);

  useEffect(() => {
    if (selectedHoSo) {
      taiDuLieuKiemTraLuuTru(selectedHoSo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHoSo]);

  const capNhatDieuKienThanhVien = (id) => {
    setDanhSachThanhVienLuuTru(prev => prev.map(tv => {
      if (tv.id === id) {
        const dieuKienMoi = !tv.dieuKien;
        return { ...tv, dieuKien: dieuKienMoi, trangThai: dieuKienMoi ? 'Đạt' : 'Không đạt' };
      }
      return tv;
    }));
  };

  const xacNhanKiemTraLuuTru = async () => {
    if (danhSachThanhVienLuuTru.length === 0) {
      hienThongBao('error', 'Chưa có thành viên nào để kiểm tra!');
      return;
    }
    setDangXuLy(true);
    try {
      const res = await fetch('/api/kiem-tra-luu-tru/xac-nhan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maHoSo: selectedHoSo,
          ketQua: danhSachThanhVienLuuTru.map(tv => ({
            id: tv.id,
            cccd: tv.cccd,
            hoTen: tv.hoTen,
            dieuKien: tv.dieuKien
          }))
        })
      });
      const json = await res.json();
      if (json.ok && json.data.trangThai === 'SUCCESS') {
        hienThongBao('success', `${json.data.message} (Mã tạm tính HĐ: ${json.data.maHopDong})`);
        if (onXacNhanThanhCong) {
          onXacNhanThanhCong(json.data);
        }
      } else if (json.ok && json.data.trangThai === 'COMPLIANCE_EXCEPTION') {
        hienThongBao('error', `${json.data.message}`);
        // Lưu thông tin ngoại lệ để hiển thị các tùy chọn xử lý
        setExceptionData(json.data);
      } else {
        throw new Error(json.error || 'Lỗi hệ thống');
      }
    } catch (err) {
      console.error('Lỗi khi xác nhận kiểm tra lưu trú:', err);
      hienThongBao('error', `Lỗi: ${err.message}`);
    } finally {
      setDangXuLy(false);
    }
  };

  // Hàm xử lý quyết định khi có thành viên không đạt
  const xuLyNgoaiLeThanhVien = (loaiQuyetDinh) => {
    if (loaiQuyetDinh === 'CONTINUE_PARTIAL') {
      hienThongBao('success', 'Đã ghi nhận tiếp tục thuê. Tiến hành loại bỏ thành viên không đạt khỏi danh sách hợp đồng...');
      if (onXacNhanThanhCong) {
        onXacNhanThanhCong({
          trangThai: 'SUCCESS',
          maHopDong: `CON-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`
        });
      }
    } else if (loaiQuyetDinh === 'TERMINATE_REFUND') {
      hienThongBao('info', 'Đã dừng thủ tục thuê phòng và chuyển hồ sơ hoàn trả cọc (hoàn 80%).');
      // Quay lại danh sách cọc hoặc tải lại
      taiDanhSachHoSo();
    }
  };

  return (
    <div className="stay-check-page">
      <div className="stay-check-header">
        <h1 className="page-title" style={{ margin: 0 }}>Đối chiếu định danh &amp; Kiểm tra điều kiện lưu trú</h1>
        <p className="page-subtitle" style={{ margin: '4px 0 0 0' }}>
          Vai trò: Quản lý chi nhánh — Đối chiếu thông tin CCCD thực tế và xét duyệt các thành viên lưu trú.
        </p>
      </div>

      {/* THANH CHỌN HỒ SƠ ĐẶT CỌC */}
      <div className="stay-check-selector-card" style={{ background: 'white', padding: '16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <label htmlFor="hoso-select" style={{ fontWeight: '700', color: '#1e293b', whiteSpace: 'nowrap' }}>Chọn hồ sơ đặt cọc cần duyệt:</label>
        {dangTaiDanhSach ? (
          <span style={{ fontSize: '14px', color: '#64748b' }}>Đang tải danh sách hồ sơ...</span>
        ) : (
          <select
            id="hoso-select"
            value={selectedHoSo}
            onChange={(e) => setSelectedHoSo(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', outline: 'none', background: 'white', cursor: 'pointer', fontSize: '14.5px', color: '#0f172a', flex: 1 }}
          >
            {danhSachHoSo.map(h => (
              <option key={h.maHoSo} value={h.maHoSo}>
                Hồ sơ #{h.maHoSo} — Khách đại diện: {h.hoTenKhach} ({Number(h.soTienCoc).toLocaleString('vi-VN')} VNĐ cọc)
              </option>
            ))}
          </select>
        )}
        <button
          type="button"
          onClick={taiDanhSachHoSo}
          style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          🔄 Làm mới
        </button>
      </div>

      {dangTaiLuuTru ? (
        <div className="stay-check-loading" style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#64748b' }}>
          Đang tải dữ liệu hồ sơ từ cơ sở dữ liệu...
        </div>
      ) : thongTinDatCoc ? (
        <div className="stay-check-grid">

          {/* CỘT TRÁI: THÔNG TIN ĐẶT CỌC */}
          <div className="stay-check-left">
            <div className="stay-check-card">
              <div className="stay-check-card-head">
                <h2 className="stay-check-card-title">Thông tin đặt cọc</h2>
                <span className="status-badge-pill status-dat-coc">
                  {thongTinDatCoc?.trangThai?.toUpperCase() || 'ĐÃ THANH TOÁN'}
                </span>
              </div>

              <div className="stay-check-info-list">
                <div className="stay-check-info-block">
                  <span className="stay-check-label">Mã hồ sơ (Mã cọc)</span>
                  <strong className="stay-check-value">#{thongTinDatCoc?.maHoSo}</strong>
                </div>

                <div className="stay-check-info-pair">
                  <div className="stay-check-info-block">
                    <span className="stay-check-label">Ngày nhận cọc</span>
                    <span className="stay-check-value-sm">{thongTinDatCoc?.ngayNhanPhong || '—'}</span>
                  </div>
                  <div className="stay-check-info-block">
                    <span className="stay-check-label">Thời hạn thuê</span>
                    <span className="stay-check-value-sm">{thongTinDatCoc?.thoiHanThue || 12} Tháng</span>
                  </div>
                </div>

                <div className="stay-check-info-block stay-check-divider">
                  <span className="stay-check-label">Phòng/Giường dự kiến</span>
                  <span className="stay-check-room">{thongTinDatCoc?.phongDuKien || '—'}</span>
                </div>

                <div className="stay-check-info-block stay-check-divider">
                  <span className="stay-check-label">Số tiền đã cọc</span>
                  <strong className="stay-check-amount">
                    {Number(thongTinDatCoc?.soTienDaCoc || 0).toLocaleString('vi-VN')} {thongTinDatCoc?.donViTien || 'VNĐ'}
                  </strong>
                </div>
              </div>
            </div>

            <div className="stay-check-note-card">
              <div className="stay-check-note-head">Ghi chú từ Sales</div>
              <p className="stay-check-note-text">"{thongTinDatCoc?.ghiChuSales || 'Không có ghi chú.'}"</p>
            </div>
          </div>

          {/* CỘT PHẢI: DANH SÁCH THÀNH VIÊN */}
          <div className="stay-check-right">
            <div className="table-card">
              <div className="stay-check-members-head">
                <h2 className="stay-check-card-title">Danh sách thành viên đăng ký lưu trú</h2>
                <span className="stay-check-members-count">{danhSachThanhVienLuuTru.length} Người</span>
              </div>

              <div className="table-responsive">
                <table className="appointments-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>STT</th>
                      <th>Họ tên</th>
                      <th>CCCD</th>
                      <th style={{ textAlign: 'center' }}>Giới tính</th>
                      <th>Quốc tịch</th>
                      <th style={{ textAlign: 'right' }}>Khả năng tài chính</th>
                      <th style={{ textAlign: 'center' }}>Điều kiện</th>
                      <th>Kết quả</th>
                    </tr>
                  </thead>
                  <tbody>
                    {danhSachThanhVienLuuTru.map((tv, index) => (
                      <tr key={tv.cccd} className={!tv.dieuKien ? 'stay-check-row-fail' : ''}>
                        <td>{index + 1}</td>
                        <td>
                          <strong className="client-name">{tv.hoTen}</strong>
                          {tv.truongNhom && <span className="stay-check-lead-tag">TRƯỞNG NHÓM</span>}
                        </td>
                        <td className="datetime-cell-content">{tv.cccd}</td>
                        <td style={{ textAlign: 'center' }} className="datetime-cell-content">{tv.gioiTinh}</td>
                        <td>{tv.quocTich || 'Việt Nam'}</td>
                        <td style={{ textAlign: 'right' }}>
                          {tv.taiChinh ? `${Number(tv.taiChinh).toLocaleString('vi-VN')} đ` : '—'}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            className="stay-check-checkbox"
                            checked={tv.dieuKien}
                            onChange={() => capNhatDieuKienThanhVien(tv.id)}
                            disabled={exceptionData !== null} // Khóa checkbox nếu đang xử lý ngoại lệ
                          />
                        </td>
                        <td>
                          <span className={`stay-check-result ${tv.dieuKien ? 'result-pass' : 'result-fail'}`}>
                            {tv.dieuKien ? 'Đạt' : 'Không đạt'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* HIỂN THỊ HỘP LỰA CHỌN XỬ LÝ NGOẠI LỆ KHI CÓ THÀNH VIÊN KHÔNG ĐẠT */}
              {exceptionData && (
                <div className="compliance-exception-box" style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: '12px', padding: '16px', marginTop: '20px', textAlign: 'left' }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '15.5px', color: '#b91c1c', fontWeight: '800' }}>
                    ⚠️ Phát hiện thành viên không đủ điều kiện lưu trú!
                  </h3>
                  <p style={{ margin: '0 0 12px 0', fontSize: '13.5px', color: '#7f1d1d' }}>
                    Thành viên chưa đạt: <strong>{exceptionData.thanhVienKhongDat.join(', ')}</strong>. Vui lòng chọn một trong các phương án xử lý dưới đây theo quy chế ký túc xá:
                  </p>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {exceptionData.luaChonXuLy?.map(option => (
                      <button
                        key={option.loai}
                        type="button"
                        onClick={() => xuLyNgoaiLeThanhVien(option.loai)}
                        style={{
                          flex: 1,
                          padding: '10px 16px',
                          borderRadius: '8px',
                          border: 'none',
                          background: option.loai === 'CONTINUE_PARTIAL' ? '#2563eb' : '#dc2626',
                          color: 'white',
                          fontWeight: '700',
                          cursor: 'pointer',
                          fontSize: '13px'
                        }}
                      >
                        {option.nhan}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="stay-check-actions" style={{ marginTop: '24px' }}>
                <button
                  type="button"
                  className="btn-detail-outline"
                  onClick={onQuayLai}
                >
                  Quay lại
                </button>
                
                {exceptionData === null && (
                  <button
                    type="button"
                    className="btn-book-filled"
                    disabled={dangXuLy}
                    onClick={xacNhanKiemTraLuuTru}
                  >
                    {dangXuLy ? 'Đang xử lý...' : 'Xác nhận kết quả kiểm tra'}
                  </button>
                )}
              </div>
            </div>
          </div>

        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#64748b' }}>
          Không tìm thấy hồ sơ đặt cọc hợp lệ để kiểm tra lưu trú.
        </div>
      )}
    </div>
  );
}
