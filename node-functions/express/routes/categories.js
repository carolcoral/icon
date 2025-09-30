import express from 'express';
import { body, validationResult } from 'express-validator';
import Database from '../database.js';

const router = express.Router();
const db = new Database();

// 获取所有分类
router.get('/', (req, res) => {
  const sql = 'SELECT DISTINCT category FROM images WHERE category IS NOT NULL AND category != "" ORDER BY category';
  
  db.db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('获取分类列表错误:', err);
      return res.status(500).json({ message: '获取分类列表失败', error: err.message });
    }
    
    const categories = rows.map(row => ({
      name: row.category,
      count: 0 // 这里可以添加统计逻辑
    }));
    
    res.json({ categories });
  });
});

// 创建新分类
router.post('/', [
  body('name').notEmpty().withMessage('分类名称不能为空')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: '输入验证失败', 
      errors: errors.array() 
    });
  }
  
  const { name } = req.body;
  
  // 检查分类是否已存在
  const checkSql = 'SELECT COUNT(*) as count FROM images WHERE category = ?';
  db.db.get(checkSql, [name], (err, row) => {
    if (err) {
      console.error('检查分类错误:', err);
      return res.status(500).json({ message: '检查分类失败', error: err.message });
    }
    
    if (row.count > 0) {
      return res.status(400).json({ message: '分类已存在' });
    }
    
    // 这里可以添加创建分类的逻辑，但目前分类是通过图片的category字段管理的
    res.json({ message: '分类创建成功', category: { name } });
  });
});

// 更新分类名称
router.put('/:oldName', [
  body('newName').notEmpty().withMessage('新分类名称不能为空')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: '输入验证失败', 
      errors: errors.array() 
    });
  }
  
  const { oldName } = req.params;
  const { newName } = req.body;
  
  // 更新所有使用该分类的图片
  const updateSql = 'UPDATE images SET category = ? WHERE category = ?';
  db.db.run(updateSql, [newName, oldName], function(err) {
    if (err) {
      console.error('更新分类错误:', err);
      return res.status(500).json({ message: '更新分类失败', error: err.message });
    }
    
    res.json({ 
      message: '分类更新成功', 
      updatedCount: this.changes 
    });
  });
});

// 删除分类
router.delete('/:name', (req, res) => {
  const { name } = req.params;
  
  // 将使用该分类的图片分类设置为默认值
  const updateSql = 'UPDATE images SET category = "default" WHERE category = ?';
  db.db.run(updateSql, [name], function(err) {
    if (err) {
      console.error('删除分类错误:', err);
      return res.status(500).json({ message: '删除分类失败', error: err.message });
    }
    
    res.json({ 
      message: '分类删除成功', 
      updatedCount: this.changes 
    });
  });
});

// 获取分类统计信息
router.get('/stats', (req, res) => {
  const sql = `
    SELECT 
      category as name,
      COUNT(*) as imageCount,
      SUM(file_size) as totalSize
    FROM images 
    WHERE category IS NOT NULL AND category != ""
    GROUP BY category
    ORDER BY imageCount DESC
  `;
  
  db.db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('获取分类统计错误:', err);
      return res.status(500).json({ message: '获取分类统计失败', error: err.message });
    }
    
    res.json({ categories: rows });
  });
});

export default router;