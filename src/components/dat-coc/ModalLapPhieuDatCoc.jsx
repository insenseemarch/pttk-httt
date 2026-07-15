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
  dangTaiHoSoTaoPhieu,
  thayDoiCCCDTaoPhieu,
  busy,
  saveNewSelection,
  createDeposit,
  setShowCreate,
  money,
}) {
  if (!showCreate) return null;
  const hoSoDaTai = Boolean(createForm.maYC && selectedCreateRoom);

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
              <span>Hình thức thuê từ yêu cầu thuê</span>
              <input type="text" value={createForm.loaiThue} readOnly />
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
          <div className="d-create-form-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.15fr)', gap: '28px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h4 style={{ fontSize: '13.5px', fontWeight: '850', color: '#f26a21', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px 0' }}>Thông tin khách thuê</h4>

              <label className="d-field-group">
                <span>Số căn cước công dân (12 chữ số) <span style={{ color: 'red' }}>*</span></span>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={12}
                  autoFocus
                  value={createForm.cccd}
                  onChange={(event) => thayDoiCCCDTaoPhieu(event.target.value)}
                  placeholder="Nhập CCCD để tự động tải thông tin..."
                />
              </label>

              {dangTaiHoSoTaoPhieu && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2563eb', background: '#eff6ff', borderRadius: '10px', padding: '10px 12px', fontSize: '12px', fontWeight: '700' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>progress_activity</span>
                  Đang tải thông tin khách hàng và yêu cầu thuê...
                </div>
              )}
              {!dangTaiHoSoTaoPhieu && hoSoDaTai && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#15803d', background: '#f0fdf4', borderRadius: '10px', padding: '10px 12px', fontSize: '12px', fontWeight: '700' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
                  Đã tải yêu cầu thuê #{createForm.maYC} và phòng khách đã chọn.
                </div>
              )}

              <label className="d-field-group">
                <span>Họ và tên khách thuê</span>
                <input type="text" value={createForm.hoTen} readOnly placeholder="Tự động điền theo CCCD" />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <label className="d-field-group">
                  <span>Số điện thoại</span>
                  <input type="text" value={createForm.sdt} readOnly placeholder="Tự động điền" />
                </label>
                <label className="d-field-group">
                  <span>Email liên lạc</span>
                  <input type="email" value={createForm.email} readOnly placeholder="Tự động điền" />
                </label>
              </div>

              <label className="d-field-group">
                <span>Địa chỉ thường trú</span>
                <input type="text" value={createForm.diaChi} readOnly placeholder="Tự động điền" />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <label className="d-field-group">
                  <span>Giới tính</span>
                  <input type="text" value={createForm.gioiTinh} readOnly placeholder="Tự động điền" />
                </label>
                <label className="d-field-group">
                  <span>Quốc tịch</span>
                  <input type="text" value={createForm.quocTich} readOnly placeholder="Tự động điền" />
                </label>
              </div>

              <label className="d-field-group">
                <span>Khả năng tài chính định kỳ (VNĐ/tháng)</span>
                <input type="text" value={createForm.khaNangTaiChinh ? money(createForm.khaNangTaiChinh) : ''} readOnly placeholder="Tự động điền" />
              </label>
            </div>

            <div className="d-create-room-column" style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderLeft: '1px solid #f1f5f9', paddingLeft: '20px' }}>
              <h4 style={{ fontSize: '13.5px', fontWeight: '850', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px 0' }}>Phòng và giường theo yêu cầu thuê</h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label className="d-field-group">
                  <span>Hình thức thuê</span>
                  <input type="text" value={createForm.loaiThue} readOnly placeholder="Tự động điền" />
                </label>
                <label className="d-field-group">
                  <span>Loại phòng</span>
                  <input type="text" value={createForm.tenLoaiPhong} readOnly placeholder="Tự động điền" />
                </label>
                <label className="d-field-group">
                  <span>Số người dự kiến</span>
                  <input type="text" value={createForm.soNguoiDuKien || ''} readOnly placeholder="Tự động điền" />
                </label>
                <label className="d-field-group">
                  <span>Thời hạn thuê</span>
                  <input type="text" value={hoSoDaTai ? `${createForm.thoiHanThue} tháng` : ''} readOnly placeholder="Tự động điền" />
                </label>
              </div>

              {selectedCreateRoom ? (
                <div className="d-room-card" style={{ borderColor: '#fdba74', background: '#fff7ed' }}>
                  <span className="material-symbols-outlined">meeting_room</span>
                  <div style={{ flex: 1 }}>
                    <strong>Phòng {selectedCreateRoom.MaPhong}</strong>
                    <p>{selectedCreateRoom.ChiNhanh?.TenCN || 'Chưa có chi nhánh'} · {createForm.tenLoaiPhong} · Phòng {selectedCreateRoom.GioiTinhYeuCau}</p>
                    <p>{selectedCreateRoom.Giuong.filter((bed) => bed.TinhTrang && !bed.dangKhoa).length} giường đang khả dụng · {money(selectedCreateRoom.GiaThue)}/tháng</p>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: '850', color: '#c2410c', background: '#ffedd5', borderRadius: '999px', padding: '5px 9px', whiteSpace: 'nowrap' }}>Giường khách chọn</span>
                </div>
              ) : (
                <div style={{ border: '1.5px dashed #cbd5e1', borderRadius: '12px', padding: '22px', textAlign: 'center', color: '#64748b', fontSize: '12px', fontWeight: '650' }}>
                  Nhập đủ 12 chữ số CCCD để hiển thị phòng khách đã chọn.
                </div>
              )}

              {selectedCreateRoom && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginTop: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#475569' }}>
                      {createForm.loaiThue === 'Thuê nguyên phòng' ? 'Tất cả giường trong phòng' : 'Chọn giường cho khách'}
                    </span>
                    <small style={{ color: '#64748b', fontWeight: '700' }}>
                      Đã chọn {createForm.maGiuongs.length}
                      {createForm.loaiThue === 'Thuê giường lẻ' ? ` · tối thiểu ${createForm.soNguoiDuKien}` : ' · hệ thống tự chọn tất cả'}
                    </small>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '8px', maxHeight: '230px', overflowY: 'auto', paddingRight: '4px' }}>
                    {selectedCreateRoom.Giuong.map((bed) => {
                      const unavailable = !bed.TinhTrang || bed.dangKhoa;
                      const wholeRoom = createForm.loaiThue === 'Thuê nguyên phòng';
                      const disabled = unavailable || wholeRoom;
                      const checked = createForm.maGiuongs.includes(Number(bed.MaGiuong));
                      return (
                        <label
                          key={bed.MaGiuong}
                          title={wholeRoom ? 'Thuê nguyên phòng: hệ thống tự động chọn tất cả giường' : unavailable ? 'Giường không còn khả dụng' : 'Nhấn để chọn hoặc bỏ chọn giường'}
                          style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            padding: '9px', border: '1.5px solid', borderColor: checked ? '#f26a21' : '#cbd5e1',
                            borderRadius: '12px', cursor: disabled ? 'default' : 'pointer',
                            background: checked ? '#fff8f5' : unavailable ? '#f1f5f9' : '#ffffff',
                            opacity: unavailable ? 0.55 : 1, gap: '4px',
                          }}
                        >
                          <input
                            type="checkbox"
                            disabled={disabled}
                            checked={checked}
                            onChange={() => setCreateForm((current) => {
                              const bedId = Number(bed.MaGiuong);
                              const isSelected = current.maGiuongs.includes(bedId);
                              const minimum = Number(current.soNguoiDuKien || 1);
                              if (isSelected && current.maGiuongs.length <= minimum) return current;
                              return {
                                ...current,
                                maGiuongs: isSelected
                                  ? current.maGiuongs.filter((id) => Number(id) !== bedId)
                                  : [...current.maGiuongs, bedId],
                              };
                            })}
                            style={{ display: 'none' }}
                          />
                          <span className="material-symbols-outlined" style={{ fontSize: '21px', color: checked ? '#f26a21' : '#64748b' }}>single_bed</span>
                          <strong style={{ fontSize: '12px', color: '#0f172a' }}>Giường {bed.MaGiuong}</strong>
                          <small style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>{unavailable ? 'Đã khóa' : money(bed.GiaThue)}</small>
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
              disabled={busy || (!editingSelection && (dangTaiHoSoTaoPhieu || !hoSoDaTai))}
              onClick={editingSelection ? saveNewSelection : createDeposit}
            >
              {busy ? 'Đang lưu...' : dangTaiHoSoTaoPhieu ? 'Đang tải hồ sơ...' : 'Xác nhận và Tạo phiếu'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
