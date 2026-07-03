const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Dữ liệu mẫu khởi tạo đồng bộ với 4 bước của quy trình Trả phòng
function khoiTaoDuLieuMau() {
  return {
    hopDongList: [
      {
        loai: 'hop_dong',
        maSo: 'HĐ-2023-0892',
        tenKhachHang: 'Trần Thị Thanh Thảo',
        soDienThoai: '0938.123.456',
        email: 'thao.tran@gmail.com',
        phongCoSo: 'P.402 — HomeStay Landmark 81',
        giaThue: 6500000,
        tienCoc: 13000000,
        ngayBatDau: '2024-01-15',
        ngayKetThuc: '2025-01-15',
        trangThai: 'Hiệu lực',
        noThue: 0,
        noDienNuoc: 412000
      },
      {
        loai: 'hop_dong',
        maSo: 'HĐ-2024-0102',
        tenKhachHang: 'Lê Hoàng Long',
        soDienThoai: '0909.987.654',
        email: 'long.le@yahoo.com',
        phongCoSo: 'P.101 — HomeStay Quận 7',
        giaThue: 4000000,
        tienCoc: 8000000,
        ngayBatDau: '2024-03-01',
        ngayKetThuc: '2025-03-01',
        trangThai: 'Chờ kiểm tra',
        noThue: 1250000,
        noDienNuoc: 412000
      },
      {
        loai: 'hop_dong',
        maSo: 'HĐ-2024-0305',
        tenKhachHang: 'Phạm Minh Trí',
        soDienThoai: '0912.333.444',
        email: 'tri.pham@gmail.com',
        phongCoSo: 'P.302 — HomeStay Tân Bình',
        giaThue: 5000000,
        tienCoc: 10000000,
        ngayBatDau: '2024-02-01',
        ngayKetThuc: '2025-02-01',
        trangThai: 'Chờ đối soát',
        noThue: 0,
        noDienNuoc: 250000,
        chiPhiHuHong: 800000,
        moTaHuHong: 'Hỏng nệm cao su, trầy xước tủ quần áo'
      },
      {
        loai: 'hop_dong',
        maSo: 'HĐ-2024-0412',
        tenKhachHang: 'Vũ Hoàng Yến',
        soDienThoai: '0966.555.666',
        email: 'yen.vu@gmail.com',
        phongCoSo: 'P.501 — HomeStay Thủ Đức',
        giaThue: 4500000,
        tienCoc: 9000000,
        ngayBatDau: '2024-04-15',
        ngayKetThuc: '2025-04-15',
        trangThai: 'Chờ xác nhận đối soát',
        noThue: 0,
        noDienNuoc: 150000,
        chiPhiHuHong: 0,
        moTaHuHong: 'Đồ dùng bình thường, vệ sinh sạch',
        dongYReconcile: true,
        phuongThucHoan: 'chuyen_khoan'
      },
      {
        loai: 'hop_dong',
        maSo: 'HĐ-2023-0592',
        tenKhachHang: 'Nguyễn Minh Tuấn',
        soDienThoai: '0782.909.123',
        email: 'tuan.nguyen@gmail.com',
        phongCoSo: 'P.302 — HomeStay Tân Bình',
        giaThue: 4500000,
        tienCoc: 9000000,
        ngayBatDau: '2023-05-15',
        ngayKetThuc: '2024-05-15',
        trangThai: 'Chờ thanh lý',
        noThue: 0,
        noDienNuoc: 150000,
        chiPhiHuHong: 800000,
        moTaHuHong: 'Hỏng nệm cao su, trầy xước tủ quần áo',
        dongYReconcile: true,
        phuongThucHoan: 'chuyen_khoan'
      },
      {
        loai: 'hop_dong',
        maSo: 'HĐ-2024-0812',
        tenKhachHang: 'Nguyễn Văn An',
        soDienThoai: '0988.777.666',
        email: 'an.nguyen@gmail.com',
        phongCoSo: 'P.402 — HomeStay Landmark 81',
        giaThue: 5000000,
        tienCoc: 5000000,
        ngayBatDau: '2024-01-10',
        ngayKetThuc: '2025-01-10',
        trangThai: 'Chờ hoàn cọc',
        noThue: 1500000,
        noDienNuoc: 450000,
        chiPhiHuHong: 200000,
        moTaHuHong: 'Linh kiện hỏng, vệ sinh phòng',
        tiLeHoanCoc: 80,
        phuongThucHoanTien: 'chuyen_khoan'
      },
      {
        loai: 'hop_dong',
        maSo: 'HĐ-2024-0999',
        tenKhachHang: 'Phan Tuấn Kiệt',
        soDienThoai: '0901.222.333',
        email: 'kiet.phan@gmail.com',
        phongCoSo: 'P.204 — HomeStay Quận 9',
        giaThue: 3000000,
        tienCoc: 3000000,
        ngayBatDau: '2024-02-15',
        ngayKetThuc: '2025-02-15',
        trangThai: 'Chờ thanh toán',
        noThue: 2500000,
        noDienNuoc: 600000,
        chiPhiHuHong: 1000000,
        moTaHuHong: 'Làm hỏng cửa sổ kính phòng ngủ',
        tiLeHoanCoc: 50,
        phuongThucHoanTien: 'tien_mat'
      }
    ],
    datCocList: [
      {
        loai: 'dat_coc',
        maSo: 'DC-2024-001',
        tenKhachHang: 'Nguyễn Văn Nam',
        soDienThoai: '0977.111.222',
        email: 'nam.nguyen@outlook.com',
        phongCoSo: 'P.305 — HomeStay District 9',
        giaThue: 2500000,
        tienCoc: 5000000,
        ngayBatDau: '2024-06-01',
        trangThai: 'Chưa ký hợp đồng'
      }
    ]
  };
}

