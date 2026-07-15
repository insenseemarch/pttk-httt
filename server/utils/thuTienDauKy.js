/** Phân loại khoản phí dịch vụ trên HĐ để tính thu tiền đầu kỳ. */

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

/**
 * Tính các khoản thu đầu kỳ:
 * - Tiền thuê tháng đầu
 * - Phí cố định: nước (× số người), internet (× phòng), gửi xe (× số xe)
 * - Tiền điện: bỏ qua, thu theo kWh các kỳ sau
 */
export function tinhKhoanThuDauKy({ giaThue, kyThanhToan, bieuPhi = [], soNguoi = 1, soLuongXe = 1 }) {
  const soNguoiNum = Math.max(1, Number(soNguoi) || 1);
  const soXeNum = Math.max(0, Number(soLuongXe) || 0);

  const danhSachKhoanThu = [
    {
      id: 'rent',
      loai: 'THUE',
      ten: 'Tiền thuê kỳ đầu (1 tháng)',
      kyTinh: kyThanhToan || 'Thanh toán hàng tháng',
      donGia: Number(giaThue) || 0,
      soLuong: 1,
      soTien: Number(giaThue) || 0,
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
      const soTien = donGia * soNguoiNum;
      danhSachKhoanThu.push({
        id: phi.id || 'water',
        loai: 'NUOC_NGUOI',
        ten,
        kyTinh: `${donGia.toLocaleString('vi-VN')}đ × ${soNguoiNum} người`,
        donGia,
        soLuong: soNguoiNum,
        soTien,
        coTheChinhSoLuong: false,
      });
      continue;
    }

    if (loai === 'CO_DINH_PHONG') {
      danhSachKhoanThu.push({
        id: phi.id || 'wifi',
        loai: 'CO_DINH_PHONG',
        ten,
        kyTinh: donVi ? `${donGia.toLocaleString('vi-VN')}đ / ${donVi}` : `${donGia.toLocaleString('vi-VN')}đ / phòng`,
        donGia,
        soLuong: 1,
        soTien: donGia,
        coTheChinhSoLuong: false,
      });
      continue;
    }

    if (loai === 'GUI_XE') {
      const soTien = donGia * soXeNum;
      danhSachKhoanThu.push({
        id: phi.id || 'parking',
        loai: 'GUI_XE',
        ten,
        kyTinh: soXeNum > 0
          ? `${donGia.toLocaleString('vi-VN')}đ × ${soXeNum} xe`
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

/** Ước tính tổng cần thu trên danh sách (mặc định 1 xe). */
export function uocTinhTongCanThu({ giaThue, bieuPhi = [], soNguoi = 1, soLuongXe = 1 }) {
  const { tongTienPhaiThu } = tinhKhoanThuDauKy({
    giaThue,
    bieuPhi,
    soNguoi,
    soLuongXe,
  });
  return tongTienPhaiThu;
}
