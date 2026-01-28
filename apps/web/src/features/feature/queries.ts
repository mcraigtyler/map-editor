import { queryOptions } from '@tanstack/react-query';

import { getFeature, listFeatures } from './api';
import type { Feature, FeatureCollection, FeatureListParams } from './types';
import type { ApiError } from '~/lib/apiClient';

const DEFAULT_STALE_TIME = 30_000;

export const featureKeys = {
  all: ['features'] as const,
  list: (params?: FeatureListParams) =>
    params ? (['features', 'list', params] as const) : (['features', 'list'] as const),
  detail: (featureId: string) => ['features', 'detail', featureId] as const,
  detailPlaceholder: () => ['features', 'detail', 'placeholder'] as const,
};

export const featureQueries = {
  list: (params?: FeatureListParams) =>
    queryOptions<FeatureCollection, ApiError>({
      queryKey: featureKeys.list(params),
      queryFn: () => listFeatures(params),
      staleTime: DEFAULT_STALE_TIME,
    }),
  detail: (featureId: string) =>
    queryOptions<Feature, ApiError>({
      queryKey: featureKeys.detail(featureId),
      queryFn: () => getFeature(featureId),
      staleTime: DEFAULT_STALE_TIME,
    }),
};
