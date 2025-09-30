import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import Image from '../models/Image.js';
import User from '../models/User.js';
import { initDatabase } from '../database.js';
import {
  ensureDirectory,
  generateStoragePath,
  getImageInfo,
  isValidImageType,
  isValidFileSize,
  cleanupFile
} from '../utils/storage.js';

const router = express.Router();

// Multer配置
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (!isValidImageType(file.mimetype)) {
      return cb(new Error('不支持的文件类型'), false);
    }
    cb(null, true);
  }
});

// 单文件上传（需要登录）
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  console.log('收到上传请求:', {
    file: req.file ? {
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    } : '无文件',
    body: req.body,
    headers: req.headers
  });
  
  try {
    if (!req.file) {
      console.log('上传失败: 没有接收到文件');
      return res.status(400).json({ message: '请选择要上传的图片' });
    }

    const { category = 'default', description = '', tags = [], isPublic = false } = req.body;
    
    // 检查存储空间
    if (!req.user.hasEnoughSpace(req.file.size)) {
      return res.status(400).json({ message: '存储空间不足' });
    }

    // 生成存储路径
    const { filename, storagePath } = generateStoragePath(req.user, req.file.originalname, req.user.storageRule);
    const fullStoragePath = path.join(process.env.UPLOAD_PATH || './uploads', storagePath);

    // 确保目录存在
    await ensureDirectory(path.dirname(fullStoragePath));

    // 保存文件
    await fs.promises.writeFile(fullStoragePath, req.file.buffer);

    // 获取图片信息
    const imageInfo = await getImageInfo(req.file.buffer);

    // 生成缩略图（暂时禁用）
    const thumbnailPath = null;

    // 创建图片记录
    const image = new Image({
      filename,
      originalName: req.file.originalname,
      storagePath,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      width: imageInfo.width,
      height: imageInfo.height,
      userId: req.user.id,
      category: category.trim() || 'default',
      isPublic: isPublic === 'true' || isPublic === true,
      description: description.trim(),
      tags: Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      thumbnailPath
    });

    await image.save();

    // 更新用户存储使用量
    await req.user.updateStorage(req.file.size, 'add');

    res.status(201).json({
      message: '图片上传成功',
      image: {
        id: image.id,
        filename: image.filename,
        originalName: image.originalName,
        url: `/uploads/${image.storagePath}`,
        thumbnailUrl: image.thumbnailPath ? `/uploads/${image.thumbnailPath}` : `/uploads/${image.storagePath}`,
        fileSize: image.fileSize,
        width: image.width,
        height: image.height,
        category: image.category,
        isPublic: image.isPublic,
        description: image.description,
        tags: image.tags,
        createdAt: image.createdAt
      }
    });

  } catch (error) {
    console.error('上传图片错误详情:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name
    });
    
    // 清理已保存的文件（如果有）
    if (req.file && req.file.path) {
      await cleanupFile(req.file.path);
    }
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: '文件大小超过限制' });
    }
    
    res.status(500).json({ 
      message: '上传失败，请稍后重试',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 多文件上传（需要登录）
router.post('/upload-multiple', authenticateToken, upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: '请选择要上传的图片' });
    }

    const { category = 'default', isPublic = false } = req.body;
    
    // 检查总存储空间
    const totalSize = req.files.reduce((sum, file) => sum + file.size, 0);
    if (!req.user.hasEnoughSpace(totalSize)) {
      return res.status(400).json({ message: '存储空间不足' });
    }

    const uploadResults = [];
    const errors = [];

    for (const file of req.files) {
      try {
        // 生成存储路径
        const { filename, storagePath } = generateStoragePath(req.user, file.originalname, req.user.storageRule);
        const fullStoragePath = path.join(process.env.UPLOAD_PATH || './uploads', storagePath);

        // 确保目录存在
        await ensureDirectory(path.dirname(fullStoragePath));

        // 保存文件
        await fs.promises.writeFile(fullStoragePath, file.buffer);

        // 获取图片信息
        const imageInfo = await getImageInfo(file.buffer);

        // 生成缩略图（暂时禁用）
        const thumbnailPath = null;

        // 创建图片记录
        const image = new Image({
          filename,
          originalName: file.originalname,
          storagePath,
          fileSize: file.size,
          mimeType: file.mimetype,
          width: imageInfo.width,
          height: imageInfo.height,
          userId: req.user.id,
          category: category.trim() || 'default',
          isPublic: isPublic === 'true' || isPublic === true,
          thumbnailPath
        });

        await image.save();

        // 更新用户存储使用量
        await req.user.updateStorage(file.size, 'add');

        uploadResults.push({
          id: image.id,
          filename: image.filename,
          originalName: image.originalName,
          url: `/uploads/${image.storagePath}`,
          thumbnailUrl: image.thumbnailPath ? `/uploads/${image.thumbnailPath}` : `/uploads/${image.storagePath}`,
          status: 'success'
        });

      } catch (fileError) {
        console.error(`上传文件 ${file.originalname} 失败:`, fileError);
        errors.push({
          filename: file.originalname,
          error: fileError.message
        });
      }
    }

    // 保存用户更新（仅限登录用户）
    if (req.user && req.user.id !== 'anonymous') {
      await req.user.save();
    }

    res.json({
      message: `批量上传完成，成功 ${uploadResults.length} 个，失败 ${errors.length} 个`,
      success: uploadResults,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('批量上传错误:', error);
    res.status(500).json({ message: '批量上传失败' });
  }
});

