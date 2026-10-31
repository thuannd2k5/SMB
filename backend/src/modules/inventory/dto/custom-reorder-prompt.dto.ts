import { IsNotEmpty, IsString, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ReorderItemDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  quantity: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  costPrice?: number;
}

export class CustomReorderPromptDto {
  @IsNotEmpty({ message: 'Tên nhà cung cấp không được để trống' })
  @IsString()
  supplierName: string;

  @IsOptional()
  @IsString()
  supplierPhone?: string;

  @IsOptional()
  @IsString()
  storeName?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderItemDto)
  items: ReorderItemDto[];

  @IsNotEmpty({ message: 'Yêu cầu tùy biến cho AI không được để trống' })
  @IsString()
  customPrompt: string;

  @IsOptional()
  @IsString()
  expectedDeliveryTime?: string;
}
