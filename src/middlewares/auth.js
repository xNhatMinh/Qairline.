const jwt = require("jsonwebtoken");

// Tạo token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.SECRET_KEY,
    {
      expiresIn: "1h",
    }
  );
};

// Xác thực token
function verifyToken(req, res, next) {
  const token =
    req.header("Authorization")?.replace("Bearer ", "") || req.cookies.token;

  if (!token) {
    return res
      .status(403)
      .json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(400).json({ message: "Invalid token." });
  }
}

module.exports = { generateToken, verifyToken };
