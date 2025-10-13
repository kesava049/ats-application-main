'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '../../../components/ui/button';
import { 
  Building2, 
  Users, 
  Shield, 
  Home, 
  Plus, 
  LogOut, 
  X, 
  ChevronDown, 
  ChevronRight,
  History
} from 'lucide-react';

interface Company {
  id: number;
  name: string;
  logo: string | null;
  userLimit: number;
  currentUsers: number;
  createdAt: string;
}

interface AdminSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  companies: Company[];
  selectedCompany: Company | null;
  onCompanySelect: (company: Company) => void;
  onAdminLogout: () => void;
}

export default function AdminSidebar({
  sidebarOpen,
  setSidebarOpen,
  companies,
  selectedCompany,
  onCompanySelect,
  onAdminLogout
}: AdminSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [manageUsersDropdownOpen, setManageUsersDropdownOpen] = useState(false);

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/admin/dashboard' },
    { id: 'create-company', label: 'Create Company', icon: Plus, href: '/admin/create-company' },
    { id: 'login-history', label: 'Login History', icon: History, href: '/admin/login-history' },
  ];

  const handleSidebarClick = (href: string) => {
    router.push(href);
    setManageUsersDropdownOpen(false);
    setSidebarOpen(false);
  };

  const handleCompanySelect = (company: Company) => {
    onCompanySelect(company);
    router.push(`/admin/manage-users/${company.id}`);
    setManageUsersDropdownOpen(false);
    setSidebarOpen(false);
  };

  const isActive = (href: string) => {
    if (href === '/admin/dashboard') {
      return pathname === '/admin' || pathname === '/admin/dashboard';
    }
    return pathname === href;
  };

  return (
    <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
      <div className="flex items-center justify-between h-16 px-6 border-b">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Admin Panel</h1>
            <p className="text-xs text-gray-500">Super Admin</p>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="mt-6 px-3">
        <div className="space-y-1">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSidebarClick(item.href)}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive(item.href)
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.label}
            </button>
          ))}

          {/* Manage Users Dropdown */}
          <div className="mt-4">
            <button
              onClick={() => setManageUsersDropdownOpen(!manageUsersDropdownOpen)}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                pathname.startsWith('/admin/manage-users')
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-3" />
                Manage Users
              </div>
              {manageUsersDropdownOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>

            {/* Dropdown Menu */}
            {manageUsersDropdownOpen && (
              <div className="ml-6 mt-1 space-y-1 max-h-64 overflow-y-auto">
                {companies.length > 0 ? (
                  companies.map((company) => (
                    <button
                      key={company.id}
                      onClick={() => handleCompanySelect(company)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                        selectedCompany?.id === company.id
                          ? 'bg-blue-100 text-blue-800'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center min-w-0">
                        {company.logo ? (
                          <img 
                            src={`http://localhost:5000/${company.logo}`} 
                            alt={company.name}
                            className="h-6 w-6 rounded object-cover mr-2 flex-shrink-0"
                          />
                        ) : (
                          <Building2 className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                        )}
                        <span className="truncate">{company.name}</span>
                      </div>
                      <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                        {company.currentUsers}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    No companies found
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Logout Button */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <Button
          variant="outline"
          onClick={onAdminLogout}
          className="w-full flex items-center justify-center space-x-2"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );
}
