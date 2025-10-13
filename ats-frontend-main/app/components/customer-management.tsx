"use client"

import React, { useState, useEffect } from 'react'
import { 
  Building2, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  MoreHorizontal,
  MapPin,
  Globe,
  IndianRupee,
  Calendar,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  Star,
  Briefcase,
  Mail,
  Phone,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Download,
  Upload,
  Settings,
  BarChart3,
  RefreshCw
} from 'lucide-react'
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { toast } from "../../components/ui/use-toast"
import BaseUrlApi from '../../BaseUrlApi'

interface Customer {
  id: number
  companyName: string
  industry: string
  companySize?: string
  website?: string
  description?: string
  email?: string
  status: 'ACTIVE' | 'INACTIVE' | 'PROSPECT' | 'SUSPENDED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  country: string
  city: string
  address?: string
  annualRevenue?: string
  contractValue?: number
  billingCycle?: string
  createdAt: string
  updatedAt: string
}

interface CustomerFormData {
  companyName: string
  industry: string
  companySize: string
  website: string
  description: string
  email: string
  status: string
  priority: string
  country: string
  city: string
  address: string
  annualRevenue: string
  contractValue: string
  billingCycle: string
}

export default function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [industryFilter, setIndustryFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formData, setFormData] = useState<CustomerFormData>({
    companyName: '',
    industry: '',
    companySize: '',
    website: '',
    description: '',
    email: '',
    status: 'ACTIVE',
    priority: 'MEDIUM',
    country: '',
    city: '',
    address: '',
    annualRevenue: '',
    contractValue: '',
    billingCycle: ''
  })

  // Character limits for form fields - Professional standards
  const characterLimits = {
    companyName: 150,    // Company names can be long but should be reasonable
    industry: 50,        // Industry names should be concise
    companySize: 20,     // Company size descriptions should be short
    website: 200,        // Website URLs can be long
    description: 2000,   // Company descriptions should be comprehensive
    email: 150,          // Email addresses can be long
    country: 100,        // Country names can be long
    city: 100,           // City names can be long
    address: 300,        // Full addresses can be long
    annualRevenue: 50,   // Revenue amounts should be concise
    contractValue: 20,   // Contract values should be concise
    billingCycle: 30     // Billing cycle descriptions should be concise
  }

  // Minimum character requirements for fields - Professional standards
  const minimumCharacters = {
    companyName: 3,      // Company names should be at least 3 characters (e.g., "IBM", "MS", "Apple")
    industry: 3,         // Industry names should be at least 3 characters
    companySize: 1,      // Company size can be short
    website: 5,          // Website should be at least 5 characters (e.g., "a.com")
    description: 10,     // Descriptions should be at least 10 characters for meaningful content
    email: 8,            // Email should be at least 8 characters (e.g., "a@b.com")
    country: 3,          // Country names should be at least 3 characters (e.g., "USA", "UK")
    city: 3,             // City names should be at least 3 characters (e.g., "NYC", "LA")
    address: 5,          // Addresses should be at least 5 characters
    annualRevenue: 1,    // Revenue can be short
    contractValue: 1,    // Contract value can be short
    billingCycle: 2      // Billing cycle should be at least 2 characters
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

  // Fetch customers
  const fetchCustomers = async () => {
    try {
      setLoading(true)
      
      // Get JWT token and company ID from localStorage
      const token = JSON.parse(localStorage.getItem('ats_user') || 'null')?.token;
      const user = JSON.parse(localStorage.getItem('ats_user') || 'null');
      const companyId = user?.companyId;

      // Validate authentication
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please login to view customers",
          variant: "destructive"
        });
        return;
      }

      if (!companyId) {
        toast({
          title: "Company Error", 
          description: "Company ID not found. Please login again.",
          variant: "destructive"
        });
        return;
      }
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(priorityFilter !== 'all' && { priority: priorityFilter }),
        ...(industryFilter !== 'all' && { industry: industryFilter }),
        ...(companyId && { companyId: companyId.toString() })
      })

      console.log('🔍 Fetching customers with company ID:', companyId);

      const response = await fetch(`${BaseUrlApi}/customers?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()

      if (data.success) {
        setCustomers(data.data.customers)
        setTotalPages(data.data.pagination.totalPages)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch customers",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
      toast({
        title: "Error",
        description: "Failed to fetch customers",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Create customer
  const createCustomer = async () => {
    console.log('🔍 ===== createCustomer function called =====');
    console.log('🔍 Current form data:', formData);
    console.log('🔍 Current isCreating state:', isCreating);
    console.log('🔍 Current isUpdating state:', isUpdating);
    console.log('🔍 Function execution started at:', new Date().toISOString());
    
    try {
      console.log('🔍 Setting isCreating to true');
      setIsCreating(true)
      
      // Form validation with detailed logging
      console.log('🔍 Starting form validation...');
      
      if (!formData.companyName.trim()) {
        console.log('🔍 ❌ Validation failed: Company name is empty');
        toast({
          title: "Validation Error",
          description: "Company name is required",
          variant: "destructive"
        });
        setIsCreating(false);
        return;
      }
      console.log('🔍 ✅ Company name validation passed');

      if (!formData.industry.trim()) {
        console.log('🔍 ❌ Validation failed: Industry is empty');
        toast({
          title: "Validation Error",
          description: "Industry is required",
          variant: "destructive"
        });
        setIsCreating(false);
        return;
      }
      console.log('🔍 ✅ Industry validation passed');

      if (!formData.country.trim()) {
        console.log('🔍 ❌ Validation failed: Country is empty');
        toast({
          title: "Validation Error",
          description: "Country is required",
          variant: "destructive"
        });
        setIsCreating(false);
        return;
      }
      console.log('🔍 ✅ Country validation passed');

      if (!formData.city.trim()) {
        console.log('🔍 ❌ Validation failed: City is empty');
        toast({
          title: "Validation Error",
          description: "City is required",
          variant: "destructive"
        });
        setIsCreating(false);
        return;
      }
      console.log('🔍 ✅ City validation passed');
      
      console.log('🔍 ✅ All form validations passed');

      // Get JWT token and company ID from localStorage
      const user = JSON.parse(localStorage.getItem('ats_user') || 'null');
      const token = user?.token; // Token is stored inside the user object for regular users
      const companyId = user?.companyId;

      // Enhanced authentication debugging
      console.log('🔍 Authentication check:', {
        hasToken: !!token,
        tokenLength: token?.length,
        hasUser: !!user,
        hasCompanyId: !!companyId,
        companyId: companyId,
        userData: user,
        tokenSource: 'user.token (from ats_user object)'
      });

      // Validate authentication
      if (!token) {
        console.log('🔍 ❌ Authentication failed: No token');
        toast({
          title: "Authentication Error",
          description: "Please login to create customers",
          variant: "destructive"
        });
        setIsCreating(false);
        return;
      }

      if (!companyId) {
        console.log('🔍 ❌ Authentication failed: No company ID');
        toast({
          title: "Company Error", 
          description: "Company ID not found. Please login again.",
          variant: "destructive"
        });
        setIsCreating(false);
        return;
      }

      console.log('🔍 ✅ Authentication passed');

      console.log('🔍 Creating customer with company ID:', companyId);
      console.log('🔍 JWT token present:', !!token);
      console.log('🔍 Form data:', formData);

      console.log('🔍 Preparing to make API call to /api/customers');
      console.log('🔍 API URL:', `${BaseUrlApi}/customers`);
      console.log('🔍 Request body:', JSON.stringify({
        ...formData,
        contractValue: formData.contractValue ? parseFloat(formData.contractValue) : null,
        companyId: companyId
      }));

      const response = await fetch(`${BaseUrlApi}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          contractValue: formData.contractValue ? parseFloat(formData.contractValue) : null,
          companyId: companyId
        })
      })

      console.log('🔍 ✅ API call completed');
      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response headers:', Object.fromEntries(response.headers.entries()));

      const data = await response.json()
      console.log('🔍 Response data:', data);

      if (response.ok && data.success) {
        toast({
          title: "Success",
          description: "Customer created successfully"
        })
        setShowCreateDialog(false)
        resetForm()
        fetchCustomers()
      } else {
        toast({
          title: "Error",
          description: data.message || data.error || `Failed to create customer (${response.status})`,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error creating customer:', error)
      toast({
        title: "Error",
        description: "Failed to create customer",
        variant: "destructive"
      })
    } finally {
      setIsCreating(false)
    }
  }

  // Update customer
  const updateCustomer = async () => {
    if (!selectedCustomer) return

    try {
      setIsUpdating(true)
      
      // Get JWT token and company ID from localStorage
      const token = JSON.parse(localStorage.getItem('ats_user') || 'null')?.token;
      const user = JSON.parse(localStorage.getItem('ats_user') || 'null');
      const companyId = user?.companyId;

      // Validate authentication
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please login to update customers",
          variant: "destructive"
        });
        return;
      }

      if (!companyId) {
        toast({
          title: "Company Error", 
          description: "Company ID not found. Please login again.",
          variant: "destructive"
        });
        return;
      }

      console.log('🔍 Updating customer with company ID:', companyId);

      const response = await fetch(`${BaseUrlApi}/customers/${selectedCustomer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          contractValue: formData.contractValue ? parseFloat(formData.contractValue) : null,
          companyId: companyId
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Customer updated successfully"
        })
        setShowEditDialog(false)
        resetForm()
        fetchCustomers()
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update customer",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error updating customer:', error)
      toast({
        title: "Error",
        description: "Failed to update customer",
        variant: "destructive"
      })
    } finally {
      setIsUpdating(false)
    }
  }

  // Delete customer
  const deleteCustomer = async (id: number) => {
    if (!confirm('Are you sure you want to delete this customer?')) return

    try {
      setIsDeleting(true)
      
      // Get JWT token and company ID from localStorage
      const token = JSON.parse(localStorage.getItem('ats_user') || 'null')?.token;
      const user = JSON.parse(localStorage.getItem('ats_user') || 'null');
      const companyId = user?.companyId;

      // Validate authentication
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please login to delete customers",
          variant: "destructive"
        });
        return;
      }

      if (!companyId) {
        toast({
          title: "Company Error", 
          description: "Company ID not found. Please login again.",
          variant: "destructive"
        });
        return;
      }

      console.log('🔍 Deleting customer with company ID:', companyId);

      const response = await fetch(`${BaseUrlApi}/customers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Customer deleted successfully"
        })
        fetchCustomers()
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to delete customer",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error deleting customer:', error)
      toast({
        title: "Error",
        description: "Failed to delete customer",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      companyName: '',
      industry: '',
      companySize: '',
      website: '',
      description: '',
      email: '',
      status: 'ACTIVE',
      priority: 'MEDIUM',
      country: '',
      city: '',
      address: '',
      annualRevenue: '',
      contractValue: '',
      billingCycle: ''
    })
  }

  // Edit customer
  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer)
    setFormData({
      companyName: customer.companyName,
      industry: customer.industry,
      companySize: customer.companySize || '',
      website: customer.website || '',
      description: customer.description || '',
      email: customer.email || '',
      status: customer.status,
      priority: customer.priority,
      country: customer.country,
      city: customer.city,
      address: customer.address || '',
      annualRevenue: customer.annualRevenue || '',
      contractValue: customer.contractValue?.toString() || '',
      billingCycle: customer.billingCycle || ''
    })
    setShowEditDialog(true)
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    const variants = {
      ACTIVE: { variant: 'default' as const, icon: CheckCircle, className: 'bg-green-50 text-green-700 border-green-200' },
      INACTIVE: { variant: 'secondary' as const, icon: Clock, className: 'bg-gray-50 text-gray-700 border-gray-200' },
      PROSPECT: { variant: 'outline' as const, icon: TrendingUp, className: 'bg-blue-50 text-blue-700 border-blue-200' },
      SUSPENDED: { variant: 'destructive' as const, icon: AlertCircle, className: 'bg-red-50 text-red-700 border-red-200' }
    }
    const { variant, icon: Icon, className } = variants[status as keyof typeof variants] || variants.ACTIVE
    return (
      <Badge variant={variant} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium ${className}`}>
        <Icon className="w-3.5 h-3.5" />
        {status}
      </Badge>
    )
  }

  // Get priority badge
  const getPriorityBadge = (priority: string) => {
    const variants = {
      LOW: { className: 'bg-gray-50 text-gray-700 border-gray-200' },
      MEDIUM: { className: 'bg-blue-50 text-blue-700 border-blue-200' },
      HIGH: { className: 'bg-orange-50 text-orange-700 border-orange-200' },
      CRITICAL: { className: 'bg-red-50 text-red-700 border-red-200' }
    }
    const { className } = variants[priority as keyof typeof variants] || variants.MEDIUM
    return (
      <Badge variant="outline" className={`px-3 py-1.5 text-xs font-medium ${className}`}>
        {priority}
      </Badge>
    )
  }

  // Stats state
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    prospects: 0,
    critical: 0
  })

  // Fetch stats separately (always show total counts, not filtered)
  const fetchStats = async () => {
    try {
      // Get JWT token and company ID from localStorage
      const token = JSON.parse(localStorage.getItem('ats_user') || 'null')?.token;
      const user = JSON.parse(localStorage.getItem('ats_user') || 'null');
      const companyId = user?.companyId;

      if (!token || !companyId) {
        console.log('🔍 Stats fetch skipped - no auth data');
        return;
      }

      const response = await fetch(`${BaseUrlApi}/customers?limit=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()

      if (data.success) {
        const allCustomers = data.data.customers
        setStats({
          total: allCustomers.length,
          active: allCustomers.filter((c: Customer) => c.status === 'ACTIVE').length,
          prospects: allCustomers.filter((c: Customer) => c.status === 'PROSPECT').length,
          critical: allCustomers.filter((c: Customer) => c.priority === 'CRITICAL').length
        })
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  // Refresh data function (clears filters and refreshes data)
  const refreshData = async () => {
    try {
      // Clear all filters and search
      setSearchTerm('')
      setStatusFilter('all')
      setPriorityFilter('all')
      setIndustryFilter('all')
      setCurrentPage(1)
      
      // Wait a bit for state to update, then fetch fresh data
      setTimeout(async () => {
        await fetchCustomers()
        toast({
          title: "Success",
          description: "Filters cleared and data refreshed successfully"
        })
      }, 100)
    } catch (error) {
      console.error('Error refreshing data:', error)
      toast({
        title: "Error",
        description: "Failed to refresh data",
        variant: "destructive"
      })
    }
  }

  // Export to Excel function
  const exportToExcel = () => {
    try {
      // Create CSV content
      const headers = [
        'Company Name',
        'Industry', 
        'Company Size',
        'Website',
        'Status',
        'Priority',
        'Country',
        'City',
        'Address',
        'Annual Revenue',
        'Contract Value',
        'Billing Cycle',
        'Created At'
      ]

      const csvContent = [
        headers.join(','),
        ...customers.map(customer => [
          `"${customer.companyName}"`,
          `"${customer.industry}"`,
          `"${customer.companySize || ''}"`,
          `"${customer.website || ''}"`,
          `"${customer.status}"`,
          `"${customer.priority}"`,
          `"${customer.country}"`,
          `"${customer.city}"`,
          `"${customer.address || ''}"`,
          `"${customer.annualRevenue || ''}"`,
          `"${customer.contractValue || ''}"`,
          `"${customer.billingCycle || ''}"`,
          `"${new Date(customer.createdAt).toLocaleDateString()}"`
        ].join(','))
      ].join('\n')

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `customers_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Success",
        description: "Customer data exported to Excel successfully"
      })
    } catch (error) {
      console.error('Error exporting to Excel:', error)
      toast({
        title: "Error",
        description: "Failed to export customer data",
        variant: "destructive"
      })
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [searchTerm, statusFilter, priorityFilter, industryFilter, currentPage])

  useEffect(() => {
    fetchStats()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
              Customer Management
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl">
              Manage your customer relationships and company information with our comprehensive CRM system
            </p>
          </div>
                     <div className="flex items-center gap-3">
             <Button 
               variant="outline" 
               size="sm" 
               className="gap-2"
               onClick={exportToExcel}
             >
               <Download className="w-4 h-4" />
               Export to Excel
             </Button>
            <Dialog open={showCreateDialog} onOpenChange={(open) => {
              console.log('🔍 Dialog onOpenChange called with:', open);
              console.log('🔍 Current isCreating state:', isCreating);
              console.log('🔍 Current showCreateDialog state:', showCreateDialog);
              
              if (open) {
                console.log('🔍 Opening dialog');
                setShowCreateDialog(true);
              } else if (!isCreating) {
                console.log('🔍 Closing dialog');
                setShowCreateDialog(false);
              } else {
                console.log('🔍 Preventing dialog close (isCreating is true)');
              }
            }}>
              <DialogTrigger asChild>
                <Button 
                  className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
                  onClick={() => {
                    console.log('🔍 Add Customer button clicked');
                    console.log('🔍 Current showCreateDialog state:', showCreateDialog);
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Add Customer
                </Button>
              </DialogTrigger>
              <DialogContent 
                className="max-w-4xl max-h-[90vh] overflow-y-auto"
                onPointerDownOutside={(e) => {
                  if (isCreating) {
                    e.preventDefault();
                  }
                }}
                onEscapeKeyDown={(e) => {
                  if (isCreating) {
                    e.preventDefault();
                  }
                }}
              >
                <DialogHeader className="space-y-3">
                  <DialogTitle className="text-2xl font-bold text-slate-900">
                    Create New Customer
                  </DialogTitle>
                  <DialogDescription className="text-slate-600">
                    Add a new customer to your database with comprehensive company information
                  </DialogDescription>
                </DialogHeader>
                <CustomerForm 
                  formData={formData} 
                  setFormData={setFormData} 
                  onSubmit={createCustomer}
                  submitText="Create Customer"
                  onCancel={() => setShowCreateDialog(false)}
                  characterLimits={characterLimits}
                  minimumCharacters={minimumCharacters}
                  renderCharacterCount={(value: string, field: string) => renderCharacterCount(value, field as keyof typeof characterLimits)}
                  handleInputChange={(field: string, value: string, setter: (value: string) => void) => handleInputChange(field as keyof typeof characterLimits, value, setter)}
                  isCreating={isCreating}
                  isUpdating={isUpdating}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-slate-700">Total Customers</CardTitle>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{stats.total}</div>
              <p className="text-xs text-slate-500 mt-1">
                All registered customers
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-slate-700">Active Customers</CardTitle>
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.active}</div>
              <p className="text-xs text-slate-500 mt-1">
                Currently active
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-slate-700">Prospects</CardTitle>
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.prospects}</div>
              <p className="text-xs text-slate-500 mt-1">
                Potential customers
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-slate-700">Critical Priority</CardTitle>
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{stats.critical}</div>
              <p className="text-xs text-slate-500 mt-1">
                High priority customers
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
                 <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
           <CardHeader className="pb-4">
             <div className="flex items-center justify-between">
               <div>
                 <CardTitle className="text-xl font-bold text-slate-900">Customer Directory</CardTitle>
                 <CardDescription className="text-slate-600">
                   Search and filter your customer database with advanced options
                 </CardDescription>
               </div>
               <Button 
                 variant="outline" 
                 size="sm" 
                 className="gap-2"
                 onClick={refreshData}
               >
                 <RefreshCw className="w-4 h-4" />
                 Refresh
               </Button>
             </div>
           </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <Input
                    placeholder="Search customers by name, industry, or location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 text-base border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 h-12 border-slate-200">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="PROSPECT">Prospect</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-40 h-12 border-slate-200">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={industryFilter} onValueChange={setIndustryFilter}>
                  <SelectTrigger className="w-48 h-12 border-slate-200">
                    <SelectValue placeholder="Industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Industries</SelectItem>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="Retail">Retail</SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Customer Table */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="text-slate-600">Loading customers...</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border border-slate-200 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/50">
                        <TableHead className="font-semibold text-slate-700">Company</TableHead>
                        <TableHead className="font-semibold text-slate-700">Industry</TableHead>
                        <TableHead className="font-semibold text-slate-700">Location</TableHead>
                        <TableHead className="font-semibold text-slate-700">Status</TableHead>
                        <TableHead className="font-semibold text-slate-700">Priority</TableHead>
                        <TableHead className="font-semibold text-slate-700">Revenue</TableHead>
                        <TableHead className="font-semibold text-slate-700">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                                         <TableBody>
                       {customers.map((customer) => (
                         <TableRow key={customer.id} className="hover:bg-slate-50/50 transition-colors">
                           <TableCell className="whitespace-nowrap">
                             <div className="flex items-center gap-2">
                               <div className="min-w-0 flex-1">
                                 <div className="font-semibold text-slate-900 truncate">{customer.companyName}</div>
                                 {customer.website && (
                                   <div className="flex items-center gap-1.5 text-sm text-slate-600 truncate">
                                     <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                                     <a 
                                       href={customer.website.startsWith('http') ? customer.website : `https://${customer.website}`}
                                       target="_blank"
                                       rel="noopener noreferrer"
                                       className="hover:text-blue-600 transition-colors flex items-center gap-1 truncate"
                                     >
                                       <span className="truncate">{customer.website}</span>
                                       <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                     </a>
                                   </div>
                                 )}
                                 {customer.email && (
                                   <div className="flex items-center gap-1.5 text-sm text-slate-600 truncate">
                                     <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                                     <a 
                                       href={`mailto:${customer.email}`}
                                       className="hover:text-blue-600 transition-colors truncate"
                                     >
                                       <span className="truncate">{customer.email}</span>
                                     </a>
                                   </div>
                                 )}
                               </div>
                             </div>
                           </TableCell>
                           <TableCell className="whitespace-nowrap">
                             <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                               {customer.industry}
                             </Badge>
                           </TableCell>
                           <TableCell className="whitespace-nowrap">
                             <div className="flex items-center gap-1.5 text-sm text-slate-600">
                               <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                               <span className="truncate">{customer.city}, {customer.country}</span>
                             </div>
                           </TableCell>
                           <TableCell className="whitespace-nowrap">
                             {getStatusBadge(customer.status)}
                           </TableCell>
                           <TableCell className="whitespace-nowrap">
                             {getPriorityBadge(customer.priority)}
                           </TableCell>
                           <TableCell className="whitespace-nowrap">
                             {customer.annualRevenue ? (
                               <div className="flex items-center gap-1.5 text-slate-700">
                                 <IndianRupee className="w-3.5 h-3.5 flex-shrink-0" />
                                 <span className="font-medium truncate">{customer.annualRevenue}</span>
                               </div>
                             ) : (
                               <span className="text-slate-400">-</span>
                             )}
                           </TableCell>
                           <TableCell className="whitespace-nowrap">
                             <div className="flex items-center gap-2">
                               <Button
                                 variant="ghost"
                                 size="sm"
                                 onClick={() => handleEdit(customer)}
                                 className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                               >
                                 <Edit className="w-4 h-4" />
                               </Button>
                               <Button
                                 variant="ghost"
                                 size="sm"
                                 onClick={() => deleteCustomer(customer.id)}
                                 disabled={isDeleting}
                                 className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                               >
                                 {isDeleting ? (
                                   <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                 ) : (
                                   <Trash2 className="w-4 h-4" />
                                 )}
                               </Button>
                             </div>
                           </TableCell>
                         </TableRow>
                       ))}
                     </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-slate-200">
                    <p className="text-sm text-slate-600">
                      Page {currentPage} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="gap-2"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="gap-2"
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-2xl font-bold text-slate-900">
                Edit Customer
              </DialogTitle>
              <DialogDescription className="text-slate-600">
                Update customer information and preferences
              </DialogDescription>
            </DialogHeader>
            <CustomerForm 
              formData={formData} 
              setFormData={setFormData} 
              onSubmit={updateCustomer}
              submitText="Update Customer"
              onCancel={() => setShowEditDialog(false)}
              characterLimits={characterLimits}
              minimumCharacters={minimumCharacters}
              renderCharacterCount={(value: string, field: string) => renderCharacterCount(value, field as keyof typeof characterLimits)}
              handleInputChange={(field: string, value: string, setter: (value: string) => void) => handleInputChange(field as keyof typeof characterLimits, value, setter)}
              isCreating={isCreating}
              isUpdating={isUpdating}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

