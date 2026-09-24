import type { ServiceManifest } from '@prowerbdigital/contract';

// Generated from module.manifest.json at scaffold time (docs/ADR-0010) — the two
// files must never be hand-edited independently. `consumes` entries are checked by
// @prowerbdigital/contract's SHARED_ENTITIES catalogue at compile time: an unknown
// entity key fails the build, not just code review.
export const manifest: ServiceManifest = {
  service: 'demo-widget',
  owns: [],
  consumes: [],
};
