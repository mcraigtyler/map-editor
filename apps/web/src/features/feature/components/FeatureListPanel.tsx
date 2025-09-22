import { Panel } from 'primereact/panel';
import { NavLink } from 'react-router-dom';

import { ApiError } from '~/lib/apiClient';

import { useFeatureList } from '../hooks';
import type { Feature } from '../types';

const DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function getFeatureDisplayName(feature: Feature): string {
  const nameCandidate = feature.properties.tags?.name;
  if (typeof nameCandidate === 'string' && nameCandidate.trim().length > 0) {
    return nameCandidate;
  }
  return `${feature.properties.kind} feature`;
}

function formatUpdatedAt(isoString: string): string {
  try {
    return DATE_FORMATTER.format(new Date(isoString));
  } catch (error) {
    console.warn('Failed to format date', error);
    return isoString;
  }
}

export function FeatureListPanel() {
  const { data, isLoading, isError, error, refetch, isFetching } = useFeatureList();
  const features = data?.features ?? [];
  const total = data?.pagination.total ?? features.length;

  return (
    <Panel header="Features" className="sidebar__panel">
      <div className="feature-list__summary" aria-live="polite">
        {isFetching ? 'Refreshing…' : `${total} feature${total === 1 ? '' : 's'} loaded`}
      </div>
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
        <ul className="feature-list">
          {features.map((feature) => (
            <li key={feature.id} className="feature-list__item">
              <NavLink
                to={`/features/${feature.id}`}
                className={({ isActive }) =>
                  isActive ? 'feature-list__link feature-list__link--active' : 'feature-list__link'
                }
              >
                <span className="feature-list__name">{getFeatureDisplayName(feature)}</span>
                <span className="feature-list__meta">
                  {`${feature.properties.kind} • ${feature.geometry.type} • Updated ${formatUpdatedAt(feature.properties.updatedAt)}`}
                </span>
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
