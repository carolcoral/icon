import { NextRequest } from 'next/server';
import fs from 'fs-extra';
import path from 'path';
import { getImagesDir, createApiResponse, createErrorResponse, ensureDir } from '@/lib/utils';

// GET /api/categories - 获取所有图片分类
export async function GET() {
  try {
    const imagesDir = getImagesDir();
    
    // 确保图片目录存在
    await ensureDir(imagesDir);
    
    const items = await fs.readdir(imagesDir);
    const categories = [];
    
    for (const item of items) {
      const itemPath = path.join(imagesDir, item);
      const stat = await fs.stat(itemPath);
      
      if (stat.isDirectory()) {
        categories.push({
          label: item,
          value: item
        });
      }
    }
    
    return createApiResponse(categories);
  } catch (error) {
    console.error('获取分类失败:', error);
    return createErrorResponse('获取分类失败');
  }
}

// POST /api/categories - 创建新分类
export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();
    
    if (!name || !name.trim()) {
      return createErrorResponse('分类名称不能为空', 400);
    }
    
    const imagesDir = getImagesDir();
    const categoryPath = path.join(imagesDir, name.trim());
    
    if (await fs.pathExists(categoryPath)) {
      return createErrorResponse('分类已存在', 400);
    }
    
    await ensureDir(categoryPath);
    
    return createApiResponse({
      success: true,
      message: '分类创建成功',
      category: name.trim()
    });
  } catch (error) {
    console.error('创建分类失败:', error);
    return createErrorResponse('创建分类失败');
  }
}