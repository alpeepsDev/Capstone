import nodemailer from "nodemailer";
import logger from "./logger.js";

/**
 * Configure Nodemailer for Gmail SMTP
 * Requires an App Password from the Google Account settings
 */
let transporter;

const createTransporter = async () => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    logger.warn(
      "⚠️ SMTP credentials missing! Please add SMTP_USER and SMTP_PASS (App Password) to your .env file.",
    );
  }

  transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // Must be false for port 587 (uses STARTTLS)
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS, // Use a generated App Password for Gmail!
    },
  });
};

// Initialize transporter
createTransporter();

/**
 * Send an email with the OTP for password reset
 * @param {string} to - The recipient's email address
 * @param {string} otp - The 6-digit One Time Password
 */
export const sendPasswordResetEmail = async (to, otp) => {
  try {
    if (!transporter) {
      await createTransporter();
    }

    const mailOptions = {
      from: '"TaskForge Support" <noreply@taskforge.com>', // sender address
      to: to, // list of receivers
      subject: "Password Reset Request - TaskForge", // Subject line
      text: `Your password reset code is: ${otp}\n\nThis code will expire in 15 minutes. If you did not request a password reset, please ignore this email.`, // plain text body
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #2563eb; text-align: center;">TaskForge Password Reset</h2>
          <p style="color: #475569; font-size: 16px;">Hello,</p>
          <p style="color: #475569; font-size: 16px;">We received a request to reset your password. Use the verification code below to complete the process.</p>
          
          <div style="background-color: #f1f5f9; padding: 16px; border-radius: 6px; text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #1e293b;">${otp}</span>
          </div>
          
          <p style="color: #475569; font-size: 14px;">This code will expire in 15 minutes.</p>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px;">If you did not request a password reset, please safely ignore this email.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    logger.info(`Password reset email sent to ${to}`);

    if (info.messageId && nodemailer.getTestMessageUrl(info)) {
      logger.info(
        `Preview your email at: ${nodemailer.getTestMessageUrl(info)}`,
      );
    }

    return true;
  } catch (error) {
    logger.error("❌ Error sending email:", error);
    return false;
  }
};

/**
 * Send an email with the OTP for MFA
 * @param {string} to - The recipient's email address
 * @param {string} otp - The 6-digit One Time Password
 */
export const sendMfaEmail = async (to, otp) => {
  try {
    if (!transporter) {
      await createTransporter();
    }

    const mailOptions = {
      from: '"TaskForge Security" <noreply@taskforge.com>',
      to: to,
      subject: "Your Login Verification Code - TaskForge",
      text: `Your login verification code is: ${otp}\n\nThis code will expire in 10 minutes. If you did not attempt to log in, please secure your account.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #2563eb; text-align: center;">Login Verification</h2>
          <p style="color: #475569; font-size: 16px;">Hello,</p>
          <p style="color: #475569; font-size: 16px;">Please use the verification code below to complete your login.</p>
          
          <div style="background-color: #f1f5f9; padding: 16px; border-radius: 6px; text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #1e293b;">${otp}</span>
          </div>
          
          <p style="color: #475569; font-size: 14px;">This code will expire in 10 minutes.</p>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px;">If you did not attempt to log in, please reset your password immediately.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`MFA email sent to ${to}`);
    return true;
  } catch (error) {
    logger.error("❌ Error sending MFA email:", error);
    return false;
  }
};
