import { Module } from '@nestjs/common';
import { VectorstoreService } from './vectorstore.service';
import { VectorstoreController } from './vectorstore.controller';

@Module({
  controllers: [VectorstoreController],
  providers: [VectorstoreService],
  exports: [VectorstoreService],
})
export class VectorstoreModule {}