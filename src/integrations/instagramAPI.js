const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

/**
 * Instagram API Integration
 * Uses Facebook Graph API for Instagram Business accounts
 * Handles photo/video posts, stories, and reels
 */

class InstagramAPI {
  constructor() {
    this.baseURL = 'https://graph.facebook.com/v18.0';
  }

  /**
   * Get Instagram Business Account ID
   * Instagram requires a business account connected to Facebook page
   */
  async getInstagramBusinessAccount(accessToken) {
    try {
      // First get Facebook pages
      const pagesResponse = await fetch(`${this.baseURL}/me/accounts?access_token=${accessToken}`);
      const pagesData = await pagesResponse.json();

      if (pagesData.error) {
        throw new Error(`Facebook API Error: ${pagesData.error.message}`);
      }

      if (!pagesData.data || pagesData.data.length === 0) {
        throw new Error('No Facebook pages found. Please connect a Facebook page first.');
      }

      // Get Instagram business account from the first page
      const pageId = pagesData.data[0].id;
      const pageAccessToken = pagesData.data[0].access_token;

      const igResponse = await fetch(`${this.baseURL}/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`);
      const igData = await igResponse.json();

      if (igData.error) {
        throw new Error(`Instagram API Error: ${igData.error.message}`);
      }

      if (!igData.instagram_business_account) {
        throw new Error('No Instagram business account found. Please connect your Instagram business account to your Facebook page.');
      }

      return {
        instagramAccountId: igData.instagram_business_account.id,
        pageId: pageId,
        pageAccessToken: pageAccessToken
      };

    } catch (error) {
      console.error('Error getting Instagram business account:', error.message);
      throw error;
    }
  }

