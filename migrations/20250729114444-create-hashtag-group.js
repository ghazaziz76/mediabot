'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('HashtagGroups', {
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
      hashtags: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: '[]'
      },
      description: {
        type: Sequelize.TEXT
      },
      platform: {
        type: Sequelize.STRING,
        defaultValue: 'all'
      },
      category: {
        type: Sequelize.STRING,
        defaultValue: 'general'
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

    // Add indexes for better performance
    await queryInterface.addIndex('HashtagGroups', ['userId']);
    await queryInterface.addIndex('HashtagGroups', ['platform']);
    await queryInterface.addIndex('HashtagGroups', ['category']);
    await queryInterface.addIndex('HashtagGroups', ['isActive']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('HashtagGroups');
  }
};