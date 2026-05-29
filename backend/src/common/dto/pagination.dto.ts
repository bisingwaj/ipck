import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

/** Query params de pagination/tri/recherche standard (cf. api-spec.md §1.1). */
export class PaginationQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 20;

  @ApiPropertyOptional({ description: 'Champ:direction, ex. createdAt:desc' })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({ description: 'Recherche plein texte' })
  @IsOptional()
  @IsString()
  q?: string;

  get skip(): number {
    return (this.page - 1) * this.pageSize;
  }

  get take(): number {
    return this.pageSize;
  }

  /** Parse `champ:direction` en objet orderBy Prisma. */
  orderBy(
    allowed: string[],
    fallback: Record<string, 'asc' | 'desc'>,
  ): Record<string, 'asc' | 'desc'> {
    if (!this.sort) return fallback;
    const [field, dir] = this.sort.split(':');
    if (!allowed.includes(field)) return fallback;
    return { [field]: dir === 'asc' ? 'asc' : 'desc' };
  }
}
