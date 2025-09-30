import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

// 导入路由
import authRoutes from './routes/auth.js';
import imageRoutes from './routes/images.js';
import userRoutes from './routes/users.js';
import imageManagementRoutes from './routes/image-management.js';
import categoryRoutes from './routes/categories.js';
import { initDatabase } from './database.js';

// 环境变量配置
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: true, // 允许所有来源
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件服务 - 配置为允许嵌套目录访问
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  dotfiles: 'allow',
  index: false
}));

// 创建默认管理员用户（SQLite数据库）
const createDefaultAdmin = async () => {
  try {
    const Database = await import('./database.js');
    const db = new Database.default();
    
    // 检查管理员用户是否已存在
    const existingAdmin = await new Promise((resolve, reject) => {
      db.db.get('SELECT * FROM users WHERE username = ?', ['admin'], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!existingAdmin) {
      // 创建管理员用户
      const bcryptModule = await import('bcryptjs');
      const bcrypt = bcryptModule.default || bcryptModule;
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await new Promise((resolve, reject) => {
        db.db.run(
          'INSERT INTO users (username, email, password, nickname, role, created_at) VALUES (?, ?, ?, ?, ?, ?)',
          ['admin', 'admin@example.com', hashedPassword, '系统管理员', 'admin', new Date().toISOString()],
          function(err) {
            if (err) reject(err);
            else {
              console.log('默认管理员用户已创建: admin/admin123');
              resolve(this);
            }
          }
        );
      });
    } else {
      console.log('管理员用户已存在:', existingAdmin.username);
    }
  } catch (error) {
    console.error('创建管理员用户失败:', error);
  }
};

// 路由配置
app.use('/api/auth', authRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/image-management', imageManagementRoutes);
app.use('/api/categories', categoryRoutes);

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || '服务器内部错误',
    error: process.env.NODE_ENV === 'production' ? {} : err.stack
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({ message: '接口不存在' });
});

// 启动服务器
const startServer = async () => {
  // 初始化数据库
  await initDatabase();
  // 创建默认管理员用户
  await createDefaultAdmin();
  
  app.listen(PORT, () => {
    console.log(`图床服务后端运行在端口 ${PORT}`);
    console.log(`健康检查: http://localhost:${PORT}/api/health`);
  });
};

startServer().catch(error => {
  console.error('服务器启动失败:', error);
  process.exit(1);
});

export default app;