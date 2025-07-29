const { Post, Campaign } = require('../../models');
const { Op } = require('sequelize');

/**
 * AnalyticsService - Simple version without database associations
 */
class AnalyticsService {
  constructor() {
    console.log('📊 AnalyticsService initialized');
  }

  /**
   * Get platform performance analytics
   */
  async getPlatformAnalytics(userId, timeRange = '7d') {
    try {
      // Get user's campaigns
      const userCampaigns = await Campaign.findAll({
        where: { userId: userId }
      });

      if (userCampaigns.length === 0) {
        return {
          timeRange: timeRange,
          platforms: {},
          summary: {
            totalPosts: 0,
            totalSuccessful: 0,
            overallSuccessRate: "0",
            totalEngagement: 0,
            averageEngagementPerPost: "0"
          }
        };
      }

      const campaignIds = userCampaigns.map(campaign => campaign.id);
      const dateFilter = this.getDateFilter(timeRange);

      // Get posts for those campaigns
      const posts = await Post.findAll({
        where: {
          campaignId: campaignIds,
          createdAt: dateFilter
        }
      });

      const platformStats = {};
      
      posts.forEach(post => {
        if (!platformStats[post.platform]) {
          platformStats[post.platform] = {
            totalPosts: 0,
            successfulPosts: 0,
            failedPosts: 0
          };
        }

        const stats = platformStats[post.platform];
        stats.totalPosts++;
        
        if (post.success) {
          stats.successfulPosts++;
        } else {
          stats.failedPosts++;
        }
      });

      // Calculate success rates
      Object.keys(platformStats).forEach(platform => {
        const stats = platformStats[platform];
        stats.successRate = stats.totalPosts > 0 
          ? ((stats.successfulPosts / stats.totalPosts) * 100).toFixed(1)
          : "0";
      });

      return {
        timeRange: timeRange,
        platforms: platformStats,
        summary: this.calculateOverallSummary(platformStats)
      };

    } catch (error) {
      console.error('Error getting platform analytics:', error);
      return {
        timeRange: timeRange,
        platforms: {},
        summary: {
          totalPosts: 0,
          totalSuccessful: 0,
          overallSuccessRate: "0",
          totalEngagement: 0,
          averageEngagementPerPost: "0"
        }
      };
    }
  }

  /**
   * Get campaign analytics
   */
  async getCampaignAnalytics(campaignId, timeRange = '7d') {
    try {
      const campaign = await Campaign.findByPk(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      const dateFilter = this.getDateFilter(timeRange);
      
      const posts = await Post.findAll({
        where: {
          campaignId: campaignId,
          createdAt: dateFilter
        }
      });

      let successCount = 0;
      posts.forEach(post => {
        if (post.success) successCount++;
      });

      return {
        campaign: {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status
        },
        timeRange: timeRange,
        analytics: {
          totalPosts: posts.length,
          successfulPosts: successCount,
          failedPosts: posts.length - successCount,
          successRate: posts.length > 0 ? ((successCount / posts.length) * 100).toFixed(1) : "0"
        },
        posts: posts.length
      };

    } catch (error) {
      console.error('Error getting campaign analytics:', error);
      throw error;
    }
  }

  /**
   * Get best performing content
   */
  async getBestPerformingContent(userId, limit = 10) {
    try {
      const userCampaigns = await Campaign.findAll({
        where: { userId: userId }
      });

      if (userCampaigns.length === 0) {
        return [];
      }

      const campaignIds = userCampaigns.map(campaign => campaign.id);

      const posts = await Post.findAll({
        where: {
          campaignId: campaignIds,
          success: true
        },
        limit: limit,
        order: [['createdAt', 'DESC']]
      });

      return posts.map(post => {
        const campaign = userCampaigns.find(c => c.id === post.campaignId);
        return {
          campaignId: post.campaignId,
          platform: post.platform,
          createdAt: post.createdAt,
          campaignName: campaign ? campaign.name : 'Unknown',
          success: post.success
        };
      });

    } catch (error) {
      console.error('Error getting best performing content:', error);
      return [];
    }
  }

  /**
   * Calculate overall summary
   */
  calculateOverallSummary(platformStats) {
    let totalPosts = 0;
    let totalSuccessful = 0;

    Object.values(platformStats).forEach(stats => {
      totalPosts += stats.totalPosts;
      totalSuccessful += stats.successfulPosts;
    });

    return {
      totalPosts,
      totalSuccessful,
      overallSuccessRate: totalPosts > 0 ? ((totalSuccessful / totalPosts) * 100).toFixed(1) : "0",
      totalEngagement: 0,
      averageEngagementPerPost: "0"
    };
  }

  /**
   * Get date filter for time range
   */
  getDateFilter(timeRange) {
    const now = new Date();
    let startDate;

    switch (timeRange) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    return {
      [Op.gte]: startDate
    };
  }
}

module.exports = new AnalyticsService();