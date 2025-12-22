import React, { useState, useEffect } from 'react';
import './studentsCourseInfo.css';
import FirebaseTestPanel from './FirebaseTestPanel';
import RequestsTestPanel from './RequestsTestPanel';
import AccountsTestPanel from '../../auth/AccountsTestPanel';
import CoursesView from '../courses';

// 格式化日期工具函数（支持多种日期格式）
const formatDate = (dateInput) => {
  try {
    if (!dateInput) return '日期未知';
    
    let dateStr;
    // 处理不同的日期格式
    if (typeof dateInput === 'string') {
      // 如果是ISO格式（包含T），提取日期部分
      if (dateInput.includes('T')) {
        dateStr = dateInput.split('T')[0];
      } else {
        // 如果已经是日期字符串格式（如"2025-12-13"）
        dateStr = dateInput;
      }
    } else {
      return '日期未知';
    }
    
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      console.warn('日期格式错误:', dateInput);
      return '日期格式错误';
    }
    return date.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    });
  } catch (error) {
    console.error('日期格式化错误:', error, dateInput);
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
  onLessonSelect,
  enrollment = []
}) => {
  // 调试信息
  useEffect(() => {
    console.log("StudentsCourseInfo - 接收到的enrollment:", enrollment);
    console.log("StudentsCourseInfo - enrollment类型:", typeof enrollment);
    console.log("StudentsCourseInfo - enrollment是否为数组:", Array.isArray(enrollment));
    console.log("StudentsCourseInfo - enrollment长度:", enrollment?.length);
    if (enrollment && Array.isArray(enrollment) && enrollment.length > 0) {
      console.log("StudentsCourseInfo - enrollment第一条数据:", enrollment[0]);
    }
  }, [enrollment]);

  // 获取已批准的请假申请
  const getApprovedLeaveRequest = (lessonId) => {
    if (!submittedRequests || submittedRequests.length === 0) return null;
    return submittedRequests.find(
      req => req?.lesson?.id === lessonId && req?.status === 'approved'
    );
  };

  // 检查课程是否已有任何申请记录（包括pending、approved、rejected、completed）
  const hasAnyRequest = (lessonId) => {
    if (!submittedRequests || submittedRequests.length === 0) return false;
    return submittedRequests.some(
      req => req?.lesson?.id === lessonId
    );
  };

  // 检查课程是否在一周内
  const isWithinWeek = (lesson) => {
    try {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const lessonDate = new Date(lesson.dateStr || lesson.date || lesson.dateTime?.split('T')[0]);
      lessonDate.setHours(0, 0, 0, 0);
      
      return lessonDate >= now && lessonDate <= sevenDaysLater;
    } catch (e) {
      return false;
    }
  };

  // 弹窗状态
  const [showUpcomingLessonsModal, setShowUpcomingLessonsModal] = useState(false);

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2>即将开始的课程</h2>
            <p className="section-desc">
              所有未完成的课程都可以申请调整
              {upcomingLessons.length > 0 && (
                <span style={{ marginLeft: '8px', color: '#667eea', fontWeight: '600' }}>
                  ({upcomingLessons.length} 节)
                </span>
              )}
            </p>
          </div>
          {upcomingLessons.length > 0 && (
            <button
              onClick={() => setShowUpcomingLessonsModal(true)}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                transition: 'all 0.3s ease',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
              }}
            >
              📋 查看所有课程
            </button>
          )}
        </div>
        
        {upcomingLessons.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📅</span>
            <p>暂无即将开始的课程</p>
            <small>没有未完成的课程</small>
          </div>
        ) : (
          <div className="lessons-list">
            {/* 只显示最近的一节作为预览 */}
            {upcomingLessons.slice(0, 1).map((lesson, index) => {
              const approvedRequest = getApprovedLeaveRequest(lesson.id);
              const hasRequest = hasAnyRequest(lesson.id);
              const withinWeek = isWithinWeek(lesson);
              
              return (
                <div 
                  key={lesson.id || index} 
                  className={`lesson-card ${approvedRequest ? 'has-approved-leave' : ''}`}
                  onClick={() => !hasRequest && setShowUpcomingLessonsModal(true)}
                  style={{ cursor: hasRequest ? 'not-allowed' : 'pointer' }}
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
                      {hasRequest && !approvedRequest && (
                        <div className="leave-approved-badge" style={{ background: '#ffc107' }}>
                          ⏳ 申请中
                        </div>
                      )}
                    </div>
                    
                    {/* 已批准请假的提示 */}
                    {approvedRequest && approvedRequest.makeupOption === 'specific_time' && (
                      <div className="time-change-alert">
                        <span className="alert-icon">⚠️</span>
                        <div className="alert-content">
                          <strong>课程时间已变更</strong>
                          <p>原时间: {formatDate(lesson.dateTime || lesson.dateStr)} {lesson.timeSlot}</p>
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
                          <span>{formatDate(lesson.dateTime || lesson.dateStr)}</span>
                        </div>
                        <div className="detail-item">
                          <span className="icon">🕐</span>
                          <span>{lesson.timeSlot}</span>
                        </div>
                        <div className="detail-item">
                          <span className="icon">📚</span>
                          <span>{courseData.courseName}</span>
                        </div>
                        {withinWeek && (
                          <div className="detail-item" style={{ color: '#ff9800', fontWeight: '600' }}>
                            <span className="icon">⚠️</span>
                            <span>一周内课程，只能选择换课</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {!hasRequest && (
                    <button className="select-btn">申请调整 →</button>
                  )}
                  {hasRequest && !approvedRequest && (
                    <button className="select-btn" style={{ background: '#ffc107', cursor: 'not-allowed' }} disabled>
                      申请中...
                    </button>
                  )}
                </div>
              );
            })}
            {upcomingLessons.length > 1 && (
              <div style={{ textAlign: 'center', marginTop: '16px', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                <p style={{ margin: 0, color: '#666' }}>
                  还有 {upcomingLessons.length - 1} 节课程，点击上方按钮查看全部
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 所有课程弹窗 */}
      {showUpcomingLessonsModal && (
        <div 
          className="modal-overlay"
          onClick={() => setShowUpcomingLessonsModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div 
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto',
              position: 'relative',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
            }}
          >
            <button
              onClick={() => setShowUpcomingLessonsModal(false)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#666',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#f0f0f0';
                e.target.style.color = '#333';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'none';
                e.target.style.color = '#666';
              }}
            >
              ×
            </button>
            <h2 style={{ marginTop: 0, marginBottom: '8px' }}>所有未完成的课程</h2>
            <p style={{ marginBottom: '20px', color: '#666', fontSize: '14px' }}>
              所有未完成的课程都可以申请调整。一周内的课程只能选择换课。
            </p>
            
            <div className="lessons-list" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {upcomingLessons.map((lesson, index) => {
                const approvedRequest = getApprovedLeaveRequest(lesson.id);
                const hasRequest = hasAnyRequest(lesson.id);
                const withinWeek = isWithinWeek(lesson);
                
                return (
                  <div 
                    key={lesson.id || index} 
                    className={`lesson-card ${approvedRequest ? 'has-approved-leave' : ''} ${hasRequest && !approvedRequest ? 'has-pending-request' : ''}`}
                    onClick={() => {
                      if (!hasRequest) {
                        setShowUpcomingLessonsModal(false);
                        onLessonSelect(lesson);
                      }
                    }}
                    style={{
                      cursor: hasRequest ? 'not-allowed' : 'pointer',
                      opacity: hasRequest && !approvedRequest ? 0.7 : 1
                    }}
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
                        {hasRequest && !approvedRequest && (
                          <div className="leave-approved-badge" style={{ background: '#ffc107' }}>
                            ⏳ 申请中
                          </div>
                        )}
                        {withinWeek && !hasRequest && (
                          <div style={{
                            padding: '4px 8px',
                            background: '#fff3cd',
                            color: '#856404',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            ⚠️ 一周内
                          </div>
                        )}
                      </div>
                      
                      {/* 已批准请假的提示 */}
                      {approvedRequest && approvedRequest.makeupOption === 'specific_time' && (
                        <div className="time-change-alert">
                          <span className="alert-icon">⚠️</span>
                          <div className="alert-content">
                            <strong>课程时间已变更</strong>
                            <p>原时间: {formatDate(lesson.dateTime || lesson.dateStr)} {lesson.timeSlot}</p>
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
                            <span>{formatDate(lesson.dateTime || lesson.dateStr)}</span>
                          </div>
                          <div className="detail-item">
                            <span className="icon">🕐</span>
                            <span>{lesson.timeSlot}</span>
                          </div>
                          <div className="detail-item">
                            <span className="icon">📚</span>
                            <span>{courseData.courseName}</span>
                          </div>
                          {withinWeek && (
                            <div className="detail-item" style={{ color: '#ff9800', fontWeight: '600' }}>
                              <span className="icon">⚠️</span>
                              <span>一周内课程，只能选择换课</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {!hasRequest && (
                      <button className="select-btn">申请调整 →</button>
                    )}
                    {hasRequest && !approvedRequest && (
                      <button className="select-btn" style={{ background: '#ffc107', cursor: 'not-allowed' }} disabled>
                        申请中...
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

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

      {/* 我的课程 - 日历和列表视图 */}
      <div className="section courses-section">
        {enrollment && Array.isArray(enrollment) && enrollment.length > 0 ? (
          <CoursesView enrollment={enrollment} />
        ) : (
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            <p>暂无课程数据</p>
            <p style={{ fontSize: '14px', marginTop: '8px' }}>
              {enrollment 
                ? `enrollment${Array.isArray(enrollment) ? '数组' : '不是数组'}为空 (长度: ${enrollment?.length || 0})` 
                : 'enrollment数据未加载'}
            </p>
            <p style={{ fontSize: '12px', marginTop: '8px', color: '#999' }}>
              请确保数据库中students集合的文档ID为"1"的文档包含enrollment字段
            </p>
            <div style={{ marginTop: '10px', padding: '10px', background: '#f5f5f5', borderRadius: '4px', fontSize: '12px', textAlign: 'left' }}>
              <strong>调试信息:</strong><br/>
              enrollment类型: {typeof enrollment}<br/>
              是否为数组: {Array.isArray(enrollment) ? '是' : '否'}<br/>
              值: {JSON.stringify(enrollment?.slice(0, 2) || enrollment)}
            </div>
          </div>
        )}
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
                rejected: { text: '已拒绝', icon: '✕', color: '#dc3545' },
                completed: { text: '已完成', icon: '✅', color: '#17a2b8' }
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
                    
                    {request.status === 'completed' && (
                      <div className="review-info completed">
                        <span className="review-label">✅ 已完成</span>
                        <span className="review-time">完成时间: {request.reviewTime || request.completedTime || request.submitTime}</span>
                        {request.reviewNote && (
                          <p className="review-note">{request.reviewNote}</p>
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