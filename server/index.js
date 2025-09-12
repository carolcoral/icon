const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 静态文件服务 - 支持直接访问图片
app.use('/images', express.static(path.join(__dirname, '../public/assets/images')));

// 确保目录存在
const ensureDirectories = async () => {
  const imagesDir = path.join(__dirname, '../public/assets/images');
  await fs.ensureDir(imagesDir);
  
  // 确保github文件夹存在
  await fs.ensureDir(path.join(imagesDir, 'github'));
};

// 获取所有图片分类（文件夹名称）
app.get('/api/categories', async (req, res) => {
  try {
    const imagesDir = path.join(__dirname, '../public/assets/images');
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
    
    res.json(categories);
  } catch (error) {
    console.error('获取分类失败:', error);
    res.status(500).json({ error: '获取分类失败' });
  }
});

// 获取图片列表
app.get('/api/images', async (req, res) => {
  try {
    const { category, page = 1, limit = 20 } = req.query;
    const imagesDir = path.join(__dirname, '../public/assets/images');
    
    let allImages = [];
    
    if (category && category !== 'all') {
      // 获取特定分类的图片
      const categoryDir = path.join(imagesDir, category);
      if (await fs.pathExists(categoryDir)) {
        const files = await fs.readdir(categoryDir);
        const imageFiles = files.filter(file => 
          /\.(png|ico|jpg|jpeg|gif|svg)$/i.test(file)
        );
        
        allImages = imageFiles.map(file => ({
          name: file,
          category: category,
          url: `/images/${category}/${file}`,
          path: `${category}/${file}`
        }));
      }
    } else {
      // 获取所有分类的图片
      const categories = await fs.readdir(imagesDir);
      
      for (const cat of categories) {
        const catPath = path.join(imagesDir, cat);
        const stat = await fs.stat(catPath);
        
        if (stat.isDirectory()) {
          const files = await fs.readdir(catPath);
          const imageFiles = files.filter(file => 
            /\.(png|ico|jpg|jpeg|gif|svg)$/i.test(file)
          );
          
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
    
    // 分页处理
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedImages = allImages.slice(startIndex, endIndex);
    
    res.json({
      images: paginatedImages,
      total: allImages.length,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(allImages.length / limit)
    });
  } catch (error) {
    console.error('获取图片列表失败:', error);
    res.status(500).json({ error: '获取图片列表失败' });
  }
});

// 支持属性名访问图片 - <域名>:<属性名>/图片名
app.get('/:category/:imageName', async (req, res) => {
  try {
    const { category, imageName } = req.params;
    
    // 检查是否是图片文件
    if (!/\.(png|ico|jpg|jpeg|gif|svg)$/i.test(imageName)) {
      return res.status(404).json({ error: '不支持的文件类型' });
    }
    
    const imagePath = path.join(__dirname, '../public/assets/images', category, imageName);
    
    if (await fs.pathExists(imagePath)) {
      // 设置正确的Content-Type
      const ext = path.extname(imageName).toLowerCase();
      const mimeTypes = {
        '.png': 'image/png',
        '.ico': 'image/x-icon',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml'
      };
      
      if (mimeTypes[ext]) {
        res.setHeader('Content-Type', mimeTypes[ext]);
      }
      
      res.sendFile(imagePath);
    } else {
      res.status(404).json({ error: '图片不存在' });
    }
  } catch (error) {
    console.error('访问图片失败:', error);
    res.status(500).json({ error: '访问图片失败' });
  }
});

// 启动服务器
const startServer = async () => {
  await ensureDirectories();
  
  app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log(`图片访问格式: http://localhost:${PORT}/<属性名>/<图片名>`);
  });
};

startServer().catch(console.error);