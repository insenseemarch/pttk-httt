export const ROUTES = {
  trangChu: '/',
  dangNhap: '/dang-nhap',
  quenMatKhau: '/quen-mat-khau',
  dashboard: '/dashboard',
  phongGiuong: '/phong-giuong',
  soDoPhong: '/so-do-phong',
  khachHang: '/khach-hang',
  hopDong: '/hop-dong',
  tiepNhanDangKyThue: '/tiep-nhan-dang-ky-thue',
  lichHen: '/lich-hen',
  thuChi: '/thu-chi',
  thongBao: '/thong-bao',
  quanLyTaiKhoan: '/quan-ly-tai-khoan',
  checkout: '/checkout',
  deposit: '/dat-coc',
  nhanPhong: '/nhan-phong',
  kiemTraLuuTru: '/kiem-tra-luu-tru',
  lapHopDong: '/lap-hop-dong',
  staffPayment: '/staff-payment',
  banGiao: '/ban-giao',
};

export const KHOA_NGUOI_DUNG = 'homestay_nguoiDung';

export const MENU_NHAN_VIEN = [
  { key: 'dashboard', label: 'Dashboard', path: ROUTES.dashboard },
  { key: 'phongGiuong', label: 'Tra cứu phòng/giường', path: ROUTES.phongGiuong },
  { key: 'soDoPhong', label: 'Sơ đồ phòng', path: ROUTES.soDoPhong },
  { key: 'khachHang', label: 'Khách hàng', path: ROUTES.khachHang },
  { key: 'hopDong', label: 'Hợp đồng', path: ROUTES.hopDong },
  { key: 'deposit', label: 'Đặt cọc', path: ROUTES.deposit },
  { key: 'checkout', label: 'Báo trả phòng', path: ROUTES.checkout },
  { key: 'thongBao', label: 'Thông báo', path: ROUTES.thongBao },
];

export function layMenuNhanVienTheoVaiTro(vaiTro) {
  if (vaiTro === 'sale') {
    return [
      { key: 'dashboard', label: 'Tổng quan', path: ROUTES.dashboard },
      { key: 'tiepNhanDangKyThue', label: 'Tiếp nhận thuê', path: ROUTES.tiepNhanDangKyThue },
      { key: 'nhanPhong', label: 'Nhận phòng', path: ROUTES.nhanPhong },
      { key: 'phongGiuong', label: 'Tra cứu phòng/giường', path: ROUTES.phongGiuong },
      { key: 'soDoPhong', label: 'Sơ đồ phòng', path: ROUTES.soDoPhong },
      { key: 'lichHen', label: 'Lịch hẹn', path: ROUTES.lichHen },
      { key: 'deposit', label: 'Đặt cọc', path: ROUTES.deposit },
      { key: 'hopDong', label: 'Hợp đồng', path: ROUTES.hopDong },
      { key: 'checkout', label: 'Báo trả phòng', path: ROUTES.checkout },
      { key: 'thongBao', label: 'Thông báo', path: ROUTES.thongBao },
    ];
  }

  if (vaiTro === 'quanly') {
    return [
      { key: 'dashboard', label: 'Tổng quan', path: ROUTES.dashboard },
      { key: 'phongGiuong', label: 'Tra cứu phòng/giường', path: ROUTES.phongGiuong },
      { key: 'soDoPhong', label: 'Sơ đồ phòng', path: ROUTES.soDoPhong },
      { key: 'deposit', label: 'Đặt cọc', path: ROUTES.deposit },
      { key: 'kiemTraLuuTru', label: 'Kiểm tra ĐK lưu trú', path: ROUTES.kiemTraLuuTru },
      { key: 'banGiao', label: 'Bàn giao phòng', path: ROUTES.banGiao },
      { key: 'checkout', label: 'Kiểm tra trả phòng', path: ROUTES.checkout },
      { key: 'thongBao', label: 'Thông báo', path: ROUTES.thongBao },
    ];
  }

  if (vaiTro === 'ketoan') {
    return [
      { key: 'dashboard', label: 'Tổng quan', path: ROUTES.dashboard },
      { key: 'phongGiuong', label: 'Phòng/Giường', path: ROUTES.phongGiuong },
      { key: 'soDoPhong', label: 'Sơ đồ phòng', path: ROUTES.soDoPhong },
      { key: 'deposit', label: 'Đặt cọc', path: ROUTES.deposit },
      { key: 'staffPayment', label: 'Thu tiền đầu kỳ', path: ROUTES.staffPayment },
      { key: 'checkout', label: 'Đối soát & Hoàn cọc', path: ROUTES.checkout },
      { key: 'thuChi', label: 'Thu chi', path: ROUTES.thuChi },
      { key: 'thongBao', label: 'Thông báo', path: ROUTES.thongBao },
    ];
  }

  if (vaiTro === 'phutrach') {
    return [
      { key: 'dashboard', label: 'Tổng quan', path: ROUTES.dashboard },
      { key: 'lapHopDong', label: 'Lập hợp đồng', path: ROUTES.lapHopDong },
      { key: 'phongGiuong', label: 'Phòng/Giường', path: ROUTES.phongGiuong },
      { key: 'soDoPhong', label: 'Sơ đồ phòng', path: ROUTES.soDoPhong },
      { key: 'khachHang', label: 'Khách hàng', path: ROUTES.khachHang },
      { key: 'hopDong', label: 'Hợp đồng', path: ROUTES.hopDong },
      { key: 'thongBao', label: 'Thông báo', path: ROUTES.thongBao },
    ];
  }

  if (vaiTro === 'tiepnhan') {
    return [
      { key: 'dashboard', label: 'Tổng quan', path: ROUTES.dashboard },
      { key: 'nhanPhong', label: 'Nhận phòng', path: ROUTES.nhanPhong },
      { key: 'phongGiuong', label: 'Phòng/Giường', path: ROUTES.phongGiuong },
      { key: 'soDoPhong', label: 'Sơ đồ phòng', path: ROUTES.soDoPhong },
      { key: 'khachHang', label: 'Khách hàng', path: ROUTES.khachHang },
      { key: 'hopDong', label: 'Hợp đồng', path: ROUTES.hopDong },
      { key: 'lapHopDong', label: 'Lập hợp đồng', path: ROUTES.lapHopDong },
      { key: 'thongBao', label: 'Thông báo', path: ROUTES.thongBao },
    ];
  }

  if (vaiTro === 'admin') {
    return [
      { key: 'dashboard', label: 'Tổng quan', path: ROUTES.dashboard },
      { key: 'quanLyTaiKhoan', label: 'Tài khoản', path: ROUTES.quanLyTaiKhoan },
      { key: 'khachHang', label: 'Khách hàng', path: ROUTES.khachHang },
      { key: 'thongBao', label: 'Thông báo', path: ROUTES.thongBao },
    ];
  }

  return MENU_NHAN_VIEN;
}
