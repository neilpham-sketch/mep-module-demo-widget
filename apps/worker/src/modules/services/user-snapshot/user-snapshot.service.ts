import { type IUserSnapshotRepository, USER_SNAPSHOT_REPOSITORY } from '@app/layer-data';
import { Inject, Injectable } from '@nestjs/common';
import { LoggerService } from '@prowerbdigital/common';

import type { UserCdcEvent, UserCdcRow } from './user-snapshot.interface';

/**
 * Consumes mep-core's user CDC events and keeps this module's own
 * demo_widget_user_snapshots read-model in sync — mirrors mep-etr's UserSnapshotService.
 */
@Injectable()
export class UserSnapshotService {
  constructor(
    private readonly loggerSvc: LoggerService,
    @Inject(USER_SNAPSHOT_REPOSITORY)
    private readonly userSnapshotRepo: IUserSnapshotRepository,
  ) {}

  async handler(message: UserCdcEvent | string): Promise<void> {
    if (typeof message === 'string') {
      this.loggerSvc.warn(`Skipping non-JSON CDC message: ${message}`, UserSnapshotService.name);
      return;
    }

    if (message.op === 'd' || !message.after) return;
    await this.upsert(message.after);
  }

  private async upsert(user: UserCdcRow): Promise<void> {
    await this.userSnapshotRepo.upsertByUserId({
      userId: user.id,
      email: user.email,
      name: user.name,
      roleKey: user.roleKey,
    });
  }
}
