import { registerAs } from '@nestjs/config';

export default registerAs('langchain', () => ({
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  chunkSize: parseInt(process.env.CHUNK_SIZE || '1000', 10),
  chunkOverlap: parseInt(process.env.CHUNK_OVERLAP || '200', 10),
  maxChunksPerQuery: parseInt(process.env.MAX_CHUNKS_PER_QUERY || '5', 10),
  documentsPath: process.env.DOCUMENTS_PATH || './uploads/documents',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
  supportedFileTypes: process.env.SUPPORTED_FILE_TYPES?.split(',') || [
    'pdf',
    'docx',
    'txt',
    'md',
    'html',
  ],
}));