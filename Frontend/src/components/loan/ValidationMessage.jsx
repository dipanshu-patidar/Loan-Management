import React from 'react';
import { AlertCircle } from 'lucide-react';

const ValidationMessage = ({ message }) => {
  if (!message) return null;
  return (
    <div className="flex items-center gap-2 mt-2 text-rose-500 animate-in fade-in slide-in-from-top-1">
      <AlertCircle size={12} />
      <span className="text-[10px] font-bold tracking-wide uppercase">{message}</span>
    </div>
  );
};

export default ValidationMessage;
