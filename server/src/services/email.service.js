import nodemailer from 'nodemailer';
import { ENV } from '../config/env.js';

class EmailServiceClass {
  constructor() {
    this.transporter = null;
  }

  getTransporter() {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: ENV.EMAIL_USER,
          pass: ENV.EMAIL_PASS
        }
      });
    }
    return this.transporter;
  }

  /**
   * Send 6-digit verification code to user's Gmail
   */
  async sendVerificationEmail(toEmail, code, name = 'Developer') {
    const transporter = this.getTransporter();
    const verifyUrl = `${ENV.CLIENT_URL}/verify-email?email=${encodeURIComponent(toEmail)}&code=${code}`;

    const mailOptions = {
      from: `"CodeSync Security" <${ENV.EMAIL_USER}>`,
      to: toEmail,
      subject: `CodeSync Verification Code: ${code}`,
      text: `Hello ${name},\n\nYour 6-digit CodeSync verification code is: ${code}\n\nThis code will expire in 15 minutes.\n\nOr verify directly by clicking: ${verifyUrl}\n\nIf you did not request this, please ignore this email.\n\n- The CodeSync Team`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>CodeSync Verification</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #030a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #030a0f; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background-color: #071924; border: 1px solid rgba(132, 223, 255, 0.2); border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 30px 40px 20px 40px; text-align: center; border-bottom: 1px solid rgba(132, 223, 255, 0.1);">
                      <div style="display: inline-flex; align-items: center; gap: 8px;">
                        <span style="font-size: 24px; font-weight: 800; color: #84dfff; letter-spacing: -0.5px;">&lt;CodeSync /&gt;</span>
                      </div>
                      <p style="margin: 6px 0 0 0; color: #94a3b8; font-size: 13px;">Real-Time Collaborative Engineering Workspace</p>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="padding: 35px 40px;">
                      <h2 style="margin: 0 0 12px 0; color: #ffffff; font-size: 20px; font-weight: 700;">Verify your developer email</h2>
                      <p style="margin: 0 0 24px 0; color: #94a3b8; font-size: 14px; line-height: 1.6;">
                        Hi <strong style="color: #f1f5f9;">${name}</strong>, thanks for creating an account on CodeSync. Enter the 6-digit confirmation code below to verify your email and unlock collaborative rooms.
                      </p>

                      <!-- OTP Box -->
                      <div style="background-color: #030e17; border: 1px dashed #84dfff; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
                        <span style="display: block; font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px;">Verification Code</span>
                        <span style="font-size: 36px; font-weight: 800; color: #84dfff; font-family: 'Courier New', monospace; letter-spacing: 8px;">${code}</span>
                        <span style="display: block; font-size: 12px; color: #64748b; margin-top: 8px;">Expires in 15 minutes</span>
                      </div>

                      <!-- Direct CTA Button -->
                      <div style="text-align: center; margin: 30px 0 20px 0;">
                        <a href="${verifyUrl}" target="_blank" style="display: inline-block; background-color: #84dfff; color: #04151f; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 6px; box-shadow: 0 4px 12px rgba(132, 223, 255, 0.25);">
                          Verify & Continue to Workspace &rarr;
                        </a>
                      </div>

                      <p style="margin: 25px 0 0 0; color: #64748b; font-size: 12px; line-height: 1.5; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 20px;">
                        If you didn't attempt to sign up for CodeSync, someone might have mistyped their email. You can safely ignore this message.
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 20px 40px; background-color: #04121a; text-align: center; border-top: 1px solid rgba(132, 223, 255, 0.08);">
                      <p style="margin: 0; color: #475569; font-size: 11px;">
                        &copy; ${new Date().getFullYear()} CodeSync. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    };

    return transporter.sendMail(mailOptions);
  }

  /**
   * Send 6-digit password reset code to user's Gmail
   */
  async sendPasswordResetEmail(toEmail, code, name = 'Developer') {
    const transporter = this.getTransporter();

    const mailOptions = {
      from: `"CodeSync Security" <${ENV.EMAIL_USER}>`,
      to: toEmail,
      subject: `CodeSync Password Reset Code: ${code}`,
      text: `Hello ${name},\n\nYour password reset code is: ${code}\n\nThis code will expire in 15 minutes.\n\n- The CodeSync Team`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>CodeSync Password Reset</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #030a0f; font-family: sans-serif; color: #e2e8f0;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="padding: 40px 20px;">
            <tr>
              <td align="center">
                <div style="max-width: 500px; background-color: #071924; border: 1px solid rgba(132, 223, 255, 0.2); border-radius: 10px; padding: 30px; text-align: center;">
                  <h2 style="color: #ffffff; margin-top: 0;">Password Reset Request</h2>
                  <p style="color: #94a3b8; font-size: 14px;">Use the code below to reset your CodeSync account password:</p>
                  <div style="background-color: #030e17; border: 1px dashed #84dfff; border-radius: 6px; padding: 15px; margin: 20px 0;">
                    <span style="font-size: 32px; font-weight: 800; color: #84dfff; letter-spacing: 6px; font-family: monospace;">${code}</span>
                  </div>
                  <p style="color: #64748b; font-size: 12px;">This code expires in 15 minutes. If you did not request this, your account is secure.</p>
                </div>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    };

    return transporter.sendMail(mailOptions);
  }
}

export const EmailService = new EmailServiceClass();
