const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all campaign routes
router.use(authenticateToken);

// POST /api/campaigns - Create new campaign
router.post('/', campaignController.createCampaign);

// GET /api/campaigns - Get all campaigns for user
router.get('/', campaignController.getAllCampaigns);

// GET /api/campaigns/:id - Get single campaign
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const campaign = await require('../../models').Campaign.findOne({
      where: { id, userId }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json({
      message: 'Campaign retrieved successfully',
      campaign: {
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
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/campaigns/:id - Update campaign
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { name, description, content, platforms, intervalMinutes } = req.body;

    const campaign = await require('../../models').Campaign.findOne({
      where: { id, userId }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Update fields
    if (name) campaign.name = name;
    if (description !== undefined) campaign.description = description;
    if (content) campaign.content = content;
    if (platforms) campaign.platforms = JSON.stringify(platforms);
    if (intervalMinutes) campaign.intervalMinutes = intervalMinutes;

    await campaign.save();

    res.json({
      message: 'Campaign updated successfully',
      campaign: {
        id: campaign.id,
        name: campaign.name,
        description: campaign.description,
        platforms: campaign.getPlatformsArray(),
        status: campaign.getStatus()
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/campaigns/:id - Delete campaign
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const campaign = await require('../../models').Campaign.findOne({
      where: { id, userId }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    await campaign.destroy();
    res.json({ message: 'Campaign deleted successfully' });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/campaigns/:id/start - Start campaign
router.post('/:id/start', campaignController.startCampaign);

// POST /api/campaigns/:id/stop - Stop campaign
router.post('/:id/stop', campaignController.stopCampaign);

// POST /api/campaigns/:id/test-post - Manual trigger for testing
router.post('/:id/test-post', async (req, res) => {
  try {
    const { id } = req.params;
    const postingService = require('../services/postingService');
    
    const result = await postingService.triggerManualPost(id);
    
    res.json({
      message: 'Manual post triggered',
      result: result
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;