// Timesheet email templates for notifications

const formatDateTime = (date) => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Timesheet Creation Email Template
export const getTimesheetCreateEmailTemplate = (timesheetData, createInfo) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Timesheet Entry Created</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      
      <!-- Header -->
      <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h1 style="color: #27ae60; margin: 0 0 10px 0; font-size: 24px;">New Timesheet Entry Created</h1>
        <p style="color: #7f8c8d; margin: 0; font-size: 16px;">A new timesheet entry has been successfully created</p>
      </div>

      <!-- Creation Details -->
      <div style="background-color: #ffffff; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">Creation Information</h2>
        
        <div style="margin-bottom: 15px;">
          <strong style="color: #34495e;">Created By:</strong> ${createInfo.createdBy}
        </div>
        
        <div style="margin-bottom: 15px;">
          <strong style="color: #34495e;">Created At:</strong> ${formatDateTime(createInfo.createdAt)}
        </div>
        
        <div style="margin-bottom: 15px;">
          <strong style="color: #34495e;">Creation Reason:</strong> ${createInfo.reason}
        </div>
        
        <div style="margin-bottom: 15px;">
          <strong style="color: #34495e;">Timesheet ID:</strong> ${createInfo.timesheetId}
        </div>
      </div>

      <!-- Timesheet Details -->
      <div style="background-color: #ffffff; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">Timesheet Details</h2>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Recruiter Name:</strong> ${timesheetData.recruiterName}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Recruiter Email:</strong> ${timesheetData.recruiterEmail || 'Not specified'}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Date:</strong> ${formatDate(timesheetData.date)}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Start Time:</strong> ${timesheetData.startTime || 'Not specified'}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">End Time:</strong> ${timesheetData.endTime || 'Not specified'}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Hours:</strong> ${timesheetData.hours} hours
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Break Time:</strong> ${timesheetData.breakTime ? timesheetData.breakTime + ' hours' : 'Not specified'}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Entity Type:</strong> ${timesheetData.entityType}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Entity Name:</strong> ${timesheetData.entityName || 'Not specified'}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Company Name:</strong> ${timesheetData.companyName || 'Not specified'}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Task Type:</strong> ${timesheetData.taskType}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Task Category:</strong> ${timesheetData.taskCategory}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Priority:</strong> ${timesheetData.priority}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Billable:</strong> ${timesheetData.billable ? 'Yes' : 'No'}
        </div>
        
        ${timesheetData.billableRate ? `
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Billable Rate:</strong> $${timesheetData.billableRate}/hour
        </div>
        ` : ''}
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Status:</strong> ${timesheetData.status}
        </div>
        
        ${timesheetData.comments ? `
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Comments:</strong> ${timesheetData.comments}
        </div>
        ` : ''}
      </div>

      <!-- Footer -->
      <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <p style="color: #7f8c8d; margin: 0; font-size: 14px;">
          This is an automated notification from your ATS system.<br>
          Timesheet ID: ${timesheetData.id} | Created: ${formatDateTime(createInfo.createdAt)}
        </p>
      </div>
      
    </body>
    </html>
  `;
};

// Timesheet Update Email Template
export const getTimesheetUpdateEmailTemplate = (timesheetData, updatedFields, updateInfo) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Timesheet Entry Updated</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      
      <!-- Header -->
      <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h1 style="color: #2c3e50; margin: 0 0 10px 0; font-size: 24px;">Timesheet Entry Updated</h1>
        <p style="color: #7f8c8d; margin: 0; font-size: 16px;">Your timesheet entry has been successfully updated</p>
      </div>

      <!-- Update Details -->
      <div style="background-color: #ffffff; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">Update Information</h2>
        
        <div style="margin-bottom: 15px;">
          <strong style="color: #34495e;">Updated By:</strong> ${updateInfo.updatedBy}
        </div>
        
        <div style="margin-bottom: 15px;">
          <strong style="color: #34495e;">Updated At:</strong> ${formatDateTime(updateInfo.updatedAt)}
        </div>
        
        <div style="margin-bottom: 15px;">
          <strong style="color: #34495e;">Update Reason:</strong> ${updateInfo.reason}
        </div>
        
        <div style="margin-bottom: 15px;">
          <strong style="color: #34495e;">Timesheet ID:</strong> ${updateInfo.timesheetId}
        </div>
      </div>

      <!-- Updated Fields -->
      <div style="background-color: #ffffff; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">Fields Updated (${updatedFields.length})</h2>
        <ul style="margin: 0; padding-left: 20px;">
          ${updatedFields.map(field => `<li style="margin-bottom: 5px; color: #2c3e50;">${field}</li>`).join('')}
        </ul>
      </div>

      <!-- Timesheet Details -->
      <div style="background-color: #ffffff; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">Timesheet Details</h2>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Recruiter Name:</strong> ${timesheetData.recruiterName}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Recruiter Email:</strong> ${timesheetData.recruiterEmail || 'Not specified'}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Date:</strong> ${formatDate(timesheetData.date)}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Start Time:</strong> ${timesheetData.startTime || 'Not specified'}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">End Time:</strong> ${timesheetData.endTime || 'Not specified'}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Hours:</strong> ${timesheetData.hours} hours
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Break Time:</strong> ${timesheetData.breakTime ? timesheetData.breakTime + ' hours' : 'Not specified'}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Entity Type:</strong> ${timesheetData.entityType}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Entity Name:</strong> ${timesheetData.entityName || 'Not specified'}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Company Name:</strong> ${timesheetData.companyName || 'Not specified'}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Task Type:</strong> ${timesheetData.taskType}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Task Category:</strong> ${timesheetData.taskCategory}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Priority:</strong> ${timesheetData.priority}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Billable:</strong> ${timesheetData.billable ? 'Yes' : 'No'}
        </div>
        
        ${timesheetData.billableRate ? `
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Billable Rate:</strong> $${timesheetData.billableRate}/hour
        </div>
        ` : ''}
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Status:</strong> ${timesheetData.status}
        </div>
        
        ${timesheetData.comments ? `
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Comments:</strong> ${timesheetData.comments}
        </div>
        ` : ''}
      </div>

      <!-- Footer -->
      <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <p style="color: #7f8c8d; margin: 0; font-size: 14px;">
          This is an automated notification from your ATS system.<br>
          Timesheet ID: ${timesheetData.id} | Updated: ${formatDateTime(updateInfo.updatedAt)}
        </p>
      </div>
      
    </body>
    </html>
  `;
};

