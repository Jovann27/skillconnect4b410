import VerificationAppointment from "../models/verificationSchema.js";
import User from "../models/userSchema.js";

export const createVerificationAppointment = async (req, res) => {
  try {
    const { providerId, appointmentDate, location } = req.body;

    if (!providerId || !appointmentDate || !location) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const provider = await User.findById(providerId);
    if (!provider) return res.status(404).json({ success: false, message: "Provider not found" });

    const appointment = await VerificationAppointment.create({
      provider: providerId,
      scheduledBy: req.admin._id,
      appointmentDate,
      location,
    });

    res.status(201).json({ success: true, message: "Verification appointment scheduled", appointment });
  } catch (err) {
    console.error("❌ Error creating appointment:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 🔍 Get all appointments
export const getAllVerificationAppointments = async (req, res) => {
  try {
    const appointments = await VerificationAppointment.find()
      .populate("provider", "firstName lastName email verified")
      .populate("scheduledBy", "name email")
      .sort({ appointmentDate: 1 });

    res.json({ success: true, count: appointments.length, appointments });
  } catch (err) {
    console.error("❌ Error fetching appointments:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 🧾 Get appointments for a specific provider
export const getProviderAppointments = async (req, res) => {
  try {
    const providerId = req.params.id;
    const appointments = await VerificationAppointment.find({ provider: providerId })
      .populate("scheduledBy", "name email")
      .sort({ appointmentDate: -1 });

    res.json({ success: true, count: appointments.length, appointments });
  } catch (err) {
    console.error("❌ Error fetching provider appointments:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✏️ Update appointment (status, remarks, result)
export const updateVerificationAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks, result } = req.body;

    const appointment = await VerificationAppointment.findById(id);
    if (!appointment) return res.status(404).json({ success: false, message: "Appointment not found" });

    if (status) appointment.status = status;
    if (remarks) appointment.remarks = remarks;
    if (result) appointment.result = result;

    await appointment.save();

    // If completed and passed, mark provider as verified
    if (status === "Complete" && result === "Passed") {
      const provider = await User.findById(appointment.provider);
      if (provider) {
        provider.verified = true;
        await provider.save();
      }
    }

    res.json({ success: true, message: "Appointment updated", appointment });
  } catch (err) {
    console.error("❌ Error updating appointment:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ❌ Delete appointment
export const deleteVerificationAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await VerificationAppointment.findById(id);
    if (!appointment) return res.status(404).json({ success: false, message: "Appointment not found" });

    await appointment.deleteOne();
    res.json({ success: true, message: "Appointment deleted" });
  } catch (err) {
    console.error("❌ Error deleting appointment:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
