"use client";
import React, { useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useAuthStore(state => state.login);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (res.ok) {
        const data = await res.json();
        login(data.user, data.token);
        router.push('/dashboard');
      } else {
        alert('Login failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const quickLogin = (email: string) => {
    setEmail(email);
    setPassword('AtomPulse@2025');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-3/5 bg-[#1A56DB] items-center justify-center p-12 text-white">
        <div className="max-w-md">
          <h1 className="text-5xl font-bold mb-6">AtomPulse</h1>
          <p className="text-xl text-blue-100">Goal Clarity. Team Alignment. Real Results.</p>
        </div>
      </div>
      
      {/* Right Panel */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-white">
        <div className="mx-auto w-full max-w-sm">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Sign in to your account</h2>
          
          <div className="mt-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email address</label>
                <div className="mt-1">
                  <input
                    type="email"
                    required
                    className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <div className="mt-1">
                  <input
                    type="password"
                    required
                    className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#1A56DB] hover:bg-blue-700"
                >
                  Sign In
                </button>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-4 font-medium text-center">Quick Demo Login</p>
              <div className="flex space-x-2 justify-center">
                <button onClick={() => quickLogin('employee@atompulse.com')} className="px-3 py-1 bg-gray-100 text-xs rounded-full hover:bg-gray-200">Employee</button>
                <button onClick={() => quickLogin('manager@atompulse.com')} className="px-3 py-1 bg-amber-50 text-amber-700 text-xs rounded-full hover:bg-amber-100">Manager</button>
                <button onClick={() => quickLogin('admin@atompulse.com')} className="px-3 py-1 bg-red-50 text-red-700 text-xs rounded-full hover:bg-red-100">Admin/HR</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
