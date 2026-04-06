const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('toolattend', {
    toolId: {
      type: DataTypes.CHAR(30),
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'tool',
        key: 'id'
      }
    },
    attendId: {
      type: DataTypes.CHAR(30),
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'attend',
        key: 'attendId'
      }
    }
  }, {
    sequelize,
    tableName: 'toolattend',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "toolId" },
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
