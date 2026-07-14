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
