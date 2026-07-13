import { supabase } from '../config/supabase.js';
import { dinhDangCCCD, dinhDangNgay } from '../utils/dinhDang.js';

function layHopDongHienTai(hopDongs) {
  if (!hopDongs?.length) return null;
  const dangHieuLuc = hopDongs.find((hd) => hd.TrangThai === 'Đang hiệu lực');
  if (dangHieuLuc) return dangHieuLuc;
  return hopDongs.sort((a, b) => new Date(b.NgayKy) - new Date(a.NgayKy))[0];
}

function layPhongTuHopDong(hopDong) {
  const chiTiet = hopDong?.ChiTiet?.[0];
  const giuong = chiTiet?.Giuong;
  if (!giuong) return { phong: '—', chiNhanh: '—' };
  const phong = giuong.Phong;
  return {
    phong: phong ? `P.${phong.MaPhong}` : `Giường #${giuong.MaGiuong}`,
    chiNhanh: phong?.ChiNhanh?.TenCN || '—',
    maCN: phong?.MaCN,
  };
}

function xacDinhTrangThaiHD(hopDong) {
  if (!hopDong) return 'Chưa thuê';
  if (hopDong.TrangThai === 'Đang hiệu lực') {
    const ketThuc = hopDong.NgayGioKT ? new Date(hopDong.NgayGioKT) : null;
    if (ketThuc) {
      const conLai = (ketThuc - Date.now()) / (1000 * 60 * 60 * 24);
      if (conLai <= 30 && conLai > 0) return 'Sắp hết hạn';
    }
    return 'Đang thuê';
  }
  if (hopDong.TrangThai === 'Đã thanh lý' || hopDong.TrangThai === 'Thanh lý') {
    return 'Đã thanh lý';
  }
  return hopDong.TrangThai || '—';
}

export async function layDanhSachKhachHang(boLoc = {}) {
  const { timKiem = '', maCN = '', trangThai = '', page = 1, limit = 10 } = boLoc;
  const tu = (Number(page) - 1) * Number(limit);
  const den = tu + Number(limit) - 1;

  let query = supabase
    .from('KhachHang')
    .select(
      `
      CCCD, HoTen, SDT, Email, NgaySinh, GioiTinh, DiaChi,
      HopDong (
        MaHopDong, TrangThai, NgayKy, NgayGioBD, NgayGioKT,
        ChiTiet (
          Giuong (
            MaGiuong, MaPhong,
            Phong ( MaPhong, MaCN, ChiNhanh ( TenCN ) )
          )
        )
      )
    `,
      { count: 'exact' },
    )
    .order('HoTen', { ascending: true })
    .range(tu, den);

  if (timKiem.trim()) {
    const q = timKiem.trim();
    const cccdNum = Number(q);
    if (!Number.isNaN(cccdNum) && /^\d+$/.test(q)) {
      query = query.or(`HoTen.ilike.%${q}%,SDT.ilike.%${q}%,Email.ilike.%${q}%,CCCD.eq.${cccdNum}`);
    } else {
      query = query.or(`HoTen.ilike.%${q}%,SDT.ilike.%${q}%,Email.ilike.%${q}%`);
    }
  }

  const { data, error, count } = await query;
  if (error) throw error;

  let ketQua = (data || []).map((kh) => {
    const hd = layHopDongHienTai(kh.HopDong);
    const { phong, chiNhanh } = layPhongTuHopDong(hd);
    const trangThaiHD = xacDinhTrangThaiHD(hd);
    return {
      cccd: dinhDangCCCD(kh.CCCD),
      hoTen: kh.HoTen,
      sdt: kh.SDT || '',
      email: kh.Email || '',
      phong,
      chiNhanh,
      maCN: hd ? layPhongTuHopDong(hd).maCN : null,
      thoiGianThue: hd
        ? `${dinhDangNgay(hd.NgayGioBD)} - ${dinhDangNgay(hd.NgayGioKT)}`
        : '—',
      trangThaiHD,
      ngaySinh: dinhDangNgay(kh.NgaySinh),
      gioiTinh: kh.GioiTinh || '—',
      diaChi: kh.DiaChi || '—',
      maHopDong: hd?.MaHopDong || null,
    };
  });

  if (maCN) {
    ketQua = ketQua.filter((k) => String(k.maCN) === String(maCN));
  }
  if (trangThai) {
    ketQua = ketQua.filter((k) => k.trangThaiHD === trangThai);
  }

  return {
    danhSach: ketQua,
    tong: count || 0,
    trang: Number(page),
    gioiHan: Number(limit),
  };
}

