'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('PlatformConnections', {
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
      platform: {
        type: Sequelize.STRING,
        allowNull: false
      },
      accessToken: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      refreshToken: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
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

    // Add unique constraint to prevent duplicate connections
    await queryInterface.addIndex('PlatformConnections', ['userId', 'platform'], {
      unique: true,
      name: 'unique_user_platform'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('PlatformConnections');
  }
};

