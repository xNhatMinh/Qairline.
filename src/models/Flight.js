const { DataTypes } = require("sequelize");
const sequelize = require("./db");

// Tên model: Seat (thể hiện 1 hàng trong bảng seats).
// Mỗi hàng trong bảng seats
const Flight = sequelize.define(
  "flights",
  {
    flight_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    flight_name: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "Unknown Flight",
    },
    departure_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    arrival_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    total_seats: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    available_seats: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    departure_location: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    arrival_location: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    economy_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 50.0, // Giá trị mặc định giá vé hạng phổ thông là 100.00
    },
    business_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 200.0, // Giá trị mặc định giá vé hạng thương gia là 300.00
    },
    gate: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "A1", // Giá trị mặc định là cổng 1A
    },
  },
  {
    timestamps: false, // Đảm bảo tính năng này được bật nếu bạn muốn sử dụng createdAt và updatedAt
  }
);

module.exports = Flight;
