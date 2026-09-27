/**
 * YOJANA SETU — ADMIN CONSOLE UI kit.
 * Dense, desktop-first SaaS styling. Minimal animation by design.
 */
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { X, CheckCircle2, AlertTriangle, Info, Search, Inbox } from 'lucide-react';
import { cx } from '../lib/format';

/* ------------------------------------------------------------------ */
/* Badges                                                              */
/* ------------------------------------------------------------------ */

type Tone = 'green' | 'amber' | 'red' | 'blue' | 'gray' | 'purple';

const TONE_CLASSES: Record<Tone, string> = {
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  gray: 'bg-gray-100 text-gray-600 border-gray-200',
  purple: 'bg-violet-50 text-violet-700 border-violet-200',
};

export const Badge: React.FC<{ tone?: Tone; children: React.ReactNode; className?: string }> = ({
  tone = 'gray',
  children,
  className,
}) => (
  <span
    className={cx(
      'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap',
      TONE_CLASSES[tone],
      className,
    )}
  >
    {children}
  </span>
);

const SCHEME_STATUS_TONE: Record<string, Tone> = {
  published: 'green',
  verified: 'blue',
  under_review: 'amber',
  draft: 'gray',
  rejected: 'red',
  archived: 'gray',
};

export const SchemeStatusBadge: React.FC<{ status: string | null }> = ({ status }) => {
  const s = (status ?? 'draft').toLowerCase();
  return <Badge tone={SCHEME_STATUS_TONE[s] ?? 'gray'}>{s.replace(/_/g, ' ').toUpperCase()}</Badge>;
};

export const VerificationBadge: React.FC<{ value: string | null }> = ({ value }) => {
  const v = (value ?? 'UNVERIFIED').toUpperCase();
  const tone: Tone = v === 'VERIFIED' ? 'green' : v === 'PARTIALLY_VERIFIED' || v === 'NEEDS_REVIEW' ? 'amber' : 'gray';
  return <Badge tone={tone}>{v.replace(/_/g, ' ')}</Badge>;
};

/* ------------------------------------------------------------------ */
/* Cards & stats                                                       */
/* ------------------------------------------------------------------ */

export const StatCard: React.FC<{
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  tone?: Tone;
  onClick?: () => void;
}> = ({ label, value, sub, icon, tone = 'gray', onClick }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={!onClick}
    className={cx(
      'text-left bg-white rounded-xl border border-gray-200 p-4 shadow-sm',
      onClick && 'hover:border-gray-300 hover:shadow cursor-pointer',
    )}
  >
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</span>
      {icon && <span className={cx('p-1.5 rounded-lg', TONE_CLASSES[tone], 'border')}>{icon}</span>}
    </div>
    <div className="mt-2 text-2xl font-extrabold tracking-tight">{value}</div>
    {sub && <div className="mt-1 text-xs text-gray-500">{sub}</div>}
  </button>
);

