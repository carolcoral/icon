import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import Database from '../database.js';
import fs from 'fs/promises';
import path from 'path';

const db = new Database();

const router = express.Router();

// 获取用户自己的图片列表
router.get('/my-images', authenticateToken, (req, res) => {
  try {
    const { page = 1, limit = 20, category, search } = req.query;
    
    let sql = 'SELECT * FROM images WHERE user_id = ?';
    const params = [req.user.id];
    
    // 分类筛选
    if (category && category !== 'all') {
      sql += ' AND category = ?';
      params.push(category);
    }
    
    // 搜索筛选
    if (search) {
      sql += ' AND (filename LIKE ? OR original_name LIKE ? OR description LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    sql += ' ORDER BY created_at DESC';

    db.db.all(sql, params, (err, allImages) => {
      if (err) {
        console.error('获取用户图片列表错误:', err);
        return res.status(500).json({ message: '获取图片列表失败' });
      }

      // 手动分页
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const images = allImages.slice(startIndex, endIndex);
      
      const total = allImages.length;

      // 获取分类列表
      const categories = [...new Set(allImages.map(img => img.category))];

      res.json({
        images,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        categories: ['all', ...categories],
        summary: {
          totalImages: total,
          totalCategories: categories.length
        }
      });
    });

  } catch (error) {
    console.error('获取用户图片列表错误:', error);
    res.status(500).json({ message: '获取图片列表失败' });
  }
});

// 批量更新图片分类
router.put('/batch-update-category', authenticateToken, [
  body('imageIds')
    .isArray()
    .withMessage('图片ID列表必须是数组')
    .isLength({ min: 1 })
    .withMessage('至少选择一个图片'),
  body('category')
    .optional()
    .isLength({ max: 50 })
    .withMessage('分类名称不能超过50个字符')
], (req, res) => {
  console.log('批量更新分类 - 进入路由处理程序');
  console.log('批量更新分类 - 请求方法:', req.method);
  console.log('批量更新分类 - 请求路径:', req.path);
  console.log('批量更新分类 - 请求体:', req.body);

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: '输入验证失败', 
        errors: errors.array() 
      });
    }

    const { imageIds, category } = req.body;

    // 确保图片ID是数字类型
    const numericImageIds = imageIds.map(id => parseInt(id));
    
    // 验证所有权并获取图片信息
    const placeholders = numericImageIds.map(() => '?').join(',');
    const sql = `SELECT * FROM images WHERE id IN (${placeholders}) AND user_id = ?`;
    const params = [...numericImageIds, req.user.id];
    
    console.log('批量更新分类 - SQL:', sql);
    console.log('批量更新分类 - 参数:', params);
    console.log('批量更新分类 - 用户ID:', req.user.id);
    console.log('批量更新分类 - 图片ID:', numericImageIds);
    console.log('批量更新分类 - 图片ID类型检查:', numericImageIds.map(id => ({id, type: typeof id})));
    
    db.db.all(sql, params, (err, images) => {
      if (err) {
        console.error('查询图片错误:', err);
        return res.status(500).json({ message: '查询图片失败' });
      }

      console.log('批量更新分类 - 查询结果数量:', images.length);
      console.log('批量更新分类 - 期望数量:', imageIds.length);
      console.log('批量更新分类 - 查询到的图片:', images.map(img => ({id: img.id, user_id: img.user_id, filename: img.filename})));
      
      if (images.length !== numericImageIds.length) {
        console.log('批量更新分类 - 权限验证失败: 图片数量不匹配');
        console.log('批量更新分类 - 查询到的图片ID:', images.map(img => img.id));
        console.log('批量更新分类 - 请求的图片ID:', numericImageIds);
        return res.status(403).json({ message: '部分图片不存在或无权访问' });
      }

      // 批量更新分类
      const updatePlaceholders = numericImageIds.map(() => '?').join(',');
      const updateSql = `UPDATE images SET category = ?, updated_at = CURRENT_TIMESTAMP WHERE id IN (${updatePlaceholders})`;
      const updateParams = [category || '', ...numericImageIds];
      
      console.log('批量更新分类 - 更新SQL:', updateSql);
      console.log('批量更新分类 - 更新参数:', updateParams);
      
      db.db.run(updateSql, updateParams, function(updateErr) {
        if (updateErr) {
          console.error('批量更新分类错误:', updateErr);
          return res.status(500).json({ message: '批量更新分类失败' });
        }

        console.log('批量更新分类 - 影响行数:', this.changes);
        
        res.json({ 
          message: `成功更新 ${this.changes} 张图片的分类`,
          updatedCount: this.changes,
          category: category || ''
        });
      });
    });

  } catch (error) {
    console.error('批量更新分类错误:', error);
    res.status(500).json({ message: '批量更新分类失败' });
  }
});

