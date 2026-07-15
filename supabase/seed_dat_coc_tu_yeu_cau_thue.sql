-- Dữ liệu mẫu cho luồng: nhập CCCD -> tự tải khách hàng, yêu cầu thuê và phòng đã chọn.
-- Chỉ dùng các bảng/cột đang có trong database, không thay đổi schema.

insert into public."KhachHang" (
  "CCCD", "HoTen", "NgaySinh", "GioiTinh", "QuocTich", "DiaChi",
  "SDT", "Email", "KhaNangTaiChinh", "ThoaDK"
)
values
  ('079203001234', 'Nguyễn Thị Minh Anh', '2003-04-18', 'Nữ', 'Việt Nam',
   '18 Nguyễn Thị Minh Khai, Quận 1, Thành phố Hồ Chí Minh', '0912345678',
   'minh.anh.datcoc@example.com', 15000000, true),
  ('079198005678', 'Trần Quốc Bảo', '1998-09-12', 'Nam', 'Việt Nam',
   '42 Lê Văn Sỹ, Quận 3, Thành phố Hồ Chí Minh', '0987654321',
   'quoc.bao.datcoc@example.com', 22000000, true)
on conflict ("CCCD") do update set
  "HoTen" = excluded."HoTen",
  "NgaySinh" = excluded."NgaySinh",
  "GioiTinh" = excluded."GioiTinh",
  "QuocTich" = excluded."QuocTich",
  "DiaChi" = excluded."DiaChi",
  "SDT" = excluded."SDT",
  "Email" = excluded."Email",
  "KhaNangTaiChinh" = excluded."KhaNangTaiChinh",
  "ThoaDK" = excluded."ThoaDK";

do $$
declare
  ma_sale bigint;
  ma_phong_nu bigint;
  ma_phong_nam bigint;
  ma_loai_phong_nu bigint;
  ma_loai_phong_nam bigint;
  ma_yc_giuong_le bigint;
  ma_yc_nguyen_phong bigint;
begin
  select "MaNV" into ma_sale
  from public."NhanVien"
  where lower("VaiTro") like '%sale%'
  order by "MaNV"
  limit 1;

  select p."MaPhong", p."LoaiPhong"
  into ma_phong_nu, ma_loai_phong_nu
  from public."Phong" p
  where p."GioiTinhYeuCau" = 'Nữ'
    and p."SucChuaToiDa" >= 2
    and exists (
      select 1 from public."Giuong" g
      where g."MaPhong" = p."MaPhong" and g."TinhTrang" = true
    )
  order by p."SucChuaToiDa", p."MaPhong"
  limit 1;

  select p."MaPhong", p."LoaiPhong"
  into ma_phong_nam, ma_loai_phong_nam
  from public."Phong" p
  where p."GioiTinhYeuCau" = 'Nam'
    and not exists (
      select 1 from public."Giuong" g
      where g."MaPhong" = p."MaPhong" and g."TinhTrang" = false
    )
  order by p."SucChuaToiDa", p."MaPhong"
  limit 1;

  if ma_phong_nu is null or ma_phong_nam is null then
    raise exception 'Không tìm thấy đủ phòng trống Nam/Nữ để tạo dữ liệu mẫu.';
  end if;

  if not exists (
    select 1 from public."YeuCauThue"
    where "CCCD" = '079203001234'
      and "YeuCau" = 'Dữ liệu mẫu: thuê hai giường gần nhau, khu vực yên tĩnh.'
  ) then
    insert into public."YeuCauThue" (
      "SoNguoiDuKien", "GioiTinh", "KhuVucMongMuon", "LoaiPhong", "LoaiThue",
      "NganSach", "ThoiGianVao", "ThoiGianThue", "YeuCau", "TrangThai",
      "NgayTao", "MaNV", "CCCD"
    ) values (
      2, 'Nữ', 'Thành phố Hồ Chí Minh', ma_loai_phong_nu, 'Thuê giường lẻ',
      9000000, now() + interval '10 days', now() + interval '6 months',
      'Dữ liệu mẫu: thuê hai giường gần nhau, khu vực yên tĩnh.', true,
      now(), ma_sale, '079203001234'
    ) returning "MaYC" into ma_yc_giuong_le;

    insert into public."LichXemPhong" ("NgayGioHen", "KetQua", "GhiChu", "MaYC", "MaPhong")
    values (now() + interval '3 days', 'Đã chọn phòng',
      'Khách đã xem và chọn phòng này để lập phiếu đặt cọc.', ma_yc_giuong_le, ma_phong_nu);
  end if;

  if not exists (
    select 1 from public."YeuCauThue"
    where "CCCD" = '079198005678'
      and "YeuCau" = 'Dữ liệu mẫu: thuê nguyên phòng, ưu tiên phòng thoáng.'
  ) then
    insert into public."YeuCauThue" (
      "SoNguoiDuKien", "GioiTinh", "KhuVucMongMuon", "LoaiPhong", "LoaiThue",
      "NganSach", "ThoiGianVao", "ThoiGianThue", "YeuCau", "TrangThai",
      "NgayTao", "MaNV", "CCCD"
    ) values (
      1, 'Nam', 'Thành phố Hồ Chí Minh', ma_loai_phong_nam, 'Thuê nguyên phòng',
      18000000, now() + interval '14 days', now() + interval '12 months',
      'Dữ liệu mẫu: thuê nguyên phòng, ưu tiên phòng thoáng.', true,
      now(), ma_sale, '079198005678'
    ) returning "MaYC" into ma_yc_nguyen_phong;

    insert into public."LichXemPhong" ("NgayGioHen", "KetQua", "GhiChu", "MaYC", "MaPhong")
    values (now() + interval '4 days', 'Đã chọn phòng',
      'Khách đã xem và chọn nguyên phòng này để lập phiếu đặt cọc.', ma_yc_nguyen_phong, ma_phong_nam);
  end if;
end $$;
