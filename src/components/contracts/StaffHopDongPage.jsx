import { useEffect, useMemo, useState } from 'react';
import CheckoutRequestForm from '../checkout/CheckoutRequestForm';
import ManagerRoomInspectForm from './ManagerRoomInspectForm';

const KY_HAN_OPTIONS = [1, 3, 6, 12, 24];

function chipTrangThai(trangThai) {
  const map = {
    'Hiệu lực': { bg: '#dcfce7', color: '#166534' },
    'Chờ kiểm tra': { bg: '#ffedd5', color: '#c2410c' },
    'Chờ đối soát': { bg: '#fef3c7', color: '#b45309' },
    'Chờ xác nhận đối soát': { bg: '#ffedd5', color: '#c2410c' },
    'Chờ hoàn cọc': { bg: '#dbeafe', color: '#1d4ed8' },
    'Chờ thanh toán thêm': { bg: '#fee2e2', color: '#b91c1c' },
    'Thanh lý': { bg: '#e2e8f0', color: '#475569' },
    'Hủy': { bg: '#fee2e2', color: '#b91c1c' },
  };
  return map[trangThai] || { bg: '#f1f5f9', color: '#64748b' };
}

function coTheKetThuc(hd) {
  const t = hd.trangThaiGoc || hd.trangThai || '';
  return t === 'Chờ kiểm tra';
}

function coTheYeuCauTraPhong(hd) {
  const goc = hd?.trangThaiGoc || '';
  const hien = hd?.trangThai || '';
  return goc === 'Đang hiệu lực' || hien === 'Hiệu lực' || goc === 'Hiệu lực';
}

function mapHdSangCheckoutItem(src) {
  return {
    ...src,
    maSo: src.maChungTu || `HĐ-${src.maHopDong}`,
    tenKhachHang: src.hoTen,
    phongCoSo: `${src.phong || ''}${src.tenCN ? ` · ${src.tenCN}` : ''}`,
    ngayBatDau: src.ngayBatDauISO || src.ngayBatDau,
    ngayKetThuc: src.ngayKetThucISO || src.ngayHetHan,
    giaThue: src.giaThueSo || 0,
    tienCoc: src.tienCocSo || src.giaThueSo || 0,
    loai: 'hop_dong',
  };
}

