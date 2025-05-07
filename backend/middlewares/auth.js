import dotenv from 'dotenv';
import jwt from "jsonwebtoken";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET_KEY;


 export function authenticateToken(req, res, next) {
    const token = req.cookies.token;
  
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) return res.status(403).json({ error: "Token is not valid" });
  
      req.user = user; // Contains id, email
      next();
    });
  }

 
  