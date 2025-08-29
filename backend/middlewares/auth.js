import jwt from "jsonwebtoken";
import User from "../models/userSchema.js";
import ErrorHandler from "./error.js";

export const isAuthorized = async (req, res, next) => {
  try {
    const { token } = req.cookies;

    if (!token) {
      return next(new ErrorHandler("User not authorized", 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    req.user = await User.findById(decoded.id);
    next();
  } catch (error) {
    return next(new ErrorHandler("Invalid or expired token", 401));
  }
};
