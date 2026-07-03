import { supabase } from '../config/supabase.js';
import { dinhDangNgay, dinhDangTien, tinhThoiGianTu } from '../utils/dinhDang.js';

function tinhDemNguoc(han) {
  if (!han) return null;
  const conLai = new Date(han).getTime() - Date.now();
  if (conLai <= 0) return '00:00:00';
  const gio = Math.floor(conLai / 3600000);
  const phut = Math.floor((conLai % 3600000) / 60000);
  const giay = Math.floor((conLai % 60000) / 1000);
  if (gio >= 1) {
    return `${String(gio).padStart(2, '0')}:${String(phut).padStart(2, '0')}:${String(giay).padStart(2, '0')}`;
  }
  return `${String(phut).padStart(2, '0')}:${String(giay).padStart(2, '0')}`;
}

export async function layThongKeThongBao() {
  const [coc, hopDong, lichHen, phieu] = await Promise.all([
    supabase
      .from('DatCoc')
      .select('MaDatCoc', { count: 'exact', head: true })
      .in('TrangThai', ['Chờ duyệt', 'Chờ xác nhận', 'Chờ thanh toán']),
    supabase
      .from('HopDong')
      .select('MaHopDong', { count: 'exact', head: true })
      .eq('TrangThai', 'Đang hiệu lực'),
    supabase
      .from('LichXemPhong')
      .select('MaLich', { count: 'exact', head: true })
      .or('KetQua.is.null,KetQua.eq.Chờ xác nhận'),
    supabase
      .from('PhieuDoiSoat')
      .select('MaPhieu', { count: 'exact', head: true })
      .eq('TrangThai', 'Chờ xử lý'),
  ]);

  const khanCap = coc.count || 0;
  const hopDongMoi = hopDong.count || 0;
  const thanhToan = phieu.count || 0;
  const heThong = 0;
  const tatCa = khanCap + hopDongMoi + thanhToan + (lichHen.count || 0) + heThong;

  return {
    tatCa,
    khanCap,
    hopDongMoi,
    thanhToan,
    heThong,
    lichHen: lichHen.count || 0,
  };
}

