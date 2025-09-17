
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// 全局变量
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

// 全局 require 函数
globalThis.require = require;
globalThis.__filename = __filename;
globalThis.__dirname = __dirname;

// 动态 require 处理器
globalThis.__dynamicRequire = function(id) {
  try {
    return require(id);
  } catch (err) {
    if (err.code === 'ERR_REQUIRE_ESM') {
      // 如果模块是 ESM，尝试使用 import()
      return import(id);
    }
    throw err;
  }
};

// 修复 Buffer
if (typeof Buffer === 'undefined') {
  globalThis.Buffer = require('buffer').Buffer;
}

// 修复 process
if (typeof process === 'undefined') {
  globalThis.process = require('process');
}

// 修复 util.promisify
if (!Symbol.for('nodejs.util.promisify.custom')) {
  Symbol.for('nodejs.util.promisify.custom');
}

var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined")
    return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// <stdin>
import http from "http";
var env = {};
Object.assign(env, process.env || {});
delete env.TENCENTCLOUD_UIN;
delete env.TENCENTCLOUD_APPID;
var mod_0 = (() => {
  var __require2 = /* @__PURE__ */ ((x) => typeof __require !== "undefined" ? __require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof __require !== "undefined" ? __require : a)[b]
  }) : x)(function(x) {
    if (typeof __require !== "undefined")
      return __require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var express = __require2("express");
  var cors = __require2("cors");
  var path = __require2("path");
  var fs = __require2("fs-extra");
  var multer = __require2("multer");
  var app = express();
  var PORT = process.env.PORT || 3e3;
  var imageDirPath = "../../public/assets/images";
  app.use(cors({
    origin: function(origin, callback) {
      const allowedOrigins = ["https://icon.xindu.site", "http://icon.xindu.site", /\.xindu\.site$/, /localhost:\d+$/];
      if (!origin)
        return callback(null, true);
      const isAllowed = allowedOrigins.some((allowed) => {
        if (typeof allowed === "string") {
          return origin === allowed;
        } else if (allowed instanceof RegExp) {
          return allowed.test(origin);
        }
        return false;
      });
      callback(null, isAllowed);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
  }));
  app.use("/assets", express.static(path.join(__dirname, "./public/assets")));
  app.use((req, res, next) => {
    res.header("X-Content-Type-Options", "nosniff");
    res.header("X-Frame-Options", "SAMEORIGIN");
    res.header("X-XSS-Protection", "1; mode=block");
    res.header("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });
  var storage = multer.diskStorage({
    destination: async (req, file, cb) => {
      const category = req.body.category || "other";
      const uploadPath = path.join(__dirname, imageDirPath, category);
      await fs.ensureDir(uploadPath);
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const originalName = file.originalname;
      const ext = path.extname(originalName);
      const nameWithoutExt = path.basename(originalName, ext);
      const timestamp = Date.now();
      const category = req.body.category || "other";
      const targetPath = path.join(__dirname, imageDirPath, category, originalName);
      if (fs.existsSync(targetPath)) {
        cb(null, `${nameWithoutExt}_${timestamp}${ext}`);
      } else {
        cb(null, originalName);
      }
    }
  });
  var fileFilter = (req, file, cb) => {
    const allowedTypes = /\.(png|ico|jpg|jpeg|gif|svg)$/i;
    if (allowedTypes.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error("\u53EA\u652F\u6301 PNG\u3001ICO\u3001JPG\u3001JPEG\u3001GIF\u3001SVG \u683C\u5F0F\u7684\u56FE\u7247\u6587\u4EF6"), false);
    }
  };
  var upload = multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024
    }
  });
  app.use("/images", express.static(path.join(__dirname, imageDirPath)));
  app.get("/api/categories", async (req, res) => {
    try {
      const imagesDir = path.join(__dirname, imageDirPath);
      const items = await fs.readdir(imagesDir);
      const categories = [];
      for (const item of items) {
        const itemPath = path.join(imagesDir, item);
        const stat = await fs.stat(itemPath);
        if (stat.isDirectory()) {
          categories.push({
            label: item,
            value: item
          });
        }
      }
      res.json(categories);
    } catch (error) {
      console.error("\u83B7\u53D6\u5206\u7C7B\u5931\u8D25:", error);
      res.status(500).json({
        error: "\u83B7\u53D6\u5206\u7C7B\u5931\u8D25"
      });
    }
  });
  app.get("/api/images", async (req, res) => {
    try {
      const {
        category,
        page = 1,
        limit = 20,
        search
      } = req.query;
      const imagesDir = path.join(__dirname, imageDirPath);
      let allImages = [];
      if (category && category !== "all") {
        const categoryDir = path.join(imagesDir, category);
        if (await fs.pathExists(categoryDir)) {
          const files = await fs.readdir(categoryDir);
          const imageFiles = files.filter((file) => /\.(png|ico|jpg|jpeg|gif|svg)$/i.test(file));
          allImages = imageFiles.map((file) => ({
            name: file,
            category,
            url: `/images/${category}/${file}`,
            path: `${category}/${file}`
          }));
        }
      } else {
        const categories = await fs.readdir(imagesDir);
        for (const cat of categories) {
          const catPath = path.join(imagesDir, cat);
          const stat = await fs.stat(catPath);
          if (stat.isDirectory()) {
            const files = await fs.readdir(catPath);
            const imageFiles = files.filter((file) => /\.(png|ico|jpg|jpeg|gif|svg)$/i.test(file));
            const categoryImages = imageFiles.map((file) => ({
              name: file,
              category: cat,
              url: `/images/${cat}/${file}`,
              path: `${cat}/${file}`
            }));
            allImages = allImages.concat(categoryImages);
          }
        }
      }
      if (search && search.trim()) {
        const searchTerm = search.trim().toLowerCase();
        allImages = allImages.filter((image) => {
          const nameWithoutExt = path.parse(image.name).name.toLowerCase();
          const fullName = image.name.toLowerCase();
          return nameWithoutExt.includes(searchTerm) || fullName.includes(searchTerm);
        });
      }
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedImages = allImages.slice(startIndex, endIndex);
      res.json({
        images: paginatedImages,
        total: allImages.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(allImages.length / limit)
      });
    } catch (error) {
      console.error("\u83B7\u53D6\u56FE\u7247\u5217\u8868\u5931\u8D25:", error);
      res.status(500).json({
        error: "\u83B7\u53D6\u56FE\u7247\u5217\u8868\u5931\u8D25"
      });
    }
  });
  app.post("/api/upload", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: "\u8BF7\u9009\u62E9\u8981\u4E0A\u4F20\u7684\u56FE\u7247\u6587\u4EF6"
        });
      }
      const {
        category = "other"
      } = req.body;
      const imageInfo = {
        name: req.file.filename,
        originalName: req.file.originalname,
        category,
        size: req.file.size,
        url: `/assets/images/${category}/${req.file.filename}`,
        path: `${category}/${req.file.filename}`,
        uploadTime: (/* @__PURE__ */ new Date()).toISOString()
      };
      res.json({
        success: true,
        message: "\u56FE\u7247\u4E0A\u4F20\u6210\u529F",
        image: imageInfo
      });
    } catch (error) {
      console.error("\u4E0A\u4F20\u56FE\u7247\u5931\u8D25:", error);
      res.status(500).json({
        error: "\u4E0A\u4F20\u56FE\u7247\u5931\u8D25: " + error.message
      });
    }
  });
  app.delete("/api/images/:category/:imageName", async (req, res) => {
    try {
      const {
        category,
        imageName
      } = req.params;
      const imagePath = path.join(__dirname, imageDirPath, category, imageName);
      if (await fs.pathExists(imagePath)) {
        await fs.remove(imagePath);
        res.json({
          success: true,
          message: "\u56FE\u7247\u5220\u9664\u6210\u529F"
        });
      } else {
        res.status(404).json({
          error: "\u56FE\u7247\u4E0D\u5B58\u5728"
        });
      }
    } catch (error) {
      console.error("\u5220\u9664\u56FE\u7247\u5931\u8D25:", error);
      res.status(500).json({
        error: "\u5220\u9664\u56FE\u7247\u5931\u8D25"
      });
    }
  });
  app.post("/api/categories", async (req, res) => {
    try {
      const {
        name
      } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({
          error: "\u5206\u7C7B\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A"
        });
      }
      const categoryPath = path.join(__dirname, imageDirPath, name.trim());
      if (await fs.pathExists(categoryPath)) {
        return res.status(400).json({
          error: "\u5206\u7C7B\u5DF2\u5B58\u5728"
        });
      }
      await fs.ensureDir(categoryPath);
      res.json({
        success: true,
        message: "\u5206\u7C7B\u521B\u5EFA\u6210\u529F",
        category: name.trim()
      });
    } catch (error) {
      console.error("\u521B\u5EFA\u5206\u7C7B\u5931\u8D25:", error);
      res.status(500).json({
        error: "\u521B\u5EFA\u5206\u7C7B\u5931\u8D25"
      });
    }
  });
  app.get("/:category/:imageName", async (req, res) => {
    try {
      const {
        category,
        imageName
      } = req.params;
      if (!/\.(png|ico|jpg|jpeg|gif|svg)$/i.test(imageName)) {
        return res.status(404).json({
          error: "\u4E0D\u652F\u6301\u7684\u6587\u4EF6\u7C7B\u578B"
        });
      }
      const imagePath = path.join(__dirname, imageDirPath, category, imageName);
      if (await fs.pathExists(imagePath)) {
        const ext = path.extname(imageName).toLowerCase();
        const mimeTypes = {
          ".png": "image/png",
          ".ico": "image/x-icon",
          ".jpg": "image/jpeg",
          ".jpeg": "image/jpeg",
          ".gif": "image/gif",
          ".svg": "image/svg+xml"
        };
        if (mimeTypes[ext]) {
          res.setHeader("Content-Type", mimeTypes[ext]);
        }
        res.sendFile(imagePath);
      } else {
        res.status(404).json({
          error: "\u56FE\u7247\u4E0D\u5B58\u5728"
        });
      }
    } catch (error) {
      console.error("\u8BBF\u95EE\u56FE\u7247\u5931\u8D25:", error);
      res.status(500).json({
        error: "\u8BBF\u95EE\u56FE\u7247\u5931\u8D25"
      });
    }
  });
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../../client/dist/index.html"));
  });
  var stdin_default = app;
  return stdin_default;
})();
var mod_1 = (() => {
  var __require2 = /* @__PURE__ */ ((x) => typeof __require !== "undefined" ? __require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof __require !== "undefined" ? __require : a)[b]
  }) : x)(function(x) {
    if (typeof __require !== "undefined")
      return __require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var express = __require2("express");
  var cors = __require2("cors");
  var path = __require2("path");
  var fs = __require2("fs-extra");
  var multer = __require2("multer");
  var app = express();
  var PORT = process.env.PORT || 3e3;
  var imageDirPath = "../../public/assets/images";
  app.use(cors({
    origin: function(origin, callback) {
      const allowedOrigins = ["https://icon.xindu.site", "http://icon.xindu.site", /\.xindu\.site$/, /localhost:\d+$/];
      if (!origin)
        return callback(null, true);
      const isAllowed = allowedOrigins.some((allowed) => {
        if (typeof allowed === "string") {
          return origin === allowed;
        } else if (allowed instanceof RegExp) {
          return allowed.test(origin);
        }
        return false;
      });
      callback(null, isAllowed);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
  }));
  app.use("/assets", express.static(path.join(__dirname, "./public/assets")));
  app.use((req, res, next) => {
    res.header("X-Content-Type-Options", "nosniff");
    res.header("X-Frame-Options", "SAMEORIGIN");
    res.header("X-XSS-Protection", "1; mode=block");
    res.header("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });
  var storage = multer.diskStorage({
    destination: async (req, file, cb) => {
      const category = req.body.category || "other";
      const uploadPath = path.join(__dirname, imageDirPath, category);
      await fs.ensureDir(uploadPath);
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const originalName = file.originalname;
      const ext = path.extname(originalName);
      const nameWithoutExt = path.basename(originalName, ext);
      const timestamp = Date.now();
      const category = req.body.category || "other";
      const targetPath = path.join(__dirname, imageDirPath, category, originalName);
      if (fs.existsSync(targetPath)) {
        cb(null, `${nameWithoutExt}_${timestamp}${ext}`);
      } else {
        cb(null, originalName);
      }
    }
  });
  var fileFilter = (req, file, cb) => {
    const allowedTypes = /\.(png|ico|jpg|jpeg|gif|svg)$/i;
    if (allowedTypes.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error("\u53EA\u652F\u6301 PNG\u3001ICO\u3001JPG\u3001JPEG\u3001GIF\u3001SVG \u683C\u5F0F\u7684\u56FE\u7247\u6587\u4EF6"), false);
    }
  };
  var upload = multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024
    }
  });
  app.use("/images", express.static(path.join(__dirname, imageDirPath)));
  app.get("/api/categories", async (req, res) => {
    try {
      const imagesDir = path.join(__dirname, imageDirPath);
      const items = await fs.readdir(imagesDir);
      const categories = [];
      for (const item of items) {
        const itemPath = path.join(imagesDir, item);
        const stat = await fs.stat(itemPath);
        if (stat.isDirectory()) {
          categories.push({
            label: item,
            value: item
          });
        }
      }
      res.json(categories);
    } catch (error) {
      console.error("\u83B7\u53D6\u5206\u7C7B\u5931\u8D25:", error);
      res.status(500).json({
        error: "\u83B7\u53D6\u5206\u7C7B\u5931\u8D25"
      });
    }
  });
  app.get("/api/images", async (req, res) => {
    try {
      const {
        category,
        page = 1,
        limit = 20,
        search
      } = req.query;
      const imagesDir = path.join(__dirname, imageDirPath);
      let allImages = [];
      if (category && category !== "all") {
        const categoryDir = path.join(imagesDir, category);
        if (await fs.pathExists(categoryDir)) {
          const files = await fs.readdir(categoryDir);
          const imageFiles = files.filter((file) => /\.(png|ico|jpg|jpeg|gif|svg)$/i.test(file));
          allImages = imageFiles.map((file) => ({
            name: file,
            category,
            url: `/images/${category}/${file}`,
            path: `${category}/${file}`
          }));
        }
      } else {
        const categories = await fs.readdir(imagesDir);
        for (const cat of categories) {
          const catPath = path.join(imagesDir, cat);
          const stat = await fs.stat(catPath);
          if (stat.isDirectory()) {
            const files = await fs.readdir(catPath);
            const imageFiles = files.filter((file) => /\.(png|ico|jpg|jpeg|gif|svg)$/i.test(file));
            const categoryImages = imageFiles.map((file) => ({
              name: file,
              category: cat,
              url: `/images/${cat}/${file}`,
              path: `${cat}/${file}`
            }));
            allImages = allImages.concat(categoryImages);
          }
        }
      }
      if (search && search.trim()) {
        const searchTerm = search.trim().toLowerCase();
        allImages = allImages.filter((image) => {
          const nameWithoutExt = path.parse(image.name).name.toLowerCase();
          const fullName = image.name.toLowerCase();
          return nameWithoutExt.includes(searchTerm) || fullName.includes(searchTerm);
        });
      }
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedImages = allImages.slice(startIndex, endIndex);
      res.json({
        images: paginatedImages,
        total: allImages.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(allImages.length / limit)
      });
    } catch (error) {
      console.error("\u83B7\u53D6\u56FE\u7247\u5217\u8868\u5931\u8D25:", error);
      res.status(500).json({
        error: "\u83B7\u53D6\u56FE\u7247\u5217\u8868\u5931\u8D25"
      });
    }
  });
  app.post("/api/upload", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: "\u8BF7\u9009\u62E9\u8981\u4E0A\u4F20\u7684\u56FE\u7247\u6587\u4EF6"
        });
      }
      const {
        category = "other"
      } = req.body;
      const imageInfo = {
        name: req.file.filename,
        originalName: req.file.originalname,
        category,
        size: req.file.size,
        url: `/assets/images/${category}/${req.file.filename}`,
        path: `${category}/${req.file.filename}`,
        uploadTime: (/* @__PURE__ */ new Date()).toISOString()
      };
      res.json({
        success: true,
        message: "\u56FE\u7247\u4E0A\u4F20\u6210\u529F",
        image: imageInfo
      });
    } catch (error) {
      console.error("\u4E0A\u4F20\u56FE\u7247\u5931\u8D25:", error);
      res.status(500).json({
        error: "\u4E0A\u4F20\u56FE\u7247\u5931\u8D25: " + error.message
      });
    }
  });
  app.delete("/api/images/:category/:imageName", async (req, res) => {
    try {
      const {
        category,
        imageName
      } = req.params;
      const imagePath = path.join(__dirname, imageDirPath, category, imageName);
      if (await fs.pathExists(imagePath)) {
        await fs.remove(imagePath);
        res.json({
          success: true,
          message: "\u56FE\u7247\u5220\u9664\u6210\u529F"
        });
      } else {
        res.status(404).json({
          error: "\u56FE\u7247\u4E0D\u5B58\u5728"
        });
      }
    } catch (error) {
      console.error("\u5220\u9664\u56FE\u7247\u5931\u8D25:", error);
      res.status(500).json({
        error: "\u5220\u9664\u56FE\u7247\u5931\u8D25"
      });
    }
  });
  app.post("/api/categories", async (req, res) => {
    try {
      const {
        name
      } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({
          error: "\u5206\u7C7B\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A"
        });
      }
      const categoryPath = path.join(__dirname, imageDirPath, name.trim());
      if (await fs.pathExists(categoryPath)) {
        return res.status(400).json({
          error: "\u5206\u7C7B\u5DF2\u5B58\u5728"
        });
      }
      await fs.ensureDir(categoryPath);
      res.json({
        success: true,
        message: "\u5206\u7C7B\u521B\u5EFA\u6210\u529F",
        category: name.trim()
      });
    } catch (error) {
      console.error("\u521B\u5EFA\u5206\u7C7B\u5931\u8D25:", error);
      res.status(500).json({
        error: "\u521B\u5EFA\u5206\u7C7B\u5931\u8D25"
      });
    }
  });
  app.get("/:category/:imageName", async (req, res) => {
    try {
      const {
        category,
        imageName
      } = req.params;
      if (!/\.(png|ico|jpg|jpeg|gif|svg)$/i.test(imageName)) {
        return res.status(404).json({
          error: "\u4E0D\u652F\u6301\u7684\u6587\u4EF6\u7C7B\u578B"
        });
      }
      const imagePath = path.join(__dirname, imageDirPath, category, imageName);
      if (await fs.pathExists(imagePath)) {
        const ext = path.extname(imageName).toLowerCase();
        const mimeTypes = {
          ".png": "image/png",
          ".ico": "image/x-icon",
          ".jpg": "image/jpeg",
          ".jpeg": "image/jpeg",
          ".gif": "image/gif",
          ".svg": "image/svg+xml"
        };
        if (mimeTypes[ext]) {
          res.setHeader("Content-Type", mimeTypes[ext]);
        }
        res.sendFile(imagePath);
      } else {
        res.status(404).json({
          error: "\u56FE\u7247\u4E0D\u5B58\u5728"
        });
      }
    } catch (error) {
      console.error("\u8BBF\u95EE\u56FE\u7247\u5931\u8D25:", error);
      res.status(500).json({
        error: "\u8BBF\u95EE\u56FE\u7247\u5931\u8D25"
      });
    }
  });
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../../client/dist/index.html"));
  });
  var stdin_default = app;
  return stdin_default;
})();
var port = 9e3;
var EdgeoneBodyParser = class {
  /**
   * 根据 Content-Type 解析请求体，完全遵循 Edgeone 的规则
   * @param {Buffer} buffer 原始请求体数据
   * @param {string} contentType Content-Type 头部
   * @returns 解析后的数据
   */
  static parseBodyByContentType(buffer, contentType = "") {
    if (!buffer || buffer.length === 0) {
      return void 0;
    }
    const normalizedContentType = contentType.split(";")[0].trim().toLowerCase();
    switch (normalizedContentType) {
      case "application/json":
        try {
          const text = buffer.toString("utf-8");
          return JSON.parse(text);
        } catch (error) {
          throw new Error(`Invalid JSON in request body: ${error.message}`);
        }
      case "application/x-www-form-urlencoded":
        const formText = buffer.toString("utf-8");
        const params = new URLSearchParams(formText);
        const result = {};
        for (const [key, value] of params) {
          result[key] = value;
        }
        return result;
      case "text/plain":
        return buffer.toString("utf-8");
      case "application/octet-stream":
        return buffer;
      default:
        return buffer;
    }
  }
  /**
   * 解析 URL 查询参数
   * @param {string} url 完整的 URL 或查询字符串
   * @returns {Object} 解析后的查询参数对象
   */
  static parseQuery(url) {
    if (!url)
      return {};
    const queryStart = url.indexOf("?");
    const queryString = queryStart >= 0 ? url.substring(queryStart + 1) : url;
    if (!queryString)
      return {};
    const params = {};
    const pairs = queryString.split("&");
    for (const pair of pairs) {
      if (!pair)
        continue;
      const equalIndex = pair.indexOf("=");
      let key, value;
      if (equalIndex === -1) {
        key = pair;
        value = true;
      } else if (equalIndex === 0) {
        continue;
      } else {
        key = pair.substring(0, equalIndex);
        value = pair.substring(equalIndex + 1);
        if (value === "") {
          value = "";
        }
      }
      if (key) {
        try {
          const decodedKey = decodeURIComponent(key);
          let decodedValue;
          if (typeof value === "boolean") {
            decodedValue = value;
          } else {
            decodedValue = decodeURIComponent(value);
            if (decodedValue === "true") {
              decodedValue = true;
            } else if (decodedValue === "false") {
              decodedValue = false;
            } else if (decodedValue === "null") {
              decodedValue = null;
            } else if (decodedValue === "undefined") {
              decodedValue = void 0;
            } else if (/^-?d+$/.test(decodedValue)) {
              const num = parseInt(decodedValue, 10);
              if (!isNaN(num) && num.toString() === decodedValue) {
                decodedValue = num;
              }
            } else if (/^-?d*.d+$/.test(decodedValue)) {
              const num = parseFloat(decodedValue);
              if (!isNaN(num) && num.toString() === decodedValue) {
                decodedValue = num;
              }
            }
          }
          if (params[decodedKey] !== void 0) {
            if (Array.isArray(params[decodedKey])) {
              params[decodedKey].push(decodedValue);
            } else {
              params[decodedKey] = [params[decodedKey], decodedValue];
            }
          } else {
            params[decodedKey] = decodedValue;
          }
        } catch (error) {
          if (typeof value === "boolean") {
            params[key] = value;
          } else {
            params[key] = value || "";
          }
        }
      }
    }
    return params;
  }
  /**
   * 解析 Cookie 头部
   * @param {string} cookieHeader Cookie 头部字符串
   * @returns {Object} 解析后的 cookies 对象
   */
  static parseCookies(cookieHeader) {
    const cookies = {};
    if (!cookieHeader || typeof cookieHeader !== "string") {
      return cookies;
    }
    cookieHeader.split(";").forEach((cookie) => {
      const trimmed = cookie.trim();
      const equalIndex = trimmed.indexOf("=");
      if (equalIndex > 0) {
        const name = trimmed.substring(0, equalIndex).trim();
        let value = trimmed.substring(equalIndex + 1).trim();
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        try {
          cookies[name] = decodeURIComponent(value);
        } catch (error) {
          cookies[name] = value;
        }
      }
    });
    return cookies;
  }
  /**
   * 从请求流中读取完整的请求体数据
   */
  static async readBodyFromStream(req, maxSize = 50 * 1024 * 1024) {
    return new Promise((resolve, reject) => {
      if (req.readableEnded || req.destroyed) {
        resolve(Buffer.alloc(0));
        return;
      }
      if (req._bodyBuffer !== void 0) {
        resolve(req._bodyBuffer);
        return;
      }
      const chunks = [];
      let totalSize = 0;
      const cleanup = () => {
        req.removeListener("data", onData);
        req.removeListener("end", onEnd);
        req.removeListener("error", onError);
      };
      const onData = (chunk) => {
        totalSize += chunk.length;
        if (totalSize > maxSize) {
          cleanup();
          reject(new Error(`Request body too large. Max size: ${maxSize} bytes`));
          return;
        }
        chunks.push(chunk);
      };
      const onEnd = () => {
        cleanup();
        const buffer = Buffer.concat(chunks);
        req._bodyBuffer = buffer;
        resolve(buffer);
      };
      const onError = (error) => {
        cleanup();
        reject(error);
      };
      req.on("data", onData);
      req.on("end", onEnd);
      req.on("error", onError);
      if (req.readable && !req.readableFlowing) {
        req.resume();
      }
    });
  }
};
function addEdgeoneRequestGetters(req) {
  if (req._edgeoneGettersAdded) {
    return req;
  }
  req._edgeoneGettersAdded = true;
  let bodyCache = null;
  let bodyParsed = false;
  let bodyError = null;
  let queryCache = null;
  let queryParsed = false;
  let cookiesCache = null;
  let cookiesParsed = false;
  const preloadBody = async () => {
    if (req._bodyPreloaded)
      return;
    req._bodyPreloaded = true;
    try {
      const contentType = req.headers["content-type"] || "";
      const contentLength = req.headers["content-length"];
      const isChunked = req.headers["transfer-encoding"] === "chunked";
      if (!contentLength && !isChunked && req.method === "GET") {
        bodyCache = void 0;
        bodyParsed = true;
        return;
      }
      const buffer = await EdgeoneBodyParser.readBodyFromStream(req);
      const parsed = EdgeoneBodyParser.parseBodyByContentType(buffer, contentType);
      bodyCache = parsed;
      bodyParsed = true;
    } catch (error) {
      bodyError = error;
      bodyParsed = true;
    }
  };
  req._bodyPreloadPromise = preloadBody();
  Object.defineProperty(req, "body", {
    get() {
      if (bodyParsed) {
        if (bodyError) {
          throw bodyError;
        }
        return bodyCache;
      }
      return new Promise((resolve, reject) => {
        const checkParsed = () => {
          if (bodyParsed) {
            if (bodyError) {
              reject(bodyError);
            } else {
              resolve(bodyCache);
            }
          } else {
            setTimeout(checkParsed, 1);
          }
        };
        checkParsed();
      });
    },
    configurable: true,
    enumerable: true
  });
  Object.defineProperty(req, "query", {
    get() {
      if (!queryParsed) {
        queryCache = EdgeoneBodyParser.parseQuery(req.url || "");
        queryParsed = true;
      }
      return queryCache;
    },
    configurable: true,
    enumerable: true
  });
  Object.defineProperty(req, "cookies", {
    get() {
      if (!cookiesParsed) {
        cookiesCache = EdgeoneBodyParser.parseCookies(req.headers.cookie || "");
        cookiesParsed = true;
      }
      return cookiesCache;
    },
    configurable: true,
    enumerable: true
  });
  return req;
}
function createEdgeoneCompatibleRequest(originalReq, isFramework = false) {
  if (!originalReq._edgeoneGettersAdded) {
    let queryCache = null;
    let queryParsed = false;
    let cookiesCache = null;
    let cookiesParsed = false;
    if (!("query" in originalReq)) {
      Object.defineProperty(originalReq, "query", {
        get() {
          if (!queryParsed) {
            queryCache = EdgeoneBodyParser.parseQuery(originalReq.url || "");
            queryParsed = true;
          }
          return queryCache;
        },
        configurable: true,
        enumerable: true
      });
    }
    if (!("cookies" in originalReq)) {
      Object.defineProperty(originalReq, "cookies", {
        get() {
          if (!cookiesParsed) {
            cookiesCache = EdgeoneBodyParser.parseCookies(originalReq.headers.cookie || "");
            cookiesParsed = true;
          }
          return cookiesCache;
        },
        configurable: true,
        enumerable: true
      });
    }
  }
  if (isFramework && "body" in originalReq) {
    return originalReq;
  }
  return addEdgeoneRequestGetters(originalReq);
}
async function handleResponse(res, response, passHeaders = {}) {
  var _a, _b, _c;
  const startTime = Date.now();
  if (!response) {
    res.writeHead(404);
    res.end(JSON.stringify({
      error: "Not Found",
      message: "The requested path does not exist"
    }));
    const endTime = Date.now();
    console.log(`HandleResponse: 404 Not Found - ${endTime - startTime}ms`);
    return;
  }
  try {
    if (response instanceof Response) {
      const headers = Object.fromEntries(response.headers);
      Object.assign(headers, passHeaders);
      if (response.headers.get("eop-client-geo")) {
        response.headers.delete("eop-client-geo");
      }
      const isStream = response.body && (((_a = response.headers.get("content-type")) == null ? void 0 : _a.includes("text/event-stream")) || ((_b = response.headers.get("transfer-encoding")) == null ? void 0 : _b.includes("chunked")) || response.body instanceof ReadableStream || typeof response.body.pipe === "function" || response.headers.get("x-content-type-stream") === "true");
      if (isStream) {
        const streamHeaders = {
          ...headers
        };
        if ((_c = response.headers.get("content-type")) == null ? void 0 : _c.includes("text/event-stream")) {
          streamHeaders["Content-Type"] = "text/event-stream";
        }
        res.writeHead(response.status, streamHeaders);
        if (typeof response.body.pipe === "function") {
          response.body.pipe(res);
        } else {
          const reader = response.body.getReader();
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done)
                break;
              if (value instanceof Uint8Array || Buffer.isBuffer(value)) {
                res.write(value);
              } else {
                const chunk = new TextDecoder().decode(value);
                res.write(chunk);
              }
            }
          } finally {
            reader.releaseLock();
            res.end();
          }
        }
      } else {
        res.writeHead(response.status, headers);
        const body = await response.text();
        res.end(body);
      }
    } else {
      res.writeHead(200, {
        "Content-Type": "application/json"
      });
      res.end(JSON.stringify(response));
    }
  } catch (error) {
    console.error("HandleResponse error", error);
    res.writeHead(500);
    res.end(JSON.stringify({
      error: "Internal Server Error",
      message: error.message
    }));
  } finally {
    const endTime = Date.now();
    console.log(`HandleResponse: ${(response == null ? void 0 : response.status) || "unknown"} - ${endTime - startTime}ms`);
  }
}
var server = http.createServer(async (req, res) => {
  try {
    const requestStartTime = Date.now();
    const geoStr = decodeURIComponent(req.headers["eo-connecting-geo"]) || "";
    const geo = geoStr ? (() => {
      const result = {};
      const matches = geoStr.match(/[a-z_]+="[^"]*"|[a-z_]+=[A-Za-z0-9.-]+/g) || [];
      matches.forEach((match) => {
        const [key, value] = match.split("=", 2);
        result[key] = value.replace(/^"|"$/g, "");
      });
      return result;
    })() : {};
    const newGeo = {
      asn: geo.asn,
      countryName: geo.nation_name,
      countryCodeAlpha2: geo.region_code && geo.region_code.split("-")[0],
      countryCodeNumeric: geo.nation_numeric,
      regionName: geo.region_name,
      regionCode: geo.region_code,
      cityName: geo.city_name,
      latitude: geo.latitude,
      longitude: geo.longitude,
      cisp: geo.network_operator
    };
    const safeGeo = {};
    for (const [key, value] of Object.entries(newGeo)) {
      if (value !== void 0 && value !== null) {
        if (typeof value === "string" && /[一-鿿]/.test(value)) {
          safeGeo[key] = Buffer.from(value, "utf8").toString("utf8");
        } else {
          safeGeo[key] = value;
        }
      }
    }
    req.headers["eo-connecting-geo"] = safeGeo;
    const enhancedRequest = createEdgeoneCompatibleRequest(req, false);
    if (enhancedRequest._bodyPreloadPromise) {
      try {
        await enhancedRequest._bodyPreloadPromise;
      } catch (error) {
        console.warn("Body preload failed:", error.message);
      }
    }
    const context = {
      request: enhancedRequest,
      env,
      // 使用注入的环境变量
      params: {},
      uuid: req.headers["eo-log-uuid"] || "",
      server: {
        region: req.headers["x-scf-region"] || "",
        requestId: req.headers["x-scf-request-id"] || ""
      },
      clientIp: req.headers["eo-connecting-ip"] || "",
      geo: safeGeo
    };
    req.headers["functions-request-id"] = req.headers["x-scf-request-id"] || "";
    for (const key in req.headers) {
      if (key.startsWith("x-scf-")) {
        delete req.headers[key];
      }
      if (key.startsWith("x-cube-")) {
        delete req.headers[key];
      }
    }
    const url = new URL(req.url, `http://${req.headers.host}`);
    let pathname = url.pathname;
    if (pathname !== "/" && pathname.endsWith("/")) {
      pathname = pathname.slice(0, -1);
    }
    console.log(`Request path: ${pathname}`);
    let response = null;
    {
      const routePattern = new RegExp("^/express/.*$");
      if (routePattern.test(pathname)) {
        const app = mod_0;
        if (app) {
          const pathParts = pathname.split("/").filter(Boolean);
          const routeParts = "/express/:production*".split("/").filter(Boolean);
          const params = {};
          let frameworkPath = "/";
          let consumedSegments = 0;
          for (let i = 0; i < routeParts.length; i++) {
            const routePart = routeParts[i];
            if (routePart.endsWith("*")) {
              const paramName = routePart.slice(1, -1);
              const remainingParts2 = pathParts.slice(i);
              if (i < routeParts.length - 1) {
                const nextStaticPart = routeParts[i + 1];
                if (!nextStaticPart.startsWith(":")) {
                  const staticIndex = remainingParts2.indexOf(nextStaticPart);
                  if (staticIndex >= 0) {
                    params[paramName] = remainingParts2.slice(0, staticIndex);
                    consumedSegments = i + staticIndex + 1;
                  }
                }
              } else {
                params[paramName] = remainingParts2;
                let lastStaticIndex = -1;
                for (let j = 0; j < routeParts.length; j++) {
                  if (!routeParts[j].startsWith(":")) {
                    lastStaticIndex = j;
                  }
                }
                consumedSegments = lastStaticIndex + 1;
              }
              break;
            } else if (routePart.startsWith(":")) {
              const paramName = routePart.slice(1);
              params[paramName] = pathParts[i];
              consumedSegments = i + 1;
            } else {
              consumedSegments = i + 1;
            }
          }
          const remainingParts = pathParts.slice(consumedSegments);
          frameworkPath = remainingParts.length > 0 ? "/" + remainingParts.join("/") : "/";
          context.params = params;
          const frameworkReq = createEdgeoneCompatibleRequest(req, true);
          frameworkReq.url = frameworkPath + url.search;
          frameworkReq.context = {
            geo: context.geo,
            clientIp: context.clientIp,
            uuid: context.uuid,
            server: {
              region: context.server.region,
              requestId: context.server.requestId
            },
            params: context.params,
            env: context.env
          };
          res.setHeader("functions-request-id", context.server.requestId);
          await app(frameworkReq, res);
          false;
          false;
          return;
        }
      }
    }
    {
      const routePattern = new RegExp("^/express$");
      if (routePattern.test(pathname)) {
        const app = mod_1;
        if (app) {
          const pathParts = pathname.split("/").filter(Boolean);
          const routeParts = "/express".split("/").filter(Boolean);
          const params = {};
          let frameworkPath = "/";
          let consumedSegments = 0;
          for (let i = 0; i < routeParts.length; i++) {
            const routePart = routeParts[i];
            if (routePart.endsWith("*")) {
              const paramName = routePart.slice(1, -1);
              const remainingParts2 = pathParts.slice(i);
              if (i < routeParts.length - 1) {
                const nextStaticPart = routeParts[i + 1];
                if (!nextStaticPart.startsWith(":")) {
                  const staticIndex = remainingParts2.indexOf(nextStaticPart);
                  if (staticIndex >= 0) {
                    params[paramName] = remainingParts2.slice(0, staticIndex);
                    consumedSegments = i + staticIndex + 1;
                  }
                }
              } else {
                params[paramName] = remainingParts2;
                let lastStaticIndex = -1;
                for (let j = 0; j < routeParts.length; j++) {
                  if (!routeParts[j].startsWith(":")) {
                    lastStaticIndex = j;
                  }
                }
                consumedSegments = lastStaticIndex + 1;
              }
              break;
            } else if (routePart.startsWith(":")) {
              const paramName = routePart.slice(1);
              params[paramName] = pathParts[i];
              consumedSegments = i + 1;
            } else {
              consumedSegments = i + 1;
            }
          }
          const remainingParts = pathParts.slice(consumedSegments);
          frameworkPath = remainingParts.length > 0 ? "/" + remainingParts.join("/") : "/";
          context.params = params;
          const frameworkReq = createEdgeoneCompatibleRequest(req, true);
          frameworkReq.url = frameworkPath + url.search;
          frameworkReq.context = {
            geo: context.geo,
            clientIp: context.clientIp,
            uuid: context.uuid,
            server: {
              region: context.server.region,
              requestId: context.server.requestId
            },
            params: context.params,
            env: context.env
          };
          res.setHeader("functions-request-id", context.server.requestId);
          await app(frameworkReq, res);
          false;
          false;
          return;
        }
      }
    }
    if (!response) {
      response = new Response(JSON.stringify({
        error: "Not Found",
        message: "The requested path does not exist"
      }), {
        status: 404,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    const requestEndTime = Date.now();
    console.log(`Request processing time: ${requestEndTime - requestStartTime}ms`);
    if (!res.headers) {
      res.headers = {};
    }
    await handleResponse(res, response, {
      "functions-request-id": context.server.requestId
    });
  } catch (error) {
    console.error("server error", error);
    res.writeHead(500);
    res.end(JSON.stringify({
      error: "Internal Server Error",
      message: error.message
    }));
  }
});
server.listen(port, () => {
});
export {
  server
};
