import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InboundInventoryDto } from './dto/inbound-inventory.dto';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  findAll(@Query('storeId') storeId?: string) {
    return this.inventoryService.findAll(storeId || 'store-001');
  }

  @Get('overview')
  getOverview(@Query('storeId') storeId?: string) {
    return this.inventoryService.getOverview(storeId || 'store-001');
  }

  @Post('inbound')
  inbound(@Body() dto: InboundInventoryDto) {
    return this.inventoryService.inbound(dto);
  }
}
