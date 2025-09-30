import express from 'express';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import Database from '../database.js';



// 配置multer用于头像上传
const upload = multer({
  dest: 'uploads/temp/',
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB限制
  }
});

const router = express.Router();

// 获取用户个人资料
router.get('/profile', authenticateToken, async (req, res) => {
  const db = new Database();
  const userId = req.user.id;
  
  db.db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      console.error('获取用户资料错误:', err);
      return res.status(500).json({ message: '获取用户资料失败' });
    }
    
    // 解析JSON字段
    let corsWhitelist = [];
    try {
      if (user.corsWhitelist) {
        corsWhitelist = JSON.parse(user.corsWhitelist);
      }
    } catch (error) {
      console.error('解析corsWhitelist错误:', error);
      corsWhitelist = [];
    }
    
    // 获取存储统计
    db.db.all('SELECT COUNT(*) as totalFiles, SUM(file_size) as totalSize FROM images WHERE user_id = ?', [userId], (err, statsResult) => {
      const storageStats = statsResult && statsResult.length > 0 ? {
        totalFiles: statsResult[0].totalFiles || 0,
        totalSize: statsResult[0].totalSize || 0
      } : { totalFiles: 0, totalSize: 0 };
      
      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          nickname: user.nickname,
          avatar: user.avatar,
          phone: user.phone,
          role: user.role,
          storageRule: user.storageRule,
          accountExpiry: user.accountExpiry,
          corsWhitelist: corsWhitelist,
          storageUsed: user.storageUsed,
          storageLimit: user.storageLimit,
          storageStats,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt
        }
      });
    });
  });
});

// 头像上传
router.post('/profile/avatar', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '请选择头像文件' });
    }

    // 验证文件类型和大小
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ message: '只支持 JPG、PNG、GIF 格式的图片' });
    }

    if (req.file.size > 2 * 1024 * 1024) {
      return res.status(400).json({ message: '头像文件大小不能超过 2MB' });
    }

    // 生成头像文件名
    const avatarFilename = `avatar_${req.user.id}_${Date.now()}.png`;
    const avatarPath = path.join('avatars', avatarFilename);
    const fullAvatarPath = path.join(process.env.UPLOAD_PATH || './uploads', avatarPath);

    // 确保目录存在
    await fs.mkdir(path.dirname(fullAvatarPath), { recursive: true });

    // 使用sharp处理图片：50x50圆形裁剪
    const image = sharp(req.file.path);
    
    // 获取图片元数据
    const metadata = await image.metadata();
    
    // 计算裁剪区域
    const size = Math.min(metadata.width, metadata.height);
    const left = Math.floor((metadata.width - size) / 2);
    const top = Math.floor((metadata.height - size) / 2);
    
    // 裁剪并调整大小
    await image
      .extract({ left, top, width: size, height: size })
      .resize(50, 50)
      .png()
      .toFile(fullAvatarPath);

    // 删除临时文件
    await fs.unlink(req.file.path);

    // 更新用户头像
    const avatarUrl = `/uploads/${avatarPath}`;
    const db = new Database();
    const userId = req.user.id;
    
    db.db.run('UPDATE users SET avatar = ? WHERE id = ?', [avatarUrl, userId], function(err) {
      if (err) {
        console.error('更新用户头像错误:', err);
        return res.status(500).json({ message: '头像上传失败' });
      }
      
      res.json({
        success: true,
        message: '头像上传成功',
        avatarUrl: avatarUrl
      });
    });
    return;

  } catch (error) {
    console.error('头像上传错误:', error);
    res.status(500).json({ message: '头像上传失败' });
  }
});

// 更新用户个人资料
router.put('/profile', authenticateToken, [
  body('email')
    .optional()
    .isEmail()
    .withMessage('请输入有效的邮箱地址'),
  body('nickname')
    .optional()
    .isLength({ max: 50 })
    .withMessage('昵称长度不能超过50个字符'),
  body('phone')
    .optional()
    .matches(/^[0-9+\-\s()]{10,20}$/)
    .withMessage('请输入有效的电话号码')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: '输入验证失败', 
        errors: errors.array() 
      });
    }

    const { email, nickname, phone, avatar } = req.body;
    const updates = {};
    
    if (email !== undefined) updates.email = email;
    if (nickname !== undefined) updates.nickname = nickname;
    if (phone !== undefined) updates.phone = phone;
    if (avatar !== undefined) updates.avatar = avatar;

    const db = new Database();
    const userId = req.user.id;
    
    // 构建更新语句
    const setClause = [];
    const values = [];
    
    if (email !== undefined) {
      setClause.push('email = ?');
      values.push(email);
    }
    if (nickname !== undefined) {
      setClause.push('nickname = ?');
      values.push(nickname);
    }
    if (phone !== undefined) {
      setClause.push('phone = ?');
      values.push(phone);
    }
    if (avatar !== undefined) {
      setClause.push('avatar = ?');
      values.push(avatar);
    }
    
    if (setClause.length === 0) {
      return res.status(400).json({ message: '没有要更新的字段' });
    }
    
    values.push(userId);
    
    db.db.run(`UPDATE users SET ${setClause.join(', ')} WHERE id = ?`, values, function(err) {
      if (err) {
        console.error('更新个人资料错误:', err);
        return res.status(500).json({ message: '更新个人资料失败' });
      }
      
      // 获取更新后的用户信息
      db.db.get('SELECT id, username, email, nickname, avatar, phone FROM users WHERE id = ?', [userId], (err, user) => {
        if (err) {
          console.error('获取用户信息错误:', err);
          return res.status(500).json({ message: '获取用户信息失败' });
        }
        
        res.json({
          message: '个人资料更新成功',
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            nickname: user.nickname,
            avatar: user.avatar,
            phone: user.phone
          }
        });
      });
    });

  } catch (error) {
    console.error('更新个人资料错误:', error);
    res.status(500).json({ message: '更新个人资料失败' });
  }
});