// 更新图片信息
router.put('/:id', authenticateToken, [
  body('category')
    .optional()
    .isLength({ max: 50 })
    .withMessage('分类名称不能超过50个字符'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('描述不能超过500个字符'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('公开状态必须是布尔值'),
  body('tags')
    .optional()
    .isLength({ max: 200 })
    .withMessage('标签不能超过200个字符')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: '输入验证失败', 
        errors: errors.array() 
      });
    }

    // 先检查图片是否存在且属于当前用户
    db.db.get('SELECT * FROM images WHERE id = ?', [req.params.id], (err, image) => {
      if (err) {
        console.error('查询图片错误:', err);
        return res.status(500).json({ message: '查询图片失败' });
      }

      if (!image || String(image.user_id) !== String(req.user.id)) {
        return res.status(404).json({ message: '图片不存在或无权访问' });
      }

      const { category, description, isPublic, tags } = req.body;
      
      // 构建更新SQL
      const updateFields = [];
      const updateParams = [];
      
      if (category !== undefined) {
        updateFields.push('category = ?');
        updateParams.push(category);
      }
      if (description !== undefined) {
        updateFields.push('description = ?');
        updateParams.push(description);
      }
      if (isPublic !== undefined) {
        updateFields.push('is_public = ?');
        updateParams.push(isPublic ? 1 : 0);
      }
      if (tags !== undefined) {
        updateFields.push('tags = ?');
        // 处理标签格式：支持字符串和数组
        let tagsValue;
        if (Array.isArray(tags)) {
          tagsValue = JSON.stringify(tags);
        } else if (typeof tags === 'string') {
          // 如果是逗号分隔的字符串，转换为数组再序列化
          tagsValue = JSON.stringify(tags.split(',').map(tag => tag.trim()).filter(tag => tag));
        } else {
          tagsValue = JSON.stringify([]);
        }
        updateParams.push(tagsValue);
      }
      
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      
      if (updateFields.length === 0) {
        return res.status(400).json({ message: '没有需要更新的字段' });
      }
      
      updateParams.push(req.params.id);
      
      const sql = `UPDATE images SET ${updateFields.join(', ')} WHERE id = ?`;
      
      db.db.run(sql, updateParams, function(updateErr) {
        if (updateErr) {
          console.error('更新图片信息错误:', updateErr);
          return res.status(500).json({ message: '更新图片信息失败' });
        }
        
        // 获取更新后的图片信息
        db.db.get('SELECT * FROM images WHERE id = ?', [req.params.id], (selectErr, updatedImage) => {
          if (selectErr) {
            console.error('获取更新后图片错误:', selectErr);
            return res.status(500).json({ message: '获取更新后图片失败' });
          }
          
          res.json({
            message: '图片信息更新成功',
            image: updatedImage
          });
        });
      });
    });

  } catch (error) {
    console.error('更新图片信息错误:', error);
    res.status(500).json({ message: '更新图片信息失败' });
  }
});

