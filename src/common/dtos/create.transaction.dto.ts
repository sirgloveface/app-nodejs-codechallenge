import { IsUUID, IsInt, IsNotEmpty, IsPositive } from 'class-validator';

export class CreateTransactionDto {
  @IsUUID()
  @IsNotEmpty()
  accountExternalIdDebit: string;

  @IsUUID()
  @IsNotEmpty()
  accountExternalIdCredit: string;

  @IsInt()
  @IsNotEmpty()
  tranferTypeId: number;

  @IsPositive()
  @IsNotEmpty()
  value: number;
}
