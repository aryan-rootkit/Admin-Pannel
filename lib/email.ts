import nodemailer from 'nodemailer';

/**
 * Email utility using Nodemailer
 * Handles sending emails for project assignments and notifications
 */

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

/**
 * Send project assignment email to team member
 */
export async function sendProjectAssignmentEmail(
  to: string,
  projectName: string,
  projectDescription: string,
  deadline: Date,
  clientName: string
) {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject: `New Project Assignment: ${projectName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
              .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
              .button { display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>New Project Assignment</h2>
              </div>
              <div class="content">
                <p>Hello,</p>
                <p>You have been assigned to a new project:</p>
                <h3>${projectName}</h3>
                <p><strong>Client:</strong> ${clientName}</p>
                <p><strong>Description:</strong> ${projectDescription}</p>
                <p><strong>Deadline:</strong> ${new Date(deadline).toLocaleDateString()}</p>
                <p>Please log in to the admin panel to view full project details and start working on your tasks.</p>
                <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/projects" class="button">View Project</a>
              </div>
              <div class="footer">
                <p>This is an automated email from Rootkit Development Admin Panel</p>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Send payment reminder email
 */
export async function sendPaymentReminderEmail(
  clientName: string,
  projectName: string,
  balanceDue: number,
  dueDate: string,
  invoiceNumber: string
) {
  try {
    const transporter = createTransporter();
    
    const daysOverdue = Math.floor((new Date().getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24));
    const overdueText = daysOverdue > 0 ? `${daysOverdue} days overdue` : 'Due soon';
    
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: `client@example.com`, // In production, get from client data
      cc: 'finance@rootkit.com',
      subject: `Payment Reminder - ${projectName} (${invoiceNumber})`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
              .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
              .button { display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px; }
              .amount { font-size: 24px; font-weight: bold; color: #ef4444; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>Payment Reminder</h2>
              </div>
              <div class="content">
                <p>Hi ${clientName},</p>
                <p>Friendly reminder: <span class="amount">₹${balanceDue.toLocaleString('en-IN')}</span> balance due for <strong>${projectName}</strong>.</p>
                <p>Originally due: ${new Date(dueDate).toLocaleDateString('en-IN')} <strong>(${overdueText})</strong></p>
                <p>Invoice Number: <strong>${invoiceNumber}</strong></p>
                <p>Please process the payment at your earliest convenience.</p>
                <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/revenue" class="button">View Invoice</a>
              </div>
              <div class="footer">
                <p>Best regards,<br>Rootkit Team</p>
                <p>This is an automated email from Rootkit Development Admin Panel</p>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Payment reminder email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending payment reminder email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Test email connection
 */
export async function testEmailConnection() {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    return { success: true, message: 'Email server connection successful' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
