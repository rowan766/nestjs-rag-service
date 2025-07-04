import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RagService } from './rag.service';
import { RagQueryDto } from './dto/rag-query.dto';
import { RagResponseDto } from './dto/rag-response.dto';

@ApiTags('rag')
@Controller('rag')
export class RagController {
  constructor(private readonly ragService: RagService) {}

  @Post('query')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: '智能问答',
    description: '基于已上传的文档内容进行智能问答'
  })
  @ApiResponse({
    status: 200,
    description: '问答成功',
    type: RagResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误',
  })
  async query(@Body() ragQueryDto: RagQueryDto): Promise<RagResponseDto> {
    return this.ragService.query(ragQueryDto);
  }
}