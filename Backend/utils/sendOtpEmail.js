import emailjs from "@emailjs/nodejs";

emailjs.init({
  publicKey: process.env.EMAILJS_PUBLIC_KEY,
  privateKey: process.env.EMAILJS_PRIVATE_KEY,
});

export const sendOtpEmail = async (to, otp, expiryTime) => {
  try {
    const response = await emailjs.send(
      process.env.EMAILJS_SERVICE_ID,
      process.env.EMAILJS_TEMPLATE_ID,
      {
        email: to,
        passcode: otp,
        time: expiryTime,
      }
    );

    console.log("OTP email sent:", response.status);

    return response;
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    throw error;
  }
};