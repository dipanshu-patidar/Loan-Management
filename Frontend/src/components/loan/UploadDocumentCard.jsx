import React, { useState } from 'react';
import { Upload, FileCheck, RefreshCw } from 'lucide-react';
import { cn } from '../../utils/cn';
import BorrowerLoanService from '../../services/BorrowerLoanService';
import { toast } from 'react-hot-toast';

const UploadDocumentCard = ({ label, desc, type, applicationId, onUploadSuccess, existingFile }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState(existingFile || null);
  const inputId = `file-upload-${type}`;

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowed.includes(file.type)) {
      toast.error('Invalid file type. Only PDF, JPG, PNG allowed.');
      return;
    }

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Max 10MB.');
      return;
    }

    setIsUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await BorrowerLoanService.uploadDocumentOnly(formData, (event) => {
        const percent = Math.round((event.loaded * 100) / event.total);
        setProgress(percent);
      });
      setFileName(file.name);
      toast.success(`${label} uploaded!`);
      if (onUploadSuccess) onUploadSuccess({
        type,
        url: res.data.url,
        fileId: res.data.fileId,
        fileName: res.data.fileName,
        fileSize: res.data.fileSize
      });

    } catch (error) {
      toast.error('Upload failed. Try again.');
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div 
      onClick={() => !isUploading && document.getElementById(inputId).click()}
      className={cn(
        "p-8 border-2 border-dashed rounded-[2.5rem] flex flex-col items-center text-center gap-4 group transition-all cursor-pointer",
        fileName 
          ? "border-emerald-200 bg-emerald-50/30" 
          : "border-slate-200 bg-slate-50/50 hover:border-primary/40 hover:bg-white",
        isUploading && "opacity-70 pointer-events-none"
      )}
    >
      <input 
        type="file" 
        id={inputId} 
        className="hidden" 
        onChange={handleFileChange}
        accept=".pdf,.jpg,.jpeg,.png"
      />
      <div className={cn(
        "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-all",
        fileName 
          ? "bg-emerald-500 text-white scale-110 shadow-lg shadow-emerald-500/20" 
          : "bg-white text-slate-400 group-hover:text-primary"
      )}>
        {isUploading ? (
          <RefreshCw size={24} className="animate-spin" />
        ) : fileName ? (
          <FileCheck size={24} />
        ) : (
          <Upload size={24} />
        )}
      </div>
      <div>
        <h4 className="text-sm font-black text-slate-900">{fileName || label}</h4>
        <p className="text-[10px] font-medium text-slate-400 mt-1">
          {isUploading ? `Uploading... ${progress}%` : fileName ? "File uploaded successfully" : desc}
        </p>
      </div>
      {isUploading && (
        <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
          <div className="bg-primary h-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      )}
      <div className={cn(
        "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
        fileName 
          ? "bg-emerald-100 text-emerald-600" 
          : "bg-slate-100 text-slate-500 group-hover:bg-primary group-hover:text-white"
      )}>
        {fileName ? "Change File" : "Browse Files"}
      </div>
    </div>
  );
};

export default UploadDocumentCard;
