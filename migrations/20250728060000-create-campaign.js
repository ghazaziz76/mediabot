'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Campaigns', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      mediaUrls: {
        type: Sequelize.TEXT
      },
      platforms: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      intervalMinutes: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 360
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      lastPostedAt: {
        type: Sequelize.DATE
      },
      nextPostAt: {
        type: Sequelize.DATE
      },
      totalPosts: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      successfulPosts: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Campaigns');
  }
};