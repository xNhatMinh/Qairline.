const { generateToken } = require("../middlewares/auth");
const { Op } = require("sequelize");
const Admin = require("../models/Admin");
const {
  Flight,
  Seat,
  Client,
  Booking,
  Airplane,
} = require("../models/associations");
const { format } = require("date-fns");

const formatDateTime = (dateTime) => {
  return format(new Date(dateTime), "dd/MM/yyyy HH:mm:ss");
};

const formatDateTime1 = (dateTime) => {
  return format(new Date(dateTime), "dd/MM/yyyy");
};

const formatDateTimeWithoutSecond = (dateTime) => {
  return format(new Date(dateTime), "yyyy-MM-dd'T'HH:mm");
};

async function getTopCustomers() {
  try {
    const bookings = await Booking.findAll({
      attributes: ["client_id", "ticket_price", "flight_id"],
      include: [
        {
          model: Client,
          as: "Client",
          attributes: ["fname", "mname", "lname"],
        },
      ],
    });

    // Tính toán tổng giá vé và tổng chuyến bay cho từng khách hàng
    const customerStats = {};

    bookings.forEach((booking) => {
      const clientId = booking.client_id;
      if (!customerStats[clientId]) {
        customerStats[clientId] = {
          clientId: clientId,
          totalPayments: 0.0,
          totalFlights: 0,
          clientName: `${booking.Client.fname} ${booking.Client.mname} ${booking.Client.lname}`,
        };
      }

      customerStats[clientId].totalPayments += parseFloat(booking.ticket_price);
      customerStats[clientId].totalFlights += 1;
    });

    // Chuyển đổi thành mảng để sắp xếp và lấy top 10
    const topCustomers = Object.values(customerStats)
      .sort((a, b) => b.totalPayments - a.totalPayments)
      .slice(0, 10);

    // Biểu diễn thêm 2 số 0 sau dấu thập phân cho tổng chi phí
    topCustomers.forEach((customer) => {
      customer.totalPayments = customer.totalPayments.toFixed(2);
    });

    return topCustomers;
  } catch (err) {
    console.error("Error fetching top customers:", err);
    throw new Error("Error fetching top customers");
  }
}

exports.postLogin = (req, res) => {
  let { username, password } = req.body;

  Admin.findOne({
    where: {
      username: username,
      password: password,
    },
  })
    .then((admin) => {
      if (!admin) {
        console.log("Invalid username or password!");
        res.render("admin/login", { err: "Invalid username or password!" });
      } else {
        const token = generateToken(admin);

        console.log("JWT Token: ", token);
        req.session.admin = admin;

        res.cookie("token", token, { httpOnly: true });

        // Trả về token cho client
        res.redirect("/admin/dashboard");
      }
    })
    .catch((error) => {
      console.error(error);
      res.render("admin/login", { err: error.message });
    });
};

exports.postLogout = (req, res) => {
  req.session.admin = undefined;
  res.render("admin/login", { msg: "Sign out successful!", err: "" });
};

exports.getDashboard = async (req, res) => {
  if (req.session.admin === undefined) {
    return res.render("admin/login", {
      err: "Please login before accessing statistics!",
    });
  }

  try {
    const totalFlights = await Flight.count();
    const percentageFlights = ((totalFlights / 14) * 100).toFixed(0);
    const totalIncome = await Booking.sum("ticket_price");
    const totalClients = await Client.count();

    // Lấy 10 khách hàng có tổng giá vé cao nhất và tổng số chuyến bay đã đặt tương ứng
    const topCustomers = await getTopCustomers(req, res);

    res.render("admin/dashboard", {
      totalFlights,
      percentageFlights,
      totalIncome,
      totalClients,
      topCustomers,
    });
  } catch (error) {
    console.error("Error in getStats:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching statistics." });
  }
};

exports.getCustomers = (req, res) => {
  if (req.session.admin === undefined) {
    return res.render("admin/login", {
      err: "Please login before accessing customers!",
    });
  }

  Client.findAll()
    .then((clients) => {
      const formattedClients = clients.map((client) => {
        return {
          ...client.get({ plain: true }),
          date_of_birth: formatDateTime1(client.date_of_birth),
        };
      });
      res.render("admin/customers", { users: formattedClients });
    })
    .catch((err) => {
      console.error(err);
      res.render("admin/login", { err: "Error retrieving customers!" });
    });
};

