import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  StoreInventory,
  StoreInventoryDocument,
} from './schemas/store-inventory.schema';
import { CatalogService } from '../catalog/catalog.service';
import { GeminiService } from '../ai/gemini.service';

export interface AbcItem {
  inventoryId: string;
  barcode: string;
  name: string;
  brand: string;
  category: string;
  unit: string;
  specs: Record<string, any>;
  stockQuantity: number;
  costPrice: number;
  retailPrice: number;
  shelfLocation: string;
  minStockAlert: number;
  leadTimeDays: number;
  lastSoldAt: Date | null;
  daysInactive: number;
  dailySales: number;
  runoutDays: number;
  urgency: 'CRITICAL' | 'WARNING' | 'SAFE';
  urgencyMessage: string;
  estimatedMonthlyRevenue: number;
  abcGroup: 'A' | 'B' | 'C';
  isDeadStock: boolean;
  tiedUpCapital?: number;
  liquidationStrategy?: string;
  supplierName?: string;
  supplierPhone?: string;
}

export interface InventoryHealthResponse {
  summary: {
    totalProducts: number;
    totalCapital: number;
    criticalStockoutCount: number;
    deadStockCount: number;
    deadCapital: number;
  };
  abcDistribution: {
    groupA: { count: number; percentage: number };
    groupB: { count: number; percentage: number };
    groupC: { count: number; percentage: number };
  };
  stockoutAlerts: Array<{
    inventoryId: string;
    barcode: string;
    name: string;
    stockQuantity: number;
    dailySales: number;
    runoutDays: number;
    urgency: 'CRITICAL' | 'WARNING';
    message: string;
    shelfLocation?: string;
    supplierName?: string;
  }>;
  deadStockItems: Array<{
    inventoryId: string;
    barcode: string;
    name: string;
    stockQuantity: number;
    daysInactive: number;
    costPrice: number;
    tiedUpCapital: number;
    liquidationStrategy: string;
    shelfLocation?: string;
  }>;
  itemsWithAbc: AbcItem[];
}

@Injectable()
export class InventoryAnalyticsService {
  private readonly logger = new Logger(InventoryAnalyticsService.name);

  constructor(
    @InjectModel(StoreInventory.name)
    private readonly inventoryModel: Model<StoreInventoryDocument>,
    private readonly catalogService: CatalogService,
    private readonly geminiService: GeminiService,
  ) {}

