import React, { useState } from 'react';
import ActivityDetail from './ActivityDetail';
import './activities.css';

const Activities = () => {
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'upcoming', 'ongoing', 'ended'

  // 硬编码的活动数据
  const activities = [
    {
      id: 1,
      title: "春季演讲比赛",
      description: "展示孩子们的演讲才华，提升表达能力和自信心",
      image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800",
      status: "ongoing", // upcoming, ongoing, ended
      startDate: "2025-03-01",
      endDate: "2025-03-31",
      location: "学校大礼堂",
      participants: 25,
      organizer: "演讲课程组",
      category: "比赛",
      details: {
        introduction: "春季演讲比赛旨在为孩子们提供一个展示演讲才华的平台，通过比赛提升孩子们的口语表达能力、自信心和舞台表现力。",
        rules: [
          "参赛者需准备3-5分钟的演讲内容",
          "主题自选，内容需积极向上",
          "比赛分为初赛、复赛和决赛三个阶段",
          "评委将从内容、表达、台风等方面进行评分"
        ],
        prizes: [
          "一等奖：1名，奖金500元 + 证书",
          "二等奖：2名，奖金300元 + 证书",
          "三等奖：3名，奖金100元 + 证书",
          "优秀奖：若干名，精美礼品 + 证书"
        ],
        schedule: [
          "3月1日-10日：报名阶段",
          "3月15日：初赛",
          "3月22日：复赛",
          "3月31日：决赛及颁奖典礼"
        ]
      },
      candidates: [
        { id: 1, name: "小明", votes: 15, avatar: "https://i.pravatar.cc/150?img=1" },
        { id: 2, name: "小红", votes: 23, avatar: "https://i.pravatar.cc/150?img=2" },
        { id: 3, name: "小华", votes: 18, avatar: "https://i.pravatar.cc/150?img=3" },
        { id: 4, name: "小丽", votes: 12, avatar: "https://i.pravatar.cc/150?img=4" },
        { id: 5, name: "小强", votes: 20, avatar: "https://i.pravatar.cc/150?img=5" }
      ]
    },
    {
      id: 2,
      title: "创意手工制作工作坊",
      description: "培养孩子们的动手能力和创造力，制作精美手工作品",
      image: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800",
      status: "upcoming",
      startDate: "2025-04-10",
      endDate: "2025-04-10",
      location: "手工教室",
      participants: 30,
      organizer: "艺术课程组",
      category: "工作坊",
      details: {
        introduction: "创意手工制作工作坊将带领孩子们学习各种手工技巧，制作精美的艺术作品，培养孩子们的创造力和动手能力。",
        rules: [
          "活动时间为4小时",
          "所有材料由学校提供",
          "作品完成后可以带回家",
          "适合6-12岁儿童参加"
        ],
        prizes: [],
        schedule: [
          "9:00-9:30：活动介绍和材料准备",
          "9:30-11:30：手工制作时间",
          "11:30-12:00：作品展示和分享",
          "12:00：活动结束"
        ]
      },
      candidates: []
    },
    {
      id: 3,
      title: "冬季运动会",
      description: "增强体质，培养团队合作精神，享受运动的乐趣",
      image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800",
      status: "ended",
      startDate: "2024-12-15",
      endDate: "2024-12-20",
      location: "学校操场",
      participants: 50,
      organizer: "体育组",
      category: "运动会",
      details: {
        introduction: "冬季运动会是学校一年一度的大型体育活动，包含跑步、跳远、接力赛等多个项目，旨在增强学生体质，培养团队合作精神。",
        rules: [
          "每个学生最多参加3个项目",
          "比赛分为低年级组和高年级组",
          "所有项目均按年龄分组进行",
          "比赛遵循公平竞争原则"
        ],
        prizes: [
          "各项目前三名将获得奖牌和证书",
          "团体总分前三名将获得奖杯",
          "所有参与者将获得参与奖"
        ],
        schedule: [
          "12月15日：开幕式及田径项目",
          "12月16日：跳远、跳高项目",
          "12月17日：接力赛",
          "12月20日：闭幕式及颁奖典礼"
        ]
      },
      candidates: []
    },
    {
      id: 4,
      title: "科学实验展示日",
      description: "探索科学奥秘，培养科学思维，展示实验成果",
      image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800",
      status: "ongoing",
      startDate: "2025-03-15",
      endDate: "2025-03-25",
      location: "科学实验室",
      participants: 20,
      organizer: "科学课程组",
      category: "展示",
      details: {
        introduction: "科学实验展示日为孩子们提供了一个展示科学实验成果的平台，通过实验展示培养孩子们的科学思维和探索精神。",
        rules: [
          "每个小组需准备一个科学实验",
          "实验需有明确的科学原理",
          "展示时间不超过10分钟",
          "需要准备实验报告"
        ],
        prizes: [
          "最佳实验奖：1名",
          "最佳展示奖：1名",
          "最具创意奖：1名",
          "优秀参与奖：若干名"
        ],
        schedule: [
          "3月15日：实验准备阶段",
          "3月20日：实验展示",
          "3月25日：评选和颁奖"
        ]
      },
      candidates: [
        { id: 1, name: "实验小组A", votes: 8, avatar: "https://i.pravatar.cc/150?img=6" },
        { id: 2, name: "实验小组B", votes: 12, avatar: "https://i.pravatar.cc/150?img=7" },
        { id: 3, name: "实验小组C", votes: 15, avatar: "https://i.pravatar.cc/150?img=8" }
      ]
    }
  ];

  // 根据状态筛选活动
  const filteredActivities = filterStatus === 'all' 
    ? activities 
    : activities.filter(activity => activity.status === filterStatus);

  // 获取状态显示文本
  const getStatusText = (status) => {
    const statusMap = {
      upcoming: "即将开始",
      ongoing: "进行中",
      ended: "已结束"
    };
    return statusMap[status] || status;
  };

  // 获取状态样式类
  const getStatusClass = (status) => {
    return `status-${status}`;
  };

  // 处理活动点击
  const handleActivityClick = (activity) => {
    setSelectedActivity(activity);
  };

  // 返回活动列表
  const handleBackToList = () => {
    setSelectedActivity(null);
  };

  // 如果选择了活动，显示详情页
  if (selectedActivity) {
    return (
      <ActivityDetail 
        activity={selectedActivity} 
        onBack={handleBackToList}
      />
    );
  }

  return (
    <div className="activities-container">
      <div className="activities-header">
        <h1>🎉 活动中心</h1>
        <p>发现精彩活动，参与投票，支持优秀的小朋友</p>
      </div>

      {/* 状态筛选 */}
      <div className="status-filters">
        <button 
          className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
          onClick={() => setFilterStatus('all')}
        >
          全部
        </button>
        <button 
          className={`filter-btn ${filterStatus === 'upcoming' ? 'active' : ''}`}
          onClick={() => setFilterStatus('upcoming')}
        >
          即将开始
        </button>
        <button 
          className={`filter-btn ${filterStatus === 'ongoing' ? 'active' : ''}`}
          onClick={() => setFilterStatus('ongoing')}
        >
          进行中
        </button>
        <button 
          className={`filter-btn ${filterStatus === 'ended' ? 'active' : ''}`}
          onClick={() => setFilterStatus('ended')}
        >
          已结束
        </button>
      </div>

      {/* 活动列表 */}
      <div className="activities-grid">
        {filteredActivities.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📅</span>
            <p>暂无{filterStatus === 'all' ? '' : getStatusText(filterStatus)}活动</p>
          </div>
        ) : (
          filteredActivities.map(activity => (
            <div 
              key={activity.id} 
              className={`activity-card ${getStatusClass(activity.status)}`}
              onClick={() => handleActivityClick(activity)}
            >
              <div className="activity-image-container">
                <img 
                  src={activity.image} 
                  alt={activity.title}
                  className="activity-image"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/400x250?text=活动图片';
                  }}
                />
                <div className={`activity-status-badge ${getStatusClass(activity.status)}`}>
                  {getStatusText(activity.status)}
                </div>
              </div>
              
              <div className="activity-content">
                <div className="activity-category">{activity.category}</div>
                <h3 className="activity-title">{activity.title}</h3>
                <p className="activity-description">{activity.description}</p>
                
                <div className="activity-meta">
                  <div className="meta-item">
                    <span className="meta-icon">📅</span>
                    <span>{activity.startDate}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-icon">📍</span>
                    <span>{activity.location}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-icon">👥</span>
                    <span>{activity.participants} 人参与</span>
                  </div>
                </div>

                {activity.status === 'ongoing' && activity.candidates.length > 0 && (
                  <div className="voting-preview">
                    <span className="voting-icon">🗳️</span>
                    <span>正在进行投票 ({activity.candidates.length} 位候选者)</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Activities;
