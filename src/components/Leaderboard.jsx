import { useState, useEffect, useCallback, memo } from 'react';
import apiService from '../services/api';

const Leaderboard = memo(({ onClose, allData }) => {
  const [selectedVertical, setSelectedVertical] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('vertical'); // 'vertical' or 'user'
  const [userLeaderboardData, setUserLeaderboardData] = useState([]);

  // Calculate user-wise leaderboard from vertical data
  const calculateUserLeaderboard = useCallback((verticals) => {
    const userMap = {};

    verticals.forEach(vertical => {
      // Process final contributors
      if (vertical.topFinalContributors && vertical.topFinalContributors.length > 0) {
        vertical.topFinalContributors.forEach(contributor => {
          if (!userMap[contributor.email]) {
            userMap[contributor.email] = {
              email: contributor.email,
              totalVideos: 0,
              finalVideos: 0,
              reEditVideos: 0,
              totalEarnings: 0,
              verticals: []
            };
          }
          userMap[contributor.email].totalVideos += contributor.count;
          userMap[contributor.email].finalVideos += contributor.count;
          userMap[contributor.email].totalEarnings += contributor.earnings || (contributor.count * 50);
          userMap[contributor.email].verticals.push({
            name: vertical.name,
            type: 'final',
            count: contributor.count,
            earnings: contributor.earnings || (contributor.count * 50)
          });
        });
      }

      // Process re-edit contributors
      if (vertical.topReEditContributors && vertical.topReEditContributors.length > 0) {
        vertical.topReEditContributors.forEach(contributor => {
          if (!userMap[contributor.email]) {
            userMap[contributor.email] = {
              email: contributor.email,
              totalVideos: 0,
              finalVideos: 0,
              reEditVideos: 0,
              totalEarnings: 0,
              verticals: []
            };
          }
          userMap[contributor.email].totalVideos += contributor.count;
          userMap[contributor.email].reEditVideos += contributor.count;
          userMap[contributor.email].totalEarnings += contributor.earnings || (contributor.count * 50);
          userMap[contributor.email].verticals.push({
            name: vertical.name,
            type: 're-edit',
            count: contributor.count,
            earnings: contributor.earnings || (contributor.count * 50)
          });
        });
      }
    });

    const userList = Object.values(userMap)
      .sort((a, b) => b.totalVideos - a.totalVideos);

    setUserLeaderboardData(userList);
  }, []);

  // Fetch leaderboard data from backend API
  useEffect(() => {
    let isMounted = true;

    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🔄 Fetching leaderboard data...');
        const startTime = performance.now();
        const response = await apiService.getLeaderboard();
        const endTime = performance.now();
        console.log(`✅ Leaderboard response received in ${(endTime - startTime).toFixed(2)}ms:`, response);

        if (!isMounted) {
          console.log('⚠️ Component unmounted, ignoring response');
          return;
        }

        if (response && response.success) {
          console.log(`📊 Setting leaderboard data: ${response.leaderboard?.length || 0} verticals`);
          setLeaderboardData(response.leaderboard || []);
          setSummary(response.summary || null);

          // Calculate user leaderboard from vertical data
          if (response.leaderboard && response.leaderboard.length > 0) {
            calculateUserLeaderboard(response.leaderboard);
          }

          console.log('✅ Leaderboard data set successfully');
        } else {
          const errorMsg = response?.error || 'Failed to fetch leaderboard data';
          console.error('❌ Leaderboard error:', errorMsg);
          setError(errorMsg);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('❌ Error fetching leaderboard:', err);
        const errorMsg = err.response?.data?.error || err.message || 'An error occurred while fetching leaderboard';
        setError(errorMsg);
      } finally {
        if (isMounted) {
          console.log('🏁 Setting loading to false');
          setLoading(false);
        }
      }
    };

    fetchLeaderboard();

    return () => {
      console.log('🧹 Leaderboard component cleanup');
      isMounted = false;
    };
  }, []); // Empty dependency array - only run once on mount

  // Fallback: Calculate leaderboard from allData if API fails (not used anymore)
  const calculateLeaderboardFromData = (data) => {
    const verticalCounts = {};

    data.forEach(item => {
      const vertical = item['Vertical Name'];
      if (vertical) {
        if (!verticalCounts[vertical]) {
          verticalCounts[vertical] = {
            name: vertical,
            totalVideos: 0,
            finalVideos: 0,
            reEditVideos: 0,
            exams: new Set(),
            subjects: new Set(),
            topContributors: []
          };
        }

        verticalCounts[vertical].totalVideos++;

        const statusRaw = item['Edit'] || item['Status'] || '';
        const status = String(statusRaw).trim().toLowerCase();

        if (status === 'final' || status.includes('final')) {
          verticalCounts[vertical].finalVideos++;
        } else if (status === 're-edit' || status === 'reedit' ||
                   status.includes('re-edit') || status.includes('reedit')) {
          verticalCounts[vertical].reEditVideos++;
        }

        if (item['Exam Name']) {
          verticalCounts[vertical].exams.add(item['Exam Name']);
        }
        if (item['Subject']) {
          verticalCounts[vertical].subjects.add(item['Subject']);
        }
      }
    });

    const result = Object.values(verticalCounts)
      .map(v => ({
        ...v,
        examsCount: v.exams.size,
        subjectsCount: v.subjects.size,
        exams: Array.from(v.exams),
        subjects: Array.from(v.subjects)
      }))
      .sort((a, b) => b.totalVideos - a.totalVideos);

    setLeaderboardData(result);
    setSummary({
      totalVerticals: result.length,
      totalVideos: data.length,
      totalFinalVideos: result.reduce((sum, v) => sum + v.finalVideos, 0),
      totalReEditVideos: result.reduce((sum, v) => sum + v.reEditVideos, 0)
    });
  };

  // Get selected vertical data
  const getSelectedVerticalData = () => {
    return leaderboardData.find(v => v.name === selectedVertical);
  };

  // Medal emojis for top 3
  const getMedalEmoji = (rank) => {
    switch (rank) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return `${rank + 1}.`;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal leaderboard-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🏆 Leaderboard</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="view-mode-toggle">
          <button
            className={`toggle-btn ${viewMode === 'vertical' ? 'active' : ''}`}
            onClick={() => setViewMode('vertical')}
          >
            📊 Vertical-wise
          </button>
          <button
            className={`toggle-btn ${viewMode === 'user' ? 'active' : ''}`}
            onClick={() => setViewMode('user')}
          >
            👤 User-wise
          </button>
        </div>

        <div className="leaderboard-content">
          {/* Main Leaderboard */}
          {!selectedVertical ? (
            <>
              <div className="leaderboard-description">
                <p>{viewMode === 'vertical' ? 'Top performing verticals ranked by total video submissions' : 'Top performing users ranked by total video contributions'}</p>
                {loading ? (
                  <div className="loading-message">Loading leaderboard...</div>
                ) : error ? (
                  <div className="error-message">⚠️ {error}</div>
                ) : summary ? (
                  <div className="leaderboard-stats">
                    <span className="stat-badge">
                      📊 Total Verticals: <strong>{summary.totalVerticals || leaderboardData.length}</strong>
                    </span>
                    <span className="stat-badge">
                      🎬 Total Videos: <strong>{summary.totalVideos || 0}</strong>
                    </span>
                    <span className="stat-badge">
                      ✅ Final Videos: <strong>{summary.totalFinalVideos || 0}</strong>
                    </span>
                    <span className="stat-badge">
                      🔄 Re-edit Videos: <strong>{summary.totalReEditVideos || 0}</strong>
                    </span>
                  </div>
                ) : (
                  <div className="leaderboard-stats">
                    <span className="stat-badge">
                      📊 Total Verticals: <strong>{leaderboardData.length}</strong>
                    </span>
                  </div>
                )}
              </div>

              {loading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Loading leaderboard data...</p>
                </div>
              ) : error && leaderboardData.length === 0 ? (
                <div className="no-data">
                  <p>❌ {error}</p>
                  <p>Unable to load leaderboard data</p>
                </div>
              ) : viewMode === 'vertical' ? (
                <div className="leaderboard-list">
                  {leaderboardData.map((vertical, index) => {
                    const totalEarnings = vertical.totalVideos * 50;
                    return (
                      <div
                        key={vertical.name}
                        className={`leaderboard-item ${index < 3 ? 'top-three' : ''}`}
                        onClick={() => setSelectedVertical(vertical.name)}
                      >
                        <div className="rank-section">
                          <span className="rank-badge">
                            {getMedalEmoji(index)}
                          </span>
                        </div>
                        <div className="vertical-info">
                          <h3>{vertical.name}</h3>
                          <div className="vertical-stats">
                            <span>📹 {vertical.totalVideos} total</span>
                            <span>✅ {vertical.finalVideos} final</span>
                            <span>🔄 {vertical.reEditVideos} re-edit</span>
                          </div>
                        </div>
                        <div className="earnings-section">
                          <div className="earnings-badge">₹{totalEarnings}</div>
                        </div>
                        <div className="view-details">
                          <span>View Details →</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="leaderboard-list">
                  {userLeaderboardData.map((user, index) => (
                    <div
                      key={user.email}
                      className={`leaderboard-item ${index < 3 ? 'top-three' : ''}`}
                    >
                      <div className="rank-section">
                        <span className="rank-badge">
                          {getMedalEmoji(index)}
                        </span>
                      </div>
                      <div className="vertical-info">
                        <h3>{user.email}</h3>
                        <div className="vertical-stats">
                          <span>✅ {user.finalVideos} final</span>
                          <span>🔄 {user.reEditVideos} re-edit</span>
                          <span>📊 {user.verticals.length} verticals</span>
                        </div>
                      </div>
                      <div className="earnings-section">
                        <div className="earnings-badge">₹{user.totalEarnings}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!loading && !error && leaderboardData.length === 0 && (
                <div className="no-data">
                  <p>No leaderboard data available</p>
                </div>
              )}
            </>
          ) : (
            // Vertical Details View
            <>
              <button
                className="back-button"
                onClick={() => setSelectedVertical(null)}
              >
                ← Back to Leaderboard
              </button>

              <div className="vertical-details">
                <h3 className="vertical-title">{selectedVertical}</h3>

                {(() => {
                  const verticalData = getSelectedVerticalData();
                  if (!verticalData) {
                    return (
                      <div className="no-data">
                        <p>No data available for this vertical</p>
                      </div>
                    );
                  }

                  return (
                    <>
                      {/* Top Contributors - Combined Final and Re-edit */}
                      {(() => {
                        // Combine final and re-edit contributors
                        const allContributors = {};

                        // Add final contributors
                        if (verticalData.topFinalContributors) {
                          verticalData.topFinalContributors.forEach(contributor => {
                            if (!allContributors[contributor.email]) {
                              allContributors[contributor.email] = {
                                email: contributor.email,
                                finalCount: 0,
                                reEditCount: 0,
                                totalCount: 0,
                                totalEarnings: 0
                              };
                            }
                            allContributors[contributor.email].finalCount += contributor.count;
                            allContributors[contributor.email].totalCount += contributor.count;
                            allContributors[contributor.email].totalEarnings += contributor.earnings || (contributor.count * 50);
                          });
                        }

                        // Add re-edit contributors
                        if (verticalData.topReEditContributors) {
                          verticalData.topReEditContributors.forEach(contributor => {
                            if (!allContributors[contributor.email]) {
                              allContributors[contributor.email] = {
                                email: contributor.email,
                                finalCount: 0,
                                reEditCount: 0,
                                totalCount: 0,
                                totalEarnings: 0
                              };
                            }
                            allContributors[contributor.email].reEditCount += contributor.count;
                            allContributors[contributor.email].totalCount += contributor.count;
                            allContributors[contributor.email].totalEarnings += contributor.earnings || (contributor.count * 50);
                          });
                        }

                        // Convert to array and sort by total count
                        const contributorsList = Object.values(allContributors)
                          .sort((a, b) => b.totalCount - a.totalCount)
                          .slice(0, 5); // Top 5

                        if (contributorsList.length === 0) return null;

                        return (
                          <div className="top-contributors">
                            <h4>🌟 Top Contributors & Earnings</h4>
                            <div className="contributors-list">
                              {contributorsList.map((contributor, index) => (
                                <div key={contributor.email} className="contributor-item">
                                  <span className="contributor-rank">{getMedalEmoji(index)}</span>
                                  <div className="contributor-info">
                                    <span className="contributor-email">{contributor.email}</span>
                                    <span className="contributor-stats">
                                      {contributor.finalCount > 0 && `✅ ${contributor.finalCount} final`}
                                      {contributor.finalCount > 0 && contributor.reEditCount > 0 && ' • '}
                                      {contributor.reEditCount > 0 && `🔄 ${contributor.reEditCount} re-edit`}
                                      {' • '}₹{contributor.totalEarnings}
                                    </span>
                                  </div>
                                  <span className="contributor-earnings">₹{contributor.totalEarnings}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Vertical Summary */}
                      <div className="vertical-summary">
                        <div className="summary-card">
                          <div className="summary-icon">📊</div>
                          <div className="summary-content">
                            <h4>{verticalData.totalVideos || 0}</h4>
                            <p>Total Videos</p>
                          </div>
                        </div>
                        <div className="summary-card">
                          <div className="summary-icon">✅</div>
                          <div className="summary-content">
                            <h4>{verticalData.finalVideos || 0}</h4>
                            <p>Final Videos</p>
                          </div>
                        </div>
                        <div className="summary-card">
                          <div className="summary-icon">🔄</div>
                          <div className="summary-content">
                            <h4>{verticalData.reEditVideos || 0}</h4>
                            <p>Re-edit Videos</p>
                          </div>
                        </div>
                        {verticalData.examsCount > 0 && (
                          <div className="summary-card">
                            <div className="summary-icon">📚</div>
                            <div className="summary-content">
                              <h4>{verticalData.examsCount}</h4>
                              <p>Exams</p>
                            </div>
                          </div>
                        )}
                        {verticalData.subjectsCount > 0 && (
                          <div className="summary-card">
                            <div className="summary-icon">📖</div>
                            <div className="summary-content">
                              <h4>{verticalData.subjectsCount}</h4>
                              <p>Subjects</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .leaderboard-modal {
          max-width: 900px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .view-mode-toggle {
          display: flex;
          gap: 1rem;
          justify-content: center;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 12px;
          margin: 1rem 0;
        }

        .toggle-btn {
          flex: 1;
          padding: 0.75rem 1.5rem;
          border: 2px solid #e0e0e0;
          background: white;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .toggle-btn:hover {
          border-color: #ec4899;
          transform: translateY(-2px);
        }

        .toggle-btn.active {
          background: linear-gradient(135deg, #ec4899 0%, #ef4444 100%);
          color: white;
          border-color: #ec4899;
        }

        .leaderboard-content {
          padding: 1rem 0;
        }

        .earnings-section {
          display: flex;
          align-items: center;
          margin-left: auto;
        }

        .earnings-badge {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 20px;
          font-size: 1.25rem;
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
          white-space: nowrap;
        }

        .leaderboard-description {
          text-align: center;
          margin-bottom: 2rem;
        }

        .leaderboard-description p {
          color: #666;
          font-size: 1.1rem;
          margin-bottom: 1rem;
        }

        .leaderboard-stats {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .stat-badge {
          background: linear-gradient(135deg, #ec4899 0%, #ef4444 100%);
          color: white;
          padding: 0.5rem 1.5rem;
          border-radius: 20px;
          font-size: 0.9rem;
        }

        .leaderboard-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .leaderboard-item {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 1.5rem;
          background: #f8f9fa;
          border-radius: 12px;
          transition: all 0.3s ease;
          cursor: pointer;
          border: 2px solid transparent;
        }

        .leaderboard-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
          border-color: #ec4899;
        }

        .leaderboard-item.top-three {
          background: linear-gradient(135deg, #fff5e6 0%, #ffe5f0 100%);
          border: 2px solid #ffd700;
        }

        .rank-section {
          flex-shrink: 0;
        }

        .rank-badge {
          font-size: 2.5rem;
          display: block;
        }

        .vertical-info {
          flex: 1;
        }

        .vertical-info h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.5rem;
          color: #333;
        }

        .vertical-stats {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          font-size: 0.9rem;
          color: #666;
        }

        .vertical-stats span {
          background: white;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-weight: 500;
        }

        .view-details {
          color: #ec4899;
          font-weight: 600;
          white-space: nowrap;
        }

        .no-data {
          text-align: center;
          padding: 3rem;
          color: #999;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          gap: 1rem;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #ec4899;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .loading-message {
          color: #ec4899;
          font-weight: 500;
          margin-top: 0.5rem;
        }

        .error-message {
          color: #dc3545;
          font-weight: 500;
          margin-top: 0.5rem;
          padding: 0.5rem;
          background: #f8d7da;
          border-radius: 8px;
        }

        .back-button {
          background: #6c757d;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
          margin-bottom: 1.5rem;
          transition: background 0.3s;
        }

        .back-button:hover {
          background: #5a6268;
        }

        .vertical-details {
          padding: 1rem 0;
        }

        .vertical-title {
          font-size: 2rem;
          color: #333;
          margin-bottom: 1.5rem;
          text-align: center;
          background: linear-gradient(135deg, #ec4899 0%, #ef4444 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .top-contributors {
          background: #f8f9fa;
          padding: 1.5rem;
          border-radius: 12px;
          margin-bottom: 2rem;
        }

        .top-contributors h4 {
          margin: 0 0 1rem 0;
          font-size: 1.3rem;
          color: #333;
        }

        .contributors-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .contributor-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.25rem;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
        }

        .contributor-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(236, 72, 153, 0.15);
        }

        .contributor-item.reedit-contributor {
          background: #fff8e1;
          border-left: 4px solid #ff9800;
        }

        .contributor-item.reedit-contributor:hover {
          box-shadow: 0 4px 12px rgba(255, 152, 0, 0.15);
        }

        .contributor-rank {
          font-size: 2rem;
          flex-shrink: 0;
        }

        .contributor-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .contributor-email {
          font-weight: 600;
          color: #333;
          font-size: 0.95rem;
        }

        .contributor-stats {
          font-size: 0.85rem;
          color: #666;
        }

        .contributor-earnings {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 1rem;
          font-weight: 700;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .contributor-count {
          background: #ec4899;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .vertical-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .summary-card {
          background: linear-gradient(135deg, #ec4899 0%, #ef4444 100%);
          color: white;
          padding: 1.5rem;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .summary-icon {
          font-size: 2.5rem;
        }

        .summary-content h4 {
          margin: 0;
          font-size: 2rem;
          font-weight: bold;
        }

        .summary-content p {
          margin: 0.25rem 0 0 0;
          opacity: 0.9;
          font-size: 0.9rem;
        }

        @media (max-width: 768px) {
          .leaderboard-item {
            flex-direction: column;
            text-align: center;
          }

          .vertical-stats {
            justify-content: center;
          }

          .vertical-summary {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
});

Leaderboard.displayName = 'Leaderboard';

export default Leaderboard;
