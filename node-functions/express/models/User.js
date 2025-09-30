import bcrypt from 'bcryptjs';
import { initDatabase } from '../database.js';

class User {
  constructor(data) {
    this.id = data.id;
    this.username = data.username;
    this.email = data.email;
    this.password = data.password;
    this.nickname = data.nickname || data.username;
    this.avatar = data.avatar || '';
    this.phone = data.phone || '';
    this.role = data.role || 'user';
    this.storageRule = data.storageRule || 'uuid';
    // 管理员用户默认无限期有效期
    this.accountExpiry = this.role === 'admin' ? null : (data.accountExpiry || null);
    this.corsWhitelist = data.corsWhitelist || [];
    this.storageUsed = data.storageUsed || 0;
    this.storageLimit = data.storageLimit || 1073741824; // 1GB
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.lastLogin = data.lastLogin || null;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  // 密码加密
  async encryptPassword() {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  }

  // 密码验证方法
  async comparePassword(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  }

  // 转换为JSON时移除密码
  toJSON() {
    const user = { ...this };
    delete user.password;
    return user;
  }

  // 检查存储空间是否足够
  hasEnoughSpace(fileSize) {
    return (this.storageUsed + fileSize) <= this.storageLimit;
  }

  // 更新存储使用量
  async updateStorage(fileSize, operation = 'add') {
    const db = await initDatabase();
    
    if (operation === 'add') {
      this.storageUsed += fileSize;
    } else if (operation === 'remove') {
      this.storageUsed = Math.max(0, this.storageUsed - fileSize);
    }
    this.updatedAt = new Date().toISOString();
    
    return new Promise((resolve, reject) => {
      db.db.run(
        'UPDATE users SET storageUsed = ?, updatedAt = ? WHERE id = ?',
        [this.storageUsed, this.updatedAt, this.id],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  // 保存到数据库
  async save() {
    const db = await initDatabase();
    
    if (!this.id) {
      // 新建用户
      return new Promise((resolve, reject) => {
        db.db.run(
          `INSERT INTO users (
            username, email, password, nickname, avatar, phone, role, 
            storageRule, accountExpiry, corsWhitelist, storageUsed, 
            storageLimit, isActive, lastLogin, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            this.username, this.email, this.password, this.nickname, this.avatar,
            this.phone, this.role, this.storageRule, this.accountExpiry,
            JSON.stringify(this.corsWhitelist), this.storageUsed, this.storageLimit,
            this.isActive, this.lastLogin, this.createdAt, this.updatedAt
          ],
          function(err) {
            if (err) reject(err);
            else {
              this.id = this.lastID;
              resolve(this);
            }
          }.bind(this)
        );
      });
    } else {
      // 更新用户
      return new Promise((resolve, reject) => {
        db.db.run(
          `UPDATE users SET 
            username = ?, email = ?, password = ?, nickname = ?, avatar = ?, 
            phone = ?, role = ?, storageRule = ?, accountExpiry = ?, 
            corsWhitelist = ?, storageUsed = ?, storageLimit = ?, 
            isActive = ?, lastLogin = ?, updatedAt = ?
          WHERE id = ?`,
          [
            this.username, this.email, this.password, this.nickname, this.avatar,
            this.phone, this.role, this.storageRule, this.accountExpiry,
            JSON.stringify(this.corsWhitelist), this.storageUsed, this.storageLimit,
            this.isActive, this.lastLogin, this.updatedAt, this.id
          ],
          function(err) {
            if (err) reject(err);
            else resolve(this);
          }.bind(this)
        );
      });
    }
  }
}

// 静态方法
User.findOne = async function(query) {
  const db = await initDatabase();
  
  return new Promise((resolve, reject) => {
    if (query.$or) {
      for (const condition of query.$or) {
        if (condition.email) {
          db.db.get('SELECT * FROM users WHERE email = ?', [condition.email], (err, user) => {
            if (err) reject(err);
            else if (user) resolve(new User(user));
          });
        }
        if (condition.username) {
          db.db.get('SELECT * FROM users WHERE username = ?', [condition.username], (err, user) => {
            if (err) reject(err);
            else if (user) resolve(new User(user));
          });
        }
      }
    }
    
    if (query.email) {
      db.db.get('SELECT * FROM users WHERE email = ?', [query.email], (err, user) => {
        if (err) reject(err);
        else if (user) resolve(new User(user));
        else resolve(null);
      });
    } else if (query.username) {
      db.db.get('SELECT * FROM users WHERE username = ?', [query.username], (err, user) => {
        if (err) reject(err);
        else if (user) resolve(new User(user));
        else resolve(null);
      });
    } else if (query.id) {
      db.db.get('SELECT * FROM users WHERE id = ?', [query.id], (err, user) => {
        if (err) reject(err);
        else if (user) resolve(new User(user));
        else resolve(null);
      });
    } else {
      resolve(null);
    }
  });
};

User.findById = async function(id) {
  const db = await initDatabase();
  return new Promise((resolve, reject) => {
    db.db.get('SELECT * FROM users WHERE id = ?', [id], (err, user) => {
      if (err) reject(err);
      else resolve(user ? new User(user) : null);
    });
  });
};

User.find = async function(query = {}) {
  const db = await initDatabase();
  let sql = 'SELECT * FROM users WHERE 1=1';
  const params = [];
  
  if (query.role) {
    sql += ' AND role = ?';
    params.push(query.role);
  }
  
  if (query.isActive !== undefined) {
    sql += ' AND isActive = ?';
    params.push(query.isActive);
  }
  
  const users = await db.all(sql, params);
  return users.map(user => new User(user));
};

User.deleteOne = async function(query) {
  const db = await initDatabase();
  
  if (query._id) {
    const result = await db.run('DELETE FROM users WHERE id = ?', [query._id]);
    return { deletedCount: result.changes };
  }
  
  if (query.id) {
    const result = await db.run('DELETE FROM users WHERE id = ?', [query.id]);
    return { deletedCount: result.changes };
  }
  
  return { deletedCount: 0 };
};

export default User;