const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('reports', {
    reportId: {
      type: DataTypes.CHAR(20),
      allowNull: false,
      primaryKey: true
    },
    reportUrl: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    visibility: {
      type: DataTypes.ENUM('public','private'),
      allowNull: false,
      defaultValue: "private"
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    objectId: {
      type: DataTypes.ENUM('project','workflow','task'),
      allowNull: false
    },
    projectId: {
      type: DataTypes.CHAR(20),
      allowNull: true,
      references: {
        model: 'projects',
        key: 'projectId'
      }
    },
    workflowId: {
      type: DataTypes.CHAR(20),
      allowNull: true,
      references: {
        model: 'workflows',
        key: 'workflowId'
      }
    },
    taskId: {
      type: DataTypes.CHAR(20),
      allowNull: true,
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
    tableName: 'reports',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "reportId" },
        ]
      },
      {
        name: "projectId",
        using: "BTREE",
        fields: [
          { name: "projectId" },
        ]
      },
      {
        name: "workflowId",
        using: "BTREE",
        fields: [
          { name: "workflowId" },
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
        name: "reports_ibfk_4",
        using: "BTREE",
        fields: [
          { name: "createBy" },
        ]
      },
    ]
  });
};
