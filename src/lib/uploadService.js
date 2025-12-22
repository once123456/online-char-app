/**
 * Firebase Storage 上传服务
 * 处理文件上传到 Firebase Storage
 */
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./firebase";
import { getFileContentType, generateStoragePath, formatFileSize } from "../components/media/filePreprocessor";

/**
 * 上传单个文件
 * @param {File} file - 要上传的文件
 * @param {string} userId - 用户ID
 * @param {Object} options - 配置选项
 * @param {Function} options.onProgress - 进度回调函数 (progress) => void
 * @param {Function} options.onError - 错误回调函数 (error) => void
 * @param {Function} options.onSuccess - 成功回调函数 (result) => void
 * @param {string} options.folder - 存储文件夹（默认: 'media'）
 * @returns {Promise} - 上传任务Promise
 */
export const uploadFile = (file, userId, options = {}) => {
  return new Promise((resolve, reject) => {
    try {
      // 生成存储路径
      const storagePath = generateStoragePath(userId, file, options.folder || 'media');
      const storageRef = ref(storage, storagePath);

      // 获取文件元数据
      const metadata = {
        contentType: getFileContentType(file),
        customMetadata: {
          originalName: file.name,
          uploadedBy: userId,
          uploadedAt: new Date().toISOString()
        }
      };

      // 创建上传任务
      console.log('📤 创建上传任务:');
      console.log('   - 文件名:', file.name);
      console.log('   - 文件大小:', formatFileSize(file.size));
      console.log('   - 存储路径:', storagePath);
      console.log('   - 内容类型:', metadata.contentType);
      console.log('   - Storage Bucket:', storageRef.bucket);
      console.log('   - Storage Full Path:', storageRef.fullPath);
      
      // 检查 bucket 是否包含非法字符
      if (storageRef.bucket && (storageRef.bucket.includes('"') || storageRef.bucket.includes("'") || storageRef.bucket.includes(','))) {
        console.error('❌ 错误: Storage Bucket 包含非法字符！');
        console.error('   Bucket 值:', storageRef.bucket);
        console.error('   请检查 .env 文件中的 VITE_FIREBASE_STORAGE_BUCKET 配置');
        throw new Error('Storage Bucket 配置错误，包含非法字符（引号或逗号）');
      }
      
      const uploadTask = uploadBytesResumable(storageRef, file, metadata);

      // 用于计算上传速度
      let lastBytes = 0;
      let lastTime = Date.now();
      let speed = 0; // bytes per second

      // 立即触发一次进度回调（0%状态），确保UI更新
      if (options.onProgress) {
        options.onProgress({
          progress: 0,
          bytesTransferred: 0,
          totalBytes: file.size,
          state: 'running',
          speed: 0,
          estimatedTimeRemaining: null
        });
      }

      // 监听上传状态变化
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // 计算上传进度
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          
          console.log('上传状态变化:', {
            state: snapshot.state,
            progress: progress.toFixed(2) + '%',
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes
          });
          
          // 计算上传速度（每秒传输的字节数）
          const now = Date.now();
          const timeDiff = (now - lastTime) / 1000; // 秒
          if (timeDiff > 0.5) { // 每0.5秒更新一次速度
            const bytesDiff = snapshot.bytesTransferred - lastBytes;
            speed = bytesDiff / timeDiff;
            lastBytes = snapshot.bytesTransferred;
            lastTime = now;
          }
          
          // 调用进度回调
          if (options.onProgress) {
            options.onProgress({
              progress,
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
              state: snapshot.state,
              speed, // 添加上传速度
              estimatedTimeRemaining: speed > 0 
                ? Math.ceil((snapshot.totalBytes - snapshot.bytesTransferred) / speed) 
                : null
            });
          }

          // 始终输出状态日志（帮助调试）
          switch (snapshot.state) {
            case 'paused':
              console.log('⏸️ Upload is paused');
              break;
            case 'running':
              if (progress % 10 < 1 || progress > 0) { // 每10%打印一次，或任何进度更新
                const speedMBps = speed > 0 ? (speed / 1024 / 1024).toFixed(2) : '0.00';
                console.log(`📤 Upload progress: ${progress.toFixed(1)}% | Speed: ${speedMBps} MB/s | State: ${snapshot.state}`);
              }
              break;
            default:
              console.log(`📋 Upload state: ${snapshot.state}`);
          }
        },
        (error) => {
          // 错误处理
          console.error('❌ ========== 上传错误 ==========');
          console.error('文件:', file.name);
          console.error('错误代码:', error.code);
          console.error('错误消息:', error.message);
          console.error('服务器响应:', error.serverResponse);
          console.error('完整错误:', error);
          console.error('================================');
          
          // 调用错误回调
          if (options.onError) {
            options.onError(error);
          }
          
          reject(error);
        },
        async () => {
          // 上传完成，获取下载URL
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            const result = {
              success: true,
              downloadURL,
              storagePath,
              metadata: {
                name: file.name,
                size: file.size,
                type: file.type,
                fullPath: uploadTask.snapshot.ref.fullPath
              }
            };
            
            // 调用成功回调
            if (options.onSuccess) {
              options.onSuccess(result);
            }
            
            resolve(result);
          } catch (error) {
            console.error('Error getting download URL:', error);
            if (options.onError) {
              options.onError(error);
            }
            reject(error);
          }
        }
      );
    } catch (error) {
      console.error('Error creating upload task:', error);
      if (options.onError) {
        options.onError(error);
      }
      reject(error);
    }
  });
};

