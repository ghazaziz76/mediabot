const fetch = require('node-fetch');
const crypto = require('crypto');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

/**
 * Twitter API Integration
 * This handles posting tweets using Twitter API v2
 * Includes 280 character limit handling and media uploads
 */

class TwitterAPI {
  constructor() {
    this.baseURL = 'https://api.twitter.com';
    this.uploadURL = 'https://upload.twitter.com';
  }

  /**
   * Generate OAuth 1.0a signature for Twitter API
   * Twitter uses OAuth 1.0a instead of OAuth 2.0
   */
  generateOAuthSignature(method, url, params, consumerSecret, tokenSecret = '') {
    // Step 1: Create parameter string
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');

    // Step 2: Create signature base string
    const signatureBaseString = [
      method.toUpperCase(),
      encodeURIComponent(url),
      encodeURIComponent(sortedParams)
    ].join('&');

    // Step 3: Create signing key
    const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;

    // Step 4: Generate signature
    const signature = crypto
      .createHmac('sha1', signingKey)
      .update(signatureBaseString)
      .digest('base64');

    return signature;
  }

  /**
   * Create OAuth authorization header for Twitter
   */
  createOAuthHeader(method, url, consumerKey, consumerSecret, accessToken, tokenSecret, additionalParams = {}) {
    const oauthParams = {
      oauth_consumer_key: consumerKey,
      oauth_nonce: crypto.randomBytes(16).toString('hex'),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_token: accessToken,
      oauth_version: '1.0',
      ...additionalParams
    };

    // Generate signature
    const signature = this.generateOAuthSignature(method, url, oauthParams, consumerSecret, tokenSecret);
    oauthParams.oauth_signature = signature;

    // Create authorization header
    const authHeader = 'OAuth ' + Object.keys(oauthParams)
      .sort()
      .map(key => `${encodeURIComponent(key)}="${encodeURIComponent(oauthParams[key])}"`)
      .join(', ');

    return authHeader;
  }

  /**
   * Upload media to Twitter
   * Returns media ID that can be attached to tweets
   */
  async uploadMedia(mediaPath, consumerKey, consumerSecret, accessToken, tokenSecret) {
    try {
      console.log('📸 Uploading media to Twitter...');
      
      if (!fs.existsSync(mediaPath)) {
        throw new Error(`Media file not found: ${mediaPath}`);
      }

      const mediaData = fs.readFileSync(mediaPath);
      const mediaSize = mediaData.length;
      const mediaType = this.getMediaType(mediaPath);

      // Step 1: Initialize upload
      const initUrl = `${this.uploadURL}/1.1/media/upload.json`;
      const initParams = {
        command: 'INIT',
        total_bytes: mediaSize.toString(),
        media_type: mediaType
      };

      const initAuth = this.createOAuthHeader('POST', initUrl, consumerKey, consumerSecret, accessToken, tokenSecret, initParams);
      
      const initResponse = await fetch(initUrl, {
        method: 'POST',
        headers: {
          'Authorization': initAuth,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(initParams)
      });

      const initResult = await initResponse.json();
      if (initResult.errors) {
        throw new Error(`Twitter media init error: ${initResult.errors[0].message}`);
      }

      const mediaId = initResult.media_id_string;

      // Step 2: Upload media chunks
      const chunkSize = 1024 * 1024; // 1MB chunks
      let segmentIndex = 0;

      for (let i = 0; i < mediaSize; i += chunkSize) {
        const chunk = mediaData.slice(i, i + chunkSize);
        
        const formData = new FormData();
        formData.append('command', 'APPEND');
        formData.append('media_id', mediaId);
        formData.append('segment_index', segmentIndex.toString());
        formData.append('media', chunk);

        const appendAuth = this.createOAuthHeader('POST', initUrl, consumerKey, consumerSecret, accessToken, tokenSecret);
        
        const appendResponse = await fetch(initUrl, {
          method: 'POST',
          headers: {
            'Authorization': appendAuth
          },
          body: formData
        });

        const appendResult = await appendResponse.json();
        if (appendResult.errors) {
          throw new Error(`Twitter media append error: ${appendResult.errors[0].message}`);
        }

        segmentIndex++;
      }

      // Step 3: Finalize upload
      const finalizeParams = {
        command: 'FINALIZE',
        media_id: mediaId
      };

      const finalizeAuth = this.createOAuthHeader('POST', initUrl, consumerKey, consumerSecret, accessToken, tokenSecret, finalizeParams);
      
      const finalizeResponse = await fetch(initUrl, {
        method: 'POST',
        headers: {
          'Authorization': finalizeAuth,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(finalizeParams)
      });

      const finalizeResult = await finalizeResponse.json();
      if (finalizeResult.errors) {
        throw new Error(`Twitter media finalize error: ${finalizeResult.errors[0].message}`);
      }

      console.log('✅ Media uploaded to Twitter successfully');
      return mediaId;

    } catch (error) {
      console.error('❌ Twitter media upload failed:', error.message);
      throw error;
    }
  }

  /**
   * Get media type for Twitter upload
   */
  getMediaType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    
    const imageTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };

    const videoTypes = {
      '.mp4': 'video/mp4',
      '.mov': 'video/quicktime',
      '.avi': 'video/x-msvideo'
    };

    return imageTypes[ext] || videoTypes[ext] || 'application/octet-stream';
  }

