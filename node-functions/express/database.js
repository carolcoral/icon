import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Database {
  constructor() {
    this.dbPath = path.join(__dirname, 'data', 'imagehost.db');
    this.init();
  }

  init() {
    // 确保数据目录存在
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    this.db = new sqlite3.Database(this.dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
      } else {
        console.log('Connected to SQLite database.');
        this.createTables();
      }
    });
  }

  createTables() {
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        email TEXT,
        nickname TEXT,
        avatar TEXT,
        phone TEXT,
        role TEXT DEFAULT 'user',
        storageRule TEXT DEFAULT 'uuid',
        accountExpiry DATETIME,
        corsWhitelist TEXT DEFAULT '[]',
        storageUsed INTEGER DEFAULT 0,
        storageLimit INTEGER DEFAULT 1073741824,
        isActive BOOLEAN DEFAULT 1,
        lastLogin DATETIME,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createImagesTable = `
      CREATE TABLE IF NOT EXISTS images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        filename TEXT NOT NULL,
        original_name TEXT,
        storage_path TEXT NOT NULL,
        file_size INTEGER,
        mime_type TEXT,
        width INTEGER DEFAULT 0,
        height INTEGER DEFAULT 0,
        category TEXT DEFAULT 'default',
        is_public BOOLEAN DEFAULT 1,
        description TEXT DEFAULT '',
        tags TEXT DEFAULT '[]',
        access_count INTEGER DEFAULT 0,
        thumbnail_path TEXT,
        metadata TEXT DEFAULT '{}',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    this.db.run(createUsersTable, (err) => {
      if (err) {
        console.error('Error creating users table:', err.message);
      } else {
        console.log('Users table created or already exists.');
      }
    });

    this.db.run(createImagesTable, (err) => {
      if (err) {
        console.error('Error creating images table:', err.message);
      } else {
        console.log('Images table created or already exists.');
        this.insertDefaultUser();
      }
    });
  }

  async insertDefaultUser() {
    try {
      // 使用动态导入来避免require问题
      const bcryptModule = await import('bcryptjs');
      const bcrypt = bcryptModule.default || bcryptModule;
      const defaultPassword = bcrypt.hashSync('admin123', 10);
      
      const insertUser = `
        INSERT OR IGNORE INTO users (username, password, email) 
        VALUES (?, ?, ?)
      `;

      return new Promise((resolve, reject) => {
        this.db.run(insertUser, ['admin', defaultPassword, 'admin@example.com'], function(err) {
          if (err) {
            console.error('Error inserting default user:', err.message);
            reject(err);
          } else {
            console.log('Default user created or already exists.');
            resolve(this);
          }
        });
      });
    } catch (error) {
      console.error('创建默认用户失败:', error);
    }
  }

  // 用户相关方法
  getUserByUsername(username, callback) {
    const sql = 'SELECT * FROM users WHERE username = ?';
    this.db.get(sql, [username], callback);
  }

  createUser(userData, callback) {
    const sql = 'INSERT INTO users (username, password, email) VALUES (?, ?, ?)';
    this.db.run(sql, [userData.username, userData.password, userData.email], callback);
  }

  // 图片相关方法
  createImage(imageData, callback) {
    const sql = `
      INSERT INTO images (user_id, filename, original_name, storage_path, file_size, mime_type, category, description, is_public)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    this.db.run(sql, [
      imageData.user_id,
      imageData.filename,
      imageData.original_name,
      imageData.storage_path,
      imageData.file_size,
      imageData.mime_type,
      imageData.category,
      imageData.description,
      imageData.is_public
    ], callback);
  }

  getImagesByUserId(userId, callback) {
    const sql = 'SELECT * FROM images WHERE user_id = ? ORDER BY created_at DESC';
    this.db.all(sql, [userId], callback);
  }

  getAllPublicImages(callback) {
    const sql = 'SELECT * FROM images WHERE is_public = 1 ORDER BY created_at DESC';
    this.db.all(sql, callback);
  }

  getImageById(id, callback) {
    const sql = 'SELECT * FROM images WHERE id = ?';
    this.db.get(sql, [id], callback);
  }

  deleteImage(id, callback) {
    const sql = 'DELETE FROM images WHERE id = ?';
    this.db.run(sql, [id], callback);
  }

  close() {
    this.db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database connection closed.');
      }
    });
  }
}

// 初始化数据库函数
export const initDatabase = async () => {
  const db = new Database();
  return db;
};

export default Database;