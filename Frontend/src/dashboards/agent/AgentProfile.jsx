import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { 
  User, Mail, Phone, MapPin, Briefcase, Calendar, 
  Shield, Key, Upload, Camera, Building, BadgeCheck,
  Eye, EyeOff, Loader2, Save, X
} from 'lucide-react';
import agentProfileService from '../../services/agentProfileService';
import Button from '../../ui/Button';

// Reusable Status Badge Component
const StatusBadge = ({ status }) => {
  const getColors = () => {
    switch (status) {
      case 'Active': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'Suspended': return 'bg-rose-50 text-rose-600 border-rose-200';
      case 'Inactive': return 'bg-slate-50 text-slate-600 border-slate-200';
      default: return 'bg-blue-50 text-blue-600 border-blue-200';
    }
  };
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getColors()}`}>
      {status || 'Unknown'}
    </span>
  );
};

const AgentProfile = () => {
  const [profileData, setProfileData] = useState(null);
  const [activityData, setActivityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  // Forms
  const { register: registerPersonal, handleSubmit: handleSubmitPersonal, reset: resetPersonal, formState: { errors: errorsPersonal } } = useForm();
  const { register: registerPassword, handleSubmit: handleSubmitPassword, reset: resetPassword, formState: { errors: errorsPassword }, watch } = useForm();

  // Password visibility
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const newPassword = watch('newPassword');

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const [profileRes, activityRes] = await Promise.all([
        agentProfileService.getProfile(),
        agentProfileService.getProfileActivity()
      ]);
      
      const pData = profileRes.data.data;
      setProfileData(pData);
      setActivityData(activityRes.data.data);
      
      // Initialize form with fetched data
      resetPersonal({
        fullName: pData.fullName,
        phone: pData.phone,
        dateOfBirth: pData.dateOfBirth ? pData.dateOfBirth.split('T')[0] : '',
        address: pData.address,
        email: pData.email,
        branch: pData.branch
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const onPersonalSubmit = async (data) => {
    try {
      setSavingPersonal(true);
      const updateData = {
        fullName: data.fullName,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth,
        address: data.address
      };
      
      const res = await agentProfileService.updateProfile(updateData);
      toast.success(res.data.message || 'Profile updated successfully');
      setProfileData(prev => ({ ...prev, ...updateData }));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingPersonal(false);
    }
  };

  const onPasswordSubmit = async (data) => {
    try {
      setSavingPassword(true);
      const payload = {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword
      };
      const res = await agentProfileService.changePassword(payload);
      toast.success(res.data.message || 'Password updated successfully');
      resetPassword();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return toast.error('Image size must be less than 5MB');
    }

    const formData = new FormData();
    formData.append('profileImage', file);

    try {
      setUploadingImage(true);
      const res = await agentProfileService.uploadProfileImage(formData);
      toast.success('Profile photo updated successfully');
      setProfileData(prev => ({ ...prev, profileImage: res.data.data.profileImage }));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-100px)] flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-primary w-8 h-8 mb-4" />
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading Profile Context...</p>
      </div>
    );
  }

  if (!profileData) return null;

  return (
    <div className="w-[calc(100%+3rem)] pb-10 -mx-6 -mt-6 px-6 pt-6">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">My Profile</h1>
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Manage Personal Information & Security Settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: PROFILE CARD */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium p-8 flex flex-col items-center text-center relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-primary/5 to-primary/10"></div>
            
            {/* Image Upload Area */}
            <div className="relative mt-8 mb-6 z-10">
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl bg-slate-50 flex items-center justify-center overflow-hidden">
                {uploadingImage ? (
                  <Loader2 className="animate-spin text-primary w-8 h-8" />
                ) : profileData.profileImage ? (
                  <img src={profileData.profileImage} alt={profileData.fullName} className="w-full h-full object-cover" />
                ) : (
                  <User size={48} className="text-slate-300" />
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="absolute bottom-0 right-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
              >
                <Camera size={18} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/png, image/jpeg, image/webp" 
                className="hidden" 
              />
            </div>

            <h2 className="text-xl font-black text-slate-900 tracking-tight">{profileData.fullName}</h2>
            <p className="text-xs font-black text-primary uppercase tracking-widest mt-1 mb-4 flex items-center gap-1 justify-center">
              <Briefcase size={12} /> {profileData.designation}
            </p>

            <StatusBadge status={profileData.status} />

            <div className="w-full border-t border-slate-50 mt-8 pt-8 space-y-4 text-left">
              <div className="flex items-center gap-4 text-sm">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                  <Mail size={16} className="text-slate-400" />
                </div>
                <div className="truncate">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</p>
                  <p className="font-bold text-slate-700 truncate">{profileData.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                  <Building size={16} className="text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned Branch</p>
                  <p className="font-bold text-slate-700">{profileData.branch}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                  <BadgeCheck size={16} className="text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Agent ID</p>
                  <p className="font-bold text-slate-700">{profileData.employeeId || profileData.id}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Summary */}
          {activityData && (
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-premium p-6 space-y-4">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Calendar size={14} className="text-primary" /> Profile Activity
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-black text-slate-400 uppercase tracking-widest">Account Created</span>
                  <span className="font-bold text-slate-700">{new Date(activityData.accountCreatedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-black text-slate-400 uppercase tracking-widest">Last Updated</span>
                  <span className="font-bold text-slate-700">{new Date(activityData.profileUpdatedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-black text-slate-400 uppercase tracking-widest">Last Login</span>
                  <span className="font-bold text-slate-700">{new Date(activityData.lastLogin).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: FORMS */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* PERSONAL INFORMATION FORM */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden">
            <div className="p-8 border-b border-slate-50">
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <User size={20} className="text-primary" /> Personal Information
              </h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Update your basic details</p>
            </div>
            <form onSubmit={handleSubmitPersonal(onPersonalSubmit)} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" 
                    {...registerPersonal('fullName', { required: 'Full name is required' })}
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/10 transition-all shadow-inner"
                  />
                  {errorsPersonal.fullName && <p className="text-[10px] font-bold text-rose-500">{errorsPersonal.fullName.message}</p>}
                </div>
                
                <div className="space-y-2 opacity-60">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address (Read-Only)</label>
                  <input 
                    type="email" 
                    {...registerPersonal('email')}
                    readOnly
                    className="w-full bg-slate-100 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-500 cursor-not-allowed outline-none shadow-inner"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" 
                    {...registerPersonal('phone', { required: 'Phone is required' })}
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/10 transition-all shadow-inner"
                  />
                  {errorsPersonal.phone && <p className="text-[10px] font-bold text-rose-500">{errorsPersonal.phone.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date of Birth</label>
                  <input 
                    type="date" 
                    {...registerPersonal('dateOfBirth')}
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/10 transition-all shadow-inner"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Physical Address</label>
                  <textarea 
                    {...registerPersonal('address')}
                    rows={3}
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/10 transition-all shadow-inner resize-none"
                  />
                </div>

                <div className="space-y-2 md:col-span-2 opacity-60">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned Branch (Read-Only)</label>
                  <input 
                    type="text" 
                    {...registerPersonal('branch')}
                    readOnly
                    className="w-full bg-slate-100 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-500 cursor-not-allowed outline-none shadow-inner"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-50 flex items-center justify-end gap-4">
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={() => {
                    resetPersonal({
                      fullName: profileData.fullName,
                      phone: profileData.phone,
                      dateOfBirth: profileData.dateOfBirth ? profileData.dateOfBirth.split('T')[0] : '',
                      address: profileData.address,
                      email: profileData.email,
                      branch: profileData.branch
                    });
                  }}
                  className="font-black uppercase text-[10px] tracking-widest py-3.5 px-6"
                >
                  Discard Changes
                </Button>
                <Button 
                  type="submit" 
                  disabled={savingPersonal}
                  className="font-black uppercase text-[10px] tracking-widest py-3.5 px-8 flex items-center gap-2 shadow-lg shadow-primary/20"
                >
                  {savingPersonal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />} 
                  Save Profile Info
                </Button>
              </div>
            </form>
          </div>

          {/* SECURITY SETTINGS FORM */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden">
            <div className="p-8 border-b border-slate-50">
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Shield size={20} className="text-primary" /> Security Settings
              </h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Update your password</p>
            </div>
            <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="p-8 space-y-6">
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Password (Optional)</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Key size={16} /></div>
                  <input 
                    type={showCurrentPassword ? 'text' : 'password'} 
                    {...registerPassword('currentPassword')}
                    className="w-full bg-slate-50 border-none rounded-2xl pl-11 pr-12 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/10 transition-all shadow-inner"
                    placeholder="Enter current password"
                  />
                  <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors">
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-50">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New Password <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Shield size={16} /></div>
                    <input 
                      type={showNewPassword ? 'text' : 'password'} 
                      {...registerPassword('newPassword', { 
                        required: 'New password is required',
                        minLength: { value: 6, message: 'Minimum 6 characters required' }
                      })}
                      className="w-full bg-slate-50 border-none rounded-2xl pl-11 pr-12 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/10 transition-all shadow-inner"
                      placeholder="Enter new password"
                    />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors">
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errorsPassword.newPassword && <p className="text-[10px] font-bold text-rose-500">{errorsPassword.newPassword.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confirm Password <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Shield size={16} /></div>
                    <input 
                      type={showConfirmPassword ? 'text' : 'password'} 
                      {...registerPassword('confirmPassword', { 
                        required: 'Please confirm password',
                        validate: value => value === newPassword || 'Passwords do not match'
                      })}
                      className="w-full bg-slate-50 border-none rounded-2xl pl-11 pr-12 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/10 transition-all shadow-inner"
                      placeholder="Confirm new password"
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors">
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errorsPassword.confirmPassword && <p className="text-[10px] font-bold text-rose-500">{errorsPassword.confirmPassword.message}</p>}
                </div>
              </div>

              <div className="pt-6 flex items-center justify-end gap-4">
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={() => resetPassword()}
                  className="font-black uppercase text-[10px] tracking-widest py-3.5 px-6"
                >
                  Clear Fields
                </Button>
                <Button 
                  type="submit" 
                  disabled={savingPassword}
                  className="font-black uppercase text-[10px] tracking-widest py-3.5 px-8 flex items-center gap-2 shadow-lg shadow-primary/20"
                >
                  {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key size={16} />} 
                  Update Password
                </Button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AgentProfile;
