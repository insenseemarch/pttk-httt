import { supabase } from './config/supabase.js';

const DEMO_CCCDS = Array.from({ length: 10 }, (_, index) => 88072026001 + index);

const CUSTOMERS = [
  ['Nguyễn Minh Anh', 'Nữ', 'Việt Nam'],
  ['Trần Quốc Bảo', 'Nam', 'Việt Nam'],
  ['Lê Hoài Phương', 'Nữ', 'Việt Nam'],
  ['Phạm Gia Huy', 'Nam', 'Việt Nam'],
  ['Võ Thanh Trúc', 'Nữ', 'Việt Nam'],
  ['Đặng Nhật Nam', 'Nam', 'Việt Nam'],
  ['Bùi Khánh Linh', 'Nữ', 'Việt Nam'],
  ['Đỗ Anh Khoa', 'Nam', 'Việt Nam'],
  ['Ngô Thảo Vy', 'Nữ', 'Việt Nam'],
  ['Huỳnh Đức Long', 'Nam', 'Việt Nam'],
];

const STATE_CONFIGS = [
  { state: 'MOI', sale: 1, note: 'Khách vừa xác nhận nhu cầu thuê.' },
  { state: 'CHO_KIEM_TRA_PHONG', sale: 1, lock: true, note: 'Sale đã gửi Quản lý kiểm tra chỗ.' },
  { state: 'HET_CHO', sale: 2, note: 'Giường khách chọn đã được khách khác giữ trước.' },
  { state: 'CON_TRONG_CHO_GUI_KE_TOAN', sale: 2, manager: 4, lock: true, note: 'Quản lý xác nhận phòng còn trống.' },
  { state: 'CHO_TINH_COC', sale: 3, manager: 4, lock: true, note: 'Đang chờ Kế toán tính tiền cọc.' },
  { state: 'CHO_THANH_TOAN', sale: 1, accountant: 6, lock: true, amount: 6000000, futureHours: 24, note: 'Đã gửi yêu cầu thanh toán cho khách.' },
  { state: 'CHO_XAC_NHAN_THANH_TOAN', sale: 2, accountant: 6, lock: true, amount: 8000000, futureHours: 16, evidence: 'FT-DEMO-2026-001', note: 'Sale đã gửi mã giao dịch, chờ Quản lý đối chiếu.' },
  { state: 'TU_CHOI_CHUNG_TU', sale: 3, accountant: 6, lock: true, amount: 5600000, futureHours: 12, evidence: 'FT-DEMO-SAI-002', note: 'Ảnh giao dịch mờ, vui lòng tải lại chứng từ.' },
  { state: 'DA_XAC_NHAN', sale: 1, manager: 4, accountant: 6, amount: 5000000, evidence: 'FT-DEMO-OK-003', confirmed: true, note: 'Quản lý đã xác nhận khoản cọc hợp lệ.' },
  { state: 'QUA_HAN_TU_DONG_HUY', sale: 2, accountant: 6, amount: 3500000, pastHours: 2, note: 'Hệ thống tự động hủy do quá hạn 24 giờ.' },
];

const DATABASE_STATUS = Object.freeze({
  MOI: 'Mới tạo',
  CHO_KIEM_TRA_PHONG: 'Chờ duyệt phòng',
  HET_CHO: 'Hết chỗ',
  CON_TRONG_CHO_GUI_KE_TOAN: 'Còn trống',
  CHO_TINH_COC: 'Chờ tính tiền cọc',
  CHO_THANH_TOAN: 'Chờ khách chuyển khoản',
  QUA_HAN_TU_DONG_HUY: 'Quá hạn thanh toán',
  CHO_XAC_NHAN_THANH_TOAN: 'Chờ duyệt cọc',
  DA_XAC_NHAN: 'Đặt cọc thành công',
  TU_CHOI_CHUNG_TU: 'Chứng từ bị từ chối',
});

function databaseStatus(code) {
  return DATABASE_STATUS[code] || code;
}

function isoOffset(hours) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function assertNoError(result, context) {
  if (result.error) throw new Error(`${context}: ${result.error.message}`);
  return result.data;
}

async function cleanupPreviousDemo() {
  const deposits = assertNoError(
    await supabase.from('DatCoc').select('MaDatCoc').in('CCCD', DEMO_CCCDS),
    'Đọc phiếu demo cũ',
  ) || [];
  const ids = deposits.map((item) => item.MaDatCoc);
  if (!ids.length) return;

  const assignedBeds = assertNoError(
    await supabase.from('GiuongDatCoc').select('MaGiuong').in('MaDatCoc', ids),
    'Đọc giường demo cũ',
  ) || [];
  const bedIds = [...new Set(assignedBeds.map((item) => item.MaGiuong))];
  if (bedIds.length) {
    assertNoError(await supabase.from('Giuong').update({ TinhTrang: true }).in('MaGiuong', bedIds), 'Khôi phục giường demo');
  }

  for (const table of ['ThongBaoDatCoc', 'LichSuDatCoc', 'ChungTuDatCoc', 'KhoaGiuongDatCoc', 'GiuongDatCoc']) {
    assertNoError(await supabase.from(table).delete().in('MaDatCoc', ids), `Xóa ${table} demo cũ`);
  }
  assertNoError(await supabase.from('DatCoc').delete().in('MaDatCoc', ids), 'Xóa phiếu demo cũ');
}

