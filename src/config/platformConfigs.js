// Platform OAuth configurations
// You need to get these values from each platform's developer console

const platformConfigs = {
  
  // Facebook Configuration
  facebook: {
    clientId: process.env.FACEBOOK_CLIENT_ID || 'your-facebook-app-id',
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET || 'your-facebook-app-secret',
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    redirectUri: process.env.BASE_URL + '/api/platforms/callback/facebook',
    scope: 'pages_manage_posts,pages_read_engagement,pages_show_list,business_management'
  },
  
  // Twitter Configuration
  twitter: {
    clientId: process.env.TWITTER_CLIENT_ID || 'your-twitter-client-id',
    clientSecret: process.env.TWITTER_CLIENT_SECRET || 'your-twitter-client-secret',
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    redirectUri: process.env.BASE_URL + '/api/platforms/callback/twitter',
    scope: 'tweet.read,tweet.write,users.read,offline.access'
  },
  
  // LinkedIn Configuration
  linkedin: {
    clientId: process.env.LINKEDIN_CLIENT_ID || 'your-linkedin-client-id',
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET || 'your-linkedin-client-secret',
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    redirectUri: process.env.BASE_URL + '/api/platforms/callback/linkedin',
    scope: 'w_member_social,r_organization_social'
  },
  
  // Instagram Configuration (uses Facebook Graph API)
  instagram: {
    clientId: process.env.FACEBOOK_CLIENT_ID || 'your-facebook-app-id', // Same as Facebook
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET || 'your-facebook-app-secret',
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    redirectUri: process.env.BASE_URL + '/api/platforms/callback/instagram',
    scope: 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement'
  },
  
  // TikTok Configuration
  tiktok: {
    clientId: process.env.TIKTOK_CLIENT_ID || 'your-tiktok-client-key',
    clientSecret: process.env.TIKTOK_CLIENT_SECRET || 'your-tiktok-client-secret',
    authUrl: 'https://www.tiktok.com/v2/auth/authorize',
    tokenUrl: 'https://open.tiktokapis.com/v2/oauth/token',
    redirectUri: process.env.BASE_URL + '/api/platforms/callback/tiktok',
    scope: 'user.info.basic,video.publish,video.upload'
  },
  
  // Threads Configuration (uses Instagram Graph API)
  threads: {
    clientId: process.env.FACEBOOK_CLIENT_ID || 'your-facebook-app-id', // Same as Facebook
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET || 'your-facebook-app-secret',
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    redirectUri: process.env.BASE_URL + '/api/platforms/callback/threads',
    scope: 'threads_basic,threads_content_publish'
  }
};

// Validation function to check if all required configs are present
function validatePlatformConfig(platform) {
  const config = platformConfigs[platform];
  
  if (!config) {
    throw new Error(`Configuration not found for platform: ${platform}`);
  }
  
  const requiredFields = ['clientId', 'clientSecret', 'authUrl', 'tokenUrl', 'redirectUri', 'scope'];
  
  for (const field of requiredFields) {
    if (!config[field] || config[field].includes('your-')) {
      throw new Error(`Missing or invalid ${field} for ${platform}. Please check your environment variables.`);
    }
  }
  
  return true;
}

// Get configuration for a specific platform
function getPlatformConfig(platform) {
  if (!platformConfigs[platform]) {
    throw new Error(`Platform ${platform} is not supported`);
  }
  
  return platformConfigs[platform];
}

// Get all supported platform names
function getSupportedPlatforms() {
  return Object.keys(platformConfigs);
}

// Check if a platform is supported
function isPlatformSupported(platform) {
  return Object.hasOwnProperty.call(platformConfigs, platform);
}

module.exports = {
  ...platformConfigs,
  validatePlatformConfig,
  getPlatformConfig,
  getSupportedPlatforms,
  isPlatformSupported
};