export default function StaffHopDongPage({ hienThongBao, vaiTro }) {
  const [danhSach, setDanhSach] = useState([]);
  const [chiNhanh, setChiNhanh] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [boLoc, setBoLoc] = useState({
    maCN: '',
    trangThai: '',
    kyHan: '',
    tuKhoa: '',
    phong: '',
    page: 1,
    limit: 500,
  });
  const [hdDangXem, setHdDangXem] = useState(null);
  const [chiTietDayDu, setChiTietDayDu] = useState(null);
  const [dangTaiChiTiet, setDangTaiChiTiet] = useState(false);
  const [manKiemPhong, setManKiemPhong] = useState(null);
  const [manYeuCau, setManYeuCau] = useState(null);
  const [formYeuCau, setFormYeuCau] = useState({
    loaiHinhTraPhong: 'dung_han',
    ngayTraDuKien: '',
    lyDo: '',
    phuongThucHoanTien: 'chuyen_khoan',
  });
  const [dangGuiYeuCau, setDangGuiYeuCau] = useState(false);

  const taiDanhSach = async (loc = boLoc) => {
    setDangTai(true);
    try {
      const qs = new URLSearchParams(
        Object.fromEntries(Object.entries(loc).filter(([, v]) => v !== '' && v != null)),
      );
      const res = await fetch(`/api/hop-dong?${qs}`).then((r) => r.json());
      if (res.ok) setDanhSach(res.danhSach || []);
      else hienThongBao?.('error', res.error || 'Không tải được danh sách hợp đồng');
    } catch (err) {
      console.error(err);
      hienThongBao?.('error', 'Lỗi kết nối API hợp đồng');
    } finally {
      setDangTai(false);
    }
  };

  useEffect(() => {
    fetch('/api/chi-nhanh')
      .then((r) => r.json())
      .then((res) => {
        if (res.ok) setChiNhanh(res.data || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    taiDanhSach();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boLoc]);

  const demTheoKyHan = useMemo(() => {
    const dem = { all: danhSach.length };
    for (const k of KY_HAN_OPTIONS) dem[k] = 0;
    for (const hd of danhSach) {
      if (hd.kyHanThang && dem[hd.kyHanThang] != null) dem[hd.kyHanThang] += 1;
    }
    return dem;
  }, [danhSach]);

  const moChiTiet = async (hd) => {
    setHdDangXem(hd);
    setChiTietDayDu(null);
    setDangTaiChiTiet(true);
    try {
      const res = await fetch(`/api/hop-dong/${hd.maHopDong}`).then((r) => r.json());
      if (res.ok) setChiTietDayDu(res.data);
      else setChiTietDayDu(hd);
    } catch {
      setChiTietDayDu(hd);
    } finally {
      setDangTaiChiTiet(false);
    }
  };

  const dongPopup = () => {
    setHdDangXem(null);
    setChiTietDayDu(null);
  };

  const batDauKetThuc = () => {
    const src = chiTietDayDu || hdDangXem;
    if (!src || !coTheKetThuc(src)) {
      hienThongBao?.('error', 'Chỉ xử lý khi hợp đồng đang ở trạng thái Chờ kiểm tra (đã có yêu cầu từ Sale).');
      return;
    }
    setManKiemPhong({
      ...src,
      maSo: src.maChungTu || `HĐ-${src.maHopDong}`,
      tenKhachHang: src.hoTen,
      phongCoSo: `${src.phong}${src.tenCN ? ` · ${src.tenCN}` : ''}`,
      ngayBatDau: src.ngayBatDauISO || src.ngayBatDau,
      ngayKetThuc: src.ngayKetThucISO || src.ngayHetHan,
      giaThue: src.giaThueSo || 0,
      loai: 'hop_dong',
      loaiHinhTraPhong: src.pdsInfo?.loaiHinhTraPhong || src.phieuDoiSoat?.[0]?.LoaiHinhTraPhong || 'dung_han',
      lyDo: src.pdsInfo?.lyDo || src.phieuDoiSoat?.[0]?.LyDoTraPhong || '',
    });
    dongPopup();
  };

  const sauKiemPhongThanhCong = async () => {
    setManKiemPhong(null);
    hienThongBao?.(
      'success',
      'Đã hoàn tất kiểm phòng. Thông tin đã chuyển sang kế toán (Chờ đối soát). Phòng/giường sẽ trống khi thanh lý.',
    );
    await taiDanhSach();
  };

  const batDauYeuCauTraPhong = (hd) => {
    const src = hd || chiTietDayDu || hdDangXem;
    if (!src || !coTheYeuCauTraPhong(src)) {
      hienThongBao?.('error', 'Chỉ gửi yêu cầu khi hợp đồng đang hiệu lực.');
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    setFormYeuCau({
      loaiHinhTraPhong: 'dung_han',
      ngayTraDuKien: today,
      lyDo: '',
      phuongThucHoanTien: 'chuyen_khoan',
    });
    setManYeuCau(mapHdSangCheckoutItem(src));
    dongPopup();
  };

  const guiYeuCauTraPhong = async (e) => {
    e.preventDefault();
    if (!manYeuCau?.maSo) return;
    if (!formYeuCau.ngayTraDuKien) {
      hienThongBao?.('error', 'Vui lòng chọn ngày trả phòng dự kiến.');
      return;
    }
    setDangGuiYeuCau(true);
    try {
      const res = await fetch('/api/checkout/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maSoChungTu: manYeuCau.maSo,
          loaiHinhTraPhong: formYeuCau.loaiHinhTraPhong,
          ngayTraDuKien: formYeuCau.ngayTraDuKien,
          lyDo: formYeuCau.lyDo,
          phuongThucHoanTien: formYeuCau.phuongThucHoanTien,
        }),
      }).then((r) => r.json());
      if (res.ok) {
        setManYeuCau(null);
        hienThongBao?.('success', 'Đã gửi yêu cầu trả phòng. Hợp đồng chuyển sang Chờ kiểm tra.');
        await taiDanhSach();
      } else {
        hienThongBao?.('error', res.error || 'Không gửi được yêu cầu trả phòng.');
      }
    } catch {
      hienThongBao?.('error', 'Lỗi kết nối khi gửi yêu cầu trả phòng.');
    } finally {
      setDangGuiYeuCau(false);
    }
  };

  if (manKiemPhong) {
    return (
      <ManagerRoomInspectForm
        selectedItem={manKiemPhong}
        onCancel={() => setManKiemPhong(null)}
        onSuccess={sauKiemPhongThanhCong}
        hienThongBao={hienThongBao}
      />
    );
  }

  if (manYeuCau) {
    return (
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px 48px' }}>
        <h1 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800, color: '#0f172a' }}>
          Yêu cầu trả phòng / Kết thúc hợp đồng
        </h1>
        <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: 14 }}>
          Gửi hồ sơ để Quản lý kiểm tra phòng · Trạng thái sẽ chuyển thành <strong>Chờ kiểm tra</strong>
        </p>
        <fieldset disabled={dangGuiYeuCau} style={{ border: 'none', padding: 0, margin: 0 }}>
          <CheckoutRequestForm
            selectedItem={manYeuCau}
            formValues={formYeuCau}
            onChange={(e) => {
              const { name, value } = e.target;
              setFormYeuCau((p) => ({ ...p, [name]: value }));
            }}
            onSubmit={guiYeuCauTraPhong}
            onCancel={() => setManYeuCau(null)}
          />
        </fieldset>
      </div>
    );
  }

  const hienThi = chiTietDayDu || hdDangXem;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px 48px' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a' }}>Danh sách hợp đồng</h1>
        <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 14 }}>
          {vaiTro === 'quanly' ? 'Quản lý' : 'Sale'} · Lọc theo kỳ hạn thuê · Xem chi tiết từ database
        </p>
      </div>

      {/* Bộ lọc kỳ hạn */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => setBoLoc((p) => ({ ...p, kyHan: '' }))}
          style={pillStyle(!boLoc.kyHan)}
        >
          Tất cả ({demTheoKyHan.all})
        </button>
        {KY_HAN_OPTIONS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setBoLoc((p) => ({ ...p, kyHan: String(k) }))}
            style={pillStyle(String(boLoc.kyHan) === String(k))}
          >
            {k} tháng
          </button>
        ))}
      </div>

      {/* Bộ lọc phụ */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 12,
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: 14,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <label style={fieldStyle}>
          <span>Chi nhánh</span>
          <select
            value={boLoc.maCN}
            onChange={(e) => setBoLoc((p) => ({ ...p, maCN: e.target.value }))}
            style={inputStyle}
          >
            <option value="">Tất cả</option>
            {chiNhanh.map((cn) => (
              <option key={cn.MaCN} value={cn.MaCN}>
                {cn.TenCN}
              </option>
            ))}
          </select>
        </label>
        <label style={fieldStyle}>
          <span>Trạng thái</span>
          <select
            value={boLoc.trangThai}
            onChange={(e) => setBoLoc((p) => ({ ...p, trangThai: e.target.value }))}
            style={inputStyle}
          >
            <option value="">Tất cả</option>
            <option value="Hiệu lực">Hiệu lực</option>
            <option value="Chờ kiểm tra">Chờ kiểm tra</option>
            <option value="Chờ đối soát">Chờ đối soát</option>
            <option value="Chờ xác nhận đối soát">Chờ xác nhận đối soát</option>
            <option value="Chờ hoàn cọc">Chờ hoàn cọc</option>
            <option value="Thanh lý">Thanh lý</option>
            <option value="Hủy">Hủy</option>
          </select>
        </label>
        <label style={fieldStyle}>
          <span>Tìm mã HĐ / khách / SĐT</span>
          <input
            value={boLoc.tuKhoa}
            onChange={(e) => setBoLoc((p) => ({ ...p, tuKhoa: e.target.value }))}
            placeholder="VD: HD-00012"
            style={inputStyle}
          />
        </label>
        <label style={fieldStyle}>
          <span>Phòng</span>
          <input
            value={boLoc.phong}
            onChange={(e) => setBoLoc((p) => ({ ...p, phong: e.target.value }))}
            placeholder="P.101"
            style={inputStyle}
          />
        </label>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
        {dangTai ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Đang tải...</div>
        ) : danhSach.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Không có hợp đồng phù hợp bộ lọc.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                <th style={thStyle}>Mã HĐ</th>
                <th style={thStyle}>Khách hàng</th>
                <th style={thStyle}>Phòng</th>
                <th style={thStyle}>Kỳ hạn</th>
                <th style={thStyle}>Bắt đầu</th>
                <th style={thStyle}>Hết hạn</th>
                <th style={thStyle}>Trạng thái</th>
                <th style={thStyle}> </th>
              </tr>
            </thead>
            <tbody>
              {danhSach.map((hd) => {
                const chip = chipTrangThai(hd.trangThai);
                return (
                  <tr
                    key={hd.maHopDong}
                    onClick={() => moChiTiet(hd)}
                    style={{ borderTop: '1px solid #f1f5f9', cursor: 'pointer' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#fff';
                    }}
                  >
                    <td style={tdStyle}>
                      <strong>{hd.maHD}</strong>
                    </td>
                    <td style={tdStyle}>
                      <div>{hd.hoTen}</div>
                      <div style={{ color: '#94a3b8', fontSize: 12 }}>{hd.sdt}</div>
                    </td>
                    <td style={tdStyle}>{hd.phong}</td>
                    <td style={tdStyle}>{hd.kyHanThang ? `${hd.kyHanThang} tháng` : '—'}</td>
                    <td style={tdStyle}>{hd.ngayBatDau}</td>
                    <td style={{ ...tdStyle, color: hd.sapHetHan ? '#dc2626' : undefined }}>{hd.ngayHetHan}</td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          background: chip.bg,
                          color: chip.color,
                          padding: '3px 8px',
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {hd.trangThai}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          moChiTiet(hd);
                        }}
                        style={{
                          border: '1px solid #e2e8f0',
                          background: '#fff',
                          borderRadius: 8,
                          padding: '6px 10px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: 12,
                        }}
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #f1f5f9', color: '#64748b', fontSize: 13 }}>
          Hiển thị {danhSach.length} hợp đồng
        </div>
      </div>

      {/* Popup chi tiết */}
      {hdDangXem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.45)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={dongPopup}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              width: 'min(640px, 100%)',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 50px rgba(0,0,0,0.18)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '18px 20px',
                borderBottom: '1px solid #e2e8f0',
              }}
            >
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                  Chi tiết hợp đồng
                </div>
                <h2 style={{ margin: '4px 0 0', fontSize: 20, color: '#0f172a' }}>
                  {hienThi?.maHD || hdDangXem.maHD}
                </h2>
              </div>
              <button
                type="button"
                onClick={dongPopup}
                aria-label="Đóng"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  cursor: 'pointer',
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#64748b',
                }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: 20 }}>
              {dangTaiChiTiet ? (
                <div style={{ color: '#64748b', padding: '20px 0' }}>Đang tải chi tiết từ database...</div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
                    {[
                      ['Khách hàng', hienThi.hoTen],
                      ['SĐT', hienThi.sdt || '—'],
                      ['CCCD', hienThi.cccd || '—'],
                      ['Email', hienThi.email || '—'],
                      ['Phòng / giường', hienThi.phong],
                      ['Chi nhánh', hienThi.tenCN || '—'],
                      ['Ngày bắt đầu', hienThi.ngayBatDau],
                      ['Ngày kết thúc', hienThi.ngayHetHan],
                      ['Kỳ hạn', hienThi.kyHanThang ? `${hienThi.kyHanThang} tháng` : '—'],
                      ['Giá thuê', hienThi.giaThue],
                      ['Kỳ thanh toán', hienThi.kyThanhToan],
                      ['Trạng thái', hienThi.trangThai],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                          {label}
                        </div>
                        <div style={{ marginTop: 3, fontWeight: 650, color: '#0f172a', fontSize: 14 }}>{value}</div>
                      </div>
                    ))}
                  </div>

                  {hienThi.phieuDoiSoat?.length > 0 && (
                    <div
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 12,
                        padding: 14,
                        marginBottom: 16,
                        fontSize: 13,
                      }}
                    >
                      <strong>Phiếu đối soát:</strong>{' '}
                      {hienThi.phieuDoiSoat[0].TrangThai || hienThi.pdsInfo?.trangThaiPds || '—'}
                      {hienThi.phieuDoiSoat[0].LoaiHinhTraPhong
                        ? ` · Loại hình: ${hienThi.phieuDoiSoat[0].LoaiHinhTraPhong}`
                        : ''}
                    </div>
                  )}
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={dongPopup}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 10,
                    border: '1px solid #cbd5e1',
                    background: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer',
                    color: '#475569',
                  }}
                >
                  Đóng
                </button>
                {vaiTro === 'sale' && (
                  <button
                    type="button"
                    disabled={!coTheYeuCauTraPhong(hienThi || {})}
                    title={
                      coTheYeuCauTraPhong(hienThi || {})
                        ? 'Gửi yêu cầu trả phòng → Chờ kiểm tra'
                        : 'Chỉ bật khi hợp đồng đang hiệu lực'
                    }
                    onClick={() => batDauYeuCauTraPhong(hienThi)}
                    style={{
                      padding: '10px 16px',
                      borderRadius: 10,
                      border: 'none',
                      background: coTheYeuCauTraPhong(hienThi || {})
                        ? 'var(--primary-color, #ea580c)'
                        : '#cbd5e1',
                      color: '#fff',
                      fontWeight: 750,
                      cursor: coTheYeuCauTraPhong(hienThi || {}) ? 'pointer' : 'not-allowed',
                    }}
                  >
                    Yêu cầu trả phòng / Kết thúc hợp đồng
                  </button>
                )}
                {vaiTro === 'quanly' && (
                  <button
                    type="button"
                    disabled={!coTheKetThuc(hienThi || {})}
                    title={
                      coTheKetThuc(hienThi || {})
                        ? 'Mở xử lý kiểm phòng'
                        : 'Chỉ bật khi trạng thái = Chờ kiểm tra'
                    }
                    onClick={batDauKetThuc}
                    style={{
                      padding: '10px 16px',
                      borderRadius: 10,
                      border: 'none',
                      background: coTheKetThuc(hienThi || {}) ? 'var(--primary-color, #ea580c)' : '#cbd5e1',
                      color: '#fff',
                      fontWeight: 750,
                      cursor: coTheKetThuc(hienThi || {}) ? 'pointer' : 'not-allowed',
                    }}
                  >
                    Kết thúc hợp đồng / Trả phòng
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle = { padding: '12px 14px', fontSize: 12, color: '#64748b', fontWeight: 700 };
const tdStyle = { padding: '12px 14px', color: '#0f172a', verticalAlign: 'middle' };
const fieldStyle = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 700, color: '#64748b' };
const inputStyle = {
  padding: '9px 10px',
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  fontSize: 13,
  fontWeight: 500,
  color: '#0f172a',
};

function pillStyle(active) {
  return {
    padding: '8px 14px',
    borderRadius: 999,
    border: active ? '1px solid var(--primary-color, #ea580c)' : '1px solid #e2e8f0',
    background: active ? 'color-mix(in srgb, var(--primary-color, #ea580c) 12%, white)' : '#fff',
    color: active ? 'var(--primary-color, #ea580c)' : '#475569',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
  };
}
