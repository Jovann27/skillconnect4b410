import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  requester: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  provider: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  servicePost: { type: mongoose.Schema.Types.ObjectId, ref: "ServicePost" }, // optional if booking from a post
  serviceRequest: { type: mongoose.Schema.Types.ObjectId, ref: "ServiceRequest" }, // optional if booking from a request
  date: { type: Date },
  time: { type: String },
  status: { type: String, enum: ["Pending", "Confirmed", "InProgress", "Completed", "Cancelled"], default: "Pending" },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

bookingSchema.index({ requester: 1, provider: 1, status: 1 });

export default mongoose.model("Booking", bookingSchema);