// Timesheet Delete Email Template
export const getTimesheetDeleteEmailTemplate = (timesheetData, deleteInfo) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Timesheet Entry Deleted</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      
      <!-- Header -->
      <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h1 style="color: #e74c3c; margin: 0 0 10px 0; font-size: 24px;">Timesheet Entry Deleted</h1>
        <p style="color: #7f8c8d; margin: 0; font-size: 16px;">A timesheet entry has been permanently removed from the system</p>
      </div>

      <!-- Deletion Details -->
      <div style="background-color: #ffffff; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">Deletion Information</h2>
        
        <div style="margin-bottom: 15px;">
          <strong style="color: #34495e;">Deleted By:</strong> ${deleteInfo.deletedBy}
        </div>
        
        <div style="margin-bottom: 15px;">
          <strong style="color: #34495e;">Deleted At:</strong> ${formatDateTime(deleteInfo.deletedAt)}
        </div>
        
        <div style="margin-bottom: 15px;">
          <strong style="color: #34495e;">Deletion Reason:</strong> ${deleteInfo.reason}
        </div>
        
        <div style="margin-bottom: 15px;">
          <strong style="color: #34495e;">Timesheet ID:</strong> ${deleteInfo.timesheetId}
        </div>
      </div>

      <!-- Deleted Timesheet Details -->
      <div style="background-color: #ffffff; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">Deleted Timesheet Details</h2>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Recruiter Name:</strong> ${timesheetData.recruiterName}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Recruiter Email:</strong> ${timesheetData.recruiterEmail || 'Not specified'}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Date:</strong> ${formatDate(timesheetData.date)}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Start Time:</strong> ${timesheetData.startTime || 'Not specified'}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">End Time:</strong> ${timesheetData.endTime || 'Not specified'}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Hours:</strong> ${timesheetData.hours} hours
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Break Time:</strong> ${timesheetData.breakTime ? timesheetData.breakTime + ' hours' : 'Not specified'}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Entity Type:</strong> ${timesheetData.entityType}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Entity Name:</strong> ${timesheetData.entityName || 'Not specified'}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Company Name:</strong> ${timesheetData.companyName || 'Not specified'}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Task Type:</strong> ${timesheetData.taskType}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Task Category:</strong> ${timesheetData.taskCategory}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Priority:</strong> ${timesheetData.priority}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Billable:</strong> ${timesheetData.billable ? 'Yes' : 'No'}
        </div>
        
        ${timesheetData.billableRate ? `
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Billable Rate:</strong> $${timesheetData.billableRate}/hour
        </div>
        ` : ''}
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Status:</strong> ${timesheetData.status}
        </div>
        
        ${timesheetData.comments ? `
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Comments:</strong> ${timesheetData.comments}
        </div>
        ` : ''}
      </div>

      <!-- Warning -->
      <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #856404; margin: 0 0 10px 0; font-size: 16px;">⚠️ Important Notice</h3>
        <p style="color: #856404; margin: 0; font-size: 14px;">
          This timesheet entry has been permanently deleted from the system. 
          All associated data including attachments and approval records have been removed.
        </p>
      </div>

      <!-- Footer -->
      <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <p style="color: #7f8c8d; margin: 0; font-size: 14px;">
          This is an automated notification from your ATS system.<br>
          Timesheet ID: ${timesheetData.id} | Deleted: ${formatDateTime(deleteInfo.deletedAt)}
        </p>
      </div>
      
    </body>
    </html>
  `;
};

// Timesheet Approval Email Template
export const getTimesheetApprovalEmailTemplate = (timesheetData, approvalInfo) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Timesheet Entry Approved</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      
      <!-- Header -->
      <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h1 style="color: #27ae60; margin: 0 0 10px 0; font-size: 24px;">Timesheet Entry Approved</h1>
        <p style="color: #7f8c8d; margin: 0; font-size: 16px;">Your timesheet entry has been approved</p>
      </div>

      <!-- Approval Details -->
      <div style="background-color: #ffffff; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">Approval Information</h2>
        
        <div style="margin-bottom: 15px;">
          <strong style="color: #34495e;">Approved By:</strong> ${approvalInfo.approvedBy}
        </div>
        
        <div style="margin-bottom: 15px;">
          <strong style="color: #34495e;">Approved At:</strong> ${formatDateTime(approvalInfo.approvedAt)}
        </div>
        
        <div style="margin-bottom: 15px;">
          <strong style="color: #34495e;">Timesheet ID:</strong> ${approvalInfo.timesheetId}
        </div>
      </div>

      <!-- Timesheet Details -->
      <div style="background-color: #ffffff; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">Timesheet Details</h2>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Recruiter Name:</strong> ${timesheetData.recruiterName}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Recruiter Email:</strong> ${timesheetData.recruiterEmail || 'Not specified'}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Date:</strong> ${formatDate(timesheetData.date)}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Start Time:</strong> ${timesheetData.startTime || 'Not specified'}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">End Time:</strong> ${timesheetData.endTime || 'Not specified'}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Hours:</strong> ${timesheetData.hours} hours
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Break Time:</strong> ${timesheetData.breakTime ? timesheetData.breakTime + ' hours' : 'Not specified'}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Entity Type:</strong> ${timesheetData.entityType}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Entity Name:</strong> ${timesheetData.entityName || 'Not specified'}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Company Name:</strong> ${timesheetData.companyName || 'Not specified'}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Task Type:</strong> ${timesheetData.taskType}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Task Category:</strong> ${timesheetData.taskCategory}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Priority:</strong> ${timesheetData.priority}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Billable:</strong> ${timesheetData.billable ? 'Yes' : 'No'}
        </div>
        
        ${timesheetData.billableRate ? `
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Billable Rate:</strong> $${timesheetData.billableRate}/hour
        </div>
        ` : ''}
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Status:</strong> <span style="color: #27ae60; font-weight: bold;">${timesheetData.status}</span>
        </div>
        
        ${timesheetData.comments ? `
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Comments:</strong> ${timesheetData.comments}
        </div>
        ` : ''}
      </div>

      <!-- Footer -->
      <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <p style="color: #7f8c8d; margin: 0; font-size: 14px;">
          This is an automated notification from your ATS system.<br>
          Timesheet ID: ${timesheetData.id} | Approved: ${formatDateTime(approvalInfo.approvedAt)}
        </p>
      </div>
      
    </body>
    </html>
  `;
};
