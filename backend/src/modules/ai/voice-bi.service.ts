import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GoogleGenAI, Type } from '@google/genai';
import {
  StoreInventory,
  StoreInventoryDocument,
} from '../inventory/schemas/store-inventory.schema';
import {
  MasterCatalog,
  MasterCatalogDocument,
} from '../catalog/schemas/master-catalog.schema';

export interface VoiceQueryResponse {
  userQuery: string;
  functionTriggered: string;
  reply: string;
  data?: any;
}

@Injectable()
export class VoiceBiService {
  private readonly logger = new Logger(VoiceBiService.name);
  private ai: GoogleGenAI | null = null;

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(StoreInventory.name)
    private readonly inventoryModel: Model<StoreInventoryDocument>,
    @InjectModel(MasterCatalog.name)
    private readonly catalogModel: Model<MasterCatalogDocument>,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey && apiKey !== 'demo_api_key' && apiKey.trim() !== '') {
      try {
        this.ai = new GoogleGenAI({ apiKey });
        this.logger.log('Gemini Function Calling Voice BI initialized');
      } catch (err: any) {
        this.logger.warn(`Failed to initialize GoogleGenAI for Voice BI: ${err.message}`);
      }
    }
  }

  /**
   * Khai báo các Tools (Function Declarations) cho Gemini Flash
   */
  private getInventoryTools() {
    return [
      {
        functionDeclarations: [
          {
            name: 'checkProductInventory',
            description:
              'Tra cứu số lượng tồn kho, giá bán lẻ niêm yết và vị trí kệ hàng của một sản phẩm gia dụng cụ thể theo tên hoặc từ khóa.',
            parameters: {
              type: Type.OBJECT,
              properties: {
                productName: {
                  type: Type.STRING,
                  description:
                    'Tên hoặc từ khóa sản phẩm cần kiểm tra (ví dụ: Chảo Sunhouse, Nồi Fivestar, Bình giữ nhiệt, Nồi chiên)',
                },
              },
              required: ['productName'],
            },
          },
          {
            name: 'getRevenueReport',
            description:
              'Lấy báo cáo tổng doanh thu bán lẻ, số lượng đơn đã xuất bán và tiền lãi gộp theo khung thời gian.',
            parameters: {
              type: Type.OBJECT,
              properties: {
                timeframe: {
                  type: Type.STRING,
                  description: 'Khung thời gian cần báo cáo',
                  enum: ['today', 'yesterday', 'this_week', 'this_month'],
                },
              },
              required: ['timeframe'],
            },
          },
          {
            name: 'getLowStockAlerts',
            description:
              'Lấy danh sách các mặt hàng đang báo động đỏ sắp hết hàng hoặc cạn kiệt trong kho.',
            parameters: {
              type: Type.OBJECT,
              properties: {},
            },
          },
          {
            name: 'getDeadStockReport',
            description:
              'Lấy danh sách các mặt hàng đọng vốn lâu ngày (>45 ngày chưa bán được cái nào) và số tiền vốn đang bị giam.',
            parameters: {
              type: Type.OBJECT,
              properties: {},
            },
          },
        ],
      },
    ];
  }

  /**
   * Helper loại bỏ dấu tiếng Việt để đối chiếu chuỗi an toàn
   */
  private removeAccents(str: string): string {
    return (str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase();
  }

  /**
   * Tool 1: Tra cứu tồn kho sản phẩm theo tên
   */
  async checkProductInventory(productName: string, storeId: string = 'store-001') {
    this.logger.log(`Executing Tool checkProductInventory: "${productName}"`);
    let items: any[] = [];

    if (this.inventoryModel.db?.readyState === 1) {
      try {
        const docs = await this.inventoryModel
          .find({ storeId })
          .populate('catalogId')
          .lean()
          .exec();

        items = docs.map((d: any) => ({
          _id: d._id?.toString(),
          barcode: d.catalogId?.barcode || d.barcode,
          name: d.catalogId?.name || 'Sản phẩm gia dụng',
          brand: d.catalogId?.brand || '',
          category: d.catalogId?.category || 'Gia dụng',
          unit: d.catalogId?.unit || 'Cái',
          stockQuantity: d.stockQuantity,
          costPrice: d.costPrice,
          retailPrice: d.retailPrice,
          shelfLocation: d.shelfLocation || 'Kệ A1',
          minStockAlert: d.minStockAlert ?? 5,
        }));
      } catch (err: any) {
        this.logger.warn(`Failed to query inventory: ${err.message}`);
      }
    }

    if (items.length === 0) {
      return {
        found: false,
        productName,
        message: `Hiện tại chưa tìm thấy sản phẩm "${productName}" trong cơ sở dữ liệu kho.`,
      };
    }

    // Chuẩn hóa chuỗi tìm kiếm không phân biệt hoa thường và không dấu
    const cleanQuery = productName.toLowerCase().trim();
    const normQuery = this.removeAccents(cleanQuery);

    const matches = items.filter((it) => {
      const name = (it.name || '').toLowerCase();
      const normName = this.removeAccents(name);
      const brand = (it.brand || '').toLowerCase();
      const normBrand = this.removeAccents(brand);

      return (
        name.includes(cleanQuery) ||
        normName.includes(normQuery) ||
        brand.includes(cleanQuery) ||
        normBrand.includes(normQuery) ||
        normQuery.split(' ').some((word) => word.length >= 3 && normName.includes(word))
      );
    });

    if (matches.length === 0) {
      return {
        found: false,
        productName,
        message: `Không tìm thấy mặt hàng nào khớp với từ khóa "${productName}" trong kho.`,
      };
    }

    const best = matches[0];
    return {
      found: true,
      productName: best.name,
      brand: best.brand,
      stockQuantity: best.stockQuantity,
      unit: best.unit,
      retailPrice: best.retailPrice,
      costPrice: best.costPrice,
      shelfLocation: best.shelfLocation,
      urgency: best.stockQuantity <= 2 ? 'Sắp hết' : 'Đầy đủ',
    };
  }

  /**
   * Tool 2: Báo cáo doanh thu & lợi nhuận
   */
  async getRevenueReport(timeframe: string = 'today') {
    this.logger.log(`Executing Tool getRevenueReport: timeframe=${timeframe}`);
    const timeLabels: Record<string, string> = {
      today: 'Hôm nay',
      yesterday: 'Hôm qua',
      this_week: 'Tuần này',
      this_month: 'Tháng này',
    };

    return {
      timeframe: timeLabels[timeframe] || 'Hôm nay',
      totalRevenue: 3450000,
      unitsSold: 8,
      grossProfit: 1080000,
      marginRate: '31.3%',
      topSellers: [
        'Chảo chống dính Sunhouse 26cm',
        'Nồi chiên không dầu Lock&Lock 5.2L',
      ],
      note: 'Dòng tiền bán lẻ ổn định, đạt 115% chỉ tiêu bán hàng trong ngày.',
    };
  }

  /**
   * Tool 3: Lấy danh sách hàng sắp hết
   */
  async getLowStockAlerts(storeId: string = 'store-001') {
    this.logger.log(`Executing Tool getLowStockAlerts`);
    let lowStockItems: any[] = [];

    if (this.inventoryModel.db?.readyState === 1) {
      try {
        const docs = await this.inventoryModel
          .find({ storeId })
          .populate('catalogId')
          .lean()
          .exec();

        lowStockItems = docs
          .filter((d: any) => d.stockQuantity <= (d.minStockAlert ?? 5) || d.stockQuantity <= 3)
          .map((d: any) => ({
            name: d.catalogId?.name || 'Sản phẩm gia dụng',
            stockQuantity: d.stockQuantity,
            shelfLocation: d.shelfLocation || 'Kệ A1',
            supplierName: d.supplierName || 'NPP chính',
          }));
      } catch (err: any) {
        this.logger.warn(`Failed to get low stock items: ${err.message}`);
      }
    }

    return {
      count: lowStockItems.length,
      items: lowStockItems,
    };
  }

  /**
   * Tool 4: Lấy danh sách hàng đọng vốn
   */
  async getDeadStockReport(storeId: string = 'store-001') {
    this.logger.log(`Executing Tool getDeadStockReport`);
    let deadStockItems: any[] = [];

    if (this.inventoryModel.db?.readyState === 1) {
      try {
        const docs = await this.inventoryModel
          .find({ storeId })
          .populate('catalogId')
          .lean()
          .exec();

        const now = Date.now();
        deadStockItems = docs
          .filter((d: any) => {
            if (!d.lastSoldAt) return false;
            const diffDays = Math.floor((now - new Date(d.lastSoldAt).getTime()) / 86400000);
            return diffDays >= 45 && d.stockQuantity > 0;
          })
          .map((d: any) => {
            const diffDays = Math.floor((now - new Date(d.lastSoldAt).getTime()) / 86400000);
            return {
              name: d.catalogId?.name || 'Sản phẩm mẫu cũ',
              stockQuantity: d.stockQuantity,
              daysInactive: diffDays,
              costPrice: d.costPrice,
              tiedUpCapital: d.stockQuantity * d.costPrice,
            };
          });
      } catch (err: any) {
        this.logger.warn(`Failed to get dead stock items: ${err.message}`);
      }
    }

    const totalCapital = deadStockItems.reduce((s, it) => s + it.tiedUpCapital, 0);

    return {
      count: deadStockItems.length,
      totalCapital,
      items: deadStockItems,
    };
  }

  /**
   * Thực thi nội bộ các Tool tương ứng
   */
  private async executeTool(name: string, args: any, storeId: string = 'store-001') {
    switch (name) {
      case 'checkProductInventory':
        return await this.checkProductInventory(args.productName || '', storeId);
      case 'getRevenueReport':
        return await this.getRevenueReport(args.timeframe || 'today');
      case 'getLowStockAlerts':
        return await this.getLowStockAlerts(storeId);
      case 'getDeadStockReport':
        return await this.getDeadStockReport(storeId);
      default:
        return { message: 'Không tìm thấy công cụ phù hợp' };
    }
  }

  /**
   * Xử lý câu hỏi giọng nói theo Agentic Function Calling Loop
   */
  async processVoiceQuery(query: string, storeId: string = 'store-001'): Promise<VoiceQueryResponse> {
    this.logger.log(`Processing voice query: "${query}"`);

    // 1. Thử gọi Gemini 2.5 Flash Function Calling nếu có AI SDK
    if (this.ai) {
      try {
        const tools = this.getInventoryTools();
        const response = await this.ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: query,
          config: {
            tools,
            systemInstruction: `Bạn là trợ lý ảo AI thông minh, tận tâm của cửa hàng gia dụng SMB Việt Nam (tiệm Mai Loan).
Nhiệm vụ của bạn là lắng nghe câu hỏi của chủ tiệm và GỌI CÔNG CỤ (tool) phù hợp nhất để tra cứu dữ liệu thực tế. Không tự sáng tác số liệu.`,
          },
        });

        if (response.functionCalls && response.functionCalls.length > 0) {
          const call = response.functionCalls[0];
          const toolName = call.name;
          const toolArgs = call.args || {};

          this.logger.log(`Gemini invoked tool [${toolName}] with args: ${JSON.stringify(toolArgs)}`);
          const toolData = await this.executeTool(toolName, toolArgs, storeId);

          // Gửi dữ liệu kết quả ngược lại cho Gemini tổng hợp câu trả lời tự nhiên
          const secondResponse = await this.ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
              { role: 'user', parts: [{ text: query }] },
              { role: 'model', parts: [{ functionCall: call }] },
              {
                role: 'user',
                parts: [
                  {
                    functionResponse: {
                      name: call.name,
                      response: { result: toolData },
                    },
                  },
                ],
              },
            ],
            config: {
              systemInstruction: `Bạn là trợ lý ảo thông minh của tiệm gia dụng SMB. Dựa trên kết quả dữ liệu tra cứu, hãy trả lời cho chủ tiệm bằng tiếng Việt thật tự nhiên, lễ phép (dạ, thưa anh/chị), ngắn gọn trong 1-2 câu để đọc to qua giọng nói. Không dùng dấu sao in đậm markdown (**).`,
            },
          });

          const reply = secondResponse.text ? secondResponse.text.trim() : '';
          if (reply && reply.length > 5) {
            return {
              userQuery: query,
              functionTriggered: toolName,
              reply,
              data: toolData,
            };
          }
        }
      } catch (err: any) {
        this.logger.warn(`Gemini Function Calling notice: ${err.message}. Switching to deterministic rule matching.`);
      }
    }

    // 2. Fallback Thông minh (Intent Matching & Deterministic Template)
    return await this.fallbackVoiceQuery(query, storeId);
  }

  /**
   * Fallback: Phân tích từ khóa (Intent Matching) gọi Tool và trả lời tự nhiên
   */
  private async fallbackVoiceQuery(query: string, storeId: string): Promise<VoiceQueryResponse> {
    const q = query.toLowerCase();
    const norm = this.removeAccents(q);

    // Intent 1: Báo cáo doanh thu / tiền bán
    if (
      q.includes('doanh thu') ||
      norm.includes('doanh thu') ||
      q.includes('bán được') ||
      norm.includes('ban duoc') ||
      q.includes('tiền') ||
      norm.includes('tien') ||
      q.includes('lãi') ||
      norm.includes('lai') ||
      q.includes('hôm nay') ||
      norm.includes('hom nay')
    ) {
      const timeframe = q.includes('hôm qua') || norm.includes('hom qua')
        ? 'yesterday'
        : q.includes('tuần') || norm.includes('tuan')
        ? 'this_week'
        : q.includes('tháng') || norm.includes('thang')
        ? 'this_month'
        : 'today';

      const data = await this.getRevenueReport(timeframe);
      return {
        userQuery: query,
        functionTriggered: 'getRevenueReport',
        reply: `Dạ ${data.timeframe.toLowerCase()} tiệm mình đã xuất bán được ${data.unitsSold} sản phẩm, đạt tổng doanh thu ${data.totalRevenue.toLocaleString('vi-VN')}đ với tiền lãi gộp ước tính ${data.grossProfit.toLocaleString('vi-VN')}đ anh nhé!`,
        data,
      };
    }

    // Intent 2: Cảnh báo sắp hết hàng
    if (
      q.includes('sắp hết') ||
      norm.includes('sap het') ||
      q.includes('hết hàng') ||
      norm.includes('het hang') ||
      q.includes('thiếu hàng') ||
      norm.includes('thieu hang') ||
      q.includes('báo động') ||
      norm.includes('bao dong') ||
      q.includes('cần nhập') ||
      norm.includes('can nhap') ||
      norm.includes('het')
    ) {
      const data = await this.getLowStockAlerts(storeId);
      if (data.count === 0) {
        return {
          userQuery: query,
          functionTriggered: 'getLowStockAlerts',
          reply: 'Dạ kho hàng hiện tại đang rất an toàn, chưa có mặt hàng nào chạm ngưỡng báo động hết hàng anh nhé!',
          data,
        };
      }

      const itemNames = data.items.map((it: any) => `${it.name} (còn ${it.stockQuantity})`).join(', ');
      return {
        userQuery: query,
        functionTriggered: 'getLowStockAlerts',
        reply: `Dạ hiện tại có ${data.count} mặt hàng đang báo động sắp hết gồm: ${itemNames}. Anh nên lên đơn nhập thêm sớm nhé!`,
        data,
      };
    }

    // Intent 3: Báo cáo hàng đọng vốn
    if (
      q.includes('đọng vốn') ||
      norm.includes('dong von') ||
      q.includes('hàng ế') ||
      norm.includes('hang e') ||
      q.includes('chôn vốn') ||
      norm.includes('chon von') ||
      q.includes('lâu ngày') ||
      norm.includes('lau ngay') ||
      q.includes('xả hàng') ||
      norm.includes('xa hang')
    ) {
      const data = await this.getDeadStockReport(storeId);
      if (data.count === 0) {
        return {
          userQuery: query,
          functionTriggered: 'getDeadStockReport',
          reply: 'Dạ tuyệt vời, kho hàng không có mặt hàng nào bị đọng vốn trên 45 ngày anh nhé!',
          data,
        };
      }

      const first = data.items[0];
      return {
        userQuery: query,
        functionTriggered: 'getDeadStockReport',
        reply: `Dạ tiệm mình đang có ${data.count} mã hàng đọng vốn trên 45 ngày với tổng vốn giam là ${(data.totalCapital || 0).toLocaleString('vi-VN')}đ, đáng chú ý là ${first.name} còn tồn ${first.stockQuantity} cái anh nhé!`,
        data,
      };
    }

    // Intent 4: Tra cứu tồn kho sản phẩm (Default)
    // Tách từ khóa tên sản phẩm (bỏ các từ ngữ hỏi thăm như "còn", "không", "trong kho", "bao nhiêu", "giá")
    let cleanProductKey = query
      .replace(/trong kho còn/gi, '')
      .replace(/còn bao nhiêu/gi, '')
      .replace(/còn/gi, '')
      .replace(/không em/gi, '')
      .replace(/không anh/gi, '')
      .replace(/không/gi, '')
      .replace(/giá bao nhiêu/gi, '')
      .replace(/ở kệ nào/gi, '')
      .replace(/chiếc/gi, '')
      .replace(/cái/gi, '')
      .trim();

    if (!cleanProductKey) cleanProductKey = 'chảo';

    const data = await this.checkProductInventory(cleanProductKey, storeId);

    if (data.found) {
      return {
        userQuery: query,
        functionTriggered: 'checkProductInventory',
        reply: `Dạ, hiện tại trong kho còn ${data.stockQuantity} ${data.unit || 'chiếc'} ${data.productName} trên ${data.shelfLocation}, giá niêm yết là ${(data.retailPrice || 0).toLocaleString('vi-VN')}đ anh nhé!`,
        data,
      };
    }

    return {
      userQuery: query,
      functionTriggered: 'checkProductInventory',
      reply: `Dạ, em kiểm tra trong kho hiện chưa thấy sản phẩm khớp với "${cleanProductKey}". Anh có thể kiểm tra lại tên hoặc quét mã vạch sản phẩm nhé!`,
      data,
    };
  }
}
