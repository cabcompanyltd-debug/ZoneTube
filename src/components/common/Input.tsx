import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, error, icon, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">{label}</label>}
      <div className="relative flex items-center">
        {icon && <span className="absolute left-3.5 text-zinc-400">{icon}</span>}
        <input
          className={`w-full bg-[#151821] border border-white/10 rounded-lg py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[var(--accent-red)] focus:ring-1 focus:ring-[var(--accent-red)] transition-all ${
            icon ? 'pl-10 pr-4' : 'px-4'
          } ${error ? 'border-red-500/80 focus:border-red-500' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-400 font-medium">{error}</p>}
    </div>
  );
};
