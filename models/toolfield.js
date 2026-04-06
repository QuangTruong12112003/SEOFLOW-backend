const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('toolfield', {
    id: {
      type: DataTypes.STRING(20),
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    idfield: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    hint: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    toolId: {
      type: DataTypes.CHAR(30),
      allowNull: false,
      references: {
        model: 'tool',
        key: 'id'
      }
    },
    fieldId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'field',
        key: 'id'
      }
    },
    options: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'toolfield',
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
        name: "idfield",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "idfield" },
          { name: "toolId" },
        ]
      },
      {
        name: "fieldId",
        using: "BTREE",
        fields: [
          { name: "fieldId" },
        ]
      },
      {
        name: "toolfield_ibfk_2",
        using: "BTREE",
        fields: [
          { name: "toolId" },
        ]
      },
    ]
  });
};
