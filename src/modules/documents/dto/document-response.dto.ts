import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DocumentResponseDto {
  @ApiProperty({ description: '文档ID' })
  id: string;

  @ApiProperty({ description: '文档标题' })
  title: string;

  @ApiProperty({ description: '文件名' })
  filename: string;

  @ApiProperty({ description: '原始文件名' })
  originalName: string;

  @ApiProperty({ description: 'MIME类型' })
  mimeType: string;

  @ApiProperty({ description: '文件大小（字节）' })
  size: number;

  @ApiProperty({ description: '文件路径' })
  path: string;

  @ApiPropertyOptional({ description: '提取的文本内容' })
  content?: string;

  @ApiPropertyOptional({ description: 'AI生成的摘要' })
  summary?: string;

  @ApiPropertyOptional({ description: '检测到的语言' })
  language?: string;

  @ApiPropertyOptional({ description: '页数' })
  pageCount?: number;

  @ApiPropertyOptional({ description: '字数' })
  wordCount?: number;

  @ApiProperty({ description: '处理状态' })
  status: string;

  @ApiPropertyOptional({ description: '错误信息' })
  errorMessage?: string;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: '处理完成时间' })
  processedAt?: Date;

  @ApiProperty({ description: '用户ID' })
  userId: string;

  @ApiPropertyOptional({ description: '文档分块数量' })
  chunksCount?: number;
}