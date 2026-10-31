---
name: gemini-agentic-retrieval
description: >-
  Use this skill whenever writing or modifying backend AI retrieval services in NestJS using @google/genai.
  It guides barcode search retrieval, scraping, Gemini Structured Outputs (JSON Schema), and Multimodal Vision OCR fallback.
---

# Gemini Agentic Retrieval & Multimodal OCR in NestJS

## Overview
Khi nhận được một mã vạch từ Client:
1. **Kiểm tra Master Catalog**: Tìm trong MongoDB `master_catalogs`. Nếu có -> Trả về ngay lập tức ($0 chi phí AI).
2. **AI Autonomous Retrieval**: Nếu chưa có trong DB:
   - Gọi tìm kiếm internet (DuckDuckGo / Google Search / SerpAPI) bằng chuỗi mã vạch để lấy tiêu đề sản phẩm, mô tả, thông số từ các sàn TMĐT (Shopee, Tiki, Điện Máy Xanh).
   - Truyền nội dung cào được vào `gemini-2.5-flash` với **Structured Outputs Schema** để ép kiểu thành JSON chuẩn.
3. **Multimodal Vision Fallback**: Với hàng thủ công, hàng xưởng nội địa không có mã vạch trên mạng, người dùng chụp ảnh bao bì/mặt trước sản phẩm -> gửi Base64 vào Gemini Vision để bóc tách thông số.

## 1. Cấu hình Gemini SDK trong NestJS Service

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI, Type } from '@google/genai';

@Injectable()
export class GeminiService {
  private readonly ai: GoogleGenAI;
  private readonly logger = new Logger(GeminiService.name);

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.ai = new GoogleGenAI({ apiKey });
  }

  /**
   * Bóc tách thông tin sản phẩm gia dụng từ raw text tìm kiếm bằng Structured Output
   */
  async extractProductFromSearchData(rawText: string, barcode: string) {
    const prompt = `Bạn là chuyên gia phân loại hàng gia dụng SMB Việt Nam.
Dưới đây là thông tin cào được từ internet cho mã vạch: "${barcode}".
Nội dung nguồn:
"""
${rawText}
"""
Hãy bóc tách thành thông tin sản phẩm chuẩn hóa cho cửa hàng gia dụng.`;

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: 'Tên sản phẩm chuẩn mực, có thương hiệu và quy cách' },
            brand: { type: Type.STRING, description: 'Tên hãng (ví dụ: Sunhouse, Lock&Lock, Philips, Sharp)' },
            category: { 
              type: Type.STRING, 
              enum: ['Thiết bị nhà bếp', 'Đồ dùng phòng khách', 'Thiết bị vệ sinh', 'Điện gia dụng', 'Dụng cụ sửa chữa', 'Khác'] 
            },
            unit: { type: Type.STRING, description: 'Đơn vị tính (Cái, Chiếc, Bộ, Hộp, Bình)' },
            specs: {
              type: Type.OBJECT,
              description: 'Các thông số kỹ thuật dạng key-value linh hoạt',
              properties: {
                power: { type: Type.STRING, description: 'Công suất (ví dụ: 1800W)' },
                capacity: { type: Type.STRING, description: 'Dung tích/Thể tích (ví dụ: 1.8L)' },
                material: { type: Type.STRING, description: 'Chất liệu (ví dụ: Inox 304, Nhôm vân đá)' },
                size: { type: Type.STRING, description: 'Kích cỡ/Đường kính (ví dụ: 26cm, 35x20cm)' }
              }
            },
            suggestedRetailPriceMin: { type: Type.NUMBER, description: 'Giá bán lẻ tối thiểu ước tính (VNĐ)' },
            suggestedRetailPriceMax: { type: Type.NUMBER, description: 'Giá bán lẻ tối đa ước tính (VNĐ)' }
          },
          required: ['name', 'category', 'unit']
        }
      }
    });

    return JSON.parse(response.text.trim());
  }

  /**
   * Multimodal Vision: Đọc ảnh chụp bao bì/nhãn mác sản phẩm
   */
  async extractFromProductImage(imageBase64: string, mimeType: string = 'image/jpeg') {
    const prompt = `Hãy đọc nhãn mác, chữ OCR trên bao bì sản phẩm gia dụng này và trích xuất thông tin sản phẩm chuẩn hóa.`;

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            data: imageBase64,
            mimeType: mimeType
          }
        },
        prompt
      ],
      config: {
        responseMimeType: 'application/json',
        // Tái sử dụng cùng responseSchema như trên
      }
    });

    return JSON.parse(response.text.trim());
  }
}
```
