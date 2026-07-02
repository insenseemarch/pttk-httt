import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase } from './config/supabase.js';
import { ganRouteAuthDashboard } from './routes/authDashboard.js';
import { ganRouteQuanTri } from './routes/quanTri.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

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

app.listen(port, () => {
  console.log(`Express server running at http://localhost:${port}`);
});

