/** Phân loại khoản phí dịch vụ trên HĐ để tính thu tiền đầu kỳ. */

import { chuanHoaKyThanhToan } from './hopDongQuyDinh.js';

export function phanLoaiKhoanPhi(phi = {}) {
  const id = String(phi.id || '').toLowerCase();
  const ten = String(phi.ten || '').toLowerCase();
  const donVi = String(phi.donVi || '').toLowerCase();

  if (id === 'elec' || /điện|dien/.test(ten) || donVi.includes('kwh')) {
    return 'BIEN_DOI';
  }
  if (id === 'water' || /nước|nuoc/.test(ten) || donVi.includes('người') || donVi.includes('nguoi')) {
    return 'NUOC_NGUOI';
  }
  if (id === 'wifi' || /wifi|internet/.test(ten) || donVi.includes('phòng') || donVi.includes('phong')) {
    return 'CO_DINH_PHONG';
  }
  if (id === 'parking' || /gửi xe|gui xe/.test(ten) || donVi.includes('/xe')) {
    return 'GUI_XE';
  }
  return 'KHONG_XAC_DINH';
}

export function dinhDangDonVi(donVi = '') {
  return String(donVi).replace(/^VNĐ\/?/i, '').trim() || donVi;
}

/** Map kỳ thanh toán trên HĐ → số tháng thu kỳ đầu. */
export function laySoThangTheoKyThanhToan(kyThanhToan) {
  const ky = chuanHoaKyThanhToan(kyThanhToan);
  if (ky.includes('6 tháng')) return 6;
  if (ky.includes('3 tháng')) return 3;
  return 1;
}

/**
 * Tính các khoản thu đầu kỳ:
 * - Tiền thuê và phí cố định (nước, internet, gửi xe) nhân theo số tháng của kỳ thanh toán trên HĐ
 * - Tiền điện: bỏ qua, thu theo kWh các kỳ sau
 */
export function tinhKhoanThuDauKy({ giaThue, kyThanhToan, bieuPhi = [], soNguoi = 1, soLuongXe = 1 }) {
  const soNguoiNum = Math.max(1, Number(soNguoi) || 1);
  const soXeNum = Math.max(0, Number(soLuongXe) || 0);
  const kyChuan = chuanHoaKyThanhToan(kyThanhToan);
  const soThangKy = laySoThangTheoKyThanhToan(kyChuan);
  const donGiaThue = Number(giaThue) || 0;
  const tienThueKyDau = donGiaThue * soThangKy;

  const danhSachKhoanThu = [
    {
      id: 'rent',
      loai: 'THUE',
      ten: `Tiền thuê kỳ đầu (${soThangKy} tháng)`,
      kyTinh: kyChuan,
      donGia: donGiaThue,
      soLuong: soThangKy,
      soTien: tienThueKyDau,
      coTheChinhSoLuong: false,
    },
  ];

  for (const phi of bieuPhi) {
    const donGia = Number(phi.gia || 0);
    if (donGia <= 0) continue;

    const loai = phanLoaiKhoanPhi(phi);
    if (loai === 'BIEN_DOI' || loai === 'KHONG_XAC_DINH') continue;

    const ten = phi.ten || 'Phí dịch vụ';
    const donVi = dinhDangDonVi(phi.donVi);

    if (loai === 'NUOC_NGUOI') {
      const soTienMotThang = donGia * soNguoiNum;
      const soTien = soTienMotThang * soThangKy;
      danhSachKhoanThu.push({
        id: phi.id || 'water',
        loai: 'NUOC_NGUOI',
        ten,
        kyTinh: soThangKy > 1
          ? `${donGia.toLocaleString('vi-VN')}đ × ${soNguoiNum} người × ${soThangKy} tháng`
          : `${donGia.toLocaleString('vi-VN')}đ × ${soNguoiNum} người`,
        donGia,
        soLuong: soNguoiNum * soThangKy,
        soTien,
        coTheChinhSoLuong: false,
      });
      continue;
    }

    if (loai === 'CO_DINH_PHONG') {
      const soTien = donGia * soThangKy;
      danhSachKhoanThu.push({
        id: phi.id || 'wifi',
        loai: 'CO_DINH_PHONG',
        ten,
        kyTinh: soThangKy > 1
          ? `${donGia.toLocaleString('vi-VN')}đ / ${donVi || 'phòng'} × ${soThangKy} tháng`
          : (donVi ? `${donGia.toLocaleString('vi-VN')}đ / ${donVi}` : `${donGia.toLocaleString('vi-VN')}đ / phòng`),
        donGia,
        soLuong: soThangKy,
        soTien,
        coTheChinhSoLuong: false,
      });
      continue;
    }

    if (loai === 'GUI_XE') {
      const soTienMotThang = donGia * soXeNum;
      const soTien = soTienMotThang * soThangKy;
      danhSachKhoanThu.push({
        id: phi.id || 'parking',
        loai: 'GUI_XE',
        ten,
        kyTinh: soXeNum > 0
          ? (soThangKy > 1
            ? `${donGia.toLocaleString('vi-VN')}đ × ${soXeNum} xe × ${soThangKy} tháng`
            : `${donGia.toLocaleString('vi-VN')}đ × ${soXeNum} xe`)
          : `${donGia.toLocaleString('vi-VN')}đ / xe — chưa có xe`,
        donGia,
        soLuong: soXeNum,
        soTien,
        coTheChinhSoLuong: true,
        soLuongMin: 0,
        soLuongMax: 20,
      });
    }
  }

  const tongTienPhaiThu = danhSachKhoanThu.reduce((sum, k) => sum + Number(k.soTien || 0), 0);

  return {
    danhSachKhoanThu,
    tongTienPhaiThu,
    soLuongXeMacDinh: soXeNum,
  };
}

/** Ước tính tổng cần thu trên danh sách. */
export function uocTinhTongCanThu({ giaThue, kyThanhToan, bieuPhi = [], soNguoi = 1, soLuongXe = 1 }) {
  const { tongTienPhaiThu } = tinhKhoanThuDauKy({
    giaThue,
    kyThanhToan,
    bieuPhi,
    soNguoi,
    soLuongXe,
  });
  return tongTienPhaiThu;
}
