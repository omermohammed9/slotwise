import type { LucideIcon } from 'lucide-react';

type LoadingStateProps = {
  label: string;
};

type InlineNoticeProps = {
  icon?: LucideIcon;
  message: string;
  tone: 'error' | 'success';
};

export function LoadingState({ label }: LoadingStateProps) {
  return (
    <div className="table-state" role="status" aria-live="polite" aria-atomic="true">
      {label}
    </div>
  );
}

export function InlineNotice({ icon: Icon, message, tone }: InlineNoticeProps) {
  return (
    <p
      className={`form-${tone}`}
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live={tone === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      {Icon ? <Icon size={16} aria-hidden="true" /> : null}
      {message}
    </p>
  );
}
