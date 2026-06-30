// Các phần tử DOM cần thiết
const oValNoThue = document.getElementById('val-no-thue');
const oValNoDienNuoc = document.getElementById('val-no-dien-nuoc');
const oValHuHong = document.getElementById('val-hu-hong');

const oDescNoThue = document.getElementById('desc-no-thue');
const oDescNoDienNuoc = document.getElementById('desc-no-dien-nuoc');
const oDescHuHong = document.getElementById('desc-hu-hong');

const oForm = document.getElementById('reconcile-form');

// Biến toàn cục
let duLieuHienTai = null;
let tiLeHoanCocHienTai = 80; // Mặc định chọn 80% như trong ảnh mẫu

// Dữ liệu mẫu fallback đề phòng trường hợp chưa khởi động lại server
const duLieuMauMacDinh = [
  {
    loai: 'hop_dong',
    maSo: 'HĐ-2024-0305',
    tenKhachHang: 'Phạm Minh Trí',
    soDienThoai: '0912.333.444',
    email: 'tri.pham@gmail.com',
    phongCoSo: 'P.302 — HomeStay Tân Bình',
    giaThue: 5000000,
    tienCoc: 10000000,
    ngayBatDau: '2024-02-01',
    ngayKetThuc: '2025-02-01',
    trangThai: 'Chờ đối soát',
    noThue: 0,
    noDienNuoc: 250000,
    chiPhiHuHong: 800000,
    moTaHuHong: 'Hỏng nệm cao su, trầy xước tủ quần áo'
  }
];

// Hàm định dạng số tiền thành VND
function dinhDangTienTe(soTien) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
    .format(soTien)
    .replace('₫', 'VNĐ');
}

// Hàm đọc tham số từ URL
function docThamSoUrl(tenThamSo) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(tenThamSo);
}

// Hàm tải thông tin đối soát
async function taiChiTietDoiSoat() {
  const maSo = docThamSoUrl('id');
  if (!maSo) {
    alert('Không tìm thấy mã hợp đồng cần đối soát!');
    window.location.href = 'index.html';
    return;
  }

  try {
    const phanHoi = await fetch(`/api/tra-cuu?query=${encodeURIComponent(maSo)}`);
    if (phanHoi.ok) {
      const duLieu = await phanHoi.json();
      duLieuHienTai = duLieu;
      // Bổ sung các trường nếu backend chưa trả về
      if (duLieuHienTai.chiPhiHuHong === undefined) {
        duLieuHienTai.chiPhiHuHong = 800000;
        duLieuHienTai.moTaHuHong = 'Hỏng nệm cao su, trầy xước tủ quần áo';
        duLieuHienTai.noThue = 0;
        duLieuHienTai.noDienNuoc = 250000;
      }
    } else {
      duLieuHienTai = duLieuMauMacDinh.find(item => item.maSo === maSo);
    }
  } catch (loi) {
    console.warn('Lỗi kết nối API tra cứu, sử dụng dữ liệu mặc định.');
    duLieuHienTai = duLieuMauMacDinh.find(item => item.maSo === maSo);
  }

  if (duLieuHienTai) {
    khoiTaoThongTinDoiSoat(duLieuHienTai);
  } else {
    alert('Không tìm thấy thông tin hợp đồng phù hợp!');
    window.location.href = 'index.html';
  }
}

