# 🔧 修复 .env 文件配置指南

## ❌ 当前问题

从错误日志可以看到：
```
Storage 引用: siuroma-kids.firebasestorage.app"
URL: .../b/siuroma-kids.firebasestorage.app%22/o?name=...
```

**问题**：`.env` 文件中的 `VITE_FIREBASE_STORAGE_BUCKET` 值包含引号 `"`

## ✅ 修复步骤

### 1. 打开 `.env` 文件

在项目根目录找到 `.env` 文件（如果不存在，创建一个）

### 2. 检查并修复配置

找到这一行：
```env
VITE_FIREBASE_STORAGE_BUCKET=...
```

**错误的格式**（不要这样写）：
```env
❌ VITE_FIREBASE_STORAGE_BUCKET="siuroma-kids.firebasestorage.app",
❌ VITE_FIREBASE_STORAGE_BUCKET="siuroma-kids.firebasestorage.app"
❌ VITE_FIREBASE_STORAGE_BUCKET=siuroma-kids.firebasestorage.app",
❌ VITE_FIREBASE_STORAGE_BUCKET=gs://siuroma-kids.firebasestorage.app
```

**正确的格式**：
```env
✅ VITE_FIREBASE_STORAGE_BUCKET=siuroma-kids.firebasestorage.app
```

### 3. 完整的 .env 文件示例

```env
# Firebase 配置
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=siuroma-kids.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=siuroma-kids
VITE_FIREBASE_STORAGE_BUCKET=siuroma-kids.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

### 4. 保存并重启

1. **保存 `.env` 文件**
2. **停止开发服务器**（在终端按 `Ctrl + C`）
3. **重新启动**：
   ```bash
   npm run dev
   ```

### 5. 验证修复

打开浏览器控制台（F12），应该看到：
```
🔧 Firebase 配置检查:
  - Storage Bucket (原始值): siuroma-kids.firebasestorage.app
  - Storage Bucket (清理后): siuroma-kids.firebasestorage.app
  ✅ Storage Bucket 配置正确
✅ Firebase 初始化成功
✅ Firebase Storage 初始化成功
```

## 🔍 如何找到正确的 Storage Bucket 名称

1. 访问 [Firebase Console](https://console.firebase.google.com/)
2. 选择你的项目
3. 点击左侧菜单 **Storage**
4. 查看存储桶名称，格式通常是：
   - `your-project-id.firebasestorage.app`
   - 或 `your-project-id.appspot.com`

## ⚠️ 重要提示

- **不要**在 `.env` 文件中使用引号
- **不要**包含 `gs://` 前缀
- **不要**包含逗号
- **不要**有多余的空格
- 值应该是纯文本：`项目ID.firebasestorage.app`

## 🐛 如果仍然有问题

1. 检查 `.env` 文件编码（应该是 UTF-8）
2. 检查是否有隐藏字符（使用文本编辑器查看）
3. 删除 `.env` 文件，重新创建
4. 确保文件在项目根目录（与 `package.json` 同级）
5. 重启开发服务器

