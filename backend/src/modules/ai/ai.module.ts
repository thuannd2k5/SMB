import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { GeminiService } from './gemini.service';
import { VoiceBiService } from './voice-bi.service';
import { CatalogModule } from '../catalog/catalog.module';
import {
  StoreInventory,
  StoreInventorySchema,
} from '../inventory/schemas/store-inventory.schema';

@Module({
  imports: [
    CatalogModule,
    MongooseModule.forFeature([
      { name: StoreInventory.name, schema: StoreInventorySchema },
    ]),
  ],
  controllers: [AiController],
  providers: [AiService, GeminiService, VoiceBiService],
  exports: [AiService, GeminiService, VoiceBiService],
})
export class AiModule {}
