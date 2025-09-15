import { NextRequest } from 'next/server';
import fs from 'fs-extra';
import path from 'path';
import { getImagesDir, createApiResponse, createErrorResponse, isImageFile } from '@/lib/utils';

// GET /api/images - 获取图片列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    
    const imagesDir = getImagesDir();
    let allImages: Array<{
      name: string;
      category: string;
      url: string;
      path: string;
    }> = [];
    
    if (category && category !== 'all') {
      // 获取特定分类的图片
      const categoryDir = path.join(imagesDir, category);
      
      if (await fs.pathExists(categoryDir)) {
        const files = await fs.readdir(categoryDir);
        const imageFiles = files.filter(file => isImageFile(file));
        
        allImages = imageFiles.map(file => ({
          name: file,
          category: category,
          url: `/images/${category}/${file}`,
          path: `${category}/${file}`
        }));
      }
    } else {
      // 获取所有分类的图片
      if (await fs.pathExists(imagesDir)) {
        const categories = await fs.readdir(imagesDir);
        
        for (const cat of categories) {
          const catPath = path.join(imagesDir, cat);
          const stat = await fs.stat(catPath);
          
          if (stat.isDirectory()) {
            const files = await fs.readdir(catPath);
            const imageFiles = files.filter(file => isImageFile(file));
            
            const categoryImages = imageFiles.map(file => ({
              name: file,
              category: cat,
              url: `/images/${cat}/${file}`,
              path: `${cat}/${file}`
            }));
            
            allImages = allImages.concat(categoryImages);
          }
        }
      }
    }
    
    // 搜索过滤
    if (search && search.trim()) {
      const searchTerm = search.trim().toLowerCase();
      allImages = allImages.filter(image => {
        // 移除文件扩展名进行搜索
        const nameWithoutExt = path.parse(image.name).name.toLowerCase();
        const fullName = image.name.toLowerCase();
        
        // 支持模糊搜索：文件名（不含扩展名）或完整文件名包含搜索词
        return nameWithoutExt.includes(searchTerm) || fullName.includes(searchTerm);
      });
    }
    
    // 分页处理
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedImages = allImages.slice(startIndex, endIndex);
    
    return createApiResponse({
      images: paginatedImages,
      total: allImages.length,
      page: page,
      limit: limit,
      totalPages: Math.ceil(allImages.length / limit)
    });
  } catch (error) {
    console.error('获取图片列表失败:', error);
    return createErrorResponse('获取图片列表失败');
  }
}