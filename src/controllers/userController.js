const { generateToken } = require("../middlewares/auth");
const sequelize = require("../models/db");
const { format } = require("date-fns");
const {
  Flight,
  Seat,
  Client,
  Booking,
  Airplane,
} = require("../models/associations");

const formatDateTime = (dateTime) => {
  return format(new Date(dateTime), "dd/MM/yyyy HH:mm:ss");
};

exports.getHomePage = (req, res) => {
  res.render("common/home");
};

exports.getUserHomepage = (req, res) => {
  if (!req.session.user) {
    res.render("user/login");
  } else {
    res.render("user/userHomepage", {
      fname: req.session.fname,
      mname: req.session.mname,
      lname: req.session.lname,
      phone: req.session.phone,
      email: req.session.email,
      passport: req.session.passport,
    });
  }
};

exports.getLogin = (req, res) => {
  if (req.session.user) {
    res.redirect("/userHomepage");
  } else {
    res.render("user/login");
  }
};

exports.postLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    const client = await Client.findOne({
      where: {
        [sequelize.Sequelize.Op.or]: [{ email: username }, { phone: username }],
        password,
      },
    });

    if (!client) {
      return res.render("user/login", {
        msg: "",
        err: "Invalid username or password!",
      });
    }

    const token = generateToken(client);
    res.cookie("token", token, { httpOnly: true });

    req.session.user = client.client_id;
    req.session.fname = client.fname;
    req.session.mname = client.mname;
    req.session.lname = client.lname;
    req.session.date_of_birth = client.date_of_birth;
    req.session.phone = client.phone;
    req.session.email = client.email;
    req.session.passport = client.passport;
    req.session.password = client.password;

    res.redirect("/userHomepage");
  } catch (error) {
    console.error("Error in postLogin:", error);
    res.render("user/login", { msg: "", err: "An error occurred." });
  }
};

exports.getSignUp = (req, res) => {
  if (req.session.user) {
    res.redirect("/userHomepage");
  } else {
    res.render("user/signup");
  }
};

exports.postLogout = (req, res) => {
  req.session.user = undefined;
  res.render("common/home", { msg: "Sign out successful!", err: "" });
};

exports.getAllFlights = async (req, res) => {
  if (!req.session.user) {
    return res.render("user/login");
  }

  try {
    const flights = await Flight.findAll({
      include: [
        {
          model: Airplane,
          as: "Airplane",
          attributes: ["airplane_name"],
        },
      ],
    });

    const formattedFlights = flights.map((flight) => {
      const planeData = flight.Airplane || {};
      return {
        ...flight.get({ plain: true }),
        airplane_name: planeData.airplane_name || "No airplane assigned",
        departure_time: formatDateTime(flight.departure_time),
        arrival_time: formatDateTime(flight.arrival_time),
      };
    });

    res.render("user/allFlights", { flights: formattedFlights });
  } catch (error) {
    console.error("Error in getAllFlights:", error);
    res.render("user/login", {
      err: "Please login before viewing flights!",
    });
  }
};

exports.postSignUp = async (req, res) => {
  try {
    const {
      firstname,
      midname,
      lastname,
      date_of_birth,
      password,
      confirmPassword,
      email,
      phone,
      passport,
    } = req.body;

    if (password !== confirmPassword) {
      return res.render("user/signup", {
        msg: "Passwords do not match",
        err: "",
      });
    }

    const existingClient = await Client.findOne({ where: { email } });

    if (existingClient) {
      return res.render("user/signup", {
        msg: "",
        err: "Email already exists",
      });
    }

    await Client.create({
      fname: firstname,
      mname: midname,
      lname: lastname,
      date_of_birth,
      password,
      email,
      phone,
      passport,
    });

    res.render("user/login", {
      msg: "User registered successfully",
    });
  } catch (error) {
    console.error("Error in postSignUp:", error);
    res.render("user/signup", { msg: "", err: "An error occurred." });
  }
};

