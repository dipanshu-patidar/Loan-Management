import React, { useState, useEffect } from 'react';
import { 
  FileText, Search, Filter, Download, MoreVertical, 
  Eye, CheckCircle, XCircle, Clock, AlertCircle,
  Calendar, DollarSign, User, Building2, Briefcase,
  MapPin, Phone, Mail, ArrowRight, Loader2, Info,
  History, ShieldCheck, CheckCircle2, ChevronRight,
  ExternalLink, FileCheck, FileX, Pause, Image as ImageIcon,
  CreditCard
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { cn } from '../../utils/cn';
import loanApplicationService from '../../services/loanApplicationService';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../ui/Modal';
import Drawer from '../../ui/Drawer';
import Button from '../../ui/Button';
import Input from '../../ui/Input';

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'approve', 'reject', 'hold', 'export'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [statsData, setStatsData] = useState({
    All: 0,
    New: 0,
    'Under Review': 0,
    Recommended: 0,
    Hold: 0,
    Approved: 0,
    Rejected: 0
  });
  
  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [reviewerFilter, setReviewerFilter] = useState('All Reviewers');

  // Decision Form States
  const [decisionData, setDecisionData] = useState({
    adminNotes: '',
    approvedAmount: '',
    finalDuration: '',
    interestOverride: '',
    rejectionReason: '',
    holdReason: ''
  });

  useEffect(() => {
    fetchApplications();
    fetchStats();
  }, [searchTerm, statusFilter, reviewerFilter]);

  const fetchStats = async () => {
    try {
      const response = await loanApplicationService.getApplicationStats();
      if (response.success && response.data) {
        setStatsData(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params = {
        search: searchTerm,
        status: statusFilter !== 'All Status' ? statusFilter : undefined,
        staffReviewer: reviewerFilter !== 'All Reviewers' ? reviewerFilter : undefined
      };
      const response = await loanApplicationService.getAllApplications(params);
      setApplications(response.data.data.applications);
    } catch (error) {
      toast.error('Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (id) => {
    try {
      setLoading(true);
      const response = await loanApplicationService.getApplicationDetails(id);
      setSelectedApp(response.data.data.application);
      setIsDrawerOpen(true);
    } catch (error) {
      toast.error('Failed to fetch application details');
    } finally {
      setLoading(false);
    }
  };

  const openDecisionModal = (type, app = null) => {
    if (app) setSelectedApp(app);
    setActiveModal(type);
    if (type === 'export') {
      setExportFormat('pdf');
      return;
    }
    setDecisionData({
      adminNotes: '',
      approvedAmount: (app || selectedApp)?.requestedAmount || '',
      finalDuration: (app || selectedApp)?.loanDuration || '',
      interestOverride: (app || selectedApp)?.interestRate || '',
      rejectionReason: '',
      holdReason: ''
    });
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
      doc.text("Loan Applications Report", 14, 25);
      
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 32);

      // Prepare Table Data
      const tableColumn = ["App ID", "Borrower", "Amount", "Duration", "Status", "Date"];
      const tableRows = applications.map(a => [
        a.applicationId || 'N/A',
        a.borrower?.fullName || a.borrowerName || 'N/A',
        `R ${(a.requestedAmount || 0).toLocaleString()}`,
        `${a.loanDuration || 0} Months`,
        a.status || 'N/A',
        new Date(a.createdAt || new Date()).toLocaleDateString()
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        theme: 'grid',
        headStyles: { fillColor: [46, 58, 116], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 3 },
      });

      doc.save(`Applications_Report_${new Date().getTime()}.pdf`);
      toast.success('PDF Report generated successfully!');
    } else if (exportFormat === 'csv') {
      const headers = ["Application ID,Borrower Name,Requested Amount,Duration,Status,Date\n"];
      const rows = applications.map(a => 
        `${a.applicationId || 'N/A'},"${a.borrower?.fullName || a.borrowerName || ''}",${a.requestedAmount || 0},${a.loanDuration || 0},${a.status || 'N/A'},${new Date(a.createdAt || new Date()).toLocaleDateString()}`
      ).join("\n");
      
      const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Applications_Data_${new Date().getTime()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('CSV Data exported successfully!');
    }
    setActiveModal(null);
  };

  const handleApprove = async () => {
    try {
      setIsSubmitting(true);
      await loanApplicationService.approveApplication(selectedApp._id, {
        approvedAmount: decisionData.approvedAmount,
        finalDuration: decisionData.finalDuration,
        adminNotes: decisionData.adminNotes,
        interestOverride: decisionData.interestOverride
      });
      toast.success('Loan application approved successfully');
      fetchApplications();
      fetchStats();
      setActiveModal(null);
      setIsDrawerOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    try {
      setIsSubmitting(true);
      await loanApplicationService.rejectApplication(selectedApp._id, {
        rejectionReason: decisionData.rejectionReason,
        adminNotes: decisionData.adminNotes
      });
      toast.success('Loan application rejected successfully');
      fetchApplications();
      fetchStats();
      setActiveModal(null);
      setIsDrawerOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHold = async () => {
    try {
      setIsSubmitting(true);
      await loanApplicationService.holdApplication(selectedApp._id, {
        holdReason: decisionData.holdReason,
        adminNotes: decisionData.adminNotes
      });
      toast.success('Application placed on hold');
      fetchApplications();
      fetchStats();
      setActiveModal(null);
      setIsDrawerOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place on hold');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stats = [
    { title: 'Total Applications', value: statsData['All'] || 0, icon: FileText, color: 'navy' },
    { title: 'Under Review', value: statsData['Under Review'] || 0, icon: Clock, color: 'orange' },
    { title: 'Recommended', value: statsData['Recommended'] || 0, icon: ShieldCheck, color: 'purple' },
    { title: 'Approved', value: statsData['Approved'] || 0, icon: CheckCircle, color: 'green' }
  ];

  const tabs = [
    { id: 'All Status', label: 'All Applications', key: 'All' },
    { id: 'New', label: 'New', key: 'New' },
    { id: 'Under Review', label: 'Under Review', key: 'Under Review' },
    { id: 'Recommended', label: 'Recommended', key: 'Recommended' },
    { id: 'Hold', label: 'Hold', key: 'Hold' },
    { id: 'Approved', label: 'Approved', key: 'Approved' },
    { id: 'Rejected', label: 'Rejected', key: 'Rejected' },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Loan Applications</h1>
          <p className="text-slate-500 font-medium mt-1">Review and manage incoming borrower loan requests for final approval.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => openDecisionModal('export')} className="flex items-center gap-2 font-bold px-6">
            <Download size={18} /> Export List
          </Button>
        </div>
      </header>

      {/* STATS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}
      </section>

      {/* TABS */}
      <section className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide border-b border-slate-100">
        {tabs.map((tab) => {
          const isActive = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={cn(
                "flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap relative",
                isActive 
                  ? "border-primary text-primary bg-primary/5" 
                  : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              )}
            >
              {tab.label}
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-black",
                isActive ? "bg-primary text-white" : "bg-slate-100 text-slate-500"
              )}>
                {statsData[tab.key] || 0}
              </span>
            </button>
          );
        })}
      </section>

      {/* SEARCH & FILTERS */}
      <section className="bg-white p-4 rounded-3xl border border-slate-100 shadow-soft flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by ID, Name, Email, or Phone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/10 transition-all"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select 
            value={reviewerFilter}
            onChange={(e) => setReviewerFilter(e.target.value)}
            className="flex-1 md:flex-none bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold text-slate-600 focus:ring-0"
          >
            <option>All Reviewers</option>
          </select>
        </div>
      </section>

      {/* TABLE */}
      <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          {loading && !isDrawerOpen ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Fetching Applications...</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-slate-50 bg-slate-50/50">
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Application ID</th>
                  <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Borrower</th>
                  <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Requested Amount</th>
                  <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration</th>
                  <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">EMI Estimate</th>
                  <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Staff Reviewer</th>
                  <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {applications.map((app) => (
                  <tr key={app._id} className="group hover:bg-slate-50/50 transition-all">
                    <td className="px-8 py-5">
                      <span className="text-[11px] font-black text-slate-600 bg-slate-100 px-3 py-1 rounded-lg uppercase tracking-tight">
                        {app.applicationId}
                      </span>
                      <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">{new Date(app.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        {app.borrower?.profilePhoto?.url ? (
                          <img src={app.borrower.profilePhoto.url} className="w-10 h-10 rounded-2xl object-cover shadow-sm border border-slate-100" alt="" />
                        ) : (
                          <div className="w-10 h-10 rounded-2xl bg-primary/5 text-primary flex items-center justify-center font-black text-xs">
                            {app.borrower?.fullName?.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{app.borrower?.fullName}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{app.borrower?.borrowerId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-black text-slate-900">R {app.requestedAmount?.toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs font-bold text-slate-700">{app.loanDuration} Months</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs font-black text-primary">R {app.estimatedEmi?.toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-5">
                      {app.staffReviewer ? (
                        <div className="flex items-center gap-2">
                           <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 uppercase">
                             {app.staffReviewer.fullName.charAt(0)}
                           </div>
                           <p className="text-xs font-bold text-slate-600">{app.staffReviewer.fullName}</p>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 uppercase italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => handleViewDetails(app._id)}
                          className="p-2 rounded-xl text-primary hover:bg-primary/5 transition-all"
                          title="View Application"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => openDecisionModal('approve', app)}
                          className="p-2 rounded-xl text-emerald-500 hover:bg-emerald-50 transition-all"
                          title="Approve Loan"
                        >
                          <CheckCircle size={18} />
                        </button>
                        <button 
                          onClick={() => openDecisionModal('hold', app)}
                          className="p-2 rounded-xl text-amber-500 hover:bg-amber-50 transition-all"
                          title="Put On Hold"
                        >
                          <Pause size={18} />
                        </button>
                        <button 
                          onClick={() => openDecisionModal('reject', app)}
                          className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition-all"
                          title="Reject Loan"
                        >
                          <XCircle size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {applications.length === 0 && !loading && (
                  <tr>
                    <td colSpan="8" className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Info size={40} className="text-slate-200" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No loan applications found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* VIEW APPLICATION DRAWER */}
      <Drawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        title="Application Review"
        width="max-w-4xl"
      >
        {selectedApp && (
          <div className="space-y-10 pb-20">
            {/* Header / Status Banner */}
            <div className="p-8 bg-slate-900 rounded-[2.5rem] relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
               <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    {selectedApp.borrower?.profilePhoto?.url ? (
                      <img src={selectedApp.borrower.profilePhoto.url} className="w-24 h-24 rounded-[2rem] object-cover border-4 border-white/10 shadow-2xl" alt="" />
                    ) : (
                      <div className="w-24 h-24 rounded-[2rem] bg-white/10 flex items-center justify-center text-white text-4xl font-black border-4 border-white/5 shadow-2xl">
                        {selectedApp.borrower?.fullName?.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h2 className="text-3xl font-black text-white tracking-tight">{selectedApp.borrower?.fullName}</h2>
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        <span className="text-[10px] font-black text-white/50 bg-white/5 px-3 py-1 rounded-lg uppercase tracking-widest border border-white/10">ID: {selectedApp.applicationId}</span>
                        <StatusBadge status={selectedApp.status} />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end text-white">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Requested Amount</p>
                    <p className="text-4xl font-black tracking-tighter">R {selectedApp.requestedAmount?.toLocaleString()}</p>
                    <div className="flex items-center gap-2 mt-2 text-primary">
                      <Clock size={14} />
                      <p className="text-xs font-black uppercase">{selectedApp.loanDuration} Months Duration</p>
                    </div>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
               <div className="lg:col-span-2 space-y-10">
                  {/* SECTION 1 — BORROWER DETAILS */}
                  <section className="space-y-6">
                     <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                       <User size={16} className="text-primary" /> Borrower Details
                     </h3>
                     <div className="grid grid-cols-2 gap-4">
                        <InfoBox icon={ShieldCheck} label="Borrower ID" value={selectedApp.borrower?.borrowerId} />
                        <InfoBox icon={Phone} label="Phone Number" value={selectedApp.borrower?.phoneNumber} />
                        <InfoBox icon={Mail} label="Email Address" value={selectedApp.borrower?.email} />
                        <InfoBox icon={Briefcase} label="Employment Status" value={selectedApp.employmentStatus} />
                        <InfoBox icon={MapPin} label="Physical Address" value={selectedApp.borrower?.physicalAddress} fullWidth />
                     </div>
                  </section>

                  {/* SECTION 2 — LOAN DETAILS */}
                  <section className="space-y-6">
                     <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                       <DollarSign size={16} className="text-primary" /> Loan Details
                     </h3>
                     <div className="grid grid-cols-2 gap-4 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                        <DetailItem label="Requested Amount" value={`R ${selectedApp.requestedAmount?.toLocaleString()}`} isBold />
                        <DetailItem label="Loan Duration" value={`${selectedApp.loanDuration} Months`} />
                        <DetailItem label="Interest Rate" value={`${selectedApp.interestRate}% P.A.`} />
                        <DetailItem label="Estimated EMI" value={`R ${selectedApp.estimatedEmi?.toLocaleString()}`} isPrimary />
                        <DetailItem label="Processing Fee" value={`R ${selectedApp.processingFee?.toLocaleString() || '0'}`} />
                        <DetailItem label="Loan Purpose" value={selectedApp.loanPurpose} />
                     </div>
                  </section>

                  {/* SECTION 3 — EMPLOYMENT DETAILS */}
                  <section className="space-y-6">
                     <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                       <Building2 size={16} className="text-primary" /> Employment Details
                     </h3>
                     <div className="grid grid-cols-2 gap-4 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                        <DetailItem label="Employer Name" value={selectedApp.employerName} />
                        <DetailItem label="Monthly Income" value={`R ${selectedApp.monthlyIncome?.toLocaleString()}`} isBold />
                        <DetailItem label="Years Of Service" value={`${selectedApp.yearsOfService} Years`} />
                        <DetailItem label="Work Address" value={selectedApp.workAddress} />
                     </div>
                  </section>

                  {/* SECTION 4 — BANKING DETAILS */}
                  <section className="space-y-6">
                     <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                       <ShieldCheck size={16} className="text-primary" /> Banking Details
                     </h3>
                     <div className="grid grid-cols-2 gap-4 p-6 bg-primary/5 rounded-[2rem] border border-primary/10">
                        <DetailItem label="Bank Name" value={selectedApp.bankName} />
                        <DetailItem label="Account Number" value={selectedApp.accountNumber} isBold />
                        <DetailItem label="Account Holder" value={selectedApp.accountHolder || selectedApp.borrower?.fullName} />
                        <DetailItem label="Branch Code" value={selectedApp.branchCode} />
                     </div>
                  </section>

                  {/* SECTION 5 — DOCUMENTS */}
                  <section className="space-y-6">
                     <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                       <FileText size={16} className="text-primary" /> Uploaded Documents
                     </h3>
                     <div className="grid grid-cols-2 gap-4">
                        {['idProof', 'payslip', 'bankStatement', 'addressProof'].map((docKey) => {
                          const doc = selectedApp.documents?.[docKey];
                          const label = docKey.replace(/([A-Z])/g, ' $1').trim();
                          return (
                            <div key={docKey} className="group p-4 bg-white border border-slate-100 rounded-3xl flex items-center justify-between hover:border-primary/50 transition-all shadow-sm">
                               <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                     <FileText size={20} />
                                  </div>
                                  <div>
                                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
                                     <p className="text-xs font-bold text-slate-900">{doc ? 'Available' : 'Missing'}</p>
                                  </div>
                               </div>
                               {doc?.url && (
                                 <div className="flex items-center gap-1">
                                   <a href={doc.url} target="_blank" rel="noreferrer" className="p-2 rounded-lg text-primary hover:bg-primary/5 transition-all" title="Preview/Open">
                                     <ExternalLink size={16} />
                                   </a>
                                   <a href={doc.url} download className="p-2 rounded-lg text-slate-400 hover:bg-slate-50 transition-all" title="Download">
                                     <Download size={16} />
                                   </a>
                                 </div>
                               )}
                            </div>
                          );
                        })}
                     </div>
                  </section>
               </div>

               <div className="space-y-10">
                  {/* SECTION 6 — STAFF REVIEW */}
                  <section className="space-y-6">
                     <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                       <ShieldCheck size={16} className="text-primary" /> Staff Review
                     </h3>
                     <div className="p-6 bg-white rounded-[2rem] border-2 border-slate-100 space-y-6 shadow-sm">
                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                           <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-black">
                              {selectedApp.staffReviewer?.fullName?.charAt(0) || 'U'}
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reviewer</p>
                              <p className="text-sm font-bold text-slate-900">{selectedApp.staffReviewer?.fullName || 'Unassigned'}</p>
                           </div>
                        </div>

                        <div className="space-y-4">
                           <div className="flex items-center justify-between">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verification Date</p>
                              <p className="text-[11px] font-bold text-slate-600">
                                {selectedApp.staffReview?.verifiedAt ? new Date(selectedApp.staffReview.verifiedAt).toLocaleDateString() : 'Pending'}
                              </p>
                           </div>
                           <div className="flex items-center justify-between">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Risk Level</p>
                              <span className={cn(
                                "px-3 py-1 rounded-lg text-[10px] font-black uppercase",
                                selectedApp.staffReview?.riskLevel === 'Low' ? "bg-emerald-100 text-emerald-700" :
                                selectedApp.staffReview?.riskLevel === 'Medium' ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                              )}>
                                {selectedApp.staffReview?.riskLevel || 'N/A'}
                              </span>
                           </div>
                           <div className="flex items-center justify-between">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recommendation</p>
                              <span className="text-[11px] font-black text-primary uppercase">{selectedApp.staffReview?.recommendation || 'None'}</span>
                           </div>
                           <div className="space-y-2 pt-2">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verification Notes</p>
                              <div className="p-3 bg-slate-50 rounded-xl text-xs font-medium text-slate-600 border border-slate-100 italic min-h-[60px]">
                                "{selectedApp.staffReview?.verificationNotes || 'No notes provided.'}"
                              </div>
                           </div>
                        </div>
                     </div>
                  </section>

                  {/* SECTION 7 — ADMIN FINAL DECISION */}
                  <section className="space-y-6">
                     <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                       <CheckCircle2 size={16} className="text-primary" /> Admin Final Decision
                     </h3>
                     <div className="p-6 bg-slate-900 rounded-[2rem] space-y-6 shadow-xl shadow-slate-900/20">
                        <div className="grid grid-cols-1 gap-3">
                           <Button 
                             onClick={() => openDecisionModal('approve')}
                             className="w-full py-5 bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-3 border-none"
                           >
                              <FileCheck size={20} />
                              <span className="font-black uppercase tracking-widest text-xs text-white">Approve Loan</span>
                           </Button>
                           <Button 
                             variant="secondary"
                             onClick={() => openDecisionModal('hold')}
                             className="w-full py-5 bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/20 text-white flex items-center justify-center gap-3 border-none"
                           >
                              <Pause size={20} />
                              <span className="font-black uppercase tracking-widest text-xs">Put On Hold</span>
                           </Button>
                           <Button 
                             variant="danger"
                             onClick={() => openDecisionModal('reject')}
                             className="w-full py-5 bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/20 flex items-center justify-center gap-3 border-none"
                           >
                              <FileX size={20} />
                              <span className="font-black uppercase tracking-widest text-xs text-white">Reject Loan</span>
                           </Button>
                        </div>
                     </div>
                  </section>
               </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* DECISION MODALS */}
      <Modal 
        isOpen={!!activeModal && activeModal !== 'export'} 
        onClose={() => setActiveModal(null)} 
        title={activeModal === 'approve' ? 'Approve Loan Application' : activeModal === 'reject' ? 'Reject Loan Application' : 'Put Application On Hold'}
        maxWidth="max-w-xl"
      >
        <div className="space-y-6 text-left">
           <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-primary font-black shadow-sm">
                {activeModal === 'approve' ? <FileCheck size={24} /> : activeModal === 'reject' ? <FileX size={24} /> : <Pause size={24} />}
              </div>
              <div>
                 <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Confirming Decision for</p>
                 <p className="text-sm font-bold text-slate-900">{selectedApp?.borrower?.fullName} (ID: {selectedApp?.applicationId})</p>
              </div>
           </div>

           {activeModal === 'approve' && (
             <div className="grid grid-cols-2 gap-4">
                <Input 
                  label="Approved Amount (R)" 
                  type="number" 
                  value={decisionData.approvedAmount}
                  onChange={(e) => setDecisionData({...decisionData, approvedAmount: e.target.value})}
                />
                <Input 
                  label="Final Duration (Months)" 
                  type="number" 
                  value={decisionData.finalDuration}
                  onChange={(e) => setDecisionData({...decisionData, finalDuration: e.target.value})}
                />
                <Input 
                  label="Interest Override (%)" 
                  type="number" 
                  className="col-span-2"
                  value={decisionData.interestOverride}
                  onChange={(e) => setDecisionData({...decisionData, interestOverride: e.target.value})}
                />
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-700 col-span-2">
                   <p className="text-[10px] font-black uppercase tracking-tight flex items-center gap-2">
                     <Info size={14} /> Approved loan will automatically move to Active Loans.
                   </p>
                </div>
             </div>
           )}

           {activeModal === 'reject' && (
             <Input 
               label="Rejection Reason" 
               isTextArea 
               placeholder="Specify why this application is being rejected..."
               value={decisionData.rejectionReason}
               onChange={(e) => setDecisionData({...decisionData, rejectionReason: e.target.value})}
             />
           )}

           {activeModal === 'hold' && (
             <Input 
               label="Hold Reason" 
               isTextArea 
               placeholder="Specify what documents or info is missing..."
               value={decisionData.holdReason}
               onChange={(e) => setDecisionData({...decisionData, holdReason: e.target.value})}
             />
           )}

           <Input 
             label="Admin Notes (Internal)" 
             isTextArea 
             placeholder="Private notes for records..."
             value={decisionData.adminNotes}
             onChange={(e) => setDecisionData({...decisionData, adminNotes: e.target.value})}
           />

           <div className="flex gap-4 pt-4 border-t border-slate-50">
              <Button variant="ghost" onClick={() => setActiveModal(null)} className="flex-1 py-4 font-black uppercase tracking-widest text-[10px]">Cancel</Button>
              <Button 
                onClick={activeModal === 'approve' ? handleApprove : activeModal === 'reject' ? handleReject : handleHold}
                variant={activeModal === 'approve' ? 'primary' : activeModal === 'reject' ? 'danger' : 'secondary'}
                disabled={isSubmitting}
                className={cn(
                  "flex-1 py-4 font-black uppercase tracking-widest text-[10px] shadow-lg",
                  activeModal === 'approve' ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20" : 
                  activeModal === 'reject' ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20" : 
                  "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20 text-white"
                )}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : `Confirm ${activeModal ? activeModal.charAt(0).toUpperCase() + activeModal.slice(1) : ''}`}
              </Button>
           </div>
        </div>
      </Modal>

      {/* EXPORT MODAL */}
      <Modal isOpen={activeModal === 'export'} onClose={() => setActiveModal(null)} title="Export Data" maxWidth="max-w-md">
         <div className="space-y-6">
            <p className="text-sm text-slate-500 font-medium text-center">Choose your export format for the current applications list.</p>
            <div className="grid grid-cols-2 gap-3">
               <ExportCard label="PDF Report" icon={FileText} active={exportFormat === 'pdf'} onClick={() => setExportFormat('pdf')} />
               <ExportCard label="CSV Data" icon={CreditCard} active={exportFormat === 'csv'} onClick={() => setExportFormat('csv')} />
            </div>
            <Button onClick={handleExport} className="w-full py-4 font-black text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20">Download Export</Button>
         </div>
      </Modal>
    </div>
  );
};

// --- HELPER COMPONENTS ---

const InfoBox = ({ icon: Icon, label, value, fullWidth = false }) => (
  <div className={cn("p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3 text-left", fullWidth ? "col-span-2" : "")}>
    <div className="p-2 bg-white rounded-xl text-primary border border-slate-100 shadow-sm">
      <Icon size={16} />
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-sm font-bold text-slate-900 break-all">{value || 'N/A'}</p>
    </div>
  </div>
);

const DetailItem = ({ label, value, isBold, isPrimary }) => (
  <div className="space-y-1">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    <p className={cn(
      "text-sm font-bold",
      isBold ? "text-slate-900 font-black" : "text-slate-700",
      isPrimary ? "text-primary font-black" : ""
    )}>{value || 'N/A'}</p>
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

export default Applications;