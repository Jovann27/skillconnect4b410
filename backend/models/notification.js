import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  meta: { type: Object, default: {} },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

notificationSchema.index({ user: 1, read: 1 });

export default mongoose.model("Notification", notificationSchema);
