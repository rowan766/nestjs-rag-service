// src/scripts/seed-test-data-safe.ts
import { PrismaClient, RagDocumentStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function seedTestDataSafe() {
  try {
    console.log('开始添加测试数据（安全模式）...');

    // 1. 先清理现有测试数据
    console.log('🧹 清理现有测试数据...');
    
    // 删除测试文档的分块
    await prisma.ragDocumentChunk.deleteMany({
      where: {
        documentId: {
          in: ['test-doc-1', 'test-doc-2']
        }
      }
    });
    console.log('   - 删除现有分块');

    // 删除测试文档
    await prisma.ragDocument.deleteMany({
      where: {
        id: {
          in: ['test-doc-1', 'test-doc-2']
        }
      }
    });
    console.log('   - 删除现有文档');

    // 2. 确保有测试用户
    let testUser = await prisma.user.findFirst({
      where: { email: 'test@example.com' }
    });

    if (!testUser) {
      // 尝试创建用户，如果ID冲突就查找现有用户
      try {
        testUser = await prisma.user.create({
          data: {
            email: 'test@example.com',
            username: 'testuser',
            password: 'test123',
          }
        });
        console.log('✅ 创建测试用户:', testUser.email);
      } catch (error) {
        // 如果用户已存在，查找第一个用户
        testUser = await prisma.user.findFirst();
        if (!testUser) {
          throw new Error('无法找到或创建用户');
        }
        console.log('✅ 使用现有用户:', testUser.email);
      }
    } else {
      console.log('✅ 使用现有测试用户:', testUser.email);
    }

    // 3. 创建测试文档1
    const document1 = await prisma.ragDocument.create({
      data: {
        id: 'test-doc-1',
        title: '员工出差申请单',
        filename: 'business-trip-application.pdf',
        originalName: 'business-trip-application.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        path: '/uploads/test/business-trip-application.pdf',
        content: '这是一份员工出差申请文档，包含了张欢的出差申请信息。',
        summary: '张欢申请前往随州市进行项目调研的出差申请。',
        language: 'zh-CN',
        pageCount: 2,
        wordCount: 500,
        status: RagDocumentStatus.PROCESSED,
        userId: testUser.id,
        processedAt: new Date(),
      }
    });

    console.log('✅ 文档1创建成功:', document1.title);

    // 4. 添加文档1的分块
    const chunks1 = [
      {
        documentId: document1.id,
        content: '员工姓名：张欢，部门：IT部门，申请出差前往湖北省随州市进行项目实地调研工作。出差时间：2024年7月15日至7月18日，共计3天。出差目的是进行客户需求分析和系统优化。',
        chunkIndex: 0,
        startChar: 0,
        endChar: 89,
        tokenCount: 45,
        metadata: {
          page: 1,
          section: '基本信息',
          applicant: '张欢',
          destination: '随州市'
        }
      },
      {
        documentId: document1.id,
        content: '出差目的：前往随州市客户现场进行系统需求调研，收集用户反馈，优化产品功能。预计费用：交通费800元，住宿费600元，餐费400元，总计1800元。',
        chunkIndex: 1,
        startChar: 89,
        endChar: 170,
        tokenCount: 42,
        metadata: {
          page: 1,
          section: '出差详情',
          destination: '随州市',
          totalCost: 1800
        }
      },
      {
        documentId: document1.id,
        content: '批准状态：已通过部门经理审批，等待财务部门确认预算。联系人：李经理，电话：138-0000-1234。紧急联系人：王助理，电话：139-1111-5678。',
        chunkIndex: 2,
        startChar: 170,
        endChar: 245,
        tokenCount: 38,
        metadata: {
          page: 2,
          section: '审批信息',
          status: '已审批',
          contacts: ['李经理', '王助理']
        }
      }
    ];

    for (const chunkData of chunks1) {
      await prisma.ragDocumentChunk.create({
        data: chunkData
      });
    }

    console.log(`✅ 文档1创建了 ${chunks1.length} 个分块`);

    // 5. 创建测试文档2
    const document2 = await prisma.ragDocument.create({
      data: {
        id: 'test-doc-2',
        title: '项目进度报告',
        filename: 'project-progress-report.docx',
        originalName: 'Q3项目进度报告.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 2048,
        path: '/uploads/test/project-progress-report.docx',
        content: 'CRM系统开发项目进度报告，包含团队成员和工作安排。',
        summary: 'Q3季度CRM项目开发进度和团队工作情况报告。',
        language: 'zh-CN',
        pageCount: 3,
        wordCount: 800,
        status: RagDocumentStatus.PROCESSED,
        userId: testUser.id,
        processedAt: new Date(),
      }
    });

    console.log('✅ 文档2创建成功:', document2.title);

    // 6. 添加文档2的分块
    const chunks2 = [
      {
        documentId: document2.id,
        content: 'CRM系统开发项目目前进度良好，前端界面开发已完成80%，后端API开发完成70%。团队成员包括张欢（前端开发）、李明（后端开发）、王磊（测试工程师）。项目预计8月底完成开发。',
        chunkIndex: 0,
        startChar: 0,
        endChar: 98,
        tokenCount: 50,
        metadata: {
          section: '项目概况',
          progress: { frontend: 80, backend: 70 },
          team: ['张欢', '李明', '王磊']
        }
      },
      {
        documentId: document2.id,
        content: '下阶段工作重点：完成用户权限管理模块，优化数据库查询性能，进行系统集成测试。张欢负责前端用户界面优化，李明负责后端性能调优。预计9月初进入用户验收测试阶段。',
        chunkIndex: 1,
        startChar: 98,
        endChar: 180,
        tokenCount: 45,
        metadata: {
          section: '工作计划',
          responsibilities: {
            '张欢': '前端用户界面优化',
            '李明': '后端性能调优'
          }
        }
      }
    ];

    for (const chunkData of chunks2) {
      await prisma.ragDocumentChunk.create({
        data: chunkData
      });
    }

    console.log(`✅ 文档2创建了 ${chunks2.length} 个分块`);

    // 7. 验证数据
    const totalChunks = await prisma.ragDocumentChunk.count();
    const totalDocs = await prisma.ragDocument.count();
    
    console.log('\n📊 最终数据统计:');
    console.log(`   - 文档数量: ${totalDocs}`);
    console.log(`   - 分块数量: ${totalChunks}`);
    
    // 8. 测试搜索功能
    console.log('\n🧪 测试搜索功能:');
    const testResults = await prisma.ragDocumentChunk.findMany({
      where: {
        content: {
          contains: '张欢',
          mode: 'insensitive'
        }
      },
      include: {
        document: {
          select: {
            id: true,
            title: true,
            filename: true
          }
        }
      },
      take: 3
    });

    console.log(`   - 搜索"张欢"找到 ${testResults.length} 个结果`);
    testResults.forEach((result, index) => {
      console.log(`   ${index + 1}. 文档: ${result.document.title}`);
      console.log(`      内容: ${result.content.substring(0, 50)}...`);
    });

    console.log('\n🔍 可以测试的问题:');
    console.log('   - "张欢的出差目的地是哪里？"');
    console.log('   - "出差费用是多少？"');
    console.log('   - "CRM项目的进度如何？"');
    console.log('   - "项目团队成员有谁？"');
    console.log('   - "张欢在项目中负责什么工作？"');

    console.log('\n✅ 测试数据添加完成！现在可以测试 RAG 接口了。');

  } catch (error) {
    console.error('❌ 添加测试数据失败:', error);
    console.error('详细错误:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

seedTestDataSafe();