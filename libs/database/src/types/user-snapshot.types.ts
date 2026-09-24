import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

import type { demo_widget_user_snapshots } from '../schemas/user-snapshot.table';

export type UserSnapshotSelect = InferSelectModel<typeof demo_widget_user_snapshots>;
export type UserSnapshotInsert = InferInsertModel<typeof demo_widget_user_snapshots>;
export type UserSnapshotModify = Partial<Omit<UserSnapshotInsert, 'userId'>> & { userId: string };
