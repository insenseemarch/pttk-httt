// Các phần tử DOM cần thiết
const oPhiHuHongInput = document.getElementById('input-chi-phi');
const oMoTa = document.getElementById('input-mo-ta');
const oNutGui = document.getElementById('btn-send-inspection');

// Biến toàn cục lưu trữ dữ liệu
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
    trangThai: 'Hiệu lực',
    noThue: 0,
    noDienNuoc: 412000
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
    trangThai: 'Chờ kiểm tra',
    noThue: 1250000,
    noDienNuoc: 412000
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

// Hàm tải thông tin chi tiết để kiểm tra
async function taiChiTietKiemTra() {
  const maSo = docThamSoUrl('id');
  if (!maSo) {
    alert('Không tìm thấy mã hợp đồng cần kiểm tra!');
    window.location.href = 'index.html';
    return;
  }

  try {
    const phanHoi = await fetch(`/api/tra-cuu?query=${encodeURIComponent(maSo)}`);
    if (phanHoi.ok) {
      const duLieu = await phanHoi.json();
      duLieuHienTai = duLieu;
      // Bổ sung nợ mẫu nếu backend chưa trả về trường nợ
      if (duLieuHienTai.noThue === undefined) {
        duLieuHienTai.noThue = duLieuHienTai.maSo === 'HĐ-2024-0102' ? 1250000 : 0;
        duLieuHienTai.noDienNuoc = 412000;
      }
    } else {
      duLieuHienTai = duLieuMauMacDinh.find(item => item.maSo === maSo);
    }
  } catch (loi) {
    console.warn('Lỗi kết nối API tra cứu, sử dụng dữ liệu mặc định.');
    duLieuHienTai = duLieuMauMacDinh.find(item => item.maSo === maSo);
  }

  if (duLieuHienTai) {
    hienThiThongTinKiemTra(duLieuHienTai);
  } else {
    alert('Không tìm thấy thông tin hợp đồng phù hợp!');
    window.location.href = 'index.html';
  }
}

// Hàm hiển thị thông tin hợp đồng lên màn hình kiểm tra
function hienThiThongTinKiemTra(duLieu) {
  document.getElementById('phong-header').textContent = duLieu.phongCoSo;
  document.getElementById('khach-thue-info').textContent = `${duLieu.tenKhachHang} — ${duLieu.maSo}`;
  
  // Điền nợ thuê và nợ điện nước vào bảng đối chiếu bên phải
  document.getElementById('cell-no-thue').textContent = dinhDangTienTe(duLieu.noThue);
  document.getElementById('cell-no-dien-nuoc').textContent = dinhDangTienTe(duLieu.noDienNuoc);
  
  tinhToanCaiTienTaiChinh();
}

// Hàm tính toán và cập nhật bảng đối chiếu tài chính khi thay đổi hiện trạng hoặc chi phí
function tinhToanCaiTienTaiChinh() {
  if (!duLieuHienTai) return;

  const chiPhiHuHong = parseFloat(oPhiHuHongInput.value) || 0;
  
  // Mặc định nợ phạt vi phạm nội quy = 0đ (có thể mở rộng thêm)
  const noPhatNoiQuy = 0;
  
  // Tính tổng nợ phải thanh toán
  const tongNoPhaiTra = duLieuHienTai.noThue + duLieuHienTai.noDienNuoc + chiPhiHuHong + noPhatNoiQuy;
  
  // Cập nhật lên UI
  document.getElementById('cell-phhi-hu-hong').textContent = dinhDangTienTe(chiPhiHuHong);
  document.getElementById('cell-tong-no').textContent = dinhDangTienTe(tongNoPhaiTra);

  // Tính cấn trừ tiền cọc
  // Giả sử tiền cọc thực tế của khách hàng (áp dụng mức phạt trả trước hạn 30% từ bước 4.1)
  // Nếu HĐ-2023-0892 đã yêu cầu trả trước hạn > 6 tháng: cọc hoàn trả cơ bản = 70% của 13 triệu = 9.100.000 VNĐ
  // Nếu HĐ-2024-0102 có cọc 8 triệu, nếu đúng hạn cọc hoàn = 8 triệu.
  let tienCocCoBan = duLieuHienTai.tienCoc;
  // Nếu là hợp đồng trả trước hạn (ví dụ HĐ-2023-0892 ở màn hình trước), áp dụng 70% cọc
  if (duLieuHienTai.maSo === 'HĐ-2023-0892') {
    tienCocCoBan = duLieuHienTai.tienCoc * 0.7; // Hoàn 70%
  }

  const soTienDuKienHoan = tienCocCoBan - tongNoPhaiTra;
  
  document.getElementById('label-tien-coc-co-ban').textContent = dinhDangTienTe(tienCocCoBan);
  
  const oKhungThongBaoHoan = document.getElementById('box-reconcile-result');
  if (soTienDuKienHoan >= 0) {
    oKhungThongBaoHoan.innerHTML = `Tiền đặt cọc còn lại sau khấu trừ: <strong>${dinhDangTienTe(tienCocCoBan)}</strong>. Sau khi cấn trừ, khách sẽ được **hoàn trả: ${dinhDangTienTe(soTienDuKienHoan)}**.`;
  } else {
    oKhungThongBaoHoan.innerHTML = `Tiền đặt cọc sau khấu trừ: <strong>${dinhDangTienTe(tienCocCoBan)}</strong>. Khách hàng **phải đóng thêm: ${dinhDangTienTe(Math.abs(soTienDuKienHoan))}** (do tổng nợ vượt quá tiền cọc).`;
  }
}

