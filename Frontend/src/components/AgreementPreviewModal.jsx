import React, { useRef, useState } from 'react';
import { ShieldCheck, Download, X, HelpCircle, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import Button from '../ui/Button';

const AgreementPreviewModal = ({ isOpen, onClose, app, agreementDetails }) => {
  const documentRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen || !app) return null;

  const data = agreementDetails || {};

  // Safe date helper to prevent RangeErrors
  const formatSafeDate = (dateVal, formatStr, fallback = '—') => {
    if (!dateVal) return fallback;
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return fallback;
      return format(d, formatStr);
    } catch (e) {
      return fallback;
    }
  };

  // Resolve calculations
  const approvedAmount = app.approvedAmount || app.requestedAmount || 0;
  const tenure = app.loanDurationMonths || app.requestedDuration || 12;
  const rate = app.interestRate || 12.5;
  const processingFee = app.processingFee || Math.round(approvedAmount * 0.03) || 500;
  const disbursementAmount = approvedAmount - processingFee;
  
  // Calculate EMI & Total Repayments
  const monthlyRate = rate / 12 / 100;
  const emiAmount = app.estimatedMonthlyEMI || Math.round(
    (approvedAmount * monthlyRate * Math.pow(1 + monthlyRate, tenure)) /
    (Math.pow(1 + monthlyRate, tenure) - 1)
  ) || 0;
  const totalRepayment = emiAmount * tenure;

  // Format Agreement ID & Dates
  const agreementYear = formatSafeDate(app.agreementGeneratedAt || app.submittedAt, 'yyyy', new Date().getFullYear().toString());
  const rawId = app.applicationId || '000000';
  const shortId = rawId.split('-').pop() || rawId.slice(-6);
  const agreementId = `AG-${agreementYear}-${shortId}`;
  
  const agreementDateStr = formatSafeDate(app.agreementGeneratedAt || app.submittedAt, 'dd MMMM yyyy');

  // Consent logs
  const isSigned = 
    app.status === 'READY_FOR_DISBURSEMENT' || 
    app.status === 'AGREEMENT_SIGNED' || 
    app.status === 'OTP_VERIFIED' || 
    app.status === 'Approved' || 
    app.status === 'APPROVED' || 
    app.loanStatus === 'Active' || 
    app.loanStatus === 'ACTIVE' || 
    app.loanStatus === 'Completed' || 
    app.loanStatus === 'Closed' || 
    app.agreementStatus === 'Signed' || 
    app.agreementStatus === 'SIGNED' || 
    !!app.agreementSignedAt;
  const consentStatus = isSigned ? 'VERIFIED & COMPLETED' : 'PENDING BORROWER OTP SIGNATURE';
  const statusLabel = isSigned ? 'SIGNED' : 'PENDING';
  
  const verifiedOnStr = formatSafeDate(app.agreementSignedAt, 'dd MMMM yyyy, hh:mm:ss a');

  // Robust Download Action using high-res scrolling-aware html2canvas rendering
  const handleDownloadPdf = async () => {
    try {
      setIsExporting(true);
      const element = documentRef.current;
      if (!element) {
        alert("Printable agreement document element was not found in the DOM.");
        return;
      }

      // Temporarily override styling for high quality render
      const originalStyle = element.style.cssText;
      element.style.transform = 'scale(1)';
      element.style.boxShadow = 'none';

      // Set high scale to prevent pixelation inside A4 Aspect Ratio
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        scrollX: 0,
        scrollY: -window.scrollY, // Correct viewport displacement when page is scrolled down
        windowWidth: document.documentElement.offsetWidth,
        windowHeight: document.documentElement.offsetHeight,
        backgroundColor: '#FFFFFF',
        logging: false,
      });

      // Restore styling
      element.style.cssText = originalStyle;

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      // Standard A4 dimensions in px at 72dpi: 595 x 842. We'll use mm values: 210 x 297
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      pdf.save(`Point47_Loan_Agreement_${app.applicationId}.pdf`);
    } catch (error) {
      console.error('Failed to export agreement PDF:', error);
      alert('Error generating PDF document: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-[850px] rounded-3xl shadow-2xl flex flex-col my-8 border border-slate-100 max-h-[90vh]">
        
        {/* Header toolbar */}
        <div className="px-8 py-5 border-b border-slate-50 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Loan Agreement Document</h3>
            <p className="text-xs text-slate-400 font-medium">Verify terms, conditions, and secure OTP receipt signature details.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest px-5 shadow-lg shadow-primary/10 bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {isExporting ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Exporting PDF...
                </>
              ) : (
                <>
                  <Download size={14} /> Download PDF
                </>
              )}
            </Button>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Preview Area */}
        <div className="flex-1 p-8 overflow-y-auto bg-slate-50/50">
          
          {/* Printable Element matches standard A4 Ratio perfectly */}
          <div
            ref={documentRef}
            className="w-[794px] min-h-[1123px] bg-white border border-slate-200/60 shadow-lg mx-auto p-12 text-slate-800 relative flex flex-col justify-between overflow-hidden leading-relaxed shrink-0 text-left font-sans select-none"
            style={{ boxSizing: 'border-box' }}
          >
            {/* Top Wave Arc design in Brand Colors */}
            <div className="absolute top-0 right-0 left-0 h-40 overflow-hidden pointer-events-none">
              <svg width="100%" height="100%" viewBox="0 0 794 150" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                <path d="M0 0 H794 V80 C650 140 450 60 0 100 Z" fill="#0B2545" />
                <path d="M350 0 C500 80 650 40 794 95 V0 Z" fill="#134074" />
                <path d="M480 0 C600 50 700 20 794 65 V0 Z" fill="#EEB902" opacity="0.8" />
              </svg>
            </div>

            {/* Core Header section */}
            <div className="relative z-10 flex items-start justify-between mt-4">
              {/* Point.47 Brand Logo */}
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-slate-100">
                  <div className="w-11 h-11 bg-gradient-to-tr from-slate-900 to-[#134074] text-white rounded-xl flex items-center justify-center font-black text-xl border-2 border-amber-400">
                    47
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight leading-none">Point.47</h2>
                  <p className="text-[9px] font-black text-amber-300 tracking-[0.25em] uppercase leading-none mt-1.5 pl-0.5">Finance</p>
                </div>
              </div>

              {/* Header Titles */}
              <div className="text-right">
                <h1 className="text-xl font-black text-white tracking-tight leading-none">LOAN AGREEMENT</h1>
                <h2 className="text-[12px] font-black text-amber-300 tracking-wider uppercase mt-1.5 leading-none">&amp; SIGNATURE RECEIPT</h2>
                <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mt-4">
                  DATE OF AGREEMENT: <span className="text-white font-black">{agreementDateStr}</span>
                </p>
              </div>
            </div>

            {/* Agreement ID & Subheader */}
            <div className="relative z-10 mt-14 flex items-center justify-between border-b border-slate-100 pb-5">
              <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0B2545] text-white rounded-xl text-[10px] font-black tracking-widest uppercase">
                <ShieldCheck size={14} className="text-amber-400" />
                Agreement ID: {agreementId}
              </span>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Lender: Point.47 Finance Pty Ltd
              </p>
            </div>

            {/* Intro paragraph */}
            <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed mt-5">
              This Loan Agreement (&quot;Agreement&quot;) is made and entered into between Point.47 Finance (&quot;Lender&quot;) and the Borrower named below.
              By digitally signing this agreement using secure email OTP verification, the Borrower explicitly acknowledges, consents, and agrees to the terms and conditions outlined herein.
            </p>

            {/* Two Column details grid */}
            <div className="grid grid-cols-12 gap-6 mt-6">
              
              {/* BORROWER DETAILS COLUMN */}
              <div className="col-span-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <span className="w-1.5 h-4 bg-primary rounded-full" />
                  <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-wider">Borrower Details</h3>
                </div>
                
                <table className="w-full text-[11px] font-medium text-slate-600">
                  <tbody>
                    <tr className="h-7">
                      <td className="w-32 font-bold uppercase tracking-wider text-slate-400 text-[9px]">Borrower Name</td>
                      <td className="w-4 font-bold text-slate-300">:</td>
                      <td className="font-black text-slate-800">{app.fullName}</td>
                    </tr>
                    <tr className="h-7">
                      <td className="font-bold uppercase tracking-wider text-slate-400 text-[9px]">Email Address</td>
                      <td className="font-bold text-slate-300">:</td>
                      <td className="font-bold text-slate-700">{app.emailAddress}</td>
                    </tr>
                    <tr className="h-7">
                      <td className="font-bold uppercase tracking-wider text-slate-400 text-[9px]">Mobile Number</td>
                      <td className="font-bold text-slate-300">:</td>
                      <td className="font-bold text-slate-700">{app.phoneNumber}</td>
                    </tr>
                    <tr className="h-7">
                      <td className="font-bold uppercase tracking-wider text-slate-400 text-[9px]">ID Number</td>
                      <td className="font-bold text-slate-300">:</td>
                      <td className="font-bold text-slate-700">{app.idNumber}</td>
                    </tr>
                    <tr className="h-7">
                      <td className="font-bold uppercase tracking-wider text-slate-400 text-[9px]">Application ID</td>
                      <td className="font-bold text-slate-300">:</td>
                      <td className="font-black text-primary">{app.applicationId}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* LOAN SUMMARY COLUMN */}
              <div className="col-span-6 bg-slate-50/50 rounded-2xl border border-slate-100 p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-200/50 pb-2">
                  <span className="w-1.5 h-4 bg-[#EEB902] rounded-full" />
                  <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-wider">Loan Summary</h3>
                </div>

                <table className="w-full text-[11px] font-medium text-slate-600">
                  <tbody>
                    <tr className="h-6">
                      <td className="font-bold uppercase tracking-wider text-slate-400 text-[8.5px]">Approved Amount</td>
                      <td className="w-4 font-bold text-slate-300">:</td>
                      <td className="font-black text-slate-900">R {Number(approvedAmount).toLocaleString()}</td>
                    </tr>
                    <tr className="h-6">
                      <td className="font-bold uppercase tracking-wider text-slate-400 text-[8.5px]">Interest Rate (PA)</td>
                      <td className="font-bold text-slate-300">:</td>
                      <td className="font-black text-slate-700">{rate.toFixed(2)}%</td>
                    </tr>
                    <tr className="h-6">
                      <td className="font-bold uppercase tracking-wider text-slate-400 text-[8.5px]">Loan Tenure</td>
                      <td className="font-bold text-slate-300">:</td>
                      <td className="font-bold text-slate-700">{tenure} Months</td>
                    </tr>
                    <tr className="h-6">
                      <td className="font-bold uppercase tracking-wider text-slate-400 text-[8.5px]">Processing Fee</td>
                      <td className="font-bold text-slate-300">:</td>
                      <td className="font-bold text-slate-700">R {Number(processingFee).toLocaleString()}</td>
                    </tr>
                    <tr className="h-6 border-b border-slate-200/50 pb-1">
                      <td className="font-bold uppercase tracking-wider text-slate-400 text-[8.5px]">Disbursement Amt</td>
                      <td className="font-bold text-slate-300">:</td>
                      <td className="font-black text-slate-800">R {Number(disbursementAmount).toLocaleString()}</td>
                    </tr>
                    <tr className="h-7 pt-1">
                      <td className="font-bold uppercase tracking-wider text-slate-500 text-[9px]">EMI Amount</td>
                      <td className="font-bold text-slate-300">:</td>
                      <td className="font-black text-primary text-xs">R {Number(emiAmount).toLocaleString()}</td>
                    </tr>
                    <tr className="h-6">
                      <td className="font-bold uppercase tracking-wider text-slate-500 text-[9px]">Total Repayment</td>
                      <td className="font-bold text-slate-300">:</td>
                      <td className="font-black text-[#0B2545]">R {Number(totalRepayment).toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>

            {/* LOAN PURPOSE */}
            <div className="mt-5 border-t border-slate-100 pt-4 flex items-center gap-3">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Loan Purpose:</span>
              <span className="px-3.5 py-1.5 bg-slate-100 border border-slate-200/50 rounded-xl text-[10px] font-bold text-slate-700">
                {app.loanType || 'Personal Consumption'}
              </span>
            </div>

            {/* LOAN TERMS & CONDITIONS */}
            <div className="mt-5 space-y-3.5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="w-1.5 h-4 bg-primary rounded-full" />
                <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-wider">Loan Terms &amp; Conditions</h3>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-2.5 text-[10px] font-bold text-slate-500">
                <div className="flex items-start gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">✓</span>
                  <p className="leading-tight">The loan amount will be disbursed to the borrower&apos;s registered bank account upon agreement signature.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">✓</span>
                  <p className="leading-tight">The interest rate is fixed for the entire tenure of the loan.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">✓</span>
                  <p className="leading-tight">The borrower agrees to repay the loan in equal monthly instalments (EMIs) on or before the due date.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">✓</span>
                  <p className="leading-tight">Foreclosure is allowed as per company policy.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">✓</span>
                  <p className="leading-tight">A late payment fee and additional charges may apply on overdue instalments.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">✓</span>
                  <p className="leading-tight">The borrower declares that all information provided is true and accurate.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">✓</span>
                  <p className="leading-tight">This is a system generated agreement and does not require physical signature.</p>
                </div>
              </div>
            </div>

            {/* DIGITAL VERIFICATION & CONSENT BLOCK (YELLOW CARD) */}
            <div className="mt-5 p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80">
              <div className="flex items-center gap-2 border-b border-amber-200/40 pb-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Digital Verification &amp; Consent</h4>
              </div>

              <div className="grid grid-cols-12 gap-4 text-[10.5px]">
                <div className="col-span-6 space-y-2">
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-400">Signing Method</span>
                    <span className="text-slate-800 font-bold">Multi-Factor Secure OTP Consent</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-400">Consent Status</span>
                    <span className={`font-black uppercase ${isSigned ? 'text-emerald-600' : 'text-amber-500'}`}>
                      {consentStatus}
                    </span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-400">Agreement Status</span>
                    <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black ${isSigned ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {statusLabel}
                    </span>
                  </div>
                </div>

                <div className="col-span-6 border-l border-amber-200/40 pl-5 space-y-2">
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-400">OTP Verified On</span>
                    <span className="text-slate-800 font-black">{verifiedOnStr}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-400">IP Address</span>
                    <span className="text-slate-800 font-bold">{app.verificationIp || '196.25.255.250'}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-400">Device / Browser</span>
                    <span className="text-slate-800 font-bold truncate max-w-[150px]" title={app.verificationUserAgent || 'Chrome / Windows'}>
                      {app.verificationUserAgent || 'Chrome / Windows'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Legal Consent Acknowledgement Box */}
            <div className="mt-4 p-3.5 bg-slate-50 border border-slate-100 rounded-xl flex items-start gap-3 text-[9.5px] font-bold text-slate-500 leading-relaxed">
              <span className="w-5 h-5 rounded-lg bg-white shadow-sm border border-slate-100 flex items-center justify-center shrink-0">✍️</span>
              <p>
                By entering the OTP sent to my registered mobile number and email, I hereby agree to the terms and conditions of this loan agreement and authorize Point.47 Finance to disburse the loan amount.
              </p>
            </div>

            {/* Stamp & Footer Area */}
            <div className="mt-5 grid grid-cols-12 gap-4 items-end border-t border-slate-100 pt-5">
              
              {/* Circular authorized stamp */}
              <div className="col-span-3 flex justify-start pl-2">
                <div className="w-20 h-20 rounded-full border-4 border-dashed border-primary/20 flex items-center justify-center relative select-none">
                  <div className="w-16 h-16 rounded-full border-2 border-primary/40 flex flex-col items-center justify-center text-primary font-black text-center leading-none uppercase rotate-[-12deg]">
                    <span className="text-[5.5px] tracking-widest">POINT.47</span>
                    <span className="text-[8px] font-black my-0.5 tracking-wider">AUTHORIZED</span>
                    <span className="text-[5px] tracking-widest">***</span>
                  </div>
                </div>
              </div>

              {/* Signatory line */}
              <div className="col-span-5 space-y-1.5 border-r border-slate-100 pr-4">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">For Point.47 Finance</p>
                <div className="relative h-9 flex items-end">
                  <span className="font-serif italic text-2xl text-primary/75 font-semibold tracking-wide select-none transform rotate-[-2deg] pl-2 leading-none">
                    Aander
                  </span>
                </div>
                <div className="border-t border-slate-200 w-full pt-1.5">
                  <p className="text-[9px] font-black text-slate-800 leading-none">Authorized Signatory</p>
                  <p className="text-[7.5px] font-bold text-slate-400 mt-1">Point.47 Finance Pty Ltd • Date: {agreementDateStr}</p>
                </div>
              </div>

              {/* Need Help contact box */}
              <div className="col-span-4 bg-[#0B2545] rounded-2xl p-4 text-white space-y-2">
                <div className="flex items-center gap-1.5 border-b border-white/10 pb-1.5">
                  <HelpCircle size={12} className="text-amber-400" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Need Help?</span>
                </div>
                <div className="space-y-1 text-[8.5px] font-medium text-white/70">
                  <p>✉ support@point47.com</p>
                  <p>☎ +27 11 456 7890</p>
                  <p>🌐 www.point47.com</p>
                </div>
              </div>

            </div>

            {/* Bottom Navy Thank You Strip */}
            <div className="absolute bottom-0 right-0 left-0 bg-[#0B2545] py-2.5 text-center text-white/50 text-[8px] font-black tracking-widest uppercase">
              Thank you for choosing Point.47 Finance
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default AgreementPreviewModal;
