const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('notification', {
    notificationId: {
      type: DataTypes.CHAR(20),
      allowNull: false,
      primaryKey: true
    },
    createAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    projectId: {
      type: DataTypes.CHAR(20),
      allowNull: false,
      references: {
        model: 'projects',
        key: 'projectId'
      }
    },
    createBy: {
      type: DataTypes.CHAR(20),
      allowNull: true,
      references: {
        model: 'attend',
        key: 'attendId'
      }
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'notification',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "notificationId" },
        ]
      },
      {
        name: "createBy",
        using: "BTREE",
        fields: [
          { name: "createBy" },
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