export async function layChiTietKhachHang(cccd) {
  const { data, error } = await supabase
    .from('KhachHang')
    .select(
      `
      CCCD, HoTen, SDT, Email, NgaySinh, GioiTinh, DiaChi, QuocTich,
      HopDong (
        MaHopDong, TrangThai, NgayKy, NgayGioBD, NgayGioKT, GiaThue,
        ChiTiet (
          Giuong (
            MaGiuong, MaPhong,
            Phong ( MaPhong, LoaiPhong, ChiNhanh ( TenCN ) )
          )
        ),
        HoaDon ( MaHD, SoTien, NgayLap, HinhThucThanhToan, TrangThai )
      )
    `,
    )
    .eq('CCCD', Number(cccd))
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const hd = layHopDongHienTai(data.HopDong);
  const { phong, chiNhanh } = layPhongTuHopDong(hd);
  const hoaDons = (hd?.HoaDon || []).sort((a, b) => new Date(b.NgayLap) - new Date(a.NgayLap));

  return {
    cccd: dinhDangCCCD(data.CCCD),
    hoTen: data.HoTen,
    sdt: data.SDT || '',
    email: data.Email || '',
    ngaySinh: dinhDangNgay(data.NgaySinh),
    gioiTinh: data.GioiTinh || '—',
    diaChi: data.DiaChi || '—',
    quocTich: data.QuocTich || '—',
    phong,
    chiNhanh,
    trangThaiHD: xacDinhTrangThaiHD(hd),
    maHopDong: hd?.MaHopDong || null,
    lichSuThanhToan: hoaDons.map((hdItem) => ({
      maHD: hdItem.MaHD,
      moTa: `Thanh toán ${hdItem.TrangThai || 'hợp đồng'}`,
      ngay: dinhDangNgay(hdItem.NgayLap),
      phuongThuc: hdItem.HinhThucThanhToan || '—',
      soTien: Number(hdItem.SoTien || 0),
    })),
  };
}

export async function themKhachHang(duLieu) {
  const { data, error } = await supabase
    .from('KhachHang')
    .insert({
      CCCD: Number(duLieu.cccd),
      HoTen: duLieu.hoTen,
      SDT: duLieu.sdt,
      Email: duLieu.email || null,
      NgaySinh: duLieu.ngaySinh || null,
      GioiTinh: duLieu.gioiTinh || null,
      DiaChi: duLieu.diaChi || null,
      ThoaDK: true,
    })
    .select()
    .single();

  if (error) throw error;
  return { cccd: dinhDangCCCD(data.CCCD), hoTen: data.HoTen };
}

export async function capNhatKhachHang(cccd, duLieu) {
  const { data, error } = await supabase
    .from('KhachHang')
    .update({
      HoTen: duLieu.hoTen,
      SDT: duLieu.sdt,
      Email: duLieu.email,
      NgaySinh: duLieu.ngaySinh,
      GioiTinh: duLieu.gioiTinh,
      DiaChi: duLieu.diaChi,
    })
    .eq('CCCD', Number(cccd))
    .select()
    .maybeSingle();

  if (error) throw error;
  return data ? { ...data, CCCD: dinhDangCCCD(data.CCCD) } : data;
}
