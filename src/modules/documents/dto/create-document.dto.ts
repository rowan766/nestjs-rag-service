import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDocumentDto {
  @ApiProperty({ description: '文档标题' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: '文档描述' })
  @IsString()
  @IsOptional()
  description?: string;

    @ApiProperty({
    type: 'string',
    format: 'binary',
    description: '上传的文件',
  })
  file: any;
}