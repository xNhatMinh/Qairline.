const { DataTypes } = require("sequelize");
const sequelize = require("./db");

const Admin = sequelize.define(
  "admins",
  {
    admin_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "password123", // Giá trị mặc định là "password123"
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "admin", // Giá trị mặc định là "admin
    },
  },
  {
    timestamps: false, // Nếu không cần cột `createdAt` và `updatedAt`
  }
);

module.exports = Admin;
