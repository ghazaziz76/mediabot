const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');

/**
 * Threads API Integration
 * Uses Instagram Graph API for Threads posting
 * Includes user mention features and community engagement
 */

class ThreadsAPI {
  constructor() {
    this.baseURL = 'https://graph.facebook.com/v18.0';
  }

  /**
   * Get Threads user ID from Instagram Business Account
   */
  async getThreadsUserId(accessToken) {
    try {
      // Get Instagram business account first
      const pagesResponse = await fetch(`${this.baseURL}/me/accounts?access_token=${accessToken}`);
      const pagesData = await pagesResponse.json();

      if (pagesData.error) {
        throw new Error(`Facebook API Error: ${pagesData.error.message}`);
      }

      if (!pagesData.data || pagesData.data.length === 0) {
        throw new Error('No Facebook pages found for Threads access.');
      }

      const pageId = pagesData.data[0].id;
      const pageAccessToken = pagesData.data[0].access_token;

      // Get Instagram business account
      const igResponse = await fetch(`${this.baseURL}/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`);
      const igData = await igResponse.json();

      if (igData.error) {
        throw new Error(`Instagram API Error: ${igData.error.message}`);
      }

      if (!igData.instagram_business_account) {
        throw new Error('Instagram Business Account required for Threads posting.');
      }

      return {
        threadsUserId: igData.instagram_business_account.id,
        pageAccessToken: pageAccessToken
      };

    } catch (error) {
      console.error('Error getting Threads user ID:', error.message);
      throw error;
    }
  }

  /**
   * Search for users to mention on Threads
   * This is a simplified version - real implementation would need more sophisticated search
   */
  async searchThreadsUsers(keyword, accessToken, limit = 5) {
    try {
      // This is a placeholder for user search functionality
      // In a real implementation, you'd use Instagram's search APIs
      // or maintain your own database of targetable users
      
      const sampleUsers = [
        { username: 'techinfluencer1', id: '12345', engagement_score: 8.5 },
        { username: 'businessguru', id: '12346', engagement_score: 7.2 },
        { username: 'marketingpro', id: '12347', engagement_score: 9.1 },
        { username: 'entrepreneur_life', id: '12348', engagement_score: 6.8 },
        { username: 'digitalmarketer', id: '12349', engagement_score: 7.9 }
      ];

      // Filter users based on keyword relevance
      const relevantUsers = sampleUsers.filter(user => 
        user.username.toLowerCase().includes(keyword.toLowerCase()) ||
        Math.random() > 0.3 // Simulate search relevance
      );

      return relevantUsers.slice(0, limit);

    } catch (error) {
      console.error('Error searching Threads users:', error.message);
      return [];
    }
  }