// 删除图片
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    // 先检查图片是否存在且属于当前用户
    db.db.get('SELECT * FROM images WHERE id = ?', [req.params.id], (err, image) => {
      if (err) {
        console.error('查询图片错误:', err);
        return res.status(500).json({ message: '查询图片失败' });
      }

      if (!image || String(image.user_id) !== String(req.user.id)) {
        return res.status(404).json({ message: '图片不存在或无权访问' });
      }

      // 删除文件
      const deleteFile = (filePath) => {
        return fs.unlink(path.join(process.env.UPLOAD_PATH || './uploads', filePath))
          .catch(fileError => {
            console.warn('删除文件失败:', fileError);
          });
      };

      Promise.all([
        deleteFile(image.storage_path),
        image.thumbnail_path ? deleteFile(image.thumbnail_path) : Promise.resolve()
      ]).then(() => {
        // 更新用户存储使用量
        const updateUserSql = 'UPDATE users SET storage_used = storage_used - ? WHERE id = ?';
        db.db.run(updateUserSql, [image.file_size, req.user.id], (updateErr) => {
          if (updateErr) {
            console.warn('更新用户存储使用量失败:', updateErr);
          }

          // 删除数据库记录
          db.db.run('DELETE FROM images WHERE id = ?', [req.params.id], (deleteErr) => {
            if (deleteErr) {
              console.error('删除图片记录错误:', deleteErr);
              return res.status(500).json({ message: '删除图片失败' });
            }

            res.json({ message: '图片删除成功' });
          });
        });
      }).catch(error => {
        console.error('删除文件错误:', error);
        res.status(500).json({ message: '删除图片失败' });
      });
    });

  } catch (error) {
    console.error('删除图片错误:', error);
    res.status(500).json({ message: '删除图片失败' });
  }
});

// 批量删除图片
router.delete('/', authenticateToken, [
  body('imageIds')
    .isArray()
    .withMessage('图片ID列表必须是数组')
    .isLength({ min: 1 })
    .withMessage('至少选择一个图片')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: '输入验证失败', 
        errors: errors.array() 
      });
    }

    const { imageIds } = req.body;

    // 验证所有权并获取图片信息
    const placeholders = imageIds.map(() => '?').join(',');
    const sql = `SELECT * FROM images WHERE id IN (${placeholders}) AND user_id = ?`;
    const params = [...imageIds, req.user.id];
    
    db.db.all(sql, params, (err, images) => {
      if (err) {
        console.error('查询图片错误:', err);
        return res.status(500).json({ message: '查询图片失败' });
      }

      if (images.length !== imageIds.length) {
        return res.status(403).json({ message: '部分图片不存在或无权访问' });
      }

      let totalFreedSpace = 0;

      // 删除文件和数据库记录
      const deletePromises = images.map(image => {
        totalFreedSpace += image.file_size;
        
        const deleteFile = (filePath) => {
          return fs.unlink(path.join(process.env.UPLOAD_PATH || './uploads', filePath))
            .catch(fileError => {
              console.warn(`删除文件 ${image.filename} 失败:`, fileError);
            });
        };

        return Promise.all([
          deleteFile(image.storage_path),
          image.thumbnail_path ? deleteFile(image.thumbnail_path) : Promise.resolve()
        ]).then(() => {
          return new Promise((resolve, reject) => {
            db.db.run('DELETE FROM images WHERE id = ?', [image.id], (deleteErr) => {
              if (deleteErr) {
                reject(deleteErr);
              } else {
                resolve();
              }
            });
          });
        });
      });

      Promise.all(deletePromises)
        .then(() => {
          // 更新用户存储使用量
          const updateUserSql = 'UPDATE users SET storage_used = storage_used - ? WHERE id = ?';
          db.db.run(updateUserSql, [totalFreedSpace, req.user.id], (updateErr) => {
            if (updateErr) {
              console.warn('更新用户存储使用量失败:', updateErr);
            }

            res.json({ 
              message: `成功删除 ${images.length} 张图片`,
              deletedCount: images.length,
              freedSpace: totalFreedSpace
            });
          });
        })
        .catch(error => {
          console.error('批量删除图片错误:', error);
          res.status(500).json({ message: '批量删除图片失败' });
        });
    });

  } catch (error) {
    console.error('批量删除图片错误:', error);
    res.status(500).json({ message: '批量删除图片失败' });
  }
});

