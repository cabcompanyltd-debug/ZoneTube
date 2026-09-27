import React, { useState } from 'react';

export const DmcaPage: React.FC = () => {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [activeTab, setActiveTab] = useState<'policy' | 'notice-form' | 'counter-notice'>('policy');

  // Interactive DMCA Form simulation state
  const [claimantName, setClaimantName] = useState('');
  const [claimantEmail, setClaimantEmail] = useState('');
  const [workTitle, setWorkTitle] = useState('');
  const [infringingUrl, setInfringingUrl] = useState('');
  const [affirmation, setAffirmation] = useState(false);
  const [submittedClaim, setSubmittedClaim] = useState(false);

  const handleCopyEmail = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText('dmca@zonetube.com');
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2500);
    }
  };

  const handleSubmitNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimantName || !claimantEmail || !infringingUrl || !affirmation) return;
    setSubmittedClaim(true);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-fade-in my-6 pb-12">
      {/* Hero Banner with Law / Copyright Image */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl p-8 sm:p-12 bg-gradient-to-r from-amber-950/40 via-[#151821] to-[#0d0f15] flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <i className="fa-solid fa-gavel" />
            <span>Copyright Protection & 2257 Governance</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            DMCA & Content Policy
          </h1>

          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed font-normal">
            ZoneTube respects the intellectual property rights of creators and copyright owners worldwide. We maintain strict compliance with the Digital Millennium Copyright Act (17 U.S.C. § 512), 18 U.S.C. § 2257 recordkeeping exemptions, and rapid takedown procedures.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-zinc-400 font-mono">
            <span><i className="fa-solid fa-bolt text-amber-400 mr-1.5" /> Rapid &lt; 24h Response</span>
            <span>•</span>
            <span><i className="fa-solid fa-stamp text-amber-400 mr-1.5" /> 17 U.S.C. § 512(c) Agent</span>
            <span>•</span>
            <span><i className="fa-solid fa-envelope text-amber-400 mr-1.5" /> dmca@zonetube.com</span>
          </div>
        </div>

        <div className="shrink-0 w-full md:w-72 aspect-4/3 rounded-2xl overflow-hidden border border-white/10 shadow-xl group">
          <img
            src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80"
            alt="DMCA & Law Enforcement"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-75"
          />
        </div>
      </div>

      {/* Designated Agent Direct Contact Card */}
      <div className="p-6 bg-gradient-to-r from-[#1c1622] via-[#151821] to-black border border-amber-500/30 rounded-3xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span className="text-amber-400 text-lg">⚡</span>
            <span>Designated DMCA Agent for Notification of Claims</span>
          </h3>
          <p className="text-xs text-zinc-300">
            Send formal copyright notices, trademark reports, or 2257 custodian verifications directly to:
          </p>
          <div className="flex items-center gap-3 pt-1">
            <span className="text-sm font-mono text-amber-400 font-bold">dmca@zonetube.com</span>
            <span className="text-zinc-600">|</span>
            <span className="text-xs text-zinc-400">Available 24 hours / 7 days</span>
          </div>
        </div>
        <button
          onClick={handleCopyEmail}
          className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <i className="fa-regular fa-copy" />
          <span>{copiedEmail ? 'Copied to Clipboard!' : 'Copy DMCA Email'}</span>
        </button>
      </div>

      {/* Tab Selector: Policy | Notice Form | Counter Notice */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-4">
        {[
          { id: 'policy', label: 'DMCA Policy & Guidelines', icon: 'fa-solid fa-book' },
          { id: 'notice-form', label: 'Submit Takedown Notice', icon: 'fa-solid fa-paper-plane' },
          { id: 'counter-notice', label: 'Counter-Notice Procedure', icon: 'fa-solid fa-reply' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <i className={tab.icon} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab 1: Comprehensive Policy */}
      {activeTab === 'policy' && (
        <div className="space-y-8 text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal">
          {/* 1. Safe Harbor Overview */}
          <section className="p-8 rounded-3xl bg-[#151821] border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <span className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                <i className="fa-solid fa-shield-halved text-base" />
              </span>
              <h2 className="text-xl font-bold text-white">1. Safe Harbor & Syndication Architecture</h2>
            </div>
            <p>
              ZoneTube operates within the safe harbor protections of the Digital Millennium Copyright Act (17 U.S.C. § 512(c)). The Service acts as an interactive computer service, directory, and video embed aggregator.
            </p>
            <p>
              We do not directly host third-party syndicated video stream files on our core web servers. Rather, videos are streamed via authorized third-party embed frames and syndication APIs. When an infringement notice is received regarding a syndicated stream, we promptly remove the embed listing, de-index the catalog record, and notify the upstream hosting provider.
            </p>
          </section>

          {/* 2. Mandatory Elements of a Valid DMCA Notice */}
          <section className="p-8 rounded-3xl bg-[#151821] border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <span className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                <i className="fa-solid fa-list-check text-base" />
              </span>
              <h2 className="text-xl font-bold text-white">2. Statutory Elements of a Notice (17 U.S.C. § 512(c)(3))</h2>
            </div>
            <p>
              To ensure prompt action, any notification of alleged infringement must be in writing and must include substantially the following statutory elements:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-black/40 border border-white/10 rounded-2xl space-y-1.5">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <i className="fa-solid fa-check text-amber-400" />
                  <span>Work Identification</span>
                </h4>
                <p className="text-xs text-zinc-400">
                  Identification of the copyrighted work claimed to have been infringed, or a representative list if multiple works are covered.
                </p>
              </div>

              <div className="p-4 bg-black/40 border border-white/10 rounded-2xl space-y-1.5">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <i className="fa-solid fa-check text-amber-400" />
                  <span>Exact URL / Embed Location</span>
                </h4>
                <p className="text-xs text-zinc-400">
                  The specific URL (e.g. `https://zonetube.com/video/vid_xxx`) where the allegedly infringing material is located on ZoneTube.
                </p>
              </div>

              <div className="p-4 bg-black/40 border border-white/10 rounded-2xl space-y-1.5">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <i className="fa-solid fa-check text-amber-400" />
                  <span>Contact Information</span>
                </h4>
                <p className="text-xs text-zinc-400">
                  Your full legal name, company, mailing address, telephone number, and official verified email address.
                </p>
              </div>

              <div className="p-4 bg-black/40 border border-white/10 rounded-2xl space-y-1.5">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <i className="fa-solid fa-check text-amber-400" />
                  <span>Good-Faith Statements & Signature</span>
                </h4>
                <p className="text-xs text-zinc-400">
                  Statements confirming good-faith belief that use is unauthorized, made under penalty of perjury, accompanied by a physical or electronic signature.
                </p>
              </div>
            </div>
          </section>

          {/* 3. 18 U.S.C. 2257 Exemption Statement */}
          <section className="p-8 rounded-3xl bg-[#151821] border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <span className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                <i className="fa-solid fa-certificate text-base" />
              </span>
              <h2 className="text-xl font-bold text-white">3. 18 U.S.C. § 2257 Exemption & Age Verification</h2>
            </div>
            <p>
              ZoneTube is not the producer or creator of any syndicated adult media content accessible on this website. Pursuant to 18 U.S.C. § 2257 and 28 C.F.R. Part 75, all required records are maintained by the primary producers of each respective video.
            </p>
            <div className="p-4 bg-amber-950/30 border border-amber-500/30 rounded-2xl text-xs space-y-1">
              <span className="font-bold text-amber-300">Mandatory Performers Age Notice:</span>
              <p className="text-zinc-300">
                All individuals appearing in adult materials featured on this platform were at least 18 years of age at the time the depiction was produced.
              </p>
            </div>
          </section>

          {/* 4. Repeat Infringer Policy */}
          <section className="p-8 rounded-3xl bg-[#151821] border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <span className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                <i className="fa-solid fa-ban text-base" />
              </span>
              <h2 className="text-xl font-bold text-white">4. Repeat Infringer Policy ("Three Strikes")</h2>
            </div>
            <p>
              In accordance with 17 U.S.C. § 512(i)(1)(A), ZoneTube enforces a strict policy that provides for the termination in appropriate circumstances of user accounts who are repeat infringers. A user who is the subject of three (3) or more substantiated DMCA notifications is subject to immediate and permanent termination without recourse.
            </p>
          </section>
        </div>
      )}

      {/* Tab 2: Interactive Notice Submission Form */}
      {activeTab === 'notice-form' && (
        <div className="p-8 rounded-3xl bg-[#151821] border border-white/10 shadow-2xl space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h2 className="text-xl font-black text-white">Submit a Formal DMCA Takedown Notice</h2>
            <p className="text-xs text-zinc-400 mt-1">Complete the statutory fields below to generate and transmit a verified notice to our designated agent.</p>
          </div>

          {submittedClaim ? (
            <div className="p-8 bg-emerald-950/40 border border-emerald-500/40 rounded-3xl text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-2xl">
                <i className="fa-solid fa-circle-check" />
              </div>
              <h3 className="text-lg font-bold text-white">DMCA Takedown Notice Received</h3>
              <p className="text-xs text-zinc-300 max-w-md mx-auto">
                Thank you, {claimantName}. Notice Case #DMCA-{Date.now().toString().slice(-6)} has been logged. Our legal team will review the target URL within 24 hours.
              </p>
              <button
                onClick={() => setSubmittedClaim(false)}
                className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-all"
              >
                Submit Another Notice
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitNotice} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Your Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={claimantName}
                    onChange={(e) => setClaimantName(e.target.value)}
                    placeholder="e.g. Jane Smith, Counsel for Studio XYZ"
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Verified Email Address *</label>
                  <input
                    type="email"
                    required
                    value={claimantEmail}
                    onChange={(e) => setClaimantEmail(e.target.value)}
                    placeholder="e.g. legal@productioncompany.com"
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Title of Copyrighted Work *</label>
                <input
                  type="text"
                  required
                  value={workTitle}
                  onChange={(e) => setWorkTitle(e.target.value)}
                  placeholder="e.g. Title of film, broadcast or photoshoot"
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Infringing URL on ZoneTube *</label>
                <input
                  type="url"
                  required
                  value={infringingUrl}
                  onChange={(e) => setInfringingUrl(e.target.value)}
                  placeholder="https://zonetube.com/video/vid_..."
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="p-4 bg-black/40 border border-white/10 rounded-2xl space-y-2">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    required
                    checked={affirmation}
                    onChange={(e) => setAffirmation(e.target.checked)}
                    className="w-4 h-4 mt-0.5 accent-amber-500 rounded"
                  />
                  <span className="text-xs text-zinc-300 leading-relaxed">
                    I state under penalty of perjury that I have a good-faith belief that the disputed use of the material is not authorized by the copyright owner, its agent, or the law, and that the information in this notice is accurate.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Transmit Formal Takedown Notice</span>
                <i className="fa-solid fa-paper-plane" />
              </button>
            </form>
          )}
        </div>
      )}

      {/* Tab 3: Counter-Notice Procedures */}
      {activeTab === 'counter-notice' && (
        <div className="p-8 rounded-3xl bg-[#151821] border border-white/10 shadow-2xl space-y-6 text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal">
          <div className="border-b border-white/10 pb-4">
            <h2 className="text-xl font-black text-white">DMCA Counter-Notification Procedures (17 U.S.C. § 512(g))</h2>
            <p className="text-xs text-zinc-400 mt-1">Protocols for disputing mistakenly removed video materials</p>
          </div>

          <p>
            If content you provided was removed or disabled as a result of a DMCA notification and you believe that such removal was due to a mistake or misidentification, you may send a written Counter-Notification to our Designated Agent.
          </p>

          <div className="p-6 bg-black/40 border border-white/10 rounded-2xl space-y-3">
            <h4 className="text-sm font-bold text-white">Mandatory Counter-Notice Elements:</h4>
            <ul className="list-decimal pl-5 space-y-2 text-zinc-300">
              <li>Your physical or electronic signature.</li>
              <li>Identification of the material that has been removed or disabled and the location at which the material appeared before it was removed.</li>
              <li>A statement under penalty of perjury that you have a good faith belief that the material was removed or disabled as a result of mistake or misidentification.</li>
              <li>Your name, address, and telephone number, and a statement that you consent to the jurisdiction of the Federal District Court for the judicial district in which your address is located.</li>
            </ul>
          </div>

          <p>
            Upon receipt of a valid Counter-Notification, ZoneTube will promptly forward a copy to the original complaining party. If the copyright claimant does not notify ZoneTube within ten to fourteen (10-14) business days that they have filed an action seeking a court order to restrain the infringing activity, ZoneTube may restore access to the material.
          </p>
        </div>
      )}
    </div>
  );
};
