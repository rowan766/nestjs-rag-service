import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAIEmbeddings } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EmbeddingsService {
  private readonly logger = new Logger(EmbeddingsService.name);
  private readonly embeddings: OpenAIEmbeddings;
  private readonly textSplitter: RecursiveCharacterTextSplitter;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: this.configService.get<string>('langchain.openaiApiKey') || '',
      modelName: 'text-embedding-3-small',
    });

    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: this.configService.get<number>('langchain.chunkSize') || 1000,
      chunkOverlap: this.configService.get<number>('langchain.chunkOverlap') || 200,
    });
  }

  async processDocumentEmbeddings(documentId: string): Promise<void> {
    try {
      const document = await this.prisma.ragDocument.findUnique({
        where: { id: documentId },
      });

      if (!document || !document.content) {
        throw new Error('文档不存在或内容为空');
      }

      // 分割文本
      const chunks = await this.textSplitter.splitText(document.content);
      
      // 生成向量并保存
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = await this.embeddings.embedQuery(chunk);
        
        await this.prisma.ragDocumentChunk.create({
          data: {
            content: chunk,
            embedding: JSON.stringify(embedding), // 暂时存为JSON
            chunkIndex: i,
            startChar: document.content.indexOf(chunk),
            endChar: document.content.indexOf(chunk) + chunk.length,
            tokenCount: this.estimateTokenCount(chunk),
            documentId,
          },
        });
      }

      this.logger.log(`文档向量化完成: ${documentId}, 共 ${chunks.length} 个分块`);
    } catch (error) {
      this.logger.error(`文档向量化失败: ${documentId}`, error.stack);
      throw error;
    }
  }

  private estimateTokenCount(text: string): number {
    // 简单的token估算：英文按4字符1token，中文按1.5字符1token
    const chineseChars = text.match(/[\u4e00-\u9fff]/g)?.length || 0;
    const otherChars = text.length - chineseChars;
    return Math.ceil(chineseChars / 1.5 + otherChars / 4);
  }
}