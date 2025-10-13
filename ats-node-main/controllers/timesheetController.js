import prisma from '../prismaClient.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { sendTimesheetCreateEmail, sendTimesheetUpdateEmail, sendTimesheetDeleteEmail, sendTimesheetApprovalEmail } from '../utils/mailer.js';

// GET - Get all timesheet entries
const getTimesheetEntries = async (req, res) => {
  try {
    // Get company ID from auth middleware
    const companyId = req.companyId;
    if (!companyId) {
      return res.status(403).json({
        error: "Company context required. Please ensure you are logged in with a valid company account."
      });
    }

    const entries = await prisma.timesheetEntry.findMany({
      where: { companyId: companyId },
      orderBy: [
        {
          date: 'desc'
        },
        {
          createdAt: 'desc'
        }
      ]
    });
    
    res.status(200).json({
      success: true,
      data: entries,
      count: entries.length
    });
  } catch (error) {
    console.error('Error fetching timesheet entries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch timesheet entries',
      error: error.message
    });
  }
};

// POST - Create a new timesheet entry
const createTimesheetEntry = async (req, res) => {
  try {
    const {
      recruiterName,
      recruiterEmail,
      date,
      startTime,
      endTime,
      hours,
      breakTime,
      entityType,
      entityId,
      entityName,
      companyName,
      taskType,
      taskCategory,
      priority,
      billable,
      billableRate,
      comments
    } = req.body;
    
    // Validate required fields
    if (!recruiterName || !date || !hours || !taskType || !entityType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: recruiterName, date, hours, taskType, entityType'
      });
    }
    
    // Validate hours (0-24 hours)
    if (hours < 0 || hours > 24) {
      return res.status(400).json({
        success: false,
        message: 'Hours must be between 0 and 24'
      });
    }
    
    const newEntry = await prisma.timesheetEntry.create({
      data: {
        recruiterName,
        recruiterEmail: recruiterEmail || null,
        date,
        startTime: startTime || null,
        endTime: endTime || null,
        hours: parseFloat(hours),
        breakTime: breakTime ? parseFloat(breakTime) : null,
        entityType,
        entityId: entityId || null,
        entityName: entityName || null,
        companyName: companyName || null,
        taskType,
        taskCategory: taskCategory || 'RECRUITMENT',
        priority: priority || 'MEDIUM',
        billable: billable !== undefined ? billable : true,
        billableRate: billableRate ? parseFloat(billableRate) : null,
        comments: comments || null,
        status: 'PENDING'
      }
    });
    
    // Send email notification for timesheet creation
    try {
      const createInfo = {
        createdBy: req.body.createdBy || 'System',
        createdAt: new Date(),
        reason: req.body.creationReason || 'Timesheet entry created',
        timesheetId: newEntry.id
      };
      
      // Send email to recruiter if email is provided
      if (recruiterEmail) {
        await sendTimesheetCreateEmail(recruiterEmail, newEntry, createInfo);
      }
      
      // Send email to admin/manager (you can configure this email)
      const adminEmail = process.env.ADMIN_EMAIL || process.env.MAIL_FROM_ADDRESS;
      if (adminEmail && adminEmail !== recruiterEmail) {
        await sendTimesheetCreateEmail(adminEmail, newEntry, createInfo);
      }
    } catch (emailError) {
      console.error('Error sending timesheet creation email:', emailError);
      // Don't fail the request if email fails
    }
    
    res.status(201).json({
      success: true,
      message: 'Timesheet entry created successfully',
      data: newEntry
    });
  } catch (error) {
    console.error('Error creating timesheet entry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create timesheet entry',
      error: error.message
    });
  }
};

