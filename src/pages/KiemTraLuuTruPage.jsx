import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import KhungNhanVien from '../components/KhungNhanVien';
import StayConditionsCheck from '../components/StayConditionsCheck';
import { ROUTES } from '../config/routes';

export default function KiemTraLuuTruPage({ nguoiDung, dangXuat }) {
  const navigate = useNavigate();
  const [thongBao, setThongBao] = useState(null);

  const hienThongBao = (kieu, tinNhan) => {
    setThongBao({ kieu, tinNhan });
    setTimeout(() => setThongBao(null), 3500);
  };

  return (
    <KhungNhanVien nguoiDung={nguoiDung} dangXuat={dangXuat}>
      <StayConditionsCheck
        hienThongBao={hienThongBao}
        onQuayLai={() => navigate(ROUTES.dashboard)}
        onXacNhanThanhCong={() => {
          hienThongBao('success', 'Kiểm tra lưu trú hoàn tất! Đang chuyển sang màn hình Hợp đồng...');
          setTimeout(() => navigate(ROUTES.hopDong), 2000);
        }}
      />

      {/* Thông báo Toast Pop-up */}
      {thongBao && (
        <div className={`toast ${thongBao.kieu}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'fixed', bottom: '24px', right: '24px', padding: '14px 20px', borderRadius: '10px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', color: 'white', background: thongBao.kieu === 'success' ? '#10b981' : thongBao.kieu === 'error' ? '#ef4444' : '#3b82f6', zIndex: 9999 }}>
          {thongBao.kieu === 'success' ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="white" viewBox="0 0 16 16">
              <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="white" viewBox="0 0 16 16">
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
              <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z" />
            </svg>
          )}
          <span style={{ fontWeight: '700', fontSize: '14px' }}>{thongBao.tinNhan}</span>
        </div>
      )}
    </KhungNhanVien>
  );
}
