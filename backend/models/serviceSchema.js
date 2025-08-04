import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please enter the service title"],
    minLength: [3, "Service title should be at least 3 characters"],
    maxLength: [100, "Service title cannot exceed 100 characters"],
  },
  description: {
    type: String,
    required: [true, "Please enter the service description"],
    minLength: [10, "Service description should be at least 10 characters"],
  },
  location: {
    type: String,
    required: [true, "Please enter the service location"],
  },

  fixedPrice: {
    type: Number,
    required: false, // 🔁 Not required — conditional
    min: [0, "Price cannot be negative"],
  },
  priceFrom: {
    type: Number,
    required: false,
    min: [0, "Starting price cannot be negative"],
  },
  priceTo: {
    type: Number,
    required: false,
    min: [0, "Ending price cannot be negative"],
  },

  category: {
    type: String,
    required: [true, "Please select a service category"],
    enum: [
      "Plumbing", "Electrical", "House Cleaning", "Laundry Service",
      "Massage Therapy", "Carpentry", "Haircut at Home", "Aircon Cleaning",
      "Pet Grooming", "Home Tutoring"
    ],
  },
  skills: {
    type: [String],
    required: [true, "Please enter the required skills"],
  },
  expired: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
});

const Service = mongoose.model("Service", serviceSchema);
export default Service;
