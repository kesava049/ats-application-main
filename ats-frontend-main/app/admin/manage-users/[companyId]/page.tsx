'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Alert, AlertDescription } from '../../../../components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Plus, Edit, Trash2, Users, Loader2 } from 'lucide-react';
import AdminSidebar from '../../components/admin-sidebar';
import AdminTopbar from '../../components/admin-topbar';
import { handleAuthError } from '../../../../lib/auth-error-handler';

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

interface User {
  id: number;
  name: string;
  email: string;
  number: string;
  userType: string;
  companyId: number;
  company: {
    id: number;
    name: string;
  };
}

export default function ManageUsersPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.companyId as string;
  
  const [superadmin, setSuperadmin] = useState<Superadmin | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{id: number, name: string} | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
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

  // Load company and users when companyId changes
  useEffect(() => {
    if (companyId && companies.length > 0) {
      const company = companies.find(c => c.id === parseInt(companyId));
      if (company) {
        setSelectedCompany(company);
        fetchUsers(company.id);
      }
    }
  }, [companyId, companies]);

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

  // Fetch Users for a company
  const fetchUsers = async (companyId: number) => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        console.error('No admin token found');
        return;
      }

      const response = await fetch(`${BASE_API_URL}/auth/all-users`, {
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
        const companyUsers = data.users.filter((user: User) => user.companyId === companyId);
        setUsers(companyUsers);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
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

  // Add User
  const handleAddUser = () => {
    setShowAddUser(true);
  };

  // Create User
  const handleCreateUser = async (userData: any) => {
    if (!selectedCompany) return;

    const token = localStorage.getItem('admin_token');
    if (!token) {
      showToast('error', 'Authentication required. Please login again.');
      return;
    }

    setActionLoading('create');
    try {
      const response = await fetch(`${BASE_API_URL}/auth/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...userData,
          companyName: selectedCompany.name
        }),
      });

      // Handle authentication errors
      if (response.status === 401 || response.status === 403) {
        handleAuthError(response);
      }
      
      const data = await response.json();

      if (response.ok) {
        showToast('success', 'User created successfully');
        setShowAddUser(false);
        fetchUsers(selectedCompany.id); // Refresh users list
      } else {
        showToast('error', data.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      showToast('error', 'Network error. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  // Edit User
  const handleEditUser = (user: User) => {
    setEditingUser(user);
  };

  // Update User
  const handleUpdateUser = async () => {
    if (!editingUser) return;

    const token = localStorage.getItem('admin_token');
    if (!token) {
      showToast('error', 'Authentication required. Please login again.');
      return;
    }

    setActionLoading('update');
    try {
      const response = await fetch(`${BASE_API_URL}/auth/update-user/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editingUser.name,
          email: editingUser.email,
          number: editingUser.number,
          userType: editingUser.userType
        }),
      });

      // Handle authentication errors
      if (response.status === 401 || response.status === 403) {
        handleAuthError(response);
      }
      
      const data = await response.json();

      if (response.ok) {
        showToast('success', 'User updated successfully');
        setEditingUser(null);
        if (selectedCompany) {
          fetchUsers(selectedCompany.id); // Refresh users list
        }
      } else {
        showToast('error', data.error || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      showToast('error', 'Network error. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  // Delete User
  const handleDeleteUser = (user: User) => {
    setShowDeleteConfirm({ id: user.id, name: user.name });
  };

  // Confirm Delete
  const confirmDeleteUser = async () => {
    if (!showDeleteConfirm) return;

    const token = localStorage.getItem('admin_token');
    if (!token) {
      showToast('error', 'Authentication required. Please login again.');
      return;
    }

    setActionLoading('delete');
    try {
      const response = await fetch(`${BASE_API_URL}/auth/delete-user/${showDeleteConfirm.id}`, {
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
        showToast('success', 'User deleted successfully');
        setShowDeleteConfirm(null);
        if (selectedCompany) {
          fetchUsers(selectedCompany.id); // Refresh users list
        }
      } else {
        showToast('error', data.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
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
          title={selectedCompany ? `${selectedCompany.name} - Users` : 'Manage Users'}
          superadminName={superadmin?.name}
        />

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  {selectedCompany ? `${selectedCompany.name} - Users` : 'Manage Users'}
                </h2>
                <p className="text-gray-600">Manage users for this company</p>
              </div>
                <Button 
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={handleAddUser}
                  disabled={actionLoading === 'create'}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
            </div>

            <Card>
              <CardContent className="p-6">
                {users.length > 0 ? (
                  <div className="space-y-4">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-gray-600 font-semibold">
                              {user.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold">{user.name}</h3>
                            <p className="text-sm text-gray-600">{user.email}</p>
                            <p className="text-xs text-gray-500">{user.userType}</p>
                          </div>
                        </div>
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditUser(user)}
                              disabled={actionLoading === 'update'}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteUser(user)}
                              disabled={actionLoading === 'delete'}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                          </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No users found for this company</p>
                    <p className="text-sm">Add users to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Add User Dialog */}
      {showAddUser && (
        <AddUserDialog
          isOpen={showAddUser}
          onClose={() => setShowAddUser(false)}
          onSubmit={handleCreateUser}
          loading={actionLoading === 'create'}
        />
      )}

      {/* Edit User Dialog */}
      {editingUser && (
        <EditUserDialog
          user={editingUser}
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleUpdateUser}
          loading={actionLoading === 'update'}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <Dialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete User</DialogTitle>
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
                onClick={confirmDeleteUser}
                disabled={actionLoading === 'delete'}
              >
                {actionLoading === 'delete' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete User'
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

// Add User Dialog Component
function AddUserDialog({ isOpen, onClose, onSubmit, loading }: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  loading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    number: '',
    userType: 'USER'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Create a new user for this company
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="add-name">Name</Label>
            <Input
              id="add-name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
          <div>
            <Label htmlFor="add-email">Email</Label>
            <Input
              id="add-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>
          <div>
            <Label htmlFor="add-number">Phone Number</Label>
            <Input
              id="add-number"
              value={formData.number}
              onChange={(e) => setFormData({...formData, number: e.target.value})}
              required
            />
          </div>
          <div>
            <Label htmlFor="add-userType">User Type</Label>
            <Select value={formData.userType} onValueChange={(value) => setFormData({...formData, userType: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">User</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="MANAGER">Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create User'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Edit User Dialog Component
function EditUserDialog({ user, isOpen, onClose, onSave, loading }: {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  loading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    number: user.number,
    userType: user.userType
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Update the user object with new data
    Object.assign(user, formData);
    onSave();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
          <div>
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>
          <div>
            <Label htmlFor="edit-number">Phone Number</Label>
            <Input
              id="edit-number"
              value={formData.number}
              onChange={(e) => setFormData({...formData, number: e.target.value})}
              required
            />
          </div>
          <div>
            <Label htmlFor="edit-userType">User Type</Label>
            <Select value={formData.userType} onValueChange={(value) => setFormData({...formData, userType: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">User</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="MANAGER">Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update User'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
