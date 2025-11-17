export const config = {
  server: {
    port: parseInt(process.env.PORT || "5001"),
    allowedOrigins: process.env.ALLOWED_ORIGINS,
    logLevel: process.env.LOG_LEVEL || "info",
    secure: process.env.NODE_ENV === "production" || false,
    jwtSecret: process.env.JWT_SECRET,
  },
}
