// Customer Email Templates for professional communication

export const getCustomerCreateEmailTemplate = (customerData, createInfo) => {
  // Ensure customerData is not null/undefined
  if (!customerData) {
    customerData = {};
  }
  
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; padding: 30px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin-bottom: 10px; font-size: 28px;">Welcome to Our Platform!</h1>
        <p style="color: #6b7280; font-size: 16px;">Your company has been successfully registered in our system.</p>
      </div>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <h2 style="color: #1f2937; margin-bottom: 15px; font-size: 20px;">Company Details</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
          <div>
            <strong style="color: #374151;">Company Name:</strong><br>
            <span style="color: #6b7280;">${customerData.companyName || 'N/A'}</span>
          </div>
          <div>
            <strong style="color: #374151;">Industry:</strong><br>
            <span style="color: #6b7280;">${customerData.industry || 'N/A'}</span>
          </div>
          <div>
            <strong style="color: #374151;">Location:</strong><br>
            <span style="color: #6b7280;">${customerData.city || 'N/A'}, ${customerData.country || 'N/A'}</span>
          </div>
          <div>
            <strong style="color: #374151;">Status:</strong><br>
            <span style="color: #059669; font-weight: 600;">${customerData.status || 'ACTIVE'}</span>
          </div>
          ${customerData.website ? `
          <div>
            <strong style="color: #374151;">Website:</strong><br>
            <span style="color: #6b7280;">${customerData.website}</span>
          </div>
          ` : ''}
          ${customerData.companySize ? `
          <div>
            <strong style="color: #374151;">Company Size:</strong><br>
            <span style="color: #6b7280;">${customerData.companySize}</span>
          </div>
          ` : ''}
          ${customerData.email ? `
          <div>
            <strong style="color: #374151;">Contact Email:</strong><br>
            <span style="color: #6b7280;">${customerData.email}</span>
          </div>
          ` : ''}
        </div>
      </div>
      
      <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <h3 style="color: #1e40af; margin-bottom: 10px; font-size: 18px;">What's Next?</h3>
        <ul style="color: #374151; line-height: 1.6;">
          <li>Your account is now active and ready for use</li>
          <li>You can start posting job opportunities</li>
          <li>Our team will reach out to discuss your specific needs</li>
          <li>Access your dashboard to manage your account</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px; margin-bottom: 10px;">
          Created on: ${createInfo && createInfo.createdAt ? new Date(createInfo.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}
        </p>
        <p style="color: #9ca3af; font-size: 13px;">
          If you have any questions, please don't hesitate to contact our support team.
        </p>
        <p style="color: #9ca3af; font-size: 13px; margin-top: 10px;">
          Best regards,<br>
          <strong>${process.env.MAIL_FROM_NAME || 'ATS Team'}</strong>
        </p>
      </div>
    </div>
  `;
};

export const getCustomerUpdateEmailTemplate = (customerData, updatedFields, updateInfo) => {
  // Ensure customerData is not null/undefined
  if (!customerData) {
    customerData = {};
  }
  
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; padding: 30px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin-bottom: 10px; font-size: 28px;">Account Update Notification</h1>
        <p style="color: #6b7280; font-size: 16px;">Your company profile has been successfully updated.</p>
      </div>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <h2 style="color: #1f2937; margin-bottom: 15px; font-size: 20px;">Updated Information</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
          <div>
            <strong style="color: #374151;">Company Name:</strong><br>
            <span style="color: #6b7280;">${customerData.companyName || 'N/A'}</span>
          </div>
          <div>
            <strong style="color: #374151;">Industry:</strong><br>
            <span style="color: #6b7280;">${customerData.industry || 'N/A'}</span>
          </div>
          <div>
            <strong style="color: #374151;">Location:</strong><br>
            <span style="color: #6b7280;">${customerData.city || 'N/A'}, ${customerData.country || 'N/A'}</span>
          </div>
          <div>
            <strong style="color: #374151;">Status:</strong><br>
            <span style="color: #059669; font-weight: 600;">${customerData.status || 'ACTIVE'}</span>
          </div>
          ${customerData.website ? `
          <div>
            <strong style="color: #374151;">Website:</strong><br>
            <span style="color: #6b7280;">${customerData.website}</span>
          </div>
          ` : ''}
          ${customerData.companySize ? `
          <div>
            <strong style="color: #374151;">Company Size:</strong><br>
            <span style="color: #6b7280;">${customerData.companySize}</span>
          </div>
          ` : ''}
          ${customerData.email ? `
          <div>
            <strong style="color: #374151;">Contact Email:</strong><br>
            <span style="color: #6b7280;">${customerData.email}</span>
          </div>
          ` : ''}
        </div>
      </div>
      
      ${updatedFields && updatedFields.length > 0 ? `
      <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <h3 style="color: #92400e; margin-bottom: 10px; font-size: 18px;">Fields Updated</h3>
        <ul style="color: #92400e; line-height: 1.6;">
          ${updatedFields.map(field => `<li>${field}</li>`).join('')}
        </ul>
      </div>
      ` : ''}
      
      <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <h3 style="color: #1e40af; margin-bottom: 10px; font-size: 18px;">Account Status</h3>
        <p style="color: #374151; line-height: 1.6;">
          Your account remains active and all services are available. 
          The changes have been applied immediately and are now live in our system.
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px; margin-bottom: 10px;">
          Updated on: ${updateInfo && updateInfo.updatedAt ? new Date(updateInfo.updatedAt).toLocaleDateString() : new Date().toLocaleDateString()}
        </p>
        <p style="color: #9ca3af; font-size: 13px;">
          If you did not request these changes, please contact our support team immediately.
        </p>
        <p style="color: #9ca3af; font-size: 13px; margin-top: 10px;">
          Best regards,<br>
          <strong>${process.env.MAIL_FROM_NAME || 'ATS Team'}</strong>
        </p>
      </div>
    </div>
  `;
};

export const getCustomerDeleteEmailTemplate = (customerData, deleteInfo) => {
  // Ensure customerData is not null/undefined
  if (!customerData) {
    customerData = {};
  }
  
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; padding: 30px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #dc2626; margin-bottom: 10px; font-size: 28px;">Account Deletion Confirmation</h1>
        <p style="color: #6b7280; font-size: 16px;">Your company account has been successfully removed from our system.</p>
      </div>
      
      <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <h2 style="color: #991b1b; margin-bottom: 15px; font-size: 20px;">Account Details</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
          <div>
            <strong style="color: #374151;">Company Name:</strong><br>
            <span style="color: #6b7280;">${customerData.companyName || 'N/A'}</span>
          </div>
          <div>
            <strong style="color: #374151;">Industry:</strong><br>
            <span style="color: #6b7280;">${customerData.industry || 'N/A'}</span>
          </div>
          <div>
            <strong style="color: #374151;">Location:</strong><br>
            <span style="color: #6b7280;">${customerData.city || 'N/A'}, ${customerData.country || 'N/A'}</span>
          </div>
          <div>
            <strong style="color: #374151;">Account Status:</strong><br>
            <span style="color: #dc2626; font-weight: 600;">DELETED</span>
          </div>
        </div>
      </div>
      
      <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <h3 style="color: #92400e; margin-bottom: 10px; font-size: 18px;">Important Information</h3>
        <ul style="color: #92400e; line-height: 1.6;">
          <li>All associated data has been permanently removed</li>
          <li>Any active job postings have been deactivated</li>
          <li>Candidate applications are no longer accessible</li>
          <li>This action cannot be undone</li>
        </ul>
      </div>
      
      <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <h3 style="color: #1e40af; margin-bottom: 10px; font-size: 18px;">Need to Reactivate?</h3>
        <p style="color: #374151; line-height: 1.6;">
          If this deletion was made in error or you wish to reactivate your account, 
          please contact our support team within 30 days. We may be able to restore 
          your account and associated data.
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px; margin-bottom: 10px;">
          Deleted on: ${deleteInfo && deleteInfo.deletedAt ? new Date(deleteInfo.deletedAt).toLocaleDateString() : new Date().toLocaleDateString()}
        </p>
        <p style="color: #9ca3af; font-size: 13px;">
          Thank you for using our platform. We hope to serve you again in the future.
        </p>
        <p style="color: #9ca3af; font-size: 13px; margin-top: 10px;">
          Best regards,<br>
          <strong>${process.env.MAIL_FROM_NAME || 'ATS Team'}</strong>
        </p>
      </div>
    </div>
  `;
};
