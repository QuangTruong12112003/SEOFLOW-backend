const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('attend', {
    attendId: {
      type: DataTypes.CHAR(20),
      allowNull: false,
      primaryKey: true
    },
    attendAt: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    roleId: {
      type: DataTypes.CHAR(20),
      allowNull: false,
      references: {
        model: 'roles',
        key: 'roelId'
      }
    },
    projectId: {
      type: DataTypes.CHAR(20),
      allowNull: false,
      references: {
        model: 'projects',
        key: 'projectId'
      }
    },
    userId: {
      type: DataTypes.CHAR(20),
      allowNull: false,
      references: {
        model: 'users',
        key: 'userId'
      }
    }
  }, {
    sequelize,
    tableName: 'attend',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "attendId" },
        ]
      },
      {
        name: "projectId",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "projectId" },
          { name: "userId" },
        ]
      },
      {
        name: "roleId",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "roleId" },
          { name: "projectId" },
          { name: "userId" },
        ]
      },
      {
        name: "userId",
        using: "BTREE",
        fields: [
          { name: "userId" },
        ]
      },
    ]
  });
};
