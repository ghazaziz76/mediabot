const { Campaign, Post } = require('../../models');

// Import all platform APIs
const facebookAPI = require('../integrations/facebookAPI');
const twitterAPI = require('../integrations/twitterAPI');
const linkedinAPI = require('../integrations/linkedinAPI');
const instagramAPI = require('../integrations/instagramAPI');
const tiktokAPI = require('../integrations/tiktokAPI');
const threadsAPI = require('../integrations/threadsAPI');
const { Campaign, Post } = require('../../models');
const analyticsService = require('./analyticsService');
const threadsService = require('./threadsService');

/**
 * PostingService - Now with REAL Platform APIs!
 * Handles posting to all 6 social media platforms using real APIs
 */
class PostingService {
  constructor() {
    console.log('🚀 PostingService initialized with REAL platform APIs');
  }

  /**
   * Check if campaign is ready to post
   */
  async isReadyToPost(campaignId) {
    try {
      const campaign = await Campaign.findByPk(campaignId);
      
      if (!campaign) {
        return { ready: false, reason: 'Campaign not found' };
      }

      if (campaign.status !== 'active') {
        return { ready: false, reason: 'Campaign is not active' };
      }

      if (!campaign.content || campaign.content.trim() === '') {
        return { ready: false, reason: 'Campaign has no content' };
      }

      if (!campaign.platforms || campaign.platforms.length === 0) {
        return { ready: false, reason: 'No platforms selected' };
      }

      // Check if enough time has passed since last post
      if (campaign.lastPostedAt) {
        const timeSinceLastPost = Date.now() - new Date(campaign.lastPostedAt).getTime();
        const intervalMs = (campaign.intervalHours || 2) * 60 * 60 * 1000;
        
        if (timeSinceLastPost < intervalMs) {
          const nextPostTime = new Date(new Date(campaign.lastPostedAt).getTime() + intervalMs);
          return { 
            ready: false, 
            reason: 'Interval not reached yet',
            nextPostTime: nextPostTime.toISOString()
          };
        }
      }

      return { ready: true };

    } catch (error) {
      console.error('Error checking campaign readiness:', error);
      return { ready: false, reason: 'Error checking campaign status' };
    }
  }

  /**
   * Get platform tokens (placeholder - you'll implement OAuth later)
   */
  async getPlatformTokens(userId, platform) {
    // TODO: In Phase 2, this will get real OAuth tokens from database
    // For now, return placeholder tokens for testing
    
    const placeholderTokens = {
      facebook: {
        accessToken: process.env.FACEBOOK_ACCESS_TOKEN || 'placeholder_facebook_token'
      },
      twitter: {
        consumerKey: process.env.TWITTER_CONSUMER_KEY || 'placeholder_consumer_key',
        consumerSecret: process.env.TWITTER_CONSUMER_SECRET || 'placeholder_consumer_secret',
        accessToken: process.env.TWITTER_ACCESS_TOKEN || 'placeholder_access_token',
        tokenSecret: process.env.TWITTER_TOKEN_SECRET || 'placeholder_token_secret'
      },
      linkedin: {
        accessToken: process.env.LINKEDIN_ACCESS_TOKEN || 'placeholder_linkedin_token'
      },
      instagram: {
        accessToken: process.env.INSTAGRAM_ACCESS_TOKEN || 'placeholder_instagram_token'
      },
      tiktok: {
        accessToken: process.env.TIKTOK_ACCESS_TOKEN || 'placeholder_tiktok_token'
      },
      threads: {
        accessToken: process.env.THREADS_ACCESS_TOKEN || 'placeholder_threads_token'
      }
    };

    return placeholderTokens[platform];
  }

