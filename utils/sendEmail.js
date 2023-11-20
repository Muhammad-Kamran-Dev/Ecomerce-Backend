const nodemailer = require("nodemailer");
const config = require("../config");

const sendEmail = async ({ subject, email, message }) => {
  const transporter = nodemailer.createTransport({
    service: config.smtpService,
    port: config.smtpPort,
    auth: {
      user: config.smtpEmail,
      pass: config.smtpPassword,
    },
  });

  const mailOptions = {
    from: config.smtpEmail,
    to: email,
    subject: subject,
    text: message,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
