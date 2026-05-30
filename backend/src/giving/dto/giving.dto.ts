import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateDonationDto {
  @ApiProperty({ example: 50, description: 'Montant en USD' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  amount!: number;

  @ApiProperty({ example: 'general' })
  @IsString()
  fundId!: string;

  @ApiProperty({ example: 'mpesa' })
  @IsString()
  method!: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  anonymous?: boolean;

  @ApiPropertyOptional({ description: 'Numéro mobile money (momo)' })
  @IsOptional()
  @IsString()
  phone?: string;
}

export class TopupWalletDto {
  @ApiProperty({ example: 50, description: 'Nombre de coins (1 coin = 1 USD)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  coins!: number;

  @ApiProperty({ example: 'mpesa' })
  @IsString()
  method!: string;
}

export class SetDefaultFundDto {
  @ApiProperty({ example: 'general' })
  @IsString()
  fundId!: string;
}

export class SendToFundDto {
  @ApiProperty({ example: 25, description: 'Nombre de coins à envoyer (1 coin = 1 USD)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  coins!: number;

  @ApiProperty({ example: 'general' })
  @IsString()
  fundId!: string;
}

export class WebhookDto {
  @ApiProperty()
  @IsString()
  ref!: string;

  @ApiProperty({ example: 'received', enum: ['received', 'failed'] })
  @IsString()
  status!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  providerRef?: string;
}
