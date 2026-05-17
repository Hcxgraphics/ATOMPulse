"use client";
import React from 'react';

export default function AnalyticsPage() {
  return (
    <div className="p-8 h-full flex flex-col max-w-7xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-sm text-gray-500">Org-wide goal completion rates and trends.</p>
        </div>
        <div className="flex space-x-2">
          <select className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white">
            <option>2026 Annual Goals</option>
          </select>
          <select className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white">
            <option>Q2</option>
            <option>Q1</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-lg border shadow-sm border-l-4 border-l-[#1A56DB]">
          <div className="text-sm font-medium text-gray-500 uppercase">Org Completion Rate</div>
          <div className="text-3xl font-bold mt-2">72.4%</div>
          <div className="text-sm text-green-600 mt-1">&uarr; 4.2% from Q1</div>
        </div>
        <div className="bg-white p-5 rounded-lg border shadow-sm border-l-4 border-l-[#0E9F6E]">
          <div className="text-sm font-medium text-gray-500 uppercase">On Track Goals</div>
          <div className="text-3xl font-bold mt-2">1,402</div>
          <div className="text-sm text-gray-400 mt-1">68% of total</div>
        </div>
        <div className="bg-white p-5 rounded-lg border shadow-sm border-l-4 border-l-amber-500">
          <div className="text-sm font-medium text-gray-500 uppercase">Pending Check-ins</div>
          <div className="text-3xl font-bold mt-2">340</div>
          <div className="text-sm text-red-500 mt-1">Due in 5 days</div>
        </div>
        <div className="bg-white p-5 rounded-lg border shadow-sm border-l-4 border-l-purple-500">
          <div className="text-sm font-medium text-gray-500 uppercase">Avg Goals / Employee</div>
          <div className="text-3xl font-bold mt-2">4.2</div>
          <div className="text-sm text-gray-400 mt-1">Optimal range: 4-6</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Placeholder for Recharts - Goal Distribution by Thrust Area */}
        <div className="bg-white p-6 rounded-lg border shadow-sm h-80 flex flex-col">
          <h3 className="font-bold text-gray-700 mb-4">Goal Distribution by Thrust Area</h3>
          <div className="flex-1 border-2 border-dashed border-gray-100 rounded flex items-center justify-center bg-gray-50">
            <span className="text-gray-400">[ Recharts Donut Chart Placeholder ]</span>
          </div>
        </div>
        
        {/* Placeholder for Recharts - Manager Effectiveness */}
        <div className="bg-white p-6 rounded-lg border shadow-sm h-80 flex flex-col">
          <h3 className="font-bold text-gray-700 mb-4">Manager Effectiveness (Check-in Approval Rate)</h3>
          <div className="flex-1 border-2 border-dashed border-gray-100 rounded flex items-center justify-center bg-gray-50">
            <span className="text-gray-400">[ Recharts Horizontal Bar Chart Placeholder ]</span>
          </div>
        </div>
      </div>
      
      {/* Heatmap Placeholder */}
      <div className="bg-white p-6 rounded-lg border shadow-sm flex-1">
        <h3 className="font-bold text-gray-700 mb-4">Completion Heatmap (By Department)</h3>
        <div className="h-48 border-2 border-dashed border-gray-100 rounded flex items-center justify-center bg-gray-50">
          <span className="text-gray-400">[ CSS Grid Heatmap Placeholder ]</span>
        </div>
      </div>
    </div>
  );
}
