import { format } from 'date-fns';
import { StatusChip } from '../../components/StatusChip';
import type { BookingPreview } from './types';

type BookingQueueProps = {
  bookings: readonly BookingPreview[];
};

export function BookingQueue({ bookings }: BookingQueueProps) {
  return (
    <div className="booking-list" role="list" aria-label="Booking queue">
      {bookings.map((booking) => (
        <article className="booking-row" key={booking.id} role="listitem">
          <div className="booking-time">
            <strong>{format(booking.startAt, 'h:mm a')}</strong>
            <span>{format(booking.endAt, 'h:mm a')}</span>
          </div>
          <div className="booking-main">
            <h3>{booking.customerName}</h3>
            <p>
              {booking.service} · {booking.resource}
            </p>
          </div>
          <div className="booking-meta">
            <StatusChip status={booking.status}>{booking.status}</StatusChip>
            <span className={`risk-chip risk-${booking.risk}`}>{booking.risk} risk</span>
          </div>
        </article>
      ))}
    </div>
  );
}
