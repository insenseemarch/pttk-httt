/**
 * Tính tỷ lệ hoàn cọc cơ bản theo đề bài mục 3.1.4:
 * - 80%: đã cọc, chưa ký hợp đồng (hủy cọc)
 * - 50%: đã ký HĐ, chưa hết hạn, lưu trú dưới 6 tháng (trả trước hạn)
 * - 70%: đã ký HĐ, chưa hết hạn, lưu trú từ 6 tháng trở lên (trả trước hạn)
 * - 100%: hết hạn hợp đồng / trả đúng hạn
 */
export function tinhTyLeHoanCoc(item) {
  if (!item) return 100;

  if (item.loai === 'dat_coc' || item.loaiHinhTraPhong === 'huy_thue') {
    return 80;
  }

  if (item.loaiHinhTraPhong === 'dung_han') {
    return 100;
  }

  const ngayTra = item.ngayTraDuKien ? new Date(item.ngayTraDuKien) : new Date();
  const ngayKetThuc = item.ngayKetThuc ? new Date(item.ngayKetThuc) : null;

  if (ngayKetThuc && !isNaN(ngayKetThuc.getTime()) && ngayTra >= ngayKetThuc) {
    return 100;
  }

  const ngayBatDau = item.ngayBatDau ? new Date(item.ngayBatDau) : null;
  if (!ngayBatDau || isNaN(ngayBatDau.getTime())) {
    return 50;
  }

  const soThang = (ngayTra.getFullYear() - ngayBatDau.getFullYear()) * 12
    + (ngayTra.getMonth() - ngayBatDau.getMonth());

  return soThang < 6 ? 50 : 70;
}

export function tinhSoTienQuyetToan(item) {
  const tienCocGoc = Number(item.tienCoc || 0);
  const tiLeHoan = Number(item.tiLeHoanCoc ?? 100);
  const tienCocDuocHoan = tienCocGoc * (tiLeHoan / 100);
  const noThue = Number(item.noThue || 0);
  const noDienNuoc = Number(item.noDienNuoc || 0);
  const chiPhiHuHong = Number(item.chiPhiHuHong || 0);
  const tongExtra = (item.danhSachKhauTruKhac || []).reduce(
    (sum, k) => sum + (Number(k.amount) || 0),
    0
  );
  return tienCocDuocHoan - (noThue + noDienNuoc + chiPhiHuHong + tongExtra);
}
