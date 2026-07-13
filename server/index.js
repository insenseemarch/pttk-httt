import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { initSocket } from './config/ketNoiSocket.js';
import { supabase } from './config/supabase.js';
import stayCheckRoutes from './routes/stayCheck.routes.js';
import nhanPhongRoutes from './routes/nhanPhong.routes.js';
import contractRoutes from './routes/contract.routes.js';
import handoverRoutes from './routes/handover.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import liquidationRoutes from './routes/liquidation.routes.js';
import datCocRoutes, { huyDatCocQuaHan } from './routes/datCoc.routes.js';
import { ganRouteAuthDashboard } from './routes/authDashboard.js';
import { ganRouteQuanTri } from './routes/quanTri.js';
import { syncPhongGiuong } from './syncPhongGiuong.js';
import {
  layMaDatCocTuPds,
  mapDatCocRaDTO,
  mapHopDongRaDTO,
  taoMetaDatCoc,
  tinhSoTienQuyetToan,
  tinhTyLeHoanCoc,
  locKhauTruThat,
} from './checkoutHelpers.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Helper function to calculate end date from lease duration
function tinhNgayKetThuc(ngayVaoStr, soThangStr) {
  const ngayVao = new Date(ngayVaoStr);
  const soThang = parseInt(soThangStr) || 6;
  ngayVao.setMonth(ngayVao.getMonth() + soThang);
  return ngayVao.toISOString().split('T')[0];
}

// Database helper functions
async function luuThongTinKhachHang(kh) {
  const { data, error } = await supabase
    .from('KhachHang')
    .upsert({
      CCCD: Number(kh.cccd),
      HoTen: kh.hoTen,
      NgaySinh: kh.ngaySinh,
      GioiTinh: kh.gioiTinh,
      QuocTich: kh.quocTich,
      SDT: kh.sdt,
      Email: kh.email,
      KhaNangTaiChinh: Number(kh.khaNangTaiChinh) || null,
      ThoaDK: true
    }, { onConflict: 'CCCD' })
    .select();

  if (error) throw error;
  return data && data.length > 0 ? data[0] : null;
}

async function taoYeuCauThue(yc, cccd, maNV = 101) {
  const thoiGianThueDate = tinhNgayKetThuc(yc.thoiGianVao, yc.thoiHanThue);

  const { data, error } = await supabase
    .from('YeuCauThue')
    .insert({
      SoNguoiDuKien: Number(yc.soNguoi),
      GioiTinh: yc.gioiTinh,
      KhuVucMongMuon: yc.khuVucMongMuon,
      LoaiPhong: yc.loaiPhong,
      MucGia: Number(yc.mucGiaDen) || null, // default to max budget
      ThoiGianVao: new Date(yc.thoiGianVao).toISOString(),
      ThoiGianThue: thoiGianThueDate,
      YeuCau: yc.yeuCauList ? yc.yeuCauList.join(', ') : '',
      TrangThai: true,
      NgayTao: new Date().toISOString(),
      MaNV: maNV,
      CCCD: Number(cccd)
    })
    .select();

  if (error) throw error;
  return data && data.length > 0 ? data[0] : null;
}

async function layThongKePhongTrong() {
  // Query single rooms (Nguyên phòng) in Bình Thạnh (MaCN = 2)
  const { data: phongs, error: errorPhong } = await supabase
    .from('Phong')
    .select('MaPhong')
    .eq('LoaiPhong', 'Nguyên phòng')
    .eq('TinhTrang', true)
    .eq('MaCN', 2);
    
  if (errorPhong) throw errorPhong;
  
  // Query dorm beds (Giường) that are vacant (TinhTrang = true)
  const { data: giuongs, error: errorGiuong } = await supabase
    .from('Giuong')
    .select('MaGiuong, GioiTinhYeuCau, Phong!inner(MaCN, LoaiPhong)')
    .eq('TinhTrang', true);
    
  if (errorGiuong) throw errorGiuong;
  
  const countDormNuQ1 = giuongs.filter(g => g.GioiTinhYeuCau === 'Nữ' && g.Phong.MaCN === 1).length;
  const countDormNamQ3 = giuongs.filter(g => g.GioiTinhYeuCau === 'Nam' && g.Phong.MaCN === 3).length;
  const countPhongDonBT = phongs.length;
  
  return {
    dormNuQ1: countDormNuQ1,
    phongDonBT: countPhongDonBT,
    dormNamQ3: countDormNamQ3
  };
}

