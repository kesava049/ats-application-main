'use client';

import { Menu } from 'lucide-react';

interface AdminTopbarProps {
  setSidebarOpen: (open: boolean) => void;
  title: string;
  superadminName?: string;
}

export default function AdminTopbar({ setSidebarOpen, title, superadminName }: AdminTopbarProps) {
  return (
    <div className="bg-white shadow-sm border-b px-6 py-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {title}
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Welcome back, {superadminName}
          </div>
        </div>
      </div>
    </div>
  );
}
