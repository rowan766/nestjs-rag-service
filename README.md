# NestJS RAG Service

一个基于 NestJS 和 LangChain.js 构建的 RAG（检索增强生成）服务，支持文档上传、向量化存储、智能问答和聊天功能。

## 功能特性

🚀 **核心功能**

* 📄 文档上传和处理（PDF、DOCX、TXT、MD、HTML）
* 🔍 文档内容向量化和存储
* 🤖 基于 RAG 的智能问答
* 💬 上下文感知的聊天对话
* 📚 文档管理和检索

🛠 **技术栈**

* **后端框架**: NestJS
* **AI/ML**: LangChain.js + OpenAI
* **数据库**: PostgreSQL + pgvector
* **文档处理**: pdf-parse, mammoth, docx
* **API 文档**: Swagger UI
* **认证**: JWT + bcrypt

## 快速开始

### 环境要求

* Node.js >= 18.0.0
* PostgreSQL 数据库（支持 pgvector 扩展）
* OpenAI API 密钥

### 安装依赖

```bash
# 使用 yarn
yarn install

# 或使用 npm
npm install
```

### 环境配置

复制并配置环境变量：

```bash
cp .env.example .env
```

配置 `.env` 文件：

```env
# 应用配置
NODE_ENV=development
PORT=3002

# 数据库配置
DATABASE_URL="postgresql://username:password@localhost:5432/database"

# OpenAI API
OPENAI_API_KEY=your-openai-api-key

# pgvector 配置
VECTOR_DIMENSION=1536
VECTOR_TABLE_NAME=document_embeddings

# 文档处理配置
DOCUMENTS_PATH=./uploads/documents
MAX_FILE_SIZE=10485760
SUPPORTED_FILE_TYPES=pdf,docx,txt,md,html

# RAG 配置
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
MAX_CHUNKS_PER_QUERY=5

# JWT 配置
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
```

### 数据库设置

```bash
# 生成 Prisma 客户端
yarn db:generate

# 运行数据库迁移
yarn db:migrate

# （可选）运行种子数据
yarn db:seed
```

### 启动应用

```bash
# 开发模式
yarn start:dev

# 生产模式
yarn build
yarn start:prod

# 调试模式
yarn start:debug
```

应用将在 `http://localhost:3002` 启动

## API 文档

启动应用后，访问以下地址查看 API 文档：

* **Swagger UI**: `http://localhost:3002/api`
* **应用健康检查**: `http://localhost:3002/health`

## 主要 API 端点

### 文档管理

* `POST /documents/upload` - 上传文档
* `GET /documents` - 获取文档列表
* `GET /documents/:id` - 获取文档详情
* `DELETE /documents/:id` - 删除文档

### RAG 查询

* `POST /rag/query` - 执行 RAG 查询
* `GET /rag/embeddings` - 获取向量嵌入

### 聊天功能

* `POST /chat/message` - 发送聊天消息
* `GET /chat/sessions` - 获取聊天会话
* `DELETE /chat/sessions/:id` - 删除聊天会话

### 向量存储

* `POST /vectorstore/index` - 创建向量索引
* `GET /vectorstore/search` - 向量相似性搜索

## 开发命令

```bash
# 构建项目
yarn build

# 代码格式化
yarn format

# 代码检查
yarn lint

# 运行测试
yarn test

# 测试覆盖率
yarn test:cov

# 端到端测试
yarn test:e2e

# 数据库相关
yarn db:generate    # 生成 Prisma 客户端
yarn db:migrate     # 运行迁移
yarn db:studio      # 打开 Prisma Studio
yarn db:seed        # 运行种子数据
yarn db:reset       # 重置数据库
```

## 项目结构

```
src/
├── common/             # 公共模块
│   ├── filters/        # 异常过滤器
│   └── guards/         # 守卫
├── config/             # 配置文件
├── modules/            # 功能模块
│   ├── chat/           # 聊天功能
│   ├── documents/      # 文档管理
│   ├── embeddings/     # 向量嵌入
│   ├── rag/            # RAG 查询
│   └── vectorstore/    # 向量存储
├── prisma/             # Prisma 配置
├── types/              # 类型定义
└── utils/              # 工具函数
```

## 部署

### 使用 PM2 部署

```bash
# 安装 PM2
npm install -g pm2

# 构建项目
yarn build

# 启动服务
pm2 start ecosystem.config.js

# 查看状态
pm2 list

# 查看日志
pm2 logs nestjs-rag-service
```

### Docker 部署

```bash
# 构建镜像
docker build -t nestjs-rag-service .

# 运行容器
docker run -p 3002:3002 --env-file .env nestjs-rag-service
```

### AWS EC2 部署

1. 准备 EC2 实例（推荐 t3.medium 或更高配置）
2. 安装 Node.js 18+
3. 配置 PostgreSQL 数据库
4. 克隆代码并安装依赖
5. 配置环境变量
6. 使用 PM2 启动服务

详细部署指南请参考 [部署文档](https://claude.ai/chat/docs/deployment.md)

## 性能优化

### 推荐的生产环境配置

* **内存**: 至少 2GB RAM
* **CPU**: 2 核心或更多
* **存储**: SSD，至少 20GB
* **数据库**: PostgreSQL 13+ with pgvector

### 缓存策略

* 文档向量缓存
* 查询结果缓存
* 会话状态缓存

## 监控和日志

### 健康检查

```bash
# 检查应用状态
curl http://localhost:3002/health

# 检查数据库连接
curl http://localhost:3002/health/db
```

### 日志配置

应用使用结构化日志，支持不同级别的日志输出：

* `error`: 错误信息
* `warn`: 警告信息
* `info`: 一般信息
* `debug`: 调试信息

## 贡献指南

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 故障排除

### 常见问题

**1. 数据库连接失败**

* 检查 `DATABASE_URL` 配置
* 确保 PostgreSQL 服务运行
* 验证数据库权限

**2. OpenAI API 错误**

* 检查 `OPENAI_API_KEY` 是否有效
* 确认 API 余额充足
* 检查网络连接

**3. 文档上传失败**

* 检查文件大小限制
* 确认支持的文件类型
* 验证存储路径权限

**4. 向量检索无结果**

* 确保文档已正确向量化
* 检查查询参数
* 验证向量数据库连接

### 调试模式

```bash
# 启用详细日志
LOG_LEVEL=debug yarn start:dev

# 查看 Prisma 查询
DEBUG=prisma:query yarn start:dev
```

## 许可证

本项目采用 [UNLICENSED](https://claude.ai/chat/LICENSE) 许可证。

## 联系方式

如有问题或建议，请通过以下方式联系：

* 提交 [Issue](https://github.com/yourusername/nestjs-rag-service/issues)
* 发送邮件至: your-email@example.com

---

**最后更新**: 2025年7月 **版本**: v0.0.1
