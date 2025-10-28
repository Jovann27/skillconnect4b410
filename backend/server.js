import dotenv from "dotenv";
process.env.DOTENV_CONFIG_SILENT = 'true';
dotenv.config();

import app from "./app.js";
import { dbConnection } from "./database/dbConnection.js";
import "./config/cloudinaryConfig.js";

import { Server } from "socket.io";
import http from "http";
import jwt from "jsonwebtoken";
import User from "./models/userSchema.js";
import Chat from "./models/chat.js";
import Booking from "./models/booking.js";

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true,
  }
});

const onlineUsers = new Map();

// Socket.IO authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new Error("User not found"));
    }

    socket.userId = user._id.toString();
    socket.user = user;
    next();
  } catch (err) {
    next(new Error("Authentication error"));
  }
});

io.on("connection", (socket) => {
  console.log("Client Connected", socket.id, "User:", socket.userId);

  // Register user as online
  onlineUsers.set(socket.userId, socket.id);
  console.log(`Registered user ${socket.userId} with socket ${socket.id}`);

  // Update user online status
  User.findByIdAndUpdate(socket.userId, { isOnline: true })
    .then(() => console.log(`User ${socket.userId} is now online`))
    .catch(err => console.error("Error updating online status:", err));

  // Handle joining chat rooms (appointment/booking based)
  socket.on("join-chat", async (appointmentId) => {
    try {
      // Verify user has access to this appointment
      const booking = await Booking.findOne({
        _id: appointmentId,
        $or: [
          { requester: socket.userId },
          { provider: socket.userId }
        ]
      });

      if (booking) {
        socket.join(`chat-${appointmentId}`);
        console.log(`User ${socket.userId} joined chat room for appointment ${appointmentId}`);

        // Send chat history
        const chatHistory = await Chat.find({ appointment: appointmentId })
          .populate('sender', 'firstName lastName')
          .sort({ createdAt: 1 });

        socket.emit("chat-history", chatHistory);
      } else {
        socket.emit("error", "Access denied to this chat");
      }
    } catch (error) {
      console.error("Error joining chat:", error);
      socket.emit("error", "Failed to join chat");
    }
  });

  // Handle sending messages
  socket.on("send-message", async (data) => {
    try {
      const { appointmentId, message } = data;

      // Verify user has access to this appointment
      const booking = await Booking.findOne({
        _id: appointmentId,
        $or: [
          { requester: socket.userId },
          { provider: socket.userId }
        ]
      });

      if (!booking) {
        socket.emit("error", "Access denied to this chat");
        return;
      }

      // Save message to database
      const chatMessage = await Chat.create({
        appointment: appointmentId,
        sender: socket.userId,
        message: message.trim(),
        status: 'sent'
      });

      // Populate sender info
      await chatMessage.populate('sender', 'firstName lastName');

      // Send to all users in the chat room
      io.to(`chat-${appointmentId}`).emit("new-message", chatMessage);

      // Send notification to other user if they're online
      const otherUserId = booking.requester.toString() === socket.userId
        ? booking.provider.toString()
        : booking.requester.toString();

      const otherSocketId = onlineUsers.get(otherUserId);
      if (otherSocketId && otherSocketId !== socket.id) {
        io.to(otherSocketId).emit("message-notification", {
          appointmentId,
          message: chatMessage,
          from: socket.user.firstName + " " + socket.user.lastName
        });
      }

      console.log(`Message sent in chat ${appointmentId} by user ${socket.userId}`);
    } catch (error) {
      console.error("Error sending message:", error);
      socket.emit("error", "Failed to send message");
    }
  });

  // Handle typing indicators
  socket.on("typing", (appointmentId) => {
    socket.to(`chat-${appointmentId}`).emit("user-typing", {
      userId: socket.userId,
      userName: socket.user.firstName + " " + socket.user.lastName
    });
  });

  socket.on("stop-typing", (appointmentId) => {
    socket.to(`chat-${appointmentId}`).emit("user-stopped-typing", {
      userId: socket.userId
    });
  });

  // Handle message seen status
  socket.on("message-seen", async (data) => {
    try {
      const { messageId, appointmentId } = data;

      // Update message status and seenBy array
      await Chat.findByIdAndUpdate(messageId, {
        status: 'seen',
        $addToSet: {
          seenBy: {
            user: socket.userId,
            seenAt: new Date()
          }
        }
      });

      // Notify sender that message was seen
      const message = await Chat.findById(messageId).populate('sender');
      if (message && message.sender._id.toString() !== socket.userId) {
        const senderSocketId = onlineUsers.get(message.sender._id.toString());
        if (senderSocketId) {
          io.to(senderSocketId).emit("message-seen-update", {
            messageId,
            seenBy: socket.user.firstName + " " + socket.user.lastName,
            appointmentId
          });
        }
      }
    } catch (error) {
      console.error("Error updating message seen status:", error);
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    onlineUsers.delete(socket.userId);
    console.log(`User ${socket.userId} disconnected`);

    // Update user online status
    User.findByIdAndUpdate(socket.userId, { isOnline: false })
      .then(() => console.log(`User ${socket.userId} is now offline`))
      .catch(err => console.error("Error updating offline status:", err));
  });
});

export { io, onlineUsers };

dbConnection();

server.listen(PORT, () => {
  console.log(` Server running at http://localhost:${PORT}`);
});
