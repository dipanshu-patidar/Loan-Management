import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Download, Filter, Search, MoreVertical, 
  Eye, ShieldX, Lock, Pencil, Mail, Phone, MapPin, 
  Building2, Wallet, Briefcase, Calendar, Clock, 
  CheckCircle, FileText, CreditCard, Activity, 
  ChevronRight, ArrowRight, ShieldAlert, CheckCircle2,
  Trash2, X, Upload, Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';
import { cn } from '../../utils/cn';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../ui/Modal';
import Drawer from '../../ui/Drawer';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import borrowerService from '../../services/borrowerService';

const Borrowers = () => {
  const [borrowers, setBorrowers] = useState([]);
  const [stats, setStats] = useState({
    totalBorrowers: 0,
    activeBorrowers: 0,
    blacklistedBorrowers: 0,
    frozenBorrowers: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [activeModal, setActiveModal] = useState(null); // 'add', 'edit', 'freeze', 'blacklist', 'export', 'delete'
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedBorrower, setSelectedBorrower] = useState(null);
  const [step, setStep] = useState(1);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [isDrawerLoading, setIsDrawerLoading] = useState(false);
  const [activityHistory, setActivityHistory] = useState([]);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [statusReason, setStatusReason] = useState('');
  const [exportFormat, setExportFormat] = useState('pdf');

  const [formData, setFormData] = useState({
    fullName: '', idNumber: '', email: '', phoneNumber: '', physicalAddress: '',
    gender: 'Male', dateOfBirth: '',
    employerName: '', occupation: '', employmentStatus: 'Permanent', monthlyNetSalary: '', yearsOfService: '', workAddress: '',
    bankName: '', accountNumber: '', branchCode: '', accountType: 'Savings', accountHolderName: '',
    accountStatus: 'Active', internalNotes: '', assignedAgent: '', assignedStaff: ''
  });
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchBorrowers();
  }, [searchQuery, statusFilter]);

  const fetchBorrowers = async () => {
    setIsLoading(true);
    try {
      const data = await borrowerService.getAllBorrowers({
        search: searchQuery,
        status: statusFilter
      });
      setBorrowers(data.data.borrowers);
      setStats(data.data.stats);
    } catch (error) {
      toast.error('Failed to fetch borrowers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      setProfilePhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== undefined) {
          data.append(key, formData[key]);
        }
      });
      if (profilePhoto) {
        data.append('profilePhoto', profilePhoto);
      }

      if (isEditing) {
        await borrowerService.updateBorrower(selectedBorrower._id, data);
        toast.success('Borrower updated successfully!');
      } else {
        await borrowerService.createBorrower(data);
        toast.success('Borrower created successfully!');
      }
      
      closeModal();
      fetchBorrowers();
    } catch (error) {
      const msg = error.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} borrower`;
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = () => {
    if (exportFormat === 'pdf') {
      const doc = new jsPDF();
      
      // Add Title
      doc.setFontSize(20);
      doc.setTextColor(46, 58, 116);
      doc.text("Loan Management System", 14, 15);
      
      doc.setFontSize(14);
      doc.setTextColor(100, 100, 100);
      doc.text("Borrowers Directory Report", 14, 25);
      
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 32);

      // Prepare Table Data
      const tableColumn = ["ID", "Full Name", "Email", "Phone", "Status", "Joined"];
      const tableRows = borrowers.map(b => [
        b.borrowerCode || 'N/A',
        b.fullName,
        b.email,
        b.phoneNumber,
        b.accountStatus,
        new Date(b.createdAt).toLocaleDateString()
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        theme: 'grid',
        headStyles: { fillColor: [46, 58, 116], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 3 },
      });

      doc.save(`Borrowers_Report_${new Date().getTime()}.pdf`);
      toast.success('PDF Report generated successfully!');
    } else if (exportFormat === 'csv') {
      const headers = ["Borrower Code,Full Name,Email,Phone,Address,Status,Joined\n"];
      const rows = borrowers.map(b => 
        `${b.borrowerCode || 'N/A'},"${b.fullName}",${b.email},${b.phoneNumber},"${b.physicalAddress || ''}",${b.accountStatus},${new Date(b.createdAt).toLocaleDateString()}`
      ).join("\n");
      
      const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Borrowers_Data_${new Date().getTime()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('CSV Data exported successfully!');
    } else {
      toast('Excel export feature coming soon', { icon: '📊' });
    }
    closeModal();
  };

  const openDrawer = async (borrower) => {
    setOpenMenuId(null);
    setIsDrawerOpen(true);
    setIsDrawerLoading(true);
    try {
      const response = await borrowerService.getBorrowerById(borrower._id);
      setSelectedBorrower(response.data.borrower);
      setActivityHistory(response.data.activityHistory || []);
    } catch (error) {
      toast.error('Failed to fetch borrower details');
      setIsDrawerOpen(false);
    } finally {
      setIsDrawerLoading(false);
    }
  };

  const handleEditChange = (field, value) => {
    setSelectedBorrower(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdate = async () => {
    if (!selectedBorrower) return;
    setIsSubmitting(true);
    try {
      const data = new FormData();
      // Fields to include in update
      const fields = [
        'fullName', 'idNumber', 'email', 'phoneNumber', 'physicalAddress',
        'employerName', 'occupation', 'monthlyNetSalary', 'yearsOfService',
        'bankName', 'accountNumber', 'branchCode', 'accountType', 'accountStatus'
      ];
      
      fields.forEach(field => {
        if (selectedBorrower[field] !== undefined) {
          data.append(field, selectedBorrower[field]);
        }
      });

      if (profilePhoto) {
        data.append('profilePhoto', profilePhoto);
      }

      await borrowerService.updateBorrower(selectedBorrower._id, data);
      toast.success('Borrower updated successfully!');
      closeModal();
      fetchBorrowers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update borrower');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedBorrower) return;
    setIsSubmitting(true);
    try {
      await borrowerService.deleteBorrower(selectedBorrower._id);
      toast.success('Borrower deleted successfully!');
      closeModal();
      fetchBorrowers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete borrower');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFreezeAction = async () => {
    if (!selectedBorrower) return;
    setIsSubmitting(true);
    try {
      await borrowerService.freezeBorrower(selectedBorrower._id, { reason: statusReason });
      toast.success('Borrower account frozen successfully!');
      closeModal();
      fetchBorrowers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to freeze account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBlacklistAction = async () => {
    if (!selectedBorrower) return;
    if (!statusReason) {
      toast.error('Please provide a blacklist reason');
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(true);
    try {
      await borrowerService.blacklistBorrower(selectedBorrower._id, { reason: statusReason });
      toast.success('Borrower blacklisted successfully!');
      closeModal();
      fetchBorrowers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to blacklist borrower');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openModal = (type, borrower = null) => {
    setSelectedBorrower(borrower);
    setActiveModal(type);
    setOpenMenuId(null);
    setStep(1);
    setStatusReason('');
    setExportFormat('pdf');
    
    if (type === 'add' || type === 'edit') {
      setIsEditing(type === 'edit');
      if (type === 'edit' && borrower) {
        setFormData({
          fullName: borrower.fullName || '',
          idNumber: borrower.idNumber || '',
          email: borrower.email || '',
          phoneNumber: borrower.phoneNumber || '',
          physicalAddress: borrower.physicalAddress || '',
          gender: borrower.gender || 'Male',
          dateOfBirth: borrower.dateOfBirth ? new Date(borrower.dateOfBirth).toISOString().split('T')[0] : '',
          employerName: borrower.employerName || '',
          occupation: borrower.occupation || '',
          employmentStatus: borrower.employmentStatus || 'Permanent',
          monthlyNetSalary: borrower.monthlyNetSalary || '',
          yearsOfService: borrower.yearsOfService || '',
          workAddress: borrower.workAddress || '',
          bankName: borrower.bankName || '',
          accountNumber: borrower.accountNumber || '',
          branchCode: borrower.branchCode || '',
          accountType: borrower.accountType || 'Savings',
          accountHolderName: borrower.accountHolderName || '',
          accountStatus: borrower.accountStatus || 'Active',
          internalNotes: borrower.internalNotes || '',
          assignedAgent: borrower.assignedAgent || '',
          assignedStaff: borrower.assignedStaff || ''
        });
        setPhotoPreview(borrower.profilePhoto !== 'no-photo.jpg' ? borrower.profilePhoto : null);
      } else {
        setFormData({
          fullName: '', idNumber: '', email: '', phoneNumber: '', physicalAddress: '',
          gender: 'Male', dateOfBirth: '',
          employerName: '', occupation: '', employmentStatus: 'Permanent', monthlyNetSalary: '', yearsOfService: '', workAddress: '',
          bankName: '', accountNumber: '', branchCode: '', accountType: 'Savings', accountHolderName: '',
          accountStatus: 'Active', internalNotes: '', assignedAgent: '', assignedStaff: ''
        });
        setProfilePhoto(null);
        setPhotoPreview(null);
      }
    }
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  return (
    <div className="space-y-8 pb-10" onClick={() => setOpenMenuId(null)}>
      {/* 1. PAGE HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Borrowers</h1>
          <p className="text-slate-500 font-medium mt-1">Manage borrowers, active loans, payment status, and account details.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="secondary" onClick={() => openModal('export')} className="flex items-center gap-2 font-bold px-6">
             <Download size={18} /> Export
           </Button>
           <Button onClick={() => openModal('add')} className="flex items-center gap-2 font-bold px-6 shadow-lg shadow-primary/20">
             <UserPlus size={18} /> Add Borrower
           </Button>
        </div>
      </header>

      {/* 2. ANALYTICS CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Borrowers" value={(stats?.totalBorrowers || 0).toLocaleString()} icon={Users} color="navy" />
        <StatCard title="Active Borrowers" value={(stats?.activeBorrowers || 0).toLocaleString()} icon={CheckCircle} color="blue" />
        <StatCard title="Frozen Accounts" value={(stats?.frozenBorrowers || 0).toLocaleString()} icon={Lock} color="rose" />
        <StatCard title="Blacklisted Borrowers" value={(stats?.blacklistedBorrowers || 0).toLocaleString()} icon={ShieldX} color="rose" />
      </section>

      {/* 3. SEARCH & FILTER SECTION */}
      <section className="bg-white p-4 rounded-3xl border border-slate-100 shadow-soft flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
           <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
           <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search borrower by name, email or phone..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/10 transition-all"
           />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
           <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 md:flex-none bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold text-slate-600 focus:ring-0 cursor-pointer"
           >
              <option value="all">Account Status</option>
              <option value="Active">Active</option>
              <option value="Frozen">Frozen</option>
              <option value="Blacklisted">Blacklisted</option>
           </select>
           <select className="flex-1 md:flex-none bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold text-slate-600 focus:ring-0 cursor-pointer">
              <option>Active Loans</option>
              <option>0 Loans</option>
              <option>1+ Loans</option>
           </select>
        </div>
      </section>

      {/* 4. BORROWERS TABLE */}
      <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
           <table className="w-full text-left">
              <thead>
                 <tr className="border-b border-slate-50 bg-slate-50/50">
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Borrower</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Loans</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Code</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Account</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Created At</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {isLoading ? (
                    <tr>
                       <td colSpan="7" className="px-8 py-12 text-center">
                          <div className="flex flex-col items-center gap-3">
                             <div className="w-10 h-10 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
                             <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading Borrowers...</p>
                          </div>
                       </td>
                    </tr>
                 ) : borrowers.length === 0 ? (
                    <tr>
                       <td colSpan="7" className="px-8 py-12 text-center">
                          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No Borrowers Found</p>
                       </td>
                    </tr>
                 ) : borrowers.map((borrower) => (
                    <tr key={borrower._id} className="group hover:bg-slate-50/50 transition-all cursor-pointer" onClick={() => openDrawer(borrower)}>
                       <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                             {borrower.profilePhoto && borrower.profilePhoto !== 'no-photo.jpg' ? (
                                <img src={borrower.profilePhoto} alt="" className="w-11 h-11 rounded-2xl object-cover border border-slate-100 shadow-sm" />
                             ) : (
                                <div className="w-11 h-11 rounded-2xl bg-primary/5 text-primary flex items-center justify-center font-black text-sm border border-primary/10">
                                   {borrower.fullName ? borrower.fullName.charAt(0) : 'B'}
                                </div>
                             )}
                             <div>
                                <p className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{borrower.fullName}</p>
                                <p className="text-[11px] text-slate-400 font-bold uppercase truncate max-w-[150px]">{borrower.email}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-6 py-5">
                          <p className="text-sm font-bold text-slate-700">{borrower.phoneNumber}</p>
                       </td>
                       <td className="px-6 py-5">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-xs font-black text-slate-600">
                             0
                          </span>
                       </td>
                       <td className="px-6 py-5">
                          <p className="text-xs font-black text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg inline-block uppercase tracking-tighter">
                             {borrower.borrowerCode}
                          </p>
                       </td>
                       <td className="px-6 py-5">
                          <StatusBadge status={borrower.accountStatus} />
                       </td>
                       <td className="px-6 py-5">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">
                             {new Date(borrower.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                       </td>
                       <td className="px-8 py-5" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                             <TableAction icon={Eye} color="text-blue-500 hover:bg-blue-50" onClick={() => openDrawer(borrower)} tooltip="View Details" />
                             <TableAction icon={Pencil} color="text-primary hover:bg-primary/5" onClick={() => openModal('edit', borrower)} tooltip="Edit Profile" />
                             <TableAction icon={Trash2} color="text-rose-500 hover:bg-rose-50" onClick={() => openModal('delete', borrower)} tooltip="Delete Borrower" />
                             
                             <div className="relative">
                                <button 
                                   onClick={() => setOpenMenuId(openMenuId === borrower._id ? null : borrower._id)}
                                   className={cn(
                                      "p-2 rounded-xl transition-all",
                                      openMenuId === borrower._id ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                                   )}
                                >
                                   <MoreVertical size={18} />
                                </button>

                                <AnimatePresence>
                                   {openMenuId === borrower._id && (
                                      <motion.div 
                                         initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                         animate={{ opacity: 1, scale: 1, y: 0 }}
                                         exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                         className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50"
                                      >
                                         <DropdownItem 
                                            icon={Lock} 
                                            label="Freeze Account" 
                                            onClick={() => openModal('freeze', borrower)} 
                                         />
                                         <DropdownItem 
                                            icon={ShieldX} 
                                            label="Blacklist" 
                                            color="text-rose-600 hover:bg-rose-50"
                                            onClick={() => openModal('blacklist', borrower)} 
                                         />
                                         <div className="my-1 border-t border-slate-50" />
                                         <DropdownItem 
                                            icon={Download} 
                                            label="Export Data" 
                                            onClick={() => openModal('export', borrower)} 
                                         />
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
        </div>
      </section>

      {/* --- MODALS & DRAWERS --- */}

      {/* ADD/EDIT BORROWER MODAL */}
      <Modal 
        isOpen={activeModal === 'add' || activeModal === 'edit'} 
        onClose={closeModal} 
        title={`${isEditing ? 'Edit' : 'Add'} Borrower - Step ${step} of 4`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-8">
           {/* Progress Line */}
           <div className="flex gap-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              {[1, 2, 3, 4].map(s => (
                 <div key={s} className={cn("h-full flex-1 transition-all duration-500", step >= s ? "bg-primary" : "bg-slate-200")} />
              ))}
           </div>

           <div className="min-h-[350px]">
              {step === 1 && (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="flex items-center justify-between">
                       <h4 className="text-lg font-black text-slate-900 tracking-tight">Personal Details</h4>
                       <div className="flex items-center gap-2 px-3 py-1 bg-primary/5 rounded-full border border-primary/10">
                          <ImageIcon size={14} className="text-primary" />
                          <span className="text-[10px] font-black text-primary uppercase tracking-widest">Step 1/4</span>
                       </div>
                    </div>

                    {/* Profile Photo Upload */}
                    <div className="flex flex-col items-center gap-4 py-2">
                       <div className="relative group">
                          <div className={cn(
                             "w-28 h-28 rounded-[2rem] bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-primary group-hover:bg-primary/5",
                             photoPreview && "border-solid border-primary"
                          )}>
                             {photoPreview ? (
                                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                             ) : (
                                <Upload size={24} className="text-slate-300 group-hover:text-primary transition-colors" />
                             )}
                          </div>
                          <input 
                             type="file" 
                             id="photo-upload" 
                             className="hidden" 
                             accept="image/*" 
                             onChange={handlePhotoChange} 
                          />
                          <label 
                             htmlFor="photo-upload"
                             className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-2xl shadow-lg border border-slate-100 flex items-center justify-center text-primary cursor-pointer hover:scale-110 active:scale-95 transition-all"
                          >
                             <ImageIcon size={18} />
                          </label>
                       </div>
                       <div className="text-center">
                          <p className="text-xs font-bold text-slate-700">Borrower Profile Photo</p>
                          <p className="text-[10px] text-slate-400 font-medium mt-1">PNG, JPG or WEBP up to 5MB</p>
                       </div>
                    </div>

                     <div className="grid grid-cols-2 gap-4">
                        <Input 
                           label="Full Name" 
                           placeholder="e.g. Sipho Nkosi" 
                           value={formData.fullName}
                           onChange={(e) => handleInputChange('fullName', e.target.value)}
                        />
                        <Input 
                           label="ID Number" 
                           placeholder="8505125432081" 
                           value={formData.idNumber}
                           onChange={(e) => handleInputChange('idNumber', e.target.value)}
                        />
                        <Input 
                           label="Email Address" 
                           placeholder="name@example.com" 
                           value={formData.email}
                           onChange={(e) => handleInputChange('email', e.target.value)}
                        />
                        <Input 
                           label="Phone Number" 
                           placeholder="+27 00 000 0000" 
                           value={formData.phoneNumber}
                           onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                        />
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Gender</label>
                           <select 
                              className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/10"
                              value={formData.gender}
                              onChange={(e) => handleInputChange('gender', e.target.value)}
                           >
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                           </select>
                        </div>
                        <Input 
                           label="Date of Birth" 
                           type="date"
                           value={formData.dateOfBirth}
                           onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                        />
                     </div>
                    <Input 
                       label="Physical Address" 
                       placeholder="Unit, Street, Suburb, City" 
                       isTextArea 
                       value={formData.physicalAddress}
                       onChange={(e) => handleInputChange('physicalAddress', e.target.value)}
                    />
                 </motion.div>
              )}

              {step === 2 && (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <h4 className="text-lg font-black text-slate-900 tracking-tight">Employment Details</h4>
                     <div className="grid grid-cols-2 gap-4">
                        <Input 
                           label="Employer Name" 
                           value={formData.employerName}
                           onChange={(e) => handleInputChange('employerName', e.target.value)}
                        />
                        <Input 
                           label="Occupation" 
                           value={formData.occupation}
                           onChange={(e) => handleInputChange('occupation', e.target.value)}
                        />
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Employment Status</label>
                           <select 
                              className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/10"
                              value={formData.employmentStatus}
                              onChange={(e) => handleInputChange('employmentStatus', e.target.value)}
                           >
                              <option value="Permanent">Permanent</option>
                              <option value="Contract">Contract</option>
                              <option value="Self-Employed">Self-Employed</option>
                              <option value="Unemployed">Unemployed</option>
                           </select>
                        </div>
                        <Input 
                           label="Monthly Net Salary" 
                           placeholder="R" 
                           value={formData.monthlyNetSalary}
                           onChange={(e) => handleInputChange('monthlyNetSalary', e.target.value)}
                        />
                        <Input 
                           label="Years of Service" 
                           value={formData.yearsOfService}
                           onChange={(e) => handleInputChange('yearsOfService', e.target.value)}
                        />
                        <Input 
                           label="Work Address" 
                           value={formData.workAddress}
                           onChange={(e) => handleInputChange('workAddress', e.target.value)}
                        />
                     </div>
                 </motion.div>
              )}

              {step === 3 && (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <h4 className="text-lg font-black text-slate-900 tracking-tight">Banking Information</h4>
                     <div className="grid grid-cols-2 gap-4">
                        <Input 
                           label="Bank Name" 
                           value={formData.bankName}
                           onChange={(e) => handleInputChange('bankName', e.target.value)}
                        />
                        <Input 
                           label="Account Number" 
                           value={formData.accountNumber}
                           onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                        />
                        <Input 
                           label="Account Holder Name" 
                           value={formData.accountHolderName}
                           onChange={(e) => handleInputChange('accountHolderName', e.target.value)}
                        />
                        <Input 
                           label="Branch Code" 
                           value={formData.branchCode}
                           onChange={(e) => handleInputChange('branchCode', e.target.value)}
                        />
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Account Type</label>
                           <select 
                              className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/10"
                              value={formData.accountType}
                              onChange={(e) => handleInputChange('accountType', e.target.value)}
                           >
                              <option value="Savings">Savings</option>
                              <option value="Current">Current</option>
                              <option value="Cheque">Cheque</option>
                           </select>
                        </div>
                     </div>
                 </motion.div>
              )}

              {step === 4 && (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <h4 className="text-lg font-black text-slate-900 tracking-tight">Review & Submit</h4>
                     <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-200">
                           <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center overflow-hidden">
                              {photoPreview ? <img src={photoPreview} className="w-full h-full object-cover" /> : <UserPlus size={20} className="text-slate-300" />}
                           </div>
                           <div>
                              <p className="text-sm font-black text-slate-900 leading-none">{formData.fullName || 'No Name'}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wider">{formData.email || 'No Email'}</p>
                           </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Account Status</label>
                              <select 
                                 className="w-full bg-white border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-primary/10"
                                 value={formData.accountStatus}
                                 onChange={(e) => handleInputChange('accountStatus', e.target.value)}
                              >
                                 <option value="Active">Active</option>
                                 <option value="Frozen">Frozen</option>
                                 <option value="Blacklisted">Blacklisted</option>
                                 <option value="Pending Verification">Pending Verification</option>
                              </select>
                           </div>
                           <Input 
                              label="Internal Notes" 
                              placeholder="Add private notes..."
                              value={formData.internalNotes}
                              onChange={(e) => handleInputChange('internalNotes', e.target.value)}
                           />
                        </div>
                        <ReviewRow label="ID Number" value={formData.idNumber} />
                        <ReviewRow label="Mobile" value={formData.phoneNumber} />
                        <ReviewRow label="Salary" value={`R ${Number(formData.monthlyNetSalary).toLocaleString()}`} />
                        <ReviewRow label="Bank" value={formData.bankName} />
                     </div>
                    <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex gap-3">
                       <ShieldAlert size={20} className="text-primary shrink-0 mt-0.5" />
                       <p className="text-[11px] text-primary/80 font-bold leading-relaxed uppercase">
                          By clicking submit, you confirm that all information provided is accurate and you have borrower consent to conduct credit checks.
                       </p>
                    </div>
                 </motion.div>
              )}
           </div>

           <div className="flex gap-4 pt-6 border-t border-slate-50">
              {step > 1 && (
                 <Button variant="ghost" onClick={() => setStep(step - 1)} className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest" disabled={isSubmitting}>
                    Previous
                 </Button>
              )}
              <Button 
                 onClick={() => step < 4 ? setStep(step + 1) : handleSubmit()} 
                 className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20"
                 disabled={isSubmitting}
              >
                  {isSubmitting ? (
                     <div className="flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        <span>Processing...</span>
                     </div>
                  ) : (
                     step === 4 ? (isEditing ? "Save Changes" : "Submit Borrower") : "Next Step"
                  )}
              </Button>
           </div>
        </div>
      </Modal>


      {/* FREEZE MODAL */}
      <Modal isOpen={activeModal === 'freeze'} onClose={closeModal} title="Freeze Borrower Account" maxWidth="max-w-md">
         <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-amber-100 shadow-sm">
               <Lock size={28} />
            </div>
            <div>
               <h4 className="text-xl font-black text-slate-900 tracking-tight">Freeze Account?</h4>
               <p className="text-sm text-slate-500 mt-2">You are freezing <span className="font-bold text-slate-900">{selectedBorrower?.fullName}</span>'s access. They will be unable to apply for new loans or withdraw funds.</p>
            </div>
            <Input 
               label="Reason for Freeze" 
               placeholder="e.g. Investigation pending, suspicious activity..." 
               isTextArea 
               value={statusReason}
               onChange={(e) => setStatusReason(e.target.value)}
            />
            <div className="flex gap-3 pt-2">
               <Button variant="ghost" onClick={closeModal} className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest" disabled={isSubmitting}>Cancel</Button>
               <Button variant="danger" onClick={handleFreezeAction} className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest bg-amber-600 border-amber-600 shadow-lg shadow-amber-200" disabled={isSubmitting}>
                  {isSubmitting ? 'Processing...' : 'Confirm Freeze'}
               </Button>
            </div>
         </div>
      </Modal>

      {/* BLACKLIST MODAL */}
      <Modal isOpen={activeModal === 'blacklist'} onClose={closeModal} title="Blacklist Borrower" maxWidth="max-w-md">
         <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-sm">
               <ShieldX size={28} />
            </div>
            <div>
               <h4 className="text-xl font-black text-rose-900 tracking-tight uppercase">Confirm Blacklist</h4>
               <p className="text-sm text-slate-500 mt-2">This is a PERMANENT action. This borrower will be globally flagged for fraud or serious default.</p>
            </div>
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 space-y-2 text-left">
               <p className="text-[10px] font-black text-rose-700 uppercase tracking-widest">Borrower Impact</p>
               <ul className="text-xs text-rose-600 list-disc list-inside font-medium space-y-1">
                  <li>Zero future lending eligibility</li>
                  <li>Account permanently disabled</li>
                  <li>Flagged in external bureau reports</li>
               </ul>
            </div>
            <Input 
               label="Blacklist Reason" 
               placeholder="e.g. Fraudulent behavior, repeated defaults..." 
               isTextArea
               value={statusReason}
               onChange={(e) => setStatusReason(e.target.value)}
            />
            <div className="flex gap-3 pt-2">
               <Button variant="ghost" onClick={closeModal} className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest" disabled={isSubmitting}>Cancel</Button>
               <Button variant="danger" onClick={handleBlacklistAction} className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest shadow-lg shadow-rose-200" disabled={isSubmitting}>
                  {isSubmitting ? 'Processing...' : 'Confirm Blacklist'}
               </Button>
            </div>
         </div>
      </Modal>

      {/* EXPORT MODAL */}
      <Modal isOpen={activeModal === 'export'} onClose={closeModal} title="Export Data" maxWidth="max-w-md">
         <div className="space-y-6">
            <p className="text-sm text-slate-500 font-medium">Choose your export format for the current filtered list.</p>
            <div className="grid grid-cols-2 gap-3">
               <ExportCard label="PDF Report" icon={FileText} active={exportFormat === 'pdf'} onClick={() => setExportFormat('pdf')} />
               <ExportCard label="CSV Data" icon={CreditCard} active={exportFormat === 'csv'} onClick={() => setExportFormat('csv')} />
            </div>
            <Button onClick={handleExport} className="w-full py-4 font-black text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20">Download Export</Button>
         </div>
      </Modal>

      {/* DELETE MODAL */}
      <Modal isOpen={activeModal === 'delete'} onClose={closeModal} title="Delete Borrower" maxWidth="max-w-md">
         <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-sm">
               <Trash2 size={28} />
            </div>
            <div>
               <h4 className="text-xl font-black text-slate-900 tracking-tight">Delete Borrower Profile?</h4>
               <p className="text-sm text-slate-500 mt-2">You are permanently deleting <span className="font-bold text-slate-900">{selectedBorrower?.name}</span>'s records. This action cannot be undone.</p>
            </div>
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex gap-3 text-left">
               <ShieldAlert size={20} className="text-rose-600 shrink-0 mt-0.5" />
               <p className="text-[11px] text-rose-600/80 font-bold leading-relaxed uppercase">
                  This action is irreversible. All associated data will be purged from the system.
               </p>
            </div>
            <div className="flex gap-3 pt-2">
               <Button variant="ghost" onClick={closeModal} className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest" disabled={isSubmitting}>Cancel</Button>
               <Button variant="danger" onClick={handleDelete} className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest shadow-lg shadow-rose-200" disabled={isSubmitting}>
                  {isSubmitting ? 'Deleting...' : 'Permanently Delete'}
               </Button>
            </div>
         </div>
      </Modal>

        {/* VIEW DRAWER */}
        <Drawer 
           isOpen={isDrawerOpen} 
           onClose={() => setIsDrawerOpen(false)} 
           title="Borrower Details"
           width="max-w-2xl"
        >
           {isDrawerLoading ? (
              <div className="h-full flex items-center justify-center">
                 <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Loading Profile...</p>
                 </div>
              </div>
           ) : selectedBorrower && (
              <div className="space-y-10">
                 {/* Header Info */}
                 <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                    {selectedBorrower.profilePhoto && selectedBorrower.profilePhoto !== 'no-photo.jpg' ? (
                       <img src={selectedBorrower.profilePhoto} alt="" className="w-20 h-20 rounded-3xl object-cover shadow-lg" />
                    ) : (
                       <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center text-white text-3xl font-black shadow-lg">
                          {selectedBorrower.fullName ? selectedBorrower.fullName.charAt(0) : 'B'}
                       </div>
                    )}
                    <div className="flex-1">
                       <h2 className="text-2xl font-black text-slate-900 tracking-tight">{selectedBorrower.fullName}</h2>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">CODE: {selectedBorrower.borrowerCode}</p>
                       <div className="flex items-center gap-2 mt-4 flex-wrap">
                          <StatusBadge status={selectedBorrower.accountStatus} />
                          <StatusBadge status={selectedBorrower.isBlacklisted ? 'Blacklisted' : 'Active'} />
                       </div>
                    </div>
                 </div>
 
                 {/* Contact & Professional */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-5">
                       <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                          <Phone size={14} className="text-primary" /> Contact Information
                       </h4>
                       <div className="space-y-3 p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                          <ReviewRow label="Email" value={selectedBorrower.email} />
                          <ReviewRow label="Mobile" value={selectedBorrower.phoneNumber} />
                          <ReviewRow label="Address" value={selectedBorrower.physicalAddress || 'Not Provided'} />
                       </div>
                    </div>
                    <div className="space-y-5">
                       <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                          <Building2 size={14} className="text-accent" /> Professional Info
                       </h4>
                       <div className="space-y-3 p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                          <ReviewRow label="Employer" value={selectedBorrower.employerName || 'Not Provided'} />
                          <ReviewRow label="Occupation" value={selectedBorrower.occupation || 'Not Provided'} />
                          <ReviewRow label="Salary" value={selectedBorrower.monthlyNetSalary ? `R ${selectedBorrower.monthlyNetSalary.toLocaleString()}` : 'Not Provided'} />
                          <ReviewRow label="Status" value={selectedBorrower.employmentStatus || 'Not Provided'} />
                       </div>
                    </div>
                 </div>
 
                {/* RECENT LOANS & PAYMENTS HISTORY */}
                <div className="space-y-6">
                   <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Borrower Activity History</h4>
                   <div className="space-y-4">
                      {activityHistory.length > 0 ? activityHistory.map((item, idx) => (
                         <HistoryItem 
                            key={idx}
                            icon={item.iconType === 'FileText' ? FileText : item.iconType === 'Wallet' ? Wallet : CheckCircle} 
                            title={item.title} 
                            amount={`R ${item.amount?.toLocaleString()}`} 
                            date={new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} 
                            status={item.status} 
                         />
                      )) : (
                         <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Activity Recorded</p>
                         </div>
                      )}
                   </div>
                </div>
 
                <div className="pt-6 border-t border-slate-50 flex gap-4">
                   <Button variant="ghost" onClick={() => toast('Statement printing feature coming soon', { icon: '🖨️' })} className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest border-slate-100">Print Statement</Button>
                   <Button onClick={() => openModal('edit', selectedBorrower)} className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20">Edit Profile</Button>
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

const ExportCard = ({ label, icon: Icon, active, onClick }) => (
  <button 
     onClick={onClick}
     className={cn(
        "flex flex-col items-center justify-center p-5 border rounded-2xl transition-all group",
        active 
           ? "bg-primary/5 border-primary shadow-sm" 
           : "bg-slate-50 border-slate-100 hover:border-slate-200"
     )}
  >
     <Icon size={24} className={cn("mb-3", active ? "text-primary" : "text-slate-400 group-hover:text-slate-500")} />
     <span className={cn("text-[10px] font-black uppercase tracking-widest", active ? "text-primary" : "text-slate-500")}>{label}</span>
  </button>
);

const HistoryItem = ({ icon: Icon, title, amount, date, status }) => (
   <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white transition-all group">
      <div className="flex items-center gap-4">
         <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform">
            <Icon size={18} />
         </div>
         <div>
            <p className="text-sm font-black text-slate-900">{title}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{date}</p>
         </div>
      </div>
      <div className="text-right">
         <p className="text-sm font-black text-slate-900">{amount}</p>
         <StatusBadge status={status} className="text-[9px] py-0 mt-1" />
      </div>
   </div>
);

const SummaryRow = ({ title, items }) => (
  <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-50 pb-1">{title}</p>
    <div className="space-y-1">
      {items.map((item, i) => (
        <p key={i} className="text-xs font-bold text-slate-700">{item}</p>
      ))}
    </div>
  </div>
);

const Checkbox = ({ label }) => (
  <label className="flex items-center gap-3 group cursor-pointer">
    <div className="w-5 h-5 rounded-md border-2 border-slate-200 flex items-center justify-center transition-all group-hover:border-primary">
      <div className="w-2.5 h-2.5 bg-primary rounded-sm opacity-0 group-hover:opacity-20 transition-opacity" />
    </div>
    <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900 transition-colors">{label}</span>
  </label>
);

const UploadCard = ({ label, icon: Icon }) => (
  <div className="p-5 bg-white border-2 border-dashed border-slate-200 rounded-2xl hover:border-primary hover:bg-primary/5 transition-all group cursor-pointer text-center">
    <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
      <Icon size={24} className="text-slate-400 group-hover:text-primary" />
    </div>
    <p className="text-xs font-bold text-slate-900 mb-1">{label}</p>
    <p className="text-[10px] text-slate-400 font-medium">Click or Drag to Upload</p>
  </div>
);

export default Borrowers;
