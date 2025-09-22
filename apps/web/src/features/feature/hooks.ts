import { useQuery } from '@tanstack/react-query';

import { getFeature } from './api';
import { featureKeys, featureQueries } from './queries';
import type { FeatureListParams } from './types';
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
