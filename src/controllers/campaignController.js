const { Campaign, User } = require('../../models');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for campaign media uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../public/uploads/campaigns');
    
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, 'campaign_' + uniqueSuffix + extension);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files allowed'), false);
    }
  }
});

class CampaignController {
  
  // Create regular campaign (handles your "New Campaign" form)
  async createCampaign(req, res) {
    try {
      const name = req.body.name;
      const content = req.body.content;
      const platforms = req.body.platforms;
      const intervalHours = req.body.intervalHours;
      const userId = req.user.id;

      // Validate required fields
      if (!name || !content || !platforms) {
        return res.status(400).json({ 
          error: 'Name, content, and platforms are required' 
        });
      }

      // Parse platforms
      let platformArray;
      try {
        platformArray = typeof platforms === 'string' ? JSON.parse(platforms) : platforms;
      } catch (e) {
        return res.status(400).json({ error: 'Invalid platforms format' });
      }

      if (!Array.isArray(platformArray) || platformArray.length === 0) {
        return res.status(400).json({ error: 'At least one platform must be selected' });
      }

      // Handle uploaded media files
      let mediaUrls = [];
      if (req.files && req.files.length > 0) {
        mediaUrls = req.files.map(file => `/uploads/campaigns/${file.filename}`);
      }

      // Calculate next post time
      const hours = parseInt(intervalHours) || 2;
      const nextPostAt = new Date();
      nextPostAt.setHours(nextPostAt.getHours() + hours);

      // Create campaign
      const campaign = await Campaign.create({
        userId,
        name,
        content,
        platforms: JSON.stringify(platformArray),
        intervalHours: hours,
        intervalMinutes: hours * 60, // Also set minutes for compatibility
        campaignType: 'regular',
        mediaUrls: JSON.stringify(mediaUrls),
        nextPostAt,
        status: 'paused',
        isActive: false,
        totalPosts: 0,
        successfulPosts: 0
      });

      res.status(201).json({
        success: true,
        message: 'Campaign created successfully',
        campaign: {
          id: campaign.id,
          name: campaign.name,
          content: campaign.content,
          platforms: campaign.getPlatformsArray(),
          intervalHours: campaign.intervalHours,
          campaignType: campaign.campaignType,
          status: campaign.status,
          successRate: campaign.getSuccessRate(),
          mediaUrls: campaign.getMediaUrlsArray()
        }
      });

    } catch (error) {
      console.error('Error creating campaign:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to create campaign: ' + error.message 
      });
    }
  }

  // Create Threads campaign (handles your "Threads Campaign" form)
  async createThreadsCampaign(req, res) {
    try {
      const { name, content, intervalHours, threadsConfig } = req.body;
      const userId = req.user.id;

      // Validate required fields
      if (!name || !content) {
        return res.status(400).json({ 
          success: false,
          error: 'Name and content are required' 
        });
      }

      // Parse threads configuration
      let threadsConfigObj;
      try {
        threadsConfigObj = typeof threadsConfig === 'string' ? JSON.parse(threadsConfig) : threadsConfig;
      } catch (e) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid threads configuration' 
        });
      }

      // Validate threads config
      if (!threadsConfigObj || !threadsConfigObj.searchKeywords || threadsConfigObj.searchKeywords.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Search keywords are required for Threads campaigns'
        });
      }

      // Handle uploaded media files
      let mediaUrls = [];
      if (req.files && req.files.length > 0) {
        mediaUrls = req.files.map(file => `/uploads/campaigns/${file.filename}`);
      }

      // Calculate next post time
      const hours = parseInt(intervalHours) || 2;
      const nextPostAt = new Date();
      nextPostAt.setHours(nextPostAt.getHours() + hours);

      // Create Threads campaign
      const campaign = await Campaign.create({
        userId,
        name,
        content,
        platforms: JSON.stringify(['threads']), // Only Threads
        intervalHours: hours,
        intervalMinutes: hours * 60,
        campaignType: 'threads_advanced',
        threadsConfig: JSON.stringify(threadsConfigObj),
        mediaUrls: JSON.stringify(mediaUrls),
        nextPostAt,
        status: 'paused',
        isActive: false,
        totalPosts: 0,
        successfulPosts: 0,
        totalMentions: 0
      });

      res.status(201).json({
        success: true,
        message: 'Threads campaign created successfully',
        campaign: {
          id: campaign.id,
          name: campaign.name,
          content: campaign.content,
          platforms: ['threads'],
          intervalHours: campaign.intervalHours,
          campaignType: campaign.campaignType,
          threadsConfig: threadsConfigObj,
          status: campaign.status,
          successRate: campaign.getSuccessRate(),
          mediaUrls: campaign.getMediaUrlsArray(),
          totalMentions: campaign.totalMentions
        }
      });

    } catch (error) {
      console.error('Error creating Threads campaign:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to create Threads campaign: ' + error.message 
      });
    }
  }

  // Get all campaigns for user (updated to handle new fields)
  async getAllCampaigns(req, res) {
    try {
      const userId = req.user.id;

      const campaigns = await Campaign.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']]
      });

      const campaignsWithDetails = campaigns.map(campaign => ({
        id: campaign.id,
        name: campaign.name,
        description: campaign.description,
        content: campaign.content,
        platforms: campaign.getPlatformsArray(),
        intervalMinutes: campaign.intervalMinutes,
        intervalHours: campaign.intervalHours,
        campaignType: campaign.campaignType || 'regular',
        status: campaign.status || campaign.getStatus(),
        isActive: campaign.isActive,
        totalPosts: campaign.totalPosts,
        successfulPosts: campaign.successfulPosts,
        successRate: campaign.getSuccessRate(),
        lastPostedAt: campaign.lastPostedAt,
        nextPostAt: campaign.nextPostAt,
        mediaUrls: campaign.getMediaUrlsArray(),
        totalMentions: campaign.totalMentions || 0,
        lastMentionedAt: campaign.lastMentionedAt,
        createdAt: campaign.createdAt
      }));

      res.json({
        success: true,
        message: 'Campaigns retrieved successfully',
        campaigns: campaignsWithDetails
      });

    } catch (error) {
      console.error('Error fetching campaigns:', error);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  // Update campaign (enhanced to handle status changes)
  async updateCampaign(req, res) {
    try {
      const { id } = req.params;
      const { status, ...updateData } = req.body;
      const userId = req.user.id;

      const campaign = await Campaign.findOne({
        where: { id, userId }
      });

      if (!campaign) {
        return res.status(404).json({ 
          success: false,
          error: 'Campaign not found' 
        });
      }

      // Update campaign
      await campaign.update({
        status,
        isActive: status === 'active',
        ...updateData
      });

      // If activating campaign, set next post time
      if (status === 'active' && campaign.status !== 'active') {
        const nextPostAt = new Date();
        nextPostAt.setHours(nextPostAt.getHours() + campaign.intervalHours);
        await campaign.update({ nextPostAt });
      }

      res.json({
        success: true,
        message: 'Campaign updated successfully',
        campaign: {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          isActive: campaign.isActive,
          nextPostAt: campaign.nextPostAt,
          successRate: campaign.getSuccessRate()
        }
      });

    } catch (error) {
      console.error('Error updating campaign:', error);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  // Start campaign (legacy method - kept for compatibility)
  async startCampaign(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const campaign = await Campaign.findOne({
        where: { id, userId }
      });

      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      // Set campaign as active and calculate next post time
      campaign.isActive = true;
      campaign.status = 'active';
      campaign.nextPostAt = new Date(Date.now() + (campaign.intervalHours * 60 * 60 * 1000));
      
      await campaign.save();

      res.json({
        message: 'Campaign started successfully',
        campaign: {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          nextPostAt: campaign.nextPostAt
        }
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Stop campaign (legacy method - kept for compatibility)
  async stopCampaign(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const campaign = await Campaign.findOne({
        where: { id, userId }
      });

      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      // Set campaign as inactive
      campaign.isActive = false;
      campaign.status = 'paused';
      campaign.nextPostAt = null;
      
      await campaign.save();

      res.json({
        message: 'Campaign stopped successfully',
        campaign: {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status
        }
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

}

const controllerInstance = new CampaignController();

module.exports = {
  createCampaign: controllerInstance.createCampaign.bind(controllerInstance),
  createThreadsCampaign: controllerInstance.createThreadsCampaign.bind(controllerInstance),
  getAllCampaigns: controllerInstance.getAllCampaigns.bind(controllerInstance),
  updateCampaign: controllerInstance.updateCampaign.bind(controllerInstance),
  startCampaign: controllerInstance.startCampaign.bind(controllerInstance),
  stopCampaign: controllerInstance.stopCampaign.bind(controllerInstance),
  upload
};