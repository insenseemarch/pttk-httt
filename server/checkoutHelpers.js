/** Helper nghiệp vụ quyết toán trả phòng — đối chiếu đề bài mục 3.1.4 */

export function chuanHoaTrangThaiDatCoc(trangThai) {
  if (trangThai === 'Đã đóng') return 'Hiệu lực';
  return trangThai || 'Hiệu lực';
}

export function layPhongCoSoTuChiTiet(chiTiet) {
  if (!chiTiet?.length || !chiTiet[0]?.Giuong?.Phong) return null;
  const p = chiTiet[0].Giuong.Phong;
  return `Giường ${chiTiet[0].MaGiuong} - P.${p.MaPhong} — ${p.ChiNhanh?.TenCN || 'HomeStay'}`;
}

export function layPhongCoSoTuGiuongDatCoc(giuongDatCoc) {
  if (!giuongDatCoc?.length || !giuongDatCoc[0]?.Giuong?.Phong) return null;
  const g = giuongDatCoc[0];
  const p = g.Giuong.Phong;
  return `Giường ${g.MaGiuong} - P.${p.MaPhong} — ${p.ChiNhanh?.TenCN || 'HomeStay'}`;
}

export function tinhTyLeHoanCoc(item) {
  if (!item) return 100;
  if (item.loai === 'dat_coc' || item.loaiHinhTraPhong === 'huy_thue') return 80;
  if (item.loaiHinhTraPhong === 'dung_han') return 100;

  const ngayTra = item.ngayTraDuKien ? new Date(item.ngayTraDuKien) : new Date();
  const ngayKetThuc = item.ngayKetThuc ? new Date(item.ngayKetThuc) : null;
  if (ngayKetThuc && !isNaN(ngayKetThuc.getTime()) && ngayTra >= ngayKetThuc) return 100;

  const ngayBatDau = item.ngayBatDau ? new Date(item.ngayBatDau) : null;
  if (!ngayBatDau || isNaN(ngayBatDau.getTime())) return 50;

  const soThang = (ngayTra.getFullYear() - ngayBatDau.getFullYear()) * 12
    + (ngayTra.getMonth() - ngayBatDau.getMonth());
  return soThang < 6 ? 50 : 70;
}

export function tinhTienCocHopDong(hopDong, datCoc, chiTiet) {
  if (datCoc?.SoTienCoc != null) return Number(datCoc.SoTienCoc);
  const soGiuong = Math.max(1, chiTiet?.length || 1);
  return Number(hopDong.GiaThue || 0) * 2 * soGiuong;
}

export function tinhSoTienQuyetToan(item) {
  const tienCocGoc = Number(item.tienCoc || 0);
  const isHoanMotPhan = item.loaiDoiSoat === LOAI_DOI_SOAT_HOAN_THANH_VIEN;
  const soThanhVienKhongDat = (item.danhSachKhauTruKhac || []).filter(k => k.name === 'ThanhVienKhongDat').length;
  let tienCocCoSo = tienCocGoc;
  if (isHoanMotPhan && item.soThanhVienDangKy) {
    tienCocCoSo = (tienCocGoc / Math.max(1, item.soThanhVienDangKy)) * soThanhVienKhongDat;
  }
  
  const tiLeHoan = Number(item.tiLeHoanCoc ?? 100);
  const tienCocDuocHoan = tienCocCoSo * (tiLeHoan / 100);
  
  const noThue = Number(item.noThue || 0);
  const noDienNuoc = Number(item.noDienNuoc || 0);
  const chiPhiHuHong = Number(item.chiPhiHuHong || 0);
  
  const tongExtra = (item.danhSachKhauTruKhac || [])
    .filter(k => !['LoaiDoiSoat', 'HinhThuc', 'MaDatCoc', 'ThanhVienKhongDat', 'SoThanhVienKhongDat'].includes(k.name))
    .reduce((s, k) => s + (Number(k.amount) || 0), 0);
    
  return tienCocDuocHoan - (noThue + noDienNuoc + chiPhiHuHong + tongExtra);
}

export function taoMetaDatCoc(maDatCoc) {
  return [{ id: '_meta', name: 'MaDatCoc', desc: String(maDatCoc), amount: 0 }];
}

