import "dotenv/config";
import { sendOtpEmail } from "./src/services/email.service.js";

const to = process.argv[2] || process.env.SMTP_FROM;
const otp = "123456";

try {
  await sendOtpEmail(to, otp);
  console.log(`Test email sent to ${to}`);
} catch (err) {
  console.error("Failed to send test email:", err);
  process.exit(1);
}
