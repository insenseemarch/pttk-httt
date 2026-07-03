import { supabase } from './config/supabase.js';

async function chenChiNhanh() {
  console.log('Đang chèn dữ liệu ChiNhanh...');
  const { error } = await supabase.from('ChiNhanh').upsert([
    { MaCN: 1, TenCN: 'Chi nhánh Quận 1', DiaChi: '123 Nguyễn Trãi, Quận 1, TP. HCM', ThoiGianHoatDong: '07:00:00' },
    { MaCN: 2, TenCN: 'Chi nhánh Bình Thạnh', DiaChi: '456 Điện Biên Phủ, Quận Bình Thạnh, TP. HCM', ThoiGianHoatDong: '07:00:00' },
    { MaCN: 3, TenCN: 'Chi nhánh Quận 3', DiaChi: '789 Nguyễn Đình Chiểu, Quận 3, TP. HCM', ThoiGianHoatDong: '07:00:00' },
    { MaCN: 4, TenCN: 'Chi nhánh Thủ Đức', DiaChi: '15 Võ Văn Ngân, TP. Thủ Đức, TP. HCM', ThoiGianHoatDong: '07:00:00' }
  ]);
  if (error) throw error;
}

async function chenNhanVien() {
  console.log('Đang chèn dữ liệu NhanVien...');
  const { error } = await supabase.from('NhanVien').upsert([
    { MaNV: 101, HoTen: 'Nguyễn Văn Nhân Viên', SDT: '0911222333', Email: 'nhanvien1@homestay.com', VaiTro: 'Nhân viên tiếp nhận', TrangThai: 'Đang làm việc', MaCN: 1 },
    { MaNV: 102, HoTen: 'Trần Thị Quản Lý', SDT: '0911333444', Email: 'quanly@homestay.com', VaiTro: 'Quản lý', TrangThai: 'Đang làm việc', MaCN: 2 },
    { MaNV: 103, HoTen: 'Lê Văn Kế Toán', SDT: '0911444555', Email: 'ketoan@homestay.com', VaiTro: 'Kế toán', TrangThai: 'Đang làm việc', MaCN: 2 },
    { MaNV: 104, HoTen: 'Phạm Thị Sale', SDT: '0911555666', Email: 'sale@homestay.com', VaiTro: 'Sale', TrangThai: 'Đang làm việc', MaCN: 1 }
  ]);
  if (error) throw error;
}

