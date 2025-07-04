declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // 环境设置
      NODE_ENV: 'development' | 'production' | 'test';
      LOG_LEVEL: string;
      PORT: string;

      // 数据库配置
      DATABASE_URL: string;
      DB_HOST: string;
      DB_PORT: string;
      DB_USERNAME: string;
      DB_PASSWORD: string;
      DB_DATABASE: string;

      // OpenAI API
      OPENAI_API_KEY: string;

      // pgvector 配置
      VECTOR_DIMENSION: string;
      VECTOR_TABLE_NAME: string;

      // 文档处理配置
      DOCUMENTS_PATH: string;
      MAX_FILE_SIZE: string;
      SUPPORTED_FILE_TYPES: string;

      // RAG 配置
      CHUNK_SIZE: string;
      CHUNK_OVERLAP: string;
      MAX_CHUNKS_PER_QUERY: string;

      // JWT 配置
      JWT_SECRET: string;
      JWT_EXPIRES_IN: string;

      // CORS 配置
      CORS_ORIGIN: string;

      // AWS 配置
      AWS_REGION: string;
      AWS_ACCESS_KEY_ID: string;
      AWS_SECRET_ACCESS_KEY: string;
      AWS_S3_BUCKET: string;

      // 应用配置
      APP_PORT: string;
      APP_ENV: string;

      // GitHub 配置
      GITHUB_USERNAME: string;
      GITHUB_TOKEN: string;

      // VPC 配置
      EXISTING_VPC_ID: string;
      EXISTING_SUBNET1_ID: string;
      EXISTING_SUBNET2_ID: string;
    }
  }
}

export {};