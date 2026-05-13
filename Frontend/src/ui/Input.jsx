import React from 'react';
import { cn } from '../utils/cn';

const Input = React.forwardRef(({ className, label, error, isTextArea, type, children, icon: Icon, rightElement, ...props }, ref) => {
  const isSelect = type === 'select';
  const Component = isTextArea ? 'textarea' : isSelect ? 'select' : 'input';
  
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1 ml-1">
          {label}
        </label>
      )}
      <div className="relative group flex items-center">
        {/* PREFIX ICON */}
        {Icon && (
          <div className={cn(
            "absolute left-4 text-slate-400 group-focus-within:text-primary transition-colors z-10 flex items-center justify-center",
            isTextArea ? "top-4" : "inset-y-0"
          )}>
            <Icon size={18} />
          </div>
        )}
        
        <Component
          ref={ref}
          type={isSelect || isTextArea ? undefined : type}
          rows={isTextArea ? 3 : undefined}
          className={cn(
            "w-full rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all bg-slate-50/50 text-slate-900 placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-500 text-sm",
            "py-3", // Standard padding
            Icon ? "pl-12" : "pl-4", // Extra left padding if icon exists
            rightElement ? "pr-12" : "pr-4", // Extra right padding if rightElement exists
            error && "border-rose-500 focus:ring-rose-200 focus:border-rose-500",
            className
          )}
          {...props}
        >
          {children}
        </Component>

        {/* SUFFIX / RIGHT ELEMENT (e.g. Eye Toggle) */}
        {rightElement && (
          <div className={cn(
            "absolute right-4 text-slate-400 flex items-center justify-center z-10",
            isTextArea ? "top-4" : "inset-y-0"
          )}>
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs font-medium text-rose-500 ml-1">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
