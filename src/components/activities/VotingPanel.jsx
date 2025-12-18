import React, { useState } from 'react';
import './activities.css';

const VotingPanel = ({ activity, onBack }) => {
  const [candidates, setCandidates] = useState([...activity.candidates]);
  const [votedCandidate, setVotedCandidate] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);

  // 处理投票
  const handleVote = (candidateId) => {
    if (hasVoted) {
      alert('您已经投过票了！');
      return;
    }

    const updatedCandidates = candidates.map(candidate => {
      if (candidate.id === candidateId) {
        return { ...candidate, votes: candidate.votes + 1 };
      }
      return candidate;
    });

    setCandidates(updatedCandidates);
    setVotedCandidate(candidateId);
    setHasVoted(true);
    alert('投票成功！感谢您的参与！');
  };

  // 按票数排序
  const sortedCandidates = [...candidates].sort((a, b) => b.votes - a.votes);

  return (
    <div className="voting-panel-container">
      <button className="back-button" onClick={onBack}>
        ← 返回活动详情
      </button>

      <div className="voting-panel-header">
        <h1>🗳️ {activity.title} - 投票</h1>
        <p>请为您认为表现突出的小朋友投票</p>
        {hasVoted && (
          <div className="voted-notice">
            ✅ 您已成功投票！
          </div>
        )}
      </div>

      <div className="voting-candidates-grid">
        {sortedCandidates.map((candidate, index) => {
          const isVoted = votedCandidate === candidate.id;
          const percentage = candidates.reduce((sum, c) => sum + c.votes, 0) > 0
            ? Math.round((candidate.votes / candidates.reduce((sum, c) => sum + c.votes, 0)) * 100)
            : 0;

          return (
            <div 
              key={candidate.id} 
              className={`voting-candidate-card ${isVoted ? 'voted' : ''} ${index === 0 ? 'top-vote' : ''}`}
            >
              {index === 0 && (
                <div className="top-badge">🏆 当前第一</div>
              )}
              
              <div className="candidate-rank">#{index + 1}</div>
              
              <div className="candidate-avatar-container">
                <img 
                  src={candidate.avatar} 
                  alt={candidate.name}
                  className="candidate-avatar"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/120?text=' + candidate.name;
                  }}
                />
                {isVoted && (
                  <div className="voted-checkmark">✓</div>
                )}
              </div>

              <div className="candidate-info">
                <h3 className="candidate-name">{candidate.name}</h3>
                <div className="candidate-votes">
                  <span className="votes-count">{candidate.votes} 票</span>
                  <div className="votes-bar">
                    <div 
                      className="votes-bar-fill" 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="votes-percentage">{percentage}%</span>
                </div>
              </div>

              <button
                className={`vote-button ${isVoted ? 'voted' : ''}`}
                onClick={() => handleVote(candidate.id)}
                disabled={hasVoted}
              >
                {isVoted ? '✓ 已投票' : '投票支持'}
              </button>
            </div>
          );
        })}
      </div>

      <div className="voting-summary">
        <div className="summary-item">
          <span className="summary-label">总票数：</span>
          <span className="summary-value">
            {candidates.reduce((sum, c) => sum + c.votes, 0)} 票
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">候选人数：</span>
          <span className="summary-value">{candidates.length} 人</span>
        </div>
      </div>
    </div>
  );
};

export default VotingPanel;
