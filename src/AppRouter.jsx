import { useState } from 'react';

import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';

import App from './App';

import DangNhap from './pages/DangNhap';

import QuenMatKhau from './pages/QuenMatKhau';

import Dashboard from './pages/Dashboard';

import DanhSachPhongGiuong from './pages/DanhSachPhongGiuong';

import DanhSachKhachHang from './pages/DanhSachKhachHang';

import DanhSachHopDong from './pages/DanhSachHopDong';

import QuanLyTaiKhoan from './pages/QuanLyTaiKhoan';

import ThongBaoViecCanXuLy from './pages/ThongBaoViecCanXuLy';
import ThuChi from './pages/ThuChi';
import CheckoutPage from './pages/CheckoutPage';
import InitialPayment from './components/InitialPayment';
import QuyTrinhDatCoc from './pages/QuyTrinhDatCoc';
import DanhSachNhanPhong from './pages/DanhSachNhanPhong';
import ChiTietNhanPhong from './pages/ChiTietNhanPhong';
import DanhSachKiemTraLuuTru from './pages/DanhSachKiemTraLuuTru';
import KiemTraLuuTru from './pages/KiemTraLuuTru';

import { KHOA_NGUOI_DUNG, ROUTES } from './config/routes';



function docNguoiDungTuLocal() {

  try {

    const luu = localStorage.getItem(KHOA_NGUOI_DUNG);

    return luu ? JSON.parse(luu) : null;

  } catch {

    return null;

  }

}



function TrangBaoVe({ children }) {

  const navigate = useNavigate();

  const location = useLocation();

  const [nguoiDung, setNguoiDung] = useState(docNguoiDungTuLocal);



  if (!nguoiDung) {

    return <Navigate to={ROUTES.dangNhap} replace state={{ tu: location.pathname }} />;

  }



  const xuLyDangXuat = () => {

    localStorage.removeItem(KHOA_NGUOI_DUNG);

    setNguoiDung(null);

    navigate(ROUTES.trangChu, { replace: true });

  };



  return children({ nguoiDung, dangXuat: xuLyDangXuat });

}



function TrangDangNhap() {

  const navigate = useNavigate();

  const location = useLocation();

  const nguoiDung = docNguoiDungTuLocal();



  if (nguoiDung) {

    return <Navigate to={ROUTES.dashboard} replace />;

  }



  const xuLyDangNhapThanhCong = (data) => {

    localStorage.setItem(KHOA_NGUOI_DUNG, JSON.stringify(data));

    const quayLai = location.state?.tu || ROUTES.dashboard;

    navigate(quayLai, { replace: true });

  };



  return (

    <DangNhap

      onDangNhapThanhCong={xuLyDangNhapThanhCong}

      chuyenQuenMatKhau={() => navigate(ROUTES.quenMatKhau)}

    />

  );

}



function TrangQuenMatKhau() {

  const navigate = useNavigate();

  return <QuenMatKhau quayLaiDangNhap={() => navigate(ROUTES.dangNhap)} />;

}



function taoTrangStaff(Component) {

  return (

    <TrangBaoVe>

      {({ nguoiDung, dangXuat }) => <Component nguoiDung={nguoiDung} dangXuat={dangXuat} />}

    </TrangBaoVe>

  );

}



export default function AppRouter() {

  return (

    <Routes>

      <Route path={ROUTES.dangNhap} element={<TrangDangNhap />} />

      <Route path={ROUTES.quenMatKhau} element={<TrangQuenMatKhau />} />

      <Route path={ROUTES.dashboard} element={taoTrangStaff(Dashboard)} />

      <Route path={ROUTES.phongGiuong} element={taoTrangStaff(DanhSachPhongGiuong)} />

      <Route path={ROUTES.khachHang} element={taoTrangStaff(DanhSachKhachHang)} />

      <Route path={ROUTES.hopDong} element={taoTrangStaff(DanhSachHopDong)} />
      <Route path={ROUTES.thuChi} element={taoTrangStaff(ThuChi)} />
      <Route path={ROUTES.nhanPhong} element={taoTrangStaff(DanhSachNhanPhong)} />
      <Route path={`${ROUTES.nhanPhong}/:maDatCoc`} element={taoTrangStaff(ChiTietNhanPhong)} />
      <Route path={ROUTES.kiemTraLuuTru} element={taoTrangStaff(DanhSachKiemTraLuuTru)} />
      <Route path={`${ROUTES.kiemTraLuuTru}/:maHoSo`} element={taoTrangStaff(KiemTraLuuTru)} />
      <Route path={ROUTES.thongBao} element={taoTrangStaff(ThongBaoViecCanXuLy)} />

      <Route path={ROUTES.quanLyTaiKhoan} element={taoTrangStaff(QuanLyTaiKhoan)} />
      <Route path={ROUTES.checkout} element={taoTrangStaff(CheckoutPage)} />
      <Route path="/staff-payment" element={taoTrangStaff(InitialPayment)} />
      <Route path={ROUTES.deposit} element={taoTrangStaff(QuyTrinhDatCoc)} />

      <Route path="/*" element={<App />} />

    </Routes>

  );

}
