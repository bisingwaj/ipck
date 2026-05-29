import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, Length } from 'class-validator';

export class RequestOtpDto {
  @ApiProperty({ example: '+243810000000', description: 'Numéro au format E.164' })
  @IsString()
  @Matches(/^\+[1-9]\d{6,14}$/, { message: 'phone doit être un numéro E.164 valide' })
  phone!: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: '+243810000000' })
  @IsString()
  @Matches(/^\+[1-9]\d{6,14}$/, { message: 'phone doit être un numéro E.164 valide' })
  phone!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(4, 8)
  code!: string;
}

export class RefreshDto {
  @ApiProperty()
  @IsString()
  refreshToken!: string;
}
