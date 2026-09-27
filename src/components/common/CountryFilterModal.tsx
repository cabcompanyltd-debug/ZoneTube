import React, { useState, useMemo, useEffect } from 'react';
import { COUNTRIES, Country } from '../../data/countries';

interface CountryFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCountry: Country | null;
  onSelectCountry: (country: Country | null) => void;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const CountryFilterModal: React.FC<CountryFilterModalProps> = ({
  isOpen,
  onClose,
  selectedCountry,
  onSelectCountry,
}) => {
  const [search, setSearch] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const filteredCountries = useMemo(() => {
    let list = COUNTRIES;
    if (selectedLetter) {
      list = list.filter((c) => c.name.toUpperCase().startsWith(selectedLetter));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          c.flag.includes(q)
      );
    }
    return list;
  }, [search, selectedLetter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#08090D] flex flex-col animate-fade-in overflow-hidden">
      {/* Top Full-Page Header Bar */}
      <div className="sticky top-0 z-20 bg-[#151821]/95 backdrop-blur-md border-b border-white/10 px-4 md:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl sm:text-3xl">🌐</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="md:hidden px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* Search Input & Reset Button */}
        <div className="flex items-center gap-3 w-full md:w-auto flex-1 max-w-2xl justify-end">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (e.target.value) setSelectedLetter(null);
              }}
              placeholder="Search country by name or code (e.g., United States, Japan, FR)..."
              className="w-full bg-black/60 border border-white/15 rounded-2xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[var(--accent-red)] focus:ring-1 focus:ring-[var(--accent-red)]"
              autoFocus
            />
            <span className="absolute left-3.5 top-3 text-xs text-zinc-400">🔍</span>
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-2.5 text-xs text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              onSelectCountry(null);
              onClose();
            }}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
              !selectedCountry
                ? 'bg-[var(--accent-red)] border-[var(--accent-red)] text-white shadow-lg'
                : 'bg-white/5 border-white/10 text-zinc-300 hover:text-white hover:bg-white/10'
            }`}
          >
            🌍 Global (All Countries)
          </button>

          <button
            type="button"
            onClick={onClose}
            className="hidden md:flex items-center gap-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Alphabet Jump Bar (A-Z) */}
      <div className="bg-[#0f1117] border-b border-white/10 px-4 md:px-8 py-2.5 overflow-x-auto scrollbar-none flex items-center gap-1.5">
        <span className="text-[11px] font-bold text-zinc-400 uppercase mr-2 shrink-0">
          Jump to:
        </span>
        <button
          type="button"
          onClick={() => setSelectedLetter(null)}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
            selectedLetter === null && !search
              ? 'bg-[var(--accent-red)] text-white'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          All (A-Z)
        </button>
        {ALPHABET.map((letter) => (
          <button
            key={letter}
            type="button"
            onClick={() => {
              setSelectedLetter(selectedLetter === letter ? null : letter);
              setSearch('');
            }}
            className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-all cursor-pointer shrink-0 ${
              selectedLetter === letter
                ? 'bg-[var(--accent-red)] text-white shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {letter}
          </button>
        ))}
      </div>

      {/* Full Page Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-[1800px] w-full mx-auto">
        {/* Active Selection Badge */}
        {selectedCountry && (
          <div className="mb-6 p-4 bg-red-950/40 border border-red-500/40 rounded-2xl flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{selectedCountry.flag}</span>
              <div>
                <p className="text-xs font-bold text-white">
                  Videos from {selectedCountry.flag}
                </p>
                <p className="text-xs text-zinc-400">
                  Found stream(s) from {selectedCountry.flag}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onSelectCountry(null);
                onClose();
              }}
              className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <span>🌎</span> Globe icon
            </button>
          </div>
        )}

        {/* Countries Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 pb-16">
          {filteredCountries.map((c) => {
            const isSelected = selectedCountry?.code === c.code;
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => {
                  onSelectCountry(c);
                  onClose();
                }}
                className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer group relative overflow-hidden ${
                  isSelected
                    ? 'bg-red-950/70 border-red-500 ring-2 ring-red-500/50 text-white shadow-xl scale-[1.02]'
                    : 'bg-[#151821] hover:bg-white/10 border-white/10 text-zinc-200 hover:text-white hover:border-white/25'
                }`}
              >
                <span className="text-2xl sm:text-3xl shrink-0 group-hover:scale-110 transition-transform">
                  {c.flag}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-bold truncate leading-tight">
                    {c.name}
                  </p>
                  <p className="text-[10px] text-zinc-400 uppercase font-mono mt-0.5">
                    {c.code}
                  </p>
                </div>
                {isSelected && (
                  <span className="text-xs text-red-400 font-black shrink-0">✓</span>
                )}
              </button>
            );
          })}
        </div>

        {filteredCountries.length === 0 && (
          <div className="py-20 text-center space-y-3">
            <span className="text-4xl">🔍</span>
            <h3 className="text-base font-bold text-white">No countries found</h3>
            <p className="text-xs text-zinc-400">
              No results found for "{search || selectedLetter}". Try searching for another country name or ISO code.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setSelectedLetter(null);
              }}
              className="px-4 py-2 bg-[var(--accent-red)] text-white text-xs font-bold rounded-xl"
            >
              Show All Countries
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
