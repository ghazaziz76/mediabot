'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Templates', 'placeholders', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    
    await queryInterface.addColumn('Templates', 'tags', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    
    await queryInterface.addColumn('Templates', 'isPublic', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });
    
    await queryInterface.addColumn('Templates', 'usageCount', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Templates', 'placeholders');
    await queryInterface.removeColumn('Templates', 'tags');
    await queryInterface.removeColumn('Templates', 'isPublic');
    await queryInterface.removeColumn('Templates', 'usageCount');
  }
};