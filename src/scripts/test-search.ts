// src/scripts/test-search.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testSearch() {
  try {
    console.log('🔍 测试数据库搜索功能\n');

    // 1. 搜索包含"张欢"的内容
    console.log('1. 搜索"张欢":');
    const zhanghuanResults = await prisma.ragDocumentChunk.findMany({
      where: {
        content: {
          contains: '张欢',
          mode: 'insensitive'
        }
      },
      include: {
        document: {
          select: { title: true }
        }
      }
    });
    
    console.log(`   找到 ${zhanghuanResults.length} 个结果`);
    zhanghuanResults.forEach((result, index) => {
      console.log(`   ${index + 1}. 文档: ${result.document.title}`);
      console.log(`      内容: ${result.content}`);
      console.log('');
    });

    // 2. 搜索包含"出差"的内容
    console.log('2. 搜索"出差":');
    const chuchaResults = await prisma.ragDocumentChunk.findMany({
      where: {
        content: {
          contains: '出差',
          mode: 'insensitive'
        }
      },
      include: {
        document: {
          select: { title: true }
        }
      }
    });
    
    console.log(`   找到 ${chuchaResults.length} 个结果`);
    chuchaResults.forEach((result, index) => {
      console.log(`   ${index + 1}. 文档: ${result.document.title}`);
      console.log(`      内容: ${result.content.substring(0, 100)}...`);
      console.log('');
    });

    // 3. 搜索包含"随州"的内容
    console.log('3. 搜索"随州":');
    const suizhouResults = await prisma.ragDocumentChunk.findMany({
      where: {
        content: {
          contains: '随州',
          mode: 'insensitive'
        }
      },
      include: {
        document: {
          select: { title: true }
        }
      }
    });
    
    console.log(`   找到 ${suizhouResults.length} 个结果`);
    suizhouResults.forEach((result, index) => {
      console.log(`   ${index + 1}. 文档: ${result.document.title}`);
      console.log(`      内容: ${result.content.substring(0, 100)}...`);
      console.log('');
    });

    // 4. 复合搜索：同时包含"张欢"和"出差"
    console.log('4. 复合搜索 - 同时包含"张欢"和"出差":');
    const comboResults = await prisma.ragDocumentChunk.findMany({
      where: {
        AND: [
          {
            content: {
              contains: '张欢',
              mode: 'insensitive'
            }
          },
          {
            content: {
              contains: '出差',
              mode: 'insensitive'
            }
          }
        ]
      },
      include: {
        document: {
          select: { title: true }
        }
      }
    });
    
    console.log(`   找到 ${comboResults.length} 个结果`);
    comboResults.forEach((result, index) => {
      console.log(`   ${index + 1}. 文档: ${result.document.title}`);
      console.log(`      内容: ${result.content}`);
      console.log('');
    });

    // 5. OR 搜索：包含"张欢"或"出差"
    console.log('5. OR 搜索 - 包含"张欢"或"出差":');
    const orResults = await prisma.ragDocumentChunk.findMany({
      where: {
        OR: [
          {
            content: {
              contains: '张欢',
              mode: 'insensitive'
            }
          },
          {
            content: {
              contains: '出差',
              mode: 'insensitive'
            }
          }
        ]
      },
      include: {
        document: {
          select: { title: true }
        }
      },
      take: 5
    });
    
    console.log(`   找到 ${orResults.length} 个结果`);
    orResults.forEach((result, index) => {
      console.log(`   ${index + 1}. 文档: ${result.document.title}`);
      console.log(`      内容: ${result.content.substring(0, 80)}...`);
      console.log('');
    });

    // 6. 显示所有文档分块（调试用）
    console.log('6. 所有文档分块预览:');
    const allChunks = await prisma.ragDocumentChunk.findMany({
      include: {
        document: {
          select: { title: true }
        }
      },
      take: 10
    });
    
    allChunks.forEach((chunk, index) => {
      console.log(`   ${index + 1}. [${chunk.document.title}] ${chunk.content.substring(0, 50)}...`);
    });

  } catch (error) {
    console.error('❌ 搜索测试失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSearch();