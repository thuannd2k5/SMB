import { Controller, Post, Body, Get } from '@nestjs/common';
import { AiService } from './ai.service';
import { RetrieveBarcodeDto } from './dto/retrieve-barcode.dto';
import { VisionOcrDto } from './dto/vision-ocr.dto';
import { SmartPricingDto } from './dto/smart-pricing.dto';

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

  @Post('vision-ocr')
  async visionOcr(@Body() dto: VisionOcrDto) {
    const productData = await this.aiService.processVisionOcr(
      dto.image,
      dto.mimeType || 'image/jpeg',
    );
    return {
      success: true,
      data: productData,
    };
  }

  @Post('smart-pricing')
  async smartPricing(@Body() dto: SmartPricingDto) {
    const result = await this.aiService.calculateSmartPricing(dto);
    return {
      success: true,
      data: result,
    };
  }
}
