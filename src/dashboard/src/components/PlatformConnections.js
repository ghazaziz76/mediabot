import React, { useState, useEffect } from 'react';
import './PlatformConnections.css';

const PlatformConnections = () => {
  // This keeps track of which platforms are connected
  const [platformStatus, setPlatformStatus] = useState({
    facebook: { connected: false, loading: false },
    twitter: { connected: false, loading: false },
    linkedin: { connected: false, loading: false },
    instagram: { connected: false, loading: false },
    tiktok: { connected: false, loading: false },
    threads: { connected: false, loading: false }
  });

  // Platform information for display
  const platforms = [
    {
      name: 'facebook',
      displayName: 'Facebook',
      icon: '📘',
      color: '#1877F2',
      description: 'Connect your Facebook page for posting'
    },
    {
      name: 'twitter',
      displayName: 'Twitter',
      icon: '🐦',
      color: '#1DA1F2',
      description: 'Connect your Twitter account for tweets'
    },
    {
      name: 'linkedin',
      displayName: 'LinkedIn',
      icon: '💼',
      color: '#0A66C2',
      description: 'Connect your LinkedIn page for professional posts'
    },
    {
      name: 'instagram',
      displayName: 'Instagram',
      icon: '📸',
      color: '#E4405F',
      description: 'Connect your Instagram business account'
    },
    {
      name: 'tiktok',
      displayName: 'TikTok',
      icon: '🎵',
      color: '#000000',
      description: 'Connect your TikTok business account'
    },
    {
      name: 'threads',
      displayName: 'Threads',
      icon: '🧵',
      color: '#000000',
      description: 'Connect your Threads account'
    }
  ];

  // Check connection status when page loads
  useEffect(() => {
    checkAllPlatformStatus();
  }, []);

  // Function to check if platforms are connected
  const checkAllPlatformStatus = async () => {
    try {
      const response = await fetch('/api/platforms/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const status = await response.json();
        setPlatformStatus(status);
      }
    } catch (error) {
      console.error('Error checking platform status:', error);
    }
  };

  // Function to connect a platform
  const connectPlatform = async (platformName) => {
    // Show loading state
    setPlatformStatus(prev => ({
      ...prev,
      [platformName]: { ...prev[platformName], loading: true }
    }));

    try {
      // Call the backend to start OAuth flow
      const response = await fetch(`/api/platforms/connect/${platformName}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect to platform's OAuth page
        window.location.href = data.authUrl;
      } else {
        throw new Error('Failed to initiate connection');
      }
    } catch (error) {
      console.error(`Error connecting ${platformName}:`, error);
      alert(`Failed to connect ${platformName}. Please try again.`);
    } finally {
      // Remove loading state
      setPlatformStatus(prev => ({
        ...prev,
        [platformName]: { ...prev[platformName], loading: false }
      }));
    }
  };

  // Function to disconnect a platform
  const disconnectPlatform = async (platformName) => {
    if (!window.confirm(`Are you sure you want to disconnect ${platformName}?`)) {
      return;
    }

    setPlatformStatus(prev => ({
      ...prev,
      [platformName]: { ...prev[platformName], loading: true }
    }));

    try {
      const response = await fetch(`/api/platforms/disconnect/${platformName}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setPlatformStatus(prev => ({
          ...prev,
          [platformName]: { connected: false, loading: false }
        }));
        alert(`${platformName} disconnected successfully!`);
      } else {
        throw new Error('Failed to disconnect');
      }
    } catch (error) {
      console.error(`Error disconnecting ${platformName}:`, error);
      alert(`Failed to disconnect ${platformName}. Please try again.`);
    } finally {
      setPlatformStatus(prev => ({
        ...prev,
        [platformName]: { ...prev[platformName], loading: false }
      }));
    }
  };

  return (
    <div className="platform-connections">
      <div className="platform-connections-header">
        <h2>Connect Your Social Media Accounts</h2>
        <p>Connect your social media platforms to start creating automated campaigns</p>
      </div>

      <div className="platforms-grid">
        {platforms.map((platform) => {
          const status = platformStatus[platform.name];
          const isConnected = status?.connected;
          const isLoading = status?.loading;

          return (
            <div 
              key={platform.name}
              className={`platform-card ${isConnected ? 'connected' : 'disconnected'}`}
            >
              <div className="platform-icon" style={{ color: platform.color }}>
                {platform.icon}
              </div>
              
              <div className="platform-info">
                <h3>{platform.displayName}</h3>
                <p>{platform.description}</p>
              </div>

              <div className="platform-status">
                {isConnected ? (
                  <div className="status-connected">
                    <span className="status-indicator connected">●</span>
                    <span>Connected</span>
                  </div>
                ) : (
                  <div className="status-disconnected">
                    <span className="status-indicator disconnected">●</span>
                    <span>Not Connected</span>
                  </div>
                )}
              </div>

              <div className="platform-actions">
                {isLoading ? (
                  <button className="btn-loading" disabled>
                    Connecting...
                  </button>
                ) : isConnected ? (
                  <button 
                    className="btn-disconnect"
                    onClick={() => disconnectPlatform(platform.name)}
                  >
                    Disconnect
                  </button>
                ) : (
                  <button 
                    className="btn-connect"
                    onClick={() => connectPlatform(platform.name)}
                    style={{ backgroundColor: platform.color }}
                  >
                    Connect {platform.displayName}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="connection-summary">
        <h3>Connection Summary</h3>
        <p>
          Connected: {Object.values(platformStatus).filter(status => status.connected).length} of 6 platforms
        </p>
        
        <div className="summary-actions">
          <button 
            className="btn-refresh"
            onClick={checkAllPlatformStatus}
          >
            Refresh Status
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlatformConnections;