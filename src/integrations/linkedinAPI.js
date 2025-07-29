const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

/**
 * LinkedIn API Integration
 * This handles posting to LinkedIn pages using LinkedIn API v2
 * Focuses on professional content and business networking
 */

class LinkedInAPI {
  constructor() {
    this.baseURL = 'https://api.linkedin.com/v2';
  }

  /**
   * Get LinkedIn user profile information
   * Returns the person URN needed for posting
   */
  async getUserProfile(accessToken) {
    try {
      const response = await fetch(`${this.baseURL}/people/~`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.message) {
        throw new Error(`LinkedIn API Error: ${data.message}`);
      }

      return {
        personUrn: data.id,
        firstName: data.localizedFirstName,
        lastName: data.localizedLastName
      };

    } catch (error) {
      console.error('Error getting LinkedIn profile:', error.message);
      throw error;
    }
  }

  /**
   * Initialize media upload to LinkedIn
   * Returns upload URL and asset URN
   */
  async initializeMediaUpload(accessToken, personUrn, mediaPath) {
    try {
      const fileSize = fs.statSync(mediaPath).size;
      const isImage = this.isImageFile(mediaPath);

      const uploadRequest = {
        registerUploadRequest: {
          recipes: [isImage ? 'urn:li:digitalmediaRecipe:feedshare-image' : 'urn:li:digitalmediaRecipe:feedshare-video'],
          owner: personUrn,
          serviceRelationships: [{
            relationshipType: 'OWNER',
            identifier: 'urn:li:userGeneratedContent'
          }]
        }
      };

      const response = await fetch(`${this.baseURL}/assets?action=registerUpload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(uploadRequest)
      });

      const result = await response.json();

      if (result.message) {
        throw new Error(`LinkedIn upload init error: ${result.message}`);
      }

      return {
        uploadUrl: result.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl,
        assetUrn: result.value.asset
      };

    } catch (error) {
      console.error('Error initializing LinkedIn media upload:', error.message);
      throw error;
    }
  }

  /**
   * Upload media file to LinkedIn
   */
  async uploadMediaFile(uploadUrl, mediaPath, accessToken) {
    try {
      const mediaBuffer = fs.readFileSync(mediaPath);

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/octet-stream'
        },
        body: mediaBuffer
      });

      if (!response.ok) {
        throw new Error(`LinkedIn media upload failed: ${response.statusText}`);
      }

      console.log('✅ Media uploaded to LinkedIn successfully');
      return true;

    } catch (error) {
      console.error('❌ LinkedIn media upload failed:', error.message);
      throw error;
    }
  }

  /**
   * Check if file is an image
   */
  isImageFile(filePath) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    const ext = path.extname(filePath).toLowerCase();
    return imageExtensions.includes(ext);
  }

  /**
   * Post content to LinkedIn
   * Can include text only or text + media
   */
  async postToLinkedIn(campaignData, accessToken) {
    try {
      console.log('🔵 Starting LinkedIn post...');

      // Step 1: Get user profile
      const profile = await this.getUserProfile(accessToken);
      const personUrn = `urn:li:person:${profile.personUrn}`;

      console.log(`👤 Posting as: ${profile.firstName} ${profile.lastName}`);

      // Step 2: Prepare content with professional tone
      let content = campaignData.content;
      
      // Add professional hashtags if not present
      if (!content.includes('#')) {
        content += '\n\n#ProfessionalDevelopment #Business #LinkedIn #Growth';
      }

      // Step 3: Handle media if present
      let mediaAssets = [];
      if (campaignData.mediaUrls && campaignData.mediaUrls.length > 0) {
        console.log('📸 Processing media for LinkedIn...');

        // LinkedIn allows up to 9 images or 1 video
        const mediaLimit = campaignData.mediaUrls.some(url => 
          ['.mp4', '.mov', '.avi'].some(ext => url.toLowerCase().includes(ext))
        ) ? 1 : 9;

        for (let i = 0; i < Math.min(campaignData.mediaUrls.length, mediaLimit); i++) {
          const mediaUrl = campaignData.mediaUrls[i];
          const mediaPath = path.join(__dirname, '../../public', mediaUrl);

          try {
            // Initialize upload
            const uploadInfo = await this.initializeMediaUpload(accessToken, personUrn, mediaPath);
            
            // Upload file
            await this.uploadMediaFile(uploadInfo.uploadUrl, mediaPath, accessToken);
            
            // Add to media assets
            mediaAssets.push({
              status: 'READY',
              description: {
                text: `Media for post`
              },
              media: uploadInfo.assetUrn,
              title: {
                text: 'Shared Media'
              }
            });

            console.log(`✅ Media processed: ${mediaUrl}`);

          } catch (mediaError) {
            console.log(`⚠️ Failed to upload media ${mediaUrl}: ${mediaError.message}`);
            // Continue with other media files
          }
        }
      }

      // Step 4: Create post data
      const postData = {
        author: personUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: content
            },
            shareMediaCategory: mediaAssets.length > 0 ? 'IMAGE' : 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      };

      // Add media if present
      if (mediaAssets.length > 0) {
        postData.specificContent['com.linkedin.ugc.ShareContent'].media = mediaAssets;
      }

      // Step 5: Post to LinkedIn
      console.log('📤 Posting to LinkedIn...');

      const response = await fetch(`${this.baseURL}/ugcPosts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
      });

      const result = await response.json();

      if (result.message) {
        throw new Error(`LinkedIn posting error: ${result.message}`);
      }

      console.log('✅ LinkedIn post successful!');

      return {
        success: true,
        postId: result.id,
        message: 'Posted to LinkedIn successfully',
        platform: 'linkedin',
        timestamp: new Date().toISOString(),
        engagement: {
          likes: 0,
          comments: 0,
          shares: 0
        }
      };

    } catch (error) {
      console.error('❌ LinkedIn posting failed:', error.message);

      return {
        success: false,
        error: error.message,
        platform: 'linkedin',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Test LinkedIn connection
   */
  async testConnection(accessToken) {
    try {
      const response = await fetch(`${this.baseURL}/people/~`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const data = await response.json();

      if (data.message) {
        return {
          success: false,
          error: data.message
        };
      }

      return {
        success: true,
        user: `${data.localizedFirstName} ${data.localizedLastName}`,
        userId: data.id
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get LinkedIn company pages (for business posting)
   */
  async getCompanyPages(accessToken) {
    try {
      const response = await fetch(`${this.baseURL}/organizationAcls?q=roleAssignee`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const data = await response.json();

      if (data.message) {
        throw new Error(`LinkedIn API Error: ${data.message}`);
      }

      return data.elements || [];

    } catch (error) {
      console.error('Error getting LinkedIn company pages:', error.message);
      return [];
    }
  }

  /**
   * Post to LinkedIn company page
   */
  async postToCompanyPage(campaignData, accessToken, organizationId) {
    try {
      console.log('🔵 Starting LinkedIn company page post...');

      const organizationUrn = `urn:li:organization:${organizationId}`;

      // Prepare content for business posting
      let content = campaignData.content;
      if (!content.includes('#')) {
        content += '\n\n#Business #Marketing #Corporate #Industry';
      }

      const postData = {
        author: organizationUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: content
            },
            shareMediaCategory: 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      };

      const response = await fetch(`${this.baseURL}/ugcPosts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
      });

      const result = await response.json();

      if (result.message) {
        throw new Error(`LinkedIn company posting error: ${result.message}`);
      }

      console.log('✅ LinkedIn company post successful!');

      return {
        success: true,
        postId: result.id,
        message: 'Posted to LinkedIn company page successfully',
        platform: 'linkedin',
        type: 'company',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ LinkedIn company posting failed:', error.message);

      return {
        success: false,
        error: error.message,
        platform: 'linkedin',
        type: 'company',
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = new LinkedInAPI();