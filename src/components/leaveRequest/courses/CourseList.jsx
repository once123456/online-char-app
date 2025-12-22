import React from 'react';
import './courses.css';

const CourseList = ({ enrollment, courseDetails }) => {
  // 获取课程状态配置
  const getStatusConfig = (course) => {
    if (course.completed) {
      return {
        text: '已完成',
        color: '#28a745',
        bgColor: '#d4edda',
        borderColor: '#c3e6cb'
      };
    }
    
    const today = new Date();
    const courseDate = new Date(course.dateStr || course.date);
    const isPast = courseDate < today;
    
    if (isPast) {
      return {
        text: '已过期',
        color: '#6c757d',
        bgColor: '#e9ecef',
        borderColor: '#dee2e6'
      };
    }
    
    // 计算距离课程还有几天
    const daysUntil = Math.ceil((courseDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntil <= 3) {
      return {
        text: '即将开始',
        color: '#dc3545',
        bgColor: '#f8d7da',
        borderColor: '#f5c6cb'
      };
    } else if (daysUntil <= 7) {
      return {
        text: '本周课程',
        color: '#ffc107',
        bgColor: '#fff3cd',
        borderColor: '#ffeaa7'
      };
    } else {
      return {
        text: '待上课',
        color: '#17a2b8',
        bgColor: '#d1ecf1',
        borderColor: '#bee5eb'
      };
    }
  };

  // 格式化日期显示
  const formatDate = (dateStr) => {
    if (!dateStr) return '日期未知';
    try {
      const date = new Date(dateStr);
      const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
      };
      return date.toLocaleDateString('zh-CN', options);
    } catch (error) {
      return dateStr;
    }
  };

  // 按日期排序
  const sortedEnrollment = [...(enrollment || [])].sort((a, b) => {
    const dateA = new Date(a.dateStr || a.date);
    const dateB = new Date(b.dateStr || b.date);
    return dateA - dateB;
  });

  // 获取课程详情信息
  const getCourseInfo = (courseId) => {
    if (!courseDetails || !courseId) return null;
    // 从courseId中提取课程代码（例如：SPEC_C001round001 -> SPEC_C001）
    const courseCode = courseId.split('round')[0];
    return courseDetails[courseCode] || courseDetails[courseId] || null;
  };

  return (
    <div className="course-list">
      <div className="course-list-header">
        <h3>课程列表</h3>
        <div className="list-stats">
          <span className="stat-item">
            总计: <strong>{sortedEnrollment.length}</strong> 节
          </span>
          <span className="stat-item">
            已完成: <strong style={{ color: '#28a745' }}>
              {sortedEnrollment.filter(c => c.completed).length}
            </strong>
          </span>
          <span className="stat-item">
            待上课: <strong style={{ color: '#ffc107' }}>
              {sortedEnrollment.filter(c => !c.completed).length}
            </strong>
          </span>
        </div>
      </div>
      
      <div className="course-list-items">
        {sortedEnrollment.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📚</span>
            <p>暂无课程信息</p>
          </div>
        ) : (
          sortedEnrollment.map((course, index) => {
            const statusConfig = getStatusConfig(course);
            const courseInfo = getCourseInfo(course.courseId);
            
            return (
              <div
                key={course.id || index}
                className="course-list-item"
                style={{
                  borderLeft: `4px solid ${statusConfig.borderColor}`,
                  backgroundColor: statusConfig.bgColor
                }}
              >
                <div className="course-item-main">
                  <div className="course-item-header">
                    <h4 className="course-name">{course.name || '未命名课程'}</h4>
                    <span
                      className="status-badge"
                      style={{
                        color: statusConfig.color,
                        backgroundColor: statusConfig.bgColor,
                        borderColor: statusConfig.borderColor
                      }}
                    >
                      {statusConfig.text}
                    </span>
                  </div>
                  
                  <div className="course-item-details">
                    <div className="detail-row">
                      <span className="detail-label">📅 日期:</span>
                      <span className="detail-value">{formatDate(course.dateStr || course.date)}</span>
                    </div>
                    
                    <div className="detail-row">
                      <span className="detail-label">🕐 时间:</span>
                      <span className="detail-value">{course.timeSlot || '时间未定'}</span>
                    </div>
                    
                    {course.courseId && (
                      <div className="detail-row">
                        <span className="detail-label">📚 课程ID:</span>
                        <span className="detail-value">{course.courseId}</span>
                      </div>
                    )}
                    
                    {courseInfo && (
                      <>
                        {courseInfo.courseName && (
                          <div className="detail-row">
                            <span className="detail-label">课程名称:</span>
                            <span className="detail-value">{courseInfo.courseName}</span>
                          </div>
                        )}
                        {courseInfo.location && (
                          <div className="detail-row">
                            <span className="detail-label">📍 地点:</span>
                            <span className="detail-value">{courseInfo.location}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
                
                {course.completed && (
                  <div className="completed-indicator">
                    ✓ 已完成
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CourseList;


