import type { LucideIcon } from 'lucide-react';

type RoutePlaceholderProps = {
  eyebrow: string;
  title: string;
  summary: string;
  icon: LucideIcon;
  checkpoints: readonly string[];
};

export function RoutePlaceholder({ eyebrow, title, summary, icon: Icon, checkpoints }: RoutePlaceholderProps) {
  const titleId = `${title.replace(/\s+/g, '-').toLowerCase()}-title`;

  return (
    <section className="route-placeholder" aria-labelledby={titleId}>
      <div className="route-hero">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1 id={titleId}>{title}</h1>
          <p className="lede">{summary}</p>
        </div>
        <div className="route-icon" aria-hidden="true">
          <Icon size={24} />
        </div>
      </div>

      <div className="placeholder-grid" aria-label={`${title} coverage`}>
        {checkpoints.map((checkpoint) => (
          <article className="placeholder-card" key={checkpoint}>
            <span />
            <p>{checkpoint}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
