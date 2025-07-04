import { Controller, Get, Post, Body, Param, Patch, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse ,ApiProperty} from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { IsString, IsNotEmpty } from 'class-validator';
import { CreateChatSessionDto, UpdateChatSessionDto, ChatSessionResponseDto } from './dto/chat-session.dto';
import { CreateChatMessageDto, ChatMessageResponseDto, ChatConversationDto } from './dto/chat-message.dto';

class QuickChatDto {
  @ApiProperty({ description: '消息内容', example: '张欢的出差目的地是哪里？' })
  @IsString()
  @IsNotEmpty()
  message: string;
}


@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // 会话管理
  @Post('sessions')
  @ApiOperation({ summary: '创建新会话' })
  @ApiResponse({ type: ChatSessionResponseDto })
  createSession(@Body() createSessionDto: CreateChatSessionDto) {
    // 临时使用固定用户ID，后续添加认证后从JWT获取
    const userId = 'temp-user-id';
    return this.chatService.createSession(createSessionDto, userId);
  }

  @Get('sessions')
  @ApiOperation({ summary: '获取用户会话列表' })
  @ApiResponse({ type: [ChatSessionResponseDto] })
  getUserSessions() {
    const userId = 'temp-user-id';
    return this.chatService.getUserSessions(userId);
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: '获取会话详情' })
  @ApiResponse({ type: ChatSessionResponseDto })
  getSession(@Param('id') sessionId: string) {
    const userId = 'temp-user-id';
    return this.chatService.getSession(sessionId, userId);
  }

  @Patch('sessions/:id')
  @ApiOperation({ summary: '更新会话' })
  @ApiResponse({ type: ChatSessionResponseDto })
  updateSession(
    @Param('id') sessionId: string,
    @Body() updateSessionDto: UpdateChatSessionDto,
  ) {
    const userId = 'temp-user-id';
    return this.chatService.updateSession(sessionId, updateSessionDto, userId);
  }

  @Delete('sessions/:id')
  @ApiOperation({ summary: '删除会话' })
  deleteSession(@Param('id') sessionId: string) {
    const userId = 'temp-user-id';
    return this.chatService.deleteSession(sessionId, userId);
  }

  // 消息管理
  @Post('messages')
  @ApiOperation({ 
    summary: '发送消息',
    description: '发送消息到指定会话，支持自动RAG回复'
  })
  @ApiResponse({ type: ChatMessageResponseDto })
  sendMessage(@Body() createMessageDto: CreateChatMessageDto) {
    const userId = 'temp-user-id';
    return this.chatService.sendMessage(createMessageDto, userId);
  }

  @Get('sessions/:id/conversation')
  @ApiOperation({ summary: '获取会话对话记录' })
  @ApiResponse({ type: ChatConversationDto })
  getConversation(@Param('id') sessionId: string) {
    const userId = 'temp-user-id';
    return this.chatService.getConversation(sessionId, userId);
  }



  // 快捷聊天接口
  @Post('quick')
  @ApiOperation({ 
    summary: '快速聊天',
    description: '发送消息并自动创建会话，适合单次问答'
  })
  @ApiResponse({ type: ChatMessageResponseDto })
  quickChat(@Body() body: QuickChatDto) {
    const userId = 'temp-user-id';
    return this.chatService.sendMessage({
      content: body.message,
      role: 'USER' as any,
      enableRag: true,
    }, userId);
  }
}