import { useState, useEffect, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import ContractPrintModal from './ContractPrintModal';

const QUY_DINH_HOAN_COC = [
  { moTa: 'Đã đặt cọc, chưa ký HĐ', mucHoan: '80%' },
  { moTa: 'Đã ký HĐ, lưu trú dưới 6 tháng', mucHoan: '50%' },
  { moTa: 'Đã ký HĐ, lưu trú từ 6 tháng trở lên', mucHoan: '70%' },
  { moTa: 'Hết hạn hợp đồng theo thỏa thuận', mucHoan: '100%' },
];

const NOI_QUY_MAC_DINH = [
  'Tuân thủ giờ giấc sinh hoạt chung (không gây ồn ào sau 22:00)',
  'Giữ gìn vệ sinh khu vực chung và phòng ở',
  'Không hút thuốc trong khuôn viên ký túc xá',
  'Không nuôi thú cưng trong phòng',
  'Bảo quản tài sản, chìa khóa và thẻ từ được cấp',
  'Không tự ý sửa chữa, thay đổi cấu trúc phòng',
  'Không cho người lạ lưu trú qua đêm khi chưa đăng ký',
  'Báo cáo ngay với quản lý khi phát sinh hư hỏng tài sản hoặc sự cố an toàn',
];

const DIEU_KHOAN_VI_PHAM = [
  'Vi phạm nội quy lần 1: nhắc nhở bằng văn bản và yêu cầu khắc phục trong 48 giờ',
  'Vi phạm nghiêm trọng hoặc tái phạm: có thể chấm dứt hợp đồng và khấu trừ chi phí theo quy định hoàn cọc',
  'Gây hư hỏng tài sản: bồi thường theo giá trị thực tế sửa chữa hoặc thay thế',
  'Nợ tiền thuê / điện nước / dịch vụ quá hạn: tạm ngưng dịch vụ và thu hồi theo quy trình đối soát',
  'Chuyển nhượng giường/phòng cho bên thứ ba khi chưa được quản lý chấp thuận: vi phạm hợp đồng',
];

const tinhNgayKetThuc = (ngayBatDau, thoiHanThue) => {
  if (!ngayBatDau || !thoiHanThue) return '—';
  const [nam, thang, ngay] = ngayBatDau.split('-').map(Number);
  if (!nam || !thang || !ngay) return '—';
  const ketThuc = new Date(nam, thang - 1 + Number(thoiHanThue), ngay);
  const y = ketThuc.getFullYear();
  const m = String(ketThuc.getMonth() + 1).padStart(2, '0');
  const d = String(ketThuc.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Trang LẬP HỢP ĐỒNG THUÊ (CONTRACT DRAFTING)
// Nhân viên đối chiếu thông tin thuê, biểu phí dịch vụ và lập hợp đồng điện tử.
export default function ContractDrafting({ maHoSo = null, nguoiDung, hienThongBao, onQuayLai, onXacNhanThanhCong }) {
  const [khachHang, setKhachHang] = useState(null);
  const [thongTinThue, setThongTinThue] = useState(null);
  const [bieuPhiDichVu, setBieuPhiDichVu] = useState([]);
  const [kyThanhToan, setKyThanhToan] = useState('Thanh toán hàng tháng');
  const [dangTai, setDangTai] = useState(false);
  const [dangXuLy, setDangXuLy] = useState(false);
  const [khachDaKy, setKhachDaKy] = useState(false);
  const [hopDongDaKy, setHopDongDaKy] = useState(null);

  const sigPadKhach = useRef(null);

  const xoaChuKy = () => {
    sigPadKhach.current?.clear();
    setKhachDaKy(false);
  };

  const taiDuLieuLapHopDong = async (maHoSoCanTai = maHoSo) => {
    if (!maHoSoCanTai) {
      hienThongBao('error', 'Thiếu mã hồ sơ. Vui lòng chọn hồ sơ từ danh sách chờ lập hợp đồng.');
      return;
    }
    setDangTai(true);
    try {
      const res = await fetch(`/api/hop-dong/pre-fill/${encodeURIComponent(maHoSoCanTai)}`);
      const json = await res.json();
      if (json.ok) {
        setKhachHang(json.data.khachHang);
        setThongTinThue(json.data.thongTinThue);
        setBieuPhiDichVu(json.data.bieuPhiDichVu || []);
        setKyThanhToan(json.data.thongTinThue?.kyThanhToan || 'Thanh toán hàng tháng');
      } else {
        hienThongBao('error', json.error || 'Không tải được dữ liệu lập hợp đồng');
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu lập hợp đồng:', err);
      hienThongBao('error', 'Lỗi kết nối API lập hợp đồng');
    } finally {
      setDangTai(false);
    }
  };

  useEffect(() => {
    if (maHoSo) taiDuLieuLapHopDong();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maHoSo]);

  const capNhatGiaPhi = (id, giaMoi) => {
    setBieuPhiDichVu(prev => prev.map(phi =>
      phi.id === id ? { ...phi, gia: Number(String(giaMoi).replace(/\D/g, '')) || 0 } : phi
    ));
  };

  const layChuKyKhach = () => {
    const pad = sigPadKhach.current;
    if (!pad || pad.isEmpty()) return null;
    const src = pad.getCanvas();
    const maxW = 480;
    const scale = src.width > maxW ? maxW / src.width : 1;
    const w = Math.max(1, Math.round(src.width * scale));
    const h = Math.max(1, Math.round(src.height * scale));
    const tmp = document.createElement('canvas');
    tmp.width = w;
    tmp.height = h;
    tmp.getContext('2d')?.drawImage(src, 0, 0, w, h);
    return tmp.toDataURL('image/png', 0.85);
  };

  const taoHopDong = async (choKy = true) => {
    if (!khachHang || !thongTinThue) {
      hienThongBao('error', 'Chưa có dữ liệu hợp đồng để lưu!');
      return;
    }
    if (choKy && (!khachDaKy || sigPadKhach.current?.isEmpty())) {
      hienThongBao('error', 'Vui lòng yêu cầu khách hàng ký xác nhận trước khi ký hợp đồng.');
      return;
    }
    setDangXuLy(true);
    try {
      const chuKyKhach = choKy ? layChuKyKhach() : null;
      if (choKy && !chuKyKhach) {
        hienThongBao('error', 'Không đọc được chữ ký. Vui lòng ký lại.');
        setDangXuLy(false);
        return;
      }
      const res = await fetch('/api/hop-dong/tao-moi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maHoSo,
          khachHang: { cccd: khachHang.cccd, hoTen: khachHang.hoTen },
          thongTinThue: {
            ngayBatDau: thongTinThue.ngayBatDau,
            thoiHanThue: thongTinThue.thoiHanThue,
            kyThanhToan,
            phongGiuong: thongTinThue.phongGiuong,
          },
          bieuPhiDichVu,
          chuKyKhach,
          choKy,
          khachDaKy: choKy ? khachDaKy : false,
          nguoiThucHien: nguoiDung?.maNV || null,
        }),
      });

      const raw = await res.text();
      let json;
      try {
        json = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error(
          res.ok
            ? 'Phản hồi server không hợp lệ.'
            : 'Không kết nối được server (có thể server đang restart). Vui lòng thử lại sau vài giây.',
        );
      }

      if (!res.ok || !json.ok) {
        throw new Error(json.error || `Lỗi HTTP ${res.status}`);
      }

      if (choKy) {
          hienThongBao('success', `${json.data.message} (Mã HĐ: ${json.data.maHopDong})`);
          setHopDongDaKy({
            maHopDong: json.data.maHopDong,
            khachHang,
            thongTinThue: {
              ...thongTinThue,
              kyThanhToan,
              ngayKetThuc: tinhNgayKetThuc(thongTinThue?.ngayBatDau, thongTinThue?.thoiHanThue),
            },
            bieuPhiDichVu,
            chuKyKhach,
            ngayKy: new Date().toISOString().split('T')[0],
            kyThanhToan,
          });
        } else {
          hienThongBao('success', `Đã lưu bản nháp hợp đồng (Mã HĐ: ${json.data.maHopDong})`);
        }
    } catch (err) {
      console.error('Lỗi khi tạo hợp đồng:', err);
      hienThongBao('error', `Lỗi: ${err.message}`);
    } finally {
      setDangXuLy(false);
    }
  };

  return (
    <div className="contract-page">

      <div className="contract-header">
        <h1 className="page-title" style={{ margin: 0 }}>Lập hợp đồng thuê</h1>
        <p className="page-subtitle" style={{ margin: '4px 0 0 0' }}>
          Đối chiếu thông tin thuê, thiết lập biểu phí dịch vụ và điều khoản trước khi ký hợp đồng điện tử.
        </p>
      </div>

      {dangTai ? (
        <div className="stay-check-loading">Đang tải dữ liệu hồ sơ hợp đồng...</div>
      ) : (
        <div className="contract-grid">

          {/* CỘT TRÁI: FORM */}
          <div className="contract-left">
            {/* Section 1: Thông tin cơ bản */}
            <div className="stay-check-card">
              <div className="stay-check-card-head">
                <h2 className="stay-check-card-title">Thông tin cơ bản hợp đồng</h2>
              </div>

              <div className="contract-info-grid">
                <div className="stay-check-info-block">
                  <span className="stay-check-label">Tên khách hàng</span>
                  <span className="stay-check-value-sm">{khachHang?.hoTen || '—'}</span>
                </div>
                <div className="stay-check-info-block">
                  <span className="stay-check-label">CCCD</span>
                  <span className="stay-check-value-sm">{khachHang?.cccd || '—'}</span>
                </div>
                <div className="stay-check-info-block">
                  <span className="stay-check-label">Loại thuê</span>
                  <span className="stay-check-value-sm">
                    {thongTinThue?.loaiThueLabel || (thongTinThue?.loaiThue === 'Thuê nguyên phòng' ? 'Thuê nguyên phòng' : 'Thuê theo giường') || '—'}
                  </span>
                </div>
                <div className="stay-check-info-block">
                  <span className="stay-check-label">Phòng / Giường</span>
                  <span className="stay-check-value-sm">{thongTinThue?.phongGiuong || '—'}</span>
                </div>
                <div className="stay-check-info-block">
                  <span className="stay-check-label">Ngày bắt đầu</span>
                  <span className="stay-check-value-sm">{thongTinThue?.ngayBatDau || '—'}</span>
                </div>
                <div className="stay-check-info-block">
                  <span className="stay-check-label">Thời hạn thuê</span>
                  <span className="stay-check-value-sm">{thongTinThue?.thoiHanThue || 0} Tháng</span>
                </div>
                <div className="stay-check-info-block">
                  <span className="stay-check-label">Ngày kết thúc</span>
                  <span className="stay-check-value-sm">
                    {tinhNgayKetThuc(thongTinThue?.ngayBatDau, thongTinThue?.thoiHanThue)}
                  </span>
                </div>
                <div className="stay-check-info-block">
                  <span className="stay-check-label">Chi nhánh</span>
                  <span className="stay-check-value-sm">{thongTinThue?.chiNhanh || '—'}</span>
                </div>
                <div className="stay-check-info-block">
                  <span className="stay-check-label">Số tiền cọc</span>
                  <span className="stay-check-amount">
                    {Number(thongTinThue?.soTienCoc ?? thongTinThue?.soTienDaCoc ?? 0).toLocaleString('vi-VN')} VND
                  </span>
                </div>
                <div className="stay-check-info-block">
                  <span className="stay-check-label">Ngày đặt cọc</span>
                  <span className="stay-check-value-sm">{thongTinThue?.ngayDatCoc || '—'}</span>
                </div>
                <div className="stay-check-info-block">
                  <span className="stay-check-label">Số giường thuê</span>
                  <span className="stay-check-value-sm">{String(thongTinThue?.soGiuong || 0).padStart(2, '0')}</span>
                </div>
                <div className="stay-check-info-block">
                  <span className="stay-check-label">Giá thuê cơ bản</span>
                  <span className="stay-check-room">
                    {Number(thongTinThue?.giaThueCoBan || 0).toLocaleString('vi-VN')} VNĐ / tháng
                  </span>
                </div>
                <div className="stay-check-info-block contract-info-full">
                  <span className="stay-check-label">Kỳ thanh toán</span>
                  <select
                    className="contract-select"
                    value={kyThanhToan}
                    onChange={(e) => setKyThanhToan(e.target.value)}
                  >
                    <option value="Thanh toán hàng tháng">Thanh toán hàng tháng</option>
                    <option value="Thanh toán 3 tháng / kỳ">Thanh toán 3 tháng / kỳ</option>
                    <option value="Thanh toán 6 tháng / kỳ">Thanh toán 6 tháng / kỳ</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Biểu phí dịch vụ */}
            <div className="stay-check-card">
              <div className="stay-check-card-head">
                <h2 className="stay-check-card-title">Biểu phí dịch vụ định kỳ</h2>
              </div>

              <div className="contract-fees-grid">
                {bieuPhiDichVu.map((phi) => (
                  <div key={phi.id} className="contract-fee-card">
                    <div className="contract-fee-head">
                      <span className="contract-fee-name">{phi.ten}</span>
                    </div>
                    <div className="contract-fee-body">
                      <input
                        type="text"
                        className="contract-fee-input"
                        value={Number(phi.gia).toLocaleString('vi-VN')}
                        onChange={(e) => capNhatGiaPhi(phi.id, e.target.value)}
                      />
                      <span className="contract-fee-unit">{phi.donVi}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: QUY ĐỊNH & HÀNH ĐỘNG */}
          <div className="contract-right">
            <div className="contract-rule-card">
              <div className="contract-rule-head">
                Quy định hoàn/khấu trừ tiền cọc áp dụng bắt buộc hiển thị trên văn bản hợp đồng:
              </div>
              <div className="contract-rule-list">
                {QUY_DINH_HOAN_COC.map((item, idx) => (
                  <div key={idx} className="contract-rule-row">
                    <span className="contract-rule-label">{item.moTa}</span>
                    <span className="contract-rule-value">{item.mucHoan}</span>
                  </div>
                ))}
              </div>
              <p className="contract-rule-note">
                * Bảng tóm tắt này sẽ được tự động chèn vào mục Phụ lục của hợp đồng điện tử.
              </p>
            </div>

            <div className="stay-check-card">
              <div className="stay-check-card-head">
                <h2 className="stay-check-card-title" style={{ fontSize: '15px' }}>Điều khoản & quy định áp dụng</h2>
              </div>
              <div className="contract-rule-list" style={{ marginBottom: '14px' }}>
                <span className="stay-check-label" style={{ display: 'block', marginBottom: '10px' }}>
                  Nội quy ký túc xá (mặc định, luôn áp dụng)
                </span>
                {NOI_QUY_MAC_DINH.map((noiQuy, idx) => (
                  <label
                    key={idx}
                    className="contract-rule-row"
                    style={{ cursor: 'default', gap: '10px', justifyContent: 'flex-start' }}
                  >
                    <input
                      type="checkbox"
                      className="stay-check-checkbox"
                      checked
                      readOnly
                      disabled
                      style={{ cursor: 'default', flexShrink: 0 }}
                    />
                    <span className="contract-rule-label">{noiQuy}</span>
                  </label>
                ))}
              </div>
              <div className="contract-rule-list">
                <span className="stay-check-label" style={{ display: 'block', marginBottom: '10px' }}>
                  Điều khoản xử lý vi phạm
                </span>
                {DIEU_KHOAN_VI_PHAM.map((dieuKhoan, idx) => (
                  <div
                    key={idx}
                    className="contract-rule-row"
                    style={{ justifyContent: 'flex-start', gap: '10px' }}
                  >
                    <span className="contract-rule-label">{idx + 1}. {dieuKhoan}</span>
                  </div>
                ))}
              </div>
              <p className="contract-rule-note" style={{ marginTop: '12px' }}>
                * Toàn bộ nội quy và điều khoản trên sẽ được tự động ghi vào hợp đồng điện tử khi ký.
              </p>
            </div>

            <div className="stay-check-card">
              <div className="stay-check-card-head">
                <h2 className="stay-check-card-title" style={{ fontSize: '15px' }}>Chữ ký xác nhận của khách hàng</h2>
              </div>
              <div className="np-sign-head">
                <span className="stay-check-label">Người thuê: {khachHang?.hoTen || '—'}</span>
                <button
                  type="button"
                  className="np-sign-clear np-tooltip-wrap"
                  data-tip="Xóa chữ ký hiện tại để khách ký lại từ đầu."
                  onClick={xoaChuKy}
                >
                  Xóa chữ ký
                </button>
              </div>
              <div className="np-sign-box">
                <SignatureCanvas
                  ref={sigPadKhach}
                  penColor="#1d4ed8"
                  onEnd={() => setKhachDaKy(true)}
                  canvasProps={{ className: 'np-sign-canvas', style: { width: '100%', height: '140px' } }}
                />
                {!khachDaKy && <span className="np-sign-placeholder">Khách hàng ký tên tại đây</span>}
              </div>
              <p className="np-sign-note">
                Bằng việc ký tên, khách hàng xác nhận đã đọc và đồng ý toàn bộ nội dung hợp đồng, biểu phí dịch vụ, nội quy và điều khoản xử lý vi phạm.
              </p>
            </div>

            <div className="contract-actions">
              <div
                className="np-tooltip-wrap contract-action-tip"
                data-tip={
                  khachDaKy
                    ? 'Lưu hợp đồng đã ký, chuyển hồ sơ sang kế toán thu tiền kỳ đầu. Có thể in / lưu PDF ngay sau khi thành công.'
                    : 'Yêu cầu khách ký xác nhận trên ô chữ ký trước khi hoàn tất lập hợp đồng.'
                }
              >
                <button
                  type="button"
                  className="btn-book-filled"
                  disabled={dangXuLy || !khachDaKy}
                  onClick={() => taoHopDong(true)}
                >
                  {dangXuLy ? 'Đang xử lý...' : 'Xác nhận ký hợp đồng'}
                </button>
              </div>
              <div
                className="np-tooltip-wrap contract-action-tip"
                data-tip="Lưu tạm nội dung hợp đồng (trạng thái Nháp). Chưa chuyển kế toán, chưa cập nhật trạng thái phiếu cọc."
              >
                <button
                  type="button"
                  className="btn-detail-outline"
                  disabled={dangXuLy}
                  onClick={() => taoHopDong(false)}
                >
                  Lưu bản nháp
                </button>
              </div>
              <div
                className="np-tooltip-wrap contract-action-tip"
                data-tip="Quay về danh sách hồ sơ chờ lập hợp đồng. Dữ liệu chưa lưu sẽ mất."
              >
                <button
                  type="button"
                  className="btn-detail-outline"
                  onClick={onQuayLai}
                >
                  Quay lại
                </button>
              </div>
            </div>
          </div>

        </div>
      )}

      {hopDongDaKy && (
        <ContractPrintModal
          data={hopDongDaKy}
          onDong={() => {
            setHopDongDaKy(null);
            onXacNhanThanhCong?.(hopDongDaKy);
          }}
        />
      )}

    </div>
  );
}
