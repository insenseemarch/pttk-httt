import { useEffect, useState } from 'react';
import KhungNhanVien from '../components/KhungNhanVien';

function layChipHD(trangThai) {
  const map = { 'Hiệu lực': 'green', 'Thanh lý': 'gray', 'Hủy': 'red' };
  return map[trangThai] || 'gray';
}

export default function DanhSachHopDong({ nguoiDung, dangXuat }) {
  const [danhSach, setDanhSach] = useState([]);
  const [chiNhanh, setChiNhanh] = useState([]);
  const [soCanBao, setSoCanBao] = useState(0);
  const [dangTai, setDangTai] = useState(true);
  const [tong, setTong] = useState(0);
  const [boLoc, setBoLoc] = useState({ maCN: '', trangThai: '', thang: '', phong: '', page: 1, limit: 10 });

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

  return (
    <KhungNhanVien nguoiDung={nguoiDung} dangXuat={dangXuat}>
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
                  <tr key={hd.maHopDong}>
                    <td><strong>{hd.maHD}</strong></td>
                    <td>
                      <div>{hd.hoTen}</div>
                      <div className="sub">{hd.sdt}</div>
                    </td>
                    <td>{hd.phong}</td>
                    <td>{hd.ngayBatDau}</td>
                    <td style={{ color: hd.sapHetHan ? '#dc2626' : undefined }}>{hd.ngayHetHan}</td>
                    <td>{hd.tyLeHoanCoc}</td>
                    <td>
                      <span className={`qt-chip qt-chip--${layChipHD(hd.trangThai)}`}>{hd.trangThai}</span>
                    </td>
                    <td>
                      <button type="button" className="qt-btn-icon" title="Xem">
                        <span className="material-symbols-outlined">visibility</span>
                      </button>
                      <button type="button" className="qt-btn-icon" title="Sửa">
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="qt-pagination">
              <span>Hiển thị {danhSach.length} / {tong} hợp đồng</span>
              <div className="qt-pagination-btns">
                <button type="button" disabled={boLoc.page <= 1} onClick={() => setBoLoc((p) => ({ ...p, page: p.page - 1 }))}>Trước</button>
                <span>Trang {boLoc.page}</span>
                <button type="button" disabled={boLoc.page * boLoc.limit >= tong} onClick={() => setBoLoc((p) => ({ ...p, page: p.page + 1 }))}>Sau</button>
              </div>
            </div>
          </>
        )}
      </div>
    </KhungNhanVien>
  );
}
