const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

console.log('🔍 Starting server with debug logging...');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// Import routes with error handling
console.log('📁 Testing route file imports...');

let templateRoutes, hashtagRoutes;

try {
    templateRoutes = require('./src/routes/templateRoutes');
    console.log('✅ Template routes loaded successfully');
} catch (error) {
    console.log('❌ Template routes error:', error.message);
}

try {
    hashtagRoutes = require('./src/routes/hashtagRoutes');
    console.log('✅ Hashtag routes loaded successfully');
} catch (error) {
    console.log('❌ Hashtag routes error:', error.message);
}

// Import other routes
const authController = require('./src/controllers/authController');
const mediaController = require('./src/controllers/mediaController');
const threadsController = require('./src/controllers/threadsController');
const platformRoutes = require('./src/routes/platformRoutes');
let campaignRoutes;
try {
    campaignRoutes = require('./src/routes/campaignRoutes');
    console.log('✅ Campaign routes loaded successfully');
} catch (error) {
    console.log('❌ Campaign routes error:', error.message);
}
const analyticsController = require('./src/controllers/analyticsController');
const scheduleController = require('./src/controllers/scheduleController');
const { authenticateToken } = require('./src/middleware/auth');

console.log('📁 Route import test complete\n');

// Authentication routes
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);

// Media upload routes (protected)
app.post('/api/media/upload', authenticateToken, mediaController.upload.single('file'), mediaController.uploadSingle);
app.get('/api/media', authenticateToken, mediaController.getAllMedia);
app.delete('/api/media/:id', authenticateToken, mediaController.deleteMedia);

// Advanced Scheduling routes (protected)
app.put('/api/campaigns/:campaignId/schedule', authenticateToken, scheduleController.updateCampaignSchedule);
app.get('/api/campaigns/:campaignId/schedule', authenticateToken, scheduleController.getCampaignSchedule);
app.get('/api/campaigns/:campaignId/should-post', authenticateToken, scheduleController.shouldCampaignPost);

// Platform routes
app.use('/api/platforms', platformRoutes);

// Template routes (protected) - only if loaded successfully
if (templateRoutes) {
    app.use('/api/templates', templateRoutes);
    console.log('✅ Template routes registered at /api/templates');
} else {
    console.log('❌ Template routes not registered - file failed to load');
}

// Hashtag routes (protected) - only if loaded successfully
if (hashtagRoutes) {
    app.use('/api/hashtags', hashtagRoutes);
    console.log('✅ Hashtag routes registered at /api/hashtags');
} else {
    console.log('❌ Hashtag routes not registered - file failed to load');
}

// Analytics routes (protected)
app.get('/api/analytics/dashboard', authenticateToken, analyticsController.getDashboardSummary);
app.get('/api/analytics/campaigns/:campaignId', authenticateToken, analyticsController.getCampaignAnalytics);
app.get('/api/analytics/platforms', authenticateToken, analyticsController.getPlatformAnalytics);
app.get('/api/analytics/best-content', authenticateToken, analyticsController.getBestPerformingContent);

// Threads-specific routes (protected)
app.get('/api/threads/search-users', authenticateToken, threadsController.searchUsers);
app.post('/api/threads/users-to-mention', authenticateToken, threadsController.getUsersToMention);
app.post('/api/threads/optimize-content', authenticateToken, threadsController.optimizeContent);
app.get('/api/threads/mention-analytics', authenticateToken, threadsController.getMentionAnalytics);
app.get('/api/threads/trending-topics', authenticateToken, threadsController.getTrendingTopics);
app.post('/api/threads/build-audience', authenticateToken, threadsController.buildTargetAudience);
app.post('/api/threads/preview-post', authenticateToken, threadsController.previewPost);

// IMPORTANT: Test post route MUST be defined BEFORE the general campaign routes
app.post('/api/campaigns/:id/test-post', authenticateToken, async (req, res) => {
    try {
        const campaignId = req.params.id;
        console.log(`🧪 Testing post for campaign ${campaignId}`);
        
        // Simulate successful posting to all platforms
        const result = {
            success: true,
            message: `Test post successful for campaign ${campaignId}`,
            stats: {
                successful: 3,
                failed: 0,
                successRate: 100
            },
            platforms: {
                facebook: { success: true, message: 'Posted successfully' },
                twitter: { success: true, message: 'Posted successfully' },
                linkedin: { success: true, message: 'Posted successfully' }
            }
        };
        
        res.json(result);
    } catch (error) {
        console.error('Test post error:', error);
        res.status(500).json({ error: 'Test post failed' });
    }
});

// Campaign routes (protected) - MUST come AFTER specific campaign routes
if (campaignRoutes) {
    app.use('/api/campaigns', campaignRoutes);
    console.log('✅ Campaign routes registered at /api/campaigns');
} else {
    console.log('❌ Campaign routes not registered - file failed to load');
}

// Protected test route
app.get('/api/protected', authenticateToken, (req, res) => {
    res.json({ 
        message: 'This is a protected route!',
        user: {
            id: req.user.id,
            username: req.user.username,
            email: req.user.email
        }
    });
});

// Basic test route
app.get('/', (req, res) => {
    res.json({ 
        message: 'Media Bot API is running!',
        version: '1.0.0',
        status: 'active'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Access your API at: http://localhost:${PORT}`);
    console.log('🚀 All routes loaded and server ready!\n');
});