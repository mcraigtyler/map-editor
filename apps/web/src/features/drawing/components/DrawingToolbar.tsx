import { Button } from 'primereact/button';
import { Panel } from 'primereact/panel';
import { useMemo } from 'react';

import { useDrawingStore } from '../state';
import type { DrawingIntent } from '../state';
import { LANELET_OFFSET_STEP_METERS } from '../state';

const DRAWING_HINTS: Record<Exclude<DrawingIntent, 'lanelet'>, string> = {
  point: 'Click on the map to place the point.',
  line: 'Click to add vertices. Double-click to finish the line.',
  polygon: 'Click to add vertices. Double-click to close the polygon.',
};

const DRAWING_LABELS: Record<DrawingIntent, string> = {
  point: 'Draw point',
  line: 'Draw line',
  polygon: 'Draw polygon',
  lanelet: 'Draw lanelet',
};

const DRAWING_ICONS: Record<DrawingIntent, string> = {
  point: 'pi pi-map-marker',
  line: 'pi pi-chart-line',
  polygon: 'pi pi-stop',
  lanelet: 'pi pi-sliders-h',
};

const DRAWING_INTENTS: DrawingIntent[] = ['point', 'line', 'polygon', 'lanelet'];

export function DrawingToolbar() {
  const mode = useDrawingStore((state) => state.mode);
  const intent = useDrawingStore((state) => state.intent);
  const isSaving = useDrawingStore((state) => state.isSaving);
  const error = useDrawingStore((state) => state.error);
  const laneletOffset = useDrawingStore((state) => state.laneletOffset);
  const startDrawing = useDrawingStore((state) => state.startDrawing);
  const startSelecting = useDrawingStore((state) => state.startSelecting);
  const reset = useDrawingStore((state) => state.reset);
  const clearError = useDrawingStore((state) => state.clearError);

  const isDrawing = mode === 'drawing';
  const isEditing = mode === 'editing';
  const isSelecting = mode === 'selecting';

  const hint = useMemo(() => {
    if (isDrawing && intent) {
      if (intent === 'lanelet') {
        const laneWidth = (laneletOffset * 2).toFixed(1);
        return `Click to add centerline vertices. Double-click to finish. Use "=" to widen and "-" to narrow (${laneWidth} m total width, ${LANELET_OFFSET_STEP_METERS} m step).`;
      }

      return DRAWING_HINTS[intent as Exclude<DrawingIntent, 'lanelet'>];
    }

    if (isSelecting) {
      return 'Click a feature on the map to highlight it.';
    }

    return undefined;
  }, [intent, isDrawing, isSelecting, laneletOffset]);

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
    <Panel className="drawing-toolbar__panel">
      <div className="drawing-toolbar" aria-live="polite">
        <div className="drawing-toolbar__actions">
          <Button
            label="Select"
            icon="pi pi-mouse"
            outlined
            severity={isSelecting ? 'success' : undefined}
            onClick={handleSelect}
            disabled={isSaving || isEditing}
          />
          {DRAWING_INTENTS.map((key) => (
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
        {isDrawing || isSelecting ? (
          <div className="drawing-toolbar__footer">
            {hint ? <p className="drawing-toolbar__hint">{hint}</p> : null}
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