// PUT - Update an existing timesheet entry
const updateTimesheetEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      recruiterName,
      recruiterEmail,
      date,
      startTime,
      endTime,
      hours,
      breakTime,
      entityType,
      entityId,
      entityName,
      companyName,
      taskType,
      taskCategory,
      priority,
      billable,
      billableRate,
      comments
    } = req.body;
    
    // Check if entry exists
    const existingEntry = await prisma.timesheetEntry.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existingEntry) {
      return res.status(404).json({
        success: false,
        message: 'Timesheet entry not found'
      });
    }
    
    // Validate hours if provided
    if (hours !== undefined && (hours < 0 || hours > 24)) {
      return res.status(400).json({
        success: false,
        message: 'Hours must be between 0 and 24'
      });
    }
    
    // Build update data object
    const updateData = {};
    if (recruiterName !== undefined) updateData.recruiterName = recruiterName;
    if (recruiterEmail !== undefined) updateData.recruiterEmail = recruiterEmail;
    if (date !== undefined) updateData.date = date;
    if (startTime !== undefined) updateData.startTime = startTime;
    if (endTime !== undefined) updateData.endTime = endTime;
    if (hours !== undefined) updateData.hours = parseFloat(hours);
    if (breakTime !== undefined) updateData.breakTime = breakTime ? parseFloat(breakTime) : null;
    if (entityType !== undefined) updateData.entityType = entityType;
    if (entityId !== undefined) updateData.entityId = entityId;
    if (entityName !== undefined) updateData.entityName = entityName;
    if (companyName !== undefined) updateData.companyName = companyName;
    if (taskType !== undefined) updateData.taskType = taskType;
    if (taskCategory !== undefined) updateData.taskCategory = taskCategory;
    if (priority !== undefined) updateData.priority = priority;
    if (billable !== undefined) updateData.billable = billable;
    if (billableRate !== undefined) updateData.billableRate = billableRate ? parseFloat(billableRate) : null;
    if (comments !== undefined) updateData.comments = comments;
    
    const updatedEntry = await prisma.timesheetEntry.update({
      where: { id: parseInt(id) },
      data: updateData
    });
    
    // Send email notification for timesheet update
    try {
      // Determine which fields were updated
      const updatedFields = [];
      if (recruiterName !== undefined && recruiterName !== existingEntry.recruiterName) updatedFields.push('Recruiter Name');
      if (recruiterEmail !== undefined && recruiterEmail !== existingEntry.recruiterEmail) updatedFields.push('Recruiter Email');
      if (date !== undefined && date !== existingEntry.date) updatedFields.push('Date');
      if (startTime !== undefined && startTime !== existingEntry.startTime) updatedFields.push('Start Time');
      if (endTime !== undefined && endTime !== existingEntry.endTime) updatedFields.push('End Time');
      if (hours !== undefined && hours !== existingEntry.hours) updatedFields.push('Hours');
      if (breakTime !== undefined && breakTime !== existingEntry.breakTime) updatedFields.push('Break Time');
      if (entityType !== undefined && entityType !== existingEntry.entityType) updatedFields.push('Entity Type');
      if (entityId !== undefined && entityId !== existingEntry.entityId) updatedFields.push('Entity ID');
      if (entityName !== undefined && entityName !== existingEntry.entityName) updatedFields.push('Entity Name');
      if (companyName !== undefined && companyName !== existingEntry.companyName) updatedFields.push('Company Name');
      if (taskType !== undefined && taskType !== existingEntry.taskType) updatedFields.push('Task Type');
      if (taskCategory !== undefined && taskCategory !== existingEntry.taskCategory) updatedFields.push('Task Category');
      if (priority !== undefined && priority !== existingEntry.priority) updatedFields.push('Priority');
      if (billable !== undefined && billable !== existingEntry.billable) updatedFields.push('Billable');
      if (billableRate !== undefined && billableRate !== existingEntry.billableRate) updatedFields.push('Billable Rate');
      if (comments !== undefined && comments !== existingEntry.comments) updatedFields.push('Comments');
      
      const updateInfo = {
        updatedBy: req.body.updatedBy || 'System',
        updatedAt: new Date(),
        reason: req.body.updateReason || 'Timesheet entry updated',
        timesheetId: updatedEntry.id
      };
      
      // Send email to recruiter if email is provided
      if (updatedEntry.recruiterEmail) {
        await sendTimesheetUpdateEmail(updatedEntry.recruiterEmail, updatedEntry, updatedFields, updateInfo);
      }
      
      // Send email to admin/manager (you can configure this email)
      const adminEmail = process.env.ADMIN_EMAIL || process.env.MAIL_FROM_ADDRESS;
      if (adminEmail && adminEmail !== updatedEntry.recruiterEmail) {
        await sendTimesheetUpdateEmail(adminEmail, updatedEntry, updatedFields, updateInfo);
      }
    } catch (emailError) {
      console.error('Error sending timesheet update email:', emailError);
      // Don't fail the request if email fails
    }
    
    res.status(200).json({
      success: true,
      message: 'Timesheet entry updated successfully',
      data: updatedEntry
    });
  } catch (error) {
    console.error('Error updating timesheet entry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update timesheet entry',
      error: error.message
    });
  }
};

