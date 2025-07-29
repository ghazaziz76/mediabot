const hashtagService = require('../services/hashtagService');

class HashtagController {

  // POST /api/hashtags - Create a new hashtag group
  async createHashtagGroup(req, res) {
    try {
      const userId = req.user.id;
      const { name, hashtags, description, platform, category } = req.body;

      // Validation
      if (!name || !hashtags) {
        return res.status(400).json({
          error: 'Name and hashtags are required'
        });
      }

      if (name.length < 3) {
        return res.status(400).json({
          error: 'Group name must be at least 3 characters long'
        });
      }

      if (!Array.isArray(hashtags) || hashtags.length === 0) {
        return res.status(400).json({
          error: 'At least one hashtag is required'
        });
      }

      if (hashtags.length > 30) {
        return res.status(400).json({
          error: 'Maximum 30 hashtags allowed per group'
        });
      }

      const hashtagData = {
        name: name.trim(),
        hashtags: hashtags,
        description: description ? description.trim() : '',
        platform: platform || 'all',
        category: category || 'general'
      };

      const result = await hashtagService.createHashtagGroup(userId, hashtagData);

      if (result.success) {
        res.status(201).json({
          message: result.message,
          hashtagGroup: result.hashtagGroup
        });
      } else {
        res.status(400).json({
          error: result.error
        });
      }

    } catch (error) {
      console.error('Error creating hashtag group:', error);
      res.status(500).json({
        error: 'Failed to create hashtag group'
      });
    }
  }

  // GET /api/hashtags - Get all hashtag groups for user
  async getAllHashtagGroups(req, res) {
    try {
      const userId = req.user.id;
      const { platform, category, search } = req.query;

      let result;

      if (search) {
        // Search hashtag groups
        result = await hashtagService.searchHashtagGroups(userId, search);
      } else if (platform) {
        // Get by platform
        result = await hashtagService.getHashtagGroupsByPlatform(userId, platform);
      } else if (category) {
        // Get by category
        result = await hashtagService.getHashtagGroupsByCategory(userId, category);
      } else {
        // Get all hashtag groups
        result = await hashtagService.getUserHashtagGroups(userId);
      }

      if (result.success) {
        res.json({
          hashtagGroups: result.hashtagGroups,
          count: result.hashtagGroups.length
        });
      } else {
        res.status(400).json({
          error: result.error
        });
      }

    } catch (error) {
      console.error('Error getting hashtag groups:', error);
      res.status(500).json({
        error: 'Failed to get hashtag groups'
      });
    }
  }

  // GET /api/hashtags/:id - Get a single hashtag group
  async getHashtagGroup(req, res) {
    try {
      const userId = req.user.id;
      const groupId = req.params.id;

      if (!groupId || isNaN(groupId)) {
        return res.status(400).json({
          error: 'Valid hashtag group ID is required'
        });
      }

      const result = await hashtagService.getHashtagGroupById(groupId, userId);

      if (result.success) {
        res.json({
          hashtagGroup: result.hashtagGroup
        });
      } else {
        res.status(404).json({
          error: result.error
        });
      }

    } catch (error) {
      console.error('Error getting hashtag group:', error);
      res.status(500).json({
        error: 'Failed to get hashtag group'
      });
    }
  }

  // PUT /api/hashtags/:id - Update a hashtag group
  async updateHashtagGroup(req, res) {
    try {
      const userId = req.user.id;
      const groupId = req.params.id;
      const { name, hashtags, description, platform, category } = req.body;

      if (!groupId || isNaN(groupId)) {
        return res.status(400).json({
          error: 'Valid hashtag group ID is required'
        });
      }

      // Validation
      if (name && name.length < 3) {
        return res.status(400).json({
          error: 'Group name must be at least 3 characters long'
        });
      }

      if (hashtags && (!Array.isArray(hashtags) || hashtags.length === 0)) {
        return res.status(400).json({
          error: 'At least one hashtag is required'
        });
      }

      if (hashtags && hashtags.length > 30) {
        return res.status(400).json({
          error: 'Maximum 30 hashtags allowed per group'
        });
      }

      const updateData = {};
      if (name) updateData.name = name.trim();
      if (hashtags) updateData.hashtags = hashtags;
      if (description !== undefined) updateData.description = description.trim();
      if (platform) updateData.platform = platform;
      if (category) updateData.category = category;

      const result = await hashtagService.updateHashtagGroup(groupId, userId, updateData);

      if (result.success) {
        res.json({
          message: result.message,
          hashtagGroup: result.hashtagGroup
        });
      } else {
        res.status(404).json({
          error: result.error
        });
      }

    } catch (error) {
      console.error('Error updating hashtag group:', error);
      res.status(500).json({
        error: 'Failed to update hashtag group'
      });
    }
  }

  // DELETE /api/hashtags/:id - Delete a hashtag group
  async deleteHashtagGroup(req, res) {
    try {
      const userId = req.user.id;
      const groupId = req.params.id;

      if (!groupId || isNaN(groupId)) {
        return res.status(400).json({
          error: 'Valid hashtag group ID is required'
        });
      }

      const result = await hashtagService.deleteHashtagGroup(groupId, userId);

      if (result.success) {
        res.json({
          message: result.message
        });
      } else {
        res.status(404).json({
          error: result.error
        });
      }

    } catch (error) {
      console.error('Error deleting hashtag group:', error);
      res.status(500).json({
        error: 'Failed to delete hashtag group'
      });
    }
  }

