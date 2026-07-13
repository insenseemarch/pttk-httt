import { useEffect, useState } from 'react';
import KhungNhanVien from '../components/KhungNhanVien';
import CheckoutRequestForm from '../components/checkout/CheckoutRequestForm';
import ManagerRoomInspectForm from '../components/contracts/ManagerRoomInspectForm';

const KY_HAN_OPTIONS = [1, 3, 6, 12, 24];

function layChipHD(trangThai) {
  const map = {
    'Hiệu lực': 'green',
    'Thanh lý': 'gray',
    'Đã trả phòng': 'gray',
    'Hủy': 'red',
    'Chờ kiểm tra': 'blue',
    'Chờ đối soát': 'orange',
    'Chờ xác nhận đối soát': 'orange',
    'Chờ hoàn cọc': 'orange',
    'Chờ thanh toán thêm': 'orange',
    'Khách đồng ý đối soát (Chờ TT)': 'orange',
    'Đã hoàn cọc': 'blue',
    'Đã thu thêm tiền': 'blue',
    'Đã thanh lý': 'gray',
  };
  return map[trangThai] || 'gray';
}

function laQuanLy(nguoiDung) {
  const r = (nguoiDung?.vaiTro || '').toLowerCase();
  return r.includes('quản lý') || r.includes('quan ly') || r === 'quanly';
}

function laNhanVienSale(nguoiDung) {
  if (laQuanLy(nguoiDung)) return false;
  const r = (nguoiDung?.vaiTro || '').toLowerCase();
  if (r.includes('kế toán') || r.includes('ke toan') || r === 'ketoan') return false;
  if (r.includes('admin')) return false;
  return (
    r.includes('sale') ||
    r.includes('bán hàng') ||
    r.includes('ban hang') ||
    r.includes('nhân viên') ||
    r.includes('nhan vien') ||
    !r
  );
}

