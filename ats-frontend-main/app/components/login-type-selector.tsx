"use client"

import React from 'react'
import { Users, Shield } from 'lucide-react'

interface LoginTypeSelectorProps {
  loginType: 'user' | 'admin'
  onLoginTypeChange: (type: 'user' | 'admin') => void
}

export default function LoginTypeSelector({ loginType, onLoginTypeChange }: LoginTypeSelectorProps) {
  return (
    <div className="w-full">
      <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
        <button
          onClick={() => onLoginTypeChange('user')}
          className={`flex-1 flex items-center justify-center px-4 py-3 rounded-md transition-all duration-200 ${
            loginType === 'user'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users className="h-5 w-5 mr-2" />
          <span className="font-medium">User Login</span>
        </button>
        <button
          onClick={() => onLoginTypeChange('admin')}
          className={`flex-1 flex items-center justify-center px-4 py-3 rounded-md transition-all duration-200 ${
            loginType === 'admin'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Shield className="h-5 w-5 mr-2" />
          <span className="font-medium">Admin Login</span>
        </button>
      </div>
      
      <div className="text-center mb-4">
        <p className="text-sm text-gray-600">
          {loginType === 'user' 
            ? 'Access your company dashboard and manage recruitment'
            : 'Access admin panel to manage companies and users'
          }
        </p>
      </div>
    </div>
  )
}
