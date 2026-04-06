const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('roleprojectpermission', {
    permissionId: {
      type: DataTypes.CHAR(20),
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'permissions',
        key: 'permissionId'
      }
    },
    projectId: {
      type: DataTypes.CHAR(20),
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'projects',
        key: 'projectId'
      }
    },
    roleId: {
      type: DataTypes.CHAR(20),
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'roles',
        key: 'roelId'
      }
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'roleprojectpermission',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "permissionId" },
          { name: "projectId" },
          { name: "roleId" },
        ]
      },
      {
        name: "roleId",
        using: "BTREE",
        fields: [
          { name: "roleId" },
        ]
      },
      {
        name: "roleprojectpermission_ibfk_2",
        using: "BTREE",
        fields: [
          { name: "projectId" },
        ]
      },
    ]
  });
};
