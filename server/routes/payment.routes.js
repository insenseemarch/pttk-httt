import express from 'express';
import { supabase } from '../config/supabase.js';
import { getIO } from '../config/ketNoiSocket.js';
import { dinhDangNgay } from '../utils/dinhDang.js';
import { tinhKhoanThuDauKy, uocTinhTongCanThu } from '../utils/thuTienDauKy.js';

const router = express.Router();

const TRANG_THAI_CHO_THU = 'Chờ thanh toán';
const TRANG_THAI_SAU_THU = 'Hiệu lực';
const LOAI_HOA_DON_THU_DAU_KY = 'Thu dau ky';
const LOAI_THONG_BAO_BAN_GIAO = 'Bàn giao phòng';

function chuanHoaPhuongThuc(phuongThuc) {
  if (phuongThuc === 'chuyen-khoan') return 'Chuyển khoản';
  if (phuongThuc === 'Tiền mặt' || phuongThuc === 'Chuyển khoản') return phuongThuc;
  return 'Tiền mặt';
}

function taoChiTietThuDauKy({ danhSachKhoanThu, soNguoi, soLuongXe, tongCanThu, tongThucThu }) {
  return {
    soNguoi,
    soLuongXe,
    tongCanThu,
    tongThucThu,
    khoanThu: (danhSachKhoanThu || []).map((k) => ({
      id: k.id || null,
      ten: k.ten || 'Khoản thu',
      donGia: k.donGia != null ? Number(k.donGia) : null,
      soLuong: k.soLuong != null ? Number(k.soLuong) : null,
      soTien: Number(k.soTien || 0),
      kyTinh: k.kyTinh || null,
    })),
  };
}

function dinhDangMaPhieuThu(maHD) {
  return `PT-${String(maHD).padStart(5, '0')}`;
}

