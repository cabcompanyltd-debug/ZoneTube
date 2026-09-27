import React, { useState } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { useToast } from '../../contexts/ToastContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import api from '../../lib/api';

export const AdminSettingsPage: React.FC = () => {
  const { settings, updateSettingsState, openThemeModal, setThemeMode } = useSettings();
  const { showToast } = useToast();

  const [form, setForm] = useState({ ...settings });
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await api.put('/admin/settings', form);
      updateSettingsState(form);
      showToast('Site settings saved successfully!');
    } catch (err: any) {
      showToast(err.message || 'Failed to save settings', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-2xl font-black text-white">Global Site Settings</h1>
        <p className="text-xs text-zinc-400 mt-1">Configure site branding, accent theme, and platform features</p>
      </div>

      <form onSubmit={handleSave} className="p-8 bg-[#151821] border border-white/10 rounded-3xl space-y-6 shadow-xl">
        <Input
          label="Site Name"
          value={form.site_name}
          onChange={(e) => setForm({ ...form, site_name: e.target.value })}
        />

        <Input
          label="Homepage Title"
          value={form.homepage_title}
          onChange={(e) => setForm({ ...form, homepage_title: e.target.value })}
        />

        <Input
          label="Homepage Description"
          value={form.homepage_description}
          onChange={(e) => setForm({ ...form, homepage_description: e.target.value })}
        />

        {/* Default Appearance Mode & Accent Color Control */}
        <div className="p-5 bg-black/40 border border-white/10 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Default Site Theme & Appearance
              </h3>
              <p className="text-[11px] text-zinc-400">
                Configure the default theme mode and color palette that all new visitors see upon landing on the platform.
              </p>
            </div>
            <button
              type="button"
              onClick={openThemeModal}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <span>⚙️ Theme Customizer</span>
            </button>
          </div>

          {/* Theme Mode Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            <button
              type="button"
              onClick={() => {
                setForm({ ...form, default_theme_mode: 'dark' });
                setThemeMode('dark');
              }}
              className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                (form.default_theme_mode || 'dark') === 'dark'
                  ? 'border-white bg-white/10 ring-2 ring-white/30 text-white shadow-lg'
                  : 'border-white/10 bg-black/40 text-zinc-400 hover:bg-black/60'
              }`}
            >
              <span className="text-xl">🌙</span>
              <div>
                <p className="text-xs font-bold text-white">Midnight Obsidian</p>
                <p className="text-[10px] text-zinc-400">Deep black studio cinema</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setForm({ ...form, default_theme_mode: 'light' });
                setThemeMode('light');
              }}
              className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                form.default_theme_mode === 'light'
                  ? 'border-white bg-white/10 ring-2 ring-white/30 text-white shadow-lg'
                  : 'border-white/10 bg-black/40 text-zinc-400 hover:bg-black/60'
              }`}
            >
              <span className="text-xl">☀️</span>
              <div>
                <p className="text-xs font-bold text-white">Pure Porcelain</p>
                <p className="text-[10px] text-zinc-400">Clean crisp daylight</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setForm({ ...form, default_theme_mode: 'cyber' });
                setThemeMode('cyber');
              }}
              className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                form.default_theme_mode === 'cyber'
                  ? 'border-white bg-white/10 ring-2 ring-white/30 text-white shadow-lg'
                  : 'border-white/10 bg-black/40 text-zinc-400 hover:bg-black/60'
              }`}
            >
              <span className="text-xl">⚡</span>
              <div>
                <p className="text-xs font-bold text-white">Cyber Midnight</p>
                <p className="text-[10px] text-zinc-400">Neon sapphire & cobalt</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setForm({ ...form, default_theme_mode: 'emerald' });
                setThemeMode('emerald');
              }}
              className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                form.default_theme_mode === 'emerald'
                  ? 'border-white bg-white/10 ring-2 ring-white/30 text-white shadow-lg'
                  : 'border-white/10 bg-black/40 text-zinc-400 hover:bg-black/60'
              }`}
            >
              <span className="text-xl">💎</span>
              <div>
                <p className="text-xs font-bold text-white">Emerald Velvet</p>
                <p className="text-[10px] text-zinc-400">Luxury forest & mint gold</p>
              </div>
            </button>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <label className="text-xs font-semibold text-zinc-300 uppercase">Default Accent Theme Color</label>
            <div className="flex flex-wrap items-center gap-2.5">
              {[
                { name: 'Red Fire', hex: '#E50914' },
                { name: 'Hot Pink', hex: '#EC4899' },
                { name: 'Royal Violet', hex: '#8B5CF6' },
                { name: 'Cyber Blue', hex: '#3B82F6' },
                { name: 'Aqua Cyan', hex: '#06B6D4' },
                { name: 'Emerald', hex: '#10B981' },
                { name: 'Amber Gold', hex: '#F59E0B' },
              ].map((preset) => (
                <button
                  key={preset.hex}
                  type="button"
                  onClick={() => {
                    setForm({ ...form, accent_color: preset.hex });
                    updateSettingsState({ accent_color: preset.hex });
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                    form.accent_color?.toUpperCase() === preset.hex.toUpperCase()
                      ? 'border-white ring-2 ring-white/30 text-white'
                      : 'border-white/10 hover:border-white/30 text-zinc-300 bg-black/40'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: preset.hex }} />
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 mt-2">
              <input
                type="color"
                value={form.accent_color || '#E50914'}
                onChange={(e) => {
                  setForm({ ...form, accent_color: e.target.value });
                  updateSettingsState({ accent_color: e.target.value });
                }}
                className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border border-white/20"
              />
              <input
                type="text"
                value={form.accent_color}
                onChange={(e) => {
                  setForm({ ...form, accent_color: e.target.value });
                  updateSettingsState({ accent_color: e.target.value });
                }}
                className="bg-black/60 border border-white/10 rounded-lg px-4 py-2 text-xs text-white font-mono uppercase"
              />
            </div>
          </div>
        </div>

        {/* Custom Ad Banner Placement Settings */}
        <div className="p-5 bg-gradient-to-r from-red-950/30 via-black to-black border border-red-500/20 rounded-2xl space-y-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-red-600/20 text-red-400 rounded-lg text-sm">💰</span>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Custom Ad Banner Configuration
              </h3>
              <p className="text-[11px] text-zinc-400">
                Configure custom banner images or embed codes inserted after every 10 videos. If left blank, our sleek animated showcase cards are displayed automatically.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Input
              label="Custom Banner Image / GIF URL"
              placeholder="https://example.com/ad-banner.gif"
              value={form.banner_ad_image || ''}
              onChange={(e) => setForm({ ...form, banner_ad_image: e.target.value })}
            />

            <Input
              label="Banner Click Target Link URL"
              placeholder="https://advertiser-site.com/promo?ref=zonetube"
              value={form.banner_ad_link || ''}
              onChange={(e) => setForm({ ...form, banner_ad_link: e.target.value })}
            />

            <Input
              label="Banner Title / Alt Description"
              placeholder="Exclusive High Quality Streaming Offer"
              value={form.banner_ad_title || ''}
              onChange={(e) => setForm({ ...form, banner_ad_title: e.target.value })}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Raw HTML / Script Ad Code (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="<script ...> or <iframe>... ad network tags"
                value={form.banner_ad_code || ''}
                onChange={(e) => setForm({ ...form, banner_ad_code: e.target.value })}
                className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[var(--accent-red)] font-mono"
              />
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-3 pt-2">
          <label className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-2xl cursor-pointer">
            <div>
              <p className="text-xs font-bold text-white">Allow Public Registration</p>
              <p className="text-[11px] text-zinc-400">Visitors can register new user accounts.</p>
            </div>
            <input
              type="checkbox"
              checked={form.enable_registration}
              onChange={(e) => setForm({ ...form, enable_registration: e.target.checked })}
              className="w-5 h-5 accent-[var(--accent-red)]"
            />
          </label>

          <label className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-2xl cursor-pointer">
            <div>
              <p className="text-xs font-bold text-white">Enable Comments</p>
              <p className="text-[11px] text-zinc-400">Authenticated users can post comments on videos.</p>
            </div>
            <input
              type="checkbox"
              checked={form.enable_comments}
              onChange={(e) => setForm({ ...form, enable_comments: e.target.checked })}
              className="w-5 h-5 accent-[var(--accent-red)]"
            />
          </label>

          <label className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-2xl cursor-pointer">
            <div>
              <p className="text-xs font-bold text-white">Maintenance Mode</p>
              <p className="text-[11px] text-zinc-400">Temporarily restrict access to administrators.</p>
            </div>
            <input
              type="checkbox"
              checked={form.maintenance_mode}
              onChange={(e) => setForm({ ...form, maintenance_mode: e.target.checked })}
              className="w-5 h-5 accent-[var(--accent-red)]"
            />
          </label>
        </div>

        <div className="flex justify-end pt-4 border-t border-white/10">
          <Button type="submit" isLoading={isLoading} size="lg">
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
};
