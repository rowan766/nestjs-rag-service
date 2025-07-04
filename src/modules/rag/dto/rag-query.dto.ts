import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RagQueryDto {
  @ApiProperty({ 
    description: '用户问题',
    example: '张欢的出差目的地是哪里？'
  })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiPropertyOptional({ 
    description: '返回相关文档数量',
    default: 5,
    minimum: 1,
    maximum: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  @Type(() => Number)
  topK?: number = 5;

  @ApiPropertyOptional({ 
    description: '过滤特定文档ID',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documentIds?: string[];

  @ApiPropertyOptional({ description: '过滤特定用户ID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    description: '对话历史上下文',
    example: [
      { role: 'user', content: '你好' },
      { role: 'assistant', content: '您好！有什么可以帮助您的吗？' }
    ]
  })
  @IsOptional()
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}