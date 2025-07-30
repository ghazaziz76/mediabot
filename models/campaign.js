'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Campaign extends Model {
    static associate(models) {
      // Campaign belongs to a User
      Campaign.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
    }

    // Helper method to get platforms as array
    getPlatformsArray() {
      return this.platforms ? JSON.parse(this.platforms) : [];
    }

    // Helper method to set platforms from array
    setPlatformsArray(platformsArray) {
      this.platforms = JSON.stringify(platformsArray);
    }

    // Helper method to get media URLs as array
    getMediaUrlsArray() {
      return this.mediaUrls ? JSON.parse(this.mediaUrls) : [];
    }

    // Helper method to set media URLs from array
    setMediaUrlsArray(urlsArray) {
      this.mediaUrls = JSON.stringify(urlsArray);
    }

    // Helper method to calculate success rate
    getSuccessRate() {
      if (this.totalPosts === 0) return 0;
      return Math.round((this.successfulPosts / this.totalPosts) * 100);
    }

    // Helper method to get status
    getStatus() {
      if (!this.isActive) return 'Paused';
      if (this.nextPostAt && new Date() > this.nextPostAt) return 'Ready to Post';
      return 'Running';
    }
  }
  Campaign.init({
    name: DataTypes.STRING,
    content: DataTypes.TEXT,
    mediaUrls: DataTypes.TEXT,
    platforms: DataTypes.TEXT,
    intervalMinutes: DataTypes.INTEGER,
    status: DataTypes.STRING,
    totalPosts: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    successfulPosts: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    lastPostedAt: DataTypes.DATE,
    nextPostAt: DataTypes.DATE,
    
    // NEW ADVANCED SCHEDULING FIELDS
    scheduledStartDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the campaign should start posting'
    },
    scheduledEndDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the campaign should stop posting'
    },
    daysOfWeek: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '1,2,3,4,5,6,7',
      comment: 'Which days of week to post (1=Mon, 7=Sun)'
    },
    postingTimes: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: '["09:00"]',
      comment: 'Times to post each day (JSON array)'
    },
    platformSchedules: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Different schedules for different platforms (JSON)'
    },
    scheduleType: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'interval',
      comment: 'interval, daily, weekly, custom'
    },
    isScheduleActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'Campaign',
  });
    return Campaign;
};

