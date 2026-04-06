const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('siteurl', {
    siteId: {
      type: DataTypes.CHAR(20),
      allowNull: false,
      primaryKey: true
    },
    url: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    createAt: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    projectId: {
      type: DataTypes.CHAR(20),
      allowNull: false,
      references: {
        model: 'projects',
        key: 'projectId'
      }
    }
  }, {
    sequelize,
    tableName: 'siteurl',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "siteId" },
        ]
      },
      {
        name: "projectId",
        using: "BTREE",
        fields: [
          { name: "projectId" },
        ]
      },
    ]
  });
};
