import { create } from 'zustand';

import type { Feature, FeatureGeometry, FeatureProperties } from '../feature/types';
import type { EditableFeatureKind } from '../feature/types';
import { cloneGeometry } from './utils';

export type DrawingMode = 'idle' | 'drawing' | 'editing';
export type DrawingIntent = EditableFeatureKind;

interface EditingSession {
  featureId: string;
  kind: FeatureProperties['kind'];
  tags: Record<string, string>;
  originalGeometry: FeatureGeometry;
  draftGeometry: FeatureGeometry;
}

interface DrawingState {
  mode: DrawingMode;
  intent?: EditableFeatureKind;
  editing?: EditingSession;
  isSaving: boolean;
  error?: string;
  startDrawing: (intent: EditableFeatureKind) => void;
  startEditing: (feature: Feature) => void;
  setEditingDraft: (geometry: FeatureGeometry) => void;
  markSaving: () => void;
  completeDrawing: () => void;
  reset: () => void;
  fail: (message: string) => void;
  clearError: () => void;
}

function cloneTags(tags: Record<string, string>): Record<string, string> {
  return { ...tags };
}

export const useDrawingStore = create<DrawingState>((set) => ({
  mode: 'idle',
  isSaving: false,
  startDrawing: (intent) =>
    set({
      mode: 'drawing',
      intent,
      editing: undefined,
      isSaving: false,
      error: undefined,
    }),
  startEditing: (feature) =>
    set({
      mode: 'editing',
      intent: undefined,
      isSaving: false,
      error: undefined,
      editing: {
        featureId: feature.id,
        kind: feature.properties.kind,
        tags: cloneTags(feature.properties.tags ?? {}),
        originalGeometry: cloneGeometry(feature.geometry),
        draftGeometry: cloneGeometry(feature.geometry),
      },
    }),
  setEditingDraft: (geometry) =>
    set((state) => {
      if (!state.editing) {
        return {};
      }
      return {
        editing: {
          ...state.editing,
          draftGeometry: cloneGeometry(geometry),
        },
      };
    }),
  markSaving: () => set({ isSaving: true, error: undefined }),
  completeDrawing: () =>
    set((state) =>
      state.mode === 'drawing'
        ? {
            isSaving: false,
            error: undefined,
          }
        : {}
    ),
  reset: () =>
    set({
      mode: 'idle',
      intent: undefined,
      editing: undefined,
      isSaving: false,
      error: undefined,
    }),
  fail: (message) => set({ isSaving: false, error: message }),
  clearError: () => set({ error: undefined }),
}));
