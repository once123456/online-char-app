import React from 'react';
import './pullRequest.css';

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

// 检查课程是否在一周内
const isWithinWeek = (lesson) => {
  if (!lesson) return false;
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

const PullRequest = ({
  selectedLesson,
  makeupTimeSlots,
  formData,
  onInputChange,
  onMakeupOptionChange,
  onTimeSlotSelect,
  onSubmit,
  onCancel,
  loadingMakeupSlots = false
}) => {
  const withinWeek = isWithinWeek(selectedLesson);
  return (
    <div className="pullRequest">
      <div className="form-header">
        <button className="back-btn" onClick={onCancel}>
          ← 返回
        </button>
        <h2>填写请假/换课申请</h2>
      </div>
      
      {/* 选中的课程信息 */}
      {selectedLesson && (
        <div className="selected-course-info">
          <div className="lesson-badge">第 {selectedLesson.id || '?'} 节课</div>
          <h3>{selectedLesson.name || '未知课程'}</h3>
          <div className="course-summary">
            <div className="summary-item">
              <span className="icon">📅</span>
              <span>{formatDate(selectedLesson.dateTime || selectedLesson.dateStr || selectedLesson.date)}</span>
            </div>
            <div className="summary-item">
              <span className="icon">🕐</span>
              <span>{selectedLesson.timeSlot || '时间未知'}</span>
            </div>
          </div>
        </div>
      )}

      {/* 申请表单 */}
      <form onSubmit={onSubmit} className="leave-form">
        {/* 请假原因 */}
        <div className="form-group">
          <label>
            请假原因 <span className="required">*</span>
          </label>
          <select 
            name="reason"
            value={formData.reason}
            onChange={onInputChange}
            required
          >
            <option value="">请选择请假原因</option>
            <option value="illness">身体不适</option>
            <option value="family">家庭事务</option>
            <option value="travel">外出旅行</option>
            <option value="exam">学校考试</option>
            <option value="other">其他原因</option>
          </select>
        </div>

        {/* 详细说明 */}
        <div className="form-group">
          <label>详细说明</label>
          <textarea 
            name="description"
            value={formData.description}
            onChange={onInputChange}
            placeholder="请详细描述请假原因（选填）"
            rows="3"
          />
        </div>

        {/* 补课/换课选项 */}
        <div className="form-section-divider">
          <h3>补课/换课安排 <span className="required">*</span></h3>
          <p className="section-hint">请选择您希望的补课方式</p>
        </div>

        {/* 一周内课程提示 */}
        {withinWeek && (
          <div style={{
            padding: '12px 16px',
            background: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '8px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '20px' }}>⚠️</span>
            <div>
              <strong style={{ color: '#856404' }}>一周内课程限制</strong>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#856404' }}>
                一周内的课程只能选择换课，不能延期或跳过
              </p>
            </div>
          </div>
        )}

        <div className="makeup-options">
          <div 
            className={`makeup-option-card ${formData.makeupOption === 'specific_time' ? 'selected' : ''}`}
            onClick={() => onMakeupOptionChange('specific_time')}
          >
            <div className="option-icon">🔄</div>
            <div className="option-content">
              <h4>选择其他时间补课</h4>
              <p>从下方可用时间段中选择补课时间</p>
            </div>
            <div className="option-radio">
              {formData.makeupOption === 'specific_time' && <span>✓</span>}
            </div>
          </div>

          <div 
            className={`makeup-option-card ${formData.makeupOption === 'next_quarter' ? 'selected' : ''} ${withinWeek ? 'disabled' : ''}`}
            onClick={() => !withinWeek && onMakeupOptionChange('next_quarter')}
            style={{
              opacity: withinWeek ? 0.5 : 1,
              cursor: withinWeek ? 'not-allowed' : 'pointer',
              position: 'relative'
            }}
          >
            {withinWeek && (
              <div style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: '#ff9800',
                color: 'white',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: '600'
              }}>
                不可用
              </div>
            )}
            <div className="option-icon">📆</div>
            <div className="option-content">
              <h4>延期至下一季度</h4>
              <p>将本节课安排到下一个学期补上</p>
              {withinWeek && (
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#ff9800', fontWeight: '600' }}>
                  ⚠️ 一周内课程不可选择此选项
                </p>
              )}
            </div>
            <div className="option-radio">
              {formData.makeupOption === 'next_quarter' && <span>✓</span>}
            </div>
          </div>

          <div 
            className={`makeup-option-card ${formData.makeupOption === 'skip' ? 'selected' : ''} ${withinWeek ? 'disabled' : ''}`}
            onClick={() => !withinWeek && onMakeupOptionChange('skip')}
            style={{
              opacity: withinWeek ? 0.5 : 1,
              cursor: withinWeek ? 'not-allowed' : 'pointer',
              position: 'relative'
            }}
          >
            {withinWeek && (
              <div style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: '#ff9800',
                color: 'white',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: '600'
              }}>
                不可用
              </div>
            )}
            <div className="option-icon">⏭️</div>
            <div className="option-content">
              <h4>跳过本节课</h4>
              <p>不进行补课，直接继续后续课程</p>
              {withinWeek && (
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#ff9800', fontWeight: '600' }}>
                  ⚠️ 一周内课程不可选择此选项
                </p>
              )}
            </div>
            <div className="option-radio">
              {formData.makeupOption === 'skip' && <span>✓</span>}
            </div>
          </div>
        </div>

        {/* 时间段选择（仅当选择"其他时间补课"时显示） */}
        {formData.makeupOption === 'specific_time' && (
          <div className="time-slot-selection">
            {loadingMakeupSlots ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                <p>正在加载可选补课时间...</p>
              </div>
            ) : makeupTimeSlots.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                <p style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                  ⚠️ 暂无可选补课时间
                </p>
                <div style={{ fontSize: '14px', color: '#999', lineHeight: '1.8', textAlign: 'left', maxWidth: '500px', margin: '0 auto' }}>
                  <p style={{ marginBottom: '8px' }}>可能的原因：</p>
                  <ul style={{ marginLeft: '20px', marginTop: '8px' }}>
                    <li>数据库中没有同一主题、同一季度的其他时间段课程</li>
                    <li>所有匹配的课程都已过期或已完成</li>
                    <li>需要添加更多不同时间段的课程到数据库</li>
                  </ul>
                  <p style={{ marginTop: '12px', fontSize: '12px', color: '#aaa' }}>
                    💡 提示：请打开浏览器控制台（F12）查看详细的查找日志
                  </p>
                </div>
              </div>
            ) : (
              <div className="time-slots-grid">
                {makeupTimeSlots.map(slot => (
                  <div
                    key={slot.id}
                    className={`time-slot-card ${formData.selectedTimeSlot?.id === slot.id ? 'selected' : ''} ${!slot.available ? 'disabled' : ''}`}
                    onClick={() => slot.available && onTimeSlotSelect(slot)}
                  >
                    <div className="slot-header">
                      <div className="slot-date">{slot.dateDisplay}</div>
                      {formData.selectedTimeSlot?.id === slot.id && (
                        <div className="slot-check">✓</div>
                      )}
                    </div>
                    <div className="slot-day-time">
                      <span className="slot-day">{slot.day}</span>
                      <span className="slot-time">{slot.time}</span>
                    </div>
                    {slot.lessonName && (
                      <div className="slot-lesson-name" style={{ 
                        marginTop: '8px', 
                        fontSize: '13px', 
                        color: '#666',
                        fontWeight: '500'
                      }}>
                        {slot.lessonName}
                      </div>
                    )}
                    <div className="slot-capacity">
                      {slot.available ? (
                        <span className="capacity-available">
                          可选
                        </span>
                      ) : (
                        <span className="capacity-full">已满员</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 提交/取消按钮 */}
        <div className="form-actions">
          <button type="button" className="cancel-btn" onClick={onCancel}>
            取消
          </button>
          <button type="submit" className="submit-btn">
            提交申请
          </button>
        </div>
      </form>
    </div>
  );
};

export default PullRequest;