  /**
   * Upload media to Instagram (images/videos)
   * Instagram requires a two-step process: create container, then publish
   */
  async createMediaContainer(instagramAccountId, accessToken, mediaUrl, caption, isVideo = false) {
    try {
      const mediaData = {
        access_token: accessToken,
        caption: caption
      };

      if (isVideo) {
        mediaData.media_type = 'VIDEO';
        mediaData.video_url = mediaUrl;
      } else {
        mediaData.image_url = mediaUrl;
      }

      const response = await fetch(`${this.baseURL}/${instagramAccountId}/media`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(mediaData)
      });

      const result = await response.json();

      if (result.error) {
        throw new Error(`Instagram container creation error: ${result.error.message}`);
      }

      return result.id; // Container ID

    } catch (error) {
      console.error('Error creating Instagram media container:', error.message);
      throw error;
    }
  }

  /**
   * Publish Instagram media container
   */
  async publishMedia(instagramAccountId, accessToken, creationId) {
    try {
      const publishData = {
        creation_id: creationId,
        access_token: accessToken
      };

      const response = await fetch(`${this.baseURL}/${instagramAccountId}/media_publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(publishData)
      });

      const result = await response.json();

      if (result.error) {
        throw new Error(`Instagram publish error: ${result.error.message}`);
      }

      return result.id; // Published media ID

    } catch (error) {
      console.error('Error publishing Instagram media:', error.message);
      throw error;
    }
  }

  /**
   * Format content for Instagram
   * Adds relevant hashtags and optimizes for visual platform
   */
  formatInstagramContent(content) {
    // Add Instagram-specific hashtags if not present
    const instagramHashtags = ['#Instagram', '#Visual', '#Content', '#Engagement', '#Social'];
    
    let formattedContent = content;
    
    // Check if content already has hashtags
    if (!content.includes('#')) {
      formattedContent += '\n\n' + instagramHashtags.join(' ');
    }

    // Instagram supports up to 2,200 characters
    if (formattedContent.length > 2200) {
      formattedContent = formattedContent.substring(0, 2150) + '... #MoreInBio';
    }

    return formattedContent;
  }

  /**
   * Get public URL for media file
   * Instagram needs publicly accessible URLs for media
   */
  getPublicMediaUrl(mediaPath, baseUrl = 'http://localhost:3000') {
    // Convert local path to public URL
    const relativePath = mediaPath.replace(/^.*\/public/, '');
    return `${baseUrl}${relativePath}`;
  }

  /**
   * Check if file is video
   */
  isVideoFile(filePath) {
    const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
    const ext = path.extname(filePath).toLowerCase();
    return videoExtensions.includes(ext);
  }

  /**
   * Post content to Instagram
   * Handles both images and videos
   */
  async postToInstagram(campaignData, accessToken) {
    try {
      console.log('🔵 Starting Instagram post...');

      // Step 1: Get Instagram business account
      const accountInfo = await this.getInstagramBusinessAccount(accessToken);
      const { instagramAccountId, pageAccessToken } = accountInfo;

      console.log(`📸 Posting to Instagram Account ID: ${instagramAccountId}`);

      // Step 2: Format content for Instagram
      const caption = this.formatInstagramContent(campaignData.content);

      // Step 3: Handle media (Instagram requires at least one media item)
      if (!campaignData.mediaUrls || campaignData.mediaUrls.length === 0) {
        throw new Error('Instagram posts require at least one image or video');
      }

      console.log('📸 Processing media for Instagram...');

      const publishedMediaIds = [];

      // Instagram allows multiple images (carousel) or single video
      const mediaLimit = campaignData.mediaUrls.some(url => 
        this.isVideoFile(path.join(__dirname, '../../public', url))
      ) ? 1 : 10; // 1 video or up to 10 images

      for (let i = 0; i < Math.min(campaignData.mediaUrls.length, mediaLimit); i++) {
        const mediaUrl = campaignData.mediaUrls[i];
        const mediaPath = path.join(__dirname, '../../public', mediaUrl);

        try {
          // Check if file exists
          if (!fs.existsSync(mediaPath)) {
            console.log(`⚠️ Media file not found: ${mediaPath}`);
            continue;
          }

          // Get public URL for the media
          const publicMediaUrl = this.getPublicMediaUrl(mediaPath);
          const isVideo = this.isVideoFile(mediaPath);

          console.log(`📤 Processing ${isVideo ? 'video' : 'image'}: ${publicMediaUrl}`);

          // Create media container
          const creationId = await this.createMediaContainer(
            instagramAccountId, 
            pageAccessToken, 
            publicMediaUrl, 
            caption, 
            isVideo
          );

          console.log(`✅ Media container created: ${creationId}`);

          // For videos, we need to wait for processing
          if (isVideo) {
            console.log('⏳ Waiting for video processing...');
            await this.waitForVideoProcessing(creationId, pageAccessToken);
          }

          // Publish media
          const publishedId = await this.publishMedia(instagramAccountId, pageAccessToken, creationId);
          publishedMediaIds.push(publishedId);

          console.log(`✅ Media published: ${publishedId}`);

          // Instagram API rate limits - add small delay between posts
          if (i < campaignData.mediaUrls.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }

        } catch (mediaError) {
          console.log(`⚠️ Failed to process media ${mediaUrl}: ${mediaError.message}`);
          // Continue with other media files
        }
      }

      if (publishedMediaIds.length === 0) {
        throw new Error('No media could be posted to Instagram');
      }

      console.log('✅ Instagram post successful!');

      return {
        success: true,
        postIds: publishedMediaIds,
        message: `Posted ${publishedMediaIds.length} media item(s) to Instagram`,
        platform: 'instagram',
        timestamp: new Date().toISOString(),
        engagement: {
          likes: 0,
          comments: 0,
          shares: 0
        }
      };

    } catch (error) {
      console.error('❌ Instagram posting failed:', error.message);

      return {
        success: false,
        error: error.message,
        platform: 'instagram',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Wait for video processing on Instagram
   */
  async waitForVideoProcessing(creationId, accessToken, maxAttempts = 10) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch(`${this.baseURL}/${creationId}?fields=status_code&access_token=${accessToken}`);
        const result = await response.json();

        if (result.status_code === 'FINISHED') {
          return true;
        } else if (result.status_code === 'ERROR') {
          throw new Error('Video processing failed');
        }

        // Wait 3 seconds before checking again
        await new Promise(resolve => setTimeout(resolve, 3000));

      } catch (error) {
        console.log(`Video processing check attempt ${attempt + 1} failed:`, error.message);
      }
    }

    throw new Error('Video processing timeout');
  }

  /**
   * Post Instagram Story
   */
  async postInstagramStory(campaignData, accessToken) {
    try {
      console.log('🔵 Starting Instagram Story post...');

      const accountInfo = await this.getInstagramBusinessAccount(accessToken);
      const { instagramAccountId, pageAccessToken } = accountInfo;

      if (!campaignData.mediaUrls || campaignData.mediaUrls.length === 0) {
        throw new Error('Instagram Stories require media');
      }

      const mediaUrl = campaignData.mediaUrls[0]; // Stories are single media
      const mediaPath = path.join(__dirname, '../../public', mediaUrl);
      const publicMediaUrl = this.getPublicMediaUrl(mediaPath);
      const isVideo = this.isVideoFile(mediaPath);

      const storyData = {
        media_type: isVideo ? 'VIDEO' : 'IMAGE',
        access_token: pageAccessToken
      };

      if (isVideo) {
        storyData.video_url = publicMediaUrl;
      } else {
        storyData.image_url = publicMediaUrl;
      }

      const response = await fetch(`${this.baseURL}/${instagramAccountId}/media`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(storyData)
      });

      const result = await response.json();

      if (result.error) {
        throw new Error(`Instagram Story error: ${result.error.message}`);
      }

      // Publish the story
      const publishedId = await this.publishMedia(instagramAccountId, pageAccessToken, result.id);

      console.log('✅ Instagram Story posted successfully!');

      return {
        success: true,
        storyId: publishedId,
        message: 'Instagram Story posted successfully',
        platform: 'instagram',
        type: 'story',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Instagram Story posting failed:', error.message);

      return {
        success: false,
        error: error.message,
        platform: 'instagram',
        type: 'story',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Test Instagram connection
   */
  async testConnection(accessToken) {
    try {
      const accountInfo = await this.getInstagramBusinessAccount(accessToken);
      
      const response = await fetch(`${this.baseURL}/${accountInfo.instagramAccountId}?fields=name,username&access_token=${accountInfo.pageAccessToken}`);
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
        accountId: accountInfo.instagramAccountId
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new InstagramAPI();