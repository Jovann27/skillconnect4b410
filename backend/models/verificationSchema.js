import mongoose from "mongoose";

const verificationAppointmentSchema = new mongoose.Schema({
  provider: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  scheduledBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true }, // admin user id
  appointmentDate: { type: Date, required: true },
  location: { type: String, default: "" },
  status: { type: String, enum: ["Pending", "Confirmed", "Completed", "Cancelled"], default: "Pending" },
  remarks: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

verificationAppointmentSchema.index({ provider: 1, appointmentDate: 1 });

export default mongoose.model("VerificationAppointment", verificationAppointmentSchema);
