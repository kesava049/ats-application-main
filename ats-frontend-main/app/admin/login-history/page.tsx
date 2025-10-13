'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '../../../components/ui/card';
import { History } from 'lucide-react';
import AdminSidebar from '../components/admin-sidebar';
import AdminTopbar from '../components/admin-topbar';
import { handleAuthError } from '../../../lib/auth-error-handler';

const BASE_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

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

interface LoginHistory {
  id: number;
  loggedAt: string;
  user: {
    name: string;
    email: string;
    userType: string;
    company: {
      id: number;
      name: string;
      logo: string | null;
    };
  };
}

export default function LoginHistoryPage() {
  const router = useRouter();
  const [superadmin, setSuperadmin] = useState<Superadmin | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);

  // Load admin data on component mount
  useEffect(() => {
    const loadAdminData = () => {
      if (typeof window !== 'undefined') {
        const savedSuperadmin = localStorage.getItem('admin_superadmin');
        if (savedSuperadmin) {
          setSuperadmin(JSON.parse(savedSuperadmin));
        }
        fetchCompanies();
        fetchLoginHistory();
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

  // Fetch Login History
  const fetchLoginHistory = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        console.error('No admin token found');
        return;
      }

      const response = await fetch(`${BASE_API_URL}/auth/all-login-history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Handle authentication errors
      if (response.status === 401 || response.status === 403) {
        handleAuthError(response);
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Login history response:', data); // Debug log
      setLoginHistory(data.loginHistory || []);
    } catch (error) {
      console.error('Error fetching login history:', error);
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
          title="Login History"
          superadminName={superadmin?.name}
        />

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Login History</h2>
              <p className="text-gray-600">View all user login activities</p>
            </div>

            <Card>
              <CardContent className="p-6">
                {loginHistory.length > 0 ? (
                  <div className="space-y-4">
                    {loginHistory.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-gray-600 font-semibold">
                              {entry.user.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold">{entry.user.name}</h3>
                            <p className="text-sm text-gray-600">{entry.user.email}</p>
                            <p className="text-xs text-gray-500">{entry.user.company.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{entry.user.userType}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(entry.loggedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No login history found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
