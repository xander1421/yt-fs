// Remove build output directories so production packages never carry stale files
// (orphaned sourcemaps, dev-only docs). Cross-platform, no dependency.
import { rmSync } from 'node:fs';

for (const dir of process.argv.slice(2)) {
  rmSync(dir, { recursive: true, force: true });
}
