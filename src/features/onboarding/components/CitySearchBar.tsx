import React from 'react';

type CitySearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

export function CitySearchBar({ value, onChange }: CitySearchBarProps) {
  return (
    <div className="relative">
      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-brand-primary/55">
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Buscar cidade por nome..."
        className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-brand-primary/20 bg-white/90 text-sm font-semibold placeholder-text/50 text-text outline-none transition focus:border-brand-primary/55 focus:bg-white focus:ring-2 focus:ring-brand-primary/10 shadow-sm"
      />
    </div>
  );
}