  /**
   * Post tweet to Twitter
   * Handles 280 character limit and media attachments
   */
  async postToTwitter(campaignData, tokens) {
    try {
      console.log('🔵 Starting Twitter post...');
      
      const { consumerKey, consumerSecret, accessToken, tokenSecret } = tokens;
      
      // Step 1: Prepare content (respect 280 character limit)
      let content = campaignData.content;
      if (content.length > 280) {
        content = content.substring(0, 277) + '...';
        console.log('✂️ Content truncated to fit Twitter 280 character limit');
      }
      
      // Step 2: Upload media if present
      const mediaIds = [];
      if (campaignData.mediaUrls && campaignData.mediaUrls.length > 0) {
        console.log('📸 Processing media for Twitter...');
        
        // Twitter allows up to 4 images or 1 video per tweet
        const mediaLimit = campaignData.mediaUrls.some(url => 
          ['.mp4', '.mov', '.avi'].some(ext => url.toLowerCase().includes(ext))
        ) ? 1 : 4;
        
        for (let i = 0; i < Math.min(campaignData.mediaUrls.length, mediaLimit); i++) {
          const mediaUrl = campaignData.mediaUrls[i];
          const mediaPath = path.join(__dirname, '../../public', mediaUrl);
          
          try {
            const mediaId = await this.uploadMedia(mediaPath, consumerKey, consumerSecret, accessToken, tokenSecret);
            mediaIds.push(mediaId);
          } catch (mediaError) {
            console.log(`⚠️ Failed to upload media ${mediaUrl}: ${mediaError.message}`);
          }
        }
      }
      
      // Step 3: Create tweet
      const tweetData = {
        text: content
      };
      
      // Add media if uploaded
      if (mediaIds.length > 0) {
        tweetData.media = {
          media_ids: mediaIds
        };
      }
      
      // Step 4: Post tweet
      console.log('📤 Posting tweet...');
      
      const tweetUrl = `${this.baseURL}/2/tweets`;
      const authHeader = this.createOAuthHeader('POST', tweetUrl, consumerKey, consumerSecret, accessToken, tokenSecret);
      
      const response = await fetch(tweetUrl, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tweetData)
      });
      
      const result = await response.json();
      
      if (result.errors) {
        throw new Error(`Twitter posting error: ${result.errors[0].message}`);
      }
      
      console.log('✅ Twitter post successful!');
      
      return {
        success: true,
        postId: result.data.id,
        text: result.data.text,
        message: 'Tweet posted successfully',
        platform: 'twitter',
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Twitter posting failed:', error.message);
      
      return {
        success: false,
        error: error.message,
        platform: 'twitter',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Test Twitter connection
   */
  async testConnection(tokens) {
    try {
      const { consumerKey, consumerSecret, accessToken, tokenSecret } = tokens;
      
      const url = `${this.baseURL}/2/users/me`;
      const authHeader = this.createOAuthHeader('GET', url, consumerKey, consumerSecret, accessToken, tokenSecret);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': authHeader
        }
      });
      
      const data = await response.json();
      
      if (data.errors) {
        return {
          success: false,
          error: data.errors[0].message
        };
      }
      
      return {
        success: true,
        user: data.data.name,
        username: data.data.username
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new TwitterAPI();