const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('permissions', {
    permissionId: {
      type: DataTypes.CHAR(20),
      allowNull: false,
      primaryKey: true
    },
    actionname: {
      type: DataTypes.STRING(30),
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'permissions',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "permissionId" },
        ]
      },
    ]
  });
};
