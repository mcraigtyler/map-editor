export interface HealthResponse {
  status: 'ok';
}

export interface VersionResponse {
  version: string;
}

export interface MetricsResponse {
  uptime: number;
  memory: NodeJS.MemoryUsage;
}

export class StatusService {
  public static getHealth(): HealthResponse {
    return { status: 'ok' };
  }

  public static getVersion(version: string): VersionResponse {
    return { version };
  }

  public static getMetrics(): MetricsResponse {
    return { uptime: process.uptime(), memory: process.memoryUsage() };
  }
}