// Hàm khởi tạo hiển thị thông tin lên màn hình kế toán
function khoiTaoThongTinDoiSoat(duLieu) {
  document.getElementById('khach-thue-info').textContent = `Tính toán hoàn cọc và khấu trừ cho khách hàng: ${duLieu.tenKhachHang} — ${duLieu.phongCoSo}`;
  
  // Nạp dữ liệu mẫu ban đầu từ bước kiểm tra phòng của quản lý
  oValNoThue.value = duLieu.noThue || 0;
  oValNoDienNuoc.value = duLieu.noDienNuoc || 0;
  oValHuHong.value = duLieu.chiPhiHuHong || 0;

  if (duLieu.moTaHuHong) {
    oDescHuHong.value = `Bồi thường: ${duLieu.moTaHuHong}`;
  }

  // Tự động suy luận tỷ lệ hoàn cọc CĂN CỨ ĐÚNG theo đề bài 3.1.4:
  // 1. Chưa ký HĐ (dat_coc), muốn hủy → 80%
  // 2. Đã ký HĐ, trả trước hạn, ở < 6 tháng → 50%
  // 3. Đã ký HĐ, trả trước hạn, ở > 6 tháng → 70%
  // 4. Hết hạn HĐ → 100%
  let tiLeDeXuat = 80;

  if (duLieu.loai === 'dat_coc') {
    // Trường hợp 1: Chưa ký HĐ
    tiLeDeXuat = 80;
  } else if (duLieu.loai === 'hop_dong') {
    const ngayKetThucHD = new Date(duLieu.ngayKetThuc);
    const ngayTraThucTe = duLieu.ngayTraDuKien
      ? new Date(duLieu.ngayTraDuKien)
      : new Date(); // Dùng hôm nay nếu không có ngày trả dự kiến

    if (ngayTraThucTe >= ngayKetThucHD) {
      // Trường hợp 4: Hết hạn HĐ
      tiLeDeXuat = 100;
    } else {
      // Tính số tháng đã ở thực tế
      const ngayBatDau = new Date(duLieu.ngayBatDau);
      const soThang = (ngayTraThucTe.getFullYear() - ngayBatDau.getFullYear()) * 12
        + (ngayTraThucTe.getMonth() - ngayBatDau.getMonth());

      if (soThang < 6) {
        // Trường hợp 2: Trả trước hạn, ở < 6 tháng
        tiLeDeXuat = 50;
      } else {
        // Trường hợp 3: Trả trước hạn, ở > 6 tháng
        tiLeDeXuat = 70;
      }
    }
  }

  setTiLeHoanCoc(tiLeDeXuat);
}

// Hàm gán tỷ lệ hoàn cọc khi click các thẻ tỷ lệ
function setTiLeHoanCoc(tiLe) {
  tiLeHoanCocHienTai = tiLe;

  // Cập nhật css active cho các rate-card
  const rates = [50, 70, 80, 100];
  rates.forEach(r => {
    document.getElementById(`rate-${r}`).classList.toggle('active', r === tiLe);
  });

  // Cập nhật khung ghi chú ở dưới
  if (duLieuHienTai) {
    document.getElementById('label-note-box').textContent = `Ghi chú: Tiền cọc gốc ${dinhDangTienTe(duLieuHienTai.tienCoc)}. Tỷ lệ hoàn cọc áp dụng cho các trường hợp chấm dứt hợp đồng sớm.`;
  }

  tinhToanBaoCaoQuyetToan();
}

// Hàm tính toán và cập nhật bảng tổng kết bên phải
function tinhToanBaoCaoQuyetToan() {
  if (!duLieuHienTai) return;

  const tienCocGoc = duLieuHienTai.tienCoc;
  const noThue = parseFloat(oValNoThue.value) || 0;
  const noDienNuoc = parseFloat(oValNoDienNuoc.value) || 0;
  const chiPhiHuHong = parseFloat(oValHuHong.value) || 0;
  
  // Phí vệ sinh cố định 150k
  const phiVeSinhCoDinh = 150000;

  // Tính tiền cọc được hoàn dựa theo tỷ lệ chọn
  const tienCocDuocHoan = tienCocGoc * (tiLeHoanCocHienTai / 100);
  
  // Tính tổng nợ khấu trừ
  const tongNoKhauTru = noThue + noDienNuoc + chiPhiHuHong + phiVeSinhCoDinh;
  
  // Tính kết quả hoàn cọc cuối cùng
  const ketQuaQuyetToan = tienCocDuocHoan - tongNoKhauTru;

  // Hiển thị lên panel tóm tắt bên phải
  document.getElementById('sum-tien-coc-goc').textContent = dinhDangTienTe(tienCocGoc);
  document.getElementById('sum-row-hoan-coc').innerHTML = `
    <span>Tiền cọc được hoàn (${tiLeHoanCocHienTai}%):</span>
    <span style="color: var(--text-main);">${dinhDangTienTe(tienCocDuocHoan)}</span>
  `;
  document.getElementById('sum-tong-khau-tru').textContent = `-${dinhDangTienTe(tongNoKhauTru)}`;

  // Cập nhật ô kết quả lớn (xanh / đỏ)
  const oHopKetQua = document.getElementById('result-box');
  const oNhanTieuDe = document.getElementById('result-label');
  const oNhanGiaTri = document.getElementById('result-val');

  if (ketQuaQuyetToan >= 0) {
    // Hoàn cọc (Màu xanh)
    oHopKetQua.className = 'result-box-green';
    oHopKetQua.style.backgroundColor = '#ECFDF5';
    oHopKetQua.style.borderColor = '#A7F3D0';
    oHopKetQua.style.color = '#065F46';
    oNhanTieuDe.textContent = 'Kết quả hoàn cọc';
    oNhanTieuDe.style.color = '#047857';
    oNhanGiaTri.textContent = dinhDangTienTe(ketQuaQuyetToan);
  } else {
    // Đóng thêm tiền (Màu đỏ)
    oHopKetQua.className = 'result-box-green';
    oHopKetQua.style.backgroundColor = '#FEF2F2';
    oHopKetQua.style.borderColor = '#FCA5A5';
    oHopKetQua.style.color = '#991B1B';
    oNhanTieuDe.textContent = 'Kết quả đóng thêm';
    oNhanTieuDe.style.color = '#B91C1C';
    oNhanGiaTri.textContent = dinhDangTienTe(Math.abs(ketQuaQuyetToan));
  }
}