// DELETE - Delete a timesheet entry
const deleteTimesheetEntry = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if entry exists
    const existingEntry = await prisma.timesheetEntry.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existingEntry) {
      return res.status(404).json({
        success: false,
        message: 'Timesheet entry not found'
      });
    }
    
    // Send email notification for timesheet deletion before deleting
    try {
      const deleteInfo = {
        deletedBy: req.body.deletedBy || 'System',
        deletedAt: new Date(),
        reason: req.body.deletionReason || 'Timesheet entry deleted',
        timesheetId: existingEntry.id
      };
      
      // Send email to recruiter if email is provided
      if (existingEntry.recruiterEmail) {
        await sendTimesheetDeleteEmail(existingEntry.recruiterEmail, existingEntry, deleteInfo);
      }
      
      // Send email to admin/manager (you can configure this email)
      const adminEmail = process.env.ADMIN_EMAIL || process.env.MAIL_FROM_ADDRESS;
      if (adminEmail && adminEmail !== existingEntry.recruiterEmail) {
        await sendTimesheetDeleteEmail(adminEmail, existingEntry, deleteInfo);
      }
    } catch (emailError) {
      console.error('Error sending timesheet deletion email:', emailError);
      // Don't fail the request if email fails
    }
    
    await prisma.timesheetEntry.delete({
      where: { id: parseInt(id) }
    });
    
    res.status(200).json({
      success: true,
      message: 'Timesheet entry deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting timesheet entry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete timesheet entry',
      error: error.message
    });
  }
};

// POST - Approve timesheet entry
const approveTimesheetEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { approvedBy } = req.body;
    
    // Check if entry exists
    const existingEntry = await prisma.timesheetEntry.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existingEntry) {
      return res.status(404).json({
        success: false,
        message: 'Timesheet entry not found'
      });
    }
    
    if (!approvedBy) {
      return res.status(400).json({
        success: false,
        message: 'Approved by field is required'
      });
    }
    
    const updatedEntry = await prisma.timesheetEntry.update({
      where: { id: parseInt(id) },
      data: {
        status: 'APPROVED',
        approvedBy: approvedBy,
        approvedAt: new Date()
      }
    });
    
    // Send email notification for timesheet approval
    try {
      const approvalInfo = {
        approvedBy: approvedBy,
        approvedAt: new Date(),
        timesheetId: updatedEntry.id
      };
      
      // Send email to recruiter if email is provided
      if (updatedEntry.recruiterEmail) {
        await sendTimesheetApprovalEmail(updatedEntry.recruiterEmail, updatedEntry, approvalInfo);
      }
      
      // Send email to admin/manager (you can configure this email)
      const adminEmail = process.env.ADMIN_EMAIL || process.env.MAIL_FROM_ADDRESS;
      if (adminEmail && adminEmail !== updatedEntry.recruiterEmail) {
        await sendTimesheetApprovalEmail(adminEmail, updatedEntry, approvalInfo);
      }
    } catch (emailError) {
      console.error('Error sending timesheet approval email:', emailError);
      // Don't fail the request if email fails
    }
    
    res.status(200).json({
      success: true,
      message: 'Timesheet entry approved successfully',
      data: updatedEntry
    });
  } catch (error) {
    console.error('Error approving timesheet entry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve timesheet entry',
      error: error.message
    });
  }
};

// PUT - Update approval data
const updateApprovalData = async (req, res) => {
  try {
    const { id } = req.params;
    const { approvedBy, approvedAt } = req.body;
    
    // Check if entry exists
    const existingEntry = await prisma.timesheetEntry.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existingEntry) {
      return res.status(404).json({
        success: false,
        message: 'Timesheet entry not found'
      });
    }
    
    const updateData = {};
    if (approvedBy) updateData.approvedBy = approvedBy;
    if (approvedAt) updateData.approvedAt = new Date(approvedAt);
    
    const updatedEntry = await prisma.timesheetEntry.update({
      where: { id: parseInt(id) },
      data: updateData
    });
    
    res.status(200).json({
      success: true,
      message: 'Approval data updated successfully',
      data: updatedEntry
    });
  } catch (error) {
    console.error('Error updating approval data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update approval data',
      error: error.message
    });
  }
};

// DELETE - Delete approval data
const deleteApprovalData = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if entry exists
    const existingEntry = await prisma.timesheetEntry.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existingEntry) {
      return res.status(404).json({
        success: false,
        message: 'Timesheet entry not found'
      });
    }
    
    const updatedEntry = await prisma.timesheetEntry.update({
      where: { id: parseInt(id) },
      data: {
        status: 'PENDING',
        approvedBy: null,
        approvedAt: null
      }
    });
    
    res.status(200).json({
      success: true,
      message: 'Approval data deleted successfully',
      data: updatedEntry
    });
  } catch (error) {
    console.error('Error deleting approval data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete approval data',
      error: error.message
    });
  }
};

// Configure multer for timesheet file uploads
const timesheetStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create uploads directory if it doesn't exist
    const uploadDir = './uploads/timesheet';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create filename with timesheet ID and timestamp
    const timesheetId = req.params.id || 'unknown';
    const timestamp = Date.now();
    const fileExtension = path.extname(file.originalname);
    const fileName = `timesheet_${timesheetId}_${timestamp}${fileExtension}`;
    cb(null, fileName);
  }
});

