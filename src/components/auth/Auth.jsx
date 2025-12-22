import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import './auth.css';

const Auth = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // 注册新账号
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!email || !password || !studentId) {
        throw new Error('请填写所有必填项');
      }

      if (password.length < 6) {
        throw new Error('密码至少需要6个字符');
      }

      // 验证学生ID是否存在
      const studentDoc = await getDoc(doc(db, "students", studentId));
      if (!studentDoc.exists()) {
        throw new Error(`学生ID "${studentId}" 不存在，请确认后重试`);
      }

      // 创建Firebase认证账号
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 在accounts集合中创建账号记录
      const accountData = {
        email: email,
        studentId: studentId,
        createdAt: new Date().toISOString(),
        role: 'parent'
      };

      // 使用用户UID作为文档ID
      await setDoc(doc(db, "accounts", user.uid), accountData);

      // 同时保存到accounts集合（可选，用于查询）
      await addDoc(collection(db, "accounts"), {
        ...accountData,
        uid: user.uid
      });

      setSuccess('注册成功！正在登录...');
      console.log('✅ 账号注册成功:', { uid: user.uid, email, studentId });

      // 自动登录
      setTimeout(() => {
        onAuthSuccess(user, accountData);
      }, 1000);
    } catch (err) {
      console.error('❌ 注册失败:', err);
      setError(err.message || '注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 登录
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!email || !password) {
        throw new Error('请填写邮箱和密码');
      }

      // Firebase认证登录
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 从accounts集合获取账号信息（使用UID作为文档ID）
      let accountDoc = await getDoc(doc(db, "accounts", user.uid));
      
      if (!accountDoc.exists()) {
        // 如果accounts集合中没有，尝试从accounts集合中查找（旧数据格式）
        const accountsRef = collection(db, "accounts");
        const q = query(accountsRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const accountData = querySnapshot.docs[0].data();
          // 更新到accounts集合（使用UID作为文档ID，便于后续查询）
          await setDoc(doc(db, "accounts", user.uid), {
            email: accountData.email,
            studentId: accountData.studentId,
            createdAt: accountData.createdAt || new Date().toISOString(),
            role: accountData.role || 'parent'
          });
          onAuthSuccess(user, { ...accountData, uid: user.uid });
        } else {
          throw new Error('账号信息不存在，请联系管理员');
        }
      } else {
        const accountData = accountDoc.data();
        onAuthSuccess(user, { ...accountData, uid: user.uid });
      }

      setSuccess('登录成功！');
      console.log('✅ 登录成功:', user.uid);
    } catch (err) {
      console.error('❌ 登录失败:', err);
      let errorMessage = '登录失败，请稍后重试';
      
      if (err.code === 'auth/user-not-found') {
        errorMessage = '该邮箱未注册';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = '密码错误';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = '邮箱格式不正确';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>{isLogin ? '👤 家长登录' : '📝 家长注册'}</h1>
          <p>{isLogin ? '登录以查看您孩子的课程信息' : '注册新账号并绑定学生ID'}</p>
        </div>

        {error && (
          <div className="auth-error">
            <strong>错误：</strong> {error}
          </div>
        )}

        {success && (
          <div className="auth-success">
            <strong>成功：</strong> {success}
          </div>
        )}

        <form onSubmit={isLogin ? handleLogin : handleRegister} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">邮箱地址 *</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="请输入邮箱地址"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">密码 *</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isLogin ? "请输入密码" : "至少6个字符"}
              required
              minLength={isLogin ? undefined : 6}
              disabled={loading}
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="studentId">学生ID *</label>
              <input
                type="text"
                id="studentId"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value.toUpperCase())}
                placeholder="例如: STUDENT_001"
                required
                disabled={loading}
              />
              <small className="form-hint">请输入您孩子的学生ID（如：STUDENT_001）</small>
            </div>
          )}

          <button 
            type="submit" 
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? '处理中...' : (isLogin ? '登录' : '注册')}
          </button>
        </form>

        <div className="auth-switch">
          {isLogin ? (
            <p>
              还没有账号？{' '}
              <button 
                type="button" 
                className="switch-link"
                onClick={() => setIsLogin(false)}
                disabled={loading}
              >
                立即注册
              </button>
            </p>
          ) : (
            <p>
              已有账号？{' '}
              <button 
                type="button" 
                className="switch-link"
                onClick={() => setIsLogin(true)}
                disabled={loading}
              >
                立即登录
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;

