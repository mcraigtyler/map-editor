import { Button } from 'primereact/button';
import { Panel } from 'primereact/panel';
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { ApiError } from '~/lib/apiClient';

import { useFeature } from '../hooks';
import type { Feature } from '../types';

const DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function formatDate(value: string): string {
  try {
    return DATE_FORMATTER.format(new Date(value));
  } catch (error) {
    console.warn('Failed to format date', error);
    return value;
  }
}

function formatTagValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch (error) {
      console.warn('Failed to stringify tag value', error);
      return String(value);
    }
  }

  return String(value);
}

function useSortedTags(feature: Feature | undefined) {
  return useMemo(() => {
    if (!feature) {
      return [] as Array<[string, unknown]>;
    }

    return Object.entries(feature.properties.tags ?? {}).sort(([a], [b]) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' })
    );
  }, [feature]);
}

export function FeatureDetailPanel() {
  const { featureId } = useParams<{ featureId: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch, isFetching } = useFeature(featureId);

  const sortedTags = useSortedTags(data);

  const handleClose = () => {
    navigate('/');
  };

  return (
    <Panel header="Feature details" className="sidebar__panel">
      {!featureId ? (
        <p className="feature-detail__status" role="alert">
          Feature identifier is missing from the route.
        </p>
      ) : isLoading ? (
        <p className="feature-detail__status" aria-live="polite">
          Loading feature details…
        </p>
      ) : isError ? (
        <div className="feature-detail__status" role="alert">
          <p className="feature-detail__status-text">
            {error instanceof ApiError ? error.message : 'Unable to load feature details.'}
          </p>
          <div className="feature-detail__actions">
            <Button label="Retry" icon="pi pi-refresh" onClick={() => refetch()} loading={isFetching} />
            <Button
              label="Close"
              icon="pi pi-times"
              severity="secondary"
              outlined
              onClick={handleClose}
              type="button"
            />
          </div>
        </div>
      ) : !data ? (
        <p className="feature-detail__status" role="alert">
          Feature details are unavailable.
        </p>
      ) : (
        <div className="feature-detail">
          <div className="feature-detail__actions feature-detail__actions--top">
            <Button
              label="Close"
              icon="pi pi-times"
              severity="secondary"
              outlined
              onClick={handleClose}
              type="button"
            />
          </div>
          <dl className="feature-detail__meta">
            <div className="feature-detail__meta-group">
              <dt>ID</dt>
              <dd>
                <code>{data.id}</code>
              </dd>
            </div>
            <div className="feature-detail__meta-group">
              <dt>Kind</dt>
              <dd>{data.properties.kind}</dd>
            </div>
            <div className="feature-detail__meta-group">
              <dt>Geometry</dt>
              <dd>{data.geometry.type}</dd>
            </div>
            <div className="feature-detail__meta-group">
              <dt>Created</dt>
              <dd>{formatDate(data.properties.createdAt)}</dd>
            </div>
            <div className="feature-detail__meta-group">
              <dt>Updated</dt>
              <dd>{formatDate(data.properties.updatedAt)}</dd>
            </div>
          </dl>
          <section className="feature-detail__tags">
            <h3 className="feature-detail__tags-title">Tags</h3>
            {sortedTags.length === 0 ? (
              <p className="feature-detail__status">No tags recorded for this feature.</p>
            ) : (
              <ul className="feature-detail__tag-list">
                {sortedTags.map(([key, value]) => (
                  <li key={key} className="feature-detail__tag">
                    <span className="feature-detail__tag-key">{key}</span>
                    <span className="feature-detail__tag-value">{formatTagValue(value)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </Panel>
  );
}
