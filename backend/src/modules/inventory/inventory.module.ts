import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { InventoryAnalyticsService } from './inventory-analytics.service';
import { SupplierReorderService } from './supplier-reorder.service';
import {
  StoreInventory,
  StoreInventorySchema,
} from './schemas/store-inventory.schema';
import { CatalogModule } from '../catalog/catalog.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StoreInventory.name, schema: StoreInventorySchema },
    ]),
    CatalogModule,
    AiModule,
  ],
  controllers: [InventoryController],
  providers: [InventoryService, InventoryAnalyticsService, SupplierReorderService],
  exports: [InventoryService, InventoryAnalyticsService, SupplierReorderService, MongooseModule],
})
export class InventoryModule {}
