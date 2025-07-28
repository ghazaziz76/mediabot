import React from 'react';

const Dashboard = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h2>Dashboard Overview</h2>
      <p>Welcome to your Social Media Bot dashboard!</p>
      <div style={{ marginTop: '20px' }}>
        <h3>System Status</h3>
        <p>✅ API Server: Running</p>
        <p>✅ Database: Connected</p>
        <p>✅ Authentication: Active</p>
        <p>📊 Ready to manage your campaigns!</p>
      </div>
    </div>
  );
};

export default Dashboard;