export async function layDanhSachThongBao(boLoc = {}) {
  const { loai = 'tat-ca', page = 1, limit = 10 } = boLoc;
  const items = [];

  const [cocData, hopDongData, lichData, phieuData] = await Promise.all([
    supabase
      .from('DatCoc')
      .select(`
        MaDatCoc, ThoiDiemTao, HanThanhToan, SoTienCoc, TrangThai,
        KhachHang ( HoTen ),
        GiuongDatCoc ( MaGiuong, Giuong ( MaPhong ) )
      `)
      .in('TrangThai', ['Chờ duyệt', 'Chờ xác nhận', 'Chờ thanh toán'])
      .order('ThoiDiemTao', { ascending: false })
      .limit(20),
    supabase
      .from('HopDong')
      .select(`
        MaHopDong, NgayGioKT, TrangThai,
        KhachHang ( HoTen ),
        ChiTiet ( Giuong ( MaPhong ) )
      `)
      .eq('TrangThai', 'Đang hiệu lực')
      .order('NgayGioKT', { ascending: true })
      .limit(20),
    supabase
      .from('LichXemPhong')
      .select(`
        MaLich, NgayGioHen, KetQua, GhiChu,
        YeuCauThue ( KhachHang ( HoTen ) ),
        Phong ( MaPhong )
      `)
      .or('KetQua.is.null,KetQua.eq.Chờ xác nhận')
      .order('NgayGioHen', { ascending: true })
      .limit(20),
    supabase
      .from('PhieuDoiSoat')
      .select(`
        MaPhieu, NgayDKTraPhong, TrangThai,
        HopDong ( KhachHang ( HoTen ), ChiTiet ( Giuong ( MaPhong ) ) )
      `)
      .eq('TrangThai', 'Chờ xử lý')
      .order('NgayDKTraPhong', { ascending: true })
      .limit(20),
  ]);

  if (cocData.error) throw cocData.error;
  if (hopDongData.error) throw hopDongData.error;
  if (lichData.error) throw lichData.error;
  if (phieuData.error) throw phieuData.error;

  (cocData.data || []).forEach((coc) => {
    const phong = coc.GiuongDatCoc?.[0]?.Giuong?.MaPhong;
    items.push({
      id: `coc-${coc.MaDatCoc}`,
      loai: 'khan-cap',
      uuTien: 'KHẨN CẤP',
      mau: 'urgent',
      thoiGian: tinhThoiGianTu(coc.ThoiDiemTao),
      tieuDe: `Đặt cọc giữ chỗ P.${phong || '—'}`,
      noiDung: `${coc.KhachHang?.HoTen || 'Khách hàng'} đã gửi yêu cầu đặt cọc ${dinhDangTien(coc.SoTienCoc)}. Cần xử lý trong 30 phút.`,
      demNguoc: tinhDemNguoc(coc.HanThanhToan || new Date(Date.now() + 30 * 60000).toISOString()),
      hanhDongChinh: 'Xử lý ngay',
      hanhDongPhu: null,
      daDoc: false,
      thoiDiem: coc.ThoiDiemTao,
    });
  });

  const homNay = Date.now();
  const baMuoiNgay = 30 * 24 * 60 * 60 * 1000;
  (hopDongData.data || []).forEach((hd) => {
    const kt = new Date(hd.NgayGioKT).getTime();
    if (kt - homNay > baMuoiNgay) return;
    const phong = hd.ChiTiet?.[0]?.Giuong?.MaPhong;
    const conLai = Math.ceil((kt - homNay) / (24 * 60 * 60 * 1000));
    items.push({
      id: `hd-${hd.MaHopDong}`,
      loai: 'hop-dong-moi',
      uuTien: conLai <= 7 ? 'ƯU TIÊN CAO' : 'VẬN HÀNH',
      mau: conLai <= 7 ? 'priority' : 'operational',
      thoiGian: tinhThoiGianTu(hd.NgayGioKT),
      tieuDe: `HĐ sắp hết hạn P.${phong || '—'}`,
      noiDung: `Hợp đồng của ${hd.KhachHang?.HoTen || 'khách'} sẽ hết hạn sau ${conLai} ngày (${dinhDangNgay(hd.NgayGioKT)}).`,
      demNguoc: null,
      hanhDongChinh: 'Liên hệ khách',
      hanhDongPhu: 'Xem chi tiết',
      daDoc: false,
      thoiDiem: hd.NgayGioKT,
    });
  });

  (lichData.data || []).forEach((lich) => {
    const khach = lich.YeuCauThue?.KhachHang?.HoTen || 'Khách hàng';
    items.push({
      id: `lich-${lich.MaLich}`,
      loai: 'hop-dong-moi',
      uuTien: 'VẬN HÀNH',
      mau: 'operational',
      thoiGian: tinhThoiGianTu(lich.NgayGioHen),
      tieuDe: `Xác nhận lịch xem phòng — ${khach}`,
      noiDung: `Lịch hẹn xem P.${lich.Phong?.MaPhong || '—'} lúc ${dinhDangNgay(lich.NgayGioHen)}.`,
      demNguoc: null,
      hanhDongChinh: 'Xác nhận ngay',
      hanhDongPhu: null,
      daDoc: false,
      thoiDiem: lich.NgayGioHen,
    });
  });

  (phieuData.data || []).forEach((phieu) => {
    const khach = phieu.HopDong?.KhachHang?.HoTen || 'Khách hàng';
    const phong = phieu.HopDong?.ChiTiet?.[0]?.Giuong?.MaPhong;
    items.push({
      id: `phieu-${phieu.MaPhieu}`,
      loai: 'thanh-toan',
      uuTien: 'VẬN HÀNH',
      mau: 'operational',
      thoiGian: tinhThoiGianTu(phieu.NgayDKTraPhong),
      tieuDe: `Trả phòng chờ xử lý P.${phong || '—'}`,
      noiDung: `${khach} đăng ký trả phòng ngày ${dinhDangNgay(phieu.NgayDKTraPhong)}.`,
      demNguoc: null,
      hanhDongChinh: 'Xử lý ngay',
      hanhDongPhu: 'Xem chi tiết',
      daDoc: false,
      thoiDiem: phieu.NgayDKTraPhong,
    });
  });

  items.push({
    id: 'sys-1',
    loai: 'he-thong',
    uuTien: 'THÔNG TIN',
    mau: 'info',
    thoiGian: 'Hôm qua',
    tieuDe: 'Cập nhật bảng giá điện nước',
    noiDung: 'Hệ thống đã cập nhật đơn giá điện nước tháng hiện tại. Vui lòng kiểm tra trước khi lập hóa đơn.',
    demNguoc: null,
    hanhDongChinh: 'Xem chi tiết',
    hanhDongPhu: null,
    daDoc: true,
    thoiDiem: new Date(Date.now() - 86400000).toISOString(),
  });

  items.sort((a, b) => new Date(b.thoiDiem) - new Date(a.thoiDiem));

  let loc = items;
  if (loai && loai !== 'tat-ca') {
    loc = items.filter((i) => i.loai === loai);
  }

  const tu = (Number(page) - 1) * Number(limit);
  const danhSach = loc.slice(tu, tu + Number(limit));

  const daXuLy = items.filter((i) => i.daDoc).length;
  const mucTieu = 24;

  return {
    danhSach,
    tong: loc.length,
    trang: Number(page),
    gioiHan: Number(limit),
    thongKe: { daXuLy, mucTieu, phanTram: Math.min(100, Math.round((daXuLy / mucTieu) * 100)) },
  };
}