  /**
   * Post to Facebook using real API
   */
  async postToFacebook(campaignData, tokens) {
    try {
      console.log('📘 Posting to Facebook...');
      
      const result = await facebookAPI.postToFacebook(campaignData, tokens.accessToken);
      
      if (result.success) {
        console.log('✅ Facebook post successful');
        return {
          success: true,
          data: result,
          engagement: { likes: 0, comments: 0, shares: 0 }
        };
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('❌ Facebook posting failed:', error.message);
      return {
        success: false,
        error: error.message,
        platform: 'facebook'
      };
    }
  }

  /**
   * Post to Twitter using real API
   */
  async postToTwitter(campaignData, tokens) {
    try {
      console.log('🐦 Posting to Twitter...');
      
      const result = await twitterAPI.postToTwitter(campaignData, tokens);
      
      if (result.success) {
        console.log('✅ Twitter post successful');
        return {
          success: true,
          data: result,
          engagement: { likes: 0, retweets: 0, replies: 0 }
        };
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('❌ Twitter posting failed:', error.message);
      return {
        success: false,
        error: error.message,
        platform: 'twitter'
      };
    }
  }

  /**
   * Post to LinkedIn using real API
   */
  async postToLinkedIn(campaignData, tokens) {
    try {
      console.log('💼 Posting to LinkedIn...');
      
      const result = await linkedinAPI.postToLinkedIn(campaignData, tokens.accessToken);
      
      if (result.success) {
        console.log('✅ LinkedIn post successful');
        return {
          success: true,
          data: result,
          engagement: { likes: 0, comments: 0, shares: 0 }
        };
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('❌ LinkedIn posting failed:', error.message);
      return {
        success: false,
        error: error.message,
        platform: 'linkedin'
      };
    }
  }

  /**
   * Post to Instagram using real API
   */
  async postToInstagram(campaignData, tokens) {
    try {
      console.log('📸 Posting to Instagram...');
      
      const result = await instagramAPI.postToInstagram(campaignData, tokens.accessToken);
      
      if (result.success) {
        console.log('✅ Instagram post successful');
        return {
          success: true,
          data: result,
          engagement: { likes: 0, comments: 0, shares: 0 }
        };
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('❌ Instagram posting failed:', error.message);
      return {
        success: false,
        error: error.message,
        platform: 'instagram'
      };
    }
  }

  /**
   * Post to TikTok using real API
   */
  async postToTikTok(campaignData, tokens) {
    try {
      console.log('🎵 Posting to TikTok...');
      
      const result = await tiktokAPI.postToTikTok(campaignData, tokens.accessToken);
      
      if (result.success) {
        console.log('✅ TikTok post successful');
        return {
          success: true,
          data: result,
          engagement: { views: 0, likes: 0, comments: 0, shares: 0 }
        };
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('❌ TikTok posting failed:', error.message);
      return {
        success: false,
        error: error.message,
        platform: 'tiktok'
      };
    }
  }

  /**
   * Post to Threads using real API
   */
  async postToThreads(campaignData, tokens) {
    try {
      console.log('🧵 Posting to Threads...');
      
      const result = await threadsAPI.postToThreads(campaignData, tokens.accessToken);
      
      if (result.success) {
        console.log('✅ Threads post successful');
        return {
          success: true,
          data: result,
          engagement: { likes: 0, replies: 0, reposts: 0, quotes: 0 }
        };
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('❌ Threads posting failed:', error.message);
      return {
        success: false,
        error: error.message,
        platform: 'threads'
      };
    }
  }

  /**
   * Execute posting to all selected platforms
   */
  async executePost(campaignId) {
    try {
      console.log(`🚀 Starting post execution for campaign ${campaignId}`);

      // Check if campaign is ready
      const readyCheck = await this.isReadyToPost(campaignId);
      if (!readyCheck.ready) {
        console.log(`⏸️ Campaign not ready: ${readyCheck.reason}`);
        return {
          success: false,
          reason: readyCheck.reason,
          nextPostTime: readyCheck.nextPostTime
        };
      }

      // Get campaign data
      const campaign = await Campaign.findByPk(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      const campaignData = {
        content: campaign.content,
        mediaUrls: campaign.mediaUrls ? JSON.parse(campaign.mediaUrls) : [],
        campaignId: campaign.id
      };

      console.log(`📝 Content: ${campaignData.content.substring(0, 50)}...`);
      console.log(`📸 Media files: ${campaignData.mediaUrls.length}`);

      // Parse selected platforms
      const selectedPlatforms = JSON.parse(campaign.platforms || '[]');
      console.log(`🎯 Target platforms: ${selectedPlatforms.join(', ')}`);

      const results = {};
      let successCount = 0;
      let totalCount = selectedPlatforms.length;

      // Post to each selected platform
      // Post to all selected platforms simultaneously with retry logic
      console.log(`🚀 Starting simultaneous posting to ${selectedPlatforms.length} platforms...`);

      const platformPromises = selectedPlatforms.map(platform => 
      this.postToPlatformWithRetry(platform, campaignData, campaign.userId, campaignId)
    );

    const platformResults = await Promise.allSettled(platformPromises);

    // Process results
    platformResults.forEach((result, index) => {
    const platform = selectedPlatforms[index];
  
    if (result.status === 'fulfilled' && result.value.success) {
      results[platform] = result.value;
      successCount++;
      console.log(`✅ ${platform} posting successful`);
    } else {
      const error = result.status === 'rejected' ? result.reason : result.value.error;
      results[platform] = {
        success: false,
        error: error,
        platform: platform
      };
      console.log(`❌ ${platform} posting failed: ${error}`);
    }
  });

  console.log(`🎯 Simultaneous posting complete: ${successCount}/${totalCount} successful`);
      // Update campaign statistics
      await this.updateCampaignStats(campaignId, successCount, totalCount);

      const successRate = totalCount > 0 ? (successCount / totalCount * 100).toFixed(1) : 0;
      
      console.log(`\n🎯 Post execution complete!`);
      console.log(`✅ Success: ${successCount}/${totalCount} platforms (${successRate}%)`);

      return {
        success: successCount > 0,
        results: results,
        stats: {
          total: totalCount,
          successful: successCount,
          failed: totalCount - successCount,
          successRate: parseFloat(successRate)
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Post execution failed:', error.message);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Log individual post result to database
   */
  async logPostResult(campaignId, platform, result) {
    try {
      await Post.create({
        campaignId: campaignId,
        platform: platform,
        success: result.success,
        errorMessage: result.error || null,
        engagementData: JSON.stringify({
          platformData: result.data || {},
          engagement: result.engagement || {},
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Error logging post result:', error.message);
    }
  }



  /**
   * Update campaign statistics
   */
  async updateCampaignStats(campaignId, successCount, totalCount) {
    try {
      const campaign = await Campaign.findByPk(campaignId);
      if (!campaign) return;

      const newTotalPosts = (campaign.totalPosts || 0) + totalCount;
      const newSuccessfulPosts = (campaign.successfulPosts || 0) + successCount;
      const newSuccessRate = newTotalPosts > 0 ? (newSuccessfulPosts / newTotalPosts * 100) : 0;

      // Calculate next post time
      const nextPostTime = new Date(Date.now() + (campaign.intervalHours || 2) * 60 * 60 * 1000);

      await campaign.update({
        totalPosts: newTotalPosts,
        successfulPosts: newSuccessfulPosts,
        successRate: parseFloat(newSuccessRate.toFixed(1)),
        lastPostedAt: new Date(),
        nextPostAt: nextPostTime
      });

      console.log(`📊 Campaign stats updated: ${newSuccessfulPosts}/${newTotalPosts} posts (${newSuccessRate.toFixed(1)}% success)`);
      console.log(`⏰ Next post scheduled: ${nextPostTime.toISOString()}`);

    } catch (error) {
      console.error('Error updating campaign stats:', error.message);
    }
  }

  /**
   * Optimize content for specific platform
   */
  optimizeContentForPlatform(campaignData, platform) {
    const optimizedData = { ...campaignData };
    
    switch (platform) {
      case 'twitter':
        // Twitter: 280 character limit
        if (optimizedData.content.length > 240) {
          optimizedData.content = optimizedData.content.substring(0, 237) + '...';
        }
        optimizedData.content += '\n\n#automation #socialmedia #twitter';
        break;
        
      case 'facebook':
        // Facebook: Full content with engaging hashtags
        optimizedData.content += '\n\n🚀 Follow us for more updates!\n#SocialMediaAutomation #Marketing #Facebook #Business';
        break;
        
      case 'linkedin':
        // LinkedIn: Professional tone
        optimizedData.content += '\n\n💼 Connect with professionals in your industry.\n#ProfessionalDevelopment #Business #LinkedIn #Networking #CareerGrowth';
        break;
        
      case 'instagram':
        // Instagram: Visual focus with many hashtags
        optimizedData.content += '\n\n📸✨ #Instagram #Visual #Content #Engagement #Photography #Social #Creative #Inspiration #Daily #Follow';
        break;
        
      case 'tiktok':
        // TikTok: Trending and fun
        optimizedData.content += '\n\n🎵🔥 #TikTok #Trending #Viral #Content #ForYou #FYP #Creative #Fun';
        break;
        
      case 'threads':
        // Threads: Use special Threads features (mentions + trending hashtags)
        console.log('🧵 Applying Threads-specific optimizations...');
        const threadsOptimization = threadsService.optimizeForThreads(optimizedData.content, campaignData);
        optimizedData.content = threadsOptimization.content;
        optimizedData.threadsData = {
        mentionedUsers: threadsOptimization.mentionedUsers,
        addedHashtags: threadsOptimization.addedHashtags
        };
        console.log(`✨ Threads optimization complete: ${threadsOptimization.mentionedUsers.length} mentions added`);
        break;
    }
    return optimizedData;
  }

  /**
   * Post to a single platform with retry logic
   */
  async postToPlatformWithRetry(platform, campaignData, userId, campaignId, maxRetries = 2) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📤 Posting to ${platform} (attempt ${attempt}/${maxRetries})`);

        // Get platform tokens
        const tokens = await this.getPlatformTokens(userId, platform);
        
        // Optimize content for this specific platform
        const optimizedData = this.optimizeContentForPlatform(campaignData, platform);
        console.log(`🎨 Content optimized for ${platform}`);
        
        let result;
        
        // Call the appropriate platform API
        switch (platform) {
          case 'facebook':
            result = await this.postToFacebook(optimizedData, tokens);
            break;
          case 'twitter':
            result = await this.postToTwitter(optimizedData, tokens);
            break;
          case 'linkedin':
            result = await this.postToLinkedIn(optimizedData, tokens);
            break;
          case 'instagram':
            result = await this.postToInstagram(optimizedData, tokens);
            break;
          case 'tiktok':
            result = await this.postToTikTok(optimizedData, tokens);
            break;
          case 'threads':
            result = await this.postToThreads(optimizedData, tokens);
            break;
          default:
            throw new Error(`Unsupported platform: ${platform}`);
        }

        // Log the result to database
        await this.logPostResult(campaignId, platform, result);

        // If successful, return the result
        if (result.success) {
          console.log(`✅ ${platform} posting successful on attempt ${attempt}`);
          return result;
        } else {
          // If this was the last attempt, throw error
          if (attempt === maxRetries) {
            throw new Error(result.error || `Failed after ${maxRetries} attempts`);
          }
          
          console.log(`⚠️ ${platform} failed attempt ${attempt}, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
        }

      } catch (error) {
        console.error(`❌ ${platform} attempt ${attempt} failed:`, error.message);
        
        // If this was the last attempt, return failure
        if (attempt === maxRetries) {
          const failureResult = {
            success: false,
            error: error.message,
            platform: platform
          };
          
          await this.logPostResult(campaignId, platform, failureResult);
          return failureResult;
        }
        
        console.log(`🔄 Retrying ${platform} in 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
      }
    }
  }

  /**
   * Test platform connections
   */
  async testPlatformConnections(userId) {
    console.log('🔍 Testing all platform connections...');
    
    const platforms = ['facebook', 'twitter', 'linkedin', 'instagram', 'tiktok', 'threads'];
    const results = {};

    for (const platform of platforms) {
      try {
        const tokens = await this.getPlatformTokens(userId, platform);
        
        let testResult;
        
        switch (platform) {
          case 'facebook':
            testResult = await facebookAPI.testConnection(tokens.accessToken);
            break;
          case 'twitter':
            testResult = await twitterAPI.testConnection(tokens);
            break;
          case 'linkedin':
            testResult = await linkedinAPI.testConnection(tokens.accessToken);
            break;
          case 'instagram':
            testResult = await instagramAPI.testConnection(tokens.accessToken);
            break;
          case 'tiktok':
            testResult = await tiktokAPI.testConnection(tokens.accessToken);
            break;
          case 'threads':
            testResult = await threadsAPI.testConnection(tokens.accessToken);
            break;
        }

        results[platform] = testResult;
        console.log(`${testResult.success ? '✅' : '❌'} ${platform}: ${testResult.success ? 'Connected' : testResult.error}`);

      } catch (error) {
        results[platform] = {
          success: false,
          error: error.message
        };
        console.log(`❌ ${platform}: ${error.message}`);
      }
    }

    return results;
  }
}

module.exports = new PostingService();