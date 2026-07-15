import express from 'express';
import { supabase } from '../config/supabase.js';
import { dinhDangNgay, dinhDangTien } from '../utils/dinhDang.js';
import { getIO } from '../config/ketNoiSocket.js';

const router = express.Router();

const TRANG_THAI_CHO_KIEM_TRA = 'Chờ kiểm tra';

function parseMaDatCoc(maHoSo) {
  if (!maHoSo) return null;
  const raw = String(maHoSo).trim();
  if (raw.startsWith('PC-')) return Number(raw.replace('PC-', ''));
  if (/^\d+$/.test(raw)) return Number(raw);
  return null;
}

async function layHoSoKiemTra(maDatCoc) {
  const { data: dc, error } = await supabase
    .from('DatCoc')
    .select(`
      *,
      KhachHang ( CCCD, HoTen, GioiTinh ),
      Phong ( MaPhong, LoaiPhong ( TenLoaiPhong ), GioiTinhYeuCau, SucChuaToiDa ),
      GiuongDatCoc (
        MaGiuong, SoGiuongCoc,
        Giuong ( MaGiuong, MaPhong, GiaThue, TinhTrang )
      ),
      NhomThue (
        MaNhom, CCCD, SoThanhVienDangKy, SoThanhVienDuDieuKien,
        ThanhVienNhom (
          CCCD, ThoaDieuKien, TrangThai,
          KhachHang ( CCCD, HoTen, GioiTinh )
        )
      )
    `)
    .eq('MaDatCoc', maDatCoc)
    .maybeSingle();

  if (error) throw error;
  if (!dc) return null;

  const yc = await layYeuCauThueGanNhat(dc.CCCD);
  dc._soNguoiDuKien = Number(yc?.SoNguoiDuKien || 1);
  return dc;
}

