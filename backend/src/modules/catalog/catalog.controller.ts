import { Controller, Get, Param } from '@nestjs/common';
import { CatalogService } from './catalog.service';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  findAll() {
    return this.catalogService.findAll();
  }

  @Get(':barcode')
  findByBarcode(@Param('barcode') barcode: string) {
    return this.catalogService.findByBarcode(barcode);
  }
}
