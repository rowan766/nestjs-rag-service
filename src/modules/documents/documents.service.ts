import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { DocumentProcessor } from '../../utils/document-processor.util';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { QueryDocumentsDto } from './dto/query-documents.dto';
import { DocumentResponseDto } from './dto/document-response.dto';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import * as fs from 'fs/promises';
import * as path from 'path';

import { EmbeddingsService } from '../embeddings/embeddings.service';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);
  private readonly documentsPath: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly documentProcessor: DocumentProcessor,
    private readonly embeddingsService: EmbeddingsService
  ) {
    this.documentsPath = this.configService.get<string>('langchain.documentsPath')||'./uploads/documents';
  }

  async create(
    createDocumentDto: CreateDocumentDto,
    file: Express.Multer.File,
    userId: string,
  ): Promise<DocumentResponseDto> {

  console.log('=== Debug Info ===');
  console.log('createDocumentDto:', createDocumentDto);
  console.log('file:', file);
  console.log('userId:', userId);
  console.log('=================');
    try {

      await this.prisma.user.upsert({
        where: { id: userId },
        create: {
          id: userId,
          email: 'temp@example.com',
          role: 'user',
        },
        update: {},
      });
      // 创建文档记录
      const document = await this.prisma.ragDocument.create({
        data: {
          title: createDocumentDto.title,
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          path: file.path,
          userId,
          status: 'UPLOADED',
        },
      });

      // 异步处理文档
      this.processDocumentAsync(document.id);

      return this.mapToResponseDto(document);
    } catch (error) {
      this.logger.error('创建文档失败', error.stack);
      throw new BadRequestException('创建文档失败');
    }
  }

  async findAll(query: QueryDocumentsDto): Promise<PaginatedResponseDto<DocumentResponseDto>> {
    console.log('=== Query Debug ===');
    console.log('query:', query);
    const { page = 1, limit = 10, search, status, userId } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { originalName: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (userId) {
      where.userId = userId;
    }

    const [documents, total] = await Promise.all([
      this.prisma.ragDocument.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { chunks: true },
          },
        },
      }),
      this.prisma.ragDocument.count({ where }),
    ]);

    const responseData = documents.map(doc => ({
      ...this.mapToResponseDto(doc),
      chunksCount: doc._count.chunks,
    }));

    return new PaginatedResponseDto(responseData, total, page, limit);
  }

  async findOne(id: string): Promise<DocumentResponseDto> {
    const document = await this.prisma.ragDocument.findUnique({
      where: { id },
      include: {
        _count: {
          select: { chunks: true },
        },
      },
    });

    if (!document) {
      throw new NotFoundException(`文档 ${id} 不存在`);
    }

    return {
      ...this.mapToResponseDto(document),
      chunksCount: document._count.chunks,
    };
  }

  async update(id: string, updateDocumentDto: UpdateDocumentDto): Promise<DocumentResponseDto> {
    const document = await this.prisma.ragDocument.findUnique({
      where: { id },
    });

    if (!document) {
      throw new NotFoundException(`文档 ${id} 不存在`);
    }

    const updatedDocument = await this.prisma.ragDocument.update({
      where: { id },
      data: updateDocumentDto,
    });

    return this.mapToResponseDto(updatedDocument);
  }

  async remove(id: string): Promise<void> {
    const document = await this.prisma.ragDocument.findUnique({
      where: { id },
    });

    if (!document) {
      throw new NotFoundException(`文档 ${id} 不存在`);
    }

    // 删除文件
    try {
      await fs.unlink(document.path);
    } catch (error) {
      this.logger.warn(`删除文件失败: ${document.path}`, error.message);
    }

    // 删除数据库记录（级联删除相关的 chunks）
    await this.prisma.ragDocument.delete({
      where: { id },
    });
  }

  private async processDocumentAsync(documentId: string): Promise<void> {
    try {
      // 更新状态为处理中
      await this.prisma.ragDocument.update({
        where: { id: documentId },
        data: { status: 'PROCESSING' },
      });

      const document = await this.prisma.ragDocument.findUnique({
        where: { id: documentId },
      });

      if (!document) return;

      // 提取文本内容
      const extractResult = await this.documentProcessor.extractTextFromFile(
        document.path,
        document.mimeType,
      );

      // 检测语言
      const language = await this.documentProcessor.detectLanguage(extractResult.content);

      // 生成摘要
      const summary = await this.documentProcessor.generateSummary(extractResult.content);

      // 更新文档信息
      await this.prisma.ragDocument.update({
        where: { id: documentId },
        data: {
          content: extractResult.content,
          summary,
          language,
          pageCount: extractResult.pageCount,
          wordCount: extractResult.wordCount,
          status: 'PROCESSED',
          processedAt: new Date(),
        },
      });
      await this.createSimpleChunks(documentId, extractResult.content);
      // await this.embeddingsService.processDocumentEmbeddings(documentId);
      this.logger.log(`文档处理完成: ${documentId}`);
    } catch (error) {
      this.logger.error(`文档处理失败: ${documentId}`, error.stack);

      await this.prisma.ragDocument.update({
        where: { id: documentId },
        data: {
          status: 'FAILED',
          errorMessage: error.message,
        },
      });
    }
  }

  private mapToResponseDto(document: any): DocumentResponseDto {
    return {
      id: document.id,
      title: document.title,
      filename: document.filename,
      originalName: document.originalName,
      mimeType: document.mimeType,
      size: document.size,
      path: document.path,
      content: document.content,
      summary: document.summary,
      language: document.language,
      pageCount: document.pageCount,
      wordCount: document.wordCount,
      status: document.status,
      errorMessage: document.errorMessage,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      processedAt: document.processedAt,
      userId: document.userId,
    };
  }

  private async createSimpleChunks(documentId: string, content: string): Promise<void> {
    const chunkSize = 1000;
    const chunks: string[] = [];;
    
    for (let i = 0; i < content.length; i += chunkSize) {
      chunks.push(content.substring(i, i + chunkSize));
    }
    
    for (let i = 0; i < chunks.length; i++) {
      await this.prisma.ragDocumentChunk.create({
        data: {
          content: chunks[i],
          chunkIndex: i,
          startChar: i * chunkSize,
          endChar: Math.min((i + 1) * chunkSize, content.length),
          documentId,
        },
      });
    }
    
    this.logger.log(`创建了 ${chunks.length} 个文档分块`);
  }
}