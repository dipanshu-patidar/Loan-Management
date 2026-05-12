import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Download, Filter, Search, MoreVertical, 
  Eye, Pencil, BadgePercent, Trash2, CheckCircle2,
  Mail, Phone, MapPin, Building2, Wallet, Briefcase, 
  Calendar, Clock, CheckCircle, FileText, CreditCard, 
  Activity, ShieldAlert, DollarSign, ChevronRight,
  UserCheck, History, ArrowRight, X, Loader2, Camera, EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../ui/Modal';
import Drawer from '../../ui/Drawer';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import agentService from '../../services/agentService';
import { toast } from 'react-hot-toast';

const Agents = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'add', 'edit', 'commission', 'export', 'delete'
  const [activeDrawer, setActiveDrawer] = useState(null); // 'view', 'clients'
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [step, setStep] = useState(1);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Filter by Status');

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    idNumber: '',
    physicalAddress: '',
    assignedRegion: 'Gauteng',
    joiningDate: '',
    reportingManager: '',
    baseCommission: '',
    recoveryBonus: '',
    commissionTier: 'Standard',
    accountStatus: 'Active',
    role: 'Field Agent',
    internalNotes: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const response = await agentService.getAllAgents();
      setAgents(response.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch agents');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type, agent = null) => {
    setSelectedAgent(agent);
    setActiveModal(type);
    if (type === 'add') {
      setStep(1);
      setFormData({
        fullName: '',
        email: '',
        phoneNumber: '',
        idNumber: '',
        physicalAddress: '',
        assignedRegion: 'Gauteng',
        joiningDate: '',
        reportingManager: '',
        baseCommission: '',
        recoveryBonus: '',
        commissionTier: 'Standard',
        accountStatus: 'Active',
        role: 'Field Agent',
        internalNotes: '',
        password: '',
        confirmPassword: ''
      });
      setProfilePhoto(null);
      setImagePreview(null);
      setShowPassword(false);
    } else if (type === 'edit' && agent) {
      setFormData({
        fullName: agent.fullName || '',
        email: agent.email || '',
        phoneNumber: agent.phoneNumber || '',
        idNumber: agent.idNumber || '',
        physicalAddress: agent.physicalAddress || '',
        assignedRegion: agent.assignedRegion || 'Gauteng',
        joiningDate: agent.joiningDate ? new Date(agent.joiningDate).toISOString().split('T')[0] : '',
        reportingManager: agent.reportingManager || '',
        baseCommission: agent.baseCommission || '',
        recoveryBonus: agent.recoveryBonus || '',
        commissionTier: agent.commissionTier || 'Standard',
        accountStatus: agent.accountStatus || 'Active',
        role: agent.role || 'Field Agent',
        internalNotes: agent.internalNotes || ''
      });
      setImagePreview(agent.profilePhoto);
      setProfilePhoto(null);
    }
    setOpenMenuId(null);
  };

  const openDrawer = (type, agent) => {
    setSelectedAgent(agent);
    setActiveDrawer(type);
    setOpenMenuId(null);
  };

  const closeModal = () => {
    setActiveModal(null);
    setStep(1);
  };
  const closeDrawer = () => setActiveDrawer(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const submitData = new FormData();
      
      Object.keys(formData).forEach(key => {
        submitData.append(key, formData[key]);
      });
      
      if (profilePhoto) {
        submitData.append('profilePhoto', profilePhoto);
      }

      // Password Validation for Edit
      if (activeModal === 'edit' && formData.password) {
        if (formData.password.length < 6) return toast.error('Password must be at least 6 characters');
        if (formData.password !== formData.confirmPassword) return toast.error('Passwords do not match');
      }

      if (activeModal === 'add') {
        await agentService.createAgent(submitData);
        toast.success('Agent created successfully');
      } else if (activeModal === 'edit' || activeModal === 'commission') {
        const id = selectedAgent._id;
        await agentService.updateAgent(id, submitData);
        toast.success('Agent updated successfully');
      }

      closeModal();
      fetchAgents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsSubmitting(true);
      await agentService.deleteAgent(selectedAgent._id);
      toast.success('Agent deleted successfully');
      closeModal();
      fetchAgents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete agent');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = 
      agent.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'Filter by Status' || agent.accountStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 pb-10" onClick={() => setOpenMenuId(null)}>
      {/* 1. PAGE HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Agents</h1>
          <p className="text-slate-500 font-medium mt-1">Manage field agents, assigned borrowers, commissions, and earnings.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="secondary" onClick={() => openModal('export')} className="flex items-center gap-2 font-bold px-6">
             <Download size={18} /> Export
           </Button>
           <Button onClick={() => openModal('add')} className="flex items-center gap-2 font-bold px-6 shadow-lg shadow-primary/20">
             <UserPlus size={18} /> Add Agent
           </Button>
        </div>
      </header>

      {/* 2. ANALYTICS CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Agents" value={agents.length} icon={Users} color="navy" />
        <StatCard title="Active Agents" value={agents.filter(a => a.accountStatus === 'Active').length} icon={UserCheck} color="blue" />
        <StatCard title="Assigned Clients" value={agents.reduce((acc, curr) => acc + (curr.assignedBorrowers?.length || 0), 0)} icon={Users} color="navy" />
        <StatCard title="Monthly Commissions" value={`R ${agents.reduce((acc, curr) => acc + (curr.totalCommissionEarned || 0), 0).toLocaleString()}`} icon={Wallet} color="blue" />
      </section>

      {/* 3. SEARCH & FILTER SECTION */}
      <section className="bg-white p-4 rounded-3xl border border-slate-100 shadow-soft flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
           <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
           <input 
              type="text" 
              placeholder="Search agent by name, email or phone..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/10 transition-all"
           />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
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

      {/* 4. AGENTS TABLE */}
      <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
           {loading ? (
             <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading Agents...</p>
             </div>
           ) : (
            <table className="w-full">
              <thead>
                 <tr className="text-left border-b border-slate-50 bg-slate-50/50">
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Agent</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Assigned Clients</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Region</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Commission %</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Earnings</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {filteredAgents.length === 0 ? (
                    <tr>
                       <td colSpan="8" className="px-8 py-20 text-center">
                          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No agents found</p>
                       </td>
                    </tr>
                 ) : (
                  filteredAgents.map((agent) => (
                    <tr key={agent._id} className="group hover:bg-slate-50/50 transition-all">
                       <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                             <div className="w-11 h-11 rounded-2xl bg-primary/5 overflow-hidden flex items-center justify-center font-black text-sm border border-primary/10">
                                {agent.profilePhoto ? (
                                   <img src={agent.profilePhoto} alt={agent.fullName} className="w-full h-full object-cover" />
                                ) : agent.fullName.charAt(0)}
                             </div>
                             <div>
                                <p className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{agent.fullName}</p>
                                <p className="text-[11px] text-slate-400 font-bold uppercase">{agent.employeeId || 'NO ID'}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-6 py-5">
                          <p className="text-sm font-bold text-slate-700">{agent.phoneNumber}</p>
                       </td>
                       <td className="px-6 py-5 text-center">
                          <p className="text-sm font-black text-slate-900">{agent.assignedBorrowers?.length || 0}</p>
                       </td>
                       <td className="px-6 py-5 text-center text-primary font-bold">
                          {agent.assignedRegion}
                       </td>
                       <td className="px-6 py-5 text-center">
                          <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-black">
                             {agent.baseCommission}%
                          </span>
                       </td>
                       <td className="px-6 py-5 text-right font-black text-emerald-600">
                          R {agent.totalCommissionEarned?.toLocaleString() || '0'}
                       </td>
                       <td className="px-6 py-5 text-center">
                          <StatusBadge status={agent.accountStatus} />
                       </td>
                       <td className="px-8 py-5">
                          <div className="flex items-center justify-end gap-2">
                             <TableAction icon={Eye} color="text-blue-500 hover:bg-blue-50" onClick={() => openDrawer('view', agent)} tooltip="View Agent" />
                             <TableAction icon={Pencil} color="text-primary hover:bg-primary/5" onClick={() => openModal('edit', agent)} tooltip="Edit Agent" />
                             <TableAction icon={Trash2} color="text-rose-500 hover:bg-rose-50" onClick={() => openModal('delete', agent)} tooltip="Delete Agent" />
                             
                             <div className="relative" onClick={(e) => e.stopPropagation()}>
                                <button 
                                   onClick={() => setOpenMenuId(openMenuId === agent._id ? null : agent._id)}
                                   className={cn(
                                      "p-2 rounded-xl transition-all",
                                      openMenuId === agent._id ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                                   )}
                                >
                                   <MoreVertical size={18} />
                                </button>

                                <AnimatePresence>
                                   {openMenuId === agent._id && (
                                      <motion.div 
                                         initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                         animate={{ opacity: 1, scale: 1, y: 0 }}
                                         exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                         className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50"
                                      >
                                         <DropdownItem 
                                            icon={Users} 
                                            label="View Clients" 
                                            onClick={() => openDrawer('clients', agent)} 
                                         />
                                         <DropdownItem 
                                            icon={BadgePercent} 
                                            label="Set Commission" 
                                            onClick={() => openModal('commission', agent)} 
                                         />
                                         <div className="my-1 border-t border-slate-50" />
                                         <DropdownItem 
                                            icon={ShieldAlert} 
                                            label={agent.accountStatus === 'Suspended' ? 'Unsuspend Agent' : 'Suspend Agent'} 
                                            color="text-amber-600 hover:bg-amber-50"
                                            onClick={() => openModal('edit', agent)} 
                                         />
                                      </motion.div>
                                   )}
                                </AnimatePresence>
                             </div>
                          </div>
                       </td>
                    </tr>
                 )))}
              </tbody>
            </table>
           )}
        </div>
      </section>

      {/* --- MODALS & DRAWERS --- */}

      {/* ADD AGENT MODAL */}
      <Modal 
        isOpen={activeModal === 'add'} 
        onClose={closeModal} 
        title={`Add Agent - Step ${step} of 4`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-8">
           {/* Progress Line */}
           <div className="flex gap-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              {[1, 2, 3, 4].map(s => (
                 <div key={s} className={cn("h-full flex-1 transition-all duration-500", step >= s ? "bg-primary" : "bg-slate-200")} />
              ))}
           </div>

           <div className="min-h-[300px]">
              {step === 1 && (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <h4 className="text-lg font-black text-slate-900 tracking-tight">Personal Details</h4>
                    <div className="flex justify-center pb-4">
                       <div className="relative group">
                          <div className="w-24 h-24 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden flex items-center justify-center transition-all group-hover:border-primary">
                             {imagePreview ? (
                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                             ) : (
                                <Camera className="text-slate-300 group-hover:text-primary transition-colors" size={32} />
                             )}
                          </div>
                          <input 
                             type="file" 
                             accept="image/*" 
                             className="absolute inset-0 opacity-0 cursor-pointer" 
                             onChange={handleFileChange}
                          />
                          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg pointer-events-none group-hover:scale-110 transition-transform">
                             <UserPlus size={16} />
                          </div>
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <Input label="Full Name" name="fullName" value={formData.fullName} onChange={handleInputChange} placeholder="e.g. Samuel Jackson" />
                       <Input label="Email Address" name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="name@point47.com" />
                       <Input label="Phone Number" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} placeholder="+27 00 000 0000" />
                       <Input label="ID Number" name="idNumber" value={formData.idNumber} onChange={handleInputChange} placeholder="850512..." />
                       
                       <div className="relative">
                          <Input 
                             label="Password" 
                             name="password" 
                             type={showPassword ? "text" : "password"} 
                             value={formData.password} 
                             onChange={handleInputChange} 
                             placeholder="Enter password" 
                          />
                          <button 
                             type="button"
                             onClick={() => setShowPassword(!showPassword)}
                             className="absolute right-4 top-[38px] text-slate-400 hover:text-primary transition-colors"
                          >
                             {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                          </button>
                       </div>
                       
                       <Input 
                          label="Confirm Password" 
                          name="confirmPassword" 
                          type="password" 
                          value={formData.confirmPassword} 
                          onChange={handleInputChange} 
                          placeholder="Confirm password" 
                       />
                    </div>
                    <Input label="Physical Address" name="physicalAddress" value={formData.physicalAddress} onChange={handleInputChange} isTextArea placeholder="Street, City, Province, Code" />
                 </motion.div>
              )}

              {step === 2 && (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <h4 className="text-lg font-black text-slate-900 tracking-tight">Employment Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Assigned Region</label>
                          <select 
                             name="assignedRegion" 
                             value={formData.assignedRegion} 
                             onChange={handleInputChange}
                             className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/10"
                          >
                             <option>Gauteng</option>
                             <option>Western Cape</option>
                             <option>KwaZulu-Natal</option>
                             <option>Eastern Cape</option>
                             <option>Free State</option>
                             <option>Limpopo</option>
                             <option>Mpumalanga</option>
                             <option>North West</option>
                             <option>Northern Cape</option>
                          </select>
                       </div>
                       <Input label="Joining Date" name="joiningDate" type="date" value={formData.joiningDate} onChange={handleInputChange} />
                       <Input label="Reporting Manager" name="reportingManager" value={formData.reportingManager} onChange={handleInputChange} placeholder="Search Manager..." />
                       <Input label="Employee ID" placeholder="AUTO-GENERATED" disabled />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Role</label>
                       <select 
                          name="role" 
                          value={formData.role} 
                          onChange={handleInputChange}
                          className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/10"
                       >
                          <option>Agent</option>
                          <option>Field Agent</option>
                          <option>Recovery Agent</option>
                          <option>Senior Agent</option>
                       </select>
                    </div>
                 </motion.div>
              )}

              {step === 3 && (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <h4 className="text-lg font-black text-slate-900 tracking-tight">Commission Setup</h4>
                    <div className="grid grid-cols-2 gap-4">
                       <Input label="Base Commission (%)" name="baseCommission" type="number" value={formData.baseCommission} onChange={handleInputChange} placeholder="e.g. 8" />
                       <Input label="Recovery Bonus (%)" name="recoveryBonus" type="number" value={formData.recoveryBonus} onChange={handleInputChange} placeholder="e.g. 2" />
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Commission Tier</label>
                          <select 
                             name="commissionTier" 
                             value={formData.commissionTier} 
                             onChange={handleInputChange}
                             className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/10"
                          >
                             <option>Standard</option>
                             <option>Senior</option>
                             <option>Premium</option>
                          </select>
                       </div>
                    </div>
                    <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                       <p className="text-[11px] text-primary font-bold uppercase">Note: Commission is calculated based on successful monthly collections.</p>
                    </div>
                 </motion.div>
              )}

              {step === 4 && (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <h4 className="text-lg font-black text-slate-900 tracking-tight">Review & Submit</h4>
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                       <ReviewRow label="Agent Name" value={formData.fullName} />
                       <ReviewRow label="Base Commission" value={`${formData.baseCommission}%`} />
                       <ReviewRow label="Region" value={formData.assignedRegion} />
                       <ReviewRow label="Role" value={formData.role} />
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-700">
                       <CheckCircle2 size={20} />
                       <p className="text-[11px] font-bold uppercase leading-tight">I verify all agent details and commission structures are approved as per policy.</p>
                    </div>
                 </motion.div>
              )}
           </div>

           <div className="flex gap-4 pt-6 border-t border-slate-50">
              {step > 1 && (
                 <Button variant="ghost" onClick={() => setStep(step - 1)} disabled={isSubmitting} className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest">Previous</Button>
              )}
              <Button 
                onClick={() => {
                  if (step === 1) {
                    if (!formData.password) return toast.error('Password is required');
                    if (formData.password.length < 6) return toast.error('Password must be at least 6 characters');
                    if (formData.password !== formData.confirmPassword) return toast.error('Passwords do not match');
                  }
                  step < 4 ? setStep(step + 1) : handleSubmit();
                }} 
                disabled={isSubmitting}
                className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20"
              >
                 {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (step === 4 ? "Complete Onboarding" : "Next Step")}
              </Button>
           </div>
        </div>
      </Modal>

      {/* EDIT MODAL */}
      <Modal isOpen={activeModal === 'edit'} onClose={closeModal} title="Edit Agent" maxWidth="max-w-3xl">
         <div className="space-y-8">
            <div className="flex items-start gap-8">
               <div className="w-1/3 space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Profile Photo</h4>
                  <div className="relative group mx-auto w-32 h-32">
                     <div className="w-full h-full rounded-[2rem] bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden flex items-center justify-center transition-all group-hover:border-primary">
                        {imagePreview ? (
                           <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                           <Camera className="text-slate-300 group-hover:text-primary transition-colors" size={40} />
                        )}
                     </div>
                     <input 
                        type="file" 
                        accept="image/*" 
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                        onChange={handleFileChange}
                     />
                     {imagePreview && (
                        <button 
                           onClick={() => { setImagePreview(null); setProfilePhoto(null); }}
                           className="absolute -top-2 -right-2 w-8 h-8 bg-rose-500 text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-rose-600 transition-colors"
                        >
                           <X size={14} />
                        </button>
                     )}
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                     <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight text-center">Allowed: JPG, PNG. Max 2MB.</p>
                  </div>
               </div>

               <div className="flex-1 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                     <Input label="Full Name" name="fullName" value={formData.fullName} onChange={handleInputChange} />
                     <Input label="Phone Number" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} />
                     <Input label="Email Address" name="email" value={formData.email} onChange={handleInputChange} />
                     <Input label="ID Number" name="idNumber" value={formData.idNumber} onChange={handleInputChange} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Account Status</label>
                        <select 
                          name="accountStatus" 
                          value={formData.accountStatus} 
                          onChange={handleInputChange}
                          className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/10"
                        >
                           <option>Active</option>
                           <option>Inactive</option>
                           <option>Suspended</option>
                        </select>
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Agent Role</label>
                        <select 
                          name="role" 
                          value={formData.role} 
                          onChange={handleInputChange}
                          className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/10"
                        >
                           <option>Field Agent</option>
                           <option>Recovery Agent</option>
                           <option>Senior Agent</option>
                           <option>Agent</option>
                        </select>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                     <div className="relative">
                        <Input 
                           label="New Password" 
                           name="password" 
                           type={showPassword ? "text" : "password"} 
                           value={formData.password} 
                           onChange={handleInputChange} 
                           placeholder="••••••••" 
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
                           label="Confirm Password" 
                           name="confirmPassword" 
                           type={showPassword ? "text" : "password"} 
                           value={formData.confirmPassword} 
                           onChange={handleInputChange} 
                           placeholder="••••••••" 
                        />
                        <button 
                           type="button"
                           onClick={() => setShowPassword(!showPassword)}
                           className="absolute right-4 top-[38px] text-slate-400 hover:text-primary transition-colors"
                        >
                           {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                        </button>
                     </div>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-50">
               <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assignment</h4>
                  <div className="space-y-1.5">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Employee ID</label>
                     <Input value={selectedAgent?.employeeId} disabled className="bg-slate-100 opacity-60" />
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Region</label>
                     <select 
                        name="assignedRegion" 
                        value={formData.assignedRegion} 
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/10"
                     >
                        <option>Gauteng</option>
                        <option>Western Cape</option>
                        <option>KwaZulu-Natal</option>
                     </select>
                  </div>
                  <Input label="Joining Date" name="joiningDate" type="date" value={formData.joiningDate} onChange={handleInputChange} />
               </div>

               <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Commission Setup</h4>
                  <Input label="Base (%)" name="baseCommission" type="number" value={formData.baseCommission} onChange={handleInputChange} />
                  <Input label="Recovery (%)" name="recoveryBonus" type="number" value={formData.recoveryBonus} onChange={handleInputChange} />
                  <div className="space-y-1.5">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tier</label>
                     <select 
                       name="commissionTier" 
                       value={formData.commissionTier} 
                       onChange={handleInputChange}
                       className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/10"
                     >
                        <option>Standard</option>
                        <option>Senior</option>
                        <option>Premium</option>
                     </select>
                  </div>
               </div>

               <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Internal Notes</h4>
                  <textarea 
                     name="internalNotes"
                     value={formData.internalNotes}
                     onChange={handleInputChange}
                     className="w-full h-[180px] bg-slate-50 border-none rounded-2xl p-4 text-xs font-medium focus:ring-2 focus:ring-primary/10 resize-none"
                     placeholder="Admin notes about performance or internal records..."
                  />
               </div>
            </div>

            <div className="flex gap-3 pt-6 border-t border-slate-50">
               <Button variant="ghost" onClick={closeModal} disabled={isSubmitting} className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest">Cancel</Button>
               <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-2 py-4 font-black text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Save Changes"}
               </Button>
            </div>
         </div>
      </Modal>

      {/* COMMISSION MODAL */}
      <Modal isOpen={activeModal === 'commission'} onClose={closeModal} title="Set Commission %" maxWidth="max-w-md">
         <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
               <div className="w-12 h-12 bg-primary text-white rounded-xl overflow-hidden flex items-center justify-center font-black">
                  {selectedAgent?.profilePhoto ? (
                     <img src={selectedAgent.profilePhoto} alt={selectedAgent.fullName} className="w-full h-full object-cover" />
                  ) : selectedAgent?.fullName.charAt(0)}
               </div>
               <div>
                  <p className="text-sm font-black text-slate-900">{selectedAgent?.fullName}</p>
                  <p className="text-xs text-slate-400 font-bold uppercase">Current: {selectedAgent?.baseCommission}%</p>
               </div>
            </div>
            <Input 
              label="New Commission Percentage (%)" 
              name="baseCommission" 
              type="number" 
              value={formData.baseCommission} 
              onChange={handleInputChange} 
              placeholder="e.g. 8.5" 
            />
            <div className="flex gap-3 pt-2">
               <Button variant="ghost" onClick={closeModal} disabled={isSubmitting} className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest">Cancel</Button>
               <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Save Commission"}
               </Button>
            </div>
         </div>
      </Modal>

      {/* DELETE MODAL */}
      <Modal isOpen={activeModal === 'delete'} onClose={closeModal} title="Delete Agent" maxWidth="max-w-md">
         <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-sm">
               <Trash2 size={28} />
            </div>
            <div>
               <h4 className="text-xl font-black text-slate-900 tracking-tight">Delete Agent Account?</h4>
               <p className="text-sm text-slate-500 mt-2">You are about to permanently delete <span className="font-bold text-slate-900">{selectedAgent?.fullName}</span>. This action will unassign all their borrowers.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-3 text-left">
               <Checkbox label="I understand this agent will lose system access" checked />
               <Checkbox label="I have unassigned or reassigned all active clients" checked />
            </div>
            <div className="flex gap-3 pt-2">
               <Button variant="ghost" onClick={closeModal} disabled={isSubmitting} className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest">Cancel</Button>
               <Button variant="danger" onClick={handleDelete} disabled={isSubmitting} className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest shadow-lg shadow-rose-200">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Permanently Delete"}
               </Button>
            </div>
         </div>
      </Modal>

      {/* VIEW DRAWER */}
      <Drawer 
         isOpen={activeDrawer === 'view'} 
         onClose={closeDrawer} 
         title="Agent Profile"
         width="max-w-2xl"
      >
         {selectedAgent && (
            <div className="space-y-10">
               {/* Header Info */}
               <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                  <div className="w-20 h-20 rounded-3xl bg-primary overflow-hidden flex items-center justify-center text-white text-3xl font-black shadow-lg">
                     {selectedAgent.profilePhoto ? (
                        <img src={selectedAgent.profilePhoto} alt={selectedAgent.fullName} className="w-full h-full object-cover" />
                     ) : selectedAgent.fullName.charAt(0)}
                  </div>
                  <div className="flex-1">
                     <h2 className="text-2xl font-black text-slate-900 tracking-tight">{selectedAgent.fullName}</h2>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Agent ID: {selectedAgent.employeeId}</p>
                     <div className="flex items-center gap-2 mt-4">
                        <StatusBadge status={selectedAgent.accountStatus} />
                        <span className="px-3 py-1 bg-white border border-slate-100 rounded-lg text-xs font-black text-slate-600">{selectedAgent.role}</span>
                     </div>
                  </div>
               </div>

               {/* Stats Overview */}
               <div className="grid grid-cols-3 gap-6">
                  <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm text-center">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Assigned Clients</p>
                     <p className="text-xl font-black text-slate-900">{selectedAgent.assignedBorrowers?.length || 0}</p>
                  </div>
                  <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm text-center">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Region</p>
                     <p className="text-xl font-black text-primary text-[14px]">{selectedAgent.assignedRegion}</p>
                  </div>
                  <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm text-center">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Earnings</p>
                     <p className="text-xl font-black text-emerald-600">R {selectedAgent.totalCommissionEarned?.toLocaleString() || '0'}</p>
                  </div>
               </div>

               {/* Details Summary */}
               <div className="space-y-5">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                     <FileText size={14} className="text-primary" /> Professional Details
                  </h4>
                  <div className="space-y-3 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                     <ReviewRow label="Email Address" value={selectedAgent.email} />
                     <ReviewRow label="Phone Number" value={selectedAgent.phoneNumber} />
                     <ReviewRow label="Joining Date" value={new Date(selectedAgent.joiningDate).toLocaleDateString()} />
                     <ReviewRow label="Reporting Manager" value={selectedAgent.reportingManager} />
                     <div className="h-px bg-slate-200 my-2" />
                     <ReviewRow label="ID Number" value={selectedAgent.idNumber} />
                     <ReviewRow label="Commission Setup" value={`${selectedAgent.baseCommission}% + ${selectedAgent.recoveryBonus}%`} />
                     <ReviewRow label="Commission Tier" value={selectedAgent.commissionTier} />
                  </div>
               </div>

               {/* Address & Notes */}
               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-5">
                     <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <MapPin size={14} className="text-blue-500" /> Physical Address
                     </h4>
                     <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 h-full">
                        <p className="text-sm font-medium text-slate-700 leading-relaxed">{selectedAgent.physicalAddress}</p>
                     </div>
                  </div>
                  <div className="space-y-5">
                     <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <History size={14} className="text-amber-500" /> Internal Notes
                     </h4>
                     <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 h-full">
                        <p className="text-sm font-medium text-slate-500 leading-relaxed italic">{selectedAgent.internalNotes || 'No internal notes available.'}</p>
                     </div>
                  </div>
               </div>

               <div className="pt-6 border-t border-slate-50 flex gap-4">
                  <Button variant="ghost" className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest border-slate-100">Performance Report</Button>
                  <Button onClick={() => openModal('edit', selectedAgent)} className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20">Edit Agent</Button>
               </div>
            </div>
         )}
      </Drawer>

      {/* CLIENTS DRAWER */}
      <Drawer 
         isOpen={activeDrawer === 'clients'} 
         onClose={closeDrawer} 
         title="Assigned Borrowers"
         width="max-w-2xl"
      >
         {selectedAgent && (
            <div className="space-y-8">
               <div className="flex items-center justify-between p-6 bg-primary text-white rounded-[2rem] shadow-xl shadow-primary/20">
                  <div>
                     <p className="text-xs font-bold opacity-60 uppercase tracking-widest mb-1">Portfolio Manager</p>
                     <h4 className="text-xl font-black">{selectedAgent.fullName}</h4>
                  </div>
                  <div className="text-right">
                     <p className="text-xs font-bold opacity-60 uppercase tracking-widest mb-1">Active Portfolio</p>
                     <h4 className="text-xl font-black">{selectedAgent.assignedBorrowers?.length || 0} Borrowers</h4>
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="relative">
                     <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                     <input className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-medium" placeholder="Search within agent portfolio..." />
                  </div>
                  
                  <div className="space-y-3">
                     {selectedAgent.assignedBorrowers?.length > 0 ? (
                        selectedAgent.assignedBorrowers.map((borrower, i) => (
                          <div key={borrower._id || i} className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between hover:border-primary transition-all group">
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 font-black group-hover:bg-primary group-hover:text-white transition-all">
                                   {borrower.fullName?.charAt(0) || 'B'}
                                </div>
                                <div>
                                   <p className="text-sm font-black text-slate-900">{borrower.fullName}</p>
                                   <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-[10px] font-black text-slate-400 uppercase">{borrower.borrowerCode}</span>
                                      <StatusBadge status={borrower.accountStatus} className="text-[8px] py-0 px-1.5" />
                                   </div>
                                </div>
                             </div>
                             <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase">Phone</p>
                                <p className="text-xs font-black text-slate-900">{borrower.phoneNumber}</p>
                             </div>
                          </div>
                        ))
                     ) : (
                       <div className="text-center py-10">
                          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No borrowers assigned to this agent yet</p>
                       </div>
                     )}
                  </div>
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

const ExportCard = ({ label, icon: Icon }) => (
  <button className="flex flex-col items-center justify-center p-5 bg-slate-50 border border-slate-100 rounded-2xl hover:border-primary hover:bg-primary/5 transition-all group">
     <Icon size={24} className="text-slate-400 group-hover:text-primary mb-3" />
     <span className="text-[10px] font-black text-slate-500 group-hover:text-primary uppercase tracking-widest">{label}</span>
  </button>
);

const Checkbox = ({ label, checked }) => (
  <label className="flex items-center gap-3 group cursor-pointer">
    <div className={cn(
      "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
      checked ? "border-primary bg-primary/10" : "border-slate-200 group-hover:border-primary"
    )}>
      <div className={cn("w-2.5 h-2.5 bg-primary rounded-sm transition-opacity", checked ? "opacity-100" : "opacity-0")} />
    </div>
    <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900 transition-colors">{label}</span>
  </label>
);

export default Agents;

