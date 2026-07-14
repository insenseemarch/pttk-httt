import { boDauTiengViet, layMaNhanVien } from '../../utils/nhanVienSession';

export const LABEL_TIEU_CHI_UU_TIEN = {
  yenTinh: 'Yên tĩnh',
  guiXe: 'Gửi xe',
  dieuHoa: 'Điều hòa',
  wifiRieng: 'Wifi riêng',
  gioGiacTuDo: 'Giờ giấc tự do',
};

export function layDanhSachTieuChiDangKyThue(tieuChiUuTien, tuyChonTienIch = []) {
  const giaTriTheoKey = new Map();
  tuyChonTienIch.forEach((option) => {
    if (!option) return;
    if (option.value) giaTriTheoKey.set(option.value, option.value);
    if (option.label) giaTriTheoKey.set(option.label, option.value || option.label);
  });

  return Object.keys(tieuChiUuTien)
    .filter((key) => tieuChiUuTien[key])
    .map((key) => giaTriTheoKey.get(key) || LABEL_TIEU_CHI_UU_TIEN[key] || key)
    .filter(Boolean);
}

export function kiemTraThongTinDangKyThue(khachHang, yeuCauThue) {
  const cccd = String(khachHang.cccd || '').replace(/\D/g, '');
  const sdt = String(khachHang.sdt || '').replace(/\D/g, '');

  if (!khachHang.hoTen.trim()) return 'Vui lòng nhập họ tên khách hàng.';
  if (cccd.length < 9 || cccd.length > 12) return 'CCCD phải có từ 9 đến 12 chữ số.';
  if (sdt.length < 9 || sdt.length > 11) return 'Số điện thoại phải có từ 9 đến 11 chữ số.';
  if (!String(khachHang.ngaySinh || '').trim()) return 'Vui lòng chọn ngày sinh khách hàng.';
  if (!String(khachHang.gioiTinh || '').trim()) return 'Vui lòng chọn giới tính khách hàng.';
  if (!yeuCauThue.loaiPhong) return 'Vui lòng chọn hình thức thuê.';
  if (!yeuCauThue.khuVucMongMuon.trim()) return 'Vui lòng nhập khu vực ưu tiên.';
  if (Number(yeuCauThue.soNguoi) < 1) return 'Số người thuê phải lớn hơn 0.';
  if (yeuCauThue.mucGiaTu && yeuCauThue.mucGiaDen && Number(yeuCauThue.mucGiaTu) > Number(yeuCauThue.mucGiaDen)) {
    return 'Giá từ không được lớn hơn giá đến.';
  }

  return '';
}

export function mapYeuCauThueSangBoLoc(yeuCauThue, danhSachTieuChi) {
  const khuVucMongMuon = String(yeuCauThue.khuVucMongMuon || '').trim();
  const khuVucKhongDau = boDauTiengViet(khuVucMongMuon);
  const mappedKhuVuc = !khuVucMongMuon || khuVucKhongDau.includes('tat ca')
    ? 'Tất cả'
    : khuVucMongMuon.split(',')[0].trim();

  let mappedLoaiPhong = 'Tất cả';
  if (yeuCauThue.loaiPhong === 'Nguyên phòng') mappedLoaiPhong = 'Phòng đơn';
  else if (yeuCauThue.loaiPhong === 'Giường ghép') mappedLoaiPhong = 'Giường dorm';

  return {
    khuVuc: mappedKhuVuc,
    loaiPhong: mappedLoaiPhong,
    mucGiaTu: yeuCauThue.mucGiaTu || '',
    mucGiaDen: yeuCauThue.mucGiaDen || '',
    gioiTinh: yeuCauThue.gioiTinh || 'Tất cả',
    soNguoi: yeuCauThue.soNguoi || '',
    tienIch: danhSachTieuChi.length === 1 ? danhSachTieuChi[0] : 'Tất cả',
    yeuCauList: danhSachTieuChi,
  };
}

export function taoPayloadTiepNhanDangKyThue({
  formKhachHang,
  formYeuCauThue,
  danhSachTieuChi,
  nguoiDungDangNhap,
}) {
  return {
    khachHang: {
      ...formKhachHang,
      cccd: String(formKhachHang.cccd || '').replace(/\D/g, ''),
      hoTen: formKhachHang.hoTen.trim(),
      ngaySinh: String(formKhachHang.ngaySinh || '').trim(),
      gioiTinh: String(formKhachHang.gioiTinh || '').trim(),
      quocTich: String(formKhachHang.quocTich || '').trim(),
      sdt: String(formKhachHang.sdt || '').replace(/\D/g, ''),
      email: formKhachHang.email.trim(),
      diaChi: String(formKhachHang.diaChi || '').trim(),
    },
    yeuCauThue: {
      ...formYeuCauThue,
      yeuCauList: danhSachTieuChi,
    },
    maNV: layMaNhanVien(nguoiDungDangNhap),
  };
}

export async function guiTiepNhanDangKyThue(payload) {
  const response = await fetch('/api/tiep-nhan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) {
    throw new Error(data.error || 'Không thể tiếp nhận đăng ký thuê.');
  }

  return data;
}
