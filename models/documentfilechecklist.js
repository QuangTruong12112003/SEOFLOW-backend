const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('documentfilechecklist', {
    fileId: {
      type: DataTypes.CHAR(20),
      allowNull: false,
      primaryKey: true
    },
    fileUrl: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    uploadAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    taskId: {
      type: DataTypes.CHAR(20),
      allowNull: false,
      references: {
        model: 'tasks',
        key: 'taskId'
      }
    },
    createBy: {
      type: DataTypes.CHAR(20),
      allowNull: false,
      references: {
        model: 'attend',
        key: 'attendId'
      }
    }
  }, {
    sequelize,
    tableName: 'documentfilechecklist',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "fileId" },
        ]
      },
      {
        name: "taskId",
        using: "BTREE",
        fields: [
          { name: "taskId" },
        ]
      },
      {
        name: "documentfilechecklist_ibfk_2",
        using: "BTREE",
        fields: [
          { name: "createBy" },
        ]
      },
    ]
  });
};
