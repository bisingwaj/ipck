import { ApiProperty } from '@nestjs/swagger';
import { PrayerStatus, PrayerVisibility } from '@prisma/client';
import { IsEnum, IsString, MaxLength } from 'class-validator';

export class CreatePrayerDto {
  @ApiProperty()
  @IsString()
  @MaxLength(1000)
  text!: string;

  @ApiProperty({ enum: PrayerVisibility })
  @IsEnum(PrayerVisibility)
  visibility!: PrayerVisibility;
}

export class UpdatePrayerStatusDto {
  @ApiProperty({ enum: PrayerStatus })
  @IsEnum(PrayerStatus)
  status!: PrayerStatus;
}

export class RespondPrayerDto {
  @ApiProperty()
  @IsString()
  @MaxLength(1000)
  message!: string;
}

export class CreateEncouragementDto {
  @ApiProperty()
  @IsString()
  @MaxLength(500)
  text!: string;
}
