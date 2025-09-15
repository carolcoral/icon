import { NextRequest } from 'next/server';
import formidable from 'formidable';
import fs from 'fs-extra';
import path from 'path';
import { getImagesDir, createApiResponse, createErrorResponse, ensureDir, generateUniqueFilename, isImageFile } from '@/lib/utils';



// POST /api/upload - 上传图片
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    const category = (formData.get('category') as string) || 'other';
    
    if (!file) {
      return createErrorResponse('请选择要上传的图片文件', 400);
    }
    
    // 验证文件类型
    if (!isImageFile(file.name)) {
      return createErrorResponse('只支持 PNG、ICO、JPG、JPEG、GIF、SVG 格式的图片文件', 400);
    }
    
    // 验证文件大小 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return createErrorResponse('文件大小不能超过10MB', 400);
    }
    
    const imagesDir = getImagesDir();
    const categoryDir = path.join(imagesDir, category);
    
    // 确保分类目录存在
    await ensureDir(categoryDir);
    
    // 生成唯一文件名
    const filename = await generateUniqueFilename(categoryDir, file.name);
    const filePath = path.join(categoryDir, filename);
    
    // 保存文件
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(filePath, buffer);
    
    const imageInfo = {
      name: filename,
      originalName: file.name,
      category: category,
      size: file.size,
      url: `/images/${category}/${filename}`,
      path: `${category}/${filename}`,
      uploadTime: new Date().toISOString()
    };
    
    return createApiResponse({
      success: true,
      message: '图片上传成功',
      image: imageInfo
    });
  } catch (error) {
    console.error('上传图片失败:', error);
    return createErrorResponse('上传图片失败: ' + (error as Error).message);
  }
}