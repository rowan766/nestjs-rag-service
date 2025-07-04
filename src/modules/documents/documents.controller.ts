import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UsePipes,
  UseInterceptors,
  UploadedFile,
  ValidationPipe,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes,ApiBody } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { DocumentsService} from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { QueryDocumentsDto } from './dto/query-documents.dto';
import { documentFileFilter, editFileName } from '../../utils/file-upload.util';

@ApiTags('documents')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}
  @Post()
  @ApiOperation({ summary: '上传文档' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
  schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: '文档标题' },
        description: { type: 'string', description: '文档描述' },
        file: {
          type: 'string',
          format: 'binary',
          description: '上传的文件',
        },
      },
      required: ['title', 'file'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/documents',
        filename: editFileName,
      }),
      // fileFilter: documentFileFilter,
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  create(
    @Body() createDocumentDto: CreateDocumentDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // 临时使用固定用户ID，后续添加认证后从JWT获取
    console.log('=== Controller Debug ===');
    console.log('createDocumentDto:', createDocumentDto);
    console.log('file:', file);
    console.log('========================');
    const userId = 'temp-user-id';
    return this.documentsService.create(createDocumentDto, file, userId);
  }

  @Get()
  @ApiOperation({ summary: '获取文档列表' })
  findAll(@Query() query: QueryDocumentsDto) {
    return this.documentsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取文档详情' })
  findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新文档' })
  update(@Param('id') id: string, @Body() updateDocumentDto: UpdateDocumentDto) {
    return this.documentsService.update(id, updateDocumentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除文档' })
  remove(@Param('id') id: string) {
    return this.documentsService.remove(id);
  }

  @Post(':id/reprocess')
  @ApiOperation({ summary: '重新处理文档分块' })
  reprocessDocument(@Param('id') id: string) {
    return this.documentsService.reprocessDocument(id);
  }
}