// 获取图片统计信息
router.get('/stats', authenticateToken, (req, res) => {
  try {
    // 获取用户所有图片
    db.db.all('SELECT * FROM images WHERE user_id = ?', [req.user.id], (err, images) => {
      if (err) {
        console.error('获取图片统计错误:', err);
        return res.status(500).json({ message: '获取图片统计失败' });
      }
      
      // 按分类统计
      const categoryStats = {};
      images.forEach(image => {
        const category = image.category || 'default';
        if (!categoryStats[category]) {
          categoryStats[category] = {
            _id: category,
            count: 0,
            totalSize: 0,
            publicCount: 0
          };
        }
        categoryStats[category].count++;
        categoryStats[category].totalSize += image.file_size;
        if (image.is_public) {
          categoryStats[category].publicCount++;
        }
      });
      
      const categoryStatsArray = Object.values(categoryStats).sort((a, b) => b.count - a.count);

      // 按时间统计（最近30天）
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentStats = {};
      images.forEach(image => {
        const imageDate = new Date(image.created_at);
        if (imageDate >= thirtyDaysAgo) {
          const dateStr = imageDate.toISOString().split('T')[0];
          if (!recentStats[dateStr]) {
            recentStats[dateStr] = {
              _id: dateStr,
              count: 0,
              totalSize: 0
            };
          }
          recentStats[dateStr].count++;
          recentStats[dateStr].totalSize += image.file_size;
        }
      });
      
      const recentStatsArray = Object.values(recentStats).sort((a, b) => a._id.localeCompare(b._id));

      // 总体统计
      const totalStats = {
        totalImages: images.length,
        totalSize: images.reduce((sum, img) => sum + img.file_size, 0),
        publicImages: images.filter(img => img.is_public).length,
        privateImages: images.filter(img => !img.is_public).length,
        categories: [...new Set(images.map(img => img.category))]
      };

      res.json({
        summary: {
          totalImages: totalStats.totalImages,
          totalSize: totalStats.totalSize,
          publicImages: totalStats.publicImages,
          privateImages: totalStats.privateImages,
          categoryCount: totalStats.categories.length
        },
        categories: categoryStatsArray,
        recentUploads: recentStatsArray,
        storage: {
          used: req.user.storage_used,
          limit: req.user.storage_limit,
          percentage: ((req.user.storage_used / req.user.storage_limit) * 100).toFixed(1)
        }
      });
    });

  } catch (error) {
    console.error('获取图片统计错误:', error);
    res.status(500).json({ message: '获取图片统计失败' });
  }
});

// 管理员接口：获取所有图片（带筛选）
router.get('/admin/all-images', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { page = 1, limit = 20, userId, category, isPublic, search } = req.query;
    
    let sql = 'SELECT * FROM images WHERE 1=1';
    const params = [];
    
    // 用户筛选
    if (userId) {
      sql += ' AND user_id = ?';
      params.push(userId);
    }
    
    // 分类筛选
    if (category && category !== 'all') {
      sql += ' AND category = ?';
      params.push(category);
    }
    
    // 公开状态筛选
    if (isPublic !== undefined) {
      sql += ' AND is_public = ?';
      params.push(isPublic === 'true' ? 1 : 0);
    }
    
    // 搜索筛选
    if (search) {
      sql += ' AND (filename LIKE ? OR original_name LIKE ? OR description LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    sql += ' ORDER BY created_at DESC';

    db.db.all(sql, params, (err, allImages) => {
      if (err) {
        console.error('获取所有图片错误:', err);
        return res.status(500).json({ message: '获取图片列表失败' });
      }
      
      // 手动分页
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const images = allImages.slice(startIndex, endIndex);
      
      const total = allImages.length;

      res.json({
        images,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    });

  } catch (error) {
    console.error('获取所有图片错误:', error);
    res.status(500).json({ message: '获取图片列表失败' });
  }
});

// 管理员接口：删除用户图片
router.delete('/admin/images/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    // 查询图片信息
    db.db.get('SELECT * FROM images WHERE id = ?', [req.params.id], (err, image) => {
      if (err) {
        console.error('查询图片错误:', err);
        return res.status(500).json({ message: '查询图片失败' });
      }

      if (!image) {
        return res.status(404).json({ message: '图片不存在' });
      }

      // 删除文件
      const deleteFile = (filePath) => {
        return fs.unlink(path.join(process.env.UPLOAD_PATH || './uploads', filePath))
          .catch(fileError => {
            console.warn('删除文件失败:', fileError);
          });
      };

      Promise.all([
        deleteFile(image.storage_path),
        image.thumbnail_path ? deleteFile(image.thumbnail_path) : Promise.resolve()
      ]).then(() => {
        // 更新用户存储使用量
        if (image.user_id) {
          const updateUserSql = 'UPDATE users SET storage_used = storage_used - ? WHERE id = ?';
          db.db.run(updateUserSql, [image.file_size, image.user_id], (updateErr) => {
            if (updateErr) {
              console.warn('更新用户存储使用量失败:', updateErr);
            }

            // 删除数据库记录
            db.db.run('DELETE FROM images WHERE id = ?', [req.params.id], (deleteErr) => {
              if (deleteErr) {
                console.error('删除图片记录错误:', deleteErr);
                return res.status(500).json({ message: '删除图片失败' });
              }

              res.json({ message: '图片删除成功' });
            });
          });
        } else {
          // 直接删除数据库记录（如果没有用户ID）
          db.db.run('DELETE FROM images WHERE id = ?', [req.params.id], (deleteErr) => {
            if (deleteErr) {
              console.error('删除图片记录错误:', deleteErr);
              return res.status(500).json({ message: '删除图片失败' });
            }

            res.json({ message: '图片删除成功' });
          });
        }
      }).catch(error => {
        console.error('删除文件错误:', error);
        res.status(500).json({ message: '删除图片失败' });
      });
    });

  } catch (error) {
    console.error('管理员删除图片错误:', error);
    res.status(500).json({ message: '删除图片失败' });
  }
});

