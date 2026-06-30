// Biến toàn cục
let duLieuHienTai = null;

// Dữ liệu mẫu fallback đề phòng trường hợp chưa khởi động lại server
const duLieuMauMacDinh = [
  {
    loai: 'hop_dong',
    maSo: 'HĐ-2024-0102',
    tenKhachHang: 'Lê Hoàng Long',
    soDienThoai: '0909.987.654',
    email: 'long.le@yahoo.com',
    phongCoSo: 'P.101 — HomeStay Quận 7',
    giaThue: 4000000,
    tienCoc: 8000000,
    ngayBatDau: '2024-03-01',
    ngayKetThuc: '2025-03-01',
    trangThai: 'Chờ kiểm tra',
    ngayTraDuKien: '2024-08-30',
    loaiHinhTraPhong: 'truoc_han',
    lyDo: 'Thay đổi địa điểm học tập sang cơ sở khác.',
    nguoiTiepNhan: 'Nguyễn Văn A (Sale)',
    phuongThucHoanTien: 'chuyen_khoan'
  },
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
    ngayTraDuKien: '2024-08-25',
    loaiHinhTraPhong: 'truoc_han',
    lyDo: 'Đi công tác dài hạn ở nước ngoài.',
    nguoiTiepNhan: 'Nguyễn Văn B (Sale)',
    phuongThucHoanTien: 'chuyen_khoan'
  },
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
    trangThai: 'Chờ xác nhận đối soát',
    ngayTraDuKien: '2024-08-28',
    loaiHinhTraPhong: 'truoc_han',
    lyDo: 'Mua nhà riêng.',
    nguoiTiepNhan: 'Nguyễn Văn C (Sale)',
    phuongThucHoanTien: 'chuyen_khoan'
  },
  {
    loai: 'hop_dong',
    maSo: 'HĐ-2023-0592',
    tenKhachHang: 'Nguyễn Minh Tuấn',
    soDienThoai: '0782.909.123',
    email: 'tuan.nguyen@gmail.com',
    phongCoSo: 'P.302 — HomeStay Tân Bình',
    giaThue: 4500000,
    tienCoc: 9000000,
    ngayBatDau: '2023-05-15',
    ngayKetThuc: '2024-05-15',
    trangThai: 'Chờ thanh lý',
    ngayTraDuKien: '2024-08-20',
    loaiHinhTraPhong: 'dung_han',
    lyDo: 'Hết hạn thuê.',
    nguoiTiepNhan: 'Nguyễn Văn A (Sale)',
    phuongThucHoanTien: 'chuyen_khoan'
  }
];

// Hàm phụ định dạng ngày YYYY-MM-DD sang DD/MM/YYYY
function dinhDangNgay(chuoiNgay) {
  if (!chuoiNgay) return '';
  const [nam, thang, ngay] = chuoiNgay.split('-');
  return `${ngay}/${thang}/${nam}`;
}

// Hàm đọc tham số từ URL
function docThamSoUrl(tenThamSo) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(tenThamSo);
}

// Hàm tải thông tin phiếu yêu cầu trả phòng
async function taiPhiieuYeuCau() {
  const maSo = docThamSoUrl('id');
  if (!maSo) {
    alert('Không tìm thấy thông tin phiếu yêu cầu!');
    window.location.href = 'index.html';
    return;
  }

  try {
    const phanHoi = await fetch(`/api/tra-cuu?query=${encodeURIComponent(maSo)}`);
    if (phanHoi.ok) {
      const duLieu = await phanHoi.json();
      duLieuHienTai = duLieu;
      // Bổ sung dữ liệu mẫu nếu chưa có các trường yêu cầu trả phòng
      if (duLieuHienTai.ngayTraDuKien === undefined) {
        duLieuHienTai.ngayTraDuKien = '2024-08-30';
        duLieuHienTai.loaiHinhTraPhong = 'truoc_han';
        duLieuHienTai.lyDo = 'Thay đổi địa điểm làm việc/học tập.';
        duLieuHienTai.nguoiTiepNhan = 'Nguyễn Văn A (Sale)';
        duLieuHienTai.phuongThucHoanTien = 'chuyen_khoan';
      }
    } else {
      duLieuHienTai = duLieuMauMacDinh.find(item => item.maSo === maSo);
    }
  } catch (loi) {
    console.warn('Lỗi API tra cứu, sử dụng dữ liệu mặc định.');
    duLieuHienTai = duLieuMauMacDinh.find(item => item.maSo === maSo);
  }

  if (duLieuHienTai) {
    hienThiPhiieuYeuCau(duLieuHienTai);
  } else {
    alert('Phiếu yêu cầu không tồn tại!');
    window.location.href = 'index.html';
  }
}

