import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChatSessionResponseDto } from './chat-session.dto';

export enum MessageRole {
  USER = 'USER',
  ASSISTANT = 'ASSISTANT',
  SYSTEM = 'SYSTEM',
}

export class CreateChatMessageDto {
  @ApiProperty({ description: '消息内容' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ 
    description: '消息角色',
    enum: MessageRole,
    default: MessageRole.USER
  })
  @IsEnum(MessageRole)
  role: MessageRole;

  @ApiPropertyOptional({ description: '会话ID' })
  @IsString()
  @IsOptional()
  sessionId?: string;

  @ApiPropertyOptional({ description: '是否触发 RAG 搜索' })
  @IsOptional()
  enableRag?: boolean = true;
}

export class ChatMessageResponseDto {
  @ApiProperty({ description: '消息ID' })
  id: string;

  @ApiProperty({ description: '消息内容' })
  content: string;

  @ApiProperty({ description: '消息角色', enum: MessageRole })
  role: MessageRole;

  @ApiPropertyOptional({ description: 'RAG 上下文信息' })
  context?: any;

  @ApiPropertyOptional({ description: '引用的文档源' })
  sources?: string[];

  @ApiPropertyOptional({ description: '消息元数据' })
  metadata?: any;

  @ApiPropertyOptional({ description: 'Token 使用量' })
  tokenCount?: number;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '会话ID' })
  sessionId: string;
}

export class ChatConversationDto {
  @ApiProperty({ description: '会话信息', type: ChatSessionResponseDto })
  session: ChatSessionResponseDto; // 会用到 ChatSessionResponseDto，先用 any

  @ApiProperty({ 
    description: '消息列表',
    type: [ChatMessageResponseDto]
  })
  messages: ChatMessageResponseDto[];

  @ApiProperty({ description: '总消息数' })
  totalMessages: number;
}