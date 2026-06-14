import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Building2, CheckCircle2, Eye, RefreshCw, Save, Search, Sparkles } from 'lucide-react';
import { getBusinessTemplate, listBusinesses, listBusinessTemplates, updateBusiness } from '../../api/businesses';
import type { BusinessProfileDto, BusinessTemplateDto } from '../../api/types';
import { useSessionStore } from '../../auth/sessionStore';
import { InlineNotice, LoadingState } from '../../components/AdminState';
import { EmptyState } from '../../components/EmptyState';

const businessTypes = ['restaurant', 'clinic', 'salon', 'consulting', 'venue', 'rental', 'fitness', 'other'];

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

export function SettingsPage() {
  const { token } = useSessionStore();
  const queryClient = useQueryClient();
  const [selectedBusinessId, setSelectedBusinessId] = useState('');
  const [form, setForm] = useState({
    businessType: 'other',
    contactEmail: '',
    contactPhone: '',
    description: '',
    name: '',
    slug: '',
    status: 'active',
    timezone: 'UTC',
  });

  const businessesQuery = useQuery({
    enabled: Boolean(token),
    queryFn: async () => {
      const response = await listBusinesses(token ?? '');

      if (!response.success) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    queryKey: ['businesses', token],
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
  const selectedBusiness = useMemo(
    () => businesses.find((business) => business._id === selectedBusinessId) ?? getFirstBusiness(businesses),
    [businesses, selectedBusinessId],
  );
  const [selectedTemplateKey, setSelectedTemplateKey] = useState('');

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

      const response = await updateBusiness(selectedBusiness._id, form, token);

      if (!response.success) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
    },
  });

  return (
    <>
      <section className="workspace-header" aria-labelledby="settings-title">
        <div>
          <p className="eyebrow">Business setup</p>
          <h1 id="settings-title">Settings</h1>
          <p className="lede">Manage profile basics, operating posture, and public-surface readiness.</p>
        </div>
        <div className="header-actions" aria-label="Settings actions">
          <button className="icon-button" type="button" aria-label="Refresh settings" onClick={() => businessesQuery.refetch()}>
            <RefreshCw size={18} aria-hidden="true" />
          </button>
        </div>
      </section>

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
                <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
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
                <strong>{selectedBusiness.workingHours?.filter((hour) => !hour.closed).length ?? 0}</strong>
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
