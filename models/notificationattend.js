const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('notificationattend', {
    notificationId: {
      type: DataTypes.CHAR(20),
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'notification',
        key: 'notificationId'
      }
    },
    attendId: {
      type: DataTypes.CHAR(20),
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'attend',
        key: 'attendId'
      }
    },
    status: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    sequelize,
    tableName: 'notificationattend',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "notificationId" },
          { name: "attendId" },
        ]
      },
      {
        name: "attendId",
        using: "BTREE",
        fields: [
          { name: "attendId" },
        ]
      },
    ]
  });
};