  /**
   * Tính toán toàn diện sức khỏe kho hàng: Phân loại ABC, Cảnh báo đứt hàng & Xả hàng đọng vốn
   */
  async getInventoryHealth(storeId: string = 'store-001'): Promise<InventoryHealthResponse> {
    this.logger.log(`Calculating inventory health analytics for store: [${storeId}]`);

    // 1. Lấy dữ liệu tồn kho từ MongoDB
    let docs: any[] = [];
    if (this.inventoryModel.db?.readyState === 1) {
      try {
        docs = await this.inventoryModel
          .find({ storeId })
          .populate('catalogId')
          .lean()
          .exec();
      } catch (err: any) {
        this.logger.warn(`Failed to fetch inventory from MongoDB: ${err.message}`);
      }
    }

    // Nếu kho có dưới 4 sản phẩm, tự động bổ sung bộ mẫu gia dụng chuẩn thực tế
    if (docs.length < 4) {
      await this.seedRealisticInventory(storeId);
      if (this.inventoryModel.db?.readyState === 1) {
        docs = await this.inventoryModel
          .find({ storeId })
          .populate('catalogId')
          .lean()
          .exec();
      }
    }

    // 2. Chuẩn hóa danh sách sản phẩm và tính toán chỉ số cơ bản
    const now = new Date();
    const rawItems: Array<{
      inventoryId: string;
      barcode: string;
      name: string;
      brand: string;
      category: string;
      unit: string;
      specs: Record<string, any>;
      stockQuantity: number;
      costPrice: number;
      retailPrice: number;
      shelfLocation: string;
      minStockAlert: number;
      leadTimeDays: number;
      lastSoldAt: Date | null;
      daysInactive: number;
      dailySales: number;
      runoutDays: number;
      urgency: 'CRITICAL' | 'WARNING' | 'SAFE';
      urgencyMessage: string;
      estimatedMonthlyRevenue: number;
      supplierName?: string;
      supplierPhone?: string;
    }> = docs.map((doc: any) => {
      const cat = doc.catalogId || {};
      const stockQuantity = Math.max(0, doc.stockQuantity || 0);
      const costPrice = Math.max(0, doc.costPrice || 0);
      const retailPrice = Math.max(costPrice, doc.retailPrice || 0);
      const minStockAlert = doc.minStockAlert ?? 5;
      const leadTimeDays = doc.leadTimeDays || 2;
      const lastSoldAt = doc.lastSoldAt ? new Date(doc.lastSoldAt) : null;

      // Tính số ngày không có đơn bán (Days Inactive)
      let daysInactive = 0;
      if (lastSoldAt) {
        const diffMs = now.getTime() - lastSoldAt.getTime();
        daysInactive = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      } else {
        daysInactive = 10;
      }

      // Tính vận tốc bán hàng hàng ngày (Daily Sales Velocity)
      let dailySales = 1.0;
      if (daysInactive >= 45) {
        // Hàng đọng vốn không bán được
        dailySales = 0;
      } else if (daysInactive <= 2) {
        // Hàng bán chạy gần đây
        dailySales = stockQuantity <= 3 ? 1.5 : 2.0;
      } else if (daysInactive <= 7) {
        dailySales = 1.2;
      } else {
        dailySales = 0.5;
      }

      // Doanh thu ước tính hàng tháng (dùng cho phân tích Pareto ABC)
      const monthlyUnitsSold = dailySales > 0 ? Math.round(dailySales * 30) : 1;
      const estimatedMonthlyRevenue = retailPrice * monthlyUnitsSold;

      // Tính số ngày bán hết hàng tồn (Runout Days)
      let runoutDays = 99;
      if (stockQuantity === 0) {
        runoutDays = 0;
      } else if (dailySales > 0) {
        runoutDays = Math.round(stockQuantity / dailySales);
      }

      // Đánh giá mức độ cảnh báo đứt hàng (Stockout Urgency)
      let urgency: 'CRITICAL' | 'WARNING' | 'SAFE' = 'SAFE';
      let urgencyMessage = `Tồn kho an toàn, đủ bán trong ${runoutDays} ngày.`;

      if (stockQuantity === 0) {
        urgency = 'CRITICAL';
        urgencyMessage = 'Đã hết hàng! Cần đặt nhập khẩn cấp ngay lập tức.';
      } else if (runoutDays <= leadTimeDays + 1 || stockQuantity <= 2) {
        urgency = 'CRITICAL';
        urgencyMessage = `Chỉ còn đủ bán trong ${runoutDays} ngày, cần nhập hàng ngay!`;
      } else if (runoutDays <= 7 || stockQuantity <= minStockAlert) {
        urgency = 'WARNING';
        urgencyMessage = `Còn đủ bán trong ${runoutDays} ngày, nên chuẩn bị đặt hàng.`;
      }

      return {
        inventoryId: doc._id?.toString(),
        barcode: cat.barcode || doc.barcode || '',
        name: cat.name || 'Sản phẩm gia dụng',
        brand: cat.brand || '',
        category: cat.category || 'Gia dụng',
        unit: cat.unit || 'Cái',
        specs: cat.specs || {},
        stockQuantity,
        costPrice,
        retailPrice,
        shelfLocation: doc.shelfLocation || 'Kệ A1',
        minStockAlert,
        leadTimeDays,
        lastSoldAt,
        daysInactive,
        dailySales,
        runoutDays,
        urgency,
        urgencyMessage,
        estimatedMonthlyRevenue,
        supplierName: doc.supplierName || '',
        supplierPhone: doc.supplierPhone || '',
      };
    });

    // 3. THUẬT TOÁN PHÂN LOẠI ABC (PARETO 80/20)
    // Sắp xếp giảm dần theo doanh thu ước tính
    const sorted = [...rawItems].sort(
      (a, b) => b.estimatedMonthlyRevenue - a.estimatedMonthlyRevenue,
    );
    const totalRevenue = sorted.reduce(
      (sum, item) => sum + item.estimatedMonthlyRevenue,
      0,
    );

    let accumulatedRevenue = 0;
    const itemsWithAbc: AbcItem[] = sorted.map((item, index) => {
      accumulatedRevenue += item.estimatedMonthlyRevenue;
      const pct = totalRevenue > 0 ? (accumulatedRevenue / totalRevenue) * 100 : 0;

      let abcGroup: 'A' | 'B' | 'C' = 'C';
      if (index === 0 || pct <= 80) {
        abcGroup = 'A';
      } else if (pct <= 95) {
        abcGroup = 'B';
      } else {
        abcGroup = 'C';
      }

      // Phát hiện hàng đọng vốn (Dead Stock):
      // Thuộc nhóm C và không bán được trong >= 45 ngày (hoặc daysInactive >= 45) và còn tồn > 0
      const isDeadStock = item.daysInactive >= 45 && item.stockQuantity > 0;
      const tiedUpCapital = isDeadStock
        ? item.stockQuantity * item.costPrice
        : 0;

      return {
        ...item,
        abcGroup,
        isDeadStock,
        tiedUpCapital,
      };
    });

    // Tính tỷ lệ phân bổ ABC Distribution
    const countA = itemsWithAbc.filter((i) => i.abcGroup === 'A').length;
    const countB = itemsWithAbc.filter((i) => i.abcGroup === 'B').length;
    const countC = itemsWithAbc.filter((i) => i.abcGroup === 'C').length;

    const revA = itemsWithAbc
      .filter((i) => i.abcGroup === 'A')
      .reduce((s, i) => s + i.estimatedMonthlyRevenue, 0);
    const revB = itemsWithAbc
      .filter((i) => i.abcGroup === 'B')
      .reduce((s, i) => s + i.estimatedMonthlyRevenue, 0);
    const revC = itemsWithAbc
      .filter((i) => i.abcGroup === 'C')
      .reduce((s, i) => s + i.estimatedMonthlyRevenue, 0);

    const pctA = totalRevenue > 0 ? Math.round((revA / totalRevenue) * 100) : 80;
    const pctB = totalRevenue > 0 ? Math.round((revB / totalRevenue) * 100) : 15;
    const pctC = Math.max(0, 100 - pctA - pctB);

    // 4. DANH SÁCH CẢNH BÁO ĐỨT HÀNG (Stockout Alerts)
    const stockoutAlerts = itemsWithAbc
      .filter((i) => i.urgency === 'CRITICAL' || i.urgency === 'WARNING')
      .sort((a, b) => a.runoutDays - b.runoutDays)
      .map((item) => ({
        inventoryId: item.inventoryId,
        barcode: item.barcode,
        name: item.name,
        stockQuantity: item.stockQuantity,
        dailySales: item.dailySales,
        runoutDays: item.runoutDays,
        urgency: item.urgency as 'CRITICAL' | 'WARNING',
        message: item.urgencyMessage,
        shelfLocation: item.shelfLocation,
        supplierName: item.supplierName,
      }));

    // 5. DANH SÁCH HÀNG ĐỌNG VỐN & CHIẾN LƯỢC XẢ HÀNG (Dead Stock Liquidation)
    const deadCandidates = itemsWithAbc.filter((i) => i.isDeadStock);
    const leadProduct = itemsWithAbc.find((i) => i.abcGroup === 'A')?.name || 'Bộ nồi Inox';

    const deadStockItems: Array<{
      inventoryId: string;
      barcode: string;
      name: string;
      stockQuantity: number;
      daysInactive: number;
      costPrice: number;
      tiedUpCapital: number;
      liquidationStrategy: string;
      shelfLocation?: string;
    }> = [];

    for (const d of deadCandidates) {
      const tiedUpCapital = d.stockQuantity * d.costPrice;
      const liquidationStrategy = await this.geminiService.generateLiquidationStrategy({
        productName: d.name,
        stockQuantity: d.stockQuantity,
        daysInactive: d.daysInactive,
        costPrice: d.costPrice,
        tiedUpCapital,
        leadProductName: leadProduct,
      });

      deadStockItems.push({
        inventoryId: d.inventoryId,
        barcode: d.barcode,
        name: d.name,
        stockQuantity: d.stockQuantity,
        daysInactive: d.daysInactive,
        costPrice: d.costPrice,
        tiedUpCapital,
        liquidationStrategy,
        shelfLocation: d.shelfLocation,
      });
    }

    // 6. TỔNG HỢP SUMMARY
    const totalProducts = itemsWithAbc.length;
    const totalCapital = itemsWithAbc.reduce(
      (sum, i) => sum + i.stockQuantity * i.costPrice,
      0,
    );
    const criticalStockoutCount = stockoutAlerts.filter(
      (a) => a.urgency === 'CRITICAL',
    ).length;
    const deadStockCount = deadStockItems.length;
    const deadCapital = deadStockItems.reduce(
      (sum, d) => sum + d.tiedUpCapital,
      0,
    );

    return {
      summary: {
        totalProducts,
        totalCapital,
        criticalStockoutCount,
        deadStockCount,
        deadCapital,
      },
      abcDistribution: {
        groupA: { count: countA, percentage: pctA },
        groupB: { count: countB, percentage: pctB },
        groupC: { count: countC, percentage: pctC },
      },
      stockoutAlerts,
      deadStockItems,
      itemsWithAbc,
    };
  }

