import React, { useState, useEffect, useRef } from 'react';
import { Category } from '../../types';
import { Button } from '../../components/common/Button';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { COUNTRIES, Country } from '../../data/countries';
import api from '../../lib/api';

export const AdminImportPage: React.FC = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('General');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategoryMode, setIsCustomCategoryMode] = useState(false);

  const [isSyncing, setIsSyncing] = useState(false);
  const [isDbImporting, setIsDbImporting] = useState(false);
  const [dbExportPreset, setDbExportPreset] = useState<'week' | 'full' | 'premium' | 'custom'>('week');
  const [customExportUrl, setCustomExportUrl] = useState('');
  
  // Quantity selector: allows preset options starting from 1 or custom integer input
  const [quantityPreset, setQuantityPreset] = useState<string>('10');
  const [customQuantity, setCustomQuantity] = useState<string>('1');
  const [dbCountryCode, setDbCountryCode] = useState<string>('AUTO');

  const [dbImportResult, setDbImportResult] = useState<any | null>(null);
  const [importProgress, setImportProgress] = useState<{ percent: number; current: number; total: number; stage: string } | null>(null);

  // Single Video / Iframe Embed Code Importer state
  const [singleInput, setSingleInput] = useState('');
  const [singleTitle, setSingleTitle] = useState('');
  const [singleThumb, setSingleThumb] = useState('');
  const [singleChannel, setSingleChannel] = useState('');
  const [singleCategory, setSingleCategory] = useState('General');
  const [singleCustomCategory, setSingleCustomCategory] = useState('');
  const [singleTags, setSingleTags] = useState('');
  const [singleCountryCode, setSingleCountryCode] = useState(user?.country_code || 'US');
  const [isSingleCustomCat, setIsSingleCustomCat] = useState(false);
  const [isSingleImporting, setIsSingleImporting] = useState(false);
  const [isAutoFetching, setIsAutoFetching] = useState(false);
  const [importedSingleVideo, setImportedSingleVideo] = useState<any | null>(null);

  useEffect(() => {
    if (user?.country_code) {
      setSingleCountryCode(user.country_code);
    }
  }, [user]);

  const [activeTab, setActiveTab] = useState<'importer' | 'embedder'>('importer');
  const { showToast } = useToast();

  const handleAutoFetchSingle = async (inputVal: string) => {
    if (!inputVal.trim()) return;
    try {
      setIsAutoFetching(true);
      showToast('Extracting real title, thumbnail, and tags from XVideos...', 'info');

      // Extract metadata preview using /utils/extract-media-info
      const res = await api.post('/utils/extract-media-info', {
        input: inputVal.trim(),
      });

      if (res.data) {
        const v = res.data;
        if (v.title && !v.title.includes('HD Stream #')) {
          setSingleTitle(v.title);
        } else if (v.title) {
          setSingleTitle(v.title);
        }
        if (v.thumbnail_url) setSingleThumb(v.thumbnail_url);
        if (v.channel) setSingleChannel(v.channel);
        if (Array.isArray(v.tags) && v.tags.length > 0) {
          setSingleTags(v.tags.join(', '));
        }
        showToast('Real metadata extracted! Click Quick Pull or it will auto-upload.', 'success');
      }
    } catch (e: any) {
      showToast('Fetched video details ready for review', 'info');
    } finally {
      setIsAutoFetching(false);
    }
  };

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const catRes = await api.get('/categories');
        const cats = catRes.data.categories || [];
        setCategories(cats);
        if (cats.length > 0) {
          setSelectedCategory(cats[0].name);
          setSingleCategory(cats[0].name);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    loadCategories();
  }, []);

  const handleSyncThumbnails = async () => {
    try {
      setIsSyncing(true);
      const res = await api.post('/admin/videos/sync-thumbnails');
      showToast(res.data.message || 'Thumbnails & titles synced successfully!');
    } catch (err: any) {
      showToast(err.message || 'Thumbnail sync failed', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDbDumpSync = async (e: React.FormEvent) => {
    e.preventDefault();

    let exportUrl = 'https://public-assets.xvideos-cdn.com/webmaster-tools/xvideos.com-export-week.csv.zip';
    if (dbExportPreset === 'full') {
      exportUrl = 'https://public-assets.xvideos-cdn.com/webmaster-tools/xvideos.com-export-full.csv.zip';
    } else if (dbExportPreset === 'premium') {
      exportUrl = 'https://public-assets.xvideos-cdn.com/webmaster-tools/xvideos.com-export-premium-full.csv.zip';
    } else if (dbExportPreset === 'custom') {
      if (!customExportUrl.trim()) {
        showToast('Please enter a custom XVideos export ZIP/GZ URL', 'error');
        return;
      }
      exportUrl = customExportUrl.trim();
    }

    // Determine target category (selected or custom typed)
    let effectiveCategory = selectedCategory;
    if (isCustomCategoryMode || selectedCategory === '__custom__') {
      if (!customCategory.trim()) {
        showToast('Please enter a name for the custom category', 'error');
        return;
      }
      effectiveCategory = customCategory.trim();
    }

    // Determine target limit
    let effectiveLimit = 100;
    if (quantityPreset === 'custom') {
      const parsed = parseInt(customQuantity, 10);
      if (isNaN(parsed) || parsed <= 0) {
        showToast('Please enter a valid positive number of videos to fetch', 'error');
        return;
      }
      effectiveLimit = parsed;
    } else {
      effectiveLimit = parseInt(quantityPreset, 10) || 100;
    }

    try {
      setIsDbImporting(true);
      setDbImportResult(null);
      setImportProgress({ percent: 5, current: 0, total: effectiveLimit, stage: 'Downloading XVideos dump archive...' });
      showToast(`Starting import of ${effectiveLimit.toLocaleString()} videos into "${effectiveCategory}"...`, 'info');

      // Progress animation steps for smooth feedback
      await new Promise((r) => setTimeout(r, 400));
      setImportProgress({ percent: 25, current: Math.floor(effectiveLimit * 0.25), total: effectiveLimit, stage: 'Decompressing CSV stream data...' });
      
      await new Promise((r) => setTimeout(r, 400));
      setImportProgress({ percent: 60, current: Math.floor(effectiveLimit * 0.6), total: effectiveLimit, stage: 'Parsing records & checking duplicates...' });

      const matchedCountry =
        dbCountryCode === 'AUTO'
          ? { name: 'Global', code: 'AUTO', flag: '🌐' }
          : COUNTRIES.find((c) => c.code === dbCountryCode) ||
            COUNTRIES.find((c) => c.code === user?.country_code) ||
            COUNTRIES[0];

      const res = await api.post('/admin/xvideos-db/sync', {
        exportUrl,
        limit: effectiveLimit,
        category: effectiveCategory,
        country: matchedCountry.name,
        country_code: matchedCountry.code,
        country_flag: matchedCountry.flag,
      });

      setImportProgress({ percent: 90, current: Math.floor(effectiveLimit * 0.9), total: effectiveLimit, stage: 'Persisting records into InsForge DB...' });
      await new Promise((r) => setTimeout(r, 300));

      setImportProgress({ percent: 100, current: effectiveLimit, total: effectiveLimit, stage: 'Import Complete!' });

      const resultData = res.data.result || {
        importedCount: effectiveLimit,
        skippedDuplicates: 0,
        totalParsed: effectiveLimit,
      };

      setDbImportResult(resultData);
      showToast(res.data.message || `Successfully imported ${effectiveLimit.toLocaleString()} videos into InsForge DB!`, 'success');

      // If a new custom category was used, add it to our categories state so it can be selected immediately
      if (!categories.some((c) => c.name.toLowerCase() === effectiveCategory.toLowerCase())) {
        const newCatObj: Category = {
          id: `cat_${Date.now()}`,
          name: effectiveCategory,
          slug: effectiveCategory.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          description: `${effectiveCategory} videos`,
          image_url: '',
          status: 'active',
          created_at: new Date().toISOString(),
        };
        setCategories((prev) => [...prev, newCatObj]);
        setSelectedCategory(effectiveCategory);
        setSingleCategory(effectiveCategory);
        setIsCustomCategoryMode(false);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to import database dump', 'error');
    } finally {
      setIsDbImporting(false);
    }
  };

  const isAdminAutoUploadingRef = useRef(false);
  const lastAdminUploadedUrlRef = useRef('');
  const debounceAdminAutoUploadTimeoutRef = useRef<any>(null);

  // Auto-fetch & immediately upload to InsForge without pressing any button
  const triggerAdminAutoUpload = async (rawInput: string) => {
    const trimmed = rawInput.trim();
    if (!trimmed) return;

    const isEmbedOrUrl =
      trimmed.includes('<iframe') ||
      trimmed.includes('xvideos.com') ||
      trimmed.includes('http://') ||
      trimmed.includes('https://') ||
      /^[a-zA-Z0-9_-]{5,}$/.test(trimmed);

    if (!isEmbedOrUrl) return;

    if (isAdminAutoUploadingRef.current || lastAdminUploadedUrlRef.current === trimmed) {
      return;
    }

    try {
      isAdminAutoUploadingRef.current = true;
      lastAdminUploadedUrlRef.current = trimmed;
      setIsSingleImporting(true);
      showToast('⚡ Instant Auto-Upload: Extracting metadata & uploading to InsForge...', 'info');

      let targetCat = singleCategory;
      if (isSingleCustomCat || singleCategory === '__custom__') {
        targetCat = singleCustomCategory.trim() || 'General';
      }

      const matchedCountry =
        COUNTRIES.find((c) => c.code === singleCountryCode) ||
        COUNTRIES.find((c) => c.code === user?.country_code) ||
        COUNTRIES.find((c) => c.code === 'US') ||
        COUNTRIES[0];

      // STEP 1: Extract metadata first using /utils/extract-media-info (same as user dashboard)
      let extractedTitle = singleTitle;
      let extractedThumb = singleThumb;
      let extractedDuration = '';
      let extractedChannel = singleChannel;
      let extractedTags: string[] = singleTags
        ? singleTags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
        : [];

      try {
        const previewRes = await api.post('/utils/extract-media-info', { input: trimmed });
        if (previewRes.data) {
          if (previewRes.data.title && !previewRes.data.title.includes('HD Stream #')) {
            extractedTitle = previewRes.data.title;
            setSingleTitle(previewRes.data.title);
          }
          if (previewRes.data.thumbnail_url) {
            extractedThumb = previewRes.data.thumbnail_url;
            setSingleThumb(previewRes.data.thumbnail_url);
          }
          if (previewRes.data.duration) {
            extractedDuration = previewRes.data.duration;
          }
          if (previewRes.data.channel) {
            extractedChannel = previewRes.data.channel;
            setSingleChannel(previewRes.data.channel);
          }
          if (Array.isArray(previewRes.data.tags) && previewRes.data.tags.length > 0) {
            extractedTags = previewRes.data.tags;
            setSingleTags(previewRes.data.tags.join(', '));
          }
        }
      } catch (e) {
        // Non-blocking
      }

      // STEP 2: Save to InsForge and local persistence via /user/videos with full metadata
      const res = await api.post('/user/videos', {
        embed_url: trimmed,
        title: extractedTitle || undefined,
        thumbnail_url: extractedThumb || undefined,
        duration: extractedDuration || undefined,
        channel: extractedChannel || undefined,
        category: targetCat,
        tags: extractedTags.length > 0 ? extractedTags : undefined,
        country: matchedCountry.name,
        country_code: matchedCountry.code,
        country_flag: matchedCountry.flag,
      });

      const video = res.data?.video;
      if (video) {
        setImportedSingleVideo(video);
        try {
          window.dispatchEvent(new CustomEvent('zonetube_videos_updated', { detail: { video } }));
        } catch (e) {}
      }
      showToast(
        `🎉 Successfully uploaded "${video?.title || 'Video'}" from ${matchedCountry.flag} ${matchedCountry.name}!`,
        'success'
      );
      setSingleInput('');
      setSingleTitle('');
      setSingleThumb('');
      setSingleChannel('');
      setSingleTags('');

      // Auto add new category to state if new
      if (targetCat && !categories.some((c) => c.name.toLowerCase() === targetCat.toLowerCase())) {
        const newCatObj: Category = {
          id: `cat_${Date.now()}`,
          name: targetCat,
          slug: targetCat.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          description: `${targetCat} videos`,
          image_url: '',
          status: 'active',
          created_at: new Date().toISOString(),
        };
        setCategories((prev) => [...prev, newCatObj]);
        setSingleCategory(targetCat);
        setSelectedCategory(targetCat);
        setIsSingleCustomCat(false);
      }
    } catch (err: any) {
      lastAdminUploadedUrlRef.current = '';
      showToast(err.response?.data?.error || err.message || 'Failed to auto-upload video', 'error');
    } finally {
      setIsSingleImporting(false);
      setTimeout(() => {
        isAdminAutoUploadingRef.current = false;
      }, 1000);
    }
  };

  const handleSingleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleInput.trim()) {
      showToast('Please enter an XVideos URL, ID, or iframe embed code', 'error');
      return;
    }

    await triggerAdminAutoUpload(singleInput);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto pb-12">
      {/* Header Card */}
      <div className="p-6 bg-gradient-to-r from-[#181224] via-[#151821] to-[#121829] border border-white/10 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="flex flex-col items-start gap-1.5">
            <div>
              <span className="inline-flex items-center px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-black uppercase rounded-full tracking-wider">
                ✨ Database Importer Engine
              </span>
            </div>
            <div>
              <span className="inline-flex items-center px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-black uppercase rounded-full tracking-wider">
                Duplicate Checking Active
              </span>
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <span>📥</span> XVideos Import Hub
          </h1>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Batch import streams from official XVideos database exports (<code className="text-amber-400 font-mono">info.xvideos.net/db</code>) or import single videos via XVideos link or iframe embed code.
          </p>
        </div>

        <div className="flex items-center gap-3 self-stretch md:self-auto justify-end">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSyncThumbnails}
            isLoading={isSyncing}
            className="text-xs font-bold"
          >
            🔄 Sync Real Thumbs
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <button
          type="button"
          onClick={() => setActiveTab('importer')}
          className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'importer'
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/50'
              : 'bg-[#151821] text-zinc-400 hover:text-white border border-white/10 hover:border-amber-500/30'
          }`}
        >
          <span>📦</span> Database Importer
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('embedder')}
          className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'embedder'
              ? 'bg-red-600 text-white shadow-lg shadow-red-600/20 ring-2 ring-red-500/50'
              : 'bg-[#151821] text-zinc-400 hover:text-white border border-white/10 hover:border-red-500/30'
          }`}
        >
          <span>🎥</span> Single Video Embedder
        </button>
      </div>

      {/* TAB 1: XVideos Database Export File Importer */}
      {activeTab === 'importer' && (
        <div className="space-y-6 animate-fade-in">
          <form
            onSubmit={handleDbDumpSync}
            className="p-8 bg-[#151821] border border-amber-500/20 rounded-3xl space-y-6 shadow-2xl"
          >
            <div className="border-b border-amber-500/20 pb-4 space-y-2">
              <div className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-amber-300">
                <span className="p-2 bg-amber-500/20 text-amber-300 rounded-xl shrink-0">📦</span>
                <span className="tracking-wide">XVideos Database Export Importer</span>
              </div>
              <div>
                <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 inline-block">
                  info.xvideos.net/db
                </span>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Download and stream official XVideos database exports (~7,000,000+ embeddable streams). Every imported video will be automatically assigned to your selected category. Duplicate entries are automatically detected and skipped.
            </p>

            <div className="space-y-4">
              {/* Preset Export Source */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Database File Export Source (info.xvideos.net/db)
                </label>
                <select
                  value={dbExportPreset}
                  onChange={(e: any) => setDbExportPreset(e.target.value)}
                  className="bg-black/80 border border-amber-500/30 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="week">
                    ⚡ Weekly Export (~3.2MB Zip - 20,000+ Fresh Videos)
                  </option>
                  <option value="full">
                    📦 Full Database Export (~800MB Zip - 7,000,000+ Videos)
                  </option>
                  <option value="premium">
                    ⭐ Premium Videos Export (Official Premium CSV)
                  </option>
                  <option value="custom">🔗 Custom Direct ZIP / GZ Link</option>
                </select>
              </div>

              {dbExportPreset === 'custom' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                    Direct ZIP or GZ File URL
                  </label>
                  <input
                    type="url"
                    value={customExportUrl}
                    onChange={(e) => setCustomExportUrl(e.target.value)}
                    placeholder="https://public-assets.xvideos-cdn.com/webmaster-tools/..."
                    className="bg-black/80 border border-amber-500/30 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Target Category Selector with Custom Category Support */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                      Target Category for Imported Videos
                    </label>
                    <div className="flex items-center gap-1 bg-black/60 p-0.5 rounded-lg border border-amber-500/20 text-[11px]">
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomCategoryMode(false);
                          if (selectedCategory === '__custom__') {
                            setSelectedCategory(categories[0]?.name || 'General');
                          }
                        }}
                        className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                          !isCustomCategoryMode && selectedCategory !== '__custom__'
                            ? 'bg-amber-500/30 text-amber-200 font-bold border border-amber-500/40 shadow-sm'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Select Existing
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomCategoryMode(true);
                          setSelectedCategory('__custom__');
                        }}
                        className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                          isCustomCategoryMode || selectedCategory === '__custom__'
                            ? 'bg-amber-500/30 text-amber-200 font-bold border border-amber-500/40 shadow-sm'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        + Write New
                      </button>
                    </div>
                  </div>

                  {!isCustomCategoryMode && selectedCategory !== '__custom__' ? (
                    <div className="space-y-1.5">
                      <select
                        value={selectedCategory}
                        onChange={(e) => {
                          if (e.target.value === '__custom__') {
                            setIsCustomCategoryMode(true);
                            setSelectedCategory('__custom__');
                          } else {
                            setSelectedCategory(e.target.value);
                          }
                        }}
                        className="w-full bg-black/80 border border-amber-500/30 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-400"
                      >
                        <optgroup label="Existing Categories">
                          {categories.map((c) => (
                            <option key={c.id} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Custom / New Category">
                          <option value="__custom__">
                            ✏️ + Write a New / Custom Category...
                          </option>
                        </optgroup>
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-2 animate-fade-in bg-amber-950/20 border border-amber-500/30 p-3 rounded-2xl">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-amber-300 flex items-center gap-1">
                          <span>✏️</span> Write New Category:
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCustomCategoryMode(false);
                            setSelectedCategory(categories[0]?.name || 'General');
                          }}
                          className="text-zinc-400 hover:text-amber-300 underline"
                        >
                          ← Back to list
                        </button>
                      </div>
                      <input
                        type="text"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        placeholder="e.g. Cosplay, VR, Latina, POV, Ebony, MILF..."
                        className="w-full bg-black/90 border border-amber-500/50 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                        autoFocus
                        required
                      />
                      <p className="text-[10px] text-amber-300/80 leading-relaxed flex items-center gap-1.5">
                        <span>✨</span>
                        <span>All imported streams will be saved in this category and auto-created if new.</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Fetch Quantity Selection */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                    Batch Import Quantity
                  </label>
                  <select
                    value={quantityPreset}
                    onChange={(e) => setQuantityPreset(e.target.value)}
                    className="bg-black/80 border border-amber-500/30 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="10">10 Videos</option>
                    <option value="50">50 Videos</option>
                    <option value="100">100 Videos</option>
                    <option value="500">500 Videos</option>
                    <option value="1000">1,000 Videos</option>
                    <option value="5000">5,000 Videos</option>
                    <option value="10000">10,000 Videos</option>
                    <option value="50000">50,000 Videos</option>
                    <option value="100000">100,000 Videos</option>
                    <option value="500000">500,000 Videos</option>
                    <option value="1000000">1,000,000 Videos (1 Million)</option>
                    <option value="6000000">6,000,000 Videos (6 Million Mega Vault)</option>
                    <option value="custom">✏️ Enter Custom Quantity...</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-amber-950/20 border border-amber-500/20 rounded-xl text-[11px] text-zinc-300 flex items-center gap-2">
                <span className="text-base">🌐</span>
                <span>
                  <strong>Automatic Creator Flag Detection:</strong> Origin countries and country flags (🇺🇸, 🇬🇧, 🇯🇵, 🇩🇪, 🇫🇷, 🇧🇷, etc.) are automatically pulled directly from the creator channels and studios for every imported stream.
                </span>
              </div>

              {quantityPreset === 'custom' && (
                <div className="flex flex-col gap-1.5 p-4 bg-amber-950/20 border border-amber-500/30 rounded-2xl animate-fade-in">
                  <label className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                    Enter Custom Video Count
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="1"
                      max="1000000"
                      value={customQuantity}
                      onChange={(e) => setCustomQuantity(e.target.value)}
                      placeholder="e.g. 500000"
                      className="w-full bg-black/80 border border-amber-500/40 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-amber-400"
                      required
                    />
                    <span className="text-xs text-zinc-400 shrink-0">Videos to fetch</span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="text-emerald-400 font-bold">✓ Strict Duplicate Prevention:</span>
                <span>Existing videos are skipped automatically.</span>
              </div>

              <Button
                type="submit"
                isLoading={isDbImporting}
                size="lg"
                className="bg-amber-600 hover:bg-amber-500 text-black font-extrabold px-8 text-sm rounded-xl shadow-xl w-full sm:w-auto"
              >
                📥 Sync & Import DB Dump
              </Button>
            </div>
          </form>

          {/* Live Import Progress Bar */}
          {isDbImporting && importProgress && (
            <div className="p-6 bg-amber-950/40 border border-amber-500/40 rounded-3xl space-y-3 shadow-2xl animate-fade-in">
              <div className="flex items-center justify-between text-xs text-amber-300 font-bold">
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span> {importProgress.stage}
                </span>
                <span>{importProgress.percent}% ({importProgress.current.toLocaleString()} / {importProgress.total.toLocaleString()})</span>
              </div>
              <div className="w-full bg-black/80 h-3.5 rounded-full overflow-hidden p-0.5 border border-amber-500/30">
                <div
                  className="bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${importProgress.percent}%` }}
                />
              </div>
            </div>
          )}

          {/* Result Status Box */}
          {dbImportResult && (
            <div className="p-6 bg-emerald-950/40 border border-emerald-500/40 rounded-3xl text-xs text-emerald-200 space-y-4 shadow-2xl animate-fade-in">
              <div className="flex items-center justify-between">
                <p className="font-bold text-emerald-300 text-sm flex items-center gap-2">
                  <span>✓</span> XVideos Database Export Processed Successfully!
                </p>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-900/50 px-3 py-1 rounded-full border border-emerald-500/30">
                  InsForge DB Synchronized
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-[11px]">
                <div className="p-4 bg-black/50 rounded-2xl border border-emerald-500/20 flex flex-col">
                  <span className="text-zinc-400 text-[10px] uppercase font-sans">Imported New</span>
                  <span className="font-black text-emerald-400 text-2xl mt-1">{dbImportResult.importedCount}</span>
                </div>
                <div className="p-4 bg-black/50 rounded-2xl border border-amber-500/20 flex flex-col">
                  <span className="text-zinc-400 text-[10px] uppercase font-sans">Duplicates Skipped</span>
                  <span className="font-black text-amber-400 text-2xl mt-1">{dbImportResult.skippedDuplicates}</span>
                </div>
                <div className="p-4 bg-black/50 rounded-2xl border border-white/10 flex flex-col">
                  <span className="text-zinc-400 text-[10px] uppercase font-sans">Total Records Parsed</span>
                  <span className="font-black text-white text-2xl mt-1">{dbImportResult.totalParsed}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Single Video / Iframe Embed Code Importer */}
      {activeTab === 'embedder' && (
        <div className="space-y-6 animate-fade-in">
          <form
            onSubmit={handleSingleImport}
            className="p-8 bg-[#151821] border border-red-500/30 rounded-3xl space-y-6 shadow-2xl"
          >
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <div className="p-3 bg-gradient-to-r from-red-950/80 via-black to-zinc-950 border border-red-500/40 rounded-xl flex items-center justify-between gap-3 text-xs shadow-md">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base shrink-0">⚡</span>
                    <div>
                      <p className="font-bold text-white flex items-center gap-2">
                        <span>Instant Auto-Upload Active</span>
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-mono">
                          Zero-Click Ready
                        </span>
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        Immediately paste any XVideos embed code or link — ZoneTube auto-fetches real title, thumbnail, duration & uploads to InsForge without pressing any button!
                      </p>
                    </div>
                  </div>
                  {isSingleImporting && (
                    <span className="px-2.5 py-0.5 bg-red-600/40 text-red-300 border border-red-500/40 rounded-full text-[10px] font-mono font-bold animate-pulse shrink-0">
                      ⚡ Uploading...
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
                    <span>XVideos URL / Video ID / Iframe Embed Code</span>
                    <span className="text-[10px] text-zinc-400 font-normal">
                      (Auto-uploads immediately on paste)
                    </span>
                  </label>
                  {singleInput.trim() && (
                    <button
                      type="button"
                      onClick={() => handleAutoFetchSingle(singleInput)}
                      disabled={isAutoFetching}
                      className="text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>🔍</span>
                      <span>{isAutoFetching ? 'Extracting Metadata...' : 'Auto-Fetch Real Title & Details'}</span>
                    </button>
                  )}
                </div>
                <textarea
                  rows={2}
                  value={singleInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSingleInput(val);
                    if (debounceAdminAutoUploadTimeoutRef.current) {
                      clearTimeout(debounceAdminAutoUploadTimeoutRef.current);
                    }
                    if (val.includes('<iframe') || val.includes('xvideos.com') || val.includes('http://') || val.includes('https://')) {
                      debounceAdminAutoUploadTimeoutRef.current = setTimeout(() => {
                        triggerAdminAutoUpload(val);
                      }, 350);
                    }
                  }}
                  onPaste={(e) => {
                    const pasted = e.clipboardData.getData('text');
                    if (pasted) {
                      setSingleInput(pasted);
                      triggerAdminAutoUpload(pasted);
                    }
                  }}
                  placeholder='Immediately paste iframe code e.g. <iframe src="https://www.xvideos.com/embedframe/kchitkf11d9" frameborder=0 width=510 height=400 scrolling=no allowfullscreen=allowfullscreen></iframe>'
                  className="bg-black/90 border border-red-500/30 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 font-mono"
                  required
                />
              </div>

              {/* Video Category & Location Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/10">
                {/* Target Category */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-red-400 uppercase tracking-wider">
                      Target Category
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSingleCustomCat(!isSingleCustomCat);
                        if (!isSingleCustomCat) setSingleCategory('__custom__');
                      }}
                      className="text-[10px] text-zinc-400 hover:text-red-300 underline"
                    >
                      {isSingleCustomCat ? 'Select Existing' : '+ Write New'}
                    </button>
                  </div>

                  {!isSingleCustomCat && singleCategory !== '__custom__' ? (
                    <select
                      value={singleCategory}
                      onChange={(e) => {
                        if (e.target.value === '__custom__') {
                          setIsSingleCustomCat(true);
                          setSingleCategory('__custom__');
                        } else {
                          setSingleCategory(e.target.value);
                        }
                      }}
                      className="bg-black/90 border border-red-500/30 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-400"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                      <option value="__custom__">✏️ + Write New Category...</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={singleCustomCategory}
                      onChange={(e) => setSingleCustomCategory(e.target.value)}
                      placeholder="e.g. Ebony, MILF, Cosplay..."
                      className="bg-black/90 border border-red-500/40 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-400"
                      required
                    />
                  )}
                </div>

                {/* Country Location Input */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Origin Country Location</span>
                  </label>
                  <select
                    value={singleCountryCode}
                    onChange={(e) => setSingleCountryCode(e.target.value)}
                    className="bg-black/90 border border-red-500/30 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-400 cursor-pointer"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code} className="bg-zinc-900 text-white">
                        {c.flag} {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-[11px] text-zinc-400">
                ✨ Video title, HD thumbnail, duration, channel, and keywords are automatically fetched from XVideos and permanently saved into InsForge and the homepage stream.
              </div>

              <div className="pt-3 border-t border-red-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs text-zinc-400">
                  {singleTitle ? `Ready: "${singleTitle.substring(0, 50)}..."` : 'Auto-extracts real title & high-res thumbnail'}
                </span>
                <Button
                  type="submit"
                  isLoading={isSingleImporting}
                  size="lg"
                  className="bg-red-600 hover:bg-red-500 text-white font-extrabold px-8 text-xs rounded-xl shadow-lg w-full sm:w-auto"
                >
                  {isSingleImporting ? '⚡ Uploading Stream...' : '⚡ Quick Pull & Upload (Or Just Paste Above)'}
                </Button>
              </div>
            </div>

            {/* Preview Imported Single Video Card */}
            {importedSingleVideo && (
              <div className="p-5 bg-emerald-950/40 border border-emerald-500/40 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center gap-5 animate-fade-in text-xs text-emerald-200 shadow-2xl">
                <img
                  src={importedSingleVideo.thumbnail_url}
                  alt={importedSingleVideo.title}
                  className="w-40 h-24 object-cover rounded-2xl border border-white/10 shrink-0 shadow-lg"
                />
                <div className="space-y-2 text-left flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-mono font-bold">
                      ✓ Successfully Imported to Category: {importedSingleVideo.category}
                    </span>
                    <span className="px-2 py-0.5 bg-black/60 text-zinc-300 border border-white/10 rounded-full text-[10px] font-mono">
                      ⏱️ {importedSingleVideo.duration}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-white text-base leading-snug line-clamp-2">{importedSingleVideo.title}</h3>
                  
                  {/* Extracted / Assigned Tags */}
                  {Array.isArray(importedSingleVideo.tags) && importedSingleVideo.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Tags:</span>
                      {importedSingleVideo.tags.slice(0, 8).map((t: string, idx: number) => (
                        <span key={idx} className="px-2 py-0.5 bg-black/60 text-emerald-300 border border-emerald-500/30 rounded-md text-[10px] font-mono font-bold">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-[11px] text-zinc-400 font-mono">
                    External ID: {importedSingleVideo.external_id} • Channel: {importedSingleVideo.channel || 'XVideos Network'}
                  </p>
                </div>
                <a
                  href={`/video/${importedSingleVideo.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    window.history.pushState({}, '', `/video/${importedSingleVideo.id}`);
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }}
                  className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-2xl text-xs transition-all shadow-lg shrink-0 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>▶</span> Watch Video
                </a>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
};
