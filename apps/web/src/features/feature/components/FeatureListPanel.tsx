import { Button } from 'primereact/button';
import { Panel } from 'primereact/panel';
import { useMemo } from 'react';
import type { MouseEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { ApiError } from '~/lib/apiClient';

import { useDeleteFeatureMutation, useFeatureList } from '../hooks';
import type { Feature } from '../types';

const DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const EMPTY_FEATURES: Feature[] = [];

function formatUpdatedAt(isoString: string): string {
  try {
    return DATE_FORMATTER.format(new Date(isoString));
  } catch (error) {
    console.warn('Failed to format date', error);
    return isoString;
  }
}

function formatFeatureKind(kind: Feature['properties']['kind']): string {
  if (!kind) {
    return 'Unknown';
  }
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}

function countCoordinateLeaves(value: unknown): number {
  if (!Array.isArray(value)) {
    return 0;
  }

  if (value.length === 0) {
    return 0;
  }

  const [first] = value;
  if (typeof first === 'number') {
    return 1;
  }

  return (value as unknown[]).reduce<number>((total, item) => total + countCoordinateLeaves(item), 0);
}

function countFeaturePoints(feature: Feature): number {
  if (!feature.geometry) {
    return 0;
  }

  if (feature.geometry.type === 'Point') {
    return 1;
  }

  try {
    return countCoordinateLeaves(feature.geometry.coordinates);
  } catch (error) {
    console.warn('Failed to count geometry coordinates', error);
    return 0;
  }
}

function formatPointCount(count: number): string {
  if (count === 1) {
    return '1 point';
  }
  return `${count} points`;
}

export function FeatureListPanel() {
  const { data, isLoading, isError, error, refetch, isFetching } = useFeatureList();
  const features = data?.features ?? EMPTY_FEATURES;
  const total = data?.pagination.total ?? features.length;
  const navigate = useNavigate();
  const { featureId: selectedFeatureId } = useParams<{ featureId: string }>();
  const deleteFeatureMutation = useDeleteFeatureMutation();
  const deletingId = deleteFeatureMutation.variables;
  const isDeleting = deleteFeatureMutation.isPending;
  const deleteError = deleteFeatureMutation.error;

  const rows = useMemo(
    () =>
      features.map((feature) => ({
        feature,
        updatedAt: formatUpdatedAt(feature.properties.updatedAt),
        pointCount: countFeaturePoints(feature),
      })),
    [features]
  );

  const handleSelect = (featureId: string) => {
    navigate(`/features/${featureId}`);
  };

  const handleDelete = (event: MouseEvent<HTMLButtonElement>, featureId: string) => {
    event.stopPropagation();

    if (isDeleting) {
      return;
    }

    if (!window.confirm('Delete this feature? This action cannot be undone.')) {
      return;
    }

    deleteFeatureMutation.reset();
    deleteFeatureMutation.mutate(featureId, {
      onSuccess: () => {
        if (selectedFeatureId === featureId) {
          navigate('/');
        }
      },
    });
  };

  return (
    <Panel header="Features" className="sidebar__panel">
      <div className="feature-list__summary" aria-live="polite">
        {isFetching ? 'Refreshing…' : `${total} feature${total === 1 ? '' : 's'} loaded`}
      </div>
      {deleteError ? (
        <div className="feature-list__error" role="alert">
          {deleteError instanceof ApiError ? deleteError.message : 'Failed to delete feature.'}
        </div>
      ) : null}
      {isLoading ? (
        <p className="feature-list__status" aria-live="polite">
          Loading features…
        </p>
      ) : isError ? (
        <div className="feature-list__status" role="alert">
          <p className="feature-list__status-text">
            {error instanceof ApiError ? error.message : 'Unable to load features.'}
          </p>
          <button type="button" className="feature-list__retry" onClick={() => refetch()}>
            Try again
          </button>
        </div>
      ) : features.length === 0 ? (
        <p className="feature-list__status" aria-live="polite">
          No features found in the current view.
        </p>
      ) : (
        <div className="feature-list__scroll" role="region" aria-label="Loaded map features">
          <ul className="feature-list">
            {rows.map(({ feature, updatedAt, pointCount }) => {
              const isSelected = selectedFeatureId === feature.id;
              const rowClassName = isSelected
                ? 'feature-list__row feature-list__row--active'
                : 'feature-list__row';
              const isDeletingThis = isDeleting && deletingId === feature.id;

              return (
                <li key={feature.id} className="feature-list__item">
                  <div className={rowClassName}>
                    <button
                      type="button"
                      className="feature-list__select"
                      onClick={() => handleSelect(feature.id)}
                      aria-current={isSelected ? 'true' : undefined}
                      disabled={isDeleting}
                    >
                      <span className="feature-list__field">
                        <span className="feature-list__label">Type</span>
                        <span className="feature-list__value">{formatFeatureKind(feature.properties.kind)}</span>
                      </span>
                      <span className="feature-list__field">
                        <span className="feature-list__label">Updated</span>
                        <span className="feature-list__value">{updatedAt}</span>
                      </span>
                      <span className="feature-list__field">
                        <span className="feature-list__label">Points</span>
                        <span className="feature-list__value">{formatPointCount(pointCount)}</span>
                      </span>
                    </button>
                    <Button
                      icon="pi pi-trash"
                      label="Delete"
                      severity="danger"
                      text
                      className="feature-list__delete"
                      onClick={(event) => handleDelete(event, feature.id)}
                      disabled={isDeleting}
                      loading={isDeletingThis}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Panel>
  );
}
