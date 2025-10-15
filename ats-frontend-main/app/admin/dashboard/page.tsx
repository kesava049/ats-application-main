'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Building2, Users, Plus, Edit, Trash2, Loader2, CheckCircle, XCircle } from 'lucide-react';
import AdminSidebar from '../components/admin-sidebar';
import AdminTopbar from '../components/admin-topbar';
import { handleAuthError } from '../../../lib/auth-error-handler';

const BASE_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://147.93.155.233:5000/api';

interface Superadmin {
  id: number;
  name: string;
  email: string;
  userType: string;
}

interface Company {
  id: number;
  name: string;
  logo: string | null;
  userLimit: number;
  currentUsers: number;
  createdAt: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [superadmin, setSuperadmin] = useState<Superadmin | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{id: number, name: string} | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{type: 'success' | 'error' | 'warning', message: string} | null>(null);

  // Load admin data on component mount
  useEffect(() => {
    const loadAdminData = () => {
      if (typeof window !== 'undefined') {
        const savedSuperadmin = localStorage.getItem('admin_superadmin');
        if (savedSuperadmin) {
          setSuperadmin(JSON.parse(savedSuperadmin));
        }
        fetchCompanies();
      }
    };

    loadAdminData();
  }, []);

  // Fetch Companies
  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        console.error('No admin token found');
        return;
      }

      const response = await fetch(`${BASE_API_URL}/auth/companies`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Handle authentication errors
      if (response.status === 401 || response.status === 403) {
        handleAuthError(response);
      }
      
      const data = await response.json();
      if (response.ok) {
        setCompanies(data.companies || []);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  // Admin logout function
  const handleAdminLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_superadmin');
      localStorage.removeItem('admin_authenticated');
    }
    window.location.href = '/unified-login';
  };

  const handleCompanySelect = (company: Company) => {
    setSelectedCompany(company);
    router.push(`/admin/manage-users/${company.id}`);
  };

  // Toast functions
  const showToast = (type: 'success' | 'error' | 'warning', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  // Edit Company
  const handleEditCompany = (company: Company) => {
    setEditingCompany(company);
  };

  // Update Company
  const handleUpdateCompany = async () => {
    if (!editingCompany) return;

    const token = localStorage.getItem('admin_token');
    if (!token) {
      showToast('error', 'Authentication required. Please login again.');
      return;
    }

    setActionLoading('update');
    try {
      const response = await fetch(`${BASE_API_URL}/auth/update-company/${editingCompany.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editingCompany.name,
          userCount: editingCompany.userLimit
        }),
      });

      // Handle authentication errors
      if (response.status === 401 || response.status === 403) {
        handleAuthError(response);
      }

      const data = await response.json();

      if (response.ok) {
        showToast('success', 'Company updated successfully');
        setEditingCompany(null);
        fetchCompanies(); // Refresh companies list
      } else {
        showToast('error', data.error || 'Failed to update company');
      }
    } catch (error) {
      console.error('Error updating company:', error);
      showToast('error', 'Network error. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  // Delete Company
  const handleDeleteCompany = (company: Company) => {
    setShowDeleteConfirm({ id: company.id, name: company.name });
  };

  // Confirm Delete
  const confirmDeleteCompany = async () => {
    if (!showDeleteConfirm) return;

    const token = localStorage.getItem('admin_token');
    if (!token) {
      showToast('error', 'Authentication required. Please login again.');
      return;
    }

    setActionLoading('delete');
    try {
      const response = await fetch(`${BASE_API_URL}/auth/delete-company/${showDeleteConfirm.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      // Handle authentication errors
      if (response.status === 401 || response.status === 403) {
        handleAuthError(response);
      }

      const data = await response.json();

      if (response.ok) {
        showToast('success', 'Company deleted successfully');
        setShowDeleteConfirm(null);
        fetchCompanies(); // Refresh companies list
      } else {
        showToast('error', data.error || 'Failed to delete company');
      }
    } catch (error) {
      console.error('Error deleting company:', error);
      showToast('error', 'Network error. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Admin Sidebar */}
      <AdminSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        companies={companies}
        selectedCompany={selectedCompany}
        onCompanySelect={handleCompanySelect}
        onAdminLogout={handleAdminLogout}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <AdminTopbar
          setSidebarOpen={setSidebarOpen}
          title="Dashboard"
          superadminName={superadmin?.name}
        />

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Admin Profile Card */}
            <Card className="border-purple-200">
              <CardHeader>
                <CardTitle className="text-purple-800">Admin Panel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {superadmin?.name?.charAt(0) || 'A'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{superadmin?.name}</h3>
                    <p className="text-sm text-gray-600">{superadmin?.userType}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{companies.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {companies.reduce((total, company) => total + company.currentUsers, 0)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Companies Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Companies</CardTitle>
                    <CardDescription>Manage your companies and their users</CardDescription>
                  </div>
                  <Button 
                    onClick={() => router.push('/admin/create-company')}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Company
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {companies.length > 0 ? (
                    companies.map((company) => (
                      <div key={company.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          {company.logo ? (
                            <img 
                              src={`http://147.93.155.233:5000/${company.logo}`} 
                              alt={company.name}
                              className="h-10 w-10 rounded object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold">{company.name}</h3>
                            <p className="text-sm text-gray-600">
                              {company.currentUsers} users • Limit: {company.userLimit === 0 ? 'Unlimited' : company.userLimit}
                            </p>
                            <p className="text-xs text-gray-500">
                              Created {new Date(company.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCompanySelect(company)}
                          >
                            <Users className="h-4 w-4 mr-2" />
                            Manage Users
                          </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditCompany(company)}
                              disabled={actionLoading === 'update'}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteCompany(company)}
                              disabled={actionLoading === 'delete'}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No companies found</p>
                      <p className="text-sm">Create your first company to get started</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Company Dialog */}
      {editingCompany && (
        <Dialog open={!!editingCompany} onOpenChange={() => setEditingCompany(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Company</DialogTitle>
              <DialogDescription>
                Update company information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-company-name">Company Name</Label>
                <Input
                  id="edit-company-name"
                  value={editingCompany.name}
                  onChange={(e) => setEditingCompany({...editingCompany, name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-user-limit">User Limit</Label>
                <Input
                  id="edit-user-limit"
                  type="number"
                  value={editingCompany.userLimit}
                  onChange={(e) => setEditingCompany({...editingCompany, userLimit: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setEditingCompany(null)}
                disabled={actionLoading === 'update'}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateCompany}
                disabled={actionLoading === 'update'}
              >
                {actionLoading === 'update' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Company'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <Dialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Company</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{showDeleteConfirm.name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteConfirm(null)}
                disabled={actionLoading === 'delete'}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={confirmDeleteCompany}
                disabled={actionLoading === 'delete'}
              >
                {actionLoading === 'delete' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Company'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50">
          <Alert className={`${
            toast.type === 'success' ? 'border-green-200 bg-green-50' :
            toast.type === 'error' ? 'border-red-200 bg-red-50' :
            'border-yellow-200 bg-yellow-50'
          }`}>
            <AlertDescription className={
              toast.type === 'success' ? 'text-green-800' :
              toast.type === 'error' ? 'text-red-800' :
              'text-yellow-800'
            }>
              {toast.message}
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}
