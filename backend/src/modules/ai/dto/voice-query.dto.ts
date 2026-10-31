import { IsNotEmpty, IsString } from 'class-validator';

export class VoiceQueryDto {
  @IsNotEmpty({ message: 'Câu hỏi giọng nói không được để trống' })
  @IsString({ message: 'Câu hỏi giọng nói phải là chuỗi ký tự' })
  query: string;
}
