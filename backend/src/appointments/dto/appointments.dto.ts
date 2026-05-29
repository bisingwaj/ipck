import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty({ example: 'counseling' })
  @IsString()
  topicId!: string;

  @ApiProperty({ example: '2026-06-02T14:00:00.000Z' })
  @IsDateString()
  slotStart!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class UpdateAppointmentDto {
  @ApiPropertyOptional({ enum: AppointmentStatus })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pastorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  slotStart?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;
}
