const { DataTypes } = require("sequelize");
const sequelize = require("./db");

const Seat = sequelize.define(
  "seats",
  {
    seat_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    seat_number: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    is_booked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false, // Giá trị mặc định là chưa đặt ghế (false)
    },
    seat_class: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: false, // Đảm bảo tính năng này được bật nếu bạn muốn sử dụng createdAt và updatedAt
  }
);

module.exports = Seat;
