import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI, Type } from '@google/genai';

export interface ExtractedProduct {
  found?: boolean;
  barcode?: string;
  name?: string;
  brand?: string;
  category?: string;
  unit?: string;
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
   * Bóc tách thông tin sản phẩm từ raw text tìm kiếm bằng Structured Output
   */
  async extractProductFromSearch(
    rawSnippet: string,
    barcode: string,
  ): Promise<ExtractedProduct> {
    if (!this.ai) {
      throw new Error('Gemini SDK is not configured with a valid API key');
    }

    const prompt = `Bạn là chuyên gia bóc tách sản phẩm bán lẻ tiêu dùng Việt Nam.
Dưới đây là thông tin cào được từ internet cho mã vạch barcode: "${barcode}".
Nội dung nguồn:
"""
${rawSnippet}
"""
Quy tắc xử lý bắt buộc:
1. Đọc kỹ nội dung nguồn. Nếu nội dung KHÔNG chứa thông tin sản phẩm cụ thể, hoặc là kết quả tìm kiếm rỗng, hoặc không liên quan đến mã vạch "${barcode}", bạn BẮT BUỘC phải trả về:
   - "found": false
   - "name": ""
   - "brand": ""
   - "category": "Chưa phân loại"
   - "unit": "Cái"
   - "specs": {}
   - "suggestedRetailPriceMin": 0
   - "suggestedRetailPriceMax": 0
   TUYỆT ĐỐI KHÔNG được tự ý sáng tác, phỏng đoán hoặc gán ghép thông số giả định (như công suất, chất liệu gia dụng) nếu nội dung nguồn không có!

2. Nếu nội dung nguồn xác định ĐƯỢC sản phẩm có thật (mọi ngành hàng: văn phòng phẩm, sách vở, bánh kẹo, đồ uống, thực phẩm, gia dụng, điện tử, hóa mỹ phẩm, thời trang...):
   - "found": true
   - "name": Tên sản phẩm chính xác, rõ ràng, có quy cách hoặc dung tích/kích thước
   - "brand": Tên thương hiệu chuẩn (ví dụ: Hồng Hà, Thiên Long, Kinh Đô, Vinamilk, Sunhouse, Lock&Lock, Unilever...) hoặc để trống nếu không có
   - "category": Ngành hàng chính xác (ví dụ: "Văn phòng phẩm", "Bánh kẹo & Thực phẩm", "Đồ uống", "Thiết bị nhà bếp", "Điện gia dụng", "Tiện ích & Vệ sinh", "Chăm sóc cá nhân", "Khác")
   - "unit": Đơn vị tính phù hợp (Cuốn, Quyển, Cái, Chiếc, Gói, Hộp, Chai, Lon, Bộ, Bình...)
   - "specs": Trích xuất các thông số thực tế có trong bài (số trang, định lượng, kích thước, dung tích, thành phần, công suất...). Chỉ ghi thông số có trong nguồn, KHÔNG bịa đặt.
   - "suggestedRetailPriceMin": Giá bán lẻ tham khảo tối thiểu (VNĐ), 0 nếu không rõ
   - "suggestedRetailPriceMax": Giá bán lẻ tham khảo tối đa (VNĐ), 0 nếu không rõ`;

    const response = await this.ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            found: {
              type: Type.BOOLEAN,
              description:
                'True nếu tìm thấy thông tin sản phẩm có thực trong nguồn, False nếu không tìm thấy hoặc thông tin không đủ',
            },
            name: {
              type: Type.STRING,
              description: 'Tên sản phẩm chuẩn mực, hoặc rỗng nếu không tìm thấy',
            },
            brand: {
              type: Type.STRING,
              description: 'Tên thương hiệu sản phẩm',
            },
            category: {
              type: Type.STRING,
              description:
                'Phân loại ngành hàng (Văn phòng phẩm, Bánh kẹo & Thực phẩm, Thiết bị nhà bếp, Điện gia dụng, Tiện ích & Vệ sinh, Chăm sóc cá nhân, Khác)',
            },
            unit: {
              type: Type.STRING,
              description: 'Đơn vị tính cơ sở (Cái, Cuốn, Quyển, Gói, Hộp, Chai, Bộ...)',
            },
            specs: {
              type: Type.OBJECT,
              description: 'Các thông số thực tế dạng key-value',
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
          required: ['found', 'name', 'category', 'unit'],
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

    const prompt = `Bạn là chuyên gia phân tích và bóc tách bao bì sản phẩm tiêu dùng bán lẻ tại Việt Nam.
Hãy đọc toàn bộ nhãn mác OCR, logo thương hiệu, tên gọi và thông số kỹ thuật (kích thước, dung tích, chất liệu, công suất, số lượng...) trên bao bì/mặt trước sản phẩm này và trích xuất thành JSON chuẩn.
Nếu trên bao bì có in mã vạch (dãy số barcode), hãy đọc chính xác vào trường "barcode". Nếu không tìm thấy mã vạch, hãy để trống trường barcode.`;

    const response = await this.ai.models.generateContent({
      model: 'gemini-3.5-flash',
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
              description: 'Tên thương hiệu sản phẩm',
            },
            category: {
              type: Type.STRING,
              description:
                'Phân loại ngành hàng (Văn phòng phẩm, Bánh kẹo & Thực phẩm, Thiết bị nhà bếp, Điện gia dụng, Tiện ích & Vệ sinh, Chăm sóc cá nhân, Khác)',
            },
            unit: {
              type: Type.STRING,
              description: 'Đơn vị tính cơ sở (Cái, Cuốn, Quyển, Hộp, Gói, Chai, Bộ...)',
            },
            specs: {
              type: Type.OBJECT,
              description: 'Các thông số kỹ thuật dạng key-value linh hoạt',
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
        model: 'gemini-3.5-flash',
        contents: prompt,
      });

      const text = response.text ? response.text.trim() : '';
      return text.length > 10 ? text : fallbackInsight;
    } catch (err: any) {
      this.logger.warn(`Failed to generate Gemini pricing insight: ${err.message}`);
      return fallbackInsight;
    }
  }