const duLieuMau = khoiTaoDuLieuMau();

// API lấy danh sách toàn bộ hợp đồng và phiếu đặt cọc
app.get('/api/danh-sach', (req, res) => {
  function layToanBoDanhSach() {
    return [
      ...duLieuMau.hopDongList,
      ...duLieuMau.datCocList
    ];
  }
  res.json(layToanBoDanhSach());
});

// API tra cứu thông tin hợp đồng hoặc phiếu đặt cọc
app.get('/api/tra-cuu', (req, res) => {
  const tuKhoa = req.query.query ? req.query.query.trim().toLowerCase() : '';
  
  if (!tuKhoa) {
    return res.status(400).json({ error: 'Từ khóa tìm kiếm không được để trống' });
  }

  function timKiemThongTin() {
    const hopDongTimThay = duLieuMau.hopDongList.find(hd => 
      hd.maSo.toLowerCase().includes(tuKhoa) || 
      hd.tenKhachHang.toLowerCase().includes(tuKhoa)
    );

    if (hopDongTimThay) return hopDongTimThay;

    const datCocTimThay = duLieuMau.datCocList.find(dc => 
      dc.maSo.toLowerCase().includes(tuKhoa) || 
      dc.tenKhachHang.toLowerCase().includes(tuKhoa)
    );

    return datCocTimThay || null;
  }

  const ketQua = timKiemThongTin();

  if (ketQua) {
    res.json(ketQua);
  } else {
    res.status(404).json({ error: 'Không tìm thấy thông tin hợp đồng hoặc phiếu đặt cọc phù hợp!' });
  }
});

// API nhận yêu cầu trả phòng / cập nhật trạng thái
app.post('/api/gui-yeu-cau', (req, res) => {
  const thongTinYeuCau = req.body;
  const maHopDong = thongTinYeuCau.maHopDong || thongTinYeuCau.maSo;
  const loaiNghiepVu = thongTinYeuCau.loaiNghiepVu;

  let item = duLieuMau.hopDongList.find(hd => hd.maSo === maHopDong);
  if (!item) {
    item = duLieuMau.datCocList.find(dc => dc.maSo === maHopDong);
  }

  if (item) {
    if (loaiNghiepVu === 'xac_nhan_tra_phong') {
      item.trangThai = 'Chờ kiểm tra';
      item.ngayTraDuKien = thongTinYeuCau.ngayTra;
      item.loaiHinhTraPhong = thongTinYeuCau.loaiHinh;
      item.lyDo = thongTinYeuCau.lyDo;
      item.nguoiTiepNhan = thongTinYeuCau.nguoiNhan;
      item.phuongThucHoanTien = thongTinYeuCau.phuongThuc;
    } else if (loaiNghiepVu === 'gui_kiem_tra_phong') {
      item.trangThai = 'Chờ đối soát';
      item.chiPhiHuHong = thongTinYeuCau.chiPhiHuHong;
      item.moTaHuHong = thongTinYeuCau.moTaHuHong;
    } else if (loaiNghiepVu === 'lap_phieu_doi_soat') {
      item.trangThai = 'Chờ xác nhận đối soát';
      item.tiLeHoanCoc = thongTinYeuCau.tiLeHoanCoc;
      item.noThue = thongTinYeuCau.noThue;
      item.noDienNuoc = thongTinYeuCau.noDienNuoc;
      item.chiPhiHuHong = thongTinYeuCau.chiPhiHuHong;
    } else if (loaiNghiepVu === 'xac_nhan_dong_y_doi_soat') {
      item.trangThai = 'Chờ thanh lý';
    } else if (loaiNghiepVu === 'ghi_nhan_tranh_chap') {
      item.trangThai = 'Chờ đối soát';
    } else if (loaiNghiepVu === 'hoan_tat_thanh_ly') {
      // Sau khi thanh lý hợp đồng -> chờ hoàn cọc hoặc chờ thanh toán tiền
      const tienCocGoc = item.tienCoc;
      const tiLeHoan = item.tiLeHoanCoc || 80;
      const tienCocDuocHoan = tienCocGoc * (tiLeHoan / 100);
      const tongKhauTru = (item.noThue || 0) + (item.noDienNuoc || 0) + (item.chiPhiHuHong || 0) + 150000;
      const soTienQuyetToan = tienCocDuocHoan - tongKhauTru;
      
      item.trangThai = soTienQuyetToan >= 0 ? 'Chờ hoàn cọc' : 'Chờ thanh toán';
    } else if (loaiNghiepVu === 'hoan_tat_thanh_toan') {
      item.trangThai = 'Đã thanh lý';
    }
    console.log(`--- ĐÃ CẬP NHẬT TRẠNG THÁI ${item.maSo} THÀNH [${item.trangThai}] ---`);
  }

  res.json({
    success: true,
    message: 'Giao dịch đã được ghi nhận trên hệ thống.',
    maPhieuYeuCau: 'YCTP-' + Math.floor(Math.random() * 900000 + 100000)
  });
});

function khoiDongServer() {
  app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
  });
}

khoiDongServer();