  /**
   * Khởi tạo bộ dữ liệu mẫu thực tế chuẩn SMB đồ gia dụng nếu cơ sở dữ liệu còn trống
   */
  private async seedRealisticInventory(storeId: string) {
    this.logger.log(`Seeding realistic SMB household products for store [${storeId}]...`);

    const now = Date.now();
    const demoCatalog = [
      {
        barcode: '8935212345678',
        name: 'Chảo chống dính Sunhouse 26cm',
        brand: 'Sunhouse',
        category: 'Thiết bị nhà bếp',
        unit: 'Cái',
        specs: { size: '26cm', material: 'Hợp kim nhôm chống dính' },
        costPrice: 120000,
        retailPrice: 175000,
        stockQuantity: 2,
        minStockAlert: 5,
        leadTimeDays: 2,
        lastSoldAt: new Date(now - 1 * 86400000), // Bán 1 ngày trước
        shelfLocation: 'Kệ A1',
        supplierName: 'NPP Sunhouse Miền Bắc',
      },
      {
        barcode: '8936037482910',
        name: 'Bộ 3 nồi Inox 3 đáy Fivestar nắp kính',
        brand: 'Fivestar',
        category: 'Thiết bị nhà bếp',
        unit: 'Bộ',
        specs: { size: '16-20-24cm', material: 'Inox 430 3 đáy' },
        costPrice: 450000,
        retailPrice: 620000,
        stockQuantity: 8,
        minStockAlert: 5,
        leadTimeDays: 2,
        lastSoldAt: new Date(now - 2 * 86400000),
        shelfLocation: 'Kệ B2',
        supplierName: 'NPP Đồ Gia Dụng Tân Bình',
      },
      {
        barcode: '8935006543210',
        name: 'Nồi chiên không dầu Lock&Lock 5.2L EJF357BLK',
        brand: 'Lock&Lock',
        category: 'Thiết bị nhà bếp',
        unit: 'Cái',
        specs: { capacity: '5.2L', power: '1800W' },
        costPrice: 1350000,
        retailPrice: 1850000,
        stockQuantity: 5,
        minStockAlert: 3,
        leadTimeDays: 3,
        lastSoldAt: new Date(now - 1 * 86400000),
        shelfLocation: 'Kệ A3',
        supplierName: 'Lock&Lock Official Distributor',
      },
      {
        barcode: '8935123456789',
        name: 'Ấm siêu tốc Inox Sunhouse 1.8L SHD1182',
        brand: 'Sunhouse',
        category: 'Thiết bị nhà bếp',
        unit: 'Cái',
        specs: { capacity: '1.8L', power: '1500W' },
        costPrice: 110000,
        retailPrice: 165000,
        stockQuantity: 12,
        minStockAlert: 5,
        leadTimeDays: 2,
        lastSoldAt: new Date(now - 3 * 86400000),
        shelfLocation: 'Kệ C1',
        supplierName: 'NPP Sunhouse Miền Bắc',
      },
      {
        barcode: '8886328901234',
        name: 'Máy sấy tóc Panasonic 1800W ND21',
        brand: 'Panasonic',
        category: 'Chăm sóc cá nhân',
        unit: 'Cái',
        specs: { power: '1800W', speed: '3 chế độ gió' },
        costPrice: 240000,
        retailPrice: 340000,
        stockQuantity: 9,
        minStockAlert: 4,
        leadTimeDays: 2,
        lastSoldAt: new Date(now - 5 * 86400000),
        shelfLocation: 'Kệ B1',
        supplierName: 'Điện máy Panasonic VN',
      },
      {
        barcode: '8934567890123',
        name: 'Bình giữ nhiệt inox mẫu cũ 500ml',
        brand: 'Khác',
        category: 'Gia dụng tiện ích',
        unit: 'Cái',
        specs: { capacity: '500ml', material: 'Inox 201' },
        costPrice: 115000,
        retailPrice: 160000,
        stockQuantity: 18,
        minStockAlert: 5,
        leadTimeDays: 2,
        lastSoldAt: new Date(now - 48 * 86400000), // 48 ngày chưa bán (Dead stock)
        shelfLocation: 'Kệ D3',
        supplierName: 'Tổng kho Gia dụng Miền Nam',
      },
      {
        barcode: '8936012345678',
        name: 'Bộ dao làm bếp 5 món thép không gỉ',
        brand: 'Khác',
        category: 'Thiết bị nhà bếp',
        unit: 'Bộ',
        specs: { quantity: '5 món', material: 'Thép không gỉ' },
        costPrice: 145000,
        retailPrice: 210000,
        stockQuantity: 6,
        minStockAlert: 3,
        leadTimeDays: 2,
        lastSoldAt: new Date(now - 15 * 86400000),
        shelfLocation: 'Kệ C2',
        supplierName: 'Tổng kho Gia dụng Miền Nam',
      },
    ];

    for (const item of demoCatalog) {
      try {
        const cat = await this.catalogService.upsertProduct(
          {
            barcode: item.barcode,
            name: item.name,
            brand: item.brand,
            category: item.category,
            unit: item.unit,
            specs: item.specs,
            suggestedRetailPriceMin: item.costPrice * 1.25,
            suggestedRetailPriceMax: item.retailPrice * 1.1,
          },
          'SYSTEM_CACHE',
        );

        if (this.inventoryModel.db?.readyState === 1 && cat._id) {
          const existing = await this.inventoryModel.findOne({
            storeId,
            catalogId: cat._id,
          });

          if (!existing) {
            await this.inventoryModel.create({
              storeId,
              catalogId: cat._id,
              stockQuantity: item.stockQuantity,
              costPrice: item.costPrice,
              retailPrice: item.retailPrice,
              shelfLocation: item.shelfLocation,
              minStockAlert: item.minStockAlert,
              leadTimeDays: item.leadTimeDays,
              lastSoldAt: item.lastSoldAt,
              supplierName: item.supplierName,
            });
          }
        }
      } catch (err: any) {
        this.logger.warn(`Notice while seeding [${item.name}]: ${err.message}`);
      }
    }
  }
}
