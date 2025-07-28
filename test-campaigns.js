const { User, Campaign } = require('./models');

async function testCampaignDatabase() {
    try {
        console.log('Testing campaign database...');
        
        // Find a user (should exist from previous testing)
        const user = await User.findOne();
        if (!user) {
            console.log('❌ No users found. Please create a user first.');
            return;
        }
        
        // Create a test campaign
        const testCampaign = await Campaign.create({
            userId: user.id,
            name: 'Test Forex Campaign',
            description: 'Testing campaign creation',
            content: 'Learn Forex trading with our comprehensive course! 📈 #forex #trading',
            platforms: JSON.stringify(['facebook', 'twitter', 'linkedin']),
            intervalMinutes: 360, // 6 hours
            isActive: false
        });
        
        console.log('✅ Campaign database setup successful!');
        console.log('Test campaign created:', {
            id: testCampaign.id,
            name: testCampaign.name,
            platforms: testCampaign.getPlatformsArray(),
            status: testCampaign.getStatus()
        });
        
        // Test the relationship
        const campaignWithUser = await Campaign.findByPk(testCampaign.id, {
            include: [{ model: User, as: 'user' }]
        });
        
        console.log('Campaign belongs to user:', campaignWithUser.user.email);
        
    } catch (error) {
        console.log('❌ Campaign database test failed:', error.message);
    }
}

testCampaignDatabase();