// 批量更新图片分类
router.put('/batch-update-category', authenticateToken, [
  body('imageIds')
    .isArray()
    .withMessage('图片ID列表必须是数组')
    .isLength({ min: 1 })
    .withMessage('至少选择一个图片'),
  body('category')
    .optional()
    .isLength({ max: 50 })
    .withMessage('分类名称不能超过50个字符')
], (req, res) => {
  console.log('批量更新分类 - 进入路由处理程序');
  console.log('批量更新分类 - 请求方法:', req.method);
  console.log('批量更新分类 - 请求路径:', req.path);
  console.log('批量更新分类 - 请求体:', req.body);
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: '输入验证失败', 
        errors: errors.array() 
      });
    }

    const { imageIds, category } = req.body;

    // 确保图片ID是数字类型
    const numericImageIds = imageIds.map(id => parseInt(id));
    
    // 验证所有权并获取图片信息
    const placeholders = numericImageIds.map(() => '?').join(',');
    const sql = `SELECT * FROM images WHERE id IN (${placeholders}) AND user_id = ?`;
    const params = [...numericImageIds, req.user.id];
    
    console.log('批量更新分类 - SQL:', sql);
    console.log('批量更新分类 - 参数:', params);
    console.log('批量更新分类 - 用户ID:', req.user.id);
    console.log('批量更新分类 - 图片ID:', numericImageIds);
    console.log('批量更新分类 - 图片ID类型检查:', numericImageIds.map(id => ({id, type: typeof id})));
    
    db.db.all(sql, params, (err, images) => {
      if (err) {
        console.error('查询图片错误:', err);
        return res.status(500).json({ message: '查询图片失败' });
      }

      console.log('批量更新分类 - 查询结果数量:', images.length);
      console.log('批量更新分类 - 期望数量:', imageIds.length);
      console.log('批量更新分类 - 查询到的图片:', images.map(img => ({id: img.id, user_id: img.user_id, filename: img.filename})));
      
      if (images.length !== numericImageIds.length) {
        console.log('批量更新分类 - 权限验证失败: 图片数量不匹配');
        console.log('批量更新分类 - 查询到的图片ID:', images.map(img => img.id));
        console.log('批量更新分类 - 请求的图片ID:', numericImageIds);
        return res.status(403).json({ message: '部分图片不存在或无权访问' });
      }

      // 批量更新分类
      const updatePlaceholders = numericImageIds.map(() => '?').join(',');
      const updateSql = `UPDATE images SET category = ?, updated_at = CURRENT_TIMESTAMP WHERE id IN (${updatePlaceholders})`;
      const updateParams = [category || '', ...numericImageIds];
      
      console.log('批量更新分类 - 更新SQL:', updateSql);
      console.log('批量更新分类 - 更新参数:', updateParams);
      
      db.db.run(updateSql, updateParams, function(updateErr) {
        if (updateErr) {
          console.error('批量更新分类错误:', updateErr);
          return res.status(500).json({ message: '批量更新分类失败' });
        }

        console.log('批量更新分类 - 影响行数:', this.changes);
        
        res.json({ 
          message: `成功更新 ${this.changes} 张图片的分类`,
          updatedCount: this.changes,
          category: category || ''
        });
      });
    });

  } catch (error) {
    console.error('批量更新分类错误:', error);
    res.status(500).json({ message: '批量更新分类失败' });
  }
});

export default router;