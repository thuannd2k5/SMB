import { Injectable, Logger } from '@nestjs/common';
import { InventoryAnalyticsService } from './inventory-analytics.service';
import { GeminiService } from '../ai/gemini.service';
import { CustomReorderPromptDto } from './dto/custom-reorder-prompt.dto';

export interface ReorderDraftItem {
  inventoryId?: string;
  barcode?: string;
  name: string;
  stockQuantity: number;
  quantity: number;
  unit: string;
  costPrice: number;
}

export interface SupplierReorderDraft {
  supplierName: string;
  supplierPhone: string;
  items: ReorderDraftItem[];
  totalEstimatedCost: number;
  zaloMessage: string;
  zaloLink: string;
}

@Injectable()
export class SupplierReorderService {
  private readonly logger = new Logger(SupplierReorderService.name);

  // Default supplier phone map for realistic contacts
  private readonly defaultSupplierPhones: Record<string, string> = {
    'NPP Sunhouse Miền Bắc': '0988123456',
    'NPP Đồ Gia Dụng Tân Bình': '0912345678',
    'Lock&Lock Official Distributor': '0909876543',
    'Tổng kho Gia dụng Miền Nam': '0933456789',
    'Điện máy Panasonic VN': '0977654321',
    'Nhà Phân Phối Tổng Hợp': '0988123456',
  };

  constructor(
    private readonly inventoryAnalyticsService: InventoryAnalyticsService,
    private readonly geminiService: GeminiService,
  ) {}

  /**
   * Tự động gom hàng cần nhập, nhóm theo Nhà Cung Cấp và sinh tin nhắn Zalo 1 chạm
   */
  async getReorderDrafts(storeId: string = 'store-001'): Promise<SupplierReorderDraft[]> {
    this.logger.log(`Generating supplier reorder drafts for store: [${storeId}]`);

    // 1. Lấy dữ liệu sức khỏe kho hàng và phân loại ABC
    const health = await this.inventoryAnalyticsService.getInventoryHealth(storeId);
    const allItems = health.itemsWithAbc || [];

    // 2. Lọc các sản phẩm cần bổ sung:
    // - Thuộc stockoutAlerts (urgency === 'CRITICAL' hoặc 'WARNING')
    // - Hoặc stockQuantity <= minStockAlert
    // - Hoặc runoutDays <= 7
    let needingRestock = allItems.filter(
      (i) =>
        i.urgency === 'CRITICAL' ||
        i.urgency === 'WARNING' ||
        i.stockQuantity <= i.minStockAlert ||
        (i.runoutDays !== undefined && i.runoutDays <= 7),
    );

    // Đảm bảo có ít nhất 2-3 sản phẩm để demo cho chủ cửa hàng
    if (needingRestock.length === 0) {
      needingRestock = allItems.filter((i) => !i.isDeadStock).slice(0, 3);
    }

    // 3. Gom đơn và phân nhóm (Group by) theo supplierName
    const supplierMap = new Map<string, ReorderDraftItem[]>();
    const supplierPhoneMap = new Map<string, string>();

    for (const item of needingRestock) {
      const supplier = (item.supplierName && item.supplierName.trim()) || 'Nhà Phân Phối Tổng Hợp';
      const phone =
        (item.supplierPhone && item.supplierPhone.trim()) ||
        this.defaultSupplierPhones[supplier] ||
        '0988123456';

      if (!supplierPhoneMap.has(supplier)) {
        supplierPhoneMap.set(supplier, phone);
      }

      // Công thức tính số lượng đề xuất nhập:
      // suggestedOrderQty = Math.max(10, Math.ceil((dailySales || 1) * 14))
      const dailySales = item.dailySales > 0 ? item.dailySales : 1;
      const suggestedOrderQty = Math.max(10, Math.ceil(dailySales * 14));

      const reorderItem: ReorderDraftItem = {
        inventoryId: item.inventoryId,
        barcode: item.barcode,
        name: item.name,
        stockQuantity: item.stockQuantity,
        quantity: suggestedOrderQty,
        unit: item.unit || 'Cái',
        costPrice: item.costPrice || 100000,
      };

      if (!supplierMap.has(supplier)) {
        supplierMap.set(supplier, []);
      }
      supplierMap.get(supplier)!.push(reorderItem);
    }

    // 4. Sinh tin nhắn Zalo thông minh qua Gemini Flash cho từng Nhà Cung Cấp
    const drafts: SupplierReorderDraft[] = [];

    for (const [supplierName, items] of supplierMap.entries()) {
      const supplierPhone = supplierPhoneMap.get(supplierName) || '0988123456';
      const cleanPhone = supplierPhone.replace(/\D/g, '');
      const totalEstimatedCost = items.reduce(
        (sum, it) => sum + it.quantity * it.costPrice,
        0,
      );

      // Gọi Gemini Flash sinh nội dung Zalo tự nhiên
      const zaloMessage = await this.geminiService.generateZaloReorderMessage({
        supplierName,
        storeName: 'tiệm Gia Dụng Mai Loan',
        items: items.map((it) => ({
          name: it.name,
          quantity: it.quantity,
          unit: it.unit,
        })),
        expectedDeliveryTime: 'trước 10h sáng thứ Bảy',
      });

      drafts.push({
        supplierName,
        supplierPhone,
        items,
        totalEstimatedCost,
        zaloMessage,
        zaloLink: `https://zalo.me/${cleanPhone}`,
      });
    }

    return drafts;
  }

  /**
   * Tùy biến lại tin nhắn Zalo theo yêu cầu của chủ quán (Custom Prompt via Gemini)
   */
  async regenerateCustomZaloMessage(dto: CustomReorderPromptDto) {
    const { supplierName, items, customPrompt, supplierPhone, storeName, expectedDeliveryTime } = dto;
    this.logger.log(`Regenerating Zalo message for [${supplierName}] with custom prompt: "${customPrompt}"`);

    const phone = supplierPhone || this.defaultSupplierPhones[supplierName] || '0988123456';
    const cleanPhone = phone.replace(/\D/g, '');

    const zaloMessage = await this.geminiService.generateZaloReorderMessage({
      supplierName,
      storeName: storeName || 'tiệm Gia Dụng Mai Loan',
      items: items.map((it) => ({
        name: it.name,
        quantity: it.quantity,
        unit: it.unit || 'Cái',
      })),
      customPrompt,
      expectedDeliveryTime: expectedDeliveryTime || 'trước 9h sáng mai',
    });

    return {
      supplierName,
      supplierPhone: phone,
      zaloMessage,
      zaloLink: `https://zalo.me/${cleanPhone}`,
    };
  }
}
