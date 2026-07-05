import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CalendarRange,
  CheckCircle2,
  Clock3,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Wrench,
  X,
} from 'lucide-react';
import { listBusinesses } from '@/api/businesses';
import { createServiceResource, getServiceResource, listServiceResources, updateServiceResource } from '@/api/resources';
import type { BusinessProfileDto, Role, ServiceResourceDto } from '@/api/types';
import { useSessionStore } from '@/auth/sessionStore';
import { InlineNotice, LoadingState } from '@/components/AdminState';
import { EmptyState } from '@/components/EmptyState';
import {
  createBlackoutDateDrafts,
  createEmptyBlackoutDateDraft,
  createEmptyWorkingHourDraft,
  createResourceWorkingHourDrafts,
  getWeekdayLabel,
  serializeBlackoutDates,
  serializeWorkingHours,
  validateBlackoutDates,
  validateWorkingHours,
  type BlackoutDateDraft,
  type WorkingHourDraft,
} from '@/features/admin/scheduleEditors';

const resourceTypes = ['service', 'staff', 'room', 'table', 'equipment', 'appointment', 'event'];
const supportedRoleOptions: Role[] = ['owner', 'admin', 'staff'];
const overrideRuleFields = [
  { key: 'slotIntervalMinutes', label: 'Slot interval (minutes)' },
  { key: 'minAdvanceMinutes', label: 'Minimum advance (minutes)' },
  { key: 'maxAdvanceDays', label: 'Maximum advance (days)' },
  { key: 'bufferBeforeMinutes', label: 'Buffer before (minutes)' },
  { key: 'bufferAfterMinutes', label: 'Buffer after (minutes)' },
] as const;

type ResourceCreateFormState = {
  businessId: string;
  capacity: string;
  description: string;
  durationMinutes: string;
  name: string;
  requiresApproval: boolean;
  resourceType: string;
};

type ResourceEditFormState = {
  active: boolean;
  allowOverbookingOverride: '' | 'false' | 'true';
  blackoutDates: BlackoutDateDraft[];
  capacity: string;
  description: string;
  durationMinutes: string;
  name: string;
  overrideRules: Record<(typeof overrideRuleFields)[number]['key'], string>;
  requiresApproval: boolean;
  resourceType: string;
  supportedRoles: Role[];
  workingHours: WorkingHourDraft[];
};

const defaultCreateFormState: ResourceCreateFormState = {
  businessId: '',
  capacity: '1',
  description: '',
  durationMinutes: '60',
  name: '',
  requiresApproval: false,
  resourceType: 'service',
};

const defaultEditFormState: ResourceEditFormState = {
  active: true,
  allowOverbookingOverride: '',
  blackoutDates: [],
  capacity: '1',
  description: '',
  durationMinutes: '60',
  name: '',
  overrideRules: {
    bufferAfterMinutes: '',
    bufferBeforeMinutes: '',
    maxAdvanceDays: '',
    minAdvanceMinutes: '',
    slotIntervalMinutes: '',
  },
  requiresApproval: false,
  resourceType: 'service',
  supportedRoles: ['staff'],
  workingHours: [],
};

function getResourceType(resource: ServiceResourceDto): string {
  return resource.resourceType ?? resource.type ?? 'service';
}

function isResourceActive(resource: ServiceResourceDto): boolean {
  return resource.active ?? resource.isActive ?? true;
}

function getBusinessName(businesses: BusinessProfileDto[], businessId: string): string {
  return businesses.find((business) => business._id === businessId)?.name ?? businessId;
}

