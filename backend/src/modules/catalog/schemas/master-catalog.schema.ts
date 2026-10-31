import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MasterCatalogDocument = HydratedDocument<MasterCatalog>;

export enum CatalogSource {
  SYSTEM_CACHE = 'SYSTEM_CACHE',
  AI_RETRIEVED = 'AI_RETRIEVED',
  VISION_OCR = 'VISION_OCR',
  MANUAL = 'MANUAL',
}

@Schema({ timestamps: true, collection: 'master_catalogs', bufferCommands: false })
export class MasterCatalog {
  @Prop({ required: true, unique: true, index: true, trim: true })
  barcode: string;

  @Prop({ required: true, index: true, trim: true })
  name: string;

  @Prop({ default: '', trim: true })
  brand: string;

  @Prop({ index: true, default: 'Khác', trim: true })
  category: string;

  @Prop({ default: 'Cái', trim: true })
  unit: string;

  @Prop({ type: Object, default: {} })
  specs: Record<string, any>;

  @Prop({ default: 0 })
  suggestedRetailPriceMin: number;

  @Prop({ default: 0 })
  suggestedRetailPriceMax: number;

  @Prop({ default: '' })
  imageUrl: string;

  @Prop({
    type: String,
    enum: Object.values(CatalogSource),
    default: CatalogSource.AI_RETRIEVED,
  })
  source: string;
}

export const MasterCatalogSchema = SchemaFactory.createForClass(MasterCatalog);
MasterCatalogSchema.index({ barcode: 1 }, { unique: true });
