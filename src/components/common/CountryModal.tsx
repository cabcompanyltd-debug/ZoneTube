import React, { useState, useMemo } from 'react';
import { COUNTRIES, Country } from '../../lib/countries';

interface CountryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCountry: (countryName: string) => void;
  selectedCountry?: string;
}

export const CountryModal: React.FC<CountryModalProps> = ({
  isOpen,
  onClose,
  onSelectCountry,
  selectedCountry,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCountries = useMemo(() => {
    return COUNTRIES.filter((c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#08090D] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="bg-[#101218] border-b border-white/10 px-6 py-4 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🌎</span>
          <h2 className="text-lg font-extrabold text-white">Browse by Country</h2>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 text-xs font-bold text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer border border-white/10"
        >
          Close
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 md:p-6 bg-[#0E1017] border-b border-white/15 max-w-2xl mx-auto w-full">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search countries..."
            autoFocus
            className="w-full bg-[#151821] border border-white/15 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[var(--accent-red)] transition-all"
          />
          <span className="absolute left-4 top-3.5 text-zinc-400 text-sm">🔍</span>
        </div>
      </div>

      {/* Countries Grid */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {/* All Countries Option */}
          <button
            onClick={() => {
              onSelectCountry('');
              onClose();
            }}
            className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all cursor-pointer text-left ${
              !selectedCountry
                ? 'bg-[var(--accent-red)] border-[var(--accent-red)] text-white shadow-lg'
                : 'bg-[#151821] border-white/10 hover:border-white/30 text-zinc-200 hover:text-white'
            }`}
          >
            <span className="text-2xl">🌐</span>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">All Countries</p>
              <p className="text-[10px] opacity-75">Global streams</p>
            </div>
          </button>

          {filteredCountries.map((c: Country) => {
            const isSelected = selectedCountry?.toLowerCase() === c.name.toLowerCase();
            return (
              <button
                key={c.code}
                onClick={() => {
                  onSelectCountry(c.name);
                  onClose();
                }}
                className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all cursor-pointer text-left ${
                  isSelected
                    ? 'bg-[var(--accent-red)] border-[var(--accent-red)] text-white shadow-lg'
                    : 'bg-[#151821] border-white/10 hover:border-white/30 text-zinc-200 hover:text-white'
                }`}
              >
                <span className="text-2xl">{c.flag}</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{c.name}</p>
                  <p className="text-[10px] opacity-75 uppercase">{c.code}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
