import express from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 生成JWT令牌
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// 用户注册
router.post('/register', [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('用户名长度必须在3-30个字符之间')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('用户名只能包含字母、数字和下划线'),
  body('email')
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('密码长度至少6个字符')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: '输入验证失败', 
        errors: errors.array() 
      });
    }

    const { username, email, password, nickname } = req.body;

    // 检查用户是否已存在
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: '用户名或邮箱已被注册' 
      });
    }

    // 创建新用户
    const user = new User({
      username,
      email,
      password,
      nickname: nickname || username
    });

    await user.encryptPassword();
    await user.save();

    // 生成令牌
    const token = generateToken(user.id);

    res.status(201).json({
      message: '注册成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        nickname: user.nickname,
        role: user.role
      }
    });

  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

// 用户登录
router.post('/login', [
  body('username')
    .notEmpty()
    .withMessage('请输入用户名'),
  body('password')
    .notEmpty()
    .withMessage('请输入密码')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: '输入验证失败', 
        errors: errors.array() 
      });
    }

    const { username, password } = req.body;

    // 查找用户
    const user = await User.findOne({ username });

    console.log('登录请求:', { username, userFound: !!user });
    if (user) {
      console.log('用户信息:', { 
        username: user.username, 
        email: user.email,
        passwordLength: user.password ? user.password.length : 0 
      });
    }

    if (!user) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: '账户已被禁用' });
    }

    // 验证密码
    console.log('开始密码验证...');
    const isPasswordValid = await user.comparePassword(password);
    console.log('密码验证结果:', isPasswordValid);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    // 更新最后登录时间
    user.lastLogin = new Date();
    await user.save();

    // 生成令牌
    const token = generateToken(user.id);

    res.json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        nickname: user.nickname,
        role: user.role,
        avatar: user.avatar,
        storageRule: user.storageRule,
        storageUsed: user.storageUsed,
        storageLimit: user.storageLimit
      }
    });

  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

// 获取当前用户信息
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        nickname: req.user.nickname,
        role: req.user.role,
        avatar: req.user.avatar,
        phone: req.user.phone,
        storageRule: req.user.storageRule,
        accountExpiry: req.user.accountExpiry,
        corsWhitelist: req.user.corsWhitelist,
        storageUsed: req.user.storageUsed,
        storageLimit: req.user.storageLimit,
        lastLogin: req.user.lastLogin,
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

// 验证令牌
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    res.json({
      message: '令牌有效',
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        nickname: req.user.nickname,
        role: req.user.role,
        avatar: req.user.avatar,
        phone: req.user.phone,
        storageRule: req.user.storageRule,
        accountExpiry: req.user.accountExpiry,
        corsWhitelist: req.user.corsWhitelist,
        storageUsed: req.user.storageUsed,
        storageLimit: req.user.storageLimit,
        lastLogin: req.user.lastLogin,
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    console.error('验证令牌错误:', error);
    res.status(401).json({ message: '令牌无效' });
  }
});

// 刷新令牌
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    const token = generateToken(req.user.id);
    res.json({
      message: '令牌刷新成功',
      token
    });
  } catch (error) {
    console.error('刷新令牌错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

// 修改密码
router.put('/password', authenticateToken, [
  body('currentPassword')
    .notEmpty()
    .withMessage('请输入当前密码'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('新密码长度至少6个字符')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: '输入验证失败', 
        errors: errors.array() 
      });
    }

    const { currentPassword, newPassword } = req.body;
    const user = req.user;

    // 验证当前密码
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: '当前密码错误' });
    }

    // 更新密码
    user.password = newPassword;
    await user.save();

    res.json({ message: '密码修改成功' });

  } catch (error) {
    console.error('修改密码错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

export default router;