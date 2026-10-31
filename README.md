# SMB SMART INVENTORY - QUẢN LÝ KHO GIA DỤNG THÔNG MINH

Hệ thống quản lý kho thông minh chuẩn **Mobile-First** cho cửa hàng đồ gia dụng SMB, tích hợp bóc tách mã vạch tự động bằng **Gemini AI**, phân loại ABC, kiểm kê theo vị trí kệ và hỏi đáp kho bằng giọng nói.

---

## 1. Cấu trúc Monorepo

```
smb/
├── backend/                   # Ứng dụng NestJS (TypeScript)
│   ├── src/
│   │   ├── common/           # Interceptors & Exception Filters
│   │   ├── config/           # Cấu hình môi trường (ConfigModule)
│   │   ├── modules/
│   │   │   ├── health/       # Kiểm tra kết nối hệ thống (GET /api/health)
│   │   │   ├── catalog/      # Module Master Catalog chung
│   │   │   ├── inventory/    # Module Store Inventory riêng từng cửa hàng
│   │   │   └── ai/           # Module Gemini AI Engine (@google/genai)
│   │   ├── app.module.ts     # Root Module
│   │   └── main.ts           # Điểm khởi động, Global Prefix /api, CORS
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── frontend/                  # React 18 + Vite PWA (Mobile-First)
│   ├── src/
│   │   ├── components/       # Header (Trạng thái kết nối), BottomNav (4 tab)
│   │   ├── pages/            # Dashboard, ScannerPage, InventoryPage, SettingsPage
│   │   ├── services/         # api.js (Axios Client & Endpoints)
│   │   ├── App.jsx           # Điều hướng & State kết nối
│   │   ├── main.jsx          # Entrypoint React
│   │   └── index.css         # Tailwind directives & Mobile styles
│   ├── public/               # Favicon & PWA assets
│   ├── index.html            # Mobile viewport & Meta tags
│   ├── vite.config.js        # Vite config & Proxy /api -> :3000
│   ├── tailwind.config.js    # Cấu hình Tailwind CSS
│   └── package.json
├── GEMINI.md                  # Tiêu chuẩn kỹ thuật bắt buộc của dự án
├── PROJECT_MASTER_PLAN.md     # Lộ trình 4 Pha - 12 Tasks chi tiết
└── README.md                  # Tài liệu hướng dẫn cài đặt & vận hành
```

---

## 2. Hướng dẫn Khởi chạy (Quick Start)

### Yêu cầu tiên quyết:
- **Node.js**: v18+ hoặc v20+
- **MongoDB**: Chạy local tại `mongodb://localhost:27017/smb_inventory` hoặc MongoDB Atlas.

---

### Khởi chạy Backend (NestJS):
```bash
cd backend
npm install
npm run start:dev
```
- Máy chủ sẽ chạy tại: `http://localhost:3000`
- API Prefix: `http://localhost:3000/api`
- Kiểm tra Health: `http://localhost:3000/api/health`

---

### Khởi chạy Frontend (React + Vite PWA):
```bash
cd frontend
npm install
npm run dev
```
- Ứng dụng mở tại: `http://localhost:5173`
- Giao diện được tối ưu chuẩn Mobile (375px - 430px) với Bottom Navigation và nút Quét mã nổi bật ở giữa.

---

## 3. Lộ trình phát triển tiếp theo

- **Task 1.1**: Khởi tạo Monorepo React PWA + NestJS + MongoDB. (Hoàn thành)
- **Task 1.2**: Module Client-side Barcode Scanner PWA (`html5-qrcode` < 200ms).
- **Task 1.3**: AI Retrieval Service (NestJS + Gemini Flash Structured Outputs).
- **Task 1.4**: Hoàn thiện luồng quét thực tế (Camera -> AI Extraction -> Modal xác nhận 3s).
