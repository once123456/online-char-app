import React, { useState, useEffect } from 'react';
import StudentsCourseInfo from '../components/leaveRequest/studentsCourseInfo/index.jsx';
import PullRequest from '../components/leaveRequest/pullRequest/index.jsx';
import './leaveRequest.css';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, getDocs, addDoc, query, where, orderBy } from 'firebase/firestore';

const LeaveRequest = ({ userAccount }) => {
  // 暂时不使用accounts表，直接绑定学生ID为"1"
  const initialStudentId = "1";
  
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
  const [personalInfo, setPersonalInfo] = useState(null);
  const [enrollment, setEnrollment] = useState([]);
  const [showPersonalInfoModal, setShowPersonalInfoModal] = useState(false);

  // 换课申请相关状态
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [formData, setFormData] = useState({
    reason: '',
    description: '',
    makeupOption: '',
    selectedTimeSlot: null
  });

  // 补课时间选项（从courses集合动态加载）
  const [makeupTimeSlots, setMakeupTimeSlots] = useState([]);
  const [loadingMakeupSlots, setLoadingMakeupSlots] = useState(false);

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

        // 暂时不使用accounts表，直接使用学生ID "1"
        const targetStudentId = initialStudentId;
        console.log("===== 加载学生数据，学生ID:", targetStudentId, "(暂时固定为1，不依赖accounts表)");
        
        const studentDoc = await getDoc(doc(db, "students", targetStudentId));
        
        if (studentDoc.exists()) {
          const studentData = studentDoc.data();
          
          console.log("✅ 学生数据加载成功，完整数据：", studentData);
          console.log("✅ enrollment字段:", studentData.enrollment);
          console.log("✅ personalInfo字段:", studentData.personalInfo);
          
          // 更新学生信息
          setCourseData(prev => ({
            ...prev,
            studentId: studentDoc.id,
            studentName: studentData.personalInfo?.name || studentData.name || studentData.studentName || prev.studentName,
            studyLevel: studentData.personalInfo?.level || studentData.level || studentData.studyLevel || studentData.grade || prev.studyLevel,
            studentAge: studentData.age || studentData.studentAge || "",
            studentClass: studentData.class || studentData.className || "",
            parentName: studentData.personalInfo?.parentName || studentData.parentName || studentData.guardianName || "",
            parentPhone: studentData.personalInfo?.parentContact || studentData.parentPhone || studentData.contactPhone || "",
            enrollmentDate: studentData.enrollmentDate || studentData.joinDate || ""
          }));
          
          // 保存personalInfo和enrollment - 确保立即设置
          if (studentData.personalInfo) {
            const personalInfoData = studentData.personalInfo;
            console.log("✅ 设置personalInfo:", personalInfoData);
            setPersonalInfo(personalInfoData);
          } else {
            console.warn("⚠️ 学生数据中没有personalInfo字段");
            setPersonalInfo(null);
          }
          
          if (studentData.enrollment) {
            if (Array.isArray(studentData.enrollment)) {
              console.log("✅ 设置enrollment数组，共", studentData.enrollment.length, "条记录");
              console.log("✅ enrollment数据详情:", studentData.enrollment);
              setEnrollment(studentData.enrollment);
            } else {
              console.warn("⚠️ enrollment不是数组:", typeof studentData.enrollment, studentData.enrollment);
              setEnrollment([]);
            }
          } else {
            console.warn("⚠️ 学生数据中没有enrollment字段");
            setEnrollment([]);
          }
        } else {
          console.warn("⚠️ 学生文档不存在，使用默认数据");
          setPersonalInfo(null);
          setEnrollment([]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("❌ 加载学生数据失败：", error);
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [initialStudentId]); // 移除userAccount依赖，因为暂时不使用accounts表

  // 从Firebase加载请假申请数据
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        if (!db) {
          console.warn("⚠️ Firebase未配置，无法加载请假申请");
          return;
        }

        // 暂时不使用accounts表，直接使用学生ID "1"
        const targetStudentId = courseData.studentId || "1";
        console.log("===== 开始加载请假申请数据 =====", targetStudentId, "(暂时固定为1，不依赖accounts表)");
        
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
            // 暂时不使用accounts表，直接使用学生ID "1"
            const targetStudentId = courseData.studentId || "1";
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

  // 计算所有未完成的课程（优先使用enrollment数据，因为它包含courseId）
  useEffect(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    let allUpcoming = [];
    
    // 优先使用enrollment数据（包含courseId）
    if (enrollment && Array.isArray(enrollment) && enrollment.length > 0) {
      allUpcoming = enrollment.filter(lesson => {
        if (!lesson || lesson.completed) return false;
        
        try {
          const lessonDate = new Date(lesson.dateStr || lesson.date);
          lessonDate.setHours(0, 0, 0, 0);
          return !isNaN(lessonDate.getTime()) && lessonDate >= now;
        } catch (e) {
          return false;
        }
      });
    } 
    // 如果没有enrollment，使用courseData.lessons作为后备
    else if (courseData && Array.isArray(courseData.lessons)) {
      allUpcoming = courseData.lessons.filter(lesson => {
        if (!lesson || lesson.completed) return false;
        
        try {
          const lessonDate = new Date(lesson.dateTime?.split('T')[0] || '');
          lessonDate.setHours(0, 0, 0, 0);
          return !isNaN(lessonDate.getTime()) && lessonDate >= now;
        } catch (e) {
          return false;
        }
      });
    }
    
    // 按日期排序
    allUpcoming.sort((a, b) => {
      const dateA = new Date(a.dateStr || a.date || a.dateTime?.split('T')[0]);
      const dateB = new Date(b.dateStr || b.date || b.dateTime?.split('T')[0]);
      return dateA - dateB;
    });
    
    setUpcomingLessons(allUpcoming);
  }, [enrollment, courseData]);

  // 从courses集合加载可选补课时间
  useEffect(() => {
    const fetchMakeupTimeSlots = async () => {
      if (!selectedLesson || !db) {
        setMakeupTimeSlots([]);
        return;
      }

      setLoadingMakeupSlots(true);
      try {
        // 从selectedLesson中获取courseId
        // 如果selectedLesson来自enrollment，courseId在selectedLesson.courseId
        // 如果来自upcomingLessons（courseData.lessons），需要从enrollment中查找对应的courseId
        let currentCourseId = selectedLesson.courseId;
        
        // 如果没有courseId，尝试从enrollment中查找
        if (!currentCourseId && enrollment && enrollment.length > 0) {
          const matchingEnrollment = enrollment.find(e => 
            e.id === selectedLesson.id || 
            (e.name === selectedLesson.name && e.dateStr === selectedLesson.dateTime?.split('T')[0])
          );
          if (matchingEnrollment) {
            currentCourseId = matchingEnrollment.courseId;
          }
        }
        
        if (!currentCourseId) {
          console.warn("⚠️ 无法找到courseId，无法查找补课时间", selectedLesson);
          setMakeupTimeSlots([]);
          setLoadingMakeupSlots(false);
          return;
        }

        console.log("===== 开始加载补课时间选项 =====", "当前课程ID:", currentCourseId);

        // 解析courseId: 支持两种格式
        // 格式1: SPEC_C001round001 (无下划线)
        // 格式2: SPEC_C001_round001 (有下划线) - 数据库实际格式
        let courseIdMatch = currentCourseId.match(/^([A-Z]+)_(C\d+)_(round\d+)$/);
        let formatType = 'with_underscore'; // 有下划线的格式
        
        if (!courseIdMatch) {
          // 尝试无下划线的格式
          courseIdMatch = currentCourseId.match(/^([A-Z]+)_(C\d+)(round\d+)$/);
          formatType = 'without_underscore'; // 无下划线的格式
        }
        
        if (!courseIdMatch) {
          console.warn("⚠️ courseId格式不正确:", currentCourseId);
          console.warn("   期望格式1: CATEGORY_C###_round### (例如: SPEC_C001_round001)");
          console.warn("   期望格式2: CATEGORY_C###round### (例如: SPEC_C001round001)");
          setMakeupTimeSlots([]);
          setLoadingMakeupSlots(false);
          return;
        }

        const [, category, currentCourseNum, round] = courseIdMatch;
        console.log("✅ 成功解析课程ID - 格式类型:", formatType);
        console.log("解析结果 - category:", category, "round:", round, "当前课程编号:", currentCourseNum);
        console.log("查找条件: 同一类别(" + category + "), 同一季度(" + round + "), 不同课程编号(不是 " + currentCourseNum + ")");

        // 获取所有courses集合中的课程
        const coursesRef = collection(db, "courses");
        const coursesSnapshot = await getDocs(coursesRef);
        
        const availableSlots = [];
        const now = new Date();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // 获取当前时间，用于判断课程是否已开始
        const currentTime = now.getHours() * 60 + now.getMinutes(); // 当前时间的分钟数

        let totalCourses = 0;
        let matchedCourses = 0;
        let totalLessons = 0;
        let validLessons = 0;

        coursesSnapshot.forEach((doc) => {
          totalCourses++;
          const courseData = doc.data();
          const courseId = doc.id;
          
          // 检查是否是同一category和round但不同课程编号
          // 支持两种格式：有下划线和无下划线
          let match = courseId.match(/^([A-Z]+)_(C\d+)_(round\d+)$/);
          if (!match) {
            match = courseId.match(/^([A-Z]+)_(C\d+)(round\d+)$/);
          }
          
          if (!match) {
            console.log("跳过课程（格式不匹配）:", courseId);
            return;
          }
          
          const [, courseCategory, courseNum, courseRound] = match;
          
          // 必须是同一category、同一round，但不同课程编号
          if (courseCategory === category && courseRound === round && courseNum !== currentCourseNum) {
            matchedCourses++;
            console.log("✅ 找到匹配的课程:", courseId, "课程编号:", courseNum);
            
            // 从lessons中提取未完成的课程
            if (courseData.lessons && Array.isArray(courseData.lessons)) {
              courseData.lessons.forEach((lesson) => {
                totalLessons++;
                // 只选择未完成且日期在未来的课程
                if (!lesson.completed && lesson.dateStr) {
                  const lessonDate = new Date(lesson.dateStr);
                  lessonDate.setHours(0, 0, 0, 0);
                  
                  // 检查课程是否已结束
                  const isFutureDate = lessonDate > today;
                  const isToday = lessonDate.getTime() === today.getTime();
                  
                  // 如果是今天的课程，需要检查时间是否已过
                  let isPast = false;
                  if (isToday && lesson.timeSlot) {
                    // 解析时间段，例如 "SAT 12:00 - 14:00"
                    const timeMatch = lesson.timeSlot.match(/(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})/);
                    if (timeMatch) {
                      const endHour = parseInt(timeMatch[3]);
                      const endMinute = parseInt(timeMatch[4]);
                      const lessonEndTime = endHour * 60 + endMinute;
                      // 如果课程结束时间已过，则不允许选择
                      isPast = lessonEndTime < currentTime;
                    }
                  }
                  
                  // 只允许未来的课程，或今天的课程但还未结束
                  if (isFutureDate || (isToday && !isPast)) {
                    validLessons++;
                    // 格式化日期显示
                    const dateObj = new Date(lesson.dateStr);
                    const dateDisplay = dateObj.toLocaleDateString('zh-CN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    });
                    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
                    const day = dayNames[dateObj.getDay()];
                    
                    availableSlots.push({
                      id: `${courseId}_lesson_${lesson.id}`,
                      courseId: courseId,
                      lessonId: lesson.id,
                      lessonName: lesson.name || '未命名课程',
                      date: lesson.dateStr,
                      dateDisplay: dateDisplay,
                      day: day,
                      time: lesson.timeSlot || courseData.timeSlot || '时间未定',
                      name: lesson.name,
                      available: true // 暂时都设为可用，后续可以根据实际报名情况判断
                    });
                  } else {
                    console.log("  跳过课程（日期已过或已完成）:", lesson.name, lesson.dateStr, lesson.completed ? "已完成" : "日期已过");
                  }
                } else {
                  console.log("  跳过课程（已完成或无日期）:", lesson.name, lesson.completed ? "已完成" : "无日期");
                }
              });
            } else {
              console.log("  课程没有lessons数组:", courseId);
            }
          } else {
            // 记录不匹配的原因
            if (courseCategory !== category) {
              console.log("跳过课程（类别不匹配）:", courseId, "类别:", courseCategory, "期望:", category);
            } else if (courseRound !== round) {
              console.log("跳过课程（季度不匹配）:", courseId, "季度:", courseRound, "期望:", round);
            } else if (courseNum === currentCourseNum) {
              console.log("跳过课程（同一课程编号）:", courseId, "课程编号:", courseNum);
            }
          }
        });

        // 按日期排序
        availableSlots.sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return dateA - dateB;
        });

        console.log("===== 补课时间查找统计 =====");
        console.log("总课程数:", totalCourses);
        console.log("匹配的课程数:", matchedCourses, "(同一类别和季度，不同课程编号)");
        console.log("总课时数:", totalLessons);
        console.log("有效课时数:", validLessons, "(未完成且日期在未来的课程)");
        console.log("✅ 找到", availableSlots.length, "个可选补课时间:", availableSlots);
        
        if (availableSlots.length === 0) {
          if (matchedCourses === 0) {
            console.warn("⚠️ 未找到匹配的课程。可能原因：");
            console.warn("   1. 数据库中没有同一类别(" + category + ")和季度(" + round + ")的其他课程");
            console.warn("   2. 所有匹配的课程都使用相同的课程编号");
            console.warn("   3. 需要添加更多不同时间段的课程到数据库");
          } else if (validLessons === 0) {
            console.warn("⚠️ 找到匹配的课程，但没有可用的课时。可能原因：");
            console.warn("   1. 所有课时都已完成");
            console.warn("   2. 所有课时的日期都已过期");
          }
        }
        
        setMakeupTimeSlots(availableSlots);
      } catch (error) {
        console.error("❌ 加载补课时间失败:", error);
        setMakeupTimeSlots([]);
      } finally {
        setLoadingMakeupSlots(false);
      }
    };

    fetchMakeupTimeSlots();
  }, [selectedLesson, enrollment, db]);

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

    // 检查一周内课程的限制
    if (selectedLesson) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      try {
        const lessonDate = new Date(selectedLesson.dateStr || selectedLesson.date || selectedLesson.dateTime?.split('T')[0]);
        lessonDate.setHours(0, 0, 0, 0);
        
        const withinWeek = lessonDate >= now && lessonDate <= sevenDaysLater;
        
        if (withinWeek && formData.makeupOption !== 'specific_time') {
          alert('一周内的课程只能选择换课，不能延期或跳过');
          return;
        }
      } catch (error) {
        console.error('日期验证错误:', error);
      }
    }

    if (formData.makeupOption === 'specific_time' && !formData.selectedTimeSlot) {
      alert('请选择补课时间段');
      return;
    }

    // 创建新申请（暂时不使用accounts表，直接使用学生ID "1"）
    const targetStudentId = courseData.studentId || "1";
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
        <button 
          className="view-info-btn"
          onClick={() => {
            console.log("点击查看学生信息按钮，personalInfo:", personalInfo);
            setShowPersonalInfoModal(true);
          }}
        >
          👤 查看学生信息
        </button>
      </div>

      {/* 学生信息弹窗 */}
      {showPersonalInfoModal && (
        <div 
          className="modal-overlay"
          onClick={() => setShowPersonalInfoModal(false)}
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
            zIndex: 1000
          }}
        >
          <div 
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              position: 'relative'
            }}
          >
            <button
              onClick={() => setShowPersonalInfoModal(false)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#666'
              }}
            >
              ×
            </button>
            <h2 style={{ marginTop: 0, marginBottom: '20px' }}>学生详细信息</h2>
            {personalInfo ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <strong>姓名:</strong> {personalInfo.name || '未设置'}
                </div>
                <div>
                  <strong>中文名:</strong> {personalInfo.chineseName || '未设置'}
                </div>
                <div>
                  <strong>性别:</strong> {personalInfo.sex === 'M' ? '男' : personalInfo.sex === 'F' ? '女' : '未设置'}
                </div>
                <div>
                  <strong>年级:</strong> {personalInfo.level || '未设置'}
                </div>
                <div>
                  <strong>偏好语言:</strong> {personalInfo.preferredLanguage || '未设置'}
                </div>
                <div>
                  <strong>过敏情况:</strong> {personalInfo.allergies || '无'}
                </div>
                <div>
                  <strong>身体状况:</strong> {personalInfo.condition || '无'}
                </div>
                <div>
                  <strong>舒适方式:</strong> {personalInfo.comfortMethod || '未设置'}
                </div>
                <div>
                  <strong>家长姓名:</strong> {personalInfo.parentName || '未设置'}
                </div>
                <div>
                  <strong>家长联系方式:</strong> {personalInfo.parentContact || '未设置'}
                </div>
                {personalInfo.favChar && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <strong>喜欢的角色:</strong> {personalInfo.favChar}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                <p>正在加载学生信息...</p>
                <p style={{ fontSize: '14px', marginTop: '8px' }}>
                  如果长时间未显示，可能是数据库中还没有personalInfo数据
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 根据状态显示不同组件 */}
      {!showRequestForm ? (
        <StudentsCourseInfo
          courseData={courseData}
          upcomingLessons={upcomingLessons}
          submittedRequests={submittedRequests}
          onLessonSelect={handleLessonSelect}
          enrollment={enrollment}
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
          loadingMakeupSlots={loadingMakeupSlots}
        />
      )}
    </div>
  );
};

export default LeaveRequest;