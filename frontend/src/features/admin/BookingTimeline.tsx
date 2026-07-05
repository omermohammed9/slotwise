import { format } from 'date-fns';
import type { BookingPreview } from '@/features/admin/types';

type BookingTimelineProps = {
  bookings: readonly BookingPreview[];
};

export function BookingTimeline({ bookings }: BookingTimelineProps) {
  return (
    <div className="timeline" aria-label="Today timeline">
      {bookings.map((booking) => (
        <div className={`timeline-card timeline-${booking.risk}`} key={booking.id}>
          <span>{format(booking.startAt, 'h:mm a')}</span>
          <strong>{booking.resource}</strong>
          <p>{booking.customerName}</p>
        </div>
      ))}
    </div>
  );
}
