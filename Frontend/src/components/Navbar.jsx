import React from 'react';
import { Menu, Bell, Search, ChevronDown } from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';
import StaffNotificationDropdown from './StaffNotificationDropdown';
import UserDropdown from './UserDropdown';

const Navbar = ({ toggleSidebar, role }) => {
  return (
    <nav className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-slate-50 rounded-lg text-slate-500 lg:hidden"
        >
          <Menu size={20} />
        </button>

        <div className="relative hidden md:block">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search anything..."
            className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm w-64 focus:ring-2 focus:ring-primary/10 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {role === 'admin' && <NotificationDropdown />}
        {role === 'staff' && <StaffNotificationDropdown />}
        {(role === 'admin' || role === 'staff') && <div className="h-8 w-px bg-slate-100 mx-2 hidden sm:block" />}
        <UserDropdown role={role} />
      </div>
    </nav>
  );
};

export default Navbar;
