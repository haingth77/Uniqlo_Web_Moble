import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
/** Repo root = parent of ai-orchestrator/. All file access is confined to this tree. */
export const REPO_ROOT = resolve(HERE, '..');
