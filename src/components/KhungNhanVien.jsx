import ThanhMenuNhanVien from './ThanhMenuNhanVien';

export default function KhungNhanVien({ nguoiDung, dangXuat, children }) {
  return (
    <div className="qt-shell">
      <ThanhMenuNhanVien nguoiDung={nguoiDung} dangXuat={dangXuat} />
      <main className="qt-main">{children}</main>
    </div>
  );
}
