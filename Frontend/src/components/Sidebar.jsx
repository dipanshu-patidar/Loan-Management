import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../utils/cn';

const Sidebar = ({ isOpen, isCollapsed, onClose, onToggleCollapse, menuItems, role }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));

  useEffect(() => {
    const handleProfileUpdate = () => {
      setUser(JSON.parse(localStorage.getItem('user') || '{}'));
    };

    window.addEventListener('storage', handleProfileUpdate);
    window.addEventListener('profileUpdate', handleProfileUpdate);

    return () => {
      window.removeEventListener('storage', handleProfileUpdate);
      window.removeEventListener('profileUpdate', handleProfileUpdate);
    };
  }, []);

  const initials = user.fullName ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : (role ? role.substring(0, 2).toUpperCase() : '??');
  const hasPhoto = user.profilePhoto && user.profilePhoto !== 'no-photo.jpg' && !user.profilePhoto.includes('placeholder');

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <motion.aside
        initial={false}
        animate={{
          x: isOpen ? 0 : -300,
          width: isOpen ? (isCollapsed ? 80 : 280) : 0
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={cn(
          "fixed top-0 left-0 h-screen bg-white border-r border-slate-100 z-50 flex flex-col overflow-hidden lg:relative lg:translate-x-0",
          isCollapsed ? "lg:w-[80px]" : "lg:w-[280px]",
          !isOpen && "lg:w-0 lg:border-none"
        )}
      >
        {/* Header */}
        <div className={cn(
          "px-6 py-8 flex flex-col transition-all duration-300 relative",
          isCollapsed && "px-2 py-8 items-center"
        )}>
          {/* Branding Area */}
          <div className={cn(
            "flex items-center gap-3 overflow-hidden transition-all duration-300",
            isCollapsed ? "justify-center w-full" : "justify-start pr-8"
          )}>
            <div className="shrink-0">
              <img
                src="/images/Sidebar_logo.png"
                alt="Logo"
                className={cn(
                  "object-contain transition-all duration-300",
                  isCollapsed ? "w-12 h-12" : "w-12 h-12 shadow-sm"
                )}
              />
            </div>
            
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="overflow-hidden"
              >
                <h1 className="font-bold text-primary leading-none text-xl tracking-tight">Point.47</h1>
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-1.5">{role} Portal</p>
              </motion.div>
            )}
          </div>

          {/* Collapse Toggle Button (Desktop) */}
          <button
            onClick={onToggleCollapse}
            className={cn(
              "hidden lg:flex p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-primary transition-all border border-slate-100 bg-white absolute",
              isCollapsed ? "relative mt-6" : "top-8 right-4"
            )}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>

          {/* Close Button (Mobile) */}
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-50 rounded-lg lg:hidden absolute top-4 right-4"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar overflow-x-hidden">
          {menuItems.map((item, index) => (
            <NavLink
              key={index}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "sidebar-link",
                  isActive && "sidebar-link-active",
                  isCollapsed && "justify-center px-2"
                )
              }
              title={isCollapsed ? item.label : ""}
            >
              <item.icon size={22} className="shrink-0" />
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              )}
            </NavLink>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 space-y-4">
          {/* User Profile Card */}
          <div 
            className={cn(
              "bg-primary rounded-[1.5rem] p-4 flex items-center gap-3 transition-all duration-300 shadow-lg shadow-primary/20",
              isCollapsed && "p-2 justify-center"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shrink-0 shadow-sm border border-white/5 transition-colors overflow-hidden",
              isCollapsed && "w-10 h-10"
            )}>
              {hasPhoto ? (
                <img src={user.profilePhoto} alt="User" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-black text-xs uppercase">
                  {initials}
                </span>
              )}
            </div>
            
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-white font-black text-sm truncate leading-tight uppercase tracking-tight">
                  {user.fullName || (role === 'admin' ? 'Point.47 Admin' : role === 'staff' ? 'Branch Staff' : role === 'agent' ? 'Field Agent' : 'Borrower')}
                </p>
                <p className="text-white/70 font-bold text-[9px] uppercase tracking-widest mt-0.5 transition-colors">
                  {role} Portal
                </p>
              </div>
            )}
          </div>

          <button 
            onClick={() => navigate('/')}
            className={cn(
              "flex items-center gap-3 px-4 py-3 w-full rounded-xl text-rose-500 hover:bg-rose-50 transition-colors",
              isCollapsed && "justify-center px-0"
            )}
          >
            <LogOut size={20} className="shrink-0" />
            {!isCollapsed && <span className="font-bold text-xs uppercase tracking-widest whitespace-nowrap">Sign Out</span>}
          </button>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
