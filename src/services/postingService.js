const { Campaign, Post } = require('../../models');

// Add the missing method directly to Campaign prototype
Campaign.prototype.isReadyToPost = function() {
  if (!this.isActive) {
    return false;
  }
  if (!this.nextPostAt) {
    return true;
  }
  return new Date() >= this.nextPostAt;
};

class PostingService {

  // Main function to execute a campaign post across all selected platforms
  async executeCampaignPost(campaignId) {
    try {
      console.log(`🚀 Executing campaign post for campaign ID: ${campaignId}`);
      
      // Get campaign details
      const campaign = await Campaign.findByPk(campaignId);
      
      if (!campaign) {
        throw new Error(`Campaign ${campaignId} not found`);
      }

      if (!campaign.isActive) {
        console.log(`⚠️ Campaign ${campaignId} is not active. Skipping post.`);
        return { success: false, message: 'Campaign not active' };
      }

      // Check if campaign is ready to post
      if (!campaign.isReadyToPost()) {
        console.log(`⏰ Campaign ${campaignId} not ready to post yet. Next post at: ${campaign.nextPostAt}`);
        return { success: false, message: 'Not ready to post yet' };
      }
      
      const platforms = campaign.getPlatformsArray();
      const results = {};
      
      console.log(`📱 Posting to platforms: ${platforms.join(', ')}`);
      
      // Post to each selected platform
      for (const platform of platforms) {
        try {
          console.log(`📤 Posting to ${platform}...`);
          
          const result = await this.postToPlatform(campaign, platform);
          results[platform] = result;
          
          if (result.success) {
            console.log(`✅ Successfully posted to ${platform}`);
          } else {
            console.log(`❌ Failed to post to ${platform}: ${result.error}`);
          }
          
        } catch (error) {
          console.error(`❌ Error posting to ${platform}:`, error.message);
          results[platform] = {
            success: false,
            error: error.message,
            timestamp: new Date()
          };
        }
      }
      
      // Update campaign statistics
      await this.updateCampaignStats(campaign, results);
      
      // Schedule next post
      await this.scheduleNextPost(campaign);
      
      return {
        success: true,
        campaignId: campaign.id,
        campaignName: campaign.name,
        results: results,
        nextPostAt: campaign.nextPostAt
      };
      
    } catch (error) {
      console.error('❌ Error executing campaign post:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Post to a specific platform
  async postToPlatform(campaign, platform) {
    try {
      // Get platform-specific formatted content
      const formattedContent = this.formatContentForPlatform(campaign.content, platform);
      
      // Simulate posting to platform (replace with real API calls later)
      const postResult = await this.simulatePost(campaign, platform, formattedContent);
      
      // Log the post attempt
      await this.logCampaignPost(campaign.id, platform, postResult.success, postResult);
      
      return {
        success: postResult.success,
        platform: platform,
        content: formattedContent,
        timestamp: new Date(),
        data: postResult
      };
      
    } catch (error) {
      // Log failed post
      await this.logCampaignPost(campaign.id, platform, false, { error: error.message });
      
      return {
        success: false,
        platform: platform,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  // Format content for specific platforms
  formatContentForPlatform(content, platform) {
    switch (platform) {
      case 'twitter':
        // Twitter has 280 character limit
        if (content.length > 280) {
          return content.substring(0, 277) + '...';
        }
        return content + ' #automation #socialmedia';
        
      case 'facebook':
        // Facebook allows longer content
        return content + '\n\n#SocialMediaAutomation #Marketing';
        
      case 'linkedin':
        // LinkedIn professional tone
        return content + '\n\n#ProfessionalDevelopment #Business #LinkedIn';
        
      case 'instagram':
        // Instagram hashtag heavy
        return content + '\n\n#Instagram #Visual #Content #Engagement';
        
      case 'tiktok':
        // TikTok trending hashtags
        return content + '\n\n#TikTok #Trending #Viral #Content';
        
      case 'threads':
        // Threads similar to Twitter but allows more
        return content + '\n\n#Threads #Community #Discussion';
        
      default:
        return content;
    }
  }

  // Simulate posting (replace with real API calls later)
  async simulatePost(campaign, platform, content) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate 90% success rate
    const success = Math.random() > 0.1;
    
    if (success) {
      return {
        success: true,
        postId: `${platform}_${Date.now()}`,
        message: `Posted successfully to ${platform}`,
        engagement: {
          likes: Math.floor(Math.random() * 50),
          shares: Math.floor(Math.random() * 10),
          comments: Math.floor(Math.random() * 15)
        }
      };
    } else {
      throw new Error(`Simulated ${platform} API error`);
    }
  }

  // Update campaign statistics after posting
  async updateCampaignStats(campaign, results) {
    try {
      const totalAttempts = Object.keys(results).length;
      const successfulPosts = Object.values(results).filter(result => result.success).length;
      
      // Update campaign counters
      campaign.totalPosts += totalAttempts;
      campaign.successfulPosts += successfulPosts;
      campaign.lastPostedAt = new Date();
      
      await campaign.save();
      
      console.log(`📊 Updated campaign stats: ${successfulPosts}/${totalAttempts} successful posts`);
      
    } catch (error) {
      console.error('❌ Error updating campaign stats:', error);
    }
  }

  // Schedule the next post for the campaign
  async scheduleNextPost(campaign) {
    try {
      const nextPostTime = new Date(Date.now() + (campaign.intervalMinutes * 60 * 1000));
      
      campaign.nextPostAt = nextPostTime;
      await campaign.save();
      
      console.log(`⏰ Next post scheduled for: ${nextPostTime.toLocaleString()}`);
      
    } catch (error) {
      console.error('❌ Error scheduling next post:', error);
    }
  }

  // Log campaign post to database
  async logCampaignPost(campaignId, platform, success, data, errorMessage = null) {
    try {
      await Post.create({
        content: `Campaign ${campaignId}: ${platform} post`,
        mediaUrls: null,
        scheduledTime: new Date(),
        status: success ? 'posted' : 'failed',
        platforms: platform
      });
      
      console.log(`📝 Logged ${platform} post: ${success ? 'SUCCESS' : 'FAILED'}`);
      
    } catch (error) {
      console.error('❌ Error logging post:', error);
    }
  }

  // Get campaign posting status
  async getCampaignStatus(campaignId) {
    try {
      const campaign = await Campaign.findByPk(campaignId);
      
      if (!campaign) {
        return { error: 'Campaign not found' };
      }
      
      return {
        id: campaign.id,
        name: campaign.name,
        isActive: campaign.isActive,
        status: campaign.getStatus(),
        totalPosts: campaign.totalPosts,
        successfulPosts: campaign.successfulPosts,
        successRate: campaign.getSuccessRate(),
        lastPostedAt: campaign.lastPostedAt,
        nextPostAt: campaign.nextPostAt,
        platforms: campaign.getPlatformsArray(),
        isReadyToPost: campaign.isReadyToPost()
      };
      
    } catch (error) {
      return { error: error.message };
    }
  }

  // Manual trigger for testing
  async triggerManualPost(campaignId) {
    console.log(`🔧 Manual trigger for campaign ${campaignId}`);
    return await this.executeCampaignPost(campaignId);
  }

}

module.exports = new PostingService();