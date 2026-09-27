import React, { useState } from 'react';

export const PrivacyPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('controller');

  const navItems = [
    { id: 'controller', label: '1. Data Controller & DPO Office', icon: 'fa-solid fa-building-shield' },
    { id: 'collection', label: '2. Categories of Data Collected', icon: 'fa-solid fa-database' },
    { id: 'lawful', label: '3. Lawful Basis for Processing (GDPR)', icon: 'fa-solid fa-scale-balanced' },
    { id: 'usage', label: '4. How Your Data Is Utilized', icon: 'fa-solid fa-gears' },
    { id: 'cookies', label: '5. Cookies, Tokens & LocalStorage', icon: 'fa-solid fa-cookie-bite' },
    { id: 'processors', label: '6. Third-Party Sub-Processors', icon: 'fa-solid fa-network-wired' },
    { id: 'transfers', label: '7. International Data Transfers', icon: 'fa-solid fa-earth-americas' },
    { id: 'rights', label: '8. User Rights (GDPR & CCPA/CPRA)', icon: 'fa-solid fa-user-shield' },
    { id: 'security', label: '9. Security, Encryption & Retention', icon: 'fa-solid fa-shield-virus' },
    { id: 'children', label: '10. Minors & Policy Revisions', icon: 'fa-solid fa-user-xmark' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-fade-in my-6 pb-12">
      {/* Hero Banner with Data Privacy Visual */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl p-8 sm:p-12 bg-gradient-to-r from-blue-950/40 via-[#151821] to-[#0d0f15] flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <i className="fa-solid fa-shield-halved" />
            <span>Data Protection & Privacy Safeguards</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Privacy Policy
          </h1>

          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed font-normal">
            Your personal privacy is of paramount importance to ZoneTube. This Privacy Policy details our strict data minimization practices, encryption protocols, international standards (GDPR, CCPA/CPRA), and your legal rights regarding your personal information.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-zinc-400 font-mono">
            <span><i className="fa-regular fa-clock text-blue-400 mr-1.5" /> Updated: September 2026</span>
            <span>•</span>
            <span><i className="fa-solid fa-shield text-blue-400 mr-1.5" /> GDPR & CCPA Compliant</span>
            <span>•</span>
            <span><i className="fa-solid fa-key text-blue-400 mr-1.5" /> Salted Bcrypt 10-Round Hashes</span>
          </div>
        </div>

        <div className="shrink-0 w-full md:w-72 aspect-4/3 rounded-2xl overflow-hidden border border-white/10 shadow-xl group">
          <img
            src="https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80"
            alt="Cybersecurity and Data Protection"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-75"
          />
        </div>
      </div>

      {/* Main Layout: Nav Column + Articles */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar Nav */}
        <aside className="lg:col-span-4 bg-[#151821] border border-white/10 rounded-2xl p-4 sticky top-20 shadow-xl space-y-2">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-3 mb-2">
            Privacy Navigation
          </h3>
          <div className="space-y-1 max-h-[70vh] overflow-y-auto pr-1">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === item.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <i className={`${item.icon} text-sm w-4 text-center`} />
                <span className="truncate">{item.label}</span>
              </a>
            ))}
          </div>

          <div className="pt-4 border-t border-white/10 mt-4 px-2 space-y-2 text-zinc-400 text-[11px]">
            <p className="flex items-center gap-1.5">
              <i className="fa-solid fa-envelope text-blue-400" />
              <span>Contact Data Protection Officer</span>
            </p>
            <a
              href="mailto:dpo@zonetube.com"
              className="text-xs text-white hover:text-blue-400 font-bold block"
            >
              dpo@zonetube.com
            </a>
          </div>
        </aside>

        {/* Content Column */}
        <main className="lg:col-span-8 space-y-8 text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal">
          {/* Section 1 */}
          <article id="controller" className="p-6 sm:p-8 rounded-3xl bg-[#151821] border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <span className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                <i className="fa-solid fa-building-shield text-base" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white">1. Data Controller & DPO Office</h2>
            </div>
            <p>
              ZoneTube operates as the "Data Controller" for the purposes of the General Data Protection Regulation (Regulation (EU) 2016/679 - "GDPR"), the UK Data Protection Act 2018, and the California Consumer Privacy Act of 2018 as amended by the California Privacy Rights Act ("CCPA/CPRA").
            </p>
            <p>
              We have appointed a designated Data Protection Officer (DPO) responsible for overseeing inquiries related to this privacy statement and protecting user rights. You may reach our DPO at:
            </p>
            <div className="p-4 bg-black/40 border border-white/10 rounded-2xl text-xs space-y-1 font-mono">
              <p className="text-white font-bold">ZoneTube Governance & Privacy Office</p>
              <p className="text-zinc-400">Email: dpo@zonetube.com</p>
              <p className="text-zinc-400">Response SLA: Within 48 business hours</p>
            </div>
          </article>

          {/* Section 2 */}
          <article id="collection" className="p-6 sm:p-8 rounded-3xl bg-[#151821] border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <span className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                <i className="fa-solid fa-database text-base" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white">2. Categories of Personal Data Collected</h2>
            </div>
            <p>
              We adhere strictly to the principle of <strong>data minimization</strong>. We only collect the minimal personal information necessary to deliver high-quality streaming and personalized account features:
            </p>
            <div className="space-y-3">
              <div className="p-4 bg-black/40 border border-white/10 rounded-2xl space-y-1">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider text-blue-300">A. Information Provided Directly By You</h4>
                <p className="text-xs text-zinc-300">
                  When you register: your chosen display name, email address, password (stored solely as a cryptographically salted one-way hash), and optional profile avatar image.
                </p>
              </div>

              <div className="p-4 bg-black/40 border border-white/10 rounded-2xl space-y-1">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider text-blue-300">B. Usage Data & Account Preferences</h4>
                <p className="text-xs text-zinc-300">
                  Playlists you curate, videos saved to your Favorites, and watch history records (including video playback percentage for resume-playback features).
                </p>
              </div>

              <div className="p-4 bg-black/40 border border-white/10 rounded-2xl space-y-1">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider text-blue-300">C. Automated Technical Telemetry</h4>
                <p className="text-xs text-zinc-300">
                  IP addresses (anonymized for geolocation filtering), browser user-agent header, device type, screen dimensions, and anonymous performance error telemetry.
                </p>
              </div>
            </div>
          </article>

          {/* Section 3 */}
          <article id="lawful" className="p-6 sm:p-8 rounded-3xl bg-[#151821] border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <span className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                <i className="fa-solid fa-scale-balanced text-base" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white">3. Lawful Basis for Processing (GDPR Article 6)</h2>
            </div>
            <p>
              Under European data protection law, we process your personal data under the following recognized legal grounds:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-300">
              <li><strong>Performance of a Contract (Art. 6(1)(b)):</strong> To manage your user account, authenticate sessions, maintain playlists, and deliver streaming playback.</li>
              <li><strong>Legitimate Interests (Art. 6(1)(f)):</strong> To safeguard platform infrastructure against DDoS attacks, enforce rate limits, prevent fraudulent account creation, and debug playback failures.</li>
              <li><strong>Legal Obligation (Art. 6(1)(c)):</strong> To comply with statutory takedown notices (DMCA), age restrictions, and law enforcement requests.</li>
            </ul>
          </article>

          {/* Section 4 */}
          <article id="usage" className="p-6 sm:p-8 rounded-3xl bg-[#151821] border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <span className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                <i className="fa-solid fa-gears text-base" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white">4. How Your Data Is Utilized</h2>
            </div>
            <p>
              We use your information exclusively to provide a world-class streaming experience. We never sell, rent, or trade your personal data to commercial data brokers or advertisers. Data is utilized strictly to:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { title: 'Stream Playback', desc: 'Deliver low-latency video feeds and resume playback progress from your exact timestamp.' },
                { title: 'Personal Playlists', desc: 'Sync your saved favorites and custom playlists across all devices.' },
                { title: 'Account Security', desc: 'Verify identity, protect password integrity, and prevent unauthorized credential stuffing.' },
                { title: 'Platform Health', desc: 'Identify buffering bottlenecks and optimize CDN caching nodes.' },
              ].map((box, idx) => (
                <div key={idx} className="p-3.5 bg-black/40 border border-white/10 rounded-xl space-y-1">
                  <h4 className="text-xs font-bold text-white">{box.title}</h4>
                  <p className="text-[11px] text-zinc-400">{box.desc}</p>
                </div>
              ))}
            </div>
          </article>

          {/* Section 5 */}
          <article id="cookies" className="p-6 sm:p-8 rounded-3xl bg-[#151821] border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <span className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                <i className="fa-solid fa-cookie-bite text-base" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white">5. Cookies, Tokens & LocalStorage</h2>
            </div>
            <p>
              ZoneTube utilizes modern HTML5 LocalStorage and essential session tokens rather than intrusive tracking beacons. These include:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
              <li><strong>Authentication Tokens (`zonetube_token`):</strong> Secure cryptographically signed tokens allowing you to remain signed in across page transitions.</li>
              <li><strong>Interface Preferences:</strong> Theme accent color selections and volume settings stored locally on your device.</li>
            </ul>
            <p>
              You can clear these storage items at any time through your browser's developer tools or settings menu.
            </p>
          </article>

          {/* Section 6 */}
          <article id="processors" className="p-6 sm:p-8 rounded-3xl bg-[#151821] border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <span className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                <i className="fa-solid fa-network-wired text-base" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white">6. Third-Party Sub-Processors & Infrastructure</h2>
            </div>
            <p>
              We collaborate with vetted, enterprise-grade cloud providers bound by strict Data Processing Agreements (DPAs):
            </p>
            <div className="space-y-2">
              <div className="p-3 bg-black/40 border border-white/10 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-white">InsForge BaaS & PostgreSQL Cloud</span>
                  <p className="text-[11px] text-zinc-400">Database storage, encrypted user records & media buckets</p>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">DPA Executed</span>
              </div>

              <div className="p-3 bg-black/40 border border-white/10 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-white">Global Edge CDN & Cloudflare Infrastructure</span>
                  <p className="text-[11px] text-zinc-400">DDoS mitigation, SSL/TLS termination & media caching</p>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">DPA Executed</span>
              </div>
            </div>
          </article>

          {/* Section 7 */}
          <article id="transfers" className="p-6 sm:p-8 rounded-3xl bg-[#151821] border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <span className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                <i className="fa-solid fa-earth-americas text-base" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white">7. International Cross-Border Data Transfers</h2>
            </div>
            <p>
              ZoneTube operates internationally. Personal data may be processed in countries outside the European Economic Area (EEA). Whenever transfers occur, we implement European Commission-approved <strong>Standard Contractual Clauses (SCCs)</strong> and robust technical encryption safeguards to ensure your data receives equivalent protection wherever processed.
            </p>
          </article>

          {/* Section 8 */}
          <article id="rights" className="p-6 sm:p-8 rounded-3xl bg-[#151821] border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <span className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                <i className="fa-solid fa-user-shield text-base" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white">8. User Rights (GDPR & CCPA/CPRA)</h2>
            </div>
            <p>
              Depending on your location, you hold significant statutory rights regarding your personal information:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
              <li><strong>Right of Access & Portability:</strong> Request a copy of all personal data held about you in a machine-readable JSON format.</li>
              <li><strong>Right to Erasure ("Right to be Forgotten"):</strong> Request the complete and irreversible deletion of your user account, watch history, and playlists.</li>
              <li><strong>Right to Rectification:</strong> Edit or correct your name, email, or avatar directly via your Account Profile.</li>
              <li><strong>CCPA/CPRA Disclosures:</strong> We do not sell personal data. California residents may exercise their right to know, delete, or opt out without facing discrimination.</li>
            </ul>
            <p>
              To exercise any of these rights, email our team at <span className="text-white font-mono font-bold">privacy@zonetube.com</span>. We fulfill all verified requests within thirty (30) calendar days.
            </p>
          </article>

          {/* Section 9 */}
          <article id="security" className="p-6 sm:p-8 rounded-3xl bg-[#151821] border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <span className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                <i className="fa-solid fa-shield-virus text-base" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white">9. Security Architecture & Retention</h2>
            </div>
            <p>
              We protect your data using modern cryptographic controls:
            </p>
            <div className="p-4 bg-black/40 border border-white/10 rounded-2xl text-xs space-y-2">
              <p><i className="fa-solid fa-lock text-emerald-400 mr-2" /> <strong>Transit Encryption:</strong> Enforced TLS 1.3 encryption across all API and streaming endpoints.</p>
              <p><i className="fa-solid fa-key text-blue-400 mr-2" /> <strong>Password Hashing:</strong> Salted Bcrypt encryption ensures passwords cannot be reverse-engineered even in the event of an infrastructure breach.</p>
              <p><i className="fa-solid fa-clock text-amber-400 mr-2" /> <strong>Retention Schedules:</strong> Inactive account data is automatically purged after twenty-four (24) months of continuous inactivity.</p>
            </div>
          </article>

          {/* Section 10 */}
          <article id="children" className="p-6 sm:p-8 rounded-3xl bg-[#151821] border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <span className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                <i className="fa-solid fa-user-xmark text-base" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white">10. Strict Protection of Minors & Revisions</h2>
            </div>
            <p>
              ZoneTube is strictly intended for individuals 18 years of age or older. We do not knowingly solicit, collect, or store personal information from children or minors under the age of 18. If we discover that personal data of a minor has been collected, we immediately delete such records and terminate the account.
            </p>
            <p>
              We may revise this Privacy Policy periodically. Significant changes will be announced on the platform homepage and updated on this page with an updated revision date.
            </p>
          </article>
        </main>
      </div>
    </div>
  );
};
