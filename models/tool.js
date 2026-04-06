const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('tool', {
    id: {
      type: DataTypes.CHAR(30),
      allowNull: false,
      primaryKey: true
    },
    label: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    prompt: {
      type: DataTypes.TEXT,
      allowNull: false
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
    tableName: 'tool',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "id" },
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
