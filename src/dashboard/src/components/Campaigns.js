import React, { useState, useEffect } from 'react';
import './Campaigns.css';

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [testResults, setTestResults] = useState({});

  // Fetch campaigns when component loads
  useEffect(() => {
    fetchCampaigns();
  }, []);

  /**
   * Fetch campaigns from backend API
   */
  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:3000/api/campaigns', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCampaigns(data.campaigns || []);
        setError(null);
      } else {
        throw new Error('Failed to fetch campaigns');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Test post for a specific campaign
   */
  const testCampaignPost = async (campaignId) => {
    try {
      setTestResults(prev => ({
        ...prev,
        [campaignId]: { loading: true }
      }));

      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:3000/api/campaigns/${campaignId}/test-post`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      setTestResults(prev => ({
        ...prev,
        [campaignId]: {
          loading: false,
          success: result.success,
          data: result,
          timestamp: new Date().toISOString()
        }
      }));

      // Refresh campaigns to get updated stats
      fetchCampaigns();

    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [campaignId]: {
          loading: false,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        }
      }));
    }
  };

  /**
   * Toggle campaign status
   */
  const toggleCampaign = async (campaignId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      
      const response = await fetch(`http://localhost:3000/api/campaigns/${campaignId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchCampaigns(); // Refresh the list
      }
    } catch (error) {
      console.error('Error toggling campaign:', error);
    }
  };

  /**
   * Format platforms array for display
   */
  const formatPlatforms = (platforms) => {
    try {
      const platformArray = typeof platforms === 'string' ? JSON.parse(platforms) : platforms;
      return Array.isArray(platformArray) ? platformArray.join(', ') : 'No platforms';
    } catch {
      return 'No platforms';
    }
  };

  /**
   * Get status badge color
   */
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#28a745';
      case 'paused': return '#ffc107';
      case 'stopped': return '#dc3545';
      default: return '#6c757d';
    }
  };

  /**
   * Format time ago
   */
  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Never';
    
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="campaigns-container">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading campaigns...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="campaigns-container">
        <div className="error-message">
          <h3>❌ Error Loading Campaigns</h3>
          <p>{error}</p>
          <button onClick={fetchCampaigns} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="campaigns-container">
      <div className="campaigns-header">
        <h2>📝 Campaign Management</h2>
        <p>Manage your social media automation campaigns</p>
        <button className="refresh-button" onClick={fetchCampaigns}>
          🔄 Refresh
        </button>
      </div>

      {campaigns.length === 0 ? (
        <div className="no-campaigns">
          <h3>No Campaigns Found</h3>
          <p>Create your first campaign to get started with social media automation!</p>
          <div className="create-campaign-hint">
            <p>💡 You can create campaigns using the API endpoint:</p>
            <code>POST /api/campaigns</code>
          </div>
        </div>
      ) : (
        <div className="campaigns-grid">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="campaign-card">
              <div className="campaign-header">
                <h3>{campaign.name || `Campaign ${campaign.id}`}</h3>
                <div 
                  className="status-badge" 
                  style={{ backgroundColor: getStatusColor(campaign.status) }}
                >
                  {campaign.status || 'unknown'}
                </div>
              </div>

              <div className="campaign-content">
                <p className="content-preview">
                  {campaign.content ? 
                    (campaign.content.length > 100 ? 
                      campaign.content.substring(0, 100) + '...' : 
                      campaign.content
                    ) : 
                    'No content'
                  }
                </p>
              </div>

              <div className="campaign-details">
                <div className="detail-row">
                  <span className="label">Platforms:</span>
                  <span className="value">{formatPlatforms(campaign.platforms)}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Interval:</span>
                  <span className="value">{campaign.intervalHours || 2} hours</span>
                </div>
                <div className="detail-row">
                  <span className="label">Last Posted:</span>
                  <span className="value">{formatTimeAgo(campaign.lastPostedAt)}</span>
                </div>
              </div>

              <div className="campaign-stats">
                <div className="stat">
                  <span className="stat-value">{campaign.totalPosts || 0}</span>
                  <span className="stat-label">Total Posts</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{campaign.successfulPosts || 0}</span>
                  <span className="stat-label">Successful</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{campaign.successRate || 0}%</span>
                  <span className="stat-label">Success Rate</span>
                </div>
              </div>

              <div className="campaign-actions">
                <button
                  className={`action-button ${campaign.status === 'active' ? 'pause' : 'start'}`}
                  onClick={() => toggleCampaign(campaign.id, campaign.status)}
                >
                  {campaign.status === 'active' ? '⏸️ Pause' : '▶️ Start'}
                </button>

                <button
                  className="action-button test"
                  onClick={() => testCampaignPost(campaign.id)}
                  disabled={testResults[campaign.id]?.loading}
                >
                  {testResults[campaign.id]?.loading ? '⏳ Testing...' : '🧪 Test Post'}
                </button>
              </div>

              {/* Test Results */}
              {testResults[campaign.id] && !testResults[campaign.id].loading && (
                <div className={`test-results ${testResults[campaign.id].success ? 'success' : 'error'}`}>
                  <h4>{testResults[campaign.id].success ? '✅ Test Successful' : '❌ Test Failed'}</h4>
                  {testResults[campaign.id].success ? (
                    <div className="results-summary">
                      <p>Posted to {testResults[campaign.id].data?.stats?.successful || 0} platforms</p>
                      <p>Success Rate: {testResults[campaign.id].data?.stats?.successRate || 0}%</p>
                    </div>
                  ) : (
                    <div className="error-details">
                      <p>{testResults[campaign.id].error || 'Unknown error occurred'}</p>
                    </div>
                  )}
                  <small>Tested {formatTimeAgo(testResults[campaign.id].timestamp)}</small>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Campaigns;