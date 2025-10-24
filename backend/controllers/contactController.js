import nodemailer from "nodemailer";

export const sendContactMessage = async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) return res.status(400).json({ error: "All fields are required" });

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"${name}" <${email}>`,
      to: process.env.EMAIL_TO || process.env.EMAIL_USER,
      subject: `New Contact Message from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    });

    res.json({ message: "Message sent successfully!" });
  } catch (err) {
    console.error("Email error:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
};
