import { useState } from 'react';
import { Upload, FileCheck, RefreshCw, X, RotateCcw, Clock, AlertCircle, Shield } from 'lucide-react';
import { cn } from '../../utils/cn';
import BorrowerLoanService from '../../services/BorrowerLoanService';
import { toast } from 'react-hot-toast';

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatUploadTime = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
};

const getFileExtLabel = (fileName) => {
  if (!fileName) return 'FILE';
  return fileName.split('.').pop()?.toUpperCase() || 'FILE';
};

const UploadDocumentCard = ({
  label,
  desc,
  type,
  onUploadSuccess,
  onRemove,
  existingFile,
  existingFileData,
}) => {
  const initData = existingFileData || null;
  const initName = initData?.fileName || existingFile || null;

  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState(initName);
  const [fileData, setFileData] = useState(initData);
  const [error, setError] = useState(null);

  const inputId = `file-upload-${type.replace(/\s+/g, '-')}`;

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Invalid file type. Only PDF, JPG, PNG allowed.');
      e.target.value = '';
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      setError('File too large. Maximum size is 10MB.');
      e.target.value = '';
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

      const uploadedData = {
        type,
        url: res.data.url,
        fileId: res.data.fileId,
        fileName: file.name,
        fileSize: res.data.fileSize,
        uploadedAt: new Date().toISOString(),
      };

      setFileName(file.name);
      setFileData(uploadedData);
      toast.success(`${label} uploaded successfully!`);
      if (onUploadSuccess) onUploadSuccess(uploadedData);
    } catch {
      setError('Upload failed. Please try again.');
      toast.error('Upload failed. Try again.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setFileName(null);
    setFileData(null);
    setError(null);
    if (onRemove) onRemove(type);
  };

  const handleReplace = (e) => {
    e.stopPropagation();
    document.getElementById(inputId).click();
  };

  // ── Uploaded state ──────────────────────────────────────────────
  if (fileName && fileData) {
    return (
      <div className="p-6 border border-emerald-200 bg-emerald-50/30 rounded-[2.5rem] flex flex-col gap-4">
        <input
          type="file"
          id={inputId}
          className="hidden"
          onChange={handleFileChange}
          accept=".pdf,.jpg,.jpeg,.png"
        />

        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
              <FileCheck size={22} />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-black text-slate-900 truncate">{label}</h4>
              <p className="text-[10px] font-bold text-emerald-600">Upload Successful</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="w-7 h-7 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-all shrink-0"
          >
            <X size={14} />
          </button>
        </div>

        {/* File info card */}
        <div className="bg-white rounded-2xl p-4 border border-emerald-100 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-black text-slate-700 truncate flex-1">{fileName}</p>
            <span className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest shrink-0">
              {getFileExtLabel(fileName)}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] font-medium text-slate-400">
            {fileData.fileSize ? <span>{formatFileSize(fileData.fileSize)}</span> : <span />}
            {fileData.uploadedAt && (
              <div className="flex items-center gap-1">
                <Clock size={10} />
                <span>Uploaded {formatUploadTime(fileData.uploadedAt)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Verification pending badge */}
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl">
          <Shield size={12} className="text-amber-500 shrink-0" />
          <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">
            Verification Pending
          </span>
        </div>

        {/* Replace button */}
        <button
          type="button"
          onClick={handleReplace}
          disabled={isUploading}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-60"
        >
          {isUploading ? (
            <RefreshCw size={12} className="animate-spin" />
          ) : (
            <RotateCcw size={12} />
          )}
          {isUploading ? `Replacing… ${progress}%` : 'Replace File'}
        </button>

        {isUploading && (
          <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    );
  }

  // ── Empty / upload state ─────────────────────────────────────────
  return (
    <div className="flex flex-col gap-2">
      <div
        onClick={() => !isUploading && document.getElementById(inputId).click()}
        className={cn(
          'p-8 border-2 border-dashed rounded-[2.5rem] flex flex-col items-center text-center gap-4 group transition-all cursor-pointer',
          error
            ? 'border-red-200 bg-red-50/30'
            : 'border-slate-200 bg-slate-50/50 hover:border-primary/40 hover:bg-white',
          isUploading && 'opacity-70 pointer-events-none',
        )}
      >
        <input
          type="file"
          id={inputId}
          className="hidden"
          onChange={handleFileChange}
          accept=".pdf,.jpg,.jpeg,.png"
        />

        <div
          className={cn(
            'w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-all',
            error
              ? 'bg-red-50 text-red-400'
              : 'bg-white text-slate-400 group-hover:text-primary',
          )}
        >
          {isUploading ? (
            <RefreshCw size={24} className="animate-spin" />
          ) : error ? (
            <AlertCircle size={24} />
          ) : (
            <Upload size={24} />
          )}
        </div>

        <div>
          <h4 className="text-sm font-black text-slate-900">{label}</h4>
          <p className="text-[10px] font-medium text-slate-400 mt-1">
            {isUploading ? `Uploading… ${progress}%` : desc}
          </p>
        </div>

        {isUploading && (
          <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <div
          className={cn(
            'px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all',
            error
              ? 'bg-red-100 text-red-600'
              : 'bg-slate-100 text-slate-500 group-hover:bg-primary group-hover:text-white',
          )}
        >
          {error ? 'Try Again' : 'Browse Files'}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-100 rounded-2xl">
          <AlertCircle size={12} className="text-red-400 shrink-0" />
          <p className="text-[10px] font-bold text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
};

export default UploadDocumentCard;
