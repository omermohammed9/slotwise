import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Plus, RefreshCw, Search, Wrench } from 'lucide-react';
import { createServiceResource, listServiceResources, updateServiceResource } from '../../api/resources';
import type { ServiceResourceDto } from '../../api/types';
import { useSessionStore } from '../../auth/sessionStore';
import { InlineNotice, LoadingState } from '../../components/AdminState';
import { EmptyState } from '../../components/EmptyState';

const resourceTypes = ['service', 'staff', 'room', 'table', 'equipment', 'appointment', 'event'];

function getResourceType(resource: ServiceResourceDto): string {
  return resource.resourceType ?? resource.type ?? 'service';
}

function isResourceActive(resource: ServiceResourceDto): boolean {
  return resource.active ?? resource.isActive ?? true;
}

export function ResourcesPage() {
  const { token } = useSessionStore();
  const queryClient = useQueryClient();
  const [businessId, setBusinessId] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [form, setForm] = useState({
    businessId: '',
    capacity: '1',
    description: '',
    durationMinutes: '60',
    name: '',
    resourceType: 'service',
    requiresApproval: false,
  });

  const query = useMemo(
    () => ({
      ...(businessId.trim() ? { businessId: businessId.trim() } : {}),
      ...(resourceType ? { resourceType } : {}),
      ...(showInactive ? {} : { active: true }),
    }),
    [businessId, resourceType, showInactive],
  );

  const resourcesQuery = useQuery({
    enabled: Boolean(token),
    queryFn: async () => {
      const response = await listServiceResources(query, token ?? '');

      if (!response.success) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    queryKey: ['service-resources', query, token],
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!token) {
        throw new Error('Sign in before creating resources.');
      }

      const response = await createServiceResource(
        {
          ...form,
          active: true,
          capacity: Number(form.capacity),
          durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : undefined,
          supportedRoles: ['staff'],
        },
        token,
      );

      if (!response.success) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    onSuccess: () => {
      setForm({
        businessId,
        capacity: '1',
        description: '',
        durationMinutes: '60',
        name: '',
        resourceType: 'service',
        requiresApproval: false,
      });
      queryClient.invalidateQueries({ queryKey: ['service-resources'] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (resource: ServiceResourceDto) => {
      if (!token) {
        throw new Error('Sign in before updating resources.');
      }

      const response = await updateServiceResource(resource._id, { active: !isResourceActive(resource) }, token);

      if (!response.success) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-resources'] });
    },
  });

  const resources = resourcesQuery.data ?? [];

  return (
    <>
      <section className="workspace-header" aria-labelledby="resources-title">
        <div>
          <p className="eyebrow">Inventory</p>
          <h1 id="resources-title">Resources</h1>
          <p className="lede">Manage services, staff, rooms, tables, equipment, appointments, and events.</p>
        </div>
        <div className="header-actions" aria-label="Resource actions">
          <button className="icon-button" type="button" aria-label="Refresh resources" onClick={() => resourcesQuery.refetch()}>
            <RefreshCw size={18} aria-hidden="true" />
          </button>
        </div>
      </section>

      <section className="panel resource-controls" aria-label="Resource filters">
        <label className="form-field">
          Business
          <span className="input-with-icon">
            <Search size={17} aria-hidden="true" />
            <input value={businessId} onChange={(event) => setBusinessId(event.target.value)} placeholder="Business ID" />
          </span>
        </label>
        <label className="form-field">
          Type
          <select value={resourceType} onChange={(event) => setResourceType(event.target.value)}>
            <option value="">All types</option>
            {resourceTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label className="toggle-field">
          <input
            aria-describedby="show-inactive-help"
            checked={showInactive}
            type="checkbox"
            onChange={(event) => setShowInactive(event.target.checked)}
          />
          Show inactive
        </label>
        <span className="field-help" id="show-inactive-help">Includes inactive resources when enabled.</span>
      </section>

      <section className="content-grid management-grid">
        <form
          className="panel management-form"
          aria-label="Create resource form"
          onSubmit={(event) => {
            event.preventDefault();
            createMutation.mutate();
          }}
        >
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Create</p>
              <h2>New resource</h2>
            </div>
            <Plus size={20} aria-hidden="true" />
          </div>
          <label className="form-field">
            Business ID
            <input value={form.businessId} onChange={(event) => setForm({ ...form, businessId: event.target.value })} required />
          </label>
          <label className="form-field">
            Name
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          </label>
          <div className="form-grid">
            <label className="form-field">
              Type
              <select value={form.resourceType} onChange={(event) => setForm({ ...form, resourceType: event.target.value })}>
                {resourceTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              Capacity
              <input min="1" type="number" value={form.capacity} onChange={(event) => setForm({ ...form, capacity: event.target.value })} />
            </label>
            <label className="form-field">
              Duration
              <input min="5" type="number" value={form.durationMinutes} onChange={(event) => setForm({ ...form, durationMinutes: event.target.value })} />
            </label>
          </div>
          <label className="toggle-field">
            <input
              checked={form.requiresApproval}
              type="checkbox"
              onChange={(event) => setForm({ ...form, requiresApproval: event.target.checked })}
            />
            Requires approval
          </label>
          <label className="form-field">
            Description
            <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </label>
          {createMutation.isError ? (
            <InlineNotice tone="error" message={(createMutation.error as Error).message} icon={AlertTriangle} />
          ) : null}
          {createMutation.isSuccess ? (
            <InlineNotice tone="success" message="Resource created." icon={Plus} />
          ) : null}
          <button className="primary-button compact-button" type="submit" disabled={createMutation.isPending}>
            <Plus size={17} aria-hidden="true" />
            {createMutation.isPending ? 'Creating' : 'Create resource'}
          </button>
        </form>

        <div className="panel resource-list-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Management</p>
              <h2>Resource list</h2>
            </div>
            <Wrench size={20} aria-hidden="true" />
          </div>
          {resourcesQuery.isLoading ? (
            <LoadingState label="Loading resources" />
          ) : resourcesQuery.isError ? (
            <EmptyState
              icon={AlertTriangle}
              title="Resources could not load"
              description={(resourcesQuery.error as Error).message}
            />
          ) : resources.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No resources"
              description="Adjust filters or create a resource for the selected business."
            />
          ) : (
            <div className="resource-management-list">
              {resources.map((resource) => (
                <article className="resource-management-row" key={resource._id}>
                  <div>
                    <h3>{resource.name}</h3>
                    <p>
                      {getResourceType(resource)} · {resource.capacity ?? 1} capacity
                      {resource.durationMinutes ? ` · ${resource.durationMinutes} min` : ''}
                    </p>
                  </div>
                  <div className="resource-row-actions">
                    <span className={isResourceActive(resource) ? 'status-chip status-approved' : 'status-chip status-cancelled'}>
                      {isResourceActive(resource) ? 'active' : 'inactive'}
                    </span>
                    <button
                      className="secondary-button compact-button"
                      type="button"
                      disabled={toggleMutation.isPending}
                      aria-pressed={!isResourceActive(resource)}
                      onClick={() => toggleMutation.mutate(resource)}
                    >
                      {isResourceActive(resource) ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
          {toggleMutation.isError ? (
            <InlineNotice tone="error" message={(toggleMutation.error as Error).message} icon={AlertTriangle} />
          ) : null}
        </div>
      </section>
    </>
  );
}
