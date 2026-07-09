import { useState, useEffect } from 'react';

const QUY_DINH_HOAN_COC = [
  { moTa: 'Đã đặt cọc, chưa ký HĐ', mucHoan: '80%' },
  { moTa: 'Đã ký HĐ, lưu trú < 6 tháng', mucHoan: '50%' },
  { moTa: 'Đã ký HĐ, lưu trú > 6 tháng', mucHoan: '70%' },
  { moTa: 'Hết hạn hợp đồng', mucHoan: '100%' }
];

const NOI_QUY_MAC_DINH = [
  'Tuân thủ giờ giấc sinh hoạt chung (không gây ồn ào sau 22:00)',
  'Giữ gìn vệ sinh khu vực chung và phòng ở',
  'Không hút thuốc trong khuôn viên ký túc xá',
  'Không nuôi thú cưng trong phòng',
  'Bảo quản tài sản, chìa khóa và thẻ từ được cấp',
  'Không tự ý sửa chữa, thay đổi cấu trúc phòng'
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
export default function ContractDrafting({ maHoSo = 'DEP-2023-8942', hienThongBao, onQuayLai, onXacNhanThanhCong }) {
  const [khachHang, setKhachHang] = useState(null);
  const [thongTinThue, setThongTinThue] = useState(null);
  const [bieuPhiDichVu, setBieuPhiDichVu] = useState([]);
  const [kyThanhToan, setKyThanhToan] = useState('MONTHLY');
  const [dieuKhoanBoSung, setDieuKhoanBoSung] = useState('');
  const [dangTai, setDangTai] = useState(false);
  const [dangXuLy, setDangXuLy] = useState(false);

  const iconPhi = {
    elec: '⚡',
    water: '💧',
    wifi: '📶',
    parking: '🅿️'
  };

  const taiDuLieuLapHopDong = async (maHoSoCanTai = maHoSo) => {
    setDangTai(true);
    try {
      const res = await fetch(`/api/hop-dong/pre-fill/${encodeURIComponent(maHoSoCanTai)}`);
      const json = await res.json();
      if (json.ok) {
        setKhachHang(json.data.khachHang);
        setThongTinThue(json.data.thongTinThue);
        setBieuPhiDichVu(json.data.bieuPhiDichVu || []);
        setKyThanhToan(json.data.thongTinThue?.kyThanhToan || 'MONTHLY');
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
    taiDuLieuLapHopDong();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maHoSo]);

  const capNhatGiaPhi = (id, giaMoi) => {
    setBieuPhiDichVu(prev => prev.map(phi =>
      phi.id === id ? { ...phi, gia: Number(String(giaMoi).replace(/\D/g, '')) || 0 } : phi
    ));
  };

  const taoHopDong = async (choKy = true) => {
    if (!khachHang || !thongTinThue) {
      hienThongBao('error', 'Chưa có dữ liệu hợp đồng để lưu!');
      return;
    }
    setDangXuLy(true);
    try {
      const res = await fetch('/api/hop-dong/tao-moi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          khachHang,
          thongTinThue: { ...thongTinThue, kyThanhToan },
          bieuPhiDichVu,
          dieuKhoanBoSung
        })
      });
      const json = await res.json();
      if (json.ok) {
        hienThongBao('success', choKy
          ? `${json.data.message} (Mã HĐ: ${json.data.maHopDong})`
          : `Đã lưu bản nháp hợp đồng (Mã HĐ: ${json.data.maHopDong})`);
        if (choKy && onXacNhanThanhCong) {
          onXacNhanThanhCong(json.data);
        }
      } else {
        throw new Error(json.error || 'Lỗi hệ thống');
      }
    } catch (err) {
      console.error('Lỗi khi tạo hợp đồng:', err);
      hienThongBao('error', `Lỗi: ${err.message}`);
    } finally {
      setDangXuLy(false);
    }
  };

  const buocLap = [
    { id: 1, ten: 'Thông tin khách' },
    { id: 2, ten: 'Lập hợp đồng' },
    { id: 3, ten: 'Hoàn tất' }
  ];
  const buocHienTai = 2;

  return (
    <div className="contract-page">

      <div className="contract-header">
        <h1 className="page-title" style={{ margin: 0 }}>Lập hợp đồng thuê</h1>
        <p className="page-subtitle" style={{ margin: '4px 0 0 0' }}>
          Đối chiếu thông tin thuê, thiết lập biểu phí dịch vụ và điều khoản trước khi ký hợp đồng điện tử.
        </p>
      </div>

      {/* Thanh tiến trình các bước */}
      <div className="contract-steps">
        {buocLap.map((buoc) => (
          <div key={buoc.id} className={`contract-step ${buocHienTai >= buoc.id ? 'active' : ''} ${buocHienTai > buoc.id ? 'completed' : ''}`}>
            <span className="contract-step-num">{buocHienTai > buoc.id ? 'V' : buoc.id}</span>
            <span className="contract-step-name">{buoc.ten}</span>
          </div>
        ))}
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
                  <span className="stay-check-label">Số giường</span>
                  <span className="stay-check-value-sm">{String(thongTinThue?.soGiuong || 0).padStart(2, '0')}</span>
                </div>
                <div className="stay-check-info-block">
                  <span className="stay-check-label">Giá thuê cơ bản</span>
                  <span className="stay-check-room">{Number(thongTinThue?.giaThueCoBan || 0).toLocaleString('vi-VN')} VNĐ / tháng</span>
                </div>
                <div className="stay-check-info-block contract-info-full">
                  <span className="stay-check-label">Kỳ thanh toán</span>
                  <select
                    className="contract-select"
                    value={kyThanhToan}
                    onChange={(e) => setKyThanhToan(e.target.value)}
                  >
                    <option value="MONTHLY">Thanh toán hàng tháng</option>
                    <option value="QUARTERLY">Thanh toán 3 tháng / kỳ</option>
                    <option value="BIANNUAL">Thanh toán 6 tháng / kỳ</option>
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
                <h2 className="stay-check-card-title" style={{ fontSize: '15px' }}>Điều khoản & quy định bổ sung</h2>
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
              <textarea
                className="contract-terms-textarea"
                placeholder="Nhập các quy định riêng, mức phạt vi phạm nội quy phòng hoặc các thỏa thuận đặc biệt khác giữa hai bên..."
                value={dieuKhoanBoSung}
                onChange={(e) => setDieuKhoanBoSung(e.target.value)}
              ></textarea>
            </div>

            <div className="contract-actions">
              <button
                type="button"
                className="btn-book-filled"
                disabled={dangXuLy}
                onClick={() => taoHopDong(true)}
              >
                {dangXuLy ? 'Đang xử lý...' : 'Xác nhận ký hợp đồng'}
              </button>
              <button
                type="button"
                className="btn-detail-outline"
                disabled={dangXuLy}
                onClick={() => taoHopDong(false)}
              >
                Lưu bản nháp
              </button>
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
      )}

    </div>
  );
}
