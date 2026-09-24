import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

/**
 * Public, unauthenticated liveness/readiness probe for this app — same convention as
 * apps/internal/src/modules/health, kept per-app since internal and external deploy and
 * scale independently and each needs its own probe.
 */
@Controller({ version: '1', path: 'health' })
@ApiTags('Health')
export class HealthController {
  constructor(private readonly health: HealthCheckService) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Liveness/readiness check' })
  check() {
    return this.health.check([]);
  }
}
