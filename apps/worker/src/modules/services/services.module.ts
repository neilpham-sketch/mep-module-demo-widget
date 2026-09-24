import { UserSnapshotDataModule } from '@app/layer-data';
import { Global, Module } from '@nestjs/common';

import { UserSnapshotService } from './user-snapshot';

const SERVICES = [UserSnapshotService];

/** Global module exposing shared worker services (currently: the user-snapshot CDC sync). */
@Global()
@Module({
  imports: [UserSnapshotDataModule],
  providers: [...SERVICES],
  exports: [...SERVICES],
})
export class ServicesModule {}
