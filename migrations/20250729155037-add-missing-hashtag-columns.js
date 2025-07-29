'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('HashtagGroups', 'platforms', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    
    await queryInterface.addColumn('HashtagGroups', 'isPublic', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });
    
    await queryInterface.addColumn('HashtagGroups', 'usageCount', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });
    
    await queryInterface.addColumn('HashtagGroups', 'color', {
      type: Sequelize.STRING,
      defaultValue: '#4F46E5'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('HashtagGroups', 'platforms');
    await queryInterface.removeColumn('HashtagGroups', 'isPublic');
    await queryInterface.removeColumn('HashtagGroups', 'usageCount');
    await queryInterface.removeColumn('HashtagGroups', 'color');
  }
};