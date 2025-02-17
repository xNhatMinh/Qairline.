const express = require("express");
const router = express.Router();
const authorize = require("../middlewares/authorize");
const { verifyToken } = require("../middlewares/auth");
const userController = require("../controllers/userController");

router
  .route("/login")
  .get(userController.getLogin)
  .post(userController.postLogin);

router.route("/").get(userController.getHomePage);

router
  .route("/userHomepage")
  .get(
    verifyToken,
    authorize(["admin", "user"]),
    userController.getUserHomepage
  );

router
  .route("/allFlights")
  .get(verifyToken, authorize(["admin", "user"]), userController.getAllFlights);

router
  .route("/logout")
  .post(verifyToken, authorize(["admin", "user"]), userController.postLogout);

router
  .route("/signup")
  .get(userController.getSignUp)
  .post(userController.postSignUp);

// router to search flights
router
  .route("/searchFlight")
  .post(
    verifyToken,
    authorize(["admin", "user"]),
    userController.postSearchFlights
  );

// router to book flights
router
  .route("/bookFlight")
  .get(verifyToken, authorize(["admin", "user"]), userController.getBookFlight)
  .post(
    verifyToken,
    authorize(["admin", "user"]),
    userController.postBookFlight
  );

router
  .route("/yourFlights")
  .get(
    verifyToken,
    authorize(["admin", "user"]),
    userController.getYourFlights
  );

router
  .route("/yourTickets")
  .get(verifyToken, authorize(["admin", "user"]), userController.getViewTickets)
  .post(
    verifyToken,
    authorize(["admin", "user"]),
    userController.postCancelTicket
  );

router
  .route("/profile")
  .get(verifyToken, authorize(["admin", "user"]), userController.getProfile);

router
  .route("/editProfile")
  .get(verifyToken, authorize(["admin", "user"]), userController.getEditProfile)
  .post(
    verifyToken,
    authorize(["admin", "user"]),
    userController.postEditProfile
  );

module.exports = router;
