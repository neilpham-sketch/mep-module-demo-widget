import { MessageHandlerErrorBehavior, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';

import {
  CDC_DLX,
  CDC_EXCHANGE,
  CDC_USER_DLQ_ROUTING_KEY,
  CDC_USER_QUEUE,
  CDC_USER_ROUTING_KEY,
} from '../../../../common';
import { type UserCdcEvent, UserSnapshotService } from '../../../services/user-snapshot';

/**
 * RMQ entry point for mep-core's Debezium-style user CDC stream — identical topology to
 * mep-etr/mep-cam (docs/ADR-0003): own queue, own DLX routing key, writes to this
 * module's own demo_widget_user_snapshots table, never a bulk gRPC lookup against
 * mep-core. Dispatches to the sync service only; no business logic lives here.
 */
@Injectable()
export class UserSnapshotRmqController {
  constructor(private readonly userSnapshotSvc: UserSnapshotService) {}

  @RabbitSubscribe({
    exchange: CDC_EXCHANGE,
    routingKey: CDC_USER_ROUTING_KEY,
    queue: CDC_USER_QUEUE,
    queueOptions: {
      durable: true,
      arguments: { 'x-dead-letter-exchange': CDC_DLX },
      deadLetterRoutingKey: CDC_USER_DLQ_ROUTING_KEY,
    },
    allowNonJsonMessages: true,
    errorBehavior: MessageHandlerErrorBehavior.NACK,
  })
  handler(message: UserCdcEvent | string): Promise<void> {
    return this.userSnapshotSvc.handler(message);
  }
}
