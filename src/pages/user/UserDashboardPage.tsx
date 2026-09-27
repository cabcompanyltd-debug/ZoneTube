import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Video, Category } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../../components/common/Button';
import { UserAvatar } from '../../components/common/UserAvatar';
import { useSettings } from '../../contexts/SettingsContext';
import { Modal } from '../../components/common/Modal';
import { COUNTRIES, Country } from '../../data/countries';
import api from '../../lib/api';

interface UserDashboardPageProps {
  onOpenVideo: (video: Video) => void;
  onNavigate: (path: string) => void;
  favoritesSet: Set<string>;
  onFavoriteToggle: (videoId: string, isFav: boolean) => void;
  onAddToPlaylist?: (video: Video) => void;
}

type DashboardTab = 'profile' | 'import' | 'videos';

export const UserDashboardPage: React.FC<UserDashboardPageProps> = ({
  onOpenVideo,
  onNavigate,
}) => {
  const { user, updateProfile, setUser } = useAuth();
  const { showToast } = useToast();
  const { openThemeModal } = useSettings();

  const [activeTab, setActiveTab] = useState<DashboardTab>('profile');
  const [userVideos, setUserVideos] = useState<Video[]>([]);
  const [adminCategories, setAdminCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Profile Edit State
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>(
    user?.country_code || 'US'
  );
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Import Video Form State (Title field hidden, category dynamically populated)
  const [isSubmittingImport, setIsSubmittingImport] = useState(false);
  const [isExtractingInfo, setIsExtractingInfo] = useState(false);
  const [extractedPreviewTitle, setExtractedPreviewTitle] = useState<string>('');
  const [extractedPreviewThumb, setExtractedPreviewThumb] = useState<string>('');
  const [extractedPreviewDuration, setExtractedPreviewDuration] = useState<string>('');
  const [extractedPreviewChannel, setExtractedPreviewChannel] = useState<string>('');
  const [importForm, setImportForm] = useState({
    embed_url: '',
    category: 'General',
    description: '',
    tags: '',
  });

  // Edit Video Modal State
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    embed_url: '',
    category: 'General',
    description: '',
    tags: '',
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deletingVideoId, setDeletingVideoId] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [vidsRes, catRes] = await Promise.all([
        api.get('/user/videos'),
        api.get('/categories'),
      ]);

      const fetchedVids: Video[] = vidsRes.data.videos || [];
      setUserVideos(fetchedVids);

      const cats: Category[] = catRes.data.categories || [];
      setAdminCategories(cats);
      if (cats.length > 0 && !importForm.category) {
        setImportForm((prev) => ({ ...prev, category: cats[0].name }));
      }
    } catch (err) {
      console.error('Failed to load user dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (user) {
      setNameInput(user.name || '');
      setAvatarPreview(user.avatar || '');
      if (user.country_code) {
        setSelectedCountryCode(user.country_code);
      }
    }
  }, [user]);

  // Handle Profile Avatar File Pick
  const handleAvatarFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      showToast('Image file size must be less than 8MB', 'error');
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Save Profile (Name, Country & InsForge Storage Avatar)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      showToast('Name cannot be empty', 'error');
      return;
    }

    try {
      setIsSavingProfile(true);
      let finalAvatarUrl = user?.avatar || '';

      // Upload avatar to InsForge storage bucket if new file chosen
      if (avatarFile && avatarPreview && avatarPreview.startsWith('data:')) {
        const uploadRes = await api.post('/user/avatar', { image: avatarPreview });
        if (uploadRes.data?.avatar) {
          finalAvatarUrl = uploadRes.data.avatar;
        }
      }

      const matchedCountry = COUNTRIES.find((c) => c.code === selectedCountryCode);

      // Update user profile in InsForge DB
      const res = await api.put('/auth/profile', {
        name: nameInput.trim(),
        avatar: finalAvatarUrl,
        country: matchedCountry?.name,
        country_code: matchedCountry?.code,
        country_flag: matchedCountry?.flag,
      });

      if (res.data?.user) {
        setUser(res.data.user);
      } else {
        await updateProfile(
          nameInput.trim(),
          finalAvatarUrl,
          matchedCountry?.name,
          matchedCountry?.code,
          matchedCountry?.flag
        );
      }

      setAvatarFile(null);
      showToast('Profile and country updated successfully in InsForge storage!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to save profile', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Instant Auto-Upload State & Refs
  const isAutoUploadingRef = useRef(false);
  const lastUploadedUrlRef = useRef('');
  const debounceAutoUploadTimeoutRef = useRef<any>(null);
  const [justUploadedVideo, setJustUploadedVideo] = useState<Video | null>(null);

  // Auto-extract info and IMMEDIATELY upload without pressing any button upon paste
  const triggerAutoFetchAndUpload = async (rawCode: string) => {
    const trimmed = rawCode.trim();
    if (!trimmed) return;

    // Check if input looks like a valid video embed, URL, or XVideos ID
    const looksLikeVideo =
      trimmed.includes('<iframe') ||
      trimmed.includes('http://') ||
      trimmed.includes('https://') ||
      trimmed.includes('xvideos.com') ||
      /^[a-zA-Z0-9_-]{5,}$/.test(trimmed);

    if (!looksLikeVideo) return;

    // Guard against duplicate simultaneous calls for the same URL
    if (isAutoUploadingRef.current || lastUploadedUrlRef.current === trimmed) {
      return;
    }

    try {
      isAutoUploadingRef.current = true;
      lastUploadedUrlRef.current = trimmed;
      setIsSubmittingImport(true);
      setIsExtractingInfo(true);
      showToast('⚡ Instant Auto-Upload: Extracting video stream & uploading to InsForge...', 'info');

      // 1. Try quick metadata extraction for accurate title/thumb
      let extractedTitle = extractedPreviewTitle;
      let extractedThumb = extractedPreviewThumb;
      let extractedDuration = extractedPreviewDuration;
      let extractedChannel = extractedPreviewChannel;
      let extractedTags: string[] = [];

      try {
        const previewRes = await api.post('/utils/extract-media-info', { input: trimmed });
        if (previewRes.data) {
          if (previewRes.data.title) {
            extractedTitle = previewRes.data.title;
            setExtractedPreviewTitle(previewRes.data.title);
          }
          if (previewRes.data.thumbnail_url) {
            extractedThumb = previewRes.data.thumbnail_url;
            setExtractedPreviewThumb(previewRes.data.thumbnail_url);
          }
          if (previewRes.data.duration) {
            extractedDuration = previewRes.data.duration;
            setExtractedPreviewDuration(previewRes.data.duration);
          }
          if (previewRes.data.channel) {
            extractedChannel = previewRes.data.channel;
            setExtractedPreviewChannel(previewRes.data.channel);
          }
          if (Array.isArray(previewRes.data.tags)) {
            extractedTags = previewRes.data.tags;
          }
        }
      } catch (e) {
        // Non-blocking, backend handles fallback
      }

      // 2. Resolve country location based on user profile
      const matchedCountry =
        COUNTRIES.find((c) => c.code === user?.country_code) ||
        COUNTRIES.find((c) => c.name.toLowerCase() === (user?.country || '').toLowerCase()) ||
        COUNTRIES.find((c) => c.code === selectedCountryCode) ||
        COUNTRIES[0];

      // 3. Upload directly to /user/videos (which persists to InsForge)
      const res = await api.post('/user/videos', {
        embed_url: trimmed,
        title: extractedTitle || undefined,
        thumbnail_url: extractedThumb || undefined,
        duration: extractedDuration || undefined,
        channel: extractedChannel || undefined,
        category: importForm.category || adminCategories[0]?.name || 'General',
        description: importForm.description.trim() || undefined,
        tags: extractedTags.length > 0 ? extractedTags : undefined,
        country: matchedCountry.name,
        country_code: matchedCountry.code,
        country_flag: matchedCountry.flag,
      });

      const newVid: Video = res.data?.video;
      if (newVid) {
        setUserVideos((prev) => [newVid, ...prev]);
        setJustUploadedVideo(newVid);
        try {
          window.dispatchEvent(new CustomEvent('zonetube_videos_updated', { detail: { video: newVid } }));
        } catch (e) {}
      }

      // Reset form so the user can immediately paste another video
      setImportForm((prev) => ({
        ...prev,
        embed_url: '',
      }));
      setExtractedPreviewTitle('');
      setExtractedPreviewThumb('');
      setExtractedPreviewDuration('');
      setExtractedPreviewChannel('');

      showToast(
        `🎉 Successfully uploaded "${newVid?.title || 'Video'}" from ${matchedCountry.flag} ${matchedCountry.name}!`,
        'success'
      );
    } catch (err: any) {
      lastUploadedUrlRef.current = '';
      showToast(err.response?.data?.error || err.message || 'Failed to auto-upload video', 'error');
    } finally {
      setIsSubmittingImport(false);
      setIsExtractingInfo(false);
      setTimeout(() => {
        isAutoUploadingRef.current = false;
      }, 1000);
    }
  };

  // Auto-extract info for video preview when user types or pastes embed code
  const handleEmbedChange = (val: string) => {
    setImportForm((prev) => ({ ...prev, embed_url: val }));

    if (debounceAutoUploadTimeoutRef.current) {
      clearTimeout(debounceAutoUploadTimeoutRef.current);
    }

    if (!val.trim()) {
      setExtractedPreviewTitle('');
      setExtractedPreviewThumb('');
      setExtractedPreviewDuration('');
      setExtractedPreviewChannel('');
      return;
    }

    // Auto-detect iframe or url paste via right-click or drag-drop
    if (val.includes('<iframe') || val.includes('xvideos.com') || val.includes('http://') || val.includes('https://')) {
      debounceAutoUploadTimeoutRef.current = setTimeout(() => {
        triggerAutoFetchAndUpload(val);
      }, 350);
    }
  };

  // Handle Video Import Submit (as fallback if user clicks button manually)
  const handleImportVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importForm.embed_url.trim()) {
      showToast('Please paste a video embed link or iframe code', 'error');
      return;
    }

    await triggerAutoFetchAndUpload(importForm.embed_url);
  };

  // Handle Edit Video Click
  const handleOpenEditModal = (video: Video) => {
    setEditingVideo(video);
    setEditForm({
      title: video.title,
      embed_url: video.embed_url,
      category: video.category,
      description: video.description || '',
      tags: Array.isArray(video.tags) ? video.tags.join(', ') : '',
    });
  };

  const handleSaveEditedVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVideo) return;

    try {
      setIsSavingEdit(true);
      const parsedTags = editForm.tags
        ? editForm.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
        : [];

      const res = await api.put(`/user/videos/${editingVideo.id}`, {
        ...editForm,
        tags: parsedTags,
      });
      const updated = res.data?.video;

      if (updated) {
        setUserVideos((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
      }

      setEditingVideo(null);
      showToast('Video updated successfully in InsForge!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to update video', 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Handle Delete Video
  const handleDeleteVideo = async (videoId: string) => {
    if (!window.confirm('Are you sure you want to delete this imported video?')) {
      return;
    }

    try {
      setDeletingVideoId(videoId);
      await api.delete(`/user/videos/${videoId}`);
      setUserVideos((prev) => prev.filter((v) => v.id !== videoId));
      showToast('Video removed successfully', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to delete video', 'error');
    } finally {
      setDeletingVideoId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in pb-12">
      {/* Header Banner */}
      <div
        className="p-6 sm:p-8 rounded-3xl border border-white/10 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6"
        style={{
          background: 'linear-gradient(135deg, var(--accent-subtle, rgba(229,9,20,0.15)) 0%, #151821 60%, #08090D 100%)',
        }}
      >
        <div className="flex items-center gap-4 text-center sm:text-left">
          <UserAvatar
            src={avatarPreview || user?.avatar}
            name={user?.name}
            size="xl"
            showBorder
            className="w-16 h-16 sm:w-20 sm:h-20 shadow-lg"
          />
          <div>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <span>{user?.name}</span>
                {user?.country_flag && (
                  <span className="text-xl" title={user.country || user.country_code}>
                    {user.country_flag}
                  </span>
                )}
              </h1>
              <span
                className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded border"
                style={{
                  borderColor: 'var(--accent-border, rgba(229,9,20,0.4))',
                  backgroundColor: 'var(--accent-subtle, rgba(229,9,20,0.15))',
                  color: 'var(--accent-red)',
                }}
              >
                {user?.role === 'admin' ? 'Admin' : (user?.role === 'visitor' ? 'Visitor' : 'Member')}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              {user?.email} {user?.country ? `• ${user.country}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openThemeModal}
            className="p-2.5 rounded-xl border border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10 text-white transition-all cursor-pointer"
            title="Display Settings"
          >
            ⚙️
          </button>
          <button
            onClick={() => onNavigate('/favorites')}
            className="px-3.5 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-all cursor-pointer"
          >
            ❤️ Favorites
          </button>
          <button
            onClick={() => onNavigate('/playlists')}
            className="px-3.5 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-all cursor-pointer"
          >
            📋 Playlists
          </button>
        </div>
      </div>

      {/* DASHBOARD 3-TAB NAVIGATION MENU */}
      <div className="flex border-b border-white/10 gap-2 sm:gap-4 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'profile'
              ? 'bg-[var(--accent-red)] text-white shadow-lg'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span>👤</span> Profile
        </button>

        <button
          onClick={() => setActiveTab('import')}
          className={`px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'import'
              ? 'bg-[var(--accent-red)] text-white shadow-lg'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span>⚡</span> Import Video
        </button>

        <button
          onClick={() => setActiveTab('videos')}
          className={`px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'videos'
              ? 'bg-[var(--accent-red)] text-white shadow-lg'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span>🎬</span> Videos ({userVideos.length})
        </button>
      </div>

      {/* TAB 1: PROFILE MANAGEMENT (Change Name & InsForge Avatar Upload & Country) */}
      {activeTab === 'profile' && (
        <div className="p-6 sm:p-8 bg-[#151821] border border-white/10 rounded-3xl space-y-6 shadow-xl">
          <div>
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              <span>👤</span> Edit Profile, Avatar & Country
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Update your display name, country flag, and upload your profile picture to the InsForge storage bucket.
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-6 max-w-xl">
            {/* Avatar Upload Drop Zone */}
            <div className="flex flex-col sm:flex-row items-center gap-6 p-5 bg-black/40 border border-white/10 rounded-2xl">
              <div className="relative group shrink-0">
                <UserAvatar
                  src={avatarPreview}
                  name={nameInput || user?.name}
                  size="xl"
                  showBorder
                  className="w-24 h-24 shadow-md"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  Change
                </button>
              </div>

              <div className="space-y-2 text-center sm:text-left flex-1">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Profile Avatar Image
                </h4>
                <p className="text-[11px] text-zinc-400">
                  Upload JPG, PNG, or WEBP up to 8MB. Images are saved to InsForge cloud storage.
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileSelected}
                  className="hidden"
                />

                <div className="flex items-center gap-2 justify-center sm:justify-start pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/10 transition-colors cursor-pointer"
                  >
                    📁 Upload Image File
                  </button>
                  {avatarFile && (
                    <span className="text-[11px] text-emerald-400 font-medium">
                      ✓ File selected ({Math.round(avatarFile.size / 1024)} KB)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Display Name Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Display Name
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Your Name or Channel Name"
                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[var(--accent-red)] transition-colors"
                required
              />
            </div>

            {/* Country Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center justify-between">
                <span>Country & Flag</span>
                <span className="text-xs text-zinc-400 font-normal">
                  {COUNTRIES.find((c) => c.code === selectedCountryCode)?.flag}{' '}
                  {COUNTRIES.find((c) => c.code === selectedCountryCode)?.name}
                </span>
              </label>
              <select
                value={selectedCountryCode}
                onChange={(e) => setSelectedCountryCode(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[var(--accent-red)] transition-colors cursor-pointer"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code} className="bg-zinc-900 text-white">
                    {c.flag} {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Email (Read-Only) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Account Email
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full bg-black/30 border border-white/5 rounded-xl px-4 py-3 text-sm text-zinc-500 cursor-not-allowed font-mono"
              />
            </div>

            <Button type="submit" isLoading={isSavingProfile} className="w-full sm:w-auto">
              Save Profile Changes
            </Button>
          </form>
        </div>
      )}

      {/* TAB 2: IMPORT VIDEO (Title field hidden, auto extracted, dynamic categories) */}
      {activeTab === 'import' && (
        <div className="p-6 sm:p-8 bg-[#151821] border border-white/10 rounded-3xl space-y-6 shadow-xl">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                <span>⚡</span> Import & Embed Video
              </h2>
              <span className="px-3 py-1 bg-red-950/60 border border-red-500/40 text-white rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm">
                <span>📍 Upload Location:</span>
                <span>{user?.country_flag || '🇺🇸'}</span>
                <span className="text-red-400">{user?.country || 'United States'}</span>
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Paste your video embed code or link. ZoneTube automatically detects and extracts the video title and thumbnail directly into InsForge!
            </p>
          </div>

          {/* Instant Auto-Upload Active Notification Badge */}
          <div className="p-3.5 bg-gradient-to-r from-red-950/70 via-black to-zinc-950 border border-red-500/40 rounded-2xl flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2.5">
              <span className="text-xl shrink-0">⚡</span>
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Instant Auto-Upload Active</span>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-mono">
                    Zero-Click Ready
                  </span>
                </p>
                <p className="text-[11px] text-zinc-400">
                  Immediately paste any iframe embed code or video link — ZoneTube automatically fetches title, thumbnail & uploads without pressing any button!
                </p>
              </div>
            </div>
            {isSubmittingImport && (
              <span className="px-3 py-1 bg-red-600/30 text-red-300 border border-red-500/40 rounded-full text-xs font-mono font-bold animate-pulse shrink-0">
                ⚡ Fetching & Uploading...
              </span>
            )}
          </div>

          {/* Just Uploaded Video Card */}
          {justUploadedVideo && (
            <div className="p-4 bg-gradient-to-r from-emerald-950/50 via-[#151821] to-black border border-emerald-500/50 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl animate-fade-in">
              <div className="flex items-center gap-3.5 min-w-0">
                <img
                  src={justUploadedVideo.thumbnail_url}
                  alt={justUploadedVideo.title}
                  className="w-24 h-16 object-cover rounded-xl border border-emerald-500/40 shrink-0 shadow-md bg-zinc-900"
                />
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-mono font-bold">
                      ✓ Just Uploaded & Live in InsForge
                    </span>
                    <span className="text-xs text-zinc-300">
                      {justUploadedVideo.country_flag} {justUploadedVideo.country}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white truncate max-w-md" title={justUploadedVideo.title}>
                    {justUploadedVideo.title}
                  </h4>
                  <p className="text-[10px] text-zinc-400">
                    Category: <span className="text-zinc-200 font-semibold">{justUploadedVideo.category}</span> • Duration: {justUploadedVideo.duration}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('videos')}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all cursor-pointer border border-white/10"
                >
                  View My Videos
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleImportVideo} className="space-y-5 max-w-2xl">
            {/* Embed Code / URL Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <span>Video Embed Code or Link</span>
                  <span className="text-[10px] text-red-400 font-normal">
                    (Auto-uploads immediately on paste)
                  </span>
                </label>
                {isExtractingInfo && (
                  <span className="text-[11px] text-[var(--accent-red)] font-semibold animate-pulse">
                    ⚡ Auto-uploading stream...
                  </span>
                )}
              </div>
              <textarea
                value={importForm.embed_url}
                onChange={(e) => handleEmbedChange(e.target.value)}
                onPaste={(e) => {
                  const pasted = e.clipboardData.getData('text');
                  if (pasted) {
                    setImportForm((prev) => ({ ...prev, embed_url: pasted }));
                    triggerAutoFetchAndUpload(pasted);
                  }
                }}
                placeholder='Immediately paste iframe code e.g. <iframe src="https://www.xvideos.com/embedframe/12345" ...></iframe> or XVideos link'
                rows={4}
                className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-[var(--accent-red)] transition-colors"
                required
              />
              <p className="text-[11px] text-zinc-400">
                Paste with <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] text-zinc-300">Ctrl+V</kbd> or <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] text-zinc-300">Cmd+V</kbd> or right-click Paste. Stream is auto-uploaded immediately!
              </p>
            </div>

            {/* Extracted Metadata Preview Card */}
            {extractedPreviewTitle && (
              <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-fade-in shadow-lg">
                {extractedPreviewThumb && (
                  <img
                    src={extractedPreviewThumb}
                    alt={extractedPreviewTitle}
                    className="w-36 h-20 object-cover rounded-xl border border-white/10 shrink-0 shadow-md"
                  />
                )}
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-mono font-bold">
                      ✓ Real XVideos Stream Detected
                    </span>
                    {extractedPreviewDuration && (
                      <span className="px-2 py-0.5 bg-black/60 text-zinc-300 border border-white/10 rounded-full text-[10px] font-mono">
                        ⏱️ {extractedPreviewDuration}
                      </span>
                    )}
                    {extractedPreviewChannel && (
                      <span className="px-2 py-0.5 bg-black/60 text-zinc-300 border border-white/10 rounded-full text-[10px] font-mono">
                        👤 {extractedPreviewChannel}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-white line-clamp-2">{extractedPreviewTitle}</p>
                </div>
              </div>
            )}

            {/* Category Dropdown (Populated Dynamically from Admin Categories) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Video Category
              </label>
              <select
                value={importForm.category}
                onChange={(e) => setImportForm({ ...importForm, category: e.target.value })}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[var(--accent-red)] transition-colors cursor-pointer"
              >
                {adminCategories.length > 0 ? (
                  adminCategories.map((cat) => (
                    <option key={cat.id || cat.name} value={cat.name}>
                      {cat.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="General">General</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Gaming">Gaming</option>
                    <option value="Music">Music</option>
                  </>
                )}
              </select>
              <p className="text-[11px] text-zinc-400">
                ✨ Title, thumbnail, duration, channel, country location flag, and tags are automatically fetched and saved into your video management list & homepage.
              </p>
            </div>

            <Button type="submit" isLoading={isSubmittingImport} className="w-full sm:w-auto">
              {isSubmittingImport ? '⚡ Uploading Video to InsForge...' : '⚡ Upload Video (Or Just Paste Above)'}
            </Button>
          </form>
        </div>
      )}

      {/* TAB 3: IMPORTED VIDEOS MANAGEMENT (Edit, Delete, Watch) */}
      {activeTab === 'videos' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                <span>🎬</span> Your Imported Videos
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Manage your imported videos, update their categories or embed links, or remove them.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('import')}
              className="px-4 py-2 bg-[var(--accent-red)] text-white text-xs font-bold rounded-xl hover:opacity-90 transition-all shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <span>＋</span> Import New Video
            </button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-64 bg-[#151821] border border-white/5 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : userVideos.length === 0 ? (
            <div className="p-12 text-center bg-[#151821] border border-white/10 rounded-3xl space-y-4 max-w-lg mx-auto">
              <span className="text-4xl block">🎬</span>
              <h3 className="text-lg font-bold text-white">No Imported Videos Yet</h3>
              <p className="text-xs text-zinc-400">
                You haven't imported any videos yet. Paste any video embed code to add your first stream!
              </p>
              <button
                onClick={() => setActiveTab('import')}
                className="px-5 py-2.5 bg-[var(--accent-red)] text-white font-bold text-xs rounded-xl shadow-lg hover:opacity-90 transition-all cursor-pointer"
              >
                Import Video Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {userVideos.map((video) => (
                <div
                  key={video.id}
                  className="bg-[#151821] border border-white/10 hover:border-white/20 rounded-2xl overflow-hidden flex flex-col justify-between transition-all shadow-xl group"
                >
                  <div className="relative aspect-video bg-zinc-900 overflow-hidden">
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <button
                      onClick={() => onOpenVideo(video)}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg"
                        style={{ backgroundColor: 'var(--accent-red)' }}
                      >
                        ▶
                      </div>
                    </button>
                    <span className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 text-[10px] font-bold rounded text-white border border-white/10">
                      {video.category}
                    </span>
                    {video.country_flag && (
                      <span className="absolute top-2 left-2 bg-black/80 px-2 py-0.5 text-xs font-bold rounded text-white border border-white/10">
                        {video.country_flag}
                      </span>
                    )}
                  </div>

                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h4
                        className="text-sm font-bold text-white leading-snug line-clamp-2"
                        title={video.title}
                      >
                        {video.title}
                      </h4>
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                        {video.description || 'Imported stream'}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                      <button
                        onClick={() => onOpenVideo(video)}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                      >
                        Watch
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(video)}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white font-bold text-xs rounded-lg border border-white/10 transition-colors cursor-pointer"
                          title="Edit video details"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDeleteVideo(video.id)}
                          disabled={deletingVideoId === video.id}
                          className="px-2.5 py-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 font-bold text-xs rounded-lg border border-red-900/40 transition-colors cursor-pointer"
                          title="Delete video"
                        >
                          {deletingVideoId === video.id ? '...' : '🗑️'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* EDIT VIDEO MODAL */}
      {editingVideo && (
        <Modal
          isOpen={!!editingVideo}
          onClose={() => setEditingVideo(null)}
          title="Edit Imported Video"
          maxWidth="lg"
        >
          <form onSubmit={handleSaveEditedVideo} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 uppercase">Video Title</label>
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--accent-red)]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 uppercase">Embed Frame Link</label>
              <input
                type="text"
                value={editForm.embed_url}
                onChange={(e) => setEditForm({ ...editForm, embed_url: e.target.value })}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[var(--accent-red)]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 uppercase">Category</label>
              <select
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--accent-red)]"
              >
                {adminCategories.length > 0 ? (
                  adminCategories.map((cat) => (
                    <option key={cat.id || cat.name} value={cat.name}>
                      {cat.name}
                    </option>
                  ))
                ) : (
                  <option value="General">General</option>
                )}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 uppercase">Tags (Comma-separated)</label>
              <input
                type="text"
                value={editForm.tags}
                onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                placeholder="e.g. 4k, trending, cosplay, vr"
                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--accent-red)]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 uppercase">Description</label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
                className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[var(--accent-red)]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
              <Button type="button" variant="secondary" onClick={() => setEditingVideo(null)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSavingEdit}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
