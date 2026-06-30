// Biến toàn cục chứa thông tin chứng từ hiện tại
let duLieuHienTai = null;

// Dữ liệu mẫu fallback đề phòng trường hợp chưa khởi động lại server
const duLieuMauMacDinh = [
  {
    loai: 'hop_dong',
    maSo: 'HĐ-2023-0892',
    tenKhachHang: 'Trần Thị Thanh Thảo',
    soDienThoai: '0938.123.456',
    email: 'thao.tran@gmail.com',
    phongCoSo: 'P.402 — HomeStay Landmark 81',
    giaThue: 6500000,
    tienCoc: 13000000,
    ngayBatDau: '2024-01-15',
    ngayKetThuc: '2025-01-15',
    trangThai: 'Hiệu lực'
  },
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
    trangThai: 'Hiệu lực'
  },
  {
    loai: 'dat_coc',
    maSo: 'DC-2024-001',
    tenKhachHang: 'Nguyễn Văn Nam',
    soDienThoai: '0977.111.222',
    email: 'nam.nguyen@outlook.com',
    phongCoSo: 'P.305 — HomeStay District 9',
    giaThue: 2500000,
    tienCoc: 5000000,
    ngayBatDau: '2024-06-01',
    trangThai: 'Chưa ký hợp đồng'
  }
];

// Hàm định dạng số tiền thành VND
function dinhDangTienTe(soTien) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
    .format(soTien)
    .replace('₫', 'VNĐ');
}

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

// Hàm tính toán khoảng cách thời gian giữa hai ngày
function tinhKhoangCachThoiGian(ngayBatDauText, ngayKetThucText) {
  const ngayBatDau = new Date(ngayBatDauText);
  const ngayKetThuc = new Date(ngayKetThucText);
  
  if (ngayKetThuc < ngayBatDau) {
    return { thang: 0, ngay: 0 };
  }
  
  let namChenhLech = ngayKetThuc.getFullYear() - ngayBatDau.getFullYear();
  let thangChenhLech = ngayKetThuc.getMonth() - ngayBatDau.getMonth() + (namChenhLech * 12);
  let ngayChenhLech = ngayKetThuc.getDate() - ngayBatDau.getDate();
  
  if (ngayChenhLech < 0) {
    thangChenhLech--;
    const ngayTrongThangTruoc = new Date(ngayKetThuc.getFullYear(), ngayKetThuc.getMonth(), 0).getDate();
    ngayChenhLech += ngayTrongThangTruoc;
  }
  
  return {
    thang: thangChenhLech,
    ngay: ngayChenhLech
  };
}

// Hàm tải thông tin chi tiết hợp đồng/phiếu cọc
async function taiChiTietChungTu() {
  const maSo = docThamSoUrl('id');
  if (!maSo) {
    alert('Không tìm thấy thông tin mã số yêu cầu!');
    window.location.href = 'index.html';
    return;
  }

  try {
    const phanHoi = await fetch(`/api/tra-cuu?query=${encodeURIComponent(maSo)}`);
    if (phanHoi.ok) {
      const duLieu = await phanHoi.json();
      duLieuHienTai = duLieu;
    } else {
      duLieuHienTai = duLieuMauMacDinh.find(item => item.maSo === maSo);
    }
  } catch (loi) {
    console.warn('Lỗi API tra cứu, sử dụng dữ liệu mặc định.');
    duLieuHienTai = duLieuMauMacDinh.find(item => item.maSo === maSo);
  }

  if (duLieuHienTai) {
    hienThiChiTiet(duLieuHienTai);
  } else {
    alert('Hồ sơ không tồn tại hoặc đã bị xóa!');
    window.location.href = 'index.html';
  }
}

