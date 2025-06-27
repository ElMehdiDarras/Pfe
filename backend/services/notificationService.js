// services/notificationService.js
const nodemailer = require('nodemailer');

/**
 * NotificationService for sending email and SMS alerts
 * Will be expanded with SMS gateway integration later
 */
class NotificationService {
  constructor() {
    this.emailTransporter = null;
    this.smsGateway = null;
    this.initialized = false;
    
    this.initializeEmailTransport();
  }
  
  /**
   * Initialize email transport with settings from environment variables
   */
  initializeEmailTransport() {
    // Check if SMTP settings are configured
    if (!process.env.SMTP_HOST || !process.env.SMTP_PORT) {
      console.warn('Email notifications disabled: SMTP settings not configured');
      return;
    }
    
    try {
      this.emailTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
      
      // Verify connection configuration
      this.emailTransporter.verify((error) => {
        if (error) {
          console.error('SMTP connection error:', error);
        } else {
          console.log('SMTP server is ready to send emails');
          this.initialized = true;
        }
      });
    } catch (error) {
      console.error('Failed to initialize email transport:', error);
    }
  }
  
  /**
   * Send email notification
   * @param {Object} options - Email options
   * @param {String} options.to - Recipient email
   * @param {String} options.subject - Email subject
   * @param {String} options.text - Plain text content
   * @param {String} options.html - HTML content (optional)
   * @returns {Promise<Boolean>} - Success status
   */
  async sendEmail(options) {
    if (!this.emailTransporter || !this.initialized) {
      console.warn('Email notification skipped: Email transport not initialized');
      return false;
    }
    
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || 'alarm-monitor@system.com',
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html
      };
      
      const info = await this.emailTransporter.sendMail(mailOptions);
      console.log('Email notification sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send email notification:', error);
      return false;
    }
  }
  
  /**
   * Send alarm notification email
   * @param {Object} alarm - Alarm object
   * @param {Array} recipients - Array of recipient email addresses
   * @returns {Promise<Boolean>} - Success status
   */
  async sendAlarmEmail(alarm, recipients) {
    const subject = `[${alarm.status}] Alarm: ${alarm.siteId} - ${alarm.equipment}`;
    
    const text = `
      Alarm detected:
      
      Site: ${alarm.siteId}
      Equipment: ${alarm.equipment}
      Description: ${alarm.description}
      Status: ${alarm.status}
      Time: ${new Date(alarm.timestamp).toLocaleString()}
    `;
    
    const html = `
      <h2>Alarm Notification</h2>
      <p style="color: ${alarm.status === 'CRITICAL' ? 'red' : (alarm.status === 'MAJOR' ? 'orange' : 'gold')}">
        <strong>${alarm.status}</strong>
      </p>
      <table border="1" cellpadding="5" style="border-collapse: collapse;">
        <tr>
          <th align="left">Site</th>
          <td>${alarm.siteId}</td>
        </tr>
        <tr>
          <th align="left">Equipment</th>
          <td>${alarm.equipment}</td>
        </tr>
        <tr>
          <th align="left">Description</th>
          <td>${alarm.description}</td>
        </tr>
        <tr>
          <th align="left">Status</th>
          <td>${alarm.status}</td>
        </tr>
        <tr>
          <th align="left">Time</th>
          <td>${new Date(alarm.timestamp).toLocaleString()}</td>
        </tr>
      </table>
      <p>Please check the monitoring system for details.</p>
    `;
    
    // Send to all recipients
    const results = await Promise.all(
      recipients.map(email => this.sendEmail({
        to: email,
        subject,
        text,
        html
      }))
    );
    
    // Return true if at least one email was sent successfully
    return results.some(result => result === true);
  }
  
  /**
   * Send SMS notification (placeholder for future implementation)
   * @param {String} phoneNumber - Recipient phone number
   * @param {String} message - SMS message content
   * @returns {Promise<Boolean>} - Success status
   */
  async sendSMS(phoneNumber, message) {
    // Placeholder for future SMS gateway implementation
    console.log(`[SMS Notification] To: ${phoneNumber}, Message: ${message}`);
    return false;
  }
}

// Export singleton instance
module.exports = new NotificationService();