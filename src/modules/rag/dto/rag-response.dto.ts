
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RagSourceDto {
  @ApiProperty({ description: '文档ID' })
  documentId: string;

  @ApiProperty({ description: '文档标题' })
  documentTitle: string;

  @ApiProperty({ description: '文档文件名' })
  filename: string;

  @ApiProperty({ description: '相关内容片段' })
  content: string;

  @ApiProperty({ description: '相似度分数' })
  score: number;

  @ApiProperty({ description: '分块索引' })
  chunkIndex: number;
}

export class RagResponseDto {
  @ApiProperty({ description: '用户问题' })
  question: string;

  @ApiProperty({ 
    description: 'AI生成的回答',
    example: '根据文档显示，张欢的出差目的地是随州。'
  })
  answer: string;

  @ApiProperty({ 
    description: '相关文档来源',
    type: [RagSourceDto],
  })
  sources: RagSourceDto[];

  @ApiProperty({ description: '置信度分数 (0-1)' })
  confidence: number;

  @ApiPropertyOptional({ description: '使用的模型' })
  model?: string;

  @ApiPropertyOptional({ description: '消耗的token数量' })
  tokensUsed?: number;

  @ApiProperty({ description: '响应时间戳' })
  timestamp: Date;

  @ApiPropertyOptional({ description: '处理时长(毫秒)' })
  processingTime?: number;
}

export class RagStreamResponseDto {
  @ApiProperty({ description: '流式响应类型' })
  type: 'delta' | 'sources' | 'done';

  @ApiPropertyOptional({ description: '增量文本内容' })
  content?: string;

  @ApiPropertyOptional({ 
    description: '文档来源（仅在 type=sources 时返回）',
    type: [RagSourceDto],
  })
  sources?: RagSourceDto[];

  @ApiPropertyOptional({ description: '是否完成（仅在 type=done 时返回）' })
  finished?: boolean;
}