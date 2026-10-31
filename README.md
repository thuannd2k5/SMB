# SMB SMART INVENTORY - HỆ THỐNG QUẢN LÝ KHO THÔNG MINH CHO CỬA HÀNG GIA DỤNG SMB

[![NestJS](https://img.shields.io/badge/Backend-NestJS%2010-ea2845.svg)](https://nestjs.com/)
[![React](https://img.shields.io/badge/Frontend-React%2018%20PWA-61dafb.svg)](https://react.dev/)
[![Gemini](https://img.shields.io/badge/AI-Google%20GenAI%20SDK-4285f4.svg)](https://ai.google.dev/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%20Two--Tier-47a248.svg)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38bdf8.svg)](https://tailwindcss.com/)

**SMB Smart Inventory** là giải pháp phần mềm quản lý kho thông minh chuẩn **Mobile-First** được thiết kế riêng cho các chủ cửa hàng đồ gia dụng, điện máy và tiện ích sinh hoạt vừa & nhỏ (SMB) tại Việt Nam.

Hệ thống giải quyết bài toán cốt lõi: **Nhập kho cực nhanh dưới 3 giây**, **loại bỏ 100% công đoạn gõ tay thông số kỹ thuật phức tạp**, **tối ưu dòng vốn đọng**, và **hỗ trợ chủ cửa hàng điều hành bằng giọng nói tiếng Việt tự nhiên**.

---

## 🏛️ Kiến Trúc Hệ Thống (Monorepo Architecture)

```
smb/
├── backend/                       # Ứng dụng Backend NestJS (TypeScript)
│   ├── src/
│   │   ├── modules/
│   │   │   ├── catalog/           # Tầng 1: Master Catalog dùng chung (Cache-First)
│   │   │   ├── inventory/         # Tầng 2: Store Inventory riêng từng cửa hàng
│   │   │   │   ├── seed/          # Dữ liệu seed 52 mã gia dụng thực tế & script npm run seed
│   │   │   │   ├── inventory-analytics.service.ts  # Pareto 80/20 ABC & Runout Days
│   │   │   │   └── supplier-reorder.service.ts     # Gom đơn & sinh mẫu tin Zalo
│   │   │   ├── ai/                # Module Google GenAI Official SDK (@google/genai)
│   │   │   │   ├── gemini.service.ts       # Structured Outputs & Multimodal OCR
│   │   │   │   ├── voice-bi.service.ts     # Gemini Function Calling (Conversational BI)
│   │   │   │   └── pricing-agent.service.ts # Biên lợi nhuận gộp 28-35%
│   │   │   └── health/            # Giám sát kết nối (GET /api/health)
│   │   └── main.ts                # CORS, Gzip Compression, Global Prefix /api
│   └── package.json
├── frontend/                      # Ứng dụng Frontend React 18 + Vite PWA (Mobile-First)
│   ├── public/
│   │   ├── manifest.json          # Web App Manifest (Cài đặt làm App điện thoại)
│   │   └── sw.js                  # Service Worker chiến lược Cache-First & Stale-While-Revalidate
│   ├── src/
│   │   ├── components/            # Scanner, ProductPreviewModal, ReorderModal, VoiceAssistantModal...
│   │   ├── pages/                 # Dashboard, ScannerPage, InventoryPage, SettingsPage
│   │   ├── services/              # api.js, soundFeedback.js, offlineStorage.js
│   │   └── App.jsx                # Layout di động 375px - 430px
│   └── package.json
├── GEMINI.md                      # Bộ quy tắc kỹ thuật cốt lõi bắt buộc
├── PROJECT_MASTER_PLAN.md         # Tiến độ 4 Pha - 12 Tasks hoàn thiện 100%
└── README.md                      # Tài liệu tổng quan & hướng dẫn sử dụng
```

---

## 🚀 8 Tính Năng Đột Phá Đã Hoàn Thiện

### 1. Quét Mã Vạch Client-Side Dưới 200ms Với Phản Hồi Beep & Rung
- Sử dụng thư viện `html5-qrcode` xử lý giải mã hình ảnh camera trực tiếp trên trình duyệt, không cần gửi frame ảnh về server.
- Tốc độ nhận diện barcode EAN-13, UPC, Code-128 đạt **< 200ms**.
- Phản hồi đa giác quan: Âm thanh Beep (Web Audio API tần số 1760Hz) và rung haptic (Vibration API 100ms) tạo trải nghiệm quét như máy quét chuyên dụng tại siêu thị.

### 2. Bộ Nhớ Đệm Hai Tầng (Two-Tier Master Catalog) — Tra Cứu Dưới 3ms ($0 Chi Phí AI)
- **Tầng 1 - Master Catalog**: Cơ sở dữ liệu danh mục dùng chung lưu mã vạch, tên chuẩn, hãng, danh mục, thông số kỹ thuật `specs` linh hoạt `{ [key: string]: any }`.
- **Tầng 2 - Store Inventory**: Tồn kho riêng từng cửa hàng (`stockQuantity`, `costPrice`, `retailPrice`, `shelfLocation`, `minStockAlert`).
- **Cache-First In-Memory Tier**: Khi mã vạch đã từng được tra cứu hoặc nhập kho trước đó, hệ thống trả về thông tin tức thì trong **< 3ms**, giảm **$0 chi phí API Gemini**.

### 3. Multimodal Vision OCR Nhận Diện Bao Bì Sản Phẩm Không Mã Vạch
- Đối với sản phẩm không có mã vạch (hàng xách tay, đồ phụ kiện, nhãn mác rách), camera cho phép chụp ảnh bao bì/mặt trước sản phẩm.
- Truyền ảnh base64 qua `inlineData` đến **Gemini 2.5 Flash** trích xuất tên sản phẩm, nhãn hiệu và thông số kỹ thuật (công suất, kích thước, dung tích) ép cấu trúc JSON chuẩn xác qua `responseSchema`.

### 4. Trợ Lý Định Giá Thông Minh (Smart Pricing Agent)
- Tự động bảo vệ biên lợi nhuận gộp mục tiêu **28% - 35%** cho đồ gia dụng SMB.
- Công thức: `recommendedPrice = Math.round(costPrice / (1 - targetMargin) / 1000) * 1000`.
- Tự động phân tích giá thị trường (`marketMin`, `marketMax`) và hiển thị huy hiệu tư vấn:
  * 🟡 *Cảnh báo phá giá* (nếu bán quá rẻ).
  * 🔴 *Cảnh báo khó cạnh tranh* (nếu vượt giá trần).
  * 🟢 *Định giá tối ưu* (biên lãi chuẩn, cạnh tranh tốt).

### 5. Động Cơ Phân Tích Sức Khỏe Kho Hàng (Pareto ABC & Runout Days)
- **Phân loại ABC (Nguyên lý Pareto 80/20)**: Tự động gom nhóm A (mang lại 80% doanh thu), B (15%) và C (5%).
- **Dự báo số ngày bán hết hàng (Runout Days)**: `runoutDays = Math.floor(stockQuantity / dailySales)`.
  * `runoutDays <= leadTimeDays`: Cảnh báo đỏ **CRITICAL** (sắp đứt hàng).
  * `runoutDays <= leadTimeDays * 2`: Cảnh báo vàng **WARNING** (cần lên kế hoạch nhập).
- **Phát hiện hàng ế đọng vốn (Dead Stock)**: Tự động lọc sản phẩm không phát sinh xuất bán trên 45 ngày (`daysInactive > 45`), tính tổng số tiền bị chôn vốn và đề xuất chiến lược xả kho (giảm giá 15-20%, xả lẻ tặng kèm nhóm A).

### 6. Trợ Lý Nhập Hàng Tự Động (Supplier Re-Ordering Agent) Gửi Zalo 1 Chạm
- Tự động gom toàn bộ sản phẩm sắp hết hàng theo từng Nhà Cung Cấp / Đại Lý.
- Tính số lượng nhập tối ưu: `suggestedOrderQty = Math.max(10, Math.ceil(dailySales * 14))`.
- Sử dụng Gemini Flash sinh sẵn mẫu tin nhắn đặt hàng Zalo thân thiện, lịch sự bằng tiếng Việt kèm nút **"Sao chép & Mở Zalo"** để gửi đơn chỉ với 1 chạm.
- Hỗ trợ tinh chỉnh yêu cầu tự nhiên (Ví dụ: *"Tôi muốn xin đại lý chiết khấu thêm 5%"* hoặc *"Giao gấp trước 10h sáng mai"*), AI tự viết lại mẫu tin nhắn ngay lập tức.

### 7. Trợ Lý Giọng Nói Conversational Voice BI (Gemini Function Calling)
- Tích hợp **Web Speech API** nhận diện giọng nói tiếng Việt mượt mà ngay trên điện thoại.
- Kết hợp với **Gemini Function Calling (Tools)** trên backend:
  * `checkProductInventory({ productName })`: Tra cứu tồn kho, giá bán và vị trí kệ (Ví dụ: *"Còn ấm siêu tốc Sunhouse không?"*).
  * `getRevenueReport({ timeframe })`: Báo cáo doanh thu, số đơn và lợi nhuận hôm nay/hôm qua/tuần này.
  * `getLowStockAlerts()`: Lấy danh sách mặt hàng báo động đỏ sắp hết hàng.
  * `getDeadStockAlerts()`: Báo cáo số tiền vốn đang bị đọng và mặt hàng ế cần xả.
- Tự động phát âm thanh phản hồi Text-to-Speech hoặc hiển thị thẻ kết quả trực quan.

### 8. PWA Cài Đặt Màn Hình Chính & Hoạt Động Ngoại Tuyến (Offline-First)
- Web App Manifest chuẩn chỉnh cho phép thêm biểu tượng vào màn hình chính điện thoại (Add to Home Screen) chạy toàn màn hình như ứng dụng native.
- Tích hợp `sw.js` (Service Worker) cài đặt chiến lược lưu cache:
  * Tài nguyên tĩnh: Cache-First.
  * Dữ liệu API sức khỏe kho và danh sách sản phẩm: Network-First với fallback sang LocalStorage / Cache Storage khi mất mạng.
  * Hiển thị thanh thông báo trạng thái ngoại tuyến trực quan khi ngắt kết nối internet.
- Tối ưu tải trang với **Gzip Compression** trên NestJS backend, giảm hơn 70% dung lượng payload truyền tải.

---

## ⚡ Hướng Dẫn Khởi Chạy Nhanh Trong 2 Phút (Quickstart Guide)

### Yêu Cầu Môi Trường
- **Node.js**: v18.x trở lên (khuyến nghị v20.x LTS).
- **MongoDB**: Chạy local tại `mongodb://localhost:27017/smb_inventory` hoặc kết nối MongoDB Atlas (đã cấu hình sẵn trong backend).
- **Google Gemini API Key**: Lấy miễn phí tại [Google AI Studio](https://aistudio.google.com/).

---

### Bước 1: Khởi chạy Backend (NestJS)

```bash
cd backend
npm install
npm run build
npm run start:prod
```
> *Hoặc chạy chế độ phát triển: `npm run start:dev`*

- **API Base URL**: `http://localhost:3000/api`
- **Kiểm tra trạng thái**: `http://localhost:3000/api/health`

---

### Bước 2: Nạp 52 Sản Phẩm Đồ Gia Dụng Thực Tế (Seed Demo Data)

Bạn có thể nạp nhanh dữ liệu bằng 1 trong 3 cách:
1. **Chạy script từ terminal backend**:
   ```bash
   npm run seed
   ```
2. **Gọi qua API HTTP POST**:
   ```bash
   curl -X POST http://localhost:3000/api/inventory/seed-demo-data
   ```
3. **Bấm nút trực tiếp trên màn hình Cài đặt của ứng dụng di động**:
   Nhấp vào nút **"🌱 Nạp 50+ dữ liệu demo"** tại tab Cài đặt.

*Bộ dữ liệu nạp sẵn 52 mã gia dụng Việt Nam bao gồm: Chảo Sunhouse 24/26/28cm, Nồi chiên không dầu Lock&Lock, Quạt bàn Senko B3, Ấm siêu tốc Philips, Đèn bàn Rạng Đông, Nồi cơm điện Sharp, Máy ép Elmich... Đã chuẩn bị sẵn 3 mã nguy cơ đứt hàng và 2 mã ế > 45 ngày.*

---

### Bước 3: Khởi chạy Frontend (React PWA)

Mở terminal mới:
```bash
cd frontend
npm install
npm run dev
```

- Mở trình duyệt tại: `http://localhost:5173`
- Bật chế độ giả lập màn hình di động (F12 -> Toggle Device Toolbar -> chọn iPhone 14 Pro hoặc Pixel 7, kích thước 375px - 430px) để trải nghiệm giao diện chuẩn Mobile-First.

---

## 📱 Hướng Dẫn Sử Dụng Thao Tác Nhanh

| Mục đích | Thao tác |
| :--- | :--- |
| **Quét mã vạch nhập kho** | Nhấn nút **Quét mã** ở thanh điều hướng dưới -> Đưa camera vào mã vạch -> Xem thông tin AI điền tự động -> Nhập số lượng & giá -> Nhấn **Xác nhận nhập kho**. |
| **Chụp ảnh bao bì khi không có mã vạch** | Tại màn hình Quét mã -> Chọn chế độ **Chụp ảnh bao bì (AI Vision)** -> Chụp mặt trước hộp -> Gemini Vision bóc tách toàn bộ thông số kỹ thuật. |
| **Gửi đơn đặt hàng Zalo** | Tại Dashboard -> Xem danh sách "Báo Động Đứt Hàng" -> Bấm **"Soạn đơn NCC"** -> Xem mẫu tin nhắn Zalo do Gemini tự viết -> Nhấn **"Sao chép & Mở Zalo"**. |
| **Hỏi đáp kho bằng giọng nói** | Bấm nút micro tròn màu tím nổi góc dưới màn hình -> Nói: *"Hôm nay doanh thu thế nào?"* hoặc *"Còn chảo Sunhouse 26cm không?"* -> Nhận câu trả lời tức thì. |
| **Kiểm tra hàng đọng vốn** | Tại Dashboard -> Kéo xuống mục **"Cảnh Báo Đọng Vốn & Hàng Ế"** -> Xem số vốn bị chôn và chiến lược xả hàng do AI gợi ý. |

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

- **Frontend**: React 18, Vite 5, Tailwind CSS, Lucide React, `html5-qrcode`, Web Speech API, Web Audio API, Service Worker PWA.
- **Backend**: NestJS 10, TypeScript, Mongoose 8, `@google/genai` (Google GenAI Official SDK), `compression` (Gzip).
- **AI Models**: `gemini-2.5-flash` (Structured Outputs với JSON Schema, Multimodal Vision OCR, Function Calling Tools).
- **Database**: MongoDB (Two-Tier Model: `master_catalogs` và `store_inventories`).

---

## 📄 Bản Quyền & Giấy Phép
Dự án được xây dựng phục vụ cộng đồng kinh doanh đồ gia dụng SMB Việt Nam. Phát triển theo chuẩn mã nguồn mở thân thiện, dễ bảo trì và dễ mở rộng.
