import { supabase } from './config/supabase.js';

async function chenChiNhanh() {
  console.log('Đang chèn dữ liệu ChiNhanh...');
  const { error } = await supabase.from('ChiNhanh').upsert([
    { MaCN: 1, TenCN: 'Chi nhánh Quận 1', DiaChi: '123 Nguyễn Trãi, Quận 1, TP. HCM', ThoiGianHoatDong: '07:00:00' },
    { MaCN: 2, TenCN: 'Chi nhánh Bình Thạnh', DiaChi: '456 Điện Biên Phủ, Quận Bình Thạnh, TP. HCM', ThoiGianHoatDong: '07:00:00' },
    { MaCN: 3, TenCN: 'Chi nhánh Quận 3', DiaChi: '789 Nguyễn Đình Chiểu, Quận 3, TP. HCM', ThoiGianHoatDong: '07:00:00' }
  ]);
  if (error) throw error;
}

async function chenNhanVien() {
  console.log('Đang chèn dữ liệu NhanVien...');
  const { error } = await supabase.from('NhanVien').upsert([
    { MaNV: 101, HoTen: 'Nguyễn Văn Nhân Viên', SDT: '0911222333', Email: 'nhanvien1@homestay.com', VaiTro: 'Nhân viên tiếp nhận', TrangThai: 'Đang làm việc', MaCN: 1 }
  ]);
  if (error) throw error;
}

async function chenPhong() {
  console.log('Đang chèn dữ liệu Phong...');
  const { error } = await supabase.from('Phong').upsert([
    // Quận 1
    { MaPhong: 101, LoaiPhong: 'Giường ghép', SucChua: 8, GiaThue: 1500000, TienIch: 'Yên tĩnh, Gửi xe, Điều hòa, Wifi riêng, Giờ giấc tự do', ChiPhiTienIch: 100000, TinhTrang: true, MaCN: 1 },
    { MaPhong: 102, LoaiPhong: 'Giường ghép', SucChua: 6, GiaThue: 1600000, TienIch: 'Gửi xe, Điều hòa, Wifi riêng, Giờ giấc tự do', ChiPhiTienIch: 100000, TinhTrang: true, MaCN: 1 },
    { MaPhong: 103, LoaiPhong: 'Nguyên phòng', SucChua: 2, GiaThue: 4500000, TienIch: 'Yên tĩnh, Điều hòa, Wifi riêng', ChiPhiTienIch: 200000, TinhTrang: true, MaCN: 1 },
    // Bình Thạnh
    { MaPhong: 201, LoaiPhong: 'Nguyên phòng', SucChua: 2, GiaThue: 4000000, TienIch: 'Gửi xe, Điều hòa, Wifi riêng, Giờ giấc tự do', ChiPhiTienIch: 150000, TinhTrang: true, MaCN: 2 },
    { MaPhong: 202, LoaiPhong: 'Giường ghép', SucChua: 4, GiaThue: 1400000, TienIch: 'Yên tĩnh, Gửi xe, Điều hòa, Wifi riêng', ChiPhiTienIch: 80000, TinhTrang: true, MaCN: 2 },
    // Quận 3
    { MaPhong: 301, LoaiPhong: 'Giường ghép', SucChua: 6, GiaThue: 1300000, TienIch: 'Yên tĩnh, Gửi xe, Điều hòa, Giờ giấc tự do', ChiPhiTienIch: 90000, TinhTrang: true, MaCN: 3 },
    { MaPhong: 302, LoaiPhong: 'Nguyên phòng', SucChua: 1, GiaThue: 3500000, TienIch: 'Yên tĩnh, Wifi riêng, Giờ giấc tự do', ChiPhiTienIch: 120000, TinhTrang: true, MaCN: 3 }
  ]);
  if (error) throw error;
}

async function chenGiuong() {
  console.log('Đang chèn dữ liệu Giuong...');
  const dataGiuong = [];
  
  // Phòng 101 (Giường ghép - Dorm Nữ Q1): 8 giường, có 4 giường trống (tinhTrang = true)
  for (let i = 1; i <= 8; i++) {
    dataGiuong.push({
      MaGiuong: 1010 + i,
      GioiTinhYeuCau: 'Nữ',
      GiaThue: 1500000,
      TinhTrang: i <= 4, // 4 giường trống, 4 giường đã thuê
      MaPhong: 101
    });
  }

  // Phòng 102 (Giường ghép - Dorm Nam Q1): 6 giường, có 2 giường trống
  for (let i = 1; i <= 6; i++) {
    dataGiuong.push({
      MaGiuong: 1020 + i,
      GioiTinhYeuCau: 'Nam',
      GiaThue: 1600000,
      TinhTrang: i <= 2,
      MaPhong: 102
    });
  }

  // Phòng 202 (Giường ghép - Dorm Nữ Bình Thạnh): 4 giường, có 3 giường trống
  for (let i = 1; i <= 4; i++) {
    dataGiuong.push({
      MaGiuong: 2020 + i,
      GioiTinhYeuCau: 'Nữ',
      GiaThue: 1400000,
      TinhTrang: i <= 3,
      MaPhong: 202
    });
  }

  // Phòng 301 (Giường ghép - Dorm Nam Q3): 6 giường, có 2 giường trống
  for (let i = 1; i <= 6; i++) {
    dataGiuong.push({
      MaGiuong: 3010 + i,
      GioiTinhYeuCau: 'Nam',
      GiaThue: 1300000,
      TinhTrang: i <= 2,
      MaPhong: 301
    });
  }

  const { error } = await supabase.from('Giuong').upsert(dataGiuong);
  if (error) throw error;
}

async function khoiTaoDuLieuMau() {
  try {
    console.log('Bắt đầu khởi tạo dữ liệu mẫu...');
    await chenChiNhanh();
    await chenNhanVien();
    await chenPhong();
    await chenGiuong();
    console.log('Hoàn thành khởi tạo dữ liệu mẫu thành công!');
  } catch (err) {
    console.error('Lỗi khi khởi tạo dữ liệu mẫu:', err.message);
  }
}

khoiTaoDuLieuMau();
