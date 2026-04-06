const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('users', {
    userId: {
      type: DataTypes.CHAR(20),
      allowNull: false,
      primaryKey: true
    },
    fullname: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    phone: {
      type: DataTypes.CHAR(11),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: "email"
    },
    password: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    birthday: {
      type: DataTypes.DATE,
      allowNull: true
    },
    imgUrl: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    status: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 0
    },
    roleType: {
      type: DataTypes.ENUM('user','Admin System'),
      allowNull: false,
      defaultValue: "user"
    },
    refreshtoken: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    craeteAt: {
      type: DataTypes.DATEONLY,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'users',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "userId" },
        ]
      },
      {
        name: "email",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "email" },
        ]
      },
    ]
  });
};
