import React, { useState, useEffect } from 'react';
import './mediaUpload.css';
import { preprocessFiles, formatFileSize, revokePreviewUrls } from './filePreprocessor';
import { uploadFiles, deleteFile, getFileDownloadURL, listUserFiles } from '../../lib/uploadService';
import { compressImages } from './imageCompressor';
import { db } from '../../lib/firebase';
import { collection, getDocs, query, where, orderBy, addDoc, deleteDoc, doc } from 'firebase/firestore';

const MediaUpload = () => {
  const [selectedFiles, setSelectedFiles] = useState([]); // 预处理后的文件信息数组
  const [uploadProgress, setUploadProgress] = useState({}); // { fileId: progress }
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' 或 'download'
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadErrors, setUploadErrors] = useState([]);
  
  // 当前用户ID（实际应该从认证状态获取）
  const userId = "3ChvOcuZASM3D9UhmGEHAULFaok2";
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [previewFile, setPreviewFile] = useState(null); // 预览的文件

  // 加载历史文件
  useEffect(() => {
    const loadHistoryFiles = async () => {
      if (!db || activeTab !== 'download') return;
      
      setLoadingHistory(true);
      try {
        console.log('📂 开始加载历史文件，用户ID:', userId);
        
        // 从Firestore加载文件列表
        const mediaFilesRef = collection(db, 'mediaFiles');
        const q = query(
          mediaFilesRef,
          where('userId', '==', userId),
          orderBy('uploadDate', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const files = [];
        
        querySnapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          const uploadDate = data.uploadDate?.toDate ? data.uploadDate.toDate() : new Date(data.uploadDate || Date.now());
          
          files.push({
            id: docSnapshot.id,
            name: data.fileName || '未知文件',
            type: data.fileType || 'image',
            size: formatFileSize(data.fileSize || 0),
            uploadDate: uploadDate.toLocaleString('zh-CN'),
            thumbnail: data.thumbnailURL || null,
            url: data.downloadURL || null,
            storagePath: data.storagePath,
            downloadUrlError: !data.downloadURL ? { type: 'missing_url' } : null
          });
        });
        
        setUploadedFiles(files);
        console.log('✅ 历史文件加载成功（从Firestore）:', files.length, '个文件');
        
        // 如果Firestore中没有文件，尝试从Storage加载（作为后备方案）
        if (files.length === 0) {
          console.log('Firestore中没有文件记录，尝试从Storage加载...');
          try {
            const storageFiles = await listUserFiles(userId);
            if (storageFiles.length > 0) {
              setUploadedFiles(storageFiles);
              console.log('✅ 从Storage加载历史文件成功:', storageFiles.length, '个文件');
            } else {
              console.log('Storage中也没有文件');
            }
          } catch (storageError) {
            console.warn('从Storage加载文件失败:', storageError);
          }
        }
      } catch (error) {
        console.error('❌ 加载历史文件失败:', error);
        
        // 如果是索引错误，提供创建索引的链接
        if (error.code === 'failed-precondition' && error.message?.includes('index')) {
          const indexUrl = error.message.match(/https:\/\/[^\s]+/)?.[0];
          if (indexUrl) {
            console.warn('⚠️ 需要创建Firestore索引:', indexUrl);
            console.warn('   点击上面的链接创建索引，或手动创建：');
            console.warn('   集合: mediaFiles');
            console.warn('   字段: userId (Ascending) + uploadDate (Descending)');
          }
        }
        
        // 如果Firestore查询失败，尝试从Storage加载（作为后备方案）
        console.log('尝试从Storage加载文件作为后备方案...');
        console.log('当前用户ID:', userId);
        console.log('查找路径: media/' + userId + '/images/ 和 media/' + userId + '/videos/');
        try {
          const storageFiles = await listUserFiles(userId);
          if (storageFiles.length > 0) {
            setUploadedFiles(storageFiles);
            console.log('✅ 从Storage加载历史文件成功（后备方案）:', storageFiles.length, '个文件');
          } else {
            console.warn('⚠️ Storage中也没有找到文件');
            console.warn('可能的原因：');
            console.warn('   1. 文件确实不存在');
            console.warn('   2. 文件在其他用户ID下（当前用户ID:', userId, ')');
            console.warn('   3. 文件路径不匹配');
            console.warn('   4. Storage规则不允许list操作');
            console.warn('建议：在Firebase Console中手动检查Storage文件是否存在');
          }
        } catch (storageError) {
          console.error('从Storage加载文件失败:', storageError);
          console.error('错误代码:', storageError.code);
          console.error('错误消息:', storageError.message);
          
          if (storageError.code === 'storage/unauthorized' || storageError.code === 'storage/permission-denied') {
            console.error('❌ 权限错误：Storage规则可能不允许list操作');
            console.error('   请确保规则中包含 allow read: if true;（read权限包含list操作）');
          }
          
          console.warn('使用当前会话的文件列表');
        }
      } finally {
        setLoadingHistory(false);
      }
    };
    
    loadHistoryFiles();
  }, [userId, activeTab, db]);

  // 清理预览URL
  useEffect(() => {
    return () => {
      const previewUrls = selectedFiles
        .filter(file => file.preview)
        .map(file => file.preview);
      revokePreviewUrls(previewUrls);
    };
  }, [selectedFiles]);

  // 处理文件选择（使用预处理功能）
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const { validFiles, invalidFiles } = preprocessFiles(files);
    
    // 合并到已选文件列表
    setSelectedFiles(prev => [...prev, ...validFiles]);
    
    // 如果有无效文件，显示错误
    if (invalidFiles.length > 0) {
      const errorMessages = invalidFiles.map(file => 
        `${file.name}: ${file.errors.join(', ')}`
      ).join('\n');
      alert('部分文件不符合要求：\n' + errorMessages);
    }
    
    // 重置文件输入
    e.target.value = '';
  };

  // 处理拖拽上传
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    const { validFiles, invalidFiles } = preprocessFiles(files);
    
    // 合并到已选文件列表
    setSelectedFiles(prev => [...prev, ...validFiles]);
    
    // 如果有无效文件，显示错误
    if (invalidFiles.length > 0) {
      const errorMessages = invalidFiles.map(file => 
        `${file.name}: ${file.errors.join(', ')}`
      ).join('\n');
      alert('部分文件不符合要求：\n' + errorMessages);
    }
  };

  // 处理上传（使用上传服务）
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      alert('请先选择要上传的文件');
      return;
    }

    console.log('🚀 ========== 开始上传流程 ==========');
    console.log('📁 选择的文件数量:', selectedFiles.length);
    console.log('👤 用户ID:', userId);
    
    setIsUploading(true);
    setUploadErrors([]);
    
    // 初始化上传进度
    const initialProgress = {};
    selectedFiles.forEach(file => {
      initialProgress[file.id] = { progress: 0, state: 'pending' };
    });
    setUploadProgress(initialProgress);

    try {
      // 提取File对象数组
      let filesToUpload = selectedFiles.map(fileInfo => fileInfo.file);
      
      // 压缩图片（减少文件大小，提升上传速度）
      console.log('🖼️ 开始压缩图片...');
      filesToUpload = await compressImages(filesToUpload, {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 0.8,
        maxSize: 2 * 1024 * 1024 // 2MB
      });
      console.log('✅ 图片压缩完成');

      // 更新文件信息（如果文件被压缩，大小会改变）
      const compressedFileMap = new Map();
      filesToUpload.forEach((file, index) => {
        const originalFileInfo = selectedFiles[index];
        if (file.size !== originalFileInfo.size) {
          compressedFileMap.set(originalFileInfo.id, {
            ...originalFileInfo,
            file,
            size: file.size,
            originalSize: originalFileInfo.size
          });
          const reduction = ((1 - file.size / originalFileInfo.size) * 100).toFixed(1);
          console.log(`📦 文件 ${file.name} 已压缩: ${formatFileSize(originalFileInfo.size)} → ${formatFileSize(file.size)} (减少 ${reduction}%)`);
        }
      });
      
      // 更新 selectedFiles 中被压缩的文件信息，并保存文件ID映射
      const fileIdMapping = selectedFiles.map((fileInfo, index) => fileInfo.id);
      
      setSelectedFiles(prev => prev.map(fileInfo => {
        const compressed = compressedFileMap.get(fileInfo.id);
        return compressed || fileInfo;
      }));

      console.log('📤 准备开始上传到 Firebase Storage');
      console.log('   - 文件数量:', filesToUpload.length);
      console.log('   - 用户ID:', userId);
      console.log('   - 存储路径前缀: media/' + userId);
      
      const results = await uploadFiles(filesToUpload, userId, {
        maxConcurrent: 3, // 限制同时上传3个文件，避免网络拥堵
        onFileProgress: (fileIndex, progress) => {
          // 使用文件ID映射来确保进度更新到正确的文件
          const fileId = fileIdMapping[fileIndex];
          console.log(`文件 ${fileIndex} 进度更新:`, {
            fileId,
            progress: progress.progress,
            state: progress.state,
            speed: progress.speed
          });
          
          if (fileId) {
            setUploadProgress(prev => {
              const newProgress = {
                ...prev,
                [fileId]: {
                  progress: progress.progress || 0,
                  speed: progress.speed || 0,
                  estimatedTime: progress.estimatedTimeRemaining || null,
                  state: progress.state || 'running'
                }
              };
              return newProgress;
            });
          }
        },
        onFileError: (fileIndex, error) => {
          const fileId = fileIdMapping[fileIndex];
          const fileInfo = selectedFiles.find(f => f.id === fileId) || { name: '未知文件' };
          const errorMessage = error.message || error.code || '未知错误';
          console.error(`文件 ${fileInfo.name} 上传失败:`, error);
          console.error('完整错误信息:', {
            code: error.code,
            message: error.message,
            serverResponse: error.serverResponse,
            stack: error.stack
          });
          
          // 生成更友好的错误提示
          let friendlyError = errorMessage;
          let showHelpLink = false;
          
          if (error.code === 'storage/unauthorized') {
            friendlyError = '❌ 权限不足：Firebase Storage 安全规则未配置或配置不正确';
            showHelpLink = true;
          } else if (error.code === 'storage/canceled') {
            friendlyError = '上传已取消';
          } else if (error.code === 'storage/unknown') {
            friendlyError = '未知错误，请检查网络连接和 Firebase 配置';
          } else if (error.code && error.code.includes('quota')) {
            friendlyError = '存储空间不足';
          } else if (error.code === 'storage/unauthenticated') {
            friendlyError = '❌ 未认证：请先登录 Firebase Auth';
            showHelpLink = true;
          }
          
          setUploadErrors(prev => [...prev, {
            fileName: fileInfo.name,
            error: friendlyError,
            code: error.code,
            fullError: error,
            showHelpLink: showHelpLink
          }]);
        },
        onFileSuccess: async (fileIndex, result) => {
          const fileId = fileIdMapping[fileIndex];
          const fileInfo = selectedFiles.find(f => f.id === fileId);
          
          // 检查是否有下载URL获取失败的错误
          const hasDownloadUrlError = result.error && result.error.type === 'download_url_failed';
          
          // 添加到已上传文件列表
          const uploadedFile = {
            id: result.storagePath,
            name: fileInfo.name,
            type: fileInfo.type,
            size: formatFileSize(fileInfo.size),
            uploadDate: new Date().toLocaleString('zh-CN'),
            thumbnail: fileInfo.preview || null,
            url: result.downloadURL, // 可能为null
            storagePath: result.storagePath,
            downloadUrlError: hasDownloadUrlError ? result.error : null // 记录下载URL错误
          };
          
          setUploadedFiles(prev => [uploadedFile, ...prev]);
          
          // 保存到Firestore（用于历史记录）
          if (db) {
            try {
              const fileData = {
                userId: userId,
                fileName: fileInfo.name,
                fileType: fileInfo.type,
                fileSize: fileInfo.size,
                mimeType: fileInfo.file?.type || 'unknown',
                storagePath: result.storagePath,
                downloadURL: result.downloadURL,
                thumbnailURL: fileInfo.preview || null,
                uploadDate: new Date()
              };
              
              const docRef = await addDoc(collection(db, 'mediaFiles'), fileData);
              console.log('✅ 文件元数据已保存到Firestore，文档ID:', docRef.id);
              
              // 更新文件ID为Firestore文档ID，方便后续删除
              uploadedFile.id = docRef.id;
              setUploadedFiles(prev => prev.map(f => 
                f.storagePath === result.storagePath ? { ...f, id: docRef.id } : f
              ));
            } catch (error) {
              console.error('❌ 保存文件元数据到Firestore失败:', error);
              // 不阻止上传成功，只是记录失败
            }
          }
          
          // 如果有下载URL错误，显示警告但不阻止文件添加到列表
          if (hasDownloadUrlError) {
            console.warn('⚠️ 文件上传成功，但获取下载URL失败:', fileInfo.name);
            console.warn('   文件已保存到:', result.storagePath);
            console.warn('   请检查 Firebase Storage 安全规则是否允许读取权限');
          }
        },
        onAllComplete: (results) => {
          const successCount = results.filter(r => r.success).length;
          const failCount = results.filter(r => !r.success).length;
          
          // 清理已上传的文件
          const failedFileIds = results
            .filter(r => !r.success)
            .map((r, idx) => fileIdMapping[idx]);
          
          // 成功上传的文件ID（用于清理）
          const successFileIds = results
            .filter(r => r.success)
            .map((r, idx) => fileIdMapping[idx]);
          
          // 从选择列表中移除所有已处理的文件（成功和失败）
          setSelectedFiles(prev => prev.filter(file => !failedFileIds.includes(file.id) && !successFileIds.includes(file.id)));
          
          // 清理预览URL（使用映射后的文件ID）
          const previewUrlsToClean = [];
          selectedFiles.forEach(file => {
            if (successFileIds.includes(file.id) && file.preview) {
              previewUrlsToClean.push(file.preview);
            }
          });
          revokePreviewUrls(previewUrlsToClean);
          
          // 重置上传进度
          setTimeout(() => {
            setUploadProgress({});
            setIsUploading(false);
          }, 500);
          
          // 显示完成消息
          if (failCount === 0) {
            alert(`✅ 上传完成！成功上传 ${successCount} 个文件`);
            // 清空已上传的文件列表，刷新界面
            setSelectedFiles([]);
          } else {
            const errorDetails = uploadErrors.map(e => `\n- ${e.fileName}: ${e.error}`).join('');
            alert(`⚠️ 上传完成！\n成功: ${successCount} 个\n失败: ${failCount} 个${errorDetails}\n\n请查看下方错误详情`);
          }
        }
      });
    } catch (error) {
      console.error('❌ ========== 上传过程出错 ==========');
      console.error('错误类型:', error.constructor.name);
      console.error('错误消息:', error.message);
      console.error('错误代码:', error.code);
      console.error('完整错误对象:', error);
      console.error('=====================================');
      
      setIsUploading(false);
      setUploadErrors(prev => [...prev, {
        fileName: '系统错误',
        error: error.message || '未知错误',
        code: error.code
      }]);
      
      alert('上传失败: ' + (error.message || '未知错误') + '\n\n请打开浏览器控制台（F12）查看详细错误信息');
    }
  };

  // 处理下载
  const handleDownload = async (file) => {
    try {
      let downloadURL = file.url;
      
      // 如果没有下载URL，尝试从storagePath获取
      if (!downloadURL && file.storagePath) {
        try {
          downloadURL = await getFileDownloadURL(file.storagePath);
          // 更新文件对象中的URL
          setUploadedFiles(prev => prev.map(f => 
            f.id === file.id ? { ...f, url: downloadURL } : f
          ));
        } catch (error) {
          console.error('获取下载URL失败:', error);
          alert('无法获取下载链接，请检查 Firebase Storage 安全规则是否允许读取权限');
          return;
        }
      }
      
      if (!downloadURL) {
        alert('文件下载链接不可用');
        return;
      }
      
      // 直接使用下载URL，让浏览器处理下载
      // 这样可以避免CORS问题，因为Firebase Storage的URL已经包含了正确的CORS头
      const link = document.createElement('a');
      link.href = downloadURL;
      link.download = file.name; // 设置下载文件名
      link.target = '_blank'; // 在新标签页打开（如果下载失败）
      link.rel = 'noopener noreferrer'; // 安全设置
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('下载文件失败:', error);
      alert('下载失败: ' + (error.message || '请检查 Firebase Storage 安全规则'));
    }
  };

  // 处理删除
  const handleDelete = async (file) => {
    if (!window.confirm(`确定要删除 "${file.name}" 吗？`)) {
      return;
    }

    try {
      const storagePath = file.storagePath || file.id;
      
      if (!storagePath) {
        throw new Error('文件路径不可用');
      }
      
      // 从Storage删除文件
      await deleteFile(storagePath);
      
      // 从Firestore删除文件记录
      if (db && file.id && !file.id.startsWith('media/')) {
        // 如果是Firestore文档ID，删除文档
        try {
          await deleteDoc(doc(db, 'mediaFiles', file.id));
          console.log('✅ Firestore记录已删除');
        } catch (firestoreError) {
          console.warn('⚠️ 删除Firestore记录失败（可能不是Firestore记录）:', firestoreError);
        }
      } else if (db && storagePath) {
        // 如果是storagePath，尝试查找并删除Firestore记录
        try {
          const mediaFilesRef = collection(db, 'mediaFiles');
          const q = query(mediaFilesRef, where('storagePath', '==', storagePath));
          const querySnapshot = await getDocs(q);
          const deletePromises = [];
          querySnapshot.forEach((docSnapshot) => {
            deletePromises.push(deleteDoc(doc(db, 'mediaFiles', docSnapshot.id)));
          });
          await Promise.all(deletePromises);
          console.log('✅ Firestore记录已删除');
        } catch (firestoreError) {
          console.warn('⚠️ 删除Firestore记录失败:', firestoreError);
        }
      }
      
      // 从列表中移除
      setUploadedFiles(prev => prev.filter(f => f.id !== file.id));
      alert('文件已删除');
    } catch (error) {
      console.error('删除文件失败:', error);
      alert('删除失败: ' + (error.message || error.code || '未知错误'));
    }
  };
  
  // 处理预览
  const handlePreview = async (file) => {
    try {
      let previewURL = file.url || file.thumbnail;
      
      // 如果没有预览URL，尝试从storagePath获取
      if (!previewURL && file.storagePath) {
        try {
          previewURL = await getFileDownloadURL(file.storagePath);
        } catch (error) {
          console.error('获取预览URL失败:', error);
          alert('无法预览此文件: ' + error.message);
          return;
        }
      }
      
      if (previewURL) {
        setPreviewFile({
          ...file,
          previewURL: previewURL
        });
      } else {
        alert('无法预览此文件');
      }
    } catch (error) {
      console.error('获取预览URL失败:', error);
      alert('预览失败: ' + error.message);
    }
  };

  return (
    <div className="media-upload-container">
      <div className="media-header">
        <h1>📷 照片/视频管理</h1>
        <p>上传和管理活动相关的照片和视频文件</p>
      </div>

      {/* 标签页切换 */}
      <div className="media-tabs">
        <button
          className={`tab-button ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          📤 上传文件
        </button>
        <button
          className={`tab-button ${activeTab === 'download' ? 'active' : ''}`}
          onClick={() => setActiveTab('download')}
        >
          📥 文件列表
        </button>
      </div>

      {/* 上传标签页内容 */}
      {activeTab === 'upload' && (
        <div className="upload-section">
          <div className="upload-card">
            <h2 className="section-title">选择文件上传</h2>
            
            <div
              className="upload-area"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="file-input"
                multiple
                accept="image/*,video/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <label htmlFor="file-input" className="upload-label">
                <div className="upload-icon">📎</div>
                <div className="upload-text">
                  <p className="upload-title">点击选择文件或拖拽文件到这里</p>
                  <p className="upload-hint">支持图片和视频文件（JPG, PNG, MP4, MOV等）</p>
                </div>
              </label>
            </div>

            {selectedFiles.length > 0 && (
              <div className="selected-files">
                <h3>已选择的文件 ({selectedFiles.length})</h3>
                <div className="selected-files-list">
                  {selectedFiles.map((fileInfo) => {
                    const progressInfo = uploadProgress[fileInfo.id] || { progress: 0 };
                    const progress = typeof progressInfo === 'number' ? progressInfo : progressInfo.progress;
                    const speed = progressInfo.speed || 0;
                    const estimatedTime = progressInfo.estimatedTime || null;
                    
                    return (
                      <div key={fileInfo.id} className="selected-file-item">
                        {fileInfo.preview && (
                          <img 
                            src={fileInfo.preview} 
                            alt={fileInfo.name}
                            className="file-preview"
                          />
                        )}
                        <span className="file-icon">
                          {fileInfo.type === 'image' ? '🖼️' : '🎥'}
                        </span>
                        <div className="file-info">
                          <div className="file-name">{fileInfo.name}</div>
                          <div className="file-size">
                            {fileInfo.originalSize ? (
                              <>
                                {formatFileSize(fileInfo.size)} 
                                <span className="compressed-badge">(已压缩: {formatFileSize(fileInfo.originalSize)})</span>
                              </>
                            ) : (
                              formatFileSize(fileInfo.size)
                            )}
                          </div>
                          {isUploading && (
                            <div className="file-progress">
                              <div className="file-progress-bar">
                                <div 
                                  className="file-progress-fill" 
                                  style={{ width: `${Math.max(progress || 0, 1)}%` }}
                                ></div>
                              </div>
                              <div className="progress-info">
                                <span>
                                  {progress > 0 
                                    ? `${Math.round(progress)}%` 
                                    : progressInfo.state === 'running' 
                                      ? '正在上传...' 
                                      : '准备上传...'}
                                </span>
                                {speed > 0 && (
                                  <span className="upload-speed">
                                    {formatFileSize(speed)}/s
                                    {estimatedTime && estimatedTime > 0 && ` (剩余 ${Math.ceil(estimatedTime)}秒)`}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        <button
                          className="remove-file-btn"
                          onClick={() => {
                            // 清理预览URL
                            if (fileInfo.preview) {
                              revokePreviewUrls([fileInfo.preview]);
                            }
                            setSelectedFiles(prev => prev.filter(f => f.id !== fileInfo.id));
                            setUploadProgress(prev => {
                              const newProgress = { ...prev };
                              delete newProgress[fileInfo.id];
                              return newProgress;
                            });
                          }}
                          disabled={isUploading && progress > 0 && progress < 100}
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
                {uploadErrors.length > 0 && (
                  <div className="upload-errors">
                    <h4>❌ 上传错误 ({uploadErrors.length})：</h4>
                    {uploadErrors.map((error, index) => (
                      <div key={index} className="error-item">
                        <strong>{error.fileName}:</strong> {error.error || error.message || '未知错误'}
                        {error.code === 'storage/unauthorized' && (
                          <div className="error-help">
                            <p>🔧 <strong>解决方案：配置 Firebase Storage 安全规则</strong></p>
                            <ol>
                              <li>打开 <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer">Firebase Console</a></li>
                              <li>选择项目：<code>siuroma-kids</code></li>
                              <li>进入 <strong>Storage</strong> → <strong>规则</strong> 标签页</li>
                              <li>复制以下规则并<strong>完全替换</strong>现有规则：</li>
                            </ol>
                            <div style={{ 
                              background: 'rgba(0, 0, 0, 0.3)', 
                              padding: '15px', 
                              borderRadius: '6px', 
                              marginTop: '10px',
                              fontFamily: 'monospace',
                              fontSize: '12px',
                              overflowX: 'auto'
                            }}>
                              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{`rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      // ⚠️ 测试模式：允许所有人读写删除（仅用于开发测试）
      allow read, write, delete: if request.resource == null || 
                                   (request.resource.size < 100 * 1024 * 1024
                                    && request.resource.contentType.matches('image/.*|video/.*'));
    }
  }
}`}</pre>
                            </div>
                            <ol start="5" style={{ marginTop: '10px' }}>
                              <li>点击 <strong>"发布"</strong> 按钮</li>
                              <li>等待 10-30 秒后刷新页面重试</li>
                            </ol>
                            <p style={{ marginTop: '12px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                              📖 详细说明请查看 <code>QUICK_FIX_STORAGE.md</code> 或 <code>STORAGE_RULES_SETUP.md</code>
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="error-hint">
                      💡 提示：检查网络连接、文件大小、Firebase Storage 配置和安全规则
                    </div>
                  </div>
                )}
                <button 
                  className="upload-button" 
                  onClick={handleUpload} 
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <span>📤 上传中... ({Object.keys(uploadProgress).filter(id => {
                        const p = uploadProgress[id];
                        const progress = typeof p === 'number' ? p : p?.progress || 0;
                        return progress > 0 && progress < 100;
                      }).length} 个文件进行中)</span>
                      <div className="progress-bar">
                        <div
                          className="progress-bar-fill"
                          style={{ 
                            width: `${Math.min(100, Object.values(uploadProgress).reduce((sum, p) => {
                              const progress = typeof p === 'number' ? p : p?.progress || 0;
                              return sum + progress;
                            }, 0) / Math.max(selectedFiles.length, 1))}%` 
                          }}
                        ></div>
                      </div>
                    </>
                  ) : (
                    '📤 开始上传'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 下载标签页内容 */}
      {activeTab === 'download' && (
        <div className="download-section">
          <div className="download-card">
            <h2 className="section-title">已上传的文件</h2>
            
            {loadingHistory ? (
              <div className="empty-media">
                <span className="empty-icon">⏳</span>
                <p>正在加载历史文件...</p>
              </div>
            ) : uploadedFiles.length === 0 ? (
              <div className="empty-media">
                <span className="empty-icon">📭</span>
                <p>暂无已上传的文件</p>
                <p className="empty-hint">切换到"上传文件"标签页开始上传</p>
              </div>
            ) : (
              <div className="media-grid">
                {uploadedFiles.map(file => (
                  <div key={file.id} className="media-item">
                    <div 
                      className="media-thumbnail" 
                      onClick={() => handlePreview(file)} 
                      style={{ cursor: 'pointer' }}
                    >
                      {file.type === 'image' ? (
                        file.thumbnail || file.url ? (
                          <img 
                            src={file.thumbnail || file.url} 
                            alt={file.name}
                            onError={(e) => {
                              // 如果缩略图加载失败，尝试使用下载URL
                              if (file.url && e.target.src !== file.url) {
                                e.target.src = file.url;
                              } else {
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = '<div class="image-placeholder">🖼️</div>';
                              }
                            }}
                          />
                        ) : (
                          <div className="image-placeholder">🖼️</div>
                        )
                      ) : (
                        <div className="video-thumbnail">
                          <span className="play-icon">▶</span>
                        </div>
                      )}
                      <div className="media-overlay">
                        <button
                          className="media-action-btn preview-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreview(file);
                          }}
                          title="预览"
                        >
                          👁️
                        </button>
                        <button
                          className="media-action-btn download-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(file);
                          }}
                          title="下载"
                        >
                          ⬇️
                        </button>
                        <button
                          className="media-action-btn delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(file);
                          }}
                          title="删除"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <div className="media-info">
                      <div className="media-name" title={file.name}>
                        {file.name}
                        {file.downloadUrlError && (
                          <span style={{ 
                            fontSize: '11px', 
                            color: '#ffc107', 
                            marginLeft: '8px',
                            display: 'block',
                            marginTop: '4px'
                          }}>
                            ⚠️ 上传成功，但下载URL获取失败（请检查读取权限）
                          </span>
                        )}
                      </div>
                      <div className="media-meta">
                        <span className="media-type">{file.type === 'image' ? '🖼️ 图片' : '🎥 视频'}</span>
                        <span className="media-size">{file.size}</span>
                      </div>
                      <div className="media-date">{file.uploadDate}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 预览模态框 */}
      {previewFile && (
        <div className="preview-modal" onClick={() => setPreviewFile(null)}>
          <div className="preview-content" onClick={(e) => e.stopPropagation()}>
            <button className="preview-close" onClick={() => setPreviewFile(null)}>✕</button>
            {previewFile.type === 'image' ? (
              <img src={previewFile.previewURL || previewFile.url || previewFile.thumbnail} alt={previewFile.name} />
            ) : (
              <video controls src={previewFile.previewURL || previewFile.url}>
                您的浏览器不支持视频播放
              </video>
            )}
            <div className="preview-info">
              <h3>{previewFile.name}</h3>
              <p>{previewFile.type === 'image' ? '🖼️ 图片' : '🎥 视频'} • {previewFile.size}</p>
              <div className="preview-actions">
                <button onClick={() => {
                  handleDownload(previewFile);
                }}>⬇️ 下载</button>
                <button onClick={() => {
                  handleDelete(previewFile);
                  setPreviewFile(null);
                }}>🗑️ 删除</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaUpload;