// 更新存储规则
router.put('/storage-rule', authenticateToken, [
  body('storageRule')
    .isIn(['uuid', 'md5', 'date', 'original'])
    .withMessage('无效的存储规则')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: '输入验证失败', 
        errors: errors.array() 
      });
    }

    const { storageRule } = req.body;

    const db = new Database();
    const userId = req.user.id;
    
    db.db.run('UPDATE users SET storageRule = ? WHERE id = ?', [storageRule, userId], function(err) {
      if (err) {
        console.error('更新存储规则错误:', err);
        return res.status(500).json({ message: '更新存储规则失败' });
      }
      
      db.db.get('SELECT storageRule FROM users WHERE id = ?', [userId], (err, user) => {
        if (err) {
          console.error('获取存储规则错误:', err);
          return res.status(500).json({ message: '获取存储规则失败' });
        }
        
        res.json({
          message: '存储规则更新成功',
          storageRule: user.storageRule
        });
      });
    });

  } catch (error) {
    console.error('更新存储规则错误:', error);
    res.status(500).json({ message: '更新存储规则失败' });
  }
});

// 更新跨域白名单
router.put('/cors-whitelist', authenticateToken, async (req, res) => {
  try {
    const { domains } = req.body;
    
    if (!Array.isArray(domains)) {
      return res.status(400).json({ message: '域名列表必须是数组' });
    }

    // 验证域名格式
    const domainRegex = /^https?:\/\/([\w.-]+)(:\d+)?(\/.*)?$/;
    const validDomains = domains.filter(domain => domainRegex.test(domain));
    
    const db = new Database();
    const userId = req.user.id;
    const corsWhitelistJson = JSON.stringify(validDomains);
    
    db.db.run('UPDATE users SET corsWhitelist = ? WHERE id = ?', [corsWhitelistJson, userId], function(err) {
      if (err) {
        console.error('更新跨域白名单错误:', err);
        return res.status(500).json({ message: '更新跨域白名单失败' });
      }
      
      db.db.get('SELECT corsWhitelist FROM users WHERE id = ?', [userId], (err, user) => {
        if (err) {
          console.error('获取跨域白名单错误:', err);
          return res.status(500).json({ message: '获取跨域白名单失败' });
        }
        
        const corsWhitelist = user.corsWhitelist ? JSON.parse(user.corsWhitelist) : [];
        
        res.json({
          message: '跨域白名单更新成功',
          corsWhitelist: corsWhitelist
        });
      });
    });

  } catch (error) {
    console.error('更新跨域白名单错误:', error);
    res.status(500).json({ message: '更新跨域白名单失败' });
  }
});

// 获取用户统计信息
router.get('/stats', authenticateToken, async (req, res) => {
  const db = new Database();
  const userId = req.user.id;
  
  // 获取存储统计
  db.db.all('SELECT COUNT(*) as totalFiles, SUM(file_size) as totalSize FROM images WHERE user_id = ?', [userId], (err, storageResult) => {
    if (err) {
      console.error('获取存储统计错误:', err);
      return res.status(500).json({ message: '获取存储统计失败' });
    }
    
    const storageStats = storageResult && storageResult.length > 0 ? {
      totalFiles: storageResult[0].totalFiles || 0,
      totalSize: storageResult[0].totalSize || 0
    } : { totalFiles: 0, totalSize: 0 };
    
    // 获取图片分类统计
    db.db.all('SELECT category, COUNT(*) as count, SUM(file_size) as totalSize FROM images WHERE user_id = ? GROUP BY category ORDER BY count DESC', [userId], (err, categoryStats) => {
      if (err) {
        console.error('获取分类统计错误:', err);
        return res.status(500).json({ message: '获取分类统计失败' });
      }
      
      // 获取最近上传的图片
      db.db.all('SELECT filename, original_name, file_size, category, created_at FROM images WHERE user_id = ? ORDER BY created_at DESC LIMIT 5', [userId], (err, recentImages) => {
        if (err) {
          console.error('获取最近图片错误:', err);
          return res.status(500).json({ message: '获取最近图片失败' });
        }
        
        res.json({
          storage: storageStats,
          categories: categoryStats,
          recentUploads: recentImages,
          summary: {
            totalImages: storageStats.totalFiles,
            totalStorage: storageStats.totalSize,
            storagePercentage: ((req.user.storageUsed / req.user.storageLimit) * 100).toFixed(1),
            categoryCount: categoryStats.length
          }
        });
      });
    });
  });
});

