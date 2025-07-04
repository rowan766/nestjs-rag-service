import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RagService } from '../rag/rag.service';
import { RagSourceDto } from '../rag/dto/rag-response.dto'; 
import { CreateChatSessionDto, UpdateChatSessionDto, ChatSessionResponseDto } from './dto/chat-session.dto';
import { CreateChatMessageDto, ChatMessageResponseDto, ChatConversationDto, MessageRole } from './dto/chat-message.dto';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ragService: RagService,
  ) {}

  // 会话管理
  async createSession(
    createSessionDto: CreateChatSessionDto,
    userId: string,
  ): Promise<ChatSessionResponseDto> {
    try {
      const session = await this.prisma.ragChatSession.create({
        data: {
          title: createSessionDto.title || '新对话',
          description: createSessionDto.description,
          systemPrompt: createSessionDto.systemPrompt,
          model: createSessionDto.model || 'gpt-3.5-turbo',
          temperature: createSessionDto.temperature || 0.7,
          maxTokens: createSessionDto.maxTokens,
          userId,
        },
      });

      return this.mapSessionToResponseDto(session);
    } catch (error) {
      this.logger.error('创建会话失败', error.stack);
      throw new BadRequestException('创建会话失败');
    }
  }

  async getUserSessions(userId: string): Promise<ChatSessionResponseDto[]> {
    const sessions = await this.prisma.ragChatSession.findMany({
      where: { userId, isActive: true },
      include: {
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return sessions.map(session => ({
      ...this.mapSessionToResponseDto(session),
      messageCount: session._count.messages,
    }));
  }

  async getSession(sessionId: string, userId: string): Promise<ChatSessionResponseDto> {
    const session = await this.prisma.ragChatSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('会话不存在');
    }

    return {
      ...this.mapSessionToResponseDto(session),
      messageCount: session._count.messages,
    };
  }

  async updateSession(
    sessionId: string,
    updateSessionDto: UpdateChatSessionDto,
    userId: string,
  ): Promise<ChatSessionResponseDto> {
    const session = await this.prisma.ragChatSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('会话不存在');
    }

    const updatedSession = await this.prisma.ragChatSession.update({
      where: { id: sessionId },
      data: updateSessionDto,
    });

    return this.mapSessionToResponseDto(updatedSession);
  }

  async deleteSession(sessionId: string, userId: string): Promise<void> {
    const session = await this.prisma.ragChatSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('会话不存在');
    }

    await this.prisma.ragChatSession.update({
      where: { id: sessionId },
      data: { isActive: false },
    });
  }

  // 消息管理
  async sendMessage(
    createMessageDto: CreateChatMessageDto,
    userId: string,
  ): Promise<ChatMessageResponseDto> {
    try {
      // 如果没有指定会话，创建新会话
      let sessionId = createMessageDto.sessionId;
      if (!sessionId) {
        const newSession = await this.createSession({
          title: `对话 - ${new Date().toLocaleString()}`,
        }, userId);
        sessionId = newSession.id;
      }

      // 保存用户消息
      const userMessage = await this.prisma.ragChatMessage.create({
        data: {
          content: createMessageDto.content,
          role: createMessageDto.role,
          sessionId,
        },
      });

      // 如果是用户消息且启用了 RAG，生成回复
      if (createMessageDto.role === MessageRole.USER && createMessageDto.enableRag) {
        const assistantReply = await this.generateRagResponse(
          createMessageDto.content,
          sessionId,
          userId,
        );
        
        // 返回助手回复
        return assistantReply;
      }

      return this.mapMessageToResponseDto(userMessage);
    } catch (error) {
      this.logger.error('发送消息失败', error.stack);
      throw new BadRequestException('发送消息失败');
    }
  }

  async getConversation(sessionId: string, userId: string): Promise<ChatConversationDto> {
    const session = await this.getSession(sessionId, userId);

    const messages = await this.prisma.ragChatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });

    return {
      session,
      messages: messages.map(msg => this.mapMessageToResponseDto(msg)),
      totalMessages: messages.length,
    };
  }

  private async generateRagResponse(
    question: string,
    sessionId: string,
    userId: string,
  ): Promise<ChatMessageResponseDto> {
    // 获取对话历史
    console.log('=== Chat RAG Debug ===');
    console.log('Question:', question);
    console.log('UserId:', userId);
    const recentMessages = await this.prisma.ragChatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      take: 6, // 最近3轮对话
    });

    const conversationHistory = recentMessages
      .reverse()
      .map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

    // 调用 RAG 服务
    const ragResponse = await this.ragService.query({
      question,
      topK: 5,
      userId,
      conversationHistory,
    });

    console.log('RAG Response:', ragResponse);
    console.log('=====================');

    // 保存助手回复
    const assistantMessage = await this.prisma.ragChatMessage.create({
      data: {
        content: ragResponse.answer,
        role: MessageRole.ASSISTANT,
        context:ragResponse.sources as any,
        sources: ragResponse.sources.map(source => source.documentId),
        metadata: {
          confidence: ragResponse.confidence,
          model: ragResponse.model,
          processingTime: ragResponse.processingTime,
        },
        sessionId,
      },
    });

    return this.mapMessageToResponseDto(assistantMessage);
  }

  private mapSessionToResponseDto(session: any): ChatSessionResponseDto {
    return {
      id: session.id,
      title: session.title,
      description: session.description,
      systemPrompt: session.systemPrompt,
      model: session.model,
      temperature: session.temperature,
      maxTokens: session.maxTokens,
      isActive: session.isActive,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      userId: session.userId,
    };
  }

  private mapMessageToResponseDto(message: any): ChatMessageResponseDto {
    return {
      id: message.id,
      content: message.content,
      role: message.role,
      context: message.context,
      sources: message.sources,
      metadata: message.metadata,
      tokenCount: message.tokenCount,
      createdAt: message.createdAt,
      sessionId: message.sessionId,
    };
  }
}