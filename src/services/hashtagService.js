const { sequelize, Sequelize } = require('../../models');
const HashtagGroup = require('../../models/hashtagGroup')(sequelize, Sequelize.DataTypes);

class HashtagService {
  
  // Create a new hashtag group
  async createHashtagGroup(userId, hashtagData) {
    try {
      // Clean and validate hashtags
      const cleanedHashtags = this.cleanHashtags(hashtagData.hashtags);
      
      const hashtagGroup = await HashtagGroup.create({
        userId: userId,
        name: hashtagData.name,
        hashtags: JSON.stringify(cleanedHashtags),
        description: hashtagData.description,
        platform: hashtagData.platform || 'all',
        category: hashtagData.category || 'general',
        isActive: true
      });
      
      return {
        success: true,
        hashtagGroup: {
          ...hashtagGroup.toJSON(),
          hashtags: cleanedHashtags
        },
        message: 'Hashtag group created successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get all hashtag groups for a user
  async getUserHashtagGroups(userId) {
    try {
      const hashtagGroups = await HashtagGroup.findAll({
        where: { userId: userId, isActive: true },
        order: [['createdAt', 'DESC']]
      });

      // Convert hashtags JSON string back to array
      const groupsWithParsedHashtags = hashtagGroups.map(group => ({
        ...group.toJSON(),
        hashtags: JSON.parse(group.hashtags || '[]')
      }));

      return {
        success: true,
        hashtagGroups: groupsWithParsedHashtags
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get a single hashtag group by ID
  async getHashtagGroupById(groupId, userId) {
    try {
      const hashtagGroup = await HashtagGroup.findOne({
        where: { 
          id: groupId, 
          userId: userId,
          isActive: true 
        }
      });

      if (!hashtagGroup) {
        return {
          success: false,
          error: 'Hashtag group not found'
        };
      }

      return {
        success: true,
        hashtagGroup: {
          ...hashtagGroup.toJSON(),
          hashtags: JSON.parse(hashtagGroup.hashtags || '[]')
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Update a hashtag group
  async updateHashtagGroup(groupId, userId, updateData) {
    try {
      const hashtagGroup = await HashtagGroup.findOne({
        where: { 
          id: groupId, 
          userId: userId,
          isActive: true 
        }
      });

      if (!hashtagGroup) {
        return {
          success: false,
          error: 'Hashtag group not found'
        };
      }

      // Clean hashtags if provided
      let cleanedHashtags = null;
      if (updateData.hashtags) {
        cleanedHashtags = this.cleanHashtags(updateData.hashtags);
      }

      // Update the hashtag group
      await hashtagGroup.update({
        name: updateData.name || hashtagGroup.name,
        hashtags: cleanedHashtags ? JSON.stringify(cleanedHashtags) : hashtagGroup.hashtags,
        description: updateData.description || hashtagGroup.description,
        platform: updateData.platform || hashtagGroup.platform,
        category: updateData.category || hashtagGroup.category
      });

      return {
        success: true,
        hashtagGroup: {
          ...hashtagGroup.toJSON(),
          hashtags: JSON.parse(hashtagGroup.hashtags || '[]')
        },
        message: 'Hashtag group updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Delete a hashtag group (soft delete)
  async deleteHashtagGroup(groupId, userId) {
    try {
      const hashtagGroup = await HashtagGroup.findOne({
        where: { 
          id: groupId, 
          userId: userId,
          isActive: true 
        }
      });

      if (!hashtagGroup) {
        return {
          success: false,
          error: 'Hashtag group not found'
        };
      }

      // Soft delete by setting isActive to false
      await hashtagGroup.update({ isActive: false });

      return {
        success: true,
        message: 'Hashtag group deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get hashtag groups by platform
  async getHashtagGroupsByPlatform(userId, platform) {
    try {
      const { Op } = require('sequelize');
      
      const hashtagGroups = await HashtagGroup.findAll({
        where: { 
          userId: userId,
          isActive: true,
          [Op.or]: [
            { platform: platform },
            { platform: 'all' }
          ]
        },
        order: [['createdAt', 'DESC']]
      });

      const groupsWithParsedHashtags = hashtagGroups.map(group => ({
        ...group.toJSON(),
        hashtags: JSON.parse(group.hashtags || '[]')
      }));

      return {
        success: true,
        hashtagGroups: groupsWithParsedHashtags
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get hashtag groups by category
  async getHashtagGroupsByCategory(userId, category) {
    try {
      const hashtagGroups = await HashtagGroup.findAll({
        where: { 
          userId: userId, 
          category: category,
          isActive: true 
        },
        order: [['createdAt', 'DESC']]
      });

      const groupsWithParsedHashtags = hashtagGroups.map(group => ({
        ...group.toJSON(),
        hashtags: JSON.parse(group.hashtags || '[]')
      }));

      return {
        success: true,
        hashtagGroups: groupsWithParsedHashtags
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Search hashtag groups
  async searchHashtagGroups(userId, searchTerm) {
    try {
      const { Op } = require('sequelize');
      
      const hashtagGroups = await HashtagGroup.findAll({
        where: {
          userId: userId,
          isActive: true,
          [Op.or]: [
            { name: { [Op.like]: `%${searchTerm}%` } },
            { description: { [Op.like]: `%${searchTerm}%` } },
            { hashtags: { [Op.like]: `%${searchTerm}%` } }
          ]
        },
        order: [['createdAt', 'DESC']]
      });

      const groupsWithParsedHashtags = hashtagGroups.map(group => ({
        ...group.toJSON(),
        hashtags: JSON.parse(group.hashtags || '[]')
      }));

      return {
        success: true,
        hashtagGroups: groupsWithParsedHashtags
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get random hashtags from groups
  async getRandomHashtags(userId, platform, count = 5) {
    try {
      const result = await this.getHashtagGroupsByPlatform(userId, platform);
      
      if (!result.success) {
        return result;
      }

      // Collect all hashtags from all groups
      const allHashtags = [];
      result.hashtagGroups.forEach(group => {
        allHashtags.push(...group.hashtags);
      });

      // Remove duplicates and shuffle
      const uniqueHashtags = [...new Set(allHashtags)];
      const shuffled = uniqueHashtags.sort(() => 0.5 - Math.random());
      const selectedHashtags = shuffled.slice(0, count);

      return {
        success: true,
        hashtags: selectedHashtags
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get hashtag statistics
  async getHashtagStats(userId) {
    try {
      const { Op } = require('sequelize');
      
      const totalGroups = await HashtagGroup.count({
        where: { userId: userId, isActive: true }
      });

      const platforms = await HashtagGroup.findAll({
        where: { userId: userId, isActive: true },
        attributes: ['platform'],
        group: ['platform']
      });

      const categories = await HashtagGroup.findAll({
        where: { userId: userId, isActive: true },
        attributes: ['category'],
        group: ['category']
      });

      const recentGroups = await HashtagGroup.findAll({
        where: { 
          userId: userId, 
          isActive: true,
          createdAt: {
            [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      });

      // Count total hashtags
      const allGroups = await this.getUserHashtagGroups(userId);
      let totalHashtags = 0;
      if (allGroups.success) {
        allGroups.hashtagGroups.forEach(group => {
          totalHashtags += group.hashtags.length;
        });
      }

      return {
        success: true,
        stats: {
          totalGroups: totalGroups,
          totalHashtags: totalHashtags,
          totalPlatforms: platforms.length,
          totalCategories: categories.length,
          recentGroups: recentGroups.length,
          platforms: platforms.map(p => p.platform),
          categories: categories.map(c => c.category)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Helper function to clean hashtags
  cleanHashtags(hashtags) {
    if (!Array.isArray(hashtags)) {
      return [];
    }

    return hashtags
      .map(tag => {
        // Remove any existing # symbols and clean the tag
        let cleanTag = tag.toString().trim().replace(/^#+/, '');
        
        // Remove spaces and special characters except underscores
        cleanTag = cleanTag.replace(/[^a-zA-Z0-9_]/g, '');
        
        // Add # back if the tag is valid
        return cleanTag.length > 0 ? `#${cleanTag}` : null;
      })
      .filter(tag => tag !== null && tag.length > 1); // Filter out invalid tags
  }

  // Generate hashtag suggestions (basic implementation)
  async generateHashtagSuggestions(content, platform = 'all') {
    try {
      // Basic keyword extraction
      const words = content.toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 3)
        .filter(word => !/^(the|and|but|for|are|was|were|been|have|has|had|will|would|could|should|this|that|with|from|they|them|their|there|where|when|what|which|while|about|after|before|during|through|against|between|among|under|over|above|below|into|onto|upon|within|without|toward|towards|behind|beside|beneath|beyond|across|around|along|inside|outside|outside)$/.test(word));

      // Platform-specific suggestions
      const platformSuggestions = {
        facebook: ['#SocialMedia', '#Marketing', '#Business', '#Community'],
        twitter: ['#Twitter', '#SocialMedia', '#Trending', '#News'],
        linkedin: ['#LinkedIn', '#Professional', '#Business', '#Networking'],
        instagram: ['#Instagram', '#Photo', '#Visual', '#Lifestyle'],
        tiktok: ['#TikTok', '#Viral', '#Trending', '#Fun'],
        threads: ['#Threads', '#Community', '#Discussion', '#Social']
      };

      // Combine content-based and platform-specific suggestions
      const contentHashtags = words.slice(0, 5).map(word => `#${word}`);
      const suggestions = platform !== 'all' && platformSuggestions[platform] 
        ? [...contentHashtags, ...platformSuggestions[platform]]
        : [...contentHashtags, '#SocialMedia', '#Content', '#Marketing'];

      return {
        success: true,
        suggestions: [...new Set(suggestions)].slice(0, 10) // Remove duplicates and limit
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new HashtagService();