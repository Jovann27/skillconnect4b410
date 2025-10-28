import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, minLength: 3, maxLength: 20 },
  firstName: { type: String, required: true, trim: true, minLength: 2, maxLength: 30 },
  lastName: { type: String, required: true, trim: true, minLength: 2, maxLength: 30 },
  email: { type: String, required: true, unique: true, lowercase: true, validate: [validator.isEmail, "Invalid email"] },
  phone: { type: String, required: true },
  otherContact: { type: String, default: "" },
  address: { type: String, required: true },
  birthdate: { type: Date, required: true },
  occupation: { type: String, default: "" },

  employed: { type: String, required: true },
  role: { type: String, enum: ["Community Member", "Service Provider", "Admin"], default: "Community Member" },

  isApplyingProvider: { type: Boolean, default: false }, // user applied to become provider
  skills: { type: [String], default: [] },
  certificates: { type: [String], default: [] },
  profilePic: { type: String, default: "" },
  validId: { type: String, default: "" },

  verified: { type: Boolean, default: false },
  availability: { type: String, enum: ["Available", "Currently Working", "Not Available"], default: "Not Available" },
  acceptedWork: { type: Boolean, default: false },

  service: { type: String, default: "" },
  serviceRate: { type: Number, default: 0 },
  serviceDescription: { type: String, default: "" },
  isOnline: { type: Boolean, default: true },
  services: { type: [String], default: [] },

  bookings: [{ type: mongoose.Schema.Types.ObjectId, ref: "Booking" }],
  notifications: [{ type: mongoose.Schema.Types.ObjectId, ref: "Notification" }],

  password: { type: String, required: true, minLength: 8, select: false },

  banned: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

userSchema.index({ skills: 1 });

userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.getJWTToken = function() {
  return jwt.sign({ id: this._id, role: this.role, type: "user" }, 
    process.env.JWT_SECRET_KEY, { expiresIn: process.env.JWT_EXPIRE });
};

export default mongoose.model("User", userSchema);
