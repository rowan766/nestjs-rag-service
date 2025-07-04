import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateChatSessionDto {
  @ApiPropertyOptional({ description: '会话标题' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: '会话描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: '系统提示词' })
  @IsString()
  @IsOptional()
  systemPrompt?: string;

  @ApiPropertyOptional({ 
    description: '使用的模型',
    default: 'gpt-3.5-turbo'
  })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiPropertyOptional({ 
    description: '温度参数 (0-1)',
    default: 0.7
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  temperature?: number;

  @ApiPropertyOptional({ description: '最大令牌数' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  maxTokens?: number;
}

export class UpdateChatSessionDto {
  @ApiPropertyOptional({ description: '会话标题' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: '会话描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: '是否激活' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class ChatSessionResponseDto {
  @ApiProperty({ description: '会话ID' })
  id: string;

  @ApiProperty({ description: '会话标题' })
  title: string;

  @ApiPropertyOptional({ description: '会话描述' })
  description?: string;

  @ApiPropertyOptional({ description: '系统提示词' })
  systemPrompt?: string;

  @ApiProperty({ description: '使用的模型' })
  model: string;

  @ApiProperty({ description: '温度参数' })
  temperature: number;

  @ApiPropertyOptional({ description: '最大令牌数' })
  maxTokens?: number;

  @ApiProperty({ description: '是否激活' })
  isActive: boolean;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;

  @ApiProperty({ description: '用户ID' })
  userId: string;

  @ApiPropertyOptional({ description: '消息数量' })
  messageCount?: number;
}