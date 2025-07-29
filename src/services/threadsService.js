const { Campaign } = require('../../models');

/**
 * ThreadsService - Special features for Threads platform
 * Includes user search, mentions, and targeting
 */
class ThreadsService {
  constructor() {
    console.log('🧵 ThreadsService initialized');
    this.mentionedUsers = new Map(); // Track mentioned users to avoid spam
    this.userDatabase = this.initializeUserDatabase();
  }

  /**
   * Initialize mock user database for Threads
   * In real implementation, this would come from Threads API
   */
  initializeUserDatabase() {
    return [
      { username: 'entrepreneur_mike', interests: ['business', 'startup', 'marketing'], followers: 15000, engagement: 8.5 },
      { username: 'tech_sarah', interests: ['technology', 'AI', 'programming'], followers: 12000, engagement: 7.2 },
      { username: 'creative_anna', interests: ['design', 'art', 'creativity'], followers: 8500, engagement: 9.1 },
      { username: 'fitness_john', interests: ['fitness', 'health', 'motivation'], followers: 20000, engagement: 6.8 },
      { username: 'food_lover_emma', interests: ['cooking', 'recipes', 'food'], followers: 11000, engagement: 8.9 },
      { username: 'travel_wanderer', interests: ['travel', 'adventure', 'photography'], followers: 18000, engagement: 7.5 },
      { username: 'finance_guru', interests: ['finance', 'investing', 'money'], followers: 25000, engagement: 8.0 },
      { username: 'lifestyle_jenny', interests: ['lifestyle', 'wellness', 'beauty'], followers: 14000, engagement: 8.3 },
      { username: 'sports_fanatic', interests: ['sports', 'football', 'basketball'], followers: 16000, engagement: 7.8 },
      { username: 'music_producer', interests: ['music', 'production', 'beats'], followers: 9500, engagement: 9.2 }
    ];
  }

