import nodemailer from "nodemailer";
import { email, emailPass } from "../constants.js";

let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  // const user = process.env.EMAIL?.trim();
  const user = email
  const pass = emailPass

  console.log(email, emailPass)
  // const pass = process.env.EMAIL_PASS?.trim();

  if (!user || !pass) return null; // return null instead of throwing

  _transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  return _transporter;
}

// Safe wrapper — never throws, always resolves
export const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = getTransporter();
    if (!transporter) {
      console.warn("⚠ Email not sent: EMAIL or EMAIL_PASS missing in .env");
      return;
    }
    await transporter.sendMail({
      from: `"BaltiCo" <${email?.trim()}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    // Log but never throw — email failures must never crash the server
    console.error("✉ Email send error:", err.message);
  }
};
