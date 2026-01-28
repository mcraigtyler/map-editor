import { Button } from 'primereact/button';
import { Panel } from 'primereact/panel';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { ApiError } from '~/lib/apiClient';

import { useDrawingStore } from '~/features/drawing/state';
import { TagEditor } from '~/features/tagging/components/TagEditor';
import { useFeature, useUpdateFeatureMutation, useUpdateFeatureTagsMutation } from '../hooks';
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

function formatTagValue(value: string): string {
  return value;
}

function useSortedTags(feature: Feature | undefined) {
  return useMemo(() => {
    if (!feature) {
      return [] as Array<[string, string]>;
    }

    return Object.entries(feature.properties.tags ?? {}).sort(([a], [b]) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' })
    );
  }, [feature]);
}

interface TagDiff {
  set: Record<string, string>;
  delete: string[];
}

function diffTags(current: Record<string, string>, next: Record<string, string>): TagDiff {
  const set: Record<string, string> = {};
  const toDelete: string[] = [];

  Object.entries(next).forEach(([key, value]) => {
    if (current[key] !== value) {
      set[key] = value;
    }
  });

  Object.keys(current).forEach((key) => {
    if (!(key in next)) {
      toDelete.push(key);
    }
  });

  return { set, delete: toDelete };
}

export function FeatureDetailPanel() {
  const { featureId } = useParams<{ featureId: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch, isFetching } = useFeature(featureId);
  const updateFeatureMutation = useUpdateFeatureMutation();
  const {
    mutate: mutateFeatureTags,
    isPending: isUpdatingTags,
    reset: resetFeatureTagsMutation,
  } = useUpdateFeatureTagsMutation();
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [tagFormError, setTagFormError] = useState<string | undefined>();

  useEffect(() => {
    setIsEditingTags(false);
    setTagFormError(undefined);
    resetFeatureTagsMutation();
  }, [featureId, resetFeatureTagsMutation]);

  const drawingMode = useDrawingStore((state) => state.mode);
  const editingSession = useDrawingStore((state) => state.editing);
  const isSavingGeometry = useDrawingStore((state) => state.isSaving);
  const drawingError = useDrawingStore((state) => state.error);
  const startEditing = useDrawingStore((state) => state.startEditing);
  const resetDrawingState = useDrawingStore((state) => state.reset);
  const markSaving = useDrawingStore((state) => state.markSaving);
  const failDrawing = useDrawingStore((state) => state.fail);
  const clearDrawingError = useDrawingStore((state) => state.clearError);

  const sortedTags = useSortedTags(data);

  const handleClose = () => {
    if (drawingMode === 'editing') {
      resetDrawingState();
    }
    if (isEditingTags) {
      setIsEditingTags(false);
    }
    setTagFormError(undefined);
    resetFeatureTagsMutation();
    navigate('/');
  };

  const isEditingCurrent = drawingMode === 'editing' && editingSession?.featureId === data?.id;
  const isEditingAnother = drawingMode === 'editing' && !isEditingCurrent && Boolean(editingSession);
  const isTagEditDisabled =
    isEditingTags ||
    isEditingAnother ||
    drawingMode === 'drawing' ||
    isSavingGeometry ||
    isEditingCurrent ||
    isUpdatingTags;

  const handleStartEditing = () => {
    if (!data) {
      return;
    }
    clearDrawingError();
    startEditing(data);
  };

  const handleCancelEditing = () => {
    resetDrawingState();
  };

  const handleSaveGeometry = () => {
    if (!editingSession) {
      return;
    }

    clearDrawingError();
    markSaving();

    const geometry = editingSession.draftGeometry ?? editingSession.originalGeometry;

    updateFeatureMutation.mutate(
      {
        featureId: editingSession.featureId,
        payload: {
          kind: editingSession.kind,
          geometry,
          tags: editingSession.tags,
        },
      },
      {
        onSuccess: () => {
          resetDrawingState();
        },
        onError: (mutationError) => {
          const message =
            mutationError instanceof ApiError
              ? mutationError.message
              : 'Failed to update feature geometry.';
          failDrawing(message);
        },
      }
    );
  };

  const handleStartEditingTags = () => {
    if (!data) {
      return;
    }
    resetFeatureTagsMutation();
    setTagFormError(undefined);
    setIsEditingTags(true);
  };

  const handleCancelTagEditing = () => {
    resetFeatureTagsMutation();
    setTagFormError(undefined);
    setIsEditingTags(false);
  };

  const handleSubmitTags = (nextTags: Record<string, string>) => {
    if (!data) {
      return;
    }

    const currentTags = data.properties.tags ?? {};
    const changes = diffTags(currentTags, nextTags);
    const hasSet = Object.keys(changes.set).length > 0;
    const hasDelete = changes.delete.length > 0;

    if (!hasSet && !hasDelete) {
      setTagFormError('No changes to save.');
      return;
    }

    setTagFormError(undefined);

    mutateFeatureTags(
      {
        featureId: data.id,
        payload: {
          ...(hasSet ? { set: changes.set } : {}),
          ...(hasDelete ? { delete: changes.delete } : {}),
        },
      },
      {
        onSuccess: () => {
          setIsEditingTags(false);
          setTagFormError(undefined);
        },
        onError: (mutationError) => {
          const message =
            mutationError instanceof ApiError
              ? mutationError.message
              : 'Failed to update feature tags.';
          setTagFormError(message);
        },
      }
    );
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
            {!isEditingCurrent ? (
              <Button
                label="Edit geometry"
                icon="pi pi-pencil"
                type="button"
                onClick={handleStartEditing}
                disabled={
                  isLoading ||
                  isEditingAnother ||
                  drawingMode === 'drawing' ||
                  isSavingGeometry ||
                  isEditingTags
                }
              />
            ) : (
              <>
                <Button
                  label="Save geometry"
                  icon="pi pi-check"
                  type="button"
                  onClick={handleSaveGeometry}
                  loading={isSavingGeometry}
                />
                <Button
                  label="Cancel editing"
                  icon="pi pi-times"
                  severity="secondary"
                  outlined
                  type="button"
                  onClick={handleCancelEditing}
                  disabled={isSavingGeometry}
                />
              </>
            )}
          </div>
          {isEditingCurrent ? (
            <p className="feature-detail__status feature-detail__status--info" aria-live="polite">
              Geometry editing is active. Adjust vertices on the map and save your changes when ready.
            </p>
          ) : null}
          {isEditingCurrent && drawingError ? (
            <div className="feature-detail__error" role="alert">
              {drawingError}
            </div>
          ) : null}
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
            <div className="feature-detail__tags-header">
              <h3 className="feature-detail__tags-title">Tags</h3>
              {!isEditingTags ? (
                <Button
                  type="button"
                  label="Edit tags"
                  icon="pi pi-pencil"
                  severity="secondary"
                  outlined
                  onClick={handleStartEditingTags}
                  disabled={isTagEditDisabled}
                />
              ) : null}
            </div>
            {isEditingTags ? (
              <TagEditor
                key={`${data.id}-${data.properties.updatedAt}`}
                initialTags={data.properties.tags ?? {}}
                isSubmitting={isUpdatingTags}
                errorMessage={tagFormError}
                onSubmit={handleSubmitTags}
                onCancel={handleCancelTagEditing}
              />
            ) : sortedTags.length === 0 ? (
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
