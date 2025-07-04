import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { DocumentProcessor } from '../../utils/document-processor.util';
import { EmbeddingsModule } from '../embeddings/embeddings.module';

@Module({
  imports: [EmbeddingsModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, DocumentProcessor],
  exports: [DocumentsService],
})
export class DocumentsModule {}