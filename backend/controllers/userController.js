import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import User from "../models/userSchema.js";
import { sendToken } from "../utils/jwtToken.js";

export const register = catchAsyncError(async (req, res, next) => {
    const { name, email, phone, role, password } = req.body;

    if (!name || !email || !phone || !role || !password) {
        return next(new ErrorHandler("Please fill up all fields", 400));
    }

    const isPhone = await User.findOne({ phone });
    if (isPhone) {
        return next(new ErrorHandler("Phone number already exists", 400));
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
        new ErrorHandler("Invalid email or password!", 400);
    }
    const isPasswordMatched = await user.comparePassword(password);
    if (!isPasswordMatched) {
        new ErrorHandler("Invalid email or password!", 400);
    }
    if (user.role !== role) {
        new ErrorHandler("User with this role not found!", 400);
    }

    sendToken(user, 200, res, "User logged in successfully");
});

export const logout = catchAsyncError(async (req, res, next) => {
    res.status(200).cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true, 
    }).json({
        success: true,
        message: "User logged out successfully",
    });
});