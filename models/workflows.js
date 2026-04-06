const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('workflows', {
    workflowId: {
      type: DataTypes.CHAR(20),
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    createAt: {
      type: DataTypes.DATE,
      allowNull: false
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
      type: DataTypes.ENUM('Chưa bắt đầu','Đang thực hiện','Tạm hoãn','Hoàn thành','Trễ tiến độ','Đã hủy'),
      allowNull: false
    },
    progress: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0
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
    tableName: 'workflows',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "workflowId" },
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
