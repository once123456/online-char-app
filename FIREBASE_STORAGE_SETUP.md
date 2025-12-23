# Firebase Storage 快速配置指南

> **参考**: [Firebase Storage Web 文档](https://firebase.google.com/docs/storage/web/start?authuser=0&hl=zh-cn)

## 🚀 5 分钟快速配置

### 步骤 1: 启用 Firebase Storage

1. 访问 [Firebase Console](https://console.firebase.google.com/)
2. 选择你的项目
3. 点击左侧菜单 **"Storage"**
4. 点击 **"开始使用"** 或 **"Get started"**
5. 选择 **"生产模式"**（推荐）或 **"测试模式"**（仅测试用）
6. 选择存储位置（推荐选择离用户最近的区域）
7. 点击 **"完成"**

### 步骤 2: 获取配置信息

1. 在 Firebase Console 中，点击 **⚙️ 项目设置**
2. 滚动到 **"你的应用"** 部分
3. 如果没有 Web 应用，点击 **"添加应用"** → 选择 **Web** 图标 `</>`
4. 注册应用并复制配置值

### 步骤 3: 配置 `.env` 文件

在项目根目录创建 `.env` 文件（如果不存在）：

```env
VITE_FIREBASE_API_KEY=你的API密钥
VITE_FIREBASE_AUTH_DOMAIN=你的项目.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=你的项目ID
VITE_FIREBASE_STORAGE_BUCKET=你的项目ID.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=你的发送者ID
VITE_FIREBASE_APP_ID=你的应用ID
```

⚠️ **重要**：
- `VITE_FIREBASE_STORAGE_BUCKET` 格式：`项目ID.appspot.com`（不要加 `gs://` 前缀）
- 确保 `.env` 在 `.gitignore` 中（已自动配置）

### 步骤 4: 配置安全规则

1. 在 Firebase Console 中，点击 **Storage** → **规则** 标签
2. 粘贴以下规则：

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 用户只能在自己的文件夹下操作
    match /media/{userId}/{allPaths=**} {
      allow write: if request.auth != null 
                   && request.auth.uid == userId
                   && request.resource.size < 100 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*|video/.*');
      
      allow read: if request.auth != null 
                  && request.auth.uid == userId;
      
      allow delete: if request.auth != null 
                    && request.auth.uid == userId;
    }
    
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

3. 点击 **"发布"**

### 步骤 5: 重启开发服务器

```bash
# 停止当前服务器（Ctrl+C）
npm run dev
```

### 步骤 6: 测试上传

1. 打开应用
2. 导航到 **📷 照片/视频** 页面
3. 尝试上传一个小文件
4. 检查浏览器控制台（F12）是否有错误

## ✅ 配置检查清单

- [ ] Firebase Storage 已启用
- [ ] `.env` 文件已创建并配置
- [ ] `VITE_FIREBASE_STORAGE_BUCKET` 已正确设置
- [ ] 安全规则已配置并发布
- [ ] 开发服务器已重启

## ❓ 常见错误

### 错误: "unauthorized"
- 检查安全规则是否正确
- 检查用户是否已登录

### 错误: "bucket not found"
- 检查 `VITE_FIREBASE_STORAGE_BUCKET` 是否正确
- 格式应该是 `项目ID.appspot.com`（不要 `gs://`）

### 错误: "permission denied"
- 检查文件路径格式：`media/{userId}/...`
- 确保 `userId` 与登录用户 UID 匹配

## 📞 需要帮助？

查看详细文档：[MEDIA_UPLOAD_STATUS.md](./MEDIA_UPLOAD_STATUS.md)

