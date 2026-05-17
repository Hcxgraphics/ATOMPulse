"use client";
import React, { useState } from 'react';

export default function GoalsPage() {
  const [goals, setGoals] = useState([
    { id: '1', title: 'Revenue Growth', thrust: 'Sales', uom: 'Numeric (Min)', target: 5000000, weightage: 30, isLocked: false },
    { id: '2', title: 'Reduce TAT', thrust: 'Ops', uom: 'Timeline', target: '2026-12-31', weightage: 20, isLocked: false },
  ]);

  const totalWeightage = goals.reduce((sum, g) => sum + g.weightage, 0);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Goal Sheet</h1>
          <p className="text-sm text-gray-500">2026 Annual Goals Cycle &middot; <span className="text-gray-600 font-medium bg-gray-100 px-2 py-0.5 rounded-full text-xs">Draft</span></p>
        </div>
        <div className="flex space-x-3">
          <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            + Add Goal
          </button>
          <button 
            disabled={totalWeightage !== 100}
            className={`px-4 py-2 rounded-md text-sm font-medium text-white ${totalWeightage === 100 ? 'bg-[#1A56DB] hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'}`}
          >
            Submit for Approval
          </button>
        </div>
      </div>

      {/* Weightage Tracker */}
      <div className="mb-8">
        <div className="flex justify-between text-sm mb-1">
          <span className="font-medium text-gray-700">Total Weightage</span>
          <span className={`font-bold ${totalWeightage === 100 ? 'text-[#0E9F6E]' : totalWeightage > 100 ? 'text-red-600' : 'text-gray-700'}`}>
            {totalWeightage}% / 100%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${totalWeightage === 100 ? 'bg-[#0E9F6E]' : totalWeightage > 100 ? 'bg-red-500' : 'bg-[#1A56DB]'}`}
            style={{ width: `${Math.min(totalWeightage, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Goals List */}
      <div className="space-y-4">
        {goals.map(goal => (
          <div key={goal.id} className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm relative group hover:border-[#1A56DB] transition-colors">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-gray-900">{goal.title}</h3>
                <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">{goal.thrust}</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-lg font-bold text-[#1A56DB]">{goal.weightage}% weight</span>
              </div>
            </div>
            
            <div className="text-sm text-gray-600 space-y-1 mb-4">
              <p><strong>UOM:</strong> {goal.uom}</p>
              <p><strong>Target:</strong> {goal.target}</p>
              <p className="mt-2 text-gray-500">Achieve Q1-Q4 targets seamlessly as planned...</p>
            </div>

            <div className="flex justify-end space-x-2 border-t border-gray-100 pt-3">
              <button className="text-sm text-gray-500 hover:text-[#1A56DB] font-medium">Edit</button>
              <button className="text-sm text-red-500 hover:text-red-700 font-medium">Delete</button>
            </div>
          </div>
        ))}

        {goals.length === 0 && (
          <div className="text-center py-12 bg-white border border-dashed border-gray-300 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900">No goals</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new goal.</p>
            <button className="mt-4 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              + Add Goal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
