import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { DEMO_HOUSEHOLD_PRODUCTS } from './demo-products.data';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smb_inventory';
const STORE_ID = 'store-001';

async function seed() {
  console.log('====================================================');
  console.log('🌱 BẮT ĐẦU SEED 50+ SẢN PHẨM GIA DỤNG SMB THỰC TẾ');
  console.log(`📡 Kết nối MongoDB: ${MONGODB_URI}`);
  console.log('====================================================');

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      bufferCommands: false,
    });
    console.log('✅ Đã kết nối thành công tới MongoDB!');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection failed.');
    }

    const masterCatalogsCol = db.collection('master_catalogs');
    const storeInventoriesCol = db.collection('store_inventories');

    const now = Date.now();
    const dayMs = 86400000;
    let seededCount = 0;

    for (const item of DEMO_HOUSEHOLD_PRODUCTS) {
      // 1. Tầng 1: Master Catalog
      const catPayload = {
        barcode: item.barcode,
        name: item.name,
        brand: item.brand,
        category: item.category,
        unit: item.unit,
        specs: item.specs,
        suggestedRetailPriceMin: Math.round((item.costPrice * 1.15) / 1000) * 1000,
        suggestedRetailPriceMax: Math.round((item.retailPrice * 1.05) / 1000) * 1000,
        imageUrl: '',
        source: 'SYSTEM_CACHE',
        updatedAt: new Date(),
      };

      const catResult = await masterCatalogsCol.findOneAndUpdate(
        { barcode: item.barcode },
        {
          $set: catPayload,
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true, returnDocument: 'after' },
      );

      const catalogId = catResult?._id;
      if (!catalogId) {
        console.warn(`⚠️ Không lấy được catalogId cho ${item.barcode}`);
        continue;
      }

      // 2. Tầng 2: Store Inventory
      const lastSoldDaysAgo = item.lastSoldDaysAgo ?? 2;
      const lastSoldAt = new Date(now - lastSoldDaysAgo * dayMs);

      const invPayload = {
        storeId: STORE_ID,
        catalogId: catalogId,
        stockQuantity: item.stockQuantity,
        costPrice: item.costPrice,
        retailPrice: item.retailPrice,
        shelfLocation: item.shelfLocation,
        minStockAlert: item.minStockAlert,
        leadTimeDays: item.leadTimeDays,
        supplierName: item.supplierName,
        supplierPhone: item.supplierPhone,
        lastSoldAt,
        updatedAt: new Date(),
      };

      await storeInventoriesCol.findOneAndUpdate(
        { storeId: STORE_ID, catalogId: catalogId },
        {
          $set: invPayload,
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true },
      );

      seededCount++;
    }

    console.log(`🎉 HOÀN TẤT: Đã nạp thành công ${seededCount}/${DEMO_HOUSEHOLD_PRODUCTS.length} sản phẩm vào cơ sở dữ liệu!`);
    console.log(`- Kịch bản đứt hàng: 3 mã có tồn kho <= 3`);
    console.log(`- Kịch bản hàng ế đọng vốn: 2 mã có ngày chưa bán > 45 ngày`);
    console.log(`- Phân bố Pareto 80/20 ABC hoàn chỉnh`);
  } catch (error: any) {
    console.error('❌ Lỗi khi seed dữ liệu:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Đã đóng kết nối MongoDB.');
    process.exit(0);
  }
}

seed();