  // GET /api/hashtags/random/:platform - Get random hashtags for a platform
  async getRandomHashtags(req, res) {
    try {
      const userId = req.user.id;
      const platform = req.params.platform;
      const count = parseInt(req.query.count) || 5;

      if (count > 20) {
        return res.status(400).json({
          error: 'Maximum 20 hashtags can be requested at once'
        });
      }

      const result = await hashtagService.getRandomHashtags(userId, platform, count);

      if (result.success) {
        res.json({
          hashtags: result.hashtags,
          count: result.hashtags.length,
          platform: platform
        });
      } else {
        res.status(400).json({
          error: result.error
        });
      }

    } catch (error) {
      console.error('Error getting random hashtags:', error);
      res.status(500).json({
        error: 'Failed to get random hashtags'
      });
    }
  }

  // GET /api/hashtags/stats - Get hashtag statistics
  async getHashtagStats(req, res) {
    try {
      const userId = req.user.id;

      const result = await hashtagService.getHashtagStats(userId);

      if (result.success) {
        res.json({
          stats: result.stats
        });
      } else {
        res.status(400).json({
          error: result.error
        });
      }

    } catch (error) {
      console.error('Error getting hashtag stats:', error);
      res.status(500).json({
        error: 'Failed to get hashtag statistics'
      });
    }
  }

  // POST /api/hashtags/suggestions - Generate hashtag suggestions
  async generateSuggestions(req, res) {
    try {
      const { content, platform } = req.body;

      if (!content) {
        return res.status(400).json({
          error: 'Content is required to generate suggestions'
        });
      }

      if (content.length < 10) {
        return res.status(400).json({
          error: 'Content must be at least 10 characters long'
        });
      }

      const result = await hashtagService.generateHashtagSuggestions(content, platform || 'all');

      if (result.success) {
        res.json({
          suggestions: result.suggestions,
          count: result.suggestions.length,
          platform: platform || 'all'
        });
      } else {
        res.status(400).json({
          error: result.error
        });
      }

    } catch (error) {
      console.error('Error generating hashtag suggestions:', error);
      res.status(500).json({
        error: 'Failed to generate hashtag suggestions'
      });
    }
  }

  // GET /api/hashtags/platforms - Get all supported platforms
  async getPlatforms(req, res) {
    try {
      const platforms = [
        { name: 'all', displayName: 'All Platforms', description: 'Suitable for all platforms' },
        { name: 'facebook', displayName: 'Facebook', description: 'Facebook-specific hashtags' },
        { name: 'twitter', displayName: 'Twitter', description: 'Twitter-specific hashtags' },
        { name: 'linkedin', displayName: 'LinkedIn', description: 'Professional LinkedIn hashtags' },
        { name: 'instagram', displayName: 'Instagram', description: 'Visual Instagram hashtags' },
        { name: 'tiktok', displayName: 'TikTok', description: 'Trending TikTok hashtags' },
        { name: 'threads', displayName: 'Threads', description: 'Community Threads hashtags' }
      ];

      res.json({
        platforms: platforms
      });

    } catch (error) {
      console.error('Error getting platforms:', error);
      res.status(500).json({
        error: 'Failed to get platforms'
      });
    }
  }

  // GET /api/hashtags/categories - Get all available categories
  async getCategories(req, res) {
    try {
      const categories = [
        'general',
        'marketing',
        'business',
        'lifestyle',
        'technology',
        'entertainment',
        'sports',
        'travel',
        'food',
        'fashion',
        'health',
        'education',
        'news',
        'photography',
        'art'
      ];

      res.json({
        categories: categories
      });

    } catch (error) {
      console.error('Error getting categories:', error);
      res.status(500).json({
        error: 'Failed to get categories'
      });
    }
  }

  // POST /api/hashtags/:id/duplicate - Duplicate a hashtag group
  async duplicateHashtagGroup(req, res) {
    try {
      const userId = req.user.id;
      const groupId = req.params.id;

      if (!groupId || isNaN(groupId)) {
        return res.status(400).json({
          error: 'Valid hashtag group ID is required'
        });
      }

      // Get the original hashtag group
      const originalResult = await hashtagService.getHashtagGroupById(groupId, userId);

      if (!originalResult.success) {
        return res.status(404).json({
          error: originalResult.error
        });
      }

      // Create a copy with "Copy of" prefix
      const originalGroup = originalResult.hashtagGroup;
      const duplicateData = {
        name: `Copy of ${originalGroup.name}`,
        hashtags: originalGroup.hashtags,
        description: originalGroup.description,
        platform: originalGroup.platform,
        category: originalGroup.category
      };

      const result = await hashtagService.createHashtagGroup(userId, duplicateData);

      if (result.success) {
        res.status(201).json({
          message: 'Hashtag group duplicated successfully',
          hashtagGroup: result.hashtagGroup
        });
      } else {
        res.status(400).json({
          error: result.error
        });
      }

    } catch (error) {
      console.error('Error duplicating hashtag group:', error);
      res.status(500).json({
        error: 'Failed to duplicate hashtag group'
      });
    }
  }
}

module.exports = new HashtagController();