import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VectorSearchDto {
  @ApiProperty({ description: '搜索查询文本' })
  @IsString()
  @IsNotEmpty()
  query: string;

  @ApiPropertyOptional({ 
    description: '返回结果数量',
    default: 5,
    minimum: 1,
    maximum: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  @Type(() => Number)
  k?: number = 5;

  @ApiPropertyOptional({ description: '过滤特定文档ID' })
  @IsOptional()
  @IsString()
  documentId?: string;

  @ApiPropertyOptional({ description: '过滤特定用户ID' })
  @IsOptional()
  @IsString()
  userId?: string;
}

export class VectorSearchResultDto {
  @ApiProperty({ description: '分块ID' })
  id: string;

  @ApiProperty({ description: '文本内容' })
  content: string;

  @ApiProperty({ description: '相似度分数' })
  score: number;

  @ApiProperty({ description: '所属文档信息' })
  document: {
    id: string;
    title: string;
    filename: string;
  };

  @ApiProperty({ description: '分块元数据' })
  metadata: any;
}