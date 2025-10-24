class ErrorHandler extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const errorMiddleware = (err, req, res, next) => {
  console.error(" Error:", err); 

  let safeMessage = "Internal Server Error";
  if (process.env.NODE_ENV !== "production") {
    safeMessage = err.message || safeMessage;
  } else {
    if (err.name === "JsonWebTokenError") safeMessage = "Authentication failed.";
    if (err.name === "TokenExpiredError") safeMessage = "Authentication expired.";
    if (err.name === "CastError") safeMessage = "Resource not found.";
    if (err.code === 11000) safeMessage = "Duplicate value entered.";
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: safeMessage,
  });
};

export default ErrorHandler;
