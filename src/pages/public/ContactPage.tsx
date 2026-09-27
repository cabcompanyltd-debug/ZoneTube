import React, { useState } from 'react';
import { Button } from '../../components/common/Button';
import { useToast } from '../../contexts/ToastContext';

export const ContactPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('general');
  const [urgency, setUrgency] = useState('normal');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);

  // Accordion state for FAQs
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const { showToast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      showToast('Please complete all required fields', 'error');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const ticketId = `ZT-${Math.floor(100000 + Math.random() * 900000)}`;
      setSubmittedTicket(ticketId);
      showToast(`Support Ticket #${ticketId} created successfully!`);
    }, 600);
  };

  const faqs = [
    {
      q: 'Why is a video buffering or failing to play on mobile?',
      a: 'ZoneTube streams use adaptive HLS and high-bandwidth embed protocols. If buffering occurs, ensure your network supports high-speed data transmission, disable aggressive third-party script blockers that break iframe playback, or try switching your mobile browser to private/incognito mode to clear stale cache.',
    },
    {
      q: 'How do I create and manage custom playlists?',
      a: 'Sign in to your ZoneTube account, navigate to any video playback page, and click the "+ Playlist" button located beneath the player. You can create brand new playlists or toggle videos into existing collections. Access your saved collections anytime via the "My Playlists" sidebar link.',
    },
    {
      q: 'Can I change the platform accent color and theme styling?',
      a: 'Yes! ZoneTube features dynamic real-time theme customization. Click the Palette / Color icon in the top header to choose between vibrant Red, Cyan, Neon Emerald, Amber, or Purple accent colors.',
    },
    {
      q: 'How do I delete my watch history or account data?',
      a: 'Navigate to "Watch History" from the user menu and click "Clear Full History" to wipe your viewing timeline. For complete account erasure in accordance with GDPR/CCPA, contact dpo@zonetube.com with your registered email.',
    },
    {
      q: 'How do content creators and studios partner with ZoneTube?',
      a: 'We welcome content creators, syndication partners, and authorized distributors. Submit a partnership inquiry selecting "Advertising & Business" in the form above or email partnerships@zonetube.com.',
    },
    {
      q: 'Are videos on ZoneTube authorized and legal?',
      a: 'Yes. ZoneTube exclusively indexes, aggregates, and renders videos via authorized provider APIs and verified embed codes adhering strictly to statutory safe harbors and 18 U.S.C. § 2257 recordkeeping exemptions.',
    },
    {
      q: 'What should I do if I suspect an account breach?',
      a: 'Immediately visit your Profile Settings to update your credentials. If locked out, submit an Urgent priority ticket selecting "Account Security" so our operations team can secure your profile.',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-fade-in my-6 pb-12">
      {/* Hero Banner with Customer Support Visual */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl p-8 sm:p-12 bg-gradient-to-r from-emerald-950/40 via-[#151821] to-[#0d0f15] flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <i className="fa-solid fa-headset" />
            <span>24/7 Global Operations Support</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Contact Support & Global Assistance
          </h1>

          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed font-normal">
            Whether you need assistance with video playback, account management, content inquiries, or partnership discussions, our dedicated operations and engineering team is available 24 hours a day, 7 days a week.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-zinc-400 font-mono">
            <span><i className="fa-regular fa-clock text-emerald-400 mr-1.5" /> Average Response: &lt; 2 Hours</span>
            <span>•</span>
            <span><i className="fa-solid fa-shield-halved text-emerald-400 mr-1.5" /> Direct Human Assistance</span>
            <span>•</span>
            <span><i className="fa-solid fa-globe text-emerald-400 mr-1.5" /> Multi-Language Support</span>
          </div>
        </div>

        <div className="shrink-0 w-full md:w-72 aspect-4/3 rounded-2xl overflow-hidden border border-white/10 shadow-xl group">
          <img
            src="https://images.unsplash.com/photo-1534536281715-e28d76689b4d?auto=format&fit=crop&w=600&q=80"
            alt="Customer Operations Desk"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-75"
          />
        </div>
      </div>

      {/* 4 Dedicated Support Channel Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Technical & Streaming',
            desc: 'Playback issues, buffering, video embed questions, and browser compatibility.',
            email: 'tech@zonetube.com',
            icon: 'fa-solid fa-gauge-high',
            color: 'text-blue-400',
            sla: '< 1 Hour SLA',
          },
          {
            title: 'DMCA & Legal Takedowns',
            desc: 'Copyright notices, counter-notices, 2257 compliance, and statutory requests.',
            email: 'dmca@zonetube.com',
            icon: 'fa-solid fa-gavel',
            color: 'text-amber-400',
            sla: '< 24 Hour SLA',
          },
          {
            title: 'Advertising & Monetization',
            desc: 'Ad banner placements, CrackRevenue/ExoClick integration, and revenue share.',
            email: 'ads@zonetube.com',
            icon: 'fa-solid fa-chart-line',
            color: 'text-emerald-400',
            sla: '< 4 Hour SLA',
          },
          {
            title: 'User Account & Security',
            desc: 'Password recovery, profile updates, playlist sync, and privacy inquiries.',
            email: 'support@zonetube.com',
            icon: 'fa-solid fa-user-lock',
            color: 'text-purple-400',
            sla: '< 2 Hour SLA',
          },
        ].map((item, idx) => (
          <div
            key={idx}
            className="p-6 rounded-3xl bg-[#151821] border border-white/10 shadow-xl space-y-3 flex flex-col justify-between hover:border-white/20 transition-all hover:-translate-y-1"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={`text-2xl ${item.color}`}>
                  <i className={item.icon} />
                </span>
                <span className="text-[10px] font-mono text-zinc-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                  {item.sla}
                </span>
              </div>
              <h3 className="text-base font-bold text-white">{item.title}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-normal">{item.desc}</p>
            </div>
            <a
              href={`mailto:${item.email}`}
              className="pt-3 border-t border-white/5 text-xs font-mono font-bold text-white hover:text-emerald-400 flex items-center justify-between transition-colors"
            >
              <span>{item.email}</span>
              <i className="fa-solid fa-arrow-right text-[10px]" />
            </a>
          </div>
        ))}
      </div>

      {/* Main Support Interaction Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Support Ticket Submission Form */}
        <div className="lg:col-span-7 p-8 rounded-3xl bg-[#151821] border border-white/10 shadow-2xl space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h2 className="text-xl font-black text-white">Open a Support Ticket</h2>
            <p className="text-xs text-zinc-400 mt-1">
              Directly contact our specialized technical engineers and operations specialists.
            </p>
          </div>

          {submittedTicket ? (
            <div className="p-8 bg-emerald-950/40 border border-emerald-500/40 rounded-3xl text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-2xl">
                <i className="fa-solid fa-check" />
              </div>
              <h3 className="text-lg font-bold text-white">Ticket #{submittedTicket} Successfully Created</h3>
              <p className="text-xs text-zinc-300 max-w-md mx-auto">
                Thank you, {name}. A confirmation receipt has been dispatched to {email}. An operations specialist will contact you shortly.
              </p>
              <button
                onClick={() => {
                  setSubmittedTicket(null);
                  setMessage('');
                  setSubject('');
                }}
                className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-all"
              >
                Submit Inquiries
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                  >
                    <option value="general">General Support</option>
                    <option value="technical">Technical & Streaming Playback</option>
                    <option value="dmca">DMCA & Legal Notice</option>
                    <option value="billing">Advertising & Partnerships</option>
                    <option value="security">Account Security</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Priority Level</label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                  >
                    <option value="normal">Standard Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent / Critical Outage</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Subject Line</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Summary of inquiry or video ID..."
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Message Details *</label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Please describe your question or issue in detail..."
                  className="w-full bg-black/60 border border-white/10 rounded-xl p-4 text-xs text-white focus:outline-none focus:border-emerald-400 resize-none"
                />
              </div>

              <div className="pt-2">
                <Button type="submit" isLoading={isSubmitting} className="w-full sm:w-auto px-8 shadow-xl">
                  Dispatch Support Ticket
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Global Edge Infrastructure & Operational Offices */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-8 rounded-3xl bg-[#151821] border border-white/10 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <i className="fa-solid fa-server text-emerald-400" />
              <h3 className="text-base font-bold text-white">Global Edge Presence</h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed font-normal">
              ZoneTube distributes streaming feeds and data storage across high-performance tier-4 edge data centers worldwide:
            </p>
            <div className="space-y-2.5 pt-1 text-xs">
              {[
                { city: 'San Francisco, USA', ping: '12ms', status: 'Optimal' },
                { city: 'Amsterdam, Netherlands', ping: '18ms', status: 'Optimal' },
                { city: 'Singapore, SG', ping: '24ms', status: 'Optimal' },
                { city: 'Tokyo, Japan', ping: '21ms', status: 'Optimal' },
              ].map((loc, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 bg-black/40 rounded-xl border border-white/5">
                  <span className="font-semibold text-zinc-200">{loc.city}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-500 font-mono text-[11px]">{loc.ping}</span>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                      ● {loc.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/30 to-[#151821] border border-emerald-500/20 shadow-xl space-y-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <i className="fa-solid fa-life-ring text-emerald-400" />
              <span>Need Immediate DMCA Action?</span>
            </h4>
            <p className="text-xs text-zinc-300 leading-relaxed font-normal">
              For urgent intellectual property claims, send your takedown notice directly to our legal team at <span className="font-mono text-emerald-300 font-bold">dmca@zonetube.com</span> for priority handling under 24 hours.
            </p>
          </div>
        </div>
      </div>

      {/* Extensive FAQ Accordion Section */}
      <section className="space-y-6 pt-4">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Instant solutions to the most common inquiries regarding streaming, playlists, and security.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {faqs.map((faq, index) => {
            const isOpen = expandedFaq === index;
            return (
              <div
                key={index}
                className="p-6 rounded-3xl bg-[#151821] border border-white/10 shadow-xl space-y-3 cursor-pointer transition-all duration-200 hover:border-white/20"
                onClick={() => setExpandedFaq(isOpen ? null : index)}
              >
                <div className="flex items-start justify-between gap-4">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2.5">
                    <span className="text-emerald-400 text-xs font-mono font-bold">Q{index + 1}.</span>
                    <span>{faq.q}</span>
                  </h4>
                  <span className="text-zinc-400 text-xs mt-0.5 shrink-0">
                    <i className={`fa-solid ${isOpen ? 'fa-minus' : 'fa-plus'}`} />
                  </span>
                </div>
                {isOpen && (
                  <p className="text-xs text-zinc-300 leading-relaxed font-normal border-t border-white/5 pt-3 animate-fade-in">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
