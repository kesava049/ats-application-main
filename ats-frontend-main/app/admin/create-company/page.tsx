'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Loader2 } from 'lucide-react';
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

export default function CreateCompanyPage() {
  const router = useRouter();
  const [superadmin, setSuperadmin] = useState<Superadmin | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [userLimit, setUserLimit] = useState('');
  const [loading, setLoading] = useState(false);
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
      const response = await fetch(`${BASE_API_URL}/auth/companies`);
      
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

  // Create Company
  const handleCreateCompany = async () => {
    if (!companyName.trim()) {
      showToast('error', 'Company name is required');
      return;
    }

    const token = localStorage.getItem('admin_token');
    if (!token) {
      showToast('error', 'Authentication required. Please login again.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BASE_API_URL}/auth/create-company`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: companyName.trim(),
          userLimit: userLimit ? parseInt(userLimit) : 0
        }),
      });

      // Handle authentication errors
      if (response.status === 401 || response.status === 403) {
        handleAuthError(response);
      }

      const data = await response.json();

      if (response.ok) {
        showToast('success', 'Company created successfully');
        setCompanyName('');
        setUserLimit('');
        fetchCompanies(); // Refresh companies list
        setTimeout(() => {
          router.push('/admin/dashboard');
        }, 1500);
      } else {
        showToast('error', data.error || 'Failed to create company');
      }
    } catch (error) {
      console.error('Error creating company:', error);
      showToast('error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
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
          title="Create Company"
          superadminName={superadmin?.name}
        />

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Create New Company</CardTitle>
                <CardDescription>Add a new company to the system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input 
                      id="companyName" 
                      placeholder="Enter company name"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="userLimit">User Limit</Label>
                    <Input 
                      id="userLimit" 
                      type="number" 
                      placeholder="0 for unlimited"
                      value={userLimit}
                      onChange={(e) => setUserLimit(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => router.push('/admin/dashboard')}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button 
                      className="bg-purple-600 hover:bg-purple-700"
                      onClick={handleCreateCompany}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Company'
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

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
