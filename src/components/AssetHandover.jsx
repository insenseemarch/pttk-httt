import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SignatureCanvas from 'react-signature-canvas';
import HandoverPrintModal from './HandoverPrintModal';
import { ROUTES } from '../config/routes';
import { hopLeChuKyAnh, layAnhChuKyTuPad } from '../utils/chuKySo';

function DongThongTin({ label, value, highlight }) {
  return (
    <div className="handover-info-row">
      <span className="handover-info-label">{label}</span>
      <span className={`handover-info-value${highlight ? ' handover-info-value--highlight' : ''}`}>{value || '—'}</span>
    </div>
  );
}

export default function AssetHandover({
  maHopDong = null,
  maQuanLy = null,
  tenQuanLy = null,
  hienThongBao,
  onQuayLai,
  onBanGiaoThanhCong,
}) {
  const navigate = useNavigate();
  const [thongTin, setThongTin] = useState(null);
  const [danhMucTaiSan, setDanhMucTaiSan] = useState([]);
  const [quanLyDaKy, setQuanLyDaKy] = useState(false);
  const [khachDaKy, setKhachDaKy] = useState(false);
  const [dangTai, setDangTai] = useState(false);
  const [dangXuLy, setDangXuLy] = useState(false);
  const [bienBanIn, setBienBanIn] = useState(null);
  const [confirmPopup, setConfirmPopup] = useState(null);

  const sigPadQuanLy = useRef(null);
  const sigPadKhach = useRef(null);

  const khachHang = thongTin?.khachHang;
  const hopDong = thongTin?.hopDong;
  const phong = thongTin?.phong;

  const xoaChuKyQuanLy = () => {
    sigPadQuanLy.current?.clear();
    setQuanLyDaKy(false);
  };

  const xoaChuKyKhach = () => {
    sigPadKhach.current?.clear();
    setKhachDaKy(false);
  };

  const taiDuLieuBanGiao = async () => {
    if (!maHopDong) return;
    setDangTai(true);
    try {
      const res = await fetch(`/api/ban-giao/hop-dong/${encodeURIComponent(maHopDong)}`);
      const json = await res.json();
      if (json.ok) {
        setThongTin(json.data);
        setDanhMucTaiSan(
          json.data.danhMucTaiSan.map((item) => ({
            ...item,
            daKiem: false,
            ghiChu: '',
          })),
        );
        setQuanLyDaKy(false);
        setKhachDaKy(false);
        sigPadQuanLy.current?.clear();
        sigPadKhach.current?.clear();
      } else {
        hienThongBao('error', json.error || 'Không tải được dữ liệu bàn giao');
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu bàn giao:', err);
      hienThongBao('error', 'Lỗi kết nối API bàn giao');
    } finally {
      setDangTai(false);
    }
  };

  useEffect(() => {
    taiDuLieuBanGiao();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maHopDong]);

  const capNhatKiem = (id) => {
    setDanhMucTaiSan((prev) => prev.map((item) =>
      item.id === id ? { ...item, daKiem: !item.daKiem } : item,
    ));
  };

  const capNhatGhiChu = (id, value) => {
    setDanhMucTaiSan((prev) => prev.map((item) =>
      item.id === id ? { ...item, ghiChu: value } : item,
    ));
  };

  const dongModalIn = () => {
    setBienBanIn(null);
    if (onBanGiaoThanhCong) onBanGiaoThanhCong();
    else navigate(ROUTES.banGiao);
  };

  const hoanTatBanGiao = async () => {
    const daKiemDu = danhMucTaiSan.length > 0 && danhMucTaiSan.every((item) => item.daKiem);
    if (!daKiemDu) {
      hienThongBao('error', 'Vui lòng tick đủ tất cả mục kiểm kê tài sản trước khi ký.');
      return;
    }
    if (!quanLyDaKy || sigPadQuanLy.current?.isEmpty()) {
      hienThongBao('error', 'Vui lòng yêu cầu quản lý ký xác nhận trên ô chữ ký.');
      return;
    }
    if (!khachDaKy || sigPadKhach.current?.isEmpty()) {
      hienThongBao('error', 'Vui lòng yêu cầu khách hàng ký xác nhận trên ô chữ ký.');
      return;
    }

    const chuKyQuanLy = layAnhChuKyTuPad(sigPadQuanLy);
    const chuKyKhach = layAnhChuKyTuPad(sigPadKhach);
    if (!hopLeChuKyAnh(chuKyQuanLy) || !hopLeChuKyAnh(chuKyKhach)) {
      hienThongBao('error', 'Không đọc được chữ ký. Vui lòng ký lại.');
      return;
    }

    setDangXuLy(true);
    try {
      const res = await fetch('/api/ban-giao/hoan-tat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maHopDong,
          maQuanLy,
          ketQuaTaiSan: danhMucTaiSan.map((item) => ({
            id: item.id,
            ten: item.ten,
            nhom: item.nhom,
            daKiem: item.daKiem,
            ghiChu: item.ghiChu,
          })),
          chuKyQuanLy,
          chuKyKhach,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        hienThongBao('success', json.data.message);
        setBienBanIn(json.data.inBienBan || {
          maBienBan: json.data.maBienBan,
          maHopDong,
          ngayBanGiao: json.data.ngayBanGiao,
          thoiDiemKy: json.data.thoiDiemKy,
          khachHang,
          hopDong,
          phong,
          thuTienKyDau: thongTin?.thuTienKyDau,
          ketQuaTaiSan: danhMucTaiSan,
          chuKyQuanLy,
          chuKyKhach,
          tenQuanLy: json.data.tenQuanLy || tenQuanLy,
        });
      } else {
        throw new Error(json.error || 'Lỗi hệ thống');
      }
    } catch (err) {
      console.error('Lỗi khi hoàn tất bàn giao:', err);
      hienThongBao('error', `Lỗi: ${err.message}`);
    } finally {
      setDangXuLy(false);
    }
  };

  const soMucDaKiem = danhMucTaiSan.filter((i) => i.daKiem).length;
  const tongMuc = danhMucTaiSan.length;
  const tienDoPercent = tongMuc > 0 ? Math.round((soMucDaKiem / tongMuc) * 100) : 0;
  const sanSangKy = soMucDaKiem === tongMuc && tongMuc > 0 && quanLyDaKy && khachDaKy;

  const quayLaiDanhSach = () => {
    if (onQuayLai) onQuayLai();
    else navigate(ROUTES.banGiao);
  };

  const moConfirmKyBanGiao = () => {
    const daKiemDu = danhMucTaiSan.length > 0 && danhMucTaiSan.every((item) => item.daKiem);
    if (!daKiemDu) {
      hienThongBao('error', 'Vui lòng tick đủ tất cả mục kiểm kê tài sản trước khi ký.');
      return;
    }
    if (!quanLyDaKy || sigPadQuanLy.current?.isEmpty()) {
      hienThongBao('error', 'Vui lòng yêu cầu quản lý ký xác nhận trên ô chữ ký.');
      return;
    }
    if (!khachDaKy || sigPadKhach.current?.isEmpty()) {
      hienThongBao('error', 'Vui lòng yêu cầu khách hàng ký xác nhận trên ô chữ ký.');
      return;
    }
    setConfirmPopup('ky-ban-giao');
  };

  const noiDungConfirmPopup = (() => {
    if (confirmPopup === 'ky-ban-giao') {
      return {
        tieuDe: 'Xác nhận ký biên bản bàn giao?',
        moTa: `Phòng ${phong?.phongGiuong || '—'} sẽ chuyển sang trạng thái ĐANG THUÊ cho ${khachHang?.hoTen || 'khách hàng'}. Tiền điện, nước bắt đầu tính từ thời điểm này. Thao tác không thể hoàn tác.`,
        nutChinh: 'Ký biên bản bàn giao',
        nutChinhClass: 'btn-book-filled',
      };
    }
    if (confirmPopup === 'quay-lai') {
      return {
        tieuDe: 'Quay lại danh sách?',
        moTa: 'Biên bản bàn giao chưa hoàn tất sẽ không được lưu. Bạn có chắc chắn muốn quay lại?',
        nutChinh: 'Quay lại',
        nutChinhClass: 'btn-detail-outline',
      };
    }
    return null;
  })();

  const thucHienConfirmPopup = async () => {
    if (!confirmPopup) return;
    const action = confirmPopup;
    setConfirmPopup(null);
    if (action === 'ky-ban-giao') await hoanTatBanGiao();
    else if (action === 'quay-lai') quayLaiDanhSach();
  };

  return (
    <div className="handover-page">
      {bienBanIn && (
        <HandoverPrintModal data={bienBanIn} onDong={dongModalIn} />
      )}

      <div className="handover-breadcrumb">
        <span>Hợp đồng</span>
        <span className="handover-breadcrumb-sep">›</span>
        <span>{phong?.phongGiuong || 'Phòng'}</span>
        <span className="handover-breadcrumb-sep">›</span>
        <span className="handover-breadcrumb-current">Bàn giao</span>
      </div>

      <div className="handover-header">
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>Bước cuối: Bàn giao phòng cho khách</h1>
          <p className="page-subtitle" style={{ margin: '4px 0 0 0' }}>
            Kiểm tra hiện trạng, ghi nhận tài sản, hướng dẫn quy định — hai bên ký biên bản điện tử.
          </p>
        </div>

        {!dangTai && tongMuc > 0 && (
          <div className="handover-progress-wrap">
            <div className="handover-progress-label">
              <span>Tiến độ kiểm kê</span>
              <strong style={{ color: tienDoPercent === 100 ? 'var(--success-color)' : 'var(--primary-color)' }}>
                {soMucDaKiem}/{tongMuc} mục
              </strong>
            </div>
            <div className="handover-progress-bar">
              <div className="handover-progress-fill" style={{ width: `${tienDoPercent}%` }} />
            </div>
          </div>
        )}
      </div>

      {dangTai ? (
        <div className="stay-check-loading">Đang tải dữ liệu bàn giao...</div>
      ) : (
        <div className="handover-grid">

          <div className="handover-left">

            <div className="stay-check-card handover-guest-card">
              <div className="stay-check-card-head">
                <h2 className="stay-check-card-title handover-section-title">Thông tin khách hàng</h2>
              </div>

              <div className="handover-guest-profile">
                <span className="handover-guest-avatar">
                  {(khachHang?.hoTen || '?').split(' ').map((w) => w[0]).join('').slice(-2).toUpperCase()}
                </span>
                <div>
                  <strong className="stay-check-value">{khachHang?.hoTen || '—'}</strong>
                  <span className="client-phone">{khachHang?.sdt || '—'}</span>
                </div>
              </div>

              <div className="handover-info-list">
                <DongThongTin label="CCCD:" value={khachHang?.cccd} />
                <DongThongTin label="Email:" value={khachHang?.email} />
                <DongThongTin label="Địa chỉ:" value={khachHang?.diaChi} />
                <DongThongTin label="Giới tính:" value={khachHang?.gioiTinh} />
                <DongThongTin label="Ngày sinh:" value={khachHang?.ngaySinh} />
              </div>
            </div>

            <div className="stay-check-card handover-guest-card">
              <div className="stay-check-card-head">
                <h2 className="stay-check-card-title handover-section-title">Hợp đồng & phòng</h2>
              </div>
              <div className="handover-info-list">
                <DongThongTin label="Mã HĐ:" value={hopDong?.maHopDongFmt} highlight />
                <DongThongTin label="Phiếu cọc:" value={hopDong?.maPhieuCoc} />
                <DongThongTin label="Trạng thái:" value={hopDong?.trangThai} />
                <DongThongTin label="Loại thuê:" value={hopDong?.loaiThue} />
                <DongThongTin label="Phòng / Giường:" value={phong?.phongGiuong} />
                <DongThongTin label="Chi nhánh:" value={phong?.chiNhanh} />
                <DongThongTin label="Số giường:" value={hopDong?.soGiuong} />
                <DongThongTin label="Giá thuê:" value={hopDong?.giaThueFmt} />
                <DongThongTin label="Kỳ thanh toán:" value={hopDong?.kyThanhToan} />
                <DongThongTin label="Ngày ký HĐ:" value={hopDong?.ngayKy} />
                <DongThongTin label="Bắt đầu thuê:" value={hopDong?.ngayBatDau} />
                <DongThongTin label="Kết thúc:" value={hopDong?.ngayKetThuc} />
                <DongThongTin label="Thời hạn:" value={hopDong?.thoiHanThue} />
                {thongTin?.thuTienKyDau && (
                  <DongThongTin
                    label="Thu kỳ đầu:"
                    value={(
                      <>
                        {thongTin.thuTienKyDau.maPhieuThu}
                        {' — '}
                        <span className="handover-info-amount">{thongTin.thuTienKyDau.soTienFmt}</span>
                      </>
                    )}
                    highlight
                  />
                )}
              </div>
              {(phong?.danhSachGiuong?.length > 1) && (
                <div className="handover-giuong-tags">
                  {phong.danhSachGiuong.map((g) => (
                    <span key={g} className="qt-chip qt-chip--blue">{g}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="handover-notice">
              <div className="handover-notice-head">Lưu ý quan trọng</div>
              <p className="handover-notice-text">
                Phòng <strong>CHỈ</strong> chuyển sang trạng thái <strong>ĐANG THUÊ</strong> sau khi
                bấm nút ký biên bản bàn giao. Tiền điện, nước bắt đầu được tính từ thời điểm này.
              </p>
            </div>

            <div className="handover-notice handover-guide-card">
              <div className="handover-notice-head">Hướng dẫn cần trao đổi với khách</div>
              <ul className="handover-guide-list">
                <li>Giờ giấc sinh hoạt, giữ gìn vệ sinh khu vực chung</li>
                <li>Cách sử dụng điện, nước, wifi và khu vực gửi xe</li>
                <li>Quy trình báo hỏng hóc / yêu cầu hỗ trợ</li>
                <li>Lưu ý an toàn: chìa khóa, thẻ từ, phòng cháy chữa cháy</li>
              </ul>
            </div>

            <div className="handover-sign-status-card">
              <div className="handover-sign-status-row">
                <span>Quản lý ký {tenQuanLy ? `(${tenQuanLy})` : ''}</span>
                <span className={`handover-sign-status-pill ${quanLyDaKy ? 'signed' : 'unsigned'}`}>
                  {quanLyDaKy ? 'Đã ký' : 'Chưa ký'}
                </span>
              </div>
              <div className="handover-sign-status-row">
                <span>Khách hàng ký</span>
                <span className={`handover-sign-status-pill ${khachDaKy ? 'signed' : 'unsigned'}`}>
                  {khachDaKy ? 'Đã ký' : 'Chưa ký'}
                </span>
              </div>
            </div>

          </div>

          <div className="handover-right">
            <div className="table-card">

              <div className="stay-check-members-head">
                <h2 className="stay-check-card-title">Danh mục bàn giao tài sản</h2>
                <span className="stay-check-members-count">
                  {soMucDaKiem === tongMuc && tongMuc > 0
                    ? <span style={{ color: 'var(--success-color)' }}>Hoàn tất {tongMuc}/{tongMuc}</span>
                    : `${soMucDaKiem}/${tongMuc} đã kiểm`}
                </span>
              </div>

              <div className="handover-inventory">
                {danhMucTaiSan.map((item) => (
                  <div key={item.id} className={`handover-item ${item.daKiem ? 'checked' : ''}`}>
                    <label className="handover-item-check">
                      <input
                        type="checkbox"
                        className="stay-check-checkbox"
                        checked={item.daKiem}
                        onChange={() => capNhatKiem(item.id)}
                      />
                      <span className="handover-item-name">{item.ten}</span>
                    </label>
                    <div className="handover-item-note-wrap">
                      <input
                        type="text"
                        className="handover-item-note"
                        placeholder={item.goiY || 'Ghi chú tình trạng...'}
                        value={item.ghiChu}
                        onChange={(e) => capNhatGhiChu(item.id, e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="handover-signatures">
                <div className="handover-sign-col">
                  <div className="np-sign-head" style={{ width: '100%' }}>
                    <span className="handover-sign-title">Đại diện Quản lý</span>
                    <button
                      type="button"
                      className="np-sign-clear np-tooltip-wrap"
                      data-tip="Xóa chữ ký quản lý để ký lại."
                      onClick={xoaChuKyQuanLy}
                    >
                      Xóa chữ ký
                    </button>
                  </div>
                  <div className="np-sign-box" style={{ width: '100%' }}>
                    <SignatureCanvas
                      ref={sigPadQuanLy}
                      penColor="#1d4ed8"
                      onEnd={() => setQuanLyDaKy(true)}
                      canvasProps={{ className: 'np-sign-canvas', style: { width: '100%', height: '140px' } }}
                    />
                    {!quanLyDaKy && <span className="np-sign-placeholder">Quản lý ký tên tại đây</span>}
                  </div>
                  <span className="handover-sign-footer-name">{tenQuanLy || 'Đại diện Quản lý'}</span>
                </div>

                <div className="handover-sign-col">
                  <div className="np-sign-head" style={{ width: '100%' }}>
                    <span className="handover-sign-title">Khách hàng</span>
                    <button
                      type="button"
                      className="np-sign-clear np-tooltip-wrap"
                      data-tip="Xóa chữ ký khách để ký lại."
                      onClick={xoaChuKyKhach}
                    >
                      Xóa chữ ký
                    </button>
                  </div>
                  <div className="np-sign-box" style={{ width: '100%' }}>
                    <SignatureCanvas
                      ref={sigPadKhach}
                      penColor="#1d4ed8"
                      onEnd={() => setKhachDaKy(true)}
                      canvasProps={{ className: 'np-sign-canvas', style: { width: '100%', height: '140px' } }}
                    />
                    {!khachDaKy && <span className="np-sign-placeholder">Khách hàng ký tên tại đây</span>}
                  </div>
                  <span className="handover-sign-footer-name">{khachHang?.hoTen || 'Khách hàng'}</span>
                </div>
              </div>

              <p className="np-sign-note" style={{ padding: '0 24px' }}>
                Bằng việc ký tên, hai bên xác nhận đã kiểm tra hiện trạng phòng/giường, tài sản bàn giao và các quy định sử dụng.
              </p>

              <div className="handover-actions">
                <div
                  className="np-tooltip-wrap np-tooltip-wrap--below handover-confirm-tip"
                  data-tip={
                    sanSangKy
                      ? 'Hoàn tất biên bản, lưu DB và mở hộp thoại in / lưu PDF.'
                      : 'Cần tick đủ checklist và cả hai bên ký trước khi xác nhận.'
                  }
                >
                  <button
                    type="button"
                    className="btn-book-filled handover-confirm-btn"
                    disabled={dangXuLy || !sanSangKy}
                    onClick={moConfirmKyBanGiao}
                  >
                    {dangXuLy ? 'Đang xử lý...' : 'Ký biên bản bàn giao — Chính thức nhận phòng'}
                  </button>
                </div>
                <p className="handover-legal-note">Biên bản điện tử có giá trị pháp lý tương đương văn bản giấy</p>
                <button type="button" className="btn-detail-outline" onClick={() => setConfirmPopup('quay-lai')}>
                  Quay lại
                </button>
              </div>

            </div>
          </div>

        </div>
      )}

      {confirmPopup && noiDungConfirmPopup && (
        <div
          className="np-modal-overlay"
          onClick={() => { if (!dangXuLy) setConfirmPopup(null); }}
          role="presentation"
        >
          <div className="np-modal np-modal--confirm" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="np-modal-head">
              <span className="material-symbols-outlined np-modal-icon">help</span>
              <div>
                <h3>{noiDungConfirmPopup.tieuDe}</h3>
                <p>{noiDungConfirmPopup.moTa}</p>
              </div>
            </div>
            <div className="np-modal-actions">
              <button
                type="button"
                className="btn-detail-outline"
                disabled={dangXuLy}
                onClick={() => setConfirmPopup(null)}
              >
                Hủy
              </button>
              <button
                type="button"
                className={noiDungConfirmPopup.nutChinhClass}
                disabled={dangXuLy}
                onClick={thucHienConfirmPopup}
              >
                {dangXuLy ? 'Đang xử lý...' : noiDungConfirmPopup.nutChinh}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
