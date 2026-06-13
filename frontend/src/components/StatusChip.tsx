import type { ReactNode } from 'react';

type StatusChipProps = {
  children: ReactNode;
  status: 'approved' | 'cancelled' | 'completed' | 'pending' | 'rejected' | 'reschedule';
};

export function StatusChip({ children, status }: StatusChipProps) {
  return <span className={`status-chip status-${status}`}>{children}</span>;
}
