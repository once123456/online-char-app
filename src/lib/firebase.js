// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";

import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

/**
 * 清理存储桶配置值
 * 移除可能的引号、逗号、空格等
 */
const cleanStorageBucket = (bucket) => {
  if (!bucket) return undefined;
  
  // 转换为字符串并移除所有引号（包括中间和首尾）
  let cleaned = String(bucket)
    .replace(/["']/g, '') // 移除所有引号（单引号和双引号）
    .replace(/,/g, '') // 移除所有逗号
    .replace(/^gs:\/\//, '') // 移除 gs:// 前缀（如果有）
    .trim();
  
  // 移除可能的其他非法字符，只保留字母、数字、点、连字符、下划线
  cleaned = cleaned.replace(/[^\w.-]/g, '');
  
  // 再次检查并移除任何残留的引号或逗号
  cleaned = cleaned.replace(/["',]/g, '');
  
  return cleaned;
};

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: cleanStorageBucket(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// 验证配置并输出调试信息
console.log('🔧 Firebase 配置检查:');
console.log('  - API Key:', firebaseConfig.apiKey ? '✅ 已配置' : '❌ 未配置');
console.log('  - Auth Domain:', firebaseConfig.authDomain || '❌ 未配置');
console.log('  - Project ID:', firebaseConfig.projectId || '❌ 未配置');
console.log('  - Storage Bucket (原始值):', import.meta.env.VITE_FIREBASE_STORAGE_BUCKET);
console.log('  - Storage Bucket (清理后):', firebaseConfig.storageBucket || '❌ 未配置');

if (!firebaseConfig.storageBucket) {
  console.error('❌ 错误: VITE_FIREBASE_STORAGE_BUCKET 未配置或为空！');
  console.error('   请在 .env 文件中配置: VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com');
  console.error('   注意：不要包含引号、逗号或 gs:// 前缀');
} else {
  // 检查清理后的值是否仍然有问题
  if (firebaseConfig.storageBucket.includes('"') || 
      firebaseConfig.storageBucket.includes("'") || 
      firebaseConfig.storageBucket.includes(',')) {
    console.error('❌ 错误: Storage Bucket 清理后仍包含非法字符！');
    console.error('   原始值:', import.meta.env.VITE_FIREBASE_STORAGE_BUCKET);
    console.error('   清理后:', firebaseConfig.storageBucket);
    console.error('   请检查 .env 文件格式');
  } else {
    console.log('  ✅ Storage Bucket 配置正确');
  }
}

// 在初始化前再次验证和清理 storageBucket
if (firebaseConfig.storageBucket) {
  // 强制再次清理（防止任何遗漏）
  const originalBucket = firebaseConfig.storageBucket;
  firebaseConfig.storageBucket = firebaseConfig.storageBucket
    .replace(/["']/g, '')
    .replace(/,/g, '')
    .replace(/[^\w.-]/g, '');
  
  if (originalBucket !== firebaseConfig.storageBucket) {
    console.warn('⚠️ Storage Bucket 在初始化前被再次清理');
    console.warn('   原始:', originalBucket);
    console.warn('   清理后:', firebaseConfig.storageBucket);
  }
}

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase 初始化成功');
  console.log('   - Storage Bucket (最终值):', firebaseConfig.storageBucket);
} catch (error) {
  console.error('❌ Firebase 初始化失败:', error);
  console.error('   请检查 Firebase 配置，特别是 storageBucket');
  throw error;
}

// Initialize Firestore, Auth, and Storage
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// 验证 Storage 初始化并检查 bucket
if (storage) {
  console.log('✅ Firebase Storage 初始化成功');
  // 尝试获取 bucket 信息（如果可能）
  try {
    // 注意：storage 对象可能没有直接的 bucket 属性，这里只是验证初始化成功
    console.log('   - Storage 对象已创建');
  } catch (e) {
    console.warn('⚠️ 无法获取 Storage bucket 信息:', e);
  }
} else {
  console.error('❌ Firebase Storage 初始化失败');
}

export { db, auth, storage };
