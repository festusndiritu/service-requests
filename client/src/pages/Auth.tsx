import { ArrowLeft, Bell, ClipboardCheck, IdCard, KeyRound, Landmark, Lock, Mail, MapPinned, Phone, Search, ShieldCheck, User, type LucideIcon } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import { IconInput } from '../components/IconInput';
import { Logo } from '../components/Logo';
import { useToast } from '../components/Toast';
import { ErrorMessage, Field } from '../components/ui';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useDocumentTitle } from '../lib/hooks';

type Mode = 'login' | 'register' | 'reset';

const PATH: Record<Mode, string> = { login: '/login', register: '/register', reset: '/forgot-password' };
const TITLE: Record<Mode, string> = { login: 'Sign in', register: 'Create your account', reset: 'Reset your password' };
const modeFromPath = (path: string): Mode => (path.startsWith('/register') ? 'register' : path.startsWith('/forgot') ? 'reset' : 'login');

const EASE = 'ease-[cubic-bezier(.77,0,.18,1)]';
// Sign in and reset share one height and a top-aligned start, so their headings sit on the same line
const STAGE = 'min-h-[22rem]';

export default function Auth() {
  const { pathname } = useLocation();
  const toast = useToast();
  const [mode, setMode] = useState<Mode>(() => modeFromPath(pathname));
  const [prefill, setPrefill] = useState('');
  const [resetKey, setResetKey] = useState(0);
  const [fade, setFade] = useState(false);
  const current = useRef(mode);
  const panes = useRef<Record<Mode, HTMLElement | null>>({ login: null, register: null, reset: null });
  const first = useRef(true);
  useDocumentTitle(TITLE[mode]);

  const go = useCallback((next: Mode) => {
    // The art only moves between sign in and register; sign in <-> reset fades in place
    setFade(current.current !== 'register' && next !== 'register');
    current.current = next;
    if (next === 'reset') setResetKey((k) => k + 1);
    setMode(next);
    window.history.replaceState(window.history.state, '', PATH[next]);
  }, []);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const timer = setTimeout(() => panes.current[mode]?.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true }), 450);
    return () => clearTimeout(timer);
  }, [mode]);

  const artOnRight = mode === 'register';

  return (
    <div className="relative h-dvh overflow-hidden bg-white">
      <aside className={`absolute inset-y-0 left-0 z-10 hidden w-1/2 overflow-hidden bg-emerald-950 text-white transition-transform duration-700 ${EASE} will-change-transform lg:block ${artOnRight ? 'translate-x-full' : 'translate-x-0'}`}>
        <img src="/login.webp" alt="" fetchPriority="high" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/75 via-emerald-900/40 to-emerald-950/80" />
        <div className={`absolute inset-0 transition-opacity duration-700 ${EASE} will-change-[opacity] ${artOnRight ? 'opacity-100' : 'opacity-0'}`}>
          <img src="/hero.webp" alt="" decoding="async" className="absolute inset-0 h-full w-full object-cover object-[62%_center]" />
          <div className="absolute inset-0 bg-gradient-to-b from-navy-900/80 via-navy-800/45 to-navy-900/85" />
        </div>

        <Link to="/" aria-label="Murang'a County Service Requests home" className="absolute left-10 top-8 z-10">
          <Logo light />
        </Link>

        <div className="relative grid h-full place-content-center place-items-center px-14">
          <ArtCopy fade={fade} active={mode === 'login'} icon={Landmark} title="Welcome back" text="Sign in to follow your requests and see updates the moment the county acts on them." cta="New here? Create an account" onCta={() => go('register')} />
          <ArtCopy fade={fade} active={mode === 'reset'} icon={ShieldCheck} title="Let's get you back in" text="We'll text a 6-digit code to the phone number on your account. Enter it, then choose a new password." cta="Back to sign in" onCta={() => go('login')} />
          <ArtCopy
            fade={fade}
            active={mode === 'register'}
            icon={ClipboardCheck}
            title="Your county, one request away"
            points={[
              { icon: MapPinned, text: 'Pinpoint the issue and add a photo' },
              { icon: Search, text: 'Follow every status change' },
              { icon: Bell, text: 'Get notified when it moves' },
            ]}
            cta="Already registered? Sign in"
            onCta={() => go('login')}
          />
        </div>
        <p className="absolute inset-x-0 bottom-8 text-center text-xs italic text-white/70">Service · Integrity · Development</p>
      </aside>

      <Pane refEl={(el) => (panes.current.login = el)} active={mode === 'login'} side="right" artOnRight={artOnRight} fade={fade}>
        <div className={STAGE}>
          <h1 className="text-3xl font-bold text-slate-900">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-500">Sign in to track your requests and access county services.</p>
          <LoginForm key={`login-${prefill}`} defaultIdentifier={prefill} onForgot={() => go('reset')} />
          <SwitchLine text="New to the portal?" action="Create an account" onClick={() => go('register')} />
        </div>
      </Pane>

      <Pane refEl={(el) => (panes.current.reset = el)} active={mode === 'reset'} side="right" artOnRight={artOnRight} fade={fade}>
        <ResetForm
          key={resetKey}
          onBack={() => go('login')}
          onDone={(identifier) => {
            setPrefill(identifier);
            go('login');
            toast('Password updated. Sign in with your new password.');
          }}
        />
      </Pane>

      <Pane refEl={(el) => (panes.current.register = el)} active={mode === 'register'} side="left" artOnRight={artOnRight} fade={fade}>
        <h1 className="text-3xl font-bold text-slate-900">Create your account</h1>
        <p className="mt-2 text-sm text-slate-500">Register once to report issues and follow them until they are resolved.</p>
        <RegisterForm />
        <SwitchLine text="Already registered?" action="Sign in" onClick={() => go('login')} />
      </Pane>
    </div>
  );
}

