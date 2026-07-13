import express from 'express';
import { supabase } from '../config/supabase.js';
import { dinhDangCCCD, dinhDangNgay } from '../utils/dinhDang.js';

const router = express.Router();

// GET /api/kiem-tra-luu-tru/danh-sach
// Lấy danh sách các hồ sơ đặt cọc đang ở trạng thái 'Đã thanh toán'
router.get('/danh-sach', async (req, res) => {
  try {
    const { data: list, error } = await supabase
      .from('DatCoc')
      .select(`
        MaDatCoc,
        SoTienCoc,
        ThoiDiemTao,
        CCCD,
        KhachHang (
          HoTen
        )
      `)
      .eq('TrangThai', 'Đã thanh toán')
      .order('MaDatCoc', { ascending: false });

    if (error) {
      throw error;
    }

    const data = list.map(item => ({
      maHoSo: String(item.MaDatCoc),
      hoTenKhach: item.KhachHang?.HoTen || 'Khách hàng',
      soTienCoc: item.SoTienCoc,
      ngayTao: item.ThoiDiemTao ? dinhDangNgay(item.ThoiDiemTao) : '—'
    }));

    res.json({ ok: true, data });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách hồ sơ đặt cọc:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// GET /api/kiem-tra-luu-tru/:maHoSo
router.get('/:maHoSo', async (req, res) => {
  try {
    const { maHoSo } = req.params;
    if (!maHoSo) {
      return res.status(400).json({ ok: false, error: 'Thiếu mã hồ sơ đặt cọc' });
    }

    const idDatCoc = parseInt(maHoSo);
    if (isNaN(idDatCoc)) {
      return res.status(400).json({ ok: false, error: 'Mã hồ sơ đặt cọc không hợp lệ' });
    }
    
    // 1. Lấy thông tin hồ sơ đặt cọc
    const { data: datCoc, error: datCocErr } = await supabase
      .from('DatCoc')
      .select(`
        *,
        KhachHang (
          CCCD,
          HoTen,
          SDT,
          Email,
          DiaChi
        )
      `)
      .eq('MaDatCoc', idDatCoc)
      .single();

    if (datCocErr) {
      throw datCocErr;
    }

    // 2. Lấy thông tin phòng dự kiến thông qua GiuongDatCoc -> Giuong -> Phong
    const { data: giuongCocs } = await supabase
      .from('GiuongDatCoc')
      .select(`
        MaGiuong,
        Giuong (
          MaGiuong,
          Phong (
            MaPhong,
            LoaiPhong
          )
        )
      `)
      .eq('MaDatCoc', idDatCoc);

    let phongDuKien = '—';
    if (giuongCocs && giuongCocs.length > 0) {
      const p = giuongCocs[0].Giuong?.Phong;
      if (p) {
        phongDuKien = `P.${p.MaPhong} - ${p.LoaiPhong}`;
      }
    }

    // 3. Lấy danh sách thành viên lưu trú
    let danhSachThanhVien = [];
    if (datCoc.MaNhom) {
      const { data: members, error: membersErr } = await supabase
        .from('ThanhVienNhom')
        .select(`
          CCCD,
          ThoaDieuKien,
          LyDoKhongDat,
          TrangThai,
          KhachHang (
            CCCD,
            HoTen,
            GioiTinh,
            SDT,
            Email,
            DiaChi
          )
        `)
        .eq('MaNhom', datCoc.MaNhom);

      if (membersErr) {
        throw membersErr;
      }

      if (members) {
        danhSachThanhVien = members.map((m, index) => ({
          id: String(index + 1).padStart(2, '0'),
          cccd: dinhDangCCCD(m.CCCD),
          hoTen: m.KhachHang?.HoTen || 'Không rõ',
          gioiTinh: m.KhachHang?.GioiTinh || 'Không rõ',
          truongNhom: String(m.CCCD) === String(datCoc.CCCD),
          dieuKien: m.ThoaDieuKien !== false, // Mặc định là true nếu null
          trangThai: m.ThoaDieuKien === false ? 'Không đạt' : 'Đạt',
          lyDoKhongDat: m.LyDoKhongDat || ''
        }));
      }
    } else {
      // Thuê cá nhân: Thành viên duy nhất chính là người đặt cọc
      danhSachThanhVien = [{
        id: '01',
        cccd: dinhDangCCCD(datCoc.CCCD),
        hoTen: datCoc.KhachHang?.HoTen || 'Không rõ',
        gioiTinh: datCoc.KhachHang?.GioiTinh || 'Không rõ',
        truongNhom: true,
        dieuKien: true,
        trangThai: 'Đạt',
        lyDoKhongDat: ''
      }];
    }

    const data = {
      thongTinDatCoc: {
        maHoSo: String(datCoc.MaDatCoc),
        trangThai: datCoc.TrangThai || 'Đã duyệt',
        ngayNhanPhong: datCoc.ThoiDiemTao ? dinhDangNgay(datCoc.ThoiDiemTao) : '—',
        thoiHanThue: datCoc.ThoiHanThue || 6,
        phongDuKien: phongDuKien,
        soTienDaCoc: datCoc.SoTienCoc || 0,
        donViTien: 'VNĐ',
        ghiChuSales: datCoc.MaNhom ? 'Khách thuê theo nhóm. Đối chiếu CCCD tất cả thành viên.' : 'Khách thuê cá nhân.'
      },
      danhSachThanhVien
    };

    res.json({ ok: true, data });
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu kiểm tra lưu trú:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// POST /api/kiem-tra-luu-tru/xac-nhan
router.post('/xac-nhan', async (req, res) => {
  try {
    const { maHoSo, ketQua } = req.body;
    if (!maHoSo || !Array.isArray(ketQua)) {
      return res.status(400).json({ ok: false, error: 'Thiếu mã hồ sơ hoặc danh sách kết quả kiểm tra' });
    }

    const idDatCoc = parseInt(maHoSo);
    if (isNaN(idDatCoc)) {
      return res.status(400).json({ ok: false, error: 'Mã hồ sơ đặt cọc không hợp lệ' });
    }

    // 1. Lấy thông tin cọc để tìm MaNhom
    const { data: datCoc, error: datCocErr } = await supabase
      .from('DatCoc')
      .select('MaNhom')
      .eq('MaDatCoc', idDatCoc)
      .single();

    if (datCocErr) {
      throw datCocErr;
    }

    // 2. Cập nhật kết quả kiểm tra cho từng thành viên trong DB
    if (datCoc?.MaNhom) {
      for (const item of ketQua) {
        const cccdNum = parseFloat(item.cccd);
        if (!isNaN(cccdNum)) {
          const { error: updateErr } = await supabase
            .from('ThanhVienNhom')
            .update({
              ThoaDieuKien: item.dieuKien,
              TrangThai: 'Đã xác nhận',
              LyDoKhongDat: item.dieuKien ? null : 'Không đáp ứng điều kiện lưu trú ký túc xá'
            })
            .eq('MaNhom', datCoc.MaNhom)
            .eq('CCCD', cccdNum);

          if (updateErr) {
            console.error(`Lỗi cập nhật thành viên CCCD ${item.cccd}:`, updateErr.message);
          }
        }
      }
    }

    // 3. Trả về kết quả nghiệp vụ theo danh sách
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
        maHopDong: `CON-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`
      }
    });
  } catch (error) {
    console.error('Lỗi khi xác nhận kiểm tra lưu trú:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;