// Chỉnh sửa thông tin khách hàng
exports.getEditCustomer = (req, res) => {
  const { client_id } = req.params;

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0"); // Tháng bắt đầu từ 0
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  Client.findByPk(client_id)
    .then((client) => {
      if (!client) {
        return res.status(404).send("Customer not found!");
      }

      const { fname, mname, lname, phone, email, passport, date_of_birth } =
        client;

      res.render("admin/editCustomer", {
        client_id,
        fname,
        mname,
        lname,
        phone,
        email,
        passport,
        date_of_birth,
      });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error retrieving customer.");
    });
};

// Cập nhật thông tin khách hàng
exports.postEditCustomer = (req, res) => {
  const {
    client_id,
    fname,
    mname,
    lname,
    phone,
    email,
    passport,
    date_of_birth,
  } = req.body;

  Client.update(
    { fname, mname, lname, phone, email, passport, date_of_birth },
    { where: { client_id: client_id } }
  )
    .then(() => {
      res.redirect("/admin/customers");
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error updating customer.");
    });
};

// Xóa khách hàng
exports.postDeleteCustomer = (req, res) => {
  const { client_id } = req.params;

  Client.destroy({ where: { client_id: client_id } })
    .then(() => {
      res.redirect("/admin/customers");
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Failed to delete customer.");
    });
};

// Trang chủ (Giới thiệu)
exports.getHomePage = (req, res) => {
  return res.render("../views/common/home.ejs");
};

// Trang đăng nhập
exports.getLogin = (req, res) => {
  res.render("admin/login", { currentTab: "admin/login" });
};

exports.getAirplanes = (req, res) => {
  if (req.session.admin === undefined) {
    return res.render("admin/login", {
      err: "Please login before accessing customers!",
    });
  }

  // Lấy tất cả máy bay cùng với tên Flight mà nó đang được gán trong bảng Flight thông qua flight_id
  Airplane.findAll({
    include: [
      {
        model: Flight,
        as: "Flight",
        attributes: ["flight_name"],
      },
    ],
  })
    .then((airplanes) => {
      res.render("admin/airplanes", { airplanes: airplanes });
    })
    .catch((err) => {
      console.error(err);
      res.render("admin/login", { err: "Error retrieving customers!" });
    });
};

exports.getEditAirplane = (req, res) => {
  const { airplane_id } = req.params;

  Airplane.findByPk(airplane_id)
    .then((airplane) => {
      if (!airplane) {
        return res.status(404).send("Airplane not found!");
      }

      const {
        airplane_name,
        manufacturer,
        jet_engine,
        wheels,
        fuselage,
        wing,
      } = airplane;
      res.render("admin/editAirplane", {
        airplane_id,
        airplane_name,
        manufacturer,
        jet_engine,
        wheels,
        fuselage,
        wing,
      });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error retrieving airplane.");
    });
};

exports.postEditAirplane = (req, res) => {
  const {
    airplane_id,
    airplane_name,
    manufacturer,
    jet_engine,
    wheels,
    fuselage,
    wing,
  } = req.body;

  Airplane.update(
    { airplane_name, manufacturer, jet_engine, wheels, fuselage, wing },
    { where: { airplane_id: airplane_id } }
  )
    .then(() => {
      res.redirect("/admin/airplanes");
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error updating airplane.");
    });
};

exports.postDeleteAirplane = (req, res) => {
  const { airplane_id } = req.params;

  Airplane.destroy({ where: { airplane_id: airplane_id } })
    .then(() => {
      res.redirect("/admin/airplanes");
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Failed to delete airplane.");
    });
};

exports.getAddNewAirplane = (req, res) => {
  res.render("admin/addNewAirplane");
};

exports.postAddNewAirplane = (req, res) => {
  const { airplane_name, manufacturer, jet_engine, wheels, fuselage, wing } =
    req.body;
  Airplane.create({
    airplane_name,
    manufacturer,
    jet_engine,
    wheels,
    fuselage,
    wing,
  })
    .then(() => {
      res.redirect("/admin/airplanes");
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Failed to add airplane.");
    });
};

