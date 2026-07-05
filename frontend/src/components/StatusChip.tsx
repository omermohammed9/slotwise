import type { ReactNode } from 'react';
import type { BookingStatus } from '@/api/types';

type StatusChipProps = {
  children: ReactNode;
  status: BookingStatus | 'reschedule';
};

export function StatusChip({ children, status }: StatusChipProps) {
  return <span className={`status-chip status-${status}`}>{children}</span>;
}
