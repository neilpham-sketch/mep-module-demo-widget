import { Module } from '@nestjs/common';

import {
  USER_SNAPSHOT_REPOSITORY,
  UserSnapshotRepositoryProvider,
} from './user-snapshot.provider';
import { UserSnapshotRepository } from './user-snapshot.repository';

/** Data module exposing the user-snapshot repository. */
@Module({
  providers: [UserSnapshotRepository, UserSnapshotRepositoryProvider],
  exports: [USER_SNAPSHOT_REPOSITORY],
})
export class UserSnapshotDataModule {}
