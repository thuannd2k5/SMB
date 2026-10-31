import { IsNotEmpty, IsString } from 'class-validator';

export class RetrieveBarcodeDto {
  @IsNotEmpty({ message: 'Mã vạch không được để trống' })
  @IsString({ message: 'Mã vạch phải là chuỗi ký tự số' })
  barcode: string;
}
