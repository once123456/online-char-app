import React, { useState, useEffect } from 'react';
import StudentsCourseInfo from '../components/leaveRequest/studentsCourseInfo/index.jsx';
import PullRequest from '../components/leaveRequest/pullRequest/index.jsx';
import './leaveRequest.css';

// Firebase 容错导入
let db;
try {
  const firebaseModule = require('../lib/firebase');
  db = firebaseModule.db;
} catch (error) {
  console.warn('Firebase配置加载失败:', error);
  db = null;
}
import { doc, getDoc, collection, getDocs, addDoc, query, where, orderBy } from 'firebase/firestore';

const LeaveRequest = ({ userAccount }) => {
  // 根据登录用户的学生ID初始化
  const initialStudentId = userAccount?.studentId || "STUDENT_001";
  
  // 初始化课程数据
  const [courseData, setCourseData] = useState({
    studentName: "【从数据库加载中...】",
    studentId: initialStudentId,
    studyLevel: "【从数据库加载中...】",
    studentAge: "",
    studentClass: "",
    parentName: "",
    parentPhone: "",
    enrollmentDate: "",
    courseCode: "SPEC_C001",
    courseName: "演讲课程",
    issueDate: "2025-12-17",
    lessons: [
      { id: 1, name: "故事起航 - 認識自我與舞台", courseName: "SPEC_C001", dateTime: "2025-12-06T12:00-14:00", timeSlot: "SAT 12:00 - 14:00", completed: true },
      { id: 2, name: "句子結構大師 - 清晰表達", courseName: "SPEC_C001", dateTime: "2025-12-13T12:00-14:00", timeSlot: "SAT 12:00 - 14:00", completed: true },
      { id: 3, name: "圖片說故事 - Show and Tell", courseName: "SPEC_C001", dateTime: "2025-12-20T12:00-14:00", timeSlot: "SAT 12:00 - 14:00", completed: false },
      { id: 4, name: "禮儀小達人 - 優雅與尊重", courseName: "SPEC_C001", dateTime: "2025-12-27T12:00-14:00", timeSlot: "SAT 12:00 - 14:00", completed: false },
      { id: 5, name: "故事結構大挑戰 - 圖卡排序", courseName: "SPEC_C001", dateTime: "2026-01-03T12:00-14:00", timeSlot: "SAT 12:00 - 14:00", completed: false },
      { id: 6, name: "故事連貫大師 - 連接詞應用", courseName: "SPEC_C001", dateTime: "2026-01-10T12:00-14:00", timeSlot: "SAT 12:00 - 14:00", completed: false },
      { id: 7, name: "形容詞魔法 - 豐富故事描述", courseName: "SPEC_C001", dateTime: "2026-01-17T12:00-14:00", timeSlot: "SAT 12:00 - 14:00", completed: false },
      { id: 8, name: "故事與情感 - 聲音與表情", courseName: "SPEC_C001", dateTime: "2026-01-24T12:00-14:00", timeSlot: "SAT 12:00 - 14:00", completed: false },
      { id: 9, name: "創意故事編織 - 想像力啟動", courseName: "SPEC_C001", dateTime: "2026-01-31T12:00-14:00", timeSlot: "SAT 12:00 - 14:00", completed: false },
      { id: 10, name: "即興創作 - 快速應變", courseName: "SPEC_C001", dateTime: "2026-02-07T12:00-14:00", timeSlot: "SAT 12:00 - 14:00", completed: false },
      { id: 11, name: "創意畫作分享 - 繪畫與內心表達", courseName: "SPEC_C001", dateTime: "2026-02-14T12:00-14:00", timeSlot: "SAT 12:00 - 14:00", completed: false },
      { id: 12, name: "故事演講家 - 學習成果演示", courseName: "SPEC_C001", dateTime: "2026-02-21T12:00-14:00", timeSlot: "SAT 12:00 - 14:00", completed: false }
    ]
  });

  // 状态管理
  const [loading, setLoading] = useState(true);
  const [upcomingLessons, setUpcomingLessons] = useState([]);
  const [submittedRequests, setSubmittedRequests] = useState([]);

  // 换课申请相关状态
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [formData, setFormData] = useState({
    reason: '',
    description: '',
    makeupOption: '',
    selectedTimeSlot: null
  });

  // 补课时间选项
  const [makeupTimeSlots] = useState([
    { id: 'slot_1', date: '2025-12-21', dateDisplay: '2025年12月21日', day: '周六', time: '12:00 - 14:00', currentStudents: 8, maxStudents: 10, available: true },
    { id: 'slot_2', date: '2025-12-22', dateDisplay: '2025年12月22日', day: '周日', time: '10:00 - 12:00', currentStudents: 6, maxStudents: 10, available: true },
    { id: 'slot_3', date: '2025-12-22', dateDisplay: '2025年12月22日', day: '周日', time: '14:00 - 16:00', currentStudents: 10, maxStudents: 10, available: false },
    { id: 'slot_4', date: '2025-12-28', dateDisplay: '2025年12月28日', day: '周六', time: '12:00 - 14:00', currentStudents: 5, maxStudents: 10, available: true },
    { id: 'slot_5', date: '2025-12-29', dateDisplay: '2025年12月29日', day: '周日', time: '10:00 - 12:00', currentStudents: 9, maxStudents: 10, available: true },
    { id: 'slot_6', date: '2026-01-04', dateDisplay: '2026年1月4日', day: '周六', time: '14:00 - 16:00', currentStudents: 10, maxStudents: 10, available: false }
  ]);

  // 从Firebase加载学生数据
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        console.log("===== 开始加载学生数据 =====");
        
        if (!db) {
          console.warn("⚠️ Firebase未配置，使用默认数据");
          setLoading(false);
          return;
        }

        // 使用登录用户的学生ID，如果没有则使用默认值
        const targetStudentId = userAccount?.studentId || initialStudentId;
        console.log("===== 加载学生数据，学生ID:", targetStudentId);
        
        const studentDoc = await getDoc(doc(db, "students", targetStudentId));
        
        if (studentDoc.exists()) {
          const studentData = studentDoc.data();
          
          console.log("✅ 学生数据加载成功：", studentData);
          
          // 更新学生信息
          setCourseData(prev => ({
            ...prev,
            studentId: studentDoc.id,
            studentName: studentData.name || studentData.studentName || prev.studentName,
            studyLevel: studentData.level || studentData.studyLevel || studentData.grade || prev.studyLevel,
            studentAge: studentData.age || studentData.studentAge || "",
            studentClass: studentData.class || studentData.className || "",
            parentName: studentData.parentName || studentData.guardianName || "",
            parentPhone: studentData.parentPhone || studentData.contactPhone || "",
            enrollmentDate: studentData.enrollmentDate || studentData.joinDate || ""
          }));
        } else {
          console.warn("⚠️ 学生文档不存在，使用默认数据");
        }
        
        setLoading(false);
      } catch (error) {
        console.error("❌ 加载学生数据失败：", error);
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [userAccount, initialStudentId]);

  // 从Firebase加载请假申请数据
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        if (!db) {
          console.warn("⚠️ Firebase未配置，无法加载请假申请");
          return;
        }

        // 使用登录用户的学生ID进行过滤
        const targetStudentId = userAccount?.studentId || courseData.studentId || "STUDENT_001";
        console.log("===== 开始加载请假申请数据 =====", targetStudentId);
        
        const requestsRef = collection(db, "requests");
        const q = query(
          requestsRef,
          where("studentId", "==", targetStudentId),
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

        setSubmittedRequests(requestsList);
        console.log("✅ 请假申请数据加载成功：", requestsList);
      } catch (error) {
        console.error("❌ 加载请假申请失败：", error);
        // 如果查询失败（可能是没有索引），尝试获取所有请求
        try {
          const requestsRef = collection(db, "requests");
          const querySnapshot = await getDocs(requestsRef);
          const requestsList = [];
          
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            const targetStudentId = userAccount?.studentId || courseData.studentId || "STUDENT_001";
            if (data.studentId === targetStudentId) {
              requestsList.push({
                id: doc.id,
                ...data
              });
            }
          });
          
          setSubmittedRequests(requestsList);
          console.log("✅ 请假申请数据加载成功（全量查询）：", requestsList);
        } catch (err) {
          console.error("❌ 全量查询也失败：", err);
        }
      }
    };

    if (courseData.studentId) {
      fetchRequests();
    }
  }, [courseData.studentId]);

  // 计算即将开始的课程
  useEffect(() => {
    if (!courseData || !Array.isArray(courseData.lessons)) {
      setUpcomingLessons([]);
      return;
    }
    
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const upcoming = courseData.lessons.filter(lesson => {
      if (!lesson || lesson.completed) return false;
      
      try {
        const lessonDate = new Date(lesson.dateTime?.split('T')[0] || '');
        return !isNaN(lessonDate.getTime()) && lessonDate >= now && lessonDate <= sevenDaysLater;
      } catch (e) {
        return false;
      }
    });
    
    setUpcomingLessons(upcoming);
  }, [courseData]);

  // 事件处理函数
  // 选择课程，显示申请表单
  const handleLessonSelect = (lesson) => {
    setSelectedLesson(lesson);
    setShowRequestForm(true);
  };


  // 表单输入变化
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 选择补课选项
  const handleMakeupOptionChange = (option) => {
    setFormData(prev => ({
      ...prev,
      makeupOption: option,
      selectedTimeSlot: null
    }));
  };

  // 选择补课时间段
  const handleTimeSlotSelect = (timeSlot) => {
    setFormData(prev => ({
      ...prev,
      selectedTimeSlot: timeSlot
    }));
  };

  // 提交申请
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 验证必填项
    if (!formData.reason || !formData.makeupOption) {
      alert('请填写所有必填项');
      return;
    }

    if (formData.makeupOption === 'specific_time' && !formData.selectedTimeSlot) {
      alert('请选择补课时间段');
      return;
    }

    // 创建新申请（使用登录用户的学生ID）
    const targetStudentId = userAccount?.studentId || courseData.studentId || "STUDENT_001";
    const newRequest = {
      studentId: targetStudentId,
      lesson: selectedLesson,
      courseCode: courseData.courseCode,
      courseName: courseData.courseName,
      studentName: courseData.studentName,
      ...formData,
      submitTime: new Date().toLocaleString('zh-CN'),
      status: 'pending',
      reviewTime: null,
      reviewNote: null
    };

    // 保存到 Firebase
    try {
      if (!db) {
        throw new Error('Firebase 数据库未初始化');
      }

      const docRef = await addDoc(collection(db, "requests"), newRequest);
      console.log("✅ 请假申请已保存到 Firebase，ID:", docRef.id);
      
      // 更新本地状态
      setSubmittedRequests(prev => [...prev, {
        id: docRef.id,
        ...newRequest
      }]);
      
      alert('请假/换课申请已提交并保存到数据库！');
      
      // 重置表单
      resetForm();
    } catch (error) {
      console.error("❌ 保存请假申请失败：", error);
      alert('请假申请提交失败，请稍后重试。错误：' + error.message);
    }
  };

  // 取消申请/返回
  const handleCancel = () => {
    resetForm();
  };

  // 重置表单状态
  const resetForm = () => {
    setFormData({
      reason: '',
      description: '',
      makeupOption: '',
      selectedTimeSlot: null
    });
    setShowRequestForm(false);
    setSelectedLesson(null);
  };

  // 加载状态
  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ fontSize: '18px', marginBottom: '10px' }}>正在加载学生数据...</p>
        <small>正在从 Firebase 获取完整学生信息，请稍候...</small>
      </div>
    );
  }

  return (
    <div className="leave-request-page">
      {/* 页面头部 */}
      <div className="leave-request-header">
        <div className="student-header-info">
          <img 
            src="./avatar.png" 
            alt="学生头像" 
            onError={(e) => e.target.src = 'https://via.placeholder.com/60'} 
            className="student-avatar"
          />
          <div>
            <h3>{courseData?.studentName || '未知学生'}</h3>
            <p>{courseData?.studyLevel || '未设置'} · 学号: {courseData?.studentId || '未知'}</p>
          </div>
        </div>
      </div>

      {/* 根据状态显示不同组件 */}
      {!showRequestForm ? (
        <StudentsCourseInfo
          courseData={courseData}
          upcomingLessons={upcomingLessons}
          submittedRequests={submittedRequests}
          onLessonSelect={handleLessonSelect}
        />
      ) : (
        <PullRequest
          selectedLesson={selectedLesson}
          makeupTimeSlots={makeupTimeSlots}
          formData={formData}
          onInputChange={handleInputChange}
          onMakeupOptionChange={handleMakeupOptionChange}
          onTimeSlotSelect={handleTimeSlotSelect}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
};

export default LeaveRequest;