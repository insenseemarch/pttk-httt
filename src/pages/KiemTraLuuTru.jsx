import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import KhungNhanVien from '../components/KhungNhanVien';
import StayConditionsCheck from '../components/StayConditionsCheck';
import { ROUTES } from '../config/routes';

export default function KiemTraLuuTru({ nguoiDung, dangXuat }) {
  const navigate = useNavigate();
  const { maHoSo } = useParams();
  const [toast, setToast] = useState(null);

  const hienThongBao = (kieu, tinNhan) => {
    setToast({ type: kieu === 'error' ? 'error' : 'success', message: tinNhan });
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <KhungNhanVien nguoiDung={nguoiDung} dangXuat={dangXuat}>
      {toast && (
        <div className={`np-toast np-toast--${toast.type}`}>{toast.message}</div>
      )}

      <StayConditionsCheck
        maHoSo={maHoSo}
        hienThongBao={hienThongBao}
        onQuayLai={() => navigate(ROUTES.kiemTraLuuTru)}
        onXacNhanThanhCong={() => {
          setTimeout(() => navigate(ROUTES.hopDong), 1500);
        }}
      />
    </KhungNhanVien>
  );
}
