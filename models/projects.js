const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('projects', {
    projectId: {
      type: DataTypes.CHAR(20),
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    goal: {
      type: DataTypes.STRING(100),
      allowNull: true
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
    createBy: {
      type: DataTypes.CHAR(20),
      allowNull: false,
      references: {
        model: 'users',
        key: 'userId'
      }
    }
  }, {
    sequelize,
    tableName: 'projects',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "projectId" },
        ]
      },
      {
        name: "projects_ibfk_1",
        using: "BTREE",
        fields: [
          { name: "createBy" },
        ]
      },
    ]
  });
};
