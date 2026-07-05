import { useEffect, useState } from 'react';
import { inviteOperator, listOperators, updateOperatorRole, updateOperatorStatus, type OperatorAccountDto } from '@/api/operators';
import type { Role } from '@/api/types';
import { useSessionStore } from '@/auth/sessionStore';

const operatorRoles: Array<Exclude<Role, 'customer'>> = ['owner', 'admin', 'staff'];

export function UserAdminPage() {
  const { token } = useSessionStore();
  const [operators, setOperators] = useState<OperatorAccountDto[]>([]);
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<Exclude<Role, 'customer'>>('staff');
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [invitationToken, setInvitationToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);
  const [updatingOperatorId, setUpdatingOperatorId] = useState<string | null>(null);

  async function refresh() {
    setIsLoading(true);
    setError(null);
    const response = await listOperators(token);
    if (response.success) {
      setOperators(response.data.operators);
    } else {
      setError(response.error.message);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    void refresh();
  }, [token]);

  async function handleInvite(event: React.FormEvent) {
    event.preventDefault();
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setError('Username is required before creating an invitation.');
      return;
    }

    setIsInviting(true);
    setNotice(null);
    setError(null);
    setInvitationToken(null);
    const response = await inviteOperator({ username, role }, token);
    if (response.success) {
      setInvitationToken(response.data.token ?? null);
      setNotice(
        response.data.token
          ? 'Invitation created. Share this setup token through a trusted channel.'
          : 'Invitation created. Slotwise will deliver the setup message through the notification outbox.',
      );
      setUsername('');
      await refresh();
    } else {
      setError(response.error.message);
    }
    setIsInviting(false);
  }

  async function handleCopyInvitationToken() {
    if (!invitationToken) return;
    await navigator.clipboard?.writeText(invitationToken);
    setNotice('Setup token copied. It is still visible here until you leave or create another invitation.');
  }

  return (
    <section className="route-placeholder">
      <header className="workspace-header">
        <div>
          <p className="eyebrow">Owner</p>
          <h1>Users</h1>
          <p className="lede">Invite operators, assign roles, and control account access.</p>
        </div>
      </header>

      <div className="management-grid">
        <form className="panel management-form" onSubmit={handleInvite}>
          <div className="panel-heading">
            <div>
              <h2>Invite operator</h2>
              <p className="body-copy">Creates a pending account until the setup token is accepted.</p>
            </div>
          </div>
          <label className="form-field">
            Username
            <input value={username} onChange={(event) => setUsername(event.target.value)} />
          </label>
          <label className="form-field">
            Role
            <select value={role} onChange={(event) => setRole(event.target.value as Exclude<Role, 'customer'>)}>
              {operatorRoles.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <button className="primary-button compact-button" disabled={isInviting} type="submit">
            {isInviting ? 'Inviting...' : 'Invite'}
          </button>
          {error ? <p className="form-error">{error}</p> : null}
          {notice ? <p className="form-success">{notice}</p> : null}
          {invitationToken ? (
            <div className="form-success" role="status">
              <p>Setup token</p>
              <code>{invitationToken}</code>
              <button className="secondary-button compact-button" type="button" onClick={handleCopyInvitationToken}>
                Copy token
              </button>
            </div>
          ) : null}
        </form>

        <div className="panel booking-list-panel">
          <div className="panel-heading">
            <h2>Operator accounts</h2>
            <button className="secondary-button compact-button" disabled={isLoading} type="button" onClick={() => void refresh()}>
              Refresh
            </button>
          </div>
          <div className="booking-list">
            {isLoading ? <p className="body-copy">Loading operator accounts...</p> : null}
            {!isLoading && operators.length === 0 ? (
              <div className="empty-state">
                <h3>No operators found</h3>
                <p className="body-copy">Create an invitation to add the first operator account.</p>
              </div>
            ) : null}
            {!isLoading && operators.map((operator) => (
              <article className="booking-row" key={operator.id}>
                <div className="booking-main">
                  <h3>{operator.username}</h3>
                  <p>{operator.actorId}</p>
                  <p>{operator.invitationAcceptedAt ? 'Invitation accepted' : 'Invitation pending'}</p>
                </div>
                <div className="booking-meta">
                  <select
                    aria-label={`Role for ${operator.username}`}
                    disabled={updatingOperatorId === operator.id}
                    value={operator.role}
                    onChange={async (event) => {
                      setUpdatingOperatorId(operator.id);
                      setError(null);
                      const response = await updateOperatorRole(operator.id, event.target.value as Exclude<Role, 'customer'>, token);
                      if (response.success) {
                        await refresh();
                      } else {
                        setError(response.error.message);
                      }
                      setUpdatingOperatorId(null);
                    }}
                  >
                    {operatorRoles.map((item) => <option key={item}>{item}</option>)}
                  </select>
                  <button
                    className="secondary-button compact-button"
                    disabled={updatingOperatorId === operator.id}
                    type="button"
                    onClick={async () => {
                      setUpdatingOperatorId(operator.id);
                      setError(null);
                      const response = await updateOperatorStatus(operator.id, !operator.active, token);
                      if (response.success) {
                        await refresh();
                      } else {
                        setError(response.error.message);
                      }
                      setUpdatingOperatorId(null);
                    }}
                  >
                    {updatingOperatorId === operator.id ? 'Saving...' : operator.active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