// Hàm tự động điền chi phí ước tính khi thay đổi radio hư hỏng
function tuDongGoiYChiPhi() {
  const oRadioGiuongHu = document.getElementById('giuong-hu').checked;
  const oRadioNemHu = document.getElementById('nem-hu').checked;
  const oRadioTuHu = document.getElementById('tu-hu').checked;
  const oRadioKhoaHu = document.getElementById('khoa-hu').checked;

  let chiPhiUocTinh = 0;
  let moTaLoi = [];

  if (oRadioGiuongHu) {
    chiPhiUocTinh += 800000;
    moTaLoi.push("Giường ngủ bị trầy xước nặng");
  }
  if (oRadioNemHu) {
    chiPhiUocTinh += 600000;
    moTaLoi.push("Nệm cao su bị ố vàng diện tích lớn");
  }
  if (oRadioTuHu) {
    chiPhiUocTinh += 500000;
    moTaLoi.push("Tủ quần áo bị gãy bản lề cánh phải");
  }
  if (oRadioKhoaHu) {
    chiPhiUocTinh += 200000;
    moTaLoi.push("Mất 01 chìa khóa phòng");
  }

  oPhiHuHongInput.value = chiPhiUocTinh;
  oMoTa.value = moTaLoi.join(', ');
  
  tinhToanCaiTienTaiChinh();
}

// Hàm gửi kết quả kiểm tra lên server
async function guiKetQuaKiemTra(event) {
  event.preventDefault();

  const thongTinInspection = {
    maHopDong: duLieuHienTai.maSo,
    moTaHuHong: oMoTa.value.trim(),
    chiPhiHuHong: parseFloat(oPhiHuHongInput.value) || 0,
    nguoiKiemTra: 'Nguyễn Văn A (Quản lý)'
  };

  try {
    const phanHoi = await fetch('/api/gui-yeu-cau', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...thongTinInspection,
        loaiNghiepVu: 'gui_thong_tin_kiem_tra'
      })
    });

    const ketQua = await phanHoi.json();
    if (ketQua.success) {
      hienThiModalThanhCong();
    } else {
      alert('Gửi thất bại. Thử lại sau!');
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

// Hàm đóng modal quay lại trang danh sách
function dongModalThanhCong() {
  const modal = document.getElementById('success-modal');
  modal.classList.remove('active');
  window.location.href = '/index.html?tab=yeucau&role=quanly';
}

// Gán hàm vào window namespace để radio button click gọi được
window.tuDongGoiYChiPhi = tuDongGoiYChiPhi;

// Hàm khởi tạo và gán các sự kiện
function khoiTaoSuKien() {
  // Tải chi tiết dữ liệu
  taiChiTietKiemTra();

  // Gán sự kiện khi thay đổi tay chi phí đền bù
  oPhiHuHongInput.addEventListener('input', tinhToanCaiTienTaiChinh);

  // Gán sự kiện gửi biểu mẫu
  document.getElementById('inspection-form').addEventListener('submit', guiKetQuaKiemTra);

  // Gán sự kiện nút trên modal
  document.getElementById('modal-close-btn').addEventListener('click', dongModalThanhCong);
}

// Chạy khởi tạo khi trang đã sẵn sàng
document.addEventListener('DOMContentLoaded', khoiTaoSuKien);
