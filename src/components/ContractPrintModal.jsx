import { useRef } from 'react';

const KY_THANH_TOAN_LABEL = {
  MONTHLY: 'Thanh toán hàng tháng',
  QUARTERLY: 'Thanh toán 3 tháng / kỳ',
  BIANNUAL: 'Thanh toán 6 tháng / kỳ',
};

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

function dinhDangNgayVN(iso) {
  if (!iso) return '—';
  const [y, m, d] = String(iso).split('T')[0].split('-');
  return d && m && y ? `${d}/${m}/${y}` : iso;
}

function buildPrintHtml(data) {
  const { maHopDong, khachHang, thongTinThue, bieuPhiDichVu, chuKyKhach, ngayKy, kyThanhToan } = data;
  const loaiThue = thongTinThue?.loaiThueLabel
    || (thongTinThue?.loaiThue === 'Thuê nguyên phòng' ? 'Thuê nguyên phòng' : 'Thuê theo giường');
  const phiRows = (bieuPhiDichVu || []).map((p) =>
    `<tr><td>${p.ten}</td><td>${Number(p.gia).toLocaleString('vi-VN')} VNĐ</td><td>${p.donVi}</td></tr>`,
  ).join('');
  const hoanRows = QUY_DINH_HOAN_COC.map((r) =>
    `<tr><td>${r.moTa}</td><td style="text-align:center;font-weight:600">${r.mucHoan}</td></tr>`,
  ).join('');
  const noiQuyList = NOI_QUY_MAC_DINH.map((n, i) => `<li>${i + 1}. ${n}</li>`).join('');
  const viPhamList = DIEU_KHOAN_VI_PHAM.map((v, i) => `<li>${i + 1}. ${v}</li>`).join('');

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8"/>
  <title>Hợp đồng thuê HĐ-${maHopDong}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Times New Roman', Times, serif; font-size: 13px; color: #111; margin: 24px 32px; line-height: 1.5; }
    h1 { text-align: center; font-size: 18px; margin: 0 0 4px; text-transform: uppercase; }
    .sub-title { text-align: center; font-size: 13px; margin-bottom: 20px; }
    .meta { text-align: right; margin-bottom: 16px; font-size: 12px; }
    h2 { font-size: 14px; margin: 18px 0 8px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 8px 0 12px; font-size: 12px; }
    th, td { border: 1px solid #bbb; padding: 6px 8px; vertical-align: top; }
    th { background: #f5f5f5; text-align: left; }
    ul { margin: 6px 0; padding-left: 20px; }
    .sign-row { display: flex; justify-content: space-between; margin-top: 36px; gap: 24px; }
    .sign-box { flex: 1; text-align: center; }
    .sign-box img { max-width: 180px; max-height: 80px; margin: 8px auto; display: block; }
    .sign-line { border-top: 1px solid #333; margin-top: 48px; padding-top: 6px; font-size: 12px; }
    @media print { body { margin: 12mm; } }
  </style>
</head>
<body>
  <h1>Hợp đồng thuê lưu trú</h1>
  <p class="sub-title">HomeStay Dorm — Ký túc xá tư nhân</p>
  <p class="meta">Mã hợp đồng: <strong>HĐ-${maHopDong}</strong><br/>Ngày ký: <strong>${dinhDangNgayVN(ngayKy)}</strong></p>

  <h2>I. Thông tin bên thuê</h2>
  <table>
    <tr><th style="width:32%">Họ và tên</th><td>${khachHang?.hoTen || '—'}</td></tr>
    <tr><th>CCCD</th><td>${khachHang?.cccd || '—'}</td></tr>
    <tr><th>Số điện thoại</th><td>${khachHang?.sdt || '—'}</td></tr>
    <tr><th>Địa chỉ</th><td>${khachHang?.diaChi || '—'}</td></tr>
  </table>

  <h2>II. Thông tin thuê</h2>
  <table>
    <tr><th style="width:32%">Loại thuê</th><td>${loaiThue}</td></tr>
    <tr><th>Phòng / Giường</th><td>${thongTinThue?.phongGiuong || '—'}</td></tr>
    <tr><th>Chi nhánh</th><td>${thongTinThue?.chiNhanh || '—'}</td></tr>
    <tr><th>Số giường thuê</th><td>${thongTinThue?.soGiuong ?? '—'}</td></tr>
    <tr><th>Giá thuê cơ bản</th><td>${Number(thongTinThue?.giaThueCoBan || 0).toLocaleString('vi-VN')} VNĐ / tháng</td></tr>
    <tr><th>Kỳ thanh toán</th><td>${KY_THANH_TOAN_LABEL[kyThanhToan] || kyThanhToan}</td></tr>
    <tr><th>Ngày bắt đầu</th><td>${dinhDangNgayVN(thongTinThue?.ngayBatDau)}</td></tr>
    <tr><th>Ngày kết thúc</th><td>${dinhDangNgayVN(thongTinThue?.ngayKetThuc)}</td></tr>
    <tr><th>Thời hạn</th><td>${thongTinThue?.thoiHanThue || '—'} tháng</td></tr>
    <tr><th>Tiền cọc</th><td>${Number(thongTinThue?.soTienCoc || 0).toLocaleString('vi-VN')} VNĐ</td></tr>
  </table>

  <h2>III. Biểu phí dịch vụ định kỳ</h2>
  <table>
    <thead><tr><th>Khoản phí</th><th>Đơn giá</th><th>Đơn vị</th></tr></thead>
    <tbody>${phiRows}</tbody>
  </table>

  <h2>IV. Quy định hoàn / khấu trừ tiền cọc</h2>
  <table>
    <thead><tr><th>Trường hợp</th><th style="width:80px">Mức hoàn</th></tr></thead>
    <tbody>${hoanRows}</tbody>
  </table>

  <h2>V. Nội quy ký túc xá</h2>
  <ul>${noiQuyList}</ul>

  <h2>VI. Điều khoản xử lý vi phạm</h2>
  <ul>${viPhamList}</ul>

  <div class="sign-row">
    <div class="sign-box">
      <strong>BÊN CHO THUÊ</strong>
      <p>(HomeStay Dorm)</p>
      <div class="sign-line">Đại diện quản lý</div>
    </div>
    <div class="sign-box">
      <strong>BÊN THUÊ</strong>
      ${chuKyKhach ? `<img src="${chuKyKhach}" alt="Chữ ký khách"/>` : '<div style="height:80px"></div>'}
      <div class="sign-line">${khachHang?.hoTen || 'Người thuê'}</div>
    </div>
  </div>
</body>
</html>`;
}

export default function ContractPrintModal({ data, onDong }) {
  const previewRef = useRef(null);

  const moInPdf = () => {
    const html = buildPrintHtml(data);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank', 'width=900,height=700');
    if (!win) {
      URL.revokeObjectURL(url);
      alert('Trình duyệt chặn cửa sổ pop-up. Vui lòng cho phép pop-up để in / lưu PDF.');
      return;
    }

    const goPrint = () => {
      try {
        win.focus();
        win.print();
      } catch {
        // Bỏ qua nếu tab đã đóng
      }
    };

    win.addEventListener('load', () => {
      setTimeout(goPrint, 400);
      URL.revokeObjectURL(url);
    });

    // Fallback nếu sự kiện load không bắt được (một số trình duyệt)
    setTimeout(() => {
      goPrint();
      URL.revokeObjectURL(url);
    }, 1200);
  };

  const { maHopDong, khachHang, thongTinThue, bieuPhiDichVu, chuKyKhach, ngayKy, kyThanhToan } = data;
  const loaiThue = thongTinThue?.loaiThueLabel
    || (thongTinThue?.loaiThue === 'Thuê nguyên phòng' ? 'Thuê nguyên phòng' : 'Thuê theo giường');

  return (
    <div className="hd-print-backdrop" role="dialog" aria-modal="true">
      <div className="hd-print-modal">
        <div className="hd-print-modal__head">
          <div>
            <h2>Ký hợp đồng thành công</h2>
            <p>Mã HĐ-{maHopDong} — Bạn có thể in hoặc lưu bản PDF trước khi quay lại danh sách.</p>
          </div>
          <button type="button" className="hd-print-modal__close" onClick={onDong} aria-label="Đóng">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="hd-print-modal__actions">
          <button type="button" className="btn-book-filled" onClick={moInPdf}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, verticalAlign: 'middle' }}>picture_as_pdf</span>
            {' '}In / Lưu PDF
          </button>
          <button type="button" className="btn-detail-outline" onClick={onDong}>
            Quay lại danh sách
          </button>
        </div>
        <p className="hd-print-modal__hint">
          Chọn máy in <strong>Microsoft Print to PDF</strong> hoặc <strong>Save as PDF</strong> trong hộp thoại in để tải file PDF.
        </p>

        <div className="hd-print-preview" ref={previewRef}>
          <div className="hd-print-doc">
            <h1>HỢP ĐỒNG THUÊ LƯU TRÚ</h1>
            <p className="hd-print-doc__sub">HomeStay Dorm — Mã HĐ-{maHopDong} — Ngày ký: {dinhDangNgayVN(ngayKy)}</p>

            <section>
              <h3>I. Thông tin bên thuê</h3>
              <p><strong>Họ tên:</strong> {khachHang?.hoTen} &nbsp;|&nbsp; <strong>CCCD:</strong> {khachHang?.cccd}</p>
            </section>

            <section>
              <h3>II. Thông tin thuê</h3>
              <p>
                {loaiThue} — {thongTinThue?.phongGiuong} — {thongTinThue?.soGiuong} giường
                <br />
                Giá: {Number(thongTinThue?.giaThueCoBan || 0).toLocaleString('vi-VN')} VNĐ/tháng
                &nbsp;|&nbsp; {KY_THANH_TOAN_LABEL[kyThanhToan] || kyThanhToan}
              </p>
            </section>

            <section>
              <h3>III. Biểu phí dịch vụ</h3>
              <ul className="hd-print-doc__list">
                {(bieuPhiDichVu || []).map((p) => (
                  <li key={p.id}>{p.ten}: {Number(p.gia).toLocaleString('vi-VN')} ({p.donVi})</li>
                ))}
              </ul>
            </section>

            <section>
              <h3>IV. Quy định hoàn cọc & nội quy</h3>
              <p className="hd-print-doc__muted">Xem đầy đủ trong bản in PDF.</p>
            </section>

            {chuKyKhach && (
              <section className="hd-print-doc__sign">
                <p><strong>Chữ ký khách hàng:</strong></p>
                <img src={chuKyKhach} alt="Chữ ký" />
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
