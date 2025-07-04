import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  url: process.env.DATABASE_URL || '',
  vectorDimension: parseInt(process.env.VECTOR_DIMENSION || '1536', 10),
  vectorTableName: process.env.VECTOR_TABLE_NAME || 'document_embeddings',
}));