const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

/**
 * TikTok API Integration
 * Uses TikTok Business API for posting video content
 * Focuses on short-form vertical videos with trending hashtags
 */

class TikTokAPI {
  constructor() {
    this.baseURL = 'https://open.tiktokapis.com';
    this.uploadURL = 'https://open-upload.tiktokapis.com';
  }

  /**
   * Get TikTok user information
   */
  async getUserInfo(accessToken) {
    try {
      const response = await fetch(`${this.baseURL}/v2/user/info/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: ['open_id', 'union_id', 'avatar_url', 'display_name', 'username']
        })
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(`TikTok API Error: ${data.error.message}`);
      }

      return data.data.user;

    } catch (error) {
      console.error('Error getting TikTok user info:', error.message);
      throw error;
    }
  }

  /**
   * Initialize video upload to TikTok
   * TikTok requires multi-step upload process
   */
  async initializeVideoUpload(accessToken, videoPath) {
    try {
      const videoStats = fs.statSync(videoPath);
      const videoSize = videoStats.size;

      // TikTok video requirements
      if (videoSize > 200 * 1024 * 1024) { // 200MB limit
        throw new Error('Video file too large. TikTok supports videos up to 200MB.');
      }

      const initData = {
        source_info: {
          source: 'FILE_UPLOAD',
          video_size: videoSize,
          chunk_size: 10 * 1024 * 1024, // 10MB chunks
          total_chunk_count: Math.ceil(videoSize / (10 * 1024 * 1024))
        }
      };

      const response = await fetch(`${this.baseURL}/v2/post/publish/video/init/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(initData)
      });

      const result = await response.json();

      if (result.error) {
        throw new Error(`TikTok upload init error: ${result.error.message}`);
      }

      return {
        publishId: result.data.publish_id,
        uploadUrl: result.data.upload_url
      };

    } catch (error) {
      console.error('Error initializing TikTok video upload:', error.message);
      throw error;
    }
  }

  /**
   * Upload video chunks to TikTok
   */
  async uploadVideoChunks(uploadUrl, videoPath, accessToken) {
    try {
      const videoBuffer = fs.readFileSync(videoPath);
      const chunkSize = 10 * 1024 * 1024; // 10MB chunks
      const totalChunks = Math.ceil(videoBuffer.length / chunkSize);

      console.log(`📤 Uploading video in ${totalChunks} chunks...`);

      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, videoBuffer.length);
        const chunk = videoBuffer.slice(start, end);

        const formData = new FormData();
        formData.append('video', chunk, {
          filename: `chunk_${i}.mp4`,
          contentType: 'video/mp4'
        });

        const chunkResponse = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Range': `bytes ${start}-${end-1}/${videoBuffer.length}`
          },
          body: formData
        });

        if (!chunkResponse.ok) {
          throw new Error(`Chunk ${i + 1} upload failed: ${chunkResponse.statusText}`);
        }

        console.log(`✅ Chunk ${i + 1}/${totalChunks} uploaded`);

        // Small delay between chunks
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.log('✅ All video chunks uploaded successfully');
      return true;

    } catch (error) {
      console.error('Error uploading video chunks:', error.message);
      throw error;
    }
  }

  /**
   * Generate trending TikTok hashtags
   */
  generateTikTokHashtags(content) {
    const trendingHashtags = [
      '#TikTok', '#Trending', '#Viral', '#Content', '#Creative',
      '#Fun', '#Entertainment', '#Video', '#Social', '#Discover'
    ];

    const businessHashtags = [
      '#Business', '#Marketing', '#Entrepreneur', '#Success', '#Growth'
    ];

    const techHashtags = [
      '#Tech', '#Innovation', '#Digital', '#Automation', '#AI'
    ];

    // Choose hashtags based on content
    let selectedHashtags = [...trendingHashtags.slice(0, 3)];

    if (content.toLowerCase().includes('business') || content.toLowerCase().includes('marketing')) {
      selectedHashtags.push(...businessHashtags.slice(0, 2));
    }

    if (content.toLowerCase().includes('tech') || content.toLowerCase().includes('automation')) {
      selectedHashtags.push(...techHashtags.slice(0, 2));
    }

    return selectedHashtags.slice(0, 5); // Limit to 5 hashtags
  }

  /**
   * Format content for TikTok
   */
  formatTikTokContent(content) {
    // TikTok supports up to 2200 characters
    let formattedContent = content;

    if (formattedContent.length > 2000) {
      formattedContent = formattedContent.substring(0, 1950) + '...';
    }

    // Add trending hashtags if not present
    if (!content.includes('#')) {
      const hashtags = this.generateTikTokHashtags(content);
      formattedContent += '\n\n' + hashtags.join(' ');
    }

    return formattedContent;
  }

  /**
   * Check if file is a valid video for TikTok
   */
  isValidTikTokVideo(filePath) {
    const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv'];
    const ext = path.extname(filePath).toLowerCase();
    
    if (!videoExtensions.includes(ext)) {
      return false;
    }

    // Check file size (200MB limit)
    const stats = fs.statSync(filePath);
    if (stats.size > 200 * 1024 * 1024) {
      return false;
    }

    return true;
  }

  /**
   * Post video to TikTok
   * TikTok is primarily a video platform
   */
  async postToTikTok(campaignData, accessToken) {
    try {
      console.log('🔵 Starting TikTok post...');

      // Step 1: Check for video content
      if (!campaignData.mediaUrls || campaignData.mediaUrls.length === 0) {
        throw new Error('TikTok requires video content. Please upload a video file.');
      }

      // Find the first video file
      let videoPath = null;
      for (const mediaUrl of campaignData.mediaUrls) {
        const fullPath = path.join(__dirname, '../../public', mediaUrl);
        if (fs.existsSync(fullPath) && this.isValidTikTokVideo(fullPath)) {
          videoPath = fullPath;
          break;
        }
      }

      if (!videoPath) {
        throw new Error('No valid video file found for TikTok. Please upload an MP4, MOV, AVI, or MKV file under 200MB.');
      }

      console.log(`🎥 Using video: ${videoPath}`);

      // Step 2: Format content for TikTok
      const title = this.formatTikTokContent(campaignData.content);

      console.log('📤 Initializing TikTok video upload...');

      // Step 3: Initialize upload
      const uploadInfo = await this.initializeVideoUpload(accessToken, videoPath);
      const { publishId, uploadUrl } = uploadInfo;

      console.log(`📋 Publish ID: ${publishId}`);

      // Step 4: Upload video chunks
      await this.uploadVideoChunks(uploadUrl, videoPath, accessToken);

      // Step 5: Publish the video
      console.log('📤 Publishing TikTok video...');

      const publishData = {
        post_info: {
          title: title,
          privacy_level: 'PUBLIC_TO_EVERYONE',
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
          video_cover_timestamp_ms: 1000
        },
        source_info: {
          source: 'FILE_UPLOAD',
          publish_id: publishId
        }
      };

      const publishResponse = await fetch(`${this.baseURL}/v2/post/publish/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(publishData)
      });

      const publishResult = await publishResponse.json();

      if (publishResult.error) {
        throw new Error(`TikTok publish error: ${publishResult.error.message}`);
      }

      console.log('✅ TikTok video posted successfully!');

      return {
        success: true,
        publishId: publishId,
        shareId: publishResult.data.share_id,
        message: 'Video posted to TikTok successfully',
        platform: 'tiktok',
        timestamp: new Date().toISOString(),
        engagement: {
          views: 0,
          likes: 0,
          comments: 0,
          shares: 0
        }
      };

    } catch (error) {
      console.error('❌ TikTok posting failed:', error.message);

      return {
        success: false,
        error: error.message,
        platform: 'tiktok',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get TikTok video analytics
   */
  async getVideoAnalytics(accessToken, videoIds) {
    try {
      const response = await fetch(`${this.baseURL}/v2/video/list/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filters: {
            video_ids: videoIds
          },
          fields: ['id', 'title', 'video_description', 'duration', 'cover_image_url', 'share_url', 'view_count', 'like_count', 'comment_count', 'share_count']
        })
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(`TikTok analytics error: ${data.error.message}`);
      }

      return data.data.videos;

    } catch (error) {
      console.error('Error getting TikTok analytics:', error.message);
      return [];
    }
  }

  /**
   * Test TikTok connection
   */
  async testConnection(accessToken) {
    try {
      const userInfo = await this.getUserInfo(accessToken);

      return {
        success: true,
        user: userInfo.display_name,
        username: userInfo.username,
        userId: userInfo.open_id
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get TikTok posting guidelines
   */
  getPostingGuidelines() {
    return {
      videoRequirements: {
        formats: ['MP4', 'MOV', 'AVI', 'MKV'],
        maxSize: '200MB',
        duration: '15 seconds to 10 minutes',
        resolution: 'Minimum 720p, recommended 1080p',
        aspectRatio: '9:16 (vertical) recommended'
      },
      contentGuidelines: {
        maxTitleLength: 2200,
        hashtagLimit: '3-5 hashtags recommended',
        trendsToFollow: ['Trending sounds', 'Popular effects', 'Current challenges'],
        bestPractices: [
          'Hook viewers in first 3 seconds',
          'Use trending sounds and effects',
          'Post consistently',
          'Engage with comments quickly',
          'Use relevant hashtags'
        ]
      }
    };
  }
}

module.exports = new TikTokAPI();