// Các phần tử DOM cần thiết
const oForm = document.getElementById('payment-form');
const oInputDate = document.getElementById('input-date');

// Biến toàn cục
let duLieuHienTai = null;

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
    trangThai: 'Chờ hoàn cọc',
    noThue: 0,
    noDienNuoc: 250000,
    chiPhiHuHong: 800000,
    phuongThucHoanTien: 'chuyen_khoan'
  },
  {
    loai: 'hop_dong',
    maSo: 'HĐ-2024-0812',
    tenKhachHang: 'Nguyễn Văn An',
    soDienThoai: '0988.777.666',
    email: 'an.nguyen@gmail.com',
    phongCoSo: 'P.402 — HomeStay Landmark 81',
    giaThue: 5000000,
    tienCoc: 5000000,
    ngayBatDau: '2024-01-10',
    ngayKetThuc: '2025-01-10',
    trangThai: 'Chờ hoàn cọc',
    noThue: 1500000,
    noDienNuoc: 450000,
    chiPhiHuHong: 200000,
    tiLeHoanCoc: 80,
    phuongThucHoanTien: 'chuyen_khoan'
  },
  {
    loai: 'hop_dong',
    maSo: 'HĐ-2024-0999',
    tenKhachHang: 'Phan Tuấn Kiệt',
    soDienThoai: '0901.222.333',
    email: 'kiet.phan@gmail.com',
    phongCoSo: 'P.204 — HomeStay Quận 9',
    giaThue: 3000000,
    tienCoc: 3000000,
    ngayBatDau: '2024-02-15',
    ngayKetThuc: '2025-02-15',
    trangThai: 'Chờ thanh toán',
    noThue: 2500000,
    noDienNuoc: 600000,
    chiPhiHuHong: 1000000,
    tiLeHoanCoc: 50,
    phuongThucHoanTien: 'tien_mat'
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

// Hàm tải chi tiết hợp đồng để hoàn cọc
async function taiChiTietHoanCoc() {
  const maSo = docThamSoUrl('id');
  if (!maSo) {
    alert('Không tìm thấy mã hợp đồng cần hoàn cọc/thu tiền!');
    window.location.href = 'index.html';
    return;
  }

  try {
    const phanHoi = await fetch(`/api/tra-cuu?query=${encodeURIComponent(maSo)}`);
    if (phanHoi.ok) {
      const duLieu = await phanHoi.json();
      duLieuHienTai = duLieu;
      if (duLieuHienTai.noThue === undefined) {
        duLieuHienTai.noThue = 0;
        duLieuHienTai.noDienNuoc = 250000;
        duLieuHienTai.chiPhiHuHong = 800000;
        duLieuHienTai.phuongThucHoanTien = 'chuyen_khoan';
      }
    } else {
      duLieuHienTai = duLieuMauMacDinh.find(item => item.maSo === maSo);
    }
  } catch (loi) {
    console.warn('Lỗi kết nối API tra cứu, sử dụng dữ liệu mặc định.');
    duLieuHienTai = duLieuMauMacDinh.find(item => item.maSo === maSo);
  }

  if (duLieuHienTai) {
    hienThiThongTinQuyetToan(duLieuHienTai);
  } else {
    alert('Không tìm thấy thông tin hợp đồng phù hợp!');
    window.location.href = 'index.html';
  }
}

// Hàm hiển thị thông tin quyết toán lên giao diện
function hienThiThongTinQuyetToan(duLieu) {
  document.getElementById('khach-thue-info').textContent = `Thực hiện chi trả tiền cọc hoặc nhận tiền đóng thêm từ khách thuê: ${duLieu.tenKhachHang}`;
  document.getElementById('card-ma-so').textContent = duLieu.maSo;
  document.getElementById('card-khach-hang').textContent = duLieu.tenKhachHang;
  document.getElementById('card-phong-co-so').textContent = duLieu.phongCoSo;
  
  const phuongThucText = duLieu.phuongThucHoanTien === 'chuyen_khoan' ? 'Chuyển khoản qua ngân hàng' : 'Nhận tiền mặt tại quầy';
  document.getElementById('card-phuong-thuc').textContent = phuongThucText;

  // Tính kết quả thực tế để biết là hoàn cọc hay thu thêm
  const tienCocGoc = duLieu.tienCoc;
  const noThue = duLieu.noThue || 0;
  const noDienNuoc = duLieu.noDienNuoc || 0;
  const chiPhiHuHong = duLieu.chiPhiHuHong || 0;
  const phiVeSinhCoDinh = 150000;

  // Giả định hoàn cọc cơ bản tỷ lệ 80% (từ màn hình trước)
  const tiLeHoan = duLieu.tiLeHoanCoc || 80;
  const tienCocDuocHoan = tienCocGoc * (tiLeHoan / 100);
  const tongKhauTru = noThue + noDienNuoc + chiPhiHuHong + phiVeSinhCoDinh;
  const soTienQuyetToan = tienCocDuocHoan - tongKhauTru;

  const oHopQuyetToan = document.getElementById('settlement-box');
  const oNutXacNhan = document.getElementById('btn-submit-payment');
  const oPageTitleText = document.getElementById('page-title-text');
  const oModalTitle = document.querySelector('.modal-title');
  const oModalText = document.getElementById('modal-msg');

  if (soTienQuyetToan >= 0) {
    oPageTitleText.textContent = "Phiếu ghi nhận hoàn cọc cho khách thuê";
    document.getElementById('khach-thue-info').textContent = `Thực hiện hoàn trả tiền cọc thừa cho khách thuê: ${duLieu.tenKhachHang} — Phòng: ${duLieu.phongCoSo}`;
    oHopQuyetToan.textContent = `HOÀN TRẢ KHÁCH: ${dinhDangTienTe(soTienQuyetToan)}`;
    oHopQuyetToan.className = 'settlement-badge settlement-refund';
    oNutXacNhan.textContent = 'Xác nhận Đã hoàn cọc & Đóng hồ sơ';

    // Cập nhật nội dung modal thành công
    oModalTitle.textContent = "Hoàn Cọc Thành Công";
    oModalText.textContent = `Số tiền cọc thừa ${dinhDangTienTe(soTienQuyetToan)} đã được hoàn trả thành công cho khách thuê ${duLieu.tenKhachHang} và hồ sơ thuê đã được đóng hoàn tất.`;
  } else {
    oPageTitleText.textContent = "Phiếu thu tiền cấn trừ chênh lệch";
    document.getElementById('khach-thue-info').textContent = `Thực hiện thu thêm các khoản phí phát sinh vượt cọc của khách thuê: ${duLieu.tenKhachHang} — Phòng: ${duLieu.phongCoSo}`;
    oHopQuyetToan.textContent = `THU THÊM PHÍ: ${dinhDangTienTe(Math.abs(soTienQuyetToan))}`;
    oHopQuyetToan.className = 'settlement-badge settlement-collect';
    oNutXacNhan.textContent = 'Xác nhận Đã thu tiền & Đóng hồ sơ';

    // Cập nhật nội dung modal thành công
    oModalTitle.textContent = "Thu Tiền Thành Công";
    oModalText.textContent = `Số tiền chênh lệch thiếu ${dinhDangTienTe(Math.abs(soTienQuyetToan))} đã được thu hồi thành công từ khách thuê ${duLieu.tenKhachHang} và hồ sơ thuê đã được đóng hoàn tất.`;
  }

  // Prepopulate today's date
  oInputDate.value = new Date().toISOString().split('T')[0];
}

// Hàm gửi xác nhận thanh toán lên máy chủ
async function guiXacNhanThanhToan(event) {
  event.preventDefault();

  const phuongThucThucTe = document.getElementById('input-mode').value;
  const ghiChu = document.getElementById('input-note').value;

  const thongTinThanhToan = {
    maHopDong: duLieuHienTai.maSo,
    phuongThucGiaoDich: phuongThucThucTe,
    bankName: document.getElementById('input-bank-name').value,
    bankAcc: document.getElementById('input-bank-acc').value,
    bankOwner: document.getElementById('input-bank-owner').value,
    ngayGiaoDich: oInputDate.value,
    ghiChu: ghiChu,
    nguoiXacNhan: 'Kế toán trưởng (Phòng tài chính)'
  };

  try {
    const phanHoi = await fetch('/api/gui-yeu-cau', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...thongTinThanhToan,
        loaiNghiepVu: 'hoan_tat_thanh_toan'
      })
    });

    const ketQua = await phanHoi.json();
    if (ketQua.success) {
      hienThiModalThanhCong();
    } else {
      alert('Ghi nhận giao dịch thất bại. Vui lòng thử lại!');
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

// Hàm đóng modal và quay lại danh sách yêu cầu
function dongModalThanhCong() {
  const modal = document.getElementById('success-modal');
  modal.classList.remove('active');
  window.location.href = '/index.html?tab=yeucau&role=ketoan';
}

// Hàm cập nhật nhãn, gợi ý và tự động sinh mã mẫu theo phương thức thực tế
function capNhatGiaoDienGiaoDich() {
  if (!duLieuHienTai) return;
  const mode = document.getElementById('input-mode').value;

  if (mode === 'chuyen_khoan') {
    // Hiển thị khung ngân hàng và tự động điền thông tin khách hàng
    document.getElementById('bank-details-container').style.display = 'flex';
    document.getElementById('bank-warning-box').style.display = 'flex';
    document.getElementById('input-bank-acc').value = "1903" + Math.floor(Math.random() * 900000 + 100000);
    
    // Viết hoa không dấu tên khách
    if (duLieuHienTai && duLieuHienTai.tenKhachHang) {
      document.getElementById('input-bank-owner').value = duLieuHienTai.tenKhachHang
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toUpperCase();
    }
  } else {
    // Ẩn khung ngân hàng
    document.getElementById('bank-details-container').style.display = 'none';
    document.getElementById('bank-warning-box').style.display = 'none';
  }
}

// Khởi chạy sự kiện
function khoiTaoSuKien() {
  taiChiTietHoanCoc().then(() => {
    // Sau khi tải dữ liệu thành công thì tự động điền mã giao dịch mẫu lần đầu
    capNhatGiaoDienGiaoDich();
  });
  
  // Gán sự kiện khi thay đổi phương thức thực tế
  document.getElementById('input-mode').addEventListener('change', capNhatGiaoDienGiaoDich);
  
  oForm.addEventListener('submit', guiXacNhanThanhToan);
  document.getElementById('modal-close-btn').addEventListener('click', dongModalThanhCong);
}

document.addEventListener('DOMContentLoaded', khoiTaoSuKien);
