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

import { ROUTES } from './config/routes';
import {
  chuanHoaVaiTroNhanVien,
  docNguoiDungDangNhap,
  luuNguoiDungDangNhap,
  xoaNguoiDungDangNhap,
} from './utils/nhanVienSession';


function layTrangMacDinhSauDangNhap(nguoiDung) {

  const vaiTro = chuanHoaVaiTroNhanVien(nguoiDung?.vaiTro);

  if (vaiTro === 'sale') {

    return ROUTES.tiepNhanDangKyThue;

  }

  return ROUTES.dashboard;

}



function TrangBaoVe({ children }) {

  const navigate = useNavigate();

  const location = useLocation();

  const [nguoiDung, setNguoiDung] = useState(docNguoiDungDangNhap);



  if (!nguoiDung) {

    return <Navigate to={ROUTES.dangNhap} replace state={{ tu: location.pathname }} />;

  }



  const xuLyDangXuat = () => {

    xoaNguoiDungDangNhap();

    setNguoiDung(null);

    navigate(ROUTES.trangChu, { replace: true });

  };



  return children({ nguoiDung, dangXuat: xuLyDangXuat });

}



function TrangDangNhap() {

  const navigate = useNavigate();

  const location = useLocation();

  const nguoiDung = docNguoiDungDangNhap();



  if (nguoiDung) {

    return <Navigate to={layTrangMacDinhSauDangNhap(nguoiDung)} replace />;

  }



  const xuLyDangNhapThanhCong = (data) => {

    luuNguoiDungDangNhap(data);

    const quayLai = location.state?.tu || layTrangMacDinhSauDangNhap(data);

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


function TrangPhongGiuong() {

  return (

    <TrangBaoVe>

      {({ nguoiDung, dangXuat }) => (
        ['sale', 'quanly'].includes(chuanHoaVaiTroNhanVien(nguoiDung?.vaiTro)) ? (
          <App
            manHinhKhoiTao="search_vacancy"
            batDauCheDoNhanVien
            nguoiDungDangNhap={nguoiDung}
            dangXuatDangNhap={dangXuat}
          />
        ) : (
          <DanhSachPhongGiuong nguoiDung={nguoiDung} dangXuat={dangXuat} />
        )
      )}

    </TrangBaoVe>

  );

}


function TrangSoDoPhong() {

  return (

    <TrangBaoVe>

      {({ nguoiDung, dangXuat }) => (
        <DanhSachPhongGiuong nguoiDung={nguoiDung} dangXuat={dangXuat} />
      )}

    </TrangBaoVe>

  );

}


function TrangTiepNhanDangKyThue() {

  return (

    <TrangBaoVe>

      {({ nguoiDung, dangXuat }) => (
        chuanHoaVaiTroNhanVien(nguoiDung?.vaiTro) === 'sale' ? (
          <App
            manHinhKhoiTao="staff_reception"
            batDauCheDoNhanVien
            nguoiDungDangNhap={nguoiDung}
            dangXuatDangNhap={dangXuat}
          />
        ) : (
          <Navigate to={ROUTES.phongGiuong} replace />
        )
      )}

    </TrangBaoVe>

  );

}


function TrangLichHen() {

  return (

    <TrangBaoVe>

      {({ nguoiDung, dangXuat }) => (
        chuanHoaVaiTroNhanVien(nguoiDung?.vaiTro) === 'sale' ? (
          <App
            manHinhKhoiTao="staff_contracts"
            batDauCheDoNhanVien
            nguoiDungDangNhap={nguoiDung}
            dangXuatDangNhap={dangXuat}
          />
        ) : (
          <Navigate to={ROUTES.phongGiuong} replace />
        )
      )}

    </TrangBaoVe>

  );

}



export default function AppRouter() {

  return (

    <Routes>

      <Route path={ROUTES.dangNhap} element={<TrangDangNhap />} />

      <Route path={ROUTES.quenMatKhau} element={<TrangQuenMatKhau />} />

      <Route path={ROUTES.dashboard} element={taoTrangStaff(Dashboard)} />

      <Route path={ROUTES.phongGiuong} element={<TrangPhongGiuong />} />
      <Route path={ROUTES.soDoPhong} element={<TrangSoDoPhong />} />

      <Route path={ROUTES.khachHang} element={taoTrangStaff(DanhSachKhachHang)} />

      <Route path={ROUTES.hopDong} element={taoTrangStaff(DanhSachHopDong)} />
      <Route path={ROUTES.tiepNhanDangKyThue} element={<TrangTiepNhanDangKyThue />} />
      <Route path={ROUTES.lichHen} element={<TrangLichHen />} />
      <Route path={ROUTES.thuChi} element={taoTrangStaff(ThuChi)} />
      <Route path={ROUTES.thongBao} element={taoTrangStaff(ThongBaoViecCanXuLy)} />

      <Route path={ROUTES.quanLyTaiKhoan} element={taoTrangStaff(QuanLyTaiKhoan)} />

      <Route path="/*" element={<App />} />

    </Routes>

  );

}

