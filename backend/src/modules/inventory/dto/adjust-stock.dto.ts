import {
  IsNotEmpty,
  IsString,
  IsIn,
  IsNumber,
  Min,
  IsOptional,
} from 'class-validator';

export class AdjustStockDto {
  @IsNotEmpty({ message: 'inventoryId không được để trống' })
  @IsString()
  inventoryId: string;

  @IsNotEmpty({ message: 'Loại điều chỉnh không được để trống' })
  @IsIn(['OUT', 'IN', 'SET'], {
    message: 'adjustmentType phải là OUT (Xuất), IN (Nhập) hoặc SET (Kiểm kê)',
  })
  adjustmentType: 'OUT' | 'IN' | 'SET';

  @IsNotEmpty({ message: 'Số lượng không được để trống' })
  @IsNumber()
  @Min(0, { message: 'Số lượng phải >= 0' })
  quantity: number;

  @IsOptional()
  @IsString()
  note?: string;
}
