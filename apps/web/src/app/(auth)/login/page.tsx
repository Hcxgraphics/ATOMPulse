"use client";

import React, { useState } from "react";
import { useAuthStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { SparkIcon } from "@/components/ui-shell";

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
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="fixed inset-0 -z-20 gradient-aurora opacity-90" />
      <div className="fixed inset-0 -z-10 grid-bg opacity-40" />

      <div className="grid min-h-screen lg:grid-cols-[1.15fr_0.85fr]">
        <section className="hidden min-h-screen items-center justify-center border-r border-border/70 p-12 lg:flex">
          <div className="max-w-xl">
            <div className="mb-8 flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl gradient-primary text-primary-foreground shadow-glow">
                <SparkIcon />
              </div>
              <div>
                <div className="text-2xl font-bold">AtomPulse</div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Performance OS</div>
              </div>
            </div>
            <h1 className="text-5xl font-semibold tracking-tight">
              Goal clarity, team alignment, <span className="gradient-text">real results.</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">
              A modern operating layer for cycles, check-ins, approvals, analytics, and performance governance.
            </p>
            <div className="mt-10 grid grid-cols-3 gap-3">
              {["Cycles", "Approvals", "Insights"].map((item) => (
                <div key={item} className="rounded-2xl border border-border/80 bg-card/55 p-4 backdrop-blur-xl">
                  <div className="text-sm font-semibold">{item}</div>
                  <div className="mt-2 h-1.5 rounded-full bg-gradient-to-r from-primary to-teal" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-12">
          <div className="w-full max-w-md rounded-3xl border border-border/80 bg-card/70 p-6 shadow-elevated backdrop-blur-xl sm:p-8">
            <div className="mb-8 lg:hidden">
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl gradient-primary text-primary-foreground shadow-glow">
                <SparkIcon />
              </div>
              <h1 className="text-3xl font-semibold">AtomPulse</h1>
            </div>
            <div className="mb-8">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Secure workspace</div>
              <h2 className="text-3xl font-semibold tracking-tight">Sign in to your account</h2>
              <p className="mt-2 text-sm text-muted-foreground">Use your company credentials or a demo profile.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">Email address</label>
                <input
                  type="email"
                  required
                  className="field w-full"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">Password</label>
                <input
                  type="password"
                  required
                  className="field w-full"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary w-full">
                Sign In
              </button>
            </form>

            <div className="mt-8 border-t border-border/70 pt-6">
              <p className="mb-4 text-center text-sm font-medium text-muted-foreground">Quick Demo Login</p>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => quickLogin('employee@atompulse.com')} className="btn btn-secondary min-h-9 px-2 text-xs">Employee</button>
                <button onClick={() => quickLogin('manager@atompulse.com')} className="btn btn-secondary min-h-9 px-2 text-xs">Manager</button>
                <button onClick={() => quickLogin('admin@atompulse.com')} className="btn btn-secondary min-h-9 px-2 text-xs">Admin/HR</button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
