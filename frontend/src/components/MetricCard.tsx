type MetricCardProps = {
  label: string;
  value: string;
  trend: string;
  tone: 'danger' | 'info' | 'success' | 'warning';
};

export function MetricCard({ label, value, trend, tone }: MetricCardProps) {
  return (
    <article className={`metric-card metric-${tone}`}>
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{trend}</span>
    </article>
  );
}
