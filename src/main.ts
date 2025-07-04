import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 获取配置服务
  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port') || 3000;
  const corsOrigin = configService.get<string[]>('app.corsOrigin') || ['http://localhost:3000'];

  // 启用验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 启用 CORS
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  // Swagger API 文档
  const config = new DocumentBuilder()
    .setTitle('NestJS RAG Service API')
    .setDescription('Enterprise RAG API service with document Q&A capabilities')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/api`);
}

bootstrap();