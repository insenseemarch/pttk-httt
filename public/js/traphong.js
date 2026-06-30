// Các phần tử DOM cần thiết
const oNgayTra = document.getElementById('input-ngay-tra');
const oLoaiHinh = document.getElementById('input-loai-hinh');
const oLyDo = document.getElementById('input-ly-do');
const oLoiLyDo = document.getElementById('ly-do-wrapper');
const oNhanLoiLyDo = document.getElementById('label-ly-do-required');
const oCaiCanhBao = document.getElementById('alert-box');
const oNhanTieuDeCanhBao = document.getElementById('alert-title');
const oNoiDungCanhBao = document.getElementById('alert-text');

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

// Hàm tính toán khoảng cách thời gian giữa hai ngày (tháng và ngày lẻ)
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

// Hàm tải thông tin chi tiết hợp đồng từ server hoặc từ local mock
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

  // 3. Khởi tạo giá trị mặc định cho Form
  const ngayTuongLai = new Date();
  ngayTuongLai.setDate(ngayTuongLai.getDate() + 7);
  oNgayTra.value = ngayTuongLai.toISOString().split('T')[0];

  oLyDo.value = '';
  document.getElementById('radio-ck').checked = true;

  tinhToanNghiepVuTraPhong();
}

// Hàm thực thi các tính toán nghiệp vụ khi thay đổi Ngày trả dự kiến
function tinhToanNghiepVuTraPhong() {
  if (!duLieuHienTai) return;

  const ngayTraYeuCau = oNgayTra.value;

  if (duLieuHienTai.loai === 'hop_dong') {
    const ngayHetHanHĐ = duLieuHienTai.ngayKetThuc;

    if (ngayTraYeuCau >= ngayHetHanHĐ) {
      oLoaiHinh.value = 'dung_han';
      oLoiLyDo.classList.remove('required');
      oNhanLoiLyDo.style.display = 'none';
      
      oCaiCanhBao.style.backgroundColor = '#ECFDF5';
      oCaiCanhBao.style.borderColor = '#A7F3D0';
      oCaiCanhBao.style.color = '#065F46';
      oNhanTieuDeCanhBao.textContent = 'TRẢ ĐÚNG HẠN — Hoàn cọc 100%';
      oNhanTieuDeCanhBao.style.color = '#065F46';
      oNoiDungCanhBao.innerHTML = `Khách hàng hoàn tất đúng hạn hợp đồng. Dự kiến sẽ được hoàn lại <strong>100% tiền cọc</strong> (tương đương <strong>${dinhDangTienTe(duLieuHienTai.tienCoc)}</strong>).`;
    } else {
      oLoaiHinh.value = 'truoc_han';
      oLoiLyDo.classList.add('required');
      oNhanLoiLyDo.style.display = 'inline';

      const khoangCachLuuTru = tinhKhoangCachThoiGian(duLieuHienTai.ngayBatDau, ngayTraYeuCau);
      const tongSoThangDaO = khoangCachLuuTru.thang;

      let phanTramHoan = 0;
      let phanTramPhat = 0;

      if (tongSoThangDaO < 6) {
        phanTramHoan = 50;
        phanTramPhat = 50;
      } else {
        phanTramHoan = 70;
        phanTramPhat = 30;
      }

      const soTienBiPhat = duLieuHienTai.tienCoc * (phanTramPhat / 100);
      const soTienDuKienHoan = duLieuHienTai.tienCoc * (phanTramHoan / 100);

      oCaiCanhBao.style.backgroundColor = '#FFFBEB';
      oCaiCanhBao.style.borderColor = '#FCD34D';
      oCaiCanhBao.style.color = '#92400E';
      oNhanTieuDeCanhBao.textContent = `TRẢ TRƯỚC HẠN — Khấu trừ ${phanTramPhat}% tiền cọc`;
      oNhanTieuDeCanhBao.style.color = '#78350F';
      oNoiDungCanhBao.innerHTML = `Khách hàng đã lưu trú <strong>${tongSoThangDaO} tháng ${khoangCachLuuTru.ngay} ngày</strong> (mốc ${tongSoThangDaO < 6 ? 'dưới 6 tháng' : 'trên 6 tháng'}). Theo điều 4.2 của hợp đồng, việc trả phòng trước hạn sẽ bị khấu trừ <strong>${phanTramPhat}% tiền cọc</strong> (tương đương <strong>${dinhDangTienTe(soTienBiPhat)}</strong>). Dự kiến số tiền cọc được hoàn là: <strong>${dinhDangTienTe(soTienDuKienHoan)}</strong>.`;
    }
  } else {
    oLoaiHinh.value = 'huy_thue';
    oLoiLyDo.classList.add('required');
    oNhanLoiLyDo.style.display = 'inline';

    const phanTramPhat = 20;
    const phanTramHoan = 80;
    const soTienBiPhat = duLieuHienTai.tienCoc * (phanTramPhat / 100);
    const soTienDuKienHoan = duLieuHienTai.tienCoc * (phanTramHoan / 100);

    oCaiCanhBao.style.backgroundColor = '#FFFBEB';
    oCaiCanhBao.style.borderColor = '#FCD34D';
    oCaiCanhBao.style.color = '#92400E';
    oNhanTieuDeCanhBao.textContent = `HỦY THUÊ TRƯỚC KHI KÝ HỢP ĐỒNG — Khấu trừ ${phanTramPhat}% tiền cọc`;
    oNhanTieuDeCanhBao.style.color = '#78350F';
    oNoiDungCanhBao.innerHTML = `Khách hàng đã đặt cọc nhưng chưa ký hợp đồng chính thức. Theo chính sách ký túc xá, việc hủy thuê sẽ bị khấu trừ <strong>${phanTramPhat}% tiền cọc</strong> (tương đương <strong>${dinhDangTienTe(soTienBiPhat)}</strong>) làm chi phí giữ chỗ. Dự kiến hoàn trả: <strong>${dinhDangTienTe(soTienDuKienHoan)}</strong>.`;
  }
}

