import React from 'react';
import { Logo } from '../../components/common/Logo';

interface LegalPageProps {
  onNavigate?: (path: string) => void;
}

export const LegalPage: React.FC<LegalPageProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-6xl mx-auto space-y-14 animate-fade-in my-6 pb-12">
      {/* Hero Header */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl p-8 sm:p-14 bg-gradient-to-r from-red-950/40 via-[#151821] to-[#08090D] flex flex-col md:flex-row items-center justify-between gap-10">
        <div className="relative z-10 max-w-2xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider">
            <i className="fa-solid fa-scale-balanced" />
            <span>Governance, Trust & Safety</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Legal & Regulatory <span style={{ color: 'var(--accent-red)' }}>Compliance</span>
          </h1>

          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed font-normal">
            ZoneTube is committed to the highest standards of international regulatory compliance, statutory accountability, privacy safeguarding, and content governance. Review our compliance architecture, recordkeeping certifications, and legal frameworks below.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-zinc-400 font-mono">
            <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
              <i className="fa-solid fa-shield-halved text-emerald-400" />
              <span>Full Statutory Alignment</span>
            </span>
            <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
              <i className="fa-solid fa-gavel text-amber-400" />
              <span>18 U.S.C. § 2257 Certified</span>
            </span>
            <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
              <i className="fa-solid fa-lock text-blue-400" />
              <span>GDPR & CCPA Audited</span>
            </span>
          </div>
        </div>

        {/* Hero Visual Card */}
        <div className="relative shrink-0 w-full md:w-80 aspect-square rounded-3xl overflow-hidden border border-white/15 shadow-2xl group">
          <img
            src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80"
            alt="Legal Justice & Compliance Architecture"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 space-y-2">
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-stamp text-[var(--accent-red)] text-lg" />
              <span className="text-white font-extrabold text-sm">ZoneTube Legal Trust</span>
            </div>
            <p className="text-[11px] text-zinc-300 font-medium">Verified Compliance & Transparent Operations</p>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Terms of Service',
            desc: 'Binding contract, acceptable use, platform licenses & account policies.',
            icon: 'fa-solid fa-file-contract',
            color: 'text-red-400',
            link: '/terms',
            tag: 'Contractual Rules',
          },
          {
            title: 'Privacy Policy',
            desc: 'Data collection, encryption, cookies, GDPR rights & CCPA standards.',
            icon: 'fa-solid fa-shield-virus',
            color: 'text-blue-400',
            link: '/privacy',
            tag: 'Data Protection',
          },
          {
            title: 'DMCA & Content Policy',
            desc: 'Copyright notices, fast takedowns, 2257 records & moderation rules.',
            icon: 'fa-solid fa-gavel',
            color: 'text-amber-400',
            link: '/dmca',
            tag: 'Copyright & 2257',
          },
          {
            title: 'Contact Support',
            desc: 'Reach legal counsel, abuse response, trust & safety, or customer care.',
            icon: 'fa-solid fa-headset',
            color: 'text-emerald-400',
            link: '/contact',
            tag: '24/7 Assistance',
          },
        ].map((item, idx) => (
          <div
            key={idx}
            onClick={() => onNavigate && onNavigate(item.link)}
            className="p-6 rounded-3xl bg-[#151821] border border-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-1 shadow-xl cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={`text-2xl ${item.color}`}>
                  <i className={item.icon} />
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                  {item.tag}
                </span>
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-[var(--accent-red)] transition-colors">
                {item.title}
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed font-normal">
                {item.desc}
              </p>
            </div>
            <div className="pt-4 mt-2 border-t border-white/5 flex items-center justify-between text-xs font-bold text-zinc-400 group-hover:text-white transition-colors">
              <span>Read Policy Document</span>
              <i className="fa-solid fa-arrow-right text-[10px]" />
            </div>
          </div>
        ))}
      </div>

      {/* Section 1: 18 U.S.C. 2257 Recordkeeping Statement */}
      <section className="p-8 sm:p-10 rounded-3xl bg-[#151821] border border-white/10 shadow-2xl space-y-6">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-xl font-bold border border-amber-500/20">
            <i className="fa-solid fa-scale-unbalanced" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              18 U.S.C. § 2257 & § 2257A Statutory Recordkeeping Notice
            </h2>
            <p className="text-xs text-zinc-400">Mandatory federal certification & primary producer documentation</p>
          </div>
        </div>

        <div className="text-xs sm:text-sm text-zinc-300 space-y-4 leading-relaxed font-normal">
          <p>
            ZoneTube is a digital video aggregation, curation, and embed playback platform. All audiovisual materials made accessible via the ZoneTube interface fall into strictly regulated, authorized classifications:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <i className="fa-solid fa-circle-check text-emerald-400" />
                <span>Exemption by Syndication / Embed Architecture</span>
              </h4>
              <p className="text-xs text-zinc-300 leading-relaxed">
                ZoneTube does not produce, direct, film, or employ performers appearing in user streams or syndicated video feeds. With respect to any content accessible via embed codes, syndication feeds, or authorized API endpoints, records required under 18 U.S.C. § 2257 and 28 C.F.R. Part 75 are maintained by the primary producer(s) and original content custodians.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <i className="fa-solid fa-circle-check text-emerald-400" />
                <span>Custodian of Records Verification</span>
              </h4>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Any inquiries concerning records retention for specific performers must identify the exact third-party producer or syndication distributor referenced in the video player attribution. ZoneTube promptly facilitates correspondence with designated custodians upon formal inquiry.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs space-y-1">
            <span className="font-bold flex items-center gap-2">
              <i className="fa-solid fa-triangle-exclamation" />
              <span>Strict 18+ Adult Certification Notice</span>
            </span>
            <p className="leading-relaxed">
              All visual depictions on this service portraying simulated or actual adult themes are certified to feature consenting individuals who were at least 18 years of age (or the applicable age of legal majority in their jurisdiction) at the time of photography or audiovisual recording.
            </p>
          </div>
        </div>
      </section>

      {/* Section 2: Zero Tolerance & Content Safety Protocols */}
      <section className="p-8 sm:p-10 rounded-3xl bg-[#151821] border border-white/10 shadow-2xl space-y-6">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-[var(--accent-red)] flex items-center justify-center text-xl font-bold border border-red-500/20">
            <i className="fa-solid fa-shield-halved" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Zero-Tolerance Content Safety & Trust Architecture
            </h2>
            <p className="text-xs text-zinc-400">Strict prohibitions and expedited moderation enforcement</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-black/40 border border-white/10 space-y-3">
            <div className="text-red-400 text-xl font-bold flex items-center gap-2">
              <i className="fa-solid fa-ban" />
              <span className="text-sm text-white">Child Safety (CSAM)</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Absolute zero tolerance for any depictions of minors. Any detected violation results in instant permanent exclusion, hash banning, and mandatory statutory reporting to the National Center for Missing & Exploited Children (NCMEC) and law enforcement authorities.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-black/40 border border-white/10 space-y-3">
            <div className="text-red-400 text-xl font-bold flex items-center gap-2">
              <i className="fa-solid fa-hand" />
              <span className="text-sm text-white">Non-Consensual Imagery</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Non-consensual material, non-consensual sharing of intimate images (NCII), and recordings captured without verifiable consent are strictly forbidden and permanently erased within minutes of report receipt.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-black/40 border border-white/10 space-y-3">
            <div className="text-red-400 text-xl font-bold flex items-center gap-2">
              <i className="fa-solid fa-skull-crossbones" />
              <span className="text-sm text-white">Violence & Extreme Harm</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Depictions of extreme physical violence, human exploitation, hate speech targeting protected classes, terrorism, or bodily mutilation are blocked from all catalog feeds and embed indices.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: Law Enforcement Cooperation & Subpoena Guidelines */}
      <section className="p-8 sm:p-10 rounded-3xl bg-[#151821] border border-white/10 shadow-2xl space-y-6">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center text-xl font-bold border border-blue-500/20">
            <i className="fa-solid fa-landmark" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Law Enforcement Guidelines & Statutory Legal Process
            </h2>
            <p className="text-xs text-zinc-400">Protocols for subpoenas, court orders, warrants, and emergency assistance</p>
          </div>
        </div>

        <div className="text-xs sm:text-sm text-zinc-300 space-y-4 leading-relaxed font-normal">
          <p>
            ZoneTube cooperates fully with recognized state, federal, and international law enforcement agencies conducting authorized criminal investigations in compliance with the Electronic Communications Privacy Act (18 U.S.C. §§ 2701–2712) and applicable mutual legal assistance treaties (MLATs).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <i className="fa-solid fa-file-invoice text-blue-400" />
                <span>Service of Legal Process</span>
              </h4>
              <p className="text-xs text-zinc-300 leading-relaxed">
                All grand jury subpoenas, 2703(d) court orders, and search warrants must be transmitted from an official government domain address (.gov, .mil, or judicial authority) to our legal department at <span className="text-white font-mono font-bold">legal@zonetube.com</span>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <i className="fa-solid fa-bell-concierge text-blue-400" />
                <span>Emergency Disclosure Requests</span>
              </h4>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Pursuant to 18 U.S.C. § 2702(b)(8) and § 2702(c)(4), ZoneTube may disclose subscriber data to law enforcement when we possess a good-faith belief that an emergency involving imminent danger of death or serious physical injury requires disclosure without delay.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Global Privacy & Data Sovereignty Standards */}
      <section className="p-8 sm:p-10 rounded-3xl bg-[#151821] border border-white/10 shadow-2xl space-y-6">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xl font-bold border border-emerald-500/20">
            <i className="fa-solid fa-user-shield" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Data Privacy & International Sovereignty (GDPR & CCPA)
            </h2>
            <p className="text-xs text-zinc-400">End-to-end data minimization, encryption, and subject rights</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Zero Tracker Policy</span>
            <h4 className="text-sm font-bold text-white">Privacy First</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              We do not sell personal data, browsing history, or viewer behavior to data brokers.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Encryption</span>
            <h4 className="text-sm font-bold text-white">TLS 1.3 & Bcrypt</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              All credentials are cryptographically hashed using salted Bcrypt and transmitted over TLS.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Right to Erase</span>
            <h4 className="text-sm font-bold text-white">Account Deletion</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Users can purge their watch history, playlists, and full profile data at any time.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Data Protection</span>
            <h4 className="text-sm font-bold text-white">Dedicated DPO</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Direct access to our designated Data Protection Officer via dpo@zonetube.com.
            </p>
          </div>
        </div>
      </section>

      {/* Footer Call to Action Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-red-950/30 via-[#151821] to-black border border-white/10 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <Logo size="lg" />
          <p className="text-xs text-zinc-300 max-w-xl font-normal">
            Have questions regarding regulatory compliance, licensing, or content governance? Reach our legal and operations team directly.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {onNavigate && (
            <button
              onClick={() => onNavigate('/contact')}
              className="px-6 py-3 bg-[var(--accent-red)] hover:bg-red-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xl transition-all cursor-pointer flex items-center gap-2"
            >
              <span>Contact Legal Support</span>
              <i className="fa-solid fa-arrow-right" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
