import express from 'express';

const router = express.Router();

// --- KIỂM TRA ĐIỀU KIỆN LƯU TRÚ (STAY CHECK) ---
// Lấy thông tin đặt cọc và danh sách thành viên cần kiểm tra điều kiện lưu trú
function layDuLieuKiemTraLuuTru(maHoSo) {
  return {
    thongTinDatCoc: {
      maHoSo: maHoSo,
      trangThai: 'Đã duyệt',
      ngayNhanPhong: '2023-10-15',
      thoiHanThue: 12,
      phongDuKien: 'P.402 - Giường A1',
      soTienDaCoc: 2500000,
      donViTien: 'VNĐ',
      ghiChuSales: 'Khách hàng mong muốn chuyển vào buổi sáng. Cần kiểm tra kỹ giấy tạm trú do khách là người ngoại tỉnh.'
    },
    danhSachThanhVien: [
      { id: '01', hoTen: 'Nguyễn Văn An', truongNhom: true, cccd: '001092003841', gioiTinh: 'Nam' },
      { id: '02', hoTen: 'Lê Thị Bình', truongNhom: false, cccd: '079195000123', gioiTinh: 'Nữ' },
      { id: '03', hoTen: 'Trần Quang Cường', truongNhom: false, cccd: '048098007721', gioiTinh: 'Nam' },
      { id: '04', hoTen: 'Phạm Minh Đức', truongNhom: false, cccd: '001099002233', gioiTinh: 'Nam' }
    ]
  };
}

// GET /api/kiem-tra-luu-tru/:maHoSo
// Lấy dữ liệu đặt cọc và thành viên cho màn hình kiểm tra điều kiện lưu trú
router.get('/:maHoSo', async (req, res) => {
  try {
    const { maHoSo } = req.params;
    if (!maHoSo) {
      return res.status(400).json({ ok: false, error: 'Thiếu mã hồ sơ đặt cọc' });
    }
    const data = layDuLieuKiemTraLuuTru(maHoSo);
    res.json({ ok: true, data });
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu kiểm tra lưu trú:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// POST /api/kiem-tra-luu-tru/xac-nhan
// Xác nhận kết quả kiểm tra điều kiện lưu trú và khởi tạo lập hợp đồng
router.post('/xac-nhan', async (req, res) => {
  try {
    const { maHoSo, ketQua } = req.body;
    if (!maHoSo || !Array.isArray(ketQua)) {
      return res.status(400).json({ ok: false, error: 'Thiếu mã hồ sơ hoặc danh sách kết quả kiểm tra' });
    }

    const thanhVienKhongDat = ketQua.filter(tv => !tv.dieuKien);

    if (thanhVienKhongDat.length > 0) {
      return res.json({
        ok: true,
        data: {
          trangThai: 'COMPLIANCE_EXCEPTION',
          message: 'Một số thành viên chưa đáp ứng điều kiện lưu trú.',
          thanhVienKhongDat: thanhVienKhongDat.map(tv => tv.hoTen),
          soThanhVienConLai: ketQua.length - thanhVienKhongDat.length,
          luaChonXuLy: [
            { loai: 'CONTINUE_PARTIAL', nhan: 'Tiếp tục ký HĐ với các thành viên còn lại' },
            { loai: 'TERMINATE_REFUND', nhan: 'Dừng thủ tục thuê — Hoàn cọc 80%' }
          ]
        }
      });
    }

    res.json({
      ok: true,
      data: {
        trangThai: 'SUCCESS',
        message: 'Tất cả thành viên đã đạt điều kiện. Chuyển sang lập hợp đồng.',
        buocTiepTheo: '/contract/draft',
        maHopDong: 'CON-2023-1102'
      }
    });
  } catch (error) {
    console.error('Lỗi khi xác nhận kiểm tra lưu trú:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;
