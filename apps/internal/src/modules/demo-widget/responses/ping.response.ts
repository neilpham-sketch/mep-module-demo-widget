import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class PingResponse {
  @ApiProperty({ example: 'demo-widget' })
  @Expose()
  module!: string;

  @ApiProperty({ example: true })
  @Expose()
  ok!: boolean;
}
