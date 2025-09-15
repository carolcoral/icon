import { NextRequest } from 'next/server';
import fs from 'fs-extra';
import path from 'path';
import { getImagesDir, createErrorResponse, isImageFile } from '@/lib/utils';

// DELETE /api/images/:category/:imageName - 删除图片
export async function DELETE(
  request: NextRequest,
  { params }: { params: { category: string; imageName: string } }
) {
  try {
    const { category, imageName } = params;
    
    if (!isImageFile(imageName)) {
      return createErrorResponse('不支持的文件类型', 400);
    }
    
    const imagesDir = getImagesDir();
    const imagePath = path.join(imagesDir, category, imageName);
    
    if (await fs.pathExists(imagePath)) {
      await fs.remove(imagePath);
      return Response.json({ success: true, message: '图片删除成功' });
    } else {
      return createErrorResponse('图片不存在', 404);
    }
  } catch (error) {
    console.error('删除图片失败:', error);
    return createErrorResponse('删除图片失败');
  }
}