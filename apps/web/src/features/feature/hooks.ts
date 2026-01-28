import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createFeature, deleteFeature, getFeature, updateFeature, updateFeatureTags } from './api';
import { featureKeys, featureQueries } from './queries';
import type { FeatureListParams, FeatureMutationPayload, UpdateFeatureTagsPayload } from './types';
import type { ApiError } from '~/lib/apiClient';
import type { Feature } from './types';

const DETAIL_STALE_TIME = 30_000;

export function useFeatureList(params?: FeatureListParams) {
  return useQuery(featureQueries.list(params));
}

export function useFeature(featureId: string | undefined) {
  return useQuery<Feature, ApiError>({
    queryKey: featureId ? featureKeys.detail(featureId) : featureKeys.detailPlaceholder(),
    queryFn: () => {
      if (!featureId) {
        throw new Error('featureId is required');
      }
      return getFeature(featureId);
    },
    enabled: Boolean(featureId),
    staleTime: DETAIL_STALE_TIME,
  });
}

export function useCreateFeatureMutation() {
  const queryClient = useQueryClient();

  return useMutation<Feature, ApiError, FeatureMutationPayload>({
    mutationFn: (payload) => createFeature(payload),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: featureKeys.list() });
      queryClient.invalidateQueries({ queryKey: featureKeys.detail(created.id) });
    },
  });
}

type UpdateFeatureVariables = {
  featureId: string;
  payload: FeatureMutationPayload;
};

export function useUpdateFeatureMutation() {
  const queryClient = useQueryClient();

  return useMutation<Feature, ApiError, UpdateFeatureVariables>({
    mutationFn: ({ featureId, payload }) => updateFeature(featureId, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: featureKeys.list() });
      queryClient.invalidateQueries({ queryKey: featureKeys.detail(updated.id) });
    },
  });
}

type UpdateFeatureTagsVariables = {
  featureId: string;
  payload: UpdateFeatureTagsPayload;
};

type UpdateFeatureTagsContext = {
  previousDetail?: Feature;
};

function mergeTagChanges(current: Record<string, string>, payload: UpdateFeatureTagsPayload): Record<string, string> {
  const next: Record<string, string> = { ...current };

  if (payload.delete) {
    for (const key of payload.delete) {
      delete next[key];
    }
  }

  if (payload.set) {
    for (const [key, value] of Object.entries(payload.set)) {
      next[key] = value;
    }
  }

  return next;
}

function applyOptimisticTagUpdate(feature: Feature, payload: UpdateFeatureTagsPayload): Feature {
  const mergedTags = mergeTagChanges(feature.properties.tags ?? {}, payload);
  return {
    ...feature,
    properties: {
      ...feature.properties,
      tags: mergedTags,
      updatedAt: new Date().toISOString(),
    },
  };
}

export function useUpdateFeatureTagsMutation() {
  const queryClient = useQueryClient();

  return useMutation<Feature, ApiError, UpdateFeatureTagsVariables, UpdateFeatureTagsContext>({
    mutationFn: ({ featureId, payload }) => updateFeatureTags(featureId, payload),
    onMutate: async ({ featureId, payload }) => {
      await queryClient.cancelQueries({ queryKey: featureKeys.detail(featureId) });

      const detailKey = featureKeys.detail(featureId);
      const previousDetail = queryClient.getQueryData<Feature>(detailKey);

      if (previousDetail) {
        const optimistic = applyOptimisticTagUpdate(previousDetail, payload);
        queryClient.setQueryData(detailKey, optimistic);
      }

      return { previousDetail };
    },
    onError: (_error, variables, context) => {
      if (context?.previousDetail) {
        queryClient.setQueryData(featureKeys.detail(variables.featureId), context.previousDetail);
      }
    },
    onSettled: (_result, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: featureKeys.detail(variables.featureId) });
      queryClient.invalidateQueries({ queryKey: featureKeys.all });
    },
  });
}

export function useDeleteFeatureMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (featureId) => deleteFeature(featureId),
    onSuccess: (_result, featureId) => {
      queryClient.invalidateQueries({ queryKey: featureKeys.list() });
      queryClient.removeQueries({ queryKey: featureKeys.detail(featureId), exact: true });
    },
  });
}