// Hàm hiển thị thông tin lên giao diện
function hienThiPhiieuYeuCau(duLieu) {
  document.getElementById('card-ma-so').textContent = `Phiếu yêu cầu: YCTP-${duLieu.maSo.split('-')[2] || '987216'}`;
  
  const oStatus = document.getElementById('card-status');
  oStatus.textContent = duLieu.trangThai;
  
  if (duLieu.trangThai === 'Chờ kiểm tra') {
    oStatus.className = 'badge badge-pending';
  } else {
    oStatus.className = 'badge badge-active';
  }

  document.getElementById('val-ten-khach').textContent = duLieu.tenKhachHang;
  document.getElementById('val-phong-co-so').textContent = duLieu.phongCoSo;
  document.getElementById('val-ngay-tra').textContent = dinhDangNgay(duLieu.ngayTraDuKien);
  
  let loaiHinhNhan = 'Trả trước hạn hợp đồng';
  if (duLieu.loaiHinhTraPhong === 'dung_han') loaiHinhNhan = 'Trả đúng hạn hợp đồng';
  if (duLieu.loaiHinhTraPhong === 'huy_thue') loaiHinhNhan = 'Hủy cọc thuê trước khi ký hợp đồng';
  document.getElementById('val-loai-hinh').textContent = loaiHinhNhan;
  
  document.getElementById('val-ly-do').textContent = duLieu.lyDo;
  document.getElementById('val-nguoi-nhan').textContent = duLieu.nguoiTiepNhan;
  document.getElementById('val-phuong-thuc').textContent = duLieu.phuongThucHoanTien === 'chuyen_khoan' ? 'Chuyển khoản qua ngân hàng' : 'Nhận tiền mặt tại quầy';

  // Điều chỉnh nút hành động tương ứng với trạng thái
  const oNutHanhDong = document.getElementById('btn-process-request');
  if (duLieu.trangThai === 'Chờ kiểm tra') {
    oNutHanhDong.textContent = 'Tiến hành kiểm tra phòng';
    oNutHanhDong.style.display = 'inline-flex';
    oNutHanhDong.onclick = function() {
      window.location.href = `/QuanLy_KiemTraPhong.html?id=${encodeURIComponent(duLieu.maSo)}`;
    };
  } else if (duLieu.trangThai === 'Chờ đối soát') {
    oNutHanhDong.textContent = 'Tiến hành đối soát tài chính';
    oNutHanhDong.style.display = 'inline-flex';
    oNutHanhDong.onclick = function() {
      window.location.href = `/KeToan_LapPhieuDoiSoat.html?id=${encodeURIComponent(duLieu.maSo)}`;
    };
  } else if (duLieu.trangThai === 'Chờ xác nhận đối soát') {
    oNutHanhDong.textContent = 'Tiến hành xác nhận đối soát';
    oNutHanhDong.style.display = 'inline-flex';
    oNutHanhDong.onclick = function() {
      window.location.href = `/QuanLy_XacNhanDoiSoat.html?id=${encodeURIComponent(duLieu.maSo)}`;
    };
  } else if (duLieu.trangThai === 'Chờ thanh lý') {
    oNutHanhDong.textContent = 'Tiến hành thanh lý hợp đồng';
    oNutHanhDong.style.display = 'inline-flex';
    oNutHanhDong.onclick = function() {
      window.location.href = `/QuanLy_ThanhLyHopDong.html?id=${encodeURIComponent(duLieu.maSo)}`;
    };
  } else {
    // Đã thanh lý hoàn tất hoặc đang hoàn cọc
    oNutHanhDong.style.display = 'none';
  }
}

// Khởi chạy sự kiện
document.addEventListener('DOMContentLoaded', taiPhiieuYeuCau);
