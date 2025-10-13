"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Calendar } from "../../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { CalendarIcon, FilterIcon, SearchIcon, ClockIcon, UserIcon, BuildingIcon, IndianRupeeIcon, PaperclipIcon, CheckCircleIcon, Trash2Icon, EditIcon, EyeIcon, UploadIcon, PlusIcon, FileSpreadsheetIcon } from "lucide-react";
import { format } from "date-fns";
import BASE_API_URL from '../../BaseUrlApi.js';
import { useCompany } from '../../lib/company-context';

interface TimesheetEntry {
  id: number;
  recruiterId: number | null;
  recruiterName: string;
  recruiterEmail: string | null;
  date: string;
  startTime: string | null;
  endTime: string | null;
  hours: string;
  breakTime: string | null;
  entityType: string;
  entityId: number | null;
  entityName: string | null;
  companyName: string | null;
  taskType: string;
  taskCategory: string;
  priority: string;
  status: string;
  billable: boolean;
  billableRate: string | null;
  comments: string;
  attachments: string | null;
  createdAt: string;
  updatedAt: string;
  approvedAt: string | null;
  approvedBy: string | null;
}

interface ApiResponse {
  success: boolean;
  data: TimesheetEntry[] | TimesheetEntry;
  count?: number;
  message?: string;
}

interface CreateTimesheetForm {
  recruiterName: string;
  recruiterEmail: string;
  date: string;
  startTime: string;
  endTime: string;
  hours: string;
  breakTime: string;
  entityType: string;
  entityId: string;
  entityName: string;
  companyName: string;
  taskType: string;
  taskCategory: string;
  priority: string;
  billable: boolean;
  billableRate: string;
  comments: string;
}

