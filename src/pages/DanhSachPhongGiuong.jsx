import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import KhungNhanVien from '../components/KhungNhanVien';
import { ROUTES } from '../config/routes';

function layChipTrangThai(trangThai) {
  const map = {
    'Trống': 'green',
    'Đang thuê': 'red',
    'Đã đặt cọc': 'orange',
    'Đóng cửa': 'gray',
  };
  return map[trangThai] || 'gray';
}

export default function DanhSachPhongGiuong({ nguoiDung, dangXuat }) {
  const [thongKe, setThongKe] = useState({ tongPhong: 0, phongTrong: 0, dangDatCoc: 0, tyLeLapDay: 0 });
  const [danhSach, setDanhSach] = useState([]);
  const [chiNhanh, setChiNhanh] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [boLoc, setBoLoc] = useState({ maCN: '', trangThai: '', loaiPhong: '', timKiem: '', page: 1 });
  const [tong, setTong] = useState(0);

  // States cho modal cập nhật và thêm phòng
  const [showModalThem, setShowModalThem] = useState(false);
  const [formThem, setFormThem] = useState({ maPhong: '', loaiPhong: 'Giường ghép', giaThue: '1.500.000' });
  const [showModalCapNhat, setShowModalCapNhat] = useState(false);
  const [phongDangCapNhat, setPhongDangCapNhat] = useState({ maPhong: '', trangThai: '' });
  const [showModalChiTiet, setShowModalChiTiet] = useState(false);
  const [phongDangXem, setPhongDangXem] = useState(null);
  const [tabModalCapNhat, setTabModalCapNhat] = useState('phong');
  const [danhSachGiuongCapNhat, setDanhSachGiuongCapNhat] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    taiChiNhanh();
  }, []);

  useEffect(() => {
    taiDuLieu();
  }, [boLoc]);

  const taiChiNhanh = async () => {
    const res = await fetch('/api/chi-nhanh').then((r) => r.json());
    if (res.ok) setChiNhanh(res.data);
  };

  const taiDuLieu = async () => {
    setDangTai(true);
    try {
      const qs = new URLSearchParams(
        Object.fromEntries(Object.entries(boLoc).filter(([, v]) => v !== '')),
      );
      const [resTK, resDS] = await Promise.all([
        fetch('/api/phong-giuong/thong-ke').then((r) => r.json()),
        fetch(`/api/phong-giuong?${qs}`).then((r) => r.json()),
      ]);
      if (resTK.ok) setThongKe(resTK.data);
      if (resDS.ok) {
        setDanhSach(resDS.danhSach);
        setTong(resDS.tong);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDangTai(false);
    }
  };

  const capNhatBoLoc = (key, value) => {
    setBoLoc((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const xuLyThemPhong = () => {
    setFormThem({ maPhong: '', loaiPhong: 'Giường ghép', giaThue: '1.500.000' });
    setShowModalThem(true);
  };

  const xacNhanThemPhong = () => {
    const { maPhong, loaiPhong, giaThue } = formThem;
    if (!maPhong.trim()) {
      alert("Vui lòng nhập số phòng!");
      return;
    }
    
    setDanhSach(prev => [
      {
        maPhong: Number(maPhong),
        loaiPhong: loaiPhong,
        sucChua: 4,
        giaThue: giaThue + " đ",
        giaThueSo: Number(giaThue.replace(/\D/g, '')),
        chiNhanh: chiNhanh[0]?.TenCN || "Chi nhánh 1",
        trangThai: "Trống",
        hienTrang: "0/4",
        tyLe: 0,
        soGiuongTrong: 4,
        soGiuong: 4
      },
      ...prev
    ]);
    
    setThongKe(prev => ({
      ...prev,
      tongPhong: prev.tongPhong + 1,
      phongTrong: prev.phongTrong + 1
    }));
    
    setShowModalThem(false);
    setToastMessage(`Thêm phòng P.${maPhong} thành công!`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const xuLyCapNhatTrangThai = (roomObj) => {
    setPhongDangCapNhat({ maPhong: roomObj.maPhong, trangThai: roomObj.trangThai });
    
    // Tạo danh sách giường giả lập
    const beds = Array.from({ length: roomObj.soGiuong || 4 }).map((_, idx) => {
      const trangThaiGiuong = roomObj.trangThai === 'Trống' ? 'Trống' : (roomObj.trangThai === 'Đang thuê' ? 'Đang thuê' : (idx === 0 ? 'Đã đặt cọc' : 'Trống'));
      return {
        maGiuong: `G.${roomObj.maPhong}0${idx+1}`,
        trangThai: trangThaiGiuong
      };
    });
    
    setDanhSachGiuongCapNhat(beds);
    setTabModalCapNhat('phong');
    setShowModalCapNhat(true);
  };

  const xacNhanCapNhatTrangThai = () => {
    const { maPhong, trangThai: trangThaiPhongMoi } = phongDangCapNhat;
    
    let trangThaiMoi = trangThaiPhongMoi;
    let hienTrangMoi = null;
    let tyLeMoi = null;

    if (tabModalCapNhat === 'giuong') {
      const total = danhSachGiuongCapNhat.length;
      const thue = danhSachGiuongCapNhat.filter(g => g.trangThai === 'Đang thuê').length;
      const coc = danhSachGiuongCapNhat.filter(g => g.trangThai === 'Đã đặt cọc').length;
      
      hienTrangMoi = `${thue + coc}/${total}`;
      tyLeMoi = Math.round(((thue + coc) / total) * 100);
      
      if (thue > 0) trangThaiMoi = 'Đang thuê';
      else if (coc > 0) trangThaiMoi = 'Đã đặt cọc';
      else trangThaiMoi = 'Trống';
    }

    setDanhSach(prev => prev.map(p => {
      if (p.maPhong === maPhong) {
        let diffTrong = 0;
        let diffCoc = 0;
        if (p.trangThai === 'Trống') diffTrong = -1;
        if (p.trangThai === 'Đã đặt cọc') diffCoc = -1;
        
        if (trangThaiMoi === 'Trống') diffTrong = 1;
        if (trangThaiMoi === 'Đã đặt cọc') diffCoc = 1;

        setThongKe(tk => ({
          ...tk,
          phongTrong: Math.max(0, tk.phongTrong + diffTrong),
          dangDatCoc: Math.max(0, tk.dangDatCoc + diffCoc)
        }));

        return {
          ...p,
          trangThai: trangThaiMoi,
          hienTrang: hienTrangMoi || (trangThaiMoi === 'Trống' ? `0/${p.soGiuong || 4}` : (trangThaiMoi === 'Đang thuê' ? `${p.soGiuong || 4}/${p.soGiuong || 4}` : p.hienTrang)),
          tyLe: tyLeMoi !== null ? tyLeMoi : (trangThaiMoi === 'Trống' ? 0 : (trangThaiMoi === 'Đang thuê' ? 100 : p.tyLe))
        };
      }
      return p;
    }));
    
    setShowModalCapNhat(false);
    setToastMessage(`Đã cập nhật tình trạng thành công!`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const xuLyXemChiTiet = (phong) => {
    setPhongDangXem(phong);
    setShowModalChiTiet(true);
  };

  return (
    <KhungNhanVien nguoiDung={nguoiDung} dangXuat={dangXuat}>
      <div className="qt-page-header">
        <div>
          <h1>Quản lý Phòng &amp; Giường</h1>
          <p>Theo dõi hiện trạng, đặt cọc và lập hợp đồng theo từng phòng.</p>
        </div>
        <button type="button" className="qt-btn-primary" onClick={xuLyThemPhong}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          Thêm phòng mới
        </button>
      </div>

      <div className="qt-stats">
        <div className="qt-stat-card"><p>Tổng phòng</p><strong>{thongKe.tongPhong}</strong></div>
        <div className="qt-stat-card"><p>Phòng trống</p><strong>{thongKe.phongTrong}</strong></div>
        <div className="qt-stat-card"><p>Đang đặt cọc</p><strong>{thongKe.dangDatCoc}</strong></div>
        <div className="qt-stat-card"><p>Tỷ lệ lấp đầy</p><strong>{thongKe.tyLeLapDay}%</strong></div>
      </div>

      <div className="qt-filter-card">
        <div className="qt-field">
          <label>Chi nhánh</label>
          <select value={boLoc.maCN} onChange={(e) => capNhatBoLoc('maCN', e.target.value)}>
            <option value="">Tất cả</option>
            {chiNhanh.map((cn) => (
              <option key={cn.MaCN} value={cn.MaCN}>{cn.TenCN}</option>
            ))}
          </select>
        </div>
        <div className="qt-field">
          <label>Tình trạng</label>
          <select value={boLoc.trangThai} onChange={(e) => capNhatBoLoc('trangThai', e.target.value)}>
            <option value="">Tất cả</option>
            <option value="Trống">Trống</option>
            <option value="Đang thuê">Đang thuê</option>
            <option value="Đã đặt cọc">Đã đặt cọc</option>
          </select>
        </div>
        <div className="qt-field">
          <label>Loại phòng</label>
          <select value={boLoc.loaiPhong} onChange={(e) => capNhatBoLoc('loaiPhong', e.target.value)}>
            <option value="">Tất cả</option>
            <option value="Nguyên">Nguyên căn</option>
            <option value="Giường">Giường ghép</option>
          </select>
        </div>
        <div className="qt-field qt-search-wrap">
          <label>Tìm kiếm</label>
          <span className="material-symbols-outlined">search</span>
          <input
            placeholder="Tìm số phòng..."
            value={boLoc.timKiem}
            onChange={(e) => capNhatBoLoc('timKiem', e.target.value)}
          />
        </div>
      </div>

      {dangTai ? (
        <div className="qt-loading">Đang tải dữ liệu...</div>
      ) : danhSach.length === 0 ? (
        <div className="qt-empty">Không có phòng phù hợp bộ lọc.</div>
      ) : (
        <div className="qt-room-grid">
          {danhSach.map((p) => (
            <div key={p.maPhong} className="qt-room-card">
              <div className="qt-room-card-header">
                <div>
                  <p className="qt-room-meta">{p.loaiPhong}</p>
                  <h3>P.{p.maPhong}</h3>
                </div>
                <span className={`qt-chip qt-chip--${layChipTrangThai(p.trangThai)}`}>{p.trangThai}</span>
              </div>
              <p className="qt-room-meta">{p.chiNhanh} · Sức chứa {p.sucChua}</p>
              <p className="qt-room-meta"><strong>{p.giaThue}</strong>{p.loaiPhong?.includes('Giường') ? '/giường' : '/tháng'}</p>
              {p.hetHanCoc && <p className="qt-room-meta">Hết hạn cọc: {p.hetHanCoc}</p>}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span>Hiện trạng {p.hienTrang}</span>
                  <span>{p.tyLe}%</span>
                </div>
                <div className="qt-progress">
                  <div className="qt-progress-bar" style={{ width: `${p.tyLe}%` }} />
                </div>
              </div>
              <div className="qt-room-actions" style={{ display: 'flex', gap: '8px' }}>
                <button type="button" className="qt-btn-outline" style={{ flex: 1 }} onClick={() => xuLyXemChiTiet(p)}>Chi tiết</button>
                <button type="button" className="qt-btn-primary" style={{ flex: 1 }} onClick={() => xuLyCapNhatTrangThai(p)}>Cập nhật</button>
              </div>
            </div>
          ))}
          <button type="button" className="qt-room-card qt-room-card--add" onClick={xuLyThemPhong}>
            <span className="material-symbols-outlined" style={{ fontSize: 32 }}>add_circle</span>
            <span>Thêm phòng mới</span>
          </button>
        </div>
      )}

      {!dangTai && tong > boLoc.page * 12 && (
        <div className="qt-pagination" style={{ marginTop: 24, background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb' }}>
          <span>Hiển thị {danhSach.length} / {tong} phòng</span>
          <div className="qt-pagination-btns">
            <button type="button" disabled={boLoc.page <= 1} onClick={() => setBoLoc((p) => ({ ...p, page: p.page - 1 }))}>Trước</button>
            <button type="button" onClick={() => setBoLoc((p) => ({ ...p, page: p.page + 1 }))}>Sau</button>
          </div>
        </div>
      )}

      {/* Modal Cập nhật Trạng thái */}
      {showModalCapNhat && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff', borderRadius: '20px', width: '420px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            padding: '28px', border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Cập nhật trạng thái</h3>
              <button type="button" onClick={() => setShowModalCapNhat(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <p style={{ fontSize: '14.5px', color: '#475569', marginBottom: '16px', lineHeight: '1.5' }}>
              Chọn cập nhật cho cả phòng <strong>P.{phongDangCapNhat.maPhong}</strong> hoặc từng giường đơn lẻ:
            </p>

            {/* Tab switchers */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '20px' }}>
              <button type="button" onClick={() => setTabModalCapNhat('phong')} style={{
                flex: 1, padding: '10px 0', border: 'none', background: 'none',
                borderBottom: tabModalCapNhat === 'phong' ? '2.5px solid #1a73e8' : 'none',
                color: tabModalCapNhat === 'phong' ? '#1a73e8' : '#64748b',
                fontWeight: '700', cursor: 'pointer', fontSize: '13.5px'
              }}>Cập nhật Phòng</button>
              <button type="button" onClick={() => setTabModalCapNhat('giuong')} style={{
                flex: 1, padding: '10px 0', border: 'none', background: 'none',
                borderBottom: tabModalCapNhat === 'giuong' ? '2.5px solid #1a73e8' : 'none',
                color: tabModalCapNhat === 'giuong' ? '#1a73e8' : '#64748b',
                fontWeight: '700', cursor: 'pointer', fontSize: '13.5px'
              }}>Cập nhật Giường</button>
            </div>

            {tabModalCapNhat === 'phong' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                {['Trống', 'Đang thuê', 'Đã đặt cọc', 'Đóng cửa'].map((st) => (
                  <label key={st} style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px',
                    borderRadius: '12px', border: '1.5px solid',
                    borderColor: phongDangCapNhat.trangThai === st ? '#1a73e8' : '#e2e8f0',
                    background: phongDangCapNhat.trangThai === st ? '#f0f7ff' : '#fafafa',
                    cursor: 'pointer', transition: 'all 0.2s', fontWeight: '600',
                    color: phongDangCapNhat.trangThai === st ? '#1e40af' : '#334155'
                  }}>
                    <input type="radio" name="trangThaiPhong" value={st}
                      checked={phongDangCapNhat.trangThai === st}
                      onChange={(e) => setPhongDangCapNhat(prev => ({ ...prev, trangThai: e.target.value }))}
                      style={{ width: '18px', height: '18px', accentColor: '#1a73e8' }} />
                    {st}
                  </label>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }}>
                {danhSachGiuongCapNhat.map((g, idx) => (
                  <div key={g.maGiuong} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="material-symbols-outlined" style={{ color: '#64748b', fontSize: '18px' }}>single_bed</span>
                      <strong style={{ fontSize: '13.5px', color: '#1e293b' }}>{g.maGiuong}</strong>
                    </div>
                    <select value={g.trangThai} onChange={(e) => {
                      const newStatus = e.target.value;
                      setDanhSachGiuongCapNhat(prev => prev.map((item, i) => i === idx ? { ...item, trangThai: newStatus } : item));
                    }} style={{ height: '32px', padding: '0 8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', background: '#fff', fontWeight: '700' }}>
                      <option value="Trống">Trống</option>
                      <option value="Đang thuê">Đang thuê</option>
                      <option value="Đã đặt cọc">Đã đặt cọc</option>
                      <option value="Bảo trì">Bảo trì</option>
                    </select>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowModalCapNhat(false)} className="qt-btn-outline" style={{ padding: '10px 20px', borderRadius: '10px', fontWeight: '700' }}>Hủy</button>
              <button type="button" onClick={xacNhanCapNhatTrangThai} className="qt-btn-primary" style={{ padding: '10px 24px', borderRadius: '10px', fontWeight: '700' }}>Xác nhận</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Thêm phòng */}
      {showModalThem && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff', borderRadius: '20px', width: '450px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            padding: '28px', border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Thêm phòng mới</h3>
              <button type="button" onClick={() => setShowModalThem(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569' }}>Số phòng</label>
                <input type="text" placeholder="Ví dụ: 305"
                  value={formThem.maPhong}
                  onChange={(e) => setFormThem(prev => ({ ...prev, maPhong: e.target.value }))}
                  style={{
                    height: '42px', border: '1.5px solid #cbd5e1', borderRadius: '10px',
                    padding: '0 14px', outline: 'none', fontSize: '14px'
                  }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569' }}>Loại phòng</label>
                <select value={formThem.loaiPhong}
                  onChange={(e) => setFormThem(prev => ({ ...prev, loaiPhong: e.target.value }))}
                  style={{
                    height: '42px', border: '1.5px solid #cbd5e1', borderRadius: '10px',
                    padding: '0 14px', outline: 'none', fontSize: '14px', background: '#fff'
                  }}>
                  <option value="Giường ghép">Giường ghép (Dorm)</option>
                  <option value="Nguyên căn">Phòng nguyên căn (Studio)</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569' }}>Đơn giá thuê</label>
                <input type="text" placeholder="Ví dụ: 1.500.000"
                  value={formThem.giaThue}
                  onChange={(e) => setFormThem(prev => ({ ...prev, giaThue: e.target.value }))}
                  style={{
                    height: '42px', border: '1.5px solid #cbd5e1', borderRadius: '10px',
                    padding: '0 14px', outline: 'none', fontSize: '14px'
                  }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowModalThem(false)} className="qt-btn-outline" style={{ padding: '10px 20px', borderRadius: '10px', fontWeight: '700' }}>Hủy</button>
              <button type="button" onClick={xacNhanThemPhong} className="qt-btn-primary" style={{ padding: '10px 24px', borderRadius: '10px', fontWeight: '700' }}>Lưu lại</button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Chi tiết phòng */}
      {showModalChiTiet && phongDangXem && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff', borderRadius: '24px', width: '500px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
            padding: '32px', border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Phòng P.{phongDangXem.maPhong}</h3>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>{phongDangXem.chiNhanh} · {phongDangXem.loaiPhong}</p>
              </div>
              <button type="button" onClick={() => setShowModalChiTiet(false)} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', color: '#64748b', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '28px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: '#f8fafc', padding: '16px', borderRadius: '16px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>Tình trạng phòng</span>
                  <span style={{
                    fontSize: '13.5px', fontWeight: '800',
                    color: phongDangXem.trangThai === 'Trống' ? '#16a34a' : (phongDangXem.trangThai === 'Đang thuê' ? '#dc2626' : '#d97706')
                  }}>{phongDangXem.trangThai}</span>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>Giá thuê gốc</span>
                  <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>{phongDangXem.giaThue}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>Hiện trạng chỗ</span>
                  <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>{phongDangXem.hienTrang} (Giường)</strong>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>Tỷ lệ lấp đầy</span>
                  <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>{phongDangXem.tyLe}%</strong>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Chi tiết danh sách giường</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {Array.from({ length: phongDangXem.soGiuong || 4 }).map((_, idx) => {
                    const trangThaiGiuong = phongDangXem.trangThai === 'Trống' ? 'Trống' : (phongDangXem.trangThai === 'Đang thuê' ? 'Đang thuê' : (idx === 0 ? 'Đã đặt cọc' : 'Trống'));
                    return (
                      <div key={idx} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '12px 16px', borderRadius: '12px', border: '1px solid #f1f5f9',
                        background: '#ffffff'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span className="material-symbols-outlined" style={{ color: '#94a3b8', fontSize: '20px' }}>single_bed</span>
                          <strong style={{ fontSize: '14px', color: '#334155' }}>Giường G.{phongDangXem.maPhong}0{idx+1}</strong>
                        </div>
                        <span style={{
                          fontSize: '12px', fontWeight: '700', padding: '4px 8px', borderRadius: '6px',
                          background: trangThaiGiuong === 'Trống' ? '#f0fdf4' : (trangThaiGiuong === 'Đang thuê' ? '#fef2f2' : '#fffbeb'),
                          color: trangThaiGiuong === 'Trống' ? '#15803d' : (trangThaiGiuong === 'Đang thuê' ? '#b91c1c' : '#b45309')
                        }}>{trangThaiGiuong}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
              <button type="button" onClick={() => setShowModalChiTiet(false)} className="qt-btn-primary" style={{ padding: '10px 24px', borderRadius: '10px', fontWeight: '700' }}>Đóng lại</button>
            </div>
          </div>
        </div>
      )}
      {/* Toast popup thông báo */}
      {showToast && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px',
          background: '#0f172a', color: '#ffffff',
          padding: '16px 24px', borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
          display: 'flex', alignItems: 'center', gap: '12px',
          zIndex: 2000
        }}>
          <span className="material-symbols-outlined" style={{ color: '#22c55e', fontSize: '22px' }}>check_circle</span>
          <span style={{ fontSize: '14.5px', fontWeight: '600' }}>{toastMessage}</span>
        </div>
      )}
    </KhungNhanVien>
  );
}
