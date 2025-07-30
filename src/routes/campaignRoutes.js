const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');
const { authenticateToken } = require('../middleware/auth');

console.log('📋 Campaign routes loaded with Threads support!');

// Apply authentication middleware to all campaign routes
router.use(authenticateToken);

// POST /api/campaigns/threads - Create new Threads campaign (MUST be before /:id routes)
router.post('/threads', campaignController.upload.array('media', 5), campaignController.createThreadsCampaign);

// POST /api/campaigns - Create new campaign
router.post('/', campaignController.upload.array('media', 5), campaignController.createCampaign);

// GET /api/campaigns - Get all campaigns for user
router.get('/', campaignController.getAllCampaigns);

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
  console.log(`🚀 PUT REQUEST RECEIVED for campaign ${req.params.id}`); // ADD THIS FIRST LINE
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { name, description, content, platforms, intervalMinutes, status } = req.body;

    console.log(`🔄 Updating campaign ${id}:`, req.body); // ADD THIS LINE

    const campaign = await require('../../models').Campaign.findOne({
      where: { id, userId }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    console.log(`📊 Current status: ${campaign.status}, New status: ${status}`); // ADD THIS LINE

    // Update fields
    if (name) campaign.name = name;
    if (description !== undefined) campaign.description = description;
    if (content) campaign.content = content;
    if (platforms) campaign.platforms = JSON.stringify(platforms);
    if (intervalMinutes) campaign.intervalMinutes = intervalMinutes;

    // Handle status updates
  if (status) {
    console.log(`🔄 Before save - Current: ${campaign.status}, Setting to: ${status}`); // DEBUG
  
    campaign.status = status;
    campaign.isActive = status === 'active';
  
  // Set next post time when activating
  if (status === 'active') {
    const nextPostAt = new Date();
    nextPostAt.setHours(nextPostAt.getHours() + (campaign.intervalHours || 2));
    campaign.nextPostAt = nextPostAt;
  } else {
    campaign.nextPostAt = null;
  }
  
  console.log(`💾 About to save with status: ${campaign.status}, isActive: ${campaign.isActive}`); // DEBUG
}
    
    // Handle status updates
    if (status) {
      campaign.status = status;
      campaign.isActive = status === 'active';
      
      // Set next post time when activating
      if (status === 'active') {
        const nextPostAt = new Date();
        nextPostAt.setHours(nextPostAt.getHours() + (campaign.intervalHours || 2));
        campaign.nextPostAt = nextPostAt;
      } else {
        campaign.nextPostAt = null;
      }
    }

    await campaign.save();

    console.log(`✅ After save - Status in DB should be: ${campaign.status}`); // DEBUG
    console.log(`✅ Updated campaign status to: ${campaign.status}`); // ADD THIS LINE

    res.json({
      message: 'Campaign updated successfully',
      campaign: {
        id: campaign.id,
        name: campaign.name,
        description: campaign.description,
        platforms: campaign.getPlatformsArray(),
        status: campaign.status,
        isActive: campaign.isActive,
        nextPostAt: campaign.nextPostAt
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

module.exports = router;