import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, Calculator } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import { cn } from '../../utils/cn';
import authService from '../../services/authService';

export const AuthModal = ({ isOpen, onClose, initialTab = 'login', loanData }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isLoading, setIsLoading] = useState(false);

  // Form States
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginData.email || !loginData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await authService.login(loginData.email, loginData.password, 'borrower');
      toast.success('Login successful!');

      setTimeout(() => {
        if (loanData) {
          navigate('/borrower/apply-loan', {
            state: {
              amount: loanData?.amount,
              duration: loanData?.duration
            }
          });
        } else {
          navigate('/borrower/dashboard');
        }
        onClose();
        setIsLoading(false);
      }, 1500);
    } catch (error) {
      setIsLoading(false);
      const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
      toast.error(message);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    // Validations
    if (!registerData.fullName || !registerData.email || !registerData.phone || !registerData.password) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (registerData.password !== registerData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (!registerData.acceptTerms) {
      toast.error('Please accept the Terms & Conditions');
      return;
    }

    setIsLoading(true);
    try {
      await authService.register({
        fullName: registerData.fullName,
        email: registerData.email,
        phone: registerData.phone,
        password: registerData.password,
        confirmPassword: registerData.confirmPassword,
        role: 'borrower'
      });

      toast.success('Account created successfully!');

      setTimeout(() => {
        if (loanData) {
          navigate('/borrower/apply-loan', {
            state: {
              amount: loanData?.amount,
              duration: loanData?.duration
            }
          });
        } else {
          navigate('/borrower/dashboard');
        }
        onClose();
        setIsLoading(false);
      }, 1500);
    } catch (error) {
      setIsLoading(false);
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(message);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60]"
            />
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-[32px] shadow-2xl w-full max-w-[500px] relative pointer-events-auto overflow-hidden flex flex-col max-h-[90vh]"
              >
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-all z-20"
                >
                  <X size={20} />
                </button>

                {/* Tabs */}
                <div className="flex border-b border-slate-100">
                  <button
                    onClick={() => setActiveTab('login')}
                    className={cn(
                      "flex-1 py-5 text-sm font-bold transition-all relative",
                      activeTab === 'login' ? "text-primary" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    Login
                    {activeTab === 'login' && (
                      <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('register')}
                    className={cn(
                      "flex-1 py-5 text-sm font-bold transition-all relative",
                      activeTab === 'register' ? "text-primary" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    Create Account
                    {activeTab === 'register' && (
                      <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
                    )}
                  </button>
                </div>

                <div className="p-8 overflow-y-auto custom-scrollbar">
                  {activeTab === 'login' ? (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      key="login"
                    >
                      <div className="mb-8">
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">Welcome Back</h3>
                        <p className="text-slate-500 text-sm">Please enter your credentials to continue.</p>
                      </div>

                      <form onSubmit={handleLogin} className="space-y-5">
                        <Input
                          label="Email Address"
                          placeholder="borrower@example.com"
                          value={loginData.email}
                          onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                          required
                        />
                        <div className="space-y-2">
                          <Input
                            label="Password"
                            type="password"
                            placeholder="••••••••"
                            value={loginData.password}
                            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                            required
                          />
                          <div className="flex justify-end">
                            <button type="button" className="text-xs font-bold text-primary hover:underline">
                              Forgot Password?
                            </button>
                          </div>
                        </div>

                        <Button type="submit" className="w-full py-4 shadow-lg shadow-primary/20" isLoading={isLoading}>
                          Login
                        </Button>
                      </form>

                      <p className="mt-8 text-center text-sm text-slate-500">
                        Don't have an account?{' '}
                        <button onClick={() => setActiveTab('register')} className="text-primary font-bold hover:underline">
                          Create Account
                        </button>
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      key="register"
                    >
                      <div className="mb-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-bold uppercase mb-3">
                          <ShieldCheck size={12} />
                          Secure Registration
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">Join Point.47</h3>
                        <p className="text-slate-500 text-sm">Create an account to track your loan in real-time.</p>
                      </div>

                      <form onSubmit={handleRegister} className="space-y-4">
                        <Input
                          label="Full Name"
                          placeholder="John Doe"
                          required
                          value={registerData.fullName}
                          onChange={(e) => setRegisterData({ ...registerData, fullName: e.target.value })}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            label="Phone Number"
                            placeholder="+1 234..."
                            required
                            value={registerData.phone}
                            onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                          />
                          <Input
                            label="Email Address"
                            type="email"
                            placeholder="john@example.com"
                            required
                            value={registerData.email}
                            onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            label="Password"
                            type="password"
                            placeholder="••••••••"
                            required
                            value={registerData.password}
                            onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                          />
                          <Input
                            label="Confirm Password"
                            type="password"
                            placeholder="••••••••"
                            required
                            value={registerData.confirmPassword}
                            onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                          />
                        </div>

                        <label className="flex items-start gap-3 cursor-pointer group mt-4">
                          <input
                            type="checkbox"
                            className="mt-1 w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                            checked={registerData.acceptTerms}
                            onChange={(e) => setRegisterData({ ...registerData, acceptTerms: e.target.checked })}
                          />
                          <span className="text-xs text-slate-500 group-hover:text-slate-700 transition-colors">
                            I accept the <button type="button" className="text-primary font-bold hover:underline">Terms & Conditions</button> and <button type="button" className="text-primary font-bold hover:underline">Privacy Policy</button>.
                          </span>
                        </label>

                        <Button type="submit" className="w-full py-4 shadow-lg shadow-primary/20 mt-4" isLoading={isLoading}>
                          Create Account
                        </Button>
                      </form>

                      <p className="mt-8 text-center text-sm text-slate-500">
                        Already have an account?{' '}
                        <button onClick={() => setActiveTab('login')} className="text-primary font-bold hover:underline">
                          Login
                        </button>
                      </p>
                    </motion.div>
                  )}
                </div>

                {/* Progress Indicator if redirected from EMI */}
                {loanData && (
                  <div className="bg-soft p-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <Calculator size={16} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Applying For</p>
                        <p className="text-xs font-bold text-slate-900">${loanData.amount.toLocaleString()} / {loanData.duration} Months</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
