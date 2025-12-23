import React, { useState } from 'react';
import VotingPanel from './VotingPanel';
import './activities.css';

const ActivityDetail = ({ activity, onBack }) => {
  const [showVoting, setShowVoting] = useState(false);

  const getStatusText = (status) => {
    const statusMap = {
      upcoming: "即将开始",
      ongoing: "进行中",
      ended: "已结束"
    };
    return statusMap[status] || status;
  };

  const getStatusClass = (status) => {
    return `status-${status}`;
  };

  if (showVoting) {
    return (
      <VotingPanel 
        activity={activity}
        onBack={() => setShowVoting(false)}
      />
    );
  }

  return (
    <div className="activity-detail-container">
      <button className="back-button" onClick={onBack}>
        ← 返回活动列表
      </button>

      <div className="activity-detail-header">
        <div className="activity-detail-image-container">
          <img 
            src={activity.image} 
            alt={activity.title}
            className="activity-detail-image"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/800x400?text=活动图片';
            }}
          />
          <div className={`activity-detail-status-badge ${getStatusClass(activity.status)}`}>
            {getStatusText(activity.status)}
          </div>
        </div>

        <div className="activity-detail-info">
          <div className="activity-detail-category">{activity.category}</div>
          <h1 className="activity-detail-title">{activity.title}</h1>
          <p className="activity-detail-description">{activity.description}</p>

          <div className="activity-detail-meta-grid">
            <div className="detail-meta-item">
              <span className="detail-meta-icon">📅</span>
              <div>
                <div className="detail-meta-label">开始日期</div>
                <div className="detail-meta-value">{activity.startDate}</div>
              </div>
            </div>
            <div className="detail-meta-item">
              <span className="detail-meta-icon">📅</span>
              <div>
                <div className="detail-meta-label">结束日期</div>
                <div className="detail-meta-value">{activity.endDate}</div>
              </div>
            </div>
            <div className="detail-meta-item">
              <span className="detail-meta-icon">📍</span>
              <div>
                <div className="detail-meta-label">活动地点</div>
                <div className="detail-meta-value">{activity.location}</div>
              </div>
            </div>
            <div className="detail-meta-item">
              <span className="detail-meta-icon">👥</span>
              <div>
                <div className="detail-meta-label">参与人数</div>
                <div className="detail-meta-value">{activity.participants} 人</div>
              </div>
            </div>
            <div className="detail-meta-item">
              <span className="detail-meta-icon">👤</span>
              <div>
                <div className="detail-meta-label">组织者</div>
                <div className="detail-meta-value">{activity.organizer}</div>
              </div>
            </div>
          </div>

          {activity.status === 'ongoing' && activity.candidates.length > 0 && (
            <button 
              className="voting-button"
              onClick={() => setShowVoting(true)}
            >
              🗳️ 参与投票
            </button>
          )}
        </div>
      </div>

      <div className="activity-detail-content">
        {/* 活动介绍 */}
        <div className="detail-section">
          <h2 className="detail-section-title">📖 活动介绍</h2>
          <p className="detail-section-text">{activity.details.introduction}</p>
        </div>

        {/* 活动规则 */}
        {activity.details.rules && activity.details.rules.length > 0 && (
          <div className="detail-section">
            <h2 className="detail-section-title">📋 活动规则</h2>
            <ul className="detail-list">
              {activity.details.rules.map((rule, index) => (
                <li key={index}>{rule}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 活动安排 */}
        {activity.details.schedule && activity.details.schedule.length > 0 && (
          <div className="detail-section">
            <h2 className="detail-section-title">📅 活动安排</h2>
            <ul className="detail-list">
              {activity.details.schedule.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 奖项设置 */}
        {activity.details.prizes && activity.details.prizes.length > 0 && (
          <div className="detail-section">
            <h2 className="detail-section-title">🏆 奖项设置</h2>
            <ul className="detail-list">
              {activity.details.prizes.map((prize, index) => (
                <li key={index}>{prize}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 投票预览（仅进行中的活动） */}
        {activity.status === 'ongoing' && activity.candidates.length > 0 && (
          <div className="detail-section">
            <h2 className="detail-section-title">🗳️ 投票情况</h2>
            <div className="voting-preview-list">
              {activity.candidates
                .sort((a, b) => b.votes - a.votes)
                .slice(0, 3)
                .map((candidate, index) => (
                  <div key={candidate.id} className="voting-preview-item">
                    <div className="voting-rank">#{index + 1}</div>
                    <img 
                      src={candidate.avatar} 
                      alt={candidate.name}
                      className="voting-avatar"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/60?text=' + candidate.name;
                      }}
                    />
                    <div className="voting-info">
                      <div className="voting-name">{candidate.name}</div>
                      <div className="voting-count">{candidate.votes} 票</div>
                    </div>
                  </div>
                ))}
            </div>
            <button 
              className="view-all-voting-button"
              onClick={() => setShowVoting(true)}
            >
              查看全部并投票 →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityDetail;


