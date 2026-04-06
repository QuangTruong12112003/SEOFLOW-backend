const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('comments', {
    commentId: {
      type: DataTypes.CHAR(20),
      allowNull: false,
      primaryKey: true
    },
    content: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    fileUrl: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    createAt: {
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
    tableName: 'comments',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "commentId" },
        ]
      },
      {
        name: "comments_ibfk_2",
        using: "BTREE",
        fields: [
          { name: "createBy" },
        ]
      },
      {
        name: "comments_ibfk_1",
        using: "BTREE",
        fields: [
          { name: "taskId" },
        ]
      },
    ]
  });
};
