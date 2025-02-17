const { DataTypes } = require("sequelize");
const sequelize = require("./db");

//bảng airplane gồm có airplane_id, flight_id (khóa ngoại), airplane_name, manufacturer, jet_engine, wheels, fuselage, wing
const Airplane = sequelize.define(
  "airplanes",
  {
    airplane_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    flight_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    airplane_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    manufacturer: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    jet_engine: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    wheels: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    fuselage: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    wing: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: false,
  }
);

module.exports = Airplane;
