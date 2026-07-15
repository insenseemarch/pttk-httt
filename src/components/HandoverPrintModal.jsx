import { useRef } from 'react';

function dinhDangNgayVN(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    const p = String(iso).split('T')[0].split('-');
    return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : iso;
  }
  return d.toLocaleDateString('vi-VN');
}

export function buildHandoverPrintHtml(data) {
  const {
    maBienBan,
    maHopDong,
    ngayBanGiao,
    thoiDiemKy,
    khachHang = {},
    hopDong = {},
    phong = {},
    thuTienKyDau,
    ketQuaTaiSan = [],
    chuKyQuanLy,
    chuKyKhach,
    tenQuanLy,
  } = data;

  const assetRows = ketQuaTaiSan.map((item) =>
    `<tr>
      <td>${item.ten || '—'}</td>
      <td style="text-align:center">${item.daKiem ? '✓' : '—'}</td>
      <td>${item.ghiChu || '—'}</td>
    </tr>`,
  ).join('');

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8"/>
  <title>Biên bản bàn giao BB-${maBienBan}</title>
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
    .sign-row { display: flex; justify-content: space-between; margin-top: 36px; gap: 24px; }
    .sign-box { flex: 1; text-align: center; }
    .sign-box img { max-width: 180px; max-height: 80px; margin: 8px auto; display: block; }
    .sign-line { border-top: 1px solid #333; margin-top: 48px; padding-top: 6px; font-size: 12px; }
    @media print { body { margin: 12mm; } }
  </style>
</head>
<body>
  <h1>Biên bản bàn giao phòng / giường và tài sản</h1>
  <p class="sub-title">HomeStay Dorm — Ký túc xá tư nhân</p>
  <p class="meta">
    Mã biên bản: <strong>BB-${maBienBan}</strong><br/>
    Mã hợp đồng: <strong>HĐ-${String(maHopDong).padStart(4, '0')}</strong><br/>
    Ngày bàn giao: <strong>${dinhDangNgayVN(ngayBanGiao || thoiDiemKy)}</strong>
  </p>

  <h2>I. Thông tin khách hàng</h2>
  <table>
    <tr><th style="width:32%">Họ và tên</th><td>${khachHang.hoTen || '—'}</td></tr>
    <tr><th>CCCD</th><td>${khachHang.cccd || '—'}</td></tr>
    <tr><th>Số điện thoại</th><td>${khachHang.sdt || '—'}</td></tr>
    <tr><th>Email</th><td>${khachHang.email || '—'}</td></tr>
    <tr><th>Địa chỉ</th><td>${khachHang.diaChi || '—'}</td></tr>
    <tr><th>Giới tính</th><td>${khachHang.gioiTinh || '—'}</td></tr>
  </table>

  <h2>II. Thông tin thuê & phòng</h2>
  <table>
    <tr><th style="width:32%">Loại thuê</th><td>${hopDong.loaiThue || '—'}</td></tr>
    <tr><th>Phòng / Giường</th><td>${phong.phongGiuong || '—'}</td></tr>
    <tr><th>Chi nhánh</th><td>${phong.chiNhanh || '—'}</td></tr>
    <tr><th>Số giường thuê</th><td>${hopDong.soGiuong ?? '—'}</td></tr>
    <tr><th>Giá thuê</th><td>${hopDong.giaThueFmt || '—'}</td></tr>
    <tr><th>Kỳ thanh toán</th><td>${hopDong.kyThanhToan || '—'}</td></tr>
    <tr><th>Ngày bắt đầu</th><td>${hopDong.ngayBatDau || '—'}</td></tr>
    <tr><th>Ngày kết thúc</th><td>${hopDong.ngayKetThuc || '—'}</td></tr>
    <tr><th>Thời hạn</th><td>${hopDong.thoiHanThue || '—'}</td></tr>
    ${thuTienKyDau ? `<tr><th>Phiếu thu kỳ đầu</th><td>${thuTienKyDau.maPhieuThu} — ${thuTienKyDau.soTienFmt} (${thuTienKyDau.ngayThanhToan})</td></tr>` : ''}
  </table>

  <h2>III. Danh mục tài sản bàn giao</h2>
  <table>
    <thead><tr><th>Hạng mục</th><th style="width:60px">Đã kiểm</th><th>Ghi chú / tình trạng</th></tr></thead>
    <tbody>${assetRows}</tbody>
  </table>

  <p style="font-size:12px;margin-top:16px">
    Hai bên xác nhận đã kiểm tra hiện trạng khu vực ở, ghi nhận tài sản được cấp,
    được hướng dẫn quy định sử dụng tiện ích chung và các lưu ý an toàn.
    Khách hàng chính thức bắt đầu thời gian cư trú kể từ thời điểm ký biên bản này.
  </p>

  <div class="sign-row">
    <div class="sign-box">
      <strong>ĐẠI DIỆN QUẢN LÝ</strong>
      ${chuKyQuanLy ? `<img src="${chuKyQuanLy}" alt="Chữ ký quản lý"/>` : '<div style="height:80px"></div>'}
      <div class="sign-line">${tenQuanLy || 'Quản lý chi nhánh'}</div>
    </div>
    <div class="sign-box">
      <strong>KHÁCH HÀNG</strong>
      ${chuKyKhach ? `<img src="${chuKyKhach}" alt="Chữ ký khách"/>` : '<div style="height:80px"></div>'}
      <div class="sign-line">${khachHang.hoTen || 'Khách hàng'}</div>
    </div>
  </div>
</body>
</html>`;
}

export default function HandoverPrintModal({ data, onDong }) {
  const previewRef = useRef(null);

  const moInPdf = () => {
    const html = buildHandoverPrintHtml(data);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank', 'width=900,height=700');
    if (!win) {
      URL.revokeObjectURL(url);
      alert('Trình duyệt chặn pop-up. Vui lòng cho phép pop-up để in / lưu PDF.');
      return;
    }
    const goPrint = () => {
      try {
        win.focus();
        win.print();
      } catch {
        // tab closed
      }
    };
    win.addEventListener('load', () => {
      setTimeout(goPrint, 400);
      URL.revokeObjectURL(url);
    });
    setTimeout(() => {
      goPrint();
      URL.revokeObjectURL(url);
    }, 1200);
  };

  const { maBienBan, maHopDong, khachHang, phong, ketQuaTaiSan = [] } = data;

  return (
    <div className="hd-print-backdrop" role="dialog" aria-modal="true">
      <div className="hd-print-modal">
        <div className="hd-print-modal__head">
          <div>
            <h2>Bàn giao phòng thành công</h2>
            <p>
              Mã BB-{maBienBan} / HĐ-{String(maHopDong).padStart(4, '0')} —
              In hoặc lưu biên bản PDF trước khi quay lại danh sách.
            </p>
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
          Chọn <strong>Microsoft Print to PDF</strong> hoặc <strong>Save as PDF</strong> trong hộp thoại in.
        </p>

        <div className="hd-print-preview" ref={previewRef}>
          <div className="hd-print-doc">
            <h1>BIÊN BẢN BÀN GIAO PHÒNG</h1>
            <p className="hd-print-doc__sub">
              BB-{maBienBan} — {khachHang?.hoTen} — {phong?.phongGiuong}
            </p>
            <section>
              <h3>Danh mục tài sản ({ketQuaTaiSan.length} mục)</h3>
              <ul className="hd-print-doc__list">
                {ketQuaTaiSan.map((item) => (
                  <li key={item.id}>
                    {item.ten}: {item.ghiChu || 'Đạt yêu cầu'}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
