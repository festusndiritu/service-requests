import { Eye, EyeOff, type LucideIcon } from 'lucide-react';
import { useState, type InputHTMLAttributes } from 'react';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> & { icon: LucideIcon };

export function IconInput({ icon: Icon, type = 'text', ...props }: Props) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';
  return (
    <div className="relative">
      <Icon size={18} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input {...props} type={isPassword && visible ? 'text' : type} className={`input pl-10 ${isPassword ? 'pr-11' : ''}`} />
      {isPassword && (
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 rounded-r-lg px-3 text-slate-400 hover:text-slate-600"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </div>
  );
}
