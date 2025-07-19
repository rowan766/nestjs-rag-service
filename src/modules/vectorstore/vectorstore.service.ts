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
      
      // 智能中文分词和关键词提取
      const keywords = this.extractChineseKeywords(searchDto.query);
      console.log('Extracted keywords:', keywords);
      
      if (keywords.length === 0) {
        console.log('No keywords extracted, returning empty results');
        return [];
      }
      
      // 构建搜索条件：优先使用 AND 逻辑
      let whereConditions: any = {
        AND: keywords.map(keyword => ({
          content: {
            contains: keyword,
            mode: 'insensitive',
          }
        }))
      };

      // 添加文档和用户过滤
      if (searchDto.documentId) {
        whereConditions.documentId = searchDto.documentId;
      }
      if (searchDto.userId) {
        whereConditions.document = {
          userId: searchDto.userId,
        };
      }

      console.log('AND search conditions:', JSON.stringify(whereConditions, null, 2));

      // 执行 AND 搜索
      let chunks = await this.prisma.ragDocumentChunk.findMany({
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
        take: searchDto.k || 5,
        orderBy: {
          chunkIndex: 'asc',
        },
      });

      console.log('AND search found chunks:', chunks.length);

      // 如果 AND 搜索没有结果，尝试 OR 搜索
      if (chunks.length === 0 && keywords.length > 1) {
        console.log('AND search failed, trying OR search...');
        
        const orWhereConditions: any = {
          OR: keywords.map(keyword => ({
            content: {
              contains: keyword,
              mode: 'insensitive',
            }
          }))
        };

        // 重新添加过滤条件
        if (searchDto.documentId) {
          orWhereConditions.documentId = searchDto.documentId;
        }
        if (searchDto.userId) {
          orWhereConditions.document = {
            userId: searchDto.userId,
          };
        }

        console.log('OR search conditions:', JSON.stringify(orWhereConditions, null, 2));

        chunks = await this.prisma.ragDocumentChunk.findMany({
          where: orWhereConditions,
          include: {
            document: {
              select: {
                id: true,
                title: true,
                filename: true,
              },
            },
          },
          take: searchDto.k || 5,
          orderBy: {
            chunkIndex: 'asc',
          },
        });

        console.log('OR search found chunks:', chunks.length);
      }

      if (chunks.length > 0) {
        console.log('Sample results:');
        chunks.slice(0, 2).forEach((chunk, index) => {
          console.log(`  ${index + 1}. ${chunk.document.title}`);
          console.log(`     Content: ${chunk.content.substring(0, 80)}...`);
        });
      }

      console.log('========================');

      // 计算相似度分数并排序
      const results: VectorSearchResultDto[] = chunks.map((chunk) => {
        const score = this.calculateRelevanceScore(searchDto.query, keywords, chunk.content);
        return {
          id: chunk.id,
          content: chunk.content,
          score,
          document: {
            id: chunk.document.id,
            title: chunk.document.title,
            filename: chunk.document.filename,
          },
          metadata: chunk.metadata || {},
        };
      });

      // 按相似度分数排序
      results.sort((a, b) => b.score - a.score);

      this.logger.log(`向量搜索完成: "${searchDto.query}", 找到 ${results.length} 个结果`);
      return results.slice(0, searchDto.k || 5);

    } catch (error) {
      this.logger.error('向量搜索失败', error.stack);
      throw error;
    }
  }

  /**
   * 中文关键词提取
   */
  private extractChineseKeywords(query: string): string[] {
    console.log('原始查询:', query);
    
    // 1. 清理标点符号
    const cleanQuery = query.replace(/[？！。，、；：""''（）【】《》〈〉]/g, '').trim();
    console.log('清理后:', cleanQuery);
    
    const keywords: string[] = [];
    
    // 2. 手动提取常见的中文词汇模式
    const text = cleanQuery;
    
    // 提取人名（中文姓氏 + 1-2个字）
    const nameMatches = text.match(/[张李王刘陈杨黄赵周吴徐孙马朱胡郭何高林郑梁谢宋唐许韩冯邓曹彭蒋阎余潘杜戴钟汪田任姜范方石姚谭盛邹黎施熊季陆温蔡康章毛牛葛汪俞邵常舒秦汤佘彭][欢明磊刚伟强军杰华峰超勇志斌亮]\w*/g);
    if (nameMatches) {
      keywords.push(...nameMatches);
      console.log('匹配的人名:', nameMatches);
    }
    
    // 提取地名（地理标识符相关）
    const locationMatches = text.match(/\w*[省市县区州镇村]\w*/g);
    if (locationMatches) {
      keywords.push(...locationMatches);
      console.log('匹配的地名:', locationMatches);
    }
    
    // 提取关键概念词
    const conceptWords = ['出差', '目的地', '费用', '申请', '项目', '进度', '开发', '团队', '成员'];
    for (const concept of conceptWords) {
      if (text.includes(concept)) {
        keywords.push(concept);
      }
    }
    
    // 简单的字符切分（对于没有匹配到的情况）
    if (keywords.length === 0) {
      // 尝试按常见的2-3字词汇切分
      const chars = text.split('');
      for (let i = 0; i < chars.length - 1; i++) {
        // 2字词
        const twoChar = chars.slice(i, i + 2).join('');
        if (twoChar.length === 2 && /^[\u4e00-\u9fa5]{2}$/.test(twoChar)) {
          if (!['的是', '在有', '和与', '什么', '哪里', '如何', '怎么'].includes(twoChar)) {
            keywords.push(twoChar);
          }
        }
        
        // 3字词（如果还有字符的话）
        if (i < chars.length - 2) {
          const threeChar = chars.slice(i, i + 3).join('');
          if (threeChar.length === 3 && /^[\u4e00-\u9fa5]{3}$/.test(threeChar)) {
            keywords.push(threeChar);
          }
        }
      }
    }
    
    console.log('提取的所有关键词:', keywords);
    
    // 去重、过滤和排序
    const stopWords = ['是的', '在有', '什么', '哪里', '如何', '怎么', '这个', '那个'];
    const uniqueKeywords = [...new Set(keywords)]
      .filter(word => word.length >= 2 && !stopWords.includes(word))
      .slice(0, 5);
    
    console.log('最终关键词:', uniqueKeywords);
    
    return uniqueKeywords;
  }

  /**
   * 计算相关性分数
   */
  private calculateRelevanceScore(query: string, keywords: string[], content: string): number {
    const contentLower = content.toLowerCase();
    const queryLower = query.toLowerCase();
    
    let score = 0;
    
    // 1. 关键词匹配分数 (权重: 0.6)
    const matchedKeywords = keywords.filter(keyword => 
      contentLower.includes(keyword.toLowerCase())
    );
    const keywordScore = matchedKeywords.length / Math.max(keywords.length, 1);
    score += keywordScore * 0.6;
    
    // 2. 完整查询匹配分数 (权重: 0.2)
    if (contentLower.includes(queryLower)) {
      score += 0.2;
    }
    
    // 3. 多关键词邻近度分数 (权重: 0.2)
    if (matchedKeywords.length > 1) {
      const proximityScore = this.calculateProximityScore(matchedKeywords, content);
      score += proximityScore * 0.2;
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * 计算关键词在文本中的邻近度
   */
  private calculateProximityScore(keywords: string[], content: string): number {
    const contentLower = content.toLowerCase();
    const positions: number[] = [];
    
    for (const keyword of keywords) {
      const index = contentLower.indexOf(keyword.toLowerCase());
      if (index !== -1) {
        positions.push(index);
      }
    }
    
    if (positions.length < 2) return 0;
    
    // 计算关键词之间的平均距离
    positions.sort((a, b) => a - b);
    let totalDistance = 0;
    for (let i = 1; i < positions.length; i++) {
      totalDistance += positions[i] - positions[i - 1];
    }
    
    const avgDistance = totalDistance / (positions.length - 1);
    
    // 距离越近，分数越高（最大50字符内为满分）
    return Math.max(0, 1 - avgDistance / 50);
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