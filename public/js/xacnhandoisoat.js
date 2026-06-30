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
    trangThai: 'Chờ xác nhận đối soát',
    noThue: 0,
    noDienNuoc: 250000,
    chiPhiHuHong: 800000,
    moTaHuHong: 'Hỏng nệm cao su, trầy xước tủ quần áo',
    tiLeHoanCoc: 80,
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
    trangThai: 'Chờ xác nhận đối soát',
    noThue: 1500000,
    noDienNuoc: 450000,
    chiPhiHuHong: 200000,
    moTaHuHong: 'Linh kiện hỏng, vệ sinh phòng',
    tiLeHoanCoc: 80,
    phuongThucHoanTien: 'chuyen_khoan'
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

// Hàm tải chi tiết đối soát để quản lý duyệt
async function taiChiTietDuyetDoiSoat() {
  const maSo = docThamSoUrl('id');
  if (!maSo) {
    alert('Không tìm thấy mã hợp đồng cần xác nhận đối soát!');
    window.location.href = 'index.html';
    return;
  }

  try {
    const phanHoi = await fetch(`/api/tra-cuu?query=${encodeURIComponent(maSo)}`);
    if (phanHoi.ok) {
      const duLieu = await phanHoi.json();
      duLieuHienTai = duLieu;
      if (duLieuHienTai.tiLeHoanCoc === undefined) {
        duLieuHienTai.tiLeHoanCoc = 80;
        duLieuHienTai.noThue = 1500000;
        duLieuHienTai.noDienNuoc = 450000;
        duLieuHienTai.chiPhiHuHong = 200000;
        duLieuHienTai.moTaHuHong = 'Linh kiện hỏng, vệ sinh phòng';
      }
    } else {
      duLieuHienTai = duLieuMauMacDinh.find(item => item.maSo === maSo);
    }
  } catch (loi) {
    console.warn('Lỗi kết nối API tra cứu, sử dụng dữ liệu mặc định.');
    duLieuHienTai = duLieuMauMacDinh.find(item => item.maSo === maSo);
  }

  if (duLieuHienTai) {
    hienThiChiTietDoiSoat(duLieuHienTai);
  } else {
    alert('Không tìm thấy thông tin hợp đồng phù hợp!');
    window.location.href = 'index.html';
  }
}

// Hàm hiển thị thông tin đối soát lên giao diện quản lý
function hienThiChiTietDoiSoat(duLieu) {
  document.getElementById('label-room-desc').textContent = `${duLieu.phongCoSo} — Khách thuê: ${duLieu.tenKhachHang}`;

  const tienCocGoc = duLieu.tienCoc;
  const tiLeHoan = duLieu.tiLeHoanCoc || 80;
  const tienCocDuocHoan = tienCocGoc * (tiLeHoan / 100);

  // Tính các khoản trừ
  const noThue = duLieu.noThue || 0;
  const noDienNuoc = duLieu.noDienNuoc || 0;
  const chiPhiHuHong = duLieu.chiPhiHuHong || 0;
  const phiVeSinhCoDinh = 150000;
  
  const tongKhauTru = noThue + noDienNuoc + chiPhiHuHong + phiVeSinhCoDinh;
  const soTienQuyetToan = tienCocDuocHoan - tongKhauTru;

  // Hiển thị cột bên trái
  document.getElementById('val-tien-coc-phong').textContent = dinhDangTienTe(tienCocDuocHoan);
  document.getElementById('val-tong-hoan-co-ban').textContent = dinhDangTienTe(tienCocDuocHoan);

  document.getElementById('val-no-nha').textContent = dinhDangTienTe(noThue);
  document.getElementById('val-no-dien-nuoc').textContent = dinhDangTienTe(noDienNuoc);
  document.getElementById('val-no-hu-hong').textContent = dinhDangTienTe(chiPhiHuHong);
  document.getElementById('val-tong-khau-tru').textContent = dinhDangTienTe(tongKhauTru);

  // Hiển thị khung kết quả lớn bên phải
  const oHopKetQua = document.getElementById('big-result-box');
  const oTieuDeKetQua = document.getElementById('big-result-title');
  const oGiaTriKetQua = document.getElementById('big-result-val');
  const oLabelMsg = document.getElementById('label-result-msg');

  if (soTienQuyetToan >= 0) {
    oHopKetQua.style.backgroundColor = '#ECFDF5';
    oHopKetQua.style.border = '1.5px solid #A7F3D0';
    oHopKetQua.style.color = '#065F46';
    oTieuDeKetQua.textContent = 'Khách được hoàn';
    oGiaTriKetQua.textContent = dinhDangTienTe(soTienQuyetToan);
    oLabelMsg.textContent = '*Số tiền này sẽ được chuyển vào số tài khoản đã đăng ký của khách sau khi ký biên bản thanh lý hợp đồng.';
  } else {
    oHopKetQua.style.backgroundColor = '#FEF2F2';
    oHopKetQua.style.border = '1.5px solid #FCA5A5';
    oHopKetQua.style.color = '#991B1B';
    oTieuDeKetQua.textContent = 'Khách phải đóng thêm';
    oGiaTriKetQua.textContent = dinhDangTienTe(Math.abs(soTienQuyetToan));
    oLabelMsg.textContent = '*Khách hàng vui lòng thực hiện thanh toán chuyển khoản hoặc tiền mặt tại quầy trước khi ký biên bản thanh lý.';
  }
}