  /**
   * Search for users based on keywords/interests
   */
  searchUsersByKeywords(keywords, maxResults = 5) {
    console.log(`🔍 Searching Threads users for keywords: ${keywords.join(', ')}`);
    
    const searchResults = [];
    
    this.userDatabase.forEach(user => {
      let relevanceScore = 0;
      
      // Check if user's interests match any keywords
      keywords.forEach(keyword => {
        user.interests.forEach(interest => {
          if (interest.toLowerCase().includes(keyword.toLowerCase()) || 
              keyword.toLowerCase().includes(interest.toLowerCase())) {
            relevanceScore += 1;
          }
        });
      });
      
      if (relevanceScore > 0) {
        searchResults.push({
          ...user,
          relevanceScore: relevanceScore,
          lastMentioned: this.mentionedUsers.get(user.username) || null
        });
      }
    });
    
    // Sort by relevance score and engagement
    searchResults.sort((a, b) => {
      if (a.relevanceScore !== b.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      return b.engagement - a.engagement;
    });
    
    return searchResults.slice(0, maxResults);
  }

  /**
   * Get users to mention for a campaign
   */
  getUsersToMention(campaignContent, maxMentions = 3) {
    // Extract keywords from campaign content
    const keywords = this.extractKeywords(campaignContent);
    
    // Search for relevant users
    const candidates = this.searchUsersByKeywords(keywords, 10);
    
    // Filter out recently mentioned users (within 24 hours)
    const now = Date.now();
    const availableUsers = candidates.filter(user => {
      const lastMentioned = this.mentionedUsers.get(user.username);
      if (!lastMentioned) return true;
      
      const timeSinceLastMention = now - lastMentioned;
      const twentyFourHours = 24 * 60 * 60 * 1000;
      return timeSinceLastMention > twentyFourHours;
    });
    
    // Select top users for mentioning
    const selectedUsers = availableUsers.slice(0, maxMentions);
    
    console.log(`👥 Selected ${selectedUsers.length} users to mention:`, 
      selectedUsers.map(u => u.username));
    
    return selectedUsers;
  }

  /**
   * Extract keywords from campaign content
   */
  extractKeywords(content) {
    // Simple keyword extraction (in real app, use NLP)
    const text = content.toLowerCase();
    const commonKeywords = [
      'business', 'startup', 'entrepreneur', 'marketing', 'sales',
      'technology', 'AI', 'programming', 'code', 'software',
      'design', 'art', 'creative', 'graphics', 'UI',
      'fitness', 'health', 'workout', 'gym', 'nutrition',
      'food', 'cooking', 'recipe', 'restaurant', 'chef',
      'travel', 'adventure', 'vacation', 'explore', 'journey',
      'finance', 'money', 'investing', 'trading', 'crypto',
      'lifestyle', 'wellness', 'beauty', 'fashion', 'style',
      'sports', 'football', 'basketball', 'soccer', 'game',
      'music', 'song', 'artist', 'concert', 'album'
    ];
    
    const foundKeywords = commonKeywords.filter(keyword => 
      text.includes(keyword)
    );
    
    // If no specific keywords found, try to guess from content
    if (foundKeywords.length === 0) {
      if (text.includes('success') || text.includes('grow')) foundKeywords.push('business');
      if (text.includes('learn') || text.includes('skill')) foundKeywords.push('education');
      if (text.includes('create') || text.includes('build')) foundKeywords.push('creative');
    }
    
    return foundKeywords.length > 0 ? foundKeywords : ['business']; // Default fallback
  }

  /**
   * Generate content with mentions
   */
  addMentionsToContent(originalContent, usersToMention) {
    if (!usersToMention || usersToMention.length === 0) {
      return originalContent;
    }
    
    // Create mention string
    const mentions = usersToMention.map(user => `@${user.username}`).join(' ');
    
    // Add mentions to the end of content
    const contentWithMentions = `${originalContent}\n\n${mentions} 👋 What do you think?`;
    
    // Track mentioned users
    const now = Date.now();
    usersToMention.forEach(user => {
      this.mentionedUsers.set(user.username, now);
    });
    
    console.log(`✨ Added mentions: ${mentions}`);
    
    return contentWithMentions;
  }

  /**
   * Get mention analytics
   */
  getMentionAnalytics() {
    const analytics = {
      totalUsersMentioned: this.mentionedUsers.size,
      recentMentions: [],
      mentionFrequency: {}
    };
    
    // Get recent mentions (last 7 days)
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    this.mentionedUsers.forEach((timestamp, username) => {
      if (timestamp > sevenDaysAgo) {
        analytics.recentMentions.push({
          username: username,
          mentionedAt: new Date(timestamp).toISOString()
        });
      }
    });
    
    return analytics;
  }

  /**
   * Get trending topics/hashtags for Threads
   */
  getTrendingTopics() {
    // Mock trending topics (in real app, get from Threads API)
    return [
      '#ThreadsLife',
      '#Innovation',
      '#Startup',
      '#TechTrends',
      '#CreativeWork',
      '#BusinessTips',
      '#Motivation',
      '#Learning',
      '#Community',
      '#Success'
    ];
  }

  /**
   * Optimize content specifically for Threads
   */
  optimizeForThreads(content, campaign) {
    let optimizedContent = content;
    
    // Get users to mention
    const usersToMention = this.getUsersToMention(content, 2);
    
    // Add mentions if users found
    if (usersToMention.length > 0) {
      optimizedContent = this.addMentionsToContent(optimizedContent, usersToMention);
    }
    
    // Add trending hashtags
    const trendingTopics = this.getTrendingTopics();
    const relevantHashtags = trendingTopics.slice(0, 3).join(' ');
    optimizedContent += `\n\n${relevantHashtags}`;
    
    return {
      content: optimizedContent,
      mentionedUsers: usersToMention,
      addedHashtags: trendingTopics.slice(0, 3)
    };
  }

  /**
   * Build target audience list
   */
  buildTargetAudience(interests, minFollowers = 5000, minEngagement = 6.0) {
    console.log(`🎯 Building target audience for interests: ${interests.join(', ')}`);
    
    const targetUsers = this.userDatabase.filter(user => {
      // Check if user matches interests
      const hasMatchingInterest = interests.some(interest => 
        user.interests.some(userInterest => 
          userInterest.toLowerCase().includes(interest.toLowerCase())
        )
      );
      
      // Check follower and engagement criteria
      const meetsFollowerCriteria = user.followers >= minFollowers;
      const meetsEngagementCriteria = user.engagement >= minEngagement;
      
      return hasMatchingInterest && meetsFollowerCriteria && meetsEngagementCriteria;
    });
    
    // Sort by engagement and followers
    targetUsers.sort((a, b) => {
      if (a.engagement !== b.engagement) {
        return b.engagement - a.engagement;
      }
      return b.followers - a.followers;
    });
    
    console.log(`📊 Found ${targetUsers.length} target users`);
    
    return targetUsers;
  }
}

module.exports = new ThreadsService();