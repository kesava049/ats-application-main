import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { getJobUpdateEmailTemplate, getJobDeleteEmailTemplate, getJobCreateEmailTemplate, getJobApplicationEmailTemplate, getNewApplicationNotificationTemplate, getPipelineStatusChangeRecruiterTemplate, getPipelineStatusChangeCandidateTemplate, getInterviewScheduledRecruiterTemplate, getInterviewScheduledCandidateTemplate } from './jobEmailTemplates.js';
import { getTimesheetCreateEmailTemplate, getTimesheetUpdateEmailTemplate, getTimesheetDeleteEmailTemplate, getTimesheetApprovalEmailTemplate } from './timesheetEmailTemplates.js';
import { getCustomerCreateEmailTemplate, getCustomerUpdateEmailTemplate, getCustomerDeleteEmailTemplate } from './customerEmailTemplates.js';
import { getUserCreateEmailTemplate, getUserUpdateEmailTemplate, getUserDeleteEmailTemplate, getUserTypeChangeEmailTemplate } from './userEmailTemplates.js';
dotenv.config();

// Validate email configuration
const validateEmailConfig = () => {
  const requiredVars = ['MAIL_HOST', 'MAIL_PORT', 'MAIL_USERNAME', 'MAIL_PASSWORD', 'MAIL_FROM_NAME', 'MAIL_FROM_ADDRESS'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing email configuration variables:', missingVars.join(', '));
    console.error('Please create a .env file with the following variables:');
    console.error(`
# Email Configuration
MAIL_HOST="smtp.gmail.com"
MAIL_PORT=587
MAIL_USERNAME="your-email@gmail.com"
MAIL_PASSWORD="your-app-password"
MAIL_FROM_NAME="ATS System"
MAIL_FROM_ADDRESS="your-email@gmail.com"
    `);
    return false;
  }
  return true;
};

// Create transporter with error handling
let transporter;
try {
  if (!validateEmailConfig()) {
    throw new Error('Email configuration is incomplete');
  }

  transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT),
    secure: process.env.MAIL_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  // Verify transporter configuration
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ Email transporter verification failed:', error.message);
      console.error('Please check your email configuration in .env file');
    } else {
      console.log('✅ Email transporter is ready to send messages');
    }
  });
} catch (error) {
  console.error('❌ Failed to create email transporter:', error.message);
  transporter = null;
}

// Helper function to check if email service is available
const isEmailServiceAvailable = () => {
  return transporter !== null;
};