function createEditFormState(resource?: ServiceResourceDto): ResourceEditFormState {
  const availabilityOverrides = resource?.availabilityOverrides;

  return {
    active: isResourceActive(resource ?? ({ active: true } as ServiceResourceDto)),
    allowOverbookingOverride:
      availabilityOverrides?.allowOverbooking === undefined ? '' : availabilityOverrides.allowOverbooking ? 'true' : 'false',
    blackoutDates: createBlackoutDateDrafts(availabilityOverrides?.blackoutDates),
    capacity: String(resource?.capacity ?? 1),
    description: resource?.description ?? '',
    durationMinutes: resource?.durationMinutes ? String(resource.durationMinutes) : '',
    name: resource?.name ?? '',
    overrideRules: {
      bufferAfterMinutes:
        availabilityOverrides?.bufferAfterMinutes === undefined ? '' : String(availabilityOverrides.bufferAfterMinutes),
      bufferBeforeMinutes:
        availabilityOverrides?.bufferBeforeMinutes === undefined ? '' : String(availabilityOverrides.bufferBeforeMinutes),
      maxAdvanceDays: availabilityOverrides?.maxAdvanceDays === undefined ? '' : String(availabilityOverrides.maxAdvanceDays),
      minAdvanceMinutes:
        availabilityOverrides?.minAdvanceMinutes === undefined ? '' : String(availabilityOverrides.minAdvanceMinutes),
      slotIntervalMinutes:
        availabilityOverrides?.slotIntervalMinutes === undefined ? '' : String(availabilityOverrides.slotIntervalMinutes),
    },
    requiresApproval: resource?.requiresApproval ?? false,
    resourceType: getResourceType(resource ?? ({ type: 'service' } as ServiceResourceDto)),
    supportedRoles: resource?.supportedRoles?.length ? resource.supportedRoles : ['staff'],
    workingHours: createResourceWorkingHourDrafts(availabilityOverrides?.workingHours),
  };
}

