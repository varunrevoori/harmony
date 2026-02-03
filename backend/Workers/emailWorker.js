const nodemailer = require('nodemailer');
const { emailQueue, reminderQueue } = require('../Services/notificationService');

// SMTP Configuration from environment variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

// Verify SMTP connection
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP connection error:', error);
  } else {
    console.log('SMTP server is ready to send emails');
  }
});

// Email templates
const emailTemplates = {
  BOOKING_CONFIRMATION: (data) => ({
    subject: 'Appointment Booking Confirmation',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2196F3;">Appointment Confirmed</h2>
        <p>Dear ${data.userName},</p>
        <p>Your appointment has been successfully booked and is awaiting provider approval.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Appointment Details:</h3>
          <p><strong>Appointment ID:</strong> ${data.appointmentId}</p>
          <p><strong>Provider:</strong> ${data.providerName}</p>
          <p><strong>Service:</strong> ${data.serviceName}</p>
          <p><strong>Date:</strong> ${new Date(data.date).toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${data.startTime} - ${data.endTime}</p>
          <p><strong>Price:</strong> $${data.price}</p>
          <p><strong>Status:</strong> Pending Approval</p>
        </div>
        <p>You will receive an email notification once the provider approves your appointment.</p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          If you need to cancel or reschedule, please log in to your dashboard.
        </p>
      </div>
    `
  }),

  APPOINTMENT_APPROVED: (data) => ({
    subject: 'Appointment Approved',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">Appointment Approved ✓</h2>
        <p>Dear ${data.userName},</p>
        <p>Great news! Your appointment has been approved by ${data.providerName}.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Appointment Details:</h3>
          <p><strong>Appointment ID:</strong> ${data.appointmentId}</p>
          <p><strong>Provider:</strong> ${data.providerName}</p>
          <p><strong>Date:</strong> ${new Date(data.date).toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${data.startTime} - ${data.endTime}</p>
          <p><strong>Location:</strong> ${data.location || 'TBD'}</p>
        </div>
        <p><strong>Please arrive 10 minutes early for your appointment.</strong></p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          You will receive a reminder 24 hours before your appointment.
        </p>
      </div>
    `
  }),

  APPOINTMENT_REJECTED: (data) => ({
    subject: 'Appointment Request Declined',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #F44336;">Appointment Declined</h2>
        <p>Dear ${data.userName},</p>
        <p>Unfortunately, your appointment request has been declined by ${data.providerName}.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Appointment ID:</strong> ${data.appointmentId}</p>
          <p><strong>Date:</strong> ${new Date(data.date).toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${data.startTime} - ${data.endTime}</p>
          ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
        </div>
        <p>You can browse other available providers or try booking a different time slot.</p>
      </div>
    `
  }),

  APPOINTMENT_CANCELLED: (data) => ({
    subject: 'Appointment Cancelled',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #FF9800;">Appointment Cancelled</h2>
        <p>Dear ${data.recipientName},</p>
        <p>This is to confirm that the following appointment has been cancelled${data.cancelledBy ? ` by ${data.cancelledBy}` : ''}.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Appointment ID:</strong> ${data.appointmentId}</p>
          <p><strong>Date:</strong> ${new Date(data.date).toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${data.startTime} - ${data.endTime}</p>
          ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
        </div>
      </div>
    `
  }),

  APPOINTMENT_COMPLETED: (data) => ({
    subject: 'Appointment Completed',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">Appointment Completed</h2>
        <p>Dear ${data.userName},</p>
        <p>Your appointment with ${data.providerName} has been marked as completed.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Appointment ID:</strong> ${data.appointmentId}</p>
          <p><strong>Date:</strong> ${new Date(data.date).toLocaleDateString()}</p>
          <p><strong>Service:</strong> ${data.serviceName}</p>
        </div>
        <p>We hope you had a great experience! You can leave a review in your dashboard.</p>
      </div>
    `
  }),

  PROVIDER_APPROVED: (data) => ({
    subject: 'Provider Account Approved',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">Welcome to Harmony! ✓</h2>
        <p>Dear ${data.providerName},</p>
        <p>Congratulations! Your provider account has been approved by the system administrator.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Business Name:</strong> ${data.businessName}</p>
          <p><strong>Service Type:</strong> ${data.serviceType}</p>
        </div>
        <p>You can now:</p>
        <ul>
          <li>Set your availability schedule</li>
          <li>Manage appointment requests</li>
          <li>Update your service profile</li>
        </ul>
        <p>Log in to your dashboard to get started!</p>
      </div>
    `
  }),

  PROVIDER_REJECTED: (data) => ({
    subject: 'Provider Account Status',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #F44336;">Provider Application Update</h2>
        <p>Dear ${data.providerName},</p>
        <p>After reviewing your provider application, we regret to inform you that it has not been approved at this time.</p>
        ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
        <p>If you have any questions, please contact our support team.</p>
      </div>
    `
  }),

  APPOINTMENT_REMINDER: (data) => ({
    subject: 'Reminder: Upcoming Appointment Tomorrow',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #FF9800;">⏰ Appointment Reminder</h2>
        <p>Dear ${data.userName},</p>
        <p><strong>This is a reminder that you have an appointment scheduled for tomorrow.</strong></p>
        <div style="background-color: #fff3e0; padding: 15px; border-left: 4px solid #FF9800; margin: 20px 0;">
          <h3 style="margin-top: 0;">Appointment Details:</h3>
          <p><strong>Provider:</strong> ${data.providerName}</p>
          <p><strong>Date:</strong> ${new Date(data.date).toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${data.startTime} - ${data.endTime}</p>
          <p><strong>Location:</strong> ${data.location || 'TBD'}</p>
        </div>
        <p><strong>Important:</strong> Please arrive 10 minutes early.</p>
        <p>If you need to cancel or reschedule, please do so at least 24 hours in advance through your dashboard.</p>
      </div>
    `
  }),

  APPOINTMENT_RESCHEDULED: (data) => ({
    subject: 'Appointment Rescheduled',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2196F3;">Appointment Rescheduled</h2>
        <p>Dear ${data.recipientName},</p>
        <p>An appointment has been rescheduled${data.rescheduledBy ? ` by ${data.rescheduledBy}` : ''}.</p>
        <div style="background-color: #ffebee; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #d32f2f;">Previous Appointment:</h4>
          <p><strong>Date:</strong> ${new Date(data.previousDate).toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${data.previousStartTime} - ${data.previousEndTime}</p>
        </div>
        <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #388e3c;">New Appointment:</h4>
          <p><strong>Appointment ID:</strong> ${data.appointmentId}</p>
          <p><strong>Date:</strong> ${new Date(data.newDate).toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${data.newStartTime} - ${data.newEndTime}</p>
          ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
        </div>
        ${data.isLateReschedule ? '<p style="color: #f44336;"><strong>Note:</strong> This was a late reschedule (less than 24 hours notice).</p>' : ''}
      </div>
    `
  }),

  NEW_APPOINTMENT_REQUEST: (data) => ({
    subject: 'New Appointment Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2196F3;">New Appointment Request</h2>
        <p>Dear ${data.providerName},</p>
        <p>You have received a new appointment request that requires your approval.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Request Details:</h3>
          <p><strong>Appointment ID:</strong> ${data.appointmentId}</p>
          <p><strong>Patient:</strong> ${data.userName}</p>
          <p><strong>Service:</strong> ${data.serviceName}</p>
          <p><strong>Date:</strong> ${new Date(data.date).toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${data.startTime} - ${data.endTime}</p>
          ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ''}
        </div>
        <p>Please log in to your dashboard to approve or reject this request.</p>
      </div>
    `
  })
};

// Process email queue jobs
emailQueue.process(async (job) => {
  const { type, recipientEmail, data } = job.data;
  
  console.log(`Processing email job ${job.id}: ${type} to ${recipientEmail}`);
  
  try {
    const template = emailTemplates[type];
    
    if (!template) {
      throw new Error(`Unknown email template type: ${type}`);
    }
    
    const { subject, html } = template(data);
    
    const mailOptions = {
      from: `"Harmony Booking" <${process.env.SMTP_USER}>`,
      to: recipientEmail,
      subject: subject,
      html: html
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log(`Email sent successfully: ${info.messageId}`);
    
    return {
      success: true,
      messageId: info.messageId,
      type: type,
      recipient: recipientEmail
    };
    
  } catch (error) {
    console.error(`Error sending email (Job ${job.id}):`, error);
    throw error; // Will trigger retry
  }
});

// Process reminder queue jobs
reminderQueue.process(async (job) => {
  const { appointmentId, userEmail, providerEmail, data } = job.data;
  
  console.log(`Processing reminder job ${job.id} for appointment ${appointmentId}`);
  
  try {
    const template = emailTemplates['APPOINTMENT_REMINDER'];
    const { subject, html } = template(data);
    
    // Send to user
    await transporter.sendMail({
      from: `"Harmony Booking" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: subject,
      html: html
    });
    
    // Also send to provider
    const providerHtml = html.replace(data.userName, data.providerName);
    await transporter.sendMail({
      from: `"Harmony Booking" <${process.env.SMTP_USER}>`,
      to: providerEmail,
      subject: 'Reminder: Upcoming Appointment Tomorrow',
      html: providerHtml
    });
    
    console.log(`Reminder sent to both user and provider for appointment ${appointmentId}`);
    
    return {
      success: true,
      appointmentId: appointmentId,
      sentTo: [userEmail, providerEmail]
    };
    
  } catch (error) {
    console.error(`Error sending reminder (Job ${job.id}):`, error);
    throw error;
  }
});

console.log('Email worker initialized and processing jobs...');

module.exports = {
  transporter,
  emailTemplates
};
