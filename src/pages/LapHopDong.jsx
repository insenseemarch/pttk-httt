import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import KhungNhanVien from '../components/KhungNhanVien';
import ContractDrafting from '../components/ContractDrafting';
import { ROUTES } from '../config/routes';

export default function LapHopDong({ nguoiDung, dangXuat }) {
  const navigate = useNavigate();
  const { maDatCoc } = useParams();
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

      <ContractDrafting
        maHoSo={maDatCoc ? `PC-${maDatCoc}` : null}
        nguoiDung={nguoiDung}
        hienThongBao={hienThongBao}
        onQuayLai={() => navigate(ROUTES.lapHopDong)}
        onXacNhanThanhCong={() => {
          setTimeout(() => navigate(ROUTES.lapHopDong), 1500);
        }}
      />
    </KhungNhanVien>
  );
}