export function ResourcesPage() {
  const { session, token } = useSessionStore();
  const queryClient = useQueryClient();
  const [businessId, setBusinessId] = useState(session?.role !== 'owner' && session?.businessId ? session.businessId : '');
  const [resourceType, setResourceType] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<ResourceCreateFormState>(defaultCreateFormState);
  const [editForm, setEditForm] = useState<ResourceEditFormState>(defaultEditFormState);

  const businessesQuery = useQuery({
    enabled: Boolean(token),
    queryFn: async () => {
      const response = await listBusinesses(
        token ?? '',
        session?.role !== 'owner' && session?.businessId ? { businessId: session.businessId } : undefined,
      );

      if (!response.success) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    queryKey: ['businesses', session?.businessId, session?.role, token],
  });

  const businesses = businessesQuery.data ?? [];

  useEffect(() => {
    if (session?.role !== 'owner' && session?.businessId && businessId !== session.businessId) {
      setBusinessId(session.businessId);
    }
  }, [businessId, session?.businessId, session?.role]);

  useEffect(() => {
    if (!createForm.businessId && businessId) {
      setCreateForm((currentForm) => ({ ...currentForm, businessId }));
    }
  }, [businessId, createForm.businessId]);

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

  const selectedResourceQuery = useQuery({
    enabled: Boolean(selectedResourceId && token),
    queryFn: async () => {
      if (!selectedResourceId || !token) {
        throw new Error('Select a resource before editing.');
      }

      const response = await getServiceResource(selectedResourceId, token);

      if (!response.success) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    queryKey: ['service-resource-detail', selectedResourceId, token],
  });

  useEffect(() => {
    if (!selectedResourceQuery.data) {
      return;
    }

    setEditForm(createEditFormState(selectedResourceQuery.data));
  }, [selectedResourceQuery.data]);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!token) {
        throw new Error('Sign in before creating resources.');
      }

      const response = await createServiceResource(
        {
          active: true,
          businessId: createForm.businessId.trim(),
          capacity: Number(createForm.capacity),
          ...(createForm.description.trim() ? { description: createForm.description.trim() } : {}),
          ...(createForm.durationMinutes ? { durationMinutes: Number(createForm.durationMinutes) } : {}),
          name: createForm.name.trim(),
          requiresApproval: createForm.requiresApproval,
          resourceType: createForm.resourceType,
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
      setCreateForm({
        ...defaultCreateFormState,
        businessId,
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
      if (selectedResourceId) {
        queryClient.invalidateQueries({ queryKey: ['service-resource-detail', selectedResourceId, token] });
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedResourceId || !token) {
        throw new Error('Select a resource before saving.');
      }

      const workingHoursError = validateWorkingHours(editForm.workingHours);
      if (workingHoursError) {
        throw new Error(workingHoursError);
      }

      const blackoutDatesError = validateBlackoutDates(editForm.blackoutDates);
      if (blackoutDatesError) {
        throw new Error(blackoutDatesError);
      }

      const availabilityOverrides = {
        ...(editForm.allowOverbookingOverride ? { allowOverbooking: editForm.allowOverbookingOverride === 'true' } : {}),
        ...(editForm.blackoutDates.length ? { blackoutDates: serializeBlackoutDates(editForm.blackoutDates) } : {}),
        ...(editForm.workingHours.length ? { workingHours: serializeWorkingHours(editForm.workingHours) } : {}),
        ...Object.fromEntries(
          Object.entries(editForm.overrideRules)
            .filter(([, value]) => value !== '')
            .map(([key, value]) => [key, Number(value)]),
        ),
      };

      const response = await updateServiceResource(
        selectedResourceId,
        {
          active: editForm.active,
          capacity: Number(editForm.capacity),
          ...(editForm.description.trim() ? { description: editForm.description.trim() } : { description: '' }),
          ...(editForm.durationMinutes ? { durationMinutes: Number(editForm.durationMinutes) } : { durationMinutes: undefined }),
          name: editForm.name.trim(),
          requiresApproval: editForm.requiresApproval,
          resourceType: editForm.resourceType,
          supportedRoles: editForm.supportedRoles,
          ...(Object.keys(availabilityOverrides).length ? { availabilityOverrides } : {}),
        },
        token,
      );

      if (!response.success) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    onSuccess: (resource) => {
      queryClient.invalidateQueries({ queryKey: ['service-resources'] });
      queryClient.setQueryData(['service-resource-detail', resource._id, token], resource);
    },
  });

  const resources = resourcesQuery.data ?? [];

  return (
    <>
      <section className="workspace-header" aria-labelledby="resources-title">
        <div>
          <p className="eyebrow">Inventory</p>
          <h1 id="resources-title">Resources</h1>
          <p className="lede">Manage services, staff, rooms, tables, equipment, appointments, and override availability rules.</p>
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
          <select value={businessId} onChange={(event) => setBusinessId(event.target.value)}>
            <option value="">All businesses</option>
            {businesses.map((business) => (
              <option key={business._id} value={business._id}>
                {business.name}
              </option>
            ))}
          </select>
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
            Business
            <select
              value={createForm.businessId}
              onChange={(event) => setCreateForm({ ...createForm, businessId: event.target.value })}
              required
            >
              <option value="">Select a business</option>
              {businesses.map((business) => (
                <option key={business._id} value={business._id}>
                  {business.name}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            Name
            <input value={createForm.name} onChange={(event) => setCreateForm({ ...createForm, name: event.target.value })} required />
          </label>
          <div className="form-grid">
            <label className="form-field">
              Type
              <select
                value={createForm.resourceType}
                onChange={(event) => setCreateForm({ ...createForm, resourceType: event.target.value })}
              >
                {resourceTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              Capacity
              <input
                min="1"
                type="number"
                value={createForm.capacity}
                onChange={(event) => setCreateForm({ ...createForm, capacity: event.target.value })}
              />
            </label>
            <label className="form-field">
              Duration
              <input
                min="5"
                type="number"
                value={createForm.durationMinutes}
                onChange={(event) => setCreateForm({ ...createForm, durationMinutes: event.target.value })}
              />
            </label>
          </div>
          <label className="toggle-field">
            <input
              checked={createForm.requiresApproval}
              type="checkbox"
              onChange={(event) => setCreateForm({ ...createForm, requiresApproval: event.target.checked })}
            />
            Requires approval
          </label>
          <label className="form-field">
            Description
            <textarea value={createForm.description} onChange={(event) => setCreateForm({ ...createForm, description: event.target.value })} />
          </label>
          {createMutation.isError ? (
            <InlineNotice tone="error" message={(createMutation.error as Error).message} icon={AlertTriangle} />
          ) : null}
          {createMutation.isSuccess ? (
            <InlineNotice tone="success" message="Resource created." icon={CheckCircle2} />
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
                    <p>{getBusinessName(businesses, resource.businessId)}</p>
                  </div>
                  <div className="resource-row-actions">
                    <span className={isResourceActive(resource) ? 'status-chip status-approved' : 'status-chip status-cancelled'}>
                      {isResourceActive(resource) ? 'active' : 'inactive'}
                    </span>
                    <button
                      className="secondary-button compact-button"
                      type="button"
                      onClick={() => setSelectedResourceId(resource._id)}
                    >
                      <Pencil size={16} aria-hidden="true" />
                      Edit
                    </button>
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

      {selectedResourceId ? (
        <aside className="detail-drawer" aria-labelledby="resource-detail-title" aria-modal="true" role="dialog">
          <div className="detail-drawer-header">
            <div>
              <p className="eyebrow">Resource detail</p>
              <h2 id="resource-detail-title">
                {selectedResourceQuery.data?.name ?? 'Loading resource'}
              </h2>
            </div>
            <button className="icon-button" type="button" aria-label="Close resource detail" onClick={() => setSelectedResourceId(null)}>
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          {selectedResourceQuery.isLoading ? (
            <LoadingState label="Loading resource detail" />
          ) : selectedResourceQuery.isError ? (
            <EmptyState
              icon={AlertTriangle}
              title="Resource detail could not load"
              description={(selectedResourceQuery.error as Error).message}
            />
          ) : selectedResourceQuery.data ? (
            <div className="detail-content">
              <div className="detail-summary">
                <span className={editForm.active ? 'status-chip status-approved' : 'status-chip status-cancelled'}>
                  {editForm.active ? 'active' : 'inactive'}
                </span>
                <span className="risk-chip risk-low">{getBusinessName(businesses, selectedResourceQuery.data.businessId)}</span>
              </div>

              <section className="detail-section" aria-label="Resource basics">
                <h3>Basics</h3>
                <div className="detail-grid">
                  <div className="detail-field">
                    <span>Business</span>
                    <strong>{getBusinessName(businesses, selectedResourceQuery.data.businessId)}</strong>
                  </div>
                  <div className="detail-field">
                    <span>Resource ID</span>
                    <strong>{selectedResourceQuery.data._id}</strong>
                  </div>
                </div>
                <div className="form-grid">
                  <label className="form-field">
                    Name
                    <input value={editForm.name} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} />
                  </label>
                  <label className="form-field">
                    Type
                    <select value={editForm.resourceType} onChange={(event) => setEditForm({ ...editForm, resourceType: event.target.value })}>
                      {resourceTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="form-field">
                    Capacity
                    <input
                      min="1"
                      type="number"
                      value={editForm.capacity}
                      onChange={(event) => setEditForm({ ...editForm, capacity: event.target.value })}
                    />
                  </label>
                  <label className="form-field">
                    Duration
                    <input
                      min="5"
                      type="number"
                      value={editForm.durationMinutes}
                      onChange={(event) => setEditForm({ ...editForm, durationMinutes: event.target.value })}
                    />
                  </label>
                </div>
                <label className="form-field">
                  Description
                  <textarea value={editForm.description} onChange={(event) => setEditForm({ ...editForm, description: event.target.value })} />
                </label>
                <div className="form-grid">
                  <label className="toggle-field">
                    <input
                      checked={editForm.active}
                      type="checkbox"
                      onChange={(event) => setEditForm({ ...editForm, active: event.target.checked })}
                    />
                    Active
                  </label>
                  <label className="toggle-field">
                    <input
                      checked={editForm.requiresApproval}
                      type="checkbox"
                      onChange={(event) => setEditForm({ ...editForm, requiresApproval: event.target.checked })}
                    />
                    Requires approval
                  </label>
                </div>
                <fieldset className="form-field">
                  <legend>Supported roles</legend>
                  <div className="checkbox-grid" role="group" aria-label="Supported operator roles">
                    {supportedRoleOptions.map((role) => {
                      const selected = editForm.supportedRoles.includes(role);

                      return (
                        <label className="toggle-field" key={role}>
                          <input
                            checked={selected}
                            type="checkbox"
                            onChange={(event) => {
                              const nextRoles = event.target.checked
                                ? [...editForm.supportedRoles, role]
                                : editForm.supportedRoles.filter((entry) => entry !== role);

                              setEditForm({
                                ...editForm,
                                supportedRoles: nextRoles.length ? nextRoles : ['staff'],
                              });
                            }}
                          />
                          {role}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              </section>

              <section className="detail-section" aria-labelledby="resource-availability-title">
                <div className="panel-heading inline-heading">
                  <div>
                    <p className="eyebrow">Overrides</p>
                    <h3 id="resource-availability-title">Availability overrides</h3>
                  </div>
                  <Clock3 size={18} aria-hidden="true" />
                </div>
                <p className="body-copy">Leave a field empty to keep the business default for that rule.</p>
                <div className="form-grid">
                  {overrideRuleFields.map((field) => (
                    <label className="form-field" key={field.key}>
                      {field.label}
                      <input
                        min="0"
                        type="number"
                        value={editForm.overrideRules[field.key]}
                        onChange={(event) =>
                          setEditForm({
                            ...editForm,
                            overrideRules: {
                              ...editForm.overrideRules,
                              [field.key]: event.target.value,
                            },
                          })
                        }
                      />
                    </label>
                  ))}
                  <label className="form-field">
                    Overbooking
                    <select
                      value={editForm.allowOverbookingOverride}
                      onChange={(event) =>
                        setEditForm({
                          ...editForm,
                          allowOverbookingOverride: event.target.value as '' | 'false' | 'true',
                        })
                      }
                    >
                      <option value="">Use business default</option>
                      <option value="true">Allow overbooking</option>
                      <option value="false">Disallow overbooking</option>
                    </select>
                  </label>
                </div>

                <section className="detail-section" aria-label="Resource working-hours override">
                  <div className="panel-heading inline-heading">
                    <div>
                      <p className="eyebrow">Custom schedule</p>
                      <h3>Working-hours override</h3>
                    </div>
                  </div>
                  {editForm.workingHours.length ? (
                    <div className="schedule-editor-list">
                      {editForm.workingHours.map((hour, index) => (
                        <div className="schedule-row" key={`${hour.dayOfWeek}-${index}`}>
                          <div className="schedule-row-heading">
                            <strong>{getWeekdayLabel(hour.dayOfWeek)}</strong>
                            <button
                              className="text-button"
                              type="button"
                              onClick={() =>
                                setEditForm({
                                  ...editForm,
                                  workingHours: editForm.workingHours.filter((_, entryIndex) => entryIndex !== index),
                                })
                              }
                            >
                              Remove
                            </button>
                          </div>
                          <div className="schedule-row-fields schedule-row-fields-wide">
                            <label className="form-field">
                              Day
                              <select
                                value={hour.dayOfWeek}
                                onChange={(event) => {
                                  const nextHours = [...editForm.workingHours];
                                  nextHours[index] = {
                                    ...nextHours[index],
                                    dayOfWeek: Number(event.target.value),
                                  };
                                  setEditForm({ ...editForm, workingHours: nextHours });
                                }}
                              >
                                {Array.from({ length: 7 }, (_, dayOfWeek) => (
                                  <option key={dayOfWeek} value={dayOfWeek}>
                                    {getWeekdayLabel(dayOfWeek)}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="toggle-field">
                              <input
                                checked={hour.closed}
                                type="checkbox"
                                onChange={(event) => {
                                  const nextHours = [...editForm.workingHours];
                                  nextHours[index] = {
                                    ...nextHours[index],
                                    closed: event.target.checked,
                                  };
                                  setEditForm({ ...editForm, workingHours: nextHours });
                                }}
                              />
                              Closed
                            </label>
                            <label className="form-field">
                              Start
                              <input
                                disabled={hour.closed}
                                type="time"
                                value={hour.startTime}
                                onChange={(event) => {
                                  const nextHours = [...editForm.workingHours];
                                  nextHours[index] = {
                                    ...nextHours[index],
                                    startTime: event.target.value,
                                  };
                                  setEditForm({ ...editForm, workingHours: nextHours });
                                }}
                              />
                            </label>
                            <label className="form-field">
                              End
                              <input
                                disabled={hour.closed}
                                type="time"
                                value={hour.endTime}
                                onChange={(event) => {
                                  const nextHours = [...editForm.workingHours];
                                  nextHours[index] = {
                                    ...nextHours[index],
                                    endTime: event.target.value,
                                  };
                                  setEditForm({ ...editForm, workingHours: nextHours });
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="body-copy">No custom working-hours override is stored for this resource yet.</p>
                  )}
                  <button
                    className="secondary-button compact-button"
                    type="button"
                    onClick={() =>
                      setEditForm({
                        ...editForm,
                        workingHours: [...editForm.workingHours, createEmptyWorkingHourDraft()],
                      })
                    }
                  >
                    <Plus size={17} aria-hidden="true" />
                    Add working-hours override
                  </button>
                </section>

                <section className="detail-section" aria-label="Resource blackout override">
                  <div className="panel-heading inline-heading">
                    <div>
                      <p className="eyebrow">Blocked dates</p>
                      <h3>Blackout-date override</h3>
                    </div>
                    <CalendarRange size={18} aria-hidden="true" />
                  </div>
                  {editForm.blackoutDates.length ? (
                    <div className="schedule-editor-list">
                      {editForm.blackoutDates.map((range) => (
                        <div className="schedule-row" key={range.id}>
                          <div className="schedule-row-heading">
                            <strong>Blocked range</strong>
                            <button
                              className="text-button"
                              type="button"
                              onClick={() =>
                                setEditForm({
                                  ...editForm,
                                  blackoutDates: editForm.blackoutDates.filter((entry) => entry.id !== range.id),
                                })
                              }
                            >
                              Remove
                            </button>
                          </div>
                          <div className="schedule-row-fields">
                            <label className="form-field">
                              Start date
                              <input
                                type="date"
                                value={range.startDate}
                                onChange={(event) =>
                                  setEditForm({
                                    ...editForm,
                                    blackoutDates: editForm.blackoutDates.map((entry) =>
                                      entry.id === range.id ? { ...entry, startDate: event.target.value } : entry,
                                    ),
                                  })
                                }
                              />
                            </label>
                            <label className="form-field">
                              End date
                              <input
                                type="date"
                                value={range.endDate}
                                onChange={(event) =>
                                  setEditForm({
                                    ...editForm,
                                    blackoutDates: editForm.blackoutDates.map((entry) =>
                                      entry.id === range.id ? { ...entry, endDate: event.target.value } : entry,
                                    ),
                                  })
                                }
                              />
                            </label>
                          </div>
                          <label className="form-field">
                            Reason
                            <input
                              value={range.reason}
                              onChange={(event) =>
                                setEditForm({
                                  ...editForm,
                                  blackoutDates: editForm.blackoutDates.map((entry) =>
                                    entry.id === range.id ? { ...entry, reason: event.target.value } : entry,
                                  ),
                                })
                              }
                              placeholder="Maintenance, private hire, holiday"
                            />
                          </label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="body-copy">No custom blackout-date override is stored for this resource yet.</p>
                  )}
                  <button
                    className="secondary-button compact-button"
                    type="button"
                    onClick={() =>
                      setEditForm({
                        ...editForm,
                        blackoutDates: [...editForm.blackoutDates, createEmptyBlackoutDateDraft()],
                      })
                    }
                  >
                    <Plus size={17} aria-hidden="true" />
                    Add blackout override
                  </button>
                </section>
              </section>

              {updateMutation.isError ? (
                <InlineNotice tone="error" message={(updateMutation.error as Error).message} icon={AlertTriangle} />
              ) : null}
              {updateMutation.isSuccess ? (
                <InlineNotice tone="success" message="Resource changes saved." icon={CheckCircle2} />
              ) : null}

              <div className="reschedule-actions">
                <button
                  className="secondary-button compact-button"
                  type="button"
                  onClick={() => setEditForm(createEditFormState(selectedResourceQuery.data))}
                >
                  <Trash2 size={16} aria-hidden="true" />
                  Reset draft
                </button>
                <button className="primary-button compact-button" type="button" disabled={updateMutation.isPending} onClick={() => updateMutation.mutate()}>
                  <Pencil size={16} aria-hidden="true" />
                  {updateMutation.isPending ? 'Saving' : 'Save resource'}
                </button>
              </div>
            </div>
          ) : null}
        </aside>
      ) : null}
    </>
  );
}