async function seedCustomers() {
  const rows = CUSTOMERS.map(([HoTen, GioiTinh, QuocTich], index) => ({
    CCCD: DEMO_CCCDS[index],
    HoTen,
    NgaySinh: `${1999 + (index % 5)}-${String((index % 9) + 1).padStart(2, '0')}-15`,
    GioiTinh,
    QuocTich,
    DiaChi: `${20 + index} Đường Demo, TP.HCM`,
    SDT: `09872026${String(index + 1).padStart(2, '0')}`,
    Email: `deposit.demo${index + 1}@homestaydorm.vn`,
    KhaNangTaiChinh: 15000000 + index * 1000000,
    ThoaDK: true,
  }));
  assertNoError(await supabase.from('KhachHang').upsert(rows, { onConflict: 'CCCD' }), 'Tạo khách hàng demo');
}

async function getAvailableBeds() {
  const beds = assertNoError(
    await supabase
      .from('Giuong')
      .select('MaGiuong, MaPhong, GiaThue, TinhTrang, Phong(MaCN, SucChuaToiDa)')
      .eq('TinhTrang', true)
      .order('MaGiuong'),
    'Đọc giường trống',
  ) || [];
  if (beds.length < STATE_CONFIGS.length) {
    throw new Error(`Cần ${STATE_CONFIGS.length} giường trống để seed demo, hiện chỉ có ${beds.length}.`);
  }
  return beds.slice(0, STATE_CONFIGS.length);
}

function historyFor(depositId, config, createdAt) {
  const paths = {
    MOI: ['MOI'],
    CHO_KIEM_TRA_PHONG: ['MOI', 'CHO_KIEM_TRA_PHONG'],
    HET_CHO: ['MOI', 'CHO_KIEM_TRA_PHONG', 'HET_CHO'],
    CON_TRONG_CHO_GUI_KE_TOAN: ['MOI', 'CHO_KIEM_TRA_PHONG', 'CON_TRONG_CHO_GUI_KE_TOAN'],
    CHO_TINH_COC: ['MOI', 'CHO_KIEM_TRA_PHONG', 'CON_TRONG_CHO_GUI_KE_TOAN', 'CHO_TINH_COC'],
    CHO_THANH_TOAN: ['MOI', 'CHO_KIEM_TRA_PHONG', 'CON_TRONG_CHO_GUI_KE_TOAN', 'CHO_TINH_COC', 'CHO_THANH_TOAN'],
    CHO_XAC_NHAN_THANH_TOAN: ['MOI', 'CHO_KIEM_TRA_PHONG', 'CON_TRONG_CHO_GUI_KE_TOAN', 'CHO_TINH_COC', 'CHO_THANH_TOAN', 'CHO_XAC_NHAN_THANH_TOAN'],
    TU_CHOI_CHUNG_TU: ['MOI', 'CHO_KIEM_TRA_PHONG', 'CON_TRONG_CHO_GUI_KE_TOAN', 'CHO_TINH_COC', 'CHO_THANH_TOAN', 'CHO_XAC_NHAN_THANH_TOAN', 'TU_CHOI_CHUNG_TU'],
    DA_XAC_NHAN: ['MOI', 'CHO_KIEM_TRA_PHONG', 'CON_TRONG_CHO_GUI_KE_TOAN', 'CHO_TINH_COC', 'CHO_THANH_TOAN', 'CHO_XAC_NHAN_THANH_TOAN', 'DA_XAC_NHAN'],
    QUA_HAN_TU_DONG_HUY: ['MOI', 'CHO_KIEM_TRA_PHONG', 'CON_TRONG_CHO_GUI_KE_TOAN', 'CHO_TINH_COC', 'CHO_THANH_TOAN', 'QUA_HAN_TU_DONG_HUY'],
  };
  return paths[config.state].map((state, index, path) => ({
    MaDatCoc: depositId,
    TrangThaiCu: index ? databaseStatus(path[index - 1]) : null,
    TrangThaiMoi: databaseStatus(state),
    NguoiThucHien: state === 'CHO_TINH_COC' ? config.sale : state === 'CHO_THANH_TOAN' ? 6 : state === 'DA_XAC_NHAN' ? 4 : config.sale,
    VaiTroThucHien: state === 'CHO_THANH_TOAN' ? 'Kế toán' : state === 'DA_XAC_NHAN' ? 'Quản lý' : state === 'QUA_HAN_TU_DONG_HUY' ? 'Hệ thống' : 'Nhân viên Sale',
    GhiChu: index === path.length - 1 ? config.note : null,
    ThoiDiem: new Date(new Date(createdAt).getTime() + index * 20 * 60 * 1000).toISOString(),
  }));
}

