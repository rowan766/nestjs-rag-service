import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAIEmbeddings } from '@langchain/openai';
import { PrismaService } from '../../prisma/prisma.service';
import { VectorSearchDto, VectorSearchResultDto } from './dto/vector-search.dto';

@Injectable()
export class VectorstoreService {
  private readonly logger = new Logger(VectorstoreService.name);
  private readonly embeddings: OpenAIEmbeddings;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: this.configService.get<string>('langchain.openaiApiKey') || '',
      modelName: 'text-embedding-3-small',
    });
  }

  async similaritySearch(searchDto: VectorSearchDto): Promise<VectorSearchResultDto[]> {
    try {
      console.log('=== VectorStore Debug ===');
      console.log('Search DTO:', searchDto);
      // 构建查询条件
        //优化搜索：将问句分解为关键词
        const keywords = searchDto.query
          .replace(/[？？！。，、]/g, '') // 移除标点
          .split(/\s+/)
          .filter(word => word.length > 1);
        
        console.log('Keywords:', keywords);
        
        // 构建 OR 查询条件，搜索包含任一关键词的分块
        const whereConditions: any = {
          OR: keywords.map(keyword => ({
            content: {
              contains: keyword,
              mode: 'insensitive',
            }
          }))
        };
      console.log('Where conditions:', whereConditions);
      if (searchDto.documentId) {
        whereConditions.documentId = searchDto.documentId;
      }
      if (searchDto.userId) {
        whereConditions.document = {
          userId: searchDto.userId,
        };
      }
       console.log('Final where conditions:', whereConditions);
    // 执行文本搜索
      const chunks = await this.prisma.ragDocumentChunk.findMany({
        where: whereConditions,
        include: {
          document: {
            select: {
              id: true,
              title: true,
              filename: true,
            },
          },
        },
        take: searchDto.k,
        orderBy: {
          createdAt: 'desc',
        },
      });
      console.log('Found chunks:', chunks.length);
      if (chunks.length > 0) {
        console.log('First chunk preview:', chunks[0].content.substring(0, 100));
      }
      console.log('========================');
      // 计算相似度（简化版本）
      const results: VectorSearchResultDto[] = chunks.map((chunk, index) => ({
        id: chunk.id,
        content: chunk.content,
        score: 1 - (index * 0.1), // 简化的相似度分数
        document: {
          id: chunk.document.id,
          title: chunk.document.title,
          filename: chunk.document.filename,
        },
        metadata: chunk.metadata || {},
      }));

      this.logger.log(`向量搜索完成: "${searchDto.query}", 找到 ${results.length} 个结果`);
      return results;

    } catch (error) {
      this.logger.error('向量搜索失败', error.stack);
      throw error;
    }
  }

  async getDocumentChunks(documentId: string): Promise<VectorSearchResultDto[]> {
    const chunks = await this.prisma.ragDocumentChunk.findMany({
      where: { documentId },
      include: {
        document: {
          select: {
            id: true,
            title: true,
            filename: true,
          },
        },
      },
      orderBy: { chunkIndex: 'asc' },
    });

    return chunks.map(chunk => ({
      id: chunk.id,
      content: chunk.content,
      score: 1.0,
      document: {
        id: chunk.document.id,
        title: chunk.document.title,
        filename: chunk.document.filename,
      },
      metadata: chunk.metadata || {},
    }));
  }
}