// Hàm hiển thị thông tin chi tiết lên các thẻ và biểu mẫu
function hienThiChiTiet(duLieu) {
  // 1. Cập nhật thẻ thông tin chung (bên trái)
  document.getElementById('card-ma-so').textContent = duLieu.maSo;
  const nhanTrangThai = document.getElementById('card-status');
  nhanTrangThai.textContent = duLieu.trangThai;
  
  if (duLieu.loai === 'hop_dong') {
    nhanTrangThai.className = 'badge badge-active';
  } else {
    nhanTrangThai.className = 'badge badge-pending';
  }

  document.getElementById('card-ten-khach').textContent = duLieu.tenKhachHang;
  document.getElementById('card-lien-he').textContent = `${duLieu.soDienThoai} — ${duLieu.email}`;
  document.getElementById('card-phong-co-so').textContent = duLieu.phongCoSo;
  document.getElementById('card-gia-thue').textContent = dinhDangTienTe(duLieu.giaThue) + ' / tháng';
  document.getElementById('card-tien-coc').textContent = dinhDangTienTe(duLieu.tienCoc);

  // 2. Xử lý phần Lộ trình & Timeline (bên phải)
  const khungTimeline = document.getElementById('timeline-card');
  const khungThongTinCocTraPhong = document.getElementById('card-tien-coc-tiem-nang');

  if (duLieu.loai === 'hop_dong') {
    khungTimeline.style.display = 'flex';
    khungThongTinCocTraPhong.style.display = 'block';

    const ngayHomNayText = new Date().toISOString().split('T')[0];
    document.getElementById('time-ngay-bat-dau').textContent = dinhDangNgay(duLieu.ngayBatDau);
    document.getElementById('time-ngay-kthuc').textContent = dinhDangNgay(duLieu.ngayKetThuc);
    document.getElementById('time-ngay-hom-nay').textContent = dinhDangNgay(ngayHomNayText);

    // Tính toán tiến độ timeline
    const mscDau = new Date(duLieu.ngayBatDau).getTime();
    const mscCuoi = new Date(duLieu.ngayKetThuc).getTime();
    const mscNay = new Date(ngayHomNayText).getTime();

    let phanTramTienTrinh = 0;
    if (mscCuoi > mscDau) {
      phanTramTienTrinh = ((mscNay - mscDau) / (mscCuoi - mscDau)) * 100;
      phanTramTienTrinh = Math.max(0, Math.min(100, phanTramTienTrinh));
    }

    document.getElementById('timeline-bar').style.width = `${phanTramTienTrinh}%`;
    document.getElementById('point-today').style.left = `${phanTramTienTrinh}%`;

    const khoangCachDaO = tinhKhoangCachThoiGian(duLieu.ngayBatDau, ngayHomNayText);
    const khoangCachConLai = tinhKhoangCachThoiGian(ngayHomNayText, duLieu.ngayKetThuc);

    document.getElementById('stat-tong-thoi-gian').textContent = '12 tháng';
    document.getElementById('stat-da-o').textContent = `${khoangCachDaO.thang} tháng ${khoangCachDaO.ngay} ngày`;
    document.getElementById('stat-con-lai').textContent = `${khoangCachConLai.thang} tháng ${khoangCachConLai.ngay} ngày`;
  } else {
    khungTimeline.style.display = 'none';
    khungThongTinCocTraPhong.style.display = 'none';
  }
}

// Hàm điều hướng sang trang tạo yêu cầu trả phòng của hợp đồng này
function chuyenSangHuongTraPhong() {
  if (duLieuHienTai) {
    window.location.href = `/Sale_TiepNhanTraPhong.html?id=${encodeURIComponent(duLieuHienTai.maSo)}`;
  }
}

// Gán hàm vào window namespace
window.chuyenSangHuongTraPhong = chuyenSangHuongTraPhong;

// Hàm khởi tạo và gán các sự kiện
function khoiTaoSuKien() {
  // Tải chi tiết chứng từ dựa trên URL query param
  taiChiTietChungTu();

  // Gán sự kiện nút chuyển sang trả phòng
  const nutTaoTraPhong = document.getElementById('btn-create-checkout');
  if (nutTaoTraPhong) {
    nutTaoTraPhong.addEventListener('click', chuyenSangHuongTraPhong);
  }
}

// Chạy khởi tạo khi trang đã sẵn sàng
document.addEventListener('DOMContentLoaded', khoiTaoSuKien);
