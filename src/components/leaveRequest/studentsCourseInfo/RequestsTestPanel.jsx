import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, addDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import './firebaseTestPanel.css';

const RequestsTestPanel = () => {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestDetails, setRequestDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('检查中...');
  const [studentId, setStudentId] = useState('STUDENT_001');

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
        const testQuery = query(collection(db, "requests"), limit(1));
        await getDocs(testQuery);
        setConnectionStatus('✅ 已连接 - 可以正常访问 requests 集合');
        setError(null);
      } catch (err) {
        setConnectionStatus(`❌ 连接失败: ${err.message}`);
        setError(`连接错误: ${err.message}`);
        console.error('Firebase 连接测试失败:', err);
      }
    };
    
    checkConnection();
  }, []);

  // 获取所有请假申请
  const fetchAllRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!db) {
        throw new Error('Firebase 数据库未初始化');
      }

      const requestsRef = collection(db, "requests");
      const querySnapshot = await getDocs(requestsRef);
      
      const requestsList = [];
      querySnapshot.forEach((doc) => {
        requestsList.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // 按提交时间排序
      requestsList.sort((a, b) => {
        const timeA = a.submitTime || '';
        const timeB = b.submitTime || '';
        return timeB.localeCompare(timeA);
      });

      setRequests(requestsList);
      console.log('📋 所有请假申请数据:', requestsList);
    } catch (err) {
      console.error('❌ 获取请假申请列表失败:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 根据学生ID获取请假申请
  const fetchRequestsByStudent = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!db) {
        throw new Error('Firebase 数据库未初始化');
      }

      if (!studentId || !studentId.trim()) {
        setError('请输入学生ID');
        setLoading(false);
        return;
      }

      const requestsRef = collection(db, "requests");
      const q = query(
        requestsRef, 
        where("studentId", "==", studentId),
        orderBy("submitTime", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      
      const requestsList = [];
      querySnapshot.forEach((doc) => {
        requestsList.push({
          id: doc.id,
          ...doc.data()
        });
      });

      setRequests(requestsList);
      console.log(`📋 学生 ${studentId} 的请假申请:`, requestsList);
    } catch (err) {
      console.error('❌ 获取学生请假申请失败:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 获取特定申请的详细信息
  const fetchRequestDetails = async (requestId) => {
    setLoading(true);
    setError(null);
    try {
      if (!db) {
        throw new Error('Firebase 数据库未初始化');
      }

      const requestDoc = await getDoc(doc(db, "requests", requestId));
      
      if (requestDoc.exists()) {
        const data = requestDoc.data();
        setRequestDetails({
          id: requestDoc.id,
          ...data,
          allFields: Object.keys(data),
          fieldCount: Object.keys(data).length
        });
        setSelectedRequest(requestId);
        console.log(`📄 请假申请 ${requestId} 的详细信息:`, data);
      } else {
        setError(`请假申请 ${requestId} 不存在`);
        setRequestDetails(null);
      }
    } catch (err) {
      console.error('❌ 获取请假申请详情失败:', err);
      setError(err.message);
      setRequestDetails(null);
    } finally {
      setLoading(false);
    }
  };

  // 创建单个测试数据
  const createTestRequest = async (requestType = 'pending') => {
    setLoading(true);
    setError(null);
    try {
      if (!db) {
        throw new Error('Firebase 数据库未初始化');
      }

      const now = new Date();
      const testRequests = {
        pending: {
          studentId: studentId || 'STUDENT_001',
          studentName: '测试学生',
          lesson: {
            id: 3,
            name: "圖片說故事 - Show and Tell",
            dateTime: "2025-12-20T12:00-14:00",
            timeSlot: "SAT 12:00 - 14:00"
          },
          courseCode: "SPEC_C001",
          courseName: "演讲课程",
          reason: "illness",
          description: "测试请假申请 - 孩子感冒发烧，需要在家休息",
          makeupOption: "specific_time",
          selectedTimeSlot: {
            id: 'slot_1',
            date: '2025-12-21',
            dateDisplay: '2025年12月21日',
            day: '周六',
            time: '12:00 - 14:00'
          },
          submitTime: now.toLocaleString('zh-CN'),
          status: 'pending',
          reviewTime: null,
          reviewNote: null
        },
        approved: {
          studentId: studentId || 'STUDENT_001',
          studentName: '测试学生',
          lesson: {
            id: 5,
            name: "故事結構大挑戰 - 圖卡排序",
            dateTime: "2026-01-03T12:00-14:00",
            timeSlot: "SAT 12:00 - 14:00"
          },
          courseCode: "SPEC_C001",
          courseName: "演讲课程",
          reason: "travel",
          description: "测试请假申请 - 全家出游",
          makeupOption: "next_quarter",
          selectedTimeSlot: null,
          submitTime: new Date(now.getTime() - 24 * 60 * 60 * 1000).toLocaleString('zh-CN'),
          status: 'approved',
          reviewTime: new Date(now.getTime() - 23 * 60 * 60 * 1000).toLocaleString('zh-CN'),
          reviewNote: "已安排补课时间，请准时参加"
        },
        rejected: {
          studentId: studentId || 'STUDENT_001',
          studentName: '测试学生',
          lesson: {
            id: 7,
            name: "形容詞魔法 - 豐富故事描述",
            dateTime: "2026-01-17T12:00-14:00",
            timeSlot: "SAT 12:00 - 14:00"
          },
          courseCode: "SPEC_C001",
          courseName: "演讲课程",
          reason: "other",
          description: "测试请假申请 - 其他原因",
          makeupOption: "skip",
          selectedTimeSlot: null,
          submitTime: new Date(now.getTime() - 48 * 60 * 60 * 1000).toLocaleString('zh-CN'),
          status: 'rejected',
          reviewTime: new Date(now.getTime() - 47 * 60 * 60 * 1000).toLocaleString('zh-CN'),
          reviewNote: "申请理由不充分，请重新提交"
        }
      };

      const testRequest = testRequests[requestType] || testRequests.pending;
      const docRef = await addDoc(collection(db, "requests"), testRequest);
      console.log(`✅ 测试请假申请已创建 (${requestType})，ID:`, docRef.id);
      alert(`测试请假申请已创建！\n类型: ${requestType === 'pending' ? '待审核' : requestType === 'approved' ? '已通过' : '已拒绝'}\n文档ID: ${docRef.id}\n请点击"获取所有请假申请"查看`);
      
      // 自动刷新列表
      await fetchAllRequests();
    } catch (err) {
      console.error('❌ 创建测试请假申请失败:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 批量创建测试数据
  const createMultipleTestRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!db) {
        throw new Error('Firebase 数据库未初始化');
      }

      const now = new Date();
      const testRequests = [
        {
          studentId: studentId || 'STUDENT_001',
          studentName: '测试学生',
          lesson: {
            id: 3,
            name: "圖片說故事 - Show and Tell",
            dateTime: "2025-12-20T12:00-14:00",
            timeSlot: "SAT 12:00 - 14:00"
          },
          courseCode: "SPEC_C001",
          courseName: "演讲课程",
          reason: "illness",
          description: "测试请假申请 - 孩子感冒发烧，需要在家休息",
          makeupOption: "specific_time",
          selectedTimeSlot: {
            id: 'slot_1',
            date: '2025-12-21',
            dateDisplay: '2025年12月21日',
            day: '周六',
            time: '12:00 - 14:00'
          },
          submitTime: now.toLocaleString('zh-CN'),
          status: 'pending',
          reviewTime: null,
          reviewNote: null
        },
        {
          studentId: studentId || 'STUDENT_001',
          studentName: '测试学生',
          lesson: {
            id: 5,
            name: "故事結構大挑戰 - 圖卡排序",
            dateTime: "2026-01-03T12:00-14:00",
            timeSlot: "SAT 12:00 - 14:00"
          },
          courseCode: "SPEC_C001",
          courseName: "演讲课程",
          reason: "travel",
          description: "测试请假申请 - 全家出游",
          makeupOption: "next_quarter",
          selectedTimeSlot: null,
          submitTime: new Date(now.getTime() - 24 * 60 * 60 * 1000).toLocaleString('zh-CN'),
          status: 'approved',
          reviewTime: new Date(now.getTime() - 23 * 60 * 60 * 1000).toLocaleString('zh-CN'),
          reviewNote: "已安排补课时间，请准时参加"
        },
        {
          studentId: studentId || 'STUDENT_001',
          studentName: '测试学生',
          lesson: {
            id: 7,
            name: "形容詞魔法 - 豐富故事描述",
            dateTime: "2026-01-17T12:00-14:00",
            timeSlot: "SAT 12:00 - 14:00"
          },
          courseCode: "SPEC_C001",
          courseName: "演讲课程",
          reason: "other",
          description: "测试请假申请 - 其他原因",
          makeupOption: "skip",
          selectedTimeSlot: null,
          submitTime: new Date(now.getTime() - 48 * 60 * 60 * 1000).toLocaleString('zh-CN'),
          status: 'rejected',
          reviewTime: new Date(now.getTime() - 47 * 60 * 60 * 1000).toLocaleString('zh-CN'),
          reviewNote: "申请理由不充分，请重新提交"
        }
      ];

      const createdIds = [];
      for (const testRequest of testRequests) {
        const docRef = await addDoc(collection(db, "requests"), testRequest);
        createdIds.push(docRef.id);
        console.log(`✅ 测试请假申请已创建 (${testRequest.status})，ID:`, docRef.id);
        await new Promise(resolve => setTimeout(resolve, 300)); // 延迟300ms
      }
      
      alert(`✅ 已创建3个测试请假申请！\n- 待审核: ${createdIds[0]}\n- 已通过: ${createdIds[1]}\n- 已拒绝: ${createdIds[2]}\n\n请点击"获取所有请假申请"查看`);
      
      // 自动刷新列表
      await fetchAllRequests();
    } catch (err) {
      console.error('❌ 批量创建测试请假申请失败:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="firebase-test-panel">
      <div className="test-panel-header">
        <h2>🔥 Firebase 请假申请表测试工具</h2>
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
          onClick={fetchAllRequests} 
          disabled={loading || !db}
          className="test-btn primary"
        >
          {loading ? '加载中...' : '📋 获取所有请假申请'}
        </button>
        <button 
          onClick={fetchRequestsByStudent} 
          disabled={loading || !db}
          className="test-btn"
        >
          {loading ? '加载中...' : '🔍 按学生ID查询'}
        </button>
        <button 
          onClick={() => createTestRequest('pending')} 
          disabled={loading || !db}
          className="test-btn"
          style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' }}
        >
          {loading ? '创建中...' : '➕ 创建待审核申请'}
        </button>
        <button 
          onClick={() => createTestRequest('approved')} 
          disabled={loading || !db}
          className="test-btn"
          style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}
        >
          {loading ? '创建中...' : '✅ 创建已通过申请'}
        </button>
        <button 
          onClick={() => createTestRequest('rejected')} 
          disabled={loading || !db}
          className="test-btn"
          style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}
        >
          {loading ? '创建中...' : '❌ 创建已拒绝申请'}
        </button>
        <button 
          onClick={createMultipleTestRequests} 
          disabled={loading || !db}
          className="test-btn"
          style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
        >
          {loading ? '创建中...' : '🎯 批量创建测试数据'}
        </button>
      </div>

      {/* 学生ID输入 */}
      <div style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '10px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
          学生ID (用于查询和创建测试数据):
        </label>
        <input
          type="text"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          placeholder="输入学生ID，如: STUDENT_001"
          style={{
            width: '100%',
            maxWidth: '300px',
            padding: '10px',
            border: '2px solid rgba(102, 126, 234, 0.2)',
            borderRadius: '8px',
            fontSize: '14px'
          }}
        />
      </div>

      {/* 请假申请列表 */}
      {requests.length > 0 && (
        <div className="students-list">
          <h3>请假申请列表 ({requests.length} 个)</h3>
          <div className="students-grid">
            {requests.map((request) => {
              const statusColors = {
                pending: '#fbbf24',
                approved: '#22c55e',
                rejected: '#ef4444'
              };
              const statusTexts = {
                pending: '待审核',
                approved: '已通过',
                rejected: '已拒绝'
              };
              
              return (
                <div 
                  key={request.id} 
                  className={`student-card ${selectedRequest === request.id ? 'selected' : ''}`}
                  onClick={() => fetchRequestDetails(request.id)}
                  style={{
                    borderLeft: `4px solid ${statusColors[request.status] || '#999'}`
                  }}
                >
                  <div className="student-id">ID: {request.id}</div>
                  <div className="student-name">
                    {request.studentName || '未知学生'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                    <div>课程: {request.lesson?.name || '未知课程'}</div>
                    <div>状态: <strong style={{ color: statusColors[request.status] }}>{statusTexts[request.status] || request.status}</strong></div>
                    <div>提交时间: {request.submitTime || '未知'}</div>
                  </div>
                  <div className="student-fields-count">
                    {Object.keys(request).filter(k => k !== 'id').length} 个字段
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 请假申请详细信息 */}
      {requestDetails && (
        <div className="student-details">
          <h3>请假申请详细信息: {requestDetails.id}</h3>
          <div className="details-header">
            <div className="field-count-badge">
              共 {requestDetails.fieldCount} 个字段
            </div>
            <div style={{ marginTop: '10px', padding: '10px', background: '#f8f9fa', borderRadius: '8px' }}>
              <strong>状态:</strong> <span style={{ 
                color: requestDetails.status === 'approved' ? '#22c55e' : 
                       requestDetails.status === 'rejected' ? '#ef4444' : '#fbbf24',
                fontWeight: '600'
              }}>
                {requestDetails.status === 'approved' ? '已通过' : 
                 requestDetails.status === 'rejected' ? '已拒绝' : '待审核'}
              </span>
            </div>
          </div>
          
          <div className="fields-list">
            {requestDetails.allFields.map((fieldName) => (
              <div key={fieldName} className="field-row">
                <div className="field-name">
                  <strong>{fieldName}:</strong>
                </div>
                <div className="field-value">
                  {typeof requestDetails[fieldName] === 'object' && requestDetails[fieldName] !== null
                    ? JSON.stringify(requestDetails[fieldName], null, 2)
                    : String(requestDetails[fieldName] || '(空值)')}
                </div>
                <div className="field-type">
                  {typeof requestDetails[fieldName]}
                </div>
              </div>
            ))}
          </div>

          {/* 原始 JSON 数据 */}
          <div className="raw-json">
            <h4>原始 JSON 数据:</h4>
            <pre>{JSON.stringify(requestDetails, null, 2)}</pre>
          </div>
        </div>
      )}

      {/* 使用说明 */}
      <div className="test-instructions">
        <h4>📖 使用说明:</h4>
        <ul>
          <li><strong>连接状态:</strong> 页面加载时会自动检查 Firebase 连接状态</li>
          <li><strong>获取所有申请:</strong> 点击按钮列出 requests 集合中的所有请假申请</li>
          <li><strong>按学生ID查询:</strong> 输入学生ID后点击按钮查询该学生的所有请假申请</li>
          <li><strong>创建测试数据:</strong> 点击按钮创建一个测试请假申请到 Firebase</li>
          <li><strong>查看详情:</strong> 点击请假申请卡片查看详细信息</li>
          <li><strong>控制台输出:</strong> 所有数据操作都会在浏览器控制台输出（按 F12 查看）</li>
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
            <strong>集合路径:</strong> requests
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestsTestPanel;
