import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';
import { VectorstoreService } from '../vectorstore/vectorstore.service';
import { RagQueryDto } from './dto/rag-query.dto';
import { RagResponseDto, RagSourceDto } from './dto/rag-response.dto';

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);
  private readonly openai: OpenAI;

  constructor(
    private readonly vectorstoreService: VectorstoreService,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('langchain.openaiApiKey');
    console.log('=== OpenAI Config Debug ===');
    console.log('API Key exists:', !!apiKey);
    console.log('API Key length:', apiKey?.length || 0);
    console.log('API Key prefix:', apiKey?.substring(0, 8) + '...');
    console.log('========================');
    if (!apiKey) {
      this.logger.warn('OpenAI API Key 未配置，RAG 功能将受限');
    }
    
    this.openai = new OpenAI({
      apiKey: apiKey || 'dummy-key',
        timeout: 30000, // 👈 增加到60秒
        maxRetries: 2,   // 👈 重试2次
    });
  }

  async query(ragQueryDto: RagQueryDto): Promise<RagResponseDto> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`处理 RAG 查询: "${ragQueryDto.question}"`);

      // 1. 检索相关文档
      const searchResults = await this.vectorstoreService.similaritySearch({
        query: ragQueryDto.question,
        k: ragQueryDto.topK || 5,
        documentId: ragQueryDto.documentIds?.[0],
        userId: ragQueryDto.userId,
      });

      if (searchResults.length === 0) {
        return this.createEmptyResponse(ragQueryDto.question, startTime);
      }

      // 2. 构建上下文
      const context = this.buildContext(searchResults);
      
      // 3. 生成回答
      const answer = await this.generateAnswer(
        ragQueryDto.question,
        context,
        ragQueryDto.conversationHistory,
      );

      // 4. 构建源信息
      const sources: RagSourceDto[] = searchResults.map(result => ({
        documentId: result.document.id,
        documentTitle: result.document.title,
        filename: result.document.filename,
        content: result.content.substring(0, 200) + '...', // 截取前200字符
        score: result.score,
        chunkIndex: 0, // 简化版本
      }));

      const processingTime = Date.now() - startTime;

      return {
        question: ragQueryDto.question,
        answer,
        sources,
        confidence: this.calculateConfidence(searchResults),
        model: 'gpt-3.5-turbo',
        timestamp: new Date(),
        processingTime,
      };

    } catch (error) {
      this.logger.error('RAG 查询失败', error.stack);
      throw new BadRequestException('智能问答处理失败');
    }
  }

  private buildContext(searchResults: any[]): string {
    const contextParts = searchResults.map((result, index) => 
      `[文档${index + 1}: ${result.document.title}]\n${result.content}`
    );
    
    return contextParts.join('\n\n---\n\n');
  }

  private async generateAnswer(
    question: string,
    context: string,
    conversationHistory?: any[],
  ): Promise<string> {
    try {
      // 构建对话历史
      const messages: any[] = [
        {
          role: 'system',
          content: `你是一个专业的文档分析助手。请基于提供的文档内容回答用户问题。

规则：
1. 仅基于提供的文档内容回答，不要添加文档中没有的信息
2. 如果文档中没有相关信息，请明确说明
3. 回答要准确、简洁、有用
4. 如果可能，请引用具体的文档内容

文档内容：
${context}`,
        },
      ];

      // 添加对话历史
      if (conversationHistory && conversationHistory.length > 0) {
        messages.push(...conversationHistory.slice(-6)); // 只保留最近6轮对话
      }

      // 添加当前问题
      messages.push({
        role: 'user',
        content: question,
      });

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages,
        max_tokens: 1000,
        temperature: 0.7,
      });

      return completion.choices[0]?.message?.content || '抱歉，无法生成回答。';

    } catch (error) {
      this.logger.error('OpenAI API 调用失败', error);
      
      // 降级处理：基于关键词匹配生成简单回答
      return this.generateFallbackAnswer(question, context);
    }
  }

  private generateFallbackAnswer(question: string, context: string): string {
    // 简单的关键词匹配和回答生成
    const questionLower = question.toLowerCase();
    const contextLines = context.split('\n').filter(line => line.trim());
    
    // 查找包含关键词的行
    const relevantLines = contextLines.filter(line => {
      const lineLower = line.toLowerCase();
      return questionLower.split(' ').some(word => 
        word.length > 2 && lineLower.includes(word)
      );
    });

    if (relevantLines.length > 0) {
      return `根据文档内容，相关信息如下：\n\n${relevantLines.slice(0, 3).join('\n')}`;
    }

    return '抱歉，在提供的文档中没有找到与您问题相关的信息。请尝试重新表述您的问题或提供更多上下文。';
  }

  private calculateConfidence(searchResults: any[]): number {
    if (searchResults.length === 0) return 0;
    
    const avgScore = searchResults.reduce((sum, result) => sum + result.score, 0) / searchResults.length;
    return Math.min(avgScore, 0.95); // 最高置信度限制在95%
  }

  private createEmptyResponse(question: string, startTime: number): RagResponseDto {
    return {
      question,
      answer: '抱歉，没有找到与您问题相关的文档内容。请尝试重新表述您的问题。',
      sources: [],
      confidence: 0,
      timestamp: new Date(),
      processingTime: Date.now() - startTime,
    };
  }
}