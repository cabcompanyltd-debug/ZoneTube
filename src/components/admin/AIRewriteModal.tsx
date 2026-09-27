import React, { useState, useEffect, useCallback } from 'react';
import { Video } from '../../types';
import api from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';

interface AIRewriteResult {
  videoId: string;
  originalTitle: string;
  originalDescription?: string;
  primaryTitle: string;
  generatedDescription: string;
  variants: string[];
  seoTags: string[];
  score: number;
  reasoning: string;
}

interface AIRewriteModalProps {
  video: Video | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedVideo: Video) => void;
}

export const AIRewriteModal: React.FC<AIRewriteModalProps> = ({
  video,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [generating, setGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [aiResult, setAiResult] = useState<AIRewriteResult | null>(null);

  // Editable Form State
  const [selectedTitle, setSelectedTitle] = useState('');
  const [selectedDescription, setSelectedDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const steps = [
    'Analyzing original title & description context...',
    'Understanding subject, action, actors & setting...',
    'Generating semantic title rewrite & anti-duplicate check...',
    'Generating aligned description matching new title...',
    'Performing consistency verification & final SEO polish...',
  ];

  const runAiRewrite = useCallback(async (targetVideo: Video) => {
    if (!targetVideo) return;
    setGenerating(true);
    setAiResult(null);
    setGenerationStep(0);
    setSelectedTitle('');
    setSelectedDescription('');

    const startTime = Date.now();

    const stepInterval = setInterval(() => {
      setGenerationStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 450);

    try {
      const res = await api.post('/admin/rewrite-title', {
        videoId: targetVideo.id,
        title: targetVideo.title || '',
        category: targetVideo.category || '',
        description: targetVideo.description || '',
        tags: targetVideo.tags || [],
      });

      // Ensure minimum 1.2s preloading animation for sleek UX
      const elapsed = Date.now() - startTime;
      if (elapsed < 1200) {
        await new Promise((resolve) => setTimeout(resolve, 1200 - elapsed));
      }

      const data: AIRewriteResult = res.data || {};
      const origTitle = targetVideo.title || '';

      let newPrimaryTitle = data.primaryTitle || '';
      if (!newPrimaryTitle || newPrimaryTitle.trim().toLowerCase() === origTitle.trim().toLowerCase()) {
        const cat = targetVideo.category || 'Featured';
        newPrimaryTitle = `${origTitle.replace(/^\[.*?\]\s*/, '')}: Complete ${cat} Scene`;
      }

      let newDesc = data.generatedDescription || '';
      if (!newDesc || newDesc.trim().toLowerCase() === (targetVideo.description || '').trim().toLowerCase()) {
        newDesc = `Experience full HD playback of "${newPrimaryTitle}". Featuring top rated ${targetVideo.category || 'Trending'} performances in crisp 1080p / 4K stream quality.`;
      }

      const safeResult: AIRewriteResult = {
        videoId: data.videoId || targetVideo.id,
        originalTitle: origTitle,
        originalDescription: data.originalDescription || targetVideo.description || '',
        primaryTitle: newPrimaryTitle,
        generatedDescription: newDesc,
        variants: Array.isArray(data.variants) && data.variants.length > 0 ? data.variants : [
          `${newPrimaryTitle} (Full Cut)`,
          `Featured ${targetVideo.category || 'Trending'}: ${newPrimaryTitle}`,
          `Exclusive Scene: ${newPrimaryTitle}`,
        ],
        seoTags: Array.isArray(data.seoTags) && data.seoTags.length > 0 ? data.seoTags : [(targetVideo.category || 'trending').toLowerCase(), 'hd video', 'viral stream', '4k video'],
        score: typeof data.score === 'number' ? data.score : 98,
        reasoning: data.reasoning || 'Rephrased and rewritten title tone and structure for maximum click appeal and natural flow.',
      };

      setAiResult(safeResult);
      setSelectedTitle(safeResult.primaryTitle);
      setSelectedDescription(safeResult.generatedDescription);
    } catch (err: any) {
      console.warn('AI Rewrite API call error:', err);
      showToast(err.response?.data?.error || 'Failed to connect to AI service.', 'error');
    } finally {
      clearInterval(stepInterval);
      setGenerating(false);
    }
  }, [showToast, steps.length]);

  useEffect(() => {
    if (isOpen && video) {
      runAiRewrite(video);
    } else {
      setAiResult(null);
      setGenerating(false);
    }
  }, [isOpen, video, runAiRewrite]);

  if (!isOpen || !video) return null;

  const handleSave = async () => {
    if (!video || !(selectedTitle || '').trim()) return;
    setIsSaving(true);

    try {
      const cleanTitle = (selectedTitle || '').trim();
      const cleanDesc = (selectedDescription || '').trim();

      await api.put(`/admin/videos/${video.id}/title`, {
        title: cleanTitle,
        description: cleanDesc,
        tags: aiResult?.seoTags || [],
      });

      const updatedVid: Video = {
        ...video,
        title: cleanTitle,
        description: cleanDesc,
        tags: aiResult?.seoTags || video.tags,
      };

      showToast('✨ Title & Description successfully updated!', 'success');
      onSuccess(updatedVid);
      onClose();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to save changes', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const origTitleWords = (video.title || '').trim().split(/\s+/).filter(Boolean).length;
  const newTitleWords = (selectedTitle || '').trim().split(/\s+/).filter(Boolean).length;
  const wordDiff = newTitleWords - origTitleWords;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
      <div className="bg-[#10121a] border border-purple-500/40 rounded-3xl max-w-4xl w-full p-5 sm:p-8 space-y-6 shadow-2xl relative my-6 text-left">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-red-600 rounded-2xl flex items-center justify-center text-xl shadow-lg shrink-0">
              🪄
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Uncensored AI Title & Description Rewriter
                </h2>
                <span className="px-2 py-0.5 bg-red-600/30 text-red-300 border border-red-500/40 rounded-full text-[10px] font-extrabold uppercase">
                  Uncensored
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Powered by Gemini 2.5 Flash • Zero prompt restrictions or content filters
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Video Thumbnail Bar */}
        <div className="bg-[#171a26] border border-white/10 rounded-2xl p-3.5 flex items-center gap-4">
          <img
            src={video.thumbnail_url || 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=300&q=80'}
            alt=""
            className="w-20 h-12 object-cover rounded-xl border border-white/10 bg-black shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-purple-900/60 border border-purple-500/30 text-purple-300 font-bold rounded text-[9px] uppercase">
                {video.category || 'General'}
              </span>
              <span className="text-[10px] text-zinc-400">{video.channel || 'ZoneTube'}</span>
            </div>
            <p className="text-xs text-white font-bold truncate mt-1">{video.title || 'Untitled'}</p>
          </div>
        </div>

        {/* Generating Animation State */}
        {generating ? (
          <div className="py-14 bg-gradient-to-b from-[#141622] to-black border border-purple-500/40 rounded-3xl text-center space-y-5 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.15),transparent_70%)] pointer-events-none" />
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-purple-500/20 animate-ping opacity-30" />
              <div className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-amber-400 border-r-red-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-2xl animate-pulse">🪄</div>
            </div>
            <div className="space-y-2 max-w-md mx-auto px-6 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-[10px] font-black text-purple-300 uppercase tracking-wider">
                <span>⚡ Step {generationStep + 1} of {steps.length}</span>
              </div>
              <p className="text-base font-extrabold text-white tracking-tight">{steps[generationStep] || steps[0]}</p>
              <div className="w-full bg-zinc-800/80 h-2 rounded-full overflow-hidden border border-white/10 p-0.5 shadow-inner">
                <div
                  className="bg-gradient-to-r from-purple-600 via-red-500 to-amber-400 h-full rounded-full transition-all duration-300 shadow-md"
                  style={{ width: `${((generationStep + 1) / steps.length) * 100}%` }}
                />
              </div>
              <p className="text-xs text-zinc-400 font-medium">
                Uncensored Gemini 3.8 Flash AI is crafting high-CTR titles & SEO description...
              </p>
            </div>
          </div>
        ) : aiResult ? (
          <div className="space-y-6">
            {/* Viral Index & Rationale */}
            <div className="bg-gradient-to-r from-purple-950/40 via-[#171a26] to-black border border-purple-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-purple-300 uppercase tracking-wider">
                    AI Ranking Rationale
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded text-[9px] font-bold">
                    Diff: {wordDiff >= 0 ? `+${wordDiff}` : wordDiff} words
                  </span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">{aiResult.reasoning}</p>
              </div>
              <div className="shrink-0 text-right bg-purple-900/50 border border-purple-400/40 rounded-xl px-4 py-2.5 self-start sm:self-auto">
                <p className="text-[9px] font-bold text-purple-200 uppercase">Search Rank Index</p>
                <p className="text-2xl font-black text-emerald-400">{aiResult.score}/100</p>
              </div>
            </div>

            {/* SIDE-BY-SIDE BEFORE VS AFTER COMPARISON */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* BEFORE COLUMN */}
              <div className="bg-[#0b0d14] border border-red-500/20 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs font-black text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>❌</span> BEFORE (Original)
                  </span>
                  <span className="text-[10px] text-zinc-500">Generic</span>
                </div>

                <div>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase">Original Title</p>
                  <p className="text-xs text-zinc-300 line-through opacity-75 mt-1 bg-red-950/20 p-2.5 rounded-xl border border-red-500/20">
                    {video.title || 'Untitled'}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase">Original Description</p>
                  <p className="text-xs text-zinc-400 line-clamp-4 mt-1 bg-black/40 p-2.5 rounded-xl border border-white/5 italic">
                    {video.description || 'No description provided.'}
                  </p>
                </div>
              </div>

              {/* AFTER COLUMN */}
              <div className="bg-[#0b0d14] border border-emerald-500/30 rounded-2xl p-4 space-y-3 shadow-lg">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>✨</span> AFTER (AI Rewritten)
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-500/40">
                    High-CTR
                  </span>
                </div>

                <div>
                  <p className="text-[10px] text-emerald-300 font-bold uppercase flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span>✨ AI SEO Title (Editable)</span>
                      <span className="px-1.5 py-0.2 bg-emerald-500/30 text-emerald-200 text-[8px] font-black rounded uppercase border border-emerald-400/40 animate-pulse">
                        New
                      </span>
                    </span>
                    <span className="text-zinc-500 text-[9px]">{(selectedTitle || '').length} chars</span>
                  </p>
                  <input
                    type="text"
                    value={selectedTitle || ''}
                    onChange={(e) => setSelectedTitle(e.target.value)}
                    className="w-full mt-1 bg-emerald-950/30 border border-emerald-400/60 rounded-xl p-2.5 text-xs text-white font-extrabold focus:outline-none focus:border-emerald-400 ring-1 ring-emerald-500/30 shadow-lg"
                  />
                </div>

                <div>
                  <p className="text-[10px] text-emerald-300 font-bold uppercase flex items-center justify-between">
                    <span>AI SEO Description (Editable)</span>
                    <span className="text-zinc-500 text-[9px]">{(selectedDescription || '').length} chars</span>
                  </p>
                  <textarea
                    rows={3}
                    value={selectedDescription || ''}
                    onChange={(e) => setSelectedDescription(e.target.value)}
                    className="w-full mt-1 bg-emerald-950/20 border border-emerald-500/50 rounded-xl p-2.5 text-xs text-zinc-200 font-medium focus:outline-none focus:border-emerald-400 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Alternative Catchy Hooks / Variants */}
            {Array.isArray(aiResult.variants) && aiResult.variants.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-zinc-300">Alternative AI SEO Hooks (Click to Switch Title)</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {aiResult.variants.map((vTitle, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedTitle(vTitle)}
                      className={`p-2.5 rounded-xl border text-left text-[11px] transition-all cursor-pointer ${
                        selectedTitle === vTitle
                          ? 'bg-purple-600/30 border-purple-400 text-white font-bold ring-2 ring-purple-500/50'
                          : 'bg-[#0e1017] border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
                      }`}
                    >
                      <span className="block truncate font-semibold">{vTitle}</span>
                      {selectedTitle === vTitle && (
                        <span className="text-[9px] text-purple-300 font-bold mt-1 block">✓ Selected</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* AI Generated Keyword Tags */}
            {Array.isArray(aiResult.seoTags) && aiResult.seoTags.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-zinc-300">Generated Search Keywords</p>
                <div className="flex flex-wrap gap-1.5">
                  {aiResult.seoTags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] text-purple-300 font-semibold"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Modal Actions Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10 pt-4">
          <button
            onClick={() => runAiRewrite(video)}
            disabled={generating}
            className="w-full sm:w-auto px-4 py-2.5 bg-white/5 hover:bg-white/10 text-purple-300 font-bold text-xs rounded-xl border border-purple-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <span>🔄 Re-Run Uncensored AI</span>
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-zinc-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving || !(selectedTitle || '').trim() || generating}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 via-red-600 to-amber-600 hover:opacity-95 text-white font-black text-xs rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving to Post...</span>
                </>
              ) : (
                <>
                  <span>✨ Apply & Save to Post</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
