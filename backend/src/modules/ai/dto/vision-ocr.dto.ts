import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class VisionOcrDto {
  @IsNotEmpty({ message: 'Dữ liệu hình ảnh (Base64) không được để trống' })
  @IsString({ message: 'Ảnh phải ở định dạng chuỗi Base64' })
  image: string;

  @IsOptional()
  @IsString()
  mimeType?: string;
}
