import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { ThemeMode } from '../../types';

interface ThemeColorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const THEME_PRESETS: Array<{
  id: ThemeMode;
  name: string;
  tagline: string;
  badge: string;
  bgPreview: string;
  cardPreview: string;
  defaultAccent: string;
  icon: string;
}> = [
  {
    id: 'dark',
    name: 'Midnight Obsidian',
    tagline: 'Deep black cinema with ultra-crisp contrast',
    badge: 'Classic Dark',
    bgPreview: '#08090D',
    cardPreview: '#151821',
    defaultAccent: '#E50914',
    icon: '🌙',
  },
  {
    id: 'light',
    name: 'Pure Porcelain',
    tagline: 'Pristine daylight with crisp typography & cards',
    badge: 'Clean Light',
    bgPreview: '#F4F6F9',
    cardPreview: '#FFFFFF',
    defaultAccent: '#E50914',
    icon: '☀️',
  },
  {
    id: 'cyber',
    name: 'Cyber Midnight',
    tagline: 'Deep sapphire navy with electric neon cobalt glow',
    badge: 'Neon Sapphire',
    bgPreview: '#050B17',
    cardPreview: '#0F1C38',
    defaultAccent: '#3B82F6',
    icon: '⚡',
  },
  {
    id: 'emerald',
    name: 'Emerald Velvet',
    tagline: 'Rich forest jade with glowing mint & gold luxury',
    badge: 'Luxury Jade',
    bgPreview: '#04130E',
    cardPreview: '#0D2A20',
    defaultAccent: '#10B981',
    icon: '💎',
  },
];

export const PRESET_ACCENT_COLORS = [
  { name: 'Red Fire', hex: '#E50914', desc: 'Classic Scarlet' },
  { name: 'Cyber Blue', hex: '#3B82F6', desc: 'Electric Cobalt' },
  { name: 'Emerald', hex: '#10B981', desc: 'Vibrant Mint' },
  { name: 'Hot Pink', hex: '#EC4899', desc: 'Neon Magenta' },
  { name: 'Royal Violet', hex: '#8B5CF6', desc: 'Electric Purple' },
  { name: 'Amber Gold', hex: '#F59E0B', desc: 'Warm Radiant' },
  { name: 'Aqua Cyan', hex: '#06B6D4', desc: 'Futuristic Glow' },
  { name: 'Neon Lime', hex: '#84CC16', desc: 'High Voltage' },
  { name: 'Sunset Coral', hex: '#FF6B00', desc: 'Deep Orange' },
  { name: 'Rose Crimson', hex: '#F43F5E', desc: 'Vivid Rose' },
  { name: 'Deep Purple', hex: '#7C3AED', desc: 'Ultraviolet' },
  { name: 'Ruby Bold', hex: '#DC2626', desc: 'Scarlet Bold' },
];

