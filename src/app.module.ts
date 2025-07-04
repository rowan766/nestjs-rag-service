import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { HttpExceptionFilter, AllExceptionsFilter } from './common/filters/http-exception.filter';
import { DocumentsModule } from './modules/documents/documents.module';
import { VectorstoreModule } from './modules/vectorstore/vectorstore.module';
import { RagModule } from './modules/rag/rag.module';
import { ChatModule } from './modules/chat/chat.module';

// 配置导入
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import langchainConfig from './config/langchain.config';
import jwtConfig from './config/jwt.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, langchainConfig, jwtConfig],
      envFilePath: '.env',
    }),
    PrismaModule,
    DocumentsModule,
    VectorstoreModule,
    RagModule,
    ChatModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}