  /**
   * Sinh chiến lược xả hàng đọng vốn (Dead Stock Liquidation) bằng Gemini Flash
   */
  async generateLiquidationStrategy(params: {
    productName: string;
    stockQuantity: number;
    daysInactive: number;
    costPrice: number;
    tiedUpCapital: number;
    leadProductName?: string;
  }): Promise<string> {
    const {
      productName,
      stockQuantity,
      daysInactive,
      tiedUpCapital,
      leadProductName,
    } = params;
    const capitalMillion = (tiedUpCapital / 1000000).toFixed(2);
    const bundleProduct = leadProductName || 'Sản phẩm bán chạy';

    const fallback = `${productName} còn tồn ${stockQuantity} cái, đã ${daysInactive} ngày chưa bán được chiếc nào. Gợi ý: Bán kèm ${bundleProduct} giảm giá 15-20% hoặc thanh lý thu hồi vốn ${capitalMillion} triệu đồng.`;

    if (!this.ai) {
      return fallback;
    }

    try {
      const prompt = `Bạn là chuyên gia tư vấn quản trị hàng tồn kho và dòng tiền cho các tiệm gia dụng SMB Việt Nam.
Sản phẩm đọng vốn: "${productName}"
Số lượng tồn kho: ${stockQuantity} cái
Số ngày chưa bán được chiếc nào: ${daysInactive} ngày
Tổng tiền vốn đang bị giam: ${tiedUpCapital.toLocaleString('vi-VN')} VNĐ (${capitalMillion} triệu đồng)
Sản phẩm chủ lực bán chạy hiện tại: "${bundleProduct}"

Hãy đưa ra 1 gợi ý xả hàng thu hồi vốn ngắn gọn trong 1-2 câu (dưới 45 từ) cho chủ tiệm: Gợi ý bán kèm combo với ${bundleProduct} giảm 15-20% hoặc thanh lý giá vốn để giải phóng mặt bằng và thu hồi ${capitalMillion} triệu đồng tiền vốn. Không dùng gạch đầu dòng, trả về văn bản thuần.`;

      const response = await this.ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
      });

      const text = response.text ? response.text.trim() : '';
      return text.length > 10 ? text : fallback;
    } catch (err: any) {
      this.logger.warn(`Failed to generate Gemini liquidation strategy: ${err.message}`);
      return fallback;
    }
  }

  /**
   * Tự động sinh nội dung tin nhắn Zalo gửi Nhà Cung Cấp bằng Gemini Flash
   */
  async generateZaloReorderMessage(params: {
    supplierName: string;
    storeName?: string;
    items: Array<{ name: string; quantity: number; unit?: string }>;
    customPrompt?: string;
    expectedDeliveryTime?: string;
  }): Promise<string> {
    const {
      supplierName,
      storeName = 'tiệm Gia Dụng Mai Loan',
      items,
      customPrompt,
      expectedDeliveryTime = 'sớm nhất có thể (trước 10h sáng mai)',
    } = params;

    const itemsText = items
      .map((it, idx) => `${idx + 1}. ${it.name}: ${it.quantity} ${it.unit || 'Cái'}`)
      .join('\n');

    const fallback = `Chào anh/chị ${supplierName}, bên em ${storeName} gửi đơn bổ sung hàng đợt này:\n${itemsText}\nAnh/chị giữ giá chiết khấu cũ và giao giúp em ${expectedDeliveryTime} nhé. Em cảm ơn!`;

    if (!this.ai) {
      return fallback;
    }

    try {
      const prompt = `Bạn là trợ lý ảo hỗ trợ chủ cửa hàng gia dụng SMB Việt Nam soạn tin nhắn Zalo gửi Nhà Phân Phối / Đại lý để đặt hàng bổ sung kho.
Thông tin đơn hàng:
- Tên Nhà Phân Phối: "${supplierName}"
- Tên cửa hàng bán lẻ: "${storeName}"
- Danh sách mặt hàng cần nhập:
${itemsText}
- Thời gian giao hàng mong muốn: "${expectedDeliveryTime}"
${customPrompt ? `- Yêu cầu đặc biệt của chủ quán: "${customPrompt}"` : ''}

Quy tắc viết tin nhắn:
- Giọng điệu thân thiện, lịch sự, đúng phong cách giao thương bán lẻ Việt Nam (gọi anh/chị nhà cung cấp, xưng em bên tiệm).
- Liệt kê các món đánh số thứ tự 1., 2., ... rõ ràng kèm số lượng và đơn vị.
- Lồng ghép khéo léo yêu cầu đặc biệt (nếu có, ví dụ chiết khấu hoặc giờ giao cụ thể).
- Kết bài lịch sự cảm ơn.
- Không dùng Markdown in đậm hoa mỹ (**), viết dạng text thuần phù hợp copy dán trực tiếp vào khung chat Zalo.`;

      const response = await this.ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
      });

      const text = response.text ? response.text.trim() : '';
      return text.length > 20 ? text : fallback;
    } catch (err: any) {
      this.logger.warn(`Failed to generate Gemini Zalo reorder message: ${err.message}`);
      return fallback;
    }
  }
}
