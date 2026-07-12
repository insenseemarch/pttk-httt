import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import KhungNhanVien from '../components/KhungNhanVien';

const API = '/api/dat-coc';

const LABELS = {
  MOI: 'Mới tạo',
  CHO_KIEM_TRA_PHONG: 'Chờ kiểm tra phòng',
  HET_CHO: 'Hết chỗ',
  CON_TRONG_CHO_GUI_KE_TOAN: 'Còn trống',
  CHO_TINH_COC: 'Chờ tính cọc',
  CHO_THANH_TOAN: 'Chờ thanh toán',
  QUA_HAN_TU_DONG_HUY: 'Quá hạn - đã hủy',
  CHO_XAC_NHAN_THANH_TOAN: 'Chờ xác nhận thanh toán',
  DA_XAC_NHAN: 'Đã xác nhận',
  TU_CHOI_CHUNG_TU: 'Chứng từ bị từ chối',
};

function roleOf(user) {
  const value = String(user?.vaiTro || '').toLowerCase();
  if (value.includes('kế toán') || value.includes('ke toan') || value.includes('ketoan')) return 'KE_TOAN';
  if (value.includes('quản lý') || value.includes('quan ly') || value.includes('quanly')) return 'QUAN_LY';
  return 'SALE';
}

function apiHeaders(user) {
  return {
    'Content-Type': 'application/json',
    'x-user-id': String(user?.maNV || ''),
    'x-user-role': user?.vaiTro || 'Sale',
  };
}

