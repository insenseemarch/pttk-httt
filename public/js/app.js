// Các phần tử DOM cần thiết
const oTimKiem = document.getElementById('search-input');
const nutTimKiem = document.getElementById('search-btn');
const hopChuaLoi = document.getElementById('error-box');
const khongGianLamViec = document.getElementById('checkout-workspace');

// Biến toàn cục chứa danh sách toàn bộ hợp đồng / phiếu cọc
let danhSachChungTu = [];

// Hàm tải toàn bộ danh sách hợp đồng/phiếu cọc từ API khi load trang
async function taiDanhSachHopDong() {
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

  try {
    const phanHoi = await fetch('/api/danh-sach');
    if (phanHoi.ok) {
      const danhSach = await phanHoi.json();
      danhSachChungTu = danhSach;
    } else {
      danhSachChungTu = duLieuMauMacDinh;
    }
  } catch (loi) {
    console.warn('Không thể kết nối API danh sách, sử dụng dữ liệu mặc định.');
    danhSachChungTu = duLieuMauMacDinh;
  }
  hienThiDanhSach(danhSachChungTu);
}


// Hàm hiển thị danh sách hợp đồng/phiếu cọc lên bảng HTML
function hienThiDanhSach(danhSach) {
  const oThanBang = document.getElementById('table-body');
  if (!oThanBang) return;
  
  if (danhSach.length === 0) {
    oThanBang.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">Không có dữ liệu phù hợp</td></tr>`;
    return;
  }
  
  let noiDungHtml = '';
  danhSach.forEach(item => {
    const loaiNhan = item.loai === 'hop_dong' ? 'Hợp đồng' : 'Phiếu đặt cọc';
    const trangThaiNhanClass = item.loai === 'hop_dong' ? 'badge badge-active' : 'badge badge-pending';
    
    noiDungHtml += `
      <tr>
        <td style="font-weight: 700; color: var(--primary);">${item.maSo}</td>
        <td>${loaiNhan}</td>
        <td style="font-weight: 700;">${item.tenKhachHang}</td>
        <td>${item.phongCoSo}</td>
        <td>${dinhDangTienTe(item.giaThue)}</td>
        <td><span class="${trangThaiNhanClass}">${item.trangThai}</span></td>
        <td style="text-align: center; white-space: nowrap;">
          <button type="button" class="btn-table btn-table-view" onclick="xemChiTiet('${item.maSo}')">Xem</button>
          <button type="button" class="btn-table btn-table-checkout" onclick="chuyenSangGiaoDienTraPhong('${item.maSo}')">Trả phòng</button>
        </td>
      </tr>
    `;
  });
  
  oThanBang.innerHTML = noiDungHtml;
}

// Hàm lọc danh sách hợp đồng khi người dùng gõ vào thanh tìm kiếm (Real-time Filter)
function locDanhSach() {
  const tuKhoa = oTimKiem.value.trim().toLowerCase();
  if (!tuKhoa) {
    hienThiDanhSach(danhSachChungTu);
    return;
  }
  
  const danhSachLoc = danhSachChungTu.filter(item => 
    item.maSo.toLowerCase().includes(tuKhoa) ||
    item.tenKhachHang.toLowerCase().includes(tuKhoa) ||
    item.phongCoSo.toLowerCase().includes(tuKhoa)
  );
  
  hienThiDanhSach(danhSachLoc);
}

