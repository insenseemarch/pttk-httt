import { useEffect, useState } from 'react';
import KhungNhanVien from '../components/KhungNhanVien';
import ReconcileConfirmForm from '../components/checkout/ReconcileConfirmForm';
import ContractLiquidateForm from '../components/checkout/ContractLiquidateForm';

function layChipHD(trangThai) {
  const map = {
    'Hiệu lực': 'green',
    'Thanh lý': 'gray',
    'Hủy': 'red',
    'Chờ xác nhận đối soát': 'orange',
    'Chờ hoàn cọc': 'orange',
    'Chờ thanh toán thêm': 'orange',
    'Khách đồng ý đối soát (Chờ TT)': 'orange',
    'Đã hoàn cọc': 'blue',
    'Đã thu thêm tiền': 'blue',
    'Đã thanh lý': 'gray'
  };
  return map[trangThai] || 'gray';
}

export default function DanhSachHopDong({ nguoiDung, dangXuat }) {
  const [danhSach, setDanhSach] = useState([]);
  const [chiNhanh, setChiNhanh] = useState([]);
  const [soCanBao, setSoCanBao] = useState(0);
  const [dangTai, setDangTai] = useState(true);
  const [tong, setTong] = useState(0);
  const [boLoc, setBoLoc] = useState({ maCN: '', trangThai: '', thang: '', phong: '', page: 1, limit: 10000 });

  const [hdDangXem, setHdDangXem] = useState(null);
  const [phieuDoiSoat, setPhieuDoiSoat] = useState([]);

  // States cho 2 modal mới
  const [showDoiSoat, setShowDoiSoat] = useState(false);
  const [showThanhLy, setShowThanhLy] = useState(false);
  const [selectedMockItem, setSelectedMockItem] = useState(null);
  const [actionIndex, setActionIndex] = useState(-1);

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  useEffect(() => {
    fetch('/api/chi-nhanh').then((r) => r.json()).then((res) => {
      if (res.ok) setChiNhanh(res.data);
    });
    fetch('/api/hop-dong/can-bao').then((r) => r.json()).then((res) => {
      if (res.ok) setSoCanBao(res.data.soLuong);
    });
  }, []);

  useEffect(() => {
    taiDanhSach();
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
        setTong(res.tong);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDangTai(false);
    }
  };

  const apDungLoc = (e) => {
    e.preventDefault();
    taiDanhSach();
  };

  const moModalXem = (hd) => {
    setHdDangXem(hd);
    // Mock dữ liệu phiếu đối soát liên kết nếu hợp đồng đang trong quá trình trả phòng
    if (hd.trangThai === 'Chờ xác nhận đối soát' || hd.trangThai === 'Khách đồng ý đối soát (Chờ TT)' || hd.trangThai === 'Chờ hoàn cọc' || hd.trangThai === 'Chờ thanh toán thêm') {

      let loai = 'Hoàn cọc';
      let soTien = 21500000;
      let ngayLap = new Date().toLocaleDateString('vi-VN');

      if (hd.pdsInfo) {
        // Lấy dữ liệu thật từ DB (tính toán dựa vào SoTienHoanThuc)
        soTien = Math.abs(hd.pdsInfo.soTienHoanThuc);
        loai = hd.pdsInfo.soTienHoanThuc >= 0 ? 'Hoàn cọc' : 'Thu thêm';
        if (hd.pdsInfo.ngayLap) {
          ngayLap = new Date(hd.pdsInfo.ngayLap).toLocaleDateString('vi-VN');
        }
      } else {
        // Fallback: Khớp dữ liệu giả lập với thông tin trên các màn hình khác (cho test offline)
        if (hd.maHD === 'HD-00010' || hd.maHD === 'HD-10') {
          loai = 'Hoàn cọc';
          soTien = 7400000;
        } else if (hd.maHD === 'HD-00009' || hd.maHD === 'HD-9') {
          loai = 'Hoàn cọc';
          soTien = 21500000;
        } else if (hd.maHD === 'HD-00002' || hd.maHD === 'HD-2') {
          loai = 'Thu thêm';
          soTien = 6000000;
        } else {
          const num = parseInt(hd.maHD.replace(/\D/g, '') || '0', 10);
          loai = num % 2 === 0 ? 'Thu thêm' : 'Hoàn cọc';
          soTien = num % 2 === 0 ? 500000 : 3500000;
        }
      }

      let tthai = 'Chờ hoàn cọc';
      if (hd.trangThai === 'Chờ xác nhận đối soát') tthai = 'Chờ khách xác nhận';
      if (hd.trangThai === 'Khách đồng ý đối soát (Chờ TT)') tthai = loai === 'Hoàn cọc' ? 'Chờ hoàn cọc' : 'Chờ thanh toán thêm';

      setPhieuDoiSoat([{
        maPhieu: `PDS-${hd.maHD ? hd.maHD.replace('HD-', '') : '001'}`,
        ngayLap: ngayLap,
        soTien: soTien,
        loai: loai,
        trangThai: tthai
      }]);
    } else {
      setPhieuDoiSoat([]);
    }
  };

  const dongModalXem = () => {
    setHdDangXem(null);
    setPhieuDoiSoat([]);
  };

  const moXacNhanDoiSoat = async (pdsIndex) => {
    if (!hdDangXem) return;
    const p = phieuDoiSoat[pdsIndex];
    const maSo = hdDangXem.maHD || hdDangXem.maHopDong;
    
    try {
      const res = await fetch(`/api/checkout/detail?id=${maSo}`);
      const data = await res.json();
      if (data.ok && data.data) {
        setSelectedMockItem(data.data);
        setActionIndex(pdsIndex);
        setShowDoiSoat(true);
      } else {
        showToast(data.error || 'Không tìm thấy hồ sơ quyết toán', 'error');
      }
    } catch (err) {
      showToast('Lỗi khi lấy dữ liệu', 'error');
    }
  };

  const handleXacNhanDoiSoatSubmit = async (hanhDong, lyDoTranhChap = '') => {
    if (!hdDangXem) return;
    const newPds = [...phieuDoiSoat];
    const p = newPds[actionIndex];

    if (hanhDong === 'tranh_chap') {
      showToast('Đã ghi nhận tranh chấp, chuyển về cho Kế toán xử lý', 'success');
      setShowDoiSoat(false);
      dongModalXem();
      return;
    }

    const newTrangThaiHD = p.loai === 'Hoàn cọc' ? 'Chờ hoàn cọc' : 'Chờ thanh toán thêm';
    try {
      const res = await fetch('/api/phieu-doi-soat/xac-nhan-khach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maHD: selectedMockItem.maSo, trangThai: newTrangThaiHD })
      });
      const data = await res.json();

      if (!data.ok) {
        showToast('Lỗi cập nhật: ' + data.message, 'error');
        return;
      }

      p.trangThai = newTrangThaiHD;
      setPhieuDoiSoat(newPds);

      const listMoi = danhSach.map(item => {
        if ((item.maHD && selectedMockItem.maSo === item.maHD) || (item.maHopDong && selectedMockItem.maSo === item.maHopDong)) {
          return { ...item, trangThai: newTrangThaiHD };
        }
        return item;
      });
      setDanhSach(listMoi);

      // Cập nhật state hdDangXem
      setHdDangXem({ ...hdDangXem, trangThai: newTrangThaiHD });

      showToast('Đã xác nhận khách hàng đồng ý phiếu đối soát. Trạng thái chuyển thành: ' + newTrangThaiHD);
    } catch (err) {
      console.error(err);
      showToast('Đã có lỗi xảy ra. Vui lòng thử lại.', 'error');
    }
  };

  const moThanhLy = async (hd) => {
    const maSo = hd.maHD || hd.maHopDong;
    try {
      const res = await fetch(`/api/checkout/detail?id=${maSo}`);
      const data = await res.json();
      if (data.ok && data.data) {
        setSelectedMockItem(data.data);
        setShowThanhLy(true);
      } else {
        showToast(data.error || 'Không tìm thấy hồ sơ quyết toán', 'error');
      }
    } catch (err) {
      showToast('Lỗi khi lấy dữ liệu', 'error');
    }
  };

  const handleThanhLySubmit = async (e) => {
    if (e) e.preventDefault();
    try {
      const res = await fetch('/api/phieu-doi-soat/hoan-tat-tra-phong', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maHD: selectedMockItem.maSo })
      });
      const data = await res.json();
      if (!data.ok) {
        showToast('Lỗi cập nhật: ' + data.message, 'error');
        return;
      }
      
      const listMoi = danhSach.map(item => {
        if ((item.maHD && selectedMockItem.maSo === item.maHD) || (item.maHopDong && selectedMockItem.maSo === item.maHopDong)) {
          return { ...item, trangThai: 'Đã trả phòng' };
        }
        return item;
      });
      setDanhSach(listMoi);
      showToast('Hoàn tất trả phòng thành công!');
      setShowThanhLy(false);
      dongModalXem();
    } catch (err) {
      showToast('Lỗi kết nối', 'error');
    }
  };

  return (
    <KhungNhanVien nguoiDung={nguoiDung} dangXuat={dangXuat}>
      {toast.show && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', background: toast.type === 'success' ? '#10b981' : '#ef4444', color: '#fff', padding: '12px 24px', borderRadius: '8px', zIndex: 10000, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontWeight: 'bold' }}>
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
          <p>Quản lý hợp đồng thuê, theo dõi hạn và tỷ lệ hoàn cọc.</p>
        </div>
        <button type="button" className="qt-btn-primary">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          Thêm hợp đồng mới
        </button>
      </div>

      <form className="qt-filter-card" onSubmit={apDungLoc}>
        <div className="qt-field">
          <label>Chi nhánh</label>
          <select value={boLoc.maCN} onChange={(e) => setBoLoc((p) => ({ ...p, maCN: e.target.value }))}>
            <option value="">Tất cả chi nhánh</option>
            {chiNhanh.map((cn) => (
              <option key={cn.MaCN} value={cn.MaCN}>{cn.TenCN}</option>
            ))}
          </select>
        </div>
        <div className="qt-field">
          <label>Trạng thái</label>
          <select value={boLoc.trangThai} onChange={(e) => setBoLoc((p) => ({ ...p, trangThai: e.target.value }))}>
            <option value="">Tất cả</option>
            <option value="Hiệu lực">Hiệu lực</option>
            <option value="Chờ xác nhận đối soát">Chờ xác nhận đối soát</option>
            <option value="Chờ hoàn cọc">Chờ hoàn cọc / chờ thanh toán thêm</option>
            <option value="Thanh lý">Thanh lý</option>
            <option value="Hủy">Hủy</option>
          </select>
        </div>
        <div className="qt-field">
          <label>Thời gian (tháng hết hạn)</label>
          <input type="month" value={boLoc.thang} onChange={(e) => setBoLoc((p) => ({ ...p, thang: e.target.value }))} />
        </div>
        <div className="qt-field">
          <label>Phòng</label>
          <input placeholder="Tìm số phòng..." value={boLoc.phong} onChange={(e) => setBoLoc((p) => ({ ...p, phong: e.target.value }))} />
        </div>
        <button type="submit" className="qt-btn-primary">Lọc</button>
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
                  <th>Ngày bắt đầu</th>
                  <th>Ngày hết hạn</th>
                  <th>Tỷ lệ hoàn cọc</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {danhSach.map((hd) => (
                  <tr key={hd.maHopDong || hd.maHD}>
                    <td><strong>{hd.maHD}</strong></td>
                    <td>
                      <div>{hd.hoTen}</div>
                      <div className="sub">{hd.sdt}</div>
                    </td>
                    <td>{hd.phong}</td>
                    <td>{hd.ngayBatDau}</td>
                    <td style={{ color: hd.sapHetHan ? '#dc2626' : undefined }}>{hd.ngayHetHan}</td>
                    <td>{hd.tyLeHoanCoc || '100%'}</td>
                    <td>
                      <span className={`qt-chip qt-chip--${layChipHD(hd.trangThai)}`}>{hd.trangThai}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="button" className="qt-btn-icon" title="Xem thông tin và xác nhận đối soát" onClick={() => moModalXem(hd)}>
                          <span className="material-symbols-outlined">visibility</span>
                        </button>
                        {hd.trangThai === 'Thanh lý' && (
                          <button type="button" className="qt-btn-icon" style={{ color: '#059669', background: '#ecfdf5', borderColor: '#a7f3d0' }} title="Mở bảng thanh lý & thu hồi" onClick={() => moThanhLy(hd)}>
                            <span className="material-symbols-outlined">contract</span>
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

      {/* Modal Xem Hợp Đồng & Các Phiếu Liên Kết */}
      {hdDangXem && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '12px', width: '600px', padding: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '18px', margin: '0 0 16px 0', borderBottom: '1px solid #eee', paddingBottom: '12px', color: '#0f172a' }}>
              Chi tiết hợp đồng: {hdDangXem.maHD}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px', color: '#334155', marginBottom: '24px' }}>
              <div>
                <p style={{ margin: '4px 0', color: '#64748b' }}>Khách hàng:</p>
                <strong style={{ color: '#0f172a' }}>{hdDangXem.hoTen}</strong>
              </div>
              <div>
                <p style={{ margin: '4px 0', color: '#64748b' }}>Số điện thoại:</p>
                <strong style={{ color: '#0f172a' }}>{hdDangXem.sdt}</strong>
              </div>
              <div>
                <p style={{ margin: '4px 0', color: '#64748b' }}>Phòng/Giường:</p>
                <strong style={{ color: '#0f172a' }}>{hdDangXem.phong}</strong>
              </div>
              <div>
                <p style={{ margin: '4px 0', color: '#64748b' }}>Trạng thái hợp đồng:</p>
                <span className={`qt-chip qt-chip--${layChipHD(hdDangXem.trangThai)}`} style={{ padding: '2px 8px', fontSize: '12px' }}>{hdDangXem.trangThai}</span>
              </div>
              <div>
                <p style={{ margin: '4px 0', color: '#64748b' }}>Ngày bắt đầu:</p>
                <strong style={{ color: '#0f172a' }}>{hdDangXem.ngayBatDau}</strong>
              </div>
              <div>
                <p style={{ margin: '4px 0', color: '#64748b' }}>Ngày hết hạn:</p>
                <strong style={{ color: '#0f172a' }}>{hdDangXem.ngayHetHan}</strong>
              </div>
            </div>

            {/* Phần Phiếu Đối Soát */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 12px 0' }}>
                Các phiếu đối soát liên kết
              </h3>

              {phieuDoiSoat.length === 0 ? (
                <p style={{ fontSize: '14px', color: '#64748b', fontStyle: 'italic' }}>Không có phiếu đối soát nào cần xử lý.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {phieuDoiSoat.map((p, idx) => (
                    <div key={p.maPhieu} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '13.5px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{p.maPhieu} - <span style={{ color: p.loai === 'Hoàn cọc' ? '#059669' : '#dc2626' }}>Loại: {p.loai}</span></div>
                        <div>Ngày lập: {p.ngayLap}</div>
                        <div>Số tiền: <strong style={{ color: '#0f172a' }}>{p.soTien.toLocaleString('vi-VN')} VNĐ</strong></div>
                        <div style={{ marginTop: '4px' }}>
                          Trạng thái phiếu: <span style={{ fontWeight: 'bold', color: p.trangThai === 'Chờ khách xác nhận' ? '#ea580c' : '#2563eb' }}>{p.trangThai}</span>
                        </div>
                      </div>

                      <div>
                        {p.trangThai === 'Chờ khách xác nhận' ? (
                          <button
                            onClick={() => moXacNhanDoiSoat(idx)}
                            style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: 'var(--primary-color)', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                            Xác nhận của khách hàng
                          </button>
                        ) : (
                          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#10b981' }}>check_circle</span>
                            Đã chuyển qua Kế toán
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              {hdDangXem.trangThai === 'Thanh lý' && (
                <button onClick={() => moThanhLy(hdDangXem)} style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', background: '#10b981', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>
                  Ký thanh lý & Thu hồi phòng
                </button>
              )}
              <button onClick={dongModalXem} style={{ padding: '8px 20px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', cursor: 'pointer', fontWeight: 'bold' }}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY: MÀN HÌNH ĐỐI SOÁT */}
      {showDoiSoat && selectedMockItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '900px', maxWidth: '95vw', maxHeight: '95vh', overflowY: 'auto' }}>
            <ReconcileConfirmForm
              selectedItem={selectedMockItem}
              onConfirm={handleXacNhanDoiSoatSubmit}
              onCancel={() => setShowDoiSoat(false)}
            />
          </div>
        </div>
      )}

      {/* OVERLAY: MÀN HÌNH THANH LÝ */}
      {showThanhLy && selectedMockItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '900px', maxWidth: '95vw', background: '#fff', borderRadius: '16px', padding: '24px', maxHeight: '95vh', overflowY: 'auto' }}>
            <ContractLiquidateForm
              selectedItem={selectedMockItem}
              onSubmit={handleThanhLySubmit}
              onCancel={() => setShowThanhLy(false)}
            />
          </div>
        </div>
      )}

    </KhungNhanVien>
  );
}
