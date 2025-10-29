import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import path from "path";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";

import "./config/cloudinaryConfig.js";

import userRouter from "./routes/userRouter.js";
import userFlowRouter from "./routes/userFlowRouter.js";
import adminAuthRouter from "./routes/adminAuthRouter.js";
import adminFlowRouter from "./routes/adminFlowRouter.js";
import adminRouter from "./routes/adminRouter.js";
import contactRoutes from "./routes/contact.js";
import reportRoutes from "./routes/reportsRouter.js";
import settingsRouter from "./routes/settingsRouter.js";
import verificationRouter from "./routes/verificationRouter.js";
import helpRouter from "./routes/helpRouter.js";

import { errorMiddleware } from "./middlewares/error.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set("trust proxy", 1);

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const allowedOrigins = (process.env.ALLOWED_ORIGINS || FRONTEND_URL).split(",").map(s => s.trim());

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) return cb(null, true);
    return cb(new Error("CORS policy: origin not allowed"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later."
  }
});
app.use(generalLimiter);

app.use(fileUpload({ useTempFiles: true, tempFileDir: path.join(__dirname, "temp") }));

app.use("/api/v1/user", userRouter);
app.use("/api/v1/user", userFlowRouter);
app.use("/api/v1/admin/auth", adminAuthRouter);
app.use("/api/v1/admin", adminFlowRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/contact", contactRoutes);
app.use("/api/v1/settings", settingsRouter);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/verification", verificationRouter);
app.use("/api/v1/help", helpRouter);

// health
app.get("/api/v1/ping", (req, res) => res.json({ success: true, message: "pong" }));

app.use(errorMiddleware);

export default app;