async function seedDeposits(beds) {
  const summary = [];
  for (let index = 0; index < STATE_CONFIGS.length; index += 1) {
    const config = STATE_CONFIGS[index];
    const bed = beds[index];
    const createdAt = new Date(Date.now() - (36 - index * 2) * 60 * 60 * 1000).toISOString();
    const deadline = config.futureHours ? isoOffset(config.futureHours) : config.pastHours ? isoOffset(-config.pastHours) : null;
    const row = {
      CCCD: DEMO_CCCDS[index],
      ThoiDiemTao: createdAt,
      SoTienCoc: config.amount || 0,
      HinhThucThanhToan: config.amount ? 'Chuyển khoản' : null,
      HanThanhToan: deadline,
      TrangThai: databaseStatus(config.state),
      NVQL: config.manager || null,
      NVKT: config.accountant || null,
      LoaiThue: 'Thuê giường lẻ',
      MaPhong: bed.MaPhong,
      MaCN: bed.Phong?.MaCN,
      NVSale: config.sale,
      SoGiuongThue: 1,
      ThoiHanThue: 6,
      BatDauThanhToan: config.amount ? new Date(new Date(deadline || createdAt).getTime() - 24 * 60 * 60 * 1000).toISOString() : null,
      DatCocThanhCong: config.confirmed ? isoOffset(-1) : null,
      LyDoXuLy: config.note,
      CapNhatLuc: new Date().toISOString(),
    };
    const deposit = assertNoError(await supabase.from('DatCoc').insert(row).select().single(), `Tạo phiếu ${config.state}`);
    assertNoError(await supabase.from('GiuongDatCoc').insert({
      MaGiuong: bed.MaGiuong,
      MaDatCoc: deposit.MaDatCoc,
      NgayBatDau: createdAt,
      NgayHetHan: deadline,
      SoGiuongCoc: 1,
    }), `Gắn giường phiếu ${deposit.MaDatCoc}`);

    if (config.lock) {
      assertNoError(await supabase.from('KhoaGiuongDatCoc').insert({
        MaGiuong: bed.MaGiuong,
        MaDatCoc: deposit.MaDatCoc,
        HetHanLuc: deadline,
      }), `Khóa giường phiếu ${deposit.MaDatCoc}`);
    }
    if (config.confirmed) {
      assertNoError(await supabase.from('Giuong').update({ TinhTrang: false }).eq('MaGiuong', bed.MaGiuong), 'Đánh dấu giường đã cọc');
    }
    if (config.evidence) {
      assertNoError(await supabase.from('ChungTuDatCoc').insert({
        MaDatCoc: deposit.MaDatCoc,
        MaGiaoDich: config.evidence,
        NguoiTaiLen: config.sale,
        TrangThai: config.state === 'TU_CHOI_CHUNG_TU' ? 'Từ chối' : config.confirmed ? 'Đã xác nhận' : 'Chờ xác nhận',
      }), `Tạo chứng từ phiếu ${deposit.MaDatCoc}`);
    }
    assertNoError(await supabase.from('LichSuDatCoc').insert(historyFor(deposit.MaDatCoc, config, createdAt)), `Tạo lịch sử phiếu ${deposit.MaDatCoc}`);

    const recipient = ['CHO_KIEM_TRA_PHONG', 'CHO_XAC_NHAN_THANH_TOAN'].includes(config.state)
      ? { VaiTroNhan: 'Quản lý' }
      : config.state === 'CHO_TINH_COC'
        ? { VaiTroNhan: 'Kế toán' }
        : { NguoiNhan: config.sale };
    assertNoError(await supabase.from('ThongBaoDatCoc').insert({
      MaDatCoc: deposit.MaDatCoc,
      ...recipient,
      NoiDung: `[DEMO] Phiếu #${deposit.MaDatCoc}: ${config.note}`,
      DaDoc: index % 3 === 0,
    }), `Tạo thông báo phiếu ${deposit.MaDatCoc}`);
    summary.push({ id: deposit.MaDatCoc, customer: CUSTOMERS[index][0], state: config.state, bed: bed.MaGiuong, sale: config.sale });
  }
  return summary;
}

async function run() {
  await cleanupPreviousDemo();
  await seedCustomers();
  const beds = await getAvailableBeds();
  const summary = await seedDeposits(beds);
  console.table(summary);
  console.log(`Đã tạo ${summary.length} phiếu demo đặt cọc.`);
}

run().catch((error) => {
  console.error('Seed demo thất bại:', error.message);
  process.exitCode = 1;
});
