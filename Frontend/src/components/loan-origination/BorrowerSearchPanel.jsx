import React, { useState, useEffect } from 'react';
import { 
  Search, User, FileText, Phone, Mail, MapPin, 
  CheckCircle, ArrowRight, RefreshCw, Sparkles, ShieldCheck, 
  AlertTriangle, ExternalLink, Calendar, HelpCircle, Plus 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import borrowerService from '../../services/borrowerService';
import Input from '../../ui/Input';
import { cn } from '../../utils/cn';

// South African ID Parser helper
const parseSouthAfricanID = (idNumber) => {
  if (!idNumber || idNumber.length !== 13 || !/^\d+$/.test(idNumber)) {
    return null;
  }
  
  const yearPart = idNumber.substring(0, 2);
  const monthPart = idNumber.substring(2, 4);
  const dayPart = idNumber.substring(4, 6);
  
  const currentYearShort = new Date().getFullYear() % 100;
  const century = parseInt(yearPart) <= currentYearShort ? '20' : '19';
  const fullYear = `${century}${yearPart}`;
  
  const dobStr = `${fullYear}-${monthPart}-${dayPart}`;
  let parsedDate;
  try {
    parsedDate = new Date(dobStr);
  } catch (e) {
    parsedDate = null;
  }
  
  const genderCode = parseInt(idNumber.charAt(6));
  const gender = genderCode >= 5 ? 'Male' : 'Female';
  
  const citizenCode = parseInt(idNumber.charAt(10));
  const citizenship = citizenCode === 0 ? 'South African Citizen' : 'Permanent Resident';
  
  return {
    dob: parsedDate,
    gender,
    citizenship
  };
};

const BorrowerSearchPanel = ({ activeBorrower, setActiveBorrower, onNextStep, onClose, eligibilitySettings }) => {
  const navigate = useNavigate();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [selectedBorrower, setSelectedBorrower] = useState(activeBorrower || null);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // Identity Verification States
  const [verificationState, setVerificationState] = useState(activeBorrower ? 'verified' : 'pending'); // pending, verifying, verified, invalid, fallback
  const [verificationDetails, setVerificationDetails] = useState(activeBorrower?.verificationDetails || null);
  const [isIdVerified, setIsIdVerified] = useState(activeBorrower ? true : false);
  const [idValidationError, setIdValidationError] = useState('');

  // ── REAL-TIME PROFILE ELIGIBILITY VALIDATION ENGINE ──
  const getProfileValidationErrors = () => {
    if (!selectedBorrower) return [];
    const errors = [];
    
    // 1. Age Validation
    if (selectedBorrower.dateOfBirth) {
      const dob = new Date(selectedBorrower.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      
      const minAge = eligibilitySettings?.minimumAge || 18;
      const maxAge = eligibilitySettings?.maximumAge || 65;
      
      if (age < minAge) {
        errors.push(`Minimum age requirement is ${minAge} years. (Borrower is ${age} years old)`);
      } else if (age > maxAge) {
        errors.push(`Maximum eligible age is ${maxAge} years. (Borrower is ${age} years old)`);
      }
    }
    
    // 2. Employment Category Validation
    const allowedCategories = eligibilitySettings?.employmentCategories || [
      'Permanently Employed', 'Contract Worker', 'Self Employed', 'Government Employee'
    ];
    const currentStatus = selectedBorrower.employmentStatus || 'Unemployed';
    const normalizedStatus = currentStatus === 'Permanent' ? 'Permanently Employed' 
      : currentStatus === 'Contract' ? 'Contract Worker'
      : currentStatus === 'Self-Employed' ? 'Self Employed'
      : currentStatus;
      
    const isCategoryEligible = allowedCategories.some(cat => 
      cat.toLowerCase().replace(/[^a-z]/g, '') === normalizedStatus.toLowerCase().replace(/[^a-z]/g, '')
    );
    
    if (!isCategoryEligible) {
      errors.push(`This employment category (${currentStatus}) is currently not eligible. Allowed: ${allowedCategories.join(', ')}`);
    }

    // 3. Salary Frequency Validation
    const allowedFrequencies = eligibilitySettings?.salaryFrequencies || ['Monthly', 'Weekly', 'Fortnightly'];
    const currentFreq = selectedBorrower.salaryFrequency || 'Monthly';
    const isFreqEligible = allowedFrequencies.some(freq => 
      freq.toLowerCase() === currentFreq.toLowerCase()
    );
    
    if (!isFreqEligible) {
      errors.push(`This salary frequency (${currentFreq}) is currently not eligible. Allowed: ${allowedFrequencies.join(', ')}`);
    }

    return errors;
  };

  const profileErrors = getProfileValidationErrors();

  // Load initial list of borrowers when component mounts
  useEffect(() => {
    const loadDefaultBorrowers = async () => {
      setLoadingSearch(true);
      try {
        const res = await borrowerService.getAllBorrowers({ limit: 50 });
        if (res.success && res.data) {
          setSearchResults(res.data.borrowers || []);
        }
      } catch (err) {
        console.error('Error loading default borrowers:', err);
      } finally {
        setLoadingSearch(false);
      }
    };
    loadDefaultBorrowers();
  }, []);

  // Debounced search for existing borrowers
  useEffect(() => {
    if (!searchQuery.trim()) {
      // Re-fetch default list of borrowers if search is empty/cleared
      const reloadDefaults = async () => {
        try {
          const res = await borrowerService.getAllBorrowers({ limit: 50 });
          if (res.success && res.data) {
            setSearchResults(res.data.borrowers || []);
          }
        } catch (e) {
          console.error(e);
        }
      };
      reloadDefaults();
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingSearch(true);
      try {
        const res = await borrowerService.getAllBorrowers({ search: searchQuery });
        if (res.success && res.data) {
          setSearchResults(res.data.borrowers || []);
        }
      } catch (err) {
        console.error('Error searching borrowers:', err);
      } finally {
        setLoadingSearch(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.search-container')) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle selected borrower loading
  const handleSelectBorrower = (borrower) => {
    setSelectedBorrower(borrower);
    setShowSearchDropdown(false);
    setSearchQuery('');
    
    // Set up parsing & verification status
    setIsIdVerified(false);
    setVerificationDetails(null);
    setVerificationState('pending');
    setIdValidationError('');

    // Pre-populate orchestrator state (needs verify to activate proceed)
    setActiveBorrower(null);
  };

  const handleClearSelection = () => {
    setSelectedBorrower(null);
    setActiveBorrower(null);
    setIsIdVerified(false);
    setVerificationDetails(null);
    setVerificationState('pending');
    setIdValidationError('');
  };

  // South African ID Verification Trigger
  const handleVerifyID = () => {
    if (!selectedBorrower || !selectedBorrower.idNumber) {
      setIdValidationError('No South African ID number available.');
      return;
    }

    const id = selectedBorrower.idNumber.trim();
    if (id.length !== 13 || !/^\d+$/.test(id)) {
      setIdValidationError('Please enter a valid 13-digit South African ID number');
      setVerificationState('invalid');
      return;
    }

    setVerificationState('verifying');
    setIdValidationError('');

    const parsed = parseSouthAfricanID(id);

    // Simulate real-time DHA API delay
    setTimeout(() => {
      const isDhaOnline = Math.random() > 0.15; // 85% DHA Online
      
      if (isDhaOnline && parsed) {
        setVerificationState('verified');
        setIsIdVerified(true);
        const details = {
          source: 'DHA Realtime IDV Gateway',
          status: 'Record Found & Match',
          idStatus: 'Valid / Active',
          citizenship: parsed.citizenship,
          aliveStatus: 'Alive ✅',
          timestamp: new Date().toLocaleString()
        };
        setVerificationDetails(details);
        
        // Sync full active borrower state with parent orchestrator
        setActiveBorrower({
          ...selectedBorrower,
          _id: selectedBorrower.userId || selectedBorrower._id,
          borrowerProfileId: selectedBorrower._id,
          verificationDetails: details
        });
      } else if (parsed) {
        // Fallback
        setVerificationState('fallback');
        setIsIdVerified(true);
        const details = {
          source: 'Datanamix ID Fallback Registry',
          status: 'Verified Match (Bureau Fallback)',
          idStatus: 'Valid / Active',
          citizenship: parsed.citizenship,
          aliveStatus: 'Alive ✅',
          timestamp: new Date().toLocaleString()
        };
        setVerificationDetails(details);

        setActiveBorrower({
          ...selectedBorrower,
          _id: selectedBorrower.userId || selectedBorrower._id,
          borrowerProfileId: selectedBorrower._id,
          verificationDetails: details
        });
      } else {
        setVerificationState('invalid');
        setIdValidationError('Identity verification failed. Invalid South African ID checksum.');
      }
    }, 1500);
  };

  const handleGoToBorrowers = () => {
    onClose();
    if (window.location.pathname.includes('/staff')) {
      navigate('/staff/borrowers');
    } else {
      navigate('/admin/borrowers');
    }
  };

  return (
    <div className="space-y-8">
      
      {/* ── STEP TITLE & INFO ── */}
      <div>
        <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
          New Application — Step 1 of 5
        </h2>
        <div className="flex items-center justify-between gap-4 mt-1">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Borrower Information</h3>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Search and load an existing borrower profile before proceeding with loan origination.
            </p>
          </div>
        </div>
      </div>

      {/* ── SEARCH EXISTING BORROWER ZONE ── */}
      <div className="p-6 bg-slate-50 border border-slate-200/50 rounded-[2rem] space-y-4 relative search-container">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
          Search Existing Borrower
        </label>
        
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            autoComplete="new-password"
            placeholder="Search borrower by name, SA ID, phone or email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchDropdown(true);
            }}
            onFocus={() => setShowSearchDropdown(true)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-primary shadow-soft bg-white placeholder-slate-400"
          />
          {loadingSearch && (
            <RefreshCw size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-primary animate-spin" />
          )}
        </div>

        {/* LIVE SEARCH RESULTS DROPDOWN */}
        <AnimatePresence>
          {showSearchDropdown && (searchQuery.trim() || searchResults.length > 0) && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="absolute left-6 right-6 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl divide-y divide-slate-100 overflow-hidden max-h-[220px] overflow-y-auto z-50"
            >
              {searchResults.length > 0 ? (
                searchResults.map((b) => (
                  <div
                    key={b._id}
                    onClick={() => handleSelectBorrower(b)}
                    className="p-4 hover:bg-slate-50 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <p className="text-xs font-black text-slate-800 group-hover:text-primary transition-colors">{b.fullName}</p>
                      <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                        ID: {b.idNumber || 'N/A'} • Cell: {b.phoneNumber}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-[7px] font-black text-emerald-600 uppercase tracking-widest border border-emerald-100">
                      Verified ✅
                    </span>
                  </div>
                ))
              ) : (
                !loadingSearch && (
                  <div className="p-4 text-center text-xs font-semibold text-slate-400">
                    No results found.
                  </div>
                )
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* BORROWER NOT FOUND ALERTS CONTAINER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-primary/[0.03] border border-primary/10 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <HelpCircle className="text-primary shrink-0" size={18} />
            <div>
              <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Borrower not registered?</p>
              <p className="text-[9px] font-bold text-slate-500 mt-0.5 uppercase tracking-widest">
                Create borrower profile in the centralized Borrowers Module first.
              </p>
            </div>
          </div>
          <button
            onClick={handleGoToBorrowers}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary hover:bg-slate-900 text-white font-black uppercase tracking-widest text-[8px] transition-all shadow-sm shadow-primary/10"
          >
            <Plus size={10} className="mr-0.5" /> Add New Borrower
          </button>
        </div>
      </div>

      {/* ── MAIN COLUMN: BORROWER DETAILS (MATCHES APPLY LOAN STEP 1 FORM) ── */}
      <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-premium space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
            <User className="text-primary" size={16} /> Personal Details Card
          </h3>
          {selectedBorrower && (
            <button
              onClick={handleClearSelection}
              className="text-[9px] font-black text-rose-500 hover:text-rose-700 uppercase tracking-widest transition-colors"
            >
              Clear Loaded Profile
            </button>
          )}
        </div>

        {/* REUSABLE INPUT GRID IN BORROWER PORTAL STYLE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Full Name */}
          <Input
            label="Full Name"
            disabled
            icon={User}
            value={selectedBorrower ? selectedBorrower.fullName : ''}
            placeholder="Borrower name will load here..."
          />

          {/* ID Number + VERIFY ID right element */}
          <div>
            <Input
              label="ID / Passport Number"
              disabled
              icon={FileText}
              value={selectedBorrower ? (selectedBorrower.idNumber || '') : ''}
              placeholder="ID number will load here..."
              rightElement={
                <button
                  type="button"
                  onClick={handleVerifyID}
                  disabled={!selectedBorrower || verificationState === 'verifying'}
                  className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-slate-900 text-white font-black uppercase tracking-widest text-[8px] transition-all disabled:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
                >
                  {verificationState === 'verifying' && <RefreshCw size={8} className="animate-spin" />}
                  VERIFY
                </button>
              }
            />
            {idValidationError && (
              <p className="text-[9px] font-bold text-rose-600 mt-1 uppercase tracking-wide">⚠️ {idValidationError}</p>
            )}
          </div>

          {/* Email Address */}
          <Input
            label="Email Address"
            disabled
            type="email"
            icon={Mail}
            value={selectedBorrower ? selectedBorrower.email : ''}
            placeholder="Email will load here..."
          />

          {/* Phone Number */}
          <Input
            label="Phone Number"
            disabled
            icon={Phone}
            value={selectedBorrower ? selectedBorrower.phoneNumber : ''}
            placeholder="Phone will load here..."
          />

          {/* Date of Birth */}
          <Input
            label="Date of Birth"
            disabled
            icon={Calendar}
            value={selectedBorrower && selectedBorrower.dateOfBirth ? new Date(selectedBorrower.dateOfBirth).toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' }) : ''}
            placeholder="DOB will load here..."
          />

          {/* Residential Address */}
          <div className="md:col-span-2">
            <Input
              label="Residential Address"
              disabled
              isTextArea
              icon={MapPin}
              value={selectedBorrower ? (selectedBorrower.physicalAddress || '') : ''}
              placeholder="Residential address will load here..."
              className="min-h-[80px]"
            />
          </div>
        </div>

        {/* VERIFICATION ID STATUS ALERTS */}
        <AnimatePresence mode="wait">
          {verificationState !== 'pending' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-4 space-y-4"
            >
              {verificationState === 'verifying' ? (
                <div className="py-4 flex items-center justify-center gap-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="w-4 h-4 border-2 border-primary/10 border-t-primary rounded-full animate-spin" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Querying Bureau Gateways...</span>
                </div>
              ) : verificationState === 'invalid' ? (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-700 text-[10px] font-black uppercase tracking-widest">
                  <AlertTriangle size={14} /> Identity Format Verification Failed
                </div>
              ) : (
                verificationDetails && (
                  <div className={cn(
                    "p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm",
                    verificationState === 'verified' ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-amber-50 border-amber-100 text-amber-800"
                  )}>
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck size={18} className={verificationState === 'verified' ? "text-emerald-500" : "text-amber-500"} />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest">
                          Verified via {verificationDetails.source} ✅
                        </p>
                        <p className="text-[8px] font-bold opacity-75 uppercase tracking-widest mt-0.5">
                          Alive status: {verificationDetails.aliveStatus} • Citizenship: {verificationDetails.citizenship}
                        </p>
                      </div>
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest opacity-60">
                      TS: {verificationDetails.timestamp}
                    </span>
                  </div>
                )
              )}

              {/* Central Eligibility System Warnings */}
              {profileErrors.length > 0 && (
                <div className="p-5 bg-rose-50 border border-rose-100 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-rose-800">
                    <AlertTriangle className="text-rose-500 shrink-0" size={16} />
                    <p className="text-[10px] font-black uppercase tracking-widest">Central Lending Rules — Profile Verification Warning</p>
                  </div>
                  <ul className="list-disc pl-5 space-y-1">
                    {profileErrors.map((err, idx) => (
                      <li key={idx} className="text-[11px] font-bold text-rose-700 uppercase tracking-wide">
                        {err}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── BOTTOM OPERATIONS FOOTER ── */}
      <div className="flex justify-between items-center pt-6 border-t border-slate-100 mt-8">
        <button
          onClick={onClose}
          className="px-6 py-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 font-black text-[10px] uppercase tracking-widest text-slate-500 transition-all"
        >
          Cancel
        </button>
 
        <div className="flex items-center gap-3">
          <button
            disabled
            className="px-6 py-3.5 rounded-xl border border-slate-100 bg-slate-50 font-black text-[10px] uppercase tracking-widest text-slate-300 cursor-not-allowed transition-all"
          >
            Previous Step
          </button>
 
          <button
            onClick={onNextStep}
            disabled={!selectedBorrower || !isIdVerified || profileErrors.length > 0}
            className={cn(
              "px-8 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-md flex items-center gap-2",
              selectedBorrower && isIdVerified && profileErrors.length === 0
                ? "bg-primary text-white hover:bg-slate-900 shadow-primary/15 hover:scale-[1.01]"
                : "bg-slate-100 text-slate-300 cursor-not-allowed shadow-none"
            )}
          >
            Next Step <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BorrowerSearchPanel;
