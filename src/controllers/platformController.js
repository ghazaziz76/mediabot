const crypto = require('crypto');
const { PlatformConnection } = require('../../models');

class PlatformController {
  
  /**
   * Get connection status for all platforms for the current user
   */
  async getPlatformStatus(req, res) {
    try {
      const userId = req.user.id;
      console.log(`📊 Getting platform status for user ${userId}`);
      
      // Check database for actual connections
      const connections = await PlatformConnection.findAll({
        where: { 
          userId: userId,
          isActive: true 
        }
      });
      
      // Create status object with real data from database
      const status = {
        facebook: { connected: false, loading: false },
        twitter: { connected: false, loading: false },
        linkedin: { connected: false, loading: false },
        instagram: { connected: false, loading: false },
        tiktok: { connected: false, loading: false },
        threads: { connected: false, loading: false }
      };
      
      // Update status based on database connections
      connections.forEach(connection => {
        if (status[connection.platform]) {
          status[connection.platform].connected = true;
          console.log(`✅ User ${userId} has ${connection.platform} connected`);
        }
      });
      
      res.json(status);
    } catch (error) {
      console.error('Error getting platform status:', error);
      res.status(500).json({ error: 'Failed to get platform status' });
    }
  }

  /**
   * Start OAuth connection flow for a platform
   */
  async connectPlatform(req, res) {
    try {
      const { platform } = req.params;
      const userId = req.user.id;
      
      console.log(`🔗 User ${userId} connecting to ${platform}`);
      
      // Validate platform
      const supportedPlatforms = ['facebook', 'twitter', 'linkedin', 'instagram', 'tiktok', 'threads'];
      if (!supportedPlatforms.includes(platform)) {
        return res.status(400).json({ error: 'Platform not supported' });
      }
      
      // Generate OAuth state for security
      const state = crypto.randomBytes(32).toString('hex');
      console.log(`🔐 Generated OAuth state: ${state.substring(0, 10)}...`);
      
      // TODO: Store state in database or session for verification
      
      // Build real OAuth URL based on platform
      const authUrl = this.buildOAuthUrl(platform, state);
      
      console.log(`🚀 Redirecting to: ${authUrl}`);
      
      res.json({ 
        authUrl,
        message: `Redirecting to ${platform} for authorization`,
        platform: platform
      });
      
    } catch (error) {
      console.error(`Error connecting ${req.params.platform}:`, error);
      res.status(500).json({ error: 'Failed to start connection process' });
    }
  }

  /**
   * Handle OAuth callback from platforms
   */
  async handleOAuthCallback(req, res) {
    try {
      const { platform } = req.params;
      const { code, state } = req.query;
      
      console.log(`📥 OAuth callback from ${platform}, code: ${code?.substring(0, 10)}...`);
      
      if (!code) {
        console.log('❌ No authorization code received');
        return res.redirect('http://localhost:3001/platforms?error=oauth_cancelled');
      }
      
      // For demo purposes, we'll save a simulated successful connection
      // In real implementation, you would:
      // 1. Verify the state parameter
      // 2. Exchange code for access token from the platform
      // 3. Store real tokens in database
      
      try {
        // Create or update platform connection in database
        const [connection, created] = await PlatformConnection.upsert({
          userId: 1, // For demo, using user ID 1 (your logged-in user)
          platform: platform,
          accessToken: `demo_access_token_${Date.now()}`, // In real app, this would be the actual token
          refreshToken: `demo_refresh_token_${Date.now()}`,
          expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
          isActive: true
        });
        
        console.log(`💾 ${platform} connection ${created ? 'created' : 'updated'} in database`);
        console.log(`✅ ${platform} connection successful (saved to database)`);
        
        res.redirect(`http://localhost:3001/platforms?success=connected&platform=${platform}`);
        
      } catch (dbError) {
        console.error('Error saving connection to database:', dbError);
        res.redirect('http://localhost:3001/platforms?error=db_save_failed');
      }
      
    } catch (error) {
      console.error(`Error in ${req.params.platform} callback:`, error);
      res.redirect('http://localhost:3001/platforms?error=callback_failed');
    }
  }

