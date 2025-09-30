import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// 确保目录存在
export const ensureDirectory = async (dirPath) => {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
};

// 生成存储路径
export const generateStoragePath = (user, originalName, storageRule = 'uuid') => {
  const ext = path.extname(originalName).toLowerCase();
  const timestamp = Date.now();
  
  let filename;
  let storagePath;
  
  switch (storageRule) {
    case 'md5':
      const hash = crypto.createHash('md5').update(originalName + timestamp).digest('hex');
      filename = `${hash}${ext}`;
      storagePath = path.join(user.username, 'md5_files', filename);
      break;
    
    case 'date':
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      filename = `${timestamp}${ext}`;
      storagePath = path.join(user.username, String(year), month, day, filename);
      break;
    
    case 'original':
      filename = originalName;
      storagePath = path.join(user.username, 'original', filename);
      break;
    
    case 'uuid':
    default:
      filename = `${uuidv4()}${ext}`;
      storagePath = path.join(user.username, 'uuid_files', filename);
      break;
  }
  
  return { filename, storagePath };
};

// 生成缩略图（暂时禁用）
export const generateThumbnail = async (fileBuffer, storagePath, maxWidth = 300, maxHeight = 300) => {
  console.log('缩略图功能已禁用');
  return null;
};

// 获取图片信息（简化版本）
export const getImageInfo = async (fileBuffer) => {
  try {
    // 简化版本，返回默认值
    return {
      width: 0,
      height: 0,
      format: 'unknown'
    };
  } catch (error) {
    console.error('获取图片信息失败:', error);
    return { width: 0, height: 0, format: 'unknown' };
  }
};

// 验证文件类型
export const isValidImageType = (mimeType) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ];
  return allowedTypes.includes(mimeType);
};

// 验证文件大小
export const isValidFileSize = (fileSize, maxSize = 10 * 1024 * 1024) => {
  return fileSize <= maxSize;
};

// 清理临时文件
export const cleanupFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error('清理文件失败:', error);
  }
};

// 获取用户存储统计
export const getUserStorageStats = async (userId, db) => {
  return new Promise((resolve, reject) => {
    try {
      if (!db) {
        return resolve({ totalFiles: 0, totalSize: 0 });
      }
      
      db.all('SELECT COUNT(*) as totalFiles, SUM(fileSize) as totalSize FROM images WHERE userId = ?', [userId], (err, result) => {
        if (err) {
          console.error('获取存储统计失败:', err);
          resolve({ totalFiles: 0, totalSize: 0 });
        } else {
          const stats = result && result.length > 0 ? {
            totalFiles: result[0].totalFiles || 0,
            totalSize: result[0].totalSize || 0
          } : { totalFiles: 0, totalSize: 0 };
          resolve(stats);
        }
      });
    } catch (error) {
      console.error('获取存储统计失败:', error);
      resolve({ totalFiles: 0, totalSize: 0 });
    }
  });
};