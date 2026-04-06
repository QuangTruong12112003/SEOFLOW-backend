const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('seo', 'root', '', {
    host : 'localhost',
    dialect : 'mysql',
    port : 3306,
    logging : false,
    timezone: '+07:00',
});

module.exports = sequelize;