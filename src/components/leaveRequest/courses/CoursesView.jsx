import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import CourseCalendar from './CourseCalendar';
import CourseList from './CourseList';
import './courses.css';

const CoursesView = ({ enrollment = [] }) => {
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'
  const [courseDetails, setCourseDetails] = useState({});
  const [loading, setLoading] = useState(false);

  // 从enrollment中提取所有唯一的courseId
  const getUniqueCourseIds = () => {
    const courseIds = new Set();
    enrollment.forEach(item => {
      if (item.courseId) {
        // 提取课程代码（例如：SPEC_C001round001 -> SPEC_C001）
        const courseCode = item.courseId.split('round')[0];
        courseIds.add(courseCode);
      }
    });
    return Array.from(courseIds);
  };

  // 加载课程详情
  useEffect(() => {
    const fetchCourseDetails = async () => {
      if (!db || enrollment.length === 0) {
        return;
      }

      setLoading(true);
      const courseIds = getUniqueCourseIds();
      const details = {};

      try {
        // 并行获取所有课程详情
        const promises = courseIds.map(async (courseId) => {
          try {
            const courseDoc = await getDoc(doc(db, 'courses', courseId));
            if (courseDoc.exists()) {
              return { courseId, data: courseDoc.data() };
            }
            return null;
          } catch (error) {
            console.error(`获取课程 ${courseId} 详情失败:`, error);
            return null;
          }
        });

        const results = await Promise.all(promises);
        results.forEach(result => {
          if (result) {
            details[result.courseId] = result.data;
          }
        });

        setCourseDetails(details);
      } catch (error) {
        console.error('加载课程详情失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [enrollment]);

  return (
    <div className="courses-view">
      <div className="courses-view-header">
        <h2>我的课程</h2>
        <div className="view-mode-toggle">
          <button
            className={`toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
            onClick={() => setViewMode('calendar')}
          >
            📅 日历视图
          </button>
          <button
            className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            📋 列表视图
          </button>
        </div>
      </div>

      {loading && (
        <div className="loading-indicator">
          <p>正在加载课程详情...</p>
        </div>
      )}

      <div className="courses-content">
        {viewMode === 'calendar' ? (
          <CourseCalendar enrollment={enrollment} courseDetails={courseDetails} />
        ) : (
          <CourseList enrollment={enrollment} courseDetails={courseDetails} />
        )}
      </div>
    </div>
  );
};

export default CoursesView;



