import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Please enter a username"],
    unique: true,
    trim: true,
    minLength: [3, "Username must be at least 3 characters"],
    maxLength: [20, "Username cannot exceed 20 characters"],
  },
  firstName: {
    type: String,
    required: [true, "Please enter your first name"],
    trim: true,
    minLength: [2, "First name must be at least 2 characters"],
    maxLength: [30, "First name cannot exceed 30 characters"],
  },
  lastName: {
    type: String,
    required: [true, "Please enter your last name"],
    trim: true,
    minLength: [2, "Last name must be at least 2 characters"],
    maxLength: [30, "Last name cannot exceed 30 characters"],
  },
  email: {
    type: String,
    required: [true, "Please enter your email"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please enter a valid email"],
  },
  phone: {
    type: String, // string to allow +63, dashes, etc.
    required: [true, "Please enter your phone number"],
  },
  otherContact: {
    type: String,
    default: "",
  },
  address: {
    type: String,
    required: [true, "Please enter your address"],
  },
  birthdate: {
    type: Date,
    required: [true, "Please enter your birthdate"],
  },
  occupation: {
    type: String,
    default: "",
  },
  employed: {
    type: Boolean,
    default: false,
  },
  skills: {
    type: [String], // array of skills (max 2 enforced in frontend)
    validate: {
      validator: function (v) {
        return v.length <= 2; // enforce max 2 skills
      },
      message: "You can select up to 2 skills only",
    },
  },
  appointmentDate: {
    type: Date,
  },
  certificates: {
    type: String, // file path or URL
    default: "",
  },
  validId: {
    type: String, // file path or URL
    required: [true, "Please upload a valid ID"],
  },
  password: {
    type: String,
    required: [true, "Please enter your password"],
    minLength: [8, "Password should be at least 8 characters"],
    select: false,
  },
  role: {
    type: String,
    required: [true, "Please enter your role"],
    enum: ["Service Provider", "Business Owner", "Community Member"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// ✅ Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// ✅ Compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ✅ Generate JWT token
userSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

const User = mongoose.model("User", userSchema);

export default User;
