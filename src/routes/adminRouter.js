const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");
const adminController = require("../controllers/adminController");

router
  .route("/login")
  .get(adminController.getLogin)
  .post(adminController.postLogin);

router.get("/", adminController.getLogin);

router
  .route("/dashboard")
  .get(verifyToken, authorize(["admin"]), adminController.getDashboard);

router
  .route("/customers")
  .get(verifyToken, authorize(["admin"]), adminController.getCustomers);

router
  .route("/customers/editCustomer/:client_id/")
  .get(verifyToken, authorize(["admin"]), adminController.getEditCustomer)
  .post(verifyToken, authorize(["admin"]), adminController.postEditCustomer);

router
  .route("/deletecustomer/:client_id/")
  .post(verifyToken, authorize(["admin"]), adminController.postDeleteCustomer);

router
  .route("/logout")
  .post(verifyToken, authorize(["admin"]), adminController.postLogout);

router
  .route("/airplanes")
  .get(verifyToken, authorize(["admin"]), adminController.getAirplanes);

router
  .route("/airplanes/editAirplane/:airplane_id/")
  .get(verifyToken, authorize(["admin"]), adminController.getEditAirplane)
  .post(verifyToken, authorize(["admin"]), adminController.postEditAirplane);

router
  .route("/deleteairplane/:airplane_id/")
  .post(verifyToken, authorize(["admin"]), adminController.postDeleteAirplane);

router
  .route("/airplanes/addNewAirplane")
  .get(verifyToken, authorize(["admin"]), adminController.getAddNewAirplane)
  .post(verifyToken, authorize(["admin"]), adminController.postAddNewAirplane);

router
  .route("/flights")
  .get(verifyToken, authorize(["admin"]), adminController.getFlights);

router
  .route("/flights/editFlight/:flight_id/")
  .get(verifyToken, authorize(["admin"]), adminController.getEditFlight)
  .post(verifyToken, authorize(["admin"]), adminController.postEditFlight);

router
  .route("/deleteflight/:flight_id/")
  .post(verifyToken, authorize(["admin"]), adminController.postDeleteFlight);

router
  .route("/flights/addNewFlight")
  .get(verifyToken, authorize(["admin"]), adminController.getAddNewFlight)
  .post(verifyToken, authorize(["admin"]), adminController.postAddNewFlight);

router
  .route("/bookings")
  .get(verifyToken, authorize(["admin"]), adminController.getBookings);

router
  .route("/bookings/:client_id/")
  .get(verifyToken, authorize(["admin"]), adminController.getBookingsDetails);

module.exports = router;
