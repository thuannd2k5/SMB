import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI, Type } from '@google/genai';

export interface ExtractedProduct {
  barcode?: string;
  name: string;
  brand?: string;
  category: string;
  unit: string;
  specs?: Record<string, any>;
  suggestedRetailPriceMin?: number;
  suggestedRetailPriceMax?: number;
}

@Injectable()
export class GeminiService {
  private readonly ai: GoogleGenAI | null = null;
  private readonly logger = new Logger(GeminiService.name);

  constructor(private readonly configService: ConfigService) {
    const apiKey =
      this.configService.get<string>('GEMINI_API_KEY') ||
      this.configService.get<string>('gemini.apiKey');

    if (apiKey && apiKey.trim().length > 0 && apiKey !== 'your_gemini_api_key_here') {
      try {
        this.ai = new GoogleGenAI({ apiKey });
        this.logger.log('Google GenAI SDK successfully initialized');
      } catch (err: any) {
        this.logger.warn(`Failed to initialize Google GenAI SDK: ${err.message}`);
      }
    } else {
      this.logger.warn(
        'GEMINI_API_KEY is not configured or placeholder. GeminiService will use fallback retrieval mode.',
      );
    }
  }

  isConfigured(): boolean {
    return !!this.ai;
  }

  /**
   * Bóc tách thông tin sản phẩm gia dụng từ raw text tìm kiếm bằng Structured Output
   */
  async extractProductFromSearch(
    rawSnippet: string,
    barcode: string,
  ): Promise<ExtractedProduct> {
    if (!this.ai) {
      throw new Error('Gemini SDK is not configured with a valid API key');
    }

    const prompt = `Bạn là chuyên gia thẩm định và phân loại hàng gia dụng SMB Việt Nam.
Dưới đây là thông tin cào được từ internet cho mã vạch barcode: "${barcode}".
Nội dung nguồn:
"""
${rawSnippet}
"""
Hãy bóc tách thành thông tin sản phẩm chuẩn mực, có thương hiệu, quy cách rõ ràng cho cửa hàng bán lẻ gia dụng tại Việt Nam.`;

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description: 'Tên sản phẩm chuẩn mực, có thương hiệu và quy cách',
            },
            brand: {
              type: Type.STRING,
              description:
                'Tên thương hiệu (ví dụ: Sunhouse, Lock&Lock, Philips, Sharp, Kangaroo...)',
            },
            category: {
              type: Type.STRING,
              enum: [
                'Thiết bị nhà bếp',
                'Điện gia dụng',
                'Thiết bị vệ sinh',
                'Đồ dùng phòng khách',
                'Khác',
              ],
              description: 'Phân loại ngành hàng gia dụng',
            },
            unit: {
              type: Type.STRING,
              enum: ['Chiếc', 'Cái', 'Bộ', 'Hộp', 'Bình'],
              description: 'Đơn vị tính cơ sở',
            },
            specs: {
              type: Type.OBJECT,
              description: 'Các thông số kỹ thuật dạng key-value linh hoạt',
              properties: {
                power: {
                  type: Type.STRING,
                  description: 'Công suất (ví dụ: 1800W, 2200W)',
                },
                capacity: {
                  type: Type.STRING,
                  description: 'Dung tích (ví dụ: 1.8L, 500ml)',
                },
                material: {
                  type: Type.STRING,
                  description: 'Chất liệu (ví dụ: Inox 304, Nhôm chống dính, Thủy tinh)',
                },
                size: {
                  type: Type.STRING,
                  description: 'Kích cỡ hoặc đường kính (ví dụ: 26cm, 35x20cm)',
                },
              },
            },
            suggestedRetailPriceMin: {
              type: Type.NUMBER,
              description: 'Giá bán lẻ tối thiểu ước tính (VNĐ)',
            },
            suggestedRetailPriceMax: {
              type: Type.NUMBER,
              description: 'Giá bán lẻ tối đa ước tính (VNĐ)',
            },
          },
          required: ['name', 'category', 'unit'],
        },
      },
    });

    const responseText = response.text ? response.text.trim() : '{}';
    return JSON.parse(responseText) as ExtractedProduct;
  }

  /**
   * Multimodal Vision OCR: Đọc ảnh chụp bao bì/mặt trước sản phẩm gia dụng
   */
  async extractFromProductImage(
    imageBase64: string,
    mimeType: string = 'image/jpeg',
  ): Promise<ExtractedProduct> {
    if (!this.ai) {
      throw new Error('Gemini SDK is not configured with a valid API key');
    }

    // Strip header prefix if data URI format
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    const prompt = `Bạn là chuyên gia phân tích hàng gia dụng SMB Việt Nam.
Hãy đọc toàn bộ nhãn mác OCR, logo thương hiệu, tên gọi và thông số kỹ thuật (công suất, kích thước, dung tích, chất liệu) trên bao bì/mặt trước sản phẩm này và trích xuất thành JSON chuẩn.
Nếu trên bao bì có in mã vạch (dãy số barcode), hãy đọc chính xác vào trường "barcode". Nếu không tìm thấy mã vạch, hãy để trống trường barcode.`;

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            data: cleanBase64,
            mimeType: mimeType || 'image/jpeg',
          },
        },
        prompt,
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            barcode: {
              type: Type.STRING,
              description: 'Mã vạch số nếu đọc được trên bao bì, hoặc để trống',
            },
            name: {
              type: Type.STRING,
              description: 'Tên sản phẩm chuẩn mực, có thương hiệu và quy cách',
            },
            brand: {
              type: Type.STRING,
              description:
                'Tên thương hiệu (ví dụ: Fivestar, Sunhouse, Lock&Lock, Elmich, Philips...)',
            },
            category: {
              type: Type.STRING,
              enum: [
                'Thiết bị nhà bếp',
                'Điện gia dụng',
                'Thiết bị vệ sinh',
                'Đồ dùng phòng khách',
                'Khác',
              ],
              description: 'Phân loại ngành hàng gia dụng',
            },
            unit: {
              type: Type.STRING,
              enum: ['Bộ', 'Chiếc', 'Cái', 'Hộp', 'Bình'],
              description: 'Đơn vị tính cơ sở',
            },
            specs: {
              type: Type.OBJECT,
              description: 'Các thông số kỹ thuật dạng key-value linh hoạt',
              properties: {
                power: { type: Type.STRING, description: 'Công suất (ví dụ: 1800W)' },
                capacity: { type: Type.STRING, description: 'Dung tích (ví dụ: 1.8L)' },
                material: { type: Type.STRING, description: 'Chất liệu (ví dụ: Inox 430, Nhôm chống dính, Thủy tinh)' },
                size: { type: Type.STRING, description: 'Kích cỡ hoặc đường kính (ví dụ: 16-20-24cm)' },
              },
            },
            suggestedRetailPriceMin: {
              type: Type.NUMBER,
              description: 'Giá bán lẻ tối thiểu ước tính (VNĐ)',
            },
            suggestedRetailPriceMax: {
              type: Type.NUMBER,
              description: 'Giá bán lẻ tối đa ước tính (VNĐ)',
            },
          },
          required: ['name', 'category', 'unit'],
        },
      },
    });

    const responseText = response.text ? response.text.trim() : '{}';
    const parsed = JSON.parse(responseText) as ExtractedProduct;

    // If no barcode read from image, assign systematic VN-OCR barcode
    if (!parsed.barcode || parsed.barcode.trim() === '') {
      parsed.barcode = `VN-OCR-${Date.now()}`;
    }

    return parsed;
  }

  /**
   * Sinh lời khuyên kinh doanh (AI Insight) cho mức giá đề xuất
   */
  async generatePricingInsight(params: {
    productName: string;
    costPrice: number;
    marketMin: number;
    marketMax: number;
    recommendedPrice: number;
    marginPercentage: number;
  }): Promise<string> {
    const {
      productName,
      costPrice,
      marketMin,
      marketMax,
      recommendedPrice,
      marginPercentage,
    } = params;

    const fallbackInsight = `Mức giá bán lẻ đề xuất tối ưu là ${recommendedPrice.toLocaleString(
      'vi-VN',
    )} VNĐ (Biên lợi nhuận gộp ${marginPercentage}%). Mức giá này đảm bảo cạnh tranh tốt với các tiệm xung quanh và vẫn duy trì biên lợi nhuận an toàn cho cửa hàng gia dụng SMB.`;

    if (!this.ai) {
      return fallbackInsight;
    }

    try {
      const prompt = `Bạn là chuyên gia cố vấn chiến lược định giá bán lẻ cho các cửa hàng gia dụng SMB Việt Nam.
Dựa trên thông tin sản phẩm:
- Tên sản phẩm: "${productName}"
- Giá vốn nhập: ${costPrice.toLocaleString('vi-VN')} VNĐ
- Khoảng giá thị trường tham khảo: ${marketMin.toLocaleString('vi-VN')} VNĐ - ${marketMax.toLocaleString('vi-VN')} VNĐ
- Giá bán lẻ đề xuất: ${recommendedPrice.toLocaleString('vi-VN')} VNĐ (Biên lợi nhuận gộp: ${marginPercentage}%)
Hãy đưa ra 1-2 câu nhận định ngắn gọn, súc tích (dưới 40 từ), thực tế cho chủ tiệm gia dụng giải thích vì sao mức giá này tối ưu. Không dùng gạch đầu dòng, trả về text thuần.`;

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const text = response.text ? response.text.trim() : '';
      return text.length > 10 ? text : fallbackInsight;
    } catch (err: any) {
      this.logger.warn(`Failed to generate Gemini pricing insight: ${err.message}`);
      return fallbackInsight;
    }
  }
}
