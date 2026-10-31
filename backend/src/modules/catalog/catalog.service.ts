import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  MasterCatalog,
  MasterCatalogDocument,
  CatalogSource,
} from './schemas/master-catalog.schema';

@Injectable()
export class CatalogService {
  private readonly logger = new Logger(CatalogService.name);
  // High-speed in-memory cache to guarantee < 50ms responses & offline dev resilience
  private readonly localCache = new Map<string, any>();

  constructor(
    @InjectModel(MasterCatalog.name)
    private readonly catalogModel: Model<MasterCatalogDocument>,
  ) {}

  /**
   * Find product in Master Catalog by barcode (Cache-First)
   */
  async findByBarcode(barcode: string): Promise<MasterCatalogDocument | any | null> {
    const cleanBarcode = barcode.trim();

    // 1. Check in-memory fast tier first
    if (this.localCache.has(cleanBarcode)) {
      this.logger.log(`Master Catalog HIT (In-Memory Fast Tier): [${cleanBarcode}]`);
      return this.localCache.get(cleanBarcode);
    }

    // 2. Check MongoDB collection if connected
    if (this.catalogModel.db?.readyState === 1) {
      try {
        const doc = await this.catalogModel.findOne({ barcode: cleanBarcode }).lean().exec();
        if (doc) {
          this.logger.log(`Master Catalog HIT (MongoDB Tier): [${cleanBarcode}]`);
          this.localCache.set(cleanBarcode, doc);
          return doc;
        }
      } catch (err: any) {
        this.logger.warn(`MongoDB catalog query notice: ${err.message}`);
      }
    }

    return null;
  }

  /**
   * Upsert product record into Master Catalog
   */
  async upsertProduct(
    productData: Partial<MasterCatalog>,
    source: string = CatalogSource.AI_RETRIEVED,
  ): Promise<any> {
    const cleanBarcode = productData.barcode?.trim();
    if (!cleanBarcode) throw new Error('Barcode is required to upsert into Master Catalog');

    const payload = {
      barcode: cleanBarcode,
      name: productData.name?.trim() || `Sản phẩm ${cleanBarcode}`,
      brand: productData.brand?.trim() || '',
      category: productData.category?.trim() || 'Khác',
      unit: productData.unit?.trim() || 'Cái',
      specs: productData.specs || {},
      suggestedRetailPriceMin: productData.suggestedRetailPriceMin || 0,
      suggestedRetailPriceMax: productData.suggestedRetailPriceMax || 0,
      imageUrl: productData.imageUrl || '',
      source,
    };

    // Store in in-memory cache
    this.localCache.set(cleanBarcode, {
      _id: `cached_${cleanBarcode}`,
      ...payload,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Persist to MongoDB if connected
    if (this.catalogModel.db?.readyState === 1) {
      try {
        const upserted = await this.catalogModel
          .findOneAndUpdate(
            { barcode: cleanBarcode },
            { $set: payload },
            { upsert: true, new: true, setDefaultsOnInsert: true },
          )
          .lean()
          .exec();

        if (upserted) {
          this.localCache.set(cleanBarcode, upserted);
          return upserted;
        }
      } catch (err: any) {
        this.logger.warn(`Could not persist to MongoDB: ${err.message}. Maintained in-memory.`);
      }
    }

    return this.localCache.get(cleanBarcode);
  }

  /**
   * Return all items in Master Catalog
   */
  async findAll() {
    try {
      const items = await this.catalogModel.find().lean().limit(100).exec();
      if (items && items.length > 0) return items;
    } catch (err: any) {
      this.logger.warn(`MongoDB findAll notice: ${err.message}`);
    }
    return Array.from(this.localCache.values());
  }
}
