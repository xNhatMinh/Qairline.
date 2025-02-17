const { DataTypes } = require("sequelize");
const sequelize = require("./db");

const Booking = sequelize.define(
  "bookings",
  {
    booking_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    flight_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    seat_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    ticket_type: {
      type: DataTypes.ENUM("Economy", "Business"),
      allowNull: false,
      defaultValue: "Economy", // Giá trị mặc định là 'economy'
    },
    ticket_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 50.0,
    },
  },
  {
    timestamps: false, // Đảm bảo tính năng này được bật nếu bạn muốn sử dụng createdAt và updatedAt
  }
);

module.exports = Booking;
