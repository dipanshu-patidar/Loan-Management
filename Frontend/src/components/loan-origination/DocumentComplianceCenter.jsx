import React, { useState } from 'react';
import { ArrowRight, ShieldCheck, Check, RefreshCw, ShieldAlert, Sparkles, FileCheck, Eye, HelpCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';

const DocumentComplianceCenter = ({ documents, activeBorrower, onNextStep, onPrevStep }) => {
  const [auditing, setAuditing] = useState(false);
  const [auditComplete, setAuditComplete] = useState(false);
  const [complianceScore, setComplianceScore] = useState(0);

  const [auditMetrics, setAuditMetrics] = useState({
    ocrStatus: 'Awaiting Scan',
    faceMatch: 'Awaiting Image',
    docMatch: 'Awaiting Validation',
    fraudFlags: 'Awaiting Check',
    complianceScore: 0
  });

  const runComplianceAudit = () => {
    setAuditing(true);
    setAuditComplete(false);
    
    // Simulate multi-tier OCR and fraud analysis
    setTimeout(() => {
      setAuditMetrics({
        ocrStatus: 'Passed - 100% Name Match ✅',
        faceMatch: 'Passed - 97.4% Match confidence ✅',
        docMatch: 'Passed - Verified South African format ✅',
        fraudFlags: 'Passed - Checked PEP & AML Clean ✅',
        complianceScore: 98
      });
      setComplianceScore(98);
      setAuditing(false);
      setAuditComplete(true);
    }, 2000);
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: UPLOADED DOCUMENTS & OCR DESK (7/12 grid span) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-soft space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
              <FileCheck size={16} className="text-primary" />
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">OCR Document Extractor Desk</h4>
            </div>

            <div className="space-y-4">
              {documents.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed">
                  <p className="text-xs font-bold">No documents uploaded in Step 2. Please go back and upload KYC documents.</p>
                </div>
              ) : (
                documents.map((doc) => (
                  <div 
                    key={doc.type}
                    className="p-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/50 rounded-2xl flex items-center justify-between group transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/5 flex items-center justify-center text-primary font-black text-xs">
                        {doc.type.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-800 uppercase tracking-wider">{doc.type}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5 max-w-[200px] truncate">{doc.fileName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {auditComplete ? (
                        <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-1">
                          <Check size={10} /> OCR Scanned
                        </span>
                      ) : auditing ? (
                        <span className="bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                          <Loader2 size={10} className="animate-spin text-primary" /> Scanning OCR...
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-400 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-slate-200/20">
                          Awaiting Audit
                        </span>
                      )}
                      <a 
                        href={doc.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-white border border-slate-200/60 text-slate-500 hover:text-primary hover:border-primary/20 transition-all shadow-sm"
                      >
                        <Eye size={12} />
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-soft space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
              <Sparkles size={16} className="text-primary" />
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">Compliance & Anti-Fraud Engine</h4>
            </div>

            <button
              onClick={runComplianceAudit}
              disabled={auditing || documents.length === 0}
              className={cn(
                "w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow flex items-center justify-center gap-2",
                auditing 
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                  : documents.length > 0 
                    ? "bg-slate-900 text-white hover:bg-primary shadow-slate-900/10 hover:scale-[1.005]" 
                    : "bg-slate-100 text-slate-300 cursor-not-allowed shadow-none"
              )}
            >
              {auditing ? (
                <>
                  <RefreshCw size={14} className="animate-spin" /> Verifying Document Signatures & Integrity...
                </>
              ) : (
                <>
                  <ShieldCheck size={16} /> Run Automated Compliance & Fraud Check
                </>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: COMPLIANCE MONITOR PANEL (5/12 grid span) */}
        <div className="lg:col-span-5">
          <div className="sticky top-6 bg-slate-900 border border-slate-800 text-white p-6 rounded-3xl shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                KYC Compliance Panel <HelpCircle size={12} className="text-slate-500" />
              </span>
              <span className={cn(
                "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                auditComplete ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-slate-800 border-slate-700 text-slate-400"
              )}>
                {auditComplete ? 'Complete' : 'Pending'}
              </span>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">OCR Name Match</p>
                <p className={cn("font-bold mt-0.5", auditComplete ? "text-emerald-400" : "text-slate-400")}>
                  {auditMetrics.ocrStatus}
                </p>
              </div>

              <div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">DHA Facial Biometric Check</p>
                <p className={cn("font-bold mt-0.5", auditComplete ? "text-emerald-400" : "text-slate-400")}>
                  {auditMetrics.faceMatch}
                </p>
              </div>

              <div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">ID Checksum Validation</p>
                <p className={cn("font-bold mt-0.5", auditComplete ? "text-emerald-400" : "text-slate-400")}>
                  {auditMetrics.docMatch}
                </p>
              </div>

              <div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Bureau Fraud / PEP Alert Check</p>
                <p className={cn("font-bold mt-0.5", auditComplete ? "text-emerald-400" : "text-slate-400")}>
                  {auditMetrics.fraudFlags}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Auto Compliance Score</p>
                <p className="text-3xl font-black text-white mt-1">
                  {complianceScore} <span className="text-xs text-slate-400">/ 100</span>
                </p>
              </div>

              {auditComplete && complianceScore >= 95 && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-2 rounded-2xl text-[10px] font-bold text-center">
                  Highly Recommended<br />
                  <span className="text-[8px] opacity-80 uppercase tracking-widest">Low Risk Profile ✅</span>
                </div>
              )}
            </div>

            {auditComplete && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 rounded-2xl text-[10px] flex items-start gap-2">
                <ShieldCheck size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <p>All KYC verification checks have passed successfully. The file is ready for formal risk team review.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* FOOTER NAV BUTTONS */}
      <div className="flex justify-between items-center pt-4 border-t border-slate-100">
        <button
          onClick={onPrevStep}
          className="px-6 py-4 rounded-2xl border border-slate-200 hover:bg-slate-50 font-black text-xs uppercase tracking-widest text-slate-600 transition-colors"
        >
          Previous Step
        </button>
        <button
          onClick={onNextStep}
          disabled={!auditComplete}
          className={cn(
            "px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-md flex items-center gap-2",
            auditComplete
              ? "bg-slate-900 text-white hover:bg-primary shadow-slate-900/15 hover:scale-[1.01]"
              : "bg-slate-100 text-slate-300 cursor-not-allowed shadow-none"
          )}
        >
          Proceed to Summary Review <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default DocumentComplianceCenter;
