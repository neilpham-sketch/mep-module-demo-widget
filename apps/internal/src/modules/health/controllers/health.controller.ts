import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

/**
 * Public, unauthenticated liveness/readiness probe — matches the Kong public-route
 * allowlist in kong/route.yaml (Task 9) and every other MEP service's /health
 * convention.
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
