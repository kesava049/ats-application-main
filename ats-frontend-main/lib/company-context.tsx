'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Company {
  id: number;
  name: string;
  logo?: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  userType: string;
  companyId: number;
  company: Company;
}

interface CompanyContextType {
  user: User | null;
  company: Company | null;
  companyId: number | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  setCompany: (company: Company) => void;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};

interface CompanyProviderProps {
  children: ReactNode;
}

export const CompanyProvider: React.FC<CompanyProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user data on mount
    const storedUser = localStorage.getItem('ats_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setCompany(userData.company);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('ats_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    setCompany(userData.company);
    localStorage.setItem('ats_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setCompany(null);
    localStorage.removeItem('ats_user');
  };

  const handleSetCompany = (companyData: Company) => {
    setCompany(companyData);
    if (user) {
      const updatedUser = { ...user, company: companyData, companyId: companyData.id };
      setUser(updatedUser);
      localStorage.setItem('ats_user', JSON.stringify(updatedUser));
    }
  };

  const value: CompanyContextType = {
    user,
    company,
    companyId: company?.id || null,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    setCompany: handleSetCompany,
  };

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
};

// API helper with company context and error handling
export const apiRequest = async (url: string, options: RequestInit = {}, companyId?: number) => {
  const user = JSON.parse(localStorage.getItem('ats_user') || 'null');
  const finalCompanyId = companyId || user?.companyId;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Merge existing headers if they exist
  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else {
      Object.entries(options.headers).forEach(([key, value]) => {
        headers[key] = value;
      });
    }
  }

  // Add authorization header if user is logged in
  if (user?.token) {
    headers['Authorization'] = `Bearer ${user.token}`;
  }

  // Add company ID to query parameters
  const urlObj = new URL(url, window.location.origin);
  if (finalCompanyId) {
    urlObj.searchParams.set('companyId', finalCompanyId.toString());
  }

  try {
    const response = await fetch(urlObj.toString(), {
      ...options,
      headers,
    });

    // Handle authentication errors
    if (response.status === 401) {
      const errorData = await response.json().catch(() => ({}));
      
      if (errorData.code === 'TOKEN_EXPIRED' || errorData.code === 'INVALID_TOKEN') {
        // Clear user data and redirect to login
        localStorage.removeItem('ats_user');
        localStorage.removeItem('authenticated');
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
      }
    }

    return response;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};
