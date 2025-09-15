import fs from 'fs-extra';
import path from 'path';

// 图片文件扩展名正则
export const IMAGE_EXTENSIONS = /\.(png|ico|jpg|jpeg|gif|svg)$/i;

// 支持的MIME类型映射
export const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml'
};

// 获取图片存储根目录
export function getImagesDir(): string {
  return path.join(process.cwd(), 'public', 'assets', 'images');
}

// 确保目录存在
export async function ensureDir(dirPath: string): Promise<void> {
  await fs.ensureDir(dirPath);
}

// 检查文件是否存在
export async function fileExists(filePath: string): Promise<boolean> {
  return await fs.pathExists(filePath);
}

// 获取文件的MIME类型
export function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

// 验证文件是否为图片
export function isImageFile(filename: string): boolean {
  return IMAGE_EXTENSIONS.test(filename);
}

// 生成唯一文件名（如果文件已存在）
export async function generateUniqueFilename(
  directory: string, 
  originalName: string
): Promise<string> {
  const ext = path.extname(originalName);
  const nameWithoutExt = path.basename(originalName, ext);
  const targetPath = path.join(directory, originalName);
  
  if (!(await fileExists(targetPath))) {
    return originalName;
  }
  
  const timestamp = Date.now();
  return `${nameWithoutExt}_${timestamp}${ext}`;
}

// API响应工具函数
export function createApiResponse(data: any, status: number = 200) {
  return Response.json(data, { status });
}

export function createErrorResponse(error: string, status: number = 500) {
  return Response.json({ error }, { status });
}