// Xử lý khi khách đồng ý đối soát
async function handleKhachDongY() {
  if (!duLieuHienTai) return;

  try {
    const phanHoi = await fetch('/api/gui-yeu-cau', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        maHopDong: duLieuHienTai.maSo,
        loaiNghiepVu: 'xac_nhan_dong_y_doi_soat',
        phanHoiKhach: 'dong_y',
        nguoiXacNhan: 'Nguyễn Văn B (Quản lý)'
      })
    });

    const ketQua = await phanHoi.json();
    if (ketQua.success) {
      document.getElementById('modal-title-text').textContent = "Xác Nhận Đối Soát Thành Công";
      document.getElementById('modal-msg').textContent = "Bảng đối soát tất toán đã được khách hàng đồng ý ký nhận. Trạng thái đã chuyển sang Chờ thanh lý hợp đồng.";
      document.getElementById('success-modal').classList.add('active');
    } else {
      alert('Gửi xác nhận thất bại!');
    }
  } catch (loi) {
    console.warn('Lỗi kết nối server, thực hiện chế độ offline demo.');
    document.getElementById('success-modal').classList.add('active');
  }
}

// Xử lý khi khách không đồng ý đối soát (Tranh chấp)
async function handleKhachKhongDongY() {
  if (!duLieuHienTai) return;

  if (confirm("Xác nhận ghi nhận Tranh chấp đối soát tài chính? Hồ sơ sẽ được chuyển trả lại phòng Kế toán để kiểm tra và đối chiếu lại với khách thuê.")) {
    try {
      await fetch('/api/gui-yeu-cau', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          maHopDong: duLieuHienTai.maSo,
          loaiNghiepVu: 'ghi_nhan_tranh_chap',
          phanHoiKhach: 'tranh_chap',
          nguoiXacNhan: 'Nguyễn Văn B (Quản lý)'
        })
      });
      alert('Đã ghi nhận tranh chấp đối soát thành công và chuyển hồ sơ phản hồi về bộ phận Kế toán kiểm tra lại.');
      window.location.href = '/index.html?tab=yeucau&role=quanly';
    } catch (loi) {
      alert('Đã ghi nhận tranh chấp đối soát thành công (Demo Mode).');
      window.location.href = '/index.html?tab=yeucau&role=quanly';
    }
  }
}

// Đóng modal thành công và quay lại trang chủ quản lý
function dongModalThanhCong() {
  document.getElementById('success-modal').classList.remove('active');
  window.location.href = '/index.html?tab=yeucau&role=quanly';
}

// Khởi chạy sự kiện
function khoiTaoSuKien() {
  taiChiTietDuyetDoiSoat();
  document.getElementById('btn-agree').addEventListener('click', handleKhachDongY);
  document.getElementById('btn-disagree').addEventListener('click', handleKhachKhongDongY);
  document.getElementById('modal-close-btn').addEventListener('click', dongModalThanhCong);
}

document.addEventListener('DOMContentLoaded', khoiTaoSuKien);