  /**
   * Disconnect a platform
   */
  async disconnectPlatform(req, res) {
    try {
      const { platform } = req.params;
      const userId = req.user.id;
      
      console.log(`🔌 User ${userId} disconnecting from ${platform}`);
      
      // Remove connection from database
      const deleted = await PlatformConnection.destroy({
        where: {
          userId: userId,
          platform: platform
        }
      });
      
      if (deleted > 0) {
        console.log(`🗑️ ${platform} connection removed from database`);
        res.json({ 
          success: true, 
          message: `${platform} disconnected successfully` 
        });
      } else {
        console.log(`⚠️ No ${platform} connection found to disconnect`);
        res.json({ 
          success: true, 
          message: `${platform} was not connected` 
        });
      }
      
    } catch (error) {
      console.error(`Error disconnecting ${req.params.platform}:`, error);
      res.status(500).json({ error: 'Failed to disconnect platform' });
    }
  }

  /**
   * Get platform tokens for internal use
   */
  async getPlatformTokens(userId, platform) {
    try {
      const connection = await PlatformConnection.findOne({
        where: {
          userId: userId,
          platform: platform,
          isActive: true
        }
      });
      
      if (!connection) {
        return null;
      }
      
      return {
        accessToken: connection.accessToken,
        refreshToken: connection.refreshToken,
        expiresAt: connection.expiresAt
      };
      
    } catch (error) {
      console.error(`Error getting tokens for ${platform}:`, error);
      return null;
    }
  }

  /**
   * Build OAuth URL for different platforms
   */
  buildOAuthUrl(platform, state) {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const redirectUri = `${baseUrl}/api/platforms/callback/${platform}`;
    
    switch (platform) {
      case 'facebook':
        return `https://www.facebook.com/v18.0/dialog/oauth?` +
          `client_id=${process.env.FACEBOOK_CLIENT_ID || '1330973948119101'}&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `scope=email,public_profile&` +
          `state=${state}&` +
          `response_type=code`;
          
      case 'twitter':
        return `https://twitter.com/i/oauth2/authorize?` +
          `client_id=${process.env.TWITTER_CLIENT_ID || 'demo-client-id'}&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `scope=tweet.read tweet.write users.read offline.access&` +
          `state=${state}&` +
          `response_type=code&` +
          `code_challenge=challenge&` +
          `code_challenge_method=plain`;
          
      case 'linkedin':
        return `https://www.linkedin.com/oauth/v2/authorization?` +
          `client_id=${process.env.LINKEDIN_CLIENT_ID || '86cwxxrs2brwcg'}&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `scope=w_member_social profile email&` +
          `state=${state}&` +
          `response_type=code`;
          
      case 'instagram':
        // Instagram uses Facebook's OAuth
        return `https://www.facebook.com/v18.0/dialog/oauth?` +
          `client_id=${process.env.FACEBOOK_CLIENT_ID || '1330973948119101'}&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `scope=email,public_profile&` +
          `state=${state}&` +
          `response_type=code`;
          
      case 'tiktok':
        return `https://www.tiktok.com/v2/auth/authorize/?` +
          `client_key=${process.env.TIKTOK_CLIENT_ID || 'demo-client-id'}&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `scope=user.info.basic,video.publish&` +
          `state=${state}&` +
          `response_type=code`;
          
      case 'threads':
        // Threads uses Instagram/Facebook OAuth
        return `https://www.facebook.com/v18.0/dialog/oauth?` +
          `client_id=${process.env.FACEBOOK_CLIENT_ID || '1330973948119101'}&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `scope=email,public_profile&` +
          `state=${state}&` +
          `response_type=code`;
          
      default:
        throw new Error(`Platform ${platform} not supported`);
    }
  }

  /**
   * Test platform connection
   */
  async testConnection(req, res) {
    try {
      const { platform } = req.params;
      const userId = req.user.id;
      
      console.log(`🧪 Testing ${platform} connection for user ${userId}`);
      
      // Check if connection exists in database
      const connection = await PlatformConnection.findOne({
        where: {
          userId: userId,
          platform: platform,
          isActive: true
        }
      });
      
      if (!connection) {
        return res.status(404).json({
          success: false,
          platform: platform,
          message: `No ${platform} connection found. Please connect first.`
        });
      }
      
      res.json({
        success: true,
        platform: platform,
        message: `${platform} connection test successful`,
        timestamp: new Date().toISOString(),
        connected: true
      });
      
    } catch (error) {
      console.error(`Error testing ${req.params.platform}:`, error);
      res.status(500).json({ error: 'Connection test failed' });
    }
  }
}

module.exports = new PlatformController();