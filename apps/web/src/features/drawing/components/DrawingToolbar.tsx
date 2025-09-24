import { Button } from 'primereact/button';
import { Panel } from 'primereact/panel';
import { useMemo } from 'react';

import { useDrawingStore } from '../state';
import type { DrawingIntent } from '../state';

const DRAWING_HINTS: Record<DrawingIntent, string> = {
  point: 'Click on the map to place the point.',
  line: 'Click to add vertices. Double-click to finish the line.',
  polygon: 'Click to add vertices. Double-click to close the polygon.',
};

const DRAWING_LABELS: Record<DrawingIntent, string> = {
  point: 'Draw point',
  line: 'Draw line',
  polygon: 'Draw polygon',
};

const DRAWING_ICONS: Record<DrawingIntent, string> = {
  point: 'pi pi-map-marker',
  line: 'pi pi-chart-line',
  polygon: 'pi pi-stop',
};

export function DrawingToolbar() {
  const mode = useDrawingStore((state) => state.mode);
  const intent = useDrawingStore((state) => state.intent);
  const isSaving = useDrawingStore((state) => state.isSaving);
  const error = useDrawingStore((state) => state.error);
  const startDrawing = useDrawingStore((state) => state.startDrawing);
  const startSelecting = useDrawingStore((state) => state.startSelecting);
  const reset = useDrawingStore((state) => state.reset);
  const clearError = useDrawingStore((state) => state.clearError);

  const isDrawing = mode === 'drawing';
  const isEditing = mode === 'editing';
  const isSelecting = mode === 'selecting';

  const statusMessage = useMemo(() => {
    if (isSaving) {
      return 'Saving geometry…';
    }

    if (isSelecting) {
      return 'Select a feature on the map to focus its details.';
    }

    if (isDrawing && intent) {
      return `Drawing a ${intent} feature.`;
    }

    if (isEditing) {
      return 'Editing geometry for the selected feature.';
    }

    return 'Choose an action to draw, edit, or select map features.';
  }, [intent, isDrawing, isEditing, isSaving, isSelecting]);

  const hint = useMemo(() => {
    if (isDrawing && intent) {
      return DRAWING_HINTS[intent];
    }

    if (isSelecting) {
      return 'Click a feature on the map to highlight it.';
    }

    return undefined;
  }, [intent, isDrawing, isSelecting]);

  const handleStart = (nextIntent: DrawingIntent) => {
    if (isSaving) {
      return;
    }
    clearError();
    startDrawing(nextIntent);
  };

  const handleSelect = () => {
    if (isSaving || isEditing) {
      return;
    }

    clearError();

    if (isSelecting) {
      reset();
      return;
    }

    startSelecting();
  };

  const handleCancel = () => {
    if (isSaving) {
      return;
    }
    reset();
  };

  const shouldShowError = Boolean(error) && isDrawing;

  return (
    <Panel header="Geometry tools" className="drawing-toolbar__panel">
      <div className="drawing-toolbar" aria-live="polite">
        <p className="drawing-toolbar__status">{statusMessage}</p>
        <div className="drawing-toolbar__actions">
          <Button
            label="Select"
            icon="pi pi-mouse"
            outlined
            severity={isSelecting ? 'success' : undefined}
            onClick={handleSelect}
            disabled={isSaving || isEditing}
          />
          {(Object.keys(DRAWING_LABELS) as DrawingIntent[]).map((key) => (
            <Button
              key={key}
              label={DRAWING_LABELS[key]}
              icon={DRAWING_ICONS[key]}
              outlined
              severity={intent === key && isDrawing ? 'success' : undefined}
              onClick={() => handleStart(key)}
              disabled={isSaving || isEditing}
            />
          ))}
        </div>
        {hint ? <p className="drawing-toolbar__hint">{hint}</p> : null}
        {isDrawing || isSelecting ? (
          <div className="drawing-toolbar__footer">
            <Button
              label={isSelecting ? 'Cancel selection' : 'Cancel drawing'}
              icon="pi pi-times"
              severity="secondary"
              outlined
              onClick={handleCancel}
              disabled={isSaving}
              type="button"
            />
          </div>
        ) : null}
        {shouldShowError ? (
          <div className="drawing-toolbar__error" role="alert">
            {error}
          </div>
        ) : null}
        {isEditing ? (
          <p className="drawing-toolbar__hint drawing-toolbar__hint--muted">
            Adjust the geometry on the map, then use the detail panel to save or cancel changes.
          </p>
        ) : null}
      </div>
    </Panel>
  );
}