/**
 * 批量上传文件（带并发控制）
 * @param {File[]} files - 要上传的文件数组
 * @param {string} userId - 用户ID
 * @param {Object} options - 配置选项
 * @param {Function} options.onFileProgress - 单个文件进度回调 (fileIndex, progress) => void
 * @param {Function} options.onFileError - 单个文件错误回调 (fileIndex, error) => void
 * @param {Function} options.onFileSuccess - 单个文件成功回调 (fileIndex, result) => void
 * @param {Function} options.onAllComplete - 所有文件完成回调 (results) => void
 * @param {string} options.folder - 存储文件夹（默认: 'media'）
 * @param {number} options.maxConcurrent - 最大并发数（默认: 3）
 * @returns {Promise<Array>} - 所有上传结果的Promise
 */
export const uploadFiles = async (files, userId, options = {}) => {
  const maxConcurrent = options.maxConcurrent || 3;
  const results = [];
  const errors = [];
  
  // 创建上传任务队列
  const tasks = files.map((file, index) => ({
    file,
    index,
    upload: () => uploadFile(file, userId, {
      folder: options.folder || 'media',
      onProgress: (progress) => {
        if (options.onFileProgress) {
          options.onFileProgress(index, progress);
        }
      },
      onError: (error) => {
        if (options.onFileError) {
          options.onFileError(index, error);
        }
      },
      onSuccess: (result) => {
        if (options.onFileSuccess) {
          options.onFileSuccess(index, result);
        }
      }
    })
  }));
  
  // 并发控制：同时只上传 maxConcurrent 个文件
  const executeWithConcurrency = async () => {
    const executing = [];
    
    console.log(`📤 开始批量上传，总共 ${tasks.length} 个文件，最大并发数: ${maxConcurrent}`);
    
    for (const task of tasks) {
      console.log(`📎 开始上传文件 ${task.index + 1}/${tasks.length}: ${task.file.name}`);
      
      const promise = task.upload()
        .then(result => {
          console.log(`✅ 文件 ${task.index + 1} 上传成功: ${task.file.name}`);
          results[task.index] = { success: true, ...result, fileIndex: task.index };
          return result;
        })
        .catch(error => {
          console.error(`❌ 文件 ${task.index + 1} 上传失败: ${task.file.name}`, error);
          const errorResult = { success: false, error, fileIndex: task.index };
          errors[task.index] = errorResult;
          results[task.index] = errorResult;
          return errorResult;
        })
        .finally(() => {
          // 从执行队列中移除
          const index = executing.indexOf(promise);
          if (index > -1) {
            executing.splice(index, 1);
          }
        });
      
      executing.push(promise);
      
      // 如果达到最大并发数，等待一个完成
      if (executing.length >= maxConcurrent) {
        await Promise.race(executing);
      }
    }
    
    // 等待所有任务完成
    console.log('⏳ 等待所有上传任务完成...');
    await Promise.all(executing);
    console.log('✅ 所有上传任务完成');
  };
  
  await executeWithConcurrency();
  
  // 格式化结果（确保顺序正确）
  const formattedResults = files.map((_, index) => {
    return results[index] || { success: false, error: new Error('上传任务未执行'), fileIndex: index };
  });
  
  // 调用完成回调
  if (options.onAllComplete) {
    options.onAllComplete(formattedResults);
  }
  
  return formattedResults;
};

/**
 * 删除文件
 * @param {string} storagePath - 存储路径
 * @returns {Promise} - 删除操作的Promise
 */
export const deleteFile = async (storagePath) => {
  try {
    const fileRef = ref(storage, storagePath);
    await deleteObject(fileRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

/**
 * 获取文件下载URL
 * @param {string} storagePath - 存储路径
 * @returns {Promise<string>} - 下载URL
 */
export const getFileDownloadURL = async (storagePath) => {
  try {
    const fileRef = ref(storage, storagePath);
    const downloadURL = await getDownloadURL(fileRef);
    return downloadURL;
  } catch (error) {
    console.error('Error getting download URL:', error);
    throw error;
  }
};