exports.getFlights = async (req, res) => {
  if (req.session.admin === undefined) {
    return res.render("admin/login", {
      err: "Please login before accessing flights!",
    });
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

    // Định dạng lại dữ liệu giống với getAllFlights
    const formattedFlights = flights.map((flight) => {
      const planeData = flight.Airplane || {};
      return {
        ...flight.get({ plain: true }),
        airplane_name: planeData.airplane_name || "No airplane assigned",
        departure_time: formatDateTime(flight.departure_time),
        arrival_time: formatDateTime(flight.arrival_time),
      };
    });

    res.render("admin/flights", { flights: formattedFlights });
  } catch (error) {
    console.error("Error in getFlights:", error);
    res.render("admin/login", { err: "Error retrieving flights!" });
  }
};

exports.getEditFlight = async (req, res) => {
  const { flight_id } = req.params;

  try {
    // Fetch the flight details along with its associated airplane
    const flight = await Flight.findByPk(flight_id, {
      include: [
        {
          model: Airplane,
          as: "Airplane",
          attributes: ["airplane_id", "airplane_name"],
        },
      ],
    });

    if (!flight) {
      return res.status(404).send("Flight not found!");
    }

    // Fetch all airplanes that are either unassigned or assigned to the current flight
    const airplanes = await Airplane.findAll({
      where: {
        [Op.or]: [{ flight_id: null }, { flight_id: flight_id }],
      },
      attributes: ["airplane_id", "airplane_name", "flight_id"],
    });

    // Format departure and arrival times
    const formattedDepartureTime = formatDateTimeWithoutSecond(
      flight.departure_time
    );
    const formattedArrivalTime = formatDateTimeWithoutSecond(
      flight.arrival_time
    );

    // Render the edit flight page with flight details and airplane list
    res.render("admin/editFlight", {
      flight: {
        ...flight.get(),
        departure_time: formattedDepartureTime,
        arrival_time: formattedArrivalTime,
      },
      airplanes,
    });
  } catch (err) {
    console.error("Error retrieving flight or airplanes:", err);
    res.status(500).send("Error retrieving flight or airplanes.");
  }
};

exports.postEditFlight = async (req, res) => {
  const {
    flight_id,
    flight_name,
    departure_time,
    arrival_time,
    departure_location,
    arrival_location,
    gate,
    total_seats,
    economy_price,
    business_price,
    airplane_name,
  } = req.body;

  const available_seats = total_seats;

  try {
    // Cập nhật thông tin chuyến bay
    await Flight.update(
      {
        flight_name,
        departure_time,
        arrival_time,
        departure_location,
        arrival_location,
        gate,
        total_seats,
        available_seats,
        economy_price,
        business_price,
      },
      { where: { flight_id } }
    );

    // Tìm máy bay hiện đang được gán cho chuyến bay này
    const currentAirplane = await Airplane.findOne({
      where: { flight_id },
    });

    // Nếu có máy bay đang được gán, xóa `flight_id` của nó
    if (currentAirplane) {
      await Airplane.update(
        { flight_id: null },
        { where: { airplane_id: currentAirplane.airplane_id } }
      );
    }

    // Nếu `airplane_name` được cung cấp, gán máy bay mới cho chuyến bay
    if (airplane_name) {
      await Airplane.update({ flight_id }, { where: { airplane_name } });
    }

    res.redirect("/admin/flights");
  } catch (err) {
    console.error("Error updating flight or airplane:", err);
    res.status(500).send("Error updating flight or airplane.");
  }
};

exports.postDeleteFlight = async (req, res) => {
  const { flight_id, airplane_id } = req.params;

  const currentAirplane = await Airplane.findOne({
    where: { flight_id },
  });

  // Nếu có máy bay đang được gán, xóa `flight_id` của nó
  if (currentAirplane) {
    await Airplane.update(
      { flight_id: null },
      { where: { airplane_id: currentAirplane.airplane_id } }
    );
  }

  await Flight.destroy({ where: { flight_id: flight_id } })
    .then(() => {
      res.redirect("/admin/flights");
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Failed to delete flight.");
    });
};

exports.getAddNewFlight = async (req, res) => {
  try {
    // Tìm các Airplane có flight_id = null
    const airplanes = await Airplane.findAll({
      where: { flight_id: { [Op.is]: null } }, // Điều kiện: flight_id = null
      attributes: ["airplane_id", "airplane_name"], // Chỉ lấy các cột cần thiết
    });

    // Render view và truyền danh sách airplanes
    res.render("admin/addNewFlight", { airplanes });
  } catch (error) {
    console.error("Error retrieving airplanes with flight_id = null:", error);
    res.render("admin/addNewFlight", {
      airplanes: [],
      error: "Failed to load airplanes.",
    });
  }
};

