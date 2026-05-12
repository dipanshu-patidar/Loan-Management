import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Briefcase, Users, UserCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../utils/cn';
import authService from '../services/authService';
import { AuthModal } from '../components/landing/AuthModals';

const Login = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('admin');
  const [email, setEmail] = useState('admin@lms.com');
  const [password, setPassword] = useState('admin123');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    const credentials = {
      admin: { email: 'admin@lms.com', password: 'admin123' },
      staff: { email: 'staff@lms.com', password: 'staff123' },
      agent: { email: 'agent@lms.com', password: 'agent123' },
      borrower: { email: 'borrower@lms.com', password: 'borrower123' },
    };
    setEmail(credentials[selectedRole].email);
    setPassword(credentials[selectedRole].password);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await authService.login(email, password, role);
      toast.success('Login successful! Redirecting...');
      
      setTimeout(() => {
        navigate(`/${role}/dashboard`);
        setIsLoading(false);
      }, 1500);
    } catch (error) {
      setIsLoading(false);
      const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
      toast.error(message);
    }
  };

  const roles = [
    { id: 'admin', label: 'Admin', icon: ShieldCheck, desc: 'Full system access' },
    { id: 'staff', label: 'Staff', icon: Briefcase, desc: 'Manage loans & tasks' },
    { id: 'agent', label: 'Agent', icon: Users, desc: 'Manage clients & commissions' },
    { id: 'borrower', label: 'Borrower', icon: UserCircle, desc: 'Apply & manage loans' },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col font-inter">
      {/* --- TOP HEADER (BLUE AREA) --- */}
      <div className="bg-[#2E3A74] h-[220px] flex items-center justify-center relative overflow-hidden shrink-0">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white px-8 py-4 rounded-2xl shadow-sm flex flex-col items-center justify-center z-10"
        >
          <div className="flex items-center">
            <span className="text-[38px] font-semibold text-[#2E3A74] leading-none tracking-tight">Point</span>
            <span className="text-[38px] font-semibold text-[#49B6FF] leading-none tracking-tight">.47</span>
          </div>
          <p className="text-[11px] font-medium text-[#5B6E9F] tracking-[0.05em] mt-1.5 uppercase">
            Loan Management System
          </p>
        </motion.div>
      </div>

      {/* --- FORM AREA (NO CARD) --- */}
      <div className="flex-1 flex flex-col items-center pt-8 pb-12 px-6">
        <div className="w-full max-w-[500px]">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-[#0F172A] mb-1">Welcome Back</h2>
            <p className="text-slate-500 text-sm">Please enter your details to sign in.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-5 py-3 rounded-xl border border-slate-200 bg-slate-50/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all text-slate-700 font-medium text-sm"
                  placeholder="admin@lms.com"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-5 py-3 rounded-xl border border-slate-200 bg-slate-50/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all text-slate-700 font-medium text-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary" />
                <span className="text-xs text-slate-600 font-semibold group-hover:text-primary transition-colors">Remember me</span>
              </label>
              <button type="button" className="text-xs font-bold text-primary hover:text-primary-dark transition-colors">
                Forgot Password?
              </button>
            </div>

            {/* Role Selection Grid */}
            <div className="pt-5 border-t border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 ml-1">Select Role</p>
              <div className="grid grid-cols-2 gap-4">
                {roles.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleRoleSelect(r.id)}
                    className={cn(
                      "p-4 rounded-xl border text-left transition-all duration-200 flex flex-col items-start gap-2",
                      role === r.id
                        ? "border-[#2E3A74] bg-slate-50/80 shadow-sm"
                        : "border-slate-100 hover:border-slate-200"
                    )}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <r.icon size={18} className={cn(role === r.id ? "text-[#2E3A74]" : "text-slate-300")} />
                      {role === r.id && <ShieldCheck size={12} className="text-[#2E3A74]" />}
                    </div>
                    <div>
                      <p className={cn("text-sm font-bold", role === r.id ? "text-[#2E3A74]" : "text-slate-800")}>{r.label}</p>
                      <p className="text-[10px] text-slate-400 font-medium line-clamp-1">{r.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#2E3A74] hover:bg-[#1e264d] text-white py-4 rounded-xl font-bold text-base shadow-lg shadow-primary/10 transition-all active:scale-[0.99] disabled:opacity-70 mt-2 flex items-center justify-center gap-2"
            >
              {isLoading && (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              )}
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-500 font-medium">
            Don't have an account? <button onClick={() => setIsModalOpen(true)} className="text-primary font-bold hover:underline ml-1">Create Account</button>
          </p>
        </div>
      </div>

      {/* BORROWER REGISTRATION MODAL */}
      <AuthModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialTab="register"
      />
    </div>
  );
};

export default Login;

