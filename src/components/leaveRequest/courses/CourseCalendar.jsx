import React from 'react';
import './courses.css';

const CourseCalendar = ({ enrollment, courseDetails }) => {
  // 将enrollment数据按日期分组
  const groupByDate = (enrollments) => {
    const grouped = {};
    enrollments.forEach(item => {
      const date = item.dateStr || item.date;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(item);
    });
    return grouped;
  };

  // 获取课程状态颜色
  const getStatusColor = (course) => {
    if (course.completed) {
      return '#28a745'; // 已完成 - 绿色
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 重置时间部分，只比较日期
    const courseDate = new Date(course.dateStr || course.date);
    courseDate.setHours(0, 0, 0, 0);
    if (courseDate < today) {
      return '#6c757d'; // 已过期 - 灰色
    }
    return '#ffc107'; // 待上课 - 黄色
  };

  // 获取月份的所有日期
  const getMonthDates = () => {
    const dates = [];
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // 获取当前月份的第一天和最后一天
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    
    // 获取第一天是星期几（0=周日，6=周六）
    const startDay = firstDay.getDay();
    
    // 添加空白日期（上个月的日期）
    for (let i = 0; i < startDay; i++) {
      dates.push(null);
    }
    
    // 添加当前月的所有日期
    for (let day = 1; day <= lastDay.getDate(); day++) {
      dates.push(new Date(currentYear, currentMonth, day));
    }
    
    return dates;
  };

  const groupedEnrollments = groupByDate(enrollment || []);
  const monthDates = getMonthDates();
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const months = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // 格式化日期为 YYYY-MM-DD
  const formatDateKey = (date) => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 检查日期是否有课程
  const hasCourse = (date) => {
    if (!date) return false;
    const dateKey = formatDateKey(date);
    return groupedEnrollments[dateKey] && groupedEnrollments[dateKey].length > 0;
  };

  // 获取日期当天的课程
  const getCoursesForDate = (date) => {
    if (!date) return [];
    const dateKey = formatDateKey(date);
    return groupedEnrollments[dateKey] || [];
  };

  // 判断是否是今天
  const isToday = (date) => {
    if (!date) return false;
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="course-calendar">
      <div className="calendar-header">
        <h3>{currentYear}年 {months[currentMonth]}</h3>
      </div>
      <div className="calendar-grid">
        {/* 星期标题 */}
        <div className="calendar-weekdays">
          {weekDays.map(day => (
            <div key={day} className="weekday-header">{day}</div>
          ))}
        </div>
        
        {/* 日期网格 */}
        <div className="calendar-dates">
          {monthDates.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="calendar-day empty"></div>;
            }
            
            const courses = getCoursesForDate(date);
            const hasCourses = courses.length > 0;
            const isTodayDate = isToday(date);
            
            return (
              <div
                key={date.getTime()}
                className={`calendar-day ${hasCourses ? 'has-course' : ''} ${isTodayDate ? 'today' : ''}`}
              >
                <div className="day-number">{date.getDate()}</div>
                {hasCourses && (
                  <div className="course-indicators">
                    {courses.map((course, idx) => (
                      <div
                        key={idx}
                        className="course-dot"
                        style={{
                          backgroundColor: getStatusColor(course),
                          title: `${course.name} - ${course.timeSlot}`
                        }}
                      />
                    ))}
                  </div>
                )}
                {hasCourses && (
                  <div className="course-tooltip">
                    {courses.map((course, idx) => (
                      <div key={idx} className="tooltip-item">
                        <div className="tooltip-time">{course.timeSlot}</div>
                        <div className="tooltip-name">{course.name}</div>
                        <div className={`tooltip-status ${course.completed ? 'completed' : 'pending'}`}>
                          {course.completed ? '已完成' : '待上课'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CourseCalendar;

