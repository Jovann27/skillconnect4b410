import mongoose from "mongoose";
import dotenv from "dotenv";
import Admin from "./models/adminSchema.js";
import HelpRequest from "./models/helpSchema.js";
dotenv.config();

await mongoose.connect(process.env.MONGO_URI);

const DEFAULT_PASSWORD = process.env.ADMIN_SEED_PASSWORD || null;

let passwordToUse = DEFAULT_PASSWORD;

if (!passwordToUse) {
  passwordToUse = "AdminPass123";
  console.log("No ADMIN_SEED_PASSWORD provided. Generated secure password for seeder.");
}

const existingAdmin = await Admin.findOne({ email: "skillconnect@gmail.com" });
if (existingAdmin) {
  console.log("Admin already exists, skipping admin creation.");
} else {
  const admin = await Admin.create({
    name: "Admin",
    profilePic: "",
    email: "skillconnect@gmail.com",
    password: passwordToUse,
    role: "Admin"
  });
}

// Seed help topics
const helpTopics = [
  {
    title: "Login Issues",
    description: "If you're having trouble logging in, ensure you're using the correct email and password. If you've forgotten your password, click 'Forgot Password' on the login page and follow the instructions to reset it. Make sure your email is verified.",
    category: "Authentication"
  },
  {
    title: "Registration Problems",
    description: "When registering, fill in all required fields including a valid email address and strong password. If you don't receive a confirmation email, check your spam folder. Ensure you're registering as the correct user type (Client or Skilled User).",
    category: "Authentication"
  },
  {
    title: "How to Post a Service Request",
    description: "Navigate to the dashboard and click 'Request Service'. Fill in the service type, description, budget, date, and location. Make sure you're logged in as a client. Your request will be visible to available skilled users in your area.",
    category: "Service Requests"
  },
  {
    title: "Why Can't I See My Service Request?",
    description: "Your request might not be visible if no skilled users match your requirements, you're offline, or verification is pending. Ensure your request details are complete and try refreshing the page.",
    category: "Service Requests"
  },
  {
    title: "How to Register as a Skilled User",
    description: "Register as a regular user first, then in your dashboard, select 'Offer Services'. Choose your profession, set rates, and add a description. You'll need admin verification before you can accept requests.",
    category: "Service Providers"
  },
  {
    title: "Service Provider Verification",
    description: "After registering as a skilled user, submit your documents for verification. Admin will review your application typically within 24-48 hours. Check your profile status for updates.",
    category: "Service Providers"
  },
  {
    title: "Payment Not Processing",
    description: "Ensure your payment details are correct and your card has sufficient funds. Try refreshing the page or use a different payment method. Contact support if the issue persists.",
    category: "Payments"
  },
  {
    title: "Cancelling or Modifying a Booking",
    description: "You can cancel a booking via your dashboard under 'My Bookings'. Some cancellations may incur fees based on timing. Contact the service provider or support for modifications.",
    category: "Bookings"
  },
  {
    title: "App Not Responding",
    description: "Try refreshing the page or clearing your browser cache. Ensure you have a stable internet connection. If issues persist, try using a different device or browser.",
    category: "Technical Issues"
  },
  {
    title: "Contacting Support",
    description: "For additional assistance, use the 'Contact Support' section or send an email to skillconnect4b410@gmail.com. Include your email, issue details, and any relevant booking IDs.",
    category: "General"
  },
  {
    title: "Location Services Not Working",
    description: "Allow location access in your browser settings. For better accuracy, use the app on a mobile device or ensure GPS is enabled. Refresh your location in the app.",
    category: "Technical Issues"
  },
  {
    title: "Profile Updates Not Saving",
    description: "Ensure all required fields are filled before saving. Log out and back in if changes don't appear. Clear cache if you're using the web version.",
    category: "Account Management"
  }
];

const existingHelpTopics = await HelpRequest.find();
if (existingHelpTopics.length === 0) {
  await HelpRequest.insertMany(helpTopics);
  console.log("Help topics seeded successfully.");
} else {
  console.log("Help topics already exist, skipping seeding.");
}