// Customer Form Component
function CustomerForm({ 
  formData, 
  setFormData, 
  onSubmit, 
  submitText,
  onCancel,
  characterLimits,
  minimumCharacters,
  renderCharacterCount,
  handleInputChange,
  isCreating,
  isUpdating
}: { 
  formData: CustomerFormData
  setFormData: (data: CustomerFormData) => void
  onSubmit: () => void
  submitText: string
  onCancel: () => void
  characterLimits: Record<string, number>
  minimumCharacters: Record<string, number>
  renderCharacterCount: (value: string, field: string) => React.ReactNode
  handleInputChange: (field: string, value: string, setter: (value: string) => void) => void
  isCreating: boolean
  isUpdating: boolean
}) {
  return (
    <form onSubmit={async (e) => {
      console.log('🔍 Form onSubmit triggered');
      e.preventDefault();
      e.stopPropagation();
      console.log('🔍 Form submitted, calling onSubmit');
      console.log('🔍 Form data:', formData);
      console.log('🔍 isCreating:', isCreating);
      console.log('🔍 isUpdating:', isUpdating);
      console.log('🔍 onSubmit function type:', typeof onSubmit);
      try {
        await onSubmit();
        console.log('🔍 Form onSubmit completed successfully');
      } catch (error) {
        console.error('🔍 Form submission error:', error);
      }
    }} className="space-y-8">
      {/* Basic Information */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Basic Information</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Company Name *</label>
            <Input
              value={formData.companyName}
              onChange={(e) => {
                console.log('🔍 Company name changed:', e.target.value);
                handleInputChange('companyName', e.target.value, (value) => {
                  console.log('🔍 Setting company name to:', value);
                  setFormData({ ...formData, companyName: value });
                });
              }}
              placeholder="Enter company name"
              className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              maxLength={characterLimits.companyName}
            />
            {renderCharacterCount(formData.companyName, 'companyName')}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Industry *</label>
            <Select value={formData.industry} onValueChange={(value) => {
              console.log('🔍 Industry changed:', value);
              setFormData({ ...formData, industry: value });
            }}>
              <SelectTrigger className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Technology">Technology</SelectItem>
                <SelectItem value="Healthcare">Healthcare</SelectItem>
                <SelectItem value="Finance">Finance</SelectItem>
                <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                <SelectItem value="Retail">Retail</SelectItem>
                <SelectItem value="Education">Education</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Company Size</label>
            <Select value={formData.companySize} onValueChange={(value) => setFormData({ ...formData, companySize: value })}>
              <SelectTrigger className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Small">Small (1-50)</SelectItem>
                <SelectItem value="Medium">Medium (51-200)</SelectItem>
                <SelectItem value="Large">Large (201-1000)</SelectItem>
                <SelectItem value="Enterprise">Enterprise (1000+)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Website</label>
            <Input
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value, (value) => setFormData({ ...formData, website: value }))}
              placeholder="https://example.com"
              className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              maxLength={characterLimits.website}
            />
            {renderCharacterCount(formData.website, 'website')}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Email</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value, (value) => setFormData({ ...formData, email: value }))}
              placeholder="contact@company.com"
              className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              maxLength={characterLimits.email}
            />
            {renderCharacterCount(formData.email, 'email')}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value, (value) => setFormData({ ...formData, description: value }))}
            placeholder="Enter company description"
            className="w-full p-4 border border-slate-200 rounded-lg resize-none focus:border-blue-500 focus:ring-blue-500"
            rows={4}
            maxLength={characterLimits.description}
          />
          {renderCharacterCount(formData.description, 'description')}
        </div>
      </div>

      {/* Status & Priority */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Status & Priority</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Status</label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="PROSPECT">Prospect</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Priority</label>
            <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
              <SelectTrigger className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <MapPin className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Location</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Country *</label>
            <Input
              value={formData.country}
              onChange={(e) => {
                console.log('🔍 Country changed:', e.target.value);
                handleInputChange('country', e.target.value, (value) => {
                  console.log('🔍 Setting country to:', value);
                  setFormData({ ...formData, country: value });
                });
              }}
              placeholder="Enter country"
              className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              maxLength={characterLimits.country}
            />
            {renderCharacterCount(formData.country, 'country')}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">City *</label>
            <Input
              value={formData.city}
              onChange={(e) => {
                console.log('🔍 City changed:', e.target.value);
                handleInputChange('city', e.target.value, (value) => {
                  console.log('🔍 Setting city to:', value);
                  setFormData({ ...formData, city: value });
                });
              }}
              placeholder="Enter city"
              className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              maxLength={characterLimits.city}
            />
            {renderCharacterCount(formData.city, 'city')}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Address</label>
          <Input
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value, (value) => setFormData({ ...formData, address: value }))}
            placeholder="Enter full address"
            className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
            maxLength={characterLimits.address}
          />
          {renderCharacterCount(formData.address, 'address')}
        </div>
      </div>

      {/* Financial Information */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <IndianRupee className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Financial Information</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Annual Revenue</label>
            <Input
              value={formData.annualRevenue}
              onChange={(e) => handleInputChange('annualRevenue', e.target.value, (value) => setFormData({ ...formData, annualRevenue: value }))}
                                  placeholder="e.g., ₹1M-₹10M"
              className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              maxLength={characterLimits.annualRevenue}
            />
            {renderCharacterCount(formData.annualRevenue, 'annualRevenue')}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Contract Value</label>
            <Input
              type="number"
              value={formData.contractValue}
              onChange={(e) => handleInputChange('contractValue', e.target.value, (value) => setFormData({ ...formData, contractValue: value }))}
              placeholder="0.00"
              className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              maxLength={characterLimits.contractValue}
            />
            {renderCharacterCount(formData.contractValue, 'contractValue')}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Billing Cycle</label>
            <Select value={formData.billingCycle} onValueChange={(value) => setFormData({ ...formData, billingCycle: value })}>
              <SelectTrigger className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Select cycle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Monthly">Monthly</SelectItem>
                <SelectItem value="Quarterly">Quarterly</SelectItem>
                <SelectItem value="Annual">Annual</SelectItem>
              </SelectContent>
            </Select>
            {renderCharacterCount(formData.billingCycle, 'billingCycle')}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
        <Button 
          variant="outline" 
          onClick={onCancel}
          className="h-12 px-6 border-slate-200 hover:bg-slate-50"
        >
          Cancel
        </Button>
        <Button 
          type="button"
          disabled={isCreating || isUpdating}
          onClick={async (e) => {
            console.log('🔍 ===== BUTTON CLICKED =====');
            console.log('🔍 Button disabled state:', isCreating || isUpdating);
            console.log('🔍 onSubmit function type:', typeof onSubmit);
            
            // Comprehensive form data validation check
            console.log('🔍 Form data validation check:', {
              companyName: formData.companyName,
              industry: formData.industry,
              country: formData.country,
              city: formData.city,
              annualRevenue: formData.annualRevenue,
              contractValue: formData.contractValue,
              billingCycle: formData.billingCycle,
              email: formData.email,
              website: formData.website,
              description: formData.description
            });
            
            // Check for empty required fields
            const requiredFields = ['companyName', 'industry', 'country', 'city'];
            const emptyFields = requiredFields.filter(field => !formData[field as keyof CustomerFormData]?.trim());
            
            if (emptyFields.length > 0) {
              console.log('🔍 ❌ VALIDATION FAILED - Missing required fields:', emptyFields);
              console.log('🔍 Please fill in the following required fields:', emptyFields.join(', '));
              return;
            }
            
            console.log('🔍 ✅ All required fields are filled');
            
            e.preventDefault();
            e.stopPropagation();
            
            // Direct function call to onSubmit
            console.log('🔍 Calling onSubmit function directly');
            try {
              await onSubmit();
              console.log('🔍 onSubmit completed successfully');
            } catch (error) {
              console.error('🔍 onSubmit failed:', error);
            }
          }}
          className="h-12 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg disabled:opacity-50"
        >
          {(isCreating || isUpdating) && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          )}
          {submitText}
        </Button>
      </div>
    </form>
  )
}
