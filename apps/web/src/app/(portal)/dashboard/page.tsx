"use client";
import React from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const user = useAuthStore(state => state.user);
  const router = useRouter();

  React.useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-2">👋 Hello, {user.name}!</h1>
      <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded mb-8 flex justify-between items-center">
        <span><strong>Q2 Check-in window is open</strong> &middot; 12 days remaining</span>
        <button className="text-sm font-medium text-amber-700 hover:text-amber-900">View Check-ins &rarr;</button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded border shadow-sm text-center">
          <div className="text-3xl font-bold text-gray-900">5</div>
          <div className="text-sm text-gray-500">Goals Total</div>
        </div>
        <div className="bg-white p-4 rounded border shadow-sm text-center">
          <div className="text-3xl font-bold text-gray-900">3</div>
          <div className="text-sm text-gray-500">Locked / Approved</div>
        </div>
        <div className="bg-white p-4 rounded border shadow-sm text-center">
          <div className="text-3xl font-bold text-green-600">80%</div>
          <div className="text-sm text-gray-500">Avg Progress</div>
        </div>
        <div className="bg-white p-4 rounded border shadow-sm text-center">
          <div className="text-3xl font-bold text-amber-600">2</div>
          <div className="text-sm text-gray-500">Pending Check-ins</div>
        </div>
      </div>

      <h2 className="text-lg font-bold mb-4 uppercase text-gray-700">MY GOALS &mdash; Current Cycle</h2>
      <div className="space-y-4">
        {/* Placeholder Goal Card */}
        <div className="bg-white p-4 rounded border shadow-sm flex items-center justify-between border-l-4 border-l-[#0E9F6E]">
          <div>
            <h3 className="font-bold text-gray-900">Revenue Growth <span className="ml-2 text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Sales</span></h3>
            <p className="text-sm text-gray-600 mt-1">On Track &middot; Weightage 30%</p>
          </div>
          <div className="text-right">
            <div className="w-32 bg-gray-200 rounded-full h-2.5 mb-1 inline-block">
              <div className="bg-[#0E9F6E] h-2.5 rounded-full" style={{ width: '80%' }}></div>
            </div>
            <div className="text-sm font-medium">80%</div>
          </div>
        </div>
      </div>
    </div>
  );
}
