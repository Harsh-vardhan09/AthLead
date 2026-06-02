import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Use an App Password, not your real Gmail password
  },
  logger:true,
  debug:true,
});
transporter.verify((error, success) => {
  if (error) {
    console.error("VERIFY ERROR:", error);
  } else {
    console.log("Mail server ready");
  }
});

/**
 * Send OTP email to a user.
 * @param {string} to  - recipient email
 * @param {string} otp - plain 6-digit OTP
 */
export const sendOtpEmail = async (to, otp) => {
  const mailOptions = {
    from: `"AthLead Security" <${process.env.EMAIL_USER}>`,
    to,
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
  };

  //await transporter.sendMail(mailOptions);
  const info = await transporter.sendMail(mailOptions);

console.log("EMAIL SENT");
console.log(info);
};