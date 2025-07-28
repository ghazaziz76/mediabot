const config = require(__dirname + '/../config/database.js')[env];

module.exports = {
  development: {
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE || './database.sqlite',
    logging: console.log
  },
  production: {
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE || './database.sqlite',
    logging: false
  }
};