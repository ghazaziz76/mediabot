'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Campaigns', 'intervalHours', {
      type: Sequelize.INTEGER,
      defaultValue: 2,
      allowNull: false
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Campaigns', 'intervalHours');
  }
};