export const ThemeColorModal: React.FC<ThemeColorModalProps> = ({ isOpen, onClose }) => {
  const {
    settings,
    themeMode,
    setThemeMode,
    applyAccentColor,
    updateSettingsState,
    saveDefaultSiteSettings,
  } = useSettings();
  const { isAdmin, user } = useAuth();
  const { showToast } = useToast();

  const [selectedTheme, setSelectedTheme] = useState<ThemeMode>(themeMode || 'dark');
  const [selectedColor, setSelectedColor] = useState<string>(settings.accent_color || '#E50914');
  const [hexInput, setHexInput] = useState<string>(settings.accent_color || '#E50914');
  const [saveAsGlobalDefault, setSaveAsGlobalDefault] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync state whenever modal opens
  useEffect(() => {
    if (isOpen) {
      const activeColor = settings.accent_color || '#E50914';
      setSelectedColor(activeColor);
      setHexInput(activeColor);
      setSelectedTheme(themeMode || 'dark');
      setSaveAsGlobalDefault(false);
    }
  }, [isOpen, settings.accent_color, themeMode]);

  const handleSelectTheme = (theme: ThemeMode) => {
    setSelectedTheme(theme);
    setThemeMode(theme);
    
    // Auto-suggest signature accent color for that theme if not already customized
    const preset = THEME_PRESETS.find((t) => t.id === theme);
    if (preset && (!settings.accent_color || settings.accent_color === '#E50914' || settings.accent_color === '#3B82F6' || settings.accent_color === '#10B981')) {
      setSelectedColor(preset.defaultAccent);
      setHexInput(preset.defaultAccent);
      applyAccentColor(preset.defaultAccent);
    }
  };

  const handleSelectColor = (hex: string) => {
    const formatted = hex.startsWith('#') ? hex : `#${hex}`;
    setSelectedColor(formatted);
    setHexInput(formatted);
    applyAccentColor(formatted);
  };

  const handleHexInputChange = (val: string) => {
    setHexInput(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      setSelectedColor(val);
      applyAccentColor(val);
    }
  };

  const adjustBrightness = (percent: number) => {
    let hex = selectedColor.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
    const num = parseInt(hex, 16);
    let r = (num >> 16) + Math.round(255 * (percent / 100));
    let g = ((num >> 8) & 0x00ff) + Math.round(255 * (percent / 100));
    let b = (num & 0x0000ff) + Math.round(255 * (percent / 100));
    r = Math.min(255, Math.max(0, r));
    g = Math.min(255, Math.max(0, g));
    b = Math.min(255, Math.max(0, b));
    const newHex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    handleSelectColor(newHex);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      applyAccentColor(selectedColor);
      setThemeMode(selectedTheme);
      updateSettingsState({ accent_color: selectedColor, default_theme_mode: selectedTheme });

      if (isAdmin && saveAsGlobalDefault) {
        try {
          await saveDefaultSiteSettings({
            accent_color: selectedColor,
            default_theme_mode: selectedTheme,
          });
          showToast('Theme saved as global default for all visitors!', 'success');
        } catch (err) {
          console.warn('Backend settings update warning:', err);
          showToast('Theme updated for your session', 'info');
        }
      } else {
        showToast('Display & theme preferences saved', 'success');
      }
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefault = () => {
    handleSelectTheme('dark');
    handleSelectColor('#E50914');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Display & Theme Settings" maxWidth="lg">
      <div className="space-y-6">
        {/* Section 1: Four Main Theme Presets */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>🎨</span> Choose Your Experience Theme
            </label>
            <span className="text-[11px] text-zinc-500 font-normal">
              4 Handcrafted Themes
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {THEME_PRESETS.map((preset) => {
              const isActive = selectedTheme === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectTheme(preset.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col gap-2.5 cursor-pointer relative overflow-hidden group ${
                    isActive
                      ? 'border-white bg-white/10 ring-2 ring-white/30 shadow-xl'
                      : 'border-white/10 hover:border-white/20 bg-black/40 hover:bg-black/60'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <span className="text-xl shrink-0">{preset.icon}</span>
                      <span className="text-xs font-bold text-white">{preset.name}</span>
                    </div>
                    {isActive ? (
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-white text-black shadow-sm">
                        Active
                      </span>
                    ) : (
                      <span className="text-[9px] font-medium text-zinc-400 px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                        {preset.badge}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-snug">{preset.tagline}</p>

                  {/* Visual Theme Swatch Mini Preview */}
                  <div className="flex items-center gap-2 mt-1 pt-2 border-t border-white/5">
                    <div
                      className="w-5 h-5 rounded-lg border border-white/20 shrink-0 shadow-sm"
                      style={{ backgroundColor: preset.bgPreview }}
                      title="Canvas background"
                    />
                    <div
                      className="w-5 h-5 rounded-lg border border-white/20 shrink-0 shadow-sm"
                      style={{ backgroundColor: preset.cardPreview }}
                      title="Card container"
                    />
                    <div
                      className="w-5 h-5 rounded-lg border border-white/20 shrink-0 shadow-sm"
                      style={{ backgroundColor: preset.defaultAccent }}
                      title="Default accent"
                    />
                    <span className="text-[10px] text-zinc-500 font-mono ml-auto">
                      {preset.id.toUpperCase()}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Accent Theme Color Palettes */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>⚡</span> Accent Highlight Color
            </label>
            <button
              type="button"
              onClick={handleResetDefault}
              className="text-[11px] font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              Reset to Default
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {PRESET_ACCENT_COLORS.map((preset) => {
              const isActive = selectedColor.toUpperCase() === preset.hex.toUpperCase();
              return (
                <button
                  key={preset.hex}
                  type="button"
                  onClick={() => handleSelectColor(preset.hex)}
                  className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col items-start gap-1.5 cursor-pointer relative overflow-hidden group ${
                    isActive
                      ? 'border-white bg-white/10 ring-2 ring-white/30 shadow-lg'
                      : 'border-white/10 hover:border-white/25 bg-black/40 hover:bg-black/60'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className="w-5 h-5 rounded-full shadow-md shrink-0 border border-white/30 transition-transform group-hover:scale-110"
                      style={{ backgroundColor: preset.hex }}
                    />
                    {isActive && (
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-white text-black">
                        Active
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white leading-tight">{preset.name}</p>
                    <p className="text-[10px] text-zinc-400 font-mono">{preset.hex}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Hex & Color Picker Input */}
        <div className="p-4 bg-black/60 border border-white/10 rounded-2xl space-y-3">
          <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center justify-between">
            <span>Custom Color Fine-Tuner</span>
            <span className="font-mono text-xs text-zinc-400">{selectedColor}</span>
          </label>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => handleSelectColor(e.target.value)}
                className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border border-white/20 p-1 shrink-0"
                title="Choose custom color"
              />
              <div className="relative flex-1 sm:w-44">
                <input
                  type="text"
                  value={hexInput}
                  onChange={(e) => handleHexInputChange(e.target.value)}
                  placeholder="#E50914"
                  className="w-full bg-[#151821] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-mono uppercase focus:outline-none focus:border-white transition-all"
                />
              </div>
            </div>

            {/* Quick Adjust Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
              <button
                type="button"
                onClick={() => adjustBrightness(-12)}
                className="flex-1 sm:flex-none px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-zinc-300 transition-colors"
                title="Make darker"
              >
                Darker
              </button>
              <button
                type="button"
                onClick={() => adjustBrightness(12)}
                className="flex-1 sm:flex-none px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-zinc-300 transition-colors"
                title="Make lighter"
              >
                Lighter
              </button>
            </div>
          </div>
        </div>

        {/* Live UI Elements Preview */}
        <div className="p-4 bg-[#101218] border border-white/10 rounded-2xl space-y-3">
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
            <span>Live Interactive Elements Preview</span>
            <span className="text-[10px] text-zinc-500">Live preview active</span>
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            {/* Header Admin Button Preview */}
            <div className="p-3 bg-black/40 border border-white/5 rounded-xl flex flex-col items-center justify-center gap-2 text-center">
              <span className="text-[10px] text-zinc-400 font-bold uppercase">Header Button</span>
              <button
                type="button"
                style={{ backgroundColor: selectedColor }}
                className="px-3 py-1.5 text-white font-bold text-xs rounded-lg shadow-md flex items-center gap-1.5"
              >
                ⚙ Admin
              </button>
            </div>

            {/* User Profile / Channel Icon Preview */}
            <div className="p-3 bg-black/40 border border-white/5 rounded-xl flex flex-col items-center justify-center gap-2 text-center">
              <span className="text-[10px] text-zinc-400 font-bold uppercase">Profile Icon</span>
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-sm border shadow-md transition-all"
                style={{
                  backgroundColor: selectedColor,
                  borderColor: selectedColor,
                  boxShadow: `0 0 12px ${selectedColor}80`,
                }}
              >
                {(user?.name || 'Z')[0].toUpperCase()}
              </div>
            </div>

            {/* Primary Action Button Preview */}
            <div className="p-3 bg-black/40 border border-white/5 rounded-xl flex flex-col items-center justify-center gap-2 text-center">
              <span className="text-[10px] text-zinc-400 font-bold uppercase">Action Button</span>
              <button
                type="button"
                style={{ backgroundColor: selectedColor }}
                className="px-3.5 py-1.5 text-white font-bold text-xs rounded-lg shadow-md"
              >
                ＋ Add Video
              </button>
            </div>

            {/* Centered Play Button Preview */}
            <div className="p-3 bg-black/40 border border-white/5 rounded-xl flex flex-col items-center justify-center gap-2 text-center">
              <span className="text-[10px] text-zinc-400 font-bold uppercase">Centered Play</span>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md"
                style={{ backgroundColor: selectedColor }}
              >
                ▶
              </div>
            </div>
          </div>
        </div>

        {/* Admin Global Default Setting Checkbox */}
        {isAdmin && (
          <div className="p-3.5 bg-gradient-to-r from-red-950/40 via-[#151821] to-black border border-white/10 rounded-2xl flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>👑</span> Administrator Default Setup
              </p>
              <p className="text-[11px] text-zinc-400">
                Set this theme and accent color as the site default for all new visitors.
              </p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={saveAsGlobalDefault}
                onChange={(e) => setSaveAsGlobalDefault(e.target.checked)}
                className="w-4 h-4 rounded accent-[var(--accent-red)]"
              />
              <span className="text-xs font-bold text-zinc-200">Set Site Default</span>
            </label>
          </div>
        )}

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            isLoading={isSaving}
            className="shadow-xl"
            style={{ backgroundColor: selectedColor }}
          >
            Apply & Save Settings
          </Button>
        </div>
      </div>
    </Modal>
  );
};