/* ------------------------------------------------------------------ */
/* Tables                                                              */
/* ------------------------------------------------------------------ */

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export function DataTable<T>({
  columns,
  rows,
  keyOf,
  loading,
  emptyTitle = 'Nothing here',
  emptyHint,
}: {
  columns: Column<T>[];
  rows: T[];
  keyOf: (row: T, i: number) => string;
  loading?: boolean;
  emptyTitle?: string;
  emptyHint?: string;
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="animate-pulse divide-y divide-gray-100">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-50" />
          ))}
        </div>
      </div>
    );
  }
  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} hint={emptyHint} />;
  }
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={cx(
                    'text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500 whitespace-nowrap',
                    c.headerClassName,
                  )}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row, i) => (
              <tr key={keyOf(row, i)} className="hover:bg-gray-50/60">
                {columns.map((c) => (
                  <td key={c.key} className={cx('px-4 py-3 align-top', c.className)}>
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const Pagination: React.FC<{
  page: number;
  pageSize: number;
  total: number;
  onPage: (p: number) => void;
}> = ({ page, pageSize, total, onPage }) => {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-3 text-sm">
      <span className="text-gray-500 text-xs">
        Page {page + 1} of {pages} · {total.toLocaleString('en-IN')} rows
      </span>
      <div className="flex gap-1">
        <button
          className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold disabled:opacity-40"
          disabled={page === 0}
          onClick={() => onPage(page - 1)}
        >
          ← Prev
        </button>
        <button
          className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold disabled:opacity-40"
          disabled={page >= pages - 1}
          onClick={() => onPage(page + 1)}
        >
          Next →
        </button>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Modal & confirm                                                     */
/* ------------------------------------------------------------------ */

export const Modal: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}> = ({ open, onClose, title, children, wide }) => {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className={cx(
          'relative bg-white rounded-2xl shadow-xl w-full max-h-[90vh] overflow-y-auto',
          wide ? 'max-w-4xl' : 'max-w-lg',
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="text-base font-bold">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
};

export const ConfirmDialog: React.FC<{
  open: boolean;
  title: string;
  body: React.ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  busy?: boolean;
  requireReason?: boolean;
  reasonLabel?: string;
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
}> = ({
  open,
  title,
  body,
  confirmLabel = 'Confirm',
  danger,
  busy,
  requireReason,
  reasonLabel = 'Reason (recorded in the audit log)',
  onConfirm,
  onCancel,
}) => {
  const [reason, setReason] = useState('');
  useEffect(() => {
    if (open) setReason('');
  }, [open ]);
  if (!open) return null;
  const valid = !requireReason || reason.trim().length > 0;
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <div className="text-sm text-gray-600 leading-relaxed">{body}</div>
      {requireReason && (
        <div className="mt-4">
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
            {reasonLabel}
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6B4C]/40"
            placeholder="Why is this change being made?"
          />
        </div>
      )}
      <div className="mt-6 flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          disabled={!valid || busy}
          onClick={() => onConfirm(requireReason ? reason.trim() : undefined)}
          className={cx(
            'px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50',
            danger ? 'bg-red-600 hover:bg-red-700' : 'bg-[#0F6B4C] hover:bg-[#0C5A40]',
          )}
        >
          {busy ? 'Working…' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
};

/* ------------------------------------------------------------------ */
/* Toasts                                                              */
/* ------------------------------------------------------------------ */

interface ToastMsg {
  id: number;
  kind: 'success' | 'error' | 'info';
  message: string;
}

const ToastCtx = createContext<{ push: (kind: ToastMsg['kind'], message: string) => void }>({
  push: () => {},
});

export const useToast = () => useContext(ToastCtx);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const idRef = useRef(0);

  const push = useCallback((kind: ToastMsg['kind'], message: string) => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  const Icon = { success: CheckCircle2, error: AlertTriangle, info: Info } as const;
  const tone: Record<ToastMsg['kind'], string> = {
    success: 'text-emerald-600',
    error: 'text-red-600',
    info: 'text-blue-600',
  };

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[60] space-y-2 w-80">
        {toasts.map((t) => {
          const I = Icon[t.kind];
          return (
            <div
              key={t.id}
              className="flex items-start gap-2.5 bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm"
            >
              <I size={17} className={cx('mt-0.5 shrink-0', tone[t.kind])} />
              <span className="text-gray-700 leading-snug">{t.message}</span>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
};

/* ------------------------------------------------------------------ */
/* Misc                                                                */
/* ------------------------------------------------------------------ */

export const EmptyState: React.FC<{ title: string; hint?: string; action?: React.ReactNode }> = ({
  title,
  hint,
  action,
}) => (
  <div className="bg-white rounded-xl border border-dashed border-gray-300 px-6 py-12 text-center">
    <Inbox size={28} className="mx-auto text-gray-300 mb-3" />
    <div className="font-semibold text-gray-700">{title}</div>
    {hint && <div className="text-sm text-gray-500 mt-1 max-w-md mx-auto">{hint}</div>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const AlertBanner: React.FC<{ tone?: Tone; children: React.ReactNode; className?: string }> = ({
  tone = 'blue',
  children,
  className,
}) => (
  <div className={cx('rounded-xl border px-4 py-3 text-sm leading-relaxed', TONE_CLASSES[tone], className)}>
    {children}
  </div>
);

export const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({
  label,
  hint,
  children,
}) => (
  <div>
    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
      {label}
    </label>
    {children}
    {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
  </div>
);

export const TextInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>((props, ref) => (
  <input
    ref={ref}
    {...props}
    className={cx(
      'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6B4C]/40 focus:border-[#0F6B4C] disabled:bg-gray-50 disabled:text-gray-400',
      props.className,
    )}
  />
));
TextInput.displayName = 'TextInput';

export const TextArea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>((props, ref) => (
  <textarea
    ref={ref}
    {...props}
    className={cx(
      'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6B4C]/40 focus:border-[#0F6B4C] disabled:bg-gray-50',
      props.className,
    )}
  />
));
TextArea.displayName = 'TextArea';

export const SelectInput = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>((props, ref) => (
  <select
    ref={ref}
    {...props}
    className={cx(
      'rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0F6B4C]/40 focus:border-[#0F6B4C] disabled:bg-gray-50',
      props.className,
    )}
  />
));
SelectInput.displayName = 'SelectInput';

export const Tabs: React.FC<{
  tabs: Array<{ key: string; label: string; count?: number }>;
  active: string;
  onChange: (key: string) => void;
}> = ({ tabs, active, onChange }) => (
  <div className="flex gap-1 border-b border-gray-200 mb-5 overflow-x-auto">
    {tabs.map((t) => (
      <button
        key={t.key}
        onClick={() => onChange(t.key)}
        className={cx(
          'px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px',
          active === t.key
            ? 'border-[#0F6B4C] text-[#0F6B4C]'
            : 'border-transparent text-gray-500 hover:text-gray-800',
        )}
      >
        {t.label}
        {t.count != null && (
          <span className="ml-1.5 text-[11px] bg-gray-100 text-gray-600 rounded-full px-1.5 py-0.5">
            {t.count}
          </span>
        )}
      </button>
    ))}
  </div>
);

export const SearchInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}> = ({ value, onChange, placeholder = 'Search…', className }) => (
  <div className={cx('relative', className)}>
    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6B4C]/40 focus:border-[#0F6B4C]"
    />
  </div>
);

export const PageHeader: React.FC<{
  title: string;
  description?: string;
  actions?: React.ReactNode;
}> = ({ title, description, actions }) => (
  <div className="flex items-start justify-between gap-4 mb-6">
    <div>
      <h1 className="text-xl font-extrabold tracking-tight">{title}</h1>
      {description && <p className="text-sm text-gray-500 mt-1 max-w-2xl">{description}</p>}
    </div>
    {actions && <div className="flex gap-2 shrink-0">{actions}</div>}
  </div>
);

export const Btn: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit';
}> = ({ children, onClick, variant = 'secondary', disabled, className, type = 'button' }) => {
  const styles: Record<string, string> = {
    primary: 'bg-[#0F6B4C] text-white hover:bg-[#0C5A40] border-[#0F6B4C]',
    secondary: 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700 border-red-600',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 border-transparent',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cx(
        'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-sm font-semibold transition-colors disabled:opacity-50',
        styles[variant],
        className,
      )}
    >
      {children}
    </button>
  );
};
