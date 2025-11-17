import { getErrorByStatus, getErrorByCode } from "../utils/errorCodes.js";

class ErrorHandler extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const errorMiddleware = (err, req, res, next) => {
  // Log error details for debugging (without exposing to client)
  if (process.env.NODE_ENV === "development") {
    console.error("Error:", err);
  } else {
    // In production, log only essential error info without stack traces
    console.error("Error:", {
      message: err.message,
      name: err.name,
      statusCode: err.statusCode,
      stack: err.stack?.split('\n')[0] // Only log the first line of stack trace
    });
  }

  let safeMessage = "Internal Server Error";
  let statusCode = err.statusCode || 500;
  let errorCode = null;

  // Check if error has a specific Vercel error code
  if (err.code && getErrorByCode(err.code)) {
    const vercelError = getErrorByCode(err.code);
    safeMessage = vercelError.message;
    statusCode = vercelError.status;
    errorCode = vercelError.code;
  } else if (getErrorByStatus(statusCode)) {
    // Check if status code matches a known Vercel error
    const vercelError = getErrorByStatus(statusCode);
    safeMessage = vercelError.message;
    errorCode = vercelError.code;
  } else {
    // Handle standard application errors
    if (process.env.NODE_ENV === "development") {
      // In development, show detailed error messages
      safeMessage = err.message || safeMessage;
    } else {
      // In production, use safe, generic messages
      if (err.name === "JsonWebTokenError") {
        safeMessage = "Authentication failed.";
        statusCode = 401;
      } else if (err.name === "TokenExpiredError") {
        safeMessage = "Authentication expired.";
        statusCode = 401;
      } else if (err.name === "CastError") {
        safeMessage = "Resource not found.";
        statusCode = 404;
      } else if (err.code === 11000) {
        safeMessage = "Duplicate value entered.";
        statusCode = 400;
      } else if (err.statusCode) {
        // For custom ErrorHandler instances, use the custom message if it's safe
        safeMessage = err.message || safeMessage;
      }
    }
  }

  const response = {
    success: false,
    message: safeMessage,
  };

  // Include error code in development or for specific errors
  if (errorCode && (process.env.NODE_ENV === "development" || statusCode >= 500)) {
    response.errorCode = errorCode;
  }

  res.status(statusCode).json(response);
};

export default ErrorHandler;