function Pane({ active, side, artOnRight, fade, refEl, children }: { active: boolean; side: 'left' | 'right'; artOnRight: boolean; fade: boolean; refEl: (el: HTMLElement | null) => void; children: ReactNode }) {
  // Only slide when the art moves. Sign in <-> reset keeps the art still, so those panes just cross-fade where they are.
  const away = side === 'left' ? 'translate-x-[6%] lg:translate-x-[35%]' : artOnRight ? '-translate-x-[6%] lg:-translate-x-[35%]' : '';
  const timing = fade ? `duration-300 ${active ? 'delay-200' : ''}` : `duration-700 ${active ? 'delay-150' : ''}`;
  return (
    <section
      ref={refEl}
      aria-hidden={!active}
      inert={!active}
      className={`absolute inset-y-0 left-0 w-full overflow-y-auto transition-[transform,opacity] ${timing} ${EASE} lg:w-1/2 ${side === 'right' ? 'lg:left-1/2' : ''} ${
        active ? 'translate-x-0 opacity-100' : `pointer-events-none opacity-0 ${away}`
      }`}
    >
      <div className="flex min-h-full flex-col px-6 py-6 sm:px-12">
        <div className="flex items-center justify-between">
          <Link to="/" className="lg:hidden" aria-label="Murang'a County Service Requests home">
            <Logo />
          </Link>
          <Link to="/" className="ml-auto inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
            <ArrowLeft size={16} aria-hidden /> Back to home
          </Link>
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-8">{children}</div>
      </div>
    </section>
  );
}

