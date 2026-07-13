import React, { useState, useEffect } from 'react';
import StepTracker from './StepTracker';
import CheckoutList from './CheckoutList';
import CheckoutRequestForm from './CheckoutRequestForm';
import RoomInspectForm from './RoomInspectForm';
import FinancialReconcileForm from './FinancialReconcileForm';
import ReconcileConfirmForm from './ReconcileConfirmForm';
import ContractLiquidateForm from './ContractLiquidateForm';
import PayoutForm from './PayoutForm';
import ViewRequestDetails from './ViewRequestDetails';
import ViewContractDetails from './ViewContractDetails';
import { tinhTyLeHoanCoc } from '../../utils/tinhTyLeHoanCoc';

export default function xuLyTraPhong({ hienThongBao, setCheDoNhanVien, chuyenTrang, loggedRole }) {
  const [danhSachQuyetToan, setDanhSachQuyetToan] = useState([]);
  const [hoSoDangChon, setHoSoDangChon] = useState(null);
  const [buocHienTai, setBuocHienTai] = useState('list');
  const [tuKhoaTimKiem, setTuKhoaTimKiem] = useState('');

  const [formQuyetToan, setFormQuyetToan] = useState({
    loaiHinhTraPhong: 'dung_han',
    ngayTraDuKien: new Date().toISOString().split('T')[0],
    lyDo: '',
    phuongThucHoanTien: 'chuyen_khoan',
    chiPhiHuHong: 0,
    moTaHuHong: '',
    checklistSach: false,
    checklistTaiSan: false,
    checklistChiaKhoa: false,
    tiLeHoanCoc: 100,
    noThue: 0,
    noDienNuoc: 0,
    moTaKhauTru: '',
    inputMode: 'chuyen_khoan',
    bankName: 'Vietcombank',
    bankAcc: '',
    bankOwner: '',
    maGiaoDich: '',
    giaoDichDate: new Date().toISOString().split('T')[0],
    note: ''
  });

  const taiDanhSachQuyetToan = async () => {
    try {
      const response = await fetch('/api/checkout/list');
      const resData = await response.json();
      if (resData.ok) {
        setDanhSachQuyetToan(resData.data);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách trả phòng:', err);
    }
  };

  useEffect(() => {
    taiDanhSachQuyetToan();
  }, []);

  const chuanHoaTenChuTaiKhoan = (ten) => {
    if (!ten) return '';
    return ten
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toUpperCase();
  };

  const napFormTuChiTiet = (data) => {
    const tiLeKhuyenNghi = data.tiLeHoanCoc || tinhTyLeHoanCoc(data);

    setFormQuyetToan(prev => ({
      ...prev,
      loaiHinhTraPhong: data.loaiHinhTraPhong || (data.loai === 'dat_coc' ? 'huy_thue' : 'dung_han'),
      ngayTraDuKien: data.ngayTraDuKien || new Date().toISOString().split('T')[0],
      lyDo: data.lyDo || '',
      phuongThucHoanTien: data.phuongThucHoanTien || 'chuyen_khoan',
      chiPhiHuHong: data.chiPhiHuHong || 0,
      moTaHuHong: data.moTaHuHong || '',
      tiLeHoanCoc: tiLeKhuyenNghi,
      noThue: data.noThue || 0,
      noDienNuoc: data.noDienNuoc || 0,
      moTaKhauTru: data.moTaKhauTru || data.moTaHuHong || '',
      checklistSach: data.checklistSach || false,
      checklistTaiSan: data.checklistTaiSan || false,
      checklistChiaKhoa: data.checklistChiaKhoa || false,
      inputMode: data.phuongThucHoanTien || 'chuyen_khoan',
      bankOwner: chuanHoaTenChuTaiKhoan(data.tenKhachHang),
      bankAcc: data.soTaiKhoanNhan || '',
      bankName: data.nganHangNhan || 'Vietcombank',
      maGiaoDich: data.maGiaoDich || '',
      giaoDichDate: new Date().toISOString().split('T')[0],
      note: ''
    }));
  };

  const moChiTietQuyetToan = async (maSo, buocTiepTheo) => {
    try {
      const response = await fetch(`/api/checkout/detail?id=${encodeURIComponent(maSo)}`);
      const resData = await response.json();
      if (resData.ok) {
        setHoSoDangChon(resData.data);
        setBuocHienTai(buocTiepTheo);
        napFormTuChiTiet(resData.data);
      } else {
        hienThongBao('error', resData.error || 'Không tải được chi tiết đối soát!');
      }
    } catch (err) {
      console.error('Lỗi khi tải chi tiết đối soát:', err);
      hienThongBao('error', 'Không tải được chi tiết đối soát!');
    }
  };

  const xuLyThayDoiInput = (e) => {
    const { name, value } = e.target;
    setFormQuyetToan(prev => ({ ...prev, [name]: value }));
  };

  const xuLyThayDoiCheckbox = (e) => {
    const { name, checked } = e.target;
    setFormQuyetToan(prev => ({ ...prev, [name]: checked }));
  };

  const guiYeuCauTraPhong = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/checkout/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maSoChungTu: hoSoDangChon.maSo,
          loaiHinhTraPhong: formQuyetToan.loaiHinhTraPhong,
          ngayTraDuKien: formQuyetToan.ngayTraDuKien,
          lyDo: formQuyetToan.lyDo,
          phuongThucHoanTien: formQuyetToan.phuongThucHoanTien
        })
      });
      const resData = await response.json();
      if (resData.ok) {
        hienThongBao('success', 'Đã tiếp nhận yêu cầu trả phòng thành công!');
        taiDanhSachQuyetToan();
        setBuocHienTai('list');
      } else {
        hienThongBao('error', resData.error || 'Lỗi tiếp nhận yêu cầu!');
      }
    } catch (err) {
      hienThongBao('error', 'Lỗi tiếp nhận yêu cầu!');
    }
  };

  const guiKetQuaKiemPhong = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/checkout/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maChungTu: hoSoDangChon.maSo,
          chiPhiHuHong: 0,
          moTaHuHong: formQuyetToan.moTaHuHong,
          checklistSach: true,
          checklistTaiSan: true,
          checklistChiaKhoa: true,
        })
      });
      const resData = await response.json();
      if (resData.ok) {
        hienThongBao('success', 'Đã ghi nhận kết quả kiểm tra phòng thành công!');
        taiDanhSachQuyetToan();
        setBuocHienTai('list');
      } else {
        hienThongBao('error', resData.error || 'Lỗi kiểm tra phòng!');
      }
    } catch (err) {
      hienThongBao('error', 'Lỗi kiểm tra phòng!');
    }
  };

  const lapPhieuDoiSoat = async (e, danhSachKhauTruThem) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/checkout/reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maChungTu: hoSoDangChon.maSo,
          tiLeHoanCoc: formQuyetToan.tiLeHoanCoc,
          noThue: formQuyetToan.noThue,
          noDienNuoc: formQuyetToan.noDienNuoc,
          chiPhiHuHong: formQuyetToan.chiPhiHuHong,
          moTaKhauTru: formQuyetToan.moTaKhauTru,
          danhSachKhauTruKhac: danhSachKhauTruThem
        })
      });
      const resData = await response.json();
      if (resData.ok) {
        hienThongBao('success', 'Đã lưu và gửi phiếu đối soát cho Quản lý duyệt!');
        taiDanhSachQuyetToan();
        setBuocHienTai('list');
      } else {
        hienThongBao('error', resData.error || 'Lỗi lập phiếu đối soát!');
      }
    } catch (err) {
      hienThongBao('error', 'Lỗi lập phiếu đối soát!');
    }
  };

  const xacNhanDoiSoat = async (phanHoi, yKienTranhChap) => {
    try {
      const response = await fetch('/api/checkout/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maChungTu: hoSoDangChon.maSo,
          phanHoiKhach: phanHoi,
          yKienTranhChap: yKienTranhChap
        })
      });
      const resData = await response.json();
      if (resData.ok) {
        hienThongBao(
          'success',
          phanHoi === 'dong_y'
            ? 'Khách hàng đồng ý đối soát. Trạng thái chuyển sang bước tiếp theo!'
            : 'Đã ghi nhận tranh chấp, chuyển lại phòng Kế toán đối chiếu!'
        );
        taiDanhSachQuyetToan();
        setBuocHienTai('list');
      } else {
        hienThongBao('error', resData.error || 'Lỗi xác nhận đối soát!');
      }
    } catch (err) {
      hienThongBao('error', 'Lỗi xác nhận đối soát!');
    }
  };

  const kyBienBanThanhLy = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/checkout/liquidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maChungTu: hoSoDangChon.maSo })
      });
      const resData = await response.json();
      if (resData.ok) {
        hienThongBao('success', 'Đã ký biên bản thanh lý hợp đồng và bàn giao phòng thành công!');
        taiDanhSachQuyetToan();
        setBuocHienTai('list');
      } else {
        hienThongBao('error', resData.error || 'Lỗi thanh lý hợp đồng!');
      }
    } catch (err) {
      hienThongBao('error', 'Lỗi thanh lý hợp đồng!');
    }
  };

  const ghiNhanThanhToan = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/checkout/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maChungTu: hoSoDangChon.maSo,
          maGiaoDich: formQuyetToan.inputMode === 'tien_mat'
            ? `TIEN_MAT_${Date.now()}`
            : (formQuyetToan.maGiaoDich || `TXN-${Date.now()}`),
          soTaiKhoan: formQuyetToan.bankAcc,
          tenNguoiNhan: formQuyetToan.bankOwner,
          nganHang: formQuyetToan.bankName
        })
      });
      const resData = await response.json();
      if (resData.ok) {
        hienThongBao('success', 'Đã ghi nhận giao dịch hoàn tất! Đóng hồ sơ trả phòng.');
        taiDanhSachQuyetToan();
        setBuocHienTai('list');
      } else {
        hienThongBao('error', resData.error || 'Lỗi xác nhận giao dịch!');
      }
    } catch (err) {
      hienThongBao('error', 'Lỗi xác nhận giao dịch!');
    }
  };

  const layNhanBuoc = () => {
    const hoSo = hoSoDangChon;
    let nhanVaiCoBan = '';
    let tieuDeTrang = '';
    let moTaTrang = '';

    if (loggedRole === 'sale') {
      nhanVaiCoBan = 'Tiếp nhận trả phòng và Hủy cọc';
      tieuDeTrang = 'Tiếp nhận trả phòng và Hủy cọc';
      moTaTrang = 'Tiếp nhận thông tin đăng ký ngày trả phòng và yêu cầu hủy cọc từ khách hàng.';
    } else if (loggedRole === 'quanly') {
      nhanVaiCoBan = 'Kiểm phòng và Thanh lý hợp đồng';
      tieuDeTrang = 'Kiểm phòng và Thanh lý hợp đồng';
      moTaTrang = 'Quản lý quy trình kiểm tra phòng ngủ, thu hồi tài sản và ký biên bản thanh lý hợp đồng.';
    } else {
      nhanVaiCoBan = 'Đối soát và Hoàn cọc';
      tieuDeTrang = 'Đối soát và Hoàn cọc';
      moTaTrang = 'Thực hiện đối soát tài chính, khấu trừ dư nợ lưu trú và chi trả hoàn tiền cọc cho khách hàng.';
    }

    if (buocHienTai === 'list') {
      return {
        breadcrumbs: [
          { text: 'Nhân viên', action: () => { setCheDoNhanVien(true); chuyenTrang('staff_reception'); } },
          { text: nhanVaiCoBan, active: true }
        ],
        title: tieuDeTrang,
        subtitle: moTaTrang
      };
    }

    const laDatCoc = hoSo?.loai === 'dat_coc';
    let tenBuoc = '';
    let tieuDeBuoc = '';
    let moTaBuoc = '';

    switch (buocHienTai) {
      case 'create':
        tenBuoc = laDatCoc ? 'Đăng ký hủy cọc' : 'Đăng ký trả phòng';
        tieuDeBuoc = laDatCoc ? 'Đăng ký hủy giữ chỗ và rút tiền cọc' : 'Đăng ký trả phòng ngủ';
        moTaBuoc = `Tạo yêu cầu thanh lý cho khách hàng ${hoSo?.tenKhachHang || ''} (${hoSo?.maSo || ''})`;
        break;
      case 'inspect':
        tenBuoc = laDatCoc ? 'Xác nhận hủy cọc' : 'Kiểm tra hiện trạng phòng';
        tieuDeBuoc = laDatCoc ? 'Xác nhận hủy đặt cọc giữ chỗ' : 'Kiểm tra tình trạng thiết bị và nghiệm thu bàn giao';
        moTaBuoc = `Thực hiện kiểm tra tài sản thực tế cho phòng ngủ của ${hoSo?.tenKhachHang || ''} (${hoSo?.maSo || ''})`;
        break;
      case 'reconcile':
        tenBuoc = laDatCoc ? 'Lập phiếu đối soát cọc' : 'Lập phiếu đối soát';
        tieuDeBuoc = laDatCoc ? 'Lập phiếu đối soát hoàn tiền cọc giữ chỗ' : 'Lập phiếu đối soát';
        moTaBuoc = `Tính toán tỉ lệ hoàn cọc và khấu trừ chi phí phát sinh cho ${hoSo?.tenKhachHang || ''} (${hoSo?.maSo || ''})`;
        break;
      case 'confirm':
        tenBuoc = 'Xác nhận đối soát';
        tieuDeBuoc = 'Thống nhất phiếu đối soát tài chính';
        moTaBuoc = `Trao đổi và ghi nhận ý kiến đồng ý hoặc tranh chấp từ khách hàng ${hoSo?.tenKhachHang || ''} (${hoSo?.maSo || ''})`;
        break;
      case 'liquidate':
        tenBuoc = laDatCoc ? 'Thanh lý phiếu cọc' : 'Ký biên bản thanh lý';
        tieuDeBuoc = laDatCoc ? 'Ký biên bản hủy đặt cọc giữ chỗ' : 'Ký biên bản thanh lý hợp đồng thuê phòng ngủ';
        moTaBuoc = `Quản lý và khách hàng xác nhận hoàn tất nghĩa vụ bàn giao để thanh lý hợp đồng (${hoSo?.maSo || ''})`;
        break;
      case 'payout':
        tenBuoc = laDatCoc ? 'Chi trả tiền cọc' : 'Thanh toán hoàn cọc';
        tieuDeBuoc = laDatCoc ? 'Chi hoàn tiền cọc giữ chỗ' : 'Chi trả tiền cọc và quyết toán tài chính';
        moTaBuoc = `Thực hiện chuyển tiền hoàn cọc hoặc thu thêm nợ chênh lệch cho ${hoSo?.tenKhachHang || ''} (${hoSo?.maSo || ''})`;
        break;
      case 'view_request':
        tenBuoc = 'Xem phiếu yêu cầu';
        tieuDeBuoc = laDatCoc ? 'Hồ sơ quyết toán và thanh lý phiếu đặt cọc' : 'Hồ sơ quyết toán và thanh lý hợp đồng';
        moTaBuoc = `Xem lại toàn bộ thông tin quyết toán và tiến trình xử lý của ${hoSo?.tenKhachHang || ''} (${hoSo?.maSo || ''})`;
        break;
      case 'view_contract':
        tenBuoc = 'Xem hợp đồng gốc';
        tieuDeBuoc = laDatCoc ? 'Chi tiết phiếu đặt cọc giữ chỗ' : 'Chi tiết hợp đồng thuê phòng ngủ';
        moTaBuoc = `Xem lại điều khoản và thông tin bàn giao gốc của chứng từ (${hoSo?.maSo || ''})`;
        break;
      default:
        tenBuoc = '';
        tieuDeBuoc = tieuDeTrang;
        moTaBuoc = moTaTrang;
    }

    return {
      breadcrumbs: [
        { text: 'Nhân viên', action: () => { setCheDoNhanVien(true); chuyenTrang('staff_reception'); } },
        { text: nhanVaiCoBan, action: () => setBuocHienTai('list') },
        { text: tenBuoc, active: true }
      ],
      title: tieuDeBuoc,
      subtitle: moTaBuoc
    };
  };

  const { breadcrumbs, title, subtitle } = layNhanBuoc();

  return (
    <div className="staff-checkout-page" style={{ padding: '0 24px', maxWidth: '1200px', margin: '32px auto' }}>
      <div className="breadcrumbs" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b', marginBottom: '16px', fontWeight: '500' }}>
        {breadcrumbs.map((b, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <span style={{ color: '#cbd5e1' }}>/</span>}
            {b.active ? (
              <span style={{ color: '#0f172a', fontWeight: '600' }}>{b.text}</span>
            ) : (
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); b.action(); }}
                style={{ color: '#64748b', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseOver={(e) => { e.currentTarget.style.color = 'var(--primary-color)'; }}
                onMouseOut={(e) => { e.currentTarget.style.color = '#64748b'; }}
              >
                {b.text}
              </a>
            )}
          </React.Fragment>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '32px', borderBottom: '1px solid #e2e8f0', paddingBottom: '24px' }}>
        <div style={{ flex: '1', minWidth: '300px' }}>
          <h1 className="page-title" style={{ margin: 0, fontSize: '28px', fontWeight: '850', color: '#0f172a', letterSpacing: '-0.03em', lineHeight: '1.2' }}>
            {title}
          </h1>
          <p className="page-subtitle" style={{ margin: '8px 0 0 0', fontSize: '15px', color: '#64748b', fontWeight: '500', lineHeight: '1.5' }}>
            {subtitle}
          </p>
        </div>

        {buocHienTai !== 'list' && (
          <button
            type="button"
            onClick={() => setBuocHienTai('list')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 'auto',
              maxWidth: '180px',
              padding: '10px 20px',
              borderRadius: '10px',
              fontSize: '13.5px',
              fontWeight: '700',
              backgroundColor: '#ffffff',
              border: '1.5px solid var(--primary-color)',
              color: 'var(--primary-color)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 2px rgba(242,106,33,0.05)',
              marginTop: '4px'
            }}
          >
            Trở về danh sách
          </button>
        )}
      </div>

      {buocHienTai !== 'list' && hoSoDangChon && (
        <StepTracker
          currentStatus={hoSoDangChon.trangThai}
          currentStep={buocHienTai}
          loai={hoSoDangChon.loai}
          selectedItem={hoSoDangChon}
        />
      )}

      {buocHienTai === 'list' && (
        <CheckoutList
          danhSachQuyetToan={danhSachQuyetToan}
          checkoutSearch={tuKhoaTimKiem}
          setCheckoutSearch={setTuKhoaTimKiem}
          checkoutRole={loggedRole}
          setCheckoutRole={() => {}}
          onAction={moChiTietQuyetToan}
          taiDanhSachQuyetToan={taiDanhSachQuyetToan}
        />
      )}

      {buocHienTai === 'create' && hoSoDangChon && (
        <CheckoutRequestForm
          selectedItem={hoSoDangChon}
          formValues={formQuyetToan}
          onChange={xuLyThayDoiInput}
          onSubmit={guiYeuCauTraPhong}
          onCancel={() => setBuocHienTai('list')}
        />
      )}

      {buocHienTai === 'inspect' && hoSoDangChon && (
        <RoomInspectForm
          selectedItem={hoSoDangChon}
          formValues={formQuyetToan}
          onChange={xuLyThayDoiInput}
          onCheckboxChange={xuLyThayDoiCheckbox}
          onSubmit={guiKetQuaKiemPhong}
          onCancel={() => setBuocHienTai('list')}
        />
      )}

      {buocHienTai === 'reconcile' && hoSoDangChon && (
        <FinancialReconcileForm
          selectedItem={hoSoDangChon}
          formValues={formQuyetToan}
          onChange={xuLyThayDoiInput}
          setFormCheckout={setFormQuyetToan}
          onSubmit={lapPhieuDoiSoat}
          onCancel={() => setBuocHienTai('list')}
        />
      )}

      {buocHienTai === 'confirm' && hoSoDangChon && (
        <ReconcileConfirmForm
          selectedItem={hoSoDangChon}
          onConfirm={xacNhanDoiSoat}
        />
      )}

      {buocHienTai === 'liquidate' && hoSoDangChon && (
        <ContractLiquidateForm
          selectedItem={hoSoDangChon}
          onSubmit={kyBienBanThanhLy}
          onCancel={() => setBuocHienTai('list')}
        />
      )}

      {buocHienTai === 'payout' && hoSoDangChon && (
        <PayoutForm
          selectedItem={hoSoDangChon}
          formValues={formQuyetToan}
          onChange={xuLyThayDoiInput}
          onSubmit={ghiNhanThanhToan}
          onCancel={() => setBuocHienTai('list')}
        />
      )}

      {buocHienTai === 'view_request' && hoSoDangChon && (
        <ViewRequestDetails
          selectedItem={hoSoDangChon}
          onClose={() => setBuocHienTai('list')}
        />
      )}

      {buocHienTai === 'view_contract' && hoSoDangChon && (
        <ViewContractDetails
          selectedItem={hoSoDangChon}
          onClose={() => setBuocHienTai('list')}
        />
      )}
    </div>
  );
}
