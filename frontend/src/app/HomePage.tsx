import { ArrowRight, CalendarDays, LogIn, UserRoundCheck } from 'lucide-react';
import { Link } from 'react-router';

const knownBookingSlugs = ['demo-business'];

export function HomePage() {
  return (
    <main className="home-page">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-brand-mark" aria-hidden="true">
          S
        </div>
        <p className="eyebrow">Slotwise</p>
        <h1 id="home-title">Slotwise booking operations</h1>
        <p className="lede">
          A production entry point for operators and customers, with owner setup kept to the CLI and customer access kept
          through portal magic links.
        </p>
        <div className="home-actions">
          <Link className="primary-button" to="/login">
            <LogIn size={17} aria-hidden="true" />
            Sign in
          </Link>
          <Link className="secondary-button" to="/portal">
            <UserRoundCheck size={17} aria-hidden="true" />
            Customer portal
          </Link>
        </div>
      </section>

      <section className="home-band" aria-labelledby="booking-guidance-title">
        <div>
          <p className="eyebrow">Public booking</p>
          <h2 id="booking-guidance-title">Book through a business link</h2>
          <p className="body-copy">Use a known business slug when one has been shared with you.</p>
        </div>
        <div className="home-slug-list">
          {knownBookingSlugs.map((slug) => (
            <Link className="home-slug-link" key={slug} to={`/book/${slug}`}>
              <CalendarDays size={17} aria-hidden="true" />
              <span>/book/{slug}</span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
