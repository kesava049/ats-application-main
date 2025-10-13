// Simple and clean email templates for job notifications

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

// Job Creation Email Template
export const getJobCreateEmailTemplate = (jobData, createInfo) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Job Posting Created</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      
      <!-- Header -->
      <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h1 style="color: #27ae60; margin: 0 0 10px 0; font-size: 24px;">New Job Posting Created</h1>
        <p style="color: #7f8c8d; margin: 0; font-size: 16px;">A new job posting has been successfully created</p>
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
          <strong style="color: #34495e;">Job ID:</strong> ${createInfo.jobId}
        </div>
      </div>

      <!-- Job Details -->
      <div style="background-color: #ffffff; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">Job Details</h2>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Job Title:</strong> ${jobData.title}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Company:</strong> ${jobData.company}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Department:</strong> ${jobData.department || 'Not specified'}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Location:</strong> ${jobData.city}, ${jobData.country}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Work Type:</strong> ${jobData.workType}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Job Type:</strong> ${jobData.jobType}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Experience Level:</strong> ${jobData.experienceLevel}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Salary Range:</strong> $${jobData.salaryMin?.toLocaleString()} - $${jobData.salaryMax?.toLocaleString()}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Job Status:</strong> ${jobData.jobStatus}
        </div>
      </div>

      <!-- Contact Information -->
      <div style="background-color: #ffffff; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">Contact Information</h2>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Internal SPOC:</strong> ${jobData.internalSPOC || 'Not specified'}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Recruiter:</strong> ${jobData.recruiter || 'Not specified'}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Email:</strong> ${jobData.email || 'Not specified'}
        </div>
      </div>

      <!-- Footer -->
      <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <p style="color: #7f8c8d; margin: 0; font-size: 14px;">
          This is an automated notification from your ATS system.<br>
          Job ID: ${jobData.id} | Created: ${formatDateTime(createInfo.createdAt)}
        </p>
      </div>
      
    </body>
    </html>
  `;
};

// Job Update Email Template
export const getJobUpdateEmailTemplate = (jobData, updatedFields, updateInfo) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Job Posting Updated</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      
      <!-- Header -->
      <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h1 style="color: #2c3e50; margin: 0 0 10px 0; font-size: 24px;">Job Posting Updated</h1>
        <p style="color: #7f8c8d; margin: 0; font-size: 16px;">Your job posting has been successfully updated</p>
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
          <strong style="color: #34495e;">Job ID:</strong> ${updateInfo.jobId}
        </div>
      </div>

      <!-- Updated Fields -->
      <div style="background-color: #ffffff; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">Fields Updated (${updatedFields.length})</h2>
        <ul style="margin: 0; padding-left: 20px;">
          ${updatedFields.map(field => `<li style="margin-bottom: 5px; color: #2c3e50;">${field}</li>`).join('')}
        </ul>
      </div>

      <!-- Job Details -->
      <div style="background-color: #ffffff; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">Job Details</h2>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Job Title:</strong> ${jobData.title}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Company:</strong> ${jobData.company}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Department:</strong> ${jobData.department || 'Not specified'}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Location:</strong> ${jobData.city}, ${jobData.country}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Work Type:</strong> ${jobData.workType}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Job Type:</strong> ${jobData.jobType}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Experience Level:</strong> ${jobData.experienceLevel}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Salary Range:</strong> $${jobData.salaryMin?.toLocaleString()} - $${jobData.salaryMax?.toLocaleString()}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Job Status:</strong> ${jobData.jobStatus}
        </div>
      </div>

      <!-- Contact Information -->
      <div style="background-color: #ffffff; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">Contact Information</h2>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Internal SPOC:</strong> ${jobData.internalSPOC || 'Not specified'}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Recruiter:</strong> ${jobData.recruiter || 'Not specified'}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Email:</strong> ${jobData.email || 'Not specified'}
        </div>
      </div>

      <!-- Footer -->
      <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <p style="color: #7f8c8d; margin: 0; font-size: 14px;">
          This is an automated notification from your ATS system.<br>
          Job ID: ${jobData.id} | Updated: ${formatDateTime(updateInfo.updatedAt)}
        </p>
      </div>
      
    </body>
    </html>
  `;
};

