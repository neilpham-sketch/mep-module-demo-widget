import type { Provider } from '@nestjs/common';

import { UserSnapshotRepository } from './user-snapshot.repository';

/** Injection token for the user-snapshot repository. */
export const USER_SNAPSHOT_REPOSITORY = Symbol('USER_SNAPSHOT_REPOSITORY');

/** NestJS provider that binds the token to the UserSnapshotRepository implementation. */
export const UserSnapshotRepositoryProvider: Provider = {
  provide: USER_SNAPSHOT_REPOSITORY,
  useExisting: UserSnapshotRepository,
};
