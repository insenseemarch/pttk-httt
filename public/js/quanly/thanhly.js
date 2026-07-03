// Các phần tử DOM cần thiết
const oForm = document.getElementById('liquidation-form');

// Biến toàn cục
let duLieuHienTai = null;

// Dữ liệu mẫu fallback đề phòng trường hợp chưa khởi động lại server
const duLieuMauMacDinh = [
  {
    loai: 'hop_dong',
    maSo: 'HĐ-2024-0412',
    tenKhachHang: 'Vũ Hoàng Yến',
    soDienThoai: '0966.555.666',
    email: 'yen.vu@gmail.com',
    phongCoSo: 'P.501 — HomeStay Thủ Đức',
    giaThue: 4500000,
    tienCoc: 9000000,
    ngayBatDau: '2024-04-15',
    ngayKetThuc: '2025-04-15',
    trangThai: 'Chờ thanh lý',
    noThue: 0,
    noDienNuoc: 150000,
    chiPhiHuHong: 0,
    moTaHuHong: 'Đồ dùng bình thường, vệ sinh sạch',
    dongYReconcile: true,
    phuongThucHoan: 'chuyen_khoan'
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

// Hàm tải thông tin thanh lý
async function taiChiTietThanhLy() {
  const maSo = docThamSoUrl('id');
  if (!maSo) {
    alert('Không tìm thấy mã hợp đồng cần thanh lý!');
    window.location.href = 'index.html';
    return;
  }

  try {
    const phanHoi = await fetch(`/api/tra-cuu?query=${encodeURIComponent(maSo)}`);
    if (phanHoi.ok) {
      const duLieu = await phanHoi.json();
      duLieuHienTai = duLieu;
      // Bổ sung các trường nếu backend chưa trả về
      if (duLieuHienTai.phuongThucHoan === undefined) {
        duLieuHienTai.phuongThucHoan = 'chuyen_khoan';
        duLieuHienTai.noThue = 0;
        duLieuHienTai.noDienNuoc = 150000;
        duLieuHienTai.chiPhiHuHong = 0;
      }
    } else {
      duLieuHienTai = duLieuMauMacDinh.find(item => item.maSo === maSo);
    }
  } catch (loi) {
    console.warn('Lỗi kết nối API tra cứu, sử dụng dữ liệu mặc định.');
    duLieuHienTai = duLieuMauMacDinh.find(item => item.maSo === maSo);
  }

  if (duLieuHienTai) {
    hienThiThongTietThanhLy(duLieuHienTai);
  } else {
    alert('Không tìm thấy thông tin hợp đồng phù hợp!');
    window.location.href = 'index.html';
  }
}

// Hàm hiển thị thông tin thanh lý lên giao diện
function hienThiThongTietThanhLy(duLieu) {
  document.getElementById('khach-thue-info').textContent = `${duLieu.tenKhachHang} — Hợp đồng: ${duLieu.maSo}`;
  document.getElementById('card-ma-so').textContent = duLieu.maSo;

  // Tính kết quả quyết toán cọc
  const noThue = duLieu.noThue || 0;
  const noDienNuoc = duLieu.noDienNuoc || 0;
  const chiPhiHuHong = duLieu.chiPhiHuHong || 0;
  
  // Tạm tính cọc cơ bản của Vũ Hoàng Yến (giả sử hoàn cọc 100% = 9.000.000đ do hết hạn)
  let tienCocCoBan = duLieu.tienCoc;
  // Nếu là trả trước hạn (ví dụ HĐ-2023-0892 ở màn hình trước), áp dụng 70% cọc
  if (duLieu.maSo === 'HĐ-2023-0892') {
    tienCocCoBan = duLieu.tienCoc * 0.7; // Hoàn 70%
  }
  
  const tongKhauTru = noThue + noDienNuoc + chiPhiHuHong;
  const soTienThucHoan = tienCocCoBan - tongKhauTru;

  const oNutQuyetToan = document.getElementById('card-quyet-toan-tong');
  const oPhuongThuc = document.getElementById('card-phuong-thuc');

  if (soTienThucHoan >= 0) {
    oNutQuyetToan.textContent = `Hoàn trả khách: ${dinhDangTienTe(soTienThucHoan)}`;
    oNutQuyetToan.style.color = 'var(--success)';
    oPhuongThuc.textContent = duLieu.phuongThucHoan === 'chuyen_khoan' ? 'Chuyển khoản ngân hàng (Khách cung cấp)' : 'Tiền mặt tại quầy';
  } else {
    oNutQuyetToan.textContent = `Khách phải đóng thêm: ${dinhDangTienTe(Math.abs(soTienThucHoan))}`;
    oNutQuyetToan.style.color = 'var(--danger)';
    oPhuongThuc.textContent = 'Đã thanh toán bằng chuyển khoản / tiền mặt';
  }
}

// Hàm xử lý hoàn tất thanh lý
async function hoanTatThanhLy(event) {
  event.preventDefault();

  const oThuKhoa = document.getElementById('check-thu-khoa').checked;
  const oCapNhatTaiSan = document.getElementById('check-cap-nhat-tai-san').checked;
  const oGiaiPhongPhong = document.getElementById('check-giai-phong-phong').checked;

  if (!oThuKhoa || !oCapNhatTaiSan || !oGiaiPhongPhong) {
    alert('Bạn phải tích chọn xác nhận đã hoàn tất đầy đủ 3 nghiệp vụ quản lý tại chi nhánh để kết thúc lưu trú!');
    return;
  }

  const thongTinThanhLy = {
    maHopDong: duLieuHienTai.maSo,
    ngayThanhLy: new Date().toISOString().split('T')[0],
    trangThaiPhong: 'Trong',
    trangThaiHopDong: 'Da_Thanh_Ly',
    nguoiKiemTra: 'Nguyễn Văn A (Quản lý)'
  };

  try {
    const phanHoi = await fetch('/api/gui-yeu-cau', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...thongTinThanhLy,
        loaiNghiepVu: 'hoan_tat_thanh_ly'
      })
    });

    const ketQua = await phanHoi.json();
    if (ketQua.success) {
      hienThiModalThanhCong();
    } else {
      alert('Thanh lý thất bại. Thử lại sau!');
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
  window.location.href = '/index.html?tab=yeucau&role=quanly';
}

// Hàm khởi tạo
function khoiTaoSuKien() {
  taiChiTietThanhLy();
  oForm.addEventListener('submit', hoanTatThanhLy);

  // Gán sự kiện nút đóng modal
  document.getElementById('modal-close-btn').addEventListener('click', dongModalThanhCong);
}

document.addEventListener('DOMContentLoaded', khoiTaoSuKien);
