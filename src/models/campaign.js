'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Campaign extends Model {
    /**
     * Helper method for defining associations.
     */
    static associate(models) {
      // Campaign belongs to a User
      Campaign.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
    }

    // Custom method to get platforms as array
    getPlatformsArray() {
      try {
        return this.platforms ? JSON.parse(this.platforms) : [];
      } catch (error) {
        return [];
      }
    }

    // Custom method to get campaign status
    getStatus() {
      if (this.isActive) {
        return 'Running';
      } else if (this.totalPosts > 0) {
        return 'Stopped';
      } else {
        return 'Draft';
      }
    }

    // Custom method to calculate success rate
    getSuccessRate() {
      if (this.totalPosts === 0) {
        return 0;
      }
      return Math.round((this.successfulPosts / this.totalPosts) * 100);
    }

    // Get next post time formatted
    getNextPostTime() {
      if (!this.nextPostAt) {
        return null;
      }
      return this.nextPostAt.toLocaleString();
    }
  }

  Campaign.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    mediaUrls: {
      type: DataTypes.TEXT, // JSON string of media URLs
      allowNull: true
    },
    platforms: {
      type: DataTypes.TEXT, // JSON string of selected platforms
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    intervalMinutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 360, // Default 6 hours
      validate: {
        min: 60, // Minimum 1 hour
        max: 10080 // Maximum 1 week
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    totalPosts: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    successfulPosts: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    lastPostedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    nextPostAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    stoppedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Campaign',
    tableName: 'campaigns',
    timestamps: true
  });

  // Add the isReadyToPost method using prototype to ensure it's available
  Campaign.prototype.isReadyToPost = function() {
    if (!this.isActive) {
      return false;
    }
    if (!this.nextPostAt) {
      return true; // First post
    }
    return new Date() >= this.nextPostAt;
  };

  return Campaign;
};