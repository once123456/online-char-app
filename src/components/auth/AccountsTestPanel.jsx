import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, addDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import './accountsTestPanel.css';

const AccountsTestPanel = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('检查中...');
  const [newAccount, setNewAccount] = useState({
    email: '',
    studentId: '',
    role: 'parent'
  });

  // 检查数据库连接
  useEffect(() => {
    const checkConnection = async () => {
      try {
        if (!db) {
          setConnectionStatus('❌ 未连接 - db 对象为空');
          return;
        }
        
        const testQuery = collection(db, "accounts");
        await getDocs(testQuery);
        setConnectionStatus('✅ 已连接 - 可以正常访问 accounts 集合');
      } catch (err) {
        setConnectionStatus(`❌ 连接失败: ${err.message}`);
        console.error('Firebase 连接测试失败:', err);
      }
    };
    
    checkConnection();
  }, []);

  // 获取所有账号
  const fetchAllAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!db) {
        throw new Error('Firebase 数据库未初始化');
      }

      const accountsRef = collection(db, "accounts");
      const querySnapshot = await getDocs(accountsRef);
      
      const accountsList = [];
      querySnapshot.forEach((doc) => {
        accountsList.push({
          id: doc.id,
          ...doc.data()
        });
      });

      setAccounts(accountsList);
      console.log('📋 所有账号数据:', accountsList);
    } catch (err) {
      console.error('❌ 获取账号列表失败:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 创建测试账号
  const createTestAccount = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!db) {
        throw new Error('Firebase 数据库未初始化');
      }

      if (!newAccount.email || !newAccount.studentId) {
        throw new Error('请填写邮箱和学生ID');
      }

      // 验证学生ID是否存在
      const studentDoc = await getDoc(doc(db, "students", newAccount.studentId));
      if (!studentDoc.exists()) {
        throw new Error(`学生ID "${newAccount.studentId}" 不存在`);
      }

      const accountData = {
        email: newAccount.email,
        studentId: newAccount.studentId,
        role: newAccount.role || 'parent',
        createdAt: new Date().toISOString()
      };

      // 添加到accounts集合
      const docRef = await addDoc(collection(db, "accounts"), accountData);
      console.log('✅ 测试账号已创建，ID:', docRef.id);
      alert(`测试账号已创建！\n文档ID: ${docRef.id}\n注意：您还需要在Firebase Authentication中创建对应的邮箱账号`);
      
      // 重置表单
      setNewAccount({ email: '', studentId: '', role: 'parent' });
      
      // 刷新列表
      await fetchAllAccounts();
    } catch (err) {
      console.error('❌ 创建测试账号失败:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 批量创建测试账号
  const createMultipleTestAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!db) {
        throw new Error('Firebase 数据库未初始化');
      }

      const testAccounts = [
        {
          email: 'parent1@example.com',
          studentId: 'STUDENT_001',
          role: 'parent',
          createdAt: new Date().toISOString()
        },
        {
          email: 'parent2@example.com',
          studentId: 'STUDENT_002',
          role: 'parent',
          createdAt: new Date().toISOString()
        },
        {
          email: 'parent3@example.com',
          studentId: 'STUDENT_001',
          role: 'parent',
          createdAt: new Date().toISOString()
        }
      ];

      const createdIds = [];
      for (const accountData of testAccounts) {
        // 检查学生ID是否存在
        try {
          const studentDoc = await getDoc(doc(db, "students", accountData.studentId));
          if (studentDoc.exists()) {
            const docRef = await addDoc(collection(db, "accounts"), accountData);
            createdIds.push({ id: docRef.id, ...accountData });
            console.log(`✅ 测试账号已创建: ${accountData.email}`);
            await new Promise(resolve => setTimeout(resolve, 300));
          } else {
            console.warn(`⚠️ 跳过 ${accountData.email}，学生ID ${accountData.studentId} 不存在`);
          }
        } catch (err) {
          console.error(`❌ 创建账号失败 ${accountData.email}:`, err);
        }
      }
      
      alert(`✅ 已创建 ${createdIds.length} 个测试账号！\n注意：您还需要在Firebase Authentication中创建对应的邮箱账号\n\n请点击"获取所有账号"查看`);
      
      // 刷新列表
      await fetchAllAccounts();
    } catch (err) {
      console.error('❌ 批量创建测试账号失败:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="accounts-test-panel">
      <div className="test-panel-header">
        <h2>🔥 Firebase Accounts 表测试工具</h2>
        <div className={`connection-status ${connectionStatus.includes('✅') ? 'connected' : 'disconnected'}`}>
          {connectionStatus}
        </div>
      </div>

      {error && (
        <div className="error-message">
          <strong>错误:</strong> {error}
        </div>
      )}

      <div className="test-actions">
        <button 
          onClick={fetchAllAccounts} 
          disabled={loading || !db}
          className="test-btn primary"
        >
          {loading ? '加载中...' : '📋 获取所有账号'}
        </button>
        <button 
          onClick={createMultipleTestAccounts} 
          disabled={loading || !db}
          className="test-btn"
          style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
        >
          {loading ? '创建中...' : '🎯 批量创建测试数据'}
        </button>
      </div>

      {/* 创建单个账号表单 */}
      <div className="create-account-form">
        <h3>创建单个测试账号</h3>
        <div className="form-row">
          <div className="form-group">
            <label>邮箱地址</label>
            <input
              type="email"
              value={newAccount.email}
              onChange={(e) => setNewAccount({ ...newAccount, email: e.target.value })}
              placeholder="parent@example.com"
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>学生ID</label>
            <input
              type="text"
              value={newAccount.studentId}
              onChange={(e) => setNewAccount({ ...newAccount, studentId: e.target.value.toUpperCase() })}
              placeholder="STUDENT_001"
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>角色</label>
            <select
              value={newAccount.role}
              onChange={(e) => setNewAccount({ ...newAccount, role: e.target.value })}
              disabled={loading}
            >
              <option value="parent">家长</option>
              <option value="admin">管理员</option>
            </select>
          </div>
          <button
            onClick={createTestAccount}
            disabled={loading || !newAccount.email || !newAccount.studentId}
            className="create-btn"
          >
            {loading ? '创建中...' : '➕ 创建账号'}
          </button>
        </div>
        <small className="form-note">
          ⚠️ 注意：创建账号后，您还需要在 Firebase Authentication 中手动创建对应的邮箱/密码认证账号
        </small>
      </div>

      {/* 账号列表 */}
      {accounts.length > 0 && (
        <div className="accounts-list">
          <h3>账号列表 ({accounts.length} 个)</h3>
          <div className="accounts-grid">
            {accounts.map((account) => (
              <div key={account.id} className="account-card">
                <div className="account-id">ID: {account.id}</div>
                <div className="account-email">{account.email}</div>
                <div className="account-student-id">
                  <strong>学生ID:</strong> {account.studentId}
                </div>
                <div className="account-role">
                  <strong>角色:</strong> {account.role || 'parent'}
                </div>
                {account.createdAt && (
                  <div className="account-date">
                    创建时间: {new Date(account.createdAt).toLocaleString('zh-CN')}
                  </div>
                )}
                {account.uid && (
                  <div className="account-uid">
                    UID: {account.uid}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 使用说明 */}
      <div className="test-instructions">
        <h4>📖 使用说明:</h4>
        <ul>
          <li><strong>获取所有账号:</strong> 列出 accounts 集合中的所有账号记录</li>
          <li><strong>批量创建测试数据:</strong> 创建3个测试账号（需要对应的学生ID存在）</li>
          <li><strong>创建单个账号:</strong> 手动创建账号，需要填写邮箱和学生ID</li>
          <li><strong>重要提示:</strong> 在 accounts 集合中创建记录后，还需要在 Firebase Authentication 中创建对应的邮箱/密码认证账号</li>
          <li><strong>学生ID验证:</strong> 创建账号时会验证学生ID是否存在于 students 集合中</li>
        </ul>
      </div>
    </div>
  );
};

export default AccountsTestPanel;


