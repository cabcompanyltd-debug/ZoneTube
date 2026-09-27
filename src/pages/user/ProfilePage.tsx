import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { UserAvatar } from '../../components/common/UserAvatar';
import { useSettings } from '../../contexts/SettingsContext';
import { insforge } from '../../lib/insforge';
import { COUNTRIES } from '../../data/countries';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();
  const { openThemeModal } = useSettings();

  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [countryCode, setCountryCode] = useState(user?.country_code || 'US');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  // Track whether avatar was uploaded from device (or is a storage / base64 image)
  const [hasUploadedFile, setHasUploadedFile] = useState(
    Boolean(user?.avatar && (user.avatar.includes('storage') || user.avatar.startsWith('data:image')))
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.country_code) {
      setCountryCode(user.country_code);
    }
  }, [user]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      showToast('Image file size must be under 15MB', 'error');
      return;
    }

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop() || 'jpg';
      const cleanFileName = `avatars/usr_${user?.id || 'anon'}_${Date.now()}.${fileExt}`;

      // 1. Direct upload to InsForge storage bucket 'media'
      let uploadedUrl: string | null = null;
      try {
        const res = await insforge.storage.from('media').upload(cleanFileName, file);
        if (res && res.data && (res.data as any).url) {
          uploadedUrl = (res.data as any).url;
        } else if (res && res.data && (res.data as any).key) {
          uploadedUrl = `https://nr5f6grt.us-east.insforge.app/api/storage/buckets/media/objects/${encodeURIComponent((res.data as any).key)}`;
        }
      } catch (uploadErr) {
        console.warn('Direct bucket upload failed, using DataURL fallback', uploadErr);
      }

      // 2. High-fidelity FileReader DataURL fallback if network upload fails
      if (!uploadedUrl) {
        uploadedUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(file);
        });
      }

      setAvatar(uploadedUrl);
      setHasUploadedFile(true);
      showToast('Profile photo uploaded! Click "Save Profile Changes" to finish.');
    } catch (err: any) {
      showToast(err.message || 'Failed to process image file', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const matched = COUNTRIES.find((c) => c.code === countryCode) || COUNTRIES[0];
      await updateProfile(name, avatar, matched.name, matched.code, matched.flag);
      showToast(`Profile and country updated (${matched.flag} ${matched.name})`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-2xl font-black text-white">Account Profile</h1>
        <p className="text-xs text-zinc-400 mt-1">Manage your personal ZoneTube profile details and avatar</p>
      </div>

      <div className="p-8 bg-[#151821] border border-white/10 rounded-3xl space-y-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <UserAvatar
              src={avatar}
              name={name}
              size="lg"
              showBorder
              className="w-16 h-16 shadow-lg"
            />
            <label className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold text-white z-10">
              Change
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">{user?.name}</h2>
            <p className="text-xs text-zinc-400">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span
                className="px-2.5 py-0.5 font-extrabold text-[10px] rounded border uppercase"
                style={{
                  borderColor: 'var(--accent-border, rgba(229,9,20,0.4))',
                  backgroundColor: 'var(--accent-subtle, rgba(229,9,20,0.15))',
                  color: 'var(--accent-red)',
                }}
              >
                {user?.role} Account
              </span>
              <button
                type="button"
                onClick={openThemeModal}
                className="px-2.5 py-0.5 bg-white/5 hover:bg-white/10 text-white font-bold text-[10px] rounded-lg border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span className="w-2.5 h-2.5 rounded-full border border-white/30" style={{ backgroundColor: 'var(--accent-red)' }} />
                <span>Theme Color</span>
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <Input
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
          />

          {/* Country & Flag Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 uppercase flex items-center justify-between">
              <span>Country & Location Flag</span>
              <span className="text-xs text-zinc-400 font-normal">
                {COUNTRIES.find((c) => c.code === countryCode)?.flag}{' '}
                {COUNTRIES.find((c) => c.code === countryCode)?.name}
              </span>
            </label>
            <div className="relative">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[var(--accent-red)] transition-colors cursor-pointer appearance-none pr-10"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code} className="bg-zinc-900 text-white">
                    {c.flag} {c.name} ({c.code})
                  </option>
                ))}
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 text-xs">
                ▼
              </div>
            </div>
            <p className="text-[11px] text-zinc-400">
              When you embed or import videos, ZoneTube will automatically tag your stream with this country location.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 uppercase">Profile Picture / Avatar</label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/10 cursor-pointer flex items-center justify-center gap-2 shrink-0 transition-colors"
              >
                {isUploading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin text-xs" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-camera text-xs text-[var(--accent-red)]" />
                    <span>Upload Image from Device</span>
                  </>
                )}
              </button>

              {/* URL input field is completely hidden once user uploads a photo */}
              {!hasUploadedFile ? (
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="Or enter image URL (https://...)"
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[var(--accent-red)]"
                  />
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-between px-4 py-2 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300">
                  <div className="flex items-center gap-2">
                    <img
                      src={avatar}
                      alt="Uploaded preview"
                      className="w-6 h-6 rounded-full object-cover border border-emerald-400"
                    />
                    <span className="font-semibold text-emerald-200">
                      <i className="fa-solid fa-circle-check text-emerald-400 mr-1.5" />
                      Uploaded from device (URL field hidden)
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-white font-bold hover:underline cursor-pointer"
                    >
                      Replace
                    </button>
                    <span className="text-zinc-600">|</span>
                    <button
                      type="button"
                      onClick={() => {
                        setHasUploadedFile(false);
                        setAvatar('');
                      }}
                      className="text-[11px] text-zinc-400 hover:text-red-400 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button type="submit" isLoading={isLoading}>
              Save Profile Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
