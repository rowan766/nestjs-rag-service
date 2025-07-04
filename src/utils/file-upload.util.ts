import { BadRequestException } from '@nestjs/common';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

export const imageFileFilter = (req: any, file: any, callback: any) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    return callback(new BadRequestException('只允许上传图片文件!'), false);
  }
  callback(null, true);
};

export const documentFileFilter = (req: any, file: any, callback: any) => {
  if (!file.originalname.match(/\.(pdf|docx|doc|txt|md|html)$/)) {
    return callback(
      new BadRequestException('只允许上传文档文件 (PDF, DOCX, TXT, MD, HTML)!'),
      false,
    );
  }
  callback(null, true);
};

export const editFileName = (req: any, file: any, callback: any) => {
  const name = file.originalname.split('.')[0];
  const fileExtName = extname(file.originalname);
  const randomName = uuidv4();
  callback(null, `${name}-${randomName}${fileExtName}`);
};

export const generateFileName = (originalName: string): string => {
  const name = originalName.split('.')[0];
  const fileExtName = extname(originalName);
  const randomName = uuidv4();
  return `${name}-${randomName}${fileExtName}`;
};