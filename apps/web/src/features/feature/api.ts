import { apiClient } from '~/lib/apiClient';

import type {
  Feature,
  FeatureCollection,
  FeatureListParams,
  FeatureMutationPayload,
} from './types';

type ListSearchParams = Record<string, string>;

function buildListSearchParams(params?: FeatureListParams): ListSearchParams | undefined {
  if (!params) {
    return undefined;
  }

  const searchParams: ListSearchParams = {};

  if (params.limit !== undefined) {
    searchParams.limit = params.limit.toString();
  }

  if (params.offset !== undefined) {
    searchParams.offset = params.offset.toString();
  }

  if (params.bbox) {
    searchParams.bbox = params.bbox.join(',');
  }

  return searchParams;
}

export async function listFeatures(params?: FeatureListParams): Promise<FeatureCollection> {
  return apiClient.get<FeatureCollection>('/features', {
    searchParams: buildListSearchParams(params),
  });
}

export async function getFeature(featureId: string): Promise<Feature> {
  return apiClient.get<Feature>(`/features/${featureId}`);
}

export async function createFeature(payload: FeatureMutationPayload): Promise<Feature> {
  return apiClient.post<Feature>('/features', { json: payload });
}

export async function updateFeature(featureId: string, payload: FeatureMutationPayload): Promise<Feature> {
  return apiClient.put<Feature>(`/features/${featureId}`, { json: payload });
}
