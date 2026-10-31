import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { MasterCatalog } from '../../catalog/schemas/master-catalog.schema';

export type StoreInventoryDocument = HydratedDocument<StoreInventory>;

@Schema({ timestamps: true, collection: 'store_inventories', bufferCommands: false })
export class StoreInventory {
  @Prop({ default: 'store-001', index: true, trim: true })
  storeId: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: MasterCatalog.name,
    required: true,
    index: true,
  })
  catalogId: Types.ObjectId;

  @Prop({ required: true, min: 0, default: 0 })
  stockQuantity: number;

  @Prop({ required: true, min: 0, default: 0 })
  costPrice: number;

  @Prop({ required: true, min: 0, default: 0 })
  retailPrice: number;

  @Prop({ default: 'Kệ A1', trim: true })
  shelfLocation: string;

  @Prop({ default: 5, min: 0 })
  minStockAlert: number;

  @Prop({ default: 2, min: 1 })
  leadTimeDays: number;

  @Prop({ default: '', trim: true })
  supplierName: string;

  @Prop({ default: '', trim: true })
  supplierPhone: string;

  @Prop({ type: Date, default: null })
  lastSoldAt: Date;
}

export const StoreInventorySchema = SchemaFactory.createForClass(StoreInventory);

// Compound unique index ensuring one store inventory record per product per store
StoreInventorySchema.index({ storeId: 1, catalogId: 1 }, { unique: true });
