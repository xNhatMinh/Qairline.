const session = require("express-session");
const express = require("express");
const configViewEngine = require("./src/models/viewEngine");
const adminRouter = require("./src/routes/adminRouter");
const userRouter = require("./src/routes/userRouter");
const cookieParser = require("cookie-parser");
const app = express();
const cors = require("cors");
const hostname = process.env.HOST_NAME;
const port = process.env.PORT;

app.use(cors());

//config req.body -> lấy data từ client gửi lên qua HTML
app.use(express.json()); // for json
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

// sử dụng Express-session
app.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 }, // 1 hour
  })
);

// Middleware đăng ký tiếp theo để dữ liệu của session được truyền vào Reponse Local trong quá trình xử lý request
app.use((req, res, next) => {
  res.locals.msg = req.session.msg;
  res.locals.err = req.session.err;
  res.locals.user = req.session.user;
  res.locals.admin = req.session.admin;
  next();
});

//config template engine
configViewEngine(app);

app.use("/admin", adminRouter);

app.use("/", userRouter);

app.use((req, res) => {
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server is running on http://${hostname}:${port}`);
});