export function layMaDatCocTuPds(pds) {
  if (!pds) return null;
  if (pds.MaDatCoc != null) return Number(pds.MaDatCoc);
  const meta = (pds.DanhSachKhauTru || []).find(k => k.name === 'MaDatCoc');
  return meta ? Number(meta.desc) : null;
}

export function locKhauTruThat(danhSachKhauTru) {
  return (danhSachKhauTru || []).filter(k => k.name !== 'MaDatCoc');
}

export const LOAI_DOI_SOAT_HOAN_THANH_VIEN = 'HOAN_COC_THANH_VIEN_KHONG_DAT';
export const LOAI_DOI_SOAT_TU_CHOI_KY = 'HOAN_COC_TU_CHOI_KY';

export function layLoaiDoiSoatTuPds(pds) {
  const meta = (pds?.DanhSachKhauTru || []).find((k) => k.name === 'LoaiDoiSoat');
  return meta?.desc || null;
}

export function laPhieuHoanCocThanhVienKhongDat(pds) {
  return layLoaiDoiSoatTuPds(pds) === LOAI_DOI_SOAT_HOAN_THANH_VIEN;
}

/** Phiếu hoàn cọc tách biệt — không đồng bộ trạng thái DatCoc/HĐ khi xử lý checkout */
export function laPhieuHoanCocDocLap(pds) {
  const loai = layLoaiDoiSoatTuPds(pds);
  return loai === LOAI_DOI_SOAT_HOAN_THANH_VIEN;
}

export function taoMaSoPhieuHoanCoc(maDatCoc, maPhieu) {
  return `PC-${maDatCoc}~${maPhieu}`;
}

/** HĐ-1 | PC-5 | PC-5~42 */
export function phanTichMaSoQuyetToan(maSo) {
  const raw = String(maSo || '').trim();
  if (raw.startsWith('HĐ-')) {
    return { loai: 'hop_dong', maHopDong: Number(raw.replace('HĐ-', '')), maDatCoc: null, maPhieu: null };
  }
  const tvMatch = raw.match(/^PC-(\d+)~(\d+)$/i);
  if (tvMatch) {
    return { loai: 'dat_coc', maHopDong: null, maDatCoc: Number(tvMatch[1]), maPhieu: Number(tvMatch[2]) };
  }
  const pcMatch = raw.match(/^PC-(\d+)$/i);
  if (pcMatch) {
    return { loai: 'dat_coc', maHopDong: null, maDatCoc: Number(pcMatch[1]), maPhieu: null };
  }
  return { loai: null, maHopDong: null, maDatCoc: null, maPhieu: null };
}

function tinhTienHoanThanhVienTuPds(pds, khauTru) {
  const tuPds = Number(pds?.SoTienHoanTamTinh);
  if (Number.isFinite(tuPds) && tuPds > 0) return tuPds;
  return (khauTru || [])
    .filter((k) => k.name === 'ThanhVienKhongDat')
    .reduce((s, k) => s + (Number(k.amount) || 0), 0);
}

export function mapHopDongRaDTO(h, datCocMap) {
  const phongCoSo = layPhongCoSoTuChiTiet(h.ChiTiet) || 'Chưa gán phòng';
  const datCoc = h.MaDatCoc ? datCocMap[h.MaDatCoc] : null;
  const pds = h.PhieuDoiSoat?.length ? h.PhieuDoiSoat[0] : null;
  const bbbg = h.BienBanBanGiao?.length ? h.BienBanBanGiao[0] : null;
  const khauTru = locKhauTruThat(pds?.DanhSachKhauTru);

  const dto = {
    loai: 'hop_dong',
    maSo: `HĐ-${h.MaHopDong}`,
    tenKhachHang: h.KhachHang?.HoTen || 'Khách ẩn',
    soDienThoai: h.KhachHang?.SDT || '',
    email: h.KhachHang?.Email || '',
    phongCoSo,
    giaThue: Number(h.GiaThue) || 0,
    tienCoc: tinhTienCocHopDong(h, datCoc, h.ChiTiet),
    ngayBatDau: h.NgayGioBD ? h.NgayGioBD.split('T')[0] : '',
    ngayKetThuc: h.NgayGioKT ? h.NgayGioKT.split('T')[0] : '',
    trangThai: pds?.TrangThai || h.TrangThai || 'Hiệu lực',
    noThue: pds ? Number(pds.KhauTruTienThue) : 0,
    noDienNuoc: pds ? Number(pds.KhauTruTienDichVu) : 0,
    chiPhiHuHong: pds ? Number(pds.KhauTruSuaChua) : 0,
    moTaHuHong: bbbg?.MoTaHuHong || '',
    tiLeHoanCoc: pds ? Number(pds.TyLeHoanTien) : 100,
    yKienTranhChap: pds?.YKienTranhChap || '',
    loaiHinhTraPhong: pds?.LoaiHinhTraPhong || '',
    ngayTraDuKien: pds?.NgayDKTraPhong || '',
    lyDo: pds?.LyDoTraPhong || '',
    phuongThucHoanTien: pds?.HinhThucHoan || 'chuyen_khoan',
    danhSachKhauTruKhac: khauTru,
    maGiaoDich: pds?.MaGiaoDich || '',
    checklistSach: false,
    checklistTaiSan: false,
    checklistChiaKhoa: false,
  };

  if (!pds?.TyLeHoanTien && dto.loaiHinhTraPhong) {
    dto.tiLeHoanCoc = tinhTyLeHoanCoc(dto);
  }
  return dto;
}

