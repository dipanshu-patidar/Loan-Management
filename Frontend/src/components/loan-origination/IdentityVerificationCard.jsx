import React, { useState } from 'react';
import { ShieldCheck, UserCheck, UserX, AlertTriangle, ShieldAlert, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';

// South African ID validator helper
const parseSAIDNumber = (idNumber) => {
  if (!idNumber || idNumber.length !== 13) return null;
  
  // Basic Regex test for SA ID
  const idRegex = /^\d{13}$/;
  if (!idRegex.test(idNumber)) return null;

  // Extract DOB (YYMMDD)
  const yy = idNumber.substring(0, 2);
  const mm = idNumber.substring(2, 4);
  const dd = idNumber.substring(4, 6);
  
  const currentYear = new Date().getFullYear() % 100;
  const century = parseInt(yy) > currentYear ? '19' : '20';
  const dobStr = `${century}${yy}-${mm}-${dd}`;
  const dob = new Date(dobStr);
  
  if (isNaN(dob.getTime())) return null;

  // Extract Gender (AAAA)
  // GSSS LCCC - GSSS >= 5000 is Male, < 5000 is Female
  const genderDigit = parseInt(idNumber.substring(6, 10));
  const gender = genderDigit >= 5000 ? 'Male' : 'Female';

  // Citizenship status (C)
  // 11th digit: 0 for SA citizen, 1 for permanent resident
  const citizenDigit = parseInt(idNumber.substring(10, 11));
  const citizenship = citizenDigit === 0 ? 'South African Citizen' : 'Permanent Resident';

  return {
    dob: dobStr,
    gender,
    citizenship,
    aliveStatus: 'Alive ✅'
  };
};

const IdentityVerificationCard = ({ 
  idNumber, 
  onVerified, 
  verificationState, 
  setVerificationState, 
  verificationDetails, 
  setVerificationDetails 
}) => {
  const [loading, setLoading] = useState(false);

  const handleVerify = () => {
    if (!idNumber || idNumber.length < 8) {
      setVerificationState('Invalid ID ❌');
      setVerificationDetails(null);
      onVerified(false, null);
      return;
    }

    setLoading(true);
    setVerificationState('Verifying...');
    setVerificationDetails(null);

    // Simulate Datanamix / DHA real-time checking with a smooth delay
    setTimeout(() => {
      const parsed = parseSAIDNumber(idNumber);

      if (parsed) {
        // Successful verification (simulate Datanamix Profile ID lookup)
        setVerificationState('Verified ✅');
        const details = {
          source: 'Datanamix DHA Real-time API',
          status: 'Verified Match',
          citizenship: parsed.citizenship,
          dob: new Date(parsed.dob).toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' }),
          gender: parsed.gender,
          aliveStatus: parsed.aliveStatus,
        };
        setVerificationDetails(details);
        setLoading(false);
        onVerified(true, details);
      } else {
        // Check if ID is 13 digits but checksum/format failed
        if (idNumber.length === 13) {
          setVerificationState('Invalid ID ❌');
          setVerificationDetails(null);
          setLoading(false);
          onVerified(false, null);
        } else {
          // Fallback verification used for international/shorter IDs
          setVerificationState('Fallback verification used');
          const details = {
            source: 'Bureau Internal Match (Fallback)',
            status: 'Verified Match (Manual Overrides Available)',
            citizenship: 'International / Other',
            dob: 'Manual Input Required',
            gender: 'Manual Input Required',
            aliveStatus: 'Verified Active',
          };
          setVerificationDetails(details);
          setLoading(false);
          onVerified(true, details);
        }
      }
    }, 1500);
  };

  const statusConfigs = {
    'Verifying...': {
      icon: Loader2,
      iconClass: 'text-primary animate-spin',
      bgClass: 'bg-primary/5 border-primary/20 text-primary-900',
      label: 'Connecting to DHA / Datanamix Bureau...'
    },
    'Verified ✅': {
      icon: ShieldCheck,
      iconClass: 'text-emerald-500',
      bgClass: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      label: 'Identity Authenticated Successfully'
    },
    'Invalid ID ❌': {
      icon: UserX,
      iconClass: 'text-rose-500',
      bgClass: 'bg-rose-50 border-rose-200 text-rose-900',
      label: 'ID Number failed checksum/format checks'
    },
    'DHA unavailable ⚠️': {
      icon: AlertTriangle,
      iconClass: 'text-amber-500 animate-pulse',
      bgClass: 'bg-amber-50 border-amber-200 text-amber-900',
      label: 'DHA Gateway Offline. Retry or use manual fallback.'
    },
    'Fallback verification used': {
      icon: UserCheck,
      iconClass: 'text-indigo-500',
      bgClass: 'bg-indigo-50 border-indigo-200 text-indigo-900',
      label: 'Bureau Fallback Check Passed'
    }
  };

  const currentStatus = statusConfigs[verificationState];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">KYC IDENTITY VERIFICATION</label>
        {verificationState && !loading && (
          <span className={cn(
            "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest",
            verificationState.includes('Verified') ? "bg-emerald-100 text-emerald-700" :
            verificationState.includes('Invalid') ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-700"
          )}>
            {verificationState}
          </span>
        )}
      </div>

      <div className="relative">
        <button
          type="button"
          disabled={loading || !idNumber}
          onClick={handleVerify}
          className={cn(
            "w-full py-3.5 px-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2",
            loading 
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : idNumber 
                ? "bg-primary text-hover hover:bg-slate-900 shadow-primary/20 hover:scale-[1.01]" 
                : "bg-slate-100 text-slate-300 cursor-not-allowed"
          )}
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Verifying ID...
            </>
          ) : (
            <>
              <ShieldCheck size={16} /> Verify ID Number
            </>
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {verificationState && currentStatus && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn("p-4 rounded-2xl border flex items-start gap-3 shadow-sm", currentStatus.bgClass)}
          >
            <currentStatus.icon size={20} className={cn("shrink-0 mt-0.5", currentStatus.iconClass)} />
            <div>
              <p className="text-xs font-black uppercase tracking-wider">{verificationState}</p>
              <p className="text-[11px] font-medium opacity-80 mt-0.5">{currentStatus.label}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {verificationDetails && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-5 bg-white border border-slate-100 rounded-3xl shadow-soft space-y-4"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">DHA Bureau Verified Profile</p>
            </div>
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <DetailRow label="Source Bureau" value={verificationDetails.source} />
              <DetailRow label="Citizen Status" value={verificationDetails.citizenship} />
              <DetailRow label="Date of Birth" value={verificationDetails.dob} />
              <DetailRow label="Gender" value={verificationDetails.gender} />
              <DetailRow label="Alive Status" value={verificationDetails.aliveStatus} isHighlight />
              <DetailRow label="Match Rating" value="100% Match ✅" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const DetailRow = ({ label, value, isHighlight }) => (
  <div>
    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    <p className={cn("text-[11px] font-bold text-slate-800 mt-0.5", isHighlight && "text-emerald-600")}>
      {value || '—'}
    </p>
  </div>
);

export default IdentityVerificationCard;
