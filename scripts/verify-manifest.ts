// Wired into the module's own CI pipeline (deploy-qa.yml/deploy-staging.yml, Task 9) via
// the "verify:manifest" package.json script (already added in Task 5). Fails the build
// if module.manifest.json's consumesEntities has drifted from service.manifest.ts's
// `consumes` array (docs/ADR-0010) — catches hand-edits after generation, not just at
// generation time. Both module.manifest.json and service.manifest.ts live at the
// generated repo's root, as siblings of this scripts/ folder.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

async function main() {
  const manifestJsonPath = join(__dirname, '..', 'module.manifest.json');
  const manifestJson = JSON.parse(readFileSync(manifestJsonPath, 'utf-8')) as {
    consumesEntities: string[];
  };

  const { manifest } = await import(join(__dirname, '..', 'service.manifest.ts'));
  const consumes = manifest.consumes as string[];

  const jsonSet = new Set(manifestJson.consumesEntities);
  const tsSet = new Set(consumes);
  const drifted =
    jsonSet.size !== tsSet.size || [...jsonSet].some((entity) => !tsSet.has(entity));

  if (drifted) {
    console.error(
      'module.manifest.json.consumesEntities and service.manifest.ts.consumes have drifted apart.',
    );
    console.error('module.manifest.json:', [...jsonSet]);
    console.error('service.manifest.ts:', [...tsSet]);
    process.exit(1);
  }

  console.log('manifest consistency check passed.');
}

main();
