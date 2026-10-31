import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private ai: GoogleGenAI | null = null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('gemini.apiKey');
    if (apiKey) {
      try {
        this.ai = new GoogleGenAI({ apiKey });
        this.logger.log('Google GenAI SDK initialized successfully');
      } catch (err) {
        this.logger.warn(`Failed to initialize Google GenAI SDK: ${err.message}`);
      }
    } else {
      this.logger.warn('GEMINI_API_KEY is not set. AI features will require key configuration.');
    }
  }

  getStatus() {
    return {
      initialized: !!this.ai,
      model: 'gemini-2.5-flash',
      readyForIngestion: true,
      message: 'Gemini AI Retrieval Module initialized. Ready for Task 1.3.',
    };
  }
}
