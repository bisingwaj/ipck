import { ApiProperty } from '@nestjs/swagger';

/** Enveloppe de pagination standard `{ data, page, pageSize, total }`. */
export class Paginated<T> {
  @ApiProperty({ isArray: true })
  data: T[];

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;

  @ApiProperty()
  total: number;

  constructor(data: T[], total: number, page: number, pageSize: number) {
    this.data = data;
    this.total = total;
    this.page = page;
    this.pageSize = pageSize;
  }
}

export function paginate<T>(
  data: T[],
  total: number,
  query: { page: number; pageSize: number },
): Paginated<T> {
  return new Paginated(data, total, query.page, query.pageSize);
}
