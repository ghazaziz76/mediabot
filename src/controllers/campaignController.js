const { Campaign, User } = require('../../models');

class CampaignController {
  
  // Create new campaign
  async createCampaign(req, res) {
    try {
      const { name, description, content, platforms, intervalMinutes } = req.body;
      const userId = req.user.id;

      // Validate required fields
      if (!name || !content || !platforms || platforms.length === 0) {
        return res.status(400).json({ 
          error: 'Name, content, and at least one platform are required' 
        });
      }

      // Create campaign
      const campaign = await Campaign.create({
        userId,
        name,
        description,
        content,
        platforms: JSON.stringify(platforms),
        intervalMinutes: intervalMinutes || 360, // Default 6 hours
        isActive: false,
        totalPosts: 0,
        successfulPosts: 0
      });

      res.status(201).json({
        message: 'Campaign created successfully',
        campaign: {
          id: campaign.id,
          name: campaign.name,
          description: campaign.description,
          content: campaign.content,
          platforms: campaign.getPlatformsArray(),
          intervalMinutes: campaign.intervalMinutes,
          status: campaign.getStatus(),
          successRate: campaign.getSuccessRate()
        }
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get all campaigns for user
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
        status: campaign.getStatus(),
        isActive: campaign.isActive,
        totalPosts: campaign.totalPosts,
        successfulPosts: campaign.successfulPosts,
        successRate: campaign.getSuccessRate(),
        lastPostedAt: campaign.lastPostedAt,
        nextPostAt: campaign.nextPostAt,
        createdAt: campaign.createdAt
      }));

      res.json({
        message: 'Campaigns retrieved successfully',
        campaigns: campaignsWithDetails
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Start campaign
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
      campaign.nextPostAt = new Date(Date.now() + (campaign.intervalMinutes * 60 * 1000));
      
      await campaign.save();

      res.json({
        message: 'Campaign started successfully',
        campaign: {
          id: campaign.id,
          name: campaign.name,
          status: campaign.getStatus(),
          nextPostAt: campaign.nextPostAt
        }
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Stop campaign
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
      campaign.nextPostAt = null;
      
      await campaign.save();

      res.json({
        message: 'Campaign stopped successfully',
        campaign: {
          id: campaign.id,
          name: campaign.name,
          status: campaign.getStatus()
        }
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

}

module.exports = new CampaignController();