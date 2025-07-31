import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


const userSchema = new mongoose.Schema({
    name: {
        type: String,   
        required: [true, "Please enter your name"],
        minLength: [3, "Name should be at least 3 characters"],
        maxLength: [30, "Name cannot exceed 30 characters"],
    },
    email: {
        type: String,
        required: [true, "Please enter your email"],    
        unique: true,
        validate: [validator.isEmail, "Please enter a valid email"],
    },
    phone: {
        type: Number,
        required: [true, "Please enter your phone number"],
    },
    password: {
        type: String,
        required: [true, "Please enter your password"],
        minLength: [8, "Password should be at least 6 characters"],
        select: false,
    },
}, {timestamps: true,
});