const templateService = require('../services/templateService');

class TemplateController {

  // POST /api/templates - Create a new template
  async createTemplate(req, res) {
    console.log('🔍 Controller createTemplate called');
    console.log('🔍 templateService type:', typeof templateService);
    console.log('🔍 templateService.createTemplate:', typeof templateService.createTemplate);
    try {
      const userId = req.user.id;
      const { name, content, description, category, platforms } = req.body;

      // Validation
      if (!name || !content) {
        return res.status(400).json({
          error: 'Name and content are required'
        });
      }

      if (name.length < 3) {
        return res.status(400).json({
          error: 'Template name must be at least 3 characters long'
        });
      }

      if (content.length < 10) {
        return res.status(400).json({
          error: 'Template content must be at least 10 characters long'
        });
      }

      const templateData = {
        name: name.trim(),
        content: content.trim(),
        description: description ? description.trim() : '',
        category: category || 'general',
        platforms: platforms || []
      };

      const result = await templateService.createTemplate(userId, templateData);

      if (result.success) {
        res.status(201).json({
          message: result.message,
          template: result.template
        });
      } else {
        res.status(400).json({
          error: result.error
        });
      }

    } catch (error) {
      console.error('Error creating template:', error);
      res.status(500).json({
        error: 'Failed to create template'
      });
    }
  }

  // GET /api/templates - Get all templates for user
  async getAllTemplates(req, res) {
    try {
      const userId = req.user.id;
      const { category, search } = req.query;

      let result;

      if (search) {
        // Search templates
        result = await templateService.searchTemplates(userId, search);
      } else if (category) {
        // Get by category
        result = await templateService.getTemplatesByCategory(userId, category);
      } else {
        // Get all templates
        result = await templateService.getUserTemplates(userId);
      }

      if (result.success) {
        res.json({
          templates: result.templates,
          count: result.templates.length
        });
      } else {
        res.status(400).json({
          error: result.error
        });
      }

    } catch (error) {
      console.error('Error getting templates:', error);
      res.status(500).json({
        error: 'Failed to get templates'
      });
    }
  }

  // GET /api/templates/:id - Get a single template
  async getTemplate(req, res) {
    try {
      const userId = req.user.id;
      const templateId = req.params.id;

      if (!templateId || isNaN(templateId)) {
        return res.status(400).json({
          error: 'Valid template ID is required'
        });
      }

      const result = await templateService.getTemplateById(templateId, userId);

      if (result.success) {
        res.json({
          template: result.template
        });
      } else {
        res.status(404).json({
          error: result.error
        });
      }

    } catch (error) {
      console.error('Error getting template:', error);
      res.status(500).json({
        error: 'Failed to get template'
      });
    }
  }

  // PUT /api/templates/:id - Update a template
  async updateTemplate(req, res) {
    try {
      const userId = req.user.id;
      const templateId = req.params.id;
      const { name, content, description, category, platforms } = req.body;

      if (!templateId || isNaN(templateId)) {
        return res.status(400).json({
          error: 'Valid template ID is required'
        });
      }

      // Validation
      if (name && name.length < 3) {
        return res.status(400).json({
          error: 'Template name must be at least 3 characters long'
        });
      }

      if (content && content.length < 10) {
        return res.status(400).json({
          error: 'Template content must be at least 10 characters long'
        });
      }

      const updateData = {};
      if (name) updateData.name = name.trim();
      if (content) updateData.content = content.trim();
      if (description !== undefined) updateData.description = description.trim();
      if (category) updateData.category = category;
      if (platforms) updateData.platforms = platforms;

      const result = await templateService.updateTemplate(templateId, userId, updateData);

      if (result.success) {
        res.json({
          message: result.message,
          template: result.template
        });
      } else {
        res.status(404).json({
          error: result.error
        });
      }

    } catch (error) {
      console.error('Error updating template:', error);
      res.status(500).json({
        error: 'Failed to update template'
      });
    }
  }

  // DELETE /api/templates/:id - Delete a template
  async deleteTemplate(req, res) {
    try {
      const userId = req.user.id;
      const templateId = req.params.id;

      if (!templateId || isNaN(templateId)) {
        return res.status(400).json({
          error: 'Valid template ID is required'
        });
      }

      const result = await templateService.deleteTemplate(templateId, userId);

      if (result.success) {
        res.json({
          message: result.message
        });
      } else {
        res.status(404).json({
          error: result.error
        });
      }

    } catch (error) {
      console.error('Error deleting template:', error);
      res.status(500).json({
        error: 'Failed to delete template'
      });
    }
  }

  // GET /api/templates/stats - Get template statistics
  async getTemplateStats(req, res) {
    try {
      const userId = req.user.id;

      const result = await templateService.getTemplateStats(userId);

      if (result.success) {
        res.json({
          stats: result.stats
        });
      } else {
        res.status(400).json({
          error: result.error
        });
      }

    } catch (error) {
      console.error('Error getting template stats:', error);
      res.status(500).json({
        error: 'Failed to get template statistics'
      });
    }
  }

  // GET /api/templates/categories - Get all available categories
  async getCategories(req, res) {
    try {
      // Default categories
      const defaultCategories = [
        'general',
        'marketing',
        'business',
        'social',
        'promotional',
        'educational',
        'entertainment',
        'news',
        'personal'
      ];

      res.json({
        categories: defaultCategories
      });

    } catch (error) {
      console.error('Error getting categories:', error);
      res.status(500).json({
        error: 'Failed to get categories'
      });
    }
  }

  // POST /api/templates/:id/duplicate - Duplicate a template
  async duplicateTemplate(req, res) {
    try {
      const userId = req.user.id;
      const templateId = req.params.id;

      if (!templateId || isNaN(templateId)) {
        return res.status(400).json({
          error: 'Valid template ID is required'
        });
      }

      // Get the original template
      const originalResult = await templateService.getTemplateById(templateId, userId);

      if (!originalResult.success) {
        return res.status(404).json({
          error: originalResult.error
        });
      }

      // Create a copy with "Copy of" prefix
      const originalTemplate = originalResult.template;
      const duplicateData = {
        name: `Copy of ${originalTemplate.name}`,
        content: originalTemplate.content,
        description: originalTemplate.description,
        category: originalTemplate.category,
        platforms: originalTemplate.platforms
      };

      const result = await templateService.createTemplate(userId, duplicateData);

      if (result.success) {
        res.status(201).json({
          message: 'Template duplicated successfully',
          template: result.template
        });
      } else {
        res.status(400).json({
          error: result.error
        });
      }

    } catch (error) {
      console.error('Error duplicating template:', error);
      res.status(500).json({
        error: 'Failed to duplicate template'
      });
    }
  }
}

module.exports = new TemplateController();