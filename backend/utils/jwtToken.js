const sendToken = (userOrAdmin, statusCode, res, message) => {
  const token = userOrAdmin.getJWTToken?.() ?? userOrAdmin.token; // fallback

  const cookieExpireDays = Number(process.env.COOKIE_EXPIRE) || 5;
  const options = {
    expires: new Date(Date.now() + cookieExpireDays * 24 * 60 * 60 * 1000),
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
  };

  const payload = {
    id: userOrAdmin._id,
    name: userOrAdmin.name || `${userOrAdmin.firstName || ""} ${userOrAdmin.lastName || ""}`.trim(),
    email: userOrAdmin.email,
    role: userOrAdmin.role,
    type: userOrAdmin.role === "Admin" || userOrAdmin.role === "admin" ? "admin" : "user",
  };

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    message,
    user: payload,
    token,
  });
};

export default sendToken;
