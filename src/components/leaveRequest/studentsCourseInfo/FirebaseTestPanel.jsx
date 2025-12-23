import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, query, limit } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import './firebaseTestPanel.css';

const FirebaseTestPanel = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('检查中...');

  // 检查数据库连接
  useEffect(() => {
    const checkConnection = async () => {
      try {
        if (!db) {
          setConnectionStatus('❌ 未连接 - db 对象为空');
          setError('Firebase 数据库未初始化，请检查 firebase.js 配置');
          return;
        }
        
        // 尝试读取一个文档来测试连接
        const testQuery = query(collection(db, "students"), limit(1));
        await getDocs(testQuery);
        setConnectionStatus('✅ 已连接 - 可以正常访问 students 集合');
        setError(null);
      } catch (err) {
        setConnectionStatus(`❌ 连接失败: ${err.message}`);
        setError(`连接错误: ${err.message}`);
        console.error('Firebase 连接测试失败:', err);
      }
    };
    
    checkConnection();
  }, []);

  // 获取所有学生列表
  const fetchAllStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!db) {
        throw new Error('Firebase 数据库未初始化');
      }

      const studentsRef = collection(db, "students");
      const querySnapshot = await getDocs(studentsRef);
      
      const studentsList = [];
      querySnapshot.forEach((doc) => {
        studentsList.push({
          id: doc.id,
          ...doc.data()
        });
      });

      setStudents(studentsList);
      console.log('📋 所有学生数据:', studentsList);
    } catch (err) {
      console.error('❌ 获取学生列表失败:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 获取特定学生的详细信息
  const fetchStudentDetails = async (studentId) => {
    setLoading(true);
    setError(null);
    try {
      if (!db) {
        throw new Error('Firebase 数据库未初始化');
      }

      const studentDoc = await getDoc(doc(db, "students", studentId));
      
      if (studentDoc.exists()) {
        const data = studentDoc.data();
        setStudentDetails({
          id: studentDoc.id,
          ...data,
          // 显示所有字段的详细信息
          allFields: Object.keys(data),
          fieldCount: Object.keys(data).length
        });
        setSelectedStudent(studentId);
        console.log(`📄 学生 ${studentId} 的详细信息:`, data);
      } else {
        setError(`学生 ${studentId} 不存在`);
        setStudentDetails(null);
      }
    } catch (err) {
      console.error('❌ 获取学生详情失败:', err);
      setError(err.message);
      setStudentDetails(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="firebase-test-panel">
      <div className="test-panel-header">
        <h2>🔥 Firebase 学生表测试工具</h2>
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
          onClick={fetchAllStudents} 
          disabled={loading || !db}
          className="test-btn primary"
        >
          {loading ? '加载中...' : '📋 获取所有学生'}
        </button>
        <button 
          onClick={() => fetchStudentDetails('STUDENT_001')} 
          disabled={loading || !db}
          className="test-btn"
        >
          {loading ? '加载中...' : '🔍 查看 STUDENT_001'}
        </button>
      </div>

      {/* 学生列表 */}
      {students.length > 0 && (
        <div className="students-list">
          <h3>学生列表 ({students.length} 个)</h3>
          <div className="students-grid">
            {students.map((student) => (
              <div 
                key={student.id} 
                className={`student-card ${selectedStudent === student.id ? 'selected' : ''}`}
                onClick={() => fetchStudentDetails(student.id)}
              >
                <div className="student-id">{student.id}</div>
                <div className="student-name">
                  {student.name || student.studentName || '未命名'}
                </div>
                <div className="student-fields-count">
                  {Object.keys(student).filter(k => k !== 'id').length} 个字段
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 学生详细信息 */}
      {studentDetails && (
        <div className="student-details">
          <h3>学生详细信息: {studentDetails.id}</h3>
          <div className="details-header">
            <div className="field-count-badge">
              共 {studentDetails.fieldCount} 个字段
            </div>
          </div>
          
          <div className="fields-list">
            {studentDetails.allFields.map((fieldName) => (
              <div key={fieldName} className="field-row">
                <div className="field-name">
                  <strong>{fieldName}:</strong>
                </div>
                <div className="field-value">
                  {typeof studentDetails[fieldName] === 'object' && studentDetails[fieldName] !== null
                    ? JSON.stringify(studentDetails[fieldName], null, 2)
                    : String(studentDetails[fieldName] || '(空值)')}
                </div>
                <div className="field-type">
                  {typeof studentDetails[fieldName]}
                </div>
              </div>
            ))}
          </div>

          {/* 原始 JSON 数据 */}
          <div className="raw-json">
            <h4>原始 JSON 数据:</h4>
            <pre>{JSON.stringify(studentDetails, null, 2)}</pre>
          </div>
        </div>
      )}

      {/* 使用说明 */}
      <div className="test-instructions">
        <h4>📖 使用说明:</h4>
        <ul>
          <li><strong>连接状态:</strong> 页面加载时会自动检查 Firebase 连接状态</li>
          <li><strong>获取所有学生:</strong> 点击按钮列出 students 集合中的所有学生记录</li>
          <li><strong>查看特定学生:</strong> 点击 "查看 STUDENT_001" 或点击学生卡片查看详细信息</li>
          <li><strong>字段信息:</strong> 每个学生的所有字段都会显示，包括字段名、值和类型</li>
          <li><strong>控制台输出:</strong> 所有数据操作都会在浏览器控制台输出（按 F12 查看）</li>
          <li><strong>注意事项:</strong> 确保 .env 文件中配置了 VITE_FIREBASE_API_KEY</li>
        </ul>
      </div>

      {/* 调试信息 */}
      <div className="debug-info">
        <h4>🔧 调试信息:</h4>
        <div className="debug-item">
          <strong>db 对象:</strong> {db ? '✅ 已初始化' : '❌ 未初始化'}
        </div>
        <div className="debug-item">
          <strong>Firebase 配置:</strong> {db ? '已加载' : '未加载'}
        </div>
        {db && (
          <div className="debug-item">
            <strong>集合路径:</strong> students
          </div>
        )}
      </div>
    </div>
  );
};

export default FirebaseTestPanel;