// 获取图片列表
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category = 'all', 
      search = '',
      isPublic 
    } = req.query;

    // 构建SQL查询
    let sql = 'SELECT * FROM images WHERE 1=1';
    const params = [];
    
    // 画廊功能：未登录用户只能看到公开图片
    if (!req.user) {
      sql += ' AND is_public = ?';
      params.push(true);
    } else {
      // 登录用户可以看到自己的所有图片和公开图片
      sql += ' AND (user_id = ? OR is_public = ?)';
      params.push(req.user.id, true);
    }
    
    // 如果指定了分类
    if (category && category !== 'all') {
      sql += ' AND category = ?';
      params.push(category);
    }

    // 搜索条件
    if (search) {
      sql += ' AND (original_name LIKE ? OR description LIKE ? OR tags LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    // 排序
    sql += ' ORDER BY created_at DESC';
    
    // 获取所有符合条件的图片
    const db = await initDatabase();
    const allImages = await new Promise((resolve, reject) => {
      db.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    // 手动分页
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const images = allImages.slice(startIndex, endIndex);
    
    // 手动填充用户信息
    for (const img of images) {
      if (img.userId && img.userId !== 'anonymous') {
        const user = await User.findById(img.userId);
        img.userId = user ? {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          avatar: user.avatar
        } : { id: img.userId, username: '未知用户' };
      } else if (img.userId === 'anonymous') {
        img.userId = { id: 'anonymous', username: '匿名用户', nickname: '匿名用户' };
      }
    }

    const total = allImages.length;

    res.json({
      images: images.map(img => ({
        id: img.id,
        filename: img.filename,
        originalName: img.original_name,
        url: `/uploads/${img.storage_path}`,
        thumbnailUrl: img.thumbnail_path ? `/uploads/${img.thumbnail_path}` : `/uploads/${img.storage_path}`,
        fileSize: img.file_size,
        width: img.width,
        height: img.height,
        category: img.category,
        isPublic: img.is_public,
        description: img.description,
        tags: img.tags,
        accessCount: img.access_count,
        userId: img.user_id,
        username: img.userId?.username,
        nickname: img.userId?.nickname,
        avatar: img.userId?.avatar,
        createdAt: img.created_at
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('获取图片列表错误:', error);
    res.status(500).json({ message: '获取图片列表失败' });
  }
});

// 获取公开图片（专门为画廊页面设计）
router.get('/public', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    
    const db = await initDatabase();
    
    // 只获取公开图片 - 使用正确的字段名（数据库使用下划线命名）
    const sql = 'SELECT * FROM images WHERE is_public = ? ORDER BY created_at DESC LIMIT ? OFFSET ?';
    const params = [true, parseInt(limit), (page - 1) * parseInt(limit)];
    
    const images = await new Promise((resolve, reject) => {
      db.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    // 获取总数用于分页
    const countSql = 'SELECT COUNT(*) as total FROM images WHERE is_public = ?';
    const countResult = await new Promise((resolve, reject) => {
      db.db.get(countSql, [true], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    // 手动填充用户信息
    for (const img of images) {
      if (img.user_id && img.user_id !== 'anonymous') {
        const user = await User.findById(img.user_id);
        if (user) {
          img.userId = {
            id: user.id,
            username: user.username,
            nickname: user.nickname,
            avatar: user.avatar
          };
        } else {
          img.userId = { id: img.user_id, username: '未知用户', nickname: '未知用户' };
        }
      } else if (img.user_id === 'anonymous') {
        img.userId = { id: 'anonymous', username: '匿名用户', nickname: '匿名用户' };
      }
    }

    const total = countResult.total;

    // 如果没有图片，返回空数组而不是错误
    if (images.length === 0) {
      return res.json({
        images: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          pages: 0
        }
      });
    }

    res.json({
      images: images.map(img => ({
        id: img.id,
        filename: img.filename,
        originalName: img.original_name,
        url: `/uploads/${img.storage_path}`,
        thumbnailUrl: img.thumbnail_path ? `/uploads/${img.thumbnail_path}` : `/uploads/${img.storage_path}`,
        fileSize: img.file_size,
        width: img.width,
        height: img.height,
        category: img.category,
        isPublic: img.is_public,
        description: img.description,
        tags: img.tags,
        accessCount: img.access_count,
        userId: img.user_id,
        username: img.userId?.username,
        nickname: img.userId?.nickname,
        avatar: img.userId?.avatar,
        createdAt: img.created_at
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('获取公开图片错误:', error);
    res.status(500).json({ message: '获取公开图片失败' });
  }
});

// 获取单个图片详情
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    
    if (!image) {
      return res.status(404).json({ message: '图片不存在' });
    }

    // 手动获取用户信息
    let userInfo = null;
    if (image.userId && image.userId !== 'anonymous') {
      const user = await User.findById(image.userId);
      if (user) {
        userInfo = {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          avatar: user.avatar
        };
      }
    } else if (image.userId === 'anonymous') {
      userInfo = { id: 'anonymous', username: '匿名用户', nickname: '匿名用户' };
    }

    // 检查访问权限
    if (!image.isPublic && (!req.user || String(req.user.id) !== String(image.userId))) {
      return res.status(403).json({ message: '无权访问此图片' });
    }

    // 增加访问计数
    await image.incrementAccess();

    res.json({
      image: {
        id: image.id,
        filename: image.filename,
        originalName: image.originalName,
        url: `/uploads/${image.storagePath}`,
        thumbnailUrl: image.thumbnailPath ? `/uploads/${image.thumbnailPath}` : `/uploads/${image.storagePath}`,
        fileSize: image.fileSize,
        width: image.width,
        height: image.height,
        mimeType: image.mimeType,
        category: image.category,
        isPublic: image.isPublic,
        description: image.description,
        tags: image.tags,
        accessCount: image.accessCount,
        userId: image.userId,
        username: userInfo?.username,
        nickname: userInfo?.nickname,
        avatar: userInfo?.avatar,
        createdAt: image.createdAt,
        updatedAt: image.updatedAt
      }
    });

  } catch (error) {
    console.error('获取图片详情错误:', error);
    res.status(500).json({ message: '获取图片详情失败' });
  }
});

// 删除图片
router.delete('/:id', optionalAuth, async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    
    if (!image) {
      return res.status(404).json({ message: '图片不存在' });
    }

    // 检查权限（匿名用户只能删除自己上传的图片）
    if (!req.user && image.userId !== 'anonymous') {
      return res.status(403).json({ message: '匿名用户只能删除自己上传的图片' });
    }

    // 登录用户权限检查
    if (req.user && image.userId.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权删除此图片' });
    }

    // 删除物理文件
    const fullPath = path.join(process.env.UPLOAD_PATH || './uploads', image.storagePath);
    try {
      await fs.promises.unlink(fullPath);
    } catch (error) {
      console.warn('删除物理文件失败:', error);
    }

    // 删除缩略图（如果存在）
    if (image.thumbnailPath) {
      const thumbnailPath = path.join(process.env.THUMBNAIL_PATH || './thumbnails', image.thumbnailPath);
      try {
        await fs.promises.unlink(thumbnailPath);
      } catch (error) {
        console.warn('删除缩略图失败:', error);
      }
    }

    // 删除数据库记录
    await Image.findByIdAndDelete(req.params.id);

    // 更新用户存储使用量（仅限登录用户）
    if (req.user && req.user.id !== 'anonymous') {
      const user = await User.findById(req.user.id);
      user.updateStorage(image.fileSize, 'remove');
      await user.save();
    }

    res.json({ message: '图片删除成功' });

  } catch (error) {
    console.error('删除图片错误:', error);
    res.status(500).json({ message: '删除图片失败' });
  }
});

// 更新图片信息
router.put('/:id', optionalAuth, async (req, res) => {
  try {
    const { category, description, tags, isPublic } = req.body;
    const image = await Image.findById(req.params.id);
    
    if (!image) {
      return res.status(404).json({ message: '图片不存在' });
    }

    // 检查权限（匿名用户只能修改自己上传的图片）
    if (!req.user && image.userId !== 'anonymous') {
      return res.status(403).json({ message: '匿名用户只能修改自己上传的图片' });
    }

    // 登录用户权限检查
    if (req.user && image.userId.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权修改此图片' });
    }

    const updates = {};
    if (category !== undefined) updates.category = category;
    if (description !== undefined) updates.description = description;
    if (tags !== undefined) updates.tags = Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim());
    if (isPublic !== undefined) updates.isPublic = isPublic;

    const updatedImage = await Image.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      message: '图片信息更新成功',
      image: {
        id: updatedImage.id,
        filename: updatedImage.filename,
        originalName: updatedImage.originalName,
        url: `/uploads/${updatedImage.storagePath}`,
        category: updatedImage.category,
        isPublic: updatedImage.isPublic,
        description: updatedImage.description,
        tags: updatedImage.tags,
        updatedAt: updatedImage.updatedAt
      }
    });

  } catch (error) {
    console.error('更新图片信息错误:', error);
    res.status(500).json({ message: '更新图片信息失败' });
  }
});

export default router;