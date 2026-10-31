import { Controller, Post, Body, Get } from '@nestjs/common';
import { AiService } from './ai.service';
import { RetrieveBarcodeDto } from './dto/retrieve-barcode.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('status')
  getStatus() {
    return this.aiService.getStatus();
  }

  @Post('retrieve-barcode')
  async retrieveBarcode(@Body() dto: RetrieveBarcodeDto) {
    const productData = await this.aiService.retrieveBarcode(dto.barcode);
    return {
      success: true,
      data: productData,
    };
  }
}
