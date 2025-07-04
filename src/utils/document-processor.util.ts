import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';

@Injectable()
export class DocumentProcessor {
  private readonly logger = new Logger(DocumentProcessor.name);

  async extractTextFromFile(filePath: string, mimeType: string): Promise<{
    content: string;
    pageCount?: number;
    wordCount: number;
  }> {
    try {
      let content: string;
      let pageCount: number | undefined;

      switch (mimeType) {
        case 'application/pdf':
          const pdfResult = await this.extractTextFromPDF(filePath);
          content = pdfResult.content;
          pageCount = pdfResult.pageCount;
          break;

        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        case 'application/msword':
          content = await this.extractTextFromDocx(filePath);
          break;

        case 'text/plain':
        case 'text/markdown':
        case 'text/html':
          content = await this.extractTextFromPlainText(filePath);
          break;

        default:
          throw new BadRequestException(`不支持的文件类型: ${mimeType}`);
      }

      const wordCount = this.countWords(content);

      return {
        content: content.trim(),
        pageCount,
        wordCount,
      };
    } catch (error) {
      this.logger.error(`文本提取失败: ${filePath}`, error.stack);
      throw new BadRequestException(`文本提取失败: ${error.message}`);
    }
  }

  private async extractTextFromPDF(filePath: string): Promise<{
    content: string;
    pageCount: number;
  }> {
    const buffer = await fs.readFile(filePath);
    const data = await pdfParse(buffer);
    
    return {
      content: data.text,
      pageCount: data.numpages,
    };
  }

  private async extractTextFromDocx(filePath: string): Promise<string> {
    const buffer = await fs.readFile(filePath);
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  private async extractTextFromPlainText(filePath: string): Promise<string> {
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  }

  private countWords(text: string): number {
    // 简单的单词计数，支持中英文
    const words = text
      .replace(/[^\w\s\u4e00-\u9fff]/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0);
    
    return words.length;
  }

  async detectLanguage(content: string): Promise<string> {
    // 简单的语言检测
    const chineseChars = content.match(/[\u4e00-\u9fff]/g);
    const totalChars = content.replace(/\s/g, '').length;
    
    if (chineseChars && chineseChars.length / totalChars > 0.3) {
      return 'zh';
    }
    
    return 'en';
  }

  async generateSummary(content: string): Promise<string> {
    // 简单的摘要生成（截取前200个字符）
    // 实际项目中可以集成 OpenAI API 生成更智能的摘要
    const maxLength = 200;
    if (content.length <= maxLength) {
      return content;
    }
    
    return content.substring(0, maxLength) + '...';
  }
}