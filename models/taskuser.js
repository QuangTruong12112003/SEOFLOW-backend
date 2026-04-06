const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('taskuser', {
    taskId: {
      type: DataTypes.CHAR(20),
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'tasks',
        key: 'taskId'
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
    assignedDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    timeSuccess: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'taskuser',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "taskId" },
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
