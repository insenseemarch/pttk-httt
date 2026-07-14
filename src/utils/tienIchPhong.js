function chuanHoaTimKiem(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

function dinhDangNhanTienIch(value) {
  const raw = String(value || '').replace(/^có\s+/i, '').trim();
  if (!raw) return '';

  const key = chuanHoaTimKiem(raw);
  if (key.includes('wifi')) return 'Wifi';
  if (key.includes('internet')) return 'Internet';
  if (key.includes('tu lanh')) return 'Tủ lạnh';
  if (key.includes('may giat')) return 'Máy giặt';
  if (key.includes('dieu hoa') || key.includes('may lanh')) return 'Điều hòa';
  if (key.includes('gui xe') || key.includes('giu xe') || key.includes('de xe')) return 'Gửi xe';

  const lower = raw.toLocaleLowerCase('vi-VN');
  return lower.charAt(0).toLocaleUpperCase('vi-VN') + lower.slice(1);
}

function layIconTienIch(label) {
  const key = chuanHoaTimKiem(label);
  if (key.includes('wifi') || key.includes('internet')) return 'wifi';
  if (key.includes('dieu hoa') || key.includes('may lanh')) return 'ac_unit';
  if (key.includes('gui xe') || key.includes('giu xe') || key.includes('de xe')) return 'local_parking';
  if (key.includes('tu lanh')) return 'kitchen';
  if (key.includes('may giat')) return 'local_laundry_service';
  if (key.includes('ban cong')) return 'balcony';
  if (key.includes('quat')) return 'mode_fan';
  if (key.includes('an ninh')) return 'security';
  if (key.includes('bep')) return 'countertops';
  if (key.includes('yen tinh')) return 'volume_off';
  if (key.includes('gio giac')) return 'schedule';
  return 'check_circle';
}

function rutGonTienIch(value) {
  const key = chuanHoaTimKiem(value);
  if (!key.includes('mau dat coc')) return value;
  if (key.includes('gui xe') || key.includes('giu xe') || key.includes('de xe')) return 'Gửi xe';
  return '';
}

export function layDanhSachTienIchHienThi(tienIch, gioiHan = Infinity) {
  const daCo = new Set();
  const danhSach = String(tienIch || '')
    .split(/[;,|\/\u00b7]+/)
    .map((item) => item.trim())
    .map(rutGonTienIch)
    .filter(Boolean)
    .map((item) => {
      const label = dinhDangNhanTienIch(item);
      const key = chuanHoaTimKiem(label);
      if (!key || daCo.has(key)) return null;
      daCo.add(key);
      return {
        key,
        label,
        icon: layIconTienIch(label),
      };
    })
    .filter(Boolean);

  return danhSach.slice(0, gioiHan);
}
