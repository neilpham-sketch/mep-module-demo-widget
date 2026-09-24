import type {
  UserSnapshotInsert,
  UserSnapshotModify,
  UserSnapshotSelect,
} from '@app/database/types';
import type { BaseRepositoryV2 } from '@prowerbdigital/common';

import type { DrizzleTx } from '../shared';

/**
 * Repository contract for the local user-snapshot read-model kept in sync by the
 * worker's CDC consumer (apps/worker/src/modules/services/user-snapshot). Base CRUD
 * comes from {@link BaseRepositoryV2}; `upsertByUserId` is the one CDC-specific method.
 */
export interface IUserSnapshotRepository
  extends BaseRepositoryV2<UserSnapshotSelect, UserSnapshotInsert, UserSnapshotModify, DrizzleTx> {
  /** Inserts or updates a snapshot keyed by external `userId` (CDC upsert). */
  upsertByUserId(data: UserSnapshotInsert, tx?: DrizzleTx): Promise<UserSnapshotSelect>;
}
