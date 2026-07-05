import nodemailer from "nodemailer";

function isEmailConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
  );
}

export async function sendLoginOtpEmail({ to, name, otp }) {
  const appName = process.env.APP_NAME || "M&E Assistant";

  if (!isEmailConfigured()) {
    console.log("Email is not configured. Development OTP:");
    console.log(`User: ${to}`);
    console.log(`OTP: ${otp}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: `${appName} login code`,
    text: `Hello ${name},\n\nYour ${appName} login code is ${otp}. It expires in ${
      process.env.EMAIL_OTP_EXPIRES_MINUTES || 10
    } minutes.\n\nIf you did not request this, you can ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>${appName} login code</h2>
        <p>Hello ${name},</p>
        <p>Your login code is:</p>
        <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">${otp}</p>
        <p>This code expires in ${
          process.env.EMAIL_OTP_EXPIRES_MINUTES || 10
        } minutes.</p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `
  });
}