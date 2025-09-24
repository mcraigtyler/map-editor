import {
  Body,
  Controller,
  Delete,
  Example,
  Get,
  Patch,
  Path,
  Post,
  Put,
  Query,
  Response,
  Route,
  SuccessResponse,
  Tags,
} from 'tsoa';
import { parseBBox } from '../../utils/bbox';
import { FeatureService } from './feature.service';
import {
  CreateFeatureRequest,
  FeatureCollectionResponse,
  FeatureListQuery,
  FeatureResponse,
  UpdateFeatureRequest,
  UpdateFeatureTagsRequest,
} from './feature.resource';
import { DomainError, NotFoundError, ValidationError } from '../../utils/errors';

@Route('features')
@Tags('features')
@Response<DomainError>(500, 'Server error')
@Response<ValidationError>(422, 'Validation error')
@Response<NotFoundError>(404, 'Feature not found')
export class FeatureController extends Controller {
  private readonly service = new FeatureService();

  /** List features optionally filtered by a bounding box. */
  @Get()
  @Example<FeatureCollectionResponse>({
    type: 'FeatureCollection',
    bbox: [-0.1, -0.1, 0.1, 0.1],
    features: [
      {
        type: 'Feature',
        id: '8d91a8c9-9a73-4f25-bfe1-2eac898d0c04',
        geometry: {
          type: 'Point',
          coordinates: [0, 0],
        },
        properties: {
          kind: 'point',
          tags: { name: 'Null Island' },
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      },
    ],
    pagination: {
      total: 1,
      limit: 50,
      offset: 0,
    },
  })
  public async listFeatures(
    @Query() bbox?: string,
    @Query() limit?: number,
    @Query() offset?: number
  ): Promise<FeatureCollectionResponse> {
    const parsedBBox = bbox ? parseBBox(bbox) : undefined;
    if (parsedBBox) {
      console.log('Requested bbox:', parsedBBox);
    }
    const query: FeatureListQuery = {
      bbox: parsedBBox,
      limit,
      offset,
    };
    return this.service.listFeatures(query);
  }

  /** Retrieve a single feature by id. */
  @Get('{featureId}')
  @Example<FeatureResponse>({
    type: 'Feature',
    id: '8d91a8c9-9a73-4f25-bfe1-2eac898d0c04',
    geometry: {
      type: 'Point',
      coordinates: [0, 0],
    },
    properties: {
      kind: 'point',
      tags: { name: 'Null Island' },
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  })
  public async getFeature(@Path() featureId: string): Promise<FeatureResponse> {
    return this.service.getFeature(featureId);
  }

  /** Create a new feature. */
  @Post()
  @SuccessResponse(201, 'Created')
  @Example<FeatureResponse>({
    type: 'Feature',
    id: '11111111-1111-1111-1111-111111111111',
    geometry: {
      type: 'LineString',
      coordinates: [
        [-74.00597, 40.71427],
        [-73.98513, 40.7589],
      ],
    },
    properties: {
      kind: 'line',
      tags: { name: 'Broadway' },
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  })
  public async createFeature(@Body() body: CreateFeatureRequest): Promise<FeatureResponse> {
    this.setStatus(201);
    return this.service.createFeature(body);
  }

  /** Replace an existing feature. */
  @Put('{featureId}')
  @Example<FeatureResponse>({
    type: 'Feature',
    id: '22222222-2222-2222-2222-222222222222',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [-122.431297, 37.773972],
          [-122.431297, 37.783972],
          [-122.421297, 37.783972],
          [-122.421297, 37.773972],
          [-122.431297, 37.773972],
        ],
      ],
    },
    properties: {
      kind: 'polygon',
      tags: { name: 'Sample Block' },
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  })
  public async updateFeature(
    @Path() featureId: string,
    @Body() body: UpdateFeatureRequest
  ): Promise<FeatureResponse> {
    return this.service.updateFeature(featureId, body);
  }

  /** Apply partial tag updates to a feature. */
  @Patch('{featureId}/tags')
  @Example<FeatureResponse>({
    type: 'Feature',
    id: '33333333-3333-3333-3333-333333333333',
    geometry: {
      type: 'Point',
      coordinates: [0, 0],
    },
    properties: {
      kind: 'point',
      tags: { name: 'Null Island', description: 'Updated description' },
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-02T12:00:00.000Z',
    },
  })
  public async updateFeatureTags(
    @Path() featureId: string,
    @Body() body: UpdateFeatureTagsRequest
  ): Promise<FeatureResponse> {
    return this.service.updateFeatureTags(featureId, body);
  }

  /** Delete a feature. */
  @Delete('{featureId}')
  @SuccessResponse(204, 'No Content')
  public async deleteFeature(@Path() featureId: string): Promise<void> {
    await this.service.deleteFeature(featureId);
    this.setStatus(204);
  }
}
