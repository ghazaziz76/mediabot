const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all template routes
router.use(authenticateToken);
router.use((req, res, next) => {
  console.log('🔍 Template route accessed:', req.method, req.path);
  console.log('🔍 Request body:', req.body);
  next();
});

// GET /api/templates/stats - Get template statistics (must be before /:id route)
router.get('/stats', templateController.getTemplateStats);

// GET /api/templates/categories - Get all available categories
router.get('/categories', templateController.getCategories);

// POST /api/templates - Create a new template
router.post('/', templateController.createTemplate);

// GET /api/templates - Get all templates for user (with optional query filters)
router.get('/', templateController.getAllTemplates);

// GET /api/templates/:id - Get a single template
router.get('/:id', templateController.getTemplate);

// PUT /api/templates/:id - Update a template
router.put('/:id', templateController.updateTemplate);

// DELETE /api/templates/:id - Delete a template
router.delete('/:id', templateController.deleteTemplate);

// POST /api/templates/:id/duplicate - Duplicate a template
router.post('/:id/duplicate', templateController.duplicateTemplate);

module.exports = router;