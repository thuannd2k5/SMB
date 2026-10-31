import { IsNotEmpty, IsString, IsNumber, Min, IsOptional } from 'class-validator';

export class SmartPricingDto {
  @IsNotEmpty({ message: 'Tên sản phẩm không được để trống' })
  @IsString({ message: 'Tên sản phẩm phải là chuỗi' })
  productName: string;

  @IsNotEmpty({ message: 'Giá vốn không được để trống' })
  @IsNumber({}, { message: 'Giá vốn phải là số' })
  @Min(0, { message: 'Giá vốn phải >= 0' })
  costPrice: number;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsString()
  category?: string;
}
