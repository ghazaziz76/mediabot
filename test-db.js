const { Post, Media, Platform } = require('./models');

async function testDatabase() {
    try {
        console.log('Testing database connection...');
        
        // Test creating a platform
        const testPlatform = await Platform.create({
            name: 'Facebook',
            apiCredentials: 'test-credentials',
            activeStatus: true
        });
        
        console.log('✅ Database connection successful!');
        console.log('Test platform created:', testPlatform.toJSON());
        
    } catch (error) {
        console.log('❌ Database connection failed:', error.message);
    }
}

testDatabase();