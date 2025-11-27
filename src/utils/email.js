import nodemailer from "nodemailer";

// Simple in-memory email queue
class EmailQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.transporter = null;
  }

  getTransporter() {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
    }
    return this.transporter;
  }

  // Add email to queue
  enqueue(mailOptions) {
    this.queue.push(mailOptions);
    this.processQueue();
  }

  // Process queue without blocking
  async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    // Use setImmediate to not block the event loop
    setImmediate(async () => {
      while (this.queue.length > 0) {
        const mailOptions = this.queue.shift();
        try {
          await this.getTransporter().sendMail(mailOptions);
          console.log(`Email sent successfully to: ${mailOptions.to}`);
        } catch (error) {
          console.error(`Failed to send email to ${mailOptions.to}:`, error.message);
          // Optionally retry failed emails
          // this.queue.push(mailOptions);
        }
      }
      this.processing = false;
    });
  }
}

// Singleton instance
const emailQueue = new EmailQueue();

export const sendPasswordResetEmail = (email, resetToken, userType) => {
  const frontendUrl =
    process.env.NODE_ENV === "development"
      ? "http://localhost:5173"
      : process.env.DEPOLYED_FRONTEND_URL;

  const resetUrl = `${frontendUrl}/reset-password/${userType}/${resetToken}`;

  const mailOptions = {
    from: `"Cars24" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Password Reset Request - Cars24",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>You have requested to reset your password. Click the button below to reset it:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}"
             style="background-color: #4CAF50; color: white; padding: 14px 28px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          This link will expire in 1 hour. If you did not request this password reset, please ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">Cars24 - Your trusted car marketplace</p>
      </div>
    `,
  };

  // Non-blocking - add to queue and return immediately
  emailQueue.enqueue(mailOptions);
};

export const sendPasswordResetSuccessEmail = (email, name) => {
  const mailOptions = {
    from: `"Cars24" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Password Reset Successful - Cars24",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Successful</h2>
        <p>Hi ${name || "User"},</p>
        <p>Your password has been successfully reset.</p>
        <p>If you did not make this change, please contact our support team immediately.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">Cars24 - Your trusted car marketplace</p>
      </div>
    `,
  };

  // Non-blocking - add to queue and return immediately
  emailQueue.enqueue(mailOptions);
};