exports.postSearchFlights = async (req, res) => {
  if (!req.session.user) {
    return res.render("user/login");
  }

  try {
    const { departure_location, departure_time, arrival_location } = req.body;

    const flights = await Flight.findAll({
      where: {
        departure_location,
        arrival_location,
        departure_time: sequelize.where(
          sequelize.fn("DATE", sequelize.col("departure_time")),
          departure_time
        ),
      },
      include: [
        {
          model: Airplane,
          as: "Airplane", // Make sure the alias is correctly specified as it is in your model association
          attributes: ["airplane_name"],
        },
      ],
    });

    const formattedFlights = flights.map((flight) => {
      const planeData = flight.Airplane || {};
      return {
        ...flight.get({ plain: true }), // Ensuring data is extracted in a plain format to simplify access
        airplane_name: planeData.airplane_name || "No airplane assigned",
        departure_time: formatDateTime(flight.departure_time),
        arrival_time: formatDateTime(flight.arrival_time),
      };
    });

    res.render("user/allFlights", { flights: formattedFlights });
  } catch (error) {
    console.error("Error in postSearchFlights:", error);
    res.json({
      err: "An error occurred while searching for flights.",
    });
  }
};

/*Sau khi nhấn Book Now sẽ trả dữ liệu gồm Flight_number, gate, departure_location, departure_time, arrival_location, arrival_time, economy_price, business_price*/
exports.getBookFlight = async (req, res) => {
  if (!req.session.user) {
    return res.render("user/login");
  }
  try {
    const flight_id = req.query.flight_id;

    const flight = await Flight.findByPk(flight_id, {
      include: [
        {
          model: Seat,
          as: "Seats",
          where: { flight_id: flight_id }, // Lấy ghế theo chuyến bay
        },
      ],
    });
    console.log(flight);

    if (!flight) {
      return res.render("user/login", {
        err: "Flight not found",
      });
    }

    const formattedFlight = {
      ...flight.get(),
      departure_time: formatDateTime(flight.departure_time),
      arrival_time: formatDateTime(flight.arrival_time),
    };

    const seats = flight.Seats.map((seat_number) => seat_number.get());

    res.render("user/bookFlight", { flight: formattedFlight, seats });
    console.log(formattedFlight);
    console.log("Seats:", seats);
    console.log(req.session.user);
  } catch (error) {
    console.error("Error in getBookFlight:", error);
    res.render("user/login", {
      err: "An error occurred while booking the flight.",
    });
  }
};

