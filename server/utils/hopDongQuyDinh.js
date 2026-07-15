export const QUY_DINH_HOAN_COC = [
  { moTa: 'Đã đặt cọc, chưa ký HĐ', mucHoan: '80%' },
  { moTa: 'Đã ký HĐ, lưu trú dưới 6 tháng', mucHoan: '50%' },
  { moTa: 'Đã ký HĐ, lưu trú từ 6 tháng trở lên', mucHoan: '70%' },
  { moTa: 'Hết hạn hợp đồng theo thỏa thuận', mucHoan: '100%' },
];

export const NOI_QUY_MAC_DINH = [
  'Tuân thủ giờ giấc sinh hoạt chung (không gây ồn ào sau 22:00)',
  'Giữ gìn vệ sinh khu vực chung và phòng ở',
  'Không hút thuốc trong khuôn viên ký túc xá',
  'Không nuôi thú cưng trong phòng',
  'Bảo quản tài sản, chìa khóa và thẻ từ được cấp',
  'Không tự ý sửa chữa, thay đổi cấu trúc phòng',
  'Không cho người lạ lưu trú qua đêm khi chưa đăng ký',
  'Báo cáo ngay với quản lý khi phát sinh hư hỏng tài sản hoặc sự cố an toàn',
];

export const DIEU_KHOAN_VI_PHAM = [
  'Vi phạm nội quy lần 1: nhắc nhở bằng văn bản và yêu cầu khắc phục trong 48 giờ',
  'Vi phạm nghiêm trọng hoặc tái phạm: có thể chấm dứt hợp đồng và khấu trừ chi phí theo quy định hoàn cọc',
  'Gây hư hỏng tài sản: bồi thường theo giá trị thực tế sửa chữa hoặc thay thế',
  'Nợ tiền thuê / điện nước / dịch vụ quá hạn: tạm ngưng dịch vụ và thu hồi theo quy trình đối soát',
  'Chuyển nhượng giường/phòng cho bên thứ ba khi chưa được quản lý chấp thuận: vi phạm hợp đồng',
];

export const KY_THANH_TOAN_MAC_DINH = 'Thanh toán hàng tháng';

export const KY_THANH_TOAN_OPTIONS = [
  KY_THANH_TOAN_MAC_DINH,
  'Thanh toán 3 tháng / kỳ',
  'Thanh toán 6 tháng / kỳ',
];

const KY_THANH_TOAN_CODE_MAP = {
  MONTHLY: KY_THANH_TOAN_MAC_DINH,
  QUARTERLY: 'Thanh toán 3 tháng / kỳ',
  BIANNUAL: 'Thanh toán 6 tháng / kỳ',
};

/** Chuẩn hóa kỳ thanh toán sang tiếng Việt (tương thích mã EN / dữ liệu cũ). */
export function chuanHoaKyThanhToan(raw) {
  if (raw == null || raw === '') return KY_THANH_TOAN_MAC_DINH;
  const s = String(raw).trim();
  if (KY_THANH_TOAN_CODE_MAP[s]) return KY_THANH_TOAN_CODE_MAP[s];
  if (KY_THANH_TOAN_OPTIONS.includes(s)) return s;
  // Dữ liệu cũ nhầm HinhThucThanhToan (Tiền mặt / Chuyển khoản) vào KyThanhToan
  if (s === 'Tiền mặt' || s === 'Chuyển khoản') return KY_THANH_TOAN_MAC_DINH;
  return s;
}

export function nhanLoaiThue(loaiThue) {
  return loaiThue === 'Thuê nguyên phòng' ? 'Thuê nguyên phòng' : 'Thuê theo giường';
}

export function dongGoiQuyDinhHopDong() {
  const phanHoanCoc = QUY_DINH_HOAN_COC
    .map((item) => `- ${item.moTa}: hoàn ${item.mucHoan} tiền cọc`)
    .join('\n');

  const phanNoiQuy = NOI_QUY_MAC_DINH
    .map((item, idx) => `${idx + 1}. ${item}`)
    .join('\n');

  const phanViPham = DIEU_KHOAN_VI_PHAM
    .map((item, idx) => `${idx + 1}. ${item}`)
    .join('\n');

  return [
    '=== QUY ĐỊNH HOÀN / KHẤU TRỪ TIỀN CỌC ===',
    phanHoanCoc,
    '',
    '=== NỘI QUY KÝ TÚC XÁ ===',
    phanNoiQuy,
    '',
    '=== ĐIỀU KHOẢN XỬ LÝ VI PHẠM ===',
    phanViPham,
  ].join('\n');
}
