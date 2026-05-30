import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ContentCategory, ContentStatus } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateContentDto {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty({ description: 'Lien YouTube (live ou VOD) ou flux HLS/MP4' })
  @IsString()
  videoUrl!: string;

  @ApiPropertyOptional({ enum: ContentCategory })
  @IsOptional()
  @IsEnum(ContentCategory)
  category?: ContentCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  speaker?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  series?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  duration?: string;

  @ApiPropertyOptional({ description: 'Type : live (true) ou vidéo (false)' })
  @IsOptional()
  @IsBoolean()
  isLive?: boolean;

  @ApiPropertyOptional({ description: 'Mise en avant ("à la une")' })
  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({ enum: ContentStatus })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;
}

export class UpdateContentDto extends PartialType(CreateContentDto) {}