const timesheetFileFilter = (req, file, cb) => {
  // Allow PDF, DOC, DOCX, TXT, and image files
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/jpg'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, TXT, and images are allowed.'), false);
  }
};

export const timesheetUpload = multer({
  storage: timesheetStorage,
  fileFilter: timesheetFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// POST - Upload attachment for timesheet entry
const uploadAttachment = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if entry exists
    const existingEntry = await prisma.timesheetEntry.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existingEntry) {
      return res.status(404).json({
        success: false,
        message: 'Timesheet entry not found'
      });
    }

    let attachmentPath = '';
    let attachmentName = '';

    // Handle file upload if file is present
    if (req.file) {
      attachmentPath = req.file.path;
      attachmentName = req.file.originalname;
    } else {
      // Handle JSON data for backward compatibility
      const { attachmentPath: path, attachmentName: name } = req.body;
      attachmentPath = path;
      attachmentName = name;
    }

    if (!attachmentPath || !attachmentName) {
      return res.status(400).json({
        success: false,
        message: 'Attachment path and name are required'
      });
    }
    
    // Update attachments field
    const currentAttachments = existingEntry.attachments || '';
    const newAttachment = `${attachmentName}:${attachmentPath}`;
    const updatedAttachments = currentAttachments 
      ? `${currentAttachments},${newAttachment}`
      : newAttachment;
    
    const updatedEntry = await prisma.timesheetEntry.update({
      where: { id: parseInt(id) },
      data: {
        attachments: updatedAttachments
      }
    });
    
    res.status(200).json({
      success: true,
      message: 'Attachment uploaded successfully',
      data: updatedEntry
    });
  } catch (error) {
    console.error('Error uploading attachment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload attachment',
      error: error.message
    });
  }
};

// PUT - Update attachment for timesheet entry
const updateAttachment = async (req, res) => {
  try {
    const { id } = req.params;
    const { oldAttachmentName, newAttachmentPath, newAttachmentName } = req.body;
    
    // Check if entry exists
    const existingEntry = await prisma.timesheetEntry.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existingEntry) {
      return res.status(404).json({
        success: false,
        message: 'Timesheet entry not found'
      });
    }

    if (!oldAttachmentName || !newAttachmentPath || !newAttachmentName) {
      return res.status(400).json({
        success: false,
        message: 'Old attachment name, new attachment path and name are required'
      });
    }
    
    // Update attachments field
    const currentAttachments = existingEntry.attachments || '';
    const attachmentList = currentAttachments.split(',').filter(att => att.trim());
    
    const updatedAttachmentList = attachmentList.map(att => {
      const [name] = att.split(':');
      if (name === oldAttachmentName) {
        return `${newAttachmentName}:${newAttachmentPath}`;
      }
      return att;
    });
    
    const updatedAttachments = updatedAttachmentList.join(',');
    
    const updatedEntry = await prisma.timesheetEntry.update({
      where: { id: parseInt(id) },
      data: {
        attachments: updatedAttachments
      }
    });
    
    res.status(200).json({
      success: true,
      message: 'Attachment updated successfully',
      data: updatedEntry
    });
  } catch (error) {
    console.error('Error updating attachment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update attachment',
      error: error.message
    });
  }
};

// DELETE - Delete attachment for timesheet entry
const deleteAttachment = async (req, res) => {
  try {
    const { id } = req.params;
    const { attachmentName } = req.body;
    
    // Check if entry exists
    const existingEntry = await prisma.timesheetEntry.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existingEntry) {
      return res.status(404).json({
        success: false,
        message: 'Timesheet entry not found'
      });
    }

    if (!attachmentName) {
      return res.status(400).json({
        success: false,
        message: 'Attachment name is required'
      });
    }
    
    // Update attachments field
    const currentAttachments = existingEntry.attachments || '';
    const attachmentList = currentAttachments.split(',').filter(att => att.trim());
    
    const updatedAttachmentList = attachmentList.filter(att => {
      const [name] = att.split(':');
      return name !== attachmentName;
    });
    
    const updatedAttachments = updatedAttachmentList.join(',');
    
    const updatedEntry = await prisma.timesheetEntry.update({
      where: { id: parseInt(id) },
      data: {
        attachments: updatedAttachments
      }
    });
    
    res.status(200).json({
      success: true,
      message: 'Attachment deleted successfully',
      data: updatedEntry
    });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete attachment',
      error: error.message
    });
  }
};

export {
  getTimesheetEntries,
  createTimesheetEntry,
  updateTimesheetEntry,
  deleteTimesheetEntry,
  approveTimesheetEntry,
  updateApprovalData,
  deleteApprovalData,
  uploadAttachment,
  updateAttachment,
  deleteAttachment
}; 