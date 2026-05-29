import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class MarkReadDto {
  @ApiPropertyOptional({ type: [String], description: 'IDs à marquer lus (tous si vide)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ids?: string[];
}

export class BroadcastDto {
  @ApiPropertyOptional({ example: 'all', description: 'all | devo-subscribers' })
  @IsOptional()
  @IsString()
  audience?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(120)
  title!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(500)
  body!: string;
}
