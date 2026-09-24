import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiSuccessResponse, Serialize } from '@prowerbdigital/common';

import { PingQuery } from '../queries';
import { PingResponse } from '../responses';

/**
 * HTTP entry point for Demo Widget. Every route dispatches to the bus only — no
 * business logic lives here. No extra path segment is needed here — app.module.ts's
 * global prefix (demo-widget/api) already scopes every route in this app
 * under this module's Kong reservation.
 */
@Controller({ version: '1' })
@ApiTags('Demo Widget')
export class DemoWidgetController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('ping')
  @ApiOperation({ summary: 'Health/permission smoke check for Demo Widget' })
  @ApiSuccessResponse(PingResponse)
  @Serialize(PingResponse)
  async ping() {
    return this.queryBus.execute(new PingQuery());
  }
}
