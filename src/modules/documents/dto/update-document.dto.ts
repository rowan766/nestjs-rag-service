import { PartialType } from '@nestjs/swagger';
import { CreateDocumentDto } from './create-document.dto';
import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

enum DocumentStatus {
  UPLOADED = 'UPLOADED',
  PROCESSING = 'PROCESSING',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED',
}

export class UpdateDocumentDto extends PartialType(CreateDocumentDto) {
  @ApiPropertyOptional({ 
    description: '文档状态',
    enum: DocumentStatus,
  })
  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus;
}