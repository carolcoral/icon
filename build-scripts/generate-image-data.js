import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const IMAGE_DIR = path.join(__dirname, '../public/assets/images');
const OUTPUT_FILE = path.join(__dirname, '../src/assets/image-data.json');

// 确保目录存在
if (!fs.existsSync(path.dirname(OUTPUT_FILE))) {
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
}

function scanDirectory(dir) {
  const categories = {};
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      categories[file] = [];
      const subFiles = fs.readdirSync(fullPath);
      subFiles.forEach(subFile => {
        if ([".png",".jpg",".jpeg",".gif",".svg"].includes(path.extname(subFile).toLowerCase())) {
          const displayName = subFile.replace(/\.[^/.]+$/, '');
          categories[file].push({
            name: subFile,
            path: `/assets/images/${file}/${subFile}`,
            displayPath: `/${file}/${displayName}`,
            category: file
          });
        }
      });
    } else if (stat.isFile() && ['.png', '.jpg', '.jpeg', '.gif'].includes(path.extname(file).toLowerCase())) {
      const category = path.basename(dir);
      if (!categories[category]) {
        categories[category] = [];
      }
      const displayName = file.replace(/\.[^/.]+$/, '');
      categories[category].push({
        name: file,
        path: `/assets/images/${category}/${file}`,
        displayPath: `/${category}/${displayName}`,
        category: category
      });
    }
  });
  
  return categories;
}

const imageData = scanDirectory(IMAGE_DIR);
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(imageData, null, 2));
console.log(`图片数据已生成: ${OUTPUT_FILE}`);