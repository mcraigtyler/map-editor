import { Get, Route, Tags } from 'tsoa';
import { StatusService, HealthResponse, VersionResponse, MetricsResponse } from './status.service';
import { config } from '../../config';

@Route('')
@Tags('status')
export class StatusController {
  /** Health check endpoint */
  @Get('health')
  public getHealth(): HealthResponse {
    return StatusService.getHealth();
  }

  /** Version info */
  @Get('version')
  public getVersion(): VersionResponse {
    return StatusService.getVersion(config.version);
  }

  /** Basic process metrics */
  @Get('metrics')
  public getMetrics(): MetricsResponse {
    return StatusService.getMetrics();
  }
}
