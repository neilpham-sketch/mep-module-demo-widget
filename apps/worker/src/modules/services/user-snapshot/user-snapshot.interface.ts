export type CdcOp = 'r' | 'c' | 'u' | 'd';

/** Shape of a user row as delivered by the user-core CDC stream. */
export interface UserCdcRow {
  id: string;
  email: string;
  name: string;
  roleKey: string;
}

/** Debezium-style CDC envelope for the user-core `User` table. */
export interface UserCdcEvent {
  op: CdcOp;
  before: { id: string } | null;
  after: UserCdcRow | null;
}
