import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { GeminiService } from './gemini.service';

@Module({
  controllers: [AiController],
  providers: [AiService, GeminiService],
  exports: [AiService, GeminiService],
})
export class AiModule {}