async function traCuuPhongPhuHop(tc) {
  // Fetch branches
  const { data: chiNhanhs, error: errCN } = await supabase.from('ChiNhanh').select('*');
  if (errCN) throw errCN;

  // Filter branches by search text
  let selectedCNIds = chiNhanhs.map(c => c.MaCN);
  if (tc.khuVucMongMuon) {
    const kvLower = tc.khuVucMongMuon.toLowerCase();
    selectedCNIds = chiNhanhs
      .filter(c => c.TenCN.toLowerCase().includes(kvLower) || c.DiaChi.toLowerCase().includes(kvLower))
      .map(c => c.MaCN);
  }

  if (tc.loaiPhong === 'Nguyên phòng') {
    let query = supabase
      .from('Phong')
      .select('*, ChiNhanh(TenCN, DiaChi)')
      .eq('LoaiPhong', 'Nguyên phòng')
      .eq('TinhTrang', true)
      .in('MaCN', selectedCNIds);

    if (tc.mucGiaTu) {
      query = query.gte('GiaThue', Number(tc.mucGiaTu));
    }
    if (tc.mucGiaDen) {
      query = query.lte('GiaThue', Number(tc.mucGiaDen));
    }
    if (tc.soNguoi) {
      query = query.gte('SucChua', Number(tc.soNguoi));
    }

    const { data: results, error: errPhong } = await query;
    if (errPhong) throw errPhong;

    let filtered = results;
    if (tc.yeuCauList && tc.yeuCauList.length > 0) {
      filtered = results.filter(room => {
        const roomUtils = room.TienIch ? room.TienIch.split(',').map(s => s.trim()) : [];
        return tc.yeuCauList.every(reqUtil => roomUtils.includes(reqUtil));
      });
    }

    return filtered.map(r => ({
      kieu: 'Phong',
      maId: r.MaPhong,
      ten: `Phòng đơn #${r.MaPhong}`,
      loaiPhong: r.LoaiPhong,
      giaThue: r.GiaThue,
      sucChua: r.SucChua,
      tienIch: r.TienIch,
      chiNhanh: r.ChiNhanh?.TenCN || 'Chưa rõ',
      diaChi: r.ChiNhanh?.DiaChi || '',
      gioiTinh: 'Tất cả'
    }));
  } else {
    // Dorm search
    let query = supabase
      .from('Giuong')
      .select('*, Phong!inner(*, ChiNhanh(TenCN, DiaChi))')
      .eq('TinhTrang', true)
      .in('Phong.MaCN', selectedCNIds);

    if (tc.gioiTinh && tc.gioiTinh !== 'Tất cả') {
      query = query.eq('GioiTinhYeuCau', tc.gioiTinh);
    }
    if (tc.mucGiaTu) {
      query = query.gte('GiaThue', Number(tc.mucGiaTu));
    }
    if (tc.mucGiaDen) {
      query = query.lte('GiaThue', Number(tc.mucGiaDen));
    }

    const { data: results, error: errGiuong } = await query;
    if (errGiuong) throw errGiuong;

    let filtered = results;
    if (tc.yeuCauList && tc.yeuCauList.length > 0) {
      filtered = results.filter(g => {
        const roomUtils = g.Phong.TienIch ? g.Phong.TienIch.split(',').map(s => s.trim()) : [];
        return tc.yeuCauList.every(reqUtil => roomUtils.includes(reqUtil));
      });
    }

    return filtered.map(g => ({
      kieu: 'Giuong',
      maId: g.MaGiuong,
      ten: `Giường #${g.MaGiuong} (Phòng ${g.Phong.MaPhong})`,
      loaiPhong: `Dorm ${g.GioiTinhYeuCau}`,
      giaThue: g.GiaThue,
      sucChua: 1,
      tienIch: g.Phong.TienIch,
      chiNhanh: g.Phong.ChiNhanh?.TenCN || 'Chưa rõ',
      diaChi: g.Phong.ChiNhanh?.DiaChi || '',
      gioiTinh: g.GioiTinhYeuCau
    }));
  }
}