function ArtCopy({
  active,
  fade,
  icon: Icon,
  title,
  text,
  points,
  cta,
  onCta,
}: {
  active: boolean;
  fade: boolean;
  icon: LucideIcon;
  title: string;
  text?: string;
  points?: { icon: LucideIcon; text: string }[];
  cta: string;
  onCta: () => void;
}) {
  // All three share one grid cell and start at the top of it, so the icon stays put and only the words change
  return (
    <div
      aria-hidden={!active}
      inert={!active}
      className={`flex flex-col items-center self-start text-center transition-opacity ${fade ? 'duration-300' : 'duration-700'} ${EASE} [grid-area:1/1] ${active ? 'opacity-100 delay-200' : 'pointer-events-none opacity-0'}`}
    >
      <span className="grid h-20 w-20 place-items-center rounded-3xl bg-white/10 ring-1 ring-white/25 backdrop-blur">
        <Icon size={40} strokeWidth={1.5} aria-hidden />
      </span>
      <h2 className="mt-6 max-w-sm text-3xl font-bold leading-tight">{title}</h2>
      {text && <p className="mt-3 max-w-sm text-sm leading-relaxed text-emerald-50/90">{text}</p>}
      {points && (
        <ul className="mt-6 space-y-3 text-left text-sm">
          {points.map(({ icon: PIcon, text: t }) => (
            <li key={t} className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/15 backdrop-blur">
              <PIcon size={18} aria-hidden /> {t}
            </li>
          ))}
        </ul>
      )}
      <button type="button" onClick={onCta} className="mt-8 rounded-full border border-white/60 bg-white/10 px-6 py-2.5 text-sm font-semibold backdrop-blur transition hover:bg-white/25">
        {cta}
      </button>
    </div>
  );
}

function SwitchLine({ text, action, onClick }: { text: string; action: string; onClick: () => void }) {
  return (
    <p className="mt-6 text-center text-sm text-slate-500 lg:hidden">
      {text}{' '}
      <button type="button" onClick={onClick} className="font-semibold text-brand-700 hover:underline">
        {action}
      </button>
    </p>
  );
}

