import { useState } from 'react';

const TAI_SAN = [
  { id: 'giuong', ten: 'Giường ngủ' },
  { id: 'nem', ten: 'Nệm / đệm' },
  { id: 'tu', ten: 'Tủ quần áo' },
  { id: 'ban', ten: 'Bàn học / làm việc' },
  { id: 'den', ten: 'Đèn / thiết bị điện' },
];

const VE_SINH = [
  { id: 'san', ten: 'Sàn / tường sạch sẽ' },
  { id: 'wc', ten: 'Nhà vệ sinh đạt yêu cầu' },
  { id: 'rac', ten: 'Không còn rác / đồ cá nhân' },
  { id: 'khoa', ten: 'Đã thu hồi chìa khóa / thẻ ra vào' },
];

export default function ManagerRoomInspectForm({ selectedItem, onCancel, onSuccess, hienThongBao }) {
  const [taiSan, setTaiSan] = useState(
    Object.fromEntries(TAI_SAN.map((t) => [t.id, 'binh_thuong'])),
  );
  const [veSinh, setVeSinh] = useState(Object.fromEntries(VE_SINH.map((v) => [v.id, false])));
  const [coHuHong, setCoHuHong] = useState(false);
  const [moTaHuHong, setMoTaHuHong] = useState('');
  const [chiPhiHuHong, setChiPhiHuHong] = useState(0);
  const [ghiChu, setGhiChu] = useState('');
  const [dangGui, setDangGui] = useState(false);

  const guiKiemPhong = async (e) => {
    e.preventDefault();
    if (coHuHong && !moTaHuHong.trim()) {
      hienThongBao?.('error', 'Vui lòng mô tả hư hỏng khi đánh dấu có hư hỏng.');
      return;
    }
    const thieuVeSinh = VE_SINH.some((v) => !veSinh[v.id]);
    if (thieuVeSinh) {
      hienThongBao?.('error', 'Vui lòng xác nhận đủ các mục vệ sinh / thu hồi chìa khóa.');
      return;
    }

    setDangGui(true);
    try {
      const tomTatTaiSan = TAI_SAN.map((t) => `${t.ten}: ${taiSan[t.id]}`).join('; ');
      const tomTatVeSinh = VE_SINH.map((v) => `${v.ten}: ${veSinh[v.id] ? 'OK' : 'Chưa'}`).join('; ');
      const moTaTong = [
        `Tài sản — ${tomTatTaiSan}`,
        `Vệ sinh — ${tomTatVeSinh}`,
        coHuHong ? `Hư hỏng — ${moTaHuHong}` : 'Hư hỏng — Không',
        ghiChu ? `Ghi chú QL — ${ghiChu}` : '',
      ]
        .filter(Boolean)
        .join('\n');

      const res = await fetch('/api/checkout/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maChungTu: selectedItem.maSo || selectedItem.maChungTu,
          chiPhiHuHong: coHuHong ? Number(chiPhiHuHong) || 0 : 0,
          moTaHuHong: moTaTong,
          checklistSach: veSinh.san && veSinh.wc && veSinh.rac,
          checklistTaiSan: Object.values(taiSan).every((v) => v === 'binh_thuong' || v === 'hu_hong'),
          checklistChiaKhoa: veSinh.khoa,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Không lưu được biên bản kiểm phòng');
      onSuccess?.();
    } catch (err) {
      console.error(err);
      hienThongBao?.('error', err.message || 'Lỗi khi gửi kiểm phòng');
    } finally {
      setDangGui(false);
    }
  };

  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: '24px 20px 48px' }}>
      <button
        type="button"
        onClick={onCancel}
        style={{
          border: 'none',
          background: 'transparent',
          color: '#64748b',
          fontWeight: 700,
          cursor: 'pointer',
          marginBottom: 12,
          padding: 0,
        }}
      >
        ← Quay lại danh sách hợp đồng
      </button>

      <h1 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 800, color: '#0f172a' }}>
        Xử lý trả phòng — Kiểm tra hiện trạng
      </h1>
      <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: 14 }}>
        Quản lý đối chiếu hợp đồng và cập nhật tình trạng phòng/giường. Sau khi lưu, hệ thống chuyển thông tin sang kế toán.
      </p>

      {/* Thông tin HĐ */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: 14,
          padding: 18,
          marginBottom: 16,
        }}
      >
        {[
          ['Mã chứng từ', selectedItem.maSo || selectedItem.maHD],
          ['Khách thuê', selectedItem.tenKhachHang || selectedItem.hoTen],
          ['Phòng / CN', selectedItem.phongCoSo || selectedItem.phong],
          ['Kỳ hạn', selectedItem.kyHanThang ? `${selectedItem.kyHanThang} tháng` : '—'],
          ['Ngày BĐ', formatNgay(selectedItem.ngayBatDau)],
          ['Ngày KT', formatNgay(selectedItem.ngayKetThuc || selectedItem.ngayHetHan)],
        ].map(([k, v]) => (
          <div key={k}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>{k}</div>
            <div style={{ marginTop: 4, fontWeight: 700, color: '#0f172a' }}>{v || '—'}</div>
          </div>
        ))}
      </div>

      <form onSubmit={guiKiemPhong} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Tài sản */}
        <section style={cardStyle}>
          <h3 style={sectionTitle}>1. Hiện trạng tài sản</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {TAI_SAN.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  background: '#f8fafc',
                  borderRadius: 10,
                }}
              >
                <span style={{ fontWeight: 650, color: '#0f172a' }}>{item.ten}</span>
                <select
                  value={taiSan[item.id]}
                  onChange={(e) => setTaiSan((p) => ({ ...p, [item.id]: e.target.value }))}
                  style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0', minWidth: 140 }}
                >
                  <option value="binh_thuong">Bình thường</option>
                  <option value="hu_hong">Hư hỏng</option>
                  <option value="thieu">Thiếu / mất</option>
                </select>
              </div>
            ))}
          </div>
        </section>

        {/* Vệ sinh */}
        <section style={cardStyle}>
          <h3 style={sectionTitle}>2. Vệ sinh & bàn giao</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {VE_SINH.map((item) => (
              <label
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  background: '#f8fafc',
                  borderRadius: 10,
                  cursor: 'pointer',
                  fontWeight: 600,
                  color: '#0f172a',
                }}
              >
                <input
                  type="checkbox"
                  checked={!!veSinh[item.id]}
                  onChange={(e) => setVeSinh((p) => ({ ...p, [item.id]: e.target.checked }))}
                />
                {item.ten}
              </label>
            ))}
          </div>
        </section>

        {/* Hư hỏng */}
        <section style={cardStyle}>
          <h3 style={sectionTitle}>3. Hư hỏng (nếu có)</h3>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 650, marginBottom: 12 }}>
            <input type="checkbox" checked={coHuHong} onChange={(e) => setCoHuHong(e.target.checked)} />
            Có phát sinh hư hỏng cần khấu trừ
          </label>
          {coHuHong && (
            <div style={{ display: 'grid', gap: 12 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 650 }}>
                Mô tả hư hỏng
                <textarea
                  value={moTaHuHong}
                  onChange={(e) => setMoTaHuHong(e.target.value)}
                  rows={3}
                  required={coHuHong}
                  style={{ padding: 10, borderRadius: 10, border: '1px solid #e2e8f0', resize: 'vertical' }}
                  placeholder="Mô tả vị trí, mức độ hư hỏng..."
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 650 }}>
                Chi phí ước tính (VND)
                <input
                  type="number"
                  min={0}
                  value={chiPhiHuHong}
                  onChange={(e) => setChiPhiHuHong(e.target.value)}
                  style={{ padding: 10, borderRadius: 10, border: '1px solid #e2e8f0' }}
                />
              </label>
            </div>
          )}
        </section>

        <section style={cardStyle}>
          <h3 style={sectionTitle}>4. Ghi chú quản lý</h3>
          <textarea
            value={ghiChu}
            onChange={(e) => setGhiChu(e.target.value)}
            rows={2}
            style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #e2e8f0', resize: 'vertical' }}
            placeholder="Ghi chú thêm khi đối chiếu hợp đồng / nghĩa vụ khách thuê..."
          />
        </section>

        <div
          style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: 12,
            padding: '12px 14px',
            fontSize: 13,
            color: '#92400e',
            lineHeight: 1.5,
          }}
        >
          Sau khi xác nhận, trạng thái chuyển <strong>Chờ đối soát</strong> để kế toán tiếp nhận. Phòng/giường chỉ đánh
          dấu trống khi hoàn tất thanh lý (không trống ngay sau bước này).
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '12px 18px',
              borderRadius: 10,
              border: '1px solid #cbd5e1',
              background: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={dangGui}
            style={{
              padding: '12px 18px',
              borderRadius: 10,
              border: 'none',
              background: 'var(--primary-color, #ea580c)',
              color: '#fff',
              fontWeight: 750,
              cursor: dangGui ? 'wait' : 'pointer',
              opacity: dangGui ? 0.7 : 1,
            }}
          >
            {dangGui ? 'Đang lưu...' : 'Hoàn tất kiểm phòng → Chuyển kế toán'}
          </button>
        </div>
      </form>
    </div>
  );
}

const cardStyle = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 14,
  padding: 18,
};

const sectionTitle = {
  margin: '0 0 12px',
  fontSize: 15,
  fontWeight: 800,
  color: '#0f172a',
};

function formatNgay(v) {
  if (!v) return '—';
  if (typeof v === 'string' && v.includes('/')) return v;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString('vi-VN');
}