// Route handlers
async function xuLyLayThongKe(req, res) {
  try {
    const stats = await layThongKePhongTrong();
    res.json({ ok: true, data: stats });
  } catch (error) {
    console.error('Lỗi lấy thống kê:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
}

async function xuLyTiepNhanThongTin(req, res) {
  try {
    const { khachHang, yeuCauThue, maNV } = req.body;
    
    if (!khachHang || !khachHang.cccd || !khachHang.hoTen) {
      return res.status(400).json({ ok: false, error: 'Thiếu thông tin khách hàng bắt buộc (CCCD, Họ tên)' });
    }

    // Save customer details
    const savedKhachHang = await luuThongTinKhachHang(khachHang);

    // Save rental request details
    const savedYeuCau = await taoYeuCauThue(yeuCauThue, khachHang.cccd, maNV || 101);

    res.json({
      ok: true,
      message: 'Tiếp nhận thông tin thành công!',
      data: {
        khachHang: savedKhachHang,
        yeuCauThue: savedYeuCau
      }
    });
  } catch (error) {
    console.error('Lỗi tiếp nhận thông tin:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
}

async function xuLyTraCuuPhong(req, res) {
  try {
    const tieuChi = req.body;
    const ketQua = await traCuuPhongPhuHop(tieuChi);
    res.json({ ok: true, data: ketQua });
  } catch (error) {
    console.error('Lỗi tra cứu phòng:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
}

async function layThongKeTongHop() {
  const { count: totalCustomers, error: errCust } = await supabase
    .from('KhachHang')
    .select('CCCD', { count: 'exact', head: true });
  if (errCust) throw errCust;

  const { count: vacantRooms, error: errVacRooms } = await supabase
    .from('Phong')
    .select('MaPhong', { count: 'exact', head: true })
    .eq('LoaiPhong', 'Nguyên phòng')
    .eq('TinhTrang', true);
  if (errVacRooms) throw errVacRooms;

  const { count: vacantBeds, error: errVacBeds } = await supabase
    .from('Giuong')
    .select('MaGiuong', { count: 'exact', head: true })
    .eq('TinhTrang', true);
  if (errVacBeds) throw errVacBeds;

  const { count: rentedRooms, error: errRentRooms } = await supabase
    .from('Phong')
    .select('MaPhong', { count: 'exact', head: true })
    .eq('LoaiPhong', 'Nguyên phòng')
    .eq('TinhTrang', false);
  if (errRentRooms) throw errRentRooms;

  const { count: rentedBeds, error: errRentBeds } = await supabase
    .from('Giuong')
    .select('MaGiuong', { count: 'exact', head: true })
    .eq('TinhTrang', false);
  if (errRentBeds) throw errRentBeds;

  return {
    soKhachHang: totalCustomers || 0,
    soPhongDangThue: (rentedRooms || 0) + (rentedBeds || 0),
    soPhongConTrong: (vacantRooms || 0) + (vacantBeds || 0)
  };
}

async function luuYeuCauTuVan(yc) {
  const { hoTen, sdt, email, noiDung } = yc;
  const numericCCCD = Number(sdt.replace(/\D/g, '')) || Math.floor(Math.random() * 9000000000) + 1000000000;

  const { data: savedCust, error: errCust } = await supabase
    .from('KhachHang')
    .upsert({
      CCCD: numericCCCD,
      HoTen: hoTen,
      SDT: sdt,
      Email: email,
      QuocTich: 'Việt Nam',
      ThoaDK: true
    }, { onConflict: 'CCCD' })
    .select();
  if (errCust) throw errCust;

  const thoiGianThueDate = tinhNgayKetThuc(new Date().toISOString().split('T')[0], 6);

  const { data: savedReq, error: errReq } = await supabase
    .from('YeuCauThue')
    .insert({
      SoNguoiDuKien: 1,
      GioiTinh: 'Tất cả',
      KhuVucMongMuon: 'Tất cả',
      LoaiPhong: 'Chưa xác định',
      MucGia: null,
      ThoiGianVao: new Date().toISOString(),
      ThoiGianThue: thoiGianThueDate,
      YeuCau: `Khách đăng ký nhận tư vấn: ${noiDung || 'Cần tư vấn thông tin homestay/dorm'}`,
      TrangThai: false, // unprocessed
      NgayTao: new Date().toISOString(),
      CCCD: numericCCCD,
      MaNV: null
    })
    .select();
  if (errReq) throw errReq;

  return {
    khachHang: savedCust && savedCust.length > 0 ? savedCust[0] : null,
    yeuCauThue: savedReq && savedReq.length > 0 ? savedReq[0] : null
  };
}

async function xuLyLayThongKeTongHop(req, res) {
  try {
    const stats = await layThongKeTongHop();
    res.json({ ok: true, data: stats });
  } catch (error) {
    console.error('Lỗi lấy thống kê tổng hợp:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
}

async function xuLyGuiYeuCauTuVan(req, res) {
  try {
    const dataTuVan = req.body;
    if (!dataTuVan.hoTen || !dataTuVan.sdt) {
      return res.status(400).json({ ok: false, error: 'Thiếu thông tin bắt buộc (Họ tên, Số điện thoại)' });
    }
    const ketQua = await luuYeuCauTuVan(dataTuVan);
    res.json({ ok: true, message: 'Gửi yêu cầu tư vấn thành công!', data: ketQua });
  } catch (error) {
    console.error('Lỗi gửi yêu cầu tư vấn:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
}

async function datLichXemPhong(yc) {
  const { hoTen, sdt, email, ngayGioHen, ghiChu, maPhong, loaiPhong } = yc;
  const numericCCCD = Number(sdt.replace(/\D/g, '')) || Math.floor(Math.random() * 9000000000) + 1000000000;

  // 1. Upsert customer
  const { data: savedCust, error: errCust } = await supabase
    .from('KhachHang')
    .upsert({
      CCCD: numericCCCD,
      HoTen: hoTen,
      SDT: sdt,
      Email: email,
      QuocTich: 'Việt Nam',
      ThoaDK: true
    }, { onConflict: 'CCCD' })
    .select();
  if (errCust) throw errCust;

  // 2. Create YeuCauThue
  const thoiGianThueDate = tinhNgayKetThuc(new Date().toISOString().split('T')[0], 6);
  const { data: savedReq, error: errReq } = await supabase
    .from('YeuCauThue')
    .insert({
      SoNguoiDuKien: 1,
      GioiTinh: 'Tất cả',
      KhuVucMongMuon: 'Chưa xác định',
      LoaiPhong: loaiPhong === 'Giuong' ? 'Giường ghép' : 'Nguyên phòng',
      MucGia: null,
      ThoiGianVao: new Date().toISOString(),
      ThoiGianThue: thoiGianThueDate,
      YeuCau: `Đăng ký hẹn xem phòng #${maPhong} qua website`,
      TrangThai: false,
      NgayTao: new Date().toISOString(),
      CCCD: numericCCCD,
      MaNV: null
    })
    .select();
  if (errReq) throw errReq;
  const maYC = savedReq[0].MaYC;

  // 3. Create LichXemPhong
  const { data: savedLich, error: errLich } = await supabase
    .from('LichXemPhong')
    .insert({
      NgayGioHen: new Date(ngayGioHen).toISOString(),
      GhiChu: ghiChu || '',
      MaPhong: Number(maPhong),
      MaYC: maYC,
      KetQua: 'Chưa xem'
    })
    .select();
  if (errLich) throw errLich;

  return {
    khachHang: savedCust && savedCust.length > 0 ? savedCust[0] : null,
    yeuCauThue: savedReq && savedReq.length > 0 ? savedReq[0] : null,
    lichXemPhong: savedLich && savedLich.length > 0 ? savedLich[0] : null
  };
}

async function xuLyDatLichXemPhong(req, res) {
  try {
    const dataLich = req.body;
    if (!dataLich.hoTen || !dataLich.sdt || !dataLich.ngayGioHen || !dataLich.maPhong) {
      return res.status(400).json({ ok: false, error: 'Thiếu thông tin bắt buộc (Họ tên, Số điện thoại, Ngày giờ hẹn, Mã phòng)' });
    }
    const ketQua = await datLichXemPhong(dataLich);
    res.json({ ok: true, message: 'Đăng ký lịch hẹn xem phòng thành công!', data: ketQua });
  } catch (error) {
    console.error('Lỗi đặt lịch hẹn xem phòng:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
}

async function xuLyLayDanhSachLichHen(req, res) {
  try {
    const { data, error } = await supabase
      .from('LichXemPhong')
      .select(`
        MaLich,
        NgayGioHen,
        KetQua,
        GhiChu,
        MaPhong,
        YeuCauThue (
          MaYC,
          CCCD,
          KhachHang (
            CCCD,
            HoTen,
            SDT
          )
        )
      `)
      .order('NgayGioHen', { ascending: false });

    if (error) throw error;
    res.json({ ok: true, data });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách lịch hẹn:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
}

async function xuLyCapNhatTrangThaiHen(req, res) {
  try {
    const { maLich, ketQua } = req.body;
    if (!maLich || !ketQua) {
      return res.status(400).json({ ok: false, error: 'Thiếu thông tin maLich hoặc ketQua' });
    }
    const { data, error } = await supabase
      .from('LichXemPhong')
      .update({ KetQua: ketQua })
      .eq('MaLich', Number(maLich))
      .select();

    if (error) throw error;
    res.json({ ok: true, data });
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái hẹn:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
}

// REST API Endpoints
app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Server is running' });
});

app.get('/api/thong-ke-phong', xuLyLayThongKe);
app.get('/api/thong-ke-tong-hop', xuLyLayThongKeTongHop);
app.post('/api/tiep-nhan', xuLyTiepNhanThongTin);
app.post('/api/tra-cuu-phong', xuLyTraCuuPhong);
app.post('/api/gui-tu-van', xuLyGuiYeuCauTuVan);
app.post('/api/dat-lich-hen', xuLyDatLichXemPhong);
app.get('/api/danh-sach-lich-hen', xuLyLayDanhSachLichHen);
app.post('/api/cap-nhat-trang-thai-hen', xuLyCapNhatTrangThaiHen);
app.use('/api/kiem-tra-luu-tru', stayCheckRoutes);
app.use('/api/nhan-phong', nhanPhongRoutes);
app.use('/api/hop-dong', contractRoutes);
app.use('/api/ban-giao', handoverRoutes);
app.use('/api/ke-toan', paymentRoutes);
app.use('/api/thanh-ly', liquidationRoutes);
app.use('/api/dat-coc', datCocRoutes);

ganRouteAuthDashboard(app);
ganRouteQuanTri(app);

app.get('/api/supabase-test', async (req, res) => {
  try {
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });

    if (error) {
      return res.status(500).json({ ok: false, error: error.message });
    }

    res.json({
      ok: true,
      message: 'Connected to Supabase successfully',
      usersCount: data?.users?.length ?? 0,
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});


async function taiPhieuDoiSoatDatCoc(maDatCoc) {
  const { data, error } = await supabase
    .from('PhieuDoiSoat')
    .select('*')
    .eq('MaDatCoc', maDatCoc)
    .order('MaPhieu', { ascending: false })
    .limit(1);
  if (error) console.error('Lỗi taiPhieuDoiSoatDatCoc:', error);
  return data && data.length > 0 ? data[0] : null;
}

async function luuPhieuDoiSoatDatCoc(maDatCoc, fields) {
  const existing = await taiPhieuDoiSoatDatCoc(maDatCoc);
  const khauTruKhac = locKhauTruThat(fields.DanhSachKhauTru || []);
  const payload = {
    ...fields,
    DanhSachKhauTru: [...taoMetaDatCoc(maDatCoc), ...khauTruKhac],
  };

  if (existing?.MaPhieu) {
    const { error } = await supabase.from('PhieuDoiSoat').update(payload).eq('MaPhieu', existing.MaPhieu);
    if (error) {
      console.error('LỖI UPDATE PHIẾU ĐỐI SOÁT CỌC:', error);
      throw error;
    }
    return;
  }

  const insertPayload = { ...payload, MaDatCoc: maDatCoc };
  const { error } = await supabase.from('PhieuDoiSoat').insert(insertPayload);
  if (error) throw error;
}

async function layDatCocMap() {
  const { data } = await supabase.from('DatCoc').select('*');
  const map = {};
  (data || []).forEach(d => { map[d.MaDatCoc] = d; });
  return map;
}

async function layGiuongDatCocMap() {
  const { data } = await supabase
    .from('GiuongDatCoc')
    .select(`
      MaGiuong,
      MaDatCoc,
      Giuong (
        Phong (
          MaPhong,
          ChiNhanh (TenCN)
        )
      )
    `);
  const map = {};
  (data || []).forEach(g => {
    if (!map[g.MaDatCoc]) map[g.MaDatCoc] = [];
    map[g.MaDatCoc].push(g);
  });
  return map;
}

async function layHopDongDayDu(maHopDong) {
  const { data, error } = await supabase
    .from('HopDong')
    .select(`
      *,
      KhachHang (*),
      ChiTiet (
        MaGiuong,
        Giuong (
          Phong (
            MaPhong,
            ChiNhanh (TenCN)
          )
        )
      ),
      PhieuDoiSoat (*),
      BienBanBanGiao (*)
    `)
    .eq('MaHopDong', maHopDong)
    .single();
  if (error || !data) return null;
  return data;
}

async function layItemQuyetToanTuMaSo(maSo) {
  const datCocMap = await layDatCocMap();
  if (maSo.startsWith('HĐ-')) {
    const id = Number(maSo.replace('HĐ-', ''));
    const h = await layHopDongDayDu(id);
    if (!h) return null;
    return mapHopDongRaDTO(h, datCocMap);
  }
  const id = Number(maSo.replace('PC-', ''));
  const { data: d, error } = await supabase
    .from('DatCoc')
    .select('*, KhachHang (*)')
    .eq('MaDatCoc', id)
    .single();
  if (error || !d) return null;
  const giuongMap = await layGiuongDatCocMap();
  const pds = await taiPhieuDoiSoatDatCoc(id);
  return mapDatCocRaDTO(d, pds, giuongMap[id] || []);
}

function ensureCheckoutSupabase(res) {
  if (!isUsingSupabaseForCheckout) {
    res.status(503).json({
      ok: false,
      error: 'Checkout đang yêu cầu Supabase nhưng chưa kết nối được. Hãy cấu hình SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY và đảm bảo các bảng checkout đã tồn tại.'
    });
    return false;
  }

  return true;
}

// Database fallback check
let isUsingSupabaseForCheckout = false;

async function checkSupabaseTable() {
  try {
    const { data, error } = await supabase.from('HopDong').select('MaHopDong').limit(1);
    if (!error) {
      isUsingSupabaseForCheckout = true;
      console.log('✅ [Supabase] Connection established successfully! Database schema is ready.');
    } else {
      console.error('❌ [Supabase] Table verification failed. Please check table existence.', error.message);
    }
  } catch (err) {
    console.error('❌ [Supabase] Database connection failed. Please check environment variables.', err.message);
  }
}

// Check database table after startup
setTimeout(checkSupabaseTable, 1000);

app.post('/api/checkout/reset', async (req, res) => {
  if (!ensureCheckoutSupabase(res)) {
    return;
  }

  try {
    await supabase.from('PhieuDoiSoat').delete().neq('MaPhieu', 0);
    await supabase.from('BienBanBanGiao').delete().neq('MaBB', 0);
    await supabase.from('HopDong').delete().neq('MaHopDong', 0);
    await supabase.from('DatCoc').delete().neq('MaDatCoc', 0);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 1. GET /api/checkout/list
app.get('/api/checkout/list', async (req, res) => {
  if (!ensureCheckoutSupabase(res)) {
    return;
  }

  try {
    const datCocMap = await layDatCocMap();
    const giuongDatCocMap = await layGiuongDatCocMap();

    const { data: pdsList, error: errPDS } = await supabase
      .from('PhieuDoiSoat')
      .select(`
        *,
        HopDong (
          *,
          KhachHang (*),
          ChiTiet (
            MaGiuong,
            Giuong (
              Phong (
                MaPhong,
                ChiNhanh (TenCN)
              )
            )
          ),
          BienBanBanGiao (*)
        ),
        DatCoc (
          *,
          KhachHang (*)
        )
      `);
    if (errPDS) throw errPDS;

    const mappedList = [];
    
    for (const pds of (pdsList || [])) {
      if (pds.MaHopDong && pds.HopDong) {
        // We need to pass the HopDong with its embedded PhieuDoiSoat array 
        // because mapHopDongRaDTO expects `h.PhieuDoiSoat` to be an array
        const h = { ...pds.HopDong, PhieuDoiSoat: [pds] };
        mappedList.push(mapHopDongRaDTO(h, datCocMap));
      } else if (pds.MaDatCoc && pds.DatCoc) {
        const d = pds.DatCoc;
        const giuongCoc = giuongDatCocMap[d.MaDatCoc] || [];
        mappedList.push(mapDatCocRaDTO(d, pds, giuongCoc));
      }
    }

    res.json({ ok: true, data: mappedList });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 2. GET /api/checkout/detail?id=...
app.get('/api/checkout/detail', async (req, res) => {
  const maSo = req.query.id;
  if (!ensureCheckoutSupabase(res)) {
    return;
  }

  try {
    const item = await layItemQuyetToanTuMaSo(maSo);
    if (!item) {
      return res.status(404).json({ ok: false, error: 'Không tìm thấy hồ sơ quyết toán!' });
    }
    res.json({ ok: true, data: item });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 3. POST /api/checkout/request — Sale tiếp nhận yêu cầu trả phòng / hủy cọc
app.post('/api/checkout/request', async (req, res) => {
  const { maSoChungTu, loaiHinhTraPhong, ngayTraDuKien, lyDo, phuongThucHoanTien } = req.body;
  if (!ensureCheckoutSupabase(res)) {
    return;
  }

  try {
    const nextTrangThai = 'Chờ kiểm tra';

    if (maSoChungTu.startsWith('HĐ-')) {
      const id = Number(maSoChungTu.replace('HĐ-', ''));

      await supabase.from('HopDong').update({ TrangThai: nextTrangThai }).eq('MaHopDong', id);

      const hopDong = await layHopDongDayDu(id);
      const datCocMap = await layDatCocMap();
      const dto = hopDong ? mapHopDongRaDTO(hopDong, datCocMap) : null;
      const tyLeHoan = tinhTyLeHoanCoc({
        loai: 'hop_dong',
        loaiHinhTraPhong,
        ngayBatDau: dto?.ngayBatDau,
        ngayKetThuc: dto?.ngayKetThuc,
        ngayTraDuKien
      });

      const { data: existing } = await supabase.from('PhieuDoiSoat').select('MaPhieu').eq('MaHopDong', id).maybeSingle();
      const pdsPayload = {
        NgayDKTraPhong: ngayTraDuKien,
        LoaiHinhTraPhong: loaiHinhTraPhong,
        LyDoTraPhong: lyDo,
        HinhThucHoan: phuongThucHoanTien,
        TrangThai: nextTrangThai,
        TyLeHoanTien: tyLeHoan
      };

      if (existing) {
        await supabase.from('PhieuDoiSoat').update(pdsPayload).eq('MaHopDong', id);
      } else {
        await supabase.from('PhieuDoiSoat').insert({ ...pdsPayload, MaHopDong: id });
      }
    } else {
      const id = Number(maSoChungTu.replace('PC-', ''));
      await supabase.from('DatCoc').update({ TrangThai: nextTrangThai }).eq('MaDatCoc', id);
      await luuPhieuDoiSoatDatCoc(id, {
        NgayDKTraPhong: ngayTraDuKien,
        LoaiHinhTraPhong: loaiHinhTraPhong || 'huy_thue',
        LyDoTraPhong: lyDo,
        HinhThucHoan: phuongThucHoanTien,
        TrangThai: nextTrangThai,
        TyLeHoanTien: 80
      });
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 4. POST /api/checkout/inspect — Quản lý kiểm phòng / xác nhận hủy cọc
app.post('/api/checkout/inspect', async (req, res) => {
  const {
    maChungTu,
    chiPhiHuHong,
    moTaHuHong,
    checklistSach,
    checklistTaiSan,
    checklistChiaKhoa
  } = req.body;
  if (!ensureCheckoutSupabase(res)) {
    return;
  }

  try {
    const nextTrangThai = 'Chờ đối soát';

    if (maChungTu.startsWith('HĐ-')) {
      const id = Number(maChungTu.replace('HĐ-', ''));

      await supabase.from('HopDong').update({ TrangThai: nextTrangThai }).eq('MaHopDong', id);
      await supabase.from('PhieuDoiSoat').update({
        KhauTruSuaChua: Number(chiPhiHuHong) || 0,
        TrangThai: nextTrangThai
      }).eq('MaHopDong', id);

      const bbPayload = {
        TinhTrangPhong: 'Nghiệm thu thu hồi',
        MoTaHuHong: moTaHuHong || '',
        NgayBanGiao: new Date().toISOString().split('T')[0],
        TrangThai: 'Đã nghiệm thu'
      };

      const { data: existingBB } = await supabase.from('BienBanBanGiao').select('MaBB').eq('MaHopDong', id).maybeSingle();
      if (existingBB) {
        await supabase.from('BienBanBanGiao').update(bbPayload).eq('MaHopDong', id);
      } else {
        await supabase.from('BienBanBanGiao').insert({
          ...bbPayload,
          LoaiBB: 'Thu Hồi',
          MaHopDong: id
        });
      }
    } else {
      const id = Number(maChungTu.replace('PC-', ''));
      await supabase.from('DatCoc').update({ TrangThai: nextTrangThai }).eq('MaDatCoc', id);
      await luuPhieuDoiSoatDatCoc(id, {
        TrangThai: nextTrangThai
      });

      const { data: giuongCoc } = await supabase.from('GiuongDatCoc').select('MaGiuong').eq('MaDatCoc', id);
      if (giuongCoc?.length) {
        const bedIds = giuongCoc.map(g => g.MaGiuong);
        await supabase.from('Giuong').update({ TinhTrang: true }).in('MaGiuong', bedIds);
      }
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 5. POST /api/checkout/reconcile — Kế toán lập phiếu đối soát
app.post('/api/checkout/reconcile', async (req, res) => {
  const { maChungTu, tiLeHoanCoc, noThue, noDienNuoc, chiPhiHuHong, moTaKhauTru, danhSachKhauTruKhac } = req.body;
  if (!ensureCheckoutSupabase(res)) {
    return;
  }

  try {
    const nextTrangThai = 'Chờ xác nhận đối soát';

    if (maChungTu.startsWith('HĐ-')) {
      const id = Number(maChungTu.replace('HĐ-', ''));

      const h = await layHopDongDayDu(id);
      let soTienHoan = 0;
      if (h) {
        const item = mapHopDongRaDTO(h, await layDatCocMap());
        item.tiLeHoanCoc = Number(tiLeHoanCoc) || 100;
        item.noThue = Number(noThue) || 0;
        item.noDienNuoc = Number(noDienNuoc) || 0;
        item.chiPhiHuHong = Number(chiPhiHuHong) || 0;
        item.danhSachKhauTruKhac = danhSachKhauTruKhac || [];
        soTienHoan = tinhSoTienQuyetToan(item);
      }

      await supabase.from('HopDong').update({ TrangThai: nextTrangThai }).eq('MaHopDong', id);
      await supabase.from('PhieuDoiSoat').update({
        TyLeHoanTien: Number(tiLeHoanCoc) || 100,
        KhauTruTienThue: Number(noThue) || 0,
        KhauTruTienDichVu: Number(noDienNuoc) || 0,
        KhauTruSuaChua: Number(chiPhiHuHong) || 0,
        DanhSachKhauTru: danhSachKhauTruKhac || [],
        TrangThai: nextTrangThai,
        SoTienHoanTamTinh: soTienHoan,
        SoTienHoanThuc: soTienHoan
      }).eq('MaHopDong', id);

      const { data: existingBB } = await supabase.from('BienBanBanGiao').select('MaBB').eq('MaHopDong', id).maybeSingle();
      if (existingBB) {
        await supabase.from('BienBanBanGiao').update({ MoTaHuHong: moTaKhauTru || '' }).eq('MaHopDong', id);
      }
    } else {
      const id = Number(maChungTu.replace('PC-', ''));
      const { data: d } = await supabase.from('DatCoc').select('SoTienCoc').eq('MaDatCoc', id).single();
      const tienCocGoc = Number(d?.SoTienCoc || 0);
      const tiLe = Number(tiLeHoanCoc) || 80;
      const soTienHoan = tienCocGoc * (tiLe / 100);

      await supabase.from('DatCoc').update({ TrangThai: nextTrangThai }).eq('MaDatCoc', id);
      await luuPhieuDoiSoatDatCoc(id, {
        TyLeHoanTien: tiLe,
        KhauTruTienThue: 0,
        KhauTruTienDichVu: 0,
        KhauTruSuaChua: 0,
        DanhSachKhauTru: danhSachKhauTruKhac || [],
        SoTienHoanTamTinh: soTienHoan,
        SoTienHoanThuc: soTienHoan,
        TrangThai: nextTrangThai
      });
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 6. POST /api/checkout/confirm — Quản lý xác nhận đối soát với khách
app.post('/api/checkout/confirm', async (req, res) => {
  console.log('--- POST /api/checkout/confirm CALLED ---', req.body);
  const { maChungTu, phanHoiKhach, yKienTranhChap } = req.body;
  if (!ensureCheckoutSupabase(res)) {
    return;
  }

  try {
    const isDongY = phanHoiKhach === 'dong_y';
    let nextTrangThai = 'Chờ đối soát';

    if (maChungTu.startsWith('HĐ-')) {
      const id = Number(maChungTu.replace('HĐ-', ''));

      if (isDongY) {
        const item = await layItemQuyetToanTuMaSo(`HĐ-${id}`);
        if (item) {
          const soTien = tinhSoTienQuyetToan(item);
          nextTrangThai = soTien < 0 ? 'Chờ thanh toán thêm' : 'Chờ thanh lý';
        } else {
          nextTrangThai = 'Chờ thanh lý';
        }
      }

      await supabase.from('HopDong').update({ TrangThai: nextTrangThai }).eq('MaHopDong', id);
      await supabase.from('PhieuDoiSoat').update({
        TrangThai: nextTrangThai,
        YKienTranhChap: isDongY ? '' : (yKienTranhChap || 'Khách hàng khiếu nại.')
      }).eq('MaHopDong', id);
    } else {
      const id = Number(maChungTu.replace('PC-', ''));

      if (isDongY) {
        const item = await layItemQuyetToanTuMaSo(`PC-${id}`);
        if (item) {
          const soTien = tinhSoTienQuyetToan(item);
          nextTrangThai = soTien < 0 ? 'Chờ thanh toán thêm' : 'Chờ hoàn cọc';
        } else {
          nextTrangThai = 'Chờ hoàn cọc';
        }
      }

      await supabase.from('DatCoc').update({ TrangThai: nextTrangThai }).eq('MaDatCoc', id);
      await luuPhieuDoiSoatDatCoc(id, {
        TrangThai: nextTrangThai,
        YKienTranhChap: isDongY ? '' : (yKienTranhChap || 'Khách hàng khiếu nại.')
      });
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Thêm API mới để cập nhật trạng thái hợp đồng và phiếu đối soát
app.post('/api/phieu-doi-soat/xac-nhan-khach', async (req, res) => {
  const { maHD, trangThai } = req.body;
  if (!ensureCheckoutSupabase(res)) return;

  try {
    const isDatCoc = maHD.startsWith('PC');
    const id = parseInt(maHD.replace(/\D/g, ''), 10);
    
    if (isDatCoc) {
      // Cập nhật phiếu đối soát (mã đặt cọc)
      const { error: errPDS } = await supabase.from('PhieuDoiSoat').update({ TrangThai: trangThai }).eq('MaDatCoc', id);
      if (errPDS) throw errPDS;

      // Cập nhật Đặt Cọc
      const { error: errDC } = await supabase.from('DatCoc').update({ TrangThai: trangThai }).eq('MaDatCoc', id);
      if (errDC) throw errDC;
    } else {
      // Cập nhật phiếu đối soát (mã hợp đồng)
      const { error: errPDS } = await supabase.from('PhieuDoiSoat').update({ TrangThai: trangThai }).eq('MaHopDong', id);
      if (errPDS) throw errPDS;

      // Cập nhật Hợp đồng
      const { error: errHD } = await supabase.from('HopDong').update({ TrangThai: trangThai }).eq('MaHopDong', id);
      if (errHD) throw errHD;
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Error updating PDS status:', error);
    res.status(500).json({ ok: false, message: 'Lỗi server: ' + error.message });
  }
});

// Thêm API mới để hoàn tất trả phòng / thanh lý
app.post('/api/phieu-doi-soat/hoan-tat-tra-phong', async (req, res) => {
  const { maHD, trangThai } = req.body;
  if (!ensureCheckoutSupabase(res)) return;

  try {
    const isDatCoc = maHD.startsWith('PC');
    const id = parseInt(maHD.replace(/\D/g, ''), 10);
    const newStatus = trangThai || 'Đã trả phòng';
    
    if (isDatCoc) {
      // Cập nhật phiếu đối soát (mã đặt cọc)
      const { error: errPDS } = await supabase.from('PhieuDoiSoat').update({ TrangThai: newStatus }).eq('MaDatCoc', id);
      if (errPDS) throw errPDS;

      // Cập nhật Đặt Cọc
      const { error: errDC } = await supabase.from('DatCoc').update({ TrangThai: newStatus }).eq('MaDatCoc', id);
      if (errDC) throw errDC;
    } else {
      // Cập nhật phiếu đối soát (mã hợp đồng)
      const { error: errPDS } = await supabase.from('PhieuDoiSoat').update({ TrangThai: newStatus }).eq('MaHopDong', id);
      if (errPDS) throw errPDS;

      // Cập nhật Hợp đồng
      const { error: errHD } = await supabase.from('HopDong').update({ TrangThai: newStatus }).eq('MaHopDong', id);
      if (errHD) throw errHD;
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Error updating to Đã trả phòng:', error);
    res.status(500).json({ ok: false, message: 'Lỗi server: ' + error.message });
  }
});

// 7. POST /api/checkout/liquidate — Ký biên bản thanh lý hợp đồng / phiếu cọc
app.post('/api/checkout/liquidate', async (req, res) => {
  const { maChungTu } = req.body;
  if (!ensureCheckoutSupabase(res)) {
    return;
  }

  try {
    if (maChungTu.startsWith('HĐ-')) {
      const id = Number(maChungTu.replace('HĐ-', ''));
      const item = await layItemQuyetToanTuMaSo(`HĐ-${id}`);

      let nextTrangThai = 'Đã thanh lý';
      if (item) {
        const soTien = tinhSoTienQuyetToan(item);
        nextTrangThai = soTien >= 0 ? 'Chờ hoàn cọc' : 'Đã thanh lý';
      }

      await supabase.from('HopDong').update({ TrangThai: nextTrangThai }).eq('MaHopDong', id);
      await supabase.from('PhieuDoiSoat').update({ TrangThai: nextTrangThai }).eq('MaHopDong', id);
      await supabase.from('BienBanBanGiao').update({ TrangThai: 'Hoàn tất thanh lý' }).eq('MaHopDong', id);

      const { data: details } = await supabase.from('ChiTiet').select('MaGiuong').eq('MaHopDong', id);
      if (details?.length) {
        const bedIds = details.map(d => d.MaGiuong);
        await supabase.from('Giuong').update({ TinhTrang: true }).in('MaGiuong', bedIds);

        const { data: beds } = await supabase.from('Giuong').select('MaPhong').in('MaGiuong', bedIds);
        if (beds?.length) {
          const roomIds = [...new Set(beds.map(b => b.MaPhong).filter(Boolean))];
          await supabase.from('Phong').update({ TinhTrang: true }).in('MaPhong', roomIds);
        }
      }
    } else {
      const id = Number(maChungTu.replace('PC-', ''));
      const item = await layItemQuyetToanTuMaSo(`PC-${id}`);

      let nextTrangThai = 'Chờ hoàn cọc';
      if (item) {
        const soTien = tinhSoTienQuyetToan(item);
        nextTrangThai = soTien >= 0 ? 'Chờ hoàn cọc' : 'Đã thanh lý';
      }

      await supabase.from('DatCoc').update({ TrangThai: nextTrangThai }).eq('MaDatCoc', id);
      await luuPhieuDoiSoatDatCoc(id, { TrangThai: nextTrangThai });

      const { data: giuongCoc } = await supabase.from('GiuongDatCoc').select('MaGiuong').eq('MaDatCoc', id);
      if (giuongCoc?.length) {
        const bedIds = giuongCoc.map(g => g.MaGiuong);
        await supabase.from('Giuong').update({ TinhTrang: true }).in('MaGiuong', bedIds);
      }
    }
    await syncPhongGiuong();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 8. POST /api/checkout/payment — Kế toán hoàn cọc / thu chênh lệch
app.post('/api/checkout/payment', async (req, res) => {
  const { maChungTu, maGiaoDich, soTaiKhoan, tenNguoiNhan, nganHang } = req.body;
  if (!ensureCheckoutSupabase(res)) {
    return;
  }

  try {
    if (maChungTu.startsWith('HĐ-')) {
      const id = Number(maChungTu.replace('HĐ-', ''));

      const { data: pds } = await supabase.from('PhieuDoiSoat').select('TrangThai').eq('MaHopDong', id).maybeSingle();
      const isThuThem = pds?.TrangThai === 'Chờ thanh toán' || pds?.TrangThai === 'Chờ thanh toán thêm';
      const nextTrangThai = 'Đã thanh lý';

      await supabase.from('HopDong').update({ TrangThai: nextTrangThai }).eq('MaHopDong', id);
      await supabase.from('PhieuDoiSoat').update({
        TrangThai: nextTrangThai,
        MaGiaoDich: maGiaoDich
      }).eq('MaHopDong', id);
      await supabase.from('BienBanBanGiao').update({ TrangThai: 'Hoàn tất thanh lý' }).eq('MaHopDong', id);

      if (isThuThem) {
        const { data: details } = await supabase.from('ChiTiet').select('MaGiuong').eq('MaHopDong', id);
        if (details?.length) {
          const bedIds = details.map(d => d.MaGiuong);
          await supabase.from('Giuong').update({ TinhTrang: true }).in('MaGiuong', bedIds);

          const { data: beds } = await supabase.from('Giuong').select('MaPhong').in('MaGiuong', bedIds);
          if (beds?.length) {
            const roomIds = [...new Set(beds.map(b => b.MaPhong).filter(Boolean))];
            await supabase.from('Phong').update({ TinhTrang: true }).in('MaPhong', roomIds);
          }
        }
      }
    } else {
      const id = Number(maChungTu.replace('PC-', ''));
      const pds = await taiPhieuDoiSoatDatCoc(id);
      const trangThaiHienTai = pds?.TrangThai || (await supabase.from('DatCoc').select('TrangThai').eq('MaDatCoc', id).single()).data?.TrangThai;
      const isThuThem = trangThaiHienTai === 'Chờ thanh toán' || trangThaiHienTai === 'Chờ thanh toán thêm';
      const nextTrangThai = 'Đã thanh lý';

      await supabase.from('DatCoc').update({ TrangThai: nextTrangThai }).eq('MaDatCoc', id);
      await luuPhieuDoiSoatDatCoc(id, {
        TrangThai: nextTrangThai,
        MaGiaoDich: maGiaoDich
      });

      if (isThuThem) {
        const { data: giuongCoc } = await supabase.from('GiuongDatCoc').select('MaGiuong').eq('MaDatCoc', id);
        if (giuongCoc?.length) {
          const bedIds = giuongCoc.map(g => g.MaGiuong);
          await supabase.from('Giuong').update({ TinhTrang: true }).in('MaGiuong', bedIds);
        }
      }
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

const httpServer = createServer(app);
initSocket(httpServer);

httpServer.listen(port, () => {
  console.log(`Express server running at http://localhost:${port}`);
});

if (process.env.ENABLE_DEPOSIT_EXPIRY_JOB !== 'false') {
  const depositExpiryJob = setInterval(() => {
    huyDatCocQuaHan().catch((error) => console.error('Lỗi job hủy cọc quá hạn:', error.message));
  }, 60 * 1000);
  depositExpiryJob.unref();
  huyDatCocQuaHan().catch((error) => console.warn('Chưa chạy được job đặt cọc:', error.message));
}
