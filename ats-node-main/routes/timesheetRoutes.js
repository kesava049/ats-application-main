import express from 'express';
const router = express.Router();
import {
  getTimesheetEntries,
  createTimesheetEntry,
  updateTimesheetEntry,
  deleteTimesheetEntry,
  approveTimesheetEntry,
  updateApprovalData,
  deleteApprovalData,
  uploadAttachment,
  updateAttachment,
  deleteAttachment,
  timesheetUpload
} from '../controllers/timesheetController.js';
import { companyAuth, requireCompany } from '../middlewares/companyAuth.js';

// Apply company authentication to all timesheet routes
router.use(companyAuth);

// GET - Get all timesheet entries
router.get('/timesheet', getTimesheetEntries);

// POST - Create a new timesheet entry
router.post('/timesheet', createTimesheetEntry);

// PUT - Update an existing timesheet entry
router.put('/timesheet/:id', updateTimesheetEntry);

// DELETE - Delete a timesheet entry
router.delete('/timesheet/:id', deleteTimesheetEntry);

// POST - Approve timesheet entry
router.post('/timesheet/:id/approve', approveTimesheetEntry);

// PUT - Update approval data
router.put('/timesheet/:id/approval', updateApprovalData);

// DELETE - Delete approval data
router.delete('/timesheet/:id/approval', deleteApprovalData);

// POST - Upload attachment for timesheet entry
router.post('/timesheet/:id/attachment', timesheetUpload.single('file'), uploadAttachment);

// PUT - Update attachment for timesheet entry
router.put('/timesheet/:id/attachment', updateAttachment);

// DELETE - Delete attachment for timesheet entry
router.delete('/timesheet/:id/attachment', deleteAttachment);

export default router; 