// Hàm xem chi tiết hợp đồng khi nhấn nút "Xem"
function xemChiTiet(maSo) {
  oTimKiem.value = maSo;
  traCuuThongTin();
  setTimeout(() => {
    const oWorkspace = document.getElementById('checkout-workspace');
    if (oWorkspace.classList.contains('active')) {
      oWorkspace.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 300);
}

// Hàm chuyển sang giao diện trả phòng khi nhấn nút "Trả phòng"
function chuyenSangGiaoDienTraPhong(maSo) {
  oTimKiem.value = maSo;
  traCuuThongTin();
  setTimeout(() => {
    const oFormCard = document.querySelector('.form-card');
    if (oFormCard) {
      oFormCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 400);
}

// Xuất các hàm ra phạm vi window để gọi được từ inline HTML onclick
window.xemChiTiet = xemChiTiet;
window.chuyenSangGiaoDienTraPhong = chuyenSangGiaoDienTraPhong;


// Hàm định dạng số tiền thành VND (ví dụ: 13.000.000 VNĐ)
function dinhDangTienTe(soTien) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
    .format(soTien)
    .replace('₫', 'VNĐ');
}

// Hàm tính toán khoảng cách thời gian giữa hai ngày (trả về tháng và ngày lẻ)
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
    // Lấy số ngày của tháng trước đó
    const ngayTrongThangTruoc = new Date(ngayKetThuc.getFullYear(), ngayKetThuc.getMonth(), 0).getDate();
    ngayChenhLech += ngayTrongThangTruoc;
  }
  
  return {
    thang: thangChenhLech,
    ngay: ngayChenhLech
  };
}

// Hàm hiển thị hộp thông báo lỗi
function hienThiLoi(tinNhan) {
  hopChuaLoi.textContent = tinNhan;
  hopChuaLoi.style.display = 'flex';
  khongGianLamViec.classList.remove('active');
}

// Hàm ẩn hộp thông báo lỗi
function anLoi() {
  hopChuaLoi.style.display = 'none';
}

// Biến toàn cục lưu trữ dữ liệu tìm thấy hiện tại
let duLieuHienTai = null;

// Hàm tra cứu thông tin hợp đồng hoặc phiếu đặt cọc từ API
async function traCuuThongTin() {
  const tuKhoa = oTimKiem.value.trim();
  if (!tuKhoa) {
    hienThiLoi('Vui lòng nhập mã hợp đồng, mã đặt cọc hoặc tên khách hàng!');
    return;
  }

  function timKiemCucBo() {
    const tuKhoaThuong = tuKhoa.toLowerCase();
    return danhSachChungTu.find(item => 
      item.maSo.toLowerCase().includes(tuKhoaThuong) ||
      item.tenKhachHang.toLowerCase().includes(tuKhoaThuong)
    );
  }

  try {
    const phanHoi = await fetch(`/api/tra-cuu?query=${encodeURIComponent(tuKhoa)}`);
    if (phanHoi.ok) {
      const duLieu = await phanHoi.json();
      anLoi();
      duLieuHienTai = duLieu;
      hienThiGiaoDien(duLieu);
      return;
    }
  } catch (loi) {
    console.warn('Lỗi kết nối API tra cứu, chuyển sang tìm kiếm cục bộ.');
  }

  // Fallback sang tìm kiếm dữ liệu có sẵn tại client
  const ketQuaCucBo = timKiemCucBo();
  if (ketQuaCucBo) {
    anLoi();
    duLieuHienTai = ketQuaCucBo;
    hienThiGiaoDien(ketQuaCucBo);
  } else {
    hienThiLoi('Không tìm thấy thông tin hợp đồng hoặc phiếu đặt cọc phù hợp!');
  }
}

// Hàm cập nhật và hiển thị giao diện động sau khi tra cứu thành công
function hienThiGiaoDien(duLieu) {
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

    // Ngày bắt đầu, Ngày kết thúc và Ngày hôm nay
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
      phanTramTienTrinh = Math.max(0, Math.min(100, phanTramTienTrinh)); // Giới hạn từ 0 - 100
    }

    document.getElementById('timeline-bar').style.width = `${phanTramTienTrinh}%`;
    document.getElementById('point-today').style.left = `${phanTramTienTrinh}%`;

    // Tính toán số ngày đã ở và còn lại (từ ngày bắt đầu đến hôm nay)
    const khoangCachDaO = tinhKhoangCachThoiGian(duLieu.ngayBatDau, ngayHomNayText);
    const khoangCachConLai = tinhKhoangCachThoiGian(ngayHomNayText, duLieu.ngayKetThuc);

    document.getElementById('stat-tong-thoi-gian').textContent = '12 tháng';
    document.getElementById('stat-da-o').textContent = `${khoangCachDaO.thang} tháng ${khoangCachDaO.ngay} ngày`;
    document.getElementById('stat-con-lai').textContent = `${khoangCachConLai.thang} tháng ${khoangCachConLai.ngay} ngày`;
  } else {
    // Nếu là đặt cọc chưa ký hợp đồng: Ẩn timeline
    khungTimeline.style.display = 'none';
    khungThongTinCocTraPhong.style.display = 'none';
  }

  // 3. Khởi tạo giá trị mặc định cho Form
  const oNgayTra = document.getElementById('input-ngay-tra');
  // Mặc định chọn ngày trả dự kiến là ngày hôm nay + 7 ngày
  const ngayTuongLai = new Date();
  ngayTuongLai.setDate(ngayTuongLai.getDate() + 7);
  oNgayTra.value = ngayTuongLai.toISOString().split('T')[0];

  // Reset form nhập liệu
  document.getElementById('input-ly-do').value = '';
  document.getElementById('radio-ck').checked = true;

  // Thực hiện tính toán chính sách hoàn trả
  tinhToanNghiepVuTraPhong();

  // Hiển thị khung làm việc chính
  khongGianLamViec.classList.add('active');
}

// Hàm phụ định dạng ngày YYYY-MM-DD sang DD/MM/YYYY
function dinhDangNgay(chuoiNgay) {
  if (!chuoiNgay) return '';
  const [nam, thang, ngay] = chuoiNgay.split('-');
  return `${ngay}/${thang}/${nam}`;
}

