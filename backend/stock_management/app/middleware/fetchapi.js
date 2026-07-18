const jwt = require("jsonwebtoken");
const Auth = require("../models/auth.model.js");

const fetchApi = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ errors: "Authorization token missing" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ errors: "Authorization token missing" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
   
    

    // Here we assume you stored only userId/email in token payload
    const user = await Auth.getUserLoginByEmail(decoded.user.email); 


    if (!user) {
      return res.status(403).json({ errors: "Invalid User" });
    }

    // attach user to request
    req.user = user;
    // console.log("Authenticated User:", user);
    next();
  } catch (error) {
    return res.status(401).json({ errors: "Please authenticate" });
  }
};

module.exports = { fetchApi };


