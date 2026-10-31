import {
  Controller,
  Get,
  Post,
  Body,
  Query,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InboundInventoryDto } from './dto/inbound-inventory.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('items')
  getItems(
    @Query('search') search?: string,
    @Query('shelf') shelf?: string,
    @Query('category') category?: string,
    @Query('lowStockOnly') lowStockOnly?: string,
    @Query('storeId') storeId?: string,
  ) {
    return this.inventoryService.getItems({
      search,
      shelf,
      category,
      lowStockOnly,
      storeId,
    });
  }

  @Get('overview')
  getOverview(@Query('storeId') storeId?: string) {
    return this.inventoryService.getOverview(storeId || 'store-001');
  }

  @Post('inbound')
  inbound(@Body() dto: InboundInventoryDto) {
    return this.inventoryService.inbound(dto);
  }

  @Post('adjust-stock')
  adjustStock(@Body() dto: AdjustStockDto) {
    return this.inventoryService.adjustStock(dto);
  }
}
