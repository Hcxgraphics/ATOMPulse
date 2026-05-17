"use client";
import React from 'react';
import Link from 'next/link';

const columns = [
  { id: 'DRAFT', title: 'Draft' },
  { id: 'SUBMITTED', title: 'Submitted' },
  { id: 'APPROVED', title: 'Approved' },
  { id: 'LOCKED', title: 'Locked' },
  { id: 'RETURNED', title: 'Returned' },
];

const mockCards = [
  { id: '1', employee: 'Arjun K.', dept: 'Backend', status: 'SUBMITTED', goals: 4, date: '12 May 2026' },
  { id: '2', employee: 'Sneha R.', dept: 'Frontend', status: 'DRAFT', goals: 2, date: '-' },
  { id: '3', employee: 'Vikram S.', dept: 'Design', status: 'APPROVED', goals: 5, date: '10 May 2026' },
];

export default function TeamOverviewPage() {
  return (
    <div className="p-8 h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Team Overview</h1>
        <p className="text-sm text-gray-500">Manage and approve goals for your direct reports.</p>
      </div>

      {/* Kanban Board */}
      <div className="flex flex-1 space-x-4 overflow-x-auto pb-4">
        {columns.map(col => (
          <div key={col.id} className="w-72 bg-gray-100 rounded-lg flex flex-col shrink-0">
            <div className="p-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-700 text-sm">{col.title}</h3>
            </div>
            
            <div className="p-3 flex-1 overflow-y-auto space-y-3">
              {mockCards.filter(c => c.status === col.id).map(card => (
                <div key={card.id} className="bg-white p-3 rounded border border-gray-200 shadow-sm hover:border-[#1A56DB] cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium text-gray-900">{card.employee}</div>
                    <span className="text-[10px] uppercase font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{card.dept}</span>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1 mb-3">
                    <p>{card.goals} Goals</p>
                    {card.status !== 'DRAFT' && <p>Submitted: {card.date}</p>}
                  </div>
                  
                  {card.status === 'SUBMITTED' && (
                    <button className="w-full bg-[#1A56DB] text-white text-xs font-medium py-1.5 rounded hover:bg-blue-700">
                      Review &rarr;
                    </button>
                  )}
                  {card.status === 'APPROVED' && (
                    <button className="w-full bg-white text-gray-700 border border-gray-300 text-xs font-medium py-1.5 rounded hover:bg-gray-50">
                      View
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
