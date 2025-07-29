const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

/**
 * Facebook API Integration
 * This handles posting to Facebook pages using Facebook Graph API
 */

class FacebookAPI {
  constructor() {
    this.baseURL = 'https://graph.facebook.com/v18.0';
  }

  /**
   * Get Facebook Page ID from access token
   * Facebook requires posting to a "page" not personal profile
   */
  async getPageId(accessToken) {
    try {
      const response = await fetch(`${this.baseURL}/me/accounts?access_token=${accessToken}`);
      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Facebook API Error: ${data.error.message}`);
      }
      
      // Return the first page ID (you can modify this to select specific page)
      if (data.data && data.data.length > 0) {
        return {
          pageId: data.data[0].id,
          pageAccessToken: data.data[0].access_token
        };
      }
      
      throw new Error('No Facebook pages found. Please make sure you have a Facebook page.');
      
    } catch (error) {
      console.error('Error getting Facebook Page ID:', error.message);
      throw error;
    }
  }

  /**
   * Upload media (image/video) to Facebook
   * Returns media ID that can be used in posts
   */
  async uploadMedia(mediaPath, pageId, pageAccessToken) {
    try {
      const formData = new FormData();
      
      // Check if file exists
      if (!fs.existsSync(mediaPath)) {
        throw new Error(`Media file not found: ${mediaPath}`);
      }
      
      // Add the file to form data
      formData.append('source', fs.createReadStream(mediaPath));
      formData.append('access_token', pageAccessToken);
      
      // Determine if it's a photo or video based on file extension
      const fileExtension = path.extname(mediaPath).toLowerCase();
      const isVideo = ['.mp4', '.mov', '.avi', '.mkv'].includes(fileExtension);
      
      const uploadEndpoint = isVideo ? 'videos' : 'photos';
      const url = `${this.baseURL}/${pageId}/${uploadEndpoint}`;
      
      const response = await fetch(url, {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(`Facebook media upload error: ${result.error.message}`);
      }
      
      return {
        mediaId: result.id,
        mediaType: isVideo ? 'video' : 'photo'
      };
      
    } catch (error) {
      console.error('Error uploading media to Facebook:', error.message);
      throw error;
    }
  }

  /**
   * Post content to Facebook page
   * Can include text only or text + media
   */
  async postToFacebook(campaignData, accessToken) {
    try {
      console.log('🔵 Starting Facebook post...');
      
      // Step 1: Get page information
      const pageInfo = await this.getPageId(accessToken);
      const { pageId, pageAccessToken } = pageInfo;
      
      console.log(`📄 Posting to Facebook Page ID: ${pageId}`);
      
      // Step 2: Prepare post data
      const postData = {
        message: campaignData.content,
        access_token: pageAccessToken
      };
      
      // Step 3: Handle media if present
      if (campaignData.mediaUrls && campaignData.mediaUrls.length > 0) {
        console.log('📸 Uploading media to Facebook...');
        
        const mediaIds = [];
        
        for (const mediaUrl of campaignData.mediaUrls) {
          // Convert URL to local file path
          const mediaPath = path.join(__dirname, '../../public', mediaUrl);
          
          try {
            const mediaResult = await this.uploadMedia(mediaPath, pageId, pageAccessToken);
            mediaIds.push(mediaResult.mediaId);
            console.log(`✅ Media uploaded: ${mediaResult.mediaId}`);
          } catch (mediaError) {
            console.log(`⚠️ Failed to upload media ${mediaUrl}: ${mediaError.message}`);
            // Continue with other media files
          }
        }
        
        // Add media to post if any were uploaded successfully
        if (mediaIds.length > 0) {
          if (mediaIds.length === 1) {
            // Single media item
            postData.object_attachment = mediaIds[0];
          } else {
            // Multiple media items
            postData.attached_media = mediaIds.map(id => ({ media_fbid: id }));
          }
        }
      }
      
      // Step 4: Post to Facebook
      console.log('📤 Posting to Facebook...');
      
      const response = await fetch(`${this.baseURL}/${pageId}/feed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(postData)
      });
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(`Facebook posting error: ${result.error.message}`);
      }
      
      console.log('✅ Facebook post successful!');
      
      return {
        success: true,
        postId: result.id,
        message: 'Posted to Facebook successfully',
        platform: 'facebook',
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Facebook posting failed:', error.message);
      
      return {
        success: false,
        error: error.message,
        platform: 'facebook',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Test Facebook connection
   * Verifies that the access token is valid
   */
  async testConnection(accessToken) {
    try {
      const response = await fetch(`${this.baseURL}/me?access_token=${accessToken}`);
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
        userId: data.id
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new FacebookAPI();