// 管理员接口：获取所有用户列表
router.get('/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    
    let query = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { nickname: { $regex: search, $options: 'i' } }
      ];
    }

    const db = new Database();
    
    let sql = 'SELECT id, username, email, nickname, avatar, phone, role, storageLimit, storageUsed, accountExpiry, isActive, lastLogin, createdAt FROM users';
    let countSql = 'SELECT COUNT(*) as total FROM users';
    let whereClause = '';
    let params = [];
    
    if (search) {
      whereClause = ' WHERE username LIKE ? OR email LIKE ? OR nickname LIKE ?';
      params = [`%${search}%`, `%${search}%`, `%${search}%`];
    }
    
    // 获取总数
    db.db.get(countSql + whereClause, params, (err, countResult) => {
      if (err) {
        console.error('获取用户总数错误:', err);
        return res.status(500).json({ message: '获取用户列表失败' });
      }
      
      const total = countResult.total;
      const offset = (page - 1) * limit;
      
      // 获取用户列表
      db.db.all(sql + whereClause + ' ORDER BY createdAt DESC LIMIT ? OFFSET ?', [...params, parseInt(limit), offset], (err, users) => {
        if (err) {
          console.error('获取用户列表错误:', err);
          return res.status(500).json({ message: '获取用户列表失败' });
        }
        
        res.json({
          users,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        });
      });
    });

  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({ message: '获取用户列表失败' });
  }
});

// 管理员接口：更新用户信息
router.put('/admin/users/:id', authenticateToken, requireAdmin, [
  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('无效的角色'),
  body('storageLimit')
    .optional()
    .isInt({ min: 0 })
    .withMessage('存储限制必须是正整数'),
  body('accountExpiry')
    .optional()
    .isISO8601()
    .withMessage('无效的日期格式')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: '输入验证失败', 
        errors: errors.array() 
      });
    }

    const { role, storageLimit, accountExpiry, isActive } = req.body;
    const updates = {};
    
    if (role !== undefined) updates.role = role;
    if (storageLimit !== undefined) updates.storageLimit = parseInt(storageLimit);
    if (accountExpiry !== undefined) updates.accountExpiry = accountExpiry ? new Date(accountExpiry) : null;
    if (isActive !== undefined) updates.isActive = isActive;

    const db = new Database();
    const userId = req.params.id;
    
    // 构建更新语句
    const setClause = [];
    const values = [];
    
    if (role !== undefined) {
      setClause.push('role = ?');
      values.push(role);
    }
    if (storageLimit !== undefined) {
      setClause.push('storageLimit = ?');
      values.push(parseInt(storageLimit));
    }
    if (accountExpiry !== undefined) {
      setClause.push('accountExpiry = ?');
      values.push(accountExpiry ? new Date(accountExpiry).toISOString() : null);
    }
    if (isActive !== undefined) {
      setClause.push('isActive = ?');
      values.push(isActive ? 1 : 0);
    }
    
    if (setClause.length === 0) {
      return res.status(400).json({ message: '没有要更新的字段' });
    }
    
    values.push(userId);
    
    db.db.run(`UPDATE users SET ${setClause.join(', ')} WHERE id = ?`, values, function(err) {
      if (err) {
        console.error('更新用户信息错误:', err);
        return res.status(500).json({ message: '更新用户信息失败' });
      }
      
      // 获取更新后的用户信息
      db.db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
        if (err) {
          console.error('获取用户信息错误:', err);
          return res.status(500).json({ message: '获取用户信息失败' });
        }
        
        res.json({
          message: '用户信息更新成功',
          user: user
        });
      });
    });

  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({ message: '更新用户信息失败' });
  }
});

// 管理员接口：删除用户
router.delete('/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // 检查是否尝试删除自己
    if (req.params.id === req.user.id.toString()) {
      return res.status(400).json({ message: '不能删除自己的账户' });
    }

    const db = new Database();
    const userId = req.params.id;
    
    // 删除用户的所有图片
    db.db.run('DELETE FROM images WHERE user_id = ?', [userId], function(err) {
      if (err) {
        console.error('删除用户图片错误:', err);
        return res.status(500).json({ message: '删除用户失败' });
      }
      
      // 删除用户
      db.db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
        if (err) {
          console.error('删除用户错误:', err);
          return res.status(500).json({ message: '删除用户失败' });
        }
        
        res.json({ message: '用户删除成功' });
      });
    });

  } catch (error) {
    console.error('删除用户错误:', error);
    res.status(500).json({ message: '删除用户失败' });
  }
});

export default router;