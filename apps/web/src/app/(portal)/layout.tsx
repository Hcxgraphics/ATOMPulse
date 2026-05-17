"use client";
import React from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  if (!user) return null;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-[#111827] text-white flex flex-col">
        <div className="p-4 border-b border-gray-800 flex items-center">
          <div className="w-8 h-8 rounded-full bg-[#1A56DB] flex items-center justify-center mr-3">
            <span className="font-bold text-sm">AP</span>
          </div>
          <span className="font-bold text-lg tracking-tight">AtomPulse</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-4">My Work</div>
          <Link href="/dashboard" className="block px-3 py-2 rounded-md bg-[#1A56DB] text-white text-sm font-medium">Dashboard</Link>
          <Link href="/goals" className="block px-3 py-2 rounded-md text-gray-300 hover:bg-gray-800 hover:text-white text-sm font-medium">My Goals</Link>
          <Link href="/checkins" className="block px-3 py-2 rounded-md text-gray-300 hover:bg-gray-800 hover:text-white text-sm font-medium">Check-ins</Link>

          {(user.role === 'MANAGER_L1' || user.role === 'ADMIN_HR' || user.role === 'SUPER_ADMIN') && (
            <>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-6">Team</div>
              <Link href="/team" className="block px-3 py-2 rounded-md text-gray-300 hover:bg-gray-800 hover:text-white text-sm font-medium">Team Overview</Link>
            </>
          )}

          {(user.role === 'ADMIN_HR' || user.role === 'SUPER_ADMIN') && (
            <>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-6">Admin</div>
              <Link href="/admin/analytics" className="block px-3 py-2 rounded-md text-gray-300 hover:bg-gray-800 hover:text-white text-sm font-medium">Analytics</Link>
              <Link href="/admin/cycles" className="block px-3 py-2 rounded-md text-gray-300 hover:bg-gray-800 hover:text-white text-sm font-medium">Goal Cycles</Link>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-gray-600 mr-3"></div>
            <div>
              <p className="text-sm font-medium text-white">{user.name}</p>
              <p className="text-xs text-gray-400">{user.role}</p>
            </div>
          </div>
          <button 
            onClick={() => { logout(); router.push('/login'); }} 
            className="mt-4 w-full text-left text-sm text-gray-400 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <div className="text-sm text-gray-500">
            AtomPulse / <span className="text-gray-900 font-medium">Dashboard</span>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-gray-400 hover:text-gray-500">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
