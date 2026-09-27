import React, { useState } from 'react';

export const TermsPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('acceptance');

  const sections = [
    { id: 'acceptance', title: '1. Acceptance & Contract Formation', icon: 'fa-solid fa-file-contract' },
    { id: 'eligibility', title: '2. Eligibility & Age Verification (18+)', icon: 'fa-solid fa-user-check' },
    { id: 'license', title: '3. Platform License & Limited Access', icon: 'fa-solid fa-key' },
    { id: 'conduct', title: '4. User Conduct & Prohibited Activities', icon: 'fa-solid fa-shield-halved' },
    { id: 'content', title: '5. Syndicated Streams & Intellectual Property', icon: 'fa-solid fa-video' },
    { id: 'accounts', title: '6. User Accounts, Authentication & Security', icon: 'fa-solid fa-lock' },
    { id: 'disclaimer', title: '7. Disclaimer of Warranties ("AS-IS")', icon: 'fa-solid fa-triangle-exclamation' },
    { id: 'liability', title: '8. Comprehensive Limitation of Liability', icon: 'fa-solid fa-scale-balanced' },
    { id: 'indemnity', title: '9. User Indemnification Obligations', icon: 'fa-solid fa-shield' },
    { id: 'disputes', title: '10. Arbitration & Class Action Waiver', icon: 'fa-solid fa-gavel' },
    { id: 'governing', title: '11. Governing Law & Jurisdiction', icon: 'fa-solid fa-landmark' },
    { id: 'modifications', title: '12. Amendments, Severability & Entirety', icon: 'fa-solid fa-clock-rotate-left' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-fade-in my-6 pb-12">
      {/* Hero Banner with Law / Compliance Image */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl p-8 sm:p-12 bg-gradient-to-r from-red-950/40 via-[#151821] to-[#0d0f15] flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider">
            <i className="fa-solid fa-scale-balanced" />
            <span>Binding Legal Contract</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Terms of Service
          </h1>

          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed font-normal">
            These Terms of Service constitute a legally binding agreement between you and ZoneTube. They govern your access to and use of our video player technology, user account features, playlists, and streaming services.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-zinc-400 font-mono">
            <span><i className="fa-regular fa-calendar-check text-red-400 mr-1.5" /> Effective: September 2026</span>
            <span>•</span>
            <span><i className="fa-solid fa-globe text-red-400 mr-1.5" /> Worldwide Governance</span>
            <span>•</span>
            <span><i className="fa-solid fa-code-branch text-red-400 mr-1.5" /> Revision 4.2</span>
          </div>
        </div>

        <div className="shrink-0 w-full md:w-72 aspect-4/3 rounded-2xl overflow-hidden border border-white/10 shadow-xl group">
          <img
            src="https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80"
            alt="Legal Contract Documents"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-75"
          />
        </div>
      </div>

      {/* Main Grid: Sticky Sidebar Nav + In-depth Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Nav Column */}
        <aside className="lg:col-span-4 bg-[#151821] border border-white/10 rounded-2xl p-4 sticky top-20 shadow-xl space-y-2">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-3 mb-2">
            Table of Contents
          </h3>
          <div className="space-y-1 max-h-[70vh] overflow-y-auto pr-1">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeSection === s.id
                    ? 'bg-[var(--accent-red)] text-white shadow-lg shadow-red-600/30'
                    : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <i className={`${s.icon} text-sm w-4 text-center`} />
                <span className="truncate">{s.title}</span>
              </a>
            ))}
          </div>

          <div className="pt-4 border-t border-white/10 mt-4 px-2 space-y-2 text-zinc-400 text-[11px]">
            <p className="flex items-center gap-1.5">
              <i className="fa-solid fa-circle-info text-zinc-500" />
              <span>Questions regarding our terms?</span>
            </p>
            <a
              href="mailto:legal@zonetube.com"
              className="text-xs text-white hover:text-red-400 font-bold block"
            >
              legal@zonetube.com
            </a>
          </div>
        </aside>

        {/* In-depth Content Articles */}
        <main className="lg:col-span-8 space-y-8 text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal">
          {/* Section 1 */}
          <article id="acceptance" className="p-6 sm:p-8 rounded-3xl bg-[#151821] border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <span className="p-2.5 bg-red-500/10 text-[var(--accent-red)] rounded-xl border border-red-500/20">
                <i className="fa-solid fa-file-contract text-base" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white">1. Acceptance of Terms & Binding Contract</h2>
            </div>
            <p>
              By accessing, browsing, registering for an account, creating playlists, or playing video streams on ZoneTube (the "Platform", "Service", "we", "us", or "our"), you signify that you have read, understood, and irrevocably agree to be bound by these Terms of Service, along with our <a href="/privacy" className="text-red-400 hover:underline">Privacy Policy</a>, <a href="/dmca" className="text-red-400 hover:underline">DMCA & Content Policy</a>, and <a href="/legal" className="text-red-400 hover:underline">Legal & Compliance Notice</a>.
            </p>
            <p>
              If you do not agree to every provision contained within these Terms, you are strictly prohibited from using or accessing ZoneTube, and must cease all utilization of the Service immediately. Continued use of the platform after any published revisions constitutes unequivocal acceptance of the revised Terms.
            </p>
          </article>

          {/* Section 2 */}
          <article id="eligibility" className="p-6 sm:p-8 rounded-3xl bg-[#151821] border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <span className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                <i className="fa-solid fa-user-check text-base" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white">2. Eligibility & Age Capacity (18+ / Majority)</h2>
            </div>
            <p>
              ZoneTube provides mature adult entertainment and general video media. You must be at least eighteen (18) years of age, or the legal age of majority in your jurisdiction of residence, whichever is older, to access this Platform or register an account.
            </p>
            <div className="p-4 bg-red-950/30 border border-red-500/30 rounded-2xl text-xs space-y-1">
              <span className="text-red-400 font-bold flex items-center gap-2">
                <i className="fa-solid fa-triangle-exclamation" />
                <span>Underage Access Prohibited by Law</span>
              </span>
              <p className="text-zinc-300">
                Access by minors (individuals under 18 years of age) is strictly forbidden. By accessing our video catalog, you affirmatively represent and warrant that you are of legal age and possess the legal capacity to enter into binding agreements.
              </p>
            </div>
          </article>

          {/* Section 3 */}
          <article id="license" className="p-6 sm:p-8 rounded-3xl bg-[#151821] border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <span className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                <i className="fa-solid fa-key text-base" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white">3. Platform License & Limited Access</h2>
            </div>
            <p>
              Subject to your ongoing compliance with these Terms, ZoneTube grants you a personal, revocable, non-exclusive, non-transferable, and royalty-free limited license to view and stream video content for personal, non-commercial entertainment purposes.
            </p>
            <p>
              Except as explicitly authorized in writing, this license does not grant you the right to: (a) re-sell, sublicense, or commercially exploit any aspect of the Platform; (b) distribute, broadcast, or publicly display streams without authorization; (c) download, archive, or rip video streams using external automated capturing tools.
            </p>
          </article>

          {/* Section 4 */}
          <article id="conduct" className="p-6 sm:p-8 rounded-3xl bg-[#151821] border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <span className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                <i className="fa-solid fa-shield-halved text-base" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white">4. User Conduct & Prohibited Activities</h2>
            </div>
            <p>
              You agree not to engage in any activity that impairs, compromises, or disrupts the operation, security, or integrity of the Platform. Specifically, you agree not to:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-300">
              <li>Deploy automated bots, spiders, scrapers, or crawlers to extract video catalog metadata, API feeds, or user credentials without written permission.</li>
              <li>Attempt to circumvent, disable, or tamper with security-related features, authentication tokens, rate limits, or digital rights management protocols.</li>
              <li>Introduce viruses, trojans, worms, logic bombs, or other malicious payloads designed to intercept traffic or damage infrastructure.</li>
              <li>Post fraudulent, defamatory, harassing, sexually violent, non-consensual, or unlawful commentary or media.</li>
              <li>Engage in denial-of-service (DDoS) attacks, flood requests, or artificially manipulate view counts and rating metrics.</li>
            </ul>
          </article>

          {/* Section 5 */}
          <article id="content" className="p-6 sm:p-8 rounded-3xl bg-[#151821] border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <span className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                <i className="fa-solid fa-video text-base" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white">5. Syndicated Streams & Intellectual Property</h2>
            </div>
            <p>
              ZoneTube aggregates, indexes, and delivers video streams originating from third-party authorized syndication APIs and public embed providers. All trademarks, service marks, trade names, and copyrighted works appearing on the Platform remain the sole intellectual property of their respective owners.
            </p>
            <p>
              ZoneTube does not claim ownership over syndicated video streams. If you are a copyright owner or an authorized agent and believe that content accessible via our platform infringes your copyright, please consult our <a href="/dmca" className="text-emerald-400 hover:underline">DMCA & Content Policy</a> for expedited takedown procedures.
            </p>
          </article>

          {/* Section 6 */}
          <article id="accounts" className="p-6 sm:p-8 rounded-3xl bg-[#151821] border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <span className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
                <i className="fa-solid fa-lock text-base" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white">6. User Accounts, Authentication & Security</h2>
            </div>
            <p>
              When creating an account, you must provide accurate and verifiable information. You are solely responsible for maintaining the confidentiality of your account credentials, passwords, and authentication sessions.
            </p>
            <p>
              You agree to notify ZoneTube immediately at <span className="text-white font-mono">support@zonetube.com</span> if you discover or suspect unauthorized access to your account. ZoneTube cannot and will not be liable for any loss or damage arising from your failure to safeguard your credentials.
            </p>
          </article>

          {/* Section 7 */}
          <article id="disclaimer" className="p-6 sm:p-8 rounded-3xl bg-[#151821] border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <span className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                <i className="fa-solid fa-triangle-exclamation text-base" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white">7. Disclaimer of Warranties ("AS-IS")</h2>
            </div>
            <p className="uppercase text-[11px] font-bold text-zinc-400">
              TO THE MAXIMUM EXTENT PERMITTED UNDER APPLICABLE LAW:
            </p>
            <p>
              THE PLATFORM AND ALL CONTENT, FEATURES, PLAYLISTS, AND STREAMING SERVICES ARE PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE. ZONETUBE EXPRESSLY DISCLAIMS ALL IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
            </p>
            <p>
              WE DO NOT WARRANT THAT STREAMING WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR FREE FROM TRANSMISSION DELAYS, DEFECTS, OR CORRUPTION.
            </p>
          </article>

          {/* Section 8 */}
          <article id="liability" className="p-6 sm:p-8 rounded-3xl bg-[#151821] border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <span className="p-2.5 bg-red-500/10 text-[var(--accent-red)] rounded-xl border border-red-500/20">
                <i className="fa-solid fa-scale-balanced text-base" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white">8. Comprehensive Limitation of Liability</h2>
            </div>
            <p>
              IN NO EVENT SHALL ZONETUBE, ITS DIRECTORS, EMPLOYEES, AFFILIATES, AGENTS, OR LICENSORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES—INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES—RESULTING FROM:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
              <li>YOUR ACCESS TO, USE OF, OR INABILITY TO ACCESS OR USE THE SERVICE;</li>
              <li>ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON OR LINKED THROUGH THE SERVICE;</li>
              <li>ANY CONTENT OBTAINED FROM OR EMBEDDED THROUGH THIRD-PARTY HOSTS;</li>
              <li>UNAUTHORIZED ACCESS, USE, OR ALTERATION OF YOUR TRANSMISSIONS OR DATA.</li>
            </ul>
          </article>

          {/* Section 9 */}
          <article id="indemnity" className="p-6 sm:p-8 rounded-3xl bg-[#151821] border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <span className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                <i className="fa-solid fa-shield text-base" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white">9. User Indemnification Obligations</h2>
            </div>
            <p>
              You agree to defend, indemnify, and hold harmless ZoneTube, its officers, subsidiaries, contractors, and agents from and against any claims, liabilities, damages, losses, costs, and expenses (including reasonable attorneys' fees) arising out of or in any way connected with: (a) your access to or use of the Service; (b) your violation of these Terms; (c) your violation of any third-party rights, including intellectual property or privacy rights.
            </p>
          </article>

          {/* Section 10 */}
          <article id="disputes" className="p-6 sm:p-8 rounded-3xl bg-[#151821] border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <span className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                <i className="fa-solid fa-gavel text-base" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white">10. Arbitration & Class Action Waiver</h2>
            </div>
            <p>
              YOU AND ZONETUBE AGREE THAT ANY DISPUTE, CLAIM, OR CONTROVERSY ARISING OUT OF OR RELATING TO THESE TERMS SHALL BE SETTLED BY BINDING ARBITRATION CONDUCTED ON AN INDIVIDUAL BASIS RATHER THAN IN COURT.
            </p>
            <p>
              YOU WAIVE ANY RIGHT TO COMMENCE OR PARTICIPATE IN ANY CLASS ACTION, COLLECTIVE ACTION, OR REPRESENTATIVE PROCEEDING AGAINST ZONETUBE.
            </p>
          </article>

          {/* Section 11 & 12 */}
          <article id="governing" className="p-6 sm:p-8 rounded-3xl bg-[#151821] border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <span className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                <i className="fa-solid fa-landmark text-base" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white">11. Governing Law & Jurisdiction</h2>
            </div>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which the Platform's operating entity is registered, without giving effect to any principles of conflicts of law.
            </p>
          </article>

          <article id="modifications" className="p-6 sm:p-8 rounded-3xl bg-[#151821] border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <span className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                <i className="fa-solid fa-clock-rotate-left text-base" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white">12. Amendments, Severability & Entire Agreement</h2>
            </div>
            <p>
              We reserve the right to modify or replace these Terms at our sole discretion. We will indicate the date of the latest revisions at the top of this document. If any provision of these Terms is deemed unlawful, void, or for any reason unenforceable, then that provision shall be deemed severable and shall not affect the validity and enforceability of any remaining provisions.
            </p>
            <p>
              These Terms, together with our Privacy Policy and DMCA Policy, constitute the complete agreement between you and ZoneTube regarding the Service.
            </p>
          </article>
        </main>
      </div>
    </div>
  );
};
