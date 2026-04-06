const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('queryfollow', {
    queryId: {
      type: DataTypes.CHAR(20),
      allowNull: false,
      primaryKey: true
    },
    query: {
      type: DataTypes.STRING(200),
      allowNull: false,
      unique: "query"
    },
    type: {
      type: DataTypes.ENUM('query','page'),
      allowNull: false
    },
    createAt: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    siteId: {
      type: DataTypes.CHAR(20),
      allowNull: false,
      references: {
        model: 'siteurl',
        key: 'siteId'
      }
    }
  }, {
    sequelize,
    tableName: 'queryfollow',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "queryId" },
        ]
      },
      {
        name: "query",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "query" },
        ]
      },
      {
        name: "siteId",
        using: "BTREE",
        fields: [
          { name: "siteId" },
        ]
      },
    ]
  });
};
