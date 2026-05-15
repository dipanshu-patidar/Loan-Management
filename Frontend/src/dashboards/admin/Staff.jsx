import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Download, Filter, Search, MoreVertical, 
  Eye, Pencil, ShieldCheck, ClipboardCheck, Trash2, CheckCircle2,
  Mail, Phone, MapPin, Building2, Wallet, Briefcase, 
  Calendar, Clock, CheckCircle, FileText, CreditCard, 
  Activity, ShieldAlert, ChevronRight,
  UserCheck, History, ArrowRight, X, Shield, Loader2, Camera, EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { cn } from '../../utils/cn';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../ui/Modal';
import Drawer from '../../ui/Drawer';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import staffService from '../../services/staffService';
import { toast } from 'react-hot-toast';

const Staff = () => {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'add', 'edit', 'permissions', 'export', 'delete', 'suspend', 'activate', 'inactive'
  const [activeDrawer, setActiveDrawer] = useState(null); // 'view'
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [step, setStep] = useState(1);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Filter by Status');
  const [deptFilter, setDeptFilter] = useState('Filter by Department');
  const [exportFormat, setExportFormat] = useState('pdf');
  
  // Form State
  const [formData, setFormData] = useState({
    fullName: '', email: '', phoneNumber: '', idNumber: '', gender: 'Male',
    dateOfBirth: '', physicalAddress: '', password: '', confirmPassword: '',
    department: 'Operations', designation: 'Staff', joiningDate: '',
    reportingManager: '', branchRegion: 'Johannesburg HQ', permissions: []
  });
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, [searchTerm, statusFilter, deptFilter]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const params = {
        search: searchTerm,
        status: statusFilter !== 'Filter by Status' ? statusFilter : undefined,
        department: deptFilter !== 'Filter by Department' ? deptFilter : undefined
      };
      const response = await staffService.getAllStaff(params);
      setStaffList(response.data.data.staff);
    } catch (error) {
      toast.error('Failed to fetch staff records');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (exportFormat === 'pdf') {
      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.setTextColor(46, 58, 116);
      doc.text("Loan Management System", 14, 15);
      
      doc.setFontSize(14);
      doc.setTextColor(100, 100, 100);
      doc.text("Staff Operational Report", 14, 25);
      
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 32);

      const tableColumn = ["Emp ID", "Full Name", "Email", "Department", "Designation", "Status"];
      const tableRows = staffList.map(s => [
        s.employeeId || 'N/A',
        s.fullName,
        s.email,
        s.department,
        s.designation,
        s.status
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        theme: 'grid',
        headStyles: { fillColor: [46, 58, 116], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 3 },
      });

      doc.save(`Staff_Report_${new Date().getTime()}.pdf`);
      toast.success('PDF Report generated successfully!');
    } else if (exportFormat === 'csv') {
      const headers = ["Emp ID,Full Name,Email,Department,Designation,Status\n"];
      const rows = staffList.map(s => 
        `${s.employeeId || 'N/A'},"${s.fullName}",${s.email},${s.department},${s.designation},${s.status}`
      ).join("\n");
      
      const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Staff_Data_${new Date().getTime()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('CSV Data exported successfully!');
    }
    closeModal();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const togglePermission = (perm) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm]
    }));
  };

  const openModal = (type, staff = null) => {
    setSelectedStaff(staff);
    setActiveModal(type);
    setOpenMenuId(null);
    setStep(1);
    setShowPassword(false);
    setShowConfirmPassword(false);
    
    if (type === 'add') {
      setFormData({
        fullName: '', email: '', phoneNumber: '', idNumber: '', gender: 'Male',
        dateOfBirth: '', physicalAddress: '', password: '', confirmPassword: '',
        department: 'Operations', designation: 'Staff', joiningDate: '',
        reportingManager: '', branchRegion: 'Johannesburg HQ', permissions: []
      });
      setProfilePhoto(null);
      setPhotoPreview(null);
    } else if (staff && (type === 'edit' || type === 'permissions')) {
      setFormData({
        ...staff,
        password: '',
        confirmPassword: '',
        dateOfBirth: staff.dateOfBirth ? new Date(staff.dateOfBirth).toISOString().split('T')[0] : '',
        joiningDate: staff.joiningDate ? new Date(staff.joiningDate).toISOString().split('T')[0] : '',
      });
      setPhotoPreview(staff.profilePhoto?.url);
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedStaff(null);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const data = new FormData();
      
      // Handle permissions separately for array format
      formData.permissions.forEach(p => data.append('permissions', p));

      Object.keys(formData).forEach(key => {
        if (key === 'permissions' || key === 'password' || key === 'confirmPassword' || key === 'profilePhoto' || key === 'employeeId') return;
        if (formData[key] !== undefined && formData[key] !== null) {
          data.append(key, formData[key]);
        }
      });

      // Handle Password (only if not empty)
      if (formData.password && formData.password.trim() !== '') {
        if (formData.password !== formData.confirmPassword) {
          return toast.error('Passwords do not match');
        }
        data.append('password', formData.password);
        data.append('confirmPassword', formData.confirmPassword);
      }

      // Handle Photo
      if (profilePhoto) {
        data.append('profilePhoto', profilePhoto);
      } else if (!photoPreview && activeModal === 'edit' && selectedStaff?.profilePhoto?.url) {
        data.append('removePhoto', 'true');
      }

      if (activeModal === 'add') {
        if (!formData.password) return toast.error('Password is required for new staff');
        await staffService.createStaff(data);
        toast.success('Staff onboarded successfully');
      } else {
        await staffService.updateStaff(selectedStaff._id, data);
        toast.success('Staff profile updated');
      }
      fetchStaff();
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAction = async (action) => {
    try {
      setIsSubmitting(true);
      switch(action) {
        case 'activate': await staffService.activateStaff(selectedStaff._id); break;
        case 'inactive': await staffService.markInactive(selectedStaff._id); break;
        case 'suspend': await staffService.suspendStaff(selectedStaff._id); break;
        case 'delete': await staffService.deleteStaff(selectedStaff._id); break;
      }
      toast.success(`Staff ${action}d successfully`);
      fetchStaff();
      closeModal();
    } catch (error) {
      toast.error('Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const savePermissions = async () => {
    try {
      setIsSubmitting(true);
      await staffService.updatePermissions(selectedStaff._id, formData.permissions);
      toast.success('Permissions updated');
      fetchStaff();
      closeModal();
    } catch (error) {
      toast.error('Failed to update permissions');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-10" onClick={() => setOpenMenuId(null)}>
      {/* 1. PAGE HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Staff</h1>
          <p className="text-slate-500 font-medium mt-1">Manage operational staff, roles, verification assignments, and workloads.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="secondary" onClick={() => openModal('export')} className="flex items-center gap-2 font-bold px-6">
             <Download size={18} /> Export
           </Button>
           <Button onClick={() => openModal('add')} className="flex items-center gap-2 font-bold px-6 shadow-lg shadow-primary/20">
             <UserPlus size={18} /> Add Staff
           </Button>
        </div>
      </header>

      {/* 2. ANALYTICS CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Staff" value={staffList.length} icon={Users} color="navy" />
        <StatCard title="Active Staff" value={staffList.filter(s => s.status === 'Active').length} icon={UserCheck} color="blue" />
        <StatCard title="Departments" value={new Set(staffList.map(s => s.department)).size} icon={Building2} color="navy" />
        <StatCard title="Permissions Active" value={staffList.reduce((acc, s) => acc + (s.permissions?.length || 0), 0)} icon={ShieldCheck} color="blue" />
      </section>

      {/* 3. SEARCH & FILTER SECTION */}
      <section className="bg-white p-4 rounded-3xl border border-slate-100 shadow-soft flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
           <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
           <input 
              type="text" 
              placeholder="Search staff by name, email or ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/10 transition-all"
           />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
           <select 
             value={deptFilter}
             onChange={(e) => setDeptFilter(e.target.value)}
             className="flex-1 md:flex-none bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold text-slate-600 focus:ring-0"
           >
              <option>Filter by Department</option>
              <option>Operations</option>
              <option>Verification</option>
              <option>Collections</option>
              <option>Legal</option>
           </select>
           <select 
             value={statusFilter}
             onChange={(e) => setStatusFilter(e.target.value)}
             className="flex-1 md:flex-none bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold text-slate-600 focus:ring-0"
           >
              <option>Filter by Status</option>
              <option>Active</option>
              <option>Inactive</option>
              <option>Suspended</option>
           </select>
        </div>
      </section>

      {/* 4. STAFF TABLE */}
      <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-soft overflow-visible">
        <div className="overflow-visible">
           {loading ? (
             <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading Staff Records...</p>
             </div>
           ) : (
             <table className="w-full">
               <thead>
                  <tr className="text-left border-b border-slate-50 bg-slate-50/50">
                     <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Staff Member</th>
                     <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee ID</th>
                     <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</th>
                     <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Permissions</th>
                     <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                     <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Last Login</th>
                     <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {staffList.map((staff) => (
                     <tr key={staff._id} className="group hover:bg-slate-50/50 transition-all">
                        <td className="px-8 py-5">
                           <div className="flex items-center gap-4">
                              {staff.profilePhoto?.url ? (
                                <img src={staff.profilePhoto.url} className="w-11 h-11 rounded-2xl object-cover border border-slate-100 shadow-sm" alt="" />
                              ) : (
                                <div className="w-11 h-11 rounded-2xl bg-primary/5 text-primary flex items-center justify-center font-black text-sm border border-primary/10">
                                   {staff.fullName.charAt(0)}
                                </div>
                              )}
                              <div>
                                 <p className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{staff.fullName}</p>
                                 <p className="text-[11px] text-slate-400 font-bold uppercase">{staff.email}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-5">
                           <span className="text-[11px] font-black text-slate-600 bg-slate-100 px-3 py-1 rounded-lg uppercase tracking-tight">
                              {staff.employeeId}
                           </span>
                        </td>
                        <td className="px-6 py-5">
                           <div>
                              <p className="text-xs font-bold text-slate-700">{staff.department}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase">{staff.designation}</p>
                           </div>
                        </td>
                        <td className="px-6 py-5 text-center font-black text-primary">
                           {staff.permissions?.length || 0}
                        </td>
                        <td className="px-6 py-5 text-center">
                           <StatusBadge status={staff.status} />
                        </td>
                        <td className="px-6 py-5 text-center">
                           <p className="text-[11px] font-bold text-slate-600">
                             {staff.lastLogin ? new Date(staff.lastLogin).toLocaleDateString() : 'Never'}
                           </p>
                        </td>
                        <td className="px-8 py-5">
                           <div className="flex items-center justify-end gap-2">
                              <TableAction icon={Eye} color="text-blue-500 hover:bg-blue-50" onClick={() => setActiveDrawer('view') || setSelectedStaff(staff)} tooltip="View Staff" />
                              <TableAction icon={Pencil} color="text-primary hover:bg-primary/5" onClick={() => openModal('edit', staff)} tooltip="Edit Staff" />
                              <TableAction icon={Trash2} color="text-rose-500 hover:bg-rose-50" onClick={() => openModal('delete', staff)} tooltip="Delete Staff" />
                              
                              <div className="relative" onClick={(e) => e.stopPropagation()}>
                                 <button 
                                    onClick={() => setOpenMenuId(openMenuId === staff._id ? null : staff._id)}
                                    className={cn(
                                       "p-2 rounded-xl transition-all",
                                       openMenuId === staff._id ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                                    )}
                                 >
                                    <MoreVertical size={18} />
                                 </button>

                                 <AnimatePresence>
                                    {openMenuId === staff._id && (
                                       <motion.div 
                                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                          animate={{ opacity: 1, scale: 1, y: 0 }}
                                          exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                          className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50"
                                       >
                                          <DropdownItem 
                                             icon={ShieldCheck} 
                                             label="Permissions" 
                                             onClick={() => openModal('permissions', staff)} 
                                          />
                                          
                                          {/* Activate Staff - Shown for Inactive & Suspended */}
                                          {staff.status !== 'Active' && (
                                            <DropdownItem 
                                               icon={CheckCircle2} 
                                               label="Activate Staff" 
                                               color="text-emerald-600 hover:bg-emerald-50"
                                               onClick={() => openModal('activate', staff)} 
                                            />
                                          )}

                                          {/* Mark Inactive - Only for Active */}
                                          {staff.status === 'Active' && (
                                            <DropdownItem 
                                               icon={EyeOff} 
                                               label="Mark Inactive" 
                                               color="text-amber-600 hover:bg-amber-50"
                                               onClick={() => openModal('inactive', staff)} 
                                            />
                                          )}

                                          {/* Suspend Staff - For Active & Inactive */}
                                          {staff.status !== 'Suspended' && (
                                            <DropdownItem 
                                               icon={ShieldAlert} 
                                               label="Suspend Staff" 
                                               color="text-rose-600 hover:bg-rose-50"
                                               onClick={() => openModal('suspend', staff)} 
                                            />
                                          )}
                                       </motion.div>
                                    )}
                                 </AnimatePresence>
                              </div>
                           </div>
                        </td>
                     </tr>
                  ))}
               </tbody>
             </table>
           )}
        </div>
      </section>

      {/* --- MODALS & DRAWERS --- */}

      {/* ADD / EDIT STAFF MODAL */}
      <Modal 
        isOpen={activeModal === 'add' || activeModal === 'edit'} 
        onClose={closeModal} 
        title={activeModal === 'add' ? `Add Staff - Step ${step} of 4` : `Edit Staff Profile - Step ${step} of 4`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-8">
           <div className="flex gap-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              {[1, 2, 3, 4].map(s => (
                 <div key={s} className={cn("h-full flex-1 transition-all duration-500", step >= s ? "bg-primary" : "bg-slate-200")} />
              ))}
           </div>

           <div className="min-h-[350px]">
              {step === 1 && (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="flex items-center gap-6 mb-8">
                       <div className="relative group">
                          <div className="w-24 h-24 rounded-3xl bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-primary">
                             {photoPreview ? (
                                <img src={photoPreview} alt="" className="w-full h-full object-cover" />
                             ) : (
                                <Camera size={32} className="text-slate-300 group-hover:text-primary transition-colors" />
                             )}
                          </div>
                          <input type="file" onChange={handlePhotoChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                          <div className="absolute -right-2 -bottom-2 w-8 h-8 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg pointer-events-none">
                             <Pencil size={14} />
                          </div>
                          {photoPreview && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); setProfilePhoto(null); setPhotoPreview(null); }}
                              className="absolute -left-2 -top-2 w-7 h-7 bg-rose-500 text-white rounded-xl flex items-center justify-center shadow-lg"
                            >
                              <X size={14} />
                            </button>
                          )}
                       </div>
                       <div>
                          <h4 className="text-lg font-black text-slate-900 tracking-tight">Personal Details</h4>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Basic identification & contact</p>
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                       <Input name="fullName" label="Full Name" value={formData.fullName} onChange={handleInputChange} placeholder="e.g. Samuel Jackson" />
                       <Input name="email" label="Email Address" type="email" value={formData.email} onChange={handleInputChange} placeholder="sam@point47.com" />
                       <Input name="phoneNumber" label="Phone Number" value={formData.phoneNumber} onChange={handleInputChange} placeholder="Enter phone number" />
                       <Input name="idNumber" label="ID Number" value={formData.idNumber} onChange={handleInputChange} placeholder="Enter ID / Passport Number" />
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Gender</label>
                          <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold">
                             <option>Male</option>
                             <option>Female</option>
                             <option>Other</option>
                          </select>
                       </div>
                       <Input name="dateOfBirth" label="Date of Birth" type="date" value={formData.dateOfBirth} onChange={handleInputChange} />
                    </div>
                    <Input name="physicalAddress" label="Residential Address" value={formData.physicalAddress} onChange={handleInputChange} isTextArea placeholder="Street, City, Province, Code" />
                 </motion.div>
              )}

              {step === 2 && (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <h4 className="text-lg font-black text-slate-900 tracking-tight">Employment Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Employee ID</label>
                          <div className="w-full bg-slate-100 text-slate-500 border-none rounded-xl px-4 py-3 text-sm font-black uppercase">
                            {formData.employeeId || 'STF-XXXX'}
                          </div>
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Branch / Region</label>
                          <select name="branchRegion" value={formData.branchRegion} onChange={handleInputChange} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold">
                             <option>Johannesburg HQ</option>
                             <option>Cape Town Office</option>
                             <option>Durban Branch</option>
                          </select>
                       </div>
                       <Input name="joiningDate" label="Joining Date" type="date" value={formData.joiningDate} onChange={handleInputChange} />
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Department</label>
                          <select name="department" value={formData.department} onChange={handleInputChange} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold">
                             <option>Operations</option>
                             <option>Verification</option>
                             <option>Collections</option>
                             <option>Legal</option>
                          </select>
                       </div>
                       <Input name="designation" label="Designation" value={formData.designation} onChange={handleInputChange} placeholder="e.g. Senior Reviewer" />
                       <Input name="reportingManager" label="Reporting Manager" value={formData.reportingManager} onChange={handleInputChange} placeholder="Manager Name" />
                    </div>
                 </motion.div>
              )}

              {step === 3 && (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <h4 className="text-lg font-black text-slate-900 tracking-tight">Role & Status</h4>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Account Status</label>
                          <select name="status" value={formData.status || 'Active'} onChange={handleInputChange} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold">
                             <option>Active</option>
                             <option>Inactive</option>
                             <option>Suspended</option>
                          </select>
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Staff Role</label>
                          <div className="w-full bg-slate-100 text-slate-500 border-none rounded-xl px-4 py-3 text-sm font-black uppercase">
                            Staff
                          </div>
                       </div>
                    </div>
                    <div className="space-y-4 pt-4">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Access Permissions</label>
                       <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                          {[
                            'Review Loan Applications', 'Verify Documents', 'Verify Payments', 
                            'View Borrowers', 'Add Notes', 'Recommend Approval', 'Reject Applications'
                          ].map(perm => (
                            <Checkbox key={perm} label={perm} checked={formData.permissions.includes(perm)} onChange={() => togglePermission(perm)} />
                          ))}
                       </div>
                    </div>
                 </motion.div>
              )}

              {step === 4 && (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <h4 className="text-lg font-black text-slate-900 tracking-tight">Security Update & Review</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="relative">
                           <Input 
                              name="password" 
                              label="New Password (Optional)" 
                              type={showPassword ? "text" : "password"} 
                              value={formData.password} 
                              onChange={handleInputChange} 
                              placeholder="Leave empty to keep current" 
                           />
                           <button 
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-[38px] text-slate-400 hover:text-primary transition-colors"
                           >
                              {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                           </button>
                        </div>
                        <div className="relative">
                           <Input 
                              name="confirmPassword" 
                              label="Confirm New Password" 
                              type={showConfirmPassword ? "text" : "password"} 
                              value={formData.confirmPassword} 
                              onChange={handleInputChange} 
                              placeholder="••••••••" 
                           />
                           <button 
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-4 top-[38px] text-slate-400 hover:text-primary transition-colors"
                           >
                              {showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                           </button>
                        </div>
                    </div>
                    
                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4">
                       <ReviewRow label="Full Name" value={formData.fullName} />
                       <ReviewRow label="Email" value={formData.email} />
                       <ReviewRow label="Department" value={formData.department} />
                       <ReviewRow label="Designation" value={formData.designation} />
                       <ReviewRow label="Status" value={formData.status || 'Active'} />
                       <ReviewRow label="Permissions" value={`${formData.permissions.length} Assigned`} />
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-700 flex items-center gap-3">
                       <CheckCircle2 size={20} />
                       <p className="text-[11px] font-bold uppercase tracking-tight">
                         {activeModal === 'add' ? 'Ready to onboard staff.' : 'Ready to save changes.'} 
                         Credentials will be active immediately.
                       </p>
                    </div>
                 </motion.div>
              )}
           </div>

           <div className="flex gap-4 pt-6 border-t border-slate-50">
              {step > 1 && <Button variant="ghost" onClick={() => setStep(step - 1)} className="flex-1">Previous</Button>}
              <Button 
                onClick={() => step < 4 ? setStep(step + 1) : handleSubmit()} 
                disabled={isSubmitting}
                className="flex-1 py-4 font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20"
              >
                 {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (step === 4 ? (activeModal === 'add' ? "Finalize Onboarding" : "Save Changes") : "Next Step")}
              </Button>
           </div>
        </div>
      </Modal>

      {/* PERMISSIONS MODAL */}
      <Modal isOpen={activeModal === 'permissions'} onClose={closeModal} title="Manage Permissions" maxWidth="max-w-md">
         <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
               <div className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center font-black">
                 {selectedStaff?.fullName?.charAt(0)}
               </div>
               <div>
                  <p className="text-sm font-black text-slate-900">{selectedStaff?.fullName}</p>
                  <p className="text-xs text-slate-400 font-bold uppercase">{selectedStaff?.designation}</p>
               </div>
            </div>
            <div className="grid grid-cols-1 gap-4 p-4 bg-white border border-slate-100 rounded-2xl">
              {[
                'Review Loan Applications', 'Verify Documents', 'Verify Payments', 
                'View Borrowers', 'Add Notes', 'Recommend Approval', 'Reject Applications'
              ].map(perm => (
                <Checkbox key={perm} label={perm} checked={formData.permissions.includes(perm)} onChange={() => togglePermission(perm)} />
              ))}
            </div>
            <div className="flex gap-3 pt-2">
               <Button variant="ghost" onClick={closeModal} className="flex-1">Cancel</Button>
               <Button onClick={savePermissions} disabled={isSubmitting} className="flex-1 shadow-lg shadow-primary/20">
                 {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Save Changes"}
               </Button>
            </div>
         </div>
      </Modal>

      {/* EXPORT MODAL */}
      <Modal isOpen={activeModal === 'export'} onClose={closeModal} title="Export Staff Data" maxWidth="max-w-md">
         <div className="space-y-6">
            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-center gap-4">
               <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm">
                  <Download size={24} />
               </div>
               <div>
                  <p className="text-sm font-black text-slate-900">Download Staff Report</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select your preferred file format</p>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <button 
                  onClick={() => setExportFormat('pdf')}
                  className={cn(
                     "p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3",
                     exportFormat === 'pdf' ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" : "border-slate-100 bg-white hover:border-slate-200"
                  )}
               >
                  <FileText className={cn("w-8 h-8", exportFormat === 'pdf' ? "text-primary" : "text-slate-300")} />
                  <p className={cn("text-[10px] font-black uppercase tracking-widest", exportFormat === 'pdf' ? "text-primary" : "text-slate-400")}>PDF Report</p>
               </button>

               <button 
                  onClick={() => setExportFormat('csv')}
                  className={cn(
                     "p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3",
                     exportFormat === 'csv' ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" : "border-slate-100 bg-white hover:border-slate-200"
                  )}
               >
                  <Activity className={cn("w-8 h-8", exportFormat === 'csv' ? "text-primary" : "text-slate-300")} />
                  <p className={cn("text-[10px] font-black uppercase tracking-widest", exportFormat === 'csv' ? "text-primary" : "text-slate-400")}>CSV Data</p>
               </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl space-y-2">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] text-center">Export includes:</p>
               <p className="text-[10px] font-bold text-slate-600 text-center">Full filtered list ({staffList.length} staff records) with all operational details.</p>
            </div>

            <div className="flex gap-4 pt-2">
               <Button variant="ghost" onClick={closeModal} className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest">Cancel</Button>
               <Button onClick={handleExport} className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20">
                  Generate Export
               </Button>
            </div>
         </div>
      </Modal>

      {/* ACTION CONFIRMATION MODALS (SUSPEND, ACTIVATE, INACTIVE, DELETE) */}
      <Modal isOpen={['suspend', 'activate', 'inactive', 'delete'].includes(activeModal)} onClose={closeModal} title="Confirm Action" maxWidth="max-w-md">
         <div className="space-y-6 text-center">
            <div className={cn(
              "w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 border shadow-sm",
              activeModal === 'delete' || activeModal === 'suspend' ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-primary/5 text-primary border-primary/10"
            )}>
               {activeModal === 'delete' ? <Trash2 size={28} /> : (activeModal === 'suspend' ? <ShieldAlert size={28} /> : <CheckCircle2 size={28} />)}
            </div>
             <div>
                <h4 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                  {activeModal === 'inactive' ? 'Mark Inactive?' : (activeModal === 'suspend' ? 'Suspend Staff?' : (activeModal === 'activate' ? 'Activate Staff?' : 'Delete Staff?'))}
                </h4>
                <p className="text-sm text-slate-500 mt-2">
                  {activeModal === 'inactive' && <>Mark <span className="font-bold text-slate-900">{selectedStaff?.fullName}</span> as inactive? Operational actions will be restricted.</>}
                  {activeModal === 'suspend' && <>Suspend <span className="font-bold text-slate-900">{selectedStaff?.fullName}</span>? Login access will be completely blocked.</>}
                  {activeModal === 'activate' && <>Activate <span className="font-bold text-slate-900">{selectedStaff?.fullName}</span>? Full operational access will be restored.</>}
                  {activeModal === 'delete' && <>Delete <span className="font-bold text-slate-900">{selectedStaff?.fullName}</span>? This action cannot be undone.</>}
                </p>
             </div>
            <div className="flex gap-3 pt-2">
               <Button variant="ghost" onClick={closeModal} disabled={isSubmitting} className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest">Cancel</Button>
               <Button 
                 variant={activeModal === 'delete' || activeModal === 'suspend' ? 'danger' : 'primary'} 
                 onClick={() => handleAction(activeModal)} 
                 disabled={isSubmitting} 
                 className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest shadow-lg"
               >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : `Confirm ${activeModal}`}
               </Button>
            </div>
         </div>
      </Modal>

      {/* VIEW DRAWER */}
      <Drawer 
         isOpen={activeDrawer === 'view'} 
         onClose={() => setActiveDrawer(null)} 
         title="Staff Profile"
         width="max-w-2xl"
      >
         {selectedStaff && (
            <div className="space-y-10">
               <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                  {selectedStaff.profilePhoto?.url ? (
                    <img src={selectedStaff.profilePhoto.url} className="w-20 h-20 rounded-3xl object-cover shadow-lg border-2 border-white" alt="" />
                  ) : (
                    <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center text-white text-3xl font-black shadow-lg">
                       {selectedStaff.fullName.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1">
                     <h2 className="text-2xl font-black text-slate-900 tracking-tight">{selectedStaff.fullName}</h2>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{selectedStaff.employeeId} • {selectedStaff.designation}</p>
                     <div className="flex items-center gap-2 mt-4">
                        <StatusBadge status={selectedStaff.status} />
                        <span className="text-[10px] font-black text-slate-500 bg-white border border-slate-100 px-3 py-1 rounded-lg uppercase">{selectedStaff.department}</span>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-5">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2"><UserCheck size={14} className="text-primary" /> Personal Details</h4>
                    <div className="space-y-3 bg-slate-50 p-5 rounded-3xl border border-slate-100">
                      <DetailRow label="Phone" value={selectedStaff.phoneNumber} />
                      <DetailRow label="Email" value={selectedStaff.email} />
                      <DetailRow label="ID Number" value={selectedStaff.idNumber} />
                      <DetailRow label="DOB" value={new Date(selectedStaff.dateOfBirth).toLocaleDateString()} />
                      <DetailRow label="Gender" value={selectedStaff.gender} />
                    </div>
                  </div>
                  <div className="space-y-5">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2"><Briefcase size={14} className="text-primary" /> Employment</h4>
                    <div className="space-y-3 bg-slate-50 p-5 rounded-3xl border border-slate-100">
                      <DetailRow label="Joined" value={new Date(selectedStaff.joiningDate).toLocaleDateString()} />
                      <DetailRow label="Manager" value={selectedStaff.reportingManager} />
                      <DetailRow label="Region" value={selectedStaff.branchRegion} />
                      <DetailRow label="Last Login" value={selectedStaff.lastLogin ? new Date(selectedStaff.lastLogin).toLocaleString() : 'Never'} />
                    </div>
                  </div>
               </div>

               <div className="space-y-5">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2"><ShieldCheck size={14} className="text-primary" /> Assigned Permissions</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedStaff.permissions?.map(perm => (
                      <span key={perm} className="text-[10px] font-black text-primary bg-primary/5 border border-primary/10 px-3 py-1.5 rounded-xl uppercase">{perm}</span>
                    ))}
                    {(!selectedStaff.permissions || selectedStaff.permissions.length === 0) && <p className="text-xs text-slate-400 font-medium italic">No specific permissions assigned.</p>}
                  </div>
               </div>

               <div className="pt-6 border-t border-slate-50 flex gap-4">
                  <Button variant="ghost" className="flex-1" onClick={() => setActiveDrawer(null)}>Close Profile</Button>
                  <Button onClick={() => openModal('edit', selectedStaff)} className="flex-1 shadow-lg shadow-primary/20">Edit Details</Button>
               </div>
            </div>
         )}
      </Drawer>
    </div>
  );
};

// --- HELPER COMPONENTS ---

const TableAction = ({ icon: Icon, color, onClick, tooltip }) => (
  <button 
     onClick={onClick}
     className={cn("p-2 rounded-xl transition-all", color)}
     title={tooltip}
  >
     <Icon size={18} />
  </button>
);

const DropdownItem = ({ icon: Icon, label, onClick, color }) => (
   <button 
      onClick={(e) => {
         e.stopPropagation();
         onClick();
      }}
      className={cn(
         "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all",
         color || "text-slate-600 hover:bg-slate-50 hover:text-primary"
      )}
   >
      <Icon size={16} />
      {label}
   </button>
);

const ReviewRow = ({ label, value }) => (
  <div className="flex items-center justify-between py-1">
     <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
     <span className="text-sm font-black text-slate-900">{value}</span>
  </div>
);

const DetailRow = ({ label, value }) => (
  <div className="flex flex-col gap-0.5">
     <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
     <span className="text-xs font-bold text-slate-800">{value || 'N/A'}</span>
  </div>
);

const ExportCard = ({ label, icon: Icon }) => (
  <button className="flex flex-col items-center justify-center p-5 bg-slate-50 border border-slate-100 rounded-2xl hover:border-primary hover:bg-primary/5 transition-all group">
     <Icon size={24} className="text-slate-400 group-hover:text-primary mb-3" />
     <span className="text-[10px] font-black text-slate-500 group-hover:text-primary uppercase tracking-widest">{label}</span>
  </button>
);

const Checkbox = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-3 group cursor-pointer" onClick={onChange}>
    <div className={cn(
      "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
      checked ? "border-primary bg-primary/10" : "border-slate-200 group-hover:border-primary"
    )}>
      {checked && <div className="w-2.5 h-2.5 bg-primary rounded-sm" />}
    </div>
    <span className={cn("text-xs transition-colors", checked ? "font-bold text-slate-900" : "font-medium text-slate-600 group-hover:text-slate-900")}>{label}</span>
  </label>
);

export default Staff;