// Job Delete Email Template
export const getJobDeleteEmailTemplate = (jobData, deleteInfo) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Job Posting Deleted</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      
      <!-- Header -->
      <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h1 style="color: #e74c3c; margin: 0 0 10px 0; font-size: 24px;">Job Posting Deleted</h1>
        <p style="color: #7f8c8d; margin: 0; font-size: 16px;">A job posting has been permanently removed from the system</p>
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
          <strong style="color: #34495e;">Job ID:</strong> ${deleteInfo.jobId}
        </div>
      </div>

      <!-- Deleted Job Details -->
      <div style="background-color: #ffffff; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">Deleted Job Details</h2>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Job Title:</strong> ${jobData.title}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Company:</strong> ${jobData.company}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Department:</strong> ${jobData.department || 'Not specified'}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Location:</strong> ${jobData.city}, ${jobData.country}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Work Type:</strong> ${jobData.workType}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Job Type:</strong> ${jobData.jobType}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Experience Level:</strong> ${jobData.experienceLevel}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Salary Range:</strong> $${jobData.salaryMin?.toLocaleString()} - $${jobData.salaryMax?.toLocaleString()}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Job Status:</strong> ${jobData.jobStatus}
        </div>
      </div>

      <!-- Contact Information -->
      <div style="background-color: #ffffff; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">Contact Information</h2>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Internal SPOC:</strong> ${jobData.internalSPOC || 'Not specified'}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Recruiter:</strong> ${jobData.recruiter || 'Not specified'}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Email:</strong> ${jobData.email || 'Not specified'}
        </div>
      </div>

      <!-- Warning -->
      <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #856404; margin: 0 0 10px 0; font-size: 16px;">⚠️ Important Notice</h3>
        <p style="color: #856404; margin: 0; font-size: 14px;">
          This job posting has been permanently deleted from the system. 
          All associated data including applications, candidates, and job details have been removed.
        </p>
      </div>

      <!-- Footer -->
      <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <p style="color: #7f8c8d; margin: 0; font-size: 14px;">
          This is an automated notification from your ATS system.<br>
          Job ID: ${jobData.id} | Deleted: ${formatDateTime(deleteInfo.deletedAt)}
        </p>
      </div>
      
    </body>
    </html>
  `;
};

// Job Application Email Template
export const getJobApplicationEmailTemplate = (applicationData, jobData) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Application Received</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      
      <!-- Header -->
      <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h1 style="color: #2c3e50; margin: 0 0 10px 0; font-size: 24px;">Application Received</h1>
        <p style="color: #7f8c8d; margin: 0; font-size: 16px;">Thank you for applying to ${jobData.company}</p>
      </div>

      <!-- Application Details -->
      <div style="background-color: #ffffff; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h2 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">Application Summary</h2>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Application ID:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${applicationData.id}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Applied On:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${formatDateTime(applicationData.appliedAt)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Status:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><span style="color: #f39c12; font-weight: bold;">Under Review</span></td>
          </tr>
        </table>
      </div>

      <!-- Job Details -->
      <div style="background-color: #ffffff; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h2 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">Position Details</h2>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Job Title:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${jobData.title}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Company:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${jobData.company}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Location:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${jobData.city}, ${jobData.country}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Work Type:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${jobData.workType}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Experience Level:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${jobData.experienceLevel}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Salary Range:</strong></td>
            <td style="padding: 8px 0;">$${jobData.salaryMin?.toLocaleString()} - $${jobData.salaryMax?.toLocaleString()}</td>
          </tr>
        </table>
      </div>

      <!-- Your Information -->
      <div style="background-color: #ffffff; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h2 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">Your Information</h2>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Name:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${applicationData.firstName} ${applicationData.lastName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Email:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${applicationData.email}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Phone:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${applicationData.phone}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Location:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${applicationData.currentLocation}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Experience:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${applicationData.yearsOfExperience} years</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Salary Expectation:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">$${applicationData.salaryExpectation?.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Notice Period:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${applicationData.noticePeriod}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Remote Work:</strong></td>
            <td style="padding: 8px 0;">${applicationData.remoteWork ? 'Yes' : 'No'}</td>
          </tr>
        </table>
      </div>

      <!-- Key Skills -->
      <div style="background-color: #ffffff; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h2 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">Key Skills</h2>
        <p style="color: #2c3e50; margin: 0; line-height: 1.6;">${applicationData.keySkills}</p>
      </div>

      <!-- Next Steps -->
      <div style="background-color: #e8f5e8; border: 1px solid #27ae60; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #27ae60; margin: 0 0 10px 0; font-size: 16px;">What Happens Next?</h3>
        <ul style="color: #2c3e50; margin: 0; padding-left: 20px; font-size: 14px;">
          <li style="margin-bottom: 5px;">Our team will review your application within 2-3 business days</li>
          <li style="margin-bottom: 5px;">If selected, you'll receive an email for the next round</li>
          <li style="margin-bottom: 0;">We'll keep you updated on your application status</li>
        </ul>
      </div>

      <!-- Contact -->
      <div style="background-color: #ffffff; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h2 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">Contact Information</h2>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Recruiter:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${jobData.recruiter || 'Not specified'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Email:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${jobData.email || 'Not specified'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Internal SPOC:</strong></td>
            <td style="padding: 8px 0;">${jobData.internalSPOC || 'Not specified'}</td>
          </tr>
        </table>
      </div>

      <!-- Footer -->
      <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <p style="color: #7f8c8d; margin: 0; font-size: 14px;">
          Thank you for your interest in ${jobData.company}!<br>
          Application ID: ${applicationData.id} | Applied: ${formatDateTime(applicationData.appliedAt)}
        </p>
      </div>
      
    </body>
    </html>
  `;
};