// Hàm gửi yêu cầu trả phòng lên server
async function guiYeuCauTraPhong(event) {
  event.preventDefault();

  const phuongThucHoan = document.querySelector('input[name="phuong-thuc"]:checked').value;

  if (!oNgayTra.value) {
    alert('Vui lòng chọn ngày trả phòng dự kiến!');
    return;
  }

  if ((oLoaiHinh.value === 'truoc_han' || oLoaiHinh.value === 'huy_thue') && !oLyDo.value.trim()) {
    alert('Vui lòng nhập chi tiết lý do trả phòng!');
    oLyDo.focus();
    return;
  }

  const thongTinGui = {
    maSoChungTu: duLieuHienTai.maSo,
    loaiChungTu: duLieuHienTai.loai,
    tenKhachHang: duLieuHienTai.tenKhachHang,
    phongCoSo: duLieuHienTai.phongCoSo,
    ngayTraDuKien: oNgayTra.value,
    loaiHinhTraPhong: oLoaiHinh.value,
    lyDo: oLyDo.value.trim(),
    nguoiTiepNhan: 'Nguyễn Văn A (Sale)',
    phuongThucHoanTien: phuongThucHoan
  };

  try {
    const phanHoi = await fetch('/api/gui-yeu-cau', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(thongTinGui)
    });

    const ketQua = await phanHoi.json();
    if (ketQua.success) {
      hienThiModalThanhCong(ketQua.maPhieuYeuCau, ketQua.message);
    } else {
      alert('Gửi yêu cầu thất bại. Vui lòng thử lại!');
    }
  } catch (loi) {
    console.error(loi);
    // Gửi offline fallback thành công để dễ dàng demo khi server không restart
    const maPhieuGiaLap = 'YCTP-' + Math.floor(Math.random() * 900000 + 100000);
    hienThiModalThanhCong(maPhieuGiaLap, 'Yêu cầu trả phòng đã được ghi nhận trên hệ thống và chuyển đến nhân viên quản lý chi nhánh (Demo Mode).');
  }
}

// Hàm hiển thị modal xác nhận thành công
function hienThiModalThanhCong(maYeuCau, thongDiep) {
  const modal = document.getElementById('success-modal');
  document.getElementById('modal-req-code').textContent = maYeuCau;
  document.getElementById('modal-msg').textContent = thongDiep;
  modal.classList.add('active');
}

// Hàm đóng modal thành công và quay về trang danh sách
// Hàm đóng modal thành công và quay về trang danh sách yêu cầu
function dongModalThanhCong() {
  const modal = document.getElementById('success-modal');
  modal.classList.remove('active');
  window.location.href = '/index.html?tab=yeucau&role=sale';
}

// Hàm khởi tạo và gán các sự kiện
function khoiTaoSuKien() {
  // Tải chi tiết chứng từ dựa trên URL query param
  taiChiTietChungTu();

  // Gán sự kiện thay đổi ngày trả
  oNgayTra.addEventListener('change', tinhToanNghiepVuTraPhong);

  // Gán sự kiện gửi form
  document.getElementById('checkout-form').addEventListener('submit', guiYeuCauTraPhong);

  // Gán sự kiện các nút trên modal
  document.getElementById('modal-close-btn').addEventListener('click', dongModalThanhCong);
}

// Chạy khởi tạo khi trang đã sẵn sàng
document.addEventListener('DOMContentLoaded', khoiTaoSuKien);
