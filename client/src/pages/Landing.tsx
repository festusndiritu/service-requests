import {
  ArrowRight,
  BarChart3,
  Bell,
  Camera,
  ChevronDown,
  ClipboardCheck,
  FilePlus2,
  Hash,
  History,
  Lock,
  MapPinned,
  Menu,
  Search,
  Sparkles,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { Logo } from '../components/Logo';
import { HeroScene } from '../components/Scenery';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../lib/auth';
import { CATEGORY, CATEGORY_KEYS } from '../lib/constants';
import { useDocumentTitle } from '../lib/hooks';
import type { Category } from '../lib/types';

const HIGHLIGHTS: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: MapPinned, title: 'Report issues', text: 'Streetlights, water, waste and more' },
  { icon: Search, title: 'Track progress', text: 'Follow every update to resolution' },
  { icon: Sparkles, title: 'A better county', text: 'Together we build Murang’a' },
];

const SERVICE_TEXT: Record<Category, string> = {
  WATER_SUPPLY: 'Burst pipes, dry taps, low pressure and illegal connections.',
  STREET_LIGHTING: 'Dead, flickering or missing lights on streets and in estates.',
  GARBAGE_COLLECTION: 'Missed collections, overflowing bins and illegal dumping.',
  ROAD_MAINTENANCE: 'Potholes, washed-out roads, missing signs and damaged culverts.',
  SEWERAGE_DRAINAGE: 'Blocked drains, sewer overflows and flooding after rain.',
  PUBLIC_HEALTH: 'Unsanitary public toilets, stray animals and waste near clinics.',
  PUBLIC_SAFETY: 'Unsafe paths, open manholes and dark, dangerous spots.',
  MARKETS_TRADING: 'Market facilities, blocked entrances and trading-space issues.',
  ENVIRONMENT_PARKS: 'Fallen trees, damaged park facilities and polluted rivers.',
  OTHER: 'Anything else the county should know about and fix.',
};

const STEPS: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: FilePlus2, title: 'Report', text: 'Pick a category, add the location and describe the issue. Photos help the team find and fix it faster.' },
  { icon: Search, title: 'Track', text: 'Follow your request from Pending to In Progress to Resolved, with every change recorded on a timeline.' },
  { icon: ClipboardCheck, title: 'Resolved', text: 'The county team fixes the issue and leaves a note on the outcome. You are notified at each step.' },
];

const FOR_CITIZENS: { icon: LucideIcon; text: string }[] = [
  { icon: Hash, text: 'A reference number for every request, so you can always quote it' },
  { icon: Camera, text: 'Attach up to 3 photos (5 MB each) so the team sees exactly what you see' },
  { icon: History, text: 'A full status history with notes from the county' },
  { icon: Bell, text: 'Notifications whenever the status of your request changes' },
  { icon: Search, text: 'Track any request without signing in, using its reference number' },
  { icon: Lock, text: 'Private by design: you only ever see your own requests' },
];

const FOR_TEAMS: { icon: LucideIcon; text: string }[] = [
  { icon: Search, text: 'Search, filter and review every request in one place' },
  { icon: ClipboardCheck, text: 'Move requests forward with a note the citizen can read' },
  { icon: BarChart3, text: 'Analytics: open vs resolved, trends, and average time to resolve' },
  { icon: Users, text: 'A directory of registered citizens and how many requests each has filed' },
];

const FAQS: { q: string; a: string }[] = [
  { q: 'Who can submit a request?', a: 'Any citizen with an account. Registering takes a minute: your name, email, ID number, phone number and a password.' },
  { q: 'What can I report?', a: 'Water, street lighting, garbage collection, roads, sewerage and drainage, public health, public safety, markets, environment and parks, plus an “Other” category for anything else.' },
  { q: 'Can I add a photo?', a: 'Yes. You can attach up to 3 photos of up to 5 MB each to a request (PNG, JPG, WebP, GIF or AVIF). It is stored privately and only shown to you and the county team.' },
  { q: 'How will I know what is happening with my request?', a: 'Open it any time to see its status and history, or check your notifications. You are told whenever the county moves your request forward.' },
  { q: 'What do the statuses mean?', a: 'Pending means it has been received. In Progress means the county team is working on it. Resolved means the work is done. A request only ever moves forward.' },
  { q: 'I forgot my password. What now?', a: 'Choose “Forgot password?” on the sign-in page. We text a 6-digit code to the phone number on your account, and you use it to set a new password.' },
  { q: 'Can I track a request without signing in?', a: 'Yes. Open “Track request”, then enter the reference number (for example PRS-2026-0012) and the last 4 digits of the phone number used to submit it. You will see the status and its history, but not the location, description or photo.' },
  { q: 'Who can see my requests?', a: 'You can only see your own requests. Authorised county staff can see all requests so they can act on them.' },
];

