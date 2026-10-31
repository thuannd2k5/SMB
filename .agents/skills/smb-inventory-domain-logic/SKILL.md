---
name: smb-inventory-domain-logic
description: >-
  Use this skill whenever implementing inventory analytics, ABC classification, sales velocity,
  smart pricing formulas, dead-stock liquidation strategies, or supplier re-ordering automation.
---

# SMB Inventory Domain Logic & Analytics Formulas

## 1. Kiến trúc Hai tầng Dữ liệu (Two-Tier Architecture)

### Tầng 1: MasterCatalog (Dữ liệu chung toàn hệ thống)
```typescript
{
  barcode: string;           // EAN-13, UPC (Unique Index)
  name: string;              // Tên chuẩn hóa
  brand?: string;            // Thương hiệu
  category: string;          // Danh mục ngành hàng
  unit: string;              // Cái, Chiếc, Bộ...
  specs: Record<string, any>;// Linh hoạt: { power: "1800W", capacity: "1.8L" }
  imageUrl?: string;
  source: 'SYSTEM_CACHE' | 'AGENT_RETRIEVED' | 'VISION_OCR';
}
```

### Tầng 2: StoreInventory (Dữ liệu riêng từng cửa hàng)
```typescript
{
  storeId: string;           // Mã cửa hàng (hỗ trợ multi-tenant)
  catalogId: ObjectId;       // Trỏ về MasterCatalog
  stockQuantity: number;     // Số lượng tồn kho hiện tại
  costPrice: number;         // Giá vốn nhập hàng (VNĐ)
  retailPrice: number;       // Giá niêm yết bán lẻ (VNĐ)
  shelfLocation: string;     // Kệ hàng (Ví dụ: "Kệ A2-Tầng 3")
  minStockAlert: number;     // Ngưỡng báo động tồn tối thiểu (Mặc định: 5)
  leadTimeDays: number;      // Thời gian nhà cung cấp giao hàng (Mặc định: 2 ngày)
  supplierName?: string;     // Tên nhà phân phối / đại lý cung cấp
  supplierPhone?: string;    // Số điện thoại / Zalo nhà cung cấp
  lastSoldAt?: Date;         // Ngày gần nhất phát sinh đơn bán
}
```

---

## 2. Thuật toán Quản trị Tồn kho & Dòng tiền

### A. Phân tích Pareto ABC (ABC Analysis Matrix)
- **Nhóm A (Sản phẩm chủ lực)**: Chiếm 80% tổng doanh thu (thường chỉ gồm ~20% số mã hàng). Cần giám sát chặt chẽ, không bao giờ được để đứt hàng.
- **Nhóm B (Sản phẩm thứ cấp)**: Chiếm 15% tổng doanh thu (~30% số mã hàng).
- **Nhóm C (Sản phẩm đuôi dài/tồn đọng)**: Chiếm 5% tổng doanh thu (~50% số mã hàng). Cần kiểm soát chặt lượng nhập để tránh giam vốn.

**Mã thuật toán tính ABC trong TypeScript**:
```typescript
export function calculateAbcClassification(items: Array<{ id: string; revenue: number }>) {
  const sorted = [...items].sort((a, b) => b.revenue - a.revenue);
  const totalRevenue = sorted.reduce((sum, item) => sum + item.revenue, 0);
  
  let accumulated = 0;
  return sorted.map(item => {
    accumulated += item.revenue;
    const percentage = totalRevenue > 0 ? (accumulated / totalRevenue) * 100 : 0;
    let group: 'A' | 'B' | 'C' = 'C';
    if (percentage <= 80) group = 'A';
    else if (percentage <= 95) group = 'B';
    return { ...item, group };
  });
}
```

### B. Vận tốc bán hàng & Cảnh báo đứt hàng (Sales Velocity & Runout Days)
- **Công thức Vận tốc bán hàng (Avg Daily Sales)**:
  $$\text{Daily Sales} = \frac{\text{Tổng số lượng bán trong 14 ngày}}{14}$$
- **Số ngày tồn còn lại (Runout Days)**:
  $$\text{Runout Days} = \frac{\text{Số lượng tồn kho hiện tại}}{\text{Daily Sales}}$$
- **Điều kiện cảnh báo đỏ (Stockout Risk Alert)**:
  Nếu `Runout Days <= leadTimeDays + 1` (Hàng sắp hết trước hoặc đúng khi nhà cung cấp kịp giao hàng mới).

### C. Chiến lược Xả hàng đọng vốn (Dead Stock Liquidation)
- **Định nghĩa hàng đọng**: Sản phẩm thuộc Nhóm C và không phát sinh giao dịch nào trong hơn **45 ngày** (`now - lastSoldAt > 45 days`).
- **Gợi ý hành động từ AI**:
  - Tạo gói Combo: Bán kèm sản phẩm Nhóm A với mức giảm giá 15-20%.
  - Giảm giá chạm đáy: Bán bằng giá vốn (`retailPrice = costPrice`) để thu hồi tiền mặt ngay lập tức tái đầu tư mã hàng bán chạy.

### D. Soạn đơn đặt hàng Zalo tự động (Supplier Re-ordering)
Tự động lọc các mặt hàng `stockQuantity <= minStockAlert`, nhóm theo `supplierName`, và sinh mẫu văn bản:
```text
Chào [Tên NPP], bên em cửa hàng [Tên Cửa Hàng] gửi đơn bổ sung:
1. [Tên SP 1]: [Số lượng cần nhập] [Đơn vị]
2. [Tên SP 2]: [Số lượng cần nhập] [Đơn vị]
Anh/chị giữ giá chiết khấu cũ và giao giúp em trước [Thời gian giao]. Em cảm ơn!
```
