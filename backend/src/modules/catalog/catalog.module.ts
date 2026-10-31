import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import {
  MasterCatalog,
  MasterCatalogSchema,
} from './schemas/master-catalog.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MasterCatalog.name, schema: MasterCatalogSchema },
    ]),
  ],
  controllers: [CatalogController],
  providers: [CatalogService],
  exports: [CatalogService, MongooseModule],
})
export class CatalogModule {}
