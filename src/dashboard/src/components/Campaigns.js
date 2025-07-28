import React, { useState, useEffect } from 'react';
import './Campaigns.css';

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    content: '',
    platforms: [],
    intervalMinutes: 360
  });

  // Available platforms
  const availablePlatforms = [
    { name: 'facebook', displayName: 'Facebook', icon: '📘' },
    { name: 'twitter', displayName: 'Twitter', icon: '🐦' },
    { name: 'linkedin', displayName: 'LinkedIn', icon: '💼' },
    { name: 'instagram', displayName: 'Instagram', icon: '📸' },
    { name: 'tiktok', displayName: 'TikTok', icon: '🎵' },
    { name: 'threads', displayName: 'Threads', icon: '🧵' }
  ];

  // Interval options
  const intervalOptions = [
    { value: 60, label: '1 hour' },
    { value: 120, label: '2 hours' },
    { value: 180, label: '3 hours' },
    { value: 360, label: '6 hours' },
    { value: 720, label: '12 hours' },
    { value: 1440, label: '24 hours' }
  ];

  // Load campaigns when component mounts
  useEffect(() => {
    loadCampaigns();
  }, []);

  // Load all campaigns
  const loadCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCampaigns(data.campaigns);
      } else {
        setMessage('Failed to load campaigns');
      }
    } catch (error) {
      setMessage('Error loading campaigns: ' + error.message);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle platform selection
  const handlePlatformChange = (platformName) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platformName)
        ? prev.platforms.filter(p => p !== platformName)
        : [...prev.platforms, platformName]
    }));
  };

  // Create new campaign
  const createCampaign = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Campaign created successfully!');
        setShowCreateForm(false);
        setFormData({
          name: '',
          description: '',
          content: '',
          platforms: [],
          intervalMinutes: 360
        });
        loadCampaigns(); // Reload campaigns list
      } else {
        setMessage(data.error || 'Failed to create campaign');
      }
    } catch (error) {
      setMessage('Error creating campaign: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Start campaign
  const startCampaign = async (campaignId) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setMessage('Campaign started successfully!');
        loadCampaigns();
      } else {
        const data = await response.json();
        setMessage(data.error || 'Failed to start campaign');
      }
    } catch (error) {
      setMessage('Error starting campaign: ' + error.message);
    }
  };

  // Stop campaign
  const stopCampaign = async (campaignId) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/stop`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setMessage('Campaign stopped successfully!');
        loadCampaigns();
      } else {
        const data = await response.json();
        setMessage(data.error || 'Failed to stop campaign');
      }
    } catch (error) {
      setMessage('Error stopping campaign: ' + error.message);
    }
  };

  return (
    <div className="campaigns">
      <div className="campaigns-header">
        <h2>Campaign Management</h2>
        <button 
          className="btn-create-campaign"
          onClick={() => setShowCreateForm(true)}
        >
          + Create New Campaign
        </button>
      </div>

      {message && (
        <div className={`message ${message.includes('Error') || message.includes('Failed') ? 'error' : 'success'}`}>
          {message}
          <button onClick={() => setMessage('')}>×</button>
        </div>
      )}

      {/* Create Campaign Form */}
      {showCreateForm && (
        <div className="create-campaign-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create New Campaign</h3>
              <button 
                className="close-modal"
                onClick={() => setShowCreateForm(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={createCampaign} className="campaign-form">
              <div className="form-group">
                <label>Campaign Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Forex Trading Course"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Brief description of this campaign"
                />
              </div>

              <div className="form-group">
                <label>Post Content *</label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  placeholder="Write your post content here..."
                  rows="4"
                  required
                />
                <small>{formData.content.length} characters</small>
              </div>

              <div className="form-group">
                <label>Select Platforms *</label>
                <div className="platforms-grid">
                  {availablePlatforms.map(platform => (
                    <label key={platform.name} className="platform-checkbox">
                      <input
                        type="checkbox"
                        checked={formData.platforms.includes(platform.name)}
                        onChange={() => handlePlatformChange(platform.name)}
                      />
                      <span className="platform-info">
                        <span className="platform-icon">{platform.icon}</span>
                        <span className="platform-name">{platform.displayName}</span>
                      </span>
                    </label>
                  ))}
                </div>
                <small>Selected: {formData.platforms.length} platform(s)</small>
              </div>

              <div className="form-group">
                <label>Posting Interval</label>
                <select
                  name="intervalMinutes"
                  value={formData.intervalMinutes}
                  onChange={handleInputChange}
                >
                  {intervalOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-submit"
                  disabled={loading || formData.platforms.length === 0}
                >
                  {loading ? 'Creating...' : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Campaigns List */}
      <div className="campaigns-list">
        <h3>Your Campaigns ({campaigns.length})</h3>
        
        {campaigns.length === 0 ? (
          <div className="no-campaigns">
            <p>No campaigns yet. Create your first campaign to get started!</p>
          </div>
        ) : (
          <div className="campaigns-grid">
            {campaigns.map(campaign => (
              <div key={campaign.id} className={`campaign-card ${campaign.isActive ? 'active' : 'inactive'}`}>
                <div className="campaign-header">
                  <h4>{campaign.name}</h4>
                  <span className={`status ${campaign.status.toLowerCase()}`}>
                    {campaign.status}
                  </span>
                </div>

                <div className="campaign-details">
                  <p className="description">{campaign.description}</p>
                  <div className="content-preview">
                    {campaign.content.substring(0, 100)}
                    {campaign.content.length > 100 ? '...' : ''}
                  </div>
                </div>

                <div className="campaign-platforms">
                  <strong>Platforms:</strong>
                  <div className="platform-badges">
                    {campaign.platforms.map(platform => {
                      const platformInfo = availablePlatforms.find(p => p.name === platform);
                      return (
                        <span key={platform} className="platform-badge">
                          {platformInfo?.icon} {platformInfo?.displayName}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="campaign-stats">
                  <div className="stat">
                    <span>Interval:</span>
                    <span>{Math.floor(campaign.intervalMinutes / 60)}h {campaign.intervalMinutes % 60}m</span>
                  </div>
                  <div className="stat">
                    <span>Posts:</span>
                    <span>{campaign.totalPosts}</span>
                  </div>
                  <div className="stat">
                    <span>Success Rate:</span>
                    <span>{campaign.successRate}%</span>
                  </div>
                </div>

                <div className="campaign-actions">
                  {campaign.isActive ? (
                    <button 
                      className="btn-stop"
                      onClick={() => stopCampaign(campaign.id)}
                    >
                      ⏸️ Stop
                    </button>
                  ) : (
                    <button 
                      className="btn-start"
                      onClick={() => startCampaign(campaign.id)}
                    >
                      ▶️ Start
                    </button>
                  )}
                  <button className="btn-edit">✏️ Edit</button>
                  <button className="btn-delete">🗑️ Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Campaigns;