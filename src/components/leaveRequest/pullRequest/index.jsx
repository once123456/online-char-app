import React from 'react';
import './pullRequest.css';

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

const PullRequest = ({
  selectedLesson,
  makeupTimeSlots,
  formData,
  onInputChange,
  onMakeupOptionChange,
  onTimeSlotSelect,
  onSubmit,
  onCancel
}) => {
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
              <span>{formatDate(selectedLesson.dateTime)}</span>
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
            className={`makeup-option-card ${formData.makeupOption === 'next_quarter' ? 'selected' : ''}`}
            onClick={() => onMakeupOptionChange('next_quarter')}
          >
            <div className="option-icon">📆</div>
            <div className="option-content">
              <h4>延期至下一季度</h4>
              <p>将本节课安排到下一个学期补上</p>
            </div>
            <div className="option-radio">
              {formData.makeupOption === 'next_quarter' && <span>✓</span>}
            </div>
          </div>

          <div 
            className={`makeup-option-card ${formData.makeupOption === 'skip' ? 'selected' : ''}`}
            onClick={() => onMakeupOptionChange('skip')}
          >
            <div className="option-icon">⏭️</div>
            <div className="option-content">
              <h4>跳过本节课</h4>
              <p>不进行补课，直接继续后续课程</p>
            </div>
            <div className="option-radio">
              {formData.makeupOption === 'skip' && <span>✓</span>}
            </div>
          </div>
        </div>

        {/* 时间段选择（仅当选择"其他时间补课"时显示） */}
        {formData.makeupOption === 'specific_time' && (
          <div className="time-slot-selection">
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
                  <div className="slot-capacity">
                    {slot.available ? (
                      <span className="capacity-available">
                        剩余名额: {slot.maxStudents - slot.currentStudents}/{slot.maxStudents}
                      </span>
                    ) : (
                      <span className="capacity-full">已满员</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
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