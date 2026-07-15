/** Trích ảnh chữ ký PNG (base64) từ react-signature-canvas, giống luồng lập hợp đồng. */
export function layAnhChuKyTuPad(sigPadRef, maxW = 480) {
  const pad = sigPadRef?.current;
  if (!pad || pad.isEmpty()) return null;
  const src = pad.getCanvas();
  const scale = src.width > maxW ? maxW / src.width : 1;
  const w = Math.max(1, Math.round(src.width * scale));
  const h = Math.max(1, Math.round(src.height * scale));
  const tmp = document.createElement('canvas');
  tmp.width = w;
  tmp.height = h;
  tmp.getContext('2d')?.drawImage(src, 0, 0, w, h);
  return tmp.toDataURL('image/png', 0.85);
}

export function hopLeChuKyAnh(chuKy) {
  if (!chuKy || typeof chuKy !== 'string') return false;
  return /^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/.test(chuKy.trim());
}
