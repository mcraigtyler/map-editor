import { create } from 'zustand';

import type { Feature, FeatureGeometry, FeatureProperties } from '../feature/types';
import type { EditableFeatureKind } from '../feature/types';
import { cloneGeometry } from './utils';

export const DEFAULT_LANELET_OFFSET_METERS = 3.5;
export const MIN_LANELET_OFFSET_METERS = 1.5;
export const MAX_LANELET_OFFSET_METERS = 10;
export const LANELET_OFFSET_STEP_METERS = 0.5;

export type DrawingMode = 'idle' | 'drawing' | 'editing' | 'selecting';
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
  laneletOffset: number;
  startDrawing: (intent: EditableFeatureKind) => void;
  startSelecting: () => void;
  startEditing: (feature: Feature) => void;
  setEditingDraft: (geometry: FeatureGeometry) => void;
  markSaving: () => void;
  completeDrawing: () => void;
  reset: () => void;
  fail: (message: string) => void;
  clearError: () => void;
  setLaneletOffset: (offset: number) => void;
  adjustLaneletOffset: (delta: number) => void;
}

function cloneTags(tags: Record<string, string>): Record<string, string> {
  return { ...tags };
}

export const useDrawingStore = create<DrawingState>((set) => ({
  mode: 'idle',
  isSaving: false,
  laneletOffset: DEFAULT_LANELET_OFFSET_METERS,
  startDrawing: (intent) =>
    set((state) => ({
      mode: 'drawing',
      intent,
      editing: undefined,
      isSaving: false,
      error: undefined,
      laneletOffset: intent === 'lanelet' ? DEFAULT_LANELET_OFFSET_METERS : state.laneletOffset,
    })),
  startSelecting: () =>
    set({
      mode: 'selecting',
      intent: undefined,
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
      laneletOffset: DEFAULT_LANELET_OFFSET_METERS,
    }),
  fail: (message) => set({ isSaving: false, error: message }),
  clearError: () => set({ error: undefined }),
  setLaneletOffset: (offset) =>
    set({
      laneletOffset: Math.min(Math.max(offset, MIN_LANELET_OFFSET_METERS), MAX_LANELET_OFFSET_METERS),
    }),
  adjustLaneletOffset: (delta) =>
    set((state) => {
      const next = Math.min(
        Math.max(state.laneletOffset + delta, MIN_LANELET_OFFSET_METERS),
        MAX_LANELET_OFFSET_METERS
      );
      if (next === state.laneletOffset) {
        return {};
      }
      return { laneletOffset: next };
    }),
}));
