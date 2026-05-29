import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ContentStatus } from '@prisma/client';
import { IsArray, IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateDevotionalDto {
  @ApiProperty()
  @IsString()
  date!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiProperty()
  @IsString()
  verseRef!: string;

  @ApiProperty()
  @IsString()
  verseText!: string;

  @ApiProperty()
  @IsString()
  body!: string;

  @ApiProperty()
  @IsString()
  prayer!: string;

  @ApiProperty()
  @IsString()
  applyTitle!: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  applySteps!: string[];

  @ApiPropertyOptional({ enum: ContentStatus })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  publishAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  author?: string;
}

export class UpdateDevotionalDto extends PartialType(CreateDevotionalDto) {}