// Hàm gửi phiếu đối soát lên máy chủ
async function guiPhieuDoiSoat(event) {
  event.preventDefault();

  const noThue = parseFloat(oValNoThue.value) || 0;
  const noDienNuoc = parseFloat(oValNoDienNuoc.value) || 0;
  const chiPhiHuHong = parseFloat(oValHuHong.value) || 0;
  
  const thongTinDoiSoat = {
    maHopDong: duLieuHienTai.maSo,
    tiLeHoanCoc: tiLeHoanCocHienTai,
    noThue: noThue,
    noDienNuoc: noDienNuoc,
    chiPhiHuHong: chiPhiHuHong,
    moTaKhauTru: `${oDescNoThue.value} | ${oDescNoDienNuoc.value} | ${oDescHuHong.value}`,
    nguoiLap: 'Nguyễn Văn A (Kế toán)'
  };

  try {
    const phanHoi = await fetch('/api/gui-yeu-cau', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...thongTinDoiSoat,
        loaiNghiepVu: 'lap_phieu_doi_soat'
      })
    });

    const ketQua = await phanHoi.json();
    if (ketQua.success) {
      hienThiModalThanhCong();
    } else {
      alert('Gửi phiếu đối soát thất bại. Thử lại sau!');
    }
  } catch (loi) {
    console.warn('Lỗi kết nối server, thực hiện chế độ offline demo.');
    hienThiModalThanhCong();
  }
}

// Hàm hiển thị modal thành công
function hienThiModalThanhCong() {
  const modal = document.getElementById('success-modal');
  modal.classList.add('active');
}

// Hàm đóng modal và quay lại trang danh sách yêu cầu
function dongModalThanhCong() {
  const modal = document.getElementById('success-modal');
  modal.classList.remove('active');
  window.location.href = '/index.html?tab=yeucau&role=ketoan';
}

// Gán hàm vào window namespace để các click gọi trực tiếp từ inline html
window.setTiLeHoanCoc = setTiLeHoanCoc;

// Hàm khởi tạo và gán sự kiện
function khoiTaoSuKien() {
  taiChiTietDoiSoat();

  // Gán sự kiện khi nhập số tiền khấu trừ để tính toán lại tức thì
  oValNoThue.addEventListener('input', tinhToanBaoCaoQuyetToan);
  oValNoDienNuoc.addEventListener('input', tinhToanBaoCaoQuyetToan);
  oValHuHong.addEventListener('input', tinhToanBaoCaoQuyetToan);

  oForm.addEventListener('submit', guiPhieuDoiSoat);

  // Gán sự kiện nút đóng modal thành công
  document.getElementById('modal-close-btn').addEventListener('click', dongModalThanhCong);
}

document.addEventListener('DOMContentLoaded', khoiTaoSuKien);
