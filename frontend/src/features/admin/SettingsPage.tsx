import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Building2,
  CalendarRange,
  CheckCircle2,
  Clock3,
  Eye,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings as SettingsIcon,
  Sparkles,
} from 'lucide-react';
import { createBusiness, getBusinessTemplate, listBusinesses, listBusinessTemplates, updateBusiness } from '@/api/businesses';
import type { BusinessProfileDto, BusinessTemplateDto } from '@/api/types';
import { useSessionStore } from '@/auth/sessionStore';
import { InlineNotice, LoadingState } from '@/components/AdminState';
import { EmptyState } from '@/components/EmptyState';
import {
  createBlackoutDateDrafts,
  createBusinessWorkingHourDrafts,
  createEmptyBlackoutDateDraft,
  getWeekdayLabel,
  serializeBlackoutDates,
  serializeWorkingHours,
  validateBlackoutDates,
  validateWorkingHours,
  type BlackoutDateDraft,
  type WorkingHourDraft,
} from '@/features/admin/scheduleEditors';

const businessTypes = ['restaurant', 'clinic', 'salon', 'consulting', 'venue', 'rental', 'fitness', 'other'];

type BusinessSettingsFormState = {
  businessType: string;
  contactEmail: string;
  contactPhone: string;
  description: string;
  name: string;
  slug: string;
  status: 'active' | 'inactive';
  timezone: string;
};

type BusinessCreateFormState = BusinessSettingsFormState & {
  templateKey: string;
};

const defaultFormState: BusinessSettingsFormState = {
  businessType: 'other',
  contactEmail: '',
  contactPhone: '',
  description: '',
  name: '',
  slug: '',
  status: 'active',
  timezone: 'UTC',
};

const defaultCreateFormState: BusinessCreateFormState = {
  ...defaultFormState,
  templateKey: 'restaurant',
};

function getBooleanLabel(value?: unknown): string {
  return value === false ? 'Off' : 'On';
}

function getFirstBusiness(businesses: BusinessProfileDto[]): BusinessProfileDto | undefined {
  return businesses[0];
}

function getTemplateRules(template?: BusinessTemplateDto): Record<string, unknown> | undefined {
  return template?.availabilityRules as Record<string, unknown> | undefined;
}

function getTemplateResources(template?: BusinessTemplateDto): Array<Record<string, unknown>> {
  return (template?.suggestedResources as Array<Record<string, unknown>> | undefined) ?? [];
}

function formatTemplateValue(value: unknown): string {
  if (value === undefined || value === null || value === '') {
    return 'Not set';
  }

  if (typeof value === 'boolean') {
    return value ? 'On' : 'Off';
  }

  if (Array.isArray(value)) {
    return value.join(', ');
  }

  return String(value);
}

function formatJson(value: unknown): string {
  return value === undefined || value === null ? '' : JSON.stringify(value, null, 2);
}

function parseJsonField(value: string, fieldName: string): unknown | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    throw new Error(`${fieldName} must be valid JSON.`);
  }
}

