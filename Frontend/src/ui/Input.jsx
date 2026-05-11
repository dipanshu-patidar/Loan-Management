import React from 'react';
import { cn } from '../utils/cn';

const Input = React.forwardRef(({ className, label, error, isTextArea, type, children, ...props }, ref) => {
  const isSelect = type === 'select';
  const Component = isTextArea ? 'textarea' : isSelect ? 'select' : 'input';
  
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          {label}
        </label>
      )}
      <Component
        ref={ref}
        type={isSelect || isTextArea ? undefined : type}
        rows={isTextArea ? 3 : undefined}
        className={cn(
          "w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all bg-slate-50/50 text-slate-900 placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-500 text-sm",
          error && "border-rose-500 focus:ring-rose-200 focus:border-rose-500",
          className
        )}
        {...props}
      >
        {children}
      </Component>
      {error && (
        <p className="text-xs font-medium text-rose-500">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
