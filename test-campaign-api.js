const axios = require('axios');

async function testCampaignAPI() {
  try {
    console.log('Testing Campaign API...');
    
    // Step 1: Login
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@mediabot.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Step 2: Create campaign
    const campaignResponse = await axios.post('http://localhost:3000/api/campaigns', {
      name: 'API Test Campaign',
      description: 'Testing campaign creation via API',
      content: '🚀 Test post content for our campaign! #test #automation',
      platforms: ['facebook', 'twitter'],
      intervalMinutes: 240
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Campaign created:', campaignResponse.data.campaign);
    
    // Step 3: Get all campaigns
    const getCampaignsResponse = await axios.get('http://localhost:3000/api/campaigns', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ All campaigns:', getCampaignsResponse.data.campaigns);
    
  } catch (error) {
    console.log('❌ API test failed:', error.response?.data || error.message);
  }
}

testCampaignAPI();