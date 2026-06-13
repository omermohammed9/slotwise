export type BookingStatus = 'approved' | 'pending' | 'reschedule';
export type ConflictRisk = 'high' | 'low' | 'medium';

export type BookingPreview = {
  id: string;
  customerName: string;
  service: string;
  resource: string;
  status: BookingStatus;
  risk: ConflictRisk;
  startAt: Date;
  endAt: Date;
};
