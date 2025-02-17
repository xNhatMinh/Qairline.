const Flight = require("./Flight");
const Seat = require("./Seat");
const Client = require("./Client");
const Booking = require("./Booking");
const Airplane = require("./Airplane");

// Flight and Seat
Flight.hasMany(Seat, { foreignKey: "flight_id", as: "Seats" });
Seat.belongsTo(Flight, { foreignKey: "flight_id", as: "Flight" });

// Booking and Client - Seat - Flight
Booking.belongsTo(Client, { foreignKey: "client_id", as: "Client" });
Booking.belongsTo(Seat, { foreignKey: "seat_id", as: "Seat" });
Booking.belongsTo(Flight, { foreignKey: "flight_id", as: "Flight" });
Flight.hasMany(Booking, { foreignKey: "flight_id", as: "Bookings" });
Client.hasMany(Booking, { foreignKey: "client_id", as: "Bookings" });
Seat.hasMany(Booking, { foreignKey: "seat_id", as: "Bookings" });

// Airplane and Flight 1-1
Airplane.belongsTo(Flight, { foreignKey: "flight_id", as: "Flight" });
Flight.hasOne(Airplane, { foreignKey: "flight_id", as: "Airplane" });

module.exports = { Flight, Seat, Client, Booking, Airplane };
