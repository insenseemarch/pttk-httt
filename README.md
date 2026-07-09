# pttk-httt

Hệ thống quản lý Homestay / Ký túc xá dịch vụ. Dự án bao gồm Frontend (React + Vite) và Backend (Node.js + Express).

## Hướng dẫn cài đặt & khởi chạy nhanh

### 1) Cài đặt thư viện (Dependencies)
Chạy lệnh này tại thư mục gốc của dự án:
```bash
npm install
```

### 2) Cấu hình biến môi trường
Tạo file `.env` tại thư mục gốc của dự án với các thông số mẫu:
```env
VITE_SUPABASE_URL=https://xpbpxgxwsvyvwyzcwziu.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_VxWkAzPHIf5MmIHLRUVT_w_bpwfO43F
SUPABASE_URL=https://xpbpxgxwsvyvwyzcwziu.supabase.co
SUPABASE_ANON_KEY=sb_publishable_VxWkAzPHIf5MmIHLRUVT_w_bpwfO43F
SUPABASE_SERVICE_ROLE_KEY=sb_secret_AZzCHqLyZ2g8CQlBZKrVCQ_IeBIU8R-
PORT=3001
VITE_API_URL=http://localhost:3001
```

### 3) Khởi chạy dự án (Chạy song song Client & Server)
```bash
npm run dev
```

- **Frontend (Vite):** Khởi chạy tại `http://localhost:5173`
- **Backend (Express):** Khởi chạy tại `http://localhost:3001`

---

## Danh sách tài liệu API chi tiết (Mock endpoints)

Tất cả các API dưới đây chạy trên Backend cổng **`3001`** (hoặc proxy thông qua cổng `5173` của client với tiền tố `/api`).

### 1) Phân hệ 3.1: Kiểm tra điều kiện lưu trú (Stay Check)

- **Lấy dữ liệu đặt cọc & danh sách thành viên:**
```http
GET http://localhost:3001/api/kiem-tra-luu-tru/DEP-2023-8942
```

- **Xác nhận kết quả kiểm tra:**
```http
POST http://localhost:3001/api/kiem-tra-luu-tru/xac-nhan
Content-Type: application/json

{
  "maHoSo": "DEP-2023-8942",
  "ketQua": [
    { "id": "01", "hoTen": "Nguyễn Văn An", "dieuKien": true },
    { "id": "02", "hoTen": "Lê Thị Bình", "dieuKien": true },
    { "id": "03", "hoTen": "Trần Quang Cường", "dieuKien": true },
    { "id": "04", "hoTen": "Phạm Minh Đức", "dieuKien": true }
  ]
}
```

---

### 2) Phân hệ 3.2: Lập hợp đồng thuê (Contract Drafting)

- **Lấy dữ liệu khởi tạo bản nháp hợp đồng (Pre-fill):**
```http
GET http://localhost:3001/api/hop-dong/pre-fill/DEP-2023-8942
```

- **Tạo mới hợp đồng:**
```http
POST http://localhost:3001/api/hop-dong/tao-moi
Content-Type: application/json

{
  "khachHang": {
    "maKH": "KH-2023-8821",
    "hoTen": "Nguyễn Văn An",
    "cccd": "001092003841"
  },
  "thongTinThue": {
    "maPhong": "P.402-A",
    "ngayBatDau": "2023-10-15",
    "thoiHanThue": 12,
    "giaThueCoBan": 2500000,
    "kyThanhToan": "MONTHLY"
  },
  "bieuPhiDichVu": [
    { "id": "elec", "ten": "Tiền điện", "donVi": "VNĐ/kWh", "gia": 3500 },
    { "id": "water", "ten": "Tiền nước", "donVi": "VNĐ/Người", "gia": 100000 }
  ],
  "dieuKhoanBoSung": "Thỏa thuận đặc biệt về giờ giấc sinh hoạt"
}
```

---

### 3) Phân hệ 3.3: Thanh toán đầu kỳ (Initial Payment)

- **Lấy chi tiết khoản thu cần thanh toán:**
```http
GET http://localhost:3001/api/ke-toan/chi-tiet-thanh-toan/CON-2023-1102
```

- **Xác nhận kế toán thu đủ tiền:**
```http
POST http://localhost:3001/api/ke-toan/xac-nhan-thu-tien
Content-Type: application/json

{
  "maGiaoDich": "PAY-2024-0892",
  "phuongThuc": "chuyen-khoan",
  "soTienThucThu": 5300000,
  "maKeToan": "KT-01"
}
```

---

### 4) Phân hệ 3.4: Bàn giao tài sản (Asset Handover)

- **Lấy thông tin khách và checklist tài sản phòng:**
```http
GET http://localhost:3001/api/ban-giao/PAY-2024-0892
```

- **Hoàn tất bàn giao & ký nhận biên bản:**
```http
POST http://localhost:3001/api/ban-giao/hoan-tat
Content-Type: application/json

{
  "maGiaoDich": "PAY-2024-0892",
  "ketQuaTaiSan": [
    { "id": "item-1", "ten": "Giường", "daKiem": true, "ghiChu": "Mới 100%" },
    { "id": "item-2", "ten": "Nệm", "daKiem": true, "ghiChu": "Sạch sẽ" },
    { "id": "item-3", "ten": "Tủ", "daKiem": true, "ghiChu": "Tốt" },
    { "id": "item-4", "ten": "Chìa khóa / Thẻ từ", "daKiem": true, "ghiChu": "Đã giao" },
    { "id": "item-5", "ten": "Vệ sinh đạt yêu cầu", "daKiem": true, "ghiChu": "Đạt" }
  ],
  "chuKy": {
    "quanLy": true,
    "khach": true
  },
  "maQuanLy": "MANAGER-01"
}
```

---

### 5) Phân hệ 4.1: Thanh lý hợp đồng & Thu hồi tài sản (Contract Liquidation)

- **Lấy thông tin thanh lý hợp đồng:**
```http
GET http://localhost:3001/api/thanh-ly/HD-2023-0892
```

- **Hoàn tất thanh lý & thu hồi thẻ/khóa:**
```http
POST http://localhost:3001/api/thanh-ly/hoan-tat
Content-Type: application/json

{
  "maHopDong": "HD-2023-0892",
  "ketQuaThuTuc": [
    { "id": "proc-1", "ten": "Ký biên bản trả phòng", "daHoanThanh": true },
    { "id": "proc-2", "ten": "Ký thanh lý hợp đồng thuê", "daHoanThanh": true },
    { "id": "proc-3", "ten": "Đã thu hồi chìa khóa", "daHoanThanh": true },
    { "id": "proc-4", "ten": "Đã thu hồi thẻ ra vào", "daHoanThanh": true }
  ],
  "ghiChuTaiSan": "Đã hoàn trả đầy đủ, phòng sạch sẽ.",
  "chuKy": {
    "quanLy": true,
    "khach": true
  },
  "maQuanLy": "MANAGER-01"
}
```