// Helper function to send email with error handling
const sendEmailWithErrorHandling = async (mailOptions, emailType = 'email') => {
  if (!transporter) {
    throw new Error('Email service is not configured. Please check your .env file and email configuration.');
  }

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ ${emailType} sent successfully`);
  } catch (error) {
    console.error(`❌ Failed to send ${emailType}:`, error.message);
    throw new Error(`Email sending failed: ${error.message}`);
  }
};

const sendOtpEmail = async (email, otp) => {
  const mailOptions = {
    from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
    to: email,
    subject: "Your OTP Code",
    html: `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; padding: 20px; background-color: #ffffff;">
    <div style="text-align: center;">
      <h1 style="color: #4A00E0; margin-bottom: 10px;">OTP Verification</h1>
      <p style="font-size: 16px; color: #555;">Use the following One-Time Password (OTP) to complete your login/verification process.</p>
      <div style="margin: 30px 0;">
        <span style="display: inline-block; font-size: 28px; letter-spacing: 6px; font-weight: bold; color: #4A00E0;">${otp}</span>
      </div>
      <p style="font-size: 14px; color: #777;">This OTP is valid for <strong>2 minutes</strong>.</p>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">
      <p style="font-size: 13px; color: #999;">If you did not request this code, please ignore this email.</p>
      <p style="font-size: 13px; color: #999;">Regards,<br><strong>${process.env.MAIL_FROM_NAME}</strong></p>
    </div>
  </div>
`,
  };

  await sendEmailWithErrorHandling(mailOptions, `OTP email to ${email}`);
};

// Function to send job creation notification email
const sendJobCreateEmail = async (email, jobData, createInfo) => {
  try {
    const mailOptions = {
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
      to: email,
      subject: `New Job Posting Created: ${jobData.title} at ${jobData.company}`,
      html: getJobCreateEmailTemplate(jobData, createInfo),
    };

    await transporter.sendMail(mailOptions);
    console.log(`Job creation email sent successfully to ${email}`);
  } catch (error) {
    console.error('Error sending job creation email:', error);
    throw error;
  }
};

// Function to send job update notification email
const sendJobUpdateEmail = async (email, jobData, updatedFields, updateInfo) => {
  try {
    // Create subject line with updated fields
    const updatedFieldsText = updatedFields.length > 0 
      ? ` - Updated: ${updatedFields.join(', ')}`
      : '';
    
    const mailOptions = {
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
      to: email,
      subject: `Job Posting Updated: ${jobData.title} at ${jobData.company}${updatedFieldsText}`,
      html: getJobUpdateEmailTemplate(jobData, updatedFields, updateInfo),
    };

    await transporter.sendMail(mailOptions);
    console.log(`Job update email sent successfully to ${email}`);
  } catch (error) {
    console.error('Error sending job update email:', error);
    throw error;
  }
};

// Function to send job deletion notification email
const sendJobDeleteEmail = async (email, jobData, deleteInfo) => {
  try {
    const mailOptions = {
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
      to: email,
      subject: `Job Posting Deleted: ${jobData.title} at ${jobData.company}`,
      html: getJobDeleteEmailTemplate(jobData, deleteInfo),
    };

    await transporter.sendMail(mailOptions);
    console.log(`Job deletion email sent successfully to ${email}`);
  } catch (error) {
    console.error('Error sending job deletion email:', error);
    throw error;
  }
};

// Function to send job application confirmation email
const sendJobApplicationEmail = async (email, applicationData, jobData) => {
  try {
    const mailOptions = {
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
      to: email,
      subject: `Application Received: ${jobData.title} at ${jobData.company}`,
      html: getJobApplicationEmailTemplate(applicationData, jobData),
    };

    await transporter.sendMail(mailOptions);
    console.log(`Job application email sent successfully to ${email}`);
  } catch (error) {
    console.error('Error sending job application email:', error);
    throw error;
  }
};

// Function to send new application notification email to recruiters/HR
const sendNewApplicationNotification = async (email, applicationData, jobData) => {
  try {
    const mailOptions = {
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
      to: email,
      subject: `New Application: ${applicationData.firstName} ${applicationData.lastName} for ${jobData.title}`,
      html: getNewApplicationNotificationTemplate(applicationData, jobData),
    };

    await transporter.sendMail(mailOptions);
    console.log(`New application notification email sent successfully to ${email}`);
  } catch (error) {
    console.error('Error sending new application notification email:', error);
    throw error;
  }
};

// Function to send pipeline status change notification to recruiters/HR
const sendPipelineStatusChangeRecruiterEmail = async (email, candidateData, jobData, oldStatus, newStatus, changeInfo) => {
  try {
    const mailOptions = {
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
      to: email,
      subject: `Pipeline Update: ${candidateData.firstName} ${candidateData.lastName} - ${oldStatus} → ${newStatus}`,
      html: getPipelineStatusChangeRecruiterTemplate(candidateData, jobData, oldStatus, newStatus, changeInfo),
    };

    await transporter.sendMail(mailOptions);
    console.log(`Pipeline status change email sent successfully to recruiter ${email}`);
  } catch (error) {
    console.error('Error sending pipeline status change email to recruiter:', error);
    throw error;
  }
};

// Function to send pipeline status change notification to candidates
const sendPipelineStatusChangeCandidateEmail = async (email, candidateData, jobData, oldStatus, newStatus, changeInfo) => {
  try {
    const mailOptions = {
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
      to: email,
      subject: `Application Status Update: ${jobData.title} at ${jobData.company}`,
      html: getPipelineStatusChangeCandidateTemplate(candidateData, jobData, oldStatus, newStatus, changeInfo),
    };

    await transporter.sendMail(mailOptions);
    console.log(`Pipeline status change email sent successfully to candidate ${email}`);
  } catch (error) {
    console.error('Error sending pipeline status change email to candidate:', error);
    throw error;
  }
};

// Function to send interview scheduled notification to recruiters/HR
const sendInterviewScheduledRecruiterEmail = async (email, interviewData, candidateData, jobData) => {
  try {
    const mailOptions = {
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
      to: email,
      subject: `Interview Scheduled: ${candidateData.firstName} ${candidateData.lastName} for ${jobData.title}`,
      html: getInterviewScheduledRecruiterTemplate(interviewData, candidateData, jobData),
    };

    await transporter.sendMail(mailOptions);
    console.log(`Interview scheduled email sent successfully to recruiter ${email}`);
  } catch (error) {
    console.error('Error sending interview scheduled email to recruiter:', error);
    throw error;
  }
};

// Function to send interview scheduled notification to candidates
const sendInterviewScheduledCandidateEmail = async (email, interviewData, candidateData, jobData) => {
  try {
    const mailOptions = {
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
      to: email,
      subject: `Interview Scheduled: ${jobData.title} at ${jobData.company}`,
      html: getInterviewScheduledCandidateTemplate(interviewData, candidateData, jobData),
    };

    await transporter.sendMail(mailOptions);
    console.log(`Interview scheduled email sent successfully to candidate ${email}`);
  } catch (error) {
    console.error('Error sending interview scheduled email to candidate:', error);
    throw error;
  }
};

// Function to send timesheet creation notification email
const sendTimesheetCreateEmail = async (email, timesheetData, createInfo) => {
  try {
    const mailOptions = {
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
      to: email,
      subject: `New Timesheet Entry Created: ${timesheetData.recruiterName} - ${timesheetData.taskType}`,
      html: getTimesheetCreateEmailTemplate(timesheetData, createInfo),
    };

    await transporter.sendMail(mailOptions);
    console.log(`Timesheet creation email sent successfully to ${email}`);
  } catch (error) {
    console.error('Error sending timesheet creation email:', error);
    throw error;
  }
};

// Function to send timesheet update notification email
const sendTimesheetUpdateEmail = async (email, timesheetData, updatedFields, updateInfo) => {
  try {
    // Create subject line with updated fields
    const updatedFieldsText = updatedFields.length > 0 
      ? ` - Updated: ${updatedFields.join(', ')}`
      : '';
    
    const mailOptions = {
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
      to: email,
      subject: `Timesheet Entry Updated: ${timesheetData.recruiterName} - ${timesheetData.taskType}${updatedFieldsText}`,
      html: getTimesheetUpdateEmailTemplate(timesheetData, updatedFields, updateInfo),
    };

    await transporter.sendMail(mailOptions);
    console.log(`Timesheet update email sent successfully to ${email}`);
  } catch (error) {
    console.error('Error sending timesheet update email:', error);
    throw error;
  }
};

// Function to send timesheet deletion notification email
const sendTimesheetDeleteEmail = async (email, timesheetData, deleteInfo) => {
  try {
    const mailOptions = {
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
      to: email,
      subject: `Timesheet Entry Deleted: ${timesheetData.recruiterName} - ${timesheetData.taskType}`,
      html: getTimesheetDeleteEmailTemplate(timesheetData, deleteInfo),
    };

    await transporter.sendMail(mailOptions);
    console.log(`Timesheet deletion email sent successfully to ${email}`);
  } catch (error) {
    console.error('Error sending timesheet deletion email:', error);
    throw error;
  }
};

// Function to send timesheet approval notification email
const sendTimesheetApprovalEmail = async (email, timesheetData, approvalInfo) => {
  try {
    const mailOptions = {
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
      to: email,
      subject: `Timesheet Entry Approved: ${timesheetData.recruiterName} - ${timesheetData.taskType}`,
      html: getTimesheetApprovalEmailTemplate(timesheetData, approvalInfo),
    };

    await transporter.sendMail(mailOptions);
    console.log(`Timesheet approval email sent successfully to ${email}`);
  } catch (error) {
    console.error('Error sending timesheet approval email:', error);
    throw error;
  }
};

// Customer email functions
const sendCustomerCreateEmail = async (email, customerData, createInfo) => {
  try {
    const mailOptions = {
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
      to: email,
      subject: `Welcome to Our Platform: ${customerData.companyName}`,
      html: getCustomerCreateEmailTemplate(customerData, createInfo),
    };

    await transporter.sendMail(mailOptions);
    console.log(`Customer creation email sent successfully to ${email}`);
  } catch (error) {
    console.error('Error sending customer creation email:', error);
    throw error;
  }
};

const sendCustomerUpdateEmail = async (email, customerData, updatedFields, updateInfo) => {
  try {
    const updatedFieldsText = updatedFields.length > 0 
      ? ` - Updated: ${updatedFields.join(', ')}`
      : '';
    
    const mailOptions = {
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
      to: email,
      subject: `Account Update: ${customerData.companyName}${updatedFieldsText}`,
      html: getCustomerUpdateEmailTemplate(customerData, updatedFields, updateInfo),
    };

    await transporter.sendMail(mailOptions);
    console.log(`Customer update email sent successfully to ${email}`);
  } catch (error) {
    console.error('Error sending customer update email:', error);
    throw error;
  }
};

const sendCustomerDeleteEmail = async (email, customerData, deleteInfo) => {
  try {
    const mailOptions = {
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
      to: email,
      subject: `Account Deletion Confirmation: ${customerData.companyName}`,
      html: getCustomerDeleteEmailTemplate(customerData, deleteInfo),
    };

    await transporter.sendMail(mailOptions);
    console.log(`Customer deletion email sent successfully to ${email}`);
  } catch (error) {
    console.error('Error sending customer deletion email:', error);
    throw error;
  }
};

// User management email functions
const sendUserCreateEmail = async (email, userData, createInfo) => {
  try {
    const mailOptions = {
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
      to: email,
      subject: `Welcome to Our Platform: ${userData.name}`,
      html: getUserCreateEmailTemplate(userData, createInfo),
    };

    await transporter.sendMail(mailOptions);
    console.log(`User creation email sent successfully to ${email}`);
  } catch (error) {
    console.error('Error sending user creation email:', error);
    throw error;
  }
};

const sendUserUpdateEmail = async (email, userData, updatedFields, updateInfo) => {
  try {
    const updatedFieldsText = updatedFields.length > 0 
      ? ` - Updated: ${updatedFields.join(', ')}`
      : '';
    
    const mailOptions = {
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
      to: email,
      subject: `Account Updated: ${userData.name}${updatedFieldsText}`,
      html: getUserUpdateEmailTemplate(userData, updatedFields, updateInfo),
    };

    await transporter.sendMail(mailOptions);
    console.log(`User update email sent successfully to ${email}`);
  } catch (error) {
    console.error('Error sending user update email:', error);
    throw error;
  }
};

const sendUserDeleteEmail = async (email, userData, deleteInfo) => {
  try {
    const mailOptions = {
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
      to: email,
      subject: `Account Deletion Confirmation: ${userData.name}`,
      html: getUserDeleteEmailTemplate(userData, deleteInfo),
    };

    await transporter.sendMail(mailOptions);
    console.log(`User deletion email sent successfully to ${email}`);
  } catch (error) {
    console.error('Error sending user deletion email:', error);
    throw error;
  }
};

const sendUserTypeChangeEmail = async (email, userData, oldUserType, newUserType, changeInfo) => {
  try {
    const mailOptions = {
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
      to: email,
      subject: `Role Update: ${userData.name} - ${oldUserType} → ${newUserType}`,
      html: getUserTypeChangeEmailTemplate(userData, oldUserType, newUserType, changeInfo),
    };

    await transporter.sendMail(mailOptions);
    console.log(`User type change email sent successfully to ${email}`);
  } catch (error) {
    console.error('Error sending user type change email:', error);
    throw error;
  }
};

export { 
  sendOtpEmail, 
  sendJobCreateEmail, 
  sendJobUpdateEmail, 
  sendJobDeleteEmail, 
  sendJobApplicationEmail, 
  sendNewApplicationNotification, 
  sendPipelineStatusChangeRecruiterEmail, 
  sendPipelineStatusChangeCandidateEmail, 
  sendInterviewScheduledRecruiterEmail, 
  sendInterviewScheduledCandidateEmail, 
  sendTimesheetCreateEmail, 
  sendTimesheetUpdateEmail, 
  sendTimesheetDeleteEmail, 
  sendTimesheetApprovalEmail, 
  sendCustomerCreateEmail, 
  sendCustomerUpdateEmail, 
  sendCustomerDeleteEmail, 
  sendUserCreateEmail, 
  sendUserUpdateEmail, 
  sendUserDeleteEmail, 
  sendUserTypeChangeEmail,
  isEmailServiceAvailable,
  sendEmailWithErrorHandling
};
export default sendOtpEmail;
