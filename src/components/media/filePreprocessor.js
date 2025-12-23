/**
 * 文件预处理工具
 * 用于验证、格式化和预处理上传的文件
 */

// 支持的文件类型
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

// 文件大小限制（字节）
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

/**
 * 格式化文件大小
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * 验证文件类型
 */
const validateFileType = (file) => {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `不支持的文件类型: ${file.type}。支持的格式: 图片 (${ALLOWED_IMAGE_TYPES.map(t => t.split('/')[1]).join(', ')}) 和视频 (${ALLOWED_VIDEO_TYPES.map(t => t.split('/')[1]).join(', ')})`
    };
  }
  return { valid: true };
};

/**
 * 验证文件大小
 */
const validateFileSize = (file) => {
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);
  
  if (isImage && file.size > MAX_IMAGE_SIZE) {
    return {
      valid: false,
      error: `图片文件过大: ${formatFileSize(file.size)}。最大允许: ${formatFileSize(MAX_IMAGE_SIZE)}`
    };
  }
  
  if (isVideo && file.size > MAX_VIDEO_SIZE) {
    return {
      valid: false,
      error: `视频文件过大: ${formatFileSize(file.size)}。最大允许: ${formatFileSize(MAX_VIDEO_SIZE)}`
    };
  }
  
  return { valid: true };
};

/**
 * 生成文件唯一ID
 */
const generateFileId = () => {
  return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 创建文件预览URL（用于图片预览）
 */
const createPreviewUrl = (file) => {
  if (file.type.startsWith('image/')) {
    return URL.createObjectURL(file);
  }
  return null;
};

/**
 * 撤销预览URL（释放内存）
 */
export const revokePreviewUrl = (url) => {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};

/**
 * 撤销多个预览URL
 */
export const revokePreviewUrls = (urls) => {
  urls.forEach(url => revokePreviewUrl(url));
};

/**
 * 预处理文件列表
 * @param {File[]} files - 原始文件数组
 * @returns {{validFiles: Array, invalidFiles: Array}} - 有效文件和无效文件
 */
export const preprocessFiles = (files) => {
  const validFiles = [];
  const invalidFiles = [];
  
  files.forEach(file => {
    const errors = [];
    
    // 验证文件类型
    const typeValidation = validateFileType(file);
    if (!typeValidation.valid) {
      errors.push(typeValidation.error);
    }
    
    // 验证文件大小
    const sizeValidation = validateFileSize(file);
    if (!sizeValidation.valid) {
      errors.push(sizeValidation.error);
    }
    
    if (errors.length > 0) {
      invalidFiles.push({
        file,
        name: file.name,
        errors
      });
    } else {
      // 创建预览URL（如果是图片）
      const preview = createPreviewUrl(file);
      
      // 确定文件类型（image 或 video）
      const fileType = ALLOWED_IMAGE_TYPES.includes(file.type) ? 'image' : 'video';
      
      validFiles.push({
        id: generateFileId(),
        file, // 原始 File 对象
        name: file.name,
        type: fileType,
        mimeType: file.type,
        size: file.size,
        preview, // 预览URL（仅图片）
        uploadDate: new Date(),
        errors: []
      });
    }
  });
  
  return { validFiles, invalidFiles };
};

/**
 * 获取文件的Content-Type元数据
 * @param {File} file - 文件对象
 * @returns {string} - Content-Type
 */
export const getFileContentType = (file) => {
  return file.type || 'application/octet-stream';
};

/**
 * 生成存储路径
 * @param {string} userId - 用户ID
 * @param {File} file - 文件对象
 * @param {string} folder - 可选的自定义文件夹
 * @returns {string} - 存储路径
 */
export const generateStoragePath = (userId, file, folder = 'media') => {
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileType = ALLOWED_IMAGE_TYPES.includes(file.type) ? 'images' : 'videos';
  return `${folder}/${userId}/${fileType}/${timestamp}_${sanitizedName}`;
};
