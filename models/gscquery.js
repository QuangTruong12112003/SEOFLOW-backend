const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('gscquery', {
    id: {
      type: DataTypes.CHAR(20),
      allowNull: false,
      primaryKey: true
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    query: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    clicks: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    impressions: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    ctr: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    position: {
      type: DataTypes.FLOAT,
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
    tableName: 'gscquery',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "date",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "date" },
          { name: "query" },
          { name: "siteId" },
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
