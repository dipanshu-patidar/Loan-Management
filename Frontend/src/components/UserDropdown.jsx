import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const UserDropdown = ({ role }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-1.5 hover:bg-slate-50 rounded-xl transition-all"
      >
        <div className="w-9 h-9 bg-accent/10 rounded-lg flex items-center justify-center text-accent font-bold">
          {role === 'admin' ? 'AD' : role === 'staff' ? 'ST' : role === 'agent' ? 'AG' : 'BR'}
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-sm font-bold text-slate-800 leading-none">
            {role === 'admin' ? 'Point.47 Admin' : role === 'staff' ? 'Branch Staff' : role === 'agent' ? 'Field Agent' : 'Borrower'}
          </p>
          <p className="text-[10px] text-slate-400 font-semibold uppercase mt-1 tracking-wider">{role}</p>
        </div>
        <ChevronDown size={16} className={cn("text-slate-400 transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-premium border border-slate-100 z-20 overflow-hidden"
            >
              <div className="p-2">
                <button 
                  onClick={() => { navigate(`/${role}/profile`); setIsOpen(false); }}
                  className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <User size={18} />
                  <span>My Profile</span>
                </button>
                {role === 'admin' && (
                  <button 
                    onClick={() => { 
                      navigate('/admin/settings'); 
                      setIsOpen(false); 
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <Settings size={18} />
                    <span>Account Settings</span>
                  </button>
                )}
                <div className="h-px bg-slate-100 my-1 mx-2" />
                <button 
                  onClick={() => navigate('/')}
                  className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors font-medium"
                >
                  <LogOut size={18} />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// Import cn for internal use
import { cn } from '../utils/cn';

export default UserDropdown;
