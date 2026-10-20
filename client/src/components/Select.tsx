import { Check, ChevronDown, type LucideIcon } from 'lucide-react';
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
  color?: string;
}

interface SelectProps<T extends string> {
  value: T | '';
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  label?: string;
  ariaLabel?: string;
  hint?: ReactNode;
  error?: string;
  className?: string;
}

const MENU_MAX_HEIGHT = 288;

export function Select<T extends string>({ value, onChange, options, placeholder = 'Select…', label, ariaLabel, hint, error, className = '' }: SelectProps<T>) {
  const id = useId();
  const triggerId = `${id}-trigger`;
  const listId = `${id}-list`;
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const typed = useRef({ text: '', timer: 0 });

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [openUp, setOpenUp] = useState(false);

  const selected = options.find((o) => o.value === value);
  const optionId = (i: number) => `${id}-option-${i}`;

  function show() {
    const rect = trigger.current!.getBoundingClientRect();
    setOpenUp(window.innerHeight - rect.bottom < MENU_MAX_HEIGHT && rect.top > window.innerHeight - rect.bottom);
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  }

  function close() {
    setOpen(false);
  }

  function choose(i: number) {
    onChange(options[i].value);
    close();
    trigger.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => !root.current?.contains(e.target as Node) && close();
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  useEffect(() => {
    if (open) list.current?.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    const last = options.length - 1;
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        show();
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActive((i) => Math.min(last, i + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActive((i) => Math.max(0, i - 1));
        break;
      case 'Home':
        e.preventDefault();
        setActive(0);
        break;
      case 'End':
        e.preventDefault();
        setActive(last);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        choose(active);
        break;
      case 'Escape':
        e.preventDefault();
        close();
        break;
      case 'Tab':
        close();
        break;
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
          const t = typed.current;
          window.clearTimeout(t.timer);
          t.text += e.key.toLowerCase();
          t.timer = window.setTimeout(() => (t.text = ''), 600);
          const from = t.text.length === 1 ? active + 1 : active;
          const order = [...options.keys()].map((_, n) => (from + n) % options.length);
          const match = order.find((i) => options[i].label.toLowerCase().startsWith(t.text));
          if (match !== undefined) setActive(match);
        }
    }
  }

  const Icon = selected?.icon;

  return (
    <div ref={root} className={`relative ${className}`}>
      {label && (
        <label htmlFor={triggerId} className="label">
          {label}
        </label>
      )}
      <button
        ref={trigger}
        id={triggerId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? optionId(active) : undefined}
        aria-label={label ? undefined : ariaLabel}
        aria-invalid={error ? true : undefined}
        onClick={() => (open ? close() : show())}
        onKeyDown={onKeyDown}
        className={`input flex items-center gap-2 text-left ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
      >
        {Icon && <Icon size={16} className="shrink-0" style={{ color: selected?.color }} aria-hidden />}
        <span className={`flex-1 truncate ${selected ? 'text-slate-900' : 'text-slate-400'}`}>{selected?.label ?? placeholder}</span>
        <ChevronDown size={16} aria-hidden className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <ul
          ref={list}
          id={listId}
          role="listbox"
          aria-label={label ?? ariaLabel}
          className={`absolute left-0 z-30 max-h-72 w-full min-w-48 overflow-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg ${
            openUp ? 'bottom-full mb-1' : 'top-full mt-1'
          }`}
        >
          {options.map((o, i) => (
            <li
              key={o.value}
              id={optionId(i)}
              role="option"
              aria-selected={o.value === value}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(i)}
              onMouseMove={() => active !== i && setActive(i)}
              className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm ${
                i === active ? 'bg-slate-100' : ''
              } ${o.value === value ? 'font-semibold text-slate-900' : 'text-slate-700'}`}
            >
              {o.icon && (
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md" style={{ backgroundColor: `${o.color ?? '#64748b'}1a`, color: o.color ?? '#64748b' }}>
                  <o.icon size={14} aria-hidden />
                </span>
              )}
              <span className="flex-1">{o.label}</span>
              {o.value === value && <Check size={16} className="shrink-0 text-brand-600" aria-hidden />}
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p role="alert" className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      )}
      {hint && !error && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
