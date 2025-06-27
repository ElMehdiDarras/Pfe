const nodemailer = require('nodemailer');
const User = require('../models/users');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
    this.initTransporter();
  }

  initTransporter() {
    // Check if SMTP settings are available
    if (!process.env.SMTP_HOST || !process.env.SMTP_PORT) {
      console.warn('Email service not configured: Missing SMTP settings');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      // Verify connection
      this.transporter.verify((error) => {
        if (error) {
          console.error('SMTP connection error:', error);
        } else {
          console.log('SMTP server ready to send emails');
          this.initialized = true;
        }
      });
    } catch (error) {
      console.error('Failed to initialize email transport:', error);
    }
  }

  /**
   * Send email notification for a critical alarm
   * @param {Object} alarm - The alarm object
   * @returns {Promise<boolean>} - Success status
   */
  async sendCriticalAlarmEmail(alarm) {
    if (!this.initialized || !this.transporter) {
      console.warn('Email service not initialized. Email not sent.');
      return false;
    }

    // Only send emails for CRITICAL alarms
    if (alarm.status !== 'CRITICAL') {
      console.log(`Skipping email for non-critical alarm: ${alarm.status}`);
      return false;
    }

    try {
      // Find users who should receive this notification
      let userQuery = {
        active: true,
        'notificationPreferences.email.enabled': true
      };

      // Add site-specific targeting
      userQuery.$or = [
        { role: { $in: ['administrator', 'supervisor'] } },
        { role: 'agent', sites: alarm.siteId }
      ];

      const users = await User.find(userQuery).select('email firstName lastName');

      if (users.length === 0) {
        console.log('No eligible users found for email notification');
        return false;
      }

      // Prepare email template
      const subject = `[CRITICAL ALARM] ${alarm.siteId} - ${alarm.equipment}`;
      const emailAddresses = users.map(user => user.email);

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Critical Alarm Notification</h2>
          <div style="background-color: #f44336; color: white; padding: 15px; border-radius: 4px;">
            <strong>CRITICAL ALARM</strong>
          </div>
          <div style="margin-top: 20px;">
            <table cellpadding="5" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="font-weight: bold; width: 120px;">Site:</td>
                <td>${alarm.siteId}</td>
              </tr>
              <tr>
                <td style="font-weight: bold;">Equipment:</td>
                <td>${alarm.equipment}</td>
              </tr>
              <tr>
                <td style="font-weight: bold;">Description:</td>
                <td>${alarm.description}</td>
              </tr>
              <tr>
                <td style="font-weight: bold;">Time:</td>
                <td>${new Date(alarm.timestamp).toLocaleString()}</td>
              </tr>
            </table>
          </div>
          <div style="margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 4px;">
            <p>Please check the monitoring system immediately.</p>
          </div>
          <div style="margin-top: 20px; font-size: 12px; color: #777;">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      `;

      // Send the email
      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM ,
        to: emailAddresses.join(', '),
        subject: subject,
        html: htmlContent,
        text: `CRITICAL ALARM\n\nSite: ${alarm.siteId}\nEquipment: ${alarm.equipment}\nDescription: ${alarm.description}\nTime: ${new Date(alarm.timestamp).toLocaleString()}\n\nPlease check the monitoring system immediately.`
      });

      console.log(`Critical alarm email sent to ${emailAddresses.length} recipients. MessageId: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error('Failed to send critical alarm email:', error);
      return false;
    }
  }
}

module.exports = new EmailService();