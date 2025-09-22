import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createFeature, getFeature, updateFeature } from './api';
import { featureKeys, featureQueries } from './queries';
import type { FeatureListParams, FeatureMutationPayload } from './types';
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
