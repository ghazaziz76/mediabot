const threadsService = require('../services/threadsService');

/**
 * Threads Controller - Handle Threads-specific features
 */
class ThreadsController {

  /**
   * Search for users by keywords
   */
  async searchUsers(req, res) {
    try {
      const { keywords, maxResults = 5 } = req.query;
      
      if (!keywords) {
        return res.status(400).json({
          success: false,
          error: 'Keywords parameter is required'
        });
      }

      const keywordArray = keywords.split(',').map(k => k.trim());
      const users = threadsService.searchUsersByKeywords(keywordArray, parseInt(maxResults));

      res.json({
        success: true,
        data: {
          keywords: keywordArray,
          totalResults: users.length,
          users: users
        }
      });

    } catch (error) {
      console.error('Error searching Threads users:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get users to mention for specific content
   */
  async getUsersToMention(req, res) {
    try {
      const { content, maxMentions = 3 } = req.body;
      
      if (!content) {
        return res.status(400).json({
          success: false,
          error: 'Content parameter is required'
        });
      }

      const users = threadsService.getUsersToMention(content, parseInt(maxMentions));

      res.json({
        success: true,
        data: {
          content: content,
          suggestedMentions: users,
          totalSuggestions: users.length
        }
      });

    } catch (error) {
      console.error('Error getting users to mention:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Optimize content for Threads
   */
  async optimizeContent(req, res) {
    try {
      const { content } = req.body;
      
      if (!content) {
        return res.status(400).json({
          success: false,
          error: 'Content parameter is required'
        });
      }

      const optimization = threadsService.optimizeForThreads(content, {});

      res.json({
        success: true,
        data: {
          originalContent: content,
          optimizedContent: optimization.content,
          mentionedUsers: optimization.mentionedUsers,
          addedHashtags: optimization.addedHashtags
        }
      });

    } catch (error) {
      console.error('Error optimizing content for Threads:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get mention analytics
   */
  async getMentionAnalytics(req, res) {
    try {
      const analytics = threadsService.getMentionAnalytics();

      res.json({
        success: true,
        data: analytics
      });

    } catch (error) {
      console.error('Error getting mention analytics:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get trending topics
   */
  async getTrendingTopics(req, res) {
    try {
      const topics = threadsService.getTrendingTopics();

      res.json({
        success: true,
        data: {
          trending: topics,
          lastUpdated: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error getting trending topics:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Build target audience
   */
  async buildTargetAudience(req, res) {
    try {
      const { interests, minFollowers = 5000, minEngagement = 6.0 } = req.body;
      
      if (!interests || !Array.isArray(interests)) {
        return res.status(400).json({
          success: false,
          error: 'Interests array is required'
        });
      }

      const targetUsers = threadsService.buildTargetAudience(
        interests, 
        parseInt(minFollowers), 
        parseFloat(minEngagement)
      );

      res.json({
        success: true,
        data: {
          criteria: {
            interests: interests,
            minFollowers: minFollowers,
            minEngagement: minEngagement
          },
          targetUsers: targetUsers,
          totalUsers: targetUsers.length
        }
      });

    } catch (error) {
      console.error('Error building target audience:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Preview Threads post with optimizations
   */
  async previewPost(req, res) {
    try {
      const { content } = req.body;
      
      if (!content) {
        return res.status(400).json({
          success: false,
          error: 'Content parameter is required'
        });
      }

      // Get optimization preview
      const optimization = threadsService.optimizeForThreads(content, {});
      
      // Get analytics for context
      const analytics = threadsService.getMentionAnalytics();
      
      // Get trending topics
      const trending = threadsService.getTrendingTopics();

      res.json({
        success: true,
        data: {
          preview: {
            original: content,
            optimized: optimization.content,
            mentionedUsers: optimization.mentionedUsers,
            addedHashtags: optimization.addedHashtags
          },
          context: {
            totalUsersMentioned: analytics.totalUsersMentioned,
            recentMentions: analytics.recentMentions.length,
            trendingTopics: trending.slice(0, 5)
          }
        }
      });

    } catch (error) {
      console.error('Error previewing Threads post:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new ThreadsController();