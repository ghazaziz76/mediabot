import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import './AnalyticsDashboard.css';

const AnalyticsDashboard = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [platformData, setPlatformData] = useState(null);
  const [bestContent, setBestContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  // Colors for charts
  const COLORS = {
    primary: '#4F46E5',
    secondary: '#06B6D4',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    facebook: '#1877F2',
    twitter: '#1DA1F2',
    linkedin: '#0A66C2',
    instagram: '#E4405F',
    tiktok: '#000000',
    threads: '#000000'
  };

  const PLATFORM_COLORS = ['#1877F2', '#1DA1F2', '#0A66C2', '#E4405F', '#000000', '#8B5CF6'];

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch dashboard summary
      const dashboardResponse = await fetch('/api/analytics/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dashboardData = await dashboardResponse.json();

      // Fetch platform analytics
      const platformResponse = await fetch(`/api/analytics/platforms?timeRange=${timeRange}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const platformAnalytics = await platformResponse.json();

      // Fetch best content
      const contentResponse = await fetch('/api/analytics/best-content?limit=5', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const contentData = await contentResponse.json();

      if (dashboardData.success) setAnalyticsData(dashboardData.data);
      if (platformAnalytics.success) setPlatformData(platformAnalytics.data);
      if (contentData.success) setBestContent(contentData.data);

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const preparePlatformData = () => {
    if (!platformData || !platformData.platforms) return [];
    
    return Object.entries(platformData.platforms).map(([platform, stats]) => ({
      platform: platform.charAt(0).toUpperCase() + platform.slice(1),
      posts: stats.totalPosts,
      successful: stats.successfulPosts,
      failed: stats.failedPosts,
      successRate: parseFloat(stats.successRate)
    }));
  };

  const prepareEngagementData = () => {
    // Mock engagement trend data (in real app, this would come from your API)
    return [
      { date: '7 days ago', engagement: 45, posts: 12 },
      { date: '6 days ago', engagement: 52, posts: 15 },
      { date: '5 days ago', engagement: 48, posts: 10 },
      { date: '4 days ago', engagement: 61, posts: 18 },
      { date: '3 days ago', engagement: 55, posts: 14 },
      { date: '2 days ago', engagement: 67, posts: 20 },
      { date: 'Yesterday', engagement: 58, posts: 16 }
    ];
  };

  const preparePieData = () => {
    if (!platformData || !platformData.platforms) return [];
    
    return Object.entries(platformData.platforms).map(([platform, stats]) => ({
      name: platform.charAt(0).toUpperCase() + platform.slice(1),
      value: stats.totalPosts,
      color: COLORS[platform] || COLORS.primary
    }));
  };

  if (loading) {
    return (
      <div className="analytics-dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      <div className="dashboard-header">
        <h1>📊 Analytics Dashboard</h1>
        <div className="time-range-selector">
          <label>Time Range:</label>
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-icon">📝</div>
          <div className="card-content">
            <h3>Total Posts</h3>
            <p className="card-number">{analyticsData?.last7d?.totalPosts || 0}</p>
            <span className="card-subtitle">Last 7 days</span>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="card-icon">✅</div>
          <div className="card-content">
            <h3>Successful Posts</h3>
            <p className="card-number">{analyticsData?.last7d?.totalSuccessful || 0}</p>
            <span className="card-subtitle">Success rate: {analyticsData?.last7d?.overallSuccessRate || 0}%</span>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="card-icon">💝</div>
          <div className="card-content">
            <h3>Total Engagement</h3>
            <p className="card-number">{analyticsData?.last7d?.totalEngagement || 0}</p>
            <span className="card-subtitle">Likes, comments, shares</span>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="card-icon">📈</div>
          <div className="card-content">
            <h3>Avg. Engagement</h3>
            <p className="card-number">{analyticsData?.last7d?.averageEngagementPerPost || 0}</p>
            <span className="card-subtitle">Per post</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        
        {/* Platform Performance Chart */}
        <div className="chart-container">
          <h3>📊 Platform Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={preparePlatformData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="platform" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="successful" fill={COLORS.success} name="Successful Posts" />
              <Bar dataKey="failed" fill={COLORS.danger} name="Failed Posts" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Success Rate Chart */}
        <div className="chart-container">
          <h3>🎯 Success Rate by Platform</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={preparePlatformData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="platform" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value}%`, 'Success Rate']} />
              <Bar dataKey="successRate" fill={COLORS.primary} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Posts Distribution Pie Chart */}
        <div className="chart-container">
          <h3>📱 Posts by Platform</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={preparePieData()}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {preparePieData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PLATFORM_COLORS[index % PLATFORM_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Engagement Trend */}
        <div className="chart-container">
          <h3>💝 Engagement Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={prepareEngagementData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="engagement" stroke={COLORS.secondary} fill={COLORS.secondary} fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* Best Performing Content */}
      <div className="best-content-section">
        <h3>🏆 Best Performing Content</h3>
        <div className="content-list">
          {bestContent.length > 0 ? (
            bestContent.map((content, index) => (
              <div key={index} className="content-item">
                <div className="content-rank">#{index + 1}</div>
                <div className="content-details">
                  <p className="content-campaign">{content.campaignName}</p>
                  <p className="content-platform">{content.platform}</p>
                  <p className="content-date">{new Date(content.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="content-engagement">
                  <span>{content.totalEngagement || 0} interactions</span>
                </div>
              </div>
            ))
          ) : (
            <div className="no-content">
              <p>No content data available yet. Start posting to see performance insights!</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default AnalyticsDashboard;