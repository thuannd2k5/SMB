import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { InventoryAnalyticsService } from './inventory-analytics.service';
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
  providers: [InventoryService, InventoryAnalyticsService],
  exports: [InventoryService, InventoryAnalyticsService, MongooseModule],
})
export class InventoryModule {}
