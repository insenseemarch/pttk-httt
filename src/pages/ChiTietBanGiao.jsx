import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import KhungNhanVien from '../components/KhungNhanVien';
import AssetHandover from '../components/AssetHandover';
import { ROUTES } from '../config/routes';

export default function ChiTietBanGiao({ nguoiDung, dangXuat }) {
  const navigate = useNavigate();
  const { maHopDong } = useParams();
  const [toast, setToast] = useState(null);

  const hienThongBao = (kieu, tinNhan) => {
    setToast({ type: kieu === 'error' ? 'error' : 'success', message: tinNhan });
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <KhungNhanVien nguoiDung={nguoiDung} dangXuat={dangXuat}>
      {toast && (
        <div className={`np-toast np-toast--${toast.type}`}>{toast.message}</div>
      )}

      <AssetHandover
        maHopDong={maHopDong ? parseInt(maHopDong) : null}
        maQuanLy={nguoiDung?.maNV || null}
        tenQuanLy={nguoiDung?.hoTen || null}
        hienThongBao={hienThongBao}
        onQuayLai={() => navigate(ROUTES.banGiao)}
        onBanGiaoThanhCong={() => navigate(ROUTES.banGiao)}
      />
    </KhungNhanVien>
  );
}
