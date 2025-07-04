import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
        await this.$connect();
      } catch (error) {
        console.log('数据库连接失败，10秒后重试...');
        setTimeout(async () => {
          try {
            await this.$connect();
            console.log('数据库重连成功');
          } catch (retryError) {
            console.error('数据库重连失败:', retryError.message);
          }
        }, 10000);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}