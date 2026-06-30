// Các phần tử DOM cần thiết
const oTimKiem = document.getElementById('search-input');
const nutTimKiem = document.getElementById('search-btn');

// Biến toàn cục
let danhSachChungTu = [];
let tabHienTai = 'hopdong'; // 'hopdong' hoặc 'yeucau'
let vaiTroHienTai = 'sale'; // 'sale', 'quanly', 'ketoan'

// Dữ liệu mẫu fallback đồng bộ với 4 bước
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
    trangThai: 'Chờ kiểm tra'
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
    trangThai: 'Chờ đối soát'
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
    trangThai: 'Chờ xác nhận đối soát'
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
    trangThai: 'Chờ thanh lý'
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
    trangThai: 'Chờ hoàn cọc'
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
    trangThai: 'Chờ thanh toán'
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

// Hàm tải toàn bộ danh sách hợp đồng/phiếu cọc từ API khi load trang
async function taiDanhSachHopDong() {
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

// Hàm thay đổi vai trò đăng nhập giả lập (Sale / Quản lý / Kế toán)
function doiVaiTro(vaiTro) {
  vaiTroHienTai = vaiTro;
  
  const oRoleTitle = document.getElementById('role-title');
  const oRoleAvatar = document.getElementById('role-avatar');
  
  if (vaiTro === 'sale') {
    oRoleTitle.textContent = 'Chuyên viên Sale';
    oRoleAvatar.textContent = 'A';
    oRoleAvatar.style.backgroundColor = 'var(--primary)'; // màu cam
  } else if (vaiTro === 'quanly') {
    oRoleTitle.textContent = 'Quản lý chi nhánh';
    oRoleAvatar.textContent = 'B';
    oRoleAvatar.style.backgroundColor = '#3B82F6'; // màu xanh dương
  } else {
    oRoleTitle.textContent = 'Kế toán trưởng';
    oRoleAvatar.textContent = 'C';
    oRoleAvatar.style.backgroundColor = '#10B981'; // màu xanh lá
  }

  hienThiDanhSach(danhSachChungTu);
}

// Hàm chuyển tab dữ liệu (Hợp đồng vs Yêu cầu trả phòng)
function chuyenTab(tenTab) {
  tabHienTai = tenTab;
  
  // Cập nhật class active cho nút tab
  document.getElementById('tab-hopdong').classList.toggle('active', tenTab === 'hopdong');
  document.getElementById('tab-yeucau').classList.toggle('active', tenTab === 'yeucau');

  const oTieuDeBang = document.getElementById('card-list-title');
  const oDauBang = document.getElementById('table-header');

  if (tenTab === 'hopdong') {
    oTieuDeBang.textContent = 'Danh sách Hợp đồng & Phiếu đặt cọc';
    oDauBang.innerHTML = `
      <tr>
        <th>Mã số</th>
        <th>Loại</th>
        <th>Khách thuê</th>
        <th>Phòng / Cơ sở</th>
        <th>Giá thuê</th>
        <th>Trạng thái</th>
        <th style="text-align: center; width: 180px;">Hành động</th>
      </tr>
    `;
  } else {
    oTieuDeBang.textContent = 'Danh sách Yêu cầu trả phòng chờ xử lý';
    oDauBang.innerHTML = `
      <tr>
        <th>Mã phiếu yêu cầu</th>
        <th>Khách thuê</th>
        <th>Phòng / Cơ sở</th>
        <th>Trạng thái quy trình</th>
        <th style="text-align: center; width: 240px;">Hành động</th>
      </tr>
    `;
  }

  hienThiDanhSach(danhSachChungTu);
}

// Hàm hiển thị danh sách chứng từ lên bảng HTML tùy thuộc vào Tab và Vai trò hiện tại
function hienThiDanhSach(danhSach) {
  const oThanBang = document.getElementById('table-body');
  if (!oThanBang) return;

  // Lọc danh sách theo tab hiện tại
  let danhSachLoc = [];
  if (tabHienTai === 'hopdong') {
    danhSachLoc = danhSach.filter(item => item.trangThai === 'Hiệu lực' || item.trangThai === 'Chưa ký hợp đồng');
  } else {
    danhSachLoc = danhSach.filter(item => 
      item.trangThai === 'Chờ kiểm tra' || 
      item.trangThai === 'Chờ đối soát' || 
      item.trangThai === 'Chờ thanh lý' || 
      item.trangThai === 'Chờ hoàn cọc' || 
      item.trangThai === 'Chờ thanh toán' || 
      item.trangThai === 'Đã thanh lý'
    );
  }
  
  if (danhSachLoc.length === 0) {
    oThanBang.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">Không có dữ liệu phù hợp</td></tr>`;
    return;
  }
  
  let noiDungHtml = '';
  
  danhSachLoc.forEach(item => {
    if (tabHienTai === 'hopdong') {
      const loaiNhan = item.loai === 'hop_dong' ? 'Hợp đồng' : 'Phiếu đặt cọc';
      const classTrangThai = item.loai === 'hop_dong' ? 'badge badge-active' : 'badge badge-pending';
      
      // Chỉ Sale mới có quyền nhấn nút "Trả phòng"
      let nutTraPhongHtml = '';
      if (vaiTroHienTai === 'sale') {
        nutTraPhongHtml = `<button type="button" class="btn-table btn-table-checkout" onclick="chuyenSangTaoYeuCau('${item.maSo}')">Trả phòng</button>`;
      } else {
        nutTraPhongHtml = `<button type="button" class="btn-table btn-table-checkout" style="background-color: var(--border-color); color: var(--text-muted); cursor: not-allowed;" disabled>Trả phòng</button>`;
      }

      noiDungHtml += `
        <tr>
          <td style="font-weight: 700; color: var(--primary);">${item.maSo}</td>
          <td>${loaiNhan}</td>
          <td style="font-weight: 700;">${item.tenKhachHang}</td>
          <td>${item.phongCoSo}</td>
          <td>${dinhDangTienTe(item.giaThue)}</td>
          <td><span class="${classTrangThai}">${item.trangThai}</span></td>
          <td style="text-align: center; white-space: nowrap;">
            <button type="button" class="btn-table btn-table-view" onclick="xemChiTietHĐ('${item.maSo}')">Xem</button>
            ${nutTraPhongHtml}
          </td>
        </tr>
      `;
    } else {
      // Tab Yêu cầu trả phòng chờ xử lý
      const maPhieu = `YCTP-${item.maSo.split('-')[2] || '987216'}`;
      
      let classTrangThai = 'badge';
      let nutXuLyHtml = '';
      
      // XÁC ĐỊNH CLASS TRẠNG THÁI
      if (item.trangThai === 'Chờ kiểm tra' || item.trangThai === 'Chờ xác nhận đối soát') {
        classTrangThai += ' badge-pending';
      } else if (item.trangThai === 'Chờ đối soát' || item.trangThai === 'Chờ thanh lý') {
        classTrangThai += ' badge-active';
      } else if (item.trangThai === 'Chờ hoàn cọc' || item.trangThai === 'Chờ thanh toán') {
        classTrangThai += ' badge-active';
      } else {
        classTrangThai += ' badge-active';
      }

      // PHÂN QUYỀN ĐỘNG NÚT BẤM THEO VAI TRÒ
      if (vaiTroHienTai === 'sale') {
        // SALE: Chỉ xem và theo dõi trạng thái, không thể thao tác nút xử lý
        if (item.trangThai === 'Chờ kiểm tra') {
          nutXuLyHtml = `<span style="font-size: 12px; font-weight: 700; color: #D97706; background-color: #FEF3C7; padding: 6px 12px; border-radius: 4px;">Đang chờ kiểm tra</span>`;
        } else if (item.trangThai === 'Chờ đối soát') {
          nutXuLyHtml = `<span style="font-size: 12px; font-weight: 700; color: #059669; background-color: #D1FAE5; padding: 6px 12px; border-radius: 4px;">Đang chờ đối soát</span>`;
        } else if (item.trangThai === 'Chờ xác nhận đối soát') {
          nutXuLyHtml = `<span style="font-size: 12px; font-weight: 700; color: #D97706; background-color: #FEF3C7; padding: 6px 12px; border-radius: 4px;">Đang chờ duyệt đối soát</span>`;
        } else if (item.trangThai === 'Chờ thanh lý') {
          nutXuLyHtml = `<span style="font-size: 12px; font-weight: 700; color: #2563EB; background-color: #DBEAFE; padding: 6px 12px; border-radius: 4px;">Đang chờ thanh lý</span>`;
        } else if (item.trangThai === 'Chờ hoàn cọc' || item.trangThai === 'Chờ thanh toán') {
          nutXuLyHtml = `<span style="font-size: 12px; font-weight: 700; color: #059669; background-color: #D1FAE5; padding: 6px 12px; border-radius: 4px;">Đang chờ hoàn trả/thu tiền</span>`;
        } else {
          nutXuLyHtml = `<span style="font-size: 12px; font-weight: 700; color: var(--text-muted); background-color: var(--border-color); padding: 6px 12px; border-radius: 4px;">Trả phòng thành công</span>`;
        }
      } else if (vaiTroHienTai === 'quanly') {
        // QUẢN LÝ: Chỉ thực hiện kiểm tra phòng hoặc thanh lý hợp đồng hoặc duyệt đối soát
        if (item.trangThai === 'Chờ kiểm tra') {
          nutXuLyHtml = `<button type="button" class="btn-table btn-table-checkout" style="background-color: #F59E0B;" onclick="chuyenSangKiemTraPhong('${item.maSo}')">Kiểm tra phòng</button>`;
        } else if (item.trangThai === 'Chờ xác nhận đối soát') {
          nutXuLyHtml = `<button type="button" class="btn-table btn-table-checkout" style="background-color: #F59E0B;" onclick="chuyenSangXacNhanDoiSoat('${item.maSo}')">Xác nhận đối soát</button>`;
        } else if (item.trangThai === 'Chờ thanh lý') {
          nutXuLyHtml = `<button type="button" class="btn-table btn-table-checkout" style="background-color: #3B82F6;" onclick="chuyenSangThanhLy('${item.maSo}')">Thanh lý HĐ</button>`;
        } else if (item.trangThai === 'Chờ đối soát') {
          nutXuLyHtml = `<span style="font-size: 12px; font-weight: 700; color: #059669;">Chờ Kế toán đối soát</span>`;
        } else if (item.trangThai === 'Chờ hoàn cọc' || item.trangThai === 'Chờ thanh toán') {
          nutXuLyHtml = `<span style="font-size: 12px; font-weight: 700; color: #059669;">Chờ Kế toán hoàn cọc</span>`;
        } else {
          nutXuLyHtml = `<span style="font-size: 12px; font-weight: 700; color: var(--text-muted);">Đã hoàn tất</span>`;
        }
      } else if (vaiTroHienTai === 'ketoan') {
        // KẾ TOÁN: Chỉ thực hiện lập phiếu đối soát tài chính hoặc hoàn cọc/thu tiền
        if (item.trangThai === 'Chờ đối soát') {
          nutXuLyHtml = `<button type="button" class="btn-table btn-table-checkout" style="background-color: #10B981;" onclick="chuyenSangDoiSoat('${item.maSo}')">Lập phiếu đối soát</button>`;
        } else if (item.trangThai === 'Chờ hoàn cọc' || item.trangThai === 'Chờ thanh toán') {
          nutXuLyHtml = `<button type="button" class="btn-table btn-table-checkout" style="background-color: #059669;" onclick="chuyenSangHoanCoc('${item.maSo}')">Hoàn cọc / Thu tiền</button>`;
        } else if (item.trangThai === 'Chờ kiểm tra') {
          nutXuLyHtml = `<span style="font-size: 12px; font-weight: 700; color: #D97706;">Chờ Quản lý kiểm tra</span>`;
        } else if (item.trangThai === 'Chờ xác nhận đối soát') {
          nutXuLyHtml = `<span style="font-size: 12px; font-weight: 700; color: #D97706;">Chờ Quản lý xác nhận</span>`;
        } else if (item.trangThai === 'Chờ thanh lý') {
          nutXuLyHtml = `<span style="font-size: 12px; font-weight: 700; color: #2563EB;">Chờ Quản lý thanh lý</span>`;
        } else {
          nutXuLyHtml = `<span style="font-size: 12px; font-weight: 700; color: var(--text-muted);">Đã hoàn tất</span>`;
        }
      }

      noiDungHtml += `
        <tr>
          <td style="font-weight: 700; color: var(--primary);">${maPhieu}</td>
          <td style="font-weight: 700;">${item.tenKhachHang}</td>
          <td>${item.phongCoSo}</td>
          <td><span class="${classTrangThai}">${item.trangThai}</span></td>
          <td style="text-align: center; white-space: nowrap;">
            <button type="button" class="btn-table btn-table-view" onclick="xemChiTietPhieuYeuCau('${item.maSo}')">Xem phiếu</button>
            ${nutXuLyHtml}
          </td>
        </tr>
      `;
    }
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

// --- Các hàm chuyển hướng / liên kết trang ---
function xemChiTietHĐ(maSo) {
  window.location.href = `/TatCa_ChiTietHopDong.html?id=${encodeURIComponent(maSo)}`;
}

function xemChiTietPhieuYeuCau(maSo) {
  window.location.href = `/TatCa_XemPhieuYeuCau.html?id=${encodeURIComponent(maSo)}`;
}

function chuyenSangTaoYeuCau(maSo) {
  window.location.href = `/Sale_TiepNhanTraPhong.html?id=${encodeURIComponent(maSo)}`;
}

function chuyenSangKiemTraPhong(maSo) {
  window.location.href = `/QuanLy_KiemTraPhong.html?id=${encodeURIComponent(maSo)}`;
}

function chuyenSangDoiSoat(maSo) {
  window.location.href = `/KeToan_LapPhieuDoiSoat.html?id=${encodeURIComponent(maSo)}`;
}

function chuyenSangThanhLy(maSo) {
  window.location.href = `/QuanLy_ThanhLyHopDong.html?id=${encodeURIComponent(maSo)}`;
}

function chuyenSangHoanCoc(maSo) {
  window.location.href = `/KeToan_HoanCocThuTien.html?id=${encodeURIComponent(maSo)}`;
}

function chuyenSangXacNhanDoiSoat(maSo) {
  window.location.href = `/QuanLy_XacNhanDoiSoat.html?id=${encodeURIComponent(maSo)}`;
}

// Xuất các hàm ra window namespace
window.doiVaiTro = doiVaiTro;
window.chuyenTab = chuyenTab;
window.xemChiTietHĐ = xemChiTietHĐ;
window.xemChiTietPhieuYeuCau = xemChiTietPhieuYeuCau;
window.chuyenSangTaoYeuCau = chuyenSangTaoYeuCau;
window.chuyenSangKiemTraPhong = chuyenSangKiemTraPhong;
window.chuyenSangDoiSoat = chuyenSangDoiSoat;
window.chuyenSangThanhLy = chuyenSangThanhLy;
window.chuyenSangHoanCoc = chuyenSangHoanCoc;
window.chuyenSangXacNhanDoiSoat = chuyenSangXacNhanDoiSoat;

// Hàm khởi tạo và gán các sự kiện
function khoiTaoSuKien() {
  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get('tab');
  const roleParam = urlParams.get('role');
  
  taiDanhSachHopDong().then(() => {
    if (tabParam === 'yeucau') {
      chuyenTab('yeucau');
    }
    if (roleParam) {
      document.getElementById('role-select').value = roleParam;
      doiVaiTro(roleParam);
    }
  });

  nutTimKiem.addEventListener('click', locDanhSach);
  oTimKiem.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      locDanhSach();
    }
  });
  oTimKiem.addEventListener('input', locDanhSach);
}

document.addEventListener('DOMContentLoaded', khoiTaoSuKien);