  /**
   * Get users from database who haven't been mentioned recently
   */
  async getAvailableUsersForMention(campaignId, platform = 'threads') {
    try {
      // This would connect to your database to get users
      // who haven't been mentioned in the last 24 hours
      
      const { Post } = require('../../models');
      
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      // Get recent mentions for this campaign
      const recentPosts = await Post.findAll({
        where: {
          campaignId: campaignId,
          platform: platform,
          success: true,
          createdAt: {
            [require('sequelize').Op.gte]: twentyFourHoursAgo
          }
        }
      });

      // Extract mentioned users from recent posts
      const recentlyMentioned = new Set();
      recentPosts.forEach(post => {
        if (post.engagementData) {
          try {
            const data = JSON.parse(post.engagementData);
            if (data.mentionedUsers) {
              data.mentionedUsers.forEach(user => recentlyMentioned.add(user));
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }
      });

      // Return sample users not recently mentioned
      const allUsers = [
        'tech_enthusiast', 'business_insider', 'marketing_maven',
        'startup_founder', 'digital_nomad', 'content_creator',
        'social_media_expert', 'entrepreneur', 'innovation_hub'
      ];

      return allUsers.filter(user => !recentlyMentioned.has(user)).slice(0, 3);

    } catch (error) {
      console.error('Error getting available users for mention:', error.message);
      return ['tech_lover', 'business_pro']; // Fallback users
    }
  }

  /**
   * Format content for Threads with mentions
   */
  async formatThreadsContent(content, campaignId, includeMentions = true) {
    let formattedContent = content;

    // Add community-focused hashtags if not present
    if (!content.includes('#')) {
      const threadsHashtags = ['#Threads', '#Community', '#Discussion', '#Social', '#Engagement'];
      formattedContent += '\n\n' + threadsHashtags.join(' ');
    }

    // Add strategic user mentions
    if (includeMentions) {
      try {
        const usersToMention = await this.getAvailableUsersForMention(campaignId);
        
        if (usersToMention.length > 0) {
          const mentions = usersToMention.slice(0, 2) // Limit to 2 mentions
            .map(user => `@${user}`)
            .join(' ');
          
          formattedContent += `\n\nThoughts? ${mentions}`;
          
          console.log(`💬 Added mentions: ${mentions}`);
        }
      } catch (error) {
        console.log('⚠️ Could not add mentions:', error.message);
      }
    }

    // Threads supports up to 500 characters
    if (formattedContent.length > 500) {
      formattedContent = formattedContent.substring(0, 450) + '... 🧵';
    }

    return formattedContent;
  }

  /**
   * Create Threads media container
   */
  async createThreadsContainer(threadsUserId, accessToken, content, mediaUrl = null) {
    try {
      const containerData = {
        media_type: mediaUrl ? 'IMAGE' : 'TEXT',
        text: content,
        access_token: accessToken
      };

      if (mediaUrl) {
        // Convert local path to public URL
        const publicUrl = this.getPublicMediaUrl(mediaUrl);
        containerData.image_url = publicUrl;
      }

      const response = await fetch(`${this.baseURL}/${threadsUserId}/threads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(containerData)
      });

      const result = await response.json();

      if (result.error) {
        throw new Error(`Threads container creation error: ${result.error.message}`);
      }

      return result.id; // Container ID

    } catch (error) {
      console.error('Error creating Threads container:', error.message);
      throw error;
    }
  }

  /**
   * Publish Threads container
   */
  async publishThreadsContainer(threadsUserId, accessToken, creationId) {
    try {
      const publishData = {
        creation_id: creationId,
        access_token: accessToken
      };

      const response = await fetch(`${this.baseURL}/${threadsUserId}/threads_publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(publishData)
      });

      const result = await response.json();

      if (result.error) {
        throw new Error(`Threads publish error: ${result.error.message}`);
      }

      return result.id; // Published thread ID

    } catch (error) {
      console.error('Error publishing Threads container:', error.message);
      throw error;
    }
  }

  /**
   * Get public URL for media file
   */
  getPublicMediaUrl(mediaPath, baseUrl = 'http://localhost:3000') {
    const relativePath = mediaPath.replace(/^.*\/public/, '');
    return `${baseUrl}${relativePath}`;
  }

  /**
   * Post content to Threads
   * Includes community engagement features
   */
  async postToThreads(campaignData, accessToken) {
    try {
      console.log('🔵 Starting Threads post...');

      // Step 1: Get Threads user ID
      const userInfo = await this.getThreadsUserId(accessToken);
      const { threadsUserId, pageAccessToken } = userInfo;

      console.log(`🧵 Posting to Threads User ID: ${threadsUserId}`);

      // Step 2: Format content with community features
      const formattedContent = await this.formatThreadsContent(
        campaignData.content, 
        campaignData.campaignId || 1,
        true // Include mentions
      );

      console.log('💬 Formatted content for community engagement');

      // Step 3: Handle media (optional for Threads)
      let mediaUrl = null;
      if (campaignData.mediaUrls && campaignData.mediaUrls.length > 0) {
        // Threads supports one image per post
        const firstMedia = campaignData.mediaUrls[0];
        const mediaPath = path.join(__dirname, '../../public', firstMedia);
        
        if (fs.existsSync(mediaPath)) {
          // Check if it's an image (Threads doesn't support videos yet)
          const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
          const ext = path.extname(mediaPath).toLowerCase();
          
          if (imageExtensions.includes(ext)) {
            mediaUrl = firstMedia;
            console.log('📸 Adding image to Threads post');
          } else {
            console.log('⚠️ Threads only supports images, skipping video');
          }
        }
      }

      // Step 4: Create Threads container
      console.log('📤 Creating Threads container...');
      const creationId = await this.createThreadsContainer(threadsUserId, pageAccessToken, formattedContent, mediaUrl);

      console.log(`✅ Container created: ${creationId}`);

      // Step 5: Publish the thread
      console.log('📤 Publishing to Threads...');
      const publishedId = await this.publishThreadsContainer(threadsUserId, pageAccessToken, creationId);

      // Step 6: Log mentioned users for tracking
      const mentionedUsers = this.extractMentionsFromContent(formattedContent);
      await this.logMentions(campaignData.campaignId || 1, mentionedUsers);

      console.log('✅ Threads post successful!');

      return {
        success: true,
        threadId: publishedId,
        message: 'Posted to Threads successfully',
        platform: 'threads',
        timestamp: new Date().toISOString(),
        mentionedUsers: mentionedUsers,
        engagement: {
          likes: 0,
          replies: 0,
          reposts: 0,
          quotes: 0
        }
      };

    } catch (error) {
      console.error('❌ Threads posting failed:', error.message);

      return {
        success: false,
        error: error.message,
        platform: 'threads',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Extract mentioned usernames from content
   */
  extractMentionsFromContent(content) {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }

    return mentions;
  }

  /**
   * Log mentions for tracking purposes
   */
  async logMentions(campaignId, mentionedUsers) {
    try {
      if (mentionedUsers.length === 0) return;

      // This would log to your database for tracking
      console.log(`📝 Logging ${mentionedUsers.length} mentions for campaign ${campaignId}`);
      
      // In a real implementation, you'd save this to your database
      // to track mention frequency and avoid spam

    } catch (error) {
      console.error('Error logging mentions:', error.message);
    }
  }

  /**
   * Get Threads post insights
   */
  async getThreadsInsights(threadId, accessToken) {
    try {
      const userInfo = await this.getThreadsUserId(accessToken);
      
      const response = await fetch(`${this.baseURL}/${threadId}/insights?metric=likes,replies,reposts,quotes&access_token=${userInfo.pageAccessToken}`);
      const data = await response.json();

      if (data.error) {
        throw new Error(`Threads insights error: ${data.error.message}`);
      }

      return data.data;

    } catch (error) {
      console.error('Error getting Threads insights:', error.message);
      return null;
    }
  }

  /**
   * Test Threads connection
   */
  async testConnection(accessToken) {
    try {
      const userInfo = await this.getThreadsUserId(accessToken);
      
      const response = await fetch(`${this.baseURL}/${userInfo.threadsUserId}?fields=name,username&access_token=${userInfo.pageAccessToken}`);
      const data = await response.json();

      if (data.error) {
        return {
          success: false,
          error: data.error.message
        };
      }

      return {
        success: true,
        user: data.name,
        username: data.username,
        userId: userInfo.threadsUserId
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get community engagement tips for Threads
   */
  getCommunityEngagementTips() {
    return {
      bestPractices: [
        'Ask questions to encourage replies',
        'Mention relevant users sparingly (max 2-3 per post)',
        'Use conversation-starter phrases',
        'Engage with replies quickly',
        'Share authentic, personal content'
      ],
      contentStrategy: {
        textPosts: 'Focus on thoughts, opinions, and discussions',
        mediaSupport: 'Single images only (no videos yet)',
        characterLimit: '500 characters maximum',
        hashtagStrategy: 'Use 2-3 relevant hashtags',
        mentionStrategy: 'Mention users who are likely to engage'
      },
      engagementFeatures: [
        'Replies and nested conversations',
        'Reposts (like retweets)',
        'Quote posts with commentary',
        'Likes and reactions'
      ]
    };
  }
}

module.exports = new ThreadsAPI();