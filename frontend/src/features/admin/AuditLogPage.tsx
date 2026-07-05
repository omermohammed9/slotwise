import { useEffect, useState } from 'react';
import { exportAuditLogsCsv, listAuditLogs, type AuditLogDto } from '@/api/auditLogs';
import { useSessionStore } from '@/auth/sessionStore';

export function AuditLogPage() {
  const { token } = useSessionStore();
  const [logs, setLogs] = useState<AuditLogDto[]>([]);
  const [draftFilters, setDraftFilters] = useState({ actorId: '', action: '', entity: '', from: '', to: '', limit: '50', page: '1' });
  const [filters, setFilters] = useState(draftFilters);
  const [meta, setMeta] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    void listAuditLogs(filters, token).then((response) => {
      if (cancelled) return;
      if (response.success) {
        setLogs(response.data.logs);
        setMeta({
          page: Number(response.meta?.page ?? filters.page ?? 1),
          limit: Number(response.meta?.limit ?? filters.limit ?? 50),
          total: Number(response.meta?.total ?? response.data.logs.length),
          totalPages: Number(response.meta?.totalPages ?? 1),
        });
      } else {
        setError(response.error.message);
      }
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [filters, token]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (draftFilters.from && draftFilters.to && draftFilters.from > draftFilters.to) {
      setError('The start date must be before the end date.');
      return;
    }

    const limit = Number(draftFilters.limit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      setError('Limit must be a whole number from 1 to 100.');
      return;
    }

    setFilters({ ...draftFilters, page: '1' });
  }

  function handleClear() {
    const clearedFilters = { actorId: '', action: '', entity: '', from: '', to: '', limit: '50', page: '1' };
    setDraftFilters(clearedFilters);
    setFilters(clearedFilters);
  }

  function goToPage(page: number) {
    const nextPage = String(Math.min(Math.max(page, 1), meta.totalPages));
    setDraftFilters({ ...draftFilters, page: nextPage });
    setFilters({ ...filters, page: nextPage });
  }

  async function handleExport() {
    setIsExporting(true);
    setError(null);
    const response = await exportAuditLogsCsv(filters, token);
    setIsExporting(false);

    if (!response.success) {
      setError(response.message);
      return;
    }

    const blob = new Blob([response.csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `slotwise-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="route-placeholder">
      <header className="workspace-header">
        <div>
          <p className="eyebrow">Audit</p>
          <h1>Audit log</h1>
          <p className="lede">Review operator actions, auth events, and account lifecycle changes.</p>
        </div>
      </header>

      <form className="panel" onSubmit={handleSubmit}>
        <div className="customer-controls">
          {(['actorId', 'action', 'entity', 'from', 'to', 'limit'] as const).map((field) => (
            <label className="form-field" key={field}>
              {field}
              <input
                max={field === 'limit' ? 100 : undefined}
                min={field === 'limit' ? 1 : undefined}
                type={field === 'from' || field === 'to' ? 'date' : field === 'limit' ? 'number' : 'text'}
                value={draftFilters[field]}
                onChange={(event) => setDraftFilters({ ...draftFilters, [field]: event.target.value })}
              />
            </label>
          ))}
        </div>
        <div className="action-row">
          <button className="primary-button compact-button" type="submit">Apply filters</button>
          <button className="secondary-button compact-button" type="button" onClick={handleClear}>Clear</button>
          <button className="secondary-button compact-button" disabled={isExporting || isLoading} type="button" onClick={handleExport}>
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
        {error ? <p className="form-error">{error}</p> : null}
      </form>

      <div className="panel booking-list-panel">
        <div className="panel-heading">
          <div>
            <h2>Events</h2>
            <p className="body-copy">Page {meta.page} of {meta.totalPages} · {meta.total} total events</p>
          </div>
          <button className="secondary-button compact-button" disabled={isLoading} type="button" onClick={() => setFilters({ ...filters })}>
            Refresh
          </button>
        </div>
        <div className="booking-list">
          {isLoading ? <p className="body-copy">Loading audit events...</p> : null}
          {!isLoading && logs.length === 0 ? (
            <div className="empty-state">
              <h3>No audit events found</h3>
              <p className="body-copy">Adjust the filters or clear them to review recent activity.</p>
            </div>
          ) : null}
          {!isLoading && logs.map((log) => (
            <article className="booking-row" key={log._id}>
              <div className="booking-main">
                <h3>{log.action}</h3>
                <p>{log.targetEntity}{log.targetId ? `:${log.targetId}` : ''}</p>
              </div>
              <div className="booking-meta">
                <span className="status-chip status-approved">{log.actorRole}</span>
                <span>{log.actorId}</span>
                <span>{log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}</span>
              </div>
            </article>
          ))}
        </div>
        <div className="action-row">
          <button className="secondary-button compact-button" disabled={isLoading || meta.page <= 1} type="button" onClick={() => goToPage(meta.page - 1)}>
            Previous
          </button>
          <button className="secondary-button compact-button" disabled={isLoading || meta.page >= meta.totalPages} type="button" onClick={() => goToPage(meta.page + 1)}>
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