function LoginForm({ defaultIdentifier, onForgot }: { defaultIdentifier: string; onForgot: () => void }) {
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError('');
    try {
      await login(String(form.get('identifier')), String(form.get('password')));
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      <Field label="Email or ID number">
        <IconInput icon={Mail} name="identifier" defaultValue={defaultIdentifier} required autoComplete="username" placeholder="you@example.com or 12345678" />
      </Field>
      <div>
        <Field label="Password">
          <IconInput icon={Lock} type="password" name="password" required autoComplete="current-password" placeholder="Enter your password" />
        </Field>
        <div className="mt-2 text-right">
          <button type="button" onClick={onForgot} className="text-sm font-medium text-brand-700 hover:underline">
            Forgot password?
          </button>
        </div>
      </div>
      <ErrorMessage>{error}</ErrorMessage>
      <button type="submit" disabled={busy} className="btn-primary w-full py-3">
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}

function RegisterForm() {
  const { register } = useAuth();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const get = (name: string) => String(form.get(name));
    setBusy(true);
    setError('');
    try {
      await register({ fullName: get('fullName'), email: get('email'), idNumber: get('idNumber'), phone: get('phone'), password: get('password') });
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <Field label="Full name">
        <IconInput icon={User} name="fullName" required minLength={2} autoComplete="name" placeholder="John Mwangi" />
      </Field>
      <Field label="Email address">
        <IconInput icon={Mail} name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="ID number">
          <IconInput icon={IdCard} name="idNumber" required inputMode="numeric" pattern="\d{8,9}" title="8 or 9 digits" placeholder="12345678" />
        </Field>
        <Field label="Phone number" hint="Used to send your password reset code.">
          <IconInput icon={Phone} name="phone" type="tel" required autoComplete="tel" pattern="(\+254|0)\s?[17](\s?\d){8}" title="e.g. 0712 345 678" placeholder="07XX XXX XXX" />
        </Field>
      </div>
      <Field label="Password">
        <IconInput icon={Lock} type="password" name="password" required minLength={8} autoComplete="new-password" placeholder="At least 8 characters" />
      </Field>
      <ErrorMessage>{error}</ErrorMessage>
      <button type="submit" disabled={busy} className="btn-primary w-full py-3">
        {busy ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  );
}

function ResetForm({ onBack, onDone }: { onBack: () => void; onDone: (identifier: string) => void }) {
  const [step, setStep] = useState<'request' | 'code' | 'password'>('request');
  const [identifier, setIdentifier] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  function startOver() {
    setStep('request');
    setResetToken('');
    setError('');
  }

  async function sendCode(id: string) {
    setBusy(true);
    setError('');
    try {
      await api('/auth/forgot-password', { method: 'POST', json: { identifier: id } });
      setIdentifier(id);
      setStep('code');
      setCooldown(60);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function onRequest(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    sendCode(String(new FormData(e.currentTarget).get('identifier')).trim());
  }

  async function onVerify(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = String(new FormData(e.currentTarget).get('otp')).trim();
    setBusy(true);
    setError('');
    try {
      const res = await api<{ resetToken: string }>('/auth/verify-reset-code', { method: 'POST', json: { identifier, code } });
      setResetToken(res.resetToken);
      setStep('password');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onSetPassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const newPassword = String(form.get('newPassword'));
    if (newPassword !== String(form.get('confirm'))) {
      setError('The two passwords do not match.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api('/auth/reset-password', { method: 'POST', json: { resetToken, newPassword } });
      onDone(identifier);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  // Keyed on the step so each one gets fresh inputs (React would otherwise reuse the old input and its typed text)
  return (
    <div className={STAGE}>
      <div key={step} className="step-in">
        {step === 'request' && (
          <>
            <h1 className="text-3xl font-bold text-slate-900">Reset your password</h1>
            <p className="mt-2 text-sm text-slate-500">Enter your email or ID number. We'll send a 6-digit code by SMS to the phone number on your account.</p>
            <form onSubmit={onRequest} className="mt-8 space-y-4">
              <Field label="Email or ID number">
                <IconInput icon={Mail} name="identifier" required autoComplete="username" placeholder="you@example.com or 12345678" />
              </Field>
              <ErrorMessage>{error}</ErrorMessage>
              <button type="submit" disabled={busy} className="btn-primary w-full py-3">
                {busy ? 'Sending code…' : 'Send code'}
              </button>
            </form>
          </>
        )}

        {step === 'code' && (
          <>
            <h1 className="text-3xl font-bold text-slate-900">Enter the code</h1>
            <p className="mt-2 text-sm text-slate-500">If an account matches, a 6-digit code is on its way by SMS. It expires in 10 minutes.</p>
            <form onSubmit={onVerify} className="mt-8 space-y-4">
              <Field label="6-digit code">
                <IconInput icon={KeyRound} name="otp" required autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="\d{6}" title="6 digits" placeholder="123456" />
              </Field>
              <ErrorMessage>{error}</ErrorMessage>
              <button type="submit" disabled={busy} className="btn-primary w-full py-3">
                {busy ? 'Checking…' : 'Verify code'}
              </button>
              <div className="flex items-center justify-between text-sm">
                <button type="button" onClick={() => sendCode(identifier)} disabled={busy || cooldown > 0} className="font-medium text-brand-700 hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline">
                  {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
                </button>
                <button type="button" onClick={startOver} className="font-medium text-slate-500 hover:text-slate-800">
                  Use a different account
                </button>
              </div>
            </form>
          </>
        )}

        {step === 'password' && (
          <>
            <h1 className="text-3xl font-bold text-slate-900">Create a new password</h1>
            <p className="mt-2 text-sm text-slate-500">Code verified. Choose a new password for your account.</p>
            <form onSubmit={onSetPassword} className="mt-8 space-y-4">
              {/* Lets password managers file the new password under the right account */}
              <input type="text" name="username" autoComplete="username" value={identifier} readOnly tabIndex={-1} aria-hidden className="sr-only" />
              <Field label="New password">
                <IconInput icon={Lock} type="password" name="newPassword" required autoFocus minLength={8} autoComplete="new-password" placeholder="At least 8 characters" />
              </Field>
              <Field label="Confirm new password">
                <IconInput icon={Lock} type="password" name="confirm" required minLength={8} autoComplete="new-password" placeholder="Repeat the new password" />
              </Field>
              <ErrorMessage>{error}</ErrorMessage>
              <button type="submit" disabled={busy} className="btn-primary w-full py-3">
                {busy ? 'Updating…' : 'Update password'}
              </button>
              <div className="text-right text-sm">
                <button type="button" onClick={startOver} className="font-medium text-slate-500 hover:text-slate-800">
                  Start over
                </button>
              </div>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-sm text-slate-500">
          <button type="button" onClick={onBack} className="font-semibold text-brand-700 hover:underline">
            Back to sign in
          </button>
        </p>
      </div>
    </div>
  );
}