async function chenPhong() {
  console.log('Đang chèn dữ liệu Phong...');
  const { error } = await supabase.from('Phong').upsert([
    // Quận 1
    { MaPhong: 101, LoaiPhong: 'Giường ghép', SucChua: 8, GiaThue: 1500000, TienIch: 'Yên tĩnh, Gửi xe, Điều hòa, Wifi riêng, Giờ giấc tự do', ChiPhiTienIch: 100000, TinhTrang: false, MaCN: 1 },
    { MaPhong: 102, LoaiPhong: 'Giường ghép', SucChua: 6, GiaThue: 1600000, TienIch: 'Gửi xe, Điều hòa, Wifi riêng, Giờ giấc tự do', ChiPhiTienIch: 100000, TinhTrang: false, MaCN: 1 },
    { MaPhong: 103, LoaiPhong: 'Nguyên phòng', SucChua: 2, GiaThue: 4500000, TienIch: 'Yên tĩnh, Điều hòa, Wifi riêng', ChiPhiTienIch: 200000, TinhTrang: true, MaCN: 1 },
    // Bình Thạnh
    { MaPhong: 201, LoaiPhong: 'Nguyên phòng', SucChua: 2, GiaThue: 4000000, TienIch: 'Gửi xe, Điều hòa, Wifi riêng, Giờ giấc tự do', ChiPhiTienIch: 150000, TinhTrang: false, MaCN: 2 },
    { MaPhong: 202, LoaiPhong: 'Giường ghép', SucChua: 4, GiaThue: 1400000, TienIch: 'Yên tĩnh, Gửi xe, Điều hòa, Wifi riêng', ChiPhiTienIch: 80000, TinhTrang: false, MaCN: 2 },
    { MaPhong: 203, LoaiPhong: 'Nguyên phòng', SucChua: 1, GiaThue: 3800000, TienIch: 'Wifi riêng, Điều hòa, Ban công', ChiPhiTienIch: 120000, TinhTrang: true, MaCN: 2 },
    // Quận 3
    { MaPhong: 301, LoaiPhong: 'Giường ghép', SucChua: 6, GiaThue: 1300000, TienIch: 'Yên tĩnh, Gửi xe, Điều hòa, Giờ giấc tự do', ChiPhiTienIch: 90000, TinhTrang: false, MaCN: 3 },
    { MaPhong: 302, LoaiPhong: 'Nguyên phòng', SucChua: 1, GiaThue: 3500000, TienIch: 'Yên tĩnh, Wifi riêng, Giờ giấc tự do', ChiPhiTienIch: 120000, TinhTrang: true, MaCN: 3 },
    { MaPhong: 303, LoaiPhong: 'Nguyên phòng', SucChua: 2, GiaThue: 3900000, TienIch: 'Điều hòa, Wifi riêng, Bếp riêng', ChiPhiTienIch: 130000, TinhTrang: false, MaCN: 3 },
    // Thủ Đức
    { MaPhong: 401, LoaiPhong: 'Giường ghép', SucChua: 8, GiaThue: 1450000, TienIch: 'Máy lạnh, Wifi riêng, Khu bếp chung', ChiPhiTienIch: 100000, TinhTrang: false, MaCN: 4 },
    { MaPhong: 402, LoaiPhong: 'Nguyên phòng', SucChua: 2, GiaThue: 4100000, TienIch: 'Máy lạnh, Wifi riêng, Ban công', ChiPhiTienIch: 160000, TinhTrang: true, MaCN: 4 }
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

  // Phòng 401 (Giường ghép - Dorm Nữ Thủ Đức): 8 giường, có 5 giường trống
  for (let i = 1; i <= 8; i++) {
    dataGiuong.push({
      MaGiuong: 4010 + i,
      GioiTinhYeuCau: 'Nữ',
      GiaThue: 1450000,
      TinhTrang: i <= 5,
      MaPhong: 401
    });
  }

  // Phòng 402 (Nguyên phòng Thủ Đức) dùng làm phòng nguyên phòng test, không cần giường ghép

  const { error } = await supabase.from('Giuong').upsert(dataGiuong);
  if (error) throw error;
}

async function chenVatDung() {
  console.log('Đang chèn dữ liệu VatDung...');
  const { error } = await supabase.from('VatDung').upsert([
    { MaVatDung: 1, TenVatDung: 'Khóa cửa phòng', LoaiVatDung: 'An ninh', TinhTrang: true },
    { MaVatDung: 2, TenVatDung: 'Thẻ từ ra vào', LoaiVatDung: 'An ninh', TinhTrang: true },
    { MaVatDung: 3, TenVatDung: 'Ga giường', LoaiVatDung: 'Đồ vải', TinhTrang: true },
    { MaVatDung: 4, TenVatDung: 'Gối nằm', LoaiVatDung: 'Đồ vải', TinhTrang: true },
    { MaVatDung: 5, TenVatDung: 'Quạt treo tường', LoaiVatDung: 'Thiết bị', TinhTrang: true },
    { MaVatDung: 6, TenVatDung: 'Bàn học', LoaiVatDung: 'Nội thất', TinhTrang: true }
  ]);
  if (error) throw error;
}

async function chenVatDungTrongPhong() {
  console.log('Đang chèn dữ liệu VatDungTrongPhong...');
  const { error } = await supabase.from('VatDungTrongPhong').upsert([
    { MaPhong: 101, MaVatDung: 1, SoLuong: 1 },
    { MaPhong: 101, MaVatDung: 2, SoLuong: 8 },
    { MaPhong: 101, MaVatDung: 3, SoLuong: 8 },
    { MaPhong: 102, MaVatDung: 1, SoLuong: 1 },
    { MaPhong: 102, MaVatDung: 2, SoLuong: 6 },
    { MaPhong: 202, MaVatDung: 4, SoLuong: 4 },
    { MaPhong: 301, MaVatDung: 5, SoLuong: 6 },
    { MaPhong: 401, MaVatDung: 6, SoLuong: 8 }
  ], { onConflict: 'MaPhong,MaVatDung' });
  if (error) throw error;
}

async function chenKhachHang() {
  console.log('Đang chèn dữ liệu KhachHang...');
  const { error } = await supabase.from('KhachHang').upsert([
    { CCCD: 123456789, HoTen: 'Trần Quang Hải', SDT: '0901888999', Email: 'hai.tran@gmail.com', NgaySinh: '1995-01-01', GioiTinh: 'Nam', QuocTich: 'Việt Nam', DiaChi: 'TP. HCM', KhaNangTaiChinh: 12000000, ThoaDK: true },
    { CCCD: 234567890, HoTen: 'Lê Thị Mai', SDT: '0902777666', Email: 'mai.le@gmail.com', NgaySinh: '1998-05-12', GioiTinh: 'Nữ', QuocTich: 'Việt Nam', DiaChi: 'TP. HCM', KhaNangTaiChinh: 15000000, ThoaDK: true },
    { CCCD: 345678901, HoTen: 'Ngô Văn Sơn', SDT: '0903666555', Email: 'son.ngo@gmail.com', NgaySinh: '1996-09-20', GioiTinh: 'Nam', QuocTich: 'Việt Nam', DiaChi: 'TP. HCM', KhaNangTaiChinh: 10000000, ThoaDK: true },
    { CCCD: 456789012, HoTen: 'Phan Tuấn Kiệt', SDT: '0919888777', Email: 'kiet.phan@gmail.com', NgaySinh: '2000-11-02', GioiTinh: 'Nam', QuocTich: 'Việt Nam', DiaChi: 'TP. HCM', KhaNangTaiChinh: 8000000, ThoaDK: true },
    { CCCD: 567890123, HoTen: 'Hoàng Thị Dung', SDT: '0944555222', Email: 'dung.hoang@gmail.com', NgaySinh: '1997-03-15', GioiTinh: 'Nữ', QuocTich: 'Việt Nam', DiaChi: 'TP. HCM', KhaNangTaiChinh: 16000000, ThoaDK: true },
    { CCCD: 678901234, HoTen: 'Đặng Minh Khoa', SDT: '0933777888', Email: 'khoa.dang@gmail.com', NgaySinh: '1999-08-21', GioiTinh: 'Nam', QuocTich: 'Việt Nam', DiaChi: 'Đà Nẵng', KhaNangTaiChinh: 9000000, ThoaDK: true },
    { CCCD: 789012345, HoTen: 'Võ Thị Ngọc Anh', SDT: '0988555777', Email: 'anh.vo@gmail.com', NgaySinh: '2001-01-11', GioiTinh: 'Nữ', QuocTich: 'Việt Nam', DiaChi: 'Cần Thơ', KhaNangTaiChinh: 7000000, ThoaDK: true },
    { CCCD: 890123456, HoTen: 'Bùi Quốc Huy', SDT: '0977111222', Email: 'huy.bui@gmail.com', NgaySinh: '1994-12-30', GioiTinh: 'Nam', QuocTich: 'Việt Nam', DiaChi: 'TP. HCM', KhaNangTaiChinh: 20000000, ThoaDK: true }
  ]);
  if (error) throw error;
}

async function chenYeuCauThue() {
  console.log('Đang chèn dữ liệu YeuCauThue...');
  const { error } = await supabase.from('YeuCauThue').upsert([
    { MaYC: 5001, SoNguoiDuKien: 1, GioiTinh: 'Nam', KhuVucMongMuon: 'Bình Thạnh', LoaiPhong: 'Nguyên phòng', MucGia: 4500000, ThoiGianVao: '2026-07-10T08:30:00', ThoiGianThue: '2027-01-10', YeuCau: 'Có ban công, ưu tiên tầng cao', TrangThai: true, NgayTao: '2026-06-01T09:00:00', MaNV: 104, CCCD: 123456789 },
    { MaYC: 5002, SoNguoiDuKien: 2, GioiTinh: 'Nữ', KhuVucMongMuon: 'Quận 3', LoaiPhong: 'Giường ghép', MucGia: 1800000, ThoiGianVao: '2026-07-15T14:00:00', ThoiGianThue: '2026-12-15', YeuCau: 'Gần cửa sổ, yên tĩnh', TrangThai: false, NgayTao: '2026-06-03T10:30:00', MaNV: 101, CCCD: 234567890 },
    { MaYC: 5003, SoNguoiDuKien: 3, GioiTinh: 'Nam', KhuVucMongMuon: 'Quận 1', LoaiPhong: 'Giường ghép', MucGia: 1600000, ThoiGianVao: '2026-08-01T09:00:00', ThoiGianThue: '2027-02-01', YeuCau: 'Cần chỗ để xe, wifi mạnh', TrangThai: true, NgayTao: '2026-06-05T11:20:00', MaNV: 104, CCCD: 345678901 },
    { MaYC: 5004, SoNguoiDuKien: 1, GioiTinh: 'Nữ', KhuVucMongMuon: 'Thủ Đức', LoaiPhong: 'Nguyên phòng', MucGia: 4200000, ThoiGianVao: '2026-08-10T13:00:00', ThoiGianThue: '2027-08-10', YeuCau: 'Phòng mới, có máy lạnh', TrangThai: true, NgayTao: '2026-06-07T08:45:00', MaNV: 101, CCCD: 456789012 }
  ], { onConflict: 'MaYC' });
  if (error) throw error;
}

async function chenNhomThue() {
  console.log('Đang chèn dữ liệu NhomThue...');
  const { error } = await supabase.from('NhomThue').upsert([
    { MaNhom: 2001, SoThanhVienDangKy: 3, SoThanhVienDuDieuKien: 3, HinhThucThue: 'Nội trú', CCCD: 234567890 },
    { MaNhom: 2002, SoThanhVienDangKy: 2, SoThanhVienDuDieuKien: 2, HinhThucThue: 'Nội trú', CCCD: 345678901 },
    { MaNhom: 2003, SoThanhVienDangKy: 4, SoThanhVienDuDieuKien: 4, HinhThucThue: 'Nội trú', CCCD: 567890123 }
  ]);
  if (error) throw error;
}

async function chenThanhVienNhom() {
  console.log('Đang chèn dữ liệu ThanhVienNhom...');
  const { error } = await supabase.from('ThanhVienNhom').upsert([
    { CCCD: 234567890, MaNhom: 2001, ThoaDieuKien: true, LyDoKhongDat: null, TrangThai: 'Đủ điều kiện' },
    { CCCD: 678901234, MaNhom: 2001, ThoaDieuKien: true, LyDoKhongDat: null, TrangThai: 'Đủ điều kiện' },
    { CCCD: 789012345, MaNhom: 2001, ThoaDieuKien: true, LyDoKhongDat: null, TrangThai: 'Đủ điều kiện' },
    { CCCD: 345678901, MaNhom: 2002, ThoaDieuKien: true, LyDoKhongDat: null, TrangThai: 'Đủ điều kiện' },
    { CCCD: 890123456, MaNhom: 2002, ThoaDieuKien: true, LyDoKhongDat: null, TrangThai: 'Đủ điều kiện' },
    { CCCD: 567890123, MaNhom: 2003, ThoaDieuKien: true, LyDoKhongDat: null, TrangThai: 'Đủ điều kiện' },
    { CCCD: 123456789, MaNhom: 2003, ThoaDieuKien: true, LyDoKhongDat: null, TrangThai: 'Đủ điều kiện' },
    { CCCD: 456789012, MaNhom: 2003, ThoaDieuKien: true, LyDoKhongDat: null, TrangThai: 'Đủ điều kiện' }
  ], { onConflict: 'CCCD,MaNhom' });
  if (error) throw error;
}

async function chenDatCoc() {
  console.log('Đang chèn dữ liệu DatCoc...');
  const { error } = await supabase.from('DatCoc').upsert([
    { MaDatCoc: 3001, ThoiDiemTao: '2026-05-20T09:00:00', SoTienCoc: 9600000, HinhThucThanhToan: 'Chuyển khoản', HanThanhToan: '2026-05-25T23:59:59', TrangThai: 'Đã đóng', CCCD: 123456789, MaNhom: 2003, NVQL: 102, NVKT: 103 },
    { MaDatCoc: 3002, ThoiDiemTao: '2026-05-22T10:00:00', SoTienCoc: 7000000, HinhThucThanhToan: 'Tiền mặt', HanThanhToan: '2026-05-27T23:59:59', TrangThai: 'Chờ đối soát', CCCD: 234567890, MaNhom: 2001, NVQL: 102, NVKT: 103 },
    { MaDatCoc: 3003, ThoiDiemTao: '2026-05-25T11:00:00', SoTienCoc: 8000000, HinhThucThanhToan: 'Chuyển khoản', HanThanhToan: '2026-05-30T23:59:59', TrangThai: 'Chờ thanh lý', CCCD: 345678901, MaNhom: 2002, NVQL: 102, NVKT: 103 },
    { MaDatCoc: 3004, ThoiDiemTao: '2026-05-28T13:30:00', SoTienCoc: 5500000, HinhThucThanhToan: 'Chuyển khoản', HanThanhToan: '2026-06-02T23:59:59', TrangThai: 'Chờ thanh toán', CCCD: 456789012, MaNhom: 2003, NVQL: 102, NVKT: 103 },
    { MaDatCoc: 3005, ThoiDiemTao: '2026-06-01T08:15:00', SoTienCoc: 9600000, HinhThucThanhToan: 'Chuyển khoản', HanThanhToan: '2026-06-06T23:59:59', TrangThai: 'Chờ hoàn cọc', CCCD: 567890123, MaNhom: 2003, NVQL: 102, NVKT: 103 },
    { MaDatCoc: 3006, ThoiDiemTao: '2026-06-10T14:20:00', SoTienCoc: 5000000, HinhThucThanhToan: 'Tiền mặt', HanThanhToan: '2026-06-15T23:59:59', TrangThai: 'Đã thanh lý', CCCD: 678901234, MaNhom: 2001, NVQL: 102, NVKT: 103 }
  ], { onConflict: 'MaDatCoc' });
  if (error) throw error;
}

async function chenHopDong() {
  console.log('Đang chèn dữ liệu HopDong...');
  const { error } = await supabase.from('HopDong').upsert([
    { MaHopDong: 9001, NgayKy: '2026-05-20', NgayGioBD: '2026-06-01T00:00:00', NgayGioKT: '2027-06-01T00:00:00', KyThanhToan: 'Tháng', GiaThue: 4800000, DaXacNhanNoiQuy: true, PhiDichVu: 200000, QuyDinh: 'Không hút thuốc trong phòng', TrangThai: 'Hiệu lực', CCCD: 123456789, MaNhom: 2003, MaDatCoc: 3001, NVQL: 102, NVSale: 104 },
    { MaHopDong: 9002, NgayKy: '2026-05-22', NgayGioBD: '2026-06-15T00:00:00', NgayGioKT: '2027-06-15T00:00:00', KyThanhToan: 'Tháng', GiaThue: 3500000, DaXacNhanNoiQuy: true, PhiDichVu: 180000, QuyDinh: 'Giữ vệ sinh chung', TrangThai: 'Chờ kiểm tra', CCCD: 234567890, MaNhom: 2001, MaDatCoc: 3002, NVQL: 102, NVSale: 104 },
    { MaHopDong: 9003, NgayKy: '2026-05-25', NgayGioBD: '2026-07-01T00:00:00', NgayGioKT: '2027-07-01T00:00:00', KyThanhToan: 'Tháng', GiaThue: 4000000, DaXacNhanNoiQuy: true, PhiDichVu: 190000, QuyDinh: 'Không nuôi thú cưng', TrangThai: 'Chờ đối soát', CCCD: 345678901, MaNhom: 2002, MaDatCoc: 3003, NVQL: 102, NVSale: 104 },
    { MaHopDong: 9004, NgayKy: '2026-05-28', NgayGioBD: '2026-06-20T00:00:00', NgayGioKT: '2027-06-20T00:00:00', KyThanhToan: 'Tháng', GiaThue: 5500000, DaXacNhanNoiQuy: true, PhiDichVu: 220000, QuyDinh: 'Báo trước khi chuyển phòng', TrangThai: 'Chờ xác nhận đối soát', CCCD: 456789012, MaNhom: 2003, MaDatCoc: 3004, NVQL: 102, NVSale: 104 },
    { MaHopDong: 9005, NgayKy: '2026-06-01', NgayGioBD: '2026-06-01T00:00:00', NgayGioKT: '2026-12-01T00:00:00', KyThanhToan: 'Tháng', GiaThue: 4800000, DaXacNhanNoiQuy: true, PhiDichVu: 200000, QuyDinh: 'Hết hạn hợp đồng', TrangThai: 'Chờ thanh lý', CCCD: 567890123, MaNhom: 2003, MaDatCoc: 3005, NVQL: 102, NVSale: 104 },
    { MaHopDong: 9006, NgayKy: '2026-06-10', NgayGioBD: '2026-06-10T00:00:00', NgayGioKT: '2026-12-10T00:00:00', KyThanhToan: 'Tháng', GiaThue: 5000000, DaXacNhanNoiQuy: true, PhiDichVu: 230000, QuyDinh: 'Cần thanh toán bổ sung', TrangThai: 'Chờ thanh toán', CCCD: 678901234, MaNhom: 2001, MaDatCoc: 3006, NVQL: 102, NVSale: 104 }
  ], { onConflict: 'MaHopDong' });
  if (error) throw error;
}

async function chenChiTiet() {
  console.log('Đang chèn dữ liệu ChiTiet...');
  const { error } = await supabase.from('ChiTiet').upsert([
    { MaGiuong: 1011, MaHopDong: 9001, SoLuong: 1, GiaThucTe: 4800000 },
    { MaGiuong: 1021, MaHopDong: 9002, SoLuong: 1, GiaThucTe: 3500000 },
    { MaGiuong: 2021, MaHopDong: 9003, SoLuong: 1, GiaThucTe: 4000000 },
    { MaGiuong: 3011, MaHopDong: 9004, SoLuong: 1, GiaThucTe: 5500000 },
    { MaGiuong: 4011, MaHopDong: 9005, SoLuong: 1, GiaThucTe: 4800000 }
  ], { onConflict: 'MaGiuong,MaHopDong' });
  if (error) throw error;
}

async function chenGiuongDatCoc() {
  console.log('Đang chèn dữ liệu GiuongDatCoc...');
  const { error } = await supabase.from('GiuongDatCoc').upsert([
    { MaGiuong: 1012, MaDatCoc: 3001, NgayBatDau: '2026-06-01', NgayHetHan: '2026-06-30', SoGiuongCoc: 1 },
    { MaGiuong: 1022, MaDatCoc: 3002, NgayBatDau: '2026-06-05', NgayHetHan: '2026-07-05', SoGiuongCoc: 1 },
    { MaGiuong: 2022, MaDatCoc: 3003, NgayBatDau: '2026-06-10', NgayHetHan: '2026-07-10', SoGiuongCoc: 2 },
    { MaGiuong: 3012, MaDatCoc: 3004, NgayBatDau: '2026-06-15', NgayHetHan: '2026-07-15', SoGiuongCoc: 1 }
  ], { onConflict: 'MaGiuong,MaDatCoc' });
  if (error) throw error;
}

async function chenBienBanBanGiao() {
  console.log('Đang chèn dữ liệu BienBanBanGiao...');
  const { error } = await supabase.from('BienBanBanGiao').upsert([
    { MaBB: 7001, LoaiBB: 'Bàn Giao', NgayBanGiao: '2026-06-01', TinhTrangPhong: 'Tốt', SoChiaKhoa: 2, TrangThai: 'Đã bàn giao', MaHopDong: 9001, MoTaHuHong: '' },
    { MaBB: 7002, LoaiBB: 'Thu Hồi', NgayBanGiao: '2026-06-16', TinhTrangPhong: 'Nghiệm thu thu hồi', SoChiaKhoa: 2, TrangThai: 'Đã nghiệm thu', MaHopDong: 9002, MoTaHuHong: 'Vệ sinh phòng chưa đạt' },
    { MaBB: 7003, LoaiBB: 'Thu Hồi', NgayBanGiao: '2026-07-02', TinhTrangPhong: 'Nghiệm thu thu hồi', SoChiaKhoa: 1, TrangThai: 'Đã nghiệm thu', MaHopDong: 9003, MoTaHuHong: 'Điều hòa hoạt động yếu' },
    { MaBB: 7004, LoaiBB: 'Thu Hồi', NgayBanGiao: '2026-06-21', TinhTrangPhong: 'Nghiệm thu thu hồi', SoChiaKhoa: 3, TrangThai: 'Đã nghiệm thu', MaHopDong: 9004, MoTaHuHong: 'Mất 1 chìa khóa' },
    { MaBB: 7005, LoaiBB: 'Thu Hồi', NgayBanGiao: '2026-06-30', TinhTrangPhong: 'Nghiệm thu thu hồi', SoChiaKhoa: 2, TrangThai: 'Hoàn tất thanh lý', MaHopDong: 9005, MoTaHuHong: 'Hư hỏng gối và ga giường' },
    { MaBB: 7006, LoaiBB: 'Thu Hồi', NgayBanGiao: '2026-07-01', TinhTrangPhong: 'Nghiệm thu thu hồi', SoChiaKhoa: 2, TrangThai: 'Hoàn tất thanh lý', MaHopDong: 9006, MoTaHuHong: 'Cần thu thêm tiền điện nước' }
  ], { onConflict: 'MaBB' });
  if (error) throw error;
}

async function chenChiTietDichVu() {
  console.log('Đang chèn dữ liệu ChiTietDichVu...');
  const { error } = await supabase.from('ChiTietDichVu').upsert([
    { MaVatDung: 1, MaBB: 7002, TinhTrangHienTai: 'Mất', SoLuong: 1 },
    { MaVatDung: 3, MaBB: 7003, TinhTrangHienTai: 'Rách nhẹ', SoLuong: 2 },
    { MaVatDung: 4, MaBB: 7005, TinhTrangHienTai: 'Hư hỏng', SoLuong: 1 },
    { MaVatDung: 5, MaBB: 7004, TinhTrangHienTai: 'Bình thường', SoLuong: 1 },
    { MaVatDung: 6, MaBB: 7006, TinhTrangHienTai: 'Bình thường', SoLuong: 1 }
  ], { onConflict: 'MaVatDung,MaBB' });
  if (error) throw error;
}

async function chenHoaDon() {
  console.log('Đang chèn dữ liệu HoaDon...');
  const { error } = await supabase.from('HoaDon').upsert([
    { MaHD: 8001, SoTien: 2500000, NgayLap: '2026-06-05', NgayThanhToan: '2026-06-06', HinhThucThanhToan: 'Chuyển khoản', TrangThai: 'Đã thanh toán', HanThanhToan: '2026-06-10T23:59:59', MaHopDong: 9001, NVKT: 103 },
    { MaHD: 8002, SoTien: 3200000, NgayLap: '2026-06-16', NgayThanhToan: null, HinhThucThanhToan: 'Chưa thanh toán', TrangThai: 'Chưa thanh toán', HanThanhToan: '2026-06-20T23:59:59', MaHopDong: 9002, NVKT: 103 },
    { MaHD: 8003, SoTien: 4100000, NgayLap: '2026-07-02', NgayThanhToan: null, HinhThucThanhToan: 'Chuyển khoản', TrangThai: 'Chưa thanh toán', HanThanhToan: '2026-07-07T23:59:59', MaHopDong: 9003, NVKT: 103 },
    { MaHD: 8004, SoTien: 5200000, NgayLap: '2026-06-22', NgayThanhToan: '2026-06-23', HinhThucThanhToan: 'Tiền mặt', TrangThai: 'Đã thanh toán', HanThanhToan: '2026-06-27T23:59:59', MaHopDong: 9004, NVKT: 103 },
    { MaHD: 8005, SoTien: 6800000, NgayLap: '2026-07-01', NgayThanhToan: null, HinhThucThanhToan: 'Chuyển khoản', TrangThai: 'Chưa thanh toán', HanThanhToan: '2026-07-05T23:59:59', MaHopDong: 9006, NVKT: 103 }
  ], { onConflict: 'MaHD' });
  if (error) throw error;
}

async function chenPhieuDoiSoat() {
  console.log('Đang chèn dữ liệu PhieuDoiSoat...');
  const { error } = await supabase.from('PhieuDoiSoat').upsert([
    { MaPhieu: 6001, NgayDKTraPhong: '2026-06-15', NgayTraPhongThucTe: '2026-06-16', TyLeHoanTien: 80, SoTienHoanTamTinh: 7680000, KhauTruTienThue: 0, KhauTruTienDichVu: 0, KhauTruSuaChua: 0, KhauTruViPham: 0, SoTienHoanThuc: 7680000, HinhThucHoan: 'chuyen_khoan', HinhThucThanhToanBoSung: null, TrangThai: 'Chờ đối soát', MaHopDong: 9002, NVKT: 103, LoaiHinhTraPhong: 'dung_han', LyDoTraPhong: 'Hết hạn hợp đồng', YKienTranhChap: '', MaGiaoDich: '', DanhSachKhauTru: [] },
    { MaPhieu: 6002, NgayDKTraPhong: '2026-07-01', NgayTraPhongThucTe: null, TyLeHoanTien: 70, SoTienHoanTamTinh: 5600000, KhauTruTienThue: 1200000, KhauTruTienDichVu: 250000, KhauTruSuaChua: 0, KhauTruViPham: 0, SoTienHoanThuc: 4150000, HinhThucHoan: 'chuyen_khoan', HinhThucThanhToanBoSung: null, TrangThai: 'Chờ xác nhận đối soát', MaHopDong: 9003, NVKT: 103, LoaiHinhTraPhong: 'truoc_han', LyDoTraPhong: 'Chuyển công tác', YKienTranhChap: 'Khách muốn kiểm tra lại tiền điện', MaGiaoDich: '', DanhSachKhauTru: [{ id: 1, name: 'Phí vệ sinh', desc: 'Khách để lại rác', amount: 50000 }] },
    { MaPhieu: 6003, NgayDKTraPhong: '2026-06-20', NgayTraPhongThucTe: '2026-06-21', TyLeHoanTien: 100, SoTienHoanTamTinh: 5500000, KhauTruTienThue: 0, KhauTruTienDichVu: 0, KhauTruSuaChua: 150000, KhauTruViPham: 0, SoTienHoanThuc: 5350000, HinhThucHoan: 'tien_mat', HinhThucThanhToanBoSung: null, TrangThai: 'Chờ thanh lý', MaHopDong: 9004, NVKT: 103, LoaiHinhTraPhong: 'dung_han', LyDoTraPhong: 'Hết hạn hợp đồng', YKienTranhChap: '', MaGiaoDich: '', DanhSachKhauTru: [] },
    { MaPhieu: 6004, NgayDKTraPhong: '2026-06-30', NgayTraPhongThucTe: null, TyLeHoanTien: 100, SoTienHoanTamTinh: 4800000, KhauTruTienThue: 0, KhauTruTienDichVu: 0, KhauTruSuaChua: 0, KhauTruViPham: 0, SoTienHoanThuc: 4800000, HinhThucHoan: 'chuyen_khoan', HinhThucThanhToanBoSung: null, TrangThai: 'Chờ thanh toán', MaHopDong: 9005, NVKT: 103, LoaiHinhTraPhong: 'dung_han', LyDoTraPhong: 'Hết hạn hợp đồng', YKienTranhChap: '', MaGiaoDich: '', DanhSachKhauTru: [] },
    { MaPhieu: 6005, NgayDKTraPhong: '2026-07-01', NgayTraPhongThucTe: null, TyLeHoanTien: 50, SoTienHoanTamTinh: 2500000, KhauTruTienThue: 1500000, KhauTruTienDichVu: 350000, KhauTruSuaChua: 150000, KhauTruViPham: 0, SoTienHoanThuc: 500000, HinhThucHoan: 'chuyen_khoan', HinhThucThanhToanBoSung: 'chuyen_khoan', TrangThai: 'Chờ thanh lý', MaHopDong: 9006, NVKT: 103, LoaiHinhTraPhong: 'truoc_han', LyDoTraPhong: 'Đi du học nước ngoài', YKienTranhChap: '', MaGiaoDich: '', DanhSachKhauTru: [{ id: 1, name: 'Phí phụ thu', desc: 'Phát sinh thêm', amount: 100000 }] }
  ], { onConflict: 'MaPhieu' });
  if (error) throw error;
}

async function chenLichXemPhong() {
  console.log('Đang chèn dữ liệu LichXemPhong...');
  const { error } = await supabase.from('LichXemPhong').upsert([
    { MaLich: 4001, NgayGioHen: '2026-06-18T09:00:00', KetQua: 'Đã xem phòng', GhiChu: 'Khách quan tâm phòng nguyên phòng', MaYC: 5001, MaPhong: 203 },
    { MaLich: 4002, NgayGioHen: '2026-06-19T14:30:00', KetQua: 'Đã xem phòng', GhiChu: 'Khách muốn phòng dorm nữ', MaYC: 5002, MaPhong: 202 },
    { MaLich: 4003, NgayGioHen: '2026-06-21T11:00:00', KetQua: 'Hẹn lại', GhiChu: 'Khách bận họp', MaYC: 5003, MaPhong: 101 },
    { MaLich: 4004, NgayGioHen: '2026-06-24T16:00:00', KetQua: 'Đã xem phòng', GhiChu: 'Khách cần xem thêm phòng Thủ Đức', MaYC: 5004, MaPhong: 402 }
  ], { onConflict: 'MaLich' });
  if (error) throw error;
}

async function khoiTaoDuLieuMau() {
  try {
    console.log('Bắt đầu khởi tạo dữ liệu mẫu...');
    await chenChiNhanh();
    await chenNhanVien();
    await chenPhong();
    await chenGiuong();
    await chenVatDung();
    await chenVatDungTrongPhong();
    await chenKhachHang();
    await chenYeuCauThue();
    await chenNhomThue();
    await chenThanhVienNhom();
    await chenDatCoc();
    await chenHopDong();
    await chenChiTiet();
    await chenGiuongDatCoc();
    await chenBienBanBanGiao();
    await chenChiTietDichVu();
    await chenHoaDon();
    await chenPhieuDoiSoat();
    await chenLichXemPhong();
    console.log('Hoàn thành khởi tạo dữ liệu mẫu thành công!');
  } catch (err) {
    console.error('Lỗi khi khởi tạo dữ liệu mẫu:', err.message);
  }
}

khoiTaoDuLieuMau();
