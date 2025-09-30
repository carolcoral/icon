import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// JWT认证中间件
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: '访问令牌不存在' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('JWT解码信息:', decoded);
    
    const user = await User.findById(decoded.userId);
    console.log('查询到的用户:', user);
    
    if (!user) {
      console.log('用户不存在，用户ID:', decoded.userId);
      return res.status(401).json({ message: '用户不存在' });
    }
    
    if (!user.isActive) {
      return res.status(401).json({ message: '账户已被禁用' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: '令牌已过期' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: '无效的令牌' });
    }
    return res.status(500).json({ message: '服务器错误' });
  }
};

// 管理员权限检查
export const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: '需要管理员权限' });
  }
  next();
};

// 可选认证（不强制要求登录）
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    // 忽略认证错误，继续处理请求
    next();
  }
};