const RecruiterTimesheet = () => {
  const { companyId, isAuthenticated, isLoading } = useCompany();
  const [timesheetData, setTimesheetData] = useState<TimesheetEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Show loading while company context is loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
            <div className="w-6 h-6 text-white">⏳</div>
          </div>
          <p className="text-gray-600">Loading company context...</p>
        </div>
      </div>
    )
  }
  const [error, setError] = useState<string | null>(null);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [attachmentDialogOpen, setAttachmentDialogOpen] = useState(false);
  
  // Selected entry for operations
  const [selectedEntry, setSelectedEntry] = useState<TimesheetEntry | null>(null);
  
  // Form states
  const [createForm, setCreateForm] = useState<CreateTimesheetForm>({
    recruiterName: '',
    recruiterEmail: '',
    date: '',
    startTime: '',
    endTime: '',
    hours: '',
    breakTime: '',
    entityType: '',
    entityId: '',
    entityName: '',
    companyName: '',
    taskType: '',
    taskCategory: 'RECRUITMENT',
    priority: 'MEDIUM',
    billable: true,
    billableRate: '',
    comments: ''
  });
  
  const [editForm, setEditForm] = useState<CreateTimesheetForm>({
    recruiterName: '',
    recruiterEmail: '',
    date: '',
    startTime: '',
    endTime: '',
    hours: '',
    breakTime: '',
    entityType: '',
    entityId: '',
    entityName: '',
    companyName: '',
    taskType: '',
    taskCategory: 'RECRUITMENT',
    priority: 'MEDIUM',
    billable: true,
    billableRate: '',
    comments: ''
  });
  
  // Upload states
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  
  // New state for attachment and approval management
  const [attachmentAction, setAttachmentAction] = useState<'view' | 'add' | 'edit' | 'delete'>('view');
  const [approvalAction, setApprovalAction] = useState<'view' | 'add' | 'edit' | 'delete'>('view');
  const [selectedAttachment, setSelectedAttachment] = useState<string>('');
  const [newAttachmentFile, setNewAttachmentFile] = useState<File | null>(null);
  const [attachmentLoading, setAttachmentLoading] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [approvalForm, setApprovalForm] = useState({
    approvedBy: '',
    approvedAt: ''
  });
  
  // Comment dialog state
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedComment, setSelectedComment] = useState<string>('');
  const [selectedCommentTitle, setSelectedCommentTitle] = useState<string>('');
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all');
  const [taskCategoryFilter, setTaskCategoryFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [billableFilter, setBillableFilter] = useState<string>('all');

  // Character limits for form fields - Professional standards
  const characterLimits = {
    recruiterName: 100,    // Recruiter names should be reasonable length
    recruiterEmail: 150,   // Email addresses can be long
    entityId: 50,          // Entity IDs should be concise
    entityName: 200,       // Entity names can be descriptive
    companyName: 150,      // Company names should be reasonable length
    taskType: 200,         // Task types should be descriptive
    billableRate: 20,      // Billable rates should be concise
    comments: 1000,        // Comments should be comprehensive
    approvedBy: 100        // Approved by names should be reasonable length
  }

  // Minimum character requirements for fields - Professional standards
  const minimumCharacters = {
    recruiterName: 3,      // Recruiter names should be at least 3 characters
    recruiterEmail: 8,     // Email should be at least 8 characters (e.g., "a@b.com")
    entityId: 1,           // Entity IDs can be short
    entityName: 2,         // Entity names should be at least 2 characters
    companyName: 2,        // Company names should be at least 2 characters
    taskType: 5,           // Task types should be at least 5 characters for meaningful content
    billableRate: 1,       // Billable rates can be short
    comments: 5,           // Comments should be at least 5 characters for meaningful content
    approvedBy: 2          // Approved by names should be at least 2 characters
  }

  // Helper function to get character count and limit
  const getCharacterCount = (value: string, field: keyof typeof characterLimits) => {
    const limit = characterLimits[field]
    const count = value.length
    const remaining = limit - count
    return { count, limit, remaining }
  }

  // Helper function to render character count message with color coding
  const renderCharacterCount = (value: string, field: keyof typeof characterLimits) => {
    const { count, limit, remaining } = getCharacterCount(value, field)
    const minRequired = minimumCharacters[field]
    const isOverLimit = count > limit
    const isTooShort = count > 0 && count < minRequired
    const isGoodLength = count >= minRequired && count <= limit * 0.8
    const isNearLimit = count > limit * 0.8 && count <= limit

    let messageColor = 'text-gray-500'
    let messageText = `${count}/${limit} characters`

    if (count === 0) {
      messageColor = 'text-gray-400'
      messageText = `${count}/${limit} characters`
    } else if (isOverLimit) {
      messageColor = 'text-red-500'
      messageText = `${count}/${limit} characters (${Math.abs(remaining)} over limit)`
    } else if (isTooShort) {
      messageColor = 'text-red-500'
      messageText = `${count}/${limit} characters (minimum ${minRequired} characters required)`
    } else if (isGoodLength) {
      messageColor = 'text-green-500'
      messageText = `${count}/${limit} characters (good length)`
    } else if (isNearLimit) {
      messageColor = 'text-yellow-500'
      messageText = `${count}/${limit} characters (${remaining} remaining)`
    }

    return (
      <div className={`text-xs ${messageColor}`}>
        {messageText}
      </div>
    )
  }

  // Helper function to handle input changes with character limit validation
  const handleInputChange = (field: keyof typeof characterLimits, value: string, setter: (value: string) => void) => {
    const limit = characterLimits[field]
    if (value.length <= limit) {
      setter(value)
    }
  }

  useEffect(() => {
    if (isAuthenticated && companyId) {
      fetchTimesheetData();
    }
  }, [isAuthenticated, companyId]);

  const fetchTimesheetData = async () => {
    if (!companyId) {
      setError('Company context required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Get token from localStorage
      const user = JSON.parse(localStorage.getItem('ats_user') || 'null');
      const token = user?.token;
      
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }
      
      const response = await fetch(`${BASE_API_URL}/timesheet?companyId=${companyId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      const data: ApiResponse = await response.json();
      
      if (data.success) {
        setTimesheetData(Array.isArray(data.data) ? data.data : [data.data]);
      } else {
        setError('Failed to fetch timesheet data');
      }
    } catch (err) {
      setError('Error fetching timesheet data');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // API Functions
  const createTimesheetEntry = async (formData: CreateTimesheetForm) => {
    if (!companyId) {
      return { success: false, message: 'Company context required' };
    }

    try {
      // Get token from localStorage
      const user = JSON.parse(localStorage.getItem('ats_user') || 'null');
      const token = user?.token;
      
      if (!token) {
        return { success: false, message: 'Authentication token not found. Please login again.' };
      }

      const response = await fetch(`${BASE_API_URL}/timesheet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          recruiterName: formData.recruiterName,
          date: formData.date,
          hours: parseFloat(formData.hours),
          taskType: formData.taskType,
          comments: formData.comments,
          recruiterEmail: formData.recruiterEmail || null,
          startTime: formData.startTime || null,
          endTime: formData.endTime || null,
          companyId: companyId,
          breakTime: formData.breakTime ? parseFloat(formData.breakTime) : null,
          entityType: formData.entityType || 'JOB',
          entityId: formData.entityId || null,
          entityName: formData.entityName || null,
          companyName: formData.companyName || null,
          taskCategory: formData.taskCategory,
          priority: formData.priority,
          billable: formData.billable,
          billableRate: formData.billableRate ? parseFloat(formData.billableRate) : null,
        }),
      });

      const data: ApiResponse = await response.json();
      
      if (data.success) {
        setCreateDialogOpen(false);
        resetCreateForm();
        fetchTimesheetData();
        return { success: true, message: 'Timesheet entry created successfully' };
      } else {
        return { success: false, message: data.message || 'Failed to create timesheet entry' };
      }
    } catch (err) {
      console.error('Error creating timesheet entry:', err);
      return { success: false, message: 'Error creating timesheet entry' };
    }
  };

  const updateTimesheetEntry = async (id: number, formData: CreateTimesheetForm) => {
    if (!companyId) {
      return { success: false, message: 'Company context required' };
    }

    try {
      // Get token from localStorage
      const user = JSON.parse(localStorage.getItem('ats_user') || 'null');
      const token = user?.token;
      
      if (!token) {
        return { success: false, message: 'Authentication token not found. Please login again.' };
      }

      const response = await fetch(`${BASE_API_URL}/timesheet/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          recruiterName: formData.recruiterName,
          date: formData.date,
          hours: parseFloat(formData.hours),
          taskType: formData.taskType,
          comments: formData.comments,
          recruiterEmail: formData.recruiterEmail || null,
          startTime: formData.startTime || null,
          endTime: formData.endTime || null,
          companyId: companyId,
          breakTime: formData.breakTime ? parseFloat(formData.breakTime) : null,
          entityType: formData.entityType || 'JOB',
          entityId: formData.entityId || null,
          entityName: formData.entityName || null,
          companyName: formData.companyName || null,
          taskCategory: formData.taskCategory,
          priority: formData.priority,
          billable: formData.billable,
          billableRate: formData.billableRate ? parseFloat(formData.billableRate) : null,
        }),
      });

      const data: ApiResponse = await response.json();
      
      if (data.success) {
        setEditDialogOpen(false);
        setSelectedEntry(null);
        fetchTimesheetData();
        return { success: true, message: 'Timesheet entry updated successfully' };
      } else {
        return { success: false, message: data.message || 'Failed to update timesheet entry' };
      }
    } catch (err) {
      console.error('Error updating timesheet entry:', err);
      return { success: false, message: 'Error updating timesheet entry' };
    }
  };

  const deleteTimesheetEntry = async (id: number) => {
    if (!companyId) {
      return { success: false, message: 'Company context required' };
    }

    try {
      // Get token from localStorage
      const user = JSON.parse(localStorage.getItem('ats_user') || 'null');
      const token = user?.token;
      
      if (!token) {
        return { success: false, message: 'Authentication token not found. Please login again.' };
      }

      const response = await fetch(`${BASE_API_URL}/timesheet/${id}?companyId=${companyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const data: ApiResponse = await response.json();
      
      if (data.success) {
        setDeleteDialogOpen(false);
        setSelectedEntry(null);
        fetchTimesheetData();
        return { success: true, message: 'Timesheet entry deleted successfully' };
      } else {
        return { success: false, message: data.message || 'Failed to delete timesheet entry' };
      }
    } catch (err) {
      console.error('Error deleting timesheet entry:', err);
      return { success: false, message: 'Error deleting timesheet entry' };
    }
  };

  const approveTimesheetEntry = async (id: number, approvedBy: string) => {
    if (!companyId) {
      return { success: false, message: 'Company context required' };
    }

    try {
      // Get token from localStorage
      const user = JSON.parse(localStorage.getItem('ats_user') || 'null');
      const token = user?.token;
      
      if (!token) {
        return { success: false, message: 'Authentication token not found. Please login again.' };
      }

      const response = await fetch(`${BASE_API_URL}/timesheet/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ approvedBy, companyId }),
      });

      const data: ApiResponse = await response.json();
      
      if (data.success) {
        setApproveDialogOpen(false);
        setSelectedEntry(null);
        fetchTimesheetData();
        return { success: true, message: 'Timesheet entry approved successfully' };
      } else {
        return { success: false, message: data.message || 'Failed to approve timesheet entry' };
      }
    } catch (err) {
      console.error('Error approving timesheet entry:', err);
      return { success: false, message: 'Error approving timesheet entry' };
    }
  };

  const uploadAttachment = async (id: number, file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${BASE_API_URL}/timesheet/${id}/attachment`, {
        method: 'POST',
        body: formData
      });
      
      const result: ApiResponse = await response.json();
      
      if (result.success) {
        await fetchTimesheetData();
        setUploadFile(null);
        setUploadDialogOpen(false);
      } else {
        setError(result.message || 'Failed to upload attachment');
      }
    } catch (error) {
      console.error('Error uploading attachment:', error);
      setError('Failed to upload attachment');
    }
  };

  // New API functions for attachment management
  const updateAttachment = async (id: number, oldAttachmentName: string, newFile: File) => {
    try {
      setAttachmentLoading(true);
      const formData = new FormData();
      formData.append('file', newFile);
      formData.append('oldAttachmentName', oldAttachmentName);
      
      const response = await fetch(`${BASE_API_URL}/timesheet/${id}/attachment`, {
        method: 'PUT',
        body: formData
      });
      
      const result: ApiResponse = await response.json();
      
      if (result.success) {
        await fetchTimesheetData();
        setAttachmentAction('view');
        setSelectedAttachment('');
        setNewAttachmentFile(null);
      } else {
        setError(result.message || 'Failed to update attachment');
      }
    } catch (error) {
      console.error('Error updating attachment:', error);
      setError('Failed to update attachment');
    } finally {
      setAttachmentLoading(false);
    }
  };

  const deleteAttachment = async (id: number, attachmentName: string) => {
    try {
      setAttachmentLoading(true);
      
      const response = await fetch(`${BASE_API_URL}/timesheet/${id}/attachment`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ attachmentName })
      });
      
      const result: ApiResponse = await response.json();
      
      if (result.success) {
        await fetchTimesheetData();
        setAttachmentAction('view');
        setSelectedAttachment('');
      } else {
        setError(result.message || 'Failed to delete attachment');
      }
    } catch (error) {
      console.error('Error deleting attachment:', error);
      setError('Failed to delete attachment');
    } finally {
      setAttachmentLoading(false);
    }
  };

  // New API functions for approval management
  const updateApprovalData = async (id: number, approvedBy: string, approvedAt?: string) => {
    try {
      setApprovalLoading(true);
      
      const response = await fetch(`${BASE_API_URL}/timesheet/${id}/approval`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          approvedBy,
          approvedAt: approvedAt || new Date().toISOString()
        })
      });
      
      const result: ApiResponse = await response.json();
      
      if (result.success) {
        await fetchTimesheetData();
        setApprovalAction('view');
        setApprovalForm({ approvedBy: '', approvedAt: '' });
      } else {
        setError(result.message || 'Failed to update approval data');
      }
    } catch (error) {
      console.error('Error updating approval data:', error);
      setError('Failed to update approval data');
    } finally {
      setApprovalLoading(false);
    }
  };

  const deleteApprovalData = async (id: number) => {
    try {
      setApprovalLoading(true);
      
      const response = await fetch(`${BASE_API_URL}/timesheet/${id}/approval`, {
        method: 'DELETE'
      });
      
      const result: ApiResponse = await response.json();
      
      if (result.success) {
        await fetchTimesheetData();
        setApprovalAction('view');
        setApprovalForm({ approvedBy: '', approvedAt: '' });
      } else {
        setError(result.message || 'Failed to delete approval data');
      }
    } catch (error) {
      console.error('Error deleting approval data:', error);
      setError('Failed to delete approval data');
    } finally {
      setApprovalLoading(false);
    }
  };

  // Export Excel function
  const exportExcel = () => {
    if (!timesheetData.length) return;
    
    // Create CSV content
    const headers = [
      'ID',
      'Recruiter Name',
      'Recruiter Email',
      'Date',
      'Hours',
      'Start Time',
      'End Time',
      'Break Time',
      'Task Type',
      'Task Category',
      'Priority',
      'Status',
      'Entity Type',
      'Entity Name',
      'Company Name',
      'Billable',
      'Billable Rate',
      'Comments',
      'Attachments',
      'Created At',
      'Updated At',
      'Approved At',
      'Approved By'
    ];
    
    const csvContent = [
      headers.join(','),
      ...timesheetData.map(entry => [
        entry.id,
        `"${entry.recruiterName}"`,
        `"${entry.recruiterEmail || ''}"`,
        `"${new Date(entry.date).toLocaleDateString()}"`,
        entry.hours,
        `"${entry.startTime || ''}"`,
        `"${entry.endTime || ''}"`,
        `"${entry.breakTime || ''}"`,
        `"${entry.taskType}"`,
        `"${entry.taskCategory}"`,
        `"${entry.priority}"`,
        `"${entry.status}"`,
        `"${entry.entityType}"`,
        `"${entry.entityName || ''}"`,
        `"${entry.companyName || ''}"`,
        entry.billable ? 'Yes' : 'No',
        `"${entry.billableRate || ''}"`,
        `"${entry.comments || ''}"`,
        `"${entry.attachments || ''}"`,
        `"${new Date(entry.createdAt).toLocaleString()}"`,
        `"${new Date(entry.updatedAt).toLocaleString()}"`,
        `"${entry.approvedAt ? new Date(entry.approvedAt).toLocaleString() : ''}"`,
        `"${entry.approvedBy || ''}"`
      ].join(','))
    ].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `timesheet_entries_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Form handlers
  const resetCreateForm = () => {
    setCreateForm({
      recruiterName: '',
      recruiterEmail: '',
      date: '',
      startTime: '',
      endTime: '',
      hours: '',
      breakTime: '',
      entityType: '',
      entityId: '',
      entityName: '',
      companyName: '',
      taskType: '',
      taskCategory: 'RECRUITMENT',
      priority: 'MEDIUM',
      billable: true,
      billableRate: '',
      comments: ''
    });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await createTimesheetEntry(createForm);
    if (result.success) {
      alert(result.message);
    } else {
      alert(result.message);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntry) return;
    const result = await updateTimesheetEntry(selectedEntry.id, editForm);
    if (result.success) {
      alert(result.message);
    } else {
      alert(result.message);
    }
  };

  const handleDelete = async () => {
    if (!selectedEntry) return;
    const result = await deleteTimesheetEntry(selectedEntry.id);
    if (result.success) {
      alert(result.message);
    } else {
      alert(result.message);
    }
  };

  const handleApprove = async (approvedBy: string) => {
    if (!selectedEntry) return;
    const result = await approveTimesheetEntry(selectedEntry.id, approvedBy);
    if (result.success) {
      alert(result.message);
    } else {
      alert(result.message);
    }
  };

  const handleUpload = async () => {
    if (!selectedEntry || !uploadFile) return;
    setUploadLoading(true);
    try {
      await uploadAttachment(selectedEntry.id, uploadFile);
      setUploadLoading(false);
    } catch (error) {
      setUploadLoading(false);
      console.error('Upload failed:', error);
    }
  };

  // New handler functions for attachment management
  const handleAttachmentAdd = async () => {
    if (!selectedEntry || !newAttachmentFile) return;
    setAttachmentLoading(true);
    try {
      await uploadAttachment(selectedEntry.id, newAttachmentFile);
      setAttachmentAction('view');
      setNewAttachmentFile(null);
      // Close dialog after successful operation
      setAttachmentDialogOpen(false);
    } catch (error) {
      console.error('Add attachment failed:', error);
    } finally {
      setAttachmentLoading(false);
    }
  };

  const handleAttachmentUpdate = async () => {
    if (!selectedEntry || !selectedAttachment || !newAttachmentFile) return;
    setAttachmentLoading(true);
    try {
      await updateAttachment(selectedEntry.id, selectedAttachment, newAttachmentFile);
      setAttachmentAction('view');
      setSelectedAttachment('');
      setNewAttachmentFile(null);
      // Close dialog after successful operation
      setAttachmentDialogOpen(false);
    } catch (error) {
      console.error('Update attachment failed:', error);
    } finally {
      setAttachmentLoading(false);
    }
  };

  const handleAttachmentDelete = async () => {
    if (!selectedEntry || !selectedAttachment) return;
    setAttachmentLoading(true);
    try {
      await deleteAttachment(selectedEntry.id, selectedAttachment);
      setAttachmentAction('view');
      setSelectedAttachment('');
      // Close dialog after successful operation
      setAttachmentDialogOpen(false);
    } catch (error) {
      console.error('Delete attachment failed:', error);
    } finally {
      setAttachmentLoading(false);
    }
  };

  // New handler functions for approval management
  const handleApprovalAdd = async () => {
    if (!selectedEntry || !approvalForm.approvedBy) return;
    setApprovalLoading(true);
    try {
      await updateApprovalData(selectedEntry.id, approvalForm.approvedBy);
      setApprovalAction('view');
      setApprovalForm({ approvedBy: '', approvedAt: '' });
      // Close dialog after successful operation
      setApproveDialogOpen(false);
    } catch (error) {
      console.error('Add approval failed:', error);
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleApprovalUpdate = async () => {
    if (!selectedEntry || !approvalForm.approvedBy) return;
    setApprovalLoading(true);
    try {
      await updateApprovalData(selectedEntry.id, approvalForm.approvedBy, approvalForm.approvedAt);
      setApprovalAction('view');
      setApprovalForm({ approvedBy: '', approvedAt: '' });
      // Close dialog after successful operation
      setApproveDialogOpen(false);
    } catch (error) {
      console.error('Update approval failed:', error);
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleApprovalDelete = async () => {
    if (!selectedEntry) return;
    setApprovalLoading(true);
    try {
      await deleteApprovalData(selectedEntry.id);
      setApprovalAction('view');
      setApprovalForm({ approvedBy: '', approvedAt: '' });
      // Close dialog after successful operation
      setApproveDialogOpen(false);
    } catch (error) {
      console.error('Delete approval failed:', error);
    } finally {
      setApprovalLoading(false);
    }
  };

  // Comment handling functions
  const truncateComment = (comment: string, maxLength: number = 10) => {
    if (!comment) return '';
    if (comment.length <= maxLength) return comment;
    return comment.substring(0, maxLength) + '...';
  };

  const openCommentDialog = (comment: string, title: string) => {
    setSelectedComment(comment);
    setSelectedCommentTitle(title);
    setCommentDialogOpen(true);
  };

  const isCommentTruncated = (comment: string, maxLength: number = 10) => {
    return comment && comment.length > maxLength;
  };

  const openEditDialog = (entry: TimesheetEntry) => {
    setSelectedEntry(entry);
    setEditForm({
      recruiterName: entry.recruiterName,
      recruiterEmail: entry.recruiterEmail || '',
      date: entry.date,
      startTime: entry.startTime || '',
      endTime: entry.endTime || '',
      hours: entry.hours,
      breakTime: entry.breakTime || '',
      entityType: entry.entityType,
      entityId: entry.entityId?.toString() || '',
      entityName: entry.entityName || '',
      companyName: entry.companyName || '',
      taskType: entry.taskType,
      taskCategory: entry.taskCategory,
      priority: entry.priority,
      billable: entry.billable,
      billableRate: entry.billableRate || '',
      comments: entry.comments || ''
    });
    setEditDialogOpen(true);
  };

  const openViewDialog = (entry: TimesheetEntry) => {
    setSelectedEntry(entry);
    setViewDialogOpen(true);
  };

  const openDeleteDialog = (entry: TimesheetEntry) => {
    setSelectedEntry(entry);
    setDeleteDialogOpen(true);
  };

  const openApproveDialog = (entry: TimesheetEntry) => {
    setSelectedEntry(entry);
    setApproveDialogOpen(true);
  };

  const openUploadDialog = (entry: TimesheetEntry) => {
    setSelectedEntry(entry);
    setUploadDialogOpen(true);
  };

  const openAttachmentDialog = (entry: TimesheetEntry) => {
    setSelectedEntry(entry);
    setAttachmentDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'SUBMITTED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toUpperCase()) {
      case 'HIGH':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEntityTypeColor = (entityType: string) => {
    switch (entityType.toUpperCase()) {
      case 'JOB':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'CANDIDATE':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredData = timesheetData.filter(entry => {
    const matchesSearch = 
      entry.recruiterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.recruiterEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.taskType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.comments?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.companyName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || entry.status.toUpperCase() === statusFilter.toUpperCase();
    const matchesPriority = priorityFilter === 'all' || entry.priority.toUpperCase() === priorityFilter.toUpperCase();
    const matchesEntityType = entityTypeFilter === 'all' || entry.entityType.toUpperCase() === entityTypeFilter.toUpperCase();
    const matchesTaskCategory = taskCategoryFilter === 'all' || entry.taskCategory.toUpperCase() === taskCategoryFilter.toUpperCase();
    const matchesBillable = billableFilter === 'all' || 
      (billableFilter === 'true' && entry.billable) || 
      (billableFilter === 'false' && !entry.billable);

    const matchesDate = !dateFilter || entry.date === format(dateFilter, 'yyyy-MM-dd');

    return matchesSearch && matchesStatus && matchesPriority && matchesEntityType && matchesTaskCategory && matchesBillable && matchesDate;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setEntityTypeFilter('all');
    setTaskCategoryFilter('all');
    setDateFilter(undefined);
    setBillableFilter('all');
  };

  const totalBillableHours = timesheetData
    .filter(entry => entry.billable)
    .reduce((sum, entry) => sum + parseFloat(entry.hours || '0'), 0);

  const totalHours = timesheetData
    .reduce((sum, entry) => sum + parseFloat(entry.hours || '0'), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading timesheet data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p className="text-lg font-semibold">Error</p>
              <p>{error}</p>
              <Button onClick={fetchTimesheetData} className="mt-4">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recruiter Timesheet</h1>
          <p className="text-gray-600 mt-2">
            Manage and track recruiter time entries and activities
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchTimesheetData} variant="outline" className="flex items-center gap-2">
            <ClockIcon className="h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={clearFilters} variant="outline" className="flex items-center gap-2">
            <FilterIcon className="h-4 w-4" />
            Clear Filters
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default" className="flex items-center gap-2">
                <PlusIcon className="h-4 w-4" />
                Create Timesheet
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Timesheet Entry</DialogTitle>
                <DialogDescription>
                  Add a new timesheet entry for tracking recruiter activities
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="recruiterName">Recruiter Name *</Label>
                    <Input
                      id="recruiterName"
                      value={createForm.recruiterName}
                      onChange={(e) => handleInputChange('recruiterName', e.target.value, (value) => setCreateForm({...createForm, recruiterName: value}))}
                      placeholder="Enter recruiter name"
                      required
                      maxLength={characterLimits.recruiterName}
                    />
                    {renderCharacterCount(createForm.recruiterName, 'recruiterName')}
                  </div>
                  <div>
                    <Label htmlFor="recruiterEmail">Recruiter Email</Label>
                    <Input
                      id="recruiterEmail"
                      type="email"
                      value={createForm.recruiterEmail}
                      onChange={(e) => handleInputChange('recruiterEmail', e.target.value, (value) => setCreateForm({...createForm, recruiterEmail: value}))}
                      placeholder="Enter recruiter email"
                      maxLength={characterLimits.recruiterEmail}
                    />
                    {renderCharacterCount(createForm.recruiterEmail, 'recruiterEmail')}
                  </div>
                  <div>
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={createForm.date}
                      onChange={(e) => setCreateForm({...createForm, date: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="hours">Hours *</Label>
                    <Input
                      id="hours"
                      type="number"
                      step="0.01"
                      min="0"
                      max="24"
                      value={createForm.hours}
                      onChange={(e) => setCreateForm({...createForm, hours: e.target.value})}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={createForm.startTime}
                      onChange={(e) => setCreateForm({...createForm, startTime: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={createForm.endTime}
                      onChange={(e) => setCreateForm({...createForm, endTime: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="breakTime">Break Time (hours)</Label>
                    <Input
                      id="breakTime"
                      type="number"
                      step="0.01"
                      min="0"
                      max="9.99"
                      value={createForm.breakTime}
                      onChange={(e) => setCreateForm({...createForm, breakTime: e.target.value})}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="taskType">Task Type *</Label>
                    <Input
                      id="taskType"
                      value={createForm.taskType}
                      onChange={(e) => handleInputChange('taskType', e.target.value, (value) => setCreateForm({...createForm, taskType: value}))}
                      placeholder="e.g., Candidate Sourcing"
                      required
                      maxLength={characterLimits.taskType}
                    />
                    {renderCharacterCount(createForm.taskType, 'taskType')}
                  </div>
                  <div>
                    <Label htmlFor="taskCategory">Task Category</Label>
                    <Select value={createForm.taskCategory} onValueChange={(value) => setCreateForm({...createForm, taskCategory: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RECRUITMENT">Recruitment</SelectItem>
                        <SelectItem value="CLIENT_MANAGEMENT">Client Management</SelectItem>
                        <SelectItem value="ADMINISTRATIVE">Administrative</SelectItem>
                        <SelectItem value="TRAINING">Training</SelectItem>
                        <SelectItem value="MEETING">Meeting</SelectItem>
                        <SelectItem value="RESEARCH">Research</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={createForm.priority} onValueChange={(value) => setCreateForm({...createForm, priority: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="entityType">Entity Type</Label>
                    <Select value={createForm.entityType} onValueChange={(value) => setCreateForm({...createForm, entityType: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="JOB">Job</SelectItem>
                        <SelectItem value="CANDIDATE">Candidate</SelectItem>
                        <SelectItem value="CUSTOMER">Customer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="entityId">Entity ID</Label>
                    <Input
                      id="entityId"
                      value={createForm.entityId}
                      onChange={(e) => handleInputChange('entityId', e.target.value, (value) => setCreateForm({...createForm, entityId: value}))}
                      placeholder="Enter entity ID"
                      maxLength={characterLimits.entityId}
                    />
                    {renderCharacterCount(createForm.entityId, 'entityId')}
                  </div>
                  <div>
                    <Label htmlFor="entityName">Entity Name</Label>
                    <Input
                      id="entityName"
                      value={createForm.entityName}
                      onChange={(e) => handleInputChange('entityName', e.target.value, (value) => setCreateForm({...createForm, entityName: value}))}
                      placeholder="Enter entity name"
                      maxLength={characterLimits.entityName}
                    />
                    {renderCharacterCount(createForm.entityName, 'entityName')}
                  </div>
                  <div>
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={createForm.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value, (value) => setCreateForm({...createForm, companyName: value}))}
                      placeholder="Enter company name"
                      maxLength={characterLimits.companyName}
                    />
                    {renderCharacterCount(createForm.companyName, 'companyName')}
                  </div>
                  <div>
                    <Label htmlFor="billableRate">Billable Rate ($/hr)</Label>
                    <Input
                      id="billableRate"
                      type="number"
                      step="0.01"
                      min="0"
                      value={createForm.billableRate}
                      onChange={(e) => handleInputChange('billableRate', e.target.value, (value) => setCreateForm({...createForm, billableRate: value}))}
                      placeholder="0.00"
                      maxLength={characterLimits.billableRate}
                    />
                    {renderCharacterCount(createForm.billableRate, 'billableRate')}
                  </div>
                </div>
                <div>
                  <Label htmlFor="comments">Comments</Label>
                  <Textarea
                    id="comments"
                    value={createForm.comments}
                    onChange={(e) => handleInputChange('comments', e.target.value, (value) => setCreateForm({...createForm, comments: value}))}
                    placeholder="Enter any additional comments"
                    rows={3}
                    maxLength={characterLimits.comments}
                  />
                  {renderCharacterCount(createForm.comments, 'comments')}
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="billable"
                    checked={createForm.billable}
                    onChange={(e) => setCreateForm({...createForm, billable: e.target.checked})}
                    className="rounded"
                  />
                  <Label htmlFor="billable">Billable</Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Create Entry
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <ClockIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700">Total Entries</p>
                <p className="text-2xl font-bold text-blue-900">{timesheetData.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <UserIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-700">Approved</p>
                <p className="text-2xl font-bold text-green-900">
                  {timesheetData.filter(entry => entry.status === 'APPROVED').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <IndianRupeeIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-700">Billable Hours</p>
                <p className="text-2xl font-bold text-purple-900">
                  {totalBillableHours.toFixed(1)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-500 rounded-lg">
                <BuildingIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-orange-700">Total Hours</p>
                <p className="text-2xl font-bold text-orange-900">
                  {totalHours.toFixed(1)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-2 border-gray-100 shadow-sm">
        <CardHeader className="bg-gray-50">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <FilterIcon className="h-5 w-5 text-blue-600" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search recruiters, tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-300 focus:border-blue-500"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="border-gray-300 focus:border-blue-500">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            {/* Priority Filter */}
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="border-gray-300 focus:border-blue-500">
                <SelectValue placeholder="Filter by Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            {/* Entity Type Filter */}
            <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
              <SelectTrigger className="border-gray-300 focus:border-blue-500">
                <SelectValue placeholder="Filter by Entity Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entity Types</SelectItem>
                <SelectItem value="job">Job</SelectItem>
                <SelectItem value="candidate">Candidate</SelectItem>
              </SelectContent>
            </Select>

            {/* Task Category Filter */}
            <Select value={taskCategoryFilter} onValueChange={setTaskCategoryFilter}>
              <SelectTrigger className="border-gray-300 focus:border-blue-500">
                <SelectValue placeholder="Filter by Task Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="recruitment">Recruitment</SelectItem>
                <SelectItem value="client_management">Client Management</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
              </SelectContent>
            </Select>

            {/* Billable Filter */}
            <Select value={billableFilter} onValueChange={setBillableFilter}>
              <SelectTrigger className="border-gray-300 focus:border-blue-500">
                <SelectValue placeholder="Filter by Billable" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Billable</SelectItem>
                <SelectItem value="false">Non-Billable</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal border-gray-300 focus:border-blue-500">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFilter ? format(dateFilter, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateFilter}
                  onSelect={setDateFilter}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Timesheet Table */}
      <Card className="border-2 border-gray-100 shadow-sm">
        <CardHeader className="bg-gray-50">
          <CardTitle className="text-gray-800">Timesheet Entries</CardTitle>
          <CardDescription className="text-gray-600">
            Showing {filteredData.length} of {timesheetData.length} entries
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="rounded-lg border border-gray-200 overflow-hidden">
                         <Table>
               <TableHeader className="bg-gray-50">
                                  <TableRow>
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap px-6 py-4">Recruiter ID</TableHead>
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap px-6 py-4">Recruiter</TableHead>
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap px-6 py-4">Date</TableHead>
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap px-6 py-4">Time</TableHead>
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap px-6 py-4">Hours</TableHead>
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap px-6 py-4">Break Time</TableHead>
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap px-6 py-4">Task</TableHead>
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap px-6 py-4">Entity Type</TableHead>
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap px-6 py-4">Entity ID</TableHead>
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap px-6 py-4">Entity Name</TableHead>
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap px-6 py-4">Priority</TableHead>
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap px-6 py-4">Status</TableHead>
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap px-6 py-4">Billable</TableHead>
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap px-6 py-4">Billable Rate</TableHead>
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap px-6 py-4">Company</TableHead>
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap px-6 py-4">Comments</TableHead>
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap px-6 py-4">Attachments</TableHead>
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap px-6 py-4">Created At</TableHead>
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap px-6 py-4">Updated At</TableHead>
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap px-6 py-4">Approved At</TableHead>
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap px-6 py-4">Approved By</TableHead>
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap px-6 py-4">Actions</TableHead>
                  </TableRow>
               </TableHeader>
              <TableBody>
                                 {filteredData.map((entry) => (
                   <TableRow key={entry.id} className="hover:bg-gray-50 transition-colors">
                     <TableCell className="whitespace-nowrap px-6 py-4">
                       <div className="text-sm">
                         {entry.recruiterId ? (
                           <span className="font-medium text-gray-900">{entry.recruiterId}</span>
                         ) : (
                           <span className="text-gray-400 italic">N/A</span>
                         )}
                       </div>
                     </TableCell>
                                          <TableCell className="whitespace-nowrap px-6 py-4">
                       <div>
                         <p className="font-medium text-gray-900">{entry.recruiterName}</p>
                         <p className="text-sm text-gray-500">{entry.recruiterEmail}</p>
                       </div>
                     </TableCell>
                     <TableCell className="whitespace-nowrap px-6 py-4">
                       <div className="text-sm font-medium text-gray-900">
                         {new Date(entry.date).toLocaleDateString()}
                       </div>
                     </TableCell>
                     <TableCell className="whitespace-nowrap px-6 py-4">
                       <div className="text-sm">
                         {entry.startTime && entry.endTime ? (
                           <span className="font-medium text-gray-900">
                             {entry.startTime} - {entry.endTime}
                           </span>
                         ) : (
                           <span className="text-gray-400 italic">N/A</span>
                         )}
                       </div>
                     </TableCell>
                     <TableCell className="whitespace-nowrap px-6 py-4">
                       <div className="text-sm">
                         <span className="font-bold text-gray-900">{entry.hours} hrs</span>
                       </div>
                     </TableCell>
                     <TableCell className="whitespace-nowrap px-6 py-4">
                       <div className="text-sm">
                         {entry.breakTime ? (
                           <span className="font-medium text-gray-900">{entry.breakTime} hrs</span>
                         ) : (
                           <span className="text-gray-400 italic">N/A</span>
                         )}
                       </div>
                     </TableCell>
                                         <TableCell className="whitespace-nowrap px-6 py-4">
                       <div>
                         <p className="font-medium text-sm text-gray-900">{entry.taskType}</p>
                         <Badge variant="secondary" className="text-xs mt-1">
                           {entry.taskCategory}
                         </Badge>
                       </div>
                     </TableCell>
                     <TableCell className="whitespace-nowrap px-6 py-4">
                       <Badge className={`${getEntityTypeColor(entry.entityType)} border`}>
                         {entry.entityType}
                       </Badge>
                     </TableCell>
                     <TableCell className="whitespace-nowrap px-6 py-4">
                       <div className="text-sm">
                         {entry.entityId ? (
                           <span className="font-medium text-gray-900">{entry.entityId}</span>
                         ) : (
                           <span className="text-gray-400 italic">N/A</span>
                         )}
                       </div>
                     </TableCell>
                     <TableCell className="whitespace-nowrap px-6 py-4">
                       <div className="text-sm">
                         {entry.entityName ? (
                           <span className="font-medium text-gray-900">{entry.entityName}</span>
                         ) : (
                           <span className="text-gray-400 italic">N/A</span>
                         )}
                       </div>
                     </TableCell>
                                          <TableCell className="whitespace-nowrap px-6 py-4">
                       <Badge className={`${getPriorityColor(entry.priority)} border`}>
                         {entry.priority}
                       </Badge>
                     </TableCell>
                     <TableCell className="whitespace-nowrap px-6 py-4">
                       <Badge className={`${getStatusColor(entry.status)} border`}>
                         {entry.status}
                       </Badge>
                     </TableCell>
                     <TableCell className="whitespace-nowrap px-6 py-4">
                       <div>
                         <Badge variant={entry.billable ? "default" : "secondary"} className="border">
                           {entry.billable ? "Yes" : "No"}
                         </Badge>
                       </div>
                     </TableCell>
                     <TableCell className="whitespace-nowrap px-6 py-4">
                       <div className="text-sm">
                         {entry.billableRate ? (
                           <span className="font-medium text-gray-900">${entry.billableRate}/hr</span>
                         ) : (
                           <span className="text-gray-400 italic">N/A</span>
                         )}
                       </div>
                     </TableCell>
                     <TableCell className="whitespace-nowrap px-6 py-4">
                       <div className="text-sm">
                         {entry.companyName ? (
                           <span className="font-medium text-gray-900">{entry.companyName}</span>
                         ) : (
                           <span className="text-gray-400 italic">N/A</span>
                         )}
                       </div>
                     </TableCell>
                     <TableCell className="whitespace-nowrap px-6 py-4">
                       <div className="text-sm max-w-xs">
                         <span className="text-gray-900">
                           {truncateComment(entry.comments || "No comments")}
                         </span>
                         {isCommentTruncated(entry.comments) && (
                           <Button
                             variant="link"
                             size="sm"
                             className="p-0 h-auto text-blue-600 hover:text-blue-800 ml-1"
                             onClick={() => openCommentDialog(entry.comments || "", `${entry.recruiterName} - ${entry.taskType}`)}
                           >
                             more
                           </Button>
                         )}
                       </div>
                     </TableCell>
                                                                  <TableCell className="whitespace-nowrap px-6 py-4">
                         <div className="text-sm">
                           {entry.attachments ? (
                             <Dialog open={attachmentDialogOpen && selectedEntry?.id === entry.id} onOpenChange={setAttachmentDialogOpen}>
                               <DialogTrigger asChild>
                                 <Button variant="outline" size="sm" className="flex items-center gap-1">
                                   <PaperclipIcon className="h-3 w-3" />
                                   View
                                 </Button>
                               </DialogTrigger>
                               <DialogContent className="max-w-2xl">
                                 <DialogHeader>
                                   <DialogTitle>Attachment Management</DialogTitle>
                                   <DialogDescription>
                                     Manage attached files for this timesheet entry
                                   </DialogDescription>
                                 </DialogHeader>
                                 {selectedEntry && (
                                   <div className="space-y-4">
                                     <div className="p-4 bg-gray-50 rounded-lg">
                                       <p className="text-sm font-medium text-gray-900">Entry Details:</p>
                                       <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                                         <div>
                                           <Label className="text-xs font-medium text-gray-700">Date:</Label>
                                           <p className="text-xs text-gray-600">{new Date(selectedEntry.date).toLocaleDateString()}</p>
                                         </div>
                                         <div>
                                           <Label className="text-xs font-medium text-gray-700">Task:</Label>
                                           <p className="text-xs text-gray-600">{selectedEntry.taskType}</p>
                                         </div>
                                       </div>
                                     </div>
                                     
                                     {/* Action Buttons */}
                                     <div className="flex gap-2">
                                       <Button 
                                         variant={attachmentAction === 'view' ? 'default' : 'outline'} 
                                         size="sm"
                                         onClick={() => setAttachmentAction('view')}
                                       >
                                         View
                                       </Button>
                                       <Button 
                                         variant={attachmentAction === 'add' ? 'default' : 'outline'} 
                                         size="sm"
                                         onClick={() => setAttachmentAction('add')}
                                       >
                                         Add
                                       </Button>
                                       <Button 
                                         variant={attachmentAction === 'edit' ? 'default' : 'outline'} 
                                         size="sm"
                                         onClick={() => setAttachmentAction('edit')}
                                         disabled={!selectedEntry.attachments}
                                       >
                                         Edit
                                       </Button>
                                       <Button 
                                         variant={attachmentAction === 'delete' ? 'default' : 'outline'} 
                                         size="sm"
                                         onClick={() => setAttachmentAction('delete')}
                                         disabled={!selectedEntry.attachments}
                                       >
                                         Delete
                                       </Button>
                                     </div>

                                     {/* View Attachments */}
                                     {attachmentAction === 'view' && (
                                       <div className="space-y-4">
                                         {selectedEntry.attachments ? (
                                           <div className="p-4 bg-blue-50 rounded-lg">
                                             <p className="text-sm font-medium text-blue-900">Attached Files:</p>
                                             <div className="mt-2 space-y-2">
                                               {selectedEntry.attachments.split(',').map((attachment, index) => {
                                                 const [name, path] = attachment.split(':');
                                                 return (
                                                   <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                                                     <div>
                                                       <p className="text-sm font-medium text-gray-900">{name}</p>
                                                       <p className="text-xs text-gray-500">{path}</p>
                                                     </div>
                                                     <Button variant="outline" size="sm">
                                                       Download
                                                     </Button>
                                                   </div>
                                                 );
                                               })}
                                             </div>
                                           </div>
                                         ) : (
                                           <div className="p-4 bg-yellow-50 rounded-lg">
                                             <p className="text-sm text-yellow-900">No attachments found</p>
                                             <p className="text-xs text-yellow-700 mt-1">This timesheet entry has no attached files.</p>
                                           </div>
                                         )}
                                       </div>
                                     )}

                                     {/* Add Attachment */}
                                     {attachmentAction === 'add' && (
                                       <div className="p-4 bg-green-50 rounded-lg">
                                         <p className="text-sm font-medium text-green-900 mb-3">Add New Attachment:</p>
                                         <div className="space-y-3">
                                           <div>
                                             <Label htmlFor="newAttachment">Select File</Label>
                                             <Input
                                               id="newAttachment"
                                               type="file"
                                               onChange={(e) => setNewAttachmentFile(e.target.files?.[0] || null)}
                                               className="mt-1"
                                             />
                                           </div>
                                           {newAttachmentFile && (
                                             <div className="p-2 bg-white rounded border">
                                               <p className="text-sm font-medium text-gray-900">{newAttachmentFile.name}</p>
                                               <p className="text-xs text-gray-500">{(newAttachmentFile.size / 1024).toFixed(2)} KB</p>
                                             </div>
                                           )}
                                           <Button 
                                             onClick={handleAttachmentAdd}
                                             disabled={!newAttachmentFile || attachmentLoading}
                                             className="w-full"
                                           >
                                             {attachmentLoading ? 'Adding...' : 'Add Attachment'}
                                           </Button>
                                         </div>
                                       </div>
                                     )}

                                     {/* Edit Attachment */}
                                     {attachmentAction === 'edit' && selectedEntry.attachments && (
                                       <div className="p-4 bg-blue-50 rounded-lg">
                                         <p className="text-sm font-medium text-blue-900 mb-3">Edit Attachment:</p>
                                         <div className="space-y-3">
                                           <div>
                                             <Label htmlFor="selectAttachment">Select Attachment to Edit</Label>
                                             <Select value={selectedAttachment} onValueChange={setSelectedAttachment}>
                                               <SelectTrigger>
                                                 <SelectValue placeholder="Choose attachment to edit" />
                                               </SelectTrigger>
                                               <SelectContent>
                                                 {selectedEntry.attachments.split(',').map((attachment, index) => {
                                                   const [name] = attachment.split(':');
                                                   return (
                                                     <SelectItem key={index} value={name}>
                                                       {name}
                                                     </SelectItem>
                                                   );
                                                 })}
                                               </SelectContent>
                                             </Select>
                                           </div>
                                           {selectedAttachment && (
                                             <>
                                               <div>
                                                 <Label htmlFor="newAttachmentFile">Select New File</Label>
                                                 <Input
                                                   id="newAttachmentFile"
                                                   type="file"
                                                   onChange={(e) => setNewAttachmentFile(e.target.files?.[0] || null)}
                                                   className="mt-1"
                                                 />
                                               </div>
                                               {newAttachmentFile && (
                                                 <div className="p-2 bg-white rounded border">
                                                   <p className="text-sm font-medium text-gray-900">{newAttachmentFile.name}</p>
                                                   <p className="text-xs text-gray-500">{(newAttachmentFile.size / 1024).toFixed(2)} KB</p>
                                                 </div>
                                               )}
                                               <Button 
                                                 onClick={handleAttachmentUpdate}
                                                 disabled={!newAttachmentFile || attachmentLoading}
                                                 className="w-full"
                                               >
                                                 {attachmentLoading ? 'Updating...' : 'Update Attachment'}
                                               </Button>
                                             </>
                                           )}
                                         </div>
                                       </div>
                                     )}

                                     {/* Delete Attachment */}
                                     {attachmentAction === 'delete' && selectedEntry.attachments && (
                                       <div className="p-4 bg-red-50 rounded-lg">
                                         <p className="text-sm font-medium text-red-900 mb-3">Delete Attachment:</p>
                                         <div className="space-y-3">
                                           <div>
                                             <Label htmlFor="deleteAttachment">Select Attachment to Delete</Label>
                                             <Select value={selectedAttachment} onValueChange={setSelectedAttachment}>
                                               <SelectTrigger>
                                                 <SelectValue placeholder="Choose attachment to delete" />
                                               </SelectTrigger>
                                               <SelectContent>
                                                 {selectedEntry.attachments.split(',').map((attachment, index) => {
                                                   const [name] = attachment.split(':');
                                                   return (
                                                     <SelectItem key={index} value={name}>
                                                       {name}
                                                     </SelectItem>
                                                   );
                                                 })}
                                               </SelectContent>
                                             </Select>
                                           </div>
                                           {selectedAttachment && (
                                             <div className="p-3 bg-red-100 rounded border border-red-200">
                                               <p className="text-sm text-red-800">
                                                 Are you sure you want to delete "{selectedAttachment}"?
                                               </p>
                                               <p className="text-xs text-red-600 mt-1">
                                                 This action cannot be undone.
                                               </p>
                                             </div>
                                           )}
                                           <Button 
                                             onClick={handleAttachmentDelete}
                                             disabled={!selectedAttachment || attachmentLoading}
                                             variant="destructive"
                                             className="w-full"
                                           >
                                             {attachmentLoading ? 'Deleting...' : 'Delete Attachment'}
                                           </Button>
                                         </div>
                                       </div>
                                     )}

                                     <div className="flex justify-end">
                                       <Button variant="outline" onClick={() => {
                                         setAttachmentDialogOpen(false);
                                         setAttachmentAction('view');
                                         setSelectedAttachment('');
                                         setNewAttachmentFile(null);
                                       }}>
                                         Close
                                       </Button>
                                     </div>
                                   </div>
                                 )}
                               </DialogContent>
                             </Dialog>
                           ) : (
                             <span className="text-gray-400 italic">No attachments</span>
                           )}
                         </div>
                       </TableCell>
                       <TableCell className="whitespace-nowrap px-6 py-4">
                         <div className="text-sm">
                           <span className="font-medium text-gray-900">
                             {new Date(entry.createdAt).toLocaleDateString()}
                           </span>
                           <p className="text-xs text-gray-500">
                             {new Date(entry.createdAt).toLocaleTimeString()}
                           </p>
                         </div>
                       </TableCell>
                       <TableCell className="whitespace-nowrap px-6 py-4">
                         <div className="text-sm">
                           <span className="font-medium text-gray-900">
                             {new Date(entry.updatedAt).toLocaleDateString()}
                           </span>
                           <p className="text-xs text-gray-500">
                             {new Date(entry.updatedAt).toLocaleTimeString()}
                           </p>
                         </div>
                       </TableCell>
                      <TableCell className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm">
                          {entry.approvedAt ? (
                            <span className="font-medium text-green-900">
                              {new Date(entry.approvedAt).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">Not approved</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm">
                          {entry.approvedBy ? (
                            <span className="font-medium text-gray-900">{entry.approvedBy}</span>
                          ) : (
                            <span className="text-gray-400 italic">Not approved</span>
                          )}
                        </div>
                      </TableCell>
                     <TableCell className="whitespace-nowrap px-6 py-4">
                       <div className="flex items-center gap-1">
                         {/* View Button */}
                         <Dialog open={viewDialogOpen && selectedEntry?.id === entry.id} onOpenChange={setViewDialogOpen}>
                           <DialogTrigger asChild>
                             <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => openViewDialog(entry)}>
                               <EyeIcon className="h-3 w-3" />
                             </Button>
                           </DialogTrigger>
                           <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                             <DialogHeader className="border-b pb-4">
                               <div className="flex items-center justify-between">
                                 <div>
                                   <DialogTitle className="text-2xl font-bold text-gray-900">
                                     Timesheet Entry Details
                                   </DialogTitle>
                                   <DialogDescription className="text-gray-600 mt-1">
                                     Comprehensive view of {entry.recruiterName}'s timesheet entry
                                   </DialogDescription>
                                 </div>
                                 <div className="flex gap-2">
                                   <Button 
                                     variant="outline" 
                                     size="sm"
                                     onClick={exportExcel}
                                     className="flex items-center gap-2"
                                   >
                                     <FileSpreadsheetIcon className="h-4 w-4" />
                                     Export Excel
                                   </Button>
                                   <Button 
                                     variant="outline" 
                                     size="sm"
                                     onClick={() => setViewDialogOpen(false)}
                                   >
                                     Close
                                   </Button>
                                 </div>
                               </div>
                             </DialogHeader>
                             {selectedEntry && (
                               <div className="space-y-6 py-4">
                                 {/* Header Section */}
                                 <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                                   <div className="flex items-center justify-between mb-4">
                                     <div className="flex items-center gap-3">
                                       <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                         <UserIcon className="h-6 w-6 text-blue-600" />
                                       </div>
                                       <div>
                                         <h3 className="text-xl font-semibold text-gray-900">{selectedEntry.recruiterName}</h3>
                                         <p className="text-sm text-gray-600">{selectedEntry.recruiterEmail || 'No email provided'}</p>
                                       </div>
                                     </div>
                                     <div className="text-right">
                                       <p className="text-2xl font-bold text-blue-600">{selectedEntry.hours} hrs</p>
                                       <p className="text-sm text-gray-600">{new Date(selectedEntry.date).toLocaleDateString()}</p>
                                     </div>
                                   </div>
                                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                     <div className="text-center">
                                       <p className="text-xs text-gray-500 uppercase tracking-wide">Start Time</p>
                                       <p className="text-sm font-medium text-gray-900">{selectedEntry.startTime || 'N/A'}</p>
                                     </div>
                                     <div className="text-center">
                                       <p className="text-xs text-gray-500 uppercase tracking-wide">End Time</p>
                                       <p className="text-sm font-medium text-gray-900">{selectedEntry.endTime || 'N/A'}</p>
                                     </div>
                                     <div className="text-center">
                                       <p className="text-xs text-gray-500 uppercase tracking-wide">Break Time</p>
                                       <p className="text-sm font-medium text-gray-900">{selectedEntry.breakTime ? `${selectedEntry.breakTime} hrs` : 'N/A'}</p>
                                     </div>
                                     <div className="text-center">
                                       <p className="text-xs text-gray-500 uppercase tracking-wide">Billable Rate</p>
                                       <p className="text-sm font-medium text-gray-900">
                                         {selectedEntry.billableRate ? `$${selectedEntry.billableRate}/hr` : 'N/A'}
                                       </p>
                                     </div>
                                   </div>
                                 </div>

                                 {/* Main Content Grid */}
                                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                   {/* Left Column */}
                                   <div className="space-y-6">
                                     {/* Task Information */}
                                     <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                       <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                         <ClockIcon className="h-5 w-5 text-blue-600" />
                                         Task Information
                                       </h4>
                                       <div className="space-y-4">
                                         <div className="flex items-center justify-between">
                                           <span className="text-sm font-medium text-gray-700">Task Type</span>
                                           <span className="text-sm text-gray-900">{selectedEntry.taskType}</span>
                                         </div>
                                         <div className="flex items-center justify-between">
                                           <span className="text-sm font-medium text-gray-700">Category</span>
                                           <Badge variant="secondary">{selectedEntry.taskCategory}</Badge>
                                         </div>
                                         <div className="flex items-center justify-between">
                                           <span className="text-sm font-medium text-gray-700">Priority</span>
                                           <Badge className={getPriorityColor(selectedEntry.priority)}>{selectedEntry.priority}</Badge>
                                         </div>
                                         <div className="flex items-center justify-between">
                                           <span className="text-sm font-medium text-gray-700">Status</span>
                                           <Badge className={getStatusColor(selectedEntry.status)}>{selectedEntry.status}</Badge>
                                         </div>
                                         <div className="flex items-center justify-between">
                                           <span className="text-sm font-medium text-gray-700">Billable</span>
                                           <Badge variant={selectedEntry.billable ? "default" : "secondary"}>
                                             {selectedEntry.billable ? "Yes" : "No"}
                                           </Badge>
                                         </div>
                                       </div>
                                     </div>

                                     {/* Entity Information */}
                                     <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                       <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                         <BuildingIcon className="h-5 w-5 text-green-600" />
                                         Entity Information
                                       </h4>
                                       <div className="space-y-4">
                                         <div className="flex items-center justify-between">
                                           <span className="text-sm font-medium text-gray-700">Entity Type</span>
                                           <Badge className={getEntityTypeColor(selectedEntry.entityType)}>{selectedEntry.entityType}</Badge>
                                         </div>
                                         <div className="flex items-center justify-between">
                                           <span className="text-sm font-medium text-gray-700">Entity Name</span>
                                           <span className="text-sm text-gray-900">{selectedEntry.entityName || 'N/A'}</span>
                                         </div>
                                         <div className="flex items-center justify-between">
                                           <span className="text-sm font-medium text-gray-700">Company</span>
                                           <span className="text-sm text-gray-900">{selectedEntry.companyName || 'N/A'}</span>
                                         </div>
                                       </div>
                                     </div>
                                   </div>

                                   {/* Right Column */}
                                   <div className="space-y-6">
                                     {/* Comments */}
                                     <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                       <h4 className="text-lg font-semibold text-gray-900 mb-4">Comments</h4>
                                       <div className="bg-gray-50 rounded-lg p-4 min-h-[100px]">
                                         <p className="text-sm text-gray-700 leading-relaxed">
                                           {selectedEntry.comments || 'No comments provided for this timesheet entry.'}
                                         </p>
                                       </div>
                                     </div>

                                     {/* Attachments */}
                                     {selectedEntry.attachments && (
                                       <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                         <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                           <PaperclipIcon className="h-5 w-5 text-purple-600" />
                                           Attachments
                                         </h4>
                                         <div className="space-y-2">
                                           {selectedEntry.attachments.split(',').map((attachment, index) => {
                                             const [name, path] = attachment.split(':');
                                             return (
                                               <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                 <div>
                                                   <p className="text-sm font-medium text-gray-900">{name}</p>
                                                   <p className="text-xs text-gray-500">{path}</p>
                                                 </div>
                                                 <Button variant="outline" size="sm">
                                                   Download
                                                 </Button>
                                               </div>
                                             );
                                           })}
                                         </div>
                                       </div>
                                     )}

                                     {/* Timestamps */}
                                     <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                       <h4 className="text-lg font-semibold text-gray-900 mb-4">Timestamps</h4>
                                       <div className="space-y-3">
                                         <div className="flex items-center justify-between">
                                           <span className="text-sm font-medium text-gray-700">Created</span>
                                           <span className="text-sm text-gray-900">
                                             {new Date(selectedEntry.createdAt).toLocaleString()}
                                           </span>
                                         </div>
                                         <div className="flex items-center justify-between">
                                           <span className="text-sm font-medium text-gray-700">Updated</span>
                                           <span className="text-sm text-gray-900">
                                             {new Date(selectedEntry.updatedAt).toLocaleString()}
                                           </span>
                                         </div>
                                         {selectedEntry.approvedAt && (
                                           <div className="flex items-center justify-between">
                                             <span className="text-sm font-medium text-gray-700">Approved</span>
                                             <span className="text-sm text-gray-900">
                                               {new Date(selectedEntry.approvedAt).toLocaleString()}
                                             </span>
                                           </div>
                                         )}
                                         {selectedEntry.approvedBy && (
                                           <div className="flex items-center justify-between">
                                             <span className="text-sm font-medium text-gray-700">Approved By</span>
                                             <span className="text-sm text-gray-900">{selectedEntry.approvedBy}</span>
                                           </div>
                                         )}
                                       </div>
                                     </div>
                                   </div>
                                 </div>
                               </div>
                             )}
                           </DialogContent>
                         </Dialog>

                         {/* Edit Button */}
                         <Dialog open={editDialogOpen && selectedEntry?.id === entry.id} onOpenChange={setEditDialogOpen}>
                           <DialogTrigger asChild>
                             <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => openEditDialog(entry)}>
                               <EditIcon className="h-3 w-3" />
                             </Button>
                           </DialogTrigger>
                           <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                             <DialogHeader>
                               <DialogTitle>Edit Timesheet Entry</DialogTitle>
                               <DialogDescription>
                                 Edit timesheet entry for {entry.recruiterName}
                               </DialogDescription>
                             </DialogHeader>
                             <form onSubmit={handleEditSubmit} className="space-y-4">
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <div>
                                   <Label htmlFor="edit-recruiterName">Recruiter Name *</Label>
                                   <Input
                                     id="edit-recruiterName"
                                     value={editForm.recruiterName}
                                     onChange={(e) => handleInputChange('recruiterName', e.target.value, (value) => setEditForm({...editForm, recruiterName: value}))}
                                     placeholder="Enter recruiter name"
                                     required
                                     maxLength={characterLimits.recruiterName}
                                   />
                                   {renderCharacterCount(editForm.recruiterName, 'recruiterName')}
                                 </div>
                                 <div>
                                   <Label htmlFor="edit-recruiterEmail">Recruiter Email</Label>
                                   <Input
                                     id="edit-recruiterEmail"
                                     type="email"
                                     value={editForm.recruiterEmail}
                                     onChange={(e) => handleInputChange('recruiterEmail', e.target.value, (value) => setEditForm({...editForm, recruiterEmail: value}))}
                                     placeholder="Enter recruiter email"
                                     maxLength={characterLimits.recruiterEmail}
                                   />
                                   {renderCharacterCount(editForm.recruiterEmail, 'recruiterEmail')}
                                 </div>
                                 <div>
                                   <Label htmlFor="edit-date">Date *</Label>
                                   <Input
                                     id="edit-date"
                                     type="date"
                                     value={editForm.date}
                                     onChange={(e) => setEditForm({...editForm, date: e.target.value})}
                                     required
                                   />
                                 </div>
                                 <div>
                                   <Label htmlFor="edit-hours">Hours *</Label>
                                   <Input
                                     id="edit-hours"
                                     type="number"
                                     step="0.01"
                                     min="0"
                                     max="24"
                                     value={editForm.hours}
                                     onChange={(e) => setEditForm({...editForm, hours: e.target.value})}
                                     placeholder="0.00"
                                     required
                                   />
                                 </div>
                                 <div>
                                   <Label htmlFor="edit-startTime">Start Time</Label>
                                   <Input
                                     id="edit-startTime"
                                     type="time"
                                     value={editForm.startTime}
                                     onChange={(e) => setEditForm({...editForm, startTime: e.target.value})}
                                   />
                                 </div>
                                 <div>
                                   <Label htmlFor="edit-endTime">End Time</Label>
                                   <Input
                                     id="edit-endTime"
                                     type="time"
                                     value={editForm.endTime}
                                     onChange={(e) => setEditForm({...editForm, endTime: e.target.value})}
                                   />
                                 </div>
                                 <div>
                                   <Label htmlFor="edit-breakTime">Break Time (hours)</Label>
                                   <Input
                                     id="edit-breakTime"
                                     type="number"
                                     step="0.01"
                                     min="0"
                                     max="9.99"
                                     value={editForm.breakTime}
                                     onChange={(e) => setEditForm({...editForm, breakTime: e.target.value})}
                                     placeholder="0.00"
                                   />
                                 </div>
                                 <div>
                                   <Label htmlFor="edit-taskType">Task Type *</Label>
                                   <Input
                                     id="edit-taskType"
                                     value={editForm.taskType}
                                     onChange={(e) => handleInputChange('taskType', e.target.value, (value) => setEditForm({...editForm, taskType: value}))}
                                     placeholder="e.g., Candidate Sourcing"
                                     required
                                     maxLength={characterLimits.taskType}
                                   />
                                   {renderCharacterCount(editForm.taskType, 'taskType')}
                                 </div>
                                 <div>
                                   <Label htmlFor="edit-taskCategory">Task Category</Label>
                                   <Select value={editForm.taskCategory} onValueChange={(value) => setEditForm({...editForm, taskCategory: value})}>
                                     <SelectTrigger>
                                       <SelectValue />
                                     </SelectTrigger>
                                     <SelectContent>
                                       <SelectItem value="RECRUITMENT">Recruitment</SelectItem>
                                       <SelectItem value="CLIENT_MANAGEMENT">Client Management</SelectItem>
                                       <SelectItem value="ADMINISTRATIVE">Administrative</SelectItem>
                                       <SelectItem value="TRAINING">Training</SelectItem>
                                       <SelectItem value="MEETING">Meeting</SelectItem>
                                       <SelectItem value="RESEARCH">Research</SelectItem>
                                       <SelectItem value="OTHER">Other</SelectItem>
                                     </SelectContent>
                                   </Select>
                                 </div>
                                 <div>
                                   <Label htmlFor="edit-priority">Priority</Label>
                                   <Select value={editForm.priority} onValueChange={(value) => setEditForm({...editForm, priority: value})}>
                                     <SelectTrigger>
                                       <SelectValue />
                                     </SelectTrigger>
                                     <SelectContent>
                                       <SelectItem value="LOW">Low</SelectItem>
                                       <SelectItem value="MEDIUM">Medium</SelectItem>
                                       <SelectItem value="HIGH">High</SelectItem>
                                       <SelectItem value="URGENT">Urgent</SelectItem>
                                     </SelectContent>
                                   </Select>
                                 </div>
                                 <div>
                                   <Label htmlFor="edit-entityType">Entity Type</Label>
                                   <Select value={editForm.entityType} onValueChange={(value) => setEditForm({...editForm, entityType: value})}>
                                     <SelectTrigger>
                                       <SelectValue />
                                     </SelectTrigger>
                                     <SelectContent>
                                       <SelectItem value="JOB">Job</SelectItem>
                                       <SelectItem value="CANDIDATE">Candidate</SelectItem>
                                       <SelectItem value="CUSTOMER">Customer</SelectItem>
                                     </SelectContent>
                                   </Select>
                                 </div>
                                 <div>
                                   <Label htmlFor="edit-entityId">Entity ID</Label>
                                   <Input
                                     id="edit-entityId"
                                     value={editForm.entityId}
                                     onChange={(e) => handleInputChange('entityId', e.target.value, (value) => setEditForm({...editForm, entityId: value}))}
                                     placeholder="Enter entity ID"
                                     maxLength={characterLimits.entityId}
                                   />
                                   {renderCharacterCount(editForm.entityId, 'entityId')}
                                 </div>
                                 <div>
                                   <Label htmlFor="edit-entityName">Entity Name</Label>
                                   <Input
                                     id="edit-entityName"
                                     value={editForm.entityName}
                                     onChange={(e) => handleInputChange('entityName', e.target.value, (value) => setEditForm({...editForm, entityName: value}))}
                                     placeholder="Enter entity name"
                                     maxLength={characterLimits.entityName}
                                   />
                                   {renderCharacterCount(editForm.entityName, 'entityName')}
                                 </div>
                                 <div>
                                   <Label htmlFor="edit-companyName">Company Name</Label>
                                   <Input
                                     id="edit-companyName"
                                     value={editForm.companyName}
                                     onChange={(e) => handleInputChange('companyName', e.target.value, (value) => setEditForm({...editForm, companyName: value}))}
                                     placeholder="Enter company name"
                                     maxLength={characterLimits.companyName}
                                   />
                                   {renderCharacterCount(editForm.companyName, 'companyName')}
                                 </div>
                                 <div>
                                   <Label htmlFor="edit-billableRate">Billable Rate ($/hr)</Label>
                                   <Input
                                     id="edit-billableRate"
                                     type="number"
                                     step="0.01"
                                     min="0"
                                     value={editForm.billableRate}
                                     onChange={(e) => handleInputChange('billableRate', e.target.value, (value) => setEditForm({...editForm, billableRate: value}))}
                                     placeholder="0.00"
                                     maxLength={characterLimits.billableRate}
                                   />
                                   {renderCharacterCount(editForm.billableRate, 'billableRate')}
                                 </div>
                               </div>
                               <div>
                                 <Label htmlFor="edit-comments">Comments</Label>
                                 <Textarea
                                   id="edit-comments"
                                   value={editForm.comments}
                                   onChange={(e) => handleInputChange('comments', e.target.value, (value) => setEditForm({...editForm, comments: value}))}
                                   placeholder="Enter any additional comments"
                                   rows={3}
                                   maxLength={characterLimits.comments}
                                 />
                                 {renderCharacterCount(editForm.comments, 'comments')}
                               </div>
                               <div className="flex items-center space-x-2">
                                 <input
                                   type="checkbox"
                                   id="edit-billable"
                                   checked={editForm.billable}
                                   onChange={(e) => setEditForm({...editForm, billable: e.target.checked})}
                                   className="rounded"
                                 />
                                 <Label htmlFor="edit-billable">Billable</Label>
                               </div>
                               <div className="flex justify-end gap-2">
                                 <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                                   Cancel
                                 </Button>
                                 <Button type="submit">
                                   Save Changes
                                 </Button>
                               </div>
                             </form>
                           </DialogContent>
                         </Dialog>

                         {/* Approve Button */}
                         <Dialog open={approveDialogOpen && selectedEntry?.id === entry.id} onOpenChange={setApproveDialogOpen}>
                           <DialogTrigger asChild>
                             <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => openApproveDialog(entry)}>
                               <CheckCircleIcon className="h-3 w-3" />
                             </Button>
                           </DialogTrigger>
                           <DialogContent className="max-w-2xl">
                             <DialogHeader>
                               <DialogTitle>Approval Management</DialogTitle>
                               <DialogDescription>
                                 Manage approval data for this timesheet entry
                               </DialogDescription>
                             </DialogHeader>
                             {selectedEntry && (
                               <div className="space-y-4">
                                 <div className="p-4 bg-gray-50 rounded-lg">
                                   <p className="text-sm font-medium text-gray-900">Entry Details:</p>
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                                     <div>
                                       <Label className="text-xs font-medium text-gray-700">Date:</Label>
                                       <p className="text-xs text-gray-600">{new Date(selectedEntry.date).toLocaleDateString()}</p>
                                     </div>
                                     <div>
                                       <Label className="text-xs font-medium text-gray-700">Hours:</Label>
                                       <p className="text-xs text-gray-600">{selectedEntry.hours} hrs</p>
                                     </div>
                                     <div>
                                       <Label className="text-xs font-medium text-gray-700">Task:</Label>
                                       <p className="text-xs text-gray-600">{selectedEntry.taskType}</p>
                                     </div>
                                     <div>
                                       <Label className="text-xs font-medium text-gray-700">Status:</Label>
                                       <Badge className={getStatusColor(selectedEntry.status)}>{selectedEntry.status}</Badge>
                                     </div>
                                   </div>
                                 </div>
                                 
                                 {/* Action Buttons */}
                                 <div className="flex gap-2">
                                   <Button 
                                     variant={approvalAction === 'view' ? 'default' : 'outline'} 
                                     size="sm"
                                     onClick={() => setApprovalAction('view')}
                                   >
                                     View
                                   </Button>
                                   <Button 
                                     variant={approvalAction === 'add' ? 'default' : 'outline'} 
                                     size="sm"
                                     onClick={() => setApprovalAction('add')}
                                   >
                                     Add
                                   </Button>
                                   <Button 
                                     variant={approvalAction === 'edit' ? 'default' : 'outline'} 
                                     size="sm"
                                     onClick={() => setApprovalAction('edit')}
                                     disabled={!selectedEntry.approvedBy}
                                   >
                                     Edit
                                   </Button>
                                   <Button 
                                     variant={approvalAction === 'delete' ? 'default' : 'outline'} 
                                     size="sm"
                                     onClick={() => setApprovalAction('delete')}
                                     disabled={!selectedEntry.approvedBy}
                                   >
                                     Delete
                                   </Button>
                                 </div>

                                 {/* View Approval */}
                                 {approvalAction === 'view' && (
                                   <div className="space-y-4">
                                     {selectedEntry.approvedBy ? (
                                       <div className="p-4 bg-green-50 rounded-lg">
                                         <p className="text-sm font-medium text-green-900">Approval Details:</p>
                                         <div className="mt-2 space-y-2">
                                           <div className="flex justify-between">
                                             <span className="text-sm text-gray-700">Approved By:</span>
                                             <span className="text-sm font-medium text-gray-900">{selectedEntry.approvedBy}</span>
                                           </div>
                                           {selectedEntry.approvedAt && (
                                             <div className="flex justify-between">
                                               <span className="text-sm text-gray-700">Approved At:</span>
                                               <span className="text-sm font-medium text-gray-900">
                                                 {new Date(selectedEntry.approvedAt).toLocaleDateString()} {new Date(selectedEntry.approvedAt).toLocaleTimeString()}
                                               </span>
                                             </div>
                                           )}
                                         </div>
                                       </div>
                                     ) : (
                                       <div className="p-4 bg-yellow-50 rounded-lg">
                                         <p className="text-sm text-yellow-900">No approval data found</p>
                                         <p className="text-xs text-yellow-700 mt-1">This timesheet entry has not been approved yet.</p>
                                       </div>
                                     )}
                                   </div>
                                 )}

                                 {/* Add Approval */}
                                 {approvalAction === 'add' && (
                                   <div className="p-4 bg-green-50 rounded-lg">
                                     <p className="text-sm font-medium text-green-900 mb-3">Add Approval:</p>
                                     <div className="space-y-3">
                                       <div>
                                         <Label htmlFor="approvedBy">Approved By</Label>
                                         <Input
                                           id="approvedBy"
                                           type="text"
                                           value={approvalForm.approvedBy}
                                           onChange={(e) => handleInputChange('approvedBy', e.target.value, (value) => setApprovalForm({...approvalForm, approvedBy: value}))}
                                           placeholder="Enter your name or ID"
                                           maxLength={characterLimits.approvedBy}
                                         />
                                         {renderCharacterCount(approvalForm.approvedBy, 'approvedBy')}
                                       </div>
                                       <div>
                                         <Label htmlFor="approvedAt">Approved At (Optional)</Label>
                                         <Input
                                           id="approvedAt"
                                           type="datetime-local"
                                           value={approvalForm.approvedAt}
                                           onChange={(e) => setApprovalForm({...approvalForm, approvedAt: e.target.value})}
                                           className="mt-1"
                                         />
                                       </div>
                                       <Button 
                                         onClick={handleApprovalAdd}
                                         disabled={!approvalForm.approvedBy || approvalLoading}
                                         className="w-full bg-green-600 hover:bg-green-700"
                                       >
                                         {approvalLoading ? 'Adding...' : 'Add Approval'}
                                       </Button>
                                     </div>
                                   </div>
                                 )}

                                 {/* Edit Approval */}
                                 {approvalAction === 'edit' && selectedEntry.approvedBy && (
                                   <div className="p-4 bg-blue-50 rounded-lg">
                                     <p className="text-sm font-medium text-blue-900 mb-3">Edit Approval:</p>
                                     <div className="space-y-3">
                                       <div>
                                         <Label htmlFor="editApprovedBy">Approved By</Label>
                                         <Input
                                           id="editApprovedBy"
                                           type="text"
                                           value={approvalForm.approvedBy}
                                           onChange={(e) => handleInputChange('approvedBy', e.target.value, (value) => setApprovalForm({...approvalForm, approvedBy: value}))}
                                           placeholder="Enter your name or ID"
                                           maxLength={characterLimits.approvedBy}
                                         />
                                         {renderCharacterCount(approvalForm.approvedBy, 'approvedBy')}
                                       </div>
                                       <div>
                                         <Label htmlFor="editApprovedAt">Approved At (Optional)</Label>
                                         <Input
                                           id="editApprovedAt"
                                           type="datetime-local"
                                           value={approvalForm.approvedAt}
                                           onChange={(e) => setApprovalForm({...approvalForm, approvedAt: e.target.value})}
                                           className="mt-1"
                                         />
                                       </div>
                                       <Button 
                                         onClick={handleApprovalUpdate}
                                         disabled={!approvalForm.approvedBy || approvalLoading}
                                         className="w-full"
                                       >
                                         {approvalLoading ? 'Updating...' : 'Update Approval'}
                                       </Button>
                                     </div>
                                   </div>
                                 )}

                                 {/* Delete Approval */}
                                 {approvalAction === 'delete' && selectedEntry.approvedBy && (
                                   <div className="p-4 bg-red-50 rounded-lg">
                                     <p className="text-sm font-medium text-red-900 mb-3">Delete Approval:</p>
                                     <div className="space-y-3">
                                       <div className="p-3 bg-red-100 rounded border border-red-200">
                                         <p className="text-sm text-red-800">
                                           Are you sure you want to delete the approval data?
                                         </p>
                                         <p className="text-xs text-red-600 mt-1">
                                           This will remove the approval status and set the entry back to pending.
                                         </p>
                                       </div>
                                       <Button 
                                         onClick={handleApprovalDelete}
                                         disabled={approvalLoading}
                                         variant="destructive"
                                         className="w-full"
                                       >
                                         {approvalLoading ? 'Deleting...' : 'Delete Approval'}
                                       </Button>
                                     </div>
                                   </div>
                                 )}

                                 <div className="flex justify-end">
                                   <Button variant="outline" onClick={() => {
                                     setApproveDialogOpen(false);
                                     setApprovalAction('view');
                                     setApprovalForm({ approvedBy: '', approvedAt: '' });
                                   }}>
                                     Close
                                   </Button>
                                 </div>
                               </div>
                             )}
                           </DialogContent>
                         </Dialog>



                          {/* Upload Button */}
                          <Dialog open={uploadDialogOpen && selectedEntry?.id === entry.id} onOpenChange={setUploadDialogOpen}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => openUploadDialog(entry)}>
                                <UploadIcon className="h-3 w-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Upload Files</DialogTitle>
                                <DialogDescription>
                                  Upload files for this timesheet entry
                                </DialogDescription>
                              </DialogHeader>
                              {selectedEntry && (
                                <div className="space-y-4">
                                  <div className="p-4 bg-blue-50 rounded-lg">
                                    <p className="text-sm font-medium text-blue-900">Entry Details:</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                                      <div>
                                        <Label className="text-xs font-medium text-blue-700">Date:</Label>
                                        <p className="text-xs text-blue-600">{new Date(selectedEntry.date).toLocaleDateString()}</p>
                                      </div>
                                      <div>
                                        <Label className="text-xs font-medium text-blue-700">Hours:</Label>
                                        <p className="text-xs text-blue-600">{selectedEntry.hours} hrs</p>
                                      </div>
                                      <div>
                                        <Label className="text-xs font-medium text-blue-700">Task:</Label>
                                        <p className="text-xs text-blue-600">{selectedEntry.taskType}</p>
                                      </div>
                                      <div>
                                        <Label className="text-xs font-medium text-blue-700">Status:</Label>
                                        <Badge className={getStatusColor(selectedEntry.status)}>{selectedEntry.status}</Badge>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                    <UploadIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                                    <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX, JPG, PNG (max 10MB)</p>
                                    <input
                                      type="file"
                                      id="file-upload"
                                      className="hidden"
                                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                    />
                                    <Button
                                      variant="outline"
                                      className="mt-2"
                                      onClick={() => document.getElementById('file-upload')?.click()}
                                    >
                                      Select File
                                    </Button>
                                  </div>
                                  {uploadFile && (
                                    <div className="p-3 bg-green-50 rounded-lg">
                                      <p className="text-sm font-medium text-green-900">Selected File:</p>
                                      <p className="text-xs text-green-700">{uploadFile.name}</p>
                                      <p className="text-xs text-green-600">Size: {(uploadFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                  )}
                                  <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => {
                                      setUploadDialogOpen(false);
                                      setUploadFile(null);
                                    }}>
                                      Cancel
                                    </Button>
                                    <Button 
                                      className="bg-blue-600 hover:bg-blue-700"
                                      disabled={!uploadFile || uploadLoading}
                                      onClick={handleUpload}
                                    >
                                      {uploadLoading ? 'Uploading...' : 'Upload Files'}
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>

                          {/* Delete Button */}
                         <Dialog open={deleteDialogOpen && selectedEntry?.id === entry.id} onOpenChange={setDeleteDialogOpen}>
                           <DialogTrigger asChild>
                             <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700" onClick={() => openDeleteDialog(entry)}>
                               <Trash2Icon className="h-3 w-3" />
                             </Button>
                           </DialogTrigger>
                           <DialogContent>
                             <DialogHeader>
                               <DialogTitle>Delete Timesheet Entry</DialogTitle>
                               <DialogDescription>
                                 Are you sure you want to delete this timesheet entry for {entry.recruiterName}?
                               </DialogDescription>
                             </DialogHeader>
                             {selectedEntry && (
                               <div className="space-y-4">
                                 <div className="p-4 bg-red-50 rounded-lg">
                                   <p className="text-sm font-medium text-red-900">Entry Details:</p>
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                                     <div>
                                       <Label className="text-xs font-medium text-red-700">Date:</Label>
                                       <p className="text-xs text-red-600">{new Date(selectedEntry.date).toLocaleDateString()}</p>
                                     </div>
                                     <div>
                                       <Label className="text-xs font-medium text-red-700">Hours:</Label>
                                       <p className="text-xs text-red-600">{selectedEntry.hours} hrs</p>
                                     </div>
                                     <div>
                                       <Label className="text-xs font-medium text-red-700">Task:</Label>
                                       <p className="text-xs text-red-600">{selectedEntry.taskType}</p>
                                     </div>
                                     <div>
                                       <Label className="text-xs font-medium text-red-700">Status:</Label>
                                       <Badge className={getStatusColor(selectedEntry.status)}>{selectedEntry.status}</Badge>
                                     </div>
                                   </div>
                                 </div>
                                 <div className="flex justify-end gap-2">
                                   <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                                     Cancel
                                   </Button>
                                   <Button className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>
                                     Delete Entry
                                   </Button>
                                 </div>
                               </div>
                             )}
                           </DialogContent>
                         </Dialog>
                       </div>
                     </TableCell>
                   </TableRow>
                 ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredData.length === 0 && (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <SearchIcon className="h-12 w-12 text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg font-medium">No timesheet entries found</p>
              <p className="text-gray-400 mt-2">Try adjusting your filters or search terms</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comment Dialog */}
      <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Full Comment</DialogTitle>
            <DialogDescription>
              {selectedCommentTitle}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {selectedComment || 'No comment content'}
              </p>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setCommentDialogOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RecruiterTimesheet;
