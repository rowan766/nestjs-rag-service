import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationDto {
  @ApiPropertyOptional({
    description: '页码',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: '每页数量',
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;
}

export class PaginatedResponseDto<T> {
  data: T[];
  
  @ApiPropertyOptional({ description: '总数量' })
  total: number;
  
  @ApiPropertyOptional({ description: '当前页码' })
  page: number;
  
  @ApiPropertyOptional({ description: '每页数量' })
  limit: number;
  
  @ApiPropertyOptional({ description: '总页数' })
  totalPages: number;
  
  @ApiPropertyOptional({ description: '是否有下一页' })
  hasNext: boolean;
  
  @ApiPropertyOptional({ description: '是否有上一页' })
  hasPrev: boolean;

  constructor(data: T[], total: number, page: number, limit: number) {
    this.data = data;
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.totalPages = Math.ceil(total / limit);
    this.hasNext = page < this.totalPages;
    this.hasPrev = page > 1;
  }
}