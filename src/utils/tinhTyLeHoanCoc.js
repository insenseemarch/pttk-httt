/**
 * Tính tỷ lệ hoàn cọc cơ bản theo đề bài mục 3.1.4:
 * - 80%: đã cọc, chưa ký hợp đồng (hủy cọc)
 * - 50%: đã ký HĐ, chưa hết hạn, lưu trú dưới 6 tháng (trả trước hạn)
 * - 70%: đã ký HĐ, chưa hết hạn, lưu trú từ 6 tháng trở lên (trả trước hạn)
 * - 100%: hết hạn hợp đồng / trả đúng hạn
 */
export function chuanHoaLoaiHinhTraPhong(loai) {
  if (loai === 'truoc_han_duoi_6' || loai === 'truoc_han_tren_6') return 'truoc_han';
  return loai || 'dung_han';
}

export function tinhTyLeHoanCoc(item) {
  if (!item) return 100;

  const loaiHinh = item.loaiHinhTraPhong;

  // Ưu tiên tỉ lệ theo đúng option người dùng đã chọn
  if (item.loai === 'dat_coc' || loaiHinh === 'huy_thue') {
    return 80;
  }
  if (loaiHinh === 'dung_han') {
    return 100;
  }
  if (loaiHinh === 'truoc_han_duoi_6') {
    return 50;
  }
  if (loaiHinh === 'truoc_han_tren_6') {
    return 70;
  }

  // Không có option rõ ràng: suy ra theo ngày (dùng cho luồng cũ)
  const ngayTra = item.ngayTraDuKien ? new Date(item.ngayTraDuKien) : new Date();
  const ngayKetThuc = item.ngayKetThuc ? new Date(item.ngayKetThuc) : null;
  const ngayBatDau = item.ngayBatDau ? new Date(item.ngayBatDau) : null;

  // Hàm hỗ trợ lấy timestamp chỉ tính ngày
  const resetTime = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const traTime = resetTime(ngayTra);

  if (ngayKetThuc && !isNaN(ngayKetThuc.getTime())) {
    const ketThucTime = resetTime(ngayKetThuc);
    if (traTime >= ketThucTime) {
      return 100;
    }
  } else if (loaiHinh === 'dung_han') {
    return 100;
  }

  if (loaiHinh === 'truoc_han_duoi_6' && (!ngayBatDau || isNaN(ngayBatDau.getTime()))) {
    return 50;
  }

  if (loaiHinh === 'truoc_han_tren_6' && (!ngayBatDau || isNaN(ngayBatDau.getTime()))) {
    return 70;
  }

  if (!ngayBatDau || isNaN(ngayBatDau.getTime())) {
    return 50;
  }

  let soThang = (ngayTra.getFullYear() - ngayBatDau.getFullYear()) * 12
    + (ngayTra.getMonth() - ngayBatDau.getMonth());
    
  if (ngayTra.getDate() < ngayBatDau.getDate()) {
    soThang -= 1;
  }

  return soThang < 6 ? 50 : 70;
}

/**
 * Gợi ý loại hình trả phòng phù hợp dựa vào ngày trả dự kiến so với hợp đồng:
 * - 'dung_han': ngày trả >= ngày kết thúc (hết hạn / đúng hạn)
 * - 'truoc_han_duoi_6': chưa hết hạn, đã ở dưới 6 tháng
 * - 'truoc_han_tren_6': chưa hết hạn, đã ở từ 6 tháng trở lên
 */
export function goiYLoaiHinhTraPhong(item) {
  if (!item) return 'dung_han';
  if (item.loai === 'dat_coc') return 'huy_thue';

  const resetTime = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

  const ngayTra = item.ngayTraDuKien ? new Date(item.ngayTraDuKien) : new Date();
  const ngayKetThuc = item.ngayKetThuc ? new Date(item.ngayKetThuc) : null;
  const ngayBatDau = item.ngayBatDau ? new Date(item.ngayBatDau) : null;

  if (Number.isNaN(ngayTra.getTime())) return 'dung_han';

  if (ngayKetThuc && !Number.isNaN(ngayKetThuc.getTime())) {
    if (resetTime(ngayTra) >= resetTime(ngayKetThuc)) return 'dung_han';
  }

  if (!ngayBatDau || Number.isNaN(ngayBatDau.getTime())) return 'truoc_han_duoi_6';

  let soThang = (ngayTra.getFullYear() - ngayBatDau.getFullYear()) * 12
    + (ngayTra.getMonth() - ngayBatDau.getMonth());
  if (ngayTra.getDate() < ngayBatDau.getDate()) {
    soThang -= 1;
  }

  return soThang < 6 ? 'truoc_han_duoi_6' : 'truoc_han_tren_6';
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
