const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

const imageDirPath = '../../public/assets/images';

// 生产环境中间件配置
app.use(cors({
  origin: function (origin, callback) {
    // 在生产环境中允许所有来源（或根据需要配置特定域名）
    const allowedOrigins = [
      'https://icon.xindu.site',
      'http://icon.xindu.site',
      /\.xindu\.site$/,
      /localhost:\d+$/
    ];
    
    // 如果没有 origin（比如移动应用或 Postman），也允许
    if (!origin) return callback(null, true);
    
    // 检查是否在允许列表中
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return origin === allowed;
      } else if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    });
    
    callback(null, isAllowed);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());

// 生产环境：优先服务前端构建文件
app.use(express.static(path.join(__dirname, '../../client/dist')));
app.use('/assets', express.static(path.join(__dirname, '../../public/assets')));

// 安全头
app.use((req, res, next) => {
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'SAMEORIGIN');
  res.header('X-XSS-Protection', '1; mode=block');
  res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// 配置multer用于文件上传
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const category = req.body.category || 'other';
    const uploadPath = path.join(__dirname, imageDirPath, category);
    await fs.ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const originalName = file.originalname;
    const ext = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, ext);
    const timestamp = Date.now();
    
    const category = req.body.category || 'other';
    const targetPath = path.join(__dirname, imageDirPath, category, originalName);
    
    if (fs.existsSync(targetPath)) {
      cb(null, `${nameWithoutExt}_${timestamp}${ext}`);
    } else {
      cb(null, originalName);
    }
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /\.(png|ico|jpg|jpeg|gif|svg)$/i;
  if (allowedTypes.test(file.originalname)) {
    cb(null, true);
  } else {
    cb(new Error('只支持 PNG、ICO、JPG、JPEG、GIF、SVG 格式的图片文件'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

// 静态文件服务 - 支持直接访问图片
app.use('/images', express.static(path.join(__dirname, imageDirPath)));

// 确保目录存在
const ensureDirectories = async () => {
  const imagesDir = path.join(__dirname, imageDirPath);
  await fs.ensureDir(imagesDir);
  await fs.ensureDir(path.join(imagesDir, 'github'));
};

// API 路由（与原文件相同的 API 路由）
// ... 这里包含所有原有的 API 路由 ...

// 获取所有图片分类
app.get('/api/categories', async (req, res) => {
  try {
    const imagesDir = path.join(__dirname, imageDirPath);
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
    const { category, page = 1, limit = 20, search } = req.query;
    const imagesDir = path.join(__dirname, imageDirPath);
    
    let allImages = [];
    
    if (category && category !== 'all') {
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
    
    if (search && search.trim()) {
      const searchTerm = search.trim().toLowerCase();
      allImages = allImages.filter(image => {
        const nameWithoutExt = path.parse(image.name).name.toLowerCase();
        const fullName = image.name.toLowerCase();
        return nameWithoutExt.includes(searchTerm) || fullName.includes(searchTerm);
      });
    }
    
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

// 上传图片API
app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请选择要上传的图片文件' });
    }

    const { category = 'other' } = req.body;
    const imageInfo = {
      name: req.file.filename,
      originalName: req.file.originalname,
      category: category,
      size: req.file.size,
      url: `/images/${category}/${req.file.filename}`,
      path: `${category}/${req.file.filename}`,
      uploadTime: new Date().toISOString()
    };

    res.json({
      success: true,
      message: '图片上传成功',
      image: imageInfo
    });
  } catch (error) {
    console.error('上传图片失败:', error);
    res.status(500).json({ error: '上传图片失败: ' + error.message });
  }
});

// 删除图片API
app.delete('/api/images/:category/:imageName', async (req, res) => {
  try {
    const { category, imageName } = req.params;
    const imagePath = path.join(__dirname, imageDirPath, category, imageName);
    
    if (await fs.pathExists(imagePath)) {
      await fs.remove(imagePath);
      res.json({ success: true, message: '图片删除成功' });
    } else {
      res.status(404).json({ error: '图片不存在' });
    }
  } catch (error) {
    console.error('删除图片失败:', error);
    res.status(500).json({ error: '删除图片失败' });
  }
});

// 创建新分类API
app.post('/api/categories', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: '分类名称不能为空' });
    }

    const categoryPath = path.join(__dirname, imageDirPath, name.trim());
    
    if (await fs.pathExists(categoryPath)) {
      return res.status(400).json({ error: '分类已存在' });
    }

    await fs.ensureDir(categoryPath);
    res.json({ success: true, message: '分类创建成功', category: name.trim() });
  } catch (error) {
    console.error('创建分类失败:', error);
    res.status(500).json({ error: '创建分类失败' });
  }
});

// 支持属性名访问图片
app.get('/:category/:imageName', async (req, res) => {
  try {
    const { category, imageName } = req.params;
    
    if (!/\.(png|ico|jpg|jpeg|gif|svg)$/i.test(imageName)) {
      return res.status(404).json({ error: '不支持的文件类型' });
    }
    
    const imagePath = path.join(__dirname, imageDirPath, category, imageName);
    
    if (await fs.pathExists(imagePath)) {
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

// 生产环境：所有其他路由都返回 index.html（SPA 路由支持）
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});

// 启动服务器
const startServer = async () => {
  await ensureDirectories();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 生产服务器运行在 http://0.0.0.0:${PORT}`);
    console.log(`📱 本地访问: http://localhost:${PORT}`);
    console.log(`🌐 外部访问: https://icon.xindu.site`);
    console.log(`📸 图片访问格式: https://icon.xindu.site/<分类>/<图片名>`);
  });
};

startServer().catch(console.error);