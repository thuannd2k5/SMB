# SMB SMART INVENTORY - DỰ ÁN QUẢN LÝ KHO THÔNG MINH CHO CỬA HÀNG GIA DỤNG SMB

Tài liệu này định nghĩa các quy tắc cốt lõi, tiêu chuẩn kỹ thuật và quy ước lập trình mà mọi AI Agent khi tham gia viết code (vide code) cho dự án này BẮT BUỘC phải tuân thủ.

---

## 1. TECH STACK CHUẨN HÓA
- **Frontend**: React 18, Vite PWA, Tailwind CSS, Lucide React, `html5-qrcode`, Web Speech API.
- **Backend**: NestJS (TypeScript), Mongoose, `@google/genai` (Google GenAI Official SDK).
- **Database**: MongoDB (Local `mongodb://localhost:27017/smb_inventory` hoặc MongoDB Atlas).
- **Kiến trúc dữ liệu**: Two-Tier Data (Master Catalog dùng chung và Store Inventory riêng).

---

## 2. NGUYÊN TẮC THIẾT KẾ & VIẾT CODE
1. **Mobile-First UX**:
   - Tất cả giao diện phải tối ưu cho màn hình điện thoại (375px - 430px) để chủ cửa hàng cầm 1 tay thao tác dễ dàng tại kệ hàng.
   - Luôn duy trì Bottom Navigation cố định với nút Quét mã (Scanner) nổi bật ở giữa.
   - Thao tác quét sản phẩm phải dưới 3 giây: Quét mã -> Tự động điền thông tin -> Xác nhận.

2. **Tiêu chuẩn NestJS**:
   - Tuân thủ nghiêm ngặt mô hình Module: mỗi tính năng có `module`, `controller`, `service`, `dto`, `schema`.
   - Tất cả request body phải được validate bằng `class-validator` và `class-transformer`.
   - Mọi response API đều thống nhất định dạng: `{ success: boolean, data?: any, message?: string }`.
   - Global Prefix là `/api`. Cấu hình CORS mở cho `http://localhost:5173`.

3. **Tương tác AI (Gemini Flash & Vision)**:
   - Dùng duy nhất thư viện chính thức `@google/genai` của Google.
   - Luôn dùng `responseSchema` (Structured Outputs) để ép Gemini trả về JSON chuẩn xác, không được để LLM trả về text tự do khi bóc tách sản phẩm.
   - Áp dụng cơ chế Cache Master Catalog: Trước khi gọi AI bóc tách barcode, BẮT BUỘC phải kiểm tra mã barcode trong collection `master_catalogs`. Nếu đã có, trả về ngay lập tức (chi phí AI = $0, độ trễ < 100ms).

4. **Nghiệp vụ Kho & Dòng tiền**:
   - Không lưu cứng thông số kỹ thuật (specs) thành cột cố định, dùng schema linh hoạt `{ [key: string]: any }` vì đồ gia dụng có thông số biến động theo chủng loại (công suất, kích cỡ, dung tích, chất liệu).
   - Kiểm tra kỹ số lượng tồn kho (không cho phép bán âm kho nếu không bật tính năng cho phép bán nợ).