export function SettingsPage() {
  const { session, token } = useSessionStore();
  const queryClient = useQueryClient();
  const [selectedBusinessId, setSelectedBusinessId] = useState('');
  const [createForm, setCreateForm] = useState<BusinessCreateFormState>(defaultCreateFormState);
  const [form, setForm] = useState<BusinessSettingsFormState>(defaultFormState);
  const [availabilityRulesJson, setAvailabilityRulesJson] = useState('');
  const [notificationSettingsJson, setNotificationSettingsJson] = useState('');
  const [widgetSettingsJson, setWidgetSettingsJson] = useState('');
  const [publicPageSettingsJson, setPublicPageSettingsJson] = useState('');
  const [workingHours, setWorkingHours] = useState<WorkingHourDraft[]>(createBusinessWorkingHourDrafts());
  const [blackoutDates, setBlackoutDates] = useState<BlackoutDateDraft[]>([]);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState('');

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

  const templatesQuery = useQuery({
    enabled: Boolean(token),
    queryFn: async () => {
      const response = await listBusinessTemplates(token ?? '');

      if (!response.success) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    queryKey: ['business-templates', token],
  });

  const businesses = businessesQuery.data ?? [];
  const templates = templatesQuery.data ?? [];
  const canCreateBusinesses = session?.role === 'owner';
  const selectedBusiness = useMemo(
    () => businesses.find((business) => business._id === selectedBusinessId) ?? getFirstBusiness(businesses),
    [businesses, selectedBusinessId],
  );

  const selectedTemplatePreview = useQuery({
    enabled: Boolean(token && selectedTemplateKey),
    queryFn: async () => {
      const response = await getBusinessTemplate(selectedTemplateKey, token ?? '');

      if (!response.success) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    queryKey: ['business-template-preview', selectedTemplateKey, token],
  });

  useEffect(() => {
    if (!selectedBusiness) {
      return;
    }

    setSelectedBusinessId(selectedBusiness._id);
    setForm({
      businessType: selectedBusiness.businessType ?? 'other',
      contactEmail: selectedBusiness.contactEmail ?? '',
      contactPhone: selectedBusiness.contactPhone ?? '',
      description: selectedBusiness.description ?? '',
      name: selectedBusiness.name ?? '',
      slug: selectedBusiness.slug ?? '',
      status: selectedBusiness.status ?? 'active',
      timezone: selectedBusiness.timezone ?? 'UTC',
    });
    setWorkingHours(createBusinessWorkingHourDrafts(selectedBusiness.workingHours));
    setBlackoutDates(createBlackoutDateDrafts(selectedBusiness.blackoutDates));
    setAvailabilityRulesJson(formatJson(selectedBusiness.availabilityRules));
    setNotificationSettingsJson(formatJson(selectedBusiness.notificationSettings));
    setWidgetSettingsJson(formatJson(selectedBusiness.widgetSettings));
    setPublicPageSettingsJson(formatJson(selectedBusiness.publicPageSettings));
    setSelectedTemplateKey(selectedBusiness.templateKey ?? '');
  }, [selectedBusiness]);

  useEffect(() => {
    if (!selectedTemplateKey && templates.length) {
      setSelectedTemplateKey(selectedBusiness?.templateKey ?? templates[0].key);
    }
  }, [selectedBusiness?.templateKey, selectedTemplateKey, templates]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedBusiness || !token) {
        throw new Error('Select a business before saving settings.');
      }

      const workingHoursError = validateWorkingHours(workingHours);
      if (workingHoursError) {
        throw new Error(workingHoursError);
      }

      const blackoutDatesError = validateBlackoutDates(blackoutDates);
      if (blackoutDatesError) {
        throw new Error(blackoutDatesError);
      }

      const availabilityRules = parseJsonField(availabilityRulesJson, 'Availability rules');
      const notificationSettings = parseJsonField(notificationSettingsJson, 'Notification settings');
      const widgetSettings = parseJsonField(widgetSettingsJson, 'Widget settings');
      const publicPageSettings = parseJsonField(publicPageSettingsJson, 'Public page settings');

      const response = await updateBusiness(
        selectedBusiness._id,
        {
          ...form,
          ...(availabilityRules ? { availabilityRules } : {}),
          blackoutDates: serializeBlackoutDates(blackoutDates),
          ...(notificationSettings ? { notificationSettings } : {}),
          ...(publicPageSettings ? { publicPageSettings } : {}),
          ...(widgetSettings ? { widgetSettings } : {}),
          workingHours: serializeWorkingHours(workingHours),
        },
        token,
      );

      if (!response.success) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!token) {
        throw new Error('An active operator session is required.');
      }

      const response = await createBusiness(
        {
          businessType: createForm.businessType,
          contactEmail: createForm.contactEmail.trim(),
          contactPhone: createForm.contactPhone.trim(),
          description: createForm.description.trim() || undefined,
          name: createForm.name.trim(),
          slug: createForm.slug.trim(),
          status: createForm.status,
          templateKey: createForm.templateKey,
          timezone: createForm.timezone.trim(),
        },
        token,
      );

      if (!response.success) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    onSuccess: (createdBusiness) => {
      setCreateForm(defaultCreateFormState);
      setSelectedBusinessId(createdBusiness._id);
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
    },
  });

  return (
    <>
      <section className="workspace-header" aria-labelledby="settings-title">
        <div>
          <p className="eyebrow">Business setup</p>
          <h1 id="settings-title">Settings</h1>
          <p className="lede">Manage profile basics, weekly availability, blackout dates, and public-surface readiness.</p>
        </div>
        <div className="header-actions" aria-label="Settings actions">
          <button className="icon-button" type="button" aria-label="Refresh settings" onClick={() => businessesQuery.refetch()}>
            <RefreshCw size={18} aria-hidden="true" />
          </button>
        </div>
      </section>

      {canCreateBusinesses ? (
        <section className="panel management-form" aria-label="Create business profile">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">New profile</p>
              <h2>Create business</h2>
            </div>
            <Plus size={20} aria-hidden="true" />
          </div>
          <div className="form-grid">
            <label className="form-field">
              Name
              <input value={createForm.name} onChange={(event) => setCreateForm({ ...createForm, name: event.target.value })} />
            </label>
            <label className="form-field">
              Slug
              <input value={createForm.slug} onChange={(event) => setCreateForm({ ...createForm, slug: event.target.value })} />
            </label>
            <label className="form-field">
              Template
              <select value={createForm.templateKey} onChange={(event) => setCreateForm({ ...createForm, templateKey: event.target.value })}>
                {(templates.length ? templates : [{ key: 'restaurant', label: 'Restaurant' } as BusinessTemplateDto]).map((template) => (
                  <option key={template.key} value={template.key}>
                    {template.label ?? template.key}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              Type
              <select value={createForm.businessType} onChange={(event) => setCreateForm({ ...createForm, businessType: event.target.value })}>
                {businessTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              Create email
              <input type="email" value={createForm.contactEmail} onChange={(event) => setCreateForm({ ...createForm, contactEmail: event.target.value })} />
            </label>
            <label className="form-field">
              Create phone
              <input value={createForm.contactPhone} onChange={(event) => setCreateForm({ ...createForm, contactPhone: event.target.value })} />
            </label>
            <label className="form-field">
              Timezone
              <input value={createForm.timezone} onChange={(event) => setCreateForm({ ...createForm, timezone: event.target.value })} />
            </label>
          </div>
          <label className="form-field">
            Description
            <textarea value={createForm.description} onChange={(event) => setCreateForm({ ...createForm, description: event.target.value })} />
          </label>
          {createMutation.isError ? (
            <InlineNotice tone="error" message={(createMutation.error as Error).message} icon={AlertTriangle} />
          ) : null}
          {createMutation.isSuccess ? (
            <InlineNotice tone="success" message="Business profile created." icon={CheckCircle2} />
          ) : null}
          <button className="primary-button compact-button" type="button" disabled={createMutation.isPending} onClick={() => createMutation.mutate()}>
            <Plus size={17} aria-hidden="true" />
            {createMutation.isPending ? 'Creating' : 'Create business'}
          </button>
        </section>
      ) : null}

      {businessesQuery.isLoading ? (
        <LoadingState label="Loading business settings" />
      ) : businessesQuery.isError ? (
        <EmptyState
          icon={AlertTriangle}
          title="Business settings could not load"
          description={(businessesQuery.error as Error).message}
        />
      ) : !selectedBusiness ? (
        <EmptyState
          icon={Search}
          title="No business profiles"
          description="Create a business profile through the existing backend API before editing settings here."
        />
      ) : (
        <section className="content-grid settings-grid">
          <form
            className="panel management-form"
            aria-label="Business profile form"
            onSubmit={(event) => {
              event.preventDefault();
              updateMutation.mutate();
            }}
          >
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Profile</p>
                <h2>Business profile</h2>
              </div>
              <Building2 size={20} aria-hidden="true" />
            </div>

            <label className="form-field">
              Business
              <select value={selectedBusinessId} onChange={(event) => setSelectedBusinessId(event.target.value)}>
                {businesses.map((business) => (
                  <option key={business._id} value={business._id}>
                    {business.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="form-grid">
              <label className="form-field">
                Name
                <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              </label>
              <label className="form-field">
                Slug
                <input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} />
              </label>
              <label className="form-field">
                Type
                <select value={form.businessType} onChange={(event) => setForm({ ...form, businessType: event.target.value })}>
                  {businessTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                Status
                <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as 'active' | 'inactive' })}>
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                </select>
              </label>
              <label className="form-field">
                Email
                <input type="email" value={form.contactEmail} onChange={(event) => setForm({ ...form, contactEmail: event.target.value })} />
              </label>
              <label className="form-field">
                Phone
                <input value={form.contactPhone} onChange={(event) => setForm({ ...form, contactPhone: event.target.value })} />
              </label>
              <label className="form-field">
                Timezone
                <input value={form.timezone} onChange={(event) => setForm({ ...form, timezone: event.target.value })} />
              </label>
            </div>

            <label className="form-field">
              Description
              <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </label>

            <section className="detail-section" aria-labelledby="working-hours-title">
              <div className="panel-heading inline-heading">
                <div>
                  <p className="eyebrow">Availability</p>
                  <h3 id="working-hours-title">Working hours</h3>
                </div>
                <Clock3 size={18} aria-hidden="true" />
              </div>
              <div className="schedule-editor-list">
                {workingHours.map((hour, index) => (
                  <div className="schedule-row" key={hour.dayOfWeek}>
                    <div className="schedule-row-heading">
                      <strong>{getWeekdayLabel(hour.dayOfWeek)}</strong>
                      <label className="toggle-field">
                        <input
                          checked={hour.closed}
                          type="checkbox"
                          onChange={(event) => {
                            const nextHours = [...workingHours];
                            nextHours[index] = {
                              ...nextHours[index],
                              closed: event.target.checked,
                            };
                            setWorkingHours(nextHours);
                          }}
                        />
                        Closed
                      </label>
                    </div>
                    <div className="schedule-row-fields">
                      <label className="form-field">
                        Start
                        <input
                          disabled={hour.closed}
                          type="time"
                          value={hour.startTime}
                          onChange={(event) => {
                            const nextHours = [...workingHours];
                            nextHours[index] = {
                              ...nextHours[index],
                              startTime: event.target.value,
                            };
                            setWorkingHours(nextHours);
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
                            const nextHours = [...workingHours];
                            nextHours[index] = {
                              ...nextHours[index],
                              endTime: event.target.value,
                            };
                            setWorkingHours(nextHours);
                          }}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="detail-section" aria-labelledby="blackout-dates-title">
              <div className="panel-heading inline-heading">
                <div>
                  <p className="eyebrow">Exceptions</p>
                  <h3 id="blackout-dates-title">Blackout dates</h3>
                </div>
                <CalendarRange size={18} aria-hidden="true" />
              </div>
              {blackoutDates.length ? (
                <div className="schedule-editor-list">
                  {blackoutDates.map((range) => (
                    <div className="schedule-row" key={range.id}>
                      <div className="schedule-row-heading">
                        <strong>Blocked range</strong>
                        <button
                          className="text-button"
                          type="button"
                          onClick={() => setBlackoutDates(blackoutDates.filter((entry) => entry.id !== range.id))}
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
                              setBlackoutDates(
                                blackoutDates.map((entry) =>
                                  entry.id === range.id ? { ...entry, startDate: event.target.value } : entry,
                                ),
                              )
                            }
                          />
                        </label>
                        <label className="form-field">
                          End date
                          <input
                            type="date"
                            value={range.endDate}
                            onChange={(event) =>
                              setBlackoutDates(
                                blackoutDates.map((entry) =>
                                  entry.id === range.id ? { ...entry, endDate: event.target.value } : entry,
                                ),
                              )
                            }
                          />
                        </label>
                      </div>
                      <label className="form-field">
                        Reason
                        <input
                          value={range.reason}
                          onChange={(event) =>
                            setBlackoutDates(
                              blackoutDates.map((entry) =>
                                entry.id === range.id ? { ...entry, reason: event.target.value } : entry,
                              ),
                            )
                          }
                          placeholder="Holiday, maintenance, private event"
                        />
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="body-copy">No blackout dates are configured yet.</p>
              )}
              <button
                className="secondary-button compact-button"
                type="button"
                onClick={() => setBlackoutDates([...blackoutDates, createEmptyBlackoutDateDraft()])}
              >
                <Plus size={17} aria-hidden="true" />
                Add blackout range
              </button>
            </section>

            <section className="detail-section" aria-labelledby="advanced-settings-title">
              <div className="panel-heading inline-heading">
                <div>
                  <p className="eyebrow">Advanced</p>
                  <h3 id="advanced-settings-title">Rules and public surfaces</h3>
                </div>
                <SettingsIcon size={18} aria-hidden="true" />
              </div>
              <label className="form-field">
                Availability rules JSON
                <textarea value={availabilityRulesJson} onChange={(event) => setAvailabilityRulesJson(event.target.value)} />
              </label>
              <label className="form-field">
                Notification settings JSON
                <textarea value={notificationSettingsJson} onChange={(event) => setNotificationSettingsJson(event.target.value)} />
              </label>
              <label className="form-field">
                Widget settings JSON
                <textarea value={widgetSettingsJson} onChange={(event) => setWidgetSettingsJson(event.target.value)} />
              </label>
              <label className="form-field">
                Public page settings JSON
                <textarea value={publicPageSettingsJson} onChange={(event) => setPublicPageSettingsJson(event.target.value)} />
              </label>
            </section>

            {updateMutation.isError ? (
              <InlineNotice tone="error" message={(updateMutation.error as Error).message} icon={AlertTriangle} />
            ) : null}
            {updateMutation.isSuccess ? (
              <InlineNotice tone="success" message="Settings saved." icon={CheckCircle2} />
            ) : null}

            <button className="primary-button compact-button" type="submit" disabled={updateMutation.isPending}>
              <Save size={17} aria-hidden="true" />
              {updateMutation.isPending ? 'Saving' : 'Save settings'}
            </button>
          </form>

          <aside className="panel settings-summary" aria-label="Business readiness">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Readiness</p>
                <h2>Operating setup</h2>
              </div>
            </div>
            <div className="detail-grid">
              <div className="detail-field">
                <span>Template</span>
                <strong>{selectedBusiness.templateKey ?? 'Custom'}</strong>
              </div>
              <div className="detail-field">
                <span>Slot interval</span>
                <strong>{selectedBusiness.availabilityRules?.slotIntervalMinutes ?? 'Unset'}</strong>
              </div>
              <div className="detail-field">
                <span>Working days</span>
                <strong>{workingHours.filter((hour) => !hour.closed).length}</strong>
              </div>
              <div className="detail-field">
                <span>Blackout ranges</span>
                <strong>{blackoutDates.length}</strong>
              </div>
              <div className="detail-field">
                <span>Widget</span>
                <strong>{getBooleanLabel(selectedBusiness.widgetSettings?.enabled)}</strong>
              </div>
              <div className="detail-field">
                <span>Public page</span>
                <strong>{getBooleanLabel(selectedBusiness.publicPageSettings?.enabled)}</strong>
              </div>
              <div className="detail-field">
                <span>Updated</span>
                <strong>{selectedBusiness.updatedAt ? new Date(selectedBusiness.updatedAt).toLocaleDateString() : 'Not tracked'}</strong>
              </div>
            </div>
          </aside>
        </section>
      )}

      <section className="content-grid template-grid" aria-label="Business templates">
        <div className="panel template-gallery-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Templates</p>
              <h2>Business template gallery</h2>
            </div>
            <Sparkles size={20} aria-hidden="true" />
          </div>
          {templatesQuery.isLoading ? (
            <LoadingState label="Loading business templates" />
          ) : templatesQuery.isError ? (
            <EmptyState
              icon={AlertTriangle}
              title="Business templates could not load"
              description={(templatesQuery.error as Error).message}
            />
          ) : templates.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No templates found"
              description="The existing templates endpoint returned no presets."
            />
          ) : (
            <div className="template-gallery">
              {templates.map((template) => (
                <button
                  className={`template-card ${selectedTemplateKey === template.key ? 'template-card-selected' : ''}`}
                  key={template.key}
                  type="button"
                  aria-pressed={selectedTemplateKey === template.key}
                  onClick={() => setSelectedTemplateKey(template.key)}
                >
                  <span className="template-card-icon" aria-hidden="true">
                    <Sparkles size={18} />
                  </span>
                  <span>
                    <strong>{template.label}</strong>
                    <small>{template.description ?? template.key}</small>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <aside className="panel template-preview-panel" aria-label="Template preview">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Read-only preview</p>
              <h2>{selectedTemplatePreview.data?.label ?? 'Template preview'}</h2>
            </div>
            <Eye size={20} aria-hidden="true" />
          </div>
          {!selectedTemplateKey ? (
            <EmptyState
              icon={Eye}
              title="Select a template"
              description="Choose a template to preview the existing preset defaults."
            />
          ) : selectedTemplatePreview.isLoading ? (
            <LoadingState label="Loading template preview" />
          ) : selectedTemplatePreview.isError ? (
            <EmptyState
              icon={AlertTriangle}
              title="Template preview could not load"
              description={(selectedTemplatePreview.error as Error).message}
            />
          ) : selectedTemplatePreview.data ? (
            <div className="template-preview-content">
              <p className="body-copy">{selectedTemplatePreview.data.description}</p>
              <div className="detail-grid">
                {Object.entries(getTemplateRules(selectedTemplatePreview.data) ?? {}).map(([key, value]) => (
                  <div className="detail-field" key={key}>
                    <span>{key}</span>
                    <strong>{formatTemplateValue(value)}</strong>
                  </div>
                ))}
              </div>
              <section className="detail-section" aria-label="Template resources">
                <h3>Suggested resources</h3>
                {getTemplateResources(selectedTemplatePreview.data).length ? (
                  <div className="template-resource-list">
                    {getTemplateResources(selectedTemplatePreview.data).map((resource, index) => (
                      <div className="template-resource-row" key={`${resource.name ?? 'resource'}-${index}`}>
                        <strong>{formatTemplateValue(resource.name)}</strong>
                        <span>
                          {formatTemplateValue(resource.resourceType)}
                          {resource.capacity ? ` · ${formatTemplateValue(resource.capacity)} capacity` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="body-copy">No suggested resources are included in this template.</p>
                )}
              </section>
            </div>
          ) : null}
        </aside>
      </section>
    </>
  );
}