function coTheKetThuc(hd) {
  const t = hd?.trangThaiGoc || hd?.trangThai || '';
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

export default function DanhSachHopDong({ nguoiDung, dangXuat }) {
  const [danhSach, setDanhSach] = useState([]);
  const [chiNhanh, setChiNhanh] = useState([]);
  const [soCanBao, setSoCanBao] = useState(0);
  const [dangTai, setDangTai] = useState(true);
  const [boLoc, setBoLoc] = useState({
    maCN: '',
    trangThai: '',
    thang: '',
    phong: '',
    kyHan: '',
    tuKhoa: '',
    page: 1,
    limit: 10000,
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

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  useEffect(() => {
    fetch('/api/chi-nhanh')
      .then((r) => r.json())
      .then((res) => {
        if (res.ok) setChiNhanh(res.data);
      });
    fetch('/api/hop-dong/can-bao')
      .then((r) => r.json())
      .then((res) => {
        if (res.ok) setSoCanBao(res.data.soLuong);
      });
  }, []);

  useEffect(() => {
    taiDanhSach();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boLoc]);

  const taiDanhSach = async () => {
    setDangTai(true);
    try {
      const qs = new URLSearchParams(
        Object.fromEntries(Object.entries(boLoc).filter(([, v]) => v !== '')),
      );
      const res = await fetch(`/api/hop-dong?${qs}`).then((r) => r.json());
      if (res.ok) {
        setDanhSach(res.danhSach);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDangTai(false);
    }
  };

  const moModalXem = async (hd) => {
    setHdDangXem(hd);
    setChiTietDayDu(null);
    setDangTaiChiTiet(true);
    try {
      const res = await fetch(`/api/hop-dong/${hd.maHopDong}`).then((r) => r.json());
      if (res.ok) setChiTietDayDu({ ...hd, ...res.data });
      else setChiTietDayDu(hd);
    } catch {
      setChiTietDayDu(hd);
    } finally {
      setDangTaiChiTiet(false);
    }
  };

  const dongModalXem = () => {
    setHdDangXem(null);
    setChiTietDayDu(null);
  };

  const batDauKetThuc = (hd) => {
    const src = hd || chiTietDayDu || hdDangXem;
    if (!src || !coTheKetThuc(src)) {
      showToast('Chỉ xử lý khi hợp đồng đang ở trạng thái Chờ kiểm tra.', 'error');
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
    dongModalXem();
  };

  const sauKiemPhongThanhCong = async () => {
    setManKiemPhong(null);
    showToast('Đã hoàn tất kiểm phòng. Đã chuyển sang kế toán (Chờ đối soát).');
    await taiDanhSach();
  };

  const batDauYeuCauTraPhong = (hd) => {
    const src = hd || chiTietDayDu || hdDangXem;
    if (!src || !coTheYeuCauTraPhong(src)) {
      showToast('Chỉ gửi yêu cầu khi hợp đồng đang hiệu lực.', 'error');
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
    dongModalXem();
  };

  const guiYeuCauTraPhong = async (e) => {
    e.preventDefault();
    if (!manYeuCau?.maSo) return;
    if (!formYeuCau.ngayTraDuKien) {
      showToast('Vui lòng chọn ngày trả phòng dự kiến.', 'error');
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
        showToast('Đã gửi yêu cầu trả phòng. Hợp đồng chuyển sang Chờ kiểm tra.');
        await taiDanhSach();
      } else {
        showToast(res.error || 'Không gửi được yêu cầu trả phòng.', 'error');
      }
    } catch {
      showToast('Lỗi kết nối khi gửi yêu cầu trả phòng.', 'error');
    } finally {
      setDangGuiYeuCau(false);
    }
  };

  if (manKiemPhong) {
    return (
      <KhungNhanVien nguoiDung={nguoiDung} dangXuat={dangXuat}>
        <ManagerRoomInspectForm
          selectedItem={manKiemPhong}
          onCancel={() => setManKiemPhong(null)}
          onSuccess={sauKiemPhongThanhCong}
          hienThongBao={(type, msg) => showToast(msg, type === 'error' ? 'error' : 'success')}
        />
      </KhungNhanVien>
    );
  }

  if (manYeuCau) {
    return (
      <KhungNhanVien nguoiDung={nguoiDung} dangXuat={dangXuat}>
        {toast.show && (
          <div
            style={{
              position: 'fixed',
              top: 20,
              right: 20,
              background: toast.type === 'success' ? '#10b981' : '#ef4444',
              color: '#fff',
              padding: '12px 24px',
              borderRadius: 8,
              zIndex: 10000,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              fontWeight: 'bold',
            }}
          >
            {toast.message}
          </div>
        )}
        <div style={{ padding: '8px 0 24px' }}>
          <h1 style={{ fontSize: 22, margin: '0 0 8px', color: '#0f172a' }}>Yêu cầu trả phòng / Kết thúc hợp đồng</h1>
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
      </KhungNhanVien>
    );
  }

  const hienThi = chiTietDayDu || hdDangXem;
  const isQL = laQuanLy(nguoiDung);
  const isSale = laNhanVienSale(nguoiDung);

  return (
    <KhungNhanVien nguoiDung={nguoiDung} dangXuat={dangXuat}>
      {toast.show && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            background: toast.type === 'success' ? '#10b981' : '#ef4444',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: 8,
            zIndex: 10000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontWeight: 'bold',
          }}
        >
          {toast.message}
        </div>
      )}

      {soCanBao > 0 && (
        <div className="qt-alert">
          <span className="material-symbols-outlined">warning</span>
          <span>
            {soCanBao} hợp đồng sắp hết hạn trong 30 ngày. Vui lòng kiểm tra và thực hiện gia hạn hoặc thanh lý.
          </span>
          <button type="button" onClick={() => setBoLoc((p) => ({ ...p, trangThai: 'Hiệu lực', page: 1 }))}>
            Xem chi tiết
          </button>
        </div>
      )}

      <div className="qt-page-header">
        <div>
          <h1>Danh sách hợp đồng</h1>
        </div>
      </div>

      {/* Kỳ hạn 1/3/6/12/24 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
        <button
          type="button"
          className={!boLoc.kyHan ? 'qt-btn-primary' : 'qt-btn-icon'}
          onClick={() => setBoLoc((p) => ({ ...p, kyHan: '' }))}
          style={{
            padding: '8px 14px',
            borderRadius: 999,
            border: !boLoc.kyHan ? 'none' : '1px solid #e2e8f0',
            background: !boLoc.kyHan ? 'var(--primary-color)' : '#fff',
            color: !boLoc.kyHan ? '#fff' : '#475569',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Tất cả
        </button>
        {KY_HAN_OPTIONS.map((k) => {
          const active = String(boLoc.kyHan) === String(k);
          return (
            <button
              key={k}
              type="button"
              onClick={() => setBoLoc((p) => ({ ...p, kyHan: String(k) }))}
              style={{
                padding: '8px 14px',
                borderRadius: 999,
                border: active ? 'none' : '1px solid #e2e8f0',
                background: active ? 'var(--primary-color)' : '#fff',
                color: active ? '#fff' : '#475569',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {k} tháng
            </button>
          );
        })}
      </div>

      <form
        className="qt-filter-card"
        onSubmit={(e) => {
          e.preventDefault();
          taiDanhSach();
        }}
      >
        <div className="qt-field">
          <label>Chi nhánh</label>
          <select value={boLoc.maCN} onChange={(e) => setBoLoc((p) => ({ ...p, maCN: e.target.value }))}>
            <option value="">Tất cả chi nhánh</option>
            {chiNhanh.map((cn) => (
              <option key={cn.MaCN} value={cn.MaCN}>
                {cn.TenCN}
              </option>
            ))}
          </select>
        </div>
        <div className="qt-field">
          <label>Trạng thái</label>
          <select
            value={boLoc.trangThai}
            onChange={(e) => setBoLoc((p) => ({ ...p, trangThai: e.target.value }))}
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
        </div>
        <div className="qt-field">
          <label>Tìm mã HĐ / khách / SĐT</label>
          <input
            placeholder="HD-00001..."
            value={boLoc.tuKhoa}
            onChange={(e) => setBoLoc((p) => ({ ...p, tuKhoa: e.target.value }))}
          />
        </div>
        <div className="qt-field">
          <label>Phòng</label>
          <input
            placeholder="Tìm số phòng..."
            value={boLoc.phong}
            onChange={(e) => setBoLoc((p) => ({ ...p, phong: e.target.value }))}
          />
        </div>
        <button type="submit" className="qt-btn-primary">
          Lọc
        </button>
      </form>

      <div className="qt-table-wrap">
        {dangTai ? (
          <div className="qt-loading">Đang tải...</div>
        ) : (
          <>
            <table className="qt-table">
              <thead>
                <tr>
                  <th>Mã HĐ</th>
                  <th>Tên khách</th>
                  <th>Phòng</th>
                  <th>Kỳ hạn</th>
                  <th>Ngày bắt đầu</th>
                  <th>Ngày hết hạn</th>
                  <th>Tỷ lệ hoàn cọc</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {danhSach.map((hd) => (
                  <tr key={hd.maHopDong || hd.maHD} style={{ cursor: 'pointer' }} onClick={() => moModalXem(hd)}>
                    <td>
                      <strong>{hd.maHD}</strong>
                    </td>
                    <td>
                      <div>{hd.hoTen}</div>
                      <div className="sub">{hd.sdt}</div>
                    </td>
                    <td>{hd.phong}</td>
                    <td>{hd.kyHanThang ? `${hd.kyHanThang} tháng` : '—'}</td>
                    <td>{hd.ngayBatDau}</td>
                    <td style={{ color: hd.sapHetHan ? '#dc2626' : undefined }}>{hd.ngayHetHan}</td>
                    <td>{hd.tyLeHoanCoc || '—'}</td>
                    <td>
                      <span className={`qt-chip qt-chip--${layChipHD(hd.trangThai)}`}>{hd.trangThai}</span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <button
                          type="button"
                          className="qt-btn-icon"
                          title="Xem chi tiết"
                          onClick={() => moModalXem(hd)}
                        >
                          <span className="material-symbols-outlined">visibility</span>
                        </button>
                        {isSale && coTheYeuCauTraPhong(hd) && (
                          <button
                            type="button"
                            className="qt-btn-primary"
                            title="Yêu cầu trả phòng / kết thúc hợp đồng"
                            onClick={() => batDauYeuCauTraPhong(hd)}
                            style={{
                              padding: '6px 10px',
                              fontSize: 12,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Yêu cầu trả phòng
                          </button>
                        )}
                        {isQL && coTheKetThuc(hd) && (
                          <button
                            type="button"
                            className="qt-btn-primary"
                            title="Kiểm phòng / kết thúc HĐ"
                            onClick={() => batDauKetThuc(hd)}
                            style={{
                              padding: '6px 10px',
                              fontSize: 12,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Kiểm phòng
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="qt-pagination">
              <span>Tổng cộng: {danhSach.length} hợp đồng</span>
            </div>
          </>
        )}
      </div>

      {hdDangXem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={dongModalXem}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              width: 'min(640px, 100%)',
              padding: 24,
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, margin: 0, color: '#0f172a' }}>
                Chi tiết hợp đồng: {hienThi?.maHD || hdDangXem.maHD}
              </h2>
              <button
                type="button"
                onClick={dongModalXem}
                aria-label="Đóng"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  cursor: 'pointer',
                  fontSize: 20,
                  fontWeight: 700,
                  color: '#64748b',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            {dangTaiChiTiet ? (
              <p style={{ color: '#64748b' }}>Đang tải chi tiết từ database...</p>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 16,
                  fontSize: 14,
                  color: '#334155',
                  marginBottom: 24,
                }}
              >
                {[
                  ['Khách hàng', hienThi.hoTen],
                  ['Số điện thoại', hienThi.sdt || '—'],
                  ['CCCD', hienThi.cccd || '—'],
                  ['Email', hienThi.email || '—'],
                  ['Phòng/Giường', hienThi.phong],
                  ['Chi nhánh', hienThi.tenCN || '—'],
                  ['Ngày bắt đầu', hienThi.ngayBatDau],
                  ['Ngày hết hạn', hienThi.ngayHetHan],
                  ['Kỳ hạn', hienThi.kyHanThang ? `${hienThi.kyHanThang} tháng` : '—'],
                  ['Giá thuê', hienThi.giaThue],
                  ['Kỳ thanh toán', hienThi.kyThanhToan || '—'],
                  ['Trạng thái', hienThi.trangThai],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p style={{ margin: '4px 0', color: '#64748b' }}>{label}:</p>
                    <strong style={{ color: '#0f172a' }}>{value}</strong>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={dongModalXem}
                style={{
                  padding: '8px 20px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  background: '#fff',
                  color: '#475569',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Đóng
              </button>
              {isSale && (
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
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: 'none',
                    background: coTheYeuCauTraPhong(hienThi || {}) ? 'var(--primary-color)' : '#cbd5e1',
                    color: '#fff',
                    cursor: coTheYeuCauTraPhong(hienThi || {}) ? 'pointer' : 'not-allowed',
                    fontWeight: 'bold',
                  }}
                >
                  Yêu cầu trả phòng / Kết thúc hợp đồng
                </button>
              )}
              {isQL && (
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
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: 'none',
                    background: coTheKetThuc(hienThi || {}) ? 'var(--primary-color)' : '#cbd5e1',
                    color: '#fff',
                    cursor: coTheKetThuc(hienThi || {}) ? 'pointer' : 'not-allowed',
                    fontWeight: 'bold',
                  }}
                >
                  Kết thúc hợp đồng / Trả phòng
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </KhungNhanVien>
  );
}
