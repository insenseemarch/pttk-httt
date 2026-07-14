import { useState, useEffect } from 'react';

// Trang KIỂM TRA ĐIỀU KIỆN LƯU TRÚ (STAY CHECK)
// Nhân viên đối chiếu định danh và kiểm tra điều kiện lưu trú trước khi lập hợp đồng.
export default function StayConditionsCheck({ maHoSo = null, hienThongBao, onQuayLai, onXacNhanThanhCong }) {
  const [thongTinDatCoc, setThongTinDatCoc] = useState(null);
  const [danhSachThanhVienLuuTru, setDanhSachThanhVienLuuTru] = useState([]);
  const [dangTaiLuuTru, setDangTaiLuuTru] = useState(false);
  const [dangXuLy, setDangXuLy] = useState(false);
  const [ngoaiLe, setNgoaiLe] = useState(null);

  const taiDuLieuKiemTraLuuTru = async (maHoSoCanTai = maHoSo) => {
    if (!maHoSoCanTai) {
      hienThongBao('error', 'Thiếu mã hồ sơ cần kiểm tra. Vui lòng chọn hồ sơ từ danh sách.');
      return;
    }
    setDangTaiLuuTru(true);
    try {
      const res = await fetch(`/api/kiem-tra-luu-tru/${encodeURIComponent(maHoSoCanTai)}`);
      const json = await res.json();
      if (json.ok) {
        setThongTinDatCoc(json.data.thongTinDatCoc);
        setDanhSachThanhVienLuuTru(
          json.data.danhSachThanhVien.map(tv => ({
            ...tv,
            dieuKien: true,
            trangThai: 'Đạt'
          }))
        );
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
    if (maHoSo) taiDuLieuKiemTraLuuTru();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maHoSo]);

  const capNhatDieuKienThanhVien = (id) => {
    setDanhSachThanhVienLuuTru(prev => prev.map(tv => {
      if (tv.id === id) {
        const dieuKienMoi = !tv.dieuKien;
        return { ...tv, dieuKien: dieuKienMoi, trangThai: dieuKienMoi ? 'Đạt' : 'Không đạt' };
      }
      return tv;
    }));
  };

  const guiKetQuaKiemTra = async (luaChon = null) => {
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
          maHoSo: maHoSo,
          luaChon,
          ketQua: danhSachThanhVienLuuTru.map(tv => ({
            id: tv.id,
            cccd: tv.cccd,
            hoTen: tv.hoTen,
            dieuKien: tv.dieuKien,
          })),
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        throw new Error(json.error || 'Lỗi hệ thống');
      }

      const d = json.data;
      switch (d.trangThai) {
        case 'SUCCESS':
        case 'CONTINUE_PARTIAL':
          setNgoaiLe(null);
          hienThongBao('success', d.message);
          if (onXacNhanThanhCong) onXacNhanThanhCong(d);
          break;
        case 'TERMINATED':
          setNgoaiLe(null);
          hienThongBao('success', d.message);
          if (onQuayLai) setTimeout(() => onQuayLai(), 1500);
          break;
        case 'COMPLIANCE_EXCEPTION':
        case 'INDIVIDUAL_REJECT':
          setNgoaiLe(d);
          break;
        default:
          hienThongBao('error', d.message || 'Kết quả kiểm tra không xác định.');
      }
    } catch (err) {
      console.error('Lỗi khi xác nhận kiểm tra lưu trú:', err);
      hienThongBao('error', `Lỗi: ${err.message}`);
    } finally {
      setDangXuLy(false);
    }
  };

  const xacNhanKiemTraLuuTru = () => guiKetQuaKiemTra(null);

  return (
    <div className="stay-check-page">

      <div className="stay-check-header">
        <h1 className="page-title" style={{ margin: 0 }}>Khách hàng đến nhận phòng — Kiểm tra điều kiện lưu trú</h1>
        <p className="page-subtitle" style={{ margin: '4px 0 0 0' }}>
          Vui lòng đối chiếu thông tin định danh và kiểm tra các điều kiện lưu trú bắt buộc trước khi lập hợp đồng.
        </p>
      </div>

      {dangTaiLuuTru ? (
        <div className="stay-check-loading">Đang tải dữ liệu hồ sơ đặt cọc...</div>
      ) : (
        <div className="stay-check-grid">

          {/* CỘT TRÁI: THÔNG TIN ĐẶT CỌC */}
          <div className="stay-check-left">
            <div className="stay-check-card">
              <div className="stay-check-card-head">
                <h2 className="stay-check-card-title">Thông tin đặt cọc</h2>
                <span className="status-badge-pill status-dat-coc">
                  {thongTinDatCoc?.trangThai?.toUpperCase() || 'ĐÃ DUYỆT'}
                </span>
              </div>

              <div className="stay-check-info-list">
                <div className="stay-check-info-block">
                  <span className="stay-check-label">Mã hồ sơ</span>
                  <strong className="stay-check-value">{thongTinDatCoc?.maHoSo || maHoSo}</strong>
                </div>

                <div className="stay-check-info-pair">
                  <div className="stay-check-info-block">
                    <span className="stay-check-label">Ngày nhận phòng</span>
                    <span className="stay-check-value-sm">{thongTinDatCoc?.ngayNhanPhong || '—'}</span>
                  </div>
                  <div className="stay-check-info-block">
                    <span className="stay-check-label">Thời gian thuê</span>
                    <span className="stay-check-value-sm">{thongTinDatCoc?.thoiHanThue || 0} Tháng</span>
                  </div>
                </div>

                <div className="stay-check-info-block stay-check-divider">
                  <span className="stay-check-label">Phòng dự kiến</span>
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
                <h2 className="stay-check-card-title">Danh sách thành viên lưu trú</h2>
                <span className="stay-check-members-count">{danhSachThanhVienLuuTru.length} Thành viên</span>
              </div>

              <div className="table-responsive">
                <table className="appointments-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>STT</th>
                      <th>Họ tên</th>
                      <th>CCCD</th>
                      <th style={{ textAlign: 'center' }}>Giới tính</th>
                      <th style={{ textAlign: 'center' }}>Điều kiện</th>
                      <th>Kết quả</th>
                    </tr>
                  </thead>
                  <tbody>
                    {danhSachThanhVienLuuTru.map((tv) => (
                      <tr key={tv.id} className={!tv.dieuKien ? 'stay-check-row-fail' : ''}>
                        <td>{tv.id}</td>
                        <td>
                          <strong className="client-name">{tv.hoTen}</strong>
                          {tv.truongNhom && <span className="stay-check-lead-tag">TRƯỞNG NHÓM</span>}
                        </td>
                        <td className="datetime-cell-content">{tv.cccd}</td>
                        <td style={{ textAlign: 'center' }} className="datetime-cell-content">{tv.gioiTinh}</td>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            className="stay-check-checkbox"
                            checked={tv.dieuKien}
                            onChange={() => capNhatDieuKienThanhVien(tv.id)}
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

              <div className="stay-check-actions">
                <button
                  type="button"
                  className="btn-detail-outline"
                  onClick={onQuayLai}
                >
                  Quay lại
                </button>
                <button
                  type="button"
                  className="btn-book-filled"
                  disabled={dangXuLy}
                  onClick={xacNhanKiemTraLuuTru}
                >
                  {dangXuLy ? 'Đang xử lý...' : 'Xác nhận kết quả kiểm tra → Lập hợp đồng'}
                </button>
              </div>
            </div>
          </div>

        </div>
      )}

      {ngoaiLe && (
        <div className="np-modal-overlay" onClick={() => { if (!dangXuLy) setNgoaiLe(null); }}>
          <div className="np-modal" onClick={(e) => e.stopPropagation()}>
            <div className="np-modal-head">
              <span className="material-symbols-outlined np-modal-icon">warning</span>
              <div>
                <h3>
                  {ngoaiLe.trangThai === 'INDIVIDUAL_REJECT'
                    ? 'Khách không đủ điều kiện lưu trú'
                    : 'Một số thành viên không đủ điều kiện'}
                </h3>
                <p>{ngoaiLe.message}</p>
              </div>
            </div>

            <div className="np-modal-body">
              <div className="np-modal-field">
                <span className="np-modal-label">Thành viên chưa đạt</span>
                <div className="np-modal-chips">
                  {(ngoaiLe.thanhVienKhongDat || []).map((ten, i) => (
                    <span key={i} className="np-chip-fail">{ten}</span>
                  ))}
                </div>
              </div>

              {ngoaiLe.trangThai === 'COMPLIANCE_EXCEPTION' && (
                <div className="np-modal-summary">
                  <div>
                    <span className="np-modal-label">Số thành viên còn lại</span>
                    <strong>{ngoaiLe.soThanhVienConLai}</strong>
                  </div>
                  <div>
                    <span className="np-modal-label">Số giường/phòng đã đặt</span>
                    <strong>{ngoaiLe.soGiuongThue}</strong>
                  </div>
                </div>
              )}

              {ngoaiLe.trangThai === 'COMPLIANCE_EXCEPTION' && !ngoaiLe.choPhepTiepTuc && (
                <div className="np-modal-note np-modal-note--warn">
                  {ngoaiLe.lyDoKhongChoTiepTuc || 'Không thể tiếp tục ký hợp đồng với danh sách hiện tại.'}
                </div>
              )}

              <p className="np-modal-hint">
                Các thành viên không đạt sẽ không được ký hợp đồng và không được sắp xếp vào ở theo danh sách đã đăng ký.
              </p>
            </div>

            <div className="np-modal-actions">
              <button
                type="button"
                className="btn-detail-outline"
                disabled={dangXuLy}
                onClick={() => setNgoaiLe(null)}
              >
                Đóng
              </button>
              {(ngoaiLe.luaChonXuLy || []).map((lc) => (
                <button
                  key={lc.loai}
                  type="button"
                  className={lc.loai === 'TERMINATE_REFUND' ? 'np-btn-danger' : 'btn-book-filled'}
                  disabled={dangXuLy}
                  onClick={() => guiKetQuaKiemTra(lc.loai)}
                >
                  {dangXuLy ? 'Đang xử lý...' : lc.nhan}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
