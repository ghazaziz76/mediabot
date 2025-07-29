const analyticsService = require('../services/analyticsService');

/**
 * Analytics Controller - Handle analytics requests
 */
class AnalyticsController {

  /**
   * Get campaign analytics
   */
  async getCampaignAnalytics(req, res) {
    try {
      const { campaignId } = req.params;
      const { timeRange = '7d' } = req.query;

      const analytics = await analyticsService.getCampaignAnalytics(campaignId, timeRange);

      res.json({
        success: true,
        data: analytics
      });

    } catch (error) {
      console.error('Error getting campaign analytics:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get platform analytics
   */
  async getPlatformAnalytics(req, res) {
    try {
      const userId = req.user.id;
      const { timeRange = '7d' } = req.query;

      const analytics = await analyticsService.getPlatformAnalytics(userId, timeRange);

      res.json({
        success: true,
        data: analytics
      });

    } catch (error) {
      console.error('Error getting platform analytics:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get best performing content
   */
  async getBestPerformingContent(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 10 } = req.query;

      const bestContent = await analyticsService.getBestPerformingContent(userId, limit);

      res.json({
        success: true,
        data: bestContent
      });

    } catch (error) {
      console.error('Error getting best performing content:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get analytics dashboard summary
   */
  async getDashboardSummary(req, res) {
    try {
      const userId = req.user.id;
      
      // Get analytics for different time ranges
      const last24h = await analyticsService.getPlatformAnalytics(userId, '24h');
      const last7d = await analyticsService.getPlatformAnalytics(userId, '7d');
      const last30d = await analyticsService.getPlatformAnalytics(userId, '30d');

      // Get best performing content
      const bestContent = await analyticsService.getBestPerformingContent(userId, 5);

      res.json({
        success: true,
        data: {
          last24h: last24h.summary,
          last7d: last7d.summary,
          last30d: last30d.summary,
          bestContent: bestContent,
          platformBreakdown: last7d.platforms
        }
      });

    } catch (error) {
      console.error('Error getting dashboard summary:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new AnalyticsController();