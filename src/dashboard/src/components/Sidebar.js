import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ user, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    {
      path: '/dashboard',
      icon: '📊',
      label: 'Dashboard',
      description: 'Overview and stats'
    },
    {
      path: '/platforms',
      icon: '🔗',
      label: 'Platform Connections',
      description: 'Connect social media accounts'
    },
    {
      path: '/campaigns',
      icon: '🚀',
      label: 'Campaigns',
      description: 'Manage posting campaigns'
    },
    {
      path: '/analytics',
      icon: '📈',
      label: 'Analytics',
      description: 'Performance insights'
    },
    {
      path: '/settings',
      icon: '⚙️',
      label: 'Settings',
      description: 'Account and preferences'
    }
  ];

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Handle New Campaign button click
  const handleNewCampaign = () => {
    // Navigate to campaigns page with state to open the form
    navigate('/campaigns', { state: { openCreateForm: true } });
  };

  // Handle Quick Post button click
  const handleQuickPost = () => {
    // Navigate to campaigns page with state to open quick post
    navigate('/campaigns', { state: { openQuickPost: true } });
  };

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Header */}
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon">🤖</span>
          {!isCollapsed && <span className="logo-text">Social Bot</span>}
        </div>
        <button 
          className="collapse-button"
          onClick={toggleSidebar}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? '►' : '◄'}
        </button>
      </div>

      {/* User Info */}
      <div className="user-info">
        <div className="user-avatar">
          {user?.email?.charAt(0).toUpperCase() || 'U'}
        </div>
        {!isCollapsed && (
          <div className="user-details">
            <div className="user-name">{user?.name || 'User'}</div>
            <div className="user-email">{user?.email}</div>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="sidebar-nav">
        <ul className="nav-list">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.path} className="nav-item">
                <Link 
                  to={item.path}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                  title={isCollapsed ? item.label : ''}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {!isCollapsed && (
                    <div className="nav-content">
                      <span className="nav-label">{item.label}</span>
                      <span className="nav-description">{item.description}</span>
                    </div>
                  )}
                  {isActive && <div className="active-indicator"></div>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Quick Actions */}
      {!isCollapsed && (
        <div className="quick-actions">
          <h4>Quick Actions</h4>
          <button 
            className="quick-action-btn"
            onClick={handleNewCampaign}
            title="Create a new campaign"
          >
            <span>➕</span>
            New Campaign
          </button>
          <button 
            className="quick-action-btn"
            onClick={handleQuickPost}
            title="Create a quick post"
          >
            <span>📝</span>
            Quick Post
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="sidebar-footer">
        <button 
          className="logout-button"
          onClick={onLogout}
          title={isCollapsed ? 'Logout' : ''}
        >
          <span className="logout-icon">🚪</span>
          {!isCollapsed && <span>Logout</span>}
        </button>
        
        {!isCollapsed && (
          <div className="version-info">
            <small>Version 1.0.0</small>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;