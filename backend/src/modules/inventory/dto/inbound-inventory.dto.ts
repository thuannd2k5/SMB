import {
  IsNotEmpty,
  IsString,
  IsNumber,
  Min,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ProductInfoDto {
  @IsNotEmpty({ message: 'Tên sản phẩm không được để trống' })
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  specs?: Record<string, any>;

  @IsOptional()
  @IsNumber()
  suggestedRetailPriceMin?: number;

  @IsOptional()
  @IsNumber()
  suggestedRetailPriceMax?: number;
}

export class InventoryInboundDetailDto {
  @IsNotEmpty({ message: 'Số lượng nhập không được để trống' })
  @IsNumber()
  @Min(1, { message: 'Số lượng nhập tối thiểu là 1' })
  stockQuantity: number;

  @IsNotEmpty({ message: 'Giá vốn không được để trống' })
  @IsNumber()
  @Min(0, { message: 'Giá vốn phải >= 0' })
  costPrice: number;

  @IsNotEmpty({ message: 'Giá bán lẻ không được để trống' })
  @IsNumber()
  @Min(0, { message: 'Giá bán lẻ phải >= 0' })
  retailPrice: number;

  @IsOptional()
  @IsString()
  shelfLocation?: string;

  @IsOptional()
  @IsString()
  supplierName?: string;

  @IsOptional()
  @IsString()
  supplierPhone?: string;

  @IsOptional()
  @IsString()
  storeId?: string;
}

export class InboundInventoryDto {
  @IsNotEmpty({ message: 'Mã vạch không được để trống' })
  @IsString()
  barcode: string;

  @IsNotEmpty({ message: 'Thông tin sản phẩm không được để trống' })
  @ValidateNested()
  @Type(() => ProductInfoDto)
  productData: ProductInfoDto;

  @IsNotEmpty({ message: 'Thông tin tồn kho không được để trống' })
  @ValidateNested()
  @Type(() => InventoryInboundDetailDto)
  inventoryData: InventoryInboundDetailDto;
}