exports.postBookFlight = async (req, res) => {
  if (!req.session.user) {
    return res.render("user/login");
  }

  const { flight_id, seat_id } = req.body;

  try {
    const client_id = req.session.user;

    if (!client_id || !flight_id || !seat_id) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const seat = await Seat.findOne({
      where: { seat_id, flight_id },
      include: {
        model: Flight,
        as: "Flight",
        attributes: ["economy_price", "business_price", "available_seats"],
      },
    });

    if (!seat || !seat.Flight) {
      return res.status(404).json({
        message: "Seat not found or flight information is missing.",
      });
    }

    // Kiểm tra xem chuyến bay còn ghế trống không
    if (seat.Flight.available_seats <= 0) {
      return res.status(400).json({ message: "No seats available." });
    }

    // Xác định loại ghế và giá vé
    const ticket_type = seat.seat_class;
    const ticket_price =
      ticket_type === "Business"
        ? seat.Flight.business_price
        : seat.Flight.economy_price;

    // Tạo bản ghi booking
    const newBooking = await Booking.create({
      flight_id,
      seat_id,
      client_id,
      ticket_type,
      ticket_price,
    });

    // Cập nhật trạng thái ghế (is_booked)
    await Seat.update({ is_booked: 1 }, { where: { seat_id } });

    // Cập nhật số lượng ghế còn lại trong chuyến bay
    await Flight.update(
      { available_seats: seat.Flight.available_seats - 1 },
      { where: { flight_id } }
    );

    console.log("New booking created:", newBooking);
    res.status(201).redirect("/yourFlights");
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getYourFlights = async (req, res) => {
  if (!req.session.user) {
    return res.render("user/login");
  }

  try {
    const client_id = req.session.user;

    const bookings = await Booking.findAll({
      where: { client_id },
      include: [
        {
          model: Flight,
          as: "Flight",
          include: [
            {
              model: Airplane,
              as: "Airplane", // Liên kết bảng Airplane
            },
          ],
        },
        {
          model: Seat,
          as: "Seat",
        },
      ],
    });

    const formattedBookings = bookings.map((booking) => ({
      ...booking.get(),
      departure_time: formatDateTime(booking.Flight.departure_time),
      arrival_time: formatDateTime(booking.Flight.arrival_time),
    }));

    res.render("user/yourFlights", {
      bookings: formattedBookings,
    });
  } catch (error) {
    console.error("Error in getYourFlights:", error);
    res.render("user/login", {
      err: "An error occurred while fetching your bookings.",
    });
  }
};

exports.getViewTickets = async (req, res) => {
  if (!req.session.user) {
    return res.render("user/login");
  }

  try {
    const client_id = req.session.user;

    const tickets = await Booking.findAll({
      where: { client_id },
      include: [
        {
          model: Flight,
          as: "Flight",
        },
        {
          model: Seat,
          as: "Seat",
        },
        {
          model: Client,
          as: "Client",
        },
      ],
    });

    const formattedTickets = tickets.map((booking) => {
      return {
        ...booking.get(),
        departure_time: formatDateTime(booking.Flight.departure_time),
        arrival_time: formatDateTime(booking.Flight.arrival_time),
      };
    });

    res.render("user/viewTickets", {
      tickets: formattedTickets,
    });
  } catch (error) {
    console.error("Error in getYourTickets:", error);
    res.render("user/login", {
      err: "An error occurred while fetching your tickets.",
    });
  }
};

// exports.postCancelTicket = async (req, res) => {
//   if (!req.session.user) {
//     return res.render("user/login");
//   }

//   const { booking_id } = req.body;

//   try {
//     const booking = await Booking.findByPk(booking_id);

//     if (!booking) {
//       return res.status(404).json({ message: "Booking not found." });
//     }

//     await booking.destroy();

//     // Cập nhật trạng thái ghế (is_booked)
//     await Seat.update(
//       { is_booked: 0 },
//       { where: { seat_id: booking.seat_id } }
//     );

//     res.status(204).redirect("/yourTickets");
//   } catch (error) {
//     console.error("Error in cancelTicket:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

exports.postCancelTicket = async (req, res) => {
  if (!req.session.user) {
    return res.render("user/login");
  }

  const { booking_id } = req.body;

  try {
    const booking = await Booking.findByPk(booking_id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    // Lấy thông tin chuyến bay để cập nhật số lượng ghế còn lại
    const flight = await Flight.findByPk(booking.flight_id);

    if (!flight) {
      return res.status(404).json({ message: "Flight not found." });
    }

    // Huỷ booking
    await booking.destroy();

    // Cập nhật trạng thái ghế (is_booked)
    await Seat.update(
      { is_booked: 0 },
      { where: { seat_id: booking.seat_id } }
    );

    // Cập nhật số lượng ghế còn lại trong chuyến bay
    await Flight.update(
      { available_seats: flight.available_seats + 1 },
      { where: { flight_id: booking.flight_id } }
    );

    res.status(204).redirect("/yourTickets");
  } catch (error) {
    console.error("Error in cancelTicket:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getProfile = (req, res) => {
  if (!req.session.user) {
    return res.render("user/login");
  }

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0"); // Tháng bắt đầu từ 0
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const dateOfBirthFormatted = formatDate(req.session.date_of_birth);

  res.render("user/profile", {
    fname: req.session.fname,
    mname: req.session.mname,
    lname: req.session.lname,
    date_of_birth: dateOfBirthFormatted,
    phone: req.session.phone,
    email: req.session.email,
    passport: req.session.passport,
    password: req.session.password,
  });
};

exports.getEditProfile = (req, res) => {
  if (!req.session.user) {
    return res.render("user/login");
  }

  res.render("user/editProfile", {
    fname: req.session.fname,
    mname: req.session.mname,
    lname: req.session.lname,
    date_of_birth: req.session.date_of_birth,
    phone: req.session.phone,
    email: req.session.email,
    passport: req.session.passport,
    password: req.session.password,
  });
};

exports.postEditProfile = async (req, res) => {
  if (!req.session.user) {
    return res.render("user/login");
  }

  const {
    fname,
    mname,
    lname,
    date_of_birth,
    email,
    phone,
    passport,
    password,
  } = req.body;

  try {
    const client = await Client.findByPk(req.session.user);

    if (!client) {
      return res.status(404).json({ message: "Client not found." });
    }

    client.fname = fname;
    client.mname = mname;
    client.lname = lname;
    client.date_of_birth = date_of_birth;
    client.phone = phone;
    client.email = email;
    client.passport = passport;
    client.password = password;

    await client.save();

    req.session.fname = fname;
    req.session.mname = mname;
    req.session.lname = lname;
    req.session.date_of_birth = date_of_birth;
    req.session.phone = phone;
    req.session.email = email;
    req.session.passport = passport;
    req.session.password = password;

    res.status(204).redirect("/profile");
  } catch (error) {
    console.error("Error in postEditProfile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
