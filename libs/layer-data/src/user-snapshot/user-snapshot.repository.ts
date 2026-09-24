import * as schema from '@app/database/schemas';
import type {
  UserSnapshotInsert,
  UserSnapshotModify,
  UserSnapshotSelect,
} from '@app/database/types';
import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_PROVIDER } from '@prowerbdigital/common';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import type { DrizzleTx } from '../shared';
import type { IUserSnapshotRepository } from './user-snapshot.interface';

/** Drizzle implementation of {@link IUserSnapshotRepository}. */
@Injectable()
export class UserSnapshotRepository implements IUserSnapshotRepository {
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private readonly drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async upsertByUserId(data: UserSnapshotInsert, tx?: DrizzleTx): Promise<UserSnapshotSelect> {
    const db = tx ?? this.drizzle;
    const [row] = await db
      .insert(schema.demo_widget_user_snapshots)
      .values(data)
      .onConflictDoUpdate({
        target: schema.demo_widget_user_snapshots.userId,
        set: {
          email: data.email,
          name: data.name,
          roleKey: data.roleKey,
          updatedAt: new Date(),
        },
      })
      .returning();
    return row;
  }

  async findById(
    id: string,
    _options?: { select?: (keyof UserSnapshotSelect)[] },
    _tx?: DrizzleTx,
  ): Promise<UserSnapshotSelect | null> {
    const [row] = await this.drizzle
      .select()
      .from(schema.demo_widget_user_snapshots)
      .where(eq(schema.demo_widget_user_snapshots.userId, id))
      .limit(1);
    return row ?? null;
  }

  create(_entity: UserSnapshotInsert, _tx?: DrizzleTx): Promise<UserSnapshotSelect | null> {
    throw new Error('Method not implemented.');
  }
  createMany(_entity: UserSnapshotInsert[], _tx?: DrizzleTx): Promise<UserSnapshotSelect[] | null> {
    throw new Error('Method not implemented.');
  }
  findOne(
    _options: { where?: UserSnapshotModify; select?: (keyof UserSnapshotSelect)[] },
    _tx?: DrizzleTx,
  ): Promise<UserSnapshotSelect | null> {
    throw new Error('Method not implemented.');
  }
  findMany(
    _options?: { where?: UserSnapshotModify; select?: (keyof UserSnapshotSelect)[] },
    _tx?: DrizzleTx,
  ): Promise<UserSnapshotSelect[] | null> {
    throw new Error('Method not implemented.');
  }
  update(
    _data: Partial<UserSnapshotInsert>,
    _where: UserSnapshotModify,
    _tx?: DrizzleTx,
  ): Promise<UserSnapshotSelect | null> {
    throw new Error('Method not implemented.');
  }
  updateById(
    _id: string,
    _data: Partial<UserSnapshotInsert>,
    _tx?: DrizzleTx,
  ): Promise<UserSnapshotSelect | null> {
    throw new Error('Method not implemented.');
  }
  delete(_where: UserSnapshotModify, _tx?: DrizzleTx): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  deleteById(_id: string, _tx?: DrizzleTx): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
}
