// Professional email templates for user management operations

export const getUserCreateEmailTemplate = (userData, createInfo) => {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; padding: 30px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #4A00E0; margin-bottom: 10px; font-size: 28px;">Welcome to ${createInfo.companyName || 'Our Platform'}!</h1>
        <p style="color: #666; font-size: 16px;">Your account has been successfully created</p>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h2 style="color: #333; margin-bottom: 15px; font-size: 20px;">Account Details</h2>
        <div style="margin-bottom: 10px;">
          <strong style="color: #555;">Name:</strong> <span style="color: #333;">${userData.name}</span>
        </div>
        <div style="margin-bottom: 10px;">
          <strong style="color: #555;">Email:</strong> <span style="color: #333;">${userData.email}</span>
        </div>
        <div style="margin-bottom: 10px;">
          <strong style="color: #555;">Phone:</strong> <span style="color: #333;">${userData.number}</span>
        </div>
        <div style="margin-bottom: 10px;">
          <strong style="color: #555;">User Type:</strong> <span style="color: #4A00E0; font-weight: bold;">${userData.userType}</span>
        </div>
        ${createInfo.companyName ? `
        <div style="margin-bottom: 10px;">
          <strong style="color: #555;">Company:</strong> <span style="color: #333; font-weight: bold;">${createInfo.companyName}</span>
        </div>
        ` : ''}
      </div>
      
      <div style="margin: 25px 0;">
        <h3 style="color: #333; margin-bottom: 15px;">What's Next?</h3>
        <ul style="color: #666; line-height: 1.6;">
          <li>You can now log in to your account using your email address</li>
          <li>An OTP will be sent to your email for verification</li>
          <li>Explore the platform features based on your user type</li>
          <li>Contact support if you need any assistance</li>
        </ul>
      </div>
      
      <div style="background-color: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="color: #2d5a2d; margin: 0; font-size: 14px;">
          <strong>Created by:</strong> ${createInfo.createdBy || 'System'} | 
          <strong>Date:</strong> ${createInfo.createdAt || new Date().toLocaleDateString()}
        </p>
      </div>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">
      <p style="text-align: center; color: #999; font-size: 13px;">
        This is an automated message. Please do not reply to this email.<br>
        If you have any questions, please contact our support team.
      </p>
    </div>
  `;
};

export const getUserUpdateEmailTemplate = (userData, updatedFields, updateInfo) => {
  const updatedFieldsList = updatedFields.map(field => 
    `<li style="margin-bottom: 5px;"><strong>${field}:</strong> ${userData[field.toLowerCase()]}</li>`
  ).join('');

  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; padding: 30px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #4A00E0; margin-bottom: 10px; font-size: 28px;">Account Updated</h1>
        <p style="color: #666; font-size: 16px;">Your account information has been successfully updated for ${updateInfo.companyName || 'our platform'}</p>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h2 style="color: #333; margin-bottom: 15px; font-size: 20px;">Updated Information</h2>
        <ul style="color: #666; line-height: 1.6; padding-left: 20px;">
          ${updatedFieldsList}
        </ul>
        ${updateInfo.companyName ? `
        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e0e0e0;">
          <strong style="color: #555;">Company:</strong> <span style="color: #333; font-weight: bold;">${updateInfo.companyName}</span>
        </div>
        ` : ''}
      </div>
      
      <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #856404; margin-bottom: 10px;">Security Notice</h3>
        <p style="color: #856404; margin: 0; font-size: 14px;">
          If you did not request these changes, please contact our support team immediately.
        </p>
      </div>
      
      <div style="background-color: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="color: #2d5a2d; margin: 0; font-size: 14px;">
          <strong>Updated by:</strong> ${updateInfo.updatedBy || 'System'} | 
          <strong>Date:</strong> ${updateInfo.updatedAt || new Date().toLocaleDateString()}
        </p>
      </div>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">
      <p style="text-align: center; color: #999; font-size: 13px;">
        This is an automated message. Please do not reply to this email.<br>
        If you have any questions, please contact our support team.
      </p>
    </div>
  `;
};

