import React, { useState } from 'react';
import './studentsCourseInfo.css';
import FirebaseTestPanel from './FirebaseTestPanel';
import RequestsTestPanel from './RequestsTestPanel';
import AccountsTestPanel from '../../auth/AccountsTestPanel';

// 格式化日期工具函数
const formatDate = (dateTimeStr) => {
  try {
    if (!dateTimeStr) return '日期未知';
    const dateStr = dateTimeStr.split('T')[0];
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '日期格式错误';
    return date.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    });
  } catch (error) {
    console.error('日期格式化错误:', error);
    return '日期未知';
  }
};

// 获取补课选项文本
const getMakeupOptionText = (option, timeSlot) => {
  if (option === 'specific_time' && timeSlot) {
    return `补课时间: ${timeSlot.dateDisplay} ${timeSlot.day} ${timeSlot.time}`;
  } else if (option === 'next_quarter') {
    return '补课安排: 延期至下一季度';
  } else if (option === 'skip') {
    return '补课安排: 跳过本节课';
  }
  return '未选择';
};

const StudentsCourseInfo = ({
  courseData,
  upcomingLessons,
  submittedRequests,
  onLessonSelect
}) => {
  // 获取已批准的请假申请
  const getApprovedLeaveRequest = (lessonId) => {
    if (!submittedRequests || submittedRequests.length === 0) return null;
    return submittedRequests.find(
      req => req?.lesson?.id === lessonId && req?.status === 'approved'
    );
  };

  const [showTestPanel, setShowTestPanel] = useState(false);
  const [showRequestsPanel, setShowRequestsPanel] = useState(false);
  const [showAccountsPanel, setShowAccountsPanel] = useState(false);

  return (
    <div className="studentsCourseInfo">
      {/* Firebase 测试面板切换按钮 */}
      <div style={{ marginBottom: '20px', textAlign: 'center', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setShowTestPanel(!showTestPanel)}
          className="toggle-test-panel-btn"
          style={{
            padding: '12px 24px',
            background: showTestPanel 
              ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' 
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '600',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
            transition: 'all 0.3s ease'
          }}
        >
          {showTestPanel ? '❌ 隐藏学生表测试' : '🔥 显示学生表测试'}
        </button>
        <button 
          onClick={() => setShowRequestsPanel(!showRequestsPanel)}
          className="toggle-test-panel-btn"
          style={{
            padding: '12px 24px',
            background: showRequestsPanel 
              ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' 
              : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '600',
            boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
            transition: 'all 0.3s ease'
          }}
        >
          {showRequestsPanel ? '❌ 隐藏请假申请测试' : '📝 显示请假申请测试'}
        </button>
        <button 
          onClick={() => setShowAccountsPanel(!showAccountsPanel)}
          className="toggle-test-panel-btn"
          style={{
            padding: '12px 24px',
            background: showAccountsPanel 
              ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' 
              : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '600',
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
            transition: 'all 0.3s ease'
          }}
        >
          {showAccountsPanel ? '❌ 隐藏账号测试' : '👤 显示账号测试'}
        </button>
      </div>

      {/* Firebase 测试面板 */}
      {showTestPanel && <FirebaseTestPanel />}
      {showRequestsPanel && <RequestsTestPanel />}
      {showAccountsPanel && <AccountsTestPanel />}

      {/* 即将开始的课程 */}
      <div className="section upcoming-lessons">
        <h2>即将开始的课程</h2>
        <p className="section-desc">只能为未来7天内的课程申请请假</p>
        
        {upcomingLessons.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📅</span>
            <p>暂无即将开始的课程</p>
            <small>未来7天内没有安排课程</small>
          </div>
        ) : (
          <div className="lessons-list">
            {upcomingLessons.map((lesson, index) => {
              const approvedRequest = getApprovedLeaveRequest(lesson.id);
              return (
                <div 
                  key={lesson.id || index} 
                  className={`lesson-card ${approvedRequest ? 'has-approved-leave' : ''}`}
                  onClick={() => !approvedRequest && onLessonSelect(lesson)}
                >
                  <div className="lesson-number">第 {lesson.id} 节</div>
                  <div className="lesson-main">
                    <div className="lesson-title-row">
                      <h3>{lesson.name}</h3>
                      {approvedRequest && (
                        <div className="leave-approved-badge">
                          ✓ 已请假
                        </div>
                      )}
                    </div>
                    
                    {/* 已批准请假的提示 */}
                    {approvedRequest && approvedRequest.makeupOption === 'specific_time' && (
                      <div className="time-change-alert">
                        <span className="alert-icon">⚠️</span>
                        <div className="alert-content">
                          <strong>课程时间已变更</strong>
                          <p>原时间: {formatDate(lesson.dateTime)} {lesson.timeSlot}</p>
                          <p className="new-time">
                            新时间: {approvedRequest.selectedTimeSlot.dateDisplay} {approvedRequest.selectedTimeSlot.day} {approvedRequest.selectedTimeSlot.time}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {approvedRequest && approvedRequest.makeupOption === 'next_quarter' && (
                      <div className="time-change-alert">
                        <span className="alert-icon">📆</span>
                        <div className="alert-content">
                          <strong>课程已延期</strong>
                          <p>本节课将延期至下一季度补上</p>
                        </div>
                      </div>
                    )}
                    
                    {approvedRequest && approvedRequest.makeupOption === 'skip' && (
                      <div className="time-change-alert skip">
                        <span className="alert-icon">⏭️</span>
                        <div className="alert-content">
                          <strong>已跳过本节课</strong>
                          <p>本节课不进行补课</p>
                        </div>
                      </div>
                    )}
                    
                    {/* 未请假的课程详情 */}
                    {!approvedRequest && (
                      <div className="lesson-details">
                        <div className="detail-item">
                          <span className="icon">📅</span>
                          <span>{formatDate(lesson.dateTime)}</span>
                        </div>
                        <div className="detail-item">
                          <span className="icon">🕐</span>
                          <span>{lesson.timeSlot}</span>
                        </div>
                        <div className="detail-item">
                          <span className="icon">📚</span>
                          <span>{courseData.courseName}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {!approvedRequest && (
                    <button className="select-btn">申请请假 →</button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 课程总览 */}
      <div className="section course-overview-section">
        <h2>课程总览</h2>
        <div className="course-overview">
          <div className="overview-card">
            <div className="overview-icon">📖</div>
            <div className="overview-info">
              <h4>{courseData.courseName}</h4>
              <p>课程代码: {courseData.courseCode}</p>
            </div>
          </div>
          <div className="progress-info">
            <div className="progress-item">
              <span className="label">已完成</span>
              <span className="value">{(courseData.lessons || []).filter(l => l && l.completed).length} 节</span>
            </div>
            <div className="progress-item">
              <span className="label">待上课</span>
              <span className="value">{(courseData.lessons || []).filter(l => l && !l.completed).length} 节</span>
            </div>
            <div className="progress-item">
              <span className="label">总课时</span>
              <span className="value">{(courseData.lessons || []).length} 节</span>
            </div>
          </div>
        </div>
      </div>

      {/* 请假记录 */}
      {submittedRequests.length > 0 && (
        <div className="section requests-history">
          <h2>我的请假记录</h2>
          <div className="requests-list">
            {submittedRequests.map((request, index) => {
              const statusConfig = {
                pending: { text: '待审核', icon: '⏳', color: '#ffc107' },
                approved: { text: '已通过', icon: '✓', color: '#28a745' },
                rejected: { text: '已拒绝', icon: '✕', color: '#dc3545' }
              };
              const config = statusConfig[request.status] || statusConfig.pending;
              
              const lesson = request.lesson || {};
              const lessonId = lesson.id || '?';
              const lessonName = lesson.name || '未知课程';
              const lessonDateTime = lesson.dateTime || new Date().toISOString();
              
              return (
                <div key={request.id || index} className={`request-item status-${request.status || 'pending'}`}>
                  <div className="request-header">
                    <div>
                      <h4>第 {lessonId} 节 - {lessonName}</h4>
                      <p className="request-date">{formatDate(lessonDateTime)}</p>
                    </div>
                    <span className={`status-tag ${request.status}`} style={{ backgroundColor: config.color }}>
                      <span className="status-icon">{config.icon}</span>
                      {config.text}
                    </span>
                  </div>
                  <div className="request-details">
                    <p><strong>请假原因:</strong> {request.reason}</p>
                    <p><strong>{getMakeupOptionText(request.makeupOption, request.selectedTimeSlot)}</strong></p>
                    <p><strong>提交时间:</strong> {request.submitTime}</p>
                    
                    {request.status === 'approved' && (
                      <div className="review-info approved">
                        <span className="review-label">✓ 审核通过</span>
                        <span className="review-time">审核时间: {request.reviewTime}</span>
                        {request.reviewNote && (
                          <p className="review-note">{request.reviewNote}</p>
                        )}
                      </div>
                    )}
                    
                    {request.status === 'rejected' && (
                      <div className="review-info rejected">
                        <span className="review-label">✕ 审核未通过</span>
                        <span className="review-time">审核时间: {request.reviewTime}</span>
                        {request.reviewNote && (
                          <p className="review-note">原因: {request.reviewNote}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsCourseInfo;