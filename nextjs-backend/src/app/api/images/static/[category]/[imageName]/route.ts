import { NextRequest } from 'next/server';
import fs from 'fs-extra';
import path from 'path';
import { getImagesDir, createErrorResponse, isImageFile, getMimeType } from '@/lib/utils';

// GET /api/images/static/:category/:imageName - 静态图片访问
export async function GET(
  request: NextRequest,
  { params }: { params: { category: string; imageName: string } }
) {
  try {
    const { category, imageName } = params;
    
    // 检查是否是图片文件
    if (!isImageFile(imageName)) {
      return createErrorResponse('不支持的文件类型', 400);
    }
    
    const imagesDir = getImagesDir();
    const imagePath = path.join(imagesDir, category, imageName);
    
    if (await fs.pathExists(imagePath)) {
      // 读取文件
      const fileBuffer = await fs.readFile(imagePath);
      const mimeType = getMimeType(imageName);
      
      // 返回图片文件
      return new Response(fileBuffer, {
        headers: {
          'Content-Type': mimeType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    } else {
      return createErrorResponse('图片不存在', 404);
    }
  } catch (error) {
    console.error('访问图片失败:', error);
    return createErrorResponse('访问图片失败');
  }
}