export const getUserDeleteEmailTemplate = (userData, deleteInfo) => {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; padding: 30px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #dc3545; margin-bottom: 10px; font-size: 28px;">Account Deletion Confirmation</h1>
        <p style="color: #666; font-size: 16px;">Your account has been successfully deleted from ${deleteInfo.companyName || 'our platform'}</p>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h2 style="color: #333; margin-bottom: 15px; font-size: 20px;">Account Information</h2>
        <div style="margin-bottom: 10px;">
          <strong style="color: #555;">Name:</strong> <span style="color: #333;">${userData.name}</span>
        </div>
        <div style="margin-bottom: 10px;">
          <strong style="color: #555;">Email:</strong> <span style="color: #333;">${userData.email}</span>
        </div>
        <div style="margin-bottom: 10px;">
          <strong style="color: #555;">User Type:</strong> <span style="color: #333;">${userData.userType}</span>
        </div>
        ${deleteInfo.companyName ? `
        <div style="margin-bottom: 10px;">
          <strong style="color: #555;">Company:</strong> <span style="color: #333; font-weight: bold;">${deleteInfo.companyName}</span>
        </div>
        ` : ''}
      </div>
      
      <div style="background-color: #f8d7da; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #721c24; margin-bottom: 10px;">Important Notice</h3>
        <ul style="color: #721c24; line-height: 1.6; margin: 0; padding-left: 20px;">
          <li>All your data has been permanently removed from our system</li>
          <li>You will no longer be able to access the platform</li>
          <li>If this was done in error, please contact support immediately</li>
        </ul>
      </div>
      
      <div style="background-color: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="color: #2d5a2d; margin: 0; font-size: 14px;">
          <strong>Deleted by:</strong> ${deleteInfo.deletedBy || 'System'} | 
          <strong>Date:</strong> ${deleteInfo.deletedAt || new Date().toLocaleDateString()}
        </p>
      </div>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">
      <p style="text-align: center; color: #999; font-size: 13px;">
        This is an automated message. Please do not reply to this email.<br>
        If you have any questions, please contact our support team.
      </p>
    </div>
  `;
};

export const getUserTypeChangeEmailTemplate = (userData, oldUserType, newUserType, changeInfo) => {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; padding: 30px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #4A00E0; margin-bottom: 10px; font-size: 28px;">Role Update Notification</h1>
        <p style="color: #666; font-size: 16px;">Your user role has been updated</p>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h2 style="color: #333; margin-bottom: 15px; font-size: 20px;">Role Change Details</h2>
        <div style="margin-bottom: 10px;">
          <strong style="color: #555;">Name:</strong> <span style="color: #333;">${userData.name}</span>
        </div>
        <div style="margin-bottom: 10px;">
          <strong style="color: #555;">Email:</strong> <span style="color: #333;">${userData.email}</span>
        </div>
        <div style="margin-bottom: 10px;">
          <strong style="color: #555;">Previous Role:</strong> <span style="color: #dc3545;">${oldUserType}</span>
        </div>
        <div style="margin-bottom: 10px;">
          <strong style="color: #555;">New Role:</strong> <span style="color: #28a745; font-weight: bold;">${newUserType}</span>
        </div>
      </div>
      
      <div style="background-color: #d1ecf1; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #0c5460; margin-bottom: 10px;">What This Means</h3>
        <ul style="color: #0c5460; line-height: 1.6; margin: 0; padding-left: 20px;">
          <li>Your access permissions have been updated</li>
          <li>You may have access to new features and capabilities</li>
          <li>Please log out and log back in to see the changes</li>
        </ul>
      </div>
      
      <div style="background-color: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="color: #2d5a2d; margin: 0; font-size: 14px;">
          <strong>Changed by:</strong> ${changeInfo.changedBy || 'System'} | 
          <strong>Date:</strong> ${changeInfo.changedAt || new Date().toLocaleDateString()}
        </p>
      </div>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">
      <p style="text-align: center; color: #999; font-size: 13px;">
        This is an automated message. Please do not reply to this email.<br>
        If you have any questions, please contact our support team.
      </p>
    </div>
  `;
};
