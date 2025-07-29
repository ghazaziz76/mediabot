console.log('🔍 Loading templateService...');

const { Template } = require('../../models');
console.log('🔍 Template created:', typeof Template);
console.log('🔍 Template.create:', typeof Template.create);


class TemplateService {
  
  // Create a new template
  async createTemplate(userId, templateData) {
    console.log('🔍 createTemplate called with userId:', userId);
    console.log('🔍 Template object:', typeof Template);
    console.log('🔍 Template.create:', typeof Template.create);
    console.log('🔍 templateData:', templateData);
    try {
      const template = await Template.create({
        userId: userId,
        name: templateData.name,
        content: templateData.content,
        description: templateData.description,
        category: templateData.category || 'general',
        platforms: JSON.stringify(templateData.platforms || []),
        isActive: true
      });
      
      return {
        success: true,
        template: template,
        message: 'Template created successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get all templates for a user
  async getUserTemplates(userId) {
    try {
      const templates = await Template.findAll({
        where: { userId: userId, isActive: true },
        order: [['createdAt', 'DESC']]
      });

      // Convert platforms JSON string back to array
      const templatesWithParsedPlatforms = templates.map(template => ({
        ...template.toJSON(),
        platforms: JSON.parse(template.platforms || '[]')
      }));

      return {
        success: true,
        templates: templatesWithParsedPlatforms
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get a single template by ID
  async getTemplateById(templateId, userId) {
    try {
      const template = await Template.findOne({
        where: { 
          id: templateId, 
          userId: userId,
          isActive: true 
        }
      });

      if (!template) {
        return {
          success: false,
          error: 'Template not found'
        };
      }

      return {
        success: true,
        template: {
          ...template.toJSON(),
          platforms: JSON.parse(template.platforms || '[]')
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Update a template
  async updateTemplate(templateId, userId, updateData) {
    try {
      const template = await Template.findOne({
        where: { 
          id: templateId, 
          userId: userId,
          isActive: true 
        }
      });

      if (!template) {
        return {
          success: false,
          error: 'Template not found'
        };
      }

      // Update the template
      await template.update({
        name: updateData.name || template.name,
        content: updateData.content || template.content,
        description: updateData.description || template.description,
        category: updateData.category || template.category,
        platforms: updateData.platforms ? JSON.stringify(updateData.platforms) : template.platforms
      });

      return {
        success: true,
        template: {
          ...template.toJSON(),
          platforms: JSON.parse(template.platforms || '[]')
        },
        message: 'Template updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Delete a template (soft delete)
  async deleteTemplate(templateId, userId) {
    try {
      const template = await Template.findOne({
        where: { 
          id: templateId, 
          userId: userId,
          isActive: true 
        }
      });

      if (!template) {
        return {
          success: false,
          error: 'Template not found'
        };
      }

      // Soft delete by setting isActive to false
      await template.update({ isActive: false });

      return {
        success: true,
        message: 'Template deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get templates by category
  async getTemplatesByCategory(userId, category) {
    try {
      const templates = await Template.findAll({
        where: { 
          userId: userId, 
          category: category,
          isActive: true 
        },
        order: [['createdAt', 'DESC']]
      });

      const templatesWithParsedPlatforms = templates.map(template => ({
        ...template.toJSON(),
        platforms: JSON.parse(template.platforms || '[]')
      }));

      return {
        success: true,
        templates: templatesWithParsedPlatforms
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Search templates by name or content
  async searchTemplates(userId, searchTerm) {
    try {
      const { Op } = require('sequelize');
      
      const templates = await Template.findAll({
        where: {
          userId: userId,
          isActive: true,
          [Op.or]: [
            { name: { [Op.like]: `%${searchTerm}%` } },
            { content: { [Op.like]: `%${searchTerm}%` } },
            { description: { [Op.like]: `%${searchTerm}%` } }
          ]
        },
        order: [['createdAt', 'DESC']]
      });

      const templatesWithParsedPlatforms = templates.map(template => ({
        ...template.toJSON(),
        platforms: JSON.parse(template.platforms || '[]')
      }));

      return {
        success: true,
        templates: templatesWithParsedPlatforms
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get template usage statistics
  async getTemplateStats(userId) {
    try {
      const { Op } = require('sequelize');
      
      const totalTemplates = await Template.count({
        where: { userId: userId, isActive: true }
      });

      const categories = await Template.findAll({
        where: { userId: userId, isActive: true },
        attributes: ['category'],
        group: ['category']
      });

      const recentTemplates = await Template.findAll({
        where: { 
          userId: userId, 
          isActive: true,
          createdAt: {
            [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      });

      return {
        success: true,
        stats: {
          totalTemplates: totalTemplates,
          totalCategories: categories.length,
          recentTemplates: recentTemplates.length,
          categories: categories.map(cat => cat.category)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

console.log('🔍 Creating TemplateService instance...');
const serviceInstance = new TemplateService();
console.log('🔍 Service instance created:', typeof serviceInstance);
console.log('🔍 Service methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(serviceInstance)).filter(name => name !== 'constructor'));
module.exports = serviceInstance;