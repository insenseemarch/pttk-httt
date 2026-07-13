import React, { useMemo, useState } from 'react';

export default function RoomInspectForm(props) {
  try {
    return <RoomInspectFormInner {...props} />;
  } catch (error) {
    return (
      <div style={{ padding: '32px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '16px', color: '#b91c1c', maxWidth: '700px', margin: '40px auto', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '800' }}>Lỗi hiển thị biểu mẫu kiểm phòng</h3>
        <p style={{ margin: '0 0 20px 0', fontSize: '14.5px', lineHeight: '1.6' }}>
          Đã xảy ra sự cố trong quá trình tính toán hoặc kết xuất giao diện nghiệm thu.
          <br />
          <strong style={{ color: '#ef4444' }}>Chi tiết lỗi: {error.stack || error.message}</strong>
        </p>
        <button
          type="button"
          className="btn-detail-outline"
          onClick={props.onCancel}
          style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }
}

const HANG_MUC = [
  { id: 'giuong', ten: 'Giường ngủ', banGiao: 'Bàn giao: Mới 100%' },
  { id: 'nem', ten: 'Nệm cao su', banGiao: 'Bàn giao: Mới 95%' },
  { id: 'tu', ten: 'Tủ quần áo', banGiao: 'Bàn giao: Mới 100%' },
];

const CHI_TIET_TRONG = () => ({ moTa: '', photoPreview: null, photoName: '' });

function RoomInspectFormInner({
  selectedItem,
  formValues,
  onChange,
  onCheckboxChange,
  onSubmit,
  onCancel,
}) {
  const isDatCoc = selectedItem?.loai === 'dat_coc';

  const ngayBatDauStr = selectedItem?.ngayBatDau;
  const ngayKetThucStr = selectedItem?.ngayKetThuc;
  const homNay = new Date();

  let timelineInfo = null;
  if (ngayBatDauStr && ngayKetThucStr && !isDatCoc) {
    const start = new Date(ngayBatDauStr);
    const end = new Date(ngayKetThucStr);

    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      const totalMonths =
        (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());

      let diffSpent = homNay - start;
      if (diffSpent < 0) diffSpent = 0;
      const spentDaysTotal = Math.floor(diffSpent / (1000 * 60 * 60 * 24 * 30));
      const spentMonths = Math.floor(spentDaysTotal);
      const spentDays = Math.floor(
        (diffSpent % (1000 * 60 * 60 * 24 * 30)) / (1000 * 60 * 60 * 24),
      );

      let diffLeft = end - homNay;
      if (diffLeft < 0) diffLeft = 0;
      const leftDaysTotal = Math.floor(diffLeft / (1000 * 60 * 60 * 24 * 30));
      const leftMonths = Math.floor(leftDaysTotal);
      const leftDays = Math.floor(
        (diffLeft % (1000 * 60 * 60 * 24 * 30)) / (1000 * 60 * 60 * 24),
      );

      const totalDays = Math.max(1, Math.floor((end - start) / (1000 * 60 * 60 * 24)));
      const spentDaysActual = Math.floor(diffSpent / (1000 * 60 * 60 * 24));
      const progressPercent = Math.min(
        100,
        Math.max(0, Math.floor((spentDaysActual / totalDays) * 100)),
      );

      timelineInfo = {
        totalMonths,
        spentStr: `${spentMonths} tháng ${spentDays} ngày`,
        leftStr: `${leftMonths} tháng ${leftDays} ngày`,
        progressPercent,
      };
    }
  }

  const [trangThai, setTrangThai] = useState({
    giuong: 'binh_thuong',
    nem: 'binh_thuong',
    tu: 'binh_thuong',
  });
  const [chiTietHuHong, setChiTietHuHong] = useState({
    giuong: CHI_TIET_TRONG(),
    nem: CHI_TIET_TRONG(),
    tu: CHI_TIET_TRONG(),
  });
  const [hangMucDangSua, setHangMucDangSua] = useState(null);

  const dongBoMoTaTong = (trangThaiMoi, chiTietMoi) => {
    if (!onChange) return;
    const parts = HANG_MUC.filter((h) => trangThaiMoi[h.id] === 'hu_hong').map((h) => {
      const ct = chiTietMoi[h.id];
      const anh = ct.photoName ? ` (ảnh: ${ct.photoName})` : '';
      return `[${h.ten}] ${ct.moTa || '(chưa mô tả)'}${anh}`;
    });
    onChange({
      target: { name: 'moTaHuHong', value: parts.join('\n') },
    });
  };

  const chonTrangThai = (id, value) => {
    setTrangThai((prev) => {
      const next = { ...prev, [id]: value };
      setChiTietHuHong((ctPrev) => {
        let ctNext = ctPrev;
        if (value === 'binh_thuong') {
          const oldUrl = ctPrev[id]?.photoPreview;
          if (oldUrl) URL.revokeObjectURL(oldUrl);
          ctNext = { ...ctPrev, [id]: CHI_TIET_TRONG() };
        }
        dongBoMoTaTong(next, ctNext);
        return ctNext;
      });

      if (value === 'hu_hong') {
        setHangMucDangSua(id);
      } else {
        setHangMucDangSua((cur) => {
          if (cur !== id) return cur;
          const conLai = HANG_MUC.find((h) => next[h.id] === 'hu_hong');
          return conLai?.id || null;
        });
      }
      return next;
    });
  };

  const capNhatMoTaHangMuc = (id, moTa) => {
    setChiTietHuHong((prev) => {
      const next = { ...prev, [id]: { ...prev[id], moTa } };
      dongBoMoTaTong(trangThai, next);
      return next;
    });
  };

  const capNhatAnhHangMuc = (id, file) => {
    if (!file) return;
    setChiTietHuHong((prev) => {
      const oldUrl = prev[id]?.photoPreview;
      if (oldUrl) URL.revokeObjectURL(oldUrl);
      const next = {
        ...prev,
        [id]: {
          ...prev[id],
          photoPreview: URL.createObjectURL(file),
          photoName: file.name,
        },
      };
      dongBoMoTaTong(trangThai, next);
      return next;
    });
  };

  const hasHuHong = Object.values(trangThai).some((v) => v === 'hu_hong');
  const hangMucHuHong = useMemo(
    () => HANG_MUC.filter((h) => trangThai[h.id] === 'hu_hong'),
    [trangThai],
  );
  const hangMucHienTai =
    hangMucDangSua && trangThai[hangMucDangSua] === 'hu_hong'
      ? hangMucDangSua
      : hangMucHuHong[0]?.id || null;
  const chiTietHienTai = hangMucHienTai ? chiTietHuHong[hangMucHienTai] : CHI_TIET_TRONG();
  const tenHangMucHienTai = HANG_MUC.find((h) => h.id === hangMucHienTai)?.ten || '';

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: isDatCoc ? '1fr' : '380px 1fr', gap: '24px' }}>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', background: isDatCoc ? '#fef3c7' : '#d1fae5', color: isDatCoc ? '#d97706' : '#065f46', padding: '4px 10px', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {isDatCoc ? 'Phiếu đặt cọc' : 'Đang hiệu lực'}
            </span>
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--primary-color)', margin: '0 0 20px 0', letterSpacing: '-0.02em' }}>
            {selectedItem.maSo}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>
                {isDatCoc ? 'Khách đặt cọc' : 'Khách thuê'}
              </span>
              <strong style={{ fontSize: '14.5px', color: '#0f172a' }}>{selectedItem.tenKhachHang}</strong>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>Phòng và chi nhánh</span>
              <strong style={{ fontSize: '14.5px', color: '#0f172a' }}>{selectedItem.phongCoSo}</strong>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>
                {isDatCoc ? 'Tiền đặt cọc ban đầu' : 'Giá thuê phòng'}
              </span>
              <strong style={{ fontSize: '14.5px', color: '#0f172a' }}>
                {isDatCoc
                  ? `${Number(selectedItem.tienCoc).toLocaleString('vi-VN')} đồng`
                  : `${Number(selectedItem.giaThue || 0).toLocaleString('vi-VN')} đồng/tháng`}
              </strong>
            </div>
          </div>
        </div>

        {!isDatCoc && timelineInfo && (
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                Lộ trình hợp đồng thuê
              </h3>
              <div style={{ position: 'relative', height: '8px', background: '#e2e8f0', borderRadius: '4px', margin: '24px 0 16px 0' }}>
                <div style={{ width: `${timelineInfo.progressPercent}%`, height: '100%', background: 'var(--primary-color)', borderRadius: '4px' }} />
                <div style={{ position: 'absolute', left: 0, top: '-4px', width: '16px', height: '16px', borderRadius: '50%', background: '#ffffff', border: '3px solid var(--primary-color)' }} />
                <div style={{ position: 'absolute', left: `${timelineInfo.progressPercent}%`, top: '-4px', width: '16px', height: '16px', borderRadius: '50%', background: '#ffffff', border: '3px solid var(--primary-color)', transform: 'translateX(-50%)' }} />
                <div style={{ position: 'absolute', right: 0, top: '-4px', width: '16px', height: '16px', borderRadius: '50%', background: '#ffffff', border: '3px solid #cbd5e1' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', fontWeight: '700', marginBottom: '20px' }}>
                <div>Ngày bắt đầu<br /><span style={{ color: '#0f172a', fontSize: '13px' }}>{selectedItem.ngayBatDau}</span></div>
                <div style={{ textAlign: 'center' }}>Hôm nay<br /><span style={{ color: 'var(--primary-color)', fontSize: '13px' }}>{homNay.toLocaleDateString('vi-VN')}</span></div>
                <div style={{ textAlign: 'right' }}>Ngày kết thúc<br /><span style={{ color: '#0f172a', fontSize: '13px' }}>{selectedItem.ngayKetThuc}</span></div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>Tổng thời hạn</span>
                <strong style={{ fontSize: '15px', color: '#0f172a' }}>{timelineInfo.totalMonths} tháng</strong>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>Thời gian đã ở</span>
                <strong style={{ fontSize: '15px', color: '#0f172a' }}>{timelineInfo.spentStr}</strong>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>Thời gian còn lại</span>
                <strong style={{ fontSize: '15px', color: '#0f172a' }}>{timelineInfo.leftStr}</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '32px', boxShadow: '0 6px 18px rgba(0,0,0,0.03)' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: '0 0 24px 0', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
          Phiếu kiểm nghiệm thực tế tài sản phòng ngủ
        </h3>

        {isDatCoc ? (
          <div style={{ background: '#f0fdf4', border: '1px solid #b7f4cf', padding: '18px 24px', borderRadius: '12px', fontSize: '14.5px', color: '#15803d', fontWeight: '600', marginBottom: '24px' }}>
            Khách hàng mới chỉ đặt cọc giữ chỗ và chưa dọn vào ở. Không có tài sản bàn giao thực tế cần nghiệm thu.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', marginBottom: '28px' }}>
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#334155', margin: '0 0 16px 0' }}>
                Hạng mục kiểm tra hiện trạng thiết bị:
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                {HANG_MUC.map((h) => {
                  const tt = trangThai[h.id];
                  const daCoMoTa =
                    !!chiTietHuHong[h.id]?.moTa || !!chiTietHuHong[h.id]?.photoPreview;
                  return (
                    <div
                      key={h.id}
                      style={{
                        border:
                          hangMucHienTai === h.id && tt === 'hu_hong'
                            ? '2px solid #f59e0b'
                            : '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '20px',
                        background: '#f8fafc',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: '140px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <strong style={{ fontSize: '14.5px', color: '#1e293b' }}>{h.ten}</strong>
                        <span style={{ fontSize: '10.5px', color: '#64748b', background: '#e2e8f0', padding: '2px 8px', borderRadius: '4px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                          {h.banGiao}
                        </span>
                      </div>
                      {tt === 'hu_hong' && daCoMoTa && (
                        <div style={{ fontSize: 11, color: '#b45309', fontWeight: 700, marginTop: 8 }}>
                          Đã lưu tạm mô tả/ảnh
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                        <label
                          style={{
                            flex: '1',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '13px',
                            fontWeight: '700',
                            padding: '9px 0',
                            border: `1.5px solid ${tt === 'binh_thuong' ? '#64748b' : '#cbd5e1'}`,
                            borderRadius: '8px',
                            cursor: 'pointer',
                            background: tt === 'binh_thuong' ? '#f1f5f9' : '#ffffff',
                            color: tt === 'binh_thuong' ? '#1e293b' : '#64748b',
                          }}
                        >
                          <input
                            type="radio"
                            name={h.id}
                            value="binh_thuong"
                            checked={tt === 'binh_thuong'}
                            onChange={() => chonTrangThai(h.id, 'binh_thuong')}
                            style={{ display: 'none' }}
                          />
                          Bình thường
                        </label>
                        <label
                          style={{
                            flex: '1',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '13px',
                            fontWeight: '700',
                            padding: '9px 0',
                            border: `1.5px solid ${tt === 'hu_hong' ? '#ef4444' : '#cbd5e1'}`,
                            borderRadius: '8px',
                            cursor: 'pointer',
                            background: tt === 'hu_hong' ? '#fef2f2' : '#ffffff',
                            color: tt === 'hu_hong' ? '#b91c1c' : '#64748b',
                          }}
                          onClick={() => {
                            if (tt === 'hu_hong') setHangMucDangSua(h.id);
                          }}
                        >
                          <input
                            type="radio"
                            name={h.id}
                            value="hu_hong"
                            checked={tt === 'hu_hong'}
                            onChange={() => chonTrangThai(h.id, 'hu_hong')}
                            style={{ display: 'none' }}
                          />
                          Hư hỏng
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {hasHuHong && hangMucHienTai && (
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '24px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#b45309', margin: 0 }}>
                    Khai báo chi tiết hư hại — {tenHangMucHienTai}
                  </h4>
                  {hangMucHuHong.length > 1 && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {hangMucHuHong.map((h) => (
                        <button
                          key={h.id}
                          type="button"
                          onClick={() => setHangMucDangSua(h.id)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 999,
                            border: hangMucHienTai === h.id ? 'none' : '1px solid #fcd34d',
                            background: hangMucHienTai === h.id ? '#b45309' : '#fff',
                            color: hangMucHienTai === h.id ? '#fff' : '#b45309',
                            fontWeight: 700,
                            fontSize: 12,
                            cursor: 'pointer',
                          }}
                        >
                          {h.ten}
                          {chiTietHuHong[h.id]?.moTa || chiTietHuHong[h.id]?.photoPreview
                            ? ' ✓'
                            : ''}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '700', color: '#b45309' }}>
                      Mô tả chi tiết tình trạng hư hỏng ({tenHangMucHienTai})
                    </label>
                    <textarea
                      key={`moTa-${hangMucHienTai}`}
                      rows="3"
                      value={chiTietHienTai.moTa || ''}
                      onChange={(e) => capNhatMoTaHangMuc(hangMucHienTai, e.target.value)}
                      placeholder={`Mô tả hư hỏng của ${tenHangMucHienTai.toLowerCase()}...`}
                      style={{
                        border: '1px solid #fcd34d',
                        padding: '12px 14px',
                        borderRadius: '8px',
                        fontSize: '13.5px',
                        outline: 'none',
                        fontFamily: 'inherit',
                        height: '112px',
                        resize: 'none',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '700', color: '#b45309' }}>
                      Hình ảnh minh chứng thực tế
                    </label>
                    <div
                      style={{
                        border: '1.5px dashed #fcd34d',
                        borderRadius: '8px',
                        padding: '10px',
                        textAlign: 'center',
                        backgroundColor: '#fffdf5',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flex: 1,
                        minHeight: '112px',
                        boxSizing: 'border-box',
                        gap: 8,
                      }}
                      onClick={() =>
                        document.getElementById(`photo-upload-${hangMucHienTai}`)?.click()
                      }
                    >
                      <input
                        key={`file-${hangMucHienTai}`}
                        type="file"
                        id={`photo-upload-${hangMucHienTai}`}
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) capNhatAnhHangMuc(hangMucHienTai, file);
                          e.target.value = '';
                        }}
                        style={{ display: 'none' }}
                      />
                      {chiTietHienTai.photoPreview ? (
                        <>
                          <img
                            src={chiTietHienTai.photoPreview}
                            alt="Minh chứng"
                            style={{
                              maxHeight: 72,
                              maxWidth: '100%',
                              borderRadius: 6,
                              objectFit: 'cover',
                            }}
                          />
                          <span style={{ fontSize: '12px', color: '#b45309', fontWeight: '700' }}>
                            {chiTietHienTai.photoName || 'Đã tải ảnh'} · bấm để đổi
                          </span>
                        </>
                      ) : (
                        <span style={{ fontSize: '12.5px', color: '#b45309', fontWeight: '700' }}>
                          Tải ảnh thực tế
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
          <button type="button" className="btn-detail-outline" onClick={onCancel} style={{ flex: '1', height: '48px', fontSize: '14.5px', fontWeight: '700', borderRadius: '10px' }}>
            Hủy bỏ
          </button>
          <button type="submit" className="submit-btn" style={{ flex: '2', height: '48px', fontSize: '14.5px', fontWeight: '700', borderRadius: '10px', backgroundColor: 'var(--primary-color)', borderColor: 'var(--primary-color)', boxShadow: '0 4px 12px rgba(242,106,33,0.15)' }}>
            Hoàn tất kiểm tra phòng và chuyển Kế toán
          </button>
        </div>
      </div>
    </form>
  );
}
