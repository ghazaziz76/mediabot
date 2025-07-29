'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class HashtagGroup extends Model {
    static associate(models) {
      // HashtagGroup belongs to a user
      HashtagGroup.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
    }
  }
  HashtagGroup.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    hashtags: {
      type: DataTypes.TEXT, // JSON string of hashtag array
      allowNull: false
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'general'
    },
    platforms: {
      type: DataTypes.TEXT, // JSON string of recommended platforms
      allowNull: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    platform: {
      type: DataTypes.STRING,
      defaultValue: 'all'
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    usageCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    color: {
      type: DataTypes.STRING,
      defaultValue: '#4F46E5'
    }
  }, {
    sequelize,
    modelName: 'HashtagGroup',
  });
  return HashtagGroup;
};