// Hàm thực thi các tính toán nghiệp vụ khi thay đổi Ngày trả dự kiến hoặc Loại hình
function tinhToanNghiepVuTraPhong() {
  if (!duLieuHienTai) return;

  const oNgayTra = document.getElementById('input-ngay-tra');
  const oLoaiHinh = document.getElementById('input-loai-hinh');
  const oLoiLyDo = document.getElementById('ly-do-wrapper');
  const oNhanLoiLyDo = document.getElementById('label-ly-do-required');
  const oCaiCanhBao = document.getElementById('alert-box');
  const oNhanTieuDeCanhBao = document.getElementById('alert-title');
  const oNoiDungCanhBao = document.getElementById('alert-text');

  const ngayTraYeuCau = oNgayTra.value;

  if (duLieuHienTai.loai === 'hop_dong') {
    const ngayHetHanHĐ = duLieuHienTai.ngayKetThuc;

    // 1. Tự động xác định Loại hình trả phòng dựa vào ngày trả dự kiến so với hạn hợp đồng
    if (ngayTraYeuCau >= ngayHetHanHĐ) {
      oLoaiHinh.value = 'dung_han';
      oLoiLyDo.classList.remove('required');
      oNhanLoiLyDo.style.display = 'none';
      
      // Hoàn cọc 100% khi đúng hạn
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

      // Tính khoảng thời gian từ ngày bắt đầu đến ngày trả dự kiến để biết số tháng đã ở
      const khoangCachLuuTru = tinhKhoangCachThoiGian(duLieuHienTai.ngayBatDau, ngayTraYeuCau);
      const tongSoThangDaO = khoangCachLuuTru.thang;

      let phanTramHoan = 0;
      let phanTramPhat = 0;

      if (tongSoThangDaO < 6) {
        phanTramHoan = 50; // Hoàn 50%
        phanTramPhat = 50; // Phạt khấu trừ 50%
      } else {
        phanTramHoan = 70; // Hoàn 70%
        phanTramPhat = 30; // Phạt khấu trừ 30%
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
    // Nếu là đặt cọc chưa ký hợp đồng: Áp dụng chính sách hủy cọc hoàn cọc 80%
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

  const oNgayTra = document.getElementById('input-ngay-tra');
  const oLoaiHinh = document.getElementById('input-loai-hinh');
  const oLyDo = document.getElementById('input-ly-do');
  const phuongThucHoan = document.querySelector('input[name="phuong-thuc"]:checked').value;

  // Kiểm tra biểu mẫu bắt buộc
  if (!oNgayTra.value) {
    alert('Vui lòng chọn ngày trả phòng dự kiến!');
    return;
  }

  // Nếu trả trước hạn hoặc hủy đặt cọc, bắt buộc nhập lý do
  if ((oLoaiHinh.value === 'truoc_han' || oLoaiHinh.value === 'huy_thue') && !oLyDo.value.trim()) {
    alert('Vui lòng nhập chi tiết lý do trả phòng trước hạn hoặc lý do hủy thuê!');
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
    alert('Không thể gửi dữ liệu lên máy chủ!');
  }
}

// Hàm hiển thị modal xác nhận thành công
function hienThiModalThanhCong(maYeuCau, thongDiep) {
  const modal = document.getElementById('success-modal');
  document.getElementById('modal-req-code').textContent = maYeuCau;
  document.getElementById('modal-msg').textContent = thongDiep;
  modal.classList.add('active');
}

// Hàm đóng modal thành công và reset giao diện
function dongModalThanhCong() {
  const modal = document.getElementById('success-modal');
  modal.classList.remove('active');
  oTimKiem.value = '';
  taiDanhSachHopDong(); // Tải lại danh sách
  khongGianLamViec.classList.remove('active');
}

// Hàm khởi tạo và gán các sự kiện
function khoiTaoSuKien() {
  // Gán sự kiện tìm kiếm
  nutTimKiem.addEventListener('click', traCuuThongTin);
  oTimKiem.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      traCuuThongTin();
    }
  });

  // Tải danh sách hợp đồng ban đầu
  taiDanhSachHopDong();

  // Gán sự kiện lọc thời gian thực khi gõ phím
  oTimKiem.addEventListener('input', locDanhSach);

  // Gán sự kiện thay đổi ngày trả phòng dự kiến
  document.getElementById('input-ngay-tra').addEventListener('change', tinhToanNghiepVuTraPhong);

  // Gán sự kiện gửi form
  document.getElementById('checkout-form').addEventListener('submit', guiYeuCauTraPhong);

  // Gán sự kiện nút đóng modal
  document.getElementById('modal-close-btn').addEventListener('click', dongModalThanhCong);
}

// Chạy khởi tạo khi trang đã sẵn sàng
document.addEventListener('DOMContentLoaded', khoiTaoSuKien);