// GET /api/ke-toan/cho-thu — danh sách HĐ đang chờ thu tiền kỳ đầu
router.get('/cho-thu', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('HopDong')
      .select(`
        MaHopDong,
        TrangThai,
        GiaThue,
        BieuPhiDichVu,
        NgayGioBD,
        NgayGioKT,
        KyThanhToan,
        KhachHang ( HoTen, SDT, CCCD ),
        ChiTiet (
          SoLuong,
          Giuong (
            Phong ( MaPhong, LoaiPhong, ChiNhanh ( TenCN ) )
          )
        )
      `)
      .eq('TrangThai', TRANG_THAI_CHO_THU)
      .order('MaHopDong', { ascending: false });

    if (error) throw error;

    const danhSach = (data || []).map((hd) => {
      const phong = hd.ChiTiet?.[0]?.Giuong?.Phong;
      const soNguoi = (hd.ChiTiet || []).reduce((s, ct) => s + Number(ct.SoLuong || 1), 0);
      const bieuPhi = Array.isArray(hd.BieuPhiDichVu) ? hd.BieuPhiDichVu : [];
      const giaThueNum = Number(hd.GiaThue || 0);
      const tongCanThuNum = uocTinhTongCanThu({
        giaThue: giaThueNum,
        kyThanhToan: hd.KyThanhToan,
        bieuPhi,
        soNguoi,
        soLuongXe: 1,
      });
      return {
        maHopDong: hd.MaHopDong,
        maHD: `HD-${String(hd.MaHopDong).padStart(5, '0')}`,
        trangThai: hd.TrangThai,
        hoTen: hd.KhachHang?.HoTen || '—',
        sdt: hd.KhachHang?.SDT || '',
        cccd: hd.KhachHang?.CCCD ? String(hd.KhachHang.CCCD) : '—',
        phong: phong ? `P.${phong.MaPhong} — ${phong.LoaiPhong}` : '—',
        chiNhanh: phong?.ChiNhanh?.TenCN || '',
        ngayBatDau: hd.NgayGioBD ? dinhDangNgay(hd.NgayGioBD) : '—',
        giaThue: giaThueNum.toLocaleString('vi-VN') + 'đ',
        giaThueNum,
        soNguoi,
        tongCanThu: tongCanThuNum.toLocaleString('vi-VN') + 'đ',
        tongCanThuNum,
      };
    });

    res.json({ ok: true, danhSach });
  } catch (error) {
    console.error('Lỗi lấy danh sách chờ thu:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// GET /api/ke-toan/chi-tiet-thanh-toan/:maHopDong
router.get('/chi-tiet-thanh-toan/:maHopDong', async (req, res) => {
  try {
    const { maHopDong } = req.params;
    if (!maHopDong) {
      return res.status(400).json({ ok: false, error: 'Thiếu mã hợp đồng' });
    }

    const { data: hd, error } = await supabase
      .from('HopDong')
      .select(`
        MaHopDong,
        GiaThue,
        BieuPhiDichVu,
        NgayGioBD,
        KyThanhToan,
        TrangThai,
        KhachHang ( HoTen, SDT, CCCD ),
        ChiTiet (
          SoLuong,
          Giuong ( Phong ( MaPhong, LoaiPhong ) )
        )
      `)
      .eq('MaHopDong', Number(maHopDong))
      .single();

    if (error || !hd) {
      return res.status(404).json({ ok: false, error: 'Không tìm thấy hợp đồng' });
    }

    const phong = hd.ChiTiet?.[0]?.Giuong?.Phong;
    const soNguoi = (hd.ChiTiet || []).reduce((s, ct) => s + Number(ct.SoLuong || 1), 0);
    const giaThue = Number(hd.GiaThue || 0);
    const bieuPhi = Array.isArray(hd.BieuPhiDichVu) ? hd.BieuPhiDichVu : [];
    const soLuongXe = Math.max(0, Number(req.query.soLuongXe ?? 1) || 0);

    const { danhSachKhoanThu, tongTienPhaiThu, soLuongXeMacDinh } = tinhKhoanThuDauKy({
      giaThue,
      kyThanhToan: hd.KyThanhToan,
      bieuPhi,
      soNguoi,
      soLuongXe,
    });

    res.json({
      ok: true,
      data: {
        maHopDong: hd.MaHopDong,
        khachHang: {
          tenKhach: hd.KhachHang?.HoTen || '—',
          cccd: hd.KhachHang?.CCCD ? String(hd.KhachHang.CCCD) : '—',
          sdt: hd.KhachHang?.SDT || '—',
          phong: phong ? `P.${phong.MaPhong} — ${phong.LoaiPhong}` : '—',
          soNguoi,
          ngayBatDau: hd.NgayGioBD ? dinhDangNgay(hd.NgayGioBD) : '—',
          kyThanhToan: hd.KyThanhToan || 'Thanh toán hàng tháng',
        },
        danhSachKhoanThu,
        soLuongXeMacDinh,
        tongTienPhaiThu,
        donViTien: 'VNĐ',
        ghiChuQuanLy: 'Khách đã ký hợp đồng. Kế toán thu tiền thuê kỳ đầu và các phí cố định (nước, internet, gửi xe) trước khi bàn giao phòng. Tiền điện thu theo chỉ số kWh ở các kỳ sau.',
      },
    });
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết thanh toán:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// POST /api/ke-toan/xac-nhan-thu-tien
router.post('/xac-nhan-thu-tien', async (req, res) => {
  try {
    const { phuongThuc, soTienThucThu, maKeToan, maHopDong, soLuongXe } = req.body;
    const maHDNum = Number(maHopDong);
    const soTienNum = Number(soTienThucThu);
    const soXeNum = Math.max(0, Math.min(20, Number(soLuongXe ?? 1) || 0));

    if (!maHDNum || !soTienNum || soTienNum <= 0) {
      return res.status(400).json({ ok: false, error: 'Thiếu số tiền hoặc mã hợp đồng không hợp lệ' });
    }

    const { data: hd, error: errHD } = await supabase
      .from('HopDong')
      .select(`
        MaHopDong,
        MaDatCoc,
        NVQL,
        TrangThai,
        GiaThue,
        BieuPhiDichVu,
        KyThanhToan,
        ChiTiet ( SoLuong )
      `)
      .eq('MaHopDong', maHDNum)
      .single();

    if (errHD || !hd) {
      return res.status(404).json({ ok: false, error: 'Không tìm thấy hợp đồng' });
    }

    if (hd.TrangThai !== TRANG_THAI_CHO_THU) {
      return res.status(409).json({
        ok: false,
        error: `Hợp đồng không ở trạng thái "${TRANG_THAI_CHO_THU}" (hiện tại: ${hd.TrangThai || '—'})`,
      });
    }

    const { data: phieuDaCo } = await supabase
      .from('HoaDon')
      .select('MaHD')
      .eq('MaHopDong', maHDNum)
      .eq('LoaiHoaDon', LOAI_HOA_DON_THU_DAU_KY)
      .maybeSingle();

    if (phieuDaCo) {
      return res.status(409).json({
        ok: false,
        error: `Hợp đồng đã có phiếu thu kỳ đầu (${dinhDangMaPhieuThu(phieuDaCo.MaHD)})`,
      });
    }

    const soNguoi = (hd.ChiTiet || []).reduce((s, ct) => s + Number(ct.SoLuong || 1), 0);
    const bieuPhi = Array.isArray(hd.BieuPhiDichVu) ? hd.BieuPhiDichVu : [];
    const { danhSachKhoanThu, tongTienPhaiThu } = tinhKhoanThuDauKy({
      giaThue: Number(hd.GiaThue || 0),
      kyThanhToan: hd.KyThanhToan,
      bieuPhi,
      soNguoi,
      soLuongXe: soXeNum,
    });

    if (soTienNum < tongTienPhaiThu) {
      return res.status(400).json({
        ok: false,
        error: `Số tiền thu chưa đủ. Cần tối thiểu ${tongTienPhaiThu.toLocaleString('vi-VN')}đ`,
      });
    }

    const homNay = new Date().toISOString().split('T')[0];
    const chiTiet = taoChiTietThuDauKy({
      danhSachKhoanThu,
      soNguoi,
      soLuongXe: soXeNum,
      tongCanThu: tongTienPhaiThu,
      tongThucThu: soTienNum,
    });

    const { data: gd, error: gdError } = await supabase
      .from('HoaDon')
      .insert([{
        MaHopDong: maHDNum,
        SoTien: soTienNum,
        NgayLap: homNay,
        NgayThanhToan: homNay,
        HinhThucThanhToan: chuanHoaPhuongThuc(phuongThuc),
        TrangThai: 'Đã thanh toán',
        LoaiHoaDon: LOAI_HOA_DON_THU_DAU_KY,
        ChiTiet: chiTiet,
        NVKT: maKeToan ? Number(maKeToan) : null,
      }])
      .select()
      .single();

    if (gdError || !gd) {
      console.error('Lỗi ghi HoaDon:', gdError?.message);
      return res.status(500).json({ ok: false, error: gdError?.message || 'Không ghi được hóa đơn' });
    }

    const { data: hdUpdated, error: hdError } = await supabase
      .from('HopDong')
      .update({ TrangThai: TRANG_THAI_SAU_THU })
      .eq('MaHopDong', maHDNum)
      .eq('TrangThai', TRANG_THAI_CHO_THU)
      .select('MaHopDong')
      .maybeSingle();

    if (hdError || !hdUpdated) {
      await supabase.from('HoaDon').delete().eq('MaHD', gd.MaHD);
      return res.status(409).json({
        ok: false,
        error: 'Không cập nhật được trạng thái hợp đồng. Đã huỷ phiếu thu vừa tạo.',
      });
    }

    const noiDungQuanLy = `Kế toán đã thu đủ tiền kỳ đầu cho HĐ-${String(maHDNum).padStart(5, '0')} (Mã HĐ: ${maHDNum}). Vui lòng tiến hành bàn giao phòng.`;

    await supabase.from('ThongBao').insert({
      MaDatCoc: hd.MaDatCoc || null,
      NguoiNhan: hd.NVQL || null,
      VaiTroNhan: 'Quản lý',
      NoiDung: noiDungQuanLy,
      DaDoc: false,
      LoaiThongBao: LOAI_THONG_BAO_BAN_GIAO,
    });

    const io = getIO();
    if (io) {
      io.to('role:QUAN_LY').emit('thong_bao_moi', {
        noiDung: noiDungQuanLy,
        loaiSuKien: LOAI_THONG_BAO_BAN_GIAO,
        phieuId: maHDNum,
      });
    }

    const maPhieuThu = dinhDangMaPhieuThu(gd.MaHD);

    res.json({
      ok: true,
      data: {
        maPhieuThu,
        maHoaDon: gd.MaHD,
        phuongThuc: chuanHoaPhuongThuc(phuongThuc),
        soTienThucThu: soTienNum,
        tongCanThu: tongTienPhaiThu,
        message: 'Xác nhận thu tiền thành công. Đã thông báo Quản lý chuẩn bị bàn giao phòng.',
      },
    });
  } catch (error) {
    console.error('Lỗi khi xác nhận thu tiền:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;
