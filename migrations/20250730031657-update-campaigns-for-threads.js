'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add new columns to campaigns table
    await queryInterface.addColumn('Campaigns', 'campaignType', {
      type: Sequelize.STRING,
      defaultValue: 'regular',
      allowNull: false
    });

    await queryInterface.addColumn('Campaigns', 'threadsConfig', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('Campaigns', 'totalMentions', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false
    });

    await queryInterface.addColumn('Campaigns', 'lastMentionedAt', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Campaigns', 'campaignType');
    await queryInterface.removeColumn('Campaigns', 'threadsConfig');
    await queryInterface.removeColumn('Campaigns', 'totalMentions');
    await queryInterface.removeColumn('Campaigns', 'lastMentionedAt');
  }
};
