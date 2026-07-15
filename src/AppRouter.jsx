import { useState } from 'react';

import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';

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
import QuyTrinhDatCoc from './pages/QuyTrinhDatCoc';
import DanhSachNhanPhong from './pages/DanhSachNhanPhong';
import ChiTietNhanPhong from './pages/ChiTietNhanPhong';
import DanhSachKiemTraLuuTru from './pages/DanhSachKiemTraLuuTru';
import KiemTraLuuTru from './pages/KiemTraLuuTru';
import DanhSachLapHopDong from './pages/DanhSachLapHopDong';
import LapHopDong from './pages/LapHopDong';
import DanhSachThuTienDauKy from './pages/DanhSachThuTienDauKy';
import ThuTienDauKy from './pages/ThuTienDauKy';
import DanhSachBanGiao from './pages/DanhSachBanGiao';
import ChiTietBanGiao from './pages/ChiTietBanGiao';

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

function laQuanLy(nguoiDung) {
  const r = (nguoiDung?.vaiTro || '').toLowerCase();
  return r.includes('quản lý') || r.includes('quan ly') || r === 'quanly';
}

/** Hợp đồng chỉ dành cho Sale — Quản lý dùng Kiểm tra trả phòng */
function TrangHopDongSale() {
  return (
    <TrangBaoVe>
      {({ nguoiDung, dangXuat }) => {
        if (laQuanLy(nguoiDung)) {
          return <Navigate to={ROUTES.dashboard} replace />;
        }
        return <DanhSachHopDong nguoiDung={nguoiDung} dangXuat={dangXuat} />;
      }}
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



function ChuyenHuongThuTienKyDauCu() {
  const { maHopDong } = useParams();
  return (
    <Navigate
      to={maHopDong ? `${ROUTES.thuTienDauKy}/${maHopDong}` : ROUTES.thuTienDauKy}
      replace
    />
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

      <Route path={ROUTES.hopDong} element={<TrangHopDongSale />} />
      <Route path={ROUTES.tiepNhanDangKyThue} element={<TrangTiepNhanDangKyThue />} />
      <Route path={ROUTES.lichHen} element={<TrangLichHen />} />
      <Route path={ROUTES.thuChi} element={taoTrangStaff(ThuChi)} />
      <Route path={ROUTES.nhanPhong} element={taoTrangStaff(DanhSachNhanPhong)} />
      <Route path={`${ROUTES.nhanPhong}/:maDatCoc`} element={taoTrangStaff(ChiTietNhanPhong)} />
      <Route path={ROUTES.kiemTraLuuTru} element={taoTrangStaff(DanhSachKiemTraLuuTru)} />
      <Route path={`${ROUTES.kiemTraLuuTru}/:maHoSo`} element={taoTrangStaff(KiemTraLuuTru)} />
      <Route path={ROUTES.lapHopDong} element={taoTrangStaff(DanhSachLapHopDong)} />
      <Route path={`${ROUTES.lapHopDong}/:maDatCoc`} element={taoTrangStaff(LapHopDong)} />
      <Route path={ROUTES.thongBao} element={taoTrangStaff(ThongBaoViecCanXuLy)} />

      <Route path={ROUTES.quanLyTaiKhoan} element={taoTrangStaff(QuanLyTaiKhoan)} />
      <Route path={ROUTES.checkout} element={taoTrangStaff(CheckoutPage)} />
      <Route path={ROUTES.thuTienDauKy} element={taoTrangStaff(DanhSachThuTienDauKy)} />
      <Route path={`${ROUTES.thuTienDauKy}/:maHopDong`} element={taoTrangStaff(ThuTienDauKy)} />
      <Route path="/thu-tien-dau-ky" element={<ChuyenHuongThuTienKyDauCu />} />
      <Route path="/thu-tien-dau-ky/:maHopDong" element={<ChuyenHuongThuTienKyDauCu />} />
      <Route path="/staff-payment" element={<ChuyenHuongThuTienKyDauCu />} />
      <Route path="/staff-payment/:maHopDong" element={<ChuyenHuongThuTienKyDauCu />} />
      <Route path={ROUTES.banGiao} element={taoTrangStaff(DanhSachBanGiao)} />
      <Route path={`${ROUTES.banGiao}/:maHopDong`} element={taoTrangStaff(ChiTietBanGiao)} />
      <Route path={ROUTES.deposit} element={taoTrangStaff(QuyTrinhDatCoc)} />

      <Route path="/*" element={<App />} />

    </Routes>

  );

}
