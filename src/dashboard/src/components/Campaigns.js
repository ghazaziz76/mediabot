import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './Campaigns.css';

const Campaigns = () => {
  const location = useLocation();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [testResults, setTestResults] = useState({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showThreadsForm, setShowThreadsForm] = useState(false);
  const [showQuickPost, setShowQuickPost] = useState(false);
  
  // Form state for regular campaign creation
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    platforms: [],
    intervalHours: 2,
    mediaFiles: []
  });

  // Form state for Threads-specific campaign
  const [threadsFormData, setThreadsFormData] = useState({
    name: '',
    content: '',
    intervalHours: 2,
    mediaFiles: [],
    // Threads-specific fields
    searchKeywords: [''],
    maxMentionsPerPost: 3,
    mentionCooldown: 24,
    targetAudience: 'all',
    manualUsers: '',
    avoidRecentMentions: true,
    engagementGoal: 'growth'
  });

  // Form state for Quick Post
  const [quickPostData, setQuickPostData] = useState({
    content: '',
    platforms: [],
    mediaFiles: []
  });

  // Fetch campaigns when component loads
  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Handle sidebar button clicks
  useEffect(() => {
    if (location.state?.openCreateForm) {
      setShowCreateForm(true);
      // Clear the state to prevent reopening on refresh
      window.history.replaceState({}, document.title);
    }
    if (location.state?.openQuickPost) {
      setShowQuickPost(true);
      // Clear the state to prevent reopening on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  /**
 * Fetch campaigns from backend API
 */
const fetchCampaigns = async () => {
  console.log('🔄 Fetching campaigns...'); // DEBUG
  
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
      console.log('📊 Fetched campaigns data:', data.campaigns); // DEBUG
      
       data.campaigns.forEach(campaign => {
        console.log(`Campaign ${campaign.id}: status="${campaign.status}", isActive=${campaign.isActive}`);
       });
      
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
  console.log(`🔄 Toggling campaign ${campaignId} from ${currentStatus}`); // DEBUG
  
  try {
    const token = localStorage.getItem('token');
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    
    console.log(`📤 Sending request to change status to: ${newStatus}`); // DEBUG
    
    const response = await fetch(`http://localhost:3000/api/campaigns/${campaignId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: newStatus })
    });

    console.log(`📥 Response status: ${response.status}`); // DEBUG

    if (response.ok) {
      console.log(`✅ Successfully toggled campaign`); // DEBUG
      fetchCampaigns();
    } else {
      console.log(`❌ Failed to toggle campaign`); // DEBUG
      const errorData = await response.json();
      console.log('Error data:', errorData); // DEBUG
    }
  } catch (error) {
    console.error('Error toggling campaign:', error);
  }
};

  /**
 * Delete a specific campaign
 */
const deleteCampaign = async (campaignId, campaignName) => {
  if (!window.confirm(`Are you sure you want to delete "${campaignName}"? This action cannot be undone.`)) {
    return;
  }

  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`http://localhost:3000/api/campaigns/${campaignId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      alert('Campaign deleted successfully!');
      fetchCampaigns(); // Refresh the list
    } else {
      throw new Error('Failed to delete campaign');
    }
  } catch (error) {
    console.error('Error deleting campaign:', error);
    alert('Failed to delete campaign. Please try again.');
  }
};

/**
 * Delete all campaigns
 */
const deleteAllCampaigns = async () => {
  if (!window.confirm(`Are you sure you want to delete ALL campaigns? This action cannot be undone.`)) {
    return;
  }

  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`http://localhost:3000/api/campaigns/all`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const result = await response.json();
      alert(`Deleted ${result.deletedCount} campaigns successfully!`);
      fetchCampaigns(); // Refresh the list
    } else {
      throw new Error('Failed to delete campaigns');
    }
  } catch (error) {
    console.error('Error deleting all campaigns:', error);
    alert('Failed to delete campaigns. Please try again.');
  }
};
  
  /**
   * Handle regular form input changes
   */
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox' && name === 'platforms') {
      setFormData(prev => ({
        ...prev,
        platforms: checked 
          ? [...prev.platforms, value]
          : prev.platforms.filter(platform => platform !== value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  /**
   * Handle Threads form input changes
   */
  const handleThreadsInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'searchKeywords') {
      // Handle keywords array
      const keywords = value.split(',').map(k => k.trim()).filter(k => k);
      setThreadsFormData(prev => ({
        ...prev,
        searchKeywords: keywords
      }));
    } else if (type === 'checkbox') {
      setThreadsFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setThreadsFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  /**
   * Handle Quick Post form input changes
   */
  const handleQuickPostChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox' && name === 'platforms') {
      setQuickPostData(prev => ({
        ...prev,
        platforms: checked 
          ? [...prev.platforms, value]
          : prev.platforms.filter(platform => platform !== value)
      }));
    } else {
      setQuickPostData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  /**
   * Handle media file upload for regular campaigns
   */
  const handleMediaUpload = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      mediaFiles: files
    }));
  };

  /**
   * Handle media file upload for Threads campaigns
   */
  const handleThreadsMediaUpload = (e) => {
    const files = Array.from(e.target.files);
    setThreadsFormData(prev => ({
      ...prev,
      mediaFiles: files
    }));
  };

  /**
   * Handle media file upload for Quick Post
   */
  const handleQuickPostMediaUpload = (e) => {
    const files = Array.from(e.target.files);
    setQuickPostData(prev => ({
      ...prev,
      mediaFiles: files
    }));
  };

  /**
   * Handle regular campaign creation
   */
  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      
      const campaignData = new FormData();
      campaignData.append('name', formData.name);
      campaignData.append('content', formData.content);
      campaignData.append('platforms', JSON.stringify(formData.platforms));
      campaignData.append('intervalHours', formData.intervalHours);
      campaignData.append('campaignType', 'regular');
      
      formData.mediaFiles.forEach((file) => {
        campaignData.append(`media`, file);
      });

      const response = await fetch('http://localhost:3000/api/campaigns', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: campaignData
      });

      if (response.ok) {
        setFormData({
          name: '',
          content: '',
          platforms: [],
          intervalHours: 2,
          mediaFiles: []
        });
        setShowCreateForm(false);
        fetchCampaigns();
        alert('Campaign created successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to create campaign: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Error creating campaign. Please try again.');
    }
  };

  /**
   * Handle Threads campaign creation
   */
  const handleCreateThreadsCampaign = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      
      const campaignData = new FormData();
      campaignData.append('name', threadsFormData.name);
      campaignData.append('content', threadsFormData.content);
      campaignData.append('platforms', JSON.stringify(['threads'])); // Only Threads
      campaignData.append('intervalHours', threadsFormData.intervalHours);
      campaignData.append('campaignType', 'threads_advanced');
      
      // Threads-specific data
      campaignData.append('threadsConfig', JSON.stringify({
        searchKeywords: threadsFormData.searchKeywords,
        maxMentionsPerPost: threadsFormData.maxMentionsPerPost,
        mentionCooldown: threadsFormData.mentionCooldown,
        targetAudience: threadsFormData.targetAudience,
        manualUsers: threadsFormData.manualUsers.split(',').map(u => u.trim()).filter(u => u),
        avoidRecentMentions: threadsFormData.avoidRecentMentions,
        engagementGoal: threadsFormData.engagementGoal
      }));
      
      threadsFormData.mediaFiles.forEach((file) => {
        campaignData.append(`media`, file);
      });

      const response = await fetch('http://localhost:3000/api/campaigns/threads', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: campaignData
      });

      if (response.ok) {
        setThreadsFormData({
          name: '',
          content: '',
          intervalHours: 2,
          mediaFiles: [],
          searchKeywords: [''],
          maxMentionsPerPost: 3,
          mentionCooldown: 24,
          targetAudience: 'all',
          manualUsers: '',
          avoidRecentMentions: true,
          engagementGoal: 'growth'
        });
        setShowThreadsForm(false);
        fetchCampaigns();
        alert('Threads Campaign created successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to create Threads campaign: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating Threads campaign:', error);
      alert('Error creating Threads campaign. Please try again.');
    }
  };

  /**
   * Handle Quick Post submission
   */
  const handleQuickPost = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      
      // For now, we'll just simulate a quick post
      // You can later add a real API endpoint for immediate posting
      alert(`Quick post simulated!\n\nContent: ${quickPostData.content}\nPlatforms: ${quickPostData.platforms.join(', ')}\n\nThis will be posted immediately to selected platforms.`);
      
      // Reset form and close
      setQuickPostData({
        content: '',
        platforms: [],
        mediaFiles: []
      });
      setShowQuickPost(false);
      
    } catch (error) {
      console.error('Error with quick post:', error);
      alert('Error with quick post. Please try again.');
    }
  };

  /**
   * Reset and close regular form
   */
  const closeForm = () => {
    setFormData({
      name: '',
      content: '',
      platforms: [],
      intervalHours: 2,
      mediaFiles: []
    });
    setShowCreateForm(false);
  };

  /**
   * Reset and close Threads form
   */
  const closeThreadsForm = () => {
    setThreadsFormData({
      name: '',
      content: '',
      intervalHours: 2,
      mediaFiles: [],
      searchKeywords: [''],
      maxMentionsPerPost: 3,
      mentionCooldown: 24,
      targetAudience: 'all',
      manualUsers: '',
      avoidRecentMentions: true,
      engagementGoal: 'growth'
    });
    setShowThreadsForm(false);
  };

  /**
   * Reset and close Quick Post form
   */
  const closeQuickPost = () => {
    setQuickPostData({
      content: '',
      platforms: [],
      mediaFiles: []
    });
    setShowQuickPost(false);
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
        <div className="header-content">
          <h2>📝 Campaign Management</h2>
          <p>Manage your social media automation campaigns</p>
        </div>
        <div className="header-buttons">
  <button className="refresh-button" onClick={fetchCampaigns}>
    🔄 Refresh
  </button>
  {campaigns.length > 0 && (
    <button className="delete-all-button" onClick={deleteAllCampaigns} style={{backgroundColor: '#dc3545', color: 'white'}}>
      🗑️ Delete All
    </button>
  )}
  <button className="create-button" onClick={() => setShowCreateForm(true)}>
    ➕ New Campaign
  </button>
  <button className="threads-button" onClick={() => setShowThreadsForm(true)}>
    🧵 Threads Campaign
  </button>
  <button className="quick-post-button" onClick={() => setShowQuickPost(true)} style={{backgroundColor: '#17a2b8', color: 'white'}}>
    📝 Quick Post
  </button>
</div>
      </div>

      {campaigns.length === 0 ? (
        <div className="no-campaigns">
          <h3>No Campaigns Found</h3>
          <p>Create your first campaign to get started with social media automation!</p>
          <div className="create-campaign-hint">
            <p>💡 Choose your campaign type:</p>
            <div className="campaign-options">
              <div className="campaign-option" onClick={() => setShowCreateForm(true)}>
                <h4>📱 Regular Campaign</h4>
                <p>Post to multiple platforms (Facebook, Twitter, LinkedIn, Instagram, TikTok, Threads)</p>
              </div>
              <div className="campaign-option" onClick={() => setShowThreadsForm(true)}>
                <h4>🧵 Threads Campaign</h4>
                <p>Advanced Threads strategy with user mentioning and community engagement</p>
              </div>
              <div className="campaign-option" onClick={() => setShowQuickPost(true)}>
                <h4>📝 Quick Post</h4>
                <p>Post immediately to selected platforms without creating a campaign</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="campaigns-grid">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="campaign-card">
              <div className="campaign-header">
                <h3>{campaign.name || `Campaign ${campaign.id}`}</h3>
                <div className="campaign-badges">
                  {campaign.campaignType === 'threads_advanced' && (
                    <div className="threads-badge">🧵 Threads+</div>
                  )}
                  <div 
                    className="status-badge" 
                    style={{ backgroundColor: getStatusColor(campaign.status) }}
                  >
                    {campaign.status || 'unknown'}
                  </div>
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
                {campaign.campaignType === 'threads_advanced' && (
                  <div className="detail-row">
                    <span className="label">Mentions:</span>
                    <span className="value">{campaign.totalMentions || 0} users mentioned</span>
                  </div>
                )}
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

  <button
    className="action-button delete"
    onClick={() => deleteCampaign(campaign.id, campaign.name)}
    style={{backgroundColor: '#dc3545', color: 'white'}}
  >
    🗑️ Delete
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

      {/* Quick Post Modal */}
      {showQuickPost && (
        <div className="modal-overlay" onClick={closeQuickPost}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📝 Quick Post</h3>
              <p>Post immediately to selected platforms</p>
              <button className="close-btn" onClick={closeQuickPost}>×</button>
            </div>
            
            <form onSubmit={handleQuickPost} className="campaign-form">
              <div className="form-row">
                <div className="form-group full-width">
                  <label htmlFor="quick-content">Post Content *</label>
                  <textarea 
                    id="quick-content"
                    name="content"
                    value={quickPostData.content}
                    onChange={handleQuickPostChange}
                    required 
                    placeholder="What's on your mind? This will be posted immediately..." 
                    rows="4"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Media Upload (Optional)</label>
                  <div className="file-upload-area">
                    <input 
                      type="file" 
                      id="quick-media"
                      onChange={handleQuickPostMediaUpload}
                      multiple
                      accept="image/*,video/*"
                      className="file-input"
                    />
                    <label htmlFor="quick-media" className="file-upload-label">
                      📎 Choose Images or Videos
                      <span className="file-upload-hint">Support: JPG, PNG, MP4, MOV</span>
                    </label>
                  </div>
                  {quickPostData.mediaFiles.length > 0 && (
                    <div className="selected-files">
                      <p>Selected files:</p>
                      <ul>
                        {quickPostData.mediaFiles.map((file, index) => (
                          <li key={index}>{file.name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group full-width">
                  <label>Select Platforms *</label>
                  <div className="platform-checkboxes">
                    <label className="platform-checkbox">
                      <input 
                        type="checkbox" 
                        name="platforms"
                        value="facebook" 
                        checked={quickPostData.platforms.includes('facebook')}
                        onChange={handleQuickPostChange}
                      />
                      <span className="checkmark"></span>
                      📘 Facebook
                    </label>
                    <label className="platform-checkbox">
                      <input 
                        type="checkbox" 
                        name="platforms"
                        value="twitter" 
                        checked={quickPostData.platforms.includes('twitter')}
                        onChange={handleQuickPostChange}
                      />
                      <span className="checkmark"></span>
                      🐦 Twitter
                    </label>
                    <label className="platform-checkbox">
                      <input 
                        type="checkbox" 
                        name="platforms"
                        value="linkedin" 
                        checked={quickPostData.platforms.includes('linkedin')}
                        onChange={handleQuickPostChange}
                      />
                      <span className="checkmark"></span>
                      💼 LinkedIn
                    </label>
                    <label className="platform-checkbox">
                      <input 
                        type="checkbox" 
                        name="platforms"
                        value="instagram" 
                        checked={quickPostData.platforms.includes('instagram')}
                        onChange={handleQuickPostChange}
                      />
                      <span className="checkmark"></span>
                      📸 Instagram
                    </label>
                    <label className="platform-checkbox">
                      <input 
                        type="checkbox" 
                        name="platforms"
                        value="tiktok" 
                        checked={quickPostData.platforms.includes('tiktok')}
                        onChange={handleQuickPostChange}
                      />
                      <span className="checkmark"></span>
                      🎵 TikTok
                    </label>
                    <label className="platform-checkbox">
                      <input 
                        type="checkbox" 
                        name="platforms"
                        value="threads" 
                        checked={quickPostData.platforms.includes('threads')}
                        onChange={handleQuickPostChange}
                      />
                      <span className="checkmark"></span>
                      🧵 Threads
                    </label>
                  </div>
                  <small className="form-help">Select platforms to post to immediately</small>
                </div>
              </div>
              
              <div className="form-actions">
                <button type="button" onClick={closeQuickPost} className="btn-cancel">
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-quick-post"
                  disabled={quickPostData.platforms.length === 0}
                  style={{backgroundColor: '#17a2b8', color: 'white'}}
                >
                  📝 Post Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Regular Campaign Creation Modal */}
      {showCreateForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>➕ Create New Campaign</h3>
              <button className="close-btn" onClick={closeForm}>×</button>
            </div>
            
            <form onSubmit={handleCreateCampaign} className="campaign-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Campaign Name *</label>
                  <input 
                    type="text" 
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required 
                    placeholder="Enter campaign name (e.g., 'Summer Sale 2024')" 
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group full-width">
                  <label htmlFor="content">Post Content *</label>
                  <textarea 
                    id="content"
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    required 
                    placeholder="Enter your post content here..." 
                    rows="4"
                  />
                  <small className="form-help">This content will be posted to all selected platforms</small>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Media Upload (Optional)</label>
                  <div className="file-upload-area">
                    <input 
                      type="file" 
                      id="media"
                      onChange={handleMediaUpload}
                      multiple
                      accept="image/*,video/*"
                      className="file-input"
                    />
                    <label htmlFor="media" className="file-upload-label">
                      📎 Choose Images or Videos
                      <span className="file-upload-hint">Support: JPG, PNG, MP4, MOV</span>
                    </label>
                  </div>
                  {formData.mediaFiles.length > 0 && (
                    <div className="selected-files">
                      <p>Selected files:</p>
                      <ul>
                        {formData.mediaFiles.map((file, index) => (
                          <li key={index}>{file.name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Posting Interval *</label>
                  <select 
                    name="intervalHours"
                    value={formData.intervalHours}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="1">Every 1 Hour</option>
                    <option value="2">Every 2 Hours</option>
                    <option value="4">Every 4 Hours</option>
                    <option value="6">Every 6 Hours</option>
                    <option value="12">Every 12 Hours</option>
                    <option value="24">Every 24 Hours</option>
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group full-width">
                  <label>Select Platforms *</label>
                  <div className="platform-checkboxes">
                    <label className="platform-checkbox">
                      <input 
                        type="checkbox" 
                        name="platforms"
                        value="facebook" 
                        checked={formData.platforms.includes('facebook')}
                        onChange={handleInputChange}
                      />
                      <span className="checkmark"></span>
                      📘 Facebook
                    </label>
                    <label className="platform-checkbox">
                      <input 
                        type="checkbox" 
                        name="platforms"
                        value="twitter" 
                        checked={formData.platforms.includes('twitter')}
                        onChange={handleInputChange}
                      />
                      <span className="checkmark"></span>
                      🐦 Twitter
                    </label>
                    <label className="platform-checkbox">
                      <input 
                        type="checkbox" 
                        name="platforms"
                        value="linkedin" 
                        checked={formData.platforms.includes('linkedin')}
                        onChange={handleInputChange}
                      />
                      <span className="checkmark"></span>
                      💼 LinkedIn
                    </label>
                    <label className="platform-checkbox">
                      <input 
                        type="checkbox" 
                        name="platforms"
                        value="instagram" 
                        checked={formData.platforms.includes('instagram')}
                        onChange={handleInputChange}
                      />
                      <span className="checkmark"></span>
                      📸 Instagram
                    </label>
                    <label className="platform-checkbox">
                      <input 
                        type="checkbox" 
                        name="platforms"
                        value="tiktok" 
                        checked={formData.platforms.includes('tiktok')}
                        onChange={handleInputChange}
                      />
                      <span className="checkmark"></span>
                      🎵 TikTok
                    </label>
                    <label className="platform-checkbox">
                      <input 
                        type="checkbox" 
                        name="platforms"
                        value="threads" 
                        checked={formData.platforms.includes('threads')}
                        onChange={handleInputChange}
                      />
                      <span className="checkmark"></span>
                      🧵 Threads (Basic)
                    </label>
                  </div>
                  <small className="form-help">Select at least one platform. For advanced Threads features, use "Threads Campaign"</small>
                </div>
              </div>
              
              <div className="form-actions">
                <button type="button" onClick={closeForm} className="btn-cancel">
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-create"
                  disabled={formData.platforms.length === 0}
                >
                  Create Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Threads Campaign Creation Modal */}
      {showThreadsForm && (
        <div className="modal-overlay" onClick={closeThreadsForm}>
          <div className="modal-content threads-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🧵 Create Threads Campaign</h3>
              <p className="threads-subtitle">Advanced Threads engagement with strategic mentioning</p>
              <button className="close-btn" onClick={closeThreadsForm}>×</button>
            </div>
            
            <form onSubmit={handleCreateThreadsCampaign} className="campaign-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="threads-name">Campaign Name *</label>
                  <input 
                    type="text" 
                    id="threads-name"
                    name="name"
                    value={threadsFormData.name}
                    onChange={handleThreadsInputChange}
                    required 
                    placeholder="e.g., 'Forex Community Engagement'" 
                  />
                </div>
                <div className="form-group">
                  <label>Posting Interval *</label>
                  <select 
                    name="intervalHours"
                    value={threadsFormData.intervalHours}
                    onChange={handleThreadsInputChange}
                    required
                  >
                    <option value="2">Every 2 Hours</option>
                    <option value="4">Every 4 Hours</option>
                    <option value="6">Every 6 Hours</option>
                    <option value="12">Every 12 Hours</option>
                    <option value="24">Every 24 Hours</option>
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group full-width">
                  <label htmlFor="threads-content">Post Content *</label>
                  <textarea 
                    id="threads-content"
                    name="content"
                    value={threadsFormData.content}
                    onChange={handleThreadsInputChange}
                    required 
                    placeholder="Enter your post content. Strategic mentions will be added automatically..." 
                    rows="4"
                  />
                  <small className="form-help">Mentions will be added automatically based on your targeting settings</small>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Media Upload (Optional)</label>
                  <div className="file-upload-area">
                    <input 
                      type="file" 
                      id="threads-media"
                      onChange={handleThreadsMediaUpload}
                      multiple
                      accept="image/*,video/*"
                      className="file-input"
                    />
                    <label htmlFor="threads-media" className="file-upload-label">
                      📎 Choose Images or Videos
                      <span className="file-upload-hint">Support: JPG, PNG, MP4, MOV</span>
                    </label>
                  </div>
                  {threadsFormData.mediaFiles.length > 0 && (
                    <div className="selected-files">
                      <p>Selected files:</p>
                      <ul>
                        {threadsFormData.mediaFiles.map((file, index) => (
                          <li key={index}>{file.name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label>Engagement Goal</label>
                  <select 
                    name="engagementGoal"
                    value={threadsFormData.engagementGoal}
                    onChange={handleThreadsInputChange}
                  >
                    <option value="growth">Follower Growth</option>
                    <option value="engagement">Increase Engagement</option>
                    <option value="community">Build Community</option>
                    <option value="sales">Generate Leads</option>
                  </select>
                </div>
              </div>

              <div className="threads-section">
                <h4>🎯 Targeting & Mentioning Strategy</h4>
                
                <div className="form-row">
                  <div className="form-group full-width">
                    <label htmlFor="searchKeywords">Search Keywords *</label>
                    <input 
                      type="text" 
                      id="searchKeywords"
                      name="searchKeywords"
                      value={threadsFormData.searchKeywords.join(', ')}
                      onChange={handleThreadsInputChange}
                      required 
                      placeholder="forex, trading, cryptocurrency, investment, business"
                    />
                    <small className="form-help">Comma-separated keywords to find relevant users to mention</small>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Max Mentions per Post</label>
                    <select 
                      name="maxMentionsPerPost"
                      value={threadsFormData.maxMentionsPerPost}
                      onChange={handleThreadsInputChange}
                    >
                      <option value="1">1 user</option>
                      <option value="2">2 users</option>
                      <option value="3">3 users</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Mention Cooldown</label>
                    <select 
                      name="mentionCooldown"
                      value={threadsFormData.mentionCooldown}
                      onChange={handleThreadsInputChange}
                    >
                      <option value="12">12 hours</option>
                      <option value="24">24 hours</option>
                      <option value="48">48 hours</option>
                      <option value="72">72 hours</option>
                    </select>
                    <small className="form-help">Avoid mentioning same user too frequently</small>
                  </div>
                  <div className="form-group">
                    <label>Target Audience</label>
                    <select 
                      name="targetAudience"
                      value={threadsFormData.targetAudience}
                      onChange={handleThreadsInputChange}
                    >
                      <option value="all">All Users</option>
                      <option value="influencers">Influencers</option>
                      <option value="potential_customers">Potential Customers</option>
                      <option value="community_members">Community Members</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group full-width">
                    <label htmlFor="manualUsers">Manual User List (Optional)</label>
                    <input 
                      type="text" 
                      id="manualUsers"
                      name="manualUsers"
                      value={threadsFormData.manualUsers}
                      onChange={handleThreadsInputChange}
                      placeholder="@user1, @user2, @user3"
                    />
                    <small className="form-help">Specific users to mention (without @ symbol, comma-separated)</small>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input 
                        type="checkbox" 
                        name="avoidRecentMentions"
                        checked={threadsFormData.avoidRecentMentions}
                        onChange={handleThreadsInputChange}
                      />
                      <span className="checkmark"></span>
                      Avoid Recently Mentioned Users
                    </label>
                    <small className="form-help">Prevents spam by not mentioning users too frequently</small>
                  </div>
                </div>
              </div>
              
              <div className="form-actions">
                <button type="button" onClick={closeThreadsForm} className="btn-cancel">
                  Cancel
                </button>
                <button type="submit" className="btn-create-threads">
                  🧵 Create Threads Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Campaigns;