import { Module } from '@nestjs/common';
import { RagService } from './rag.service';
import { RagController } from './rag.controller';
import { VectorstoreModule } from '../vectorstore/vectorstore.module';

@Module({
  imports: [VectorstoreModule],
  controllers: [RagController],
  providers: [RagService],
  exports: [RagService],
})
export class RagModule {}