import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { PingQuery } from './ping.query';

@QueryHandler(PingQuery)
export class PingHandler implements IQueryHandler<PingQuery> {
  async execute(): Promise<{ module: string; ok: boolean }> {
    return { module: 'demo-widget', ok: true };
  }
}