const NAV = [
  { id: 'top', label: 'Home' },
  { id: 'services', label: 'Services' },
  { id: 'how', label: 'How it works' },
  { id: 'why', label: 'Why use it' },
  { id: 'faqs', label: 'FAQs' },
];

function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-45% 0px -50% 0px' },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [ids]);
  return active;
}

function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([e]) => e.isIntersecting && (setShown(true), observer.disconnect()), { threshold: 0.15 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms` }} className={`transition duration-700 ease-out ${shown ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'} ${className}`}>
      {children}
    </div>
  );
}

function SectionHeading({ eyebrow, title, text, light = false }: { eyebrow: string; title: string; text?: string; light?: boolean }) {
  return (
    <div className="max-w-2xl">
      <p className={`text-sm font-semibold uppercase tracking-wider ${light ? 'text-emerald-300' : 'text-brand-600'}`}>{eyebrow}</p>
      <h2 className={`mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl ${light ? 'text-white' : 'text-slate-900'}`}>{title}</h2>
      {text && <p className={`mt-3 text-base ${light ? 'text-slate-300' : 'text-slate-600'}`}>{text}</p>}
    </div>
  );
}

export default function Landing() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const active = useActiveSection(NAV.map((n) => n.id));
  useDocumentTitle('Public Service Request Portal');

  const submitTo = user?.role === 'ADMIN' ? '/dashboard' : '/requests/new';
  const trackTo = '/track';
  const linkClass = (id: string) => `border-b-2 py-1 transition ${active === id ? 'border-brand-600 text-brand-700' : 'border-transparent hover:text-brand-700'}`;

  return (
    <div id="top">
      <div className="fixed inset-x-0 top-0 z-40 px-4 pt-4">
        <div className="mx-auto max-w-6xl md:px-8">
          <header className="relative rounded-2xl bg-white/95 px-4 py-3 text-slate-900 shadow-lg backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <a href="#top" aria-label="Murang'a County Service Requests, back to top">
                <Logo />
              </a>
              <nav aria-label="Primary" className="hidden items-center gap-6 text-sm font-medium text-slate-700 lg:flex">
                {NAV.map((n) => (
                  <a key={n.id} href={`#${n.id}`} aria-current={active === n.id ? 'true' : undefined} className={linkClass(n.id)}>
                    {n.label}
                  </a>
                ))}
                <Link to={trackTo} className="border-b-2 border-transparent py-1 hover:text-brand-700">
                  Track request
                </Link>
              </nav>
              <div className="flex items-center gap-2">
                {user ? (
                  <Link to="/dashboard" className="btn-primary rounded-full px-5 py-2">
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link to="/login" className="btn-outline rounded-full px-5 py-2">
                      Login
                    </Link>
                    <Link to="/register" className="btn-primary hidden rounded-full px-5 py-2 sm:inline-flex">
                      Register
                    </Link>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setMenuOpen(!menuOpen)}
                  aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                  aria-expanded={menuOpen}
                  aria-controls="mobile-menu"
                  className="grid h-10 w-10 place-items-center rounded-full text-slate-700 hover:bg-slate-100 lg:hidden"
                >
                  {menuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              </div>
            </div>
            {menuOpen && (
              <nav id="mobile-menu" aria-label="Mobile" className="mt-3 grid gap-1 border-t border-slate-100 pt-3 text-sm font-medium text-slate-700 lg:hidden">
                {NAV.map((n) => (
                  <a key={n.id} href={`#${n.id}`} onClick={() => setMenuOpen(false)} className={`rounded-lg px-3 py-2.5 hover:bg-slate-50 ${active === n.id ? 'bg-brand-50 text-brand-700' : ''}`}>
                    {n.label}
                  </a>
                ))}
                <Link to={trackTo} className="rounded-lg px-3 py-2.5 hover:bg-slate-50">
                  Track request
                </Link>
                {!user && (
                  <Link to="/register" className="rounded-lg px-3 py-2.5 font-semibold text-brand-700 hover:bg-slate-50">
                    Register
                  </Link>
                )}
              </nav>
            )}
          </header>
        </div>
      </div>

      <section className="relative isolate flex min-h-dvh flex-col overflow-hidden bg-navy-900 text-white">
        <HeroScene className="absolute inset-0 -z-20 h-full w-full" />
        <img src="/hero.webp" alt="" fetchPriority="high" decoding="async" onError={(e) => (e.currentTarget.style.display = 'none')} className="absolute inset-0 -z-10 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy-900/80 via-navy-900/40 to-navy-900/10" />

        <div className="mx-auto flex w-full max-w-6xl flex-1 items-center px-4 pb-10 pt-32 md:px-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">Public Service Request Portal</h1>
            <p className="mt-5 text-xl font-semibold text-emerald-100">A responsive county, a better Murang'a.</p>
            <p className="mt-3 max-w-lg text-slate-100">Report issues, track progress and help us build a cleaner, safer and more connected county.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={submitTo} className="btn-primary px-6 py-3">
                {user?.role === 'ADMIN' ? 'Open dashboard' : 'Submit a request'} <ArrowRight size={18} aria-hidden />
              </Link>
              <Link to={trackTo} className="inline-flex items-center gap-2 rounded-lg border border-white/60 bg-white/10 px-6 py-3 text-sm font-semibold backdrop-blur transition hover:bg-white/20">
                Track a request <Search size={16} aria-hidden />
              </Link>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-6xl px-4 pb-6 md:px-8">
          <ul className="card grid divide-y divide-slate-100 p-2 text-slate-900 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-center gap-4 p-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600">
                  <Icon size={22} aria-hidden />
                </span>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-slate-500">{text}</p>
                </div>
              </li>
            ))}
          </ul>
          <a href="#services" aria-label="Scroll to services" className="mx-auto mt-4 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25 motion-safe:animate-bounce">
            <ChevronDown size={20} aria-hidden />
          </a>
        </div>
      </section>

      <section id="services" className="flex min-h-dvh items-center bg-white px-4 pb-20 pt-28 md:px-8">
        <div className="mx-auto w-full max-w-6xl">
          <Reveal>
            <SectionHeading eyebrow="Services" title="What can you report?" text="Choose the service that matches your issue to start a request." />
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {CATEGORY_KEYS.map((key, i) => {
              const { label, icon: Icon, color } = CATEGORY[key];
              return (
                <Reveal key={key} delay={(i % 5) * 60}>
                  <Link to={submitTo} className="group card flex h-full flex-col gap-3 p-5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
                    <span className="grid h-12 w-12 place-items-center rounded-full" style={{ backgroundColor: `${color}1a`, color }}>
                      <Icon size={22} aria-hidden />
                    </span>
                    <span className="font-semibold text-slate-900">{label}</span>
                    <span className="flex-1 text-sm text-slate-500">{SERVICE_TEXT[key]}</span>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-brand-700">
                      Report this <ArrowRight size={14} className="transition group-hover:translate-x-0.5" aria-hidden />
                    </span>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section id="how" className="flex min-h-dvh items-center bg-slate-50 px-4 pb-20 pt-28 md:px-8">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div>
            <Reveal>
              <SectionHeading eyebrow="How it works" title="From report to resolved in three steps" text="No queues and no guessing. You can see where your request stands at any time." />
            </Reveal>
            <ol className="mt-10 space-y-8">
              {STEPS.map(({ icon: Icon, title, text }, i) => (
                <Reveal key={title} delay={i * 100}>
                  <li className="flex gap-5">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-600 text-white shadow-sm">
                      <Icon size={22} aria-hidden />
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {i + 1}. {title}
                      </h3>
                      <p className="mt-1 text-slate-600">{text}</p>
                    </div>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>

          <Reveal delay={150}>
            <div className="card p-6 shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Example request</p>
              <div className="mt-2 flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">Streetlight not working near the junction</p>
                  <p className="text-sm text-slate-500">Street Lighting · Kenol Market</p>
                </div>
                <StatusBadge status="IN_PROGRESS" />
              </div>
              <ol className="mt-6 space-y-5 border-l-2 border-slate-100 pl-6">
                {[
                  { status: 'PENDING' as const, note: 'Request submitted', by: 'You' },
                  { status: 'IN_PROGRESS' as const, note: 'Crew assigned. Replacement scheduled for tomorrow.', by: 'County team' },
                  { status: 'RESOLVED' as const, note: 'The outcome note appears here once it is fixed.', by: 'County team', upcoming: true },
                ].map((step) => (
                  <li key={step.status} className={`relative ${step.upcoming ? 'opacity-45' : ''}`}>
                    <span className={`absolute -left-[33px] top-1 h-3 w-3 rounded-full ring-4 ring-white ${step.upcoming ? 'bg-slate-300' : 'bg-brand-600'}`} />
                    <StatusBadge status={step.status} />
                    <p className="mt-1.5 text-sm text-slate-700">{step.note}</p>
                    <p className="text-xs text-slate-400">{step.by}</p>
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="why" className="flex min-h-dvh items-center bg-navy-900 px-4 pb-20 pt-28 text-white md:px-8">
        <div className="mx-auto w-full max-w-6xl">
          <Reveal>
            <SectionHeading light eyebrow="Why use it" title="Built for transparency on both sides of the counter" text="Citizens get clarity. County teams get a clear queue and the numbers to improve." />
          </Reveal>
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {[
              { title: 'For citizens', items: FOR_CITIZENS },
              { title: 'For county teams', items: FOR_TEAMS },
            ].map((col, i) => (
              <Reveal key={col.title} delay={i * 120}>
                <div className="h-full rounded-2xl bg-white/5 p-7 ring-1 ring-white/10 backdrop-blur">
                  <h3 className="text-xl font-bold">{col.title}</h3>
                  <ul className="mt-5 space-y-4">
                    {col.items.map(({ icon: Icon, text }) => (
                      <li key={text} className="flex items-start gap-4">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-400/15 text-emerald-300">
                          <Icon size={18} aria-hidden />
                        </span>
                        <span className="pt-1.5 text-sm text-slate-200">{text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="faqs" className="flex min-h-dvh items-center bg-white px-4 pb-20 pt-28 md:px-8">
        <div className="mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-[2fr_3fr]">
          <Reveal>
            <SectionHeading eyebrow="FAQs" title="Questions, answered" text="The essentials about reporting an issue and following it through." />
            <div className="mt-8 rounded-2xl bg-brand-50 p-6">
              <p className="font-semibold text-slate-900">Ready to report something?</p>
              <p className="mt-1 text-sm text-slate-600">It takes about two minutes.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link to={submitTo} className="btn-primary px-5">
                  {user?.role === 'ADMIN' ? 'Open dashboard' : 'Submit a request'} <ArrowRight size={16} aria-hidden />
                </Link>
                {!user && (
                  <Link to="/register" className="btn-outline px-5">
                    Create an account
                  </Link>
                )}
              </div>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200">
              {FAQS.map(({ q, a }) => (
                <details key={q} className="group px-5 py-4 open:bg-slate-50">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
                    {q}
                    <ChevronDown size={18} className="shrink-0 text-slate-400 transition group-open:rotate-180" aria-hidden />
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{a}</p>
                </details>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="bg-navy-900 text-slate-300">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 text-sm md:grid-cols-[1fr_auto_auto] md:px-8">
          <div>
            <Logo light />
            <p className="mt-4 max-w-xs text-slate-400">Service · Integrity · Development</p>
          </div>
          <nav aria-label="Footer" className="grid content-start gap-2">
            {NAV.map((n) => (
              <a key={n.id} href={`#${n.id}`} className="hover:text-white">
                {n.label}
              </a>
            ))}
          </nav>
          <nav aria-label="Account" className="grid content-start gap-2">
            <Link to={trackTo} className="hover:text-white">
              Track request
            </Link>
            {user ? (
              <Link to="/dashboard" className="hover:text-white">
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="hover:text-white">
                  Login
                </Link>
                <Link to="/register" className="hover:text-white">
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
        <p className="border-t border-white/10 py-4 text-center text-xs text-slate-400">&copy; {new Date().getFullYear()} Murang'a County Government</p>
      </footer>
    </div>
  );
}
