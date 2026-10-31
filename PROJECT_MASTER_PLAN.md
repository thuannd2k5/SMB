# HỆ THỐNG QUẢN LÝ KHO THÔNG MINH CHO CỬA HÀNG GIA DỤNG SMB
## MASTER IMPLEMENTATION ROADMAP & PROMPT ARCHITECTURE (NESTJS + MONGODB)

> **Mô hình phối hợp 2 Cửa sổ (Dual-Window Execution Model)**:
> - **Cửa sổ 1 (Architect / Planner)**: Lên kế hoạch, theo dõi tiến độ, tạo các Prompt chi tiết (kèm tiêu chí nghiệm thu, cấu trúc tệp, mã mẫu chuẩn) cho từng Task.
> - **Cửa sổ 2 (Worker / Coder)**: Chạy prompt từ Cửa sổ 1, viết code, chạy lệnh kiểm thử (test), cài thư viện và bàn giao chức năng.

---

### TỔNG QUAN CÔNG NGHỆ CHỌN LỌC (LEAN FULL-STACK TYPESCRIPT)
1. **Frontend / PWA**:
   - Framework: React 18 / Vite PWA (mobile-first layout, siêu nhẹ, tải nhanh).
   - UI & Styling: Tailwind CSS, Lucide React Icons.
   - Barcode Scanner: `html5-qrcode` (quét camera client-side trực tiếp trên điện thoại độ trễ < 200ms).
   - Audio/Voice: Web Speech API (nhận diện giọng nói tiếng Việt và đọc phản hồi).
2. **Backend**:
   - Framework: **NestJS (TypeScript)** với kiến trúc Module hóa (Clean Architecture).
   - Database: **MongoDB + Mongoose** (Linh hoạt tuyệt đối cho thông số kỹ thuật đa dạng của đồ gia dụng).
   - Caching: In-memory Cache / Redis lưu trữ Master Catalog query.
3. **AI & Agentic Engine**:
   - LLM Core: **`@google/genai` (Official SDK)** với model `gemini-2.5-flash` (tối ưu chi phí, tốc độ cao) & Multimodal Vision OCR.
   - Mechanism: Gemini Structured Outputs (JSON Schema) & Function Calling (Tools) cho Voice BI.
   - Inventory Math: Phân tích ABC (Pareto 80/20) & Sales Velocity (Runout Days) tính toán trực tiếp trên TypeScript.

---

### PHÂN KỲ DỰ ÁN: 4 PHA - 12 TASKS CHI TIẾT

#### PHA 1: NỀN TẢNG & LÕI ZERO-EFFORT INGESTION (Tuần 1 - 3)
- [x] **Task 1.1**: Khởi tạo cấu trúc Full-stack Monorepo (Frontend Vite/React PWA + Backend NestJS + Mongoose setup).
- [x] **Task 1.2**: Module Client-side Barcode Scanner PWA (quét camera độ trễ < 200ms, hỗ trợ EAN-13, UPC).
- [x] **Task 1.3**: AI Retrieval Service (NestJS + Gemini Flash + Search/Fetch Scraper) bóc tách Barcode thành Structured JSON chuẩn hóa.
- [x] **Task 1.4**: Tích hợp luồng quét sản phẩm thực tế: Camera Scan -> Backend Agent -> Modal xem trước xác nhận sản phẩm trong 3s.

#### PHA 2: HAI TẦNG DATABASE & QUẢN LÝ KHO (CRUD) (Tuần 4 - 6)
- [x] **Task 2.1**: Thiết kế Schema Mongoose 2 tầng: `MasterCatalog` (dữ liệu chung) & `StoreInventory` (kho riêng từng cửa hàng).
- [x] **Task 2.2**: API & Giao diện Quản lý Kho hoàn chỉnh (Danh sách tồn kho, Nhập/Xuất kho, Tìm kiếm, Lọc theo vị trí kệ hàng).
- [x] **Task 2.3**: Vision Fallback: Module chụp ảnh bao bì khi quét mã vạch không ra thông tin (Gemini Vision OCR bóc tách thông số).

#### PHA 3: HỆ SINH THÁI AI QUẢN TRỊ & TỐI ƯU VẬN HÀNH (Tuần 7 - 10)
- [x] **Task 3.1**: Smart Pricing Agent: Khuyến nghị biên lợi nhuận và giá bán lẻ theo giá vốn và giá thị trường TMĐT.
- [x] **Task 3.2**: Inventory Health Engine: Thuật toán phân loại ABC & Cảnh báo đứt hàng (Runout Days) + Xả hàng ế (>45 ngày).
- [x] **Task 3.3**: Supplier Re-ordering Agent: Tự động gom đơn hàng thiếu, nhóm theo Nhà Phân Phối và sinh mẫu tin nhắn Zalo/SMS 1 chạm.

#### PHA 4: HỎI ĐÁP GIỌNG NÓI (VOICE BI), TEST & PACKAGING (Tuần 11 - 14)
- [x] **Task 4.1**: Conversational BI: Voice Assistant (Web Speech API -> Gemini Function Calling truy vấn doanh thu, tồn kho theo ngôn ngữ tự nhiên).
- [ ] **Task 4.2**: Tối ưu hiệu năng, Caching Master Catalog, Service Worker PWA Offline mode.
- [ ] **Task 4.3**: Pilot Testing & Demo hoàn chỉnh với bộ 50+ mã sản phẩm gia dụng thực tế.
