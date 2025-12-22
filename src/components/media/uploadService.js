/**
 * 文件上传服务
 * 使用 Firebase Storage 处理文件上传
 */

import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "../../lib/firebase";
import { generateStoragePath } from "./filePreprocessor";

/**
 * 上传文件到 Firebase Storage
 * @param {File} file - 要上传的文件
 * @param {string} userId - 用户ID
 * @param {Object} options - 配置选项
 * @param {Function} onProgress - 进度回调函数 (progress) => void
 * @param {Function} onError - 错误回调函数 (error) => void
 * @param {Function} onSuccess - 成功回调函数 (downloadURL, metadata) => void
 * @returns {Promise<Object>} 上传任务对象和取消函数
 */
export const uploadFile = (file, userId, options = {}) => {
  return new Promise((resolve, reject) => {
    const {
      onProgress,
      onError,
      onSuccess,
      folder = 'media',
      metadata = {}
    } = options;

    // 生成存储路径
    const storagePath = generateStoragePath(file, userId, folder);
    const storageRef = ref(storage, storagePath);

    // 创建文件元数据
    const fileMetadata = {
      contentType: file.type,
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        userId: userId,
        ...metadata
      }
    };

    // 创建上传任务
    const uploadTask = uploadBytesResumable(storageRef, file, fileMetadata);

    // 监听上传状态变化
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        // 计算上传进度
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        
        // 调用进度回调
        if (onProgress) {
          onProgress({
            progress: Math.round(progress),
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
            state: snapshot.state
          });
        }

        // 处理不同状态
        switch (snapshot.state) {
          case 'paused':
            console.log('Upload is paused');
            break;
          case 'running':
            console.log('Upload is running');
            break;
        }
      },
      (error) => {
        // 处理上传错误
        let errorMessage = '上传失败';
        
        switch (error.code) {
          case 'storage/unauthorized':
            errorMessage = '您没有权限上传文件';
            break;
          case 'storage/canceled':
            errorMessage = '上传已取消';
            break;
          case 'storage/unknown':
            errorMessage = '发生未知错误，请稍后重试';
            break;
          case 'storage/quota-exceeded':
            errorMessage = '存储空间不足';
            break;
          case 'storage/unauthenticated':
            errorMessage = '请先登录';
            break;
          default:
            errorMessage = error.message || '上传失败，请稍后重试';
        }

        const uploadError = {
          code: error.code,
          message: errorMessage,
          originalError: error
        };

        if (onError) {
          onError(uploadError);
        }

        reject(uploadError);
      },
      async () => {
        // 上传完成，获取下载URL
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          const uploadResult = {
            downloadURL,
            storagePath,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            metadata: fileMetadata,
            snapshot: uploadTask.snapshot
          };

          if (onSuccess) {
            onSuccess(uploadResult);
          }

          resolve(uploadResult);
        } catch (error) {
          const getUrlError = {
            code: 'get-url-error',
            message: '获取下载链接失败',
            originalError: error
          };

          if (onError) {
            onError(getUrlError);
          }

          reject(getUrlError);
        }
      }
    );

    // 返回上传任务对象和取消函数
    return {
      task: uploadTask,
      cancel: () => uploadTask.cancel()
    };
  });
};

/**
 * 批量上传文件
 * @param {Array<File>} files - 文件数组
 * @param {string} userId - 用户ID
 * @param {Object} options - 配置选项
 * @returns {Promise<Array>} 上传结果数组
 */
export const uploadFiles = async (files, userId, options = {}) => {
  const {
    onFileProgress, // (fileIndex, progress) => void
    onFileError,    // (fileIndex, error) => void
    onFileSuccess,  // (fileIndex, result) => void
    onAllComplete,  // (results) => void
    ...uploadOptions
  } = options;

  const uploadPromises = files.map((file, index) => {
    return uploadFile(file, userId, {
      ...uploadOptions,
      onProgress: (progress) => {
        if (onFileProgress) {
          onFileProgress(index, progress);
        }
      },
      onError: (error) => {
        if (onFileError) {
          onFileError(index, error);
        }
      },
      onSuccess: (result) => {
        if (onFileSuccess) {
          onFileSuccess(index, result);
        }
      }
    }).catch(error => ({
      file,
      error,
      index
    }));
  });

  const results = await Promise.allSettled(uploadPromises);
  
  const uploadResults = results.map((result, index) => ({
    index,
    file: files[index],
    success: result.status === 'fulfilled',
    data: result.status === 'fulfilled' ? result.value : null,
    error: result.status === 'rejected' ? result.reason : null
  }));

  if (onAllComplete) {
    onAllComplete(uploadResults);
  }

  return uploadResults;
};

/**
 * 删除Storage中的文件
 * @param {string} storagePath - 文件的Storage路径
 * @returns {Promise<void>}
 */
export const deleteFile = async (storagePath) => {
  try {
    const fileRef = ref(storage, storagePath);
    await deleteObject(fileRef);
    return { success: true };
  } catch (error) {
    let errorMessage = '删除失败';
    
    switch (error.code) {
      case 'storage/object-not-found':
        errorMessage = '文件不存在';
        break;
      case 'storage/unauthorized':
        errorMessage = '您没有权限删除此文件';
        break;
      default:
        errorMessage = error.message || '删除失败，请稍后重试';
    }

    throw {
      code: error.code,
      message: errorMessage,
      originalError: error
    };
  }
};

/**
 * 获取文件的下载URL
 * @param {string} storagePath - 文件的Storage路径
 * @returns {Promise<string>} 下载URL
 */
export const getFileDownloadURL = async (storagePath) => {
  try {
    const fileRef = ref(storage, storagePath);
    const downloadURL = await getDownloadURL(fileRef);
    return downloadURL;
  } catch (error) {
    throw {
      code: error.code,
      message: '获取下载链接失败',
      originalError: error
    };
  }
};

