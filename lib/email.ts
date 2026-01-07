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
