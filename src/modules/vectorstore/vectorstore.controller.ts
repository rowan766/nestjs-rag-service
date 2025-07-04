import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { VectorstoreService } from './vectorstore.service';
import { VectorSearchDto } from './dto/vector-search.dto';

@ApiTags('vectorstore')
@Controller('vectorstore')
export class VectorstoreController {
  constructor(private readonly vectorstoreService: VectorstoreService) {}

  @Post('search')
  @ApiOperation({ summary: '向量相似度搜索' })
  search(@Body() searchDto: VectorSearchDto) {
    return this.vectorstoreService.similaritySearch(searchDto);
  }

  @Get('documents/:id/chunks')
  @ApiOperation({ summary: '获取文档的所有分块' })
  getDocumentChunks(@Param('id') documentId: string) {
    return this.vectorstoreService.getDocumentChunks(documentId);
  }
}