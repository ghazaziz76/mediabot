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
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    mediaUrls: {
      type: DataTypes.TEXT
    },
    platforms: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    intervalMinutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 360
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    lastPostedAt: {
      type: DataTypes.DATE
    },
    nextPostAt: {
      type: DataTypes.DATE
    },
    totalPosts: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    successfulPosts: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'Campaign',
  });
  return Campaign;
};