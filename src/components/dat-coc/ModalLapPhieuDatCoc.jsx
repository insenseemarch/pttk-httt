import React from 'react';

export default function ModalLapPhieuDatCoc({
  showCreate,
  editingSelection,
  createForm,
  setCreateForm,
  rooms,
  genderCompatibleRooms,
  overviewRooms,
  overviewRoomLimit,
  setOverviewRoomLimit,
  selectedCreateRoom,
  createError,
  setCreateError,
  busy,
  saveNewSelection,
  createDeposit,
  setShowCreate,
  money,
}) {
  if (!showCreate) return null;

  return (
    <div className="d-create-overlay" role="presentation" onMouseDown={() => { setShowCreate(false); setCreateError(''); }}>
      <div className={`d-create-dialog${editingSelection ? ' d-create-dialog--compact' : ''}`} role="dialog" aria-modal="true" aria-labelledby="d-create-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="d-create-header">
          <div>
            <small style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#f26a21', letterSpacing: '0.5px' }}>Nhân viên Sale</small>
            <h2 id="d-create-title" style={{ fontSize: '20px', fontWeight: '850', color: '#0f172a', margin: 0 }}>{editingSelection ? 'Đổi phòng và giường giữ chỗ' : 'Tạo phiếu đặt cọc mới'}</h2>
          </div>
          <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }} onClick={() => { setShowCreate(false); setCreateError(''); }}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="d-create-body">
        {editingSelection ? (
          /* Simple flow for editing selection */
          <div className="d-create-edit-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <label className="d-field-group">
              <span>Hình thức thuê phòng</span>
              <select
                value={createForm.loaiThue}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, loaiThue: event.target.value, maGiuongs: [] }))}
              >
                <option value="Thuê giường lẻ">Thuê giường lẻ</option>
                <option value="Thuê nguyên phòng">Thuê nguyên phòng</option>
              </select>
            </label>
            <label className="d-field-group">
              <span>Chọn phòng trống khả dụng</span>
              <select
                value={createForm.maPhong}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, maPhong: event.target.value, maGiuongs: [] }))}
              >
                <option value="">-- Chọn phòng --</option>
                {genderCompatibleRooms.map((item) => (
                  <option key={item.MaPhong} value={item.MaPhong}>
                    Phòng số {item.MaPhong} · {item.ChiNhanh?.TenCN} · Loại: {item.LoaiPhong} (Khả dụng {item.Giuong.filter(g => g.TinhTrang && !g.dangKhoa).length} giường)
                  </option>
                ))}
              </select>
            </label>
            
            {selectedCreateRoom && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: '750', color: '#475569' }}>Chọn giường cụ thể trong phòng:</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px', maxHeight: '160px', overflowY: 'auto', paddingRight: '4px' }}>
                  {selectedCreateRoom.Giuong.map((bed) => {
                    const disabled = !bed.TinhTrang || bed.dangKhoa;
                    const checked = createForm.maGiuongs.includes(bed.MaGiuong);
                    return (
                      <label
                        key={bed.MaGiuong}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '10px',
                          border: '1.5px solid',
                          borderColor: checked ? '#f26a21' : '#cbd5e1',
                          borderRadius: '12px',
                          cursor: disabled ? 'not-allowed' : 'pointer',
                          background: checked ? '#fff8f5' : disabled ? '#f1f5f9' : '#ffffff',
                          opacity: disabled ? 0.6 : 1,
                          gap: '6px'
                        }}
                      >
                        <input
                          type="checkbox"
                          disabled={disabled || (createForm.loaiThue === 'Thuê nguyên phòng' && !checked && createForm.maGiuongs.length > 0)}
                          checked={checked}
                          onChange={() => {
                            const allAvailable = selectedCreateRoom.Giuong.filter((item) => item.TinhTrang && !item.dangKhoa).map((item) => item.MaGiuong);
                            setCreateForm((prev) => ({
                              ...prev,
                              maGiuongs: prev.loaiThue === 'Thuê nguyên phòng'
                                ? allAvailable
                                : checked
                                  ? prev.maGiuongs.filter((id) => id !== bed.MaGiuong)
                                  : [...prev.maGiuongs, bed.MaGiuong]
                            }));
                          }}
                          style={{ display: 'none' }}
                        />
                        <span className="material-symbols-outlined" style={{ fontSize: '24px', color: checked ? '#f26a21' : '#64748b' }}>single_bed</span>
                        <strong style={{ fontSize: '13px', color: '#0f172a' }}>Giường {bed.MaGiuong}</strong>
                        <small style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>{disabled ? 'Đã khóa/đầy' : money(bed.GiaThue)}</small>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Two-column layout for full creation form */
          <div className="d-create-form-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.15fr)', gap: '28px' }}>
            {/* Column 1: Customer Profile Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h4 style={{ fontSize: '13.5px', fontWeight: '850', color: '#f26a21', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px 0' }}>Thông tin khách thuê</h4>
              
              <label className="d-field-group">
                <span>Số căn cước công dân (12 chữ số) <span style={{ color: 'red' }}>*</span></span>
                <input
                  type="text"
                  maxLength={12}
                  value={createForm.cccd}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, cccd: event.target.value.replace(/\D/g, '') }))}
                  placeholder="Nhập đúng 12 chữ số CCCD..."
                />
              </label>

              <label className="d-field-group">
                <span>Họ và tên khách thuê <span style={{ color: 'red' }}>*</span></span>
                <input
                  type="text"
                  value={createForm.hoTen}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, hoTen: event.target.value }))}
                  placeholder="Nhập họ và tên đầy đủ..."
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <label className="d-field-group">
                  <span>Số điện thoại <span style={{ color: 'red' }}>*</span></span>
                  <input
                    type="text"
                    value={createForm.sdt}
                    onChange={(event) => setCreateForm((prev) => ({ ...prev, sdt: event.target.value.replace(/\D/g, '') }))}
                    placeholder="Số điện thoại..."
                  />
                </label>

                <label className="d-field-group">
                  <span>Email liên lạc</span>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))}
                    placeholder="địa_chỉ@email.com..."
                  />
                </label>
              </div>

              <label className="d-field-group">
                <span>Địa chỉ thường trú</span>
                <input
                  type="text"
                  value={createForm.diaChi}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, diaChi: event.target.value }))}
                  placeholder="Thành phố, Quận/Huyện..."
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <label className="d-field-group">
                  <span>Giới tính <span style={{ color: 'red' }}>*</span></span>
                  <select
                    value={createForm.gioiTinh}
                    onChange={(event) => {
                      setCreateForm((prev) => ({ ...prev, gioiTinh: event.target.value, maPhong: '', maGiuongs: [] }));
                      setOverviewRoomLimit(10);
                    }}
                  >
                    <option value="">-- Chọn giới tính --</option>
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </label>

                <label className="d-field-group">
                  <span>Quốc tịch <span style={{ color: 'red' }}>*</span></span>
                  <input
                    type="text"
                    value={createForm.quocTich}
                    onChange={(event) => setCreateForm((prev) => ({ ...prev, quocTich: event.target.value }))}
                    placeholder="Việt Nam..."
                  />
                </label>
              </div>

              <label className="d-field-group">
                <span>Khả năng tài chính định kỳ (VNĐ/tháng)</span>
                <input
                  type="number"
                  value={createForm.khaNangTaiChinh}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, khaNangTaiChinh: event.target.value }))}
                  placeholder="Mức thu nhập hoặc khả năng chi trả..."
                />
              </label>
            </div>

            {/* Column 2: Room & Bed Selection */}
            <div className="d-create-room-column" style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderLeft: '1px solid #f1f5f9', paddingLeft: '20px' }}>
              <h4 style={{ fontSize: '13.5px', fontWeight: '850', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px 0' }}>Lựa chọn Phòng và Giường</h4>
              
              <label className="d-field-group">
                <span>Hình thức thuê phòng</span>
                <select
                  value={createForm.loaiThue}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, loaiThue: event.target.value, maGiuongs: [] }))}
                >
                  <option value="Thuê giường lẻ">Thuê giường lẻ</option>
                  <option value="Thuê nguyên phòng">Thuê nguyên phòng</option>
                </select>
              </label>

              <label className="d-field-group">
                <span>Thời hạn thuê mong muốn</span>
                <select
                  value={createForm.thoiHanThue}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, thoiHanThue: Number(event.target.value) }))}
                >
                  <option value={6}>6 tháng (Mặc định)</option>
                  <option value={7}>7 tháng</option>
                  <option value={8}>8 tháng</option>
                  <option value={9}>9 tháng</option>
                  <option value={10}>10 tháng</option>
                  <option value={11}>11 tháng</option>
                  <option value={12}>12 tháng</option>
                </select>
              </label>

              <label className="d-field-group">
                <span>Chọn phòng trống khả dụng</span>
                <select
                  value={createForm.maPhong}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, maPhong: event.target.value, maGiuongs: [] }))}
                >
                  <option value="">-- Chọn phòng --</option>
                  {genderCompatibleRooms.map((item) => (
                    <option key={item.MaPhong} value={item.MaPhong}>
                      Phòng số {item.MaPhong} · {item.ChiNhanh?.TenCN} · Loại: {item.LoaiPhong} (Khả dụng {item.Giuong.filter(g => g.TinhTrang && !g.dangKhoa).length} giường)
                    </option>
                  ))}
                </select>
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#475569' }}>Danh sách phòng và giường</span>
                  <small style={{ color: '#64748b', fontWeight: '650' }}>
                    Đang hiển thị {overviewRooms.length}/{genderCompatibleRooms.length} phòng phù hợp {createForm.gioiTinh ? `cho khách ${createForm.gioiTinh}` : ''}
                  </small>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '10px', padding: '4px 5px 8px 2px' }}>
                  {overviewRooms.map((item) => {
                    const isSelectedRoom = String(createForm.maPhong) === String(item.MaPhong);
                    const availableCount = item.Giuong.filter((bed) => bed.TinhTrang && !bed.dangKhoa).length;
                    return (
                      <button
                        type="button"
                        key={`room-overview-${item.MaPhong}`}
                        onClick={() => setCreateForm((prev) => ({ ...prev, maPhong: String(item.MaPhong), maGiuongs: [] }))}
                        style={{
                          border: `1.5px solid ${isSelectedRoom ? '#f26a21' : '#dbe3ee'}`,
                          borderRadius: '13px',
                          background: isSelectedRoom ? '#fff7ed' : '#ffffff',
                          padding: '12px',
                          textAlign: 'left',
                          cursor: 'pointer',
                          boxShadow: isSelectedRoom ? '0 0 0 3px rgba(242, 106, 33, 0.14)' : '0 3px 9px rgba(15, 23, 42, 0.04)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center' }}>
                          <strong style={{ color: '#0f172a', fontSize: '13px' }}>Phòng {item.MaPhong}</strong>
                          <span style={{ color: availableCount ? '#15803d' : '#b91c1c', background: availableCount ? '#f0fdf4' : '#fef2f2', borderRadius: '999px', padding: '3px 7px', fontSize: '9px', fontWeight: '850' }}>
                            {availableCount ? `${availableCount} trống` : 'Đã đầy'}
                          </span>
                        </div>
                        <small style={{ display: 'block', color: '#64748b', marginTop: '4px', lineHeight: 1.35 }}>{item.ChiNhanh?.TenCN || 'Chưa có chi nhánh'} · Phòng {item.GioiTinhYeuCau} · Loại: {item.LoaiPhong}</small>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '9px' }}>
                          {item.Giuong.map((bed) => {
                            const available = bed.TinhTrang && !bed.dangKhoa;
                            return (
                              <span
                                key={bed.MaGiuong}
                                title={`Giường ${bed.MaGiuong}: ${available ? 'Còn trống' : 'Đã khóa/đầy'}`}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: available ? '#15803d' : '#94a3b8', background: available ? '#f0fdf4' : '#f1f5f9', border: `1px solid ${available ? '#bbf7d0' : '#e2e8f0'}`, borderRadius: '7px', padding: '3px 5px', fontSize: '9px', fontWeight: '800' }}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>single_bed</span>
                                {bed.MaGiuong}
                              </span>
                            );
                          })}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {genderCompatibleRooms.length > 10 && (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', paddingTop: '2px' }}>
                    {overviewRoomLimit < genderCompatibleRooms.length && (
                      <button
                        type="button"
                        className="d-btn-outline"
                        onClick={() => setOverviewRoomLimit((current) => Math.min(current + 5, genderCompatibleRooms.length))}
                        style={{ padding: '8px 14px', fontSize: '12px' }}
                      >
                        Xem thêm {Math.min(5, genderCompatibleRooms.length - overviewRoomLimit)} phòng
                      </button>
                    )}
                    {overviewRoomLimit > 10 && (
                      <button
                        type="button"
                        className="d-btn-outline"
                        onClick={() => setOverviewRoomLimit(10)}
                        style={{ padding: '8px 14px', fontSize: '12px', color: '#64748b' }}
                      >
                        Thu gọn
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              {selectedCreateRoom && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '750', color: '#475569' }}>Chọn giường cụ thể trong phòng:</span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '8px', maxHeight: '210px', overflowY: 'auto', paddingRight: '4px' }}>
                    {selectedCreateRoom.Giuong.map((bed) => {
                      const disabled = !bed.TinhTrang || bed.dangKhoa;
                      const checked = createForm.maGiuongs.includes(bed.MaGiuong);
                      return (
                        <label
                          key={bed.MaGiuong}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '8px',
                            border: '1.5px solid',
                            borderColor: checked ? '#f26a21' : '#cbd5e1',
                            borderRadius: '12px',
                            cursor: disabled ? 'not-allowed' : 'pointer',
                            background: checked ? '#fff8f5' : disabled ? '#f1f5f9' : '#ffffff',
                            opacity: disabled ? 0.6 : 1,
                            gap: '4px'
                          }}
                        >
                          <input
                            type="checkbox"
                            disabled={disabled || (createForm.loaiThue === 'Thuê nguyên phòng' && !checked && createForm.maGiuongs.length > 0)}
                            checked={checked}
                            onChange={() => {
                              const allAvailable = selectedCreateRoom.Giuong.filter((item) => item.TinhTrang && !item.dangKhoa).map((item) => item.MaGiuong);
                              setCreateForm((prev) => ({
                                ...prev,
                                maGiuongs: prev.loaiThue === 'Thuê nguyên phòng'
                                  ? allAvailable
                                  : checked
                                    ? prev.maGiuongs.filter((id) => id !== bed.MaGiuong)
                                    : [...prev.maGiuongs, bed.MaGiuong]
                              }));
                            }}
                            style={{ display: 'none' }}
                          />
                          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: checked ? '#f26a21' : '#64748b' }}>single_bed</span>
                          <strong style={{ fontSize: '12px', color: '#0f172a' }}>Giường {bed.MaGiuong}</strong>
                          <small style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>{disabled ? 'Đã khóa' : money(bed.GiaThue)}</small>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        </div>

        <div className="d-create-footer">
          {createError && (
            <div className="d-inline-error d-inline-error--footer" role="alert">
              <span className="material-symbols-outlined">error</span>
              <span>{createError}</span>
            </div>
          )}
          <div className="d-create-footer-actions">
            <button type="button" className="d-btn-outline" onClick={() => { setShowCreate(false); setCreateError(''); }}>Hủy</button>
            <button
              type="button"
              className="d-btn-primary"
              disabled={busy}
              onClick={editingSelection ? saveNewSelection : createDeposit}
            >
              {busy ? 'Đang lưu...' : 'Xác nhận và Tạo phiếu'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
