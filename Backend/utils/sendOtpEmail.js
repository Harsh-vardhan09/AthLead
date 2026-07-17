import nodemailer from "nodemailer";
import axios from "axios";

nodemailer.createTransport({
  port: 465,
  host: "smtp.gmail.com",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Use an App Password, not your real Gmail password
  },
});

export const sendOtpEmail = async (to, otp) => {
  try {
    await axios.post(
      process.env.EMAIL_ADD,
      {
        from: "Athlead<NoReply>",
        to: to,
        subject: "Your AthLead Verification OTP",
        html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px;background:#f9fafb">
          <h2 style="color:#0f172a;margin-bottom:8px">Email Verification</h2>
          <p style="color:#475569;margin-bottom:24px">Use the OTP below to verify your email. It is valid for <strong>5 minutes</strong>.</p>
          <div style="background:#1e293b;color:#5dcaa5;font-size:32px;font-weight:700;letter-spacing:12px;text-align:center;padding:20px;border-radius:8px">
            ${otp}
          </div>
          <p style="color:#94a3b8;font-size:12px;margin-top:24px">If you did not request this, please ignore this email. Do not share your OTP with anyone.</p>
        </div>
      `,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.EMAIL_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.log(error);
  }
};

// console.log("EMAIL SENT");