exports.postAddNewFlight = (req, res) => {
  const {
    airplane_name,
    flight_name,
    departure_time,
    arrival_time,
    total_seats,
    departure_location,
    arrival_location,
    economy_price,
    business_price,
    gate,
  } = req.body;

  let available_seats = total_seats;

  Flight.create({
    flight_name,
    departure_time,
    arrival_time,
    total_seats,
    available_seats,
    departure_location,
    arrival_location,
    economy_price,
    business_price,
    gate,
  })
    .then((newFlight) => {
      const flight_id = newFlight.flight_id;

      Airplane.update(
        { flight_id: flight_id },
        { where: { airplane_name: airplane_name } }
      );
    })
    .then(() => {
      res.redirect("/admin/flights");
    })
    .catch((err) => {
      console.error("Error adding flight or updating airplane:", err);
      res.status(500).send("Failed to add flight or update airplane.");
    });
};

exports.getBookings = async (req, res) => {
  if (req.session.admin === undefined) {
    return res.render("admin/login", {
      err: "Please login before accessing bookings!",
    });
  }

  try {
    const bookings = await Booking.findAll({
      include: [
        {
          model: Flight,
          as: "Flight",
          attributes: [
            "flight_name",
            "departure_location",
            "departure_time",
            "arrival_location",
            "arrival_time",
          ],
        },
        {
          model: Client,
          as: "Client",
          attributes: ["fname", "mname", "lname"],
        },
        {
          model: Seat,
          as: "Seat",
          attributes: ["seat_number", "seat_class"],
        },
      ],
    });

    const formattedBookings = bookings.map((booking) => {
      const flightData = booking.Flight || {};
      const clientData = booking.Client || {};
      const seatData = booking.Seat || {};

      return {
        ...booking.get({ plain: true }),
        client_name: `${clientData.fname} ${clientData.mname} ${clientData.lname}`,
        flight_name: flightData.flight_name || "No flight assigned",
        departure_location:
          flightData.departure_location || "No flight assigned",
        departure_time: formatDateTime(flightData.departure_time),
        arrival_time: formatDateTime(flightData.arrival_time),
        arrival_location: flightData.arrival_location || "No flight assigned",
        seat_number: seatData.seat_number || "No seat assigned",
        seat_class: seatData.seat_class || "No seat assigned",
      };
    });

    res.render("admin/bookings", { bookings: formattedBookings });
  } catch (error) {
    console.error("Error in getBookings:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching bookings." });
  }
};

exports.getBookingsDetails = async (req, res) => {
  const clientId = req.params.client_id;

  if (!clientId) {
    return res.status(400).json({ error: "Client ID is required" });
  }

  try {
    const bookings = await Booking.findAll({
      where: { client_id: clientId },
      include: [
        {
          model: Flight,
          as: "Flight",
          attributes: [
            "flight_name",
            "departure_location",
            "departure_time",
            "arrival_location",
            "arrival_time",
          ],
        },
        {
          model: Client,
          as: "Client",
          attributes: ["fname", "mname", "lname"],
        },
        {
          model: Seat,
          as: "Seat",
          attributes: ["seat_number", "seat_class"],
        },
      ],
    });

    if (!bookings || bookings.length === 0) {
      return res
        .status(404)
        .json({ message: "No bookings found for this client." });
    }

    const formattedBookings = bookings.map((booking) => {
      const flightData = booking.Flight || {};
      const clientData = booking.Client || {};
      const seatData = booking.Seat || {};

      return {
        ...booking.get({ plain: true }),
        client_name: `${clientData.fname} ${clientData.mname} ${clientData.lname}`,
        flight_name: flightData.flight_name || "No flight assigned",
        departure_location:
          flightData.departure_location || "No flight assigned",
        departure_time: formatDateTime(flightData.departure_time),
        arrival_time: formatDateTime(flightData.arrival_time),
        arrival_location: flightData.arrival_location || "No flight assigned",
        seat_number: seatData.seat_number || "No seat assigned",
        seat_class: seatData.seat_class || "No seat assigned",
      };
    });

    res.render("admin/bookings", { bookings: formattedBookings });
  } catch (error) {
    console.error("Error in getBookingsDetails:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching bookings details." });
  }
};
