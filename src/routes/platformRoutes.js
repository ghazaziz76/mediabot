const express = require('express');
const router = express.Router();
const platformController = require('../controllers/platformController');
const { authenticateToken } = require('../middleware/auth');

// ===============================================
// UNPROTECTED ROUTES (NO AUTHENTICATION NEEDED)
// ===============================================
// These routes are called by Facebook/Twitter/etc., not by your React app

// OAuth callback routes - Facebook calls these, so NO authentication required
router.get('/callback/:platform', async (req, res) => {
  try {
    await platformController.handleOAuthCallback(req, res);
  } catch (error) {
    console.error(`Error in ${req.params.platform} callback:`, error);
    res.redirect('/dashboard/platforms?error=callback_failed');
  }
});

// ===============================================
// APPLY AUTHENTICATION TO ALL ROUTES BELOW
// ===============================================
// This line protects ALL routes that come after it
router.use(authenticateToken);

// ===============================================
// PROTECTED ROUTES (AUTHENTICATION REQUIRED)
// ===============================================
// These routes are called by your React app, so they need authentication

// GET /api/platforms/status - Get connection status for all platforms
router.get('/status', async (req, res) => {
  try {
    await platformController.getPlatformStatus(req, res);
  } catch (error) {
    console.error('Error in platform status route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/platforms/connect/:platform - Start OAuth flow for a platform
router.post('/connect/:platform', async (req, res) => {
  try {
    const { platform } = req.params;
    
    // Validate platform
    const supportedPlatforms = ['facebook', 'twitter', 'linkedin', 'instagram', 'tiktok', 'threads'];
    if (!supportedPlatforms.includes(platform)) {
      return res.status(400).json({ error: 'Platform not supported' });
    }
    
    await platformController.connectPlatform(req, res);
  } catch (error) {
    console.error(`Error connecting ${req.params.platform}:`, error);
    res.status(500).json({ error: 'Failed to initiate connection' });
  }
});

// DELETE /api/platforms/disconnect/:platform - Disconnect a platform
router.delete('/disconnect/:platform', async (req, res) => {
  try {
    const { platform } = req.params;
    
    // Validate platform
    const supportedPlatforms = ['facebook', 'twitter', 'linkedin', 'instagram', 'tiktok', 'threads'];
    if (!supportedPlatforms.includes(platform)) {
      return res.status(400).json({ error: 'Platform not supported' });
    }
    
    await platformController.disconnectPlatform(req, res);
  } catch (error) {
    console.error(`Error disconnecting ${req.params.platform}:`, error);
    res.status(500).json({ error: 'Failed to disconnect platform' });
  }
});

// GET /api/platforms/tokens/:platform - Get tokens for a platform (internal use)
router.get('/tokens/:platform', async (req, res) => {
  try {
    const { platform } = req.params;
    const userId = req.user.id;
    
    const tokens = await platformController.getPlatformTokens(userId, platform);
    
    if (!tokens) {
      return res.status(404).json({ error: 'No active tokens found for this platform' });
    }
    
    // Don't send the actual tokens in response, just confirm they exist
    res.json({ 
      hasTokens: true, 
      platform: platform,
      message: 'Tokens are available for this platform'
    });
    
  } catch (error) {
    console.error(`Error getting tokens for ${req.params.platform}:`, error);
    res.status(500).json({ error: 'Failed to retrieve platform tokens' });
  }
});

// POST /api/platforms/refresh/:platform - Refresh tokens for a platform
router.post('/refresh/:platform', async (req, res) => {
  try {
    const { platform } = req.params;
    const userId = req.user.id;
    
    const refreshedTokens = await platformController.refreshPlatformToken(userId, platform);
    
    if (!refreshedTokens) {
      return res.status(400).json({ error: 'Failed to refresh tokens. Please reconnect the platform.' });
    }
    
    res.json({ 
      success: true, 
      message: `${platform} tokens refreshed successfully`
    });
    
  } catch (error) {
    console.error(`Error refreshing tokens for ${req.params.platform}:`, error);
    res.status(500).json({ error: 'Failed to refresh platform tokens' });
  }
});

// GET /api/platforms - Get list of all supported platforms
router.get('/', (req, res) => {
  const platforms = [
    {
      name: 'facebook',
      displayName: 'Facebook',
      description: 'Post to Facebook pages',
      features: ['text', 'images', 'videos', 'links']
    },
    {
      name: 'twitter',
      displayName: 'Twitter',
      description: 'Post tweets with media',
      features: ['text', 'images', 'videos'],
      limitations: ['280 character limit']
    },
    {
      name: 'linkedin',
      displayName: 'LinkedIn',
      description: 'Professional content posting',
      features: ['text', 'images', 'articles']
    },
    {
      name: 'instagram',
      displayName: 'Instagram',
      description: 'Visual content sharing',
      features: ['images', 'videos', 'stories', 'reels']
    },
    {
      name: 'tiktok',
      displayName: 'TikTok',
      description: 'Short video content',
      features: ['videos', 'hashtags']
    },
    {
      name: 'threads',
      displayName: 'Threads',
      description: 'Text-based social posts',
      features: ['text', 'images', 'mentions']
    }
  ];
  
  res.json({ platforms });
});

// POST /api/platforms/test/:platform - Test platform connection
router.post('/test/:platform', async (req, res) => {
  try {
    const { platform } = req.params;
    const userId = req.user.id;
    
    // Get tokens for the platform
    const tokens = await platformController.getPlatformTokens(userId, platform);
    
    if (!tokens) {
      return res.status(404).json({ 
        error: 'No active connection found. Please connect the platform first.' 
      });
    }
    
    // TODO: Add actual API test calls for each platform
    // For now, just return success if tokens exist
    res.json({ 
      success: true, 
      platform: platform,
      message: `${platform} connection test passed`
    });
    
  } catch (error) {
    console.error(`Error testing ${req.params.platform} connection:`, error);
    res.status(500).json({ error: 'Connection test failed' });
  }
});

module.exports = router;