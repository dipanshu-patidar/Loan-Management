import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Mail, Phone, MapPin, Calendar, 
  Lock, Camera, CheckCircle2, X, Save, Key,
  ShieldCheck, Building2, BadgeCheck, Eye, EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { cn } from '../../utils/cn';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import StatusBadge from '../../components/StatusBadge';
import profileService from '../../services/profileService';
import staffProfileService from '../../services/staffProfileService';

const Profile = () => {
  // Core States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  
  // Password Visibility States
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  // Model States
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    address: '',
    primaryBranch: '',
    role: '',
    profilePhoto: '',
    accountStatus: 'Active',
    employeeId: '',
    designation: '',
    joiningDate: ''
  });

  // Original data backup for discard functionality
  const originalDataRef = useRef({});

  // Password fields state
  const [pwdData, setPwdData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const isStaff = window.location.pathname.includes('/staff');
  const isAgent = window.location.pathname.includes('/agent');
  const isBorrower = window.location.pathname.includes('/borrower');

  // Role based service selection
  const getService = () => {
    if (isStaff) return staffProfileService;
    return profileService;
  };

  const roleTitle = profileData.fullName || (isBorrower ? 'Borrower' : (isAgent ? 'Field Agent' : (isStaff ? 'Branch Staff' : 'Administrator')));
  const roleSubtitle = isStaff ? (profileData.designation || 'Operational Specialist') : (isBorrower ? 'Verified Borrower' : (isAgent ? 'Portfolio Specialist' : 'Senior Administrator'));
  const locationLabel = isBorrower ? 'Residential Area' : 'Primary Branch';

  // Helper to format dates from Mongo to YYYY-MM-DD for Input compatibility
  const formatDate = (dateInput) => {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  };

  // 1. Hydrate Profile Info
  const loadProfile = async () => {
    try {
      setLoading(true);
      const service = getService();
      
      let response;
      if (isStaff) {
        response = await service.getStaffProfile();
      } else {
        response = await service.getAdminProfile();
      }

      if (response.data) {
        const data = response.data;
        const formatted = {
          fullName: data.fullName || '',
          email: data.email || '',
          phoneNumber: data.phoneNumber || data.phone || '',
          dateOfBirth: formatDate(data.dateOfBirth),
          address: data.address || '',
          primaryBranch: data.primaryBranch || '',
          role: data.role || (isStaff ? 'Staff' : 'admin'),
          profilePhoto: data.profilePhoto || '',
          accountStatus: data.accountStatus || data.operationalStatus || (data.isActive ? 'Active' : 'Inactive'),
          employeeId: data.employeeId || '',
          designation: data.designation || '',
          joiningDate: data.joiningDate || ''
        };
        setProfileData(formatted);
        originalDataRef.current = formatted;

        // Sync to local storage for real-time navbar consistency
        const currentStored = JSON.parse(localStorage.getItem('user') || '{}');
        const newStored = {
          ...currentStored,
          fullName: formatted.fullName,
          profilePhoto: formatted.profilePhoto,
          role: formatted.role
        };
        localStorage.setItem('user', JSON.stringify(newStored));
        window.dispatchEvent(new Event('profileUpdate'));
      }
    } catch (err) {
      toast.error('Failed to load account profile data');
      console.error('Profile fetch failure:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // 2. Update Profile Handler
  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      const service = getService();
      
      const updatePayload = {
        fullName: profileData.fullName,
        phoneNumber: profileData.phoneNumber,
        dateOfBirth: profileData.dateOfBirth || null,
        address: profileData.address,
      };

      // Admin can update branch, staff cannot
      if (!isStaff) {
        updatePayload.primaryBranch = profileData.primaryBranch;
      }

      let res;
      if (isStaff) {
        res = await service.updateStaffProfile(updatePayload);
      } else {
        res = await service.updateAdminProfile(updatePayload);
      }

      if (res.success) {
        toast.success('Profile updated successfully!');
        
        // Track backup
        originalDataRef.current = { ...profileData };

        // Sync changes to user dropdown
        const currentStored = JSON.parse(localStorage.getItem('user') || '{}');
        const newStored = {
          ...currentStored,
          fullName: profileData.fullName
        };
        localStorage.setItem('user', JSON.stringify(newStored));
        window.dispatchEvent(new Event('profileUpdate'));
      }
    } catch (err) {
      const errMsg = err.message || err.response?.data?.message || 'Unable to commit profile changes';
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  // 3. Profile Photo Upload Routine
  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client validation
    const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Unsupported image format. Use PNG, JPG, or WEBP.');
      return;
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size exceeds 5MB limit');
      return;
    }

    try {
      setUploadingPhoto(true);
      const formData = new FormData();
      formData.append('profilePhoto', file);

      const service = getService();
      let res;
      if (isStaff) {
        res = await service.uploadStaffProfilePhoto(formData);
      } else {
        res = await service.updateProfilePhoto(formData);
      }
      
      if (res.success) {
        const newPhotoUrl = res.data.profilePhoto;
        
        // Set locally
        setProfileData(prev => ({ ...prev, profilePhoto: newPhotoUrl }));
        
        // Update stored reference
        const currentStored = JSON.parse(localStorage.getItem('user') || '{}');
        const newStored = { ...currentStored, profilePhoto: newPhotoUrl };
        localStorage.setItem('user', JSON.stringify(newStored));
        
        // Fire React local sync event for top dropdown
        window.dispatchEvent(new Event('profileUpdate'));

        toast.success('Profile photo updated');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to upload image to server');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // 4. Discard Logic
  const handleDiscard = () => {
    setProfileData({ ...originalDataRef.current });
    toast('Fields reset to original values');
  };

  // 5. Password Change Flow
  const handlePasswordUpdate = async (e) => {
    if (e) e.preventDefault();
    
    const { currentPassword, newPassword, confirmPassword } = pwdData;

    if (!newPassword || !confirmPassword) {
      toast.error('Please fill the new password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Confirm password does not match new password');
      return;
    }

    // Length validation: Min 6 characters
    if (newPassword.length < 6) {
      toast.error('Password must contain minimum 6 characters');
      return;
    }

    try {
      setChangingPassword(true);
      const service = getService();
      
      if (isStaff) {
        await service.changeStaffPassword({
          currentPassword: currentPassword || '',
          newPassword,
          confirmPassword
        });
      } else {
        await service.changePassword({
          currentPassword: currentPassword || '',
          newPassword,
          confirmPassword
        });
      }
      
      toast.success('Password updated successfully');
      setPwdData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      const msg = err.message || err.response?.data?.message || 'Password update failed';
      toast.error(msg);
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center font-black text-slate-400 tracking-widest animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          Syncing Profile Core...
        </div>
      </div>
    );
  }

  const hasPhoto = profileData.profilePhoto && profileData.profilePhoto !== 'no-photo.jpg' && !profileData.profilePhoto.includes('placeholder');

  return (
    <div className="space-y-8 pb-20">
      {/* 1. PAGE HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Profile</h1>
          <p className="text-slate-500 font-medium mt-1">Manage your account information, security settings, and personal details.</p>
        </div>
        {activeTab === 'personal' && (
          <div className="flex items-center gap-3">
             <Button 
               onClick={handleSaveProfile} 
               isLoading={saving}
               className="flex items-center gap-2 font-bold px-8 shadow-lg shadow-primary/20"
             >
               <Save size={18} /> Save Changes
             </Button>
          </div>
        )}
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
                          accept="image/png, image/jpg, image/jpeg, image/webp"
                          onChange={handlePhotoChange}
                          disabled={uploadingPhoto}
                        />
                        <div className="w-24 h-24 rounded-3xl bg-white p-1.5 shadow-xl overflow-hidden flex items-center justify-center relative">
                           {uploadingPhoto && (
                             <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center">
                               <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                             </div>
                           )}
                           
                           <div className="w-full h-full rounded-[1.25rem] bg-slate-100 flex items-center justify-center text-3xl font-black text-slate-400 overflow-hidden">
                              {hasPhoto ? (
                                <img src={profileData.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                              ) : (
                                <User size={48} />
                              )}
                           </div>
                        </div>
                        <button 
                          onClick={() => document.getElementById('profile-upload').click()}
                          disabled={uploadingPhoto}
                          type="button"
                          className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transition-all border-2 border-white disabled:opacity-50"
                        >
                           <Camera size={14} />
                        </button>
                     </div>
                  </div>
               </div>
               
               <div className="pt-16 pb-8 px-8 space-y-6">
                  <div>
                     <h2 className="text-2xl font-black text-slate-900 tracking-tight break-words">{roleTitle}</h2>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{roleSubtitle}</p>
                  </div>

                  <div className="space-y-4">
                     <ProfileDetail icon={Mail} label="Email Address" value={profileData.email} />
                     <ProfileDetail icon={Phone} label="Phone Number" value={profileData.phoneNumber || 'Not Set'} />
                     <ProfileDetail 
                        icon={isBorrower ? MapPin : Building2} 
                        label={locationLabel} 
                        value={profileData.primaryBranch || (isBorrower ? (profileData.address || 'Not set') : 'Corporate Head') } 
                     />
                  </div>

                  <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Status</span>
                     <StatusBadge status={profileData.accountStatus} />
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

                        <form onSubmit={handleSaveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <Input 
                             label="Full Name" 
                             value={profileData.fullName} 
                             onChange={(e) => setProfileData(prev => ({ ...prev, fullName: e.target.value }))}
                             icon={User} 
                             required
                           />
                           <Input 
                             label="Email Address" 
                             value={profileData.email} 
                             readOnly 
                             className="bg-slate-50 opacity-80 cursor-not-allowed"
                             icon={Mail} 
                           />
                           <Input 
                             label="Phone Number" 
                             value={profileData.phoneNumber} 
                             onChange={(e) => setProfileData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                             icon={Phone} 
                             placeholder="e.g. +27 71 888 4444"
                           />
                           <Input 
                             label="Date of Birth" 
                             type="date" 
                             value={profileData.dateOfBirth} 
                             onChange={(e) => setProfileData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                             icon={Calendar} 
                           />
                           {isStaff && (
                             <Input 
                               label="Employee ID" 
                               value={profileData.employeeId} 
                               readOnly 
                               className="bg-slate-50 opacity-80 cursor-not-allowed"
                               icon={BadgeCheck} 
                             />
                           )}
                           {isStaff && (
                             <Input 
                               label="Designation" 
                               value={profileData.designation} 
                               readOnly 
                               className="bg-slate-50 opacity-80 cursor-not-allowed"
                               icon={ShieldCheck} 
                             />
                           )}
                           <div className="md:col-span-2">
                              <Input 
                                label="Address" 
                                isTextArea 
                                value={profileData.address} 
                                onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                                icon={MapPin} 
                                placeholder="Residential or street address..."
                              />
                           </div>
                           <Input 
                             label={locationLabel} 
                             value={profileData.primaryBranch} 
                             onChange={(e) => !isStaff && setProfileData(prev => ({ ...prev, primaryBranch: e.target.value }))}
                             readOnly={isStaff}
                             className={cn(isStaff && "bg-slate-50 opacity-80 cursor-not-allowed")}
                             icon={isBorrower ? MapPin : Building2} 
                             placeholder="Branch Location"
                           />
                        </form>

                        <div className="flex gap-4 pt-2 border-t border-slate-50 mt-4">
                          <Button onClick={handleDiscard} variant="ghost" className="flex-1 border border-slate-200 text-slate-600">
                            Discard Changes
                          </Button>
                          <Button onClick={handleSaveProfile} isLoading={saving} className="flex-1">
                            Save Profile Info
                          </Button>
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
                     <form onSubmit={handlePasswordUpdate} className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-soft space-y-10">
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
                              <Input 
                                label="Current Password" 
                                type={showCurrent ? 'text' : 'password'} 
                                value={pwdData.currentPassword}
                                onChange={(e) => setPwdData(prev => ({ ...prev, currentPassword: e.target.value }))}
                                placeholder="••••••••" 
                                icon={Lock} 
                                rightElement={
                                  <button 
                                    type="button" 
                                    onClick={() => setShowCurrent(!showCurrent)}
                                    className="text-slate-400 hover:text-primary transition-colors focus:outline-none"
                                  >
                                    {showCurrent ? <EyeOff size={18} /> : <Eye size={18} /> }
                                  </button>
                                }
                              />
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 <Input 
                                   label="New Password" 
                                   type={showNew ? 'text' : 'password'} 
                                   value={pwdData.newPassword}
                                   onChange={(e) => setPwdData(prev => ({ ...prev, newPassword: e.target.value }))}
                                   placeholder="Min 6 characters" 
                                   icon={Key} 
                                   required
                                   rightElement={
                                     <button 
                                       type="button" 
                                       onClick={() => setShowNew(!showNew)}
                                       className="text-slate-400 hover:text-primary transition-colors focus:outline-none"
                                     >
                                       {showNew ? <EyeOff size={18} /> : <Eye size={18} /> }
                                     </button>
                                   }
                                 />
                                 <Input 
                                   label="Confirm New Password" 
                                   type={showConfirm ? 'text' : 'password'} 
                                   value={pwdData.confirmPassword}
                                   onChange={(e) => setPwdData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                   placeholder="Repeat new password" 
                                   icon={ShieldCheck} 
                                   required
                                   rightElement={
                                     <button 
                                       type="button" 
                                       onClick={() => setShowConfirm(!showConfirm)}
                                       className="text-slate-400 hover:text-primary transition-colors focus:outline-none"
                                     >
                                       {showConfirm ? <EyeOff size={18} /> : <Eye size={18} /> }
                                     </button>
                                   }
                                 />
                              </div>
                           </div>

                           <div className="flex gap-4 pt-4 border-t border-slate-50">
                              <Button 
                                type="button"
                                variant="secondary" 
                                onClick={() => setPwdData({ currentPassword: '', newPassword: '', confirmPassword: '' })} 
                                className="flex-1 border border-slate-200"
                              >
                                Clear Fields
                              </Button>
                              <Button 
                                type="submit" 
                                isLoading={changingPassword} 
                                className="flex-1 shadow-lg shadow-primary/20"
                              >
                                Update Password
                              </Button>
                           </div>
                        </div>
                     </form>
                  </motion.div>
               )}
            </AnimatePresence>
         </div>
      </div>

      {/* SAVE BAR (MOBILE) - ONLY PERSONAL TAB */}
      {activeTab === 'personal' && (
        <div className="lg:hidden fixed bottom-6 left-6 right-6 z-40">
           <Button 
              onClick={handleSaveProfile}
              isLoading={saving}
              className="w-full shadow-2xl shadow-primary/40 py-5 rounded-[1.5rem] flex items-center justify-center gap-3"
           >
              <Save size={20} /> Save All Changes
           </Button>
        </div>
      )}
    </div>
  );
};

// --- HELPER COMPONENTS ---

const ProfileDetail = ({ icon: Icon, label, value }) => (
   <div className="flex items-center gap-4 group">
      <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center transition-all group-hover:bg-primary/5 group-hover:text-primary flex-shrink-0">
         <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{label}</p>
         <p className="text-sm font-bold text-slate-700 truncate" title={value}>{value}</p>
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
