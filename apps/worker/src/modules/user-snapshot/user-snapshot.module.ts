import { Module } from '@nestjs/common';

import { UserSnapshotRmqController } from './controllers';

/**
 * The `mep.cdc` exchange itself is asserted once in WorkerModule (see
 * ../../worker.module.ts) — this module only owns the consumer. Declaring the queue
 * here too, in addition to the @RabbitSubscribe decorator above, would redeclare the
 * same queue with mismatched arguments and crash the channel on startup.
 */
@Module({
  providers: [UserSnapshotRmqController],
})
export class UserSnapshotModule {}
