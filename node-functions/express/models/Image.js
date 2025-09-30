import { initDatabase } from '../database.js';

class Image {
  constructor(data) {
    // 处理数据库字段名（下划线命名）和模型属性名（驼峰命名）的映射
    // 优先使用数据库字段名（下划线命名），如果不存在则使用模型属性名
    this.id = data.id;
    this.filename = data.filename;
    this.originalName = data.original_name || data.originalName;
    this.storagePath = data.storage_path || data.storagePath;
    this.fileSize = data.file_size || data.fileSize;
    this.mimeType = data.mime_type || data.mimeType;
    this.width = data.width || 0;
    this.height = data.height || 0;
    this.userId = data.user_id || data.userId;
    this.category = data.category || 'default';
    this.isPublic = data.is_public !== undefined ? data.is_public : (data.isPublic !== undefined ? data.isPublic : false);
    this.description = data.description || '';
    this.tags = Array.isArray(data.tags) ? data.tags : (data.tags ? JSON.parse(data.tags) : []);
    this.accessCount = data.access_count || data.accessCount || 0;
    this.thumbnailPath = data.thumbnail_path || data.thumbnailPath || '';
    this.metadata = data.metadata || (data.metadata ? JSON.parse(data.metadata) : {});
    this.createdAt = data.created_at || data.createdAt || new Date().toISOString();
    this.updatedAt = data.updated_at || data.updatedAt || new Date().toISOString();
  }

  // 转换为JSON
  toJSON() {
    return {
      id: this.id,
      filename: this.filename,
      originalName: this.originalName,
      storagePath: this.storagePath,
      fileSize: this.fileSize,
      mimeType: this.mimeType,
      width: this.width,
      height: this.height,
      userId: this.userId,
      category: this.category,
      isPublic: this.isPublic,
      description: this.description,
      tags: this.tags,
      accessCount: this.accessCount,
      thumbnailPath: this.thumbnailPath,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      // 虚拟字段 - 使用实际的存储路径字段
      url: this.storagePath ? `/uploads/${this.storagePath}` : null,
      thumbnailUrl: this.thumbnailPath ? `/uploads/${this.thumbnailPath}` : (this.storagePath ? `/uploads/${this.storagePath}` : null)
    };
  }

  // 增加访问计数
  async incrementAccess() {
    const db = await initDatabase();
    this.accessCount += 1;
    this.updatedAt = new Date().toISOString();
    
    return new Promise((resolve, reject) => {
      db.db.run(
        'UPDATE images SET access_count = ?, updated_at = ? WHERE id = ?',
        [this.accessCount, this.updatedAt, this.id],
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve(this);
          }
        }
      );
    });
  }

  // 保存到数据库
  async save() {
    const db = await initDatabase();
    
    return new Promise((resolve, reject) => {
      if (!this.id) {
        // 新建图片
        const sql = `INSERT INTO images (
          filename, original_name, storage_path, file_size, mime_type, width, height,
          user_id, category, is_public, description, tags, access_count, 
          thumbnail_path, metadata, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        
        const params = [
          this.filename, this.originalName, this.storagePath, this.fileSize,
          this.mimeType, this.width, this.height, this.userId, this.category,
          Boolean(this.isPublic), this.description, JSON.stringify(this.tags),
          this.accessCount, this.thumbnailPath, JSON.stringify(this.metadata),
          this.createdAt, this.updatedAt
        ];
        
        db.db.run(sql, params, function(err) {
          if (err) {
            reject(err);
          } else {
            this.id = this.lastID;
            resolve(this);
          }
        }.bind(this));
      } else {
        // 更新图片
        const sql = `UPDATE images SET 
          filename = ?, original_name = ?, storage_path = ?, file_size = ?, 
          mime_type = ?, width = ?, height = ?, user_id = ?, category = ?, 
          is_public = ?, description = ?, tags = ?, access_count = ?, 
          thumbnail_path = ?, metadata = ?, updated_at = ?
        WHERE id = ?`;
        
        const params = [
          this.filename, this.originalName, this.storagePath, this.fileSize,
          this.mimeType, this.width, this.height, this.userId, this.category,
          Boolean(this.isPublic), this.description, JSON.stringify(this.tags),
          this.accessCount, this.thumbnailPath, JSON.stringify(this.metadata),
          this.updatedAt, this.id
        ];
        
        db.db.run(sql, params, function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this);
          }
        }.bind(this));
      }
    });
  }
}

// 静态方法
Image.find = async function(query = {}) {
  const db = await initDatabase();
  let sql = 'SELECT * FROM images WHERE 1=1';
  const params = [];
  
  // 处理查询条件
  if (query.$or) {
    const orConditions = [];
    for (const condition of query.$or) {
      if (condition.userId) {
        orConditions.push('user_id = ?');
        params.push(condition.userId);
      }
      if (condition.isPublic) {
        orConditions.push('is_public = ?');
        params.push(condition.isPublic);
      }
    }
    if (orConditions.length > 0) {
      sql += ` AND (${orConditions.join(' OR ')})`;
    }
  }
  
  if (query.isPublic !== undefined) {
    sql += ' AND is_public = ?';
    params.push(query.isPublic);
  }
  
  if (query.userId) {
    sql += ' AND user_id = ?';
    params.push(query.userId);
  }
  
  if (query.category && query.category !== 'all') {
    sql += ' AND category = ?';
    params.push(query.category);
  }
  
  // 处理搜索条件
  if (query.$or && query.$or.length > 0) {
    const searchConditions = query.$or.filter(cond => 
      cond.originalName || cond.description || cond.tags
    );
    
    if (searchConditions.length > 0) {
      const searchText = searchConditions[0].originalName?.$regex || 
                        searchConditions[0].description?.$regex || '';
      
      if (searchText) {
        sql += ' AND (original_name LIKE ? OR description LIKE ? OR tags LIKE ?)';
        const searchPattern = `%${searchText}%`;
        params.push(searchPattern, searchPattern, searchPattern);
      }
    }
  }
  
  // 处理直接搜索条件
  if (query.search) {
    sql += ' AND (original_name LIKE ? OR description LIKE ? OR tags LIKE ?)';
    const searchPattern = `%${query.search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }
  
  // 排序
  sql += ' ORDER BY created_at DESC';
  
  return new Promise((resolve, reject) => {
    db.db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        const images = rows.map(img => new Image(img));
        resolve(images);
      }
    });
  });
};

Image.findById = async function(id) {
  const db = await initDatabase();
  return new Promise((resolve, reject) => {
    db.db.get('SELECT * FROM images WHERE id = ?', [id], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row ? new Image(row) : null);
      }
    });
  });
};

Image.countDocuments = async function(query = {}) {
  const images = await Image.find(query);
  return images.length;
};

Image.findByIdAndUpdate = async function(id, updates, options = {}) {
  const image = await Image.findById(id);
  if (!image) return null;
  
  Object.assign(image, updates);
  image.updatedAt = new Date().toISOString();
  
  await image.save();
  
  if (options.new) {
    return image;
  }
  return image;
};

Image.findByIdAndDelete = async function(id) {
  const db = await initDatabase();
  const image = await Image.findById(id);
  if (!image) return null;
  
  return new Promise((resolve, reject) => {
    db.db.run('DELETE FROM images WHERE id = ?', [id], (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(image);
      }
    });
  });
};



export default Image;