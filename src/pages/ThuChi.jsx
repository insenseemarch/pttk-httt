import React, { useState } from 'react';
import KhungNhanVien from '../components/KhungNhanVien';
import CheckoutContainer from '../components/checkout/CheckoutContainer';

export default function ThuChi({ nguoiDung, dangXuat }) {
  const [thongBao, setThongBao] = useState({ show: false, type: '', message: '' });

  const hienThongBao = (type, message) => {
    setThongBao({ show: true, type, message });
    setTimeout(() => {
      setThongBao({ show: false, type: '', message: '' });
    }, 3000);
  };

  const rawRole = (nguoiDung?.vaiTro || '').toLowerCase();
  let normalizedRole = 'ketoan'; // default to ketoan on this page
  if (rawRole.includes('sale') || rawRole.includes('kinh doanh')) normalizedRole = 'sale';
  if (rawRole.includes('quản lý') || rawRole.includes('quan ly')) normalizedRole = 'quanly';
  if (rawRole.includes('kế toán') || rawRole.includes('ke toan')) normalizedRole = 'ketoan';
  if (rawRole.includes('admin') || rawRole.includes('quản trị')) normalizedRole = 'admin';

  return (
    <KhungNhanVien nguoiDung={nguoiDung} dangXuat={dangXuat}>
      {thongBao.show && (
        <div className={`toast-notification ${thongBao.type}`}>
          <span className="material-symbols-outlined">
            {thongBao.type === 'success' ? 'check_circle' : 'error'}
          </span>
          {thongBao.message}
        </div>
      )}
      <CheckoutContainer 
        hienThongBao={hienThongBao}
        setCheDoNhanVien={() => {}}
        chuyenTrang={() => {}}
        loggedRole={normalizedRole}
      />
    </KhungNhanVien>
  );
}