async function layYeuCauThueGanNhat(cccd) {
  const { data } = await supabase
    .from('YeuCauThue')
    .select('SoNguoiDuKien, ThoiGianVao')
    .eq('CCCD', String(cccd))
    .order('NgayTao', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

function laThueNhom(soNguoiDuKien) {
  return Number(soNguoiDuKien || 1) > 1;
}

function laThueNguyenPhong(dc) {
  return dc?.LoaiThue === 'Thuê nguyên phòng';
}

function soGiuongHienThi(dc) {
  if (laThueNguyenPhong(dc)) {
    return Number(dc.Phong?.SucChuaToiDa || dc.SoGiuongThue || 1);
  }
  return Number(dc.SoGiuongThue || 1);
}

function kiemTraChoPhepTiepTuc(dc, soThanhVienDat) {
  if (soThanhVienDat < 1) {
    return { ok: false, lyDo: 'Không còn thành viên nào đủ điều kiện.' };
  }
  if (!laThueNguyenPhong(dc)) {
    const soGiuong = Number(dc.SoGiuongThue || 1);
    if (soThanhVienDat > soGiuong) {
      return {
        ok: false,
        lyDo: `Số người còn lại (${soThanhVienDat}) vượt số giường đã đặt (${soGiuong}).`,
      };
    }
  }
  return { ok: true };
}

async function capNhatSucChuaPhong(maPhong) {
  const { data: giuongs, error } = await supabase
    .from('Giuong')
    .select('MaGiuong, TinhTrang')
    .eq('MaPhong', maPhong);
  if (error) throw error;

  const tong = (giuongs || []).length;
  const conTrong = (giuongs || []).filter((g) => g.TinhTrang).length;
  const { error: errPhong } = await supabase
    .from('Phong')
    .update({ SucChuaConLai: conTrong, TinhTrang: conTrong > 0 })
    .eq('MaPhong', maPhong);
  if (errPhong) throw errPhong;
  return { tong, conTrong };
}

async function traGiuongDatCoc(maDatCoc, maGiuongs) {
  const ids = [...new Set(maGiuongs.map(Number).filter(Number.isFinite))];
  if (!ids.length) return;

  const { error: errXoa } = await supabase
    .from('GiuongDatCoc')
    .delete()
    .eq('MaDatCoc', maDatCoc)
    .in('MaGiuong', ids);
  if (errXoa) throw errXoa;

  await supabase
    .from('KhoaGiuongDatCoc')
    .delete()
    .eq('MaDatCoc', maDatCoc)
    .in('MaGiuong', ids);

  const { error: errGiuong } = await supabase
    .from('Giuong')
    .update({ TinhTrang: true })
    .in('MaGiuong', ids);
  if (errGiuong) throw errGiuong;

  const { data: giuongs, error: errLay } = await supabase
    .from('Giuong')
    .select('MaPhong')
    .in('MaGiuong', ids);
  if (errLay) throw errLay;

  const maPhongs = [...new Set((giuongs || []).map((g) => g.MaPhong).filter(Boolean))];
  for (const maPhong of maPhongs) {
    await capNhatSucChuaPhong(maPhong);
  }
}

async function dieuChinhGiuongSauTiepTuc(dc, soThanhVienConLai) {
  const soGiuongThueGoc = Number(dc.SoGiuongThue || 1);

  if (laThueNguyenPhong(dc)) {
    return {
      giuongGiu: (dc.GiuongDatCoc || []).map((g) => Number(g.MaGiuong)),
      giuongTra: [],
      soGiuongThueMoi: soGiuongThueGoc,
    };
  }

  const giuongDatCoc = dc.GiuongDatCoc?.length
    ? dc.GiuongDatCoc
    : await (async () => {
      const { data, error } = await supabase
        .from('GiuongDatCoc')
        .select('MaGiuong')
        .eq('MaDatCoc', dc.MaDatCoc);
      if (error) throw error;
      return data || [];
    })();

  const tatCaMaGiuong = giuongDatCoc.map((g) => Number(g.MaGiuong)).filter(Number.isFinite);
  const soGiuongCanGiu = Math.min(soThanhVienConLai, tatCaMaGiuong.length);
  const giuongGiu = tatCaMaGiuong.slice(0, soGiuongCanGiu);
  const giuongTra = tatCaMaGiuong.slice(soGiuongCanGiu);

  if (giuongTra.length) {
    await traGiuongDatCoc(dc.MaDatCoc, giuongTra);
  }

  return {
    giuongGiu,
    giuongTra,
    soGiuongThueMoi: giuongGiu.length,
  };
}

async function luuPhieuDoiSoatThanhVienKhongDat(dc, dsKhongDat, soGiuongThueGoc) {
  const soTienCoc = Number(dc.SoTienCoc || 0);
  const soNguoiCoc = Math.max(1, Number(soGiuongThueGoc || dc.SoGiuongThue || 1));
  const tienCocMotNguoi = soTienCoc / soNguoiCoc;
  const tyLe = 80;

  const danhSachKhauTru = [
    { id: '_meta', name: 'MaDatCoc', desc: String(dc.MaDatCoc), amount: 0 },
    { id: '_meta', name: 'LoaiDoiSoat', desc: 'HOAN_COC_THANH_VIEN_KHONG_DAT', amount: 0 },
    { id: '_meta', name: 'SoThanhVienKhongDat', desc: String(dsKhongDat.length), amount: 0 },
    ...dsKhongDat.map((tv, i) => ({
      id: `tv-${i}`,
      name: 'ThanhVienKhongDat',
      desc: `${tv.hoTen || ''}|${String(tv.cccd || '')}|${tv.lyDo || 'Không đáp ứng điều kiện lưu trú'}`,
      amount: Math.round(tienCocMotNguoi * (tyLe / 100)),
    })),
  ];

  const soTienHoan = danhSachKhauTru
    .filter((k) => k.name === 'ThanhVienKhongDat')
    .reduce((s, k) => s + (Number(k.amount) || 0), 0);

  const payload = {
    NgayDKTraPhong: new Date().toISOString().split('T')[0],
    TyLeHoanTien: tyLe,
    SoTienHoanTamTinh: soTienHoan,
    SoTienHoanThuc: soTienHoan,
    KhauTruTienThue: 0,
    KhauTruTienDichVu: 0,
    KhauTruSuaChua: 0,
    KhauTruViPham: 0,
    LoaiHinhTraPhong: 'huy_thue',
    LyDoTraPhong: `Hoàn cọc 80% cho ${dsKhongDat.length} thành viên không đạt điều kiện lưu trú (PC-${dc.MaDatCoc}).`,
    DanhSachKhauTru: danhSachKhauTru,
    TrangThai: 'Chờ đối soát',
  };

  await upsertPhieuDoiSoatDatCoc(dc, payload);
}

async function thongBaoKeToanHoanCocThanhVien(dc, soThanhVienKhongDat) {
  const noiDung = [
    `[PC-${dc.MaDatCoc}]`,
    `Có ${soThanhVienKhongDat} thành viên không đạt điều kiện lưu trú.`,
    'Cần đối soát hoàn cọc 80% phần cọc tương ứng.',
    'Nhóm tiếp tục ký HĐ với các thành viên còn lại.',
  ].join(' ');

  const { error } = await supabase.from('ThongBao').insert({
    MaDatCoc: dc.MaDatCoc,
    NguoiNhan: dc.NVKT || null,
    VaiTroNhan: 'Kế toán',
    NoiDung: noiDung,
    DaDoc: false,
    LoaiThongBao: 'Chờ đối soát',
  });
  if (error) throw error;

  const io = getIO();
  if (io) {
    io.to('role:KE_TOAN').emit('thong_bao_moi', {
      phieuId: dc.MaDatCoc,
      noiDung,
      loaiSuKien: 'Chờ đối soát',
    });
  }
}

async function giaiPhongToanBoGiuong(dc) {
  const giuongDatCoc = dc.GiuongDatCoc?.length
    ? dc.GiuongDatCoc
    : await (async () => {
      const { data, error } = await supabase
        .from('GiuongDatCoc')
        .select('MaGiuong')
        .eq('MaDatCoc', dc.MaDatCoc);
      if (error) throw error;
      return data || [];
    })();

  const tatCaMaGiuong = giuongDatCoc.map((g) => Number(g.MaGiuong)).filter(Number.isFinite);
  if (tatCaMaGiuong.length) {
    await traGiuongDatCoc(dc.MaDatCoc, tatCaMaGiuong);
  }

  await supabase.from('KhoaGiuongDatCoc').delete().eq('MaDatCoc', dc.MaDatCoc);
  return tatCaMaGiuong.length;
}

async function upsertPhieuDoiSoatDatCoc(dc, payload) {
  const { data: existing, error: errTim } = await supabase
    .from('PhieuDoiSoat')
    .select('MaPhieu')
    .eq('MaDatCoc', dc.MaDatCoc)
    .order('MaPhieu', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (errTim) throw errTim;

  if (existing?.MaPhieu) {
    const { error } = await supabase.from('PhieuDoiSoat').update(payload).eq('MaPhieu', existing.MaPhieu);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from('PhieuDoiSoat').insert({ ...payload, MaDatCoc: dc.MaDatCoc });
  if (error) throw error;
}

async function luuPhieuDoiSoatTuChoiKy(dc, dsKhongDat, laNhom) {
  const soTienCoc = Number(dc.SoTienCoc || 0);
  const tyLe = 80;
  const soTienHoan = Math.round(soTienCoc * (tyLe / 100));

  const thanhVienItems = (dsKhongDat || []).map((tv, i) => ({
    id: `tv-${i}`,
    name: 'ThanhVienKhongDat',
    desc: `${tv.hoTen || ''}|${String(tv.cccd || '')}|${tv.lyDo || 'Không đáp ứng điều kiện lưu trú'}`,
    amount: 0,
  }));

  const danhSachKhauTru = [
    { id: '_meta', name: 'MaDatCoc', desc: String(dc.MaDatCoc), amount: 0 },
    { id: '_meta', name: 'LoaiDoiSoat', desc: 'HOAN_COC_TU_CHOI_KY', amount: 0 },
    { id: '_meta', name: 'HinhThuc', desc: laNhom ? 'DUNG_THUE_NHOM' : 'CA_NHAN', amount: 0 },
    ...thanhVienItems,
  ];

  const lyDo = laNhom
    ? `Từ chối ký HĐ / dừng thuê nhóm do không đạt điều kiện lưu trú (PC-${dc.MaDatCoc}).`
    : `Từ chối ký HĐ: khách cá nhân không đạt điều kiện lưu trú (PC-${dc.MaDatCoc}).`;

  await upsertPhieuDoiSoatDatCoc(dc, {
    NgayDKTraPhong: new Date().toISOString().split('T')[0],
    TyLeHoanTien: tyLe,
    SoTienHoanTamTinh: soTienHoan,
    SoTienHoanThuc: soTienHoan,
    KhauTruTienThue: 0,
    KhauTruTienDichVu: 0,
    KhauTruSuaChua: 0,
    KhauTruViPham: 0,
    LoaiHinhTraPhong: 'huy_thue',
    LyDoTraPhong: lyDo,
    DanhSachKhauTru: danhSachKhauTru,
    TrangThai: 'Chờ đối soát',
  });
}

async function thongBaoKeToanTuChoiKy(dc, laNhom) {
  const noiDung = laNhom
    ? `[PC-${dc.MaDatCoc}] Nhóm dừng thuê do không đạt điều kiện lưu trú. Cần đối soát hoàn cọc 80% toàn bộ tiền cọc.`
    : `[PC-${dc.MaDatCoc}] Khách cá nhân bị từ chối ký HĐ. Cần đối soát hoàn cọc 80% tiền cọc.`;

  const { error } = await supabase.from('ThongBao').insert({
    MaDatCoc: dc.MaDatCoc,
    NguoiNhan: dc.NVKT || null,
    VaiTroNhan: 'Kế toán',
    NoiDung: noiDung,
    DaDoc: false,
    LoaiThongBao: 'Chờ đối soát',
  });
  if (error) throw error;

  const io = getIO();
  if (io) {
    io.to('role:KE_TOAN').emit('thong_bao_moi', {
      phieuId: dc.MaDatCoc,
      noiDung,
      loaiSuKien: 'Chờ đối soát',
    });
  }
}

async function ghiNhanKetQuaThanhVien(dc, ketQua) {
  if (!dc.MaNhom) return;
  for (const tv of ketQua) {
    if (!tv.cccd) continue;
    await supabase
      .from('ThanhVienNhom')
      .update({
        ThoaDieuKien: Boolean(tv.dieuKien),
        LyDoKhongDat: tv.dieuKien ? null : (tv.lyDo || 'Không đáp ứng điều kiện lưu trú'),
        TrangThai: tv.dieuKien ? 'Đạt điều kiện' : 'Không đạt điều kiện',
      })
      .eq('MaNhom', dc.MaNhom)
      .eq('CCCD', String(tv.cccd));
  }
}

async function capNhatSoThanhVienDuDieuKien(dc, soDat) {
  if (!dc.MaNhom) return;
  await supabase
    .from('NhomThue')
    .update({ SoThanhVienDuDieuKien: soDat })
    .eq('MaNhom', dc.MaNhom);
}

async function chuyenTrangThaiDatCoc(dc, trangThaiMoi, nguoiThucHien, ghiChu) {
  const { error: errCapNhat } = await supabase
    .from('DatCoc')
    .update({ TrangThai: trangThaiMoi, CapNhatLuc: new Date().toISOString() })
    .eq('MaDatCoc', dc.MaDatCoc);
  if (errCapNhat) throw errCapNhat;

  const { error: errLichSu } = await supabase.from('LichSuDatCoc').insert({
    MaDatCoc: dc.MaDatCoc,
    TrangThaiCu: dc.TrangThai,
    TrangThaiMoi: trangThaiMoi,
    NguoiThucHien: nguoiThucHien || null,
    VaiTroThucHien: 'Quản lý',
    GhiChu: ghiChu,
  });
  if (errLichSu) throw errLichSu;
}

function mapThanhVienKiemTra(dc, idx, kh, extra = {}) {
  return {
    id: String(idx + 1).padStart(2, '0'),
    hoTen: kh?.HoTen || '',
    truongNhom: String(kh?.CCCD) === String(dc.NhomThue?.CCCD || dc.CCCD),
    cccd: String(kh?.CCCD || ''),
    gioiTinh: kh?.GioiTinh || '—',
    daDoiChieuCCCD: extra.trangThai === 'Đã đối chiếu CCCD',
    ...extra,
  };
}

// GET /api/kiem-tra-luu-tru — danh sách hồ sơ chờ Quản lý kiểm tra ĐK lưu trú
router.get('/', async (req, res) => {
  try {
    const { timKiem = '', maCN = '' } = req.query;

    let query = supabase
      .from('DatCoc')
      .select(`
        MaDatCoc, ThoiDiemTao, DatCocThanhCong, CapNhatLuc, SoTienCoc, TrangThai,
        LoaiThue, SoGiuongThue, MaCN, CCCD, MaNhom,
        KhachHang ( CCCD, HoTen, SDT ),
        Phong ( MaPhong, LoaiPhong ( TenLoaiPhong ), ChiNhanh ( TenCN ) ),
        ChiNhanh ( TenCN ),
        GiuongDatCoc ( MaGiuong, Giuong ( Phong ( MaPhong, LoaiPhong ( TenLoaiPhong ), ChiNhanh ( TenCN ) ) ) )
      `, { count: 'exact' })
      .eq('TrangThai', TRANG_THAI_CHO_KIEM_TRA)
      .order('CapNhatLuc', { ascending: false, nullsFirst: false });

    if (maCN) query = query.eq('MaCN', Number(maCN));

    const { data, error, count } = await query;
    if (error) throw error;

    const tenLP = (lp) => (lp && typeof lp === 'object' ? lp.TenLoaiPhong : lp) || '—';

    let ketQua = await Promise.all((data || []).map(async (dc) => {
      const phongTrucTiep = dc.Phong;
      const phongTuGiuong = dc.GiuongDatCoc?.[0]?.Giuong?.Phong;
      const phong = phongTrucTiep || phongTuGiuong;
      const tenCN = phong?.ChiNhanh?.TenCN || dc.ChiNhanh?.TenCN || '—';
      const yc = await layYeuCauThueGanNhat(dc.CCCD);
      const soNguoiDuKien = Number(yc?.SoNguoiDuKien || 1);
      return {
        maDatCoc: dc.MaDatCoc,
        maPhieu: `PC-${dc.MaDatCoc}`,
        hoTen: dc.KhachHang?.HoTen || '—',
        sdt: dc.KhachHang?.SDT || '—',
        cccd: dc.CCCD ? String(dc.CCCD) : '—',
        phong: phong ? `P.${phong.MaPhong} — ${tenLP(phong.LoaiPhong)}` : 'Chưa xác định',
        chiNhanh: tenCN,
        soGiuongThue: dc.SoGiuongThue || 1,
        soNguoiDuKien,
        loaiThue: dc.LoaiThue || 'Thuê giường lẻ',
        soTienCocFmt: dinhDangTien(dc.SoTienCoc),
        trangThai: dc.TrangThai,
        ngayChuyenKiemTra: dinhDangNgay(dc.CapNhatLuc || dc.DatCocThanhCong || dc.ThoiDiemTao),
        laThuNhom: laThueNhom(soNguoiDuKien),
      };
    }));

    if (timKiem.trim()) {
      const q = timKiem.trim().toLowerCase();
      ketQua = ketQua.filter((item) =>
        item.hoTen.toLowerCase().includes(q)
        || item.sdt.includes(q)
        || item.cccd.includes(q)
        || item.maPhieu.toLowerCase().includes(q)
        || item.phong.toLowerCase().includes(q),
      );
    }

    res.json({ ok: true, danhSach: ketQua, tong: count || ketQua.length });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách kiểm tra lưu trú:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// GET /api/kiem-tra-luu-tru/:maHoSo
router.get('/:maHoSo', async (req, res) => {
  try {
    const maDatCoc = parseMaDatCoc(req.params.maHoSo);
    if (!maDatCoc) {
      return res.status(400).json({ ok: false, error: 'Mã hồ sơ không hợp lệ (dùng PC-{maDatCoc})' });
    }

    const hoSo = await layHoSoKiemTra(maDatCoc);
    if (!hoSo) {
      return res.status(404).json({ ok: false, error: 'Không tìm thấy hồ sơ đặt cọc' });
    }

    let danhSachThanhVien = [];
    const nhom = hoSo.NhomThue;

    if (nhom?.ThanhVienNhom?.length) {
      danhSachThanhVien = nhom.ThanhVienNhom.map((tv, idx) =>
        mapThanhVienKiemTra(hoSo, idx, tv.KhachHang, { trangThai: tv.TrangThai }),
      );
    } else if (hoSo.KhachHang) {
      danhSachThanhVien = [
        mapThanhVienKiemTra(hoSo, 0, hoSo.KhachHang, {
          trangThai: String(hoSo.LyDoXuLy || '').includes('[CCCD_OK]') ? 'Đã đối chiếu CCCD' : 'Đã ghi nhận',
        }),
      ];
    }

    const tenLP = (lp) => (lp && typeof lp === 'object' ? lp.TenLoaiPhong : lp) || '—';
    const soNguoiDuKien = hoSo._soNguoiDuKien || 1;

    const data = {
      thongTinDatCoc: {
        maHoSo: `PC-${maDatCoc}`,
        maDatCoc,
        trangThai: hoSo.TrangThai || 'Chờ kiểm tra',
        ngayNhanPhong: dinhDangNgay(hoSo.DatCocThanhCong || hoSo.ThoiDiemTao),
        thoiHanThue: hoSo.ThoiHanThue || 6,
        phongDuKien: hoSo.Phong
          ? `P.${hoSo.Phong.MaPhong} - ${tenLP(hoSo.Phong.LoaiPhong)}`
          : 'Chưa xác định',
        soTienDaCoc: Number(hoSo.SoTienCoc || 0),
        donViTien: 'VNĐ',
        ghiChuSales: hoSo.LyDoXuLy || 'Không có ghi chú.',
        soGiuongThue: hoSo.SoGiuongThue || 1,
        soGiuongHienThi: soGiuongHienThi(hoSo),
        loaiThue: hoSo.LoaiThue || 'Thuê giường lẻ',
        laThuNguyenPhong: laThueNguyenPhong(hoSo),
        soNguoiDuKien,
        laThuNhom: laThueNhom(soNguoiDuKien),
        gioiTinhYeuCau: hoSo.Phong?.GioiTinhYeuCau || null,
      },
      danhSachThanhVien,
    };

    res.json({ ok: true, data });
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu kiểm tra lưu trú:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

const TRANG_THAI_DAT_DU       = 'Chờ lập hợp đồng';                // tất cả đạt
const TRANG_THAI_DAT_MOT_PHAN = 'Chờ lập hợp đồng (điều chỉnh)';  // nhóm một phần đạt
const TRANG_THAI_DUNG_THUE    = 'Chờ hoàn cọc';                    // từ chối / dừng thuê

async function thongBaoNhanVienLapHopDong(dc, soThanhVien) {
  const noiDung = [
    `[PC-${dc.MaDatCoc}]`,
    dc.KhachHang?.HoTen || 'Khách hàng',
    `đã đạt kiểm tra điều kiện lưu trú (${soThanhVien} người).`,
    'Vui lòng lập hợp đồng và hướng dẫn khách ký.',
  ].join(' ');

  const { error } = await supabase.from('ThongBao').insert({
    MaDatCoc: dc.MaDatCoc,
    NguoiNhan: null,
    VaiTroNhan: 'Phụ trách',
    NoiDung: noiDung,
    DaDoc: false,
    LoaiThongBao: 'Chờ lập hợp đồng',
  });
  if (error) throw error;

  const io = getIO();
  if (io) {
    io.to('role:PHU_TRACH').emit('thong_bao_moi', {
      phieuId: dc.MaDatCoc,
      noiDung,
      loaiSuKien: 'Chờ lập hợp đồng',
    });
    console.log('[Socket] Broadcasted thong_bao_moi to room: role:PHU_TRACH');
  }
}

// POST /api/kiem-tra-luu-tru/xac-nhan
// Bước 1 (không có luaChon): đánh giá kết quả kiểm tra.
// Bước 2 (có luaChon): áp dụng quyết định của nhóm.
router.post('/xac-nhan', async (req, res) => {
  try {
    const { maHoSo, ketQua, luaChon = null, nguoiThucHien = null } = req.body;
    const maDatCoc = parseMaDatCoc(maHoSo);
    if (!maDatCoc || !Array.isArray(ketQua)) {
      return res.status(400).json({ ok: false, error: 'Thiếu mã hồ sơ hoặc danh sách kết quả kiểm tra' });
    }

    const dc = await layHoSoKiemTra(maDatCoc);
    if (!dc) {
      return res.status(404).json({ ok: false, error: 'Không tìm thấy hồ sơ đặt cọc' });
    }
    if (dc.TrangThai !== TRANG_THAI_CHO_KIEM_TRA) {
      return res.status(400).json({ ok: false, error: `Hồ sơ không ở trạng thái "${TRANG_THAI_CHO_KIEM_TRA}" (hiện: ${dc.TrangThai}).` });
    }

    const soNguoiDuKien = dc._soNguoiDuKien || 1;
    const laNhom = laThueNhom(soNguoiDuKien);
    const dsKhongDat = ketQua.filter((tv) => !tv.dieuKien);
    const dsDat = ketQua.filter((tv) => tv.dieuKien);
    const soGiuongThueGoc = Number(dc.SoGiuongThue || 1);

    // ─── Bước 2: áp dụng quyết định ───
    if (luaChon === 'CONTINUE_PARTIAL') {
      if (!laNhom) {
        return res.status(400).json({ ok: false, error: 'Chỉ áp dụng cho hồ sơ thuê nhóm.' });
      }

      const { ok, lyDo } = kiemTraChoPhepTiepTuc(dc, dsDat.length);
      if (!ok) {
        return res.status(400).json({ ok: false, error: lyDo });
      }

      await ghiNhanKetQuaThanhVien(dc, ketQua);
      await capNhatSoThanhVienDuDieuKien(dc, dsDat.length);

      const dieuChinh = await dieuChinhGiuongSauTiepTuc(dc, dsDat.length);
      if (!laThueNguyenPhong(dc) && dieuChinh.soGiuongThueMoi !== soGiuongThueGoc) {
        const { error: errSoGiuong } = await supabase
          .from('DatCoc')
          .update({ SoGiuongThue: dieuChinh.soGiuongThueMoi })
          .eq('MaDatCoc', dc.MaDatCoc);
        if (errSoGiuong) throw errSoGiuong;
      }

      if (dsKhongDat.length) {
        await luuPhieuDoiSoatThanhVienKhongDat(dc, dsKhongDat, soGiuongThueGoc);
        await thongBaoKeToanHoanCocThanhVien(dc, dsKhongDat.length);
      }

      const ghiChuDieuChinh = laThueNguyenPhong(dc)
        ? `Kiểm tra ĐK lưu trú: loại ${dsKhongDat.length} thành viên không đạt, tiếp tục ký HĐ nguyên phòng với ${dsDat.length} thành viên.`
        : `Kiểm tra ĐK lưu trú: loại ${dsKhongDat.length} thành viên không đạt, trả ${dieuChinh.giuongTra.length} giường, tiếp tục ký HĐ với ${dsDat.length} thành viên (${dieuChinh.soGiuongThueMoi} giường).`;

      await chuyenTrangThaiDatCoc(
        dc,
        TRANG_THAI_DAT_MOT_PHAN,
        nguoiThucHien,
        ghiChuDieuChinh,
      );
      await thongBaoNhanVienLapHopDong(dc, dsDat.length);

      return res.json({
        ok: true,
        data: {
          trangThai: 'CONTINUE_PARTIAL',
          message: laThueNguyenPhong(dc)
            ? `Đã ghi nhận. Tiếp tục lập hợp đồng nguyên phòng với ${dsDat.length} thành viên đủ điều kiện.`
            : `Đã ghi nhận. Trả ${dieuChinh.giuongTra.length} giường, tiếp tục lập HĐ với ${dsDat.length} thành viên.`,
          buocTiepTheo: '/lap-hop-dong',
          maDatCoc,
          soGiuongConLai: dieuChinh.soGiuongThueMoi,
          soThanhVienKhongDat: dsKhongDat.length,
        },
      });
    }

    if (luaChon === 'TERMINATE_REFUND') {
      await ghiNhanKetQuaThanhVien(dc, ketQua);
      await capNhatSoThanhVienDuDieuKien(dc, 0);

      const soGiuongDaTra = await giaiPhongToanBoGiuong(dc);
      await luuPhieuDoiSoatTuChoiKy(dc, dsKhongDat, laNhom);
      await thongBaoKeToanTuChoiKy(dc, laNhom);

      const ghiChuTuChoi = laNhom
        ? `Kiểm tra ĐK lưu trú: nhóm dừng thuê do ${dsKhongDat.length} thành viên không đạt — trả ${soGiuongDaTra} giường, chuyển hoàn cọc 80%.`
        : 'Kiểm tra ĐK lưu trú: khách không đạt điều kiện — từ chối ký hợp đồng, trả giường, chuyển hoàn cọc 80%.';

      await chuyenTrangThaiDatCoc(
        dc,
        TRANG_THAI_DUNG_THUE,
        nguoiThucHien,
        ghiChuTuChoi,
      );

      const soTienHoan = Math.round(Number(dc.SoTienCoc || 0) * 0.8);
      return res.json({
        ok: true,
        data: {
          trangThai: 'TERMINATED',
          message: laNhom
            ? `Đã dừng thuê nhóm. Trả ${soGiuongDaTra} giường, chuyển kế toán đối soát hoàn cọc 80% (${soTienHoan.toLocaleString('vi-VN')} VNĐ).`
            : `Đã từ chối ký HĐ. Trả giường, chuyển kế toán đối soát hoàn cọc 80% (${soTienHoan.toLocaleString('vi-VN')} VNĐ).`,
          buocTiepTheo: '/doi-soat',
          maDatCoc,
          soGiuongDaTra,
          soTienHoanTamTinh: soTienHoan,
        },
      });
    }

    // ─── Bước 1: đánh giá ───
    if (dsKhongDat.length === 0) {
      await ghiNhanKetQuaThanhVien(dc, ketQua);
      await capNhatSoThanhVienDuDieuKien(dc, dsDat.length);
      await chuyenTrangThaiDatCoc(
        dc,
        TRANG_THAI_DAT_DU,
        nguoiThucHien,
        'Kiểm tra ĐK lưu trú: tất cả thành viên đạt — chuyển lập hợp đồng.',
      );
      await thongBaoNhanVienLapHopDong(dc, dsDat.length);

      return res.json({
        ok: true,
        data: {
          trangThai: 'SUCCESS',
          message: 'Tất cả thành viên đã đạt điều kiện. Chuyển sang lập hợp đồng.',
          buocTiepTheo: '/lap-hop-dong',
          maDatCoc,
        },
      });
    }

    // Có thành viên không đạt
    if (!laNhom) {
      // Thuê cá nhân → từ chối ký hợp đồng
      return res.json({
        ok: true,
        data: {
          trangThai: 'INDIVIDUAL_REJECT',
          message: 'Khách thuê cá nhân không đáp ứng điều kiện lưu trú. Quản lý từ chối ký hợp đồng.',
          thanhVienKhongDat: dsKhongDat.map((tv) => tv.hoTen),
          luaChonXuLy: [
            { loai: 'TERMINATE_REFUND', nhan: 'Dừng thủ tục thuê — Hoàn cọc 80%' },
          ],
        },
      });
    }

    // Thuê nhóm → cho nhóm chọn hướng xử lý
    const { ok: choPhepTiepTuc, lyDo: lyDoKhongChoTiepTuc } = kiemTraChoPhepTiepTuc(dc, dsDat.length);
    return res.json({
      ok: true,
      data: {
        trangThai: 'COMPLIANCE_EXCEPTION',
        message: 'Một số thành viên chưa đáp ứng điều kiện lưu trú.',
        thanhVienKhongDat: dsKhongDat.map((tv) => tv.hoTen),
        soThanhVienConLai: dsDat.length,
        soGiuongThue: soGiuongHienThi(dc),
        loaiThue: dc.LoaiThue || 'Thuê giường lẻ',
        laThuNguyenPhong: laThueNguyenPhong(dc),
        choPhepTiepTuc,
        lyDoKhongChoTiepTuc: choPhepTiepTuc ? null : lyDoKhongChoTiepTuc,
        luaChonXuLy: [
          ...(choPhepTiepTuc
            ? [{ loai: 'CONTINUE_PARTIAL', nhan: `Tiếp tục ký HĐ với ${dsDat.length} thành viên còn lại` }]
            : []),
          { loai: 'TERMINATE_REFUND', nhan: 'Dừng thủ tục thuê — Hoàn cọc 80%' },
        ],
      },
    });
  } catch (error) {
    console.error('Lỗi khi xác nhận kiểm tra lưu trú:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;
