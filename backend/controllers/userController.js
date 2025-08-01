import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import User from "../models/userSchema.js";
import { sendToken } from "../utils/jwtToken.js";

export const register = catchAsyncError(async (req, res, next) => {
    const { name, email, phone, role, password } = req.body;

    if (!name || !email || !phone || !role || !password) {
        return next(new ErrorHandler("Please fill up all fields", 400));
    }

    const isEmail = await User.findOne({ email });
    if (isEmail) {
        return next(new ErrorHandler("Email already exists", 400));
    }

    const user = await User.create({
        name,
        email,
        phone,
        role,
        password,
    });

    sendToken(user, 200, res, "User registered successfully");
});

export const login = catchAsyncError(async (req, res, next) => {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
        return next(new ErrorHandler("Please fill up all fields", 400));
    }
    const user = await User.findOne({ email }).select("+password");
    if( !user ) {
        new ErrorHandler("Invalid email or password", 400);
    }
    const isPasswordMatched = await user.comparePassword(password);
    if (!isPasswordMatched) {
        new ErrorHandler("Invalid email or password", 400);
    }
});
