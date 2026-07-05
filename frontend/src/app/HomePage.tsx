import { ArrowRight, CalendarDays, LogIn, UserRoundCheck } from 'lucide-react';
import { Link } from 'react-router';
import { LanguageSwitcher } from '@/i18n/LanguageSwitcher';
import { useI18n } from '@/i18n/I18nProvider';

const knownBookingSlugs = ['demo-business'];

export function HomePage() {
  const { t } = useI18n();

  return (
    <main className="home-page">
      <div className="home-toolbar">
        <LanguageSwitcher />
      </div>
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-brand-mark" aria-hidden="true">
          S
        </div>
        <p className="eyebrow">{t('home.eyebrow')}</p>
        <h1 id="home-title">{t('home.title')}</h1>
        <p className="lede">{t('home.lede')}</p>
        <div className="home-actions">
          <Link className="primary-button" to="/login">
            <LogIn size={17} aria-hidden="true" />
            {t('home.signIn')}
          </Link>
          <Link className="secondary-button" to="/portal">
            <UserRoundCheck size={17} aria-hidden="true" />
            {t('home.customerPortal')}
          </Link>
        </div>
      </section>

      <section className="home-band" aria-labelledby="booking-guidance-title">
        <div>
          <p className="eyebrow">{t('home.publicBooking')}</p>
          <h2 id="booking-guidance-title">{t('home.bookingTitle')}</h2>
          <p className="body-copy">{t('home.bookingCopy')}</p>
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
