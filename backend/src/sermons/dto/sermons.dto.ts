import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ContentStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateSermonDto {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsString()
  speaker!: string;

  @ApiProperty()
  @IsString()
  date!: string;

  @ApiProperty()
  @IsString()
  duration!: string;

  @ApiProperty()
  @IsString()
  series!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  live?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ enum: ContentStatus })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;
}

export class UpdateSermonDto extends PartialType(CreateSermonDto) {}

export class SendAmenDto {
  @ApiProperty({ example: 1, description: 'Coins envoyés' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  coins!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fundId?: string;
}

export class UpdateLiveDto {
  @ApiPropertyOptional({ enum: ['offline', 'live', 'ended'] })
  @IsOptional()
  @IsString()
  state?: 'offline' | 'live' | 'ended';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sceneActive?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  viewersLive?: number;
}
