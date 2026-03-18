import logger from "./logger.js";

// Brevo uses the "SMTP_KEY" as your API Key for their HTTP API as well
const BREVO_API_KEY = process.env.SMTP_KEY || process.env.BREVO_API_KEY;

// Brevo requires you to send from the email address you verified on your account!
// We'll default to the one from your screenshot, but you can change this in your .env
const senderEmail = process.env.BREVO_SENDER_EMAIL || "alpeeps01@gmail.com";
const senderName = "TaskForge Support";

const sendBrevoEmail = async (to, subject, htmlContent) => {
  try {
    if (!BREVO_API_KEY) {
      logger.warn("⚠️ BREVO_API_KEY (or SMTP_KEY) is missing from .env.");
    }

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: to }],
        subject: subject,
        htmlContent: htmlContent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      logger.error(
        `❌ Error sending email via Brevo API: ${response.status} - ${errorData}`,
      );
      return false;
    }

    const result = await response.json();
    logger.info(
      `Email sent successfully to ${to} with Brevo Message ID: ${result.messageId}`,
    );
    return true;
  } catch (error) {
    logger.error("❌ Unexpected Error sending email:", error);
    return false;
  }
};

/**
 * Send an email with the OTP for password reset
 * @param {string} to - The recipient's email address
 * @param {string} otp - The 6-digit One Time Password
 */
export const sendPasswordResetEmail = async (to, otp) => {
  const subject = "Password Reset Request - TaskForge";
  const htmlContent = `
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
  `;

  return await sendBrevoEmail(to, subject, htmlContent);
};

/**
 * Send an email with the OTP for MFA
 * @param {string} to - The recipient's email address
 * @param {string} otp - The 6-digit One Time Password
 */
export const sendMfaEmail = async (to, otp) => {
  const subject = "Your Login Verification Code - TaskForge";
  const htmlContent = `
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
  `;

  return await sendBrevoEmail(to, subject, htmlContent);
};