export function mapDatCocRaDTO(d, pds, giuongDatCoc) {
  const phongCoSo = layPhongCoSoTuGiuongDatCoc(giuongDatCoc) || 'Chưa xếp phòng';
  const khauTru = locKhauTruThat(pds?.DanhSachKhauTru);
  const laHoanThanhVien = laPhieuHoanCocThanhVienKhongDat(pds);
  const loaiDoiSoat = layLoaiDoiSoatTuPds(pds);
  const soThanhVienHoan = laHoanThanhVien
    ? khauTru.filter((k) => k.name === 'ThanhVienKhongDat').length
    : 0;

  const dto = {
    loai: 'dat_coc',
    maSo: laHoanThanhVien && pds?.MaPhieu
      ? taoMaSoPhieuHoanCoc(d.MaDatCoc, pds.MaPhieu)
      : `PC-${d.MaDatCoc}`,
    maPhieu: pds?.MaPhieu || null,
    maDatCoc: d.MaDatCoc,
    loaiDoiSoat,
    soGiuongThue: d.SoGiuongThue || 1,
    soThanhVienDangKy: d.NhomThue?.SoThanhVienDangKy || 1,
    tenKhachHang: laHoanThanhVien
      ? `${d.KhachHang?.HoTen || 'Khách cọc'} — hoàn cọc ${soThanhVienHoan} thành viên bị loại`
      : d.KhachHang?.HoTen || 'Khách cọc',
    soDienThoai: d.KhachHang?.SDT || '',
    email: d.KhachHang?.Email || '',
    phongCoSo,
    giaThue: 0,
    tienCoc: Number(d.SoTienCoc) || 0,
    ngayBatDau: d.ThoiDiemTao ? d.ThoiDiemTao.split('T')[0] : '',
    ngayKetThuc: '',
    trangThai: laHoanThanhVien
      ? (pds?.TrangThai || 'Chờ đối soát')
      : (pds?.TrangThai || chuanHoaTrangThaiDatCoc(d.TrangThai)),
    noThue: pds ? Number(pds.KhauTruTienThue) : 0,
    noDienNuoc: pds ? Number(pds.KhauTruTienDichVu) : 0,
    chiPhiHuHong: pds ? Number(pds.KhauTruSuaChua) : 0,
    moTaHuHong: pds?.MoTaHuHong || '',
    tiLeHoanCoc: pds ? Number(pds.TyLeHoanTien) : 80,
    yKienTranhChap: pds?.YKienTranhChap || '',
    loaiHinhTraPhong: pds?.LoaiHinhTraPhong || 'huy_thue',
    ngayTraDuKien: pds?.NgayDKTraPhong || '',
    lyDo: pds?.LyDoTraPhong || '',
    phuongThucHoanTien: pds?.HinhThucHoan || 'chuyen_khoan',
    danhSachKhauTruKhac: khauTru,
    maGiaoDich: pds?.MaGiaoDich || '',
    checklistSach: false,
    checklistTaiSan: false,
    checklistChiaKhoa: false,
  };
  return dto;
}
