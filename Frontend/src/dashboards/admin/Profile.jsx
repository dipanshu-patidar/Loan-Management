import React, { useState } from 'react';
import { 
  User, Mail, Phone, MapPin, Calendar, 
  Lock, Camera, CheckCircle2, X, Save, Key,
  ShieldCheck, Building2, BadgeCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import StatusBadge from '../../components/StatusBadge';

const Profile = () => {
  const [showToast, setShowToast] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('personal'); 
  const isStaff = window.location.pathname.includes('/staff');
  const isAgent = window.location.pathname.includes('/agent');
  const isBorrower = window.location.pathname.includes('/borrower');

  const roleTitle = isBorrower ? 'Borrower User' : (isAgent ? 'Field Agent' : (isStaff ? 'Branch Staff' : 'Admin User'));
  const roleSubtitle = isBorrower ? 'Verified Borrower' : (isAgent ? 'Portfolio Specialist' : (isStaff ? 'Operational Specialist' : 'Senior Administrator'));
  const roleEmail = isBorrower ? 'borrower@point47.com' : (isAgent ? 'agent@point47.com' : (isStaff ? 'staff@point47.com' : 'admin@point47.com'));
  const locationLabel = isBorrower ? 'Residential Area' : 'Primary Branch';
  const locationValue = isBorrower ? 'Sandton, Gauteng' : 'Johannesburg Central';

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowToast('Profile Updated Successfully!');
      setTimeout(() => setShowToast(null), 3000);
    }, 1500);
  };

  const triggerPhotoToast = () => {
    setShowToast('Profile Photo Updated!');
    setTimeout(() => setShowToast(null), 3000);
  };

  return (
    <div className="space-y-8 pb-20">
      {/* 1. PAGE HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Profile</h1>
          <p className="text-slate-500 font-medium mt-1">Manage your account information, security settings, and personal details.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button 
             onClick={handleSave} 
             isLoading={isSaving}
             className="flex items-center gap-2 font-bold px-8 shadow-lg shadow-primary/20"
           >
             <Save size={18} /> Save Changes
           </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* LEFT COLUMN: OVERVIEW */}
         <div className="space-y-8">
            {/* PROFILE OVERVIEW CARD */}
            <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-soft overflow-hidden">
               <div className="h-32 bg-slate-900 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-transparent opacity-50" />
                  <div className="absolute -bottom-12 left-8">
                     <div className="relative group">
                        <input 
                          type="file" 
                          id="profile-upload" 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              triggerPhotoToast();
                            }
                          }}
                        />
                        <div className="w-24 h-24 rounded-3xl bg-white p-1.5 shadow-xl">
                           <div className="w-full h-full rounded-[1.25rem] bg-slate-100 flex items-center justify-center text-3xl font-black text-slate-400 overflow-hidden">
                              <User size={48} />
                           </div>
                        </div>
                        <button 
                          onClick={() => document.getElementById('profile-upload').click()}
                          className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transition-all border-2 border-white"
                        >
                           <Camera size={14} />
                        </button>
                     </div>
                  </div>
               </div>
               
               <div className="pt-16 pb-8 px-8 space-y-6">
                  <div>
                     <h2 className="text-2xl font-black text-slate-900 tracking-tight">{roleTitle}</h2>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{roleSubtitle}</p>
                  </div>

                  <div className="space-y-4">
                     <ProfileDetail icon={Mail} label="Email Address" value={roleEmail} />
                     <ProfileDetail icon={Phone} label="Phone Number" value="+27 71 888 4444" />
                     <ProfileDetail icon={isBorrower ? MapPin : Building2} label={locationLabel} value={locationValue} />
                  </div>

                  <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Status</span>
                     <StatusBadge status="Active" />
                  </div>
               </div>
            </section>
         </div>

         {/* RIGHT COLUMN: SETTINGS TABS */}
         <div className="lg:col-span-2 space-y-8">
            {/* TAB NAVIGATION */}
            <nav className="flex items-center gap-2 p-1.5 bg-slate-100/50 rounded-2xl w-fit">
               <TabButton active={activeTab === 'personal'} onClick={() => setActiveTab('personal')} label="Personal" icon={User} />
               <TabButton active={activeTab === 'security'} onClick={() => setActiveTab('security')} label="Security" icon={Lock} />
            </nav>

            <AnimatePresence mode="wait">
               {activeTab === 'personal' && (
                  <motion.div 
                     key="personal"
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: -20 }}
                     className="space-y-8"
                  >
                     <section className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-soft space-y-8">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                              <User size={24} />
                           </div>
                           <div>
                              <h3 className="text-xl font-black text-slate-900 tracking-tight">Personal Information</h3>
                              <p className="text-xs font-bold text-slate-400">Your public and internal identity details.</p>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <Input label="Full Name" defaultValue={roleTitle} icon={User} />
                           <Input label="Email Address" defaultValue={roleEmail} icon={Mail} />
                           <Input label="Phone Number" defaultValue="+27 71 888 4444" icon={Phone} />
                           <Input label="Date of Birth" type="date" defaultValue="1990-01-01" icon={Calendar} />
                           <div className="md:col-span-2">
                              <Input label="Address" isTextArea defaultValue="123 Financial District, Sandton, 2196" icon={MapPin} />
                           </div>
                           <Input label={locationLabel} defaultValue={locationValue} icon={isBorrower ? MapPin : Building2} />
                        </div>
                     </section>
                  </motion.div>
               )}

               {activeTab === 'security' && (
                  <motion.div 
                     key="security"
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: -20 }}
                     className="space-y-8"
                  >
                     <section className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-soft space-y-10">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                              <Lock size={24} />
                           </div>
                           <div>
                              <h3 className="text-xl font-black text-slate-900 tracking-tight">Security Settings</h3>
                              <p className="text-xs font-bold text-slate-400">Protect your account and system access.</p>
                           </div>
                        </div>

                        <div className="space-y-8">
                           <div className="grid grid-cols-1 gap-6">
                              <Input label="Current Password" type="password" placeholder="••••••••" icon={Lock} />
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 <Input label="New Password" type="password" placeholder="Create new password" icon={Key} />
                                 <Input label="Confirm New Password" type="password" placeholder="Repeat new password" icon={ShieldCheck} />
                              </div>
                           </div>

                           <div className="flex gap-4 pt-4">
                              <Button variant="secondary" className="flex-1">Discard Changes</Button>
                              <Button className="flex-1 shadow-lg shadow-primary/20">Update Password</Button>
                           </div>
                        </div>
                     </section>
                  </motion.div>
               )}
            </AnimatePresence>
         </div>
      </div>

      {/* SAVE BAR (MOBILE) */}
      <div className="lg:hidden fixed bottom-6 left-6 right-6 z-40">
         <Button 
            onClick={handleSave}
            isLoading={isSaving}
            className="w-full shadow-2xl shadow-primary/40 py-5 rounded-[1.5rem] flex items-center justify-center gap-3"
         >
            <Save size={20} /> Save All Changes
         </Button>
      </div>

      {/* SUCCESS TOAST */}
      <AnimatePresence>
         {showToast && (
            <motion.div 
               initial={{ opacity: 0, y: 100 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: 100 }}
               className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-4 rounded-2xl shadow-2xl z-[100] flex items-center gap-4 border border-white/10"
            >
               <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 size={18} className="text-white" />
               </div>
               <div>
                  <p className="text-sm font-black tracking-tight">{showToast}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Action completed successfully</p>
               </div>
               <button onClick={() => setShowToast(null)} className="ml-4 p-1 hover:bg-white/10 rounded-lg">
                  <X size={16} className="text-slate-500" />
               </button>
            </motion.div>
         )}
      </AnimatePresence>
    </div>
  );
};

// --- HELPER COMPONENTS ---

const ProfileDetail = ({ icon: Icon, label, value }) => (
   <div className="flex items-center gap-4 group">
      <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center transition-all group-hover:bg-primary/5 group-hover:text-primary">
         <Icon size={18} />
      </div>
      <div>
         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
         <p className="text-sm font-bold text-slate-700">{value}</p>
      </div>
   </div>
);

const TabButton = ({ active, onClick, label, icon: Icon }) => (
   <button 
      onClick={onClick}
      className={cn(
         "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
         active ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
      )}
   >
      <Icon size={16} />
      {label}
   </button>
);

export default Profile;
