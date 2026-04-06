const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('tasks', {
    taskId: {
      type: DataTypes.CHAR(20),
      allowNull: false,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('Chưa bắt đầu','Đang thực hiện','Tạm hoãn','Hoàn thành','Trễ tiến độ','Đã hủy','Chờ xét duyệt'),
      allowNull: false
    },
    workflowId: {
      type: DataTypes.CHAR(20),
      allowNull: false,
      references: {
        model: 'workflows',
        key: 'workflowId'
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
    tableName: 'tasks',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "taskId" },
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
        name: "tasks_ibfk_1",
        using: "BTREE",
        fields: [
          { name: "createBy" },
        ]
      },
    ]
  });
};
