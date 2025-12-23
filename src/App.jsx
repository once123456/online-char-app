import { useState } from "react";
// import { onAuthStateChanged, signOut } from "firebase/auth";
// import { doc, getDoc, setDoc } from "firebase/firestore";
// import { auth, db } from "./lib/firebase";
import Chat from "./components/chat/Chat.jsx";
import Detail from "./components/detail/Detail.jsx";
import List from "./components/list/List.jsx";
import LeaveRequest from "./pages/LeaveRequest.jsx";
import Activities from "./components/activities/Activities.jsx";
import MediaUpload from "./components/media/MediaUpload.jsx";
// import Auth from "./components/auth/Auth.jsx";

const App = () => {
  const [currentView, setCurrentView] = useState("chat");
  // 暂时跳过登录验证，使用模拟用户数据
  const [user] = useState({ 
    email: "demo@example.com",
    uid: "demo-user-001"
  });
  // 暂时不使用accounts表，直接绑定学生ID为"1"
  const [userAccount] = useState({
    email: "demo@example.com",
    studentId: "1", // 暂时固定为"1"，不依赖accounts表
    uid: "demo-user-001",
    role: "parent"
  });
  const [loading] = useState(false);

  // 暂时注释掉认证监听
  // useEffect(() => {
  //   const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
  //     if (currentUser) {
  //       // 获取用户账号信息
  //       try {
  //         const accountDoc = await getDoc(doc(db, "accounts", currentUser.uid));
  //         if (accountDoc.exists()) {
  //           setUserAccount({ ...accountDoc.data(), uid: currentUser.uid });
  //         } else {
  //           // 如果accounts集合中没有，尝试从accounts集合查找（旧数据格式）
  //           const { collection, getDocs, query, where } = await import("firebase/firestore");
  //           const accountsRef = collection(db, "accounts");
  //           const q = query(accountsRef, where("email", "==", currentUser.email));
  //           const querySnapshot = await getDocs(q);
  //           
  //           if (!querySnapshot.empty) {
  //             const accountData = querySnapshot.docs[0].data();
  //             // 更新到accounts集合（使用UID作为文档ID）
  //             await setDoc(doc(db, "accounts", currentUser.uid), {
  //               email: accountData.email,
  //               studentId: accountData.studentId,
  //               createdAt: accountData.createdAt || new Date().toISOString(),
  //               role: accountData.role || 'parent'
  //             });
  //             setUserAccount({ ...accountData, uid: currentUser.uid });
  //           }
  //           if (!querySnapshot.empty) {
  //             const accountData = querySnapshot.docs[0].data();
  //             setUserAccount({ ...accountData, uid: currentUser.uid });
  //           }
  //         }
  //       } catch (error) {
  //         console.error("获取用户账号信息失败:", error);
  //       }
  //       setUser(currentUser);
  //     } else {
  //       setUser(null);
  //       setUserAccount(null);
  //     }
  //     setLoading(false);
  //   });

  //   return () => unsubscribe();
  // }, []);

  // 处理登录成功
  // const handleAuthSuccess = (user, accountData) => {
  //   setUser(user);
  //   setUserAccount(accountData);
  // };

  // 处理登出（暂时禁用）
  const handleLogout = () => {
    console.log("登出功能已暂时禁用（跳过登录验证模式）");
    // try {
    //   await signOut(auth);
    //   setUser(null);
    //   setUserAccount(null);
    // } catch (error) {
    //   console.error("登出失败:", error);
    //   alert("登出失败，请稍后重试");
    // }
  };

  // 如果正在加载，显示加载状态
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>正在加载...</p>
      </div>
    );
  }

  // 暂时跳过登录验证，直接显示主界面
  // if (!user) {
  //   return <Auth onAuthSuccess={handleAuthSuccess} />;
  // }

  return (
    <div className='container'>
      {/* 顶部导航栏 */}
      <div className="nav-bar">
        <div className="nav-buttons">
          <button 
            className={currentView === "chat" ? "active" : ""} 
            onClick={() => setCurrentView("chat")}
          >
            💬 聊天
          </button>
          <button 
            className={currentView === "leave" ? "active" : ""} 
            onClick={() => setCurrentView("leave")}
          >
            📝 请假申请
          </button>
          <button 
            className={currentView === "activities" ? "active" : ""} 
            onClick={() => setCurrentView("activities")}
          >
            🎉 活动中心
          </button>
          <button 
            className={currentView === "media" ? "active" : ""} 
            onClick={() => setCurrentView("media")}
          >
            📷 照片/视频
          </button>
        </div>
        
        {/* 用户信息和登出按钮 */}
        <div className="user-info-section">
          <div className="user-email">{userAccount?.email || user.email}</div>
          {userAccount?.studentId && (
            <div className="user-student-id">学生ID: {userAccount.studentId}</div>
          )}
          <button className="logout-btn" onClick={handleLogout}>
            登出
          </button>
        </div>
      </div>

      {/* 根据选择显示不同视图 */}
      {currentView === "chat" ? (
        <div className="chat-view">
          <List/>
          <Chat/>
          <Detail/>
        </div>
      ) : currentView === "leave" ? (
        <div className="leave-request-view">
          <LeaveRequest userAccount={userAccount} />
        </div>
      ) : currentView === "activities" ? (
        <div className="activities-view">
          <Activities />
        </div>
      ) : (
        <div className="media-upload-view">
          <MediaUpload />
        </div>
      )}
    </div>
  )
}

export default App