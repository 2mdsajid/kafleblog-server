const jwt = require("jsonwebtoken");
const Admin = require("../schema/adminSchema");

// Middleware for token verification
const VerifyAdmin = async (req, res, next) => {
  const bearer = req.headers.authorization;
  console.log("🚀 ~ file: middlewares.js:7 ~ VerifyAdmin ~ req.headers.authorization:", req.headers.authorization)
  const token = bearer ? bearer.split(" ")[1] : null;
  if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
  }
  try {
      const secretkey = process.env.JWT_SECRET_KEY
      const user = jwt.verify(token, secretkey)
      const {username,password} = user
      const admin = await Admin.findOne({username})
      if(!admin) {
        return res.status(403).json({ message: "Access forbidden for non-admin users" });
      }

      if(admin.password !== password){
        return res.status(403).json({ message: "Access forbidden for non-admin users" });
      }

      req.user = user;
      next();
  } catch (error) {
      return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = { VerifyAdmin };
