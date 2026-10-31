import { Injectable } from '@nestjs/common';

@Injectable()
export class CatalogService {
  findAll() {
    return {
      message: 'Master Catalog module initialized. Ready for Task 1.3 / 2.1.',
      items: [],
    };
  }

  findByBarcode(barcode: string) {
    return {
      barcode,
      found: false,
      message: `Master Catalog lookup for ${barcode}`,
    };
  }
}