// New Job Application Notification Email Template (for recruiters/HR)
export const getNewApplicationNotificationTemplate = (applicationData, jobData) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Job Application</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      
      <!-- Header -->
      <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-left: 4px solid #3498db;">
        <h1 style="color: #3498db; margin: 0 0 10px 0; font-size: 24px;">New Application Received</h1>
        <p style="color: #7f8c8d; margin: 0; font-size: 16px;">A candidate has applied for your job posting</p>
      </div>

      <!-- Quick Summary -->
      <div style="background-color: #e3f2fd; border: 1px solid #2196f3; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #1976d2; margin: 0 0 10px 0; font-size: 16px;">Quick Summary</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 5px 0;"><strong>Candidate:</strong></td>
            <td style="padding: 5px 0;">${applicationData.firstName} ${applicationData.lastName}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0;"><strong>Position:</strong></td>
            <td style="padding: 5px 0;">${jobData.title}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0;"><strong>Experience:</strong></td>
            <td style="padding: 5px 0;">${applicationData.yearsOfExperience} years</td>
          </tr>
          <tr>
            <td style="padding: 5px 0;"><strong>Expected Salary:</strong></td>
            <td style="padding: 5px 0;">$${applicationData.salaryExpectation?.toLocaleString()}</td>
          </tr>
        </table>
      </div>

      <!-- Application Details -->
      <div style="background-color: #ffffff; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h2 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">Application Details</h2>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Application ID:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${applicationData.id}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Applied On:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${formatDateTime(applicationData.appliedAt)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Status:</strong></td>
            <td style="padding: 8px 0;"><span style="color: #f39c12; font-weight: bold;">Pending Review</span></td>
          </tr>
        </table>
      </div>

      <!-- Candidate Profile -->
      <div style="background-color: #ffffff; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h2 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">Candidate Profile</h2>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Full Name:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${applicationData.firstName} ${applicationData.lastName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Email:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><a href="mailto:${applicationData.email}" style="color: #3498db;">${applicationData.email}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Phone:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><a href="tel:${applicationData.phone}" style="color: #3498db;">${applicationData.phone}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Location:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${applicationData.currentLocation}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Years of Experience:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${applicationData.yearsOfExperience} years</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Salary Expectation:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">$${applicationData.salaryExpectation?.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Notice Period:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${applicationData.noticePeriod}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Remote Work:</strong></td>
            <td style="padding: 8px 0;">${applicationData.remoteWork ? 'Yes' : 'No'}</td>
          </tr>
        </table>
      </div>

      <!-- Key Skills -->
      <div style="background-color: #ffffff; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h2 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">Key Skills</h2>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; border-left: 3px solid #3498db;">
          <p style="color: #2c3e50; margin: 0; line-height: 1.6;">${applicationData.keySkills}</p>
        </div>
      </div>

      <!-- Cover Letter Preview -->
      <div style="background-color: #ffffff; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h2 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">Cover Letter Preview</h2>
        <div style="color: #2c3e50; line-height: 1.6; white-space: pre-wrap; max-height: 200px; overflow-y: auto; border: 1px solid #e0e0e0; padding: 15px; border-radius: 4px; background-color: #f8f9fa;">
          ${applicationData.coverLetter.length > 300 ? applicationData.coverLetter.substring(0, 300) + '...' : applicationData.coverLetter}
        </div>
        ${applicationData.coverLetter.length > 300 ? '<p style="color: #7f8c8d; font-size: 12px; margin: 5px 0 0 0;">(Preview truncated - view full cover letter in ATS system)</p>' : ''}
      </div>

      <!-- Job Details -->
      <div style="background-color: #ffffff; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h2 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">Your Job Posting</h2>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Job Title:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${jobData.title}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Company:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${jobData.company}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Location:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${jobData.city}, ${jobData.country}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Work Type:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${jobData.workType}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Experience Level:</strong></td>
            <td style="padding: 8px 0;">${jobData.experienceLevel}</td>
          </tr>
        </table>
      </div>

      <!-- Action Required -->
      <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #856404; margin: 0 0 10px 0; font-size: 16px;">Required Actions</h3>
        <ul style="color: #856404; margin: 0; padding-left: 20px; font-size: 14px;">
          <li style="margin-bottom: 5px;">Review the candidate's application and resume</li>
          <li style="margin-bottom: 5px;">Check if skills match your requirements</li>
          <li style="margin-bottom: 5px;">Update application status in ATS system</li>
          <li style="margin-bottom: 0;">Contact candidate if shortlisted for interview</li>
        </ul>
      </div>

      <!-- Footer -->
      <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <p style="color: #7f8c8d; margin: 0; font-size: 14px;">
          This is an automated notification from your ATS system.<br>
          Application ID: ${applicationData.id} | Job ID: ${jobData.id} | Received: ${formatDateTime(applicationData.appliedAt)}
        </p>
      </div>
      
    </body>
    </html>
  `;
};

// Pipeline Status Change Email Template (for Job Posters/Recruiters)
export const getPipelineStatusChangeRecruiterTemplate = (candidateData, jobData, oldStatus, newStatus, changeInfo) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Pipeline Status Updated</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      
      <!-- Header -->
      <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-left: 4px solid #3498db;">
        <h1 style="color: #3498db; margin: 0 0 10px 0; font-size: 24px;">Pipeline Status Updated</h1>
        <p style="color: #7f8c8d; margin: 0; font-size: 16px;">A candidate's status has been updated in your pipeline</p>
      </div>

      <!-- Status Change Summary -->
      <div style="background-color: #e8f4fd; border: 1px solid #3498db; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #1976d2; margin: 0 0 15px 0; font-size: 18px;">Status Change Summary</h3>
        
        <div style="display: flex; align-items: center; margin-bottom: 15px;">
          <div style="flex: 1; text-align: center; padding: 10px; background-color: #fff; border-radius: 4px; margin-right: 10px;">
            <div style="font-size: 12px; color: #7f8c8d; margin-bottom: 5px;">Previous Status</div>
            <div style="font-weight: bold; color: #e74c3c;">${oldStatus}</div>
          </div>
          <div style="font-size: 20px; color: #3498db; margin: 0 10px;">→</div>
          <div style="flex: 1; text-align: center; padding: 10px; background-color: #fff; border-radius: 4px; margin-left: 10px;">
            <div style="font-size: 12px; color: #7f8c8d; margin-bottom: 5px;">New Status</div>
            <div style="font-weight: bold; color: #27ae60;">${newStatus}</div>
          </div>
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Updated By:</strong> ${changeInfo.updatedBy}
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Updated At:</strong> ${formatDateTime(changeInfo.updatedAt)}
        </div>
        
        ${changeInfo.reason ? `<div style="margin-bottom: 10px;"><strong style="color: #34495e;">Reason:</strong> ${changeInfo.reason}</div>` : ''}
      </div>

      <!-- Candidate Information -->
      <div style="background-color: #ffffff; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h2 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">Candidate Information</h2>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Name:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${candidateData.firstName} ${candidateData.lastName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Email:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><a href="mailto:${candidateData.email}" style="color: #3498db;">${candidateData.email}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Phone:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><a href="tel:${candidateData.phone}" style="color: #3498db;">${candidateData.phone}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Location:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${candidateData.currentLocation}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Experience:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${candidateData.yearsOfExperience} years</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Expected Salary:</strong></td>
            <td style="padding: 8px 0;">$${candidateData.salaryExpectation?.toLocaleString()}</td>
          </tr>
        </table>
      </div>

      <!-- Job Information -->
      <div style="background-color: #ffffff; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h2 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">Job Information</h2>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Job Title:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${jobData.title}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Company:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${jobData.company}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Location:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${jobData.city}, ${jobData.country}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Work Type:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${jobData.workType}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Experience Level:</strong></td>
            <td style="padding: 8px 0;">${jobData.experienceLevel}</td>
          </tr>
        </table>
      </div>

      <!-- Next Steps -->
      <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #856404; margin: 0 0 10px 0; font-size: 16px;">Recommended Next Steps</h3>
        <ul style="color: #856404; margin: 0; padding-left: 20px; font-size: 14px;">
          ${newStatus === 'Phone Screening' ? '<li style="margin-bottom: 5px;">Schedule a phone screening interview</li>' : ''}
          ${newStatus === 'First Interview' ? '<li style="margin-bottom: 5px;">Arrange the first round interview</li>' : ''}
          ${newStatus === 'Second Interview' ? '<li style="margin-bottom: 5px;">Schedule the second round interview</li>' : ''}
          ${newStatus === 'Final Interview' ? '<li style="margin-bottom: 5px;">Set up the final interview</li>' : ''}
          ${newStatus === 'Offer Preparation' ? '<li style="margin-bottom: 5px;">Prepare offer letter and benefits package</li>' : ''}
          ${newStatus === 'Offer Sent' ? '<li style="margin-bottom: 5px;">Follow up on offer response</li>' : ''}
          ${newStatus === 'Offer Accepted' ? '<li style="margin-bottom: 5px;">Begin onboarding process</li>' : ''}
          ${newStatus === 'Rejected' ? '<li style="margin-bottom: 5px;">Send rejection email to candidate</li>' : ''}
          ${newStatus === 'On Hold' ? '<li style="margin-bottom: 5px;">Monitor for position reopening</li>' : ''}
          <li style="margin-bottom: 0;">Update candidate records in ATS system</li>
        </ul>
      </div>

      <!-- Footer -->
      <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <p style="color: #7f8c8d; margin: 0; font-size: 14px;">
          This is an automated notification from your ATS system.<br>
          Candidate ID: ${candidateData.id} | Job ID: ${jobData.id} | Updated: ${formatDateTime(changeInfo.updatedAt)}
        </p>
      </div>
      
    </body>
    </html>
  `;
};

// Pipeline Status Change Email Template (for Candidates/Applicants)
export const getPipelineStatusChangeCandidateTemplate = (candidateData, jobData, oldStatus, newStatus, changeInfo) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Application Status Update</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      
      <!-- Header -->
      <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-left: 4px solid #27ae60;">
        <h1 style="color: #27ae60; margin: 0 0 10px 0; font-size: 24px;">Application Status Update</h1>
        <p style="color: #7f8c8d; margin: 0; font-size: 16px;">Your application status has been updated</p>
      </div>

      <!-- Status Update -->
      <div style="background-color: #e8f5e8; border: 1px solid #27ae60; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #27ae60; margin: 0 0 15px 0; font-size: 18px;">Status Update</h3>
        
        <div style="display: flex; align-items: center; margin-bottom: 15px;">
          <div style="flex: 1; text-align: center; padding: 10px; background-color: #fff; border-radius: 4px; margin-right: 10px;">
            <div style="font-size: 12px; color: #7f8c8d; margin-bottom: 5px;">Previous Status</div>
            <div style="font-weight: bold; color: #e74c3c;">${oldStatus}</div>
          </div>
          <div style="font-size: 20px; color: #27ae60; margin: 0 10px;">→</div>
          <div style="flex: 1; text-align: center; padding: 10px; background-color: #fff; border-radius: 4px; margin-left: 10px;">
            <div style="font-size: 12px; color: #7f8c8d; margin-bottom: 5px;">New Status</div>
            <div style="font-weight: bold; color: #27ae60;">${newStatus}</div>
          </div>
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #34495e;">Updated On:</strong> ${formatDateTime(changeInfo.updatedAt)}
        </div>
      </div>

      <!-- Job Information -->
      <div style="background-color: #ffffff; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h2 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">Position Details</h2>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Job Title:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${jobData.title}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Company:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${jobData.company}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Location:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${jobData.city}, ${jobData.country}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Work Type:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${jobData.workType}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Experience Level:</strong></td>
            <td style="padding: 8px 0;">${jobData.experienceLevel}</td>
          </tr>
        </table>
      </div>

      <!-- What This Means -->
      <div style="background-color: #ffffff; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h2 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">What This Means</h2>
        
        ${newStatus === 'Initial Screening' ? `
          <p style="color: #2c3e50; margin-bottom: 10px;">Your application is being reviewed by our recruitment team. We'll assess your qualifications and experience against the job requirements.</p>
          <p style="color: #7f8c8d; font-size: 14px;">You can expect to hear from us within 3-5 business days.</p>
        ` : ''}
        
        ${newStatus === 'Phone Screening' ? `
          <p style="color: #2c3e50; margin-bottom: 10px;">Congratulations! You've passed the initial screening. We'd like to schedule a phone screening to learn more about your background and experience.</p>
          <p style="color: #7f8c8d; font-size: 14px;">You'll receive a separate email with interview scheduling details.</p>
        ` : ''}
        
        ${newStatus === 'Skills Assessment' ? `
          <p style="color: #2c3e50; margin-bottom: 10px;">We'd like to assess your technical skills for this position. You'll receive instructions for completing a skills assessment.</p>
          <p style="color: #7f8c8d; font-size: 14px;">Please complete the assessment within the specified timeframe.</p>
        ` : ''}
        
        ${newStatus === 'First Interview' ? `
          <p style="color: #2c3e50; margin-bottom: 10px;">Excellent! You've been selected for the first round interview. This will be a detailed discussion about your experience and the role.</p>
          <p style="color: #7f8c8d; font-size: 14px;">Interview details will be sent separately.</p>
        ` : ''}
        
        ${newStatus === 'Second Interview' ? `
          <p style="color: #2c3e50; margin-bottom: 10px;">Great progress! You've been invited to the second round interview. This may involve meeting with senior team members or technical assessments.</p>
          <p style="color: #7f8c8d; font-size: 14px;">Interview details will be sent separately.</p>
        ` : ''}
        
        ${newStatus === 'Final Interview' ? `
          <p style="color: #2c3e50; margin-bottom: 10px;">Outstanding! You've reached the final interview stage. This is typically with senior leadership or department heads.</p>
          <p style="color: #7f8c8d; font-size: 14px;">Interview details will be sent separately.</p>
        ` : ''}
        
        ${newStatus === 'Reference Check' ? `
          <p style="color: #2c3e50; margin-bottom: 10px;">We're conducting reference checks as part of our final evaluation process. We may contact your provided references.</p>
          <p style="color: #7f8c8d; font-size: 14px;">This process typically takes 3-5 business days.</p>
        ` : ''}
        
        ${newStatus === 'Offer Preparation' ? `
          <p style="color: #2c3e50; margin-bottom: 10px;">Excellent news! We're preparing an offer for you. Our HR team is finalizing the details of your employment package.</p>
          <p style="color: #7f8c8d; font-size: 14px;">You should receive the offer within 2-3 business days.</p>
        ` : ''}
        
        ${newStatus === 'Offer Sent' ? `
          <p style="color: #2c3e50; margin-bottom: 10px;">Congratulations! We've sent you a formal offer. Please review all details carefully and respond within the specified timeframe.</p>
          <p style="color: #7f8c8d; font-size: 14px;">If you have any questions, please contact us immediately.</p>
        ` : ''}
        
        ${newStatus === 'Offer Accepted' ? `
          <p style="color: #2c3e50; margin-bottom: 10px;">Welcome to the team! We're excited to have you join us. Our onboarding team will be in touch shortly with next steps.</p>
          <p style="color: #7f8c8d; font-size: 14px;">We look forward to working with you!</p>
        ` : ''}
        
        ${newStatus === 'Rejected' ? `
          <p style="color: #2c3e50; margin-bottom: 10px;">Thank you for your interest in this position. After careful consideration, we've decided to move forward with other candidates.</p>
          <p style="color: #7f8c8d; font-size: 14px;">We encourage you to apply for future opportunities that match your skills and experience.</p>
        ` : ''}
        
        ${newStatus === 'On Hold' ? `
          <p style="color: #2c3e50; margin-bottom: 10px;">Your application is currently on hold. This may be due to various factors such as position review or hiring freeze.</p>
          <p style="color: #7f8c8d; font-size: 14px;">We'll keep you updated if the position becomes available again.</p>
        ` : ''}
      </div>

      <!-- Contact Information -->
      <div style="background-color: #ffffff; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h2 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">Contact Information</h2>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Recruiter:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${jobData.recruiter || 'Not specified'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Email:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${jobData.email || 'Not specified'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Internal SPOC:</strong></td>
            <td style="padding: 8px 0;">${jobData.internalSPOC || 'Not specified'}</td>
          </tr>
        </table>
      </div>

      <!-- Footer -->
      <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <p style="color: #7f8c8d; margin: 0; font-size: 14px;">
          Thank you for your interest in ${jobData.company}!<br>
          Application ID: ${candidateData.id} | Updated: ${formatDateTime(changeInfo.updatedAt)}
        </p>
      </div>
      
    </body>
    </html>
  `;
};

// Interview Scheduling Email Template (for Job Posters/Recruiters)
export const getInterviewScheduledRecruiterTemplate = (interviewData, candidateData, jobData) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Interview Scheduled</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      
      <!-- Header -->
      <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-left: 4px solid #3498db;">
        <h1 style="color: #3498db; margin: 0 0 10px 0; font-size: 24px;">Interview Scheduled</h1>
        <p style="color: #7f8c8d; margin: 0; font-size: 16px;">An interview has been scheduled for a candidate</p>
      </div>

      <!-- Interview Summary -->
      <div style="background-color: #e8f4fd; border: 1px solid #3498db; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #1976d2; margin: 0 0 15px 0; font-size: 18px;">Interview Details</h3>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Interview Type:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${interviewData.interviewType}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Interview Mode:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${interviewData.interviewMode}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Date:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${formatDateTime(interviewData.interviewDate)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Time:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${interviewData.interviewTime}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Platform:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${interviewData.platform}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Interviewer:</strong></td>
            <td style="padding: 8px 0;">${interviewData.interviewer}</td>
          </tr>
        </table>
      </div>

      <!-- Candidate Information -->
      <div style="background-color: #ffffff; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h2 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">Candidate Information</h2>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Name:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${candidateData.firstName} ${candidateData.lastName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Email:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><a href="mailto:${candidateData.email}" style="color: #3498db;">${candidateData.email}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Phone:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><a href="tel:${candidateData.phone}" style="color: #3498db;">${candidateData.phone}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Location:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${candidateData.currentLocation}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Experience:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${candidateData.yearsOfExperience} years</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Expected Salary:</strong></td>
            <td style="padding: 8px 0;">$${candidateData.salaryExpectation?.toLocaleString()}</td>
          </tr>
        </table>
      </div>

      <!-- Job Information -->
      <div style="background-color: #ffffff; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h2 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">Job Information</h2>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Job Title:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${jobData.title}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Company:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${jobData.company}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Location:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${jobData.city}, ${jobData.country}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Work Type:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${jobData.workType}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Experience Level:</strong></td>
            <td style="padding: 8px 0;">${jobData.experienceLevel}</td>
          </tr>
        </table>
      </div>

      <!-- Meeting Link (if available) -->
      ${interviewData.meetingLink ? `
        <div style="background-color: #ffffff; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <h2 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">Meeting Link</h2>
          <p style="color: #2c3e50; margin-bottom: 10px;">The interview will be conducted via ${interviewData.platform}.</p>
          <a href="${interviewData.meetingLink}" style="display: inline-block; background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Join Meeting</a>
        </div>
      ` : ''}

      <!-- Notes (if available) -->
      ${interviewData.notes ? `
        <div style="background-color: #ffffff; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <h2 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">Interview Notes</h2>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; border-left: 3px solid #3498db;">
            <p style="color: #2c3e50; margin: 0; line-height: 1.6; white-space: pre-wrap;">${interviewData.notes}</p>
          </div>
        </div>
      ` : ''}

      <!-- Action Required -->
      <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #856404; margin: 0 0 10px 0; font-size: 16px;">Required Actions</h3>
        <ul style="color: #856404; margin: 0; padding-left: 20px; font-size: 14px;">
          <li style="margin-bottom: 5px;">Review the candidate's profile and resume</li>
          <li style="margin-bottom: 5px;">Prepare interview questions based on job requirements</li>
          <li style="margin-bottom: 5px;">Test the meeting link before the interview</li>
          <li style="margin-bottom: 5px;">Update interview status in ATS system after completion</li>
          <li style="margin-bottom: 0;">Provide feedback within 24 hours of the interview</li>
        </ul>
      </div>

      <!-- Footer -->
      <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <p style="color: #7f8c8d; margin: 0; font-size: 14px;">
          This is an automated notification from your ATS system.<br>
          Interview ID: ${interviewData.id} | Candidate ID: ${candidateData.id} | Job ID: ${jobData.id}
        </p>
      </div>
      
    </body>
    </html>
  `;
};

// Interview Scheduling Email Template (for Candidates/Applicants)
export const getInterviewScheduledCandidateTemplate = (interviewData, candidateData, jobData) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Interview Scheduled</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      
      <!-- Header -->
      <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-left: 4px solid #27ae60;">
        <h1 style="color: #27ae60; margin: 0 0 10px 0; font-size: 24px;">Interview Scheduled</h1>
        <p style="color: #7f8c8d; margin: 0; font-size: 16px;">Your interview has been successfully scheduled</p>
      </div>

      <!-- Interview Details -->
      <div style="background-color: #e8f5e8; border: 1px solid #27ae60; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #27ae60; margin: 0 0 15px 0; font-size: 18px;">Interview Details</h3>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Interview Type:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${interviewData.interviewType}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Interview Mode:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${interviewData.interviewMode}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Date:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${formatDateTime(interviewData.interviewDate)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Time:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${interviewData.interviewTime}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Platform:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${interviewData.platform}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Interviewer:</strong></td>
            <td style="padding: 8px 0;">${interviewData.interviewer}</td>
          </tr>
        </table>
      </div>

      <!-- Job Information -->
      <div style="background-color: #ffffff; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h2 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">Position Details</h2>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Job Title:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${jobData.title}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Company:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${jobData.company}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Location:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${jobData.city}, ${jobData.country}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Work Type:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${jobData.workType}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Experience Level:</strong></td>
            <td style="padding: 8px 0;">${jobData.experienceLevel}</td>
          </tr>
        </table>
      </div>

      <!-- Meeting Link (if available) -->
      ${interviewData.meetingLink ? `
        <div style="background-color: #ffffff; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <h2 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">Meeting Link</h2>
          <p style="color: #2c3e50; margin-bottom: 10px;">Click the button below to join the interview at the scheduled time:</p>
          <a href="${interviewData.meetingLink}" style="display: inline-block; background-color: #27ae60; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Join Interview</a>
          <p style="color: #7f8c8d; font-size: 12px; margin-top: 10px;">Please join 5 minutes before the scheduled time.</p>
        </div>
      ` : ''}

      <!-- Interview Preparation -->
      <div style="background-color: #ffffff; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h2 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">Interview Preparation</h2>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; border-left: 3px solid #27ae60;">
          <h4 style="color: #27ae60; margin: 0 0 10px 0; font-size: 14px;">What to Prepare:</h4>
          <ul style="color: #2c3e50; margin: 0; padding-left: 20px; font-size: 14px;">
            <li style="margin-bottom: 5px;">Review the job description and your resume</li>
            <li style="margin-bottom: 5px;">Prepare examples of your relevant experience</li>
            <li style="margin-bottom: 5px;">Have questions ready about the role and company</li>
            <li style="margin-bottom: 5px;">Test your internet connection and camera/microphone</li>
            <li style="margin-bottom: 0;">Find a quiet, well-lit space for the interview</li>
          </ul>
        </div>
      </div>

      <!-- What to Expect -->
      <div style="background-color: #ffffff; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h2 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">What to Expect</h2>
        
        ${interviewData.interviewType === 'Phone Screening' ? `
          <p style="color: #2c3e50; margin-bottom: 10px;">This will be a brief phone conversation to discuss your background and interest in the position.</p>
        ` : ''}
        
        ${interviewData.interviewType === 'First Interview' ? `
          <p style="color: #2c3e50; margin-bottom: 10px;">This is the first round interview where we'll discuss your experience, skills, and the role in detail.</p>
        ` : ''}
        
        ${interviewData.interviewType === 'Second Interview' ? `
          <p style="color: #2c3e50; margin-bottom: 10px;">This second round interview may involve meeting with senior team members or technical assessments.</p>
        ` : ''}
        
        ${interviewData.interviewType === 'Final Interview' ? `
          <p style="color: #2c3e50; margin-bottom: 10px;">This is the final interview stage, typically with senior leadership or department heads.</p>
        ` : ''}
        
        <p style="color: #7f8c8d; font-size: 14px;">The interview will last approximately 30-60 minutes depending on the round.</p>
      </div>

      <!-- Contact Information -->
      <div style="background-color: #ffffff; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h2 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">Contact Information</h2>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Recruiter:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${jobData.recruiter || 'Not specified'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Email:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${jobData.email || 'Not specified'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Internal SPOC:</strong></td>
            <td style="padding: 8px 0;">${jobData.internalSPOC || 'Not specified'}</td>
          </tr>
        </table>
      </div>

      <!-- Important Notes -->
      <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #856404; margin: 0 0 10px 0; font-size: 16px;">Important Notes</h3>
        <ul style="color: #856404; margin: 0; padding-left: 20px; font-size: 14px;">
          <li style="margin-bottom: 5px;">Please be on time for your interview</li>
          <li style="margin-bottom: 5px;">If you need to reschedule, contact us immediately</li>
          <li style="margin-bottom: 5px;">Have your resume and portfolio ready if applicable</li>
          <li style="margin-bottom: 0;">We'll contact you within 24-48 hours after the interview</li>
        </ul>
      </div>

      <!-- Footer -->
      <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <p style="color: #7f8c8d; margin: 0; font-size: 14px;">
          Thank you for your interest in ${jobData.company}!<br>
          Interview ID: ${interviewData.id} | Scheduled: ${formatDateTime(interviewData.interviewDate)}
        </p>
      </div>
      
    </body>
    </html>
  `;
};
