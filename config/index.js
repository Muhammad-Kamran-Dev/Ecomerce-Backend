const dotenv = require("dotenv");
dotenv.config({
  path: "config/config.env",
});

module.exports = {
  port: String(process.env.PORT),
  dbUri: String(process.env.DB_URI),
  jwtSecret: String(process.env.JWT_SECRET),
  jwtExpiresIn: String(process.env.JWT_EXPIRES_IN),
  cookieExpiresTime: String(process.env.COOKIE_EXPIRES_TIME),
  smtpService: String(process.env.SMTP_SERVICE),
  smtpHost: String(process.env.SMTP_HOST),
  smtpPort: String(process.env.SMTP_PORT),
  smtpEmail: String(process.env.SMTP_EMAIL),
  smtpPassword: String(process.env.SMTP_PASSWORD),
  cloudinaryCloudName: String(process.env.CLOUDINARY_CLOUD_NAME),
  cloudinaryCloudApiKey: String(process.env.CLOUDINARY_API_KEY),
  cloudinaryCloudApiSecret: String(process.env.CLOUDINARY_API_SECRET),
};
