const express = require('express');
const router = express.Router();
const hashtagController = require('../controllers/hashtagController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all hashtag routes
router.use(authenticateToken);

// GET /api/hashtags/stats - Get hashtag statistics (must be before /:id route)
router.get('/stats', hashtagController.getHashtagStats);

// GET /api/hashtags/platforms - Get all supported platforms
router.get('/platforms', hashtagController.getPlatforms);

// GET /api/hashtags/categories - Get all available categories
router.get('/categories', hashtagController.getCategories);

// GET /api/hashtags/random/:platform - Get random hashtags for a platform
router.get('/random/:platform', hashtagController.getRandomHashtags);

// POST /api/hashtags/suggestions - Generate hashtag suggestions
router.post('/suggestions', hashtagController.generateSuggestions);

// POST /api/hashtags - Create a new hashtag group
router.post('/', hashtagController.createHashtagGroup);

// GET /api/hashtags - Get all hashtag groups for user (with optional query filters)
router.get('/', hashtagController.getAllHashtagGroups);

// GET /api/hashtags/:id - Get a single hashtag group
router.get('/:id', hashtagController.getHashtagGroup);

// PUT /api/hashtags/:id - Update a hashtag group
router.put('/:id', hashtagController.updateHashtagGroup);

// DELETE /api/hashtags/:id - Delete a hashtag group
router.delete('/:id', hashtagController.deleteHashtagGroup);

// POST /api/hashtags/:id/duplicate - Duplicate a hashtag group
router.post('/:id/duplicate', hashtagController.duplicateHashtagGroup);

module.exports = router;