function money(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`;
}

function dateTime(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

function remaining(deadline, now) {
  const diff = new Date(deadline).getTime() - now;
  if (!deadline || diff <= 0) return '00:00:00';
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return [hours, minutes, seconds].map((item) => String(item).padStart(2, '0')).join(':');
}

function actionFor(role, status) {
  const actions = {
    SALE: {
      MOI: ['GUI_KIEM_TRA', 'Gửi Quản lý kiểm tra'],
      HET_CHO: ['GUI_KIEM_TRA', 'Chọn lại và gửi kiểm tra'],
      CON_TRONG_CHO_GUI_KE_TOAN: ['GUI_KE_TOAN', 'Gửi Kế toán'],
      CHO_THANH_TOAN: ['XAC_NHAN_THANH_TOAN', 'Gửi chứng từ thanh toán'],
      TU_CHOI_CHUNG_TU: ['XAC_NHAN_THANH_TOAN', 'Tải lại chứng từ'],
    },
    QUAN_LY: {
      CHO_KIEM_TRA_PHONG: ['XAC_NHAN_CON_TRONG', 'Xác nhận còn trống'],
      CHO_XAC_NHAN_THANH_TOAN: ['XAC_NHAN_CHUNG_TU', 'Xác nhận chứng từ'],
    },
    KE_TOAN: {
      CHO_TINH_COC: ['TINH_COC', 'Xác nhận và gửi Sale'],
    },
  };
  return actions[role]?.[status] || null;
}

export default function DepositWorkflow({ nguoiDung, dangXuat }) {
  const [searchParams] = useSearchParams();
  const role = roleOf(nguoiDung);
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [transaction, setTransaction] = useState('');
  const [evidence, setEvidence] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [now, setNow] = useState(Date.now());
  const [showCreate, setShowCreate] = useState(false);
  const [editingSelection, setEditingSelection] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [createForm, setCreateForm] = useState({ cccd: '', loaiThue: 'GIUONG_LE', maPhong: '', maGiuongs: [] });
  const [customerForm, setCustomerForm] = useState({});

  const fetchList = async () => {
    setLoading(true);
    setError('');
    try {
      const query = status ? `?trangThai=${status}` : '';
      const response = await fetch(`${API}/phieu${query}`, { headers: apiHeaders(nguoiDung) });
      const json = await response.json();
      if (!json.ok) throw new Error(json.error);
      setItems(json.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetail = async (id) => {
    setError('');
    try {
      const response = await fetch(`${API}/phieu/${id}`, { headers: apiHeaders(nguoiDung) });
      const json = await response.json();
      if (!json.ok) throw new Error(json.error);
      setSelected(json.data);
      setCustomerForm({
        HoTen: json.data.KhachHang?.HoTen || '',
        GioiTinh: json.data.KhachHang?.GioiTinh || '',
        QuocTich: json.data.KhachHang?.QuocTich || '',
        SDT: json.data.KhachHang?.SDT || '',
        Email: json.data.KhachHang?.Email || '',
        KhaNangTaiChinh: json.data.KhachHang?.KhaNangTaiChinh || '',
      });
      setDepositAmount(json.data.SoTienCoc || '');
      setNote('');
      setTransaction('');
      setEvidence('');
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => { fetchList(); }, [status]);
  useEffect(() => {
    const id = searchParams.get('phieu');
    if (id) fetchDetail(id);
  }, [searchParams]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const selectedBeds = selected?.GiuongDatCoc || [];
  const room = selectedBeds[0]?.Giuong?.Phong;
  const suggested = useMemo(() => {
    if (!selected) return 0;
    const bedCount = selected.LoaiThue === 'NGUYEN_PHONG' ? Number(room?.SucChua || selectedBeds.length) : selectedBeds.length;
    const monthly = selected.LoaiThue === 'NGUYEN_PHONG'
      ? Number(room?.GiaThue || selectedBeds[0]?.Giuong?.GiaThue || 0)
      : Number(selectedBeds[0]?.Giuong?.GiaThue || room?.GiaThue || 0);
    return monthly * 2 * bedCount;
  }, [selected]);

  const submitAction = async (action, extra = {}) => {
    if (!selected) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`${API}/phieu/${selected.MaDatCoc}/hanh-dong`, {
        method: 'POST',
        headers: apiHeaders(nguoiDung),
        body: JSON.stringify({
          hanhDong: action,
          ghiChu: note,
          maGiaoDich: transaction,
          hinhAnhDataUrl: evidence,
          soTienCoc: depositAmount || suggested,
          ...extra,
        }),
      });
      const json = await response.json();
      if (!json.ok) throw new Error(json.error);
      await fetchList();
      await fetchDetail(selected.MaDatCoc);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const loadRooms = async () => {
    try {
      const response = await fetch(`${API}/phong-giuong-trong`, { headers: apiHeaders(nguoiDung) });
      const json = await response.json();
      if (!json.ok) throw new Error(json.error);
      setRooms(json.data);
      setEditingSelection(false);
      setShowCreate(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const editSelection = async () => {
    try {
      const response = await fetch(`${API}/phong-giuong-trong`, { headers: apiHeaders(nguoiDung) });
      const json = await response.json();
      if (!json.ok) throw new Error(json.error);
      setRooms(json.data);
      setCreateForm({ cccd: String(selected.CCCD), loaiThue: selected.LoaiThue, maPhong: '', maGiuongs: [] });
      setEditingSelection(true);
      setShowCreate(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const selectedCreateRoom = rooms.find((item) => String(item.MaPhong) === String(createForm.maPhong));

  const createDeposit = async () => {
    const roomData = selectedCreateRoom;
    if (!roomData || !createForm.maGiuongs.length) return setError('Vui lòng chọn phòng và giường');
    setBusy(true);
    try {
      const response = await fetch(`${API}/phieu`, {
        method: 'POST',
        headers: apiHeaders(nguoiDung),
        body: JSON.stringify({ ...createForm, maCN: roomData.MaCN }),
      });
      const json = await response.json();
      if (!json.ok) throw new Error(json.error);
      setShowCreate(false);
      setCreateForm({ cccd: '', loaiThue: 'GIUONG_LE', maPhong: '', maGiuongs: [] });
      await fetchList();
      await fetchDetail(json.data.MaDatCoc);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const saveNewSelection = async () => {
    if (!selectedCreateRoom || !createForm.maGiuongs.length) return setError('Vui lòng chọn phòng và giường mới');
    setShowCreate(false);
    await submitAction('GUI_KIEM_TRA', {
      maGiuongs: createForm.maGiuongs,
      maPhong: Number(createForm.maPhong),
      maCN: selectedCreateRoom.MaCN,
      loaiThue: createForm.loaiThue,
      khachHang: customerForm,
    });
  };

  const onEvidence = (file) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return setError('Ảnh chứng từ tối đa 2 MB');
    const reader = new FileReader();
    reader.onload = () => setEvidence(String(reader.result));
    reader.readAsDataURL(file);
  };

  const primaryAction = selected ? actionFor(role, selected.TrangThai) : null;

  return (
    <KhungNhanVien nguoiDung={nguoiDung} dangXuat={dangXuat}>
      <div className="deposit-page">
        <header className="deposit-header">
          <div>
            <p className="deposit-eyebrow">QUY TRÌNH THUÊ</p>
            <h1>Quản lý đặt cọc</h1>
            <p>Theo dõi kiểm tra chỗ, tính cọc và xác nhận thanh toán theo từng vai trò.</p>
          </div>
          {role === 'SALE' && (
            <button type="button" className="qt-btn-primary" onClick={loadRooms}>
              <span className="material-symbols-outlined">add</span>Tạo phiếu
            </button>
          )}
        </header>

        {error && <div className="deposit-alert"><span className="material-symbols-outlined">error</span>{error}</div>}

        <div className="deposit-toolbar">
          <div className="deposit-tabs">
            <button type="button" className={!status ? 'active' : ''} onClick={() => setStatus('')}>Tất cả</button>
            {Object.entries(LABELS).map(([key, label]) => (
              <button type="button" className={status === key ? 'active' : ''} key={key} onClick={() => setStatus(key)}>{label}</button>
            ))}
          </div>
          <button type="button" className="qt-btn-icon" title="Tải lại" onClick={fetchList}>
            <span className="material-symbols-outlined">refresh</span>
          </button>
        </div>

        <div className="deposit-layout">
          <section className="deposit-list" aria-label="Danh sách phiếu đặt cọc">
            {loading && <div className="qt-loading">Đang tải phiếu...</div>}
            {!loading && !items.length && <div className="deposit-empty"><span className="material-symbols-outlined">inbox</span><p>Không có phiếu ở trạng thái này.</p></div>}
            {items.map((item) => (
              <button type="button" key={item.MaDatCoc} className={`deposit-row ${selected?.MaDatCoc === item.MaDatCoc ? 'active' : ''}`} onClick={() => fetchDetail(item.MaDatCoc)}>
                <span className={`deposit-status-dot deposit-status-dot--${item.TrangThai}`} />
                <span className="deposit-row-main">
                  <strong>{item.KhachHang?.HoTen || `Khách ${item.CCCD}`}</strong>
                  <small>Phiếu #{item.MaDatCoc} · P.{item.MaPhong || '—'} · {item.ChiNhanh?.TenCN || 'Chưa rõ chi nhánh'}</small>
                </span>
                <span className="deposit-row-side">
                  <span className="deposit-chip">{LABELS[item.TrangThai] || item.TrangThai}</span>
                  <small>{dateTime(item.CapNhatLuc || item.ThoiDiemTao)}</small>
                </span>
              </button>
            ))}
          </section>

          <aside className="deposit-detail">
            {!selected ? (
              <div className="deposit-empty"><span className="material-symbols-outlined">description</span><p>Chọn một phiếu để xem và xử lý.</p></div>
            ) : (
              <>
                <div className="deposit-detail-head">
                  <div><small>PHIẾU #{selected.MaDatCoc}</small><h2>{selected.KhachHang?.HoTen}</h2></div>
                  <span className="deposit-chip">{LABELS[selected.TrangThai] || selected.TrangThai}</span>
                </div>

                {selected.TrangThai === 'CHO_THANH_TOAN' && (
                  <div className="deposit-countdown"><span className="material-symbols-outlined">timer</span><div><small>Thời gian thanh toán còn lại</small><strong>{remaining(selected.HanThanhToan, now)}</strong></div></div>
                )}
                {selected.LyDoXuLy && <div className="deposit-reason"><strong>Ghi chú xử lý</strong><p>{selected.LyDoXuLy}</p></div>}

                <section className="deposit-section">
                  <h3>Thông tin khách thuê</h3>
                  {role === 'SALE' && ['MOI', 'HET_CHO'].includes(selected.TrangThai) ? (
                    <div className="deposit-customer-form">
                      <label className="deposit-field"><span>Họ tên</span><input value={customerForm.HoTen || ''} onChange={(event) => setCustomerForm((prev) => ({ ...prev, HoTen: event.target.value }))} /></label>
                      <label className="deposit-field"><span>Số điện thoại</span><input value={customerForm.SDT || ''} onChange={(event) => setCustomerForm((prev) => ({ ...prev, SDT: event.target.value }))} /></label>
                      <label className="deposit-field"><span>Giới tính</span><select value={customerForm.GioiTinh || ''} onChange={(event) => setCustomerForm((prev) => ({ ...prev, GioiTinh: event.target.value }))}><option value="">Chưa chọn</option><option value="Nam">Nam</option><option value="Nữ">Nữ</option><option value="Khác">Khác</option></select></label>
                      <label className="deposit-field"><span>Quốc tịch</span><input value={customerForm.QuocTich || ''} onChange={(event) => setCustomerForm((prev) => ({ ...prev, QuocTich: event.target.value }))} /></label>
                      <label className="deposit-field"><span>Email</span><input type="email" value={customerForm.Email || ''} onChange={(event) => setCustomerForm((prev) => ({ ...prev, Email: event.target.value }))} /></label>
                      <label className="deposit-field"><span>Khả năng tài chính</span><input type="number" value={customerForm.KhaNangTaiChinh || ''} onChange={(event) => setCustomerForm((prev) => ({ ...prev, KhaNangTaiChinh: event.target.value }))} /></label>
                    </div>
                  ) : (
                    <dl className="deposit-info-grid">
                      <div><dt>CCCD</dt><dd>{selected.CCCD}</dd></div><div><dt>Số điện thoại</dt><dd>{selected.KhachHang?.SDT || '—'}</dd></div><div><dt>Giới tính</dt><dd>{selected.KhachHang?.GioiTinh || '—'}</dd></div><div><dt>Quốc tịch</dt><dd>{selected.KhachHang?.QuocTich || '—'}</dd></div><div><dt>Giấy tờ</dt><dd>{selected.KhachHang?.CCCD ? 'Đã có CCCD' : 'Chưa bổ sung'}</dd></div><div><dt>Khả năng tài chính</dt><dd>{selected.KhachHang?.KhaNangTaiChinh ? money(selected.KhachHang.KhaNangTaiChinh) : 'Chưa áp dụng'}</dd></div>
                    </dl>
                  )}
                </section>

                <section className="deposit-section">
                  <div className="deposit-section-title"><h3>Phòng và giường</h3>{role === 'QUAN_LY' && <a href="/phong-giuong" target="_blank" rel="noreferrer">Xem sơ đồ phòng</a>}{role === 'SALE' && selected.TrangThai === 'HET_CHO' && <button type="button" className="deposit-link-button" onClick={editSelection}>Đổi lựa chọn</button>}</div>
                  <div className="deposit-room-line"><span className="material-symbols-outlined">bed</span><div><strong>P.{selected.MaPhong} · {selected.LoaiThue === 'NGUYEN_PHONG' ? 'Nguyên phòng' : 'Giường lẻ'}</strong><p>{selectedBeds.map((item) => `G.${item.MaGiuong}`).join(', ') || 'Chưa chọn giường'} · {selected.ChiNhanh?.TenCN}</p></div></div>
                </section>

                {(selected.SoTienCoc > 0 || role === 'KE_TOAN') && (
                  <section className="deposit-section">
                    <h3>Tính tiền cọc</h3>
                    <div className="deposit-formula"><span>Tiền thuê 2 tháng × {selected.LoaiThue === 'NGUYEN_PHONG' ? room?.SucChua || selected.SoGiuongThue : selectedBeds.length} giường</span><strong>{money(suggested)}</strong></div>
                    {role === 'KE_TOAN' && selected.TrangThai === 'CHO_TINH_COC' ? (
                      <label className="deposit-field"><span>Số tiền Kế toán xác nhận</span><input type="number" min="1" value={depositAmount || suggested} onChange={(event) => setDepositAmount(event.target.value)} /></label>
                    ) : <div className="deposit-total"><span>Số tiền phải thanh toán</span><strong>{money(selected.SoTienCoc)}</strong></div>}
                  </section>
                )}

                {['CHO_THANH_TOAN', 'TU_CHOI_CHUNG_TU'].includes(selected.TrangThai) && role === 'SALE' && (
                  <section className="deposit-section">
                    <h3>Chứng từ thanh toán</h3>
                    <label className="deposit-field"><span>Mã giao dịch</span><input value={transaction} onChange={(event) => setTransaction(event.target.value)} placeholder="VD: FT2410123456" /></label>
                    <label className="deposit-upload"><span className="material-symbols-outlined">upload_file</span><span>{evidence ? 'Đã chọn ảnh chứng từ' : 'Chọn ảnh giao dịch (tối đa 2 MB)'}</span><input type="file" accept="image/*" onChange={(event) => onEvidence(event.target.files?.[0])} /></label>
                  </section>
                )}

                {selected.chungTu?.length > 0 && (
                  <section className="deposit-section"><h3>Chứng từ gần nhất</h3><div className="deposit-proof"><div><small>Mã giao dịch</small><strong>{selected.chungTu[0].MaGiaoDich || 'Không nhập'}</strong><p>Tải lên {dateTime(selected.chungTu[0].TaiLenLuc)}</p></div>{selected.chungTu[0].HinhAnhDataUrl && <a href={selected.chungTu[0].HinhAnhDataUrl} target="_blank" rel="noreferrer"><img src={selected.chungTu[0].HinhAnhDataUrl} alt="Chứng từ thanh toán" /></a>}</div></section>
                )}

                {((role === 'QUAN_LY' && ['CHO_KIEM_TRA_PHONG', 'CHO_XAC_NHAN_THANH_TOAN'].includes(selected.TrangThai))) && (
                  <label className="deposit-field deposit-note"><span>Ghi chú / lý do từ chối</span><textarea rows="3" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Nhập khi báo hết chỗ hoặc từ chối chứng từ" /></label>
                )}

                <div className="deposit-actions">
                  {role === 'QUAN_LY' && selected.TrangThai === 'CHO_KIEM_TRA_PHONG' && <button type="button" className="qt-btn-outline deposit-danger" disabled={busy} onClick={() => submitAction('BAO_HET_CHO')}>Báo hết chỗ</button>}
                  {role === 'QUAN_LY' && selected.TrangThai === 'CHO_XAC_NHAN_THANH_TOAN' && <button type="button" className="qt-btn-outline deposit-danger" disabled={busy} onClick={() => submitAction('TU_CHOI_CHUNG_TU')}>Từ chối chứng từ</button>}
                  {primaryAction && !(selected.TrangThai === 'HET_CHO' && role === 'SALE') && <button type="button" className="qt-btn-primary" disabled={busy} onClick={() => submitAction(primaryAction[0], primaryAction[0] === 'GUI_KIEM_TRA' ? { khachHang: customerForm } : {})}>{busy ? 'Đang xử lý...' : primaryAction[1]}</button>}
                </div>

                {selected.lichSu?.length > 0 && (
                  <section className="deposit-history"><h3>Lịch sử xử lý</h3>{selected.lichSu.map((item) => <div key={item.MaLichSu}><span /><p><strong>{LABELS[item.TrangThaiMoi] || item.TrangThaiMoi}</strong><small>{item.VaiTroThucHien} · {dateTime(item.ThoiDiem)}{item.GhiChu ? ` · ${item.GhiChu}` : ''}</small></p></div>)}</section>
                )}
              </>
            )}
          </aside>
        </div>
      </div>

      {showCreate && (
        <div className="deposit-modal-backdrop" role="presentation" onMouseDown={() => setShowCreate(false)}>
          <div className="deposit-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <div className="deposit-modal-head"><div><small>SALE</small><h2>{editingSelection ? 'Đổi phòng/giường' : 'Tạo phiếu đặt cọc'}</h2></div><button type="button" className="qt-btn-icon" onClick={() => setShowCreate(false)}><span className="material-symbols-outlined">close</span></button></div>
            <div className="deposit-modal-body">
              {!editingSelection && <label className="deposit-field"><span>CCCD khách hàng</span><input value={createForm.cccd} onChange={(event) => setCreateForm((prev) => ({ ...prev, cccd: event.target.value }))} placeholder="Khách hàng đã có trên hệ thống" /></label>}
              <label className="deposit-field"><span>Loại thuê</span><select value={createForm.loaiThue} onChange={(event) => setCreateForm((prev) => ({ ...prev, loaiThue: event.target.value, maGiuongs: [] }))}><option value="GIUONG_LE">Giường lẻ</option><option value="NGUYEN_PHONG">Nguyên phòng</option></select></label>
              <label className="deposit-field"><span>Phòng</span><select value={createForm.maPhong} onChange={(event) => setCreateForm((prev) => ({ ...prev, maPhong: event.target.value, maGiuongs: [] }))}><option value="">Chọn phòng</option>{rooms.map((item) => <option key={item.MaPhong} value={item.MaPhong}>P.{item.MaPhong} · {item.ChiNhanh?.TenCN} · {item.LoaiPhong}</option>)}</select></label>
              {selectedCreateRoom && <div className="deposit-bed-picker">{selectedCreateRoom.Giuong.map((bed) => { const disabled = !bed.TinhTrang || bed.dangKhoa; const checked = createForm.maGiuongs.includes(bed.MaGiuong); return <label key={bed.MaGiuong} className={`${disabled ? 'disabled' : ''} ${checked ? 'checked' : ''}`}><input type="checkbox" disabled={disabled || (createForm.loaiThue === 'NGUYEN_PHONG' && !checked && createForm.maGiuongs.length > 0)} checked={checked} onChange={() => { const allAvailable = selectedCreateRoom.Giuong.filter((item) => item.TinhTrang && !item.dangKhoa).map((item) => item.MaGiuong); setCreateForm((prev) => ({ ...prev, maGiuongs: prev.loaiThue === 'NGUYEN_PHONG' ? allAvailable : checked ? prev.maGiuongs.filter((id) => id !== bed.MaGiuong) : [...prev.maGiuongs, bed.MaGiuong] })); }} /><span className="material-symbols-outlined">bed</span><strong>G.{bed.MaGiuong}</strong><small>{disabled ? 'Không trống' : money(bed.GiaThue)}</small></label>; })}</div>}
            </div>
            <div className="deposit-modal-actions"><button type="button" className="qt-btn-outline" onClick={() => setShowCreate(false)}>Hủy</button><button type="button" className="qt-btn-primary" disabled={busy || !createForm.cccd || !createForm.maGiuongs.length} onClick={editingSelection ? saveNewSelection : createDeposit}>{editingSelection ? 'Lưu và gửi kiểm tra' : 'Tạo phiếu'}</button></div>
          </div>
        </div>
      )}
    </KhungNhanVien>
  );
}
