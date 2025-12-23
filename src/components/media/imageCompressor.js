/**
 * 图片压缩工具
 * 在上传前压缩图片，减少文件大小，提升上传速度
 */

/**
 * 压缩图片
 * @param {File} file - 原始图片文件
 * @param {Object} options - 压缩选项
 * @param {number} options.maxWidth - 最大宽度（默认: 1920）
 * @param {number} options.maxHeight - 最大高度（默认: 1920）
 * @param {number} options.quality - 压缩质量 0-1（默认: 0.8）
 * @param {number} options.maxSize - 最大文件大小（字节，默认: 2MB）
 * @returns {Promise<File>} - 压缩后的文件
 */
export const compressImage = (file, options = {}) => {
  return new Promise((resolve, reject) => {
    const {
      maxWidth = 1920,
      maxHeight = 1920,
      quality = 0.8,
      maxSize = 2 * 1024 * 1024 // 2MB
    } = options;

    // 只处理图片文件
    if (!file.type.startsWith('image/')) {
      resolve(file); // 非图片文件直接返回
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // 计算新尺寸
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }
        }
        
        // 创建 canvas 并压缩
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // 转换为 Blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('图片压缩失败'));
              return;
            }
            
            // 如果压缩后还是太大，进一步降低质量
            if (blob.size > maxSize) {
              compressWithLowerQuality(canvas, file, maxSize, quality, resolve, reject);
            } else {
              // 创建新的 File 对象
              const compressedFile = new File(
                [blob],
                file.name,
                {
                  type: file.type,
                  lastModified: Date.now()
                }
              );
              resolve(compressedFile);
            }
          },
          file.type,
          quality
        );
      };
      
      img.onerror = () => {
        reject(new Error('图片加载失败'));
      };
      
      img.src = e.target.result;
    };
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };
    
    reader.readAsDataURL(file);
  });
};

/**
 * 如果压缩后文件还是太大，降低质量重试
 */
const compressWithLowerQuality = (canvas, originalFile, maxSize, initialQuality, resolve, reject) => {
  let quality = initialQuality;
  const minQuality = 0.3;
  const step = 0.1;
  
  const tryCompress = () => {
    quality = Math.max(quality - step, minQuality);
    
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('图片压缩失败'));
          return;
        }
        
        if (blob.size <= maxSize || quality <= minQuality) {
          const compressedFile = new File(
            [blob],
            originalFile.name,
            {
              type: originalFile.type,
              lastModified: Date.now()
            }
          );
          resolve(compressedFile);
        } else {
          tryCompress(); // 继续降低质量
        }
      },
      originalFile.type,
      quality
    );
  };
  
  tryCompress();
};

/**
 * 批量压缩图片
 * @param {File[]} files - 文件数组
 * @param {Object} options - 压缩选项
 * @returns {Promise<File[]>} - 压缩后的文件数组
 */
export const compressImages = async (files, options = {}) => {
  const results = await Promise.allSettled(
    files.map(file => compressImage(file, options))
  );
  
  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      console.warn(`文件 ${files[index].name} 压缩失败，使用原文件:`, result.reason);
      return files[index]; // 压缩失败，使用原文件
    }
  });
};

