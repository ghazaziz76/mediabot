'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🔄 Adding advanced scheduling columns to Campaigns table...');
    
    try {
      // Check if Campaigns table exists
      const tables = await queryInterface.showAllTables();
      const campaignsTableExists = tables.includes('Campaigns');
      
      if (!campaignsTableExists) {
        console.log('❌ Campaigns table does not exist. Creating it first...');
        await queryInterface.createTable('Campaigns', {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER
          },
          name: {
            type: Sequelize.STRING,
            allowNull: false
          },
          content: {
            type: Sequelize.TEXT
          },
          mediaUrls: {
            type: Sequelize.TEXT
          },
          platforms: {
            type: Sequelize.TEXT
          },
          intervalMinutes: {
            type: Sequelize.INTEGER,
            defaultValue: 60
          },
          status: {
            type: Sequelize.STRING,
            defaultValue: 'draft'
          },
          totalPosts: {
            type: Sequelize.INTEGER,
            defaultValue: 0
          },
          successfulPosts: {
            type: Sequelize.INTEGER,
            defaultValue: 0
          },
          lastPostedAt: {
            type: Sequelize.DATE
          },
          nextPostAt: {
            type: Sequelize.DATE
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
        console.log('✅ Campaigns table created successfully');
      }

      // Add new columns for advanced scheduling
      console.log('🔄 Adding advanced scheduling columns...');
      
      await queryInterface.addColumn('Campaigns', 'scheduledStartDate', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When the campaign should start posting'
      });

      await queryInterface.addColumn('Campaigns', 'scheduledEndDate', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When the campaign should stop posting'
      });

      await queryInterface.addColumn('Campaigns', 'daysOfWeek', {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: '1,2,3,4,5,6,7',
        comment: 'Which days of week to post (comma-separated: 1=Mon, 2=Tue, etc.)'
      });

      await queryInterface.addColumn('Campaigns', 'postingTimes', {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: '["09:00"]',
        comment: 'Array of times to post each day (JSON format: ["09:00", "17:00"])'
      });

      await queryInterface.addColumn('Campaigns', 'platformSchedules', {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Different schedules for different platforms (JSON format)'
      });

      await queryInterface.addColumn('Campaigns', 'scheduleType', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'interval',
        comment: 'Type: interval, daily, weekly, custom'
      });

      await queryInterface.addColumn('Campaigns', 'isScheduleActive', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether advanced scheduling is currently active'
      });

      console.log('✅ Advanced scheduling columns added successfully!');
      
    } catch (error) {
      console.log('❌ Error in migration:', error.message);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    console.log('🔄 Removing advanced scheduling columns...');
    
    try {
      await queryInterface.removeColumn('Campaigns', 'scheduledStartDate');
      await queryInterface.removeColumn('Campaigns', 'scheduledEndDate');
      await queryInterface.removeColumn('Campaigns', 'daysOfWeek');
      await queryInterface.removeColumn('Campaigns', 'postingTimes');
      await queryInterface.removeColumn('Campaigns', 'platformSchedules');
      await queryInterface.removeColumn('Campaigns', 'scheduleType');
      await queryInterface.removeColumn('Campaigns', 'isScheduleActive');
      
      console.log('✅ Advanced scheduling columns removed successfully!');
    } catch (error) {
      console.log('❌ Error removing columns:', error.message);
      throw error;
    }
  }
};