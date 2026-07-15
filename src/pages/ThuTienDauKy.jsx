import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import KhungNhanVien from '../components/KhungNhanVien';
import InitialPayment from '../components/InitialPayment';
import { ROUTES } from '../config/routes';

export default function ThuTienDauKy({ nguoiDung, dangXuat }) {
  const navigate = useNavigate();
  const { maHopDong } = useParams();
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

      <InitialPayment
        maHopDong={maHopDong ? Number(maHopDong) : null}
        chiTietThuTien
        nguoiDung={nguoiDung}
        hienThongBao={hienThongBao}
        onQuayLai={() => navigate(ROUTES.thuTienDauKy)}
        onXacNhanThanhCong={() => navigate(ROUTES.thuTienDauKy)}
      />
    </